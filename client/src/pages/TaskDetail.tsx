import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/TopBar";
import { STATUS_LABELS, STATUS_COLORS, formatDate } from "@/lib/utils";
import { ArrowLeft, Clock, User, Building2, FileText, History } from "lucide-react";
import { useState } from "react";
import type { TaskStatus } from "@/types";

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");

  const { data: task, isLoading } = useQuery({
    queryKey: ["task", id],
    queryFn: () => tasksApi.get(parseInt(id!)),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus: string) => tasksApi.updateStatus(parseInt(id!), newStatus, comment),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", id] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      setComment("");
    },
  });

  if (isLoading) return <div className="p-6"><TopBar title="Loading..." /></div>;
  if (!task) return <div className="p-6"><TopBar title="Task Not Found" /></div>;

  const STATUS_FLOW: Record<string, TaskStatus[]> = {
    pending: ["ready_to_file"],
    ready_to_file: ["pending", "submitted"],
    submitted: ["ready_to_file", "completed"],
    completed: ["submitted", "done"],
    done: [],
  };

  const nextStatuses = STATUS_FLOW[task.status] || [];

  return (
    <div className="h-full overflow-y-auto">
      <TopBar title="Task Details" />
      <div className="p-4 sm:p-6">
        <Link to="/tasks" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft size={16} /> Back to Tasks
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{task.formCode} {task.formName}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">Filing Period: {task.filingPeriod}</p>
                  </div>
                  <Badge className={STATUS_COLORS[task.status]}>{STATUS_LABELS[task.status]}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Client</p>
                      <p className="text-sm font-medium">{task.clientName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Assigned To</p>
                      <p className="text-sm font-medium">{task.assigneeName || "Unassigned"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Form Type</p>
                      <p className="text-sm font-medium capitalize">{task.formType}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Deadline</p>
                      <p className="text-sm font-medium">{formatDate(task.deadline)}</p>
                    </div>
                  </div>
                </div>
                {task.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm">{task.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Actions */}
            {nextStatuses.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Update Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {nextStatuses.map((status) => {
                      const STATUS_ORDER = ["pending", "ready_to_file", "submitted", "completed", "done"];
                      const currentIdx = STATUS_ORDER.indexOf(task.status);
                      const nextIdx = STATUS_ORDER.indexOf(status);
                      const isForward = nextIdx > currentIdx;
                      return (
                        <Button
                          key={status}
                          variant={isForward ? "default" : "secondary"}
                          onClick={() => statusMutation.mutate(status)}
                          disabled={statusMutation.isPending}
                        >
                          {isForward ? "→" : "←"} {STATUS_LABELS[status]}
                        </Button>
                      );
                    })}
                  </div>
                  <input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment (optional)..."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* History */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <History size={16} /> Activity History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {task.history?.length === 0 && (
                    <p className="text-sm text-muted-foreground">No activity yet</p>
                  )}
                  {task.history?.map((entry) => (
                    <div key={entry.id} className="border-l-2 border-primary pl-3 py-1">
                      <div className="flex items-center gap-2 text-xs">
                        <Badge className={STATUS_COLORS[entry.toStatus]}>
                          {entry.fromStatus ? `${STATUS_LABELS[entry.fromStatus]} → ` : ""}{STATUS_LABELS[entry.toStatus]}
                        </Badge>
                      </div>
                      {entry.comment && <p className="text-xs mt-1">{entry.comment}</p>}
                      <p className="text-xs text-muted-foreground mt-1">
                        {entry.changedByName} - {formatDate(entry.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

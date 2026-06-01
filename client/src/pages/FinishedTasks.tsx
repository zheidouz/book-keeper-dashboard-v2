import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/layout/TopBar";
import { STATUS_LABELS, STATUS_COLORS, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { CheckCircle2, Building2, Calendar, User, ChevronLeft, ChevronRight, Undo2, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useMemo } from "react";

const PAGE_SIZE = 20;

export default function FinishedTasks() {
  const { user } = useAuthStore();
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", "done"],
    queryFn: () => tasksApi.list({ status: "done" }),
  });

  const revertMutation = useMutation({
    mutationFn: (id: number) => tasksApi.updateStatus(id, "pending"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks-overview"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", "done"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => tasksApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks-overview"] });
      queryClient.invalidateQueries({ queryKey: ["tasks", "done"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const totalPages = Math.max(1, Math.ceil(tasks.length / PAGE_SIZE));
  const pageTasks = useMemo(() => tasks.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), [tasks, page]);

  // Reset to page 0 when data changes
  if (page >= totalPages && totalPages > 0) setPage(0);

  if (user?.role === "encoder" || user?.role === "bookkeeper") {
    return (
      <div>
        <TopBar title="Finished Tasks" />
        <div className="p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Only admins and managers can view finished tasks.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <TopBar title="Finished Tasks" />
      <div className="p-4 sm:p-6 space-y-4">
        {/* Summary */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-50">
            <CheckCircle2 size={24} className="text-green-600" />
          </div>
          <div>
            <p className="text-2xl font-bold">{tasks.length}</p>
            <p className="text-sm text-muted-foreground">Total finished tasks</p>
          </div>
        </div>

        {/* Task List */}
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Loading...</span>
            </div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="stat-card p-12 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
              <CheckCircle2 size={32} className="text-slate-300" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No finished tasks yet</p>
            <p className="text-xs text-muted-foreground/50 mt-1">Tasks marked as "Done" will appear here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {pageTasks.map((task) => (
              <div
                key={task.id}
                className="card-hover flex items-center justify-between p-4 rounded-xl border bg-white group"
              >
                <Link to={`/tasks/${task.id}`} className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {task.formCode} {task.formName}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Building2 size={12} className="shrink-0" /> {task.clientName}
                      </span>
                      {task.assigneeName && (
                        <span className="flex items-center gap-1.5">
                          <User size={12} className="shrink-0" /> {task.assigneeName}
                        </span>
                      )}
                      {task.filingPeriod && (
                        <span className="flex items-center gap-1.5">
                          <Calendar size={12} className="shrink-0" /> Period: {task.filingPeriod}
                        </span>
                      )}
                      {task.submittedByName && (
                        <span className="flex items-center gap-1.5 text-green-700">
                          <User size={12} className="shrink-0" /> Submitted by {task.submittedByName}
                        </span>
                      )}
                      {task.submittedAt && (
                        <span className="flex items-center gap-1.5">
                          <Calendar size={12} className="shrink-0" /> {formatDate(task.submittedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <button
                    onClick={(e) => { e.preventDefault(); revertMutation.mutate(task.id); }}
                    disabled={revertMutation.isPending}
                    className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 transition-colors disabled:opacity-40"
                    title="Revert to Pending"
                  >
                    <Undo2 size={16} />
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); if (confirm("Delete this task permanently?")) deleteMutation.mutate(task.id); }}
                    disabled={deleteMutation.isPending}
                    className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40"
                    title="Delete task"
                  >
                    <Trash2 size={16} />
                  </button>
                  <Badge className={STATUS_COLORS[task.status] + " shrink-0"}>{STATUS_LABELS[task.status]}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {tasks.length > PAGE_SIZE && (
          <div className="flex items-center justify-between pt-2 pb-1">
            <p className="text-xs text-muted-foreground">
              Page {page + 1} of {totalPages} ({tasks.length} total)
            </p>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft size={14} />
              </Button>
              {Array.from({ length: totalPages }, (_, i) => (
                <Button
                  key={i}
                  variant={i === page ? "default" : "outline"}
                  size="sm"
                  className="min-w-[32px] h-8"
                  onClick={() => setPage(i)}
                >
                  {i + 1}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

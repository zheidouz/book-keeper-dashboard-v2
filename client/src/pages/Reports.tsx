import { useQuery } from "@tanstack/react-query";
import { tasksApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TopBar } from "@/components/layout/TopBar";
import { STATUS_LABELS, STATUS_COLORS, formatDate } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { CheckCircle2, Building2, Calendar, User } from "lucide-react";
import { Link } from "react-router-dom";

export default function FinishedTasks() {
  const { user } = useAuthStore();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["tasks", "done"],
    queryFn: () => tasksApi.list({ status: "done" }),
  });

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
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : tasks.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle2 size={48} className="mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">No finished tasks yet.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Tasks marked as "Done" will appear here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <Link
                key={task.id}
                to={`/tasks/${task.id}`}
                className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <CheckCircle2 size={18} className="text-green-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {task.formCode} {task.formName}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Building2 size={12} /> {task.clientName}
                      </span>
                      {task.assigneeName && (
                        <span className="flex items-center gap-1">
                          <User size={12} /> {task.assigneeName}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={12} /> Filed: {formatDate(task.deadline)}
                      </span>
                    </div>
                  </div>
                </div>
                <Badge className={STATUS_COLORS[task.status]}>{STATUS_LABELS[task.status]}</Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

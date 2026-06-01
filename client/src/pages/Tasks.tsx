import { useState, useMemo, memo, useTransition, lazy, Suspense } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { tasksApi, clientsApi, usersApi, formsApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TopBar } from "@/components/layout/TopBar";
import { STATUS_LABELS, formatDate, isOverdue, cn } from "@/lib/utils";
import { useAuthStore, useTaskFilterStore } from "@/stores/auth-store";
import { Plus, Calendar, User, Building2 } from "lucide-react";
import { Link } from "react-router-dom";
import type { Task, TaskStatus } from "@/types";

// DropResult shape (type-only, no runtime import from @hello-pangea/dnd)
interface DropResult {
  draggableId: string;
  destination: { droppableId: string; index: number } | null;
  source: { droppableId: string; index: number };
}

// Lazy-load Kanban board — defers @hello-pangea/dnd (~102KB) until first render
const KanbanBoard = lazy(() => import("@/components/kanban/KanbanBoard"));

const STATUS_ORDER: TaskStatus[] = ["pending", "ready_to_file", "submitted", "completed"];

export default function Tasks() {
  const { user } = useAuthStore();
  const { clientFilter, searchQuery, setClientFilter, setSearchQuery } = useTaskFilterStore();
  const queryClient = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [newTask, setNewTask] = useState({ clientId: 0, formType: "bir", formId: 0, assignedTo: 0 });

  const { data: overview } = useQuery({ queryKey: ["tasks-overview"], queryFn: tasksApi.overview });
  const tasks = overview?.tasks ?? [];
  const clients = overview?.clients ?? [];
  const bookkeepers = overview?.bookkeepers ?? [];
  const { data: birForms = [] } = useQuery({ queryKey: ["bir-forms"], queryFn: formsApi.listBir, staleTime: 10 * 60 * 1000 });
  const { data: customForms = [] } = useQuery({ queryKey: ["custom-forms"], queryFn: formsApi.listCustom, staleTime: 10 * 60 * 1000 });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => tasksApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      // Don't invalidate dashboard — stays fresh via staleTime
    },
    onError: (err: Error) => {
      alert(err.message);
    },
  });

  const createMutation = useMutation({
    mutationFn: () => tasksApi.create({
      clientId: newTask.clientId,
      formType: newTask.formType as "bir" | "custom",
      formId: newTask.formId,
      assignedTo: newTask.assignedTo || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setShowCreate(false);
      setNewTask({ clientId: 0, formType: "bir", formId: 0, assignedTo: 0 });
    },
    onError: (err: Error) => {
      alert(err.message);
    },
  });

  const [, startTransition] = useTransition();

  // Mirror server-side STATUS_FLOW to prevent invalid drops from firing API calls
  const STATUS_FLOW: Record<string, string[]> = {
    pending: ["ready_to_file"],
    ready_to_file: ["pending", "submitted"],
    submitted: ["ready_to_file", "completed"],
    completed: ["submitted", "done"],
    done: ["pending"],
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    startTransition(() => {
      const taskId = parseInt(result.draggableId);
      const newStatus = result.destination.droppableId as TaskStatus;
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      const allowed = STATUS_FLOW[task.status] || [];
      if (!allowed.includes(newStatus)) {
        alert(`Cannot move task from "${STATUS_LABELS[task.status] || task.status}" directly to "${STATUS_LABELS[newStatus] || newStatus}".\nValid moves: ${allowed.map((s) => STATUS_LABELS[s] || s).join(", ")}`);
        return;
      }
      statusMutation.mutate({ id: taskId, status: newStatus });
    });
  };

  // Memoize filtered tasks to avoid re-filtering on every render
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.status === "done") return false;
      if (clientFilter !== "all" && t.clientId !== clientFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          t.clientName?.toLowerCase().includes(q) ||
          t.formName.toLowerCase().includes(q) ||
          t.formCode?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tasks, clientFilter, searchQuery]);

  // Memoize kanban columns to avoid rebuilding on every render
  const kanbanColumns = useMemo(() => {
    return STATUS_ORDER.map((status) => ({
      status,
      label: STATUS_LABELS[status],
      tasks: filteredTasks.filter((t) => t.status === status),
    }));
  }, [filteredTasks]);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <TopBar title="Tasks" onSearch={setSearchQuery} searchPlaceholder="Search tasks..." />
      <div className="p-4 sm:p-6 space-y-4 flex flex-col overflow-hidden flex-1">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <Select value={clientFilter} onChange={(e) => setClientFilter(e.target.value === "all" ? "all" : parseInt(e.target.value))} className="w-44">
            <option value="all">All Clients</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Button onClick={() => setShowCreate(!showCreate)} size="sm">
            <Plus size={16} className="mr-1" /> New Task
          </Button>
        </div>

        {/* Create Task Form */}
        {showCreate && (
          <Card className="border-primary/20">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-medium">Create New Task</h3>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                <Select value={newTask.clientId} onChange={(e) => setNewTask({ ...newTask, clientId: parseInt(e.target.value) })}>
                  <option value={0}>Select Client...</option>
                  {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
                <Select
                  value={newTask.formType}
                  onChange={(e) => setNewTask({ ...newTask, formType: e.target.value, formId: 0 })}
                >
                  <option value="bir">BIR Form</option>
                  <option value="custom">Custom Form</option>
                </Select>
                <Select value={newTask.formId} onChange={(e) => setNewTask({ ...newTask, formId: parseInt(e.target.value) })}>
                  <option value={0}>Select Form...</option>
                  {newTask.formType === "bir"
                    ? birForms.map((f) => <option key={f.id} value={f.id}>{f.formCode} - {f.name}</option>)
                    : customForms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)
                  }
                </Select>
                <Select value={newTask.assignedTo} onChange={(e) => setNewTask({ ...newTask, assignedTo: parseInt(e.target.value) })}>
                  <option value={0}>Assign to...</option>
                  {bookkeepers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </Select>
                <Button onClick={() => createMutation.mutate()} disabled={!newTask.clientId || !newTask.formId}>
                  Create Task
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Kanban Board — lazy-loaded (@hello-pangea/dnd deferred) */}
        <Suspense fallback={
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 overflow-hidden flex-1 pb-2">
            {kanbanColumns.map((col) => (
              <div key={col.status} className="kanban-column p-0 min-w-[260px] flex flex-col overflow-hidden">
                <div className="kanban-column-header shrink-0">
                  <div className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider text-white ${
                    col.status === 'pending' ? 'bg-amber-500' :
                    col.status === 'ready_to_file' ? 'bg-sky-500' :
                    col.status === 'submitted' ? 'bg-violet-500' :
                    'bg-emerald-500'
                  }`}>
                    {col.label}
                  </div>
                  <span className="ml-auto text-xs font-bold">{col.tasks.length}</span>
                </div>
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              </div>
            ))}
          </div>
        }>
          <KanbanBoard
            columns={kanbanColumns}
            userRole={user?.role}
            onDragEnd={handleDragEnd}
            onMarkDone={(id) => statusMutation.mutate({ id, status: "done" })}
          />
        </Suspense>
      </div>
    </div>
  );
}



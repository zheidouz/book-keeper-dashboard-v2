import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientsApi, tasksApi, usersApi, formsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { TopBar } from "@/components/layout/TopBar";
import { STATUS_LABELS, STATUS_COLORS, formatDate, isOverdue } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { ArrowLeft, Building2, Mail, Phone, FileText, User, Calendar, Plus, X, UserPlus, Pencil, Trash2, Check } from "lucide-react";
import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState(0);
  const [newTaskFormType, setNewTaskFormType] = useState<"bir" | "custom">("bir");
  const [assignUserId, setAssignUserId] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", contactPerson: "", email: "", phone: "", address: "", notes: "" });

  const { data: client, isLoading } = useQuery({
    queryKey: ["client", id],
    queryFn: () => clientsApi.get(parseInt(id!)),
    enabled: !!id,
  });

  const { data: birForms = [] } = useQuery({ queryKey: ["bir-forms"], queryFn: formsApi.listBir, staleTime: 10 * 60 * 1000 });
  const { data: customForms = [] } = useQuery({ queryKey: ["custom-forms"], queryFn: formsApi.listCustom, staleTime: 10 * 60 * 1000 });
  const { data: bookkeepers = [] } = useQuery({ queryKey: ["bookkeepers"], queryFn: usersApi.listBookkeepers, staleTime: 10 * 60 * 1000 });

  const addTaskMutation = useMutation({
    mutationFn: () => tasksApi.create({ clientId: parseInt(id!), formType: newTaskFormType, formId: newTaskForm }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", id] });
      queryClient.invalidateQueries({ queryKey: ["tasks-overview"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["custom-forms"] });
      setShowAddTask(false);
      setNewTaskForm(0);
    },
  });

  const assignMutation = useMutation({
    mutationFn: (userId: number) => clientsApi.assign(parseInt(id!), userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", id] });
      setAssignUserId(0);
    },
  });

  const unassignMutation = useMutation({
    mutationFn: (userId: number) => clientsApi.unassign(parseInt(id!), userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["client", id] }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: typeof editForm) => clientsApi.update(parseInt(id!), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", id] });
      setEditing(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => clientsApi.delete(parseInt(id!)),
    onSuccess: () => {
      navigate("/clients");
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (taskId: number) => tasksApi.delete(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", id] });
      queryClient.invalidateQueries({ queryKey: ["tasks-overview"] });
    },
  });

  const canEdit = user?.role === "admin" || user?.role === "manager" || user?.role === "bookkeeper";
  const canDeleteClient = user?.role === "admin" || user?.role === "manager";
  const canDeleteTask = user?.role === "admin" || user?.role === "manager" || user?.role === "bookkeeper";

  if (isLoading) return <div className="p-6"><TopBar title="Loading..." /></div>;
  if (!client) return <div className="p-6"><TopBar title="Client Not Found" /></div>;

  return (
    <div className="h-full overflow-y-auto">
      <TopBar title={client.name} />
      <div className="p-4 sm:p-6 space-y-6">
        <Link to="/clients" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} /> Back to Clients
        </Link>

        {/* Client Info */}
        <div className="stat-card overflow-hidden">
          {editing ? (
            <div className="p-4 sm:p-6 space-y-3">
              <h3 className="text-sm font-semibold">Edit Client</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="Company Name *" />
                <Input value={editForm.contactPerson} onChange={(e) => setEditForm({ ...editForm, contactPerson: e.target.value })} placeholder="Contact Person" />
                <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="Email" />
                <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="Phone" />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => updateMutation.mutate(editForm)} disabled={!editForm.name}>
                  <Check size={14} className="mr-1" /> Save Changes
                </Button>
                <Button variant="ghost" onClick={() => setEditing(false)}>
                  <X size={14} className="mr-1" /> Cancel
                </Button>
                {canDeleteClient && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="ml-auto"
                    onClick={() => { if (confirm(`Delete "${client.name}" and all its tasks?`)) deleteMutation.mutate(); }}
                  >
                    <Trash2 size={14} className="mr-1" /> Delete Client
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="p-3 rounded-xl bg-primary/10 shrink-0">
                    <Building2 size={32} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-2xl font-bold truncate">{client.name}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                      {client.contactPerson && (
                        <div className="flex items-center gap-2 text-sm">
                          <User size={14} className="text-muted-foreground shrink-0" /> <span className="truncate">{client.contactPerson}</span>
                        </div>
                      )}
                      {client.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail size={14} className="text-muted-foreground shrink-0" /> <span className="truncate">{client.email}</span>
                        </div>
                      )}
                      {client.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone size={14} className="text-muted-foreground shrink-0" /> {client.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                {canEdit && (
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => {
                      setEditForm({
                        name: client.name,
                        contactPerson: client.contactPerson || "",
                        email: client.email || "",
                        phone: client.phone || "",
                        address: client.address || "",
                        notes: client.notes || "",
                      });
                      setEditing(true);
                    }}>
                      <Pencil size={14} className="mr-1" /> Edit
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Assigned Team Members */}
        <div className="stat-card overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6 border-b border-border/50">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <User size={16} className="text-primary" /> Assigned Team Members
            </h3>
            {(user?.role === "admin" || user?.role === "manager") && (
              <div className="flex items-center gap-2">
                <Select value={assignUserId} onChange={(e) => setAssignUserId(parseInt(e.target.value))} className="w-36 sm:w-44">
                  <option value={0}>Select person...</option>
                  {bookkeepers
                    .filter((bk) => !client.assignedUsers?.some((au) => au.id === bk.id))
                    .map((bk) => <option key={bk.id} value={bk.id}>{bk.name}</option>)}
                </Select>
                <Button size="sm" onClick={() => assignMutation.mutate(assignUserId)} disabled={!assignUserId}>
                  <UserPlus size={14} className="mr-1" /> Assign
                </Button>
              </div>
            )}
          </div>
          <div className="p-4 sm:p-6">
            {(!client.assignedUsers || client.assignedUsers.length === 0) ? (
              <div className="text-center py-6">
                <User size={24} className="mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No team members assigned yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {client.assignedUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-white">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/10 to-blue-100 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                        {u.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{u.name}</p>
                        <p className="text-[11px] text-muted-foreground capitalize">{u.role}</p>
                      </div>
                    </div>
                    {(user?.role === "admin" || user?.role === "manager") && (
                      <button
                        onClick={() => unassignMutation.mutate(u.id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors shrink-0"
                        title="Remove"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Filing Tasks</CardTitle>
            {user?.role !== "encoder" && (
              <Button size="sm" onClick={() => setShowAddTask(!showAddTask)}>
                <Plus size={16} className="mr-1" /> Add Form
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {showAddTask && (
              <div className="flex items-center gap-3 mb-4 p-3 bg-muted/30 rounded-lg flex-wrap">
                <Select
                  value={newTaskFormType}
                  onChange={(e) => { setNewTaskFormType(e.target.value as "bir" | "custom"); setNewTaskForm(0); }}
                  className="w-36"
                >
                  <option value="bir">BIR Form</option>
                  <option value="custom">Custom Form</option>
                </Select>
                <Select value={newTaskForm} onChange={(e) => setNewTaskForm(parseInt(e.target.value))} className="flex-1">
                  <option value={0}>Select {newTaskFormType === "bir" ? "BIR" : "Custom"} Form...</option>
                  {newTaskFormType === "bir"
                    ? birForms.map((f) => (
                        <option key={f.id} value={f.id}>{f.formCode} - {f.name}</option>
                      ))
                    : customForms.map((f) => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                      ))
                  }
                </Select>
                <Button onClick={() => addTaskMutation.mutate()} disabled={!newTaskForm} size="sm">
                  Generate Task
                </Button>
              </div>
            )}

            <div className="space-y-2">
              {client.tasks?.length === 0 && <p className="text-sm text-muted-foreground">No tasks yet</p>}
              {client.tasks?.map((task) => (
                <div key={task.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors group"
                >
                  <RouterLink to={`/tasks/${task.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                    <FileText size={16} className="text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{task.formCode} {task.formName}</p>
                      <p className="text-xs text-muted-foreground">Deadline: {formatDate(task.deadline)}</p>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">
                      {task.formType === "custom" ? "Custom" : "BIR"}
                    </Badge>
                  </RouterLink>
                  <div className="flex items-center gap-2 shrink-0">
                    {isOverdue(task.deadline, task.status) && (
                      <span className="text-xs text-destructive font-medium">Overdue</span>
                    )}
                    <Badge className={STATUS_COLORS[task.status]}>{STATUS_LABELS[task.status]}</Badge>
                    {canDeleteTask && (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (confirm(`Delete task "${task.formCode} ${task.formName}" for ${client.name}?`))
                            deleteTaskMutation.mutate(task.id);
                        }}
                        className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete task"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

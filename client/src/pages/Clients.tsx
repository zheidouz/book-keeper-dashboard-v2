import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { clientsApi, usersApi } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TopBar } from "@/components/layout/TopBar";
import { useAuthStore } from "@/stores/auth-store";
import { Plus, Building2, FileText, ChevronRight, User, Pencil, Trash2, X, Check, Calendar, Clock, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";
import { differenceInDays, parseISO } from "date-fns";

function DaysBadge({ deadline }: { deadline: string }) {
  const days = differenceInDays(parseISO(deadline), new Date());
  if (days < 0) return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full"><AlertTriangle size={10} /> Overdue</span>;
  if (days <= 3) return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full"><Clock size={10} /> Due in {days}d</span>;
  if (days <= 14) return <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full"><Calendar size={10} /> Due in {days}d</span>;
  return null;
}

function ActivityRow({ task }: { task: NonNullable<Client["latestTask"]> }) {
  const days = differenceInDays(new Date(), parseISO(task.updatedAt));
  const prefix = days === 0 ? "today" : days === 1 ? "yesterday" : `${days} days ago`;
  return (
    <p className="text-[11px] text-muted-foreground truncate">
      Last: {task.formName} {task.status.replace("_", " ")} {prefix}
    </p>
  );
}

export default function Clients() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [newClient, setNewClient] = useState<{ name: string; contactPerson: string; email: string; phone: string; assignedTo: number }>({ name: "", contactPerson: "", email: "", phone: "", assignedTo: 0 });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editData, setEditData] = useState({ name: "", contactPerson: "", email: "", phone: "" });

  const { data: clients = [] } = useQuery({ queryKey: ["clients", search], queryFn: () => clientsApi.list(search) });
  const { data: bookkeepers = [] } = useQuery({ queryKey: ["bookkeepers"], queryFn: usersApi.listBookkeepers });

  const createMutation = useMutation({
    mutationFn: () => clientsApi.create({ name: newClient.name, contactPerson: newClient.contactPerson || undefined, email: newClient.email || undefined, phone: newClient.phone || undefined } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setShowCreate(false);
      setNewClient({ name: "", contactPerson: "", email: "", phone: "", assignedTo: 0 });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: typeof editData }) => clientsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => clientsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clients"] }),
    onError: (err: Error) => alert(err.message),
  });

  const canEdit = user?.role === "admin" || user?.role === "manager" || user?.role === "bookkeeper";
  const canDelete = user?.role === "admin" || user?.role === "manager";

  const filteredClients = search
    ? clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : clients;

  return (
    <div className="h-full overflow-y-auto">
      <TopBar title="Clients" onSearch={setSearch} searchPlaceholder="Search clients..." />
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{filteredClients.length} clients</p>
          {user?.role !== "encoder" && (
            <Button size="sm" onClick={() => setShowCreate(!showCreate)}>
              <Plus size={16} className="mr-1" /> Add Client
            </Button>
          )}
        </div>

        {showCreate && (
          <Card className="border-primary/20">
            <CardContent className="p-4 space-y-3">
              <h3 className="font-medium">New Client</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input placeholder="Company Name *" value={newClient.name} onChange={(e) => setNewClient({ ...newClient, name: e.target.value })} />
                <Input placeholder="Contact Person" value={newClient.contactPerson} onChange={(e) => setNewClient({ ...newClient, contactPerson: e.target.value })} />
                <Input placeholder="Email" value={newClient.email} onChange={(e) => setNewClient({ ...newClient, email: e.target.value })} />
                <Input placeholder="Phone" value={newClient.phone} onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })} />
              </div>
              {(user?.role === "admin" || user?.role === "manager") && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Assign to Bookkeeper</label>
                  <Select value={newClient.assignedTo} onChange={(e) => setNewClient({ ...newClient, assignedTo: parseInt(e.target.value) })}>
                    <option value={0}>Not assigned</option>
                    {bookkeepers.map((bk) => <option key={bk.id} value={bk.id}>{bk.name}</option>)}
                  </Select>
                </div>
              )}
              <Button onClick={() => createMutation.mutate()} disabled={!newClient.name}>Create Client</Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <div
              key={client.id}
              className="stat-card overflow-hidden group relative transition-all duration-200 hover:shadow-lg hover:border-primary/30 animate-fade-in"
            >
              {editingId === client.id ? (
                /* Inline edit form */
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-1 gap-2">
                    <Input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} placeholder="Company Name" />
                    <Input value={editData.contactPerson} onChange={(e) => setEditData({ ...editData, contactPerson: e.target.value })} placeholder="Contact Person" />
                    <div className="grid grid-cols-2 gap-2">
                      <Input value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} placeholder="Email" />
                      <Input value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} placeholder="Phone" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateMutation.mutate({ id: client.id, data: editData })} disabled={!editData.name}>
                      <Check size={14} className="mr-1" /> Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      <X size={14} className="mr-1" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                /* ── Client Card (premium) ── */
                <>
                  {/* Clickable area linking to detail */}
                  <Link to={`/clients/${client.id}`} className="block p-4 pb-3">
                    {/* Row 1: Name + Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-2 rounded-lg bg-primary/10 shrink-0 transition-transform duration-300 group-hover:scale-105">
                          <Building2 size={18} className="text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-sm font-semibold truncate">{client.name}</h3>
                            {client.clientType && (
                              <span className="text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">
                                {client.clientType}
                              </span>
                            )}
                          </div>
                          {/* Assigned bookkeeper */}
                          {client.assignedUsers && client.assignedUsers.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary shrink-0">
                                {client.assignedUsers[0].name.charAt(0)}
                              </div>
                              <span className="text-[11px] text-muted-foreground truncate">
                                {client.assignedUsers[0].name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={14} className="text-muted-foreground/40 shrink-0 mt-1 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </div>

                    {/* Row 2: Metrics */}
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <FileText size={12} className="text-muted-foreground/60" />
                        {client.totalTasks || 0} tasks
                      </span>
                      {client.pendingTasks ? (
                        <span className="text-amber-600 font-medium flex items-center gap-1">
                          <Clock size={12} /> {client.pendingTasks} pending
                        </span>
                      ) : null}
                      {/* Nearest deadline badge */}
                      {client.nearestDeadline && (
                        <DaysBadge deadline={client.nearestDeadline.deadline} />
                      )}
                    </div>

                    {/* Row 3: Recent activity */}
                    {client.latestTask && (
                      <div className="mt-2 pt-2 border-t border-border/30">
                        <ActivityRow task={client.latestTask} />
                      </div>
                    )}
                  </Link>

                  {/* Row 4: Edit/Delete actions (icon buttons, right-aligned) */}
                  {canEdit && editingId !== client.id && (
                    <div className="flex justify-end items-center gap-1 px-3 pb-3">
                      <button
                        onClick={() => { setEditingId(client.id); setEditData({ name: client.name, contactPerson: client.contactPerson || "", email: client.email || "", phone: client.phone || "" }); }}
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground/60 hover:text-primary hover:bg-primary/5 transition-colors"
                        title="Edit client"
                      >
                        <Pencil size={14} />
                      </button>
                      {canDelete && (
                        <button
                          onClick={() => { if (confirm(`Delete "${client.name}"? This will also remove all associated tasks.`)) deleteMutation.mutate(client.id); }}
                          className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground/60 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete client"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TopBar } from "@/components/layout/TopBar";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { UserCog, Plus, X } from "lucide-react";

export default function SettingsUsers() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [editingUser, setEditingUser] = useState<{ id: number; role: string } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "encoder" });

  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: usersApi.list });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => usersApi.updateRole(id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditingUser(null);
    },
  });

  const createMutation = useMutation({
    mutationFn: () => usersApi.create(newUser),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setShowCreate(false);
      setNewUser({ name: "", email: "", role: "encoder" });
    },
  });

  if (user?.role !== "admin" && user?.role !== "manager") {
    return (
      <div>
        <TopBar title="Settings" />
        <div className="p-6 text-center">
          <p className="text-muted-foreground">Only admins and managers can access user management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <TopBar title="User Management" />
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="stat-card overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-border/50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <UserCog size={16} className="text-primary" /> Team Members
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{users.length} users</span>
                {user?.role === "admin" && (
                  <Button size="sm" variant={showCreate ? "secondary" : "default"} onClick={() => setShowCreate(!showCreate)}>
                    {showCreate ? <X size={14} className="mr-1" /> : <Plus size={14} className="mr-1" />}
                    {showCreate ? "Cancel" : "Add User"}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Create User Form */}
          {showCreate && (
            <div className="p-4 sm:p-6 border-b border-border/50 bg-blue-50/30">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">New User</h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <Input
                  placeholder="Full Name *"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                />
                <Input
                  placeholder="Email *"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
                <Select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}>
                  {Object.entries(ROLE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </Select>
                <Button onClick={() => createMutation.mutate()} disabled={!newUser.name || !newUser.email}>
                  Create User
                </Button>
              </div>
            </div>
          )}

          <div className="p-4 sm:p-6">
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="card-hover flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 rounded-xl border bg-white">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-blue-100 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:shrink-0">
                    {editingUser?.id === u.id ? (
                      <>
                        <Select
                          value={editingUser.role}
                          onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                          className="w-28 sm:w-32"
                        >
                          {Object.entries(ROLE_LABELS).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </Select>
                        <Button size="sm" onClick={() => roleMutation.mutate({ id: u.id, role: editingUser.role })}>Save</Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingUser(null)}>Cancel</Button>
                      </>
                    ) : (
                      <>
                        <Badge className={ROLE_COLORS[u.role] + " ring-1 ring-inset ring-black/5"}>{ROLE_LABELS[u.role]}</Badge>
                        {user?.role === "admin" && (
                          <Button size="sm" variant="outline" onClick={() => setEditingUser({ id: u.id, role: u.role })}>
                            Change Role
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

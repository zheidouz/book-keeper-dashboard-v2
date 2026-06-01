import type { ApiResponse, Client, Task, BIRForm, CustomForm, User, ReportStats, StatusDistribution, CalendarEvent, NotificationsResponse } from "@/types";
import { getClerkToken } from "@/providers/AuthProvider";

const API_BASE = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  // Attach Clerk JWT if available — fetches a fresh token per request
  const token = await getClerkToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${url}`, {
    headers: { ...headers, ...(options?.headers as Record<string, string> | undefined) },
    ...options,
  });

  // Handle non-JSON responses (e.g., server errors returning HTML)
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    const text = await res.text();
    throw new Error(`Server returned ${res.status}: ${text.slice(0, 100)}`);
  }

  const json: ApiResponse<T> = await res.json();
  if (!json.success) throw new Error(json.error || "Request failed");
  return json.data as T;
}

// Clients
export const clientsApi = {
  list: (search?: string) => request<Client[]>(`/clients${search ? `?search=${search}` : ""}`),
  get: (id: number) => request<Client>(`/clients/${id}`),
  create: (data: Partial<Client>) => request<Client>("/clients", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Client>) => request<Client>(`/clients/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  assign: (clientId: number, userId: number) => request<User>(`/clients/${clientId}/assign`, { method: "POST", body: JSON.stringify({ userId }) }),
  unassign: (clientId: number, userId: number) => request<void>(`/clients/${clientId}/assign/${userId}`, { method: "DELETE" }),
  delete: (id: number) => request<void>(`/clients/${id}`, { method: "DELETE" }),
};

// Tasks
export const tasksApi = {
  list: (params?: { status?: string; clientId?: number; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.clientId) qs.set("clientId", String(params.clientId));
    if (params?.search) qs.set("search", params.search);
    const query = qs.toString();
    return request<Task[]>(`/tasks${query ? `?${query}` : ""}`);
  },
  get: (id: number) => request<Task>(`/tasks/${id}`),
  create: (data: { clientId: number; formType: string; formId: number; assignedTo?: number; notes?: string }) =>
    request<Task>("/tasks", { method: "POST", body: JSON.stringify(data) }),
  updateStatus: (id: number, status: string, comment?: string) =>
    request<Task>(`/tasks/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, comment }) }),
  delete: (id: number) => request<void>(`/tasks/${id}`, { method: "DELETE" }),    /** Combined tasks overview — 1 API call instead of 3 */
    overview: () => request<{ tasks: Task[]; clients: Client[]; bookkeepers: User[] }>("/tasks/overview"),};

// Forms
export const formsApi = {
  listBir: () => request<BIRForm[]>("/forms/bir"),
  listCustom: () => request<CustomForm[]>("/forms/custom"),
  createCustom: (data: Partial<CustomForm>) => request<CustomForm>("/forms/custom", { method: "POST", body: JSON.stringify(data) }),
  updateCustom: (id: number, data: Partial<CustomForm>) => request<CustomForm>(`/forms/custom/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCustom: (id: number) => request<void>(`/forms/custom/${id}`, { method: "DELETE" }),
};

// Users
export const usersApi = {
  list: () => request<User[]>("/users"),
  me: () => request<User>("/users/me"),
  create: (data: { name: string; email: string; role: string }) => request<User>("/users", { method: "POST", body: JSON.stringify(data) }),
  updateRole: (id: number, role: string) => request<User>(`/users/${id}/role`, { method: "PATCH", body: JSON.stringify({ role }) }),
  listBookkeepers: () => request<User[]>("/users/bookkeepers"),
};

// Reports
export const reportsApi = {
  stats: () => request<ReportStats>("/reports/stats"),
  statusDistribution: () => request<StatusDistribution[]>("/reports/status-distribution"),
  monthlyTrends: () => request<{ month: string; count: number }[]>("/reports/monthly-trends"),
  /** Combined dashboard payload — 1 API call instead of 3 */
  dashboard: () => request<{
    stats: ReportStats;
    distribution: StatusDistribution[];
    trends: { month: string; count: number }[];
  }>("/reports/dashboard"),
};

// Notifications
export const notificationsApi = {
  list: () => request<NotificationsResponse>("/notifications"),
  markRead: (id: number) => request<void>(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllRead: () => request<void>("/notifications/read-all", { method: "PUT" }),
};

// Calendar
export const calendarApi = {
  list: (start?: string, end?: string) => {
    const qs = new URLSearchParams();
    if (start) qs.set("start", start);
    if (end) qs.set("end", end);
    const query = qs.toString();
    return request<CalendarEvent[]>(`/calendar${query ? `?${query}` : ""}`);
  },
};

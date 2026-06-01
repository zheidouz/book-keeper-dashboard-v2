export type Role = "admin" | "manager" | "bookkeeper" | "encoder";

export type TaskStatus = "pending" | "ready_to_file" | "submitted" | "completed" | "done";

export type FilingFrequency = "monthly" | "quarterly" | "annually" | "semi_annual" | "one_time";

export type FormType = "bir" | "custom";

export interface User {
  id: number;
  clerkId: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
  createdAt: string;
}

export interface Client {
  id: number;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  pendingTasks?: number;
  totalTasks?: number;
  clientType?: string;
  assignedUsers?: User[];
  tasks?: Task[];
  latestTask?: { formName: string; status: TaskStatus; deadline: string; updatedAt: string } | null;
  nearestDeadline?: { formName: string; status: TaskStatus; deadline: string; updatedAt: string } | null;
  createdAt: string;
}

export interface BIRForm {
  id: number;
  formCode: string;
  name: string;
  description?: string;
  filingFrequency: FilingFrequency;
  deadlineDay: number;
  deadlineMonthOffset: number;
  category: string;
  isActive: boolean;
}

export interface CustomForm {
  id: number;
  name: string;
  description?: string;
  filingFrequency: FilingFrequency;
  deadlineDay?: number;
  deadlineMonthOffset: number;
  requiredFields: string[];
  createdBy: number;
  creatorName?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Task {
  id: number;
  clientId: number;
  clientName?: string;
  formType: FormType;
  formId: number;
  formCode?: string;
  formName: string;
  status: TaskStatus;
  deadline: string;
  filingPeriod?: string;
  taxYear?: number;
  assignedTo?: number;
  assigneeName?: string;
  notes?: string;
  history?: TaskHistoryEntry[];
  createdAt: string;
  updatedAt?: string;
  submittedByName?: string;
  submittedAt?: string;
}

export interface TaskHistoryEntry {
  id: number;
  fromStatus?: string;
  toStatus: string;
  comment?: string;
  changedByName?: string;
  createdAt: string;
}

export interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  status: TaskStatus;
  client?: string;
  form?: string;
  assignee?: string;
  filingPeriod?: string;
}

export interface ReportStats {
  totalTasks: number;
  pendingTasks: number;
  readyTasks: number;
  submittedTasks: number;
  completedTasks: number;
  doneTasks: number;
  upcomingDeadlines: number;
  overdueTasks: number;
  totalClients: number;
  activeUsers: number;
}

export interface StatusDistribution {
  status: string;
  label: string;
  count: number;
}

export interface Notification {
  id: number;
  taskId: number;
  message: string;
  bookkeeperName: string;
  formName: string;
  clientName: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  items: Notification[];
  unreadCount: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface ChatState {
  messages: ChatMessage[];
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
}

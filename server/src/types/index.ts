export type Role = "admin" | "manager" | "bookkeeper" | "encoder";
export type TaskStatus = "pending" | "ready_to_file" | "submitted" | "completed" | "done";
export type FilingFrequency = "monthly" | "quarterly" | "annually" | "semi_annual" | "one_time";
export type FormType = "bir" | "custom";
export interface AuthUser { id: number; clerkId: string; name: string; email: string; role: Role; }
export interface ApiResponse<T = unknown> { success: boolean; data?: T; error?: string; }
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  ready_to_file: "Ready to File",
  submitted: "Submitted",
  completed: "Completed",
  done: "Done",
};

export const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-300 ring-1 ring-amber-200 font-semibold",
  ready_to_file: "bg-sky-50 text-sky-700 border-sky-300 ring-1 ring-sky-200 font-semibold",
  submitted: "bg-violet-50 text-violet-700 border-violet-300 ring-1 ring-violet-200 font-semibold",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-200 font-semibold",
  done: "bg-slate-50 text-slate-600 border-slate-300 ring-1 ring-slate-200 font-semibold",
};

export const STATUS_BG: Record<string, string> = {
  pending: "bg-gradient-to-br from-amber-50 to-amber-100/50 border-l-4 border-l-amber-400",
  ready_to_file: "bg-gradient-to-br from-sky-50 to-sky-100/50 border-l-4 border-l-sky-400",
  submitted: "bg-gradient-to-br from-violet-50 to-violet-100/50 border-l-4 border-l-violet-400",
  completed: "bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-l-4 border-l-emerald-400",
  done: "bg-gradient-to-br from-slate-50 to-slate-100/50 border-l-4 border-l-slate-400",
};

export const STATUS_DOT: Record<string, string> = {
  pending: "bg-amber-400",
  ready_to_file: "bg-sky-400",
  submitted: "bg-violet-400",
  completed: "bg-emerald-400",
  done: "bg-slate-400",
};

export const ROLE_LABELS: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  bookkeeper: "Bookkeeper",
  encoder: "Encoder",
};

export const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-100 text-red-800",
  manager: "bg-blue-100 text-blue-800",
  bookkeeper: "bg-green-100 text-green-800",
  encoder: "bg-gray-100 text-gray-600",
};

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function isOverdue(deadline: string, status: string): boolean {
  if (status === "done" || status === "completed") return false;
  const today = new Date().toISOString().split("T")[0];
  return deadline < today;
}

export function isUpcoming(deadline: string, days: number = 30): boolean {
  const today = new Date();
  const future = new Date(today.getTime() + days * 86400000);
  const deadlineDate = new Date(deadline);
  return deadlineDate >= today && deadlineDate <= future;
}

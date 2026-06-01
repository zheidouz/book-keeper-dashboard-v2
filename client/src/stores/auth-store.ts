import { create } from "zustand";
import type { User, TaskStatus } from "@/types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  authLoading: boolean;
  sidebarOpen: boolean;
  setUser: (user: User | null) => void;
  setAuthLoading: (loading: boolean) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  can: (...roles: string[]) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  authLoading: true,
  sidebarOpen: true,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setAuthLoading: (loading) => set({ authLoading: loading }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  can: (...roles) => {
    const user = get().user;
    if (!user) return false;
    return roles.includes(user.role);
  },
}));

interface TaskFilterState {
  clientFilter: number | "all";
  searchQuery: string;
  setClientFilter: (id: number | "all") => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
}

export const useTaskFilterStore = create<TaskFilterState>((set) => ({
  clientFilter: "all",
  searchQuery: "",
  setClientFilter: (id) => set({ clientFilter: id }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  resetFilters: () => set({ clientFilter: "all", searchQuery: "" }),
}));

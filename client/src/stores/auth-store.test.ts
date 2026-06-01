import { describe, it, expect, beforeEach } from "vitest";
import { useAuthStore, useTaskFilterStore } from "./auth-store";
import type { User } from "@/types";

const mockUser: User = {
  id: 1,
  clerkId: "test_123",
  name: "Test Admin",
  email: "admin@test.com",
  role: "admin",
  createdAt: "2026-01-01",
};

const mockBookkeeper: User = {
  id: 2,
  clerkId: "test_456",
  name: "Test Bookkeeper",
  email: "bk@test.com",
  role: "bookkeeper",
  createdAt: "2026-01-01",
};

describe("useAuthStore", () => {
  beforeEach(() => {
    // Reset store between tests
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      authLoading: true,
      sidebarOpen: true,
    });
  });

  it("starts with no user and authLoading true", () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.authLoading).toBe(true);
    expect(state.sidebarOpen).toBe(true);
  });

  it("setUser sets user and marks authenticated", () => {
    useAuthStore.getState().setUser(mockUser);
    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
  });

  it("setUser(null) clears auth", () => {
    useAuthStore.getState().setUser(mockUser);
    useAuthStore.getState().setUser(null);
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it("setAuthLoading updates loading state", () => {
    useAuthStore.getState().setAuthLoading(false);
    expect(useAuthStore.getState().authLoading).toBe(false);
    useAuthStore.getState().setAuthLoading(true);
    expect(useAuthStore.getState().authLoading).toBe(true);
  });

  it("toggleSidebar flips sidebar state", () => {
    expect(useAuthStore.getState().sidebarOpen).toBe(true);
    useAuthStore.getState().toggleSidebar();
    expect(useAuthStore.getState().sidebarOpen).toBe(false);
    useAuthStore.getState().toggleSidebar();
    expect(useAuthStore.getState().sidebarOpen).toBe(true);
  });

  it("setSidebarOpen sets explicitly", () => {
    useAuthStore.getState().setSidebarOpen(false);
    expect(useAuthStore.getState().sidebarOpen).toBe(false);
    useAuthStore.getState().setSidebarOpen(true);
    expect(useAuthStore.getState().sidebarOpen).toBe(true);
  });

  describe("can()", () => {
    it("returns false when no user", () => {
      expect(useAuthStore.getState().can("admin")).toBe(false);
    });

    it("returns true when user role is in the list", () => {
      useAuthStore.getState().setUser(mockUser);
      expect(useAuthStore.getState().can("admin")).toBe(true);
      expect(useAuthStore.getState().can("admin", "manager")).toBe(true);
    });

    it("returns false when user role is not in the list", () => {
      useAuthStore.getState().setUser(mockBookkeeper);
      expect(useAuthStore.getState().can("admin")).toBe(false);
      expect(useAuthStore.getState().can("admin", "manager")).toBe(false);
    });
  });
});

describe("useTaskFilterStore", () => {
  beforeEach(() => {
    useTaskFilterStore.setState({
      clientFilter: "all",
      searchQuery: "",
    });
  });

  it("starts with default values", () => {
    const state = useTaskFilterStore.getState();
    expect(state.clientFilter).toBe("all");
    expect(state.searchQuery).toBe("");
  });

  it("setClientFilter updates client filter", () => {
    useTaskFilterStore.getState().setClientFilter(5);
    expect(useTaskFilterStore.getState().clientFilter).toBe(5);
  });

  it("setSearchQuery updates search query", () => {
    useTaskFilterStore.getState().setSearchQuery("BIR");
    expect(useTaskFilterStore.getState().searchQuery).toBe("BIR");
  });

  it("resetFilters resets to defaults", () => {
    useTaskFilterStore.getState().setClientFilter(3);
    useTaskFilterStore.getState().setSearchQuery("test");
    useTaskFilterStore.getState().resetFilters();
    const state = useTaskFilterStore.getState();
    expect(state.clientFilter).toBe("all");
    expect(state.searchQuery).toBe("");
  });
});

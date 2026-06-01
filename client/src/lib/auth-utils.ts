import { useAuthStore } from "@/stores/auth-store";

/**
 * Sign out, supporting both Clerk (production) and mock (dev) auth.
 *
 * In Clerk mode, this function is called after Clerk's own signOut
 * has cleared its session. In dev mode, it just clears Zustand.
 */
export function logout() {
  useAuthStore.getState().setUser(null);
  useAuthStore.getState().setAuthLoading(false);
}

/**
 * Determine the post-logout redirect URL.
 * For Clerk, this should redirect to the login page so Clerk can
 * re-evaluate the session. For dev mode, same thing.
 */
export function getLogoutRedirect(): string {
  return "/login";
}
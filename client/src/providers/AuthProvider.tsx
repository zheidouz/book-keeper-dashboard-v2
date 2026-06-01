import React, { useEffect } from "react";
import { ClerkProvider, useAuth, useUser, SignedOut, SignedIn } from "@clerk/clerk-react";
import { useAuthStore } from "@/stores/auth-store";
import { usersApi } from "@/lib/api";
import type { User } from "@/types";

/**
 * Stores the Clerk getToken function so api.ts can fetch a fresh JWT per request.
 */
let _getTokenFn: (() => Promise<string | null>) | null = null;
export async function getClerkToken(): Promise<string | null> {
  if (_getTokenFn) return _getTokenFn();
  return null;
}

/**
 * Inner component that syncs Clerk user ↔ Zustand store.
 */
function ClerkSync({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isSignedIn, isLoaded: clerkLoaded } = useUser();
  const { getToken } = useAuth();
  const { setUser, setAuthLoading } = useAuthStore();

  useEffect(() => {
    if (!clerkLoaded) return; // Clerk still initializing

    if (isSignedIn && clerkUser) {
      // Store getToken so api.ts fetches a fresh token per request
      _getTokenFn = getToken;

      // Fetch full user profile from backend
      (async () => {
        try {
          const backendUser: User = await usersApi.me();
          setUser(backendUser);
        } catch (err) {
          console.error("Failed to sync Clerk user:", err);
          setUser(null);
        } finally {
          setAuthLoading(false);
        }
      })();
    } else {
      _getTokenFn = null;
      setUser(null);
      setAuthLoading(false);
    }
  }, [isSignedIn, clerkUser, clerkLoaded, getToken, setUser, setAuthLoading]);

  return <>{children}</>;
}

/**
 * Clerk → Zustand auth bridge.
 * Also exports getClerkToken() so api.ts can attach the Bearer token.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
  const setAuthLoading = useAuthStore((s) => s.setAuthLoading);

  // Always call useEffect unconditionally (Rules of Hooks compliance)
  useEffect(() => {
    if (!publishableKey) {
      setAuthLoading(false);
    }
  }, [publishableKey, setAuthLoading]);

  if (!publishableKey) {
    // No Clerk key set — run in dev mode (mock login), no loading needed
    return <>{children}</>;
  }

  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ClerkSync>{children}</ClerkSync>
    </ClerkProvider>
  );
}
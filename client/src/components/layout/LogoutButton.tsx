import { useAuthStore } from "@/stores/auth-store";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCallback } from "react";

/**
 * Logout button that works with both Clerk (production) and mock (dev) auth.
 * When Clerk is active, uses Clerk's signOut. In dev mode, clears Zustand store.
 */
export function LogoutButton({ className }: { className?: string }) {
  const hasClerk = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  const handleClick = useCallback(async () => {
    if (hasClerk) {
      // Clerk globally injects `window.Clerk` when ClerkProvider is mounted
      const clerk = (window as Record<string, any>).Clerk;
      if (clerk?.signOut) {
        await clerk.signOut();
      }
    }

    // Clear Zustand store
    useAuthStore.getState().setUser(null);
    useAuthStore.getState().setAuthLoading(false);

    // Full page reload ensures clean Clerk session state
    window.location.href = "/login";
  }, [hasClerk]);

  return (
    <Button variant="ghost" size="icon" onClick={handleClick} className={className}>
      <LogOut size={15} />
    </Button>
  );
}
import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Keep data fresh for 2 minutes — reduces unnecessary refetches
      staleTime: 2 * 60 * 1000,
      // Cache data for 10 minutes even if no component is using it
      gcTime: 10 * 60 * 1000,
      // Retry once on failure, no retry for 4xx errors
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes("4")) return false;
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
      // Don't refetch stale data when reconnecting — wait for component mount
      refetchOnReconnect: false,
    },
  },
});

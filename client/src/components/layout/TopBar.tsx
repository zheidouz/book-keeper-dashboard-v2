import { useAuthStore } from "@/stores/auth-store";
import { Bell, Search, Menu, X, CheckCheck, Clock, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationsApi } from "@/lib/api";
import { formatDistanceToNow } from "date-fns";

interface TopBarProps {
  title?: string;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
}

function NotificationPanel() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsApi.list,
    // Only poll while panel is open — saves network & CPU when idle
      refetchInterval: open ? 60_000 : false,
  });

  const markRead = useMutation({
    mutationFn: (id: number) => notificationsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    onError: (err: Error) => console.error("Failed to mark notification read:", err.message),
  });

  const markAllRead = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    onError: (err: Error) => console.error("Failed to mark all read:", err.message),
  });

  // Mark all read when panel opens
  useEffect(() => {
    if (open && unread > 0) markAllRead.mutate();
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unread = data?.unreadCount || 0;
  const items = data?.items || [];

  return (
    <div ref={panelRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-accent relative transition-colors"
      >
        <Bell size={17} className={cn("transition-transform", open && "scale-110")} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full ring-2 ring-background px-1">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[380px] max-w-[90vw] rounded-xl border bg-card shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="text-sm font-semibold">Notifications</h3>
            {unread > 0 && (
              <span className="text-[11px] text-muted-foreground">{unread} unread</span>
            )}
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            )}

            {!isLoading && items.length === 0 && (
              <div className="flex flex-col items-center py-8 text-muted-foreground">
                <Bell size={28} className="mb-2 opacity-30" />
                <p className="text-xs">No notifications yet</p>
              </div>
            )}

            {items.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-3 px-4 py-3 border-b border-border/30 last:border-0 transition-colors hover:bg-accent/30 cursor-pointer",
                  !n.read && "bg-primary/[0.03]"
                )}
                onClick={() => { if (!n.read) markRead.mutate(n.id); }}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                  n.read ? "bg-muted" : "bg-primary/10"
                )}>
                  <User size={14} className={n.read ? "text-muted-foreground" : "text-primary"} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium">{n.bookkeeperName}</span>
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
                    <span className="font-medium text-foreground/80">{n.formName}</span>
                    {" marked as done for "}
                    <span className="font-medium text-foreground/80">{n.clientName}</span>
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1 flex items-center gap-1">
                    <Clock size={10} />
                    {formatDistanceToNow(new Date(n.createdAt.replace(' ', 'T') + 'Z'), { addSuffix: true })}
                  </p>
                </div>
                {!n.read && (
                  <button
                    onClick={(e) => { e.stopPropagation(); markRead.mutate(n.id); }}
                    className="shrink-0 p-1 rounded hover:bg-accent text-muted-foreground/50 hover:text-primary transition-colors"
                    title="Mark as read"
                  >
                    <CheckCheck size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function TopBar({ title, onSearch, searchPlaceholder }: TopBarProps) {
  const { toggleSidebar } = useAuthStore();
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-14 sm:h-16 items-center gap-2 sm:gap-4 border-b bg-background/80 backdrop-blur-sm px-3 sm:px-6">
      {/* Mobile sidebar toggle */}
      <button onClick={toggleSidebar} className="lg:hidden p-2 rounded-lg hover:bg-accent -ml-1">
        <Menu size={18} />
      </button>

      {/* Title - hidden on mobile when search is active */}
      {title && (
        <h2 className={cn("text-base sm:text-lg font-semibold truncate", showMobileSearch && "hidden")}>
          {title}
        </h2>
      )}

      {/* Desktop search */}
      {onSearch && (
        <div className="hidden sm:relative sm:flex sm:flex-1 sm:max-w-sm lg:max-w-md ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <Input
            placeholder={searchPlaceholder || "Search..."}
            className="pl-9 h-9 bg-muted/50 border-0 focus-visible:bg-background"
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      )}

      {/* Mobile search toggle */}
      {onSearch && (
        <button
          className="sm:hidden p-2 rounded-lg hover:bg-accent ml-auto"
          onClick={() => setShowMobileSearch(!showMobileSearch)}
        >
          {showMobileSearch ? <X size={18} /> : <Search size={18} />}
        </button>
      )}

      {/* Right section */}
      <div className={cn("flex items-center gap-1 sm:gap-2 ml-auto", showMobileSearch && "hidden")}>
        <NotificationPanel />
      </div>

      {/* Mobile search bar - slides in */}
      {showMobileSearch && onSearch && (
        <div className="absolute left-0 right-0 top-full bg-background border-b p-3 sm:hidden animate-in slide-in-from-top-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
            <Input
              placeholder={searchPlaceholder || "Search..."}
              className="pl-9 h-10"
              onChange={(e) => onSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
}

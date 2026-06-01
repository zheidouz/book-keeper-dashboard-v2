import { useRef, useCallback } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import { LogoutButton } from "@/components/layout/LogoutButton";
import {
  LayoutDashboard,
  ListChecks,
  Users,
  FileText,
  Calendar,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  FilePlus2,
  LogOut,
  PanelLeftClose,
  PanelLeft,
  ChevronDown,
} from "lucide-react";

// ── Navigation config ──────────────────────────────────

interface NavItem {
  to: string;
  icon: typeof LayoutDashboard;
  label: string;
  roles: string[];
}

const mainNav: NavItem[] = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", roles: ["admin", "manager", "bookkeeper", "encoder"] },
  { to: "/tasks", icon: ListChecks, label: "Tasks", roles: ["admin", "manager", "bookkeeper", "encoder"] },
  { to: "/clients", icon: Users, label: "Clients", roles: ["admin", "manager", "bookkeeper"] },
  { to: "/forms", icon: FileText, label: "BIR Forms", roles: ["admin", "manager", "bookkeeper"] },
  { to: "/forms/custom", icon: FilePlus2, label: "Custom Forms", roles: ["admin"] },
  { to: "/calendar", icon: Calendar, label: "Calendar", roles: ["admin", "manager", "bookkeeper", "encoder"] },
  { to: "/finished-tasks", icon: BarChart3, label: "Finished Tasks", roles: ["admin", "manager"] },
];

const bottomNav: NavItem[] = [
  { to: "/settings/users", icon: Settings, label: "Settings", roles: ["admin", "manager"] },
];

// ── Tooltip ─────────────────────────────────────────────

function Tooltip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="group/tip relative flex items-center">
      {children}
      <div
        className="
          absolute left-full ml-3 px-2.5 py-1.5 rounded-lg text-xs font-medium
          whitespace-nowrap opacity-0 invisible translate-x-[-6px]
          group-hover/tip:opacity-100 group-hover/tip:visible group-hover/tip:translate-x-0
          transition-all duration-200 pointer-events-none z-50
          bg-popover text-popover-foreground border shadow-lg
        "
      >
        {label}
      </div>
    </div>
  );
}

// ── NavLink renderer ───────────────────────────────────

function SidebarLink({
  item,
  collapsed,
  onClick,
}: {
  item: NavItem;
  collapsed: boolean;
  onClick?: () => void;
}) {
  const link = (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          "relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group/link",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-accent focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar",
          isActive
            ? "text-white bg-sidebar-accent/15"
            : "text-sidebar-foreground/50 hover:text-sidebar-foreground/90 hover:bg-white/[0.06]",
          collapsed && "justify-center px-2"
        )
      }
    >
      {/* Active indicator bar */}
      <span
        className={cn(
          "absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-0 rounded-r-full bg-sidebar-accent transition-all duration-300",
          "group-[.active]/link:h-5 group-[.active]/link:w-0.5 group-[.active]/link:shadow-[0_0_8px_2px_rgba(59,130,246,0.4)]"
        )}
      />
      <item.icon size={20} className="shrink-0 transition-transform duration-200 group-hover/link:scale-110" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </NavLink>
  );

  if (collapsed) {
    return <Tooltip label={item.label}>{link}</Tooltip>;
  }
  return link;
}

// ── User dropdown state ────────────────────────────────

// ── Main Sidebar ───────────────────────────────────────

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, user, setSidebarOpen } = useAuthStore();
  const location = useLocation();
  const navRef = useRef<HTMLDivElement>(null);

  const closeOnMobile = useCallback(() => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [setSidebarOpen]);

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen flex flex-col transition-all duration-300 ease-out",
          "sidebar-glass",
          sidebarOpen ? "w-64" : "w-[72px]",
          "max-lg:fixed max-lg:z-50",
          !sidebarOpen && "max-lg:-translate-x-full"
        )}
        aria-label="Main navigation"
      >
        {/* ── Logo area ── */}
        <div
          className={cn(
            "flex items-center h-16 shrink-0 border-b border-white/[0.06]",
            sidebarOpen ? "px-4 justify-between" : "px-3 justify-center"
          )}
        >
          {sidebarOpen ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 shadow-sm shadow-blue-600/30">
                <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                  <path d="M8 10h16M16 10v14" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-bold leading-tight tracking-tight text-white">TAO</h1>
                <p className="text-[10px] leading-tight text-blue-300/80 truncate">TE ACCOUNTING OFFICE</p>
              </div>
            </div>
          ) : (
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm shadow-blue-600/30">
              <svg width="18" height="18" viewBox="0 0 32 32" fill="none">
                <path d="M8 10h16M16 10v14" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
              </svg>
            </div>
          )}

          {/* Desktop toggle */}
          <button
            onClick={toggleSidebar}
            className={cn(
              "p-1.5 rounded-lg text-sidebar-foreground/40 hover:text-white hover:bg-white/10 transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-accent",
              "max-lg:hidden",
              !sidebarOpen && "absolute -right-3 top-4 bg-sidebar border border-white/[0.08] shadow-md"
            )}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeft size={15} />}
          </button>
        </div>

        {/* ── Navigation ── */}
        <nav
          ref={navRef}
          className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5 scrollbar-thin"
          aria-label="Sidebar navigation"
        >
          {/* Main section */}
          {mainNav
            .filter((item) => user && item.roles.includes(user.role))
            .map((item) => (
              <SidebarLink
                key={item.to}
                item={item}
                collapsed={!sidebarOpen}
                onClick={closeOnMobile}
              />
            ))}

          {/* Separator */}
          {bottomNav.some((item) => user && item.roles.includes(user.role)) && (
            <div className={cn("my-3", sidebarOpen ? "px-3" : "px-2")}>
              <div className="h-px bg-white/[0.06]" />
            </div>
          )}

          {/* Bottom section */}
          {bottomNav
            .filter((item) => user && item.roles.includes(user.role))
            .map((item) => (
              <SidebarLink
                key={item.to}
                item={item}
                collapsed={!sidebarOpen}
                onClick={closeOnMobile}
              />
            ))}
        </nav>

        {/* ── User section at bottom ── */}
        <div className="shrink-0 border-t border-white/[0.06]">
          {sidebarOpen ? (
            <div className="p-3">
              <div className="flex items-center justify-between rounded-lg bg-white/[0.04] px-3 py-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
                    {user?.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold truncate text-white/90">{user?.name || "User"}</p>
                    <p className="text-[10px] text-blue-300/60 capitalize truncate">{user?.role || "—"}</p>
                  </div>
                </div>
                <LogoutButton className="text-white/40 hover:text-white hover:bg-white/10 rounded-md" />
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 py-3">
              <Tooltip label={user?.name || "User"}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
              </Tooltip>
              <Tooltip label="Logout">
                <button
                  onClick={() => {
                    useAuthStore.getState().setUser(null);
                    window.location.href = "/login";
                  }}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-accent"
                  aria-label="Logout"
                >
                  <LogOut size={15} />
                </button>
              </Tooltip>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={closeOnMobile}
          aria-hidden="true"
        />
      )}
    </>
  );
}

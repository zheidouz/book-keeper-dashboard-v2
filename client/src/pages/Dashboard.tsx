import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/lib/api";
import { TopBar } from "@/components/layout/TopBar";
import { STATUS_LABELS, STATUS_COLORS, cn } from "@/lib/utils";
import { ListChecks, Users, AlertTriangle, Clock, CheckCircle2, FileText } from "lucide-react";
import { useMemo, lazy, Suspense } from "react";

// Lazy-load recharts — saves ~400KB from initial bundle
const DashboardCharts = lazy(() => import("@/components/charts/DashboardCharts"));

export default function Dashboard() {
  // Single query for all dashboard data — 1 round-trip vs 3
  const { data: dashData } = useQuery({
    queryKey: ["dashboard"],
    queryFn: reportsApi.dashboard,
    staleTime: 5 * 60 * 1000,
  });
  const stats = dashData?.stats;
  const distribution = dashData?.distribution;
  const trends = dashData?.trends;

  // Memoize stat cards to prevent recalculation on every render
  const statCards = useMemo(() => [
    { label: "Total Tasks", value: stats?.totalTasks || 0, icon: ListChecks, color: "text-blue-600 bg-blue-50", border: "border-l-blue-500" },
    { label: "Pending", value: stats?.pendingTasks || 0, icon: Clock, color: "text-amber-600 bg-amber-50", border: "border-l-amber-500" },
    { label: "Overdue", value: stats?.overdueTasks || 0, icon: AlertTriangle, color: "text-red-600 bg-red-50", border: "border-l-red-500" },
    { label: "Completed", value: stats?.completedTasks || 0, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-50", border: "border-l-emerald-500" },
    { label: "Clients", value: stats?.totalClients || 0, icon: Users, color: "text-violet-600 bg-violet-50", border: "border-l-violet-500" },
    { label: "Upcoming", value: stats?.upcomingDeadlines || 0, icon: FileText, color: "text-sky-600 bg-sky-50", border: "border-l-sky-500" },
  ], [stats]);

  const statusCounts = useMemo(() => ({
    pending: stats?.pendingTasks,
    ready_to_file: stats?.readyTasks,
    submitted: stats?.submittedTasks,
    completed: stats?.completedTasks,
    done: stats?.doneTasks,
  }), [stats]);

  return (
    <div className="h-full overflow-y-auto">
      <TopBar title="Dashboard" />
      <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Stat Cards — staggered entrance via CSS */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {statCards.map((card) => (
            <div
              key={card.label}
              className="stat-card-entrance stat-card border-l-4 overflow-hidden"
            >
              <div className="p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg shrink-0 transition-transform duration-300 group-hover:scale-110", card.color)}>
                    <card.icon size={18} className="sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="dashboard-stat-value">{card.value}</p>
                    <p className="section-label truncate">{card.label}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row — lazy-loaded recharts (~400KB deferred) */}
        <Suspense fallback={
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="stat-card p-4 sm:p-6 async-chart flex items-center justify-center">
              <div className="text-sm text-muted-foreground">Loading charts...</div>
            </div>
            <div className="stat-card p-4 sm:p-6 async-chart flex items-center justify-center">
              <div className="text-sm text-muted-foreground">Loading charts...</div>
            </div>
          </div>
        }>
          <DashboardCharts distribution={distribution} trends={trends} />
        </Suspense>

        {/* Status Summary */}
        <div className="summary-entrance stat-card p-4 sm:p-6 content-visibility-auto">
          <h3 className="section-label flex items-center gap-2 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Task Status Overview
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {Object.entries(STATUS_LABELS).map(([key, label]) => {
              const count = statusCounts[key as keyof typeof statusCounts] || 0;
              return (
                <div key={key} className={`rounded-lg p-3 ${STATUS_COLORS[key].replace('font-semibold', '')}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${key === 'pending' ? 'bg-amber-400' : key === 'ready_to_file' ? 'bg-sky-400' : key === 'submitted' ? 'bg-violet-400' : key === 'completed' ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                    <span className="text-xs font-medium">{label}</span>
                  </div>
                  <p className="text-xl font-bold">{count}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

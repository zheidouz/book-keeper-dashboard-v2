import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const PIE_COLORS = ["#f59e0b", "#3b82f6", "#8b5cf6", "#22c55e", "#94a3b8"];

interface DashboardChartsProps {
  distribution?: { label: string; count: number }[];
  trends?: { month: string; count: number }[];
}

export default function DashboardCharts({ distribution, trends }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 content-visibility-auto">
      <div className="chart-entrance stat-card p-4 sm:p-6">
        <h3 className="section-label flex items-center gap-2 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Task Status Distribution
        </h3>
        <div className="h-[250px] sm:h-[300px] async-chart">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distribution}
                dataKey="count"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius={80}
                isAnimationActive={false}
                label={({ label, count, percent }: { label: string; count: number; percent: number }) =>
                  `${label} ${(percent * 100).toFixed(0)}%`}
              >
                {distribution?.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-entrance stat-card p-4 sm:p-6">
        <h3 className="section-label flex items-center gap-2 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Monthly Task Trends
        </h3>
        <div className="h-[250px] sm:h-[300px] async-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trends} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

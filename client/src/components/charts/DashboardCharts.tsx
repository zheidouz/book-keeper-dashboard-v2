import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

// ── Premium gradient color palette ──
const PIE_GRADIENTS = [
  { id: "gradAmber", start: "#f59e0b", end: "#d97706" },
  { id: "gradBlue", start: "#3b82f6", end: "#2563eb" },
  { id: "gradViolet", start: "#8b5cf6", end: "#7c3aed" },
  { id: "gradEmerald", start: "#22c55e", end: "#16a34a" },
  { id: "gradSlate", start: "#94a3b8", end: "#64748b" },
];

// ── Hover offset — pushes active slice outward ──
const RADIAN = Math.PI / 180;
const renderActiveShape = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 6) * cos;
  const sy = cy + (outerRadius + 6) * sin;
  const mx = cx + (outerRadius + 16) * cos;
  const my = cy + (outerRadius + 16) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 18;
  const ey = my;
  const textAnchor = cos >= 0 ? "start" : "end";

  return (
    <g>
      {/* Glow behind active slice */}
      <defs>
        <filter id={`glow-${payload.label}`}>
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path
        d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`}
        stroke={fill}
        strokeWidth={1.5}
        fill="none"
      />
      <circle cx={ex} cy={ey} r={3} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} textAnchor={textAnchor} fill="#334155" fontSize={12} fontWeight={600}>
        {payload.label}
      </text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey + 16} textAnchor={textAnchor} fill="#64748b" fontSize={11}>
        {value} tasks ({(percent * 100).toFixed(0)}%)
      </text>
      <path
        fill={fill}
        d={`M${cx + innerRadius * cos} ${cy + innerRadius * sin}A${innerRadius} ${innerRadius} 0 0 1 ${cx + innerRadius * (cos + 0.01)} ${cy + innerRadius * (sin + 0.01)}`}
        opacity={0}
      />
    </g>
  );
};

// ── Glassmorphism tooltip ──
function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="rounded-xl border border-white/30 bg-white/80 backdrop-blur-xl px-4 py-3 shadow-xl shadow-black/5 text-sm" style={{ backdropFilter: "blur(16px)" }}>
      <p className="font-semibold text-slate-800">{d.name}</p>
      <p className="text-slate-500 mt-0.5">
        <span className="font-medium text-slate-700">{d.value}</span> tasks
      </p>
    </div>
  );
}

// ── Custom legend items with status dots ──
function CustomLegend({ payload }: any) {
  if (!payload?.length) return null;
  return (
    <div className="flex flex-wrap justify-center gap-3 mt-2">
      {payload.map((entry: any, idx: number) => (
        <div key={idx} className="flex items-center gap-1.5 text-xs">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: `linear-gradient(135deg, ${PIE_GRADIENTS[idx % PIE_GRADIENTS.length].start}, ${PIE_GRADIENTS[idx % PIE_GRADIENTS.length].end})` }}
          />
          <span className="text-slate-600">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Animated donut center ──
function DonutCenter({ total }: { total: number }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
      <span className="text-2xl sm:text-3xl font-bold text-slate-800 tabular-nums tracking-tight">
        {total}
      </span>
      <span className="text-[10px] sm:text-xs font-medium text-slate-400 uppercase tracking-wider mt-0.5">
        Total
      </span>
    </div>
  );
}

// ── Props ──
interface DashboardChartsProps {
  distribution?: { label: string; count: number }[];
  trends?: { month: string; count: number }[];
}

export default function DashboardCharts({ distribution, trends }: DashboardChartsProps) {
  const hasData = distribution?.some((d) => d.count > 0);
  const totalTasks = distribution?.reduce((s, d) => s + d.count, 0) ?? 0;
  const [activeIndex, setActiveIndex] = useState(-1);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 content-visibility-auto">
      {/* ── Donut Chart ── */}
      <div className="chart-entrance stat-card p-4 sm:p-6 relative">
        <h3 className="section-label flex items-center gap-2 mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Task Status Distribution
        </h3>
        <div className="h-[250px] sm:h-[300px] async-chart relative">
          {/* SVG gradient definitions */}
          <svg style={{ position: "absolute", width: 0, height: 0 }} aria-hidden="true">
            <defs>
              {PIE_GRADIENTS.map((g) => (
                <linearGradient key={g.id} id={g.id} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={g.start} />
                  <stop offset="100%" stopColor={g.end} />
                </linearGradient>
              ))}
            </defs>
          </svg>

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              {hasData ? (
                <>
                  <Pie
                    data={distribution}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={64}
                    outerRadius={90}
                    paddingAngle={3}
                    cornerRadius={4}
                    isAnimationActive={true}
                    animationBegin={200}
                    animationDuration={1000}
                    animationEasing="ease-out"
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    onMouseEnter={(_: any, idx: number) => setActiveIndex(idx)}
                    onMouseLeave={() => setActiveIndex(-1)}
                    stroke="none"
                  >
                    {distribution?.map((_, idx) => (
                      <Cell
                        key={idx}
                        fill={`url(#${PIE_GRADIENTS[idx % PIE_GRADIENTS.length].id})`}
                        style={{ cursor: "pointer", transition: "opacity 0.2s", outline: "none" }}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend content={<CustomLegend />} />
                </>
              ) : (
                // Empty state
                <g>
                  <circle cx="50%" cy="50%" r={80} fill="#f1f5f9" stroke="#e2e8f0" strokeWidth={1} />
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fill="#94a3b8" fontSize={13}>
                    No data yet
                  </text>
                </g>
              )}
            </PieChart>
          </ResponsiveContainer>

          <DonutCenter total={totalTasks} />
        </div>
      </div>

      {/* ── Bar Chart ── */}
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
              <Tooltip content={<ChartTooltip />} />
              <Bar
                dataKey="count"
                radius={[6, 6, 0, 0]}
                maxBarSize={44}
                isAnimationActive={true}
                animationBegin={400}
                animationDuration={800}
                animationEasing="ease-out"
                fill="url(#gradBar)"
                stroke="none"
              >
                <defs>
                  <linearGradient id="gradBar" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#2563eb" />
                  </linearGradient>
                </defs>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

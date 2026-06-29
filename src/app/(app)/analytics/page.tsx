"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import {
  TrendingUp, TrendingDown, AlertTriangle, Clock,
  ChevronRight, RefreshCw, Download, Filter,
  FolderKanban, CircleDollarSign, BarChart3, AlertCircle,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { getFlag } from "@/lib/feature-flags";

// ─── Types ────────────────────────────────────────────────────────────────────

type Period = "30d" | "90d" | "12m" | "all";

interface PortfolioKPIs {
  contractValue: number;
  certifiedToDate: number;
  paidToDate: number;
  avgMarginPct: number;
  activeCEs: number;
  overduePayments: number;
}

interface RevenueByMonth {
  month: string;
  [projectName: string]: number | string;
}

interface CEPipelineItem {
  name: string;
  value: number;
  fill: string;
}

interface MarginTrendItem {
  month: string;
  margin: number;
}

interface PaymentPerformanceItem {
  project: string;
  avgDays: number;
}

interface ProjectHealth {
  id: string;
  name: string;
  contractSum: number;
  percentComplete: number;
  marginPct: number;
  healthScore: number;
  cesOpen: number;
  paymentStatus: string;
}

// ─── Seed / fallback data ─────────────────────────────────────────────────────

const SEED_KPIS: PortfolioKPIs = {
  contractValue: 24_850_000,
  certifiedToDate: 16_420_000,
  paidToDate: 14_880_000,
  avgMarginPct: 15.4,
  activeCEs: 23,
  overduePayments: 4,
};

const SEED_REVENUE: RevenueByMonth[] = [
  { month: "Jan", Eastside: 420000, Meridian: 310000, Thornfield: 280000, Harlow: 190000, Whitfield: 140000 },
  { month: "Feb", Eastside: 480000, Meridian: 340000, Thornfield: 310000, Harlow: 210000, Whitfield: 160000 },
  { month: "Mar", Eastside: 510000, Meridian: 390000, Thornfield: 340000, Harlow: 230000, Whitfield: 180000 },
  { month: "Apr", Eastside: 530000, Meridian: 420000, Thornfield: 360000, Harlow: 250000, Whitfield: 200000 },
  { month: "May", Eastside: 490000, Meridian: 410000, Thornfield: 380000, Harlow: 270000, Whitfield: 220000 },
  { month: "Jun", Eastside: 520000, Meridian: 430000, Thornfield: 400000, Harlow: 290000, Whitfield: 240000 },
];

const PROJECT_COLORS = ["#2563eb", "#16a34a", "#d97706", "#7c3aed", "#0891b2"];
const TOP_PROJECTS = ["Eastside", "Meridian", "Thornfield", "Harlow", "Whitfield"];

const SEED_CE_PIPELINE: CEPipelineItem[] = [
  { name: "Quotation Submitted", value: 8, fill: "#d97706" },
  { name: "Accepted", value: 9, fill: "#16a34a" },
  { name: "Implemented", value: 12, fill: "#2563eb" },
];

const SEED_MARGIN_TREND: MarginTrendItem[] = [
  { month: "Jan", margin: 13.2 },
  { month: "Feb", margin: 13.8 },
  { month: "Mar", margin: 14.1 },
  { month: "Apr", margin: 14.9 },
  { month: "May", margin: 15.1 },
  { month: "Jun", margin: 15.4 },
];

const SEED_PAYMENT_PERF: PaymentPerformanceItem[] = [
  { project: "Eastside", avgDays: 24 },
  { project: "Meridian", avgDays: 31 },
  { project: "Thornfield", avgDays: 47 },
  { project: "Harlow", avgDays: 19 },
  { project: "Whitfield", avgDays: 38 },
];

const SEED_PROJECT_HEALTH: ProjectHealth[] = [
  { id: "proj-001", name: "Eastside Residential Block A", contractSum: 6_200_000, percentComplete: 72, marginPct: 16.4, healthScore: 84, cesOpen: 3, paymentStatus: "Current" },
  { id: "proj-002", name: "Meridian Office Park Phase 2", contractSum: 4_850_000, percentComplete: 58, marginPct: 14.2, healthScore: 68, cesOpen: 5, paymentStatus: "Delayed" },
  { id: "proj-003", name: "Thornfield Commercial Hub", contractSum: 5_100_000, percentComplete: 45, marginPct: 11.8, healthScore: 49, cesOpen: 9, paymentStatus: "Overdue" },
  { id: "proj-004", name: "Harlow Civic Centre Refurb", contractSum: 3_900_000, percentComplete: 88, marginPct: 17.1, healthScore: 91, cesOpen: 2, paymentStatus: "Current" },
  { id: "proj-005", name: "Whitfield Leisure Centre", contractSum: 2_400_000, percentComplete: 95, marginPct: 15.8, healthScore: 76, cesOpen: 1, paymentStatus: "Retention" },
  { id: "proj-006", name: "Northgate Retail Park", contractSum: 2_400_000, percentComplete: 22, marginPct: 9.4, healthScore: 38, cesOpen: 3, paymentStatus: "Current" },
];

const TOOLTIP_STYLE = {
  background: "var(--bg-surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  fontSize: "12px",
  color: "var(--text-primary)",
  boxShadow: "var(--shadow-sm)",
};

// ─── Health Score helpers ─────────────────────────────────────────────────────

function healthColor(score: number): string {
  if (score > 75) return "var(--success)";
  if (score >= 50) return "var(--warning)";
  return "var(--danger)";
}

function healthRowStyle(score: number): React.CSSProperties {
  if (score > 75) return { background: "var(--success-bg)" };
  if (score >= 50) return { background: "var(--warning-bg)" };
  return { background: "var(--danger-bg)" };
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({ label, value, sub, trend, icon, iconColor }: {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  iconColor?: string;
}) {
  return (
    <div className="kpi-card">
      <div className="flex items-center justify-between mb-1">
        <div className="kpi-label">{label}</div>
        {icon && (
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: (iconColor ?? "var(--primary)") + "18", color: iconColor ?? "var(--primary)" }}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="kpi-value">{value}</div>
      {sub && (
        <div className="flex items-center gap-1 mt-1">
          {trend === "up" && <TrendingUp size={11} style={{ color: "var(--success)" }} />}
          {trend === "down" && <TrendingDown size={11} style={{ color: "var(--danger)" }} />}
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{sub}</span>
        </div>
      )}
    </div>
  );
}

// ─── Feature gate ─────────────────────────────────────────────────────────────

function FeatureGate({ flag, children }: { flag: string; children: React.ReactNode }) {
  const enabled = getFlag("cross_project_analytics");
  if (!enabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--bg-subtle)" }}>
          <BarChart3 size={24} style={{ color: "var(--text-muted)" }} />
        </div>
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Portfolio Analytics</h2>
        <p className="text-sm max-w-sm text-center" style={{ color: "var(--text-muted)" }}>
          Cross-project analytics is an Enterprise feature. Upgrade your plan to access portfolio-level insights.
        </p>
        <button className="btn btn-primary btn-sm">Upgrade to Enterprise</button>
      </div>
    );
  }
  return <>{children}</>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("90d");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [kpis, setKpis] = useState<PortfolioKPIs>(SEED_KPIS);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<ProjectHealth[]>(SEED_PROJECT_HEALTH);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: projectRows } = await supabase
        .from("projects")
        .select("id, name, contract_sum, percent_complete, status")
        .neq("status", "archived");

      if (projectRows && projectRows.length > 0) {
        const totalCV = projectRows.reduce((s: number, p: { contract_sum: number }) => s + (p.contract_sum ?? 0), 0);
        setKpis(prev => ({ ...prev, contractValue: totalCV }));
      }
    } catch {
      // keep seed
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, period]);

  const filteredProjects = projectFilter === "all"
    ? projects
    : projects.filter(p => p.id === projectFilter);

  return (
    <FeatureGate flag="cross_project_analytics">
      <div className="flex flex-col min-h-full">
        <div className="page-header">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Portfolio Analytics</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
              Cross-project performance · {SEED_PROJECT_HEALTH.length} active projects
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <select
              className="form-input h-8 text-sm"
              value={period}
              onChange={e => setPeriod(e.target.value as Period)}
            >
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="12m">Last 12 months</option>
              <option value="all">All time</option>
            </select>
            <select
              className="form-input h-8 text-sm"
              value={projectFilter}
              onChange={e => setProjectFilter(e.target.value)}
            >
              <option value="all">All Projects</option>
              {SEED_PROJECT_HEALTH.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <button className="btn btn-secondary btn-sm" onClick={load}>
              <RefreshCw size={13} />Refresh
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => router.push("/analytics/board-pack")}
            >
              <Download size={13} />Board Pack
            </button>
          </div>
        </div>

        <div className="page-content flex-1 flex flex-col gap-6">
          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="kpi-card gap-2">
                  <div className="skeleton h-2.5 w-24 rounded" />
                  <div className="skeleton h-7 w-32 rounded" />
                </div>
              ))
            ) : (
              <>
                <KPICard
                  label="Portfolio Contract Value"
                  value={formatCurrency(kpis.contractValue)}
                  sub="Across all active projects"
                  icon={<FolderKanban size={14} />}
                  iconColor="var(--primary)"
                />
                <KPICard
                  label="Total Certified to Date"
                  value={formatCurrency(kpis.certifiedToDate)}
                  sub={`${((kpis.certifiedToDate / kpis.contractValue) * 100).toFixed(0)}% of portfolio`}
                  trend="up"
                  icon={<BarChart3 size={14} />}
                  iconColor="var(--success)"
                />
                <KPICard
                  label="Total Paid to Date"
                  value={formatCurrency(kpis.paidToDate)}
                  sub="Across paid applications"
                  trend="up"
                  icon={<CircleDollarSign size={14} />}
                  iconColor="var(--cyan)"
                />
                <KPICard
                  label="Average Margin %"
                  value={`${kpis.avgMarginPct.toFixed(1)}%`}
                  sub="Weighted portfolio average"
                  trend="up"
                  icon={<TrendingUp size={14} />}
                  iconColor="var(--violet)"
                />
                <KPICard
                  label="Active CEs"
                  value={String(kpis.activeCEs)}
                  sub="Not implemented/withdrawn"
                  trend="neutral"
                  icon={<AlertTriangle size={14} />}
                  iconColor="var(--warning)"
                />
                <KPICard
                  label="Overdue Payments"
                  value={String(kpis.overduePayments)}
                  sub="Past final payment date"
                  trend="down"
                  icon={<AlertCircle size={14} />}
                  iconColor="var(--danger)"
                />
              </>
            )}
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-5 flex flex-col gap-4">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Revenue by Month</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={SEED_REVENUE} margin={{ top: 0, right: 4, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={TOOLTIP_STYLE} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
                  {TOP_PROJECTS.map((proj, i) => (
                    <Bar key={proj} dataKey={proj} stackId="a" fill={PROJECT_COLORS[i]} radius={i === TOP_PROJECTS.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-5 flex flex-col gap-4">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>CE Pipeline by Status</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={SEED_CE_PIPELINE}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {SEED_CE_PIPELINE.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${v} CEs`, ""]} contentStyle={TOOLTIP_STYLE} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-5 flex flex-col gap-4">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Margin Trend — Portfolio</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={SEED_MARGIN_TREND} margin={{ top: 0, right: 4, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} domain={[10, 20]} />
                  <Tooltip formatter={(v: number) => [`${v}%`, "Margin"]} contentStyle={TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="margin" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3, fill: "var(--primary)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card p-5 flex flex-col gap-4">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Payment Performance (Avg Days)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={SEED_PAYMENT_PERF} margin={{ top: 0, right: 4, bottom: 0, left: -16 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                  <YAxis dataKey="project" type="category" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} width={64} />
                  <Tooltip formatter={(v: number) => [`${v} days`, "Avg payment time"]} contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="avgDays" fill="var(--primary)" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Project Health Table */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between p-5 pb-4">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Project Health Overview</h3>
              <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--success)" }} />Healthy (&gt;75)</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--warning)" }} />At Risk (50–75)</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full inline-block" style={{ background: "var(--danger)" }} />Critical (&lt;50)</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th className="text-right">Contract Sum</th>
                    <th className="text-right">% Complete</th>
                    <th className="text-right">Margin %</th>
                    <th className="text-center">Health Score</th>
                    <th className="text-center">CEs Open</th>
                    <th>Payment Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map(p => (
                    <tr
                      key={p.id}
                      className="cursor-pointer hover:opacity-90 transition-opacity"
                      style={healthRowStyle(p.healthScore)}
                      onClick={() => router.push(`/projects/${p.id}`)}
                    >
                      <td className="font-medium">{p.name}</td>
                      <td className="text-right tabular-nums">{formatCurrency(p.contractSum)}</td>
                      <td className="text-right tabular-nums">{p.percentComplete}%</td>
                      <td className={cn("text-right font-semibold tabular-nums", p.marginPct >= 15 ? "text-[var(--success)]" : p.marginPct >= 12 ? "text-[var(--warning)]" : "text-[var(--danger)]")}>
                        {p.marginPct.toFixed(1)}%
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ background: healthColor(p.healthScore) }} />
                          <span className="font-bold tabular-nums" style={{ color: healthColor(p.healthScore) }}>
                            {p.healthScore}
                          </span>
                        </div>
                      </td>
                      <td className="text-center">
                        <span className={cn("badge", p.cesOpen > 5 ? "chip-danger" : p.cesOpen > 2 ? "chip-warning" : "chip-success")}>
                          {p.cesOpen}
                        </span>
                      </td>
                      <td>
                        <span className={cn("badge", p.paymentStatus === "Current" ? "chip-success" : p.paymentStatus === "Delayed" ? "chip-warning" : p.paymentStatus === "Overdue" ? "chip-danger" : "chip-muted")}>
                          {p.paymentStatus}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-icon btn-sm">
                          <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </FeatureGate>
  );
}

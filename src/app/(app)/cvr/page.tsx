"use client";

import { useState } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Plus,
  Download,
  Lock,
  Unlock,
  Sparkles,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { cn, formatCurrency, formatPercent } from "@/lib/utils";

/* ─── Mock data ─────────────────────────────────────────────────────── */

const portfolioKPIs = {
  totalContractValue: 48_750_000,
  totalRevenueRecognised: 31_420_000,
  totalCostToDate: 26_180_000,
  portfolioMargin: 16.7,
};

const marginByProject = [
  { project: "Regent Quarter", margin: 22.4, value: 12_400_000 },
  { project: "Southbank Resi", margin: 18.1, value: 9_800_000 },
  { project: "Kings Cross Dev", margin: 14.5, value: 8_200_000 },
  { project: "Canary Wharf Fit-Out", margin: 11.2, value: 6_100_000 },
  { project: "Wembley Leisure", margin: 8.7, value: 4_300_000 },
  { project: "Greenwich Mixed Use", margin: 19.3, value: 7_620_000 },
];

const riskExposure = [
  { name: "Low Risk", value: 35, color: "#10B981" },
  { name: "Medium Risk", value: 42, color: "#F59E0B" },
  { name: "High Risk", value: 23, color: "#EF4444" },
];

const periodComparison = [
  {
    id: "p1",
    projectId: "regent-quarter",
    project: "Regent Quarter",
    period: "Apr 2026",
    contractValue: 12_400_000,
    revenue: 8_100_000,
    cost: 6_290_000,
    margin: 22.4,
    riskAllowance: 310_000,
    status: "Locked",
  },
  {
    id: "p2",
    projectId: "southbank-resi",
    project: "Southbank Resi",
    period: "Apr 2026",
    contractValue: 9_800_000,
    revenue: 6_420_000,
    cost: 5_260_000,
    margin: 18.1,
    riskAllowance: 220_000,
    status: "Open",
  },
  {
    id: "p3",
    projectId: "kings-cross-dev",
    project: "Kings Cross Dev",
    period: "Apr 2026",
    contractValue: 8_200_000,
    revenue: 5_300_000,
    cost: 4_532_000,
    margin: 14.5,
    riskAllowance: 185_000,
    status: "Open",
  },
  {
    id: "p4",
    projectId: "canary-wharf",
    project: "Canary Wharf Fit-Out",
    period: "Mar 2026",
    contractValue: 6_100_000,
    revenue: 4_120_000,
    cost: 3_657_000,
    margin: 11.2,
    riskAllowance: 95_000,
    status: "Locked",
  },
  {
    id: "p5",
    projectId: "wembley-leisure",
    project: "Wembley Leisure",
    period: "Apr 2026",
    contractValue: 4_300_000,
    revenue: 2_100_000,
    cost: 1_917_000,
    margin: 8.7,
    riskAllowance: 140_000,
    status: "Forecast",
  },
];

/* ─── View types ─────────────────────────────────────────────────────── */

type View = "portfolio" | "table" | "period" | "margin" | "risk";

const VIEWS: { id: View; label: string }[] = [
  { id: "portfolio", label: "Portfolio Dashboard" },
  { id: "table", label: "Project CVR Table" },
  { id: "period", label: "Period View" },
  { id: "margin", label: "Margin Movement" },
  { id: "risk", label: "Risk View" },
];

/* ─── Status chip ─────────────────────────────────────────────────────── */

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    Locked: "chip-info",
    Open: "chip-success",
    Forecast: "chip-violet",
  };
  return (
    <span className={cn("badge", map[status] ?? "chip-muted")}>
      {status}
    </span>
  );
}

/* ─── Portfolio view ─────────────────────────────────────────────────── */

function PortfolioView() {
  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card">
          <span className="kpi-label">Total Contract Value</span>
          <span className="kpi-value">{formatCurrency(portfolioKPIs.totalContractValue)}</span>
          <span className="text-xs text-[var(--text-muted)]">6 active projects</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Revenue Recognised</span>
          <span className="kpi-value">{formatCurrency(portfolioKPIs.totalRevenueRecognised)}</span>
          <span className="text-xs" style={{ color: "var(--success)" }}>64.4% complete</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Cost to Date</span>
          <span className="kpi-value">{formatCurrency(portfolioKPIs.totalCostToDate)}</span>
          <span className="text-xs text-[var(--text-muted)]">of recognised revenue</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Portfolio Margin %</span>
          <span className="kpi-value" style={{ color: "var(--success)" }}>
            {portfolioKPIs.portfolioMargin}%
          </span>
          <span className="text-xs" style={{ color: "var(--success)" }}>+1.2% vs last period</span>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Margin by project bar chart */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Margin % by Project</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={marginByProject} margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="project"
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={52}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                formatter={(val: number) => [`${val}%`, "Margin"]}
                contentStyle={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="margin" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk donut */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Risk Exposure</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={riskExposure}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {riskExposure.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{value}</span>
                )}
              />
              <Tooltip
                formatter={(v: number) => [`${v}%`, "Exposure"]}
                contentStyle={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Period comparison table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Last 3 Periods — All Projects</h3>
          <span className="text-xs text-[var(--text-muted)]">Showing current period</span>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Period</th>
                <th className="text-right">Contract Value</th>
                <th className="text-right">Revenue Recognised</th>
                <th className="text-right">Cost to Date</th>
                <th className="text-right">Margin %</th>
                <th className="text-right">Risk Allowance</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {periodComparison.map((row) => (
                <tr key={row.id}>
                  <td className="font-medium">{row.project}</td>
                  <td className="text-[var(--text-muted)]">{row.period}</td>
                  <td className="text-right">{formatCurrency(row.contractValue)}</td>
                  <td className="text-right">{formatCurrency(row.revenue)}</td>
                  <td className="text-right">{formatCurrency(row.cost)}</td>
                  <td className="text-right">
                    <span
                      className={cn(
                        "font-semibold",
                        row.margin >= 15
                          ? "text-[var(--success)]"
                          : row.margin >= 10
                          ? "text-[var(--warning)]"
                          : "text-[var(--danger)]"
                      )}
                    >
                      {row.margin}%
                    </span>
                  </td>
                  <td className="text-right text-[var(--text-muted)]">{formatCurrency(row.riskAllowance)}</td>
                  <td>
                    <StatusChip status={row.status} />
                  </td>
                  <td>
                    <Link
                      href={`/app/cvr/${row.projectId}`}
                      className="btn btn-ghost btn-sm"
                    >
                      <ExternalLink size={13} />
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── Table view ─────────────────────────────────────────────────────── */

function TableView() {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Project</th>
              <th className="text-right">Contract Value</th>
              <th className="text-right">Revenue Recognised</th>
              <th className="text-right">Cost to Date</th>
              <th className="text-right">Margin %</th>
              <th className="text-right">Risk Allowance</th>
              <th>Period</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {periodComparison.map((row) => (
              <tr key={row.id}>
                <td className="font-medium">
                  <Link href={`/app/cvr/${row.projectId}`} className="hover:text-[var(--primary)] transition-colors">
                    {row.project}
                  </Link>
                </td>
                <td className="text-right">{formatCurrency(row.contractValue)}</td>
                <td className="text-right">{formatCurrency(row.revenue)}</td>
                <td className="text-right">{formatCurrency(row.cost)}</td>
                <td className="text-right">
                  <span
                    className={cn(
                      "font-semibold",
                      row.margin >= 15
                        ? "text-[var(--success)]"
                        : row.margin >= 10
                        ? "text-[var(--warning)]"
                        : "text-[var(--danger)]"
                    )}
                  >
                    {row.margin}%
                  </span>
                </td>
                <td className="text-right text-[var(--text-muted)]">{formatCurrency(row.riskAllowance)}</td>
                <td className="text-[var(--text-muted)]">{row.period}</td>
                <td>
                  <StatusChip status={row.status} />
                </td>
                <td>
                  <div className="flex items-center gap-1">
                    <Link href={`/app/cvr/${row.projectId}`} className="btn btn-ghost btn-sm">
                      Open
                    </Link>
                    {row.status === "Open" ? (
                      <button type="button" className="btn btn-ghost btn-sm">
                        <Lock size={12} /> Lock
                      </button>
                    ) : row.status === "Locked" ? (
                      <button type="button" className="btn btn-ghost btn-sm">
                        <Unlock size={12} /> Unlock
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Period view ─────────────────────────────────────────────────────── */

function PeriodView() {
  const periods = ["Apr 2026", "Mar 2026", "Feb 2026"];
  const [selectedPeriod, setSelectedPeriod] = useState("Apr 2026");

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-[var(--text-secondary)]">Period:</label>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="form-input w-40"
        >
          {periods.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
      </div>
      <TableView />
    </div>
  );
}

/* ─── Margin movement view ───────────────────────────────────────────── */

function MarginMovementView() {
  const movements = [
    { item: "Revenue uplift — Southbank Resi", prev: 17.4, current: 18.1, change: 0.7, reason: "Additional works agreed" },
    { item: "Cost overrun — Wembley Leisure", prev: 10.2, current: 8.7, change: -1.5, reason: "Steel procurement variance" },
    { item: "Risk release — Kings Cross", prev: 13.8, current: 14.5, change: 0.7, reason: "Risk event mitigated" },
    { item: "Contra charge — Canary Wharf", prev: 12.1, current: 11.2, change: -0.9, reason: "Subcontractor contra applied" },
  ];

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b border-[var(--border)]">
        <h3 className="text-sm font-semibold">Margin Movement — Portfolio (Period on Period)</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Item</th>
              <th className="text-right">Previous Period</th>
              <th className="text-right">This Period</th>
              <th className="text-right">Change</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((m, i) => (
              <tr key={i}>
                <td className="font-medium">{m.item}</td>
                <td className="text-right">{m.prev}%</td>
                <td className="text-right">{m.current}%</td>
                <td className="text-right">
                  <span
                    className={cn(
                      "font-semibold",
                      m.change > 0 ? "text-[var(--success)]" : "text-[var(--danger)]"
                    )}
                  >
                    {m.change > 0 ? "+" : ""}{m.change}%
                  </span>
                </td>
                <td className="text-[var(--text-muted)]">{m.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Risk view ───────────────────────────────────────────────────────── */

function RiskView() {
  const risks = [
    { project: "Regent Quarter", item: "Ground condition delay", probability: "Low", impact: "£45,000", riskValue: "£9,000", mitigation: "Prelim allowance allocated" },
    { project: "Southbank Resi", item: "Subcontractor default risk", probability: "Medium", impact: "£120,000", riskValue: "£60,000", mitigation: "Performance bond in place" },
    { project: "Kings Cross Dev", item: "Programme overrun — M&E", probability: "Medium", impact: "£85,000", riskValue: "£42,500", mitigation: "Acceleration plan agreed" },
    { project: "Canary Wharf Fit-Out", item: "Material price escalation", probability: "High", impact: "£55,000", riskValue: "£38,500", mitigation: "Fixed price PO issued" },
    { project: "Wembley Leisure", item: "Structural steel variance", probability: "High", impact: "£140,000", riskValue: "£98,000", mitigation: "Variation being assessed" },
  ];

  const probChip = (p: string) => {
    if (p === "Low") return "chip-success";
    if (p === "Medium") return "chip-warning";
    return "chip-danger";
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="kpi-card border-l-4" style={{ borderLeftColor: "var(--success)" }}>
          <span className="kpi-label">Low Risk Items</span>
          <span className="kpi-value text-[var(--success)]">1</span>
        </div>
        <div className="kpi-card border-l-4" style={{ borderLeftColor: "var(--warning)" }}>
          <span className="kpi-label">Medium Risk Items</span>
          <span className="kpi-value text-[var(--warning)]">2</span>
        </div>
        <div className="kpi-card border-l-4" style={{ borderLeftColor: "var(--danger)" }}>
          <span className="kpi-label">High Risk Items</span>
          <span className="kpi-value text-[var(--danger)]">2</span>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Risk Item</th>
                <th>Probability</th>
                <th className="text-right">Impact Value</th>
                <th className="text-right">Risk Value</th>
                <th>Mitigation</th>
              </tr>
            </thead>
            <tbody>
              {risks.map((r, i) => (
                <tr key={i}>
                  <td className="font-medium">{r.project}</td>
                  <td>{r.item}</td>
                  <td><span className={cn("badge", probChip(r.probability))}>{r.probability}</span></td>
                  <td className="text-right">{r.impact}</td>
                  <td className="text-right font-medium">{r.riskValue}</td>
                  <td className="text-[var(--text-muted)]">{r.mitigation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ───────────────────────────────────────────────────────── */

export default function CVRPage() {
  const [activeView, setActiveView] = useState<View>("portfolio");

  return (
    <>
      {/* Page header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--primary-light)" }}
          >
            <BarChart3 size={18} style={{ color: "var(--primary)" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold">CVR</h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Contract Value Reconciliation — portfolio overview
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" className="btn btn-ghost btn-sm">
            <Sparkles size={14} />
            Ask AI to Explain Movement
          </button>
          <button type="button" className="btn btn-secondary btn-sm">
            <Download size={14} />
            Export CVR
          </button>
          <button type="button" className="btn btn-primary btn-sm">
            <Plus size={14} />
            New CVR Period
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="tab-bar mt-4">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            className={cn("tab-item", activeView === v.id && "active")}
            onClick={() => setActiveView(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="page-content">
        {activeView === "portfolio" && <PortfolioView />}
        {activeView === "table" && <TableView />}
        {activeView === "period" && <PeriodView />}
        {activeView === "margin" && <MarginMovementView />}
        {activeView === "risk" && <RiskView />}
      </div>
    </>
  );
}

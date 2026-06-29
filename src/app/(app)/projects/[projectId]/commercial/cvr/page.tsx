"use client";

import { useState } from "react";
import {
  RefreshCw,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, Bar,
} from "recharts";
import { cn, formatCurrency } from "@/lib/utils";

// ─── Chart Data ───────────────────────────────────────────────────────────────

const CVR_TREND_DATA = [
  { month: "Jul 25", contractValue: 2950, bcws: 180,  acwp: 140,  eac: 2641 },
  { month: "Aug 25", contractValue: 2950, bcws: 360,  acwp: 295,  eac: 2641 },
  { month: "Sep 25", contractValue: 2950, bcws: 540,  acwp: 450,  eac: 2641 },
  { month: "Oct 25", contractValue: 2950, bcws: 720,  acwp: 620,  eac: 2641 },
  { month: "Nov 25", contractValue: 2950, bcws: 900,  acwp: 780,  eac: 2641 },
  { month: "Dec 25", contractValue: 2950, bcws: 1050, acwp: 940,  eac: 2641 },
  { month: "Jan 26", contractValue: 2950, bcws: 1200, acwp: 1080, eac: 2641 },
  { month: "Feb 26", contractValue: 2950, bcws: 1340, acwp: 1190, eac: 2641 },
  { month: "Mar 26", contractValue: 2950, bcws: 1450, acwp: 1310, eac: 2641 },
  { month: "Apr 26", contractValue: 2950, bcws: 1550, acwp: 1400, eac: 2641 },
  { month: "May 26", contractValue: 2950, bcws: 1640, acwp: 1482, eac: 2641 },
  { month: "Jun 26", contractValue: 2950, bcws: 1720, acwp: 1560, eac: 2641 },
];

// Waterfall data: each bar needs a "start" (invisible spacer) and "value"
const MARGIN_BRIDGE_DATA = [
  { name: "Contract Margin",    start: 0,   value: 29,   fill: "#10B981", label: "+£29K" },
  { name: "Approved Changes",   start: 29,  value: 42,   fill: "#10B981", label: "+£42K" },
  { name: "Pending Changes",    start: 71,  value: 18,   fill: "#10B981", label: "+£18K" },
  { name: "Forecast Savings",   start: 89,  value: 27,   fill: "#10B981", label: "+£27K" },
  { name: "Cost Overruns",      start: 40,  value: -76,  fill: "#EF4444", label: "-£76K" },
  { name: "Risk/Contingency",   start: 18,  value: -22,  fill: "#EF4444", label: "-£22K" },
  { name: "Unrecovered Costs",  start: 2,   value: -16,  fill: "#EF4444", label: "-£16K" },
  { name: "Forecast Margin",    start: 0,   value: 309,  fill: "#3B5EE8", label: "£309K" },
];

// Stacked waterfall: invisible spacer + colored bar
const bridgeChartData = MARGIN_BRIDGE_DATA.map((d) => ({
  name: d.name,
  spacer: d.value >= 0 ? d.start : d.start + d.value,
  bar: Math.abs(d.value),
  fill: d.fill,
  label: d.label,
}));

const DONUT_DATA = [
  { name: "0-30 days",  value: 182, color: "#10B981" },
  { name: "31-60 days", value: 164, color: "#F59E0B" },
  { name: "61-90 days", value: 112, color: "#f97316" },
  { name: "90+ days",   value: 83,  color: "#EF4444" },
];

const COST_BREAKDOWN = [
  { pkg: "Substructure",    budget: 420, actual: 215.6, forecast: 410, variance: -10, pct: "13.9%" },
  { pkg: "Superstructure",  budget: 680, actual: 372.8, forecast: 655, variance: -25, pct: "22.2%" },
  { pkg: "Facade",          budget: 395, actual: 188.9, forecast: 410, variance: 15,  pct: "13.9%" },
  { pkg: "MEP",             budget: 730, actual: 378.6, forecast: 715, variance: -15, pct: "24.2%" },
  { pkg: "Interiors",       budget: 420, actual: 215.5, forecast: 405, variance: -15, pct: "13.7%" },
  { pkg: "External Works",  budget: 305, actual: 111.0, forecast: 285, variance: -20, pct: "9.7%" },
  { pkg: "Prelims & OH&P",  budget: 0,   actual: 0,     forecast: 51.2, variance: 0,  pct: "1.7%" },
];

const TOOLTIP_STYLE = {
  background: "var(--bg-surface)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 11,
  color: "var(--text-primary)",
};

const KPI_CARDS = [
  { label: "Contract Value",        value: formatCurrency(2950000),  sub: "Baseline — 100.0%",        variant: "" },
  { label: "Cost to Date",          value: formatCurrency(1482350),  sub: "50.3% of Contract",        variant: "" },
  { label: "Cost to Complete",      value: formatCurrency(1067850),  sub: "36.2%",                    variant: "" },
  { label: "Forecast Final Cost",   value: formatCurrency(2641200),  sub: "89.5%",                    variant: "" },
  { label: "Forecast Final Account",value: formatCurrency(2724000),  sub: "92.3%",                    variant: "" },
  { label: "Forecast Margin",       value: formatCurrency(308800),   sub: "10.5%",                    variant: "success" },
  { label: "Variance vs Budget",    value: formatCurrency(83200),    sub: "2.8% Over Budget",         variant: "danger" },
  { label: "Cash Position",         value: formatCurrency(784650),   sub: "Net Inflow",               variant: "success" },
];

// Custom bar shape to colour individually
interface BarProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  payload?: { fill: string };
}

function ColoredBar(props: BarProps) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;
  const fill = payload?.fill ?? "#3B5EE8";
  return <rect x={x} y={y} width={width} height={height} fill={fill} rx={3} />;
}

export default function CVRPage() {
  const [faTab, setFaTab] = useState<"final-account" | "final-accounts">("final-account");

  return (
    <div className="flex flex-col gap-5">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {KPI_CARDS.map((k) => (
          <div key={k.label} className="card p-4 flex flex-col gap-1">
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{k.label}</span>
            <span
              className="text-base font-bold"
              style={{
                color:
                  k.variant === "success" ? "var(--success)"
                  : k.variant === "danger" ? "var(--danger)"
                  : "var(--text-primary)",
              }}
            >
              {k.value}
            </span>
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{k.sub}</span>
          </div>
        ))}
      </div>

      {/* Last Updated */}
      <div className="flex items-center justify-between">
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          Last updated: 09 May 2026, 09:41 · By James Walker
        </span>
        <button className="btn btn-secondary btn-sm text-xs">
          <RefreshCw size={12} />Refresh Data
        </button>
      </div>

      {/* Main 2-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT 2/3 */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* CVR Trend Chart */}
          <div className="card p-5">
            <h4 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>CVR Trend (Cumulative)</h4>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={CVR_TREND_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}K`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`£${v}K`, ""]} />
                <Legend iconType="line" iconSize={16} wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="contractValue" name="Contract Value" stroke="#94A3B8" strokeDasharray="6 3" fill="transparent" strokeWidth={2} />
                <Area type="monotone" dataKey="bcws" name="BCWS (Budgeted)" stroke="#60a5fa" strokeDasharray="4 2" fill="transparent" strokeWidth={2} />
                <Area type="monotone" dataKey="acwp" name="ACWP (Actual)" stroke="#10B981" fill="#10B98120" strokeWidth={2} />
                <Area type="monotone" dataKey="eac" name="EAC (Forecast)" stroke="#3B5EE8" fill="transparent" strokeWidth={2} strokeDasharray="8 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Margin Bridge Waterfall */}
          <div className="card p-5">
            <h4 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Margin Bridge</h4>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={bridgeChartData} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `£${v}K`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, name: string) => name === "bar" ? [`£${v}K`, "Value"] : [v, ""]} />
                <Bar dataKey="spacer" stackId="a" fill="transparent" />
                <Bar dataKey="bar" stackId="a" shape={(props: BarProps) => <ColoredBar {...props} />} radius={[3, 3, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Final Account Summary */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              {(["final-account", "final-accounts"] as const).map((t) => (
                <button
                  key={t}
                  className={cn("text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors")}
                  style={{
                    background: faTab === t ? "var(--primary)" : "var(--bg-muted)",
                    color: faTab === t ? "#fff" : "var(--text-muted)",
                  }}
                  onClick={() => setFaTab(t)}
                >
                  {t === "final-account" ? "Final Account" : "Final Accounts"}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: "Target FA",               value: formatCurrency(2950000) },
                { label: "Forecast FA",             value: formatCurrency(2724000) },
                { label: "Agreed to Date",          value: formatCurrency(2183000) },
                { label: "Unresolved / Negotiation",value: formatCurrency(541000) },
                { label: "% Agreed",                value: "80.3%" },
              ].map((r) => (
                <div key={r.label} className="flex flex-col gap-0.5">
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{r.label}</span>
                  <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT 1/3 */}
        <div className="flex flex-col gap-4">
          {/* Cost Breakdown */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
              <h4 className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Cost Breakdown by Package</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table text-xs">
                <thead>
                  <tr>
                    <th>Package</th>
                    <th className="text-right">Budget</th>
                    <th className="text-right">Actual</th>
                    <th className="text-right">Forecast</th>
                    <th className="text-right">Var</th>
                    <th className="text-right">%</th>
                  </tr>
                </thead>
                <tbody>
                  {COST_BREAKDOWN.map((r) => (
                    <tr key={r.pkg}>
                      <td className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{r.pkg}</td>
                      <td className="text-right text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                        {r.budget > 0 ? `£${r.budget}k` : "—"}
                      </td>
                      <td className="text-right text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                        {r.actual > 0 ? `£${r.actual}k` : "—"}
                      </td>
                      <td className="text-right text-xs tabular-nums font-semibold" style={{ color: "var(--text-primary)" }}>
                        {r.forecast > 0 ? `£${r.forecast}k` : "—"}
                      </td>
                      <td
                        className="text-right text-xs tabular-nums font-semibold"
                        style={{ color: r.variance > 0 ? "var(--danger)" : r.variance < 0 ? "var(--success)" : "var(--text-muted)" }}
                      >
                        {r.variance !== 0 ? `${r.variance > 0 ? "+" : ""}£${r.variance}k` : "—"}
                      </td>
                      <td className="text-right text-xs" style={{ color: "var(--text-muted)" }}>{r.pct}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI Recovery Opportunities */}
          <div className="card p-4" style={{ borderColor: "#ede9fe" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold" style={{ color: "#8B5CF6" }}>AI Insight — Recovery Opportunities</span>
              <span className="badge text-[10px]" style={{ background: "#8B5CF6", color: "#fff" }}>New</span>
            </div>
            <div className="flex flex-col gap-0.5 mb-3">
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Potential Recoveries</span>
              <span className="text-lg font-bold" style={{ color: "#8B5CF6" }}>{formatCurrency(96450)}</span>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>3 opportunities</span>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { title: "Design Development Delay", amount: 42000, confidence: "Medium" },
                { title: "Unforeseen Ground Conditions", amount: 31750, confidence: "High" },
                { title: "MEP Coordination Impact", amount: 22700, confidence: "Medium" },
              ].map((item) => (
                <div key={item.title} className="flex items-center justify-between gap-2 p-2 rounded-lg" style={{ background: "#f5f3ff" }}>
                  <div>
                    <p className="text-xs font-medium" style={{ color: "#6d28d9" }}>{item.title}</p>
                    <p className="text-[11px]" style={{ color: "#8B5CF6" }}>{formatCurrency(item.amount)}</p>
                  </div>
                  <span
                    className="badge text-[10px] flex-shrink-0"
                    style={{
                      background: item.confidence === "High" ? "#d1fae5" : "#fef3c7",
                      color: item.confidence === "High" ? "#059669" : "#92400e",
                    }}
                  >
                    {item.confidence}
                  </span>
                </div>
              ))}
            </div>
            <button className="text-xs font-medium mt-2" style={{ color: "#8B5CF6" }}>View All Opportunities</button>
          </div>

          {/* Ageing Donut */}
          <div className="card p-4">
            <h4 className="text-xs font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Ageing of Unresolved Items</h4>
            <div className="relative">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={DONUT_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {DONUT_DATA.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`£${v}K`, ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>£541K</p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Total</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1 mt-2">
              {DONUT_DATA.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{d.name}: £{d.value}K</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
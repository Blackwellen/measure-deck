"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, ComposedChart, Line,
} from "recharts";
import {
  ArrowLeft, Lock, Unlock, Plus, Download, Sparkles, Edit2, Save,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, FileText,
  BarChart3, DollarSign, Percent, Shield, Users, Building2,
  Clock, Activity, MessageSquare, RefreshCw, ChevronRight, ExternalLink,
  BookOpen, Calculator, Layers,
} from "lucide-react";
import { cn, formatCurrencyFull, formatDate, formatDateTime } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface ProjectData {
  id: string;
  name: string;
  contract_sum: number;
  approved_changes: number;
  pending_changes: number;
  forecast_final: number;
  current_certified: number;
  cost_to_date: number;
  margin_pct: number;
  risk_allowance: number;
  period: string;
  status: "Open" | "Locked" | "Forecast";
}

// ─── Seed project data ──────────────────────────────────────────────────────────

const PROJECT_DATA: Record<string, ProjectData> = {
  "regent-quarter": {
    id: "regent-quarter", name: "Regent Quarter", contract_sum: 12_400_000,
    approved_changes: 185_000, pending_changes: 72_000, forecast_final: 12_650_000,
    current_certified: 8_100_000, cost_to_date: 6_290_000, margin_pct: 22.4,
    risk_allowance: 310_000, period: "Apr 2026", status: "Locked",
  },
  "southbank-resi": {
    id: "southbank-resi", name: "Southbank Resi", contract_sum: 9_800_000,
    approved_changes: 142_000, pending_changes: 95_000, forecast_final: 10_040_000,
    current_certified: 6_420_000, cost_to_date: 5_260_000, margin_pct: 18.1,
    risk_allowance: 220_000, period: "Apr 2026", status: "Open",
  },
  "kings-cross-dev": {
    id: "kings-cross-dev", name: "Kings Cross Dev", contract_sum: 8_200_000,
    approved_changes: 96_000, pending_changes: 48_000, forecast_final: 8_390_000,
    current_certified: 5_300_000, cost_to_date: 4_532_000, margin_pct: 14.5,
    risk_allowance: 185_000, period: "Apr 2026", status: "Open",
  },
  "canary-wharf": {
    id: "canary-wharf", name: "Canary Wharf Fit-Out", contract_sum: 6_100_000,
    approved_changes: 78_000, pending_changes: 0, forecast_final: 6_195_000,
    current_certified: 4_120_000, cost_to_date: 3_657_000, margin_pct: 11.2,
    risk_allowance: 95_000, period: "Mar 2026", status: "Locked",
  },
  "wembley-leisure": {
    id: "wembley-leisure", name: "Wembley Leisure", contract_sum: 4_300_000,
    approved_changes: 34_000, pending_changes: 18_000, forecast_final: 4_410_000,
    current_certified: 2_100_000, cost_to_date: 1_917_000, margin_pct: 8.7,
    risk_allowance: 140_000, period: "Apr 2026", status: "Forecast",
  },
};

const FALLBACK_PROJECT: ProjectData = PROJECT_DATA["southbank-resi"];

// ─── Status helpers ─────────────────────────────────────────────────────────────

function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    Locked: "chip-info", Open: "chip-success", Forecast: "chip-violet",
  };
  return <span className={cn("badge", map[status] ?? "chip-muted")}>{status}</span>;
}

function TrafficLight({ value, thresholds }: { value: number; thresholds: [number, number] }) {
  const color = value >= thresholds[1] ? "var(--success)" : value >= thresholds[0] ? "var(--warning)" : "var(--danger)";
  return (
    <div className="flex items-center gap-1.5">
      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: color }} />
    </div>
  );
}

// ─── KPI Card ────────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color, delta }: { label: string; value: string; sub?: string; color?: string; delta?: string }) {
  return (
    <div className="kpi-card">
      <span className="kpi-label">{label}</span>
      <span className="kpi-value" style={color ? { color } : undefined}>{value}</span>
      {delta && (
        <span className={cn("text-xs font-semibold", delta.startsWith("+") ? "text-[var(--success)]" : "text-[var(--danger)]")}>
          {delta} vs last period
        </span>
      )}
      {sub && !delta && <span className="text-xs text-[var(--text-muted)]">{sub}</span>}
    </div>
  );
}

// ─── Editable Cell ───────────────────────────────────────────────────────────────

function EditableCell({ value, onSave }: { value: string | number; onSave?: (v: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  if (editing) {
    return (
      <input
        autoFocus
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => { setEditing(false); onSave?.(draft); }}
        onKeyDown={(e) => { if (e.key === "Enter") { setEditing(false); onSave?.(draft); } if (e.key === "Escape") setEditing(false); }}
        className="form-input py-1 px-2 text-right w-full max-w-[160px] text-sm"
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="group ml-auto flex items-center gap-1 rounded px-1 -mx-1 hover:bg-[var(--bg-muted)] transition-colors"
    >
      <span>{value}</span>
      <Edit2 size={11} className="opacity-0 group-hover:opacity-50 transition-opacity" />
    </button>
  );
}

// ─── Tab: Summary Dashboard ──────────────────────────────────────────────────────

const CVR_HISTORY = [
  { period: "Nov 25", certified: 1_200_000, cost: 985_000, margin: 17.9 },
  { period: "Dec 25", certified: 1_980_000, cost: 1_620_000, margin: 18.2 },
  { period: "Jan 26", certified: 2_850_000, cost: 2_330_000, margin: 18.2 },
  { period: "Feb 26", certified: 3_840_000, cost: 3_140_000, margin: 18.2 },
  { period: "Mar 26", certified: 5_280_000, cost: 4_320_000, margin: 18.2 },
  { period: "Apr 26", certified: 6_420_000, cost: 5_260_000, margin: 18.1 },
  { period: "May 26", certified: 7_500_000, cost: null, margin: null },
  { period: "Jun 26", certified: 8_800_000, cost: null, margin: null },
];

function SummaryDashboardTab({ proj }: { proj: ProjectData }) {
  const ffaProgress = ((proj.current_certified / proj.forecast_final) * 100).toFixed(1);
  const budgetAdherence = ((proj.contract_sum / proj.forecast_final) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard label="Contract Sum" value={formatCurrencyFull(proj.contract_sum)} sub="Original contract" />
        <KpiCard label="Approved Changes" value={formatCurrencyFull(proj.approved_changes)} color="var(--success)" sub={`+${((proj.approved_changes / proj.contract_sum) * 100).toFixed(1)}% of CS`} />
        <KpiCard label="Forecast Final Account" value={formatCurrencyFull(proj.forecast_final)} sub="FFA" delta="+£40,000" />
        <KpiCard label="Current Certified" value={formatCurrencyFull(proj.current_certified)} sub={`${ffaProgress}% of FFA`} color="var(--info)" />
        <KpiCard
          label="Margin %"
          value={`${proj.margin_pct}%`}
          color={proj.margin_pct >= 15 ? "var(--success)" : proj.margin_pct >= 10 ? "var(--warning)" : "var(--danger)"}
          delta="+0.7%"
        />
        <KpiCard label="Risk Allowance" value={formatCurrencyFull(proj.risk_allowance)} color="var(--warning)" sub="In FFA" />
      </div>

      {/* Traffic light status row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Budget Status", value: `${budgetAdherence}% of contract`, status: parseFloat(budgetAdherence) >= 98 ? "On Budget" : "Over Budget", thresholds: [95, 100] as [number, number], numeric: parseFloat(budgetAdherence) },
          { label: "Forecast Confidence", value: "High", status: "Stable", thresholds: [50, 75] as [number, number], numeric: 85 },
          { label: "Risk Position", value: formatCurrencyFull(proj.risk_allowance), status: "Manageable", thresholds: [60, 80] as [number, number], numeric: 72 },
        ].map(({ label, value, status, thresholds, numeric }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <TrafficLight value={numeric} thresholds={thresholds} />
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">{label}</p>
              <p className="text-sm font-bold mt-0.5">{status}</p>
              <p className="text-xs text-[var(--text-muted)]">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CVR history chart */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-4">CVR History — Certified Revenue vs Cost to Date</h3>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={CVR_HISTORY} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="certGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.15} />
                <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--danger)" stopOpacity={0.10} />
                <stop offset="100%" stopColor="var(--danger)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="period" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `£${(v / 1_000_000).toFixed(1)}m`} />
            <Tooltip
              formatter={(v: number, name: string) => [formatCurrencyFull(v), name === "certified" ? "Certified Revenue" : "Cost to Date"]}
              contentStyle={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 12 }}
            />
            <Area type="monotone" dataKey="certified" stroke="var(--primary)" strokeWidth={2} fill="url(#certGrad)" dot={{ r: 3, fill: "var(--primary)" }} name="certified" />
            <Area type="monotone" dataKey="cost" stroke="var(--danger)" strokeWidth={2} fill="url(#costGrad)" dot={{ r: 3, fill: "var(--danger)" }} strokeDasharray="4 2" name="cost" />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-6 mt-3 text-xs text-[var(--text-muted)]">
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[var(--primary)] inline-block" />Certified Revenue</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[var(--danger)] inline-block" style={{ borderTop: "2px dashed" }} />Cost to Date</span>
          <span className="ml-auto text-[var(--text-muted)]">Forecast months shown with lighter bars</span>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Contract Budget ────────────────────────────────────────────────────────

function ContractBudgetTab({ proj }: { proj: ProjectData }) {
  const cv = proj.contract_sum;
  const trades = [
    { trade: "Substructure & Groundworks", budget: cv * 0.10, actual: cv * 0.099, forecast: cv * 0.101 },
    { trade: "Frame & Upper Floors", budget: cv * 0.22, actual: cv * 0.198, forecast: cv * 0.222 },
    { trade: "Roof", budget: cv * 0.05, actual: cv * 0.022, forecast: cv * 0.052 },
    { trade: "External Envelope", budget: cv * 0.14, actual: cv * 0.088, forecast: cv * 0.143 },
    { trade: "Internal Finishes", budget: cv * 0.09, actual: cv * 0.024, forecast: cv * 0.092 },
    { trade: "M&E Services", budget: cv * 0.16, actual: cv * 0.115, forecast: cv * 0.162 },
    { trade: "Preliminaries", budget: cv * 0.12, actual: cv * 0.079, forecast: cv * 0.121 },
    { trade: "Overheads & Profit", budget: cv * 0.12, actual: cv * 0.000, forecast: cv * 0.107 },
  ];

  const budgetBarData = trades.map((t) => ({
    name: t.trade.split(" ")[0],
    budget: t.budget,
    actual: t.actual,
    forecast: t.forecast,
  }));

  return (
    <div className="space-y-6">
      {/* Bar chart */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-4">Budget vs Actual vs Forecast by Trade</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={budgetBarData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(v: number, name: string) => [formatCurrencyFull(v), name.charAt(0).toUpperCase() + name.slice(1)]}
              contentStyle={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 12 }}
            />
            <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{v.charAt(0).toUpperCase() + v.slice(1)}</span>} />
            <Bar dataKey="budget" fill="var(--bg-muted)" radius={[3, 3, 0, 0]} stroke="var(--border-strong)" />
            <Bar dataKey="actual" fill="var(--primary)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="forecast" fill="var(--warning)" radius={[3, 3, 0, 0]} opacity={0.7} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Budget table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Trade / Section</th>
                <th className="text-right">Budget</th>
                <th className="text-right">Actual Cost</th>
                <th className="text-right">Forecast</th>
                <th className="text-right">Variance</th>
                <th>Spend Progress</th>
              </tr>
            </thead>
            <tbody>
              {trades.map((t) => {
                const variance = t.budget - t.forecast;
                const spendPct = t.budget > 0 ? Math.min((t.actual / t.budget) * 100, 100) : 0;
                return (
                  <tr key={t.trade}>
                    <td className="font-medium">{t.trade}</td>
                    <td className="text-right tabular-nums">{formatCurrencyFull(t.budget)}</td>
                    <td className="text-right tabular-nums">{t.actual > 0 ? formatCurrencyFull(t.actual) : "—"}</td>
                    <td className="text-right tabular-nums font-semibold">{formatCurrencyFull(t.forecast)}</td>
                    <td className={cn("text-right tabular-nums font-semibold", variance >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]")}>
                      {variance >= 0 ? "+" : ""}{formatCurrencyFull(variance)}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-muted)] min-w-[80px]">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${spendPct}%`,
                              background: spendPct >= 90 ? "var(--danger)" : spendPct >= 70 ? "var(--warning)" : "var(--success)",
                            }}
                          />
                        </div>
                        <span className="text-xs text-[var(--text-muted)] w-8 text-right">{spendPct.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-[var(--bg-subtle)]">
                <td className="px-3.5 py-3 font-bold">Total</td>
                <td className="px-3.5 py-3 text-right tabular-nums font-bold">{formatCurrencyFull(trades.reduce((s, t) => s + t.budget, 0))}</td>
                <td className="px-3.5 py-3 text-right tabular-nums font-bold">{formatCurrencyFull(trades.reduce((s, t) => s + t.actual, 0))}</td>
                <td className="px-3.5 py-3 text-right tabular-nums font-bold">{formatCurrencyFull(trades.reduce((s, t) => s + t.forecast, 0))}</td>
                <td className="px-3.5 py-3 text-right tabular-nums font-bold text-[var(--success)]">
                  +{formatCurrencyFull(trades.reduce((s, t) => s + (t.budget - t.forecast), 0))}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Valuations ────────────────────────────────────────────────────────────

const VALUATIONS_DATA = [
  { id: "v1", period: "Jul 2025", applied: 320_000, certified: 288_000, paid: 288_000, cumulative: 288_000, status: "Paid" },
  { id: "v2", period: "Aug 2025", applied: 485_000, certified: 436_500, paid: 436_500, cumulative: 724_500, status: "Paid" },
  { id: "v3", period: "Sep 2025", applied: 714_000, certified: 642_600, paid: 642_600, cumulative: 1_367_100, status: "Paid" },
  { id: "v4", period: "Oct 2025", applied: 910_000, certified: 819_000, paid: 0, cumulative: 2_186_100, status: "Certified" },
  { id: "v5", period: "Nov 2025", applied: 1_245_000, certified: 0, paid: 0, cumulative: 3_431_100, status: "Submitted" },
];

function ValuationsTab() {
  const chipMap: Record<string, string> = {
    Paid: "chip-success", Certified: "chip-warning", Submitted: "chip-info", Draft: "chip-muted",
  };
  const totalApplied = VALUATIONS_DATA.reduce((s, v) => s + v.applied, 0);
  const totalCertified = VALUATIONS_DATA.reduce((s, v) => s + v.certified, 0);
  const totalPaid = VALUATIONS_DATA.reduce((s, v) => s + v.paid, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Total Applied" value={formatCurrencyFull(totalApplied)} />
        <KpiCard label="Total Certified" value={formatCurrencyFull(totalCertified)} color="var(--success)" />
        <KpiCard label="Total Paid" value={formatCurrencyFull(totalPaid)} color="var(--info)" />
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h3 className="text-sm font-semibold">Payment Applications — All Periods</h3>
          <Link href="/applications" className="btn btn-secondary btn-sm">
            <ExternalLink size={13} /> View Applications
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Period</th>
                <th className="text-right">Applied</th>
                <th className="text-right">Certified</th>
                <th className="text-right">Paid</th>
                <th className="text-right">Cumulative Certified</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {VALUATIONS_DATA.map((v) => (
                <tr key={v.id}>
                  <td className="font-medium">{v.period}</td>
                  <td className="text-right tabular-nums">{formatCurrencyFull(v.applied)}</td>
                  <td className="text-right tabular-nums font-semibold text-[var(--success)]">
                    {v.certified > 0 ? formatCurrencyFull(v.certified) : "—"}
                  </td>
                  <td className="text-right tabular-nums">
                    {v.paid > 0 ? formatCurrencyFull(v.paid) : "—"}
                  </td>
                  <td className="text-right tabular-nums text-[var(--text-muted)]">{formatCurrencyFull(v.cumulative)}</td>
                  <td><span className={cn("badge", chipMap[v.status] ?? "chip-muted")}>{v.status}</span></td>
                  <td><button className="btn btn-ghost btn-icon btn-sm"><ChevronRight size={14} /></button></td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[var(--bg-subtle)]">
                <td className="px-3.5 py-3 font-bold text-xs uppercase tracking-wide text-[var(--text-muted)]">Totals</td>
                <td className="px-3.5 py-3 text-right tabular-nums font-bold">{formatCurrencyFull(totalApplied)}</td>
                <td className="px-3.5 py-3 text-right tabular-nums font-bold text-[var(--success)]">{formatCurrencyFull(totalCertified)}</td>
                <td className="px-3.5 py-3 text-right tabular-nums font-bold">{formatCurrencyFull(totalPaid)}</td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Change Events ──────────────────────────────────────────────────────────

const CHANGE_EVENTS_DATA = [
  { id: "ce1", ref: "VAR-001", title: "Additional groundworks – unforeseen rock", status: "Approved", submitted: 48_500, approved: 48_500, ffa_impact: "Revenue +£48,500" },
  { id: "ce2", ref: "VAR-002", title: "Structural steel design change Level 7 cantilever", status: "Approved", submitted: 17_200, approved: 17_200, ffa_impact: "Revenue +£17,200" },
  { id: "ce3", ref: "VAR-003", title: "Acoustic upgrade – specification uplift", status: "Approved", submitted: 29_500, approved: 29_500, ffa_impact: "Revenue +£29,500" },
  { id: "ce4", ref: "DEL-001", title: "Programme delay – utility diversion statutory authority", status: "Pending", submitted: 72_000, approved: 0, ffa_impact: "Risk +£72,000" },
  { id: "ce5", ref: "CLM-001", title: "Loss & Expense – prolongation claim Q1 2026", status: "Disputed", submitted: 95_000, approved: 0, ffa_impact: "Risk item" },
  { id: "ce6", ref: "VAR-004", title: "Lift installation specification change", status: "Rejected", submitted: 14_000, approved: 0, ffa_impact: "No impact" },
];

function ChangeEventsTab() {
  const chipMap: Record<string, string> = {
    Approved: "chip-success", Pending: "chip-warning", Disputed: "chip-danger", Rejected: "chip-muted",
  };

  const approvedTotal = CHANGE_EVENTS_DATA.filter((c) => c.status === "Approved").reduce((s, c) => s + c.approved, 0);
  const pendingTotal = CHANGE_EVENTS_DATA.filter((c) => c.status === "Pending").reduce((s, c) => s + c.submitted, 0);
  const disputedTotal = CHANGE_EVENTS_DATA.filter((c) => c.status === "Disputed").reduce((s, c) => s + c.submitted, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Approved Total" value={formatCurrencyFull(approvedTotal)} color="var(--success)" />
        <KpiCard label="Pending Total" value={formatCurrencyFull(pendingTotal)} color="var(--warning)" />
        <KpiCard label="Disputed Total" value={formatCurrencyFull(disputedTotal)} color="var(--danger)" />
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h3 className="text-sm font-semibold">All Change Events — CVR Impact</h3>
          <Link href="/changes" className="btn btn-secondary btn-sm"><ExternalLink size={13} /> All Changes</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ref</th>
                <th>Title</th>
                <th>Status</th>
                <th className="text-right">Submitted</th>
                <th className="text-right">Approved</th>
                <th>FFA Impact</th>
              </tr>
            </thead>
            <tbody>
              {CHANGE_EVENTS_DATA.map((ce) => (
                <tr key={ce.id}>
                  <td className="font-mono text-xs font-semibold text-[var(--primary)]">{ce.ref}</td>
                  <td className="font-medium">{ce.title}</td>
                  <td><span className={cn("badge", chipMap[ce.status] ?? "chip-muted")}>{ce.status}</span></td>
                  <td className="text-right tabular-nums">{formatCurrencyFull(ce.submitted)}</td>
                  <td className="text-right tabular-nums font-semibold text-[var(--success)]">{ce.approved > 0 ? formatCurrencyFull(ce.approved) : "—"}</td>
                  <td className="text-xs text-[var(--text-muted)]">{ce.ffa_impact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Cost Analysis ──────────────────────────────────────────────────────────

function CostAnalysisTab({ proj }: { proj: ProjectData }) {
  const cv = proj.contract_sum;
  const categories = [
    { name: "Labour", budget: cv * 0.19, actual: cv * 0.185, color: "#3B5EE8" },
    { name: "Plant", budget: cv * 0.10, actual: cv * 0.092, color: "#8B5CF6" },
    { name: "Materials", budget: cv * 0.28, actual: cv * 0.274, color: "#06B6D4" },
    { name: "Subcontractors", budget: cv * 0.21, actual: cv * 0.215, color: "#10B981" },
    { name: "Prelims", budget: cv * 0.06, actual: cv * 0.065, color: "#F59E0B" },
    { name: "Overheads", budget: cv * 0.08, actual: cv * 0.000, color: "#EF4444" },
  ];
  const totalActual = categories.reduce((s, c) => s + c.actual, 0);
  const pieData = categories.map((c) => ({ name: c.name, value: c.actual, color: c.color }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie chart */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4">Cost Split</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="45%" innerRadius={55} outerRadius={85} paddingAngle={2} dataKey="value">
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{v}</span>} />
              <Tooltip formatter={(v: number, name: string) => [formatCurrencyFull(v), name]} contentStyle={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Cost table */}
        <div className="card overflow-hidden lg:col-span-2">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h3 className="text-sm font-semibold">Cost Category Detail — Actual vs Budget</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th className="text-right">Budget</th>
                  <th className="text-right">Actual Cost</th>
                  <th className="text-right">Variance</th>
                  <th>% of Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => {
                  const variance = c.budget - c.actual;
                  const pct = totalActual > 0 ? ((c.actual / totalActual) * 100).toFixed(1) : "0";
                  return (
                    <tr key={c.name}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: c.color }} />
                          <span className="font-medium">{c.name}</span>
                        </div>
                      </td>
                      <td className="text-right tabular-nums">{formatCurrencyFull(c.budget)}</td>
                      <td className="text-right tabular-nums font-semibold">{c.actual > 0 ? formatCurrencyFull(c.actual) : "—"}</td>
                      <td className={cn("text-right tabular-nums font-semibold", variance >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]")}>
                        {variance >= 0 ? "+" : ""}{formatCurrencyFull(variance)}
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-muted)] min-w-[60px]">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: c.color }} />
                          </div>
                          <span className="text-xs text-[var(--text-muted)] w-8 text-right">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-[var(--bg-subtle)]">
                  <td className="px-3.5 py-3 font-bold">Total</td>
                  <td className="px-3.5 py-3 text-right font-bold">{formatCurrencyFull(categories.reduce((s, c) => s + c.budget, 0))}</td>
                  <td className="px-3.5 py-3 text-right font-bold">{formatCurrencyFull(totalActual)}</td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Risk & Opportunities ───────────────────────────────────────────────────

const RISKS = [
  { id: "R001", risk: "Ground condition delay", category: "Programme", probability: 2, impact: 3, score: 6, owner: "Site Manager", mitigation: "Prelim allowance allocated", type: "Risk" },
  { id: "R002", risk: "Subcontractor default — Alpha Steel", category: "Commercial", probability: 2, impact: 4, score: 8, owner: "Commercial Manager", mitigation: "Performance bond in place", type: "Risk" },
  { id: "R003", risk: "Programme overrun — M&E coordination", category: "Programme", probability: 3, impact: 3, score: 9, owner: "Project Manager", mitigation: "Acceleration plan agreed", type: "Risk" },
  { id: "R004", risk: "Material price escalation — steelwork", category: "Cost", probability: 4, impact: 3, score: 12, owner: "QS", mitigation: "Fixed price PO issued to supplier", type: "Risk" },
  { id: "O001", risk: "Early PC bonus — programme ahead", category: "Commercial", probability: 3, impact: 2, score: 6, owner: "PM", mitigation: "Maintain programme accelerations", type: "Opportunity" },
  { id: "O002", risk: "Client additional scope — Level 11", category: "Revenue", probability: 2, impact: 4, score: 8, owner: "Commercial Manager", mitigation: "Pricing under preparation", type: "Opportunity" },
];

function RiskOpportunitiesTab() {
  const risks = RISKS.filter((r) => r.type === "Risk");
  const opportunities = RISKS.filter((r) => r.type === "Opportunity");
  const totalRisk = risks.reduce((s, r) => s + r.score * 8_000, 0);
  const totalOpportunity = opportunities.reduce((s, o) => s + o.score * 8_000, 0);
  const netRisk = totalRisk - totalOpportunity;

  const scoreColor = (s: number) => s >= 12 ? "var(--danger)" : s >= 8 ? "var(--warning)" : s >= 5 ? "var(--info)" : "var(--success)";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Total Risk Exposure" value={formatCurrencyFull(totalRisk)} color="var(--danger)" />
        <KpiCard label="Opportunity Offset" value={formatCurrencyFull(totalOpportunity)} color="var(--success)" />
        <KpiCard label="Net Risk Position" value={formatCurrencyFull(netRisk)} color={netRisk > 50_000 ? "var(--warning)" : "var(--success)"} />
      </div>

      {/* Risks */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2"><AlertTriangle size={14} className="text-[var(--danger)]" />Risk Register</h3>
          <button className="btn btn-primary btn-sm"><Plus size={13} /> Add Risk</button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ref</th><th>Risk</th><th>Category</th>
                <th className="text-right">P</th><th className="text-right">I</th>
                <th className="text-right">Score</th><th>Owner</th><th>Mitigation</th>
              </tr>
            </thead>
            <tbody>
              {risks.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono text-xs font-semibold text-[var(--primary)]">{r.id}</td>
                  <td className="font-medium">{r.risk}</td>
                  <td><span className="badge chip-muted">{r.category}</span></td>
                  <td className="text-right font-bold">{r.probability}</td>
                  <td className="text-right font-bold">{r.impact}</td>
                  <td className="text-right">
                    <span className="inline-flex items-center justify-center w-8 h-6 rounded-lg text-xs font-bold text-white" style={{ background: scoreColor(r.score) }}>{r.score}</span>
                  </td>
                  <td className="text-[var(--text-muted)]">{r.owner}</td>
                  <td className="text-sm text-[var(--text-muted)]">{r.mitigation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Opportunities */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold flex items-center gap-2"><TrendingUp size={14} className="text-[var(--success)]" />Opportunities</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ref</th><th>Opportunity</th><th>Category</th>
                <th className="text-right">Probability</th><th className="text-right">Impact</th>
                <th>Owner</th><th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((o) => (
                <tr key={o.id}>
                  <td className="font-mono text-xs font-semibold text-[var(--success)]">{o.id}</td>
                  <td className="font-medium">{o.risk}</td>
                  <td><span className="badge chip-success">{o.category}</span></td>
                  <td className="text-right font-bold">{o.probability}</td>
                  <td className="text-right font-bold">{o.impact}</td>
                  <td className="text-[var(--text-muted)]">{o.owner}</td>
                  <td className="text-sm text-[var(--text-muted)]">{o.mitigation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Prelims Tracker ────────────────────────────────────────────────────────

function PrelimsTrackerTab({ proj }: { proj: ProjectData }) {
  const cv = proj.contract_sum;
  const prelimBudget = cv * 0.12;
  const prelimItems = [
    { item: "Site Setup & Accommodation", budget: prelimBudget * 0.08, actual: prelimBudget * 0.079, months: 18, remaining: 0 },
    { item: "Site Management (SM + PM + QS)", budget: prelimBudget * 0.35, actual: prelimBudget * 0.228, months: 18, remaining: prelimBudget * 0.35 - prelimBudget * 0.228 },
    { item: "Temporary Works (hoarding, scaffold)", budget: prelimBudget * 0.15, actual: prelimBudget * 0.094, months: 14, remaining: prelimBudget * 0.15 - prelimBudget * 0.094 },
    { item: "Insurances (CAR, EL, PL)", budget: prelimBudget * 0.06, actual: prelimBudget * 0.039, months: 18, remaining: prelimBudget * 0.06 - prelimBudget * 0.039 },
    { item: "Plant Hire – Tower Crane", budget: prelimBudget * 0.18, actual: prelimBudget * 0.122, months: 12, remaining: prelimBudget * 0.18 - prelimBudget * 0.122 },
    { item: "Welfare & Health & Safety", budget: prelimBudget * 0.05, actual: prelimBudget * 0.033, months: 18, remaining: prelimBudget * 0.05 - prelimBudget * 0.033 },
    { item: "Miscellaneous Prelims", budget: prelimBudget * 0.13, actual: prelimBudget * 0.065, months: 18, remaining: prelimBudget * 0.13 - prelimBudget * 0.065 },
  ];

  const burnRateData = [
    { month: "Sep 25", budget: 85_000, actual: 78_000 },
    { month: "Oct 25", budget: 88_000, actual: 91_000 },
    { month: "Nov 25", budget: 88_000, actual: 85_000 },
    { month: "Dec 25", budget: 72_000, actual: 68_000 },
    { month: "Jan 26", budget: 88_000, actual: 90_000 },
    { month: "Feb 26", budget: 88_000, actual: 86_000 },
    { month: "Mar 26", budget: 88_000, actual: null },
    { month: "Apr 26", budget: 88_000, actual: null },
  ];

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-4">Prelims Monthly Burn Rate</h3>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={burnRateData} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number, n: string) => [formatCurrencyFull(v), n === "actual" ? "Actual" : "Budget"]} contentStyle={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 12 }} />
            <Bar dataKey="actual" fill="var(--primary)" radius={[3, 3, 0, 0]} />
            <Line type="monotone" dataKey="budget" stroke="var(--warning)" strokeWidth={2} dot={false} strokeDasharray="5 3" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold">Preliminaries Schedule</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Prelim Item</th>
                <th className="text-right">Budget</th>
                <th className="text-right">Actual to Date</th>
                <th className="text-right">Remaining</th>
                <th className="text-right">Variance</th>
                <th>Burn</th>
              </tr>
            </thead>
            <tbody>
              {prelimItems.map((p) => {
                const variance = p.budget - (p.actual + p.remaining);
                const burnPct = p.budget > 0 ? (p.actual / p.budget) * 100 : 0;
                return (
                  <tr key={p.item}>
                    <td className="font-medium">{p.item}</td>
                    <td className="text-right tabular-nums">{formatCurrencyFull(p.budget)}</td>
                    <td className="text-right tabular-nums font-semibold">{formatCurrencyFull(p.actual)}</td>
                    <td className="text-right tabular-nums text-[var(--text-muted)]">{p.remaining > 0 ? formatCurrencyFull(p.remaining) : "—"}</td>
                    <td className={cn("text-right tabular-nums font-semibold", variance >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]")}>
                      {variance >= 0 ? "+" : ""}{formatCurrencyFull(variance)}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-muted)] min-w-[60px]">
                          <div className="h-full rounded-full bg-[var(--primary)]" style={{ width: `${Math.min(burnPct, 100)}%` }} />
                        </div>
                        <span className="text-xs text-[var(--text-muted)] w-8 text-right">{burnPct.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-[var(--bg-subtle)]">
                <td className="px-3.5 py-3 font-bold">Total Prelims</td>
                <td className="px-3.5 py-3 text-right font-bold">{formatCurrencyFull(prelimBudget)}</td>
                <td className="px-3.5 py-3 text-right font-bold">{formatCurrencyFull(prelimItems.reduce((s, p) => s + p.actual, 0))}</td>
                <td className="px-3.5 py-3 text-right font-bold text-[var(--text-muted)]">{formatCurrencyFull(prelimItems.reduce((s, p) => s + p.remaining, 0))}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Forecast Final Account ─────────────────────────────────────────────────

function ForecastFinalAccountTab({ proj }: { proj: ProjectData }) {
  const rows = [
    { label: "Original Contract Sum", value: proj.contract_sum, editable: false, indent: 0, bold: false },
    { label: "Approved Change Events", value: proj.approved_changes, editable: false, indent: 1, bold: false },
    { label: "Pending Change Events (risk-adjusted 50%)", value: proj.pending_changes * 0.5, editable: true, indent: 1, bold: false },
    { label: "Provisional Sums (nett)", value: 48_000, editable: true, indent: 1, bold: false },
    { label: "Dayworks", value: 12_500, editable: true, indent: 1, bold: false },
    { label: "Loss & Expense (probability-weighted)", value: 34_000, editable: true, indent: 1, bold: false },
    { label: "Price Fluctuations", value: 0, editable: true, indent: 1, bold: false },
    { label: "Contra Charges (deduction)", value: -8_500, editable: true, indent: 1, bold: false },
    { label: "FORECAST FINAL ACCOUNT", value: proj.forecast_final, editable: false, indent: 0, bold: true },
    { label: "Previously forecast (Mar 2026)", value: proj.forecast_final - 40_000, editable: false, indent: 1, bold: false },
    { label: "Movement this period", value: 40_000, editable: false, indent: 1, bold: false },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
        <Edit2 size={13} />
        <span>Click any editable cell to update the forecast. Changes are saved automatically.</span>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--bg-subtle)]">
          <h3 className="text-sm font-semibold">Forecast Final Account Build-Up — {proj.period}</h3>
        </div>
        <table className="data-table w-full">
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={cn(row.bold && "bg-[var(--primary-light)]")}>
                <td className={cn("font-medium", row.bold && "font-bold text-[var(--primary)]")} style={{ paddingLeft: `${(row.indent + 1) * 14}px` }}>
                  {row.label}
                </td>
                <td className="w-52 text-right">
                  {row.editable ? (
                    <EditableCell value={formatCurrencyFull(row.value)} />
                  ) : (
                    <span className={cn("tabular-nums", row.bold && "font-bold text-[var(--primary)]", row.value < 0 && "text-[var(--danger)]")}>
                      {formatCurrencyFull(row.value)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab: Period Comparison ───────────────────────────────────────────────────────

const PERIOD_DATA = [
  { period: "Jan 26", contractSum: 9_800_000, ffa: 9_940_000, certified: 2_850_000, margin: 17.1, risk: 185_000 },
  { period: "Feb 26", contractSum: 9_800_000, ffa: 9_980_000, certified: 3_840_000, margin: 17.8, risk: 210_000 },
  { period: "Mar 26", contractSum: 9_800_000, ffa: 10_000_000, certified: 5_280_000, margin: 18.0, risk: 230_000 },
  { period: "Apr 26", contractSum: 9_800_000, ffa: 10_040_000, certified: 6_420_000, margin: 18.1, risk: 220_000 },
];

const RADAR_DATA = [
  { subject: "Revenue", A: 92, B: 88, C: 84, D: 80 },
  { subject: "Margin %", A: 91, B: 89, C: 85, D: 81 },
  { subject: "Risk Mgmt", A: 85, B: 82, C: 80, D: 78 },
  { subject: "Change Events", A: 78, B: 75, C: 72, D: 68 },
  { subject: "Prelims", A: 88, B: 85, C: 83, D: 82 },
  { subject: "Programme", A: 82, B: 80, C: 76, D: 72 },
];

function PeriodComparisonTab() {
  return (
    <div className="space-y-6">
      {/* Side by side KPI comparison */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold">CVR Period Comparison — Last 4 Periods</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Metric</th>
                {PERIOD_DATA.map((p) => <th key={p.period} className="text-right">{p.period}</th>)}
                <th className="text-right">Movement</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Contract Sum", key: "contractSum" as const, fmt: formatCurrencyFull },
                { label: "Forecast Final Account", key: "ffa" as const, fmt: formatCurrencyFull },
                { label: "Cumulative Certified", key: "certified" as const, fmt: formatCurrencyFull },
                { label: "Margin %", key: "margin" as const, fmt: (v: number) => `${v}%` },
                { label: "Risk Allowance", key: "risk" as const, fmt: formatCurrencyFull },
              ].map(({ label, key, fmt }) => {
                const first = PERIOD_DATA[0][key];
                const last = PERIOD_DATA[PERIOD_DATA.length - 1][key];
                const movement = Number(last) - Number(first);
                return (
                  <tr key={label}>
                    <td className="font-medium">{label}</td>
                    {PERIOD_DATA.map((p) => (
                      <td key={p.period} className="text-right tabular-nums">{fmt(p[key] as number)}</td>
                    ))}
                    <td className={cn("text-right font-semibold tabular-nums", movement >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]")}>
                      {movement >= 0 ? "+" : ""}{key === "margin" ? `${movement.toFixed(1)}%` : formatCurrencyFull(movement)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Radar chart */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-4">Performance Spider Chart — Period on Period</h3>
        <ResponsiveContainer width="100%" height={320}>
          <RadarChart data={RADAR_DATA} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "var(--text-muted)" }} />
            <PolarRadiusAxis angle={90} domain={[60, 100]} tick={{ fontSize: 10, fill: "var(--text-muted)" }} />
            <Radar name="Apr 26" dataKey="A" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.2} />
            <Radar name="Mar 26" dataKey="B" stroke="var(--success)" fill="var(--success)" fillOpacity={0.1} />
            <Radar name="Feb 26" dataKey="C" stroke="var(--warning)" fill="var(--warning)" fillOpacity={0.08} />
            <Radar name="Jan 26" dataKey="D" stroke="var(--text-muted)" fill="var(--text-muted)" fillOpacity={0.06} />
            <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{v}</span>} />
            <Tooltip contentStyle={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", fontSize: 12 }} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── Tab: Subcontract Ledger ──────────────────────────────────────────────────────

const SUBCONTRACT_DATA = [
  { id: "s1", supplier: "Alpha Steelwork Ltd", trade: "Structural Steel", order_value: 1_850_000, certified_to_date: 1_260_000, paid_to_date: 1_120_000, retention_held: 63_000, projected_final: 1_870_000, allowance: 1_850_000 },
  { id: "s2", supplier: "Fenwick Cladding Systems", trade: "Curtain Walling", order_value: 820_000, certified_to_date: 415_000, paid_to_date: 380_000, retention_held: 20_750, projected_final: 835_000, allowance: 820_000 },
  { id: "s3", supplier: "PowerTech MEP", trade: "M&E Services", order_value: 1_240_000, certified_to_date: 690_000, paid_to_date: 620_000, retention_held: 34_500, projected_final: 1_255_000, allowance: 1_240_000 },
  { id: "s4", supplier: "BuildRight Groundworks", trade: "Groundworks", order_value: 485_000, certified_to_date: 485_000, paid_to_date: 436_500, retention_held: 24_250, projected_final: 485_000, allowance: 485_000 },
  { id: "s5", supplier: "InteriorCo Ltd", trade: "Internal Finishes", order_value: 620_000, certified_to_date: 85_000, paid_to_date: 76_500, retention_held: 4_250, projected_final: 640_000, allowance: 620_000 },
];

function SubcontractLedgerTab() {
  const totalOrder = SUBCONTRACT_DATA.reduce((s, r) => s + r.order_value, 0);
  const totalCertified = SUBCONTRACT_DATA.reduce((s, r) => s + r.certified_to_date, 0);
  const totalPaid = SUBCONTRACT_DATA.reduce((s, r) => s + r.paid_to_date, 0);
  const totalRetention = SUBCONTRACT_DATA.reduce((s, r) => s + r.retention_held, 0);
  const totalProjected = SUBCONTRACT_DATA.reduce((s, r) => s + r.projected_final, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Subcontract Orders" value={formatCurrencyFull(totalOrder)} />
        <KpiCard label="Certified to Date" value={formatCurrencyFull(totalCertified)} color="var(--info)" />
        <KpiCard label="Paid to Date" value={formatCurrencyFull(totalPaid)} color="var(--success)" />
        <KpiCard label="Retention Held" value={formatCurrencyFull(totalRetention)} color="var(--warning)" />
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Trade</th>
                <th className="text-right">Order Value</th>
                <th className="text-right">Certified to Date</th>
                <th className="text-right">Paid to Date</th>
                <th className="text-right">Retention Held</th>
                <th className="text-right">Projected Final</th>
                <th className="text-right">Variance to Allowance</th>
              </tr>
            </thead>
            <tbody>
              {SUBCONTRACT_DATA.map((r) => {
                const variance = r.allowance - r.projected_final;
                return (
                  <tr key={r.id}>
                    <td className="font-semibold">{r.supplier}</td>
                    <td className="text-[var(--text-muted)]">{r.trade}</td>
                    <td className="text-right tabular-nums">{formatCurrencyFull(r.order_value)}</td>
                    <td className="text-right tabular-nums">{formatCurrencyFull(r.certified_to_date)}</td>
                    <td className="text-right tabular-nums">{formatCurrencyFull(r.paid_to_date)}</td>
                    <td className="text-right tabular-nums text-[var(--warning)]">{formatCurrencyFull(r.retention_held)}</td>
                    <td className="text-right tabular-nums font-semibold">{formatCurrencyFull(r.projected_final)}</td>
                    <td className={cn("text-right tabular-nums font-semibold", variance >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]")}>
                      {variance >= 0 ? "+" : ""}{formatCurrencyFull(variance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-[var(--bg-subtle)]">
                <td colSpan={2} className="px-3.5 py-3 font-bold text-xs uppercase text-[var(--text-muted)]">Totals</td>
                <td className="px-3.5 py-3 text-right font-bold">{formatCurrencyFull(totalOrder)}</td>
                <td className="px-3.5 py-3 text-right font-bold">{formatCurrencyFull(totalCertified)}</td>
                <td className="px-3.5 py-3 text-right font-bold">{formatCurrencyFull(totalPaid)}</td>
                <td className="px-3.5 py-3 text-right font-bold text-[var(--warning)]">{formatCurrencyFull(totalRetention)}</td>
                <td className="px-3.5 py-3 text-right font-bold">{formatCurrencyFull(totalProjected)}</td>
                <td className="px-3.5 py-3 text-right font-bold text-[var(--success)]">
                  +{formatCurrencyFull(totalOrder - totalProjected)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Activity ───────────────────────────────────────────────────────────────

const ACTIVITY_ENTRIES = [
  { id: "a1", user: "Sarah Chen", action: "Period Locked", detail: "Mar 2026 CVR period locked by Commercial Manager", time: "2026-04-02T09:14:00Z" },
  { id: "a2", user: "James Wilson", action: "FFA Updated", detail: "Forecast Final Account updated from £10,000,000 to £10,040,000 — pending CE uplift", time: "2026-04-01T15:30:00Z" },
  { id: "a3", user: "Sarah Chen", action: "Risk Item Added", detail: "R004 — Material price escalation added to risk register", time: "2026-03-28T11:20:00Z" },
  { id: "a4", user: "Mike Torres", action: "Period Opened", detail: "Apr 2026 CVR period created and opened", time: "2026-04-01T08:00:00Z" },
  { id: "a5", user: "James Wilson", action: "Cost Updated", detail: "M&E actual cost updated to £1,127,000 for Apr 2026 period", time: "2026-04-05T14:45:00Z" },
  { id: "a6", user: "Sarah Chen", action: "Change Approved", detail: "VAR-003 acoustic upgrade approved — FFA +£29,500", time: "2026-03-22T10:00:00Z" },
];

function ActivityTab() {
  return (
    <div className="space-y-3">
      {ACTIVITY_ENTRIES.map((entry) => (
        <div key={entry.id} className="card p-4 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white" style={{ background: "var(--primary)" }}>
            {entry.user.split(" ").map((n) => n[0]).join("")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold">{entry.user}</span>
              <span className="badge chip-muted">{entry.action}</span>
            </div>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">{entry.detail}</p>
          </div>
          <span className="text-xs text-[var(--text-muted)] flex-shrink-0">{formatDateTime(entry.time)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: Notes ──────────────────────────────────────────────────────────────────

const NOTES_HISTORY = [
  { id: "n1", period: "Mar 2026", author: "Sarah Chen", content: "March period closed with margin at 18.0%. Steel procurement variance partially offset by approved variation revenue. M&E first fix ahead of programme — may accelerate PC by 2 weeks. Risk allowance reviewed; R003 M&E coordination risk reduced following programme update.", saved_at: "2026-04-01T09:00:00Z" },
  { id: "n2", period: "Feb 2026", author: "James Wilson", content: "Feb period — margin tracking at 17.8%. Crane hire extended by 3 weeks due to steel programme overrun; additional cost £48k absorbed within risk allowance. Client additionals being assessed for VAR-003 acoustic upgrade.", saved_at: "2026-03-01T10:00:00Z" },
];

function NotesTab({ proj }: { proj: ProjectData }) {
  const [note, setNote] = useState("Apr 2026 — Current period CVR notes:\n\n");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Current period notepad */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <BookOpen size={14} className="text-[var(--primary)]" />
            Period Notes — {proj.period}
          </h3>
          <button className="btn btn-primary btn-sm" onClick={handleSave}>
            <Save size={12} /> {saved ? "Saved!" : "Save Notes"}
          </button>
        </div>
        <textarea
          className="form-input w-full resize-none text-sm leading-relaxed"
          rows={10}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add your commercial notes for this CVR period…"
        />
        <p className="text-xs text-[var(--text-muted)] mt-2">Notes are saved against this CVR period and form part of the audit trail.</p>
      </div>

      {/* Historical notes */}
      <div>
        <h3 className="text-sm font-semibold mb-3 text-[var(--text-secondary)]">Previous Period Notes</h3>
        <div className="space-y-4">
          {NOTES_HISTORY.map((n) => (
            <div key={n.id} className="card p-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="badge chip-muted">{n.period}</span>
                  <span className="text-xs text-[var(--text-muted)]">by {n.author}</span>
                </div>
                <span className="text-xs text-[var(--text-muted)]">{formatDate(n.saved_at)}</span>
              </div>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{n.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Lock dialog ─────────────────────────────────────────────────────────────────

function LockDialog({ open, onClose, onConfirm }: { open: boolean; onClose: () => void; onConfirm: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="card p-6 w-full max-w-sm shadow-xl space-y-4">
        <h2 className="text-base font-semibold">Lock CVR Period?</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Locking this period will prevent further edits and create a permanent record. Only a user with CVR Admin permission can unlock.
        </p>
        <div className="flex gap-2 justify-end">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="btn btn-primary" onClick={onConfirm}>
            <Lock size={13} /> Lock Period
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Margin Bridge ──────────────────────────────────────────────────────────

function MarginBridgeTab({ proj }: { proj: ProjectData }) {
  const contractMargin = proj.contract_sum * 0.10;
  const ceUplift = proj.approved_changes * 0.25;
  const variationImpact = -proj.pending_changes * 0.05;
  const riskRelease = proj.risk_allowance * 0.30;
  const finalMargin = contractMargin + ceUplift + variationImpact + riskRelease;

  const bars = [
    { label: "Contract Margin", value: contractMargin, positive: true },
    { label: "CE Uplift", value: ceUplift, positive: true },
    { label: "Variation Impact", value: variationImpact, positive: variationImpact >= 0 },
    { label: "Risk Release", value: riskRelease, positive: true },
    { label: "Final Margin", value: finalMargin, positive: finalMargin >= 0, isFinal: true },
  ];

  const maxAbs = Math.max(...bars.map((b) => Math.abs(b.value)));

  return (
    <div className="space-y-6">
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-6">Margin Bridge — Contract to Forecast Final</h3>
        <div className="space-y-4">
          {bars.map((bar, idx) => {
            const widthPct = maxAbs > 0 ? (Math.abs(bar.value) / maxAbs) * 100 : 0;
            const pct = proj.contract_sum > 0 ? ((bar.value / proj.contract_sum) * 100).toFixed(1) : "0";
            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">{bar.label}</span>
                  <span className={cn("tabular-nums font-bold", bar.positive ? "text-[var(--success)]" : "text-[var(--danger)]")}>
                    {bar.value >= 0 ? "+" : ""}{formatCurrencyFull(bar.value)} ({pct}%)
                  </span>
                </div>
                <div className="h-8 rounded-lg relative overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                  <div
                    className={cn("absolute top-0 bottom-0 left-0 rounded-lg transition-all", bar.isFinal ? "opacity-90" : "opacity-70")}
                    style={{
                      width: `${widthPct}%`,
                      background: bar.positive ? "var(--success)" : "var(--danger)",
                    }}
                  />
                  <div className="absolute inset-0 flex items-center px-3">
                    <span className="text-xs font-semibold text-white mix-blend-screen">
                      {bar.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold">Margin Bridge Summary</h3>
        </div>
        <table className="data-table w-full">
          <thead>
            <tr>
              <th>Component</th>
              <th className="text-right">Amount</th>
              <th className="text-right">% of Contract</th>
              <th>Direction</th>
            </tr>
          </thead>
          <tbody>
            {bars.map((bar, idx) => (
              <tr key={idx} className={bar.isFinal ? "bg-[var(--primary-light)]" : undefined}>
                <td className={cn("font-medium", bar.isFinal && "font-bold text-[var(--primary)]")}>
                  {bar.label}
                </td>
                <td className={cn("text-right tabular-nums font-semibold", bar.positive ? "text-[var(--success)]" : "text-[var(--danger)]")}>
                  {bar.value >= 0 ? "+" : ""}{formatCurrencyFull(bar.value)}
                </td>
                <td className="text-right tabular-nums text-xs" style={{ color: "var(--text-muted)" }}>
                  {proj.contract_sum > 0 ? ((bar.value / proj.contract_sum) * 100).toFixed(2) : "0"}%
                </td>
                <td>
                  {bar.positive
                    ? <TrendingUp size={14} className="text-[var(--success)]" />
                    : <TrendingDown size={14} className="text-[var(--danger)]" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab: Forecast to Complete ───────────────────────────────────────────────────

interface CTCRow {
  id: string;
  category: string;
  budget: number;
  actual: number;
  ctc: number;
}

function ForecastToCompleteTab({ proj }: { proj: ProjectData }) {
  const cv = proj.contract_sum;
  const [rows, setRows] = useState<CTCRow[]>([
    { id: "t1", category: "Substructure & Groundworks", budget: cv * 0.10, actual: cv * 0.099, ctc: cv * 0.002 },
    { id: "t2", category: "Frame & Upper Floors", budget: cv * 0.22, actual: cv * 0.198, ctc: cv * 0.024 },
    { id: "t3", category: "Roof", budget: cv * 0.05, actual: cv * 0.022, ctc: cv * 0.030 },
    { id: "t4", category: "External Envelope", budget: cv * 0.14, actual: cv * 0.088, ctc: cv * 0.055 },
    { id: "t5", category: "Internal Finishes", budget: cv * 0.09, actual: cv * 0.024, ctc: cv * 0.068 },
    { id: "t6", category: "M&E Services", budget: cv * 0.16, actual: cv * 0.115, ctc: cv * 0.047 },
    { id: "t7", category: "Preliminaries", budget: cv * 0.12, actual: cv * 0.079, ctc: cv * 0.041 },
    { id: "t8", category: "Overheads & Profit", budget: cv * 0.12, actual: 0, ctc: cv * 0.107 },
  ]);

  const [saving, setSaving] = useState(false);

  function handleCTCChange(id: string, val: string) {
    const num = parseFloat(val.replace(/[^0-9.-]/g, "")) || 0;
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, ctc: num } : r));
  }

  async function handleSaveCTC() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      const { data: ws } = await supabase
        .from("workspace_memberships")
        .select("workspace_id")
        .eq("user_id", user?.id ?? "")
        .limit(1)
        .single();

      const wsId = (ws?.workspace_id as string) ?? "";

      const { data: latestPeriod } = await supabase
        .from("cvr_periods")
        .select("id")
        .eq("project_id", proj.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (latestPeriod) {
        await supabase
          .from("cvr_periods")
          .update({ ctc_data: rows })
          .eq("id", (latestPeriod as { id: string }).id);
      }

      if (wsId && user?.id) {
        await supabase.from("audit_events").insert({
          workspace_id: wsId,
          user_id: user.id,
          action: "cvr_ctc_updated",
          resource_type: "project",
          resource_id: proj.id,
          new_values: { ctc_data: rows },
        });
      }
    } catch {
      // silently ignored
    } finally {
      setSaving(false);
    }
  }

  const totals = rows.reduce(
    (acc, r) => ({
      budget: acc.budget + r.budget,
      actual: acc.actual + r.actual,
      ctc: acc.ctc + r.ctc,
      eac: acc.eac + r.actual + r.ctc,
    }),
    { budget: 0, actual: 0, ctc: 0, eac: 0 }
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Edit the CTC column to update forecast. EAC = Actual Cost + CTC.
        </p>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => void handleSaveCTC()}
          disabled={saving}
        >
          <Save size={13} /> {saving ? "Saving…" : "Save CTC"}
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Work Category</th>
                <th className="text-right">Budget</th>
                <th className="text-right">Actual Cost</th>
                <th className="text-right">CTC (edit)</th>
                <th className="text-right">EAC</th>
                <th className="text-right">Variance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const eac = row.actual + row.ctc;
                const variance = row.budget - eac;
                return (
                  <tr key={row.id}>
                    <td className="font-medium">{row.category}</td>
                    <td className="text-right tabular-nums">{formatCurrencyFull(row.budget)}</td>
                    <td className="text-right tabular-nums">{row.actual > 0 ? formatCurrencyFull(row.actual) : "—"}</td>
                    <td className="text-right">
                      <EditableCell
                        value={formatCurrencyFull(row.ctc)}
                        onSave={(v) => handleCTCChange(row.id, v)}
                      />
                    </td>
                    <td className="text-right tabular-nums font-semibold">{formatCurrencyFull(eac)}</td>
                    <td className={cn("text-right tabular-nums font-semibold", variance >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]")}>
                      {variance >= 0 ? "+" : ""}{formatCurrencyFull(variance)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-[var(--bg-subtle)]">
                <td className="px-3.5 py-3 font-bold">Total</td>
                <td className="px-3.5 py-3 text-right tabular-nums font-bold">{formatCurrencyFull(totals.budget)}</td>
                <td className="px-3.5 py-3 text-right tabular-nums font-bold">{formatCurrencyFull(totals.actual)}</td>
                <td className="px-3.5 py-3 text-right tabular-nums font-bold">{formatCurrencyFull(totals.ctc)}</td>
                <td className="px-3.5 py-3 text-right tabular-nums font-bold">{formatCurrencyFull(totals.eac)}</td>
                <td className={cn("px-3.5 py-3 text-right tabular-nums font-bold", totals.budget - totals.eac >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]")}>
                  {totals.budget - totals.eac >= 0 ? "+" : ""}{formatCurrencyFull(totals.budget - totals.eac)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Tab definitions ────────────────────────────────────────────────────────────

const TABS = [
  "Summary Dashboard",
  "Contract Budget",
  "Valuations",
  "Change Events",
  "Cost Analysis",
  "Risk & Opportunities",
  "Prelims Tracker",
  "Forecast Final Account",
  "Period Comparison",
  "Subcontract Ledger",
  "Margin Bridge",
  "Forecast to Complete",
  "Activity",
  "Notes",
] as const;

type Tab = typeof TABS[number];

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function CVRProjectPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = String(params.projectId ?? "southbank-resi");

  const [loading, setLoading] = useState(true);
  const [proj, setProj] = useState<ProjectData | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Summary Dashboard");
  const [locked, setLocked] = useState(false);
  const [lockOpen, setLockOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .single();
        // Map DB row to ProjectData shape, fallback to seed
        if (data) {
          const seed = PROJECT_DATA[projectId] ?? FALLBACK_PROJECT;
          setProj({ ...seed, id: data.id ?? seed.id, name: data.name ?? seed.name });
          setLocked(data.status === "Locked");
        } else {
          const seed = PROJECT_DATA[projectId] ?? FALLBACK_PROJECT;
          setProj(seed);
          setLocked(seed.status === "Locked");
        }
      } catch {
        const seed = PROJECT_DATA[projectId] ?? FALLBACK_PROJECT;
        setProj(seed);
        setLocked(seed.status === "Locked");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  if (loading || !proj) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="btn btn-ghost btn-icon"><ArrowLeft size={16} /></button>
            <div className="space-y-1.5">
              <div className="skeleton h-5 w-48 rounded" />
              <div className="skeleton h-3.5 w-64 rounded" />
            </div>
          </div>
        </div>
        <div className="page-content">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="kpi-card">
                <div className="skeleton h-3 w-20 rounded" />
                <div className="skeleton h-7 w-32 rounded mt-2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentStatus = locked ? "Locked" : proj.status;

  return (
    <div className="flex flex-col min-h-full">
      <LockDialog
        open={lockOpen}
        onClose={() => setLockOpen(false)}
        onConfirm={() => { setLocked(true); setLockOpen(false); }}
      />

      {/* Page header */}
      <div className="page-header">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/cvr" className="btn btn-ghost btn-icon flex-shrink-0">
            <ArrowLeft size={16} />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{proj.name}</h1>
              <StatusChip status={currentStatus} />
              <span className="badge chip-muted">{proj.period}</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              CVR — Cost Value Reconciliation &nbsp;·&nbsp;
              Contract: {formatCurrencyFull(proj.contract_sum)} &nbsp;·&nbsp;
              Margin: <span className={cn("font-semibold", proj.margin_pct >= 15 ? "text-[var(--success)]" : proj.margin_pct >= 10 ? "text-[var(--warning)]" : "text-[var(--danger)]")}>{proj.margin_pct}%</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn btn-ghost btn-sm">
            <Sparkles size={14} /> Ask AI
          </button>
          <button className="btn btn-secondary btn-sm">
            <Download size={14} /> Export CVR
          </button>
          {locked ? (
            <button className="btn btn-secondary btn-sm" onClick={() => setLocked(false)}>
              <Unlock size={13} /> Unlock Period
            </button>
          ) : (
            <button className="btn btn-secondary btn-sm" onClick={() => setLockOpen(true)}>
              <Lock size={13} /> Lock Period
            </button>
          )}
          <button className="btn btn-primary btn-sm">
            <Plus size={13} /> New CVR Period
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="tab-bar">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={cn("tab-item", activeTab === t && "active")}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="page-content flex-1">
        {activeTab === "Summary Dashboard"       && <SummaryDashboardTab proj={proj} />}
        {activeTab === "Contract Budget"         && <ContractBudgetTab proj={proj} />}
        {activeTab === "Valuations"              && <ValuationsTab />}
        {activeTab === "Change Events"           && <ChangeEventsTab />}
        {activeTab === "Cost Analysis"           && <CostAnalysisTab proj={proj} />}
        {activeTab === "Risk & Opportunities"    && <RiskOpportunitiesTab />}
        {activeTab === "Prelims Tracker"         && <PrelimsTrackerTab proj={proj} />}
        {activeTab === "Forecast Final Account"  && <ForecastFinalAccountTab proj={proj} />}
        {activeTab === "Period Comparison"       && <PeriodComparisonTab />}
        {activeTab === "Subcontract Ledger"      && <SubcontractLedgerTab />}
        {activeTab === "Margin Bridge"           && <MarginBridgeTab proj={proj} />}
        {activeTab === "Forecast to Complete"    && <ForecastToCompleteTab proj={proj} />}
        {activeTab === "Activity"                && <ActivityTab />}
        {activeTab === "Notes"                   && <NotesTab proj={proj} />}
      </div>
    </div>
  );
}

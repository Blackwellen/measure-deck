"use client";

import { useState } from "react";
import {
  Search, Download, MoreHorizontal, RefreshCw, CheckCircle2, Circle, FileText,
} from "lucide-react";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { cn, formatCurrency, getInitials } from "@/lib/utils";
import { RIVERSIDE_FINAL_ACCOUNT_ITEMS } from "@/lib/seed/projects";

type FAItem = typeof RIVERSIDE_FINAL_ACCOUNT_ITEMS[number];

const STATUS_CHIP: Record<string, string> = {
  under_review: "chip-info",
  negotiation:  "chip-warning",
  drafted:      "chip-muted",
  agreed:       "chip-success",
  closed:       "chip-muted",
};

const STATUS_LABEL: Record<string, string> = {
  under_review: "Under Review",
  negotiation:  "Negotiation",
  drafted:      "Drafted",
  agreed:       "Agreed",
  closed:       "Closed",
};

const AVATAR_COLORS = ["#3B5EE8", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#06b6d4", "#ec4899", "#f97316", "#84cc16"];

function Avatar({ name, idx, size = 6 }: { name: string; idx: number; size?: number }) {
  const bg = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  return (
    <div
      className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}
      style={{ background: bg, width: size * 4, height: size * 4, fontSize: size * 1.5 }}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}

const DONUT_DATA = [
  { name: "0-30 days",  value: 182, color: "#10B981" },
  { name: "31-60 days", value: 164, color: "#F59E0B" },
  { name: "61-90 days", value: 112, color: "#f97316" },
  { name: "90+ days",   value: 83,  color: "#EF4444" },
];

// Waterfall bridge chart
const BRIDGE_DATA = [
  { name: "Contract Sum",          spacer: 0,     bar: 2950, fill: "#1e293b" },
  { name: "Recoveries",            spacer: 2950,  bar: 96,   fill: "#10B981" },
  { name: "Unresolved Items",      spacer: 2950,  bar: 541,  fill: "#F59E0B" },
  { name: "Retention",             spacer: 3402,  bar: -88,  fill: "#EF4444" },
  { name: "Risk & Contingency",    spacer: 3174,  bar: -228, fill: "#EF4444" },
  { name: "Forecast FA",           spacer: 0,     bar: 2721, fill: "#3B5EE8" },
];

const bridgeForChart = BRIDGE_DATA.map((d) => ({
  name: d.name,
  spacer: d.bar >= 0 ? d.spacer : d.spacer + d.bar,
  bar: Math.abs(d.bar),
  fill: d.fill,
}));

const NEGOTIATION_STAGES = [
  { label: "Drafted",     count: 3, active: false },
  { label: "Submitted",   count: 2, active: false },
  { label: "Under Review",count: 4, active: false },
  { label: "Negotiation", count: 3, active: true },
  { label: "Agreed",      count: 2, active: false },
  { label: "Closed",      count: 0, active: false },
];

const KEY_DATES = [
  { label: "Planned Completion",   value: "30 Jun 2027" },
  { label: "Practical Completion", value: "TBC" },
  { label: "Defects Period End",   value: "TBC" },
  { label: "Final Account Target", value: "Dec 2026" },
  { label: "Target Settlement",    value: "06 Jul 2026", highlight: true },
];

const TEAM = [
  { name: "James Walker",  role: "Commercial Manager",  chip: "Owner",    color: "#3B5EE8" },
  { name: "Rachel Okafor", role: "Commercial Lead",     chip: "Owner",    color: "#10B981" },
  { name: "David Miller",  role: "Commercial Director", chip: "Approver", color: "#8B5CF6" },
];

const RELATED_NOTICES = [
  { ref: "NFC-2026-07", title: "Extension of Time Claim",   date: "12 May 2026" },
  { ref: "NFC-2026-04", title: "Variation Claim - Facade",  date: "28 Apr 2026" },
  { ref: "NFC-2026-01", title: "MEP Additional Works",      date: "15 Mar 2026" },
];

const DOCUMENTS = [
  { name: "Latest Final Account Pack v1.2", date: "09 May 2026" },
  { name: "Negotiation Schedule v1.3",      date: "09 May 2026" },
  { name: "Supporting Evidence Index v1.1", date: "09 May 2026" },
  { name: "Board Pack v1.1",                date: "09 May 2026" },
];

const SIGN_OFF_STEPS = [
  { label: "Commercial Manager", name: "James Walker",  done: true },
  { label: "Client Rep",         name: "Sophie Morgan", done: false },
  { label: "Director Approval",  name: "David Miller",  done: false },
];

const TOOLTIP_STYLE = {
  background: "var(--bg-surface)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 11,
  color: "var(--text-primary)",
};

interface BarShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: { fill: string };
}

function ColoredBar(props: BarShapeProps) {
  const { x = 0, y = 0, width = 0, height = 0, payload } = props;
  return <rect x={x} y={y} width={width} height={height} fill={payload?.fill ?? "#3B5EE8"} rx={3} />;
}

const KPI_CARDS = [
  { label: "Target Final Account",      value: formatCurrency(2950000), sub: "Baseline Contract Sum",  variant: "" },
  { label: "Forecast Final Account",    value: formatCurrency(2721000), sub: "92.2% of contract",      variant: "" },
  { label: "Agreed to Date",            value: formatCurrency(2183000), sub: "80.3% of contract",      variant: "success" },
  { label: "Unresolved Items",          value: formatCurrency(541000),  sub: "18.8% of contract",      variant: "warning" },
  { label: "Recovery Opportunities",    value: formatCurrency(96450),   sub: "3 identified",           variant: "success" },
  { label: "Retention Outstanding",     value: formatCurrency(88500),   sub: "3.0% of contract",       variant: "" },
  { label: "Margin at Final Account",   value: formatCurrency(308800),  sub: "10.5% of contract",      variant: "success" },
  { label: "Days to Target Settlement", value: "56 days",               sub: "Target: 10 days",        variant: "warning" },
];

export default function FinalAccountsPage() {
  const [search, setSearch] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const items: FAItem[] = RIVERSIDE_FINAL_ACCOUNT_ITEMS;
  const filtered = items.filter((r) =>
    search === "" || r.title.toLowerCase().includes(search.toLowerCase()) || r.ref.toLowerCase().includes(search.toLowerCase())
  );

  const totalClaim  = items.reduce((s, r) => s + r.claimValue, 0);
  const totalAgreed = items.reduce((s, r) => s + r.agreedValue, 0);
  const totalDiff   = totalAgreed - totalClaim;

  function toggleRow(ref: string) {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(ref)) next.delete(ref);
      else next.add(ref);
      return next;
    });
  }

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
                  : k.variant === "danger"  ? "var(--danger)"
                  : k.variant === "warning" ? "var(--warning)"
                  : "var(--text-primary)",
              }}
            >
              {k.value}
            </span>
            <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{k.sub}</span>
          </div>
        ))}
      </div>

      {/* Main 2-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT 2/3 */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Reconciliation Register */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b flex-wrap gap-2" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Final Accounts Reconciliation Register</h4>
                <span className="badge chip-muted">9 line items</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={13} className="absolute left-2 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
                  <input
                    className="form-input h-7 text-xs pl-7 w-40"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <button className="btn btn-secondary btn-sm text-xs"><Download size={12} />Export</button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item / Package</th>
                    <th className="text-right">Claim Value</th>
                    <th className="text-right">Agreed Value</th>
                    <th className="text-right">Difference</th>
                    <th>Status</th>
                    <th>Owner</th>
                    <th>Last Updated</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, i) => {
                    const diff = r.agreedValue - r.claimValue;
                    const isExpanded = expandedRows.has(r.ref);
                    return (
                      <>
                        <tr key={r.ref} className="cursor-pointer hover:bg-[var(--bg-muted)]" onClick={() => toggleRow(r.ref)}>
                          <td>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold" style={{ color: "var(--text-muted)", transform: isExpanded ? "rotate(90deg)" : "none", display: "inline-block", transition: "transform 0.2s" }}>›</span>
                              <div>
                                <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{r.title}</p>
                                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{r.ref} · {r.package}</p>
                              </div>
                            </div>
                          </td>
                          <td className="text-right text-xs tabular-nums">{formatCurrency(r.claimValue)}</td>
                          <td className="text-right text-xs tabular-nums font-semibold" style={{ color: "var(--text-primary)" }}>{formatCurrency(r.agreedValue)}</td>
                          <td
                            className="text-right text-xs tabular-nums font-semibold"
                            style={{ color: diff < 0 ? "var(--danger)" : diff > 0 ? "var(--success)" : "var(--text-muted)" }}
                          >
                            {diff !== 0 ? `${diff > 0 ? "+" : ""}${formatCurrency(diff)}` : "—"}
                          </td>
                          <td>
                            <span className={cn("badge", STATUS_CHIP[r.status] ?? "chip-muted")}>
                              {STATUS_LABEL[r.status] ?? r.status}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-1.5">
                              <Avatar name={r.owner} idx={i} size={6} />
                              <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{r.owner}</span>
                            </div>
                          </td>
                          <td className="text-xs" style={{ color: "var(--text-muted)" }}>09 May 2026</td>
                          <td><button className="btn btn-ghost btn-icon btn-sm"><MoreHorizontal size={13} /></button></td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${r.ref}-expanded`} style={{ background: "var(--bg-muted)" }}>
                            <td colSpan={8} className="px-8 py-3">
                              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                                No sub-items available. Click Actions to add sub-items or view full detail.
                              </p>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                  {/* Total row */}
                  <tr style={{ background: "var(--bg-muted)", borderTop: "2px solid var(--border)" }}>
                    <td className="font-bold text-xs" style={{ color: "var(--text-primary)" }}>Total</td>
                    <td className="text-right text-xs tabular-nums font-bold" style={{ color: "var(--text-primary)" }}>{formatCurrency(totalClaim)}</td>
                    <td className="text-right text-xs tabular-nums font-bold" style={{ color: "var(--text-primary)" }}>{formatCurrency(totalAgreed)}</td>
                    <td className="text-right text-xs tabular-nums font-bold" style={{ color: totalDiff < 0 ? "var(--danger)" : "var(--success)" }}>
                      {formatCurrency(totalDiff)}
                    </td>
                    <td colSpan={4} />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Movement Waterfall */}
          <div className="card p-5">
            <h4 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Movement to Forecast Final Account</h4>
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart data={bridgeForChart} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}K`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number, name: string) => name === "bar" ? [`£${v}K`, "Value"] : [v, ""]} />
                <Bar dataKey="spacer" stackId="a" fill="transparent" />
                <Bar dataKey="bar" stackId="a" shape={(props: BarShapeProps) => <ColoredBar {...props} />} radius={[3, 3, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Negotiation Tracker */}
          <div className="card p-5">
            <h4 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Negotiation Tracker</h4>
            <div className="flex items-stretch gap-0 overflow-x-auto">
              {NEGOTIATION_STAGES.map((stage, i) => (
                <div key={stage.label} className="flex items-center flex-1 min-w-[80px]">
                  <div
                    className="flex flex-col items-center flex-1 gap-1 py-3 px-2 rounded-xl text-center"
                    style={{
                      background: stage.active ? "#fef3c7" : "var(--bg-muted)",
                      border: stage.active ? "2px solid #F59E0B" : "2px solid transparent",
                    }}
                  >
                    <span
                      className="text-xl font-bold"
                      style={{ color: stage.active ? "#92400e" : "var(--text-primary)" }}
                    >
                      {stage.count}
                    </span>
                    <span
                      className="text-[10px] font-medium"
                      style={{ color: stage.active ? "#92400e" : "var(--text-muted)" }}
                    >
                      {stage.label}
                    </span>
                  </div>
                  {i < NEGOTIATION_STAGES.length - 1 && (
                    <span className="text-lg flex-shrink-0 mx-0.5" style={{ color: "var(--text-muted)" }}>›</span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3 text-xs" style={{ color: "var(--text-muted)" }}>
              <span>Total Unresolved Value: <strong style={{ color: "var(--text-primary)" }}>£1,449,150</strong></span>
              <span>Potential Recovery: <strong style={{ color: "var(--success)" }}>£96,450</strong></span>
            </div>
          </div>

          {/* AI Insight */}
          <div className="card p-5" style={{ borderColor: "#ede9fe" }}>
            <div className="flex items-center gap-2 mb-3">
              <h4 className="text-sm font-semibold" style={{ color: "#8B5CF6" }}>AI Insight — Final Accounts</h4>
              <span className="badge text-[10px]" style={{ background: "#8B5CF6", color: "#fff" }}>Beta</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl" style={{ background: "#f0fdf4" }}>
                <p className="text-xs font-semibold mb-1" style={{ color: "#059669" }}>Potential Recoveries</p>
                <p className="text-xs leading-relaxed" style={{ color: "#065f46" }}>
                  £96,450 identified across 3 items with strong supporting evidence.
                </p>
              </div>
              <div className="p-3 rounded-xl" style={{ background: "#fef2f2" }}>
                <p className="text-xs font-semibold mb-1" style={{ color: "var(--danger)" }}>Weak / High Risk Items</p>
                <p className="text-xs leading-relaxed" style={{ color: "#7f1d1d" }}>
                  £228,600 at risk due to weak evidence or late submission.
                </p>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold mb-2" style={{ color: "#8B5CF6" }}>Recommended Next Actions</p>
              <div className="flex flex-col gap-1.5">
                {[
                  "Submit MEP variation claim by 16 May to protect entitlement.",
                  "Close 3 aged items to reduce settlement cycle by 12 days.",
                ].map((action, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={13} style={{ color: "#8B5CF6", flexShrink: 0, marginTop: 1 }} />
                    <p className="text-xs" style={{ color: "#6d28d9" }}>{action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="card p-5">
            <h4 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Documents & Export</h4>
            <div className="flex flex-col gap-2">
              {DOCUMENTS.map((doc) => (
                <div key={doc.name} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--bg-muted)" }}>
                  <div className="flex items-center gap-2">
                    <FileText size={14} style={{ color: "var(--primary)" }} />
                    <div>
                      <p className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{doc.name}</p>
                      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{doc.date}</p>
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-icon btn-sm"><Download size={13} /></button>
                </div>
              ))}
            </div>
            <button className="btn btn-primary btn-sm text-xs mt-3">Generate Full Export</button>
          </div>
        </div>

        {/* RIGHT 1/3 */}
        <div className="flex flex-col gap-4">
          {/* Key Dates */}
          <div className="card p-4">
            <h4 className="text-xs font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Key Dates</h4>
            <div className="flex flex-col">
              {KEY_DATES.map((d) => (
                <div key={d.label} className="flex justify-between items-center py-2 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>{d.label}</span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: d.highlight ? "var(--primary)" : d.value === "TBC" ? "var(--text-muted)" : "var(--text-primary)" }}
                  >
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Responsible Team */}
          <div className="card p-4">
            <h4 className="text-xs font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Responsible Team</h4>
            <div className="flex flex-col gap-3">
              {TEAM.map((m, i) => (
                <div key={m.name} className="flex items-center gap-2">
                  <Avatar name={m.name} idx={i} size={7} />
                  <div className="flex-1">
                    <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{m.name}</p>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{m.role}</p>
                  </div>
                  <span className="badge chip-info text-[10px]">{m.chip}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Related Notices */}
          <div className="card p-4">
            <h4 className="text-xs font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Related Notices</h4>
            <div className="flex flex-col gap-2">
              {RELATED_NOTICES.map((n) => (
                <div key={n.ref} className="flex flex-col gap-0.5 p-2 rounded-lg" style={{ background: "var(--bg-muted)" }}>
                  <span className="text-[11px] font-semibold" style={{ color: "var(--primary)" }}>{n.ref}</span>
                  <p className="text-xs" style={{ color: "var(--text-primary)" }}>{n.title}</p>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{n.date}</p>
                </div>
              ))}
              <button className="text-xs font-medium" style={{ color: "var(--primary)" }}>+2 more notices — View all</button>
            </div>
          </div>

          {/* Dispute Risk */}
          <div className="card p-4" style={{ borderColor: "#fecaca", borderWidth: 1 }}>
            <h4 className="text-xs font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Dispute Risk</h4>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: "var(--danger)" }} />
              <span className="text-xs font-bold" style={{ color: "var(--danger)" }}>High</span>
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>3 high risk items | £228,600 exposure</p>
          </div>

          {/* Sign-off Workflow */}
          <div className="card p-4">
            <h4 className="text-xs font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Sign-off Workflow</h4>
            <div className="flex flex-col gap-2">
              {SIGN_OFF_STEPS.map((step, i) => (
                <div key={step.label} className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: step.done ? "var(--success)" : "var(--bg-muted)",
                      border: `2px solid ${step.done ? "var(--success)" : "var(--border)"}`,
                    }}
                  >
                    {step.done ? (
                      <CheckCircle2 size={13} color="#fff" />
                    ) : (
                      <Circle size={11} style={{ color: "var(--text-muted)" }} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>{step.label}</p>
                    <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{step.name}</p>
                  </div>
                  <span
                    className="badge text-[10px]"
                    style={{
                      background: step.done ? "#d1fae5" : "var(--bg-muted)",
                      color: step.done ? "#059669" : "var(--text-muted)",
                    }}
                  >
                    {step.done ? "Signed" : "Pending"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Unresolved Donut */}
          <div className="card p-4">
            <h4 className="text-xs font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Unresolved Items by Age</h4>
            <div className="relative">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={DONUT_DATA} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2} dataKey="value">
                    {DONUT_DATA.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} formatter={(v: number) => [`£${v}K`, ""]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>£541K</p>
                  <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>Total</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1 mt-2">
              {DONUT_DATA.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: "var(--border)" }}>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          All values exclude VAT | Last updated: 09 May 2026, 09:41 · by James Walker
        </span>
        <button className="btn btn-secondary btn-sm text-xs">
          <RefreshCw size={12} />Refresh Data
        </button>
      </div>
    </div>
  );
}
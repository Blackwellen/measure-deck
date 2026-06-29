"use client";

import { useState, useMemo } from "react";
import { Search, Download, Plus, MoreHorizontal, AlertTriangle, FileText, ChevronRight } from "lucide-react";
import { cn, formatCurrency, getInitials } from "@/lib/utils";
import { RIVERSIDE_CHANGES } from "@/lib/seed/projects";

type SeedChange = typeof RIVERSIDE_CHANGES[number];

const STATUS_CHIP: Record<string, string> = {
  pending:      "chip-warning",
  approved:     "chip-success",
  rejected:     "chip-danger",
  under_review: "chip-info",
  negotiation:  "chip-warning",
};

const STATUS_LABEL: Record<string, string> = {
  pending:      "Pending",
  approved:     "Approved",
  rejected:     "Rejected",
  under_review: "Under Review",
  negotiation:  "Negotiation",
};

const RISK_CHIP: Record<string, string> = {
  high:   "chip-danger",
  medium: "chip-warning",
  low:    "chip-success",
};

const AVATAR_COLORS = ["#3B5EE8", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444"];

function Avatar({ name, idx }: { name: string; idx: number }) {
  const bg = AVATAR_COLORS[idx % AVATAR_COLORS.length];
  return (
    <div
      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
      style={{ background: bg }}
      title={name}
    >
      {getInitials(name)}
    </div>
  );
}

const APPROVAL_STEPS = [
  { step: 1, label: "Commercial Review", assignee: "James Walker",  status: "Pending" },
  { step: 2, label: "Client Approval",   assignee: "Neha Sharma",   status: "Pending" },
  { step: 3, label: "Final Sign-off",    assignee: "David Wilson",  status: "Pending" },
];

export default function ChangesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [selectedRef, setSelectedRef] = useState("CH-024-011");

  const filtered = useMemo(() => {
    return RIVERSIDE_CHANGES.filter((c) => {
      if (search && !c.title.toLowerCase().includes(search.toLowerCase()) && !c.ref.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (riskFilter !== "all" && c.risk !== riskFilter) return false;
      return true;
    });
  }, [search, statusFilter, riskFilter]);

  const selected: SeedChange | undefined = RIVERSIDE_CHANGES.find((c) => c.ref === selectedRef);

  return (
    <div className="flex flex-col gap-5">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Total Change Value", value: formatCurrency(342450), sub: "11.6% of contract value", variant: "" },
          { label: "Approved Value",     value: formatCurrency(152800), sub: "5.2%", variant: "success" },
          { label: "Pending Value",      value: formatCurrency(121350), sub: "4.1%", variant: "warning" },
          { label: "Rejected Value",     value: formatCurrency(23700),  sub: "0.8%", variant: "danger" },
          { label: "Net Change Impact",  value: formatCurrency(129100), sub: "4.4% increase", variant: "success" },
        ].map((k) => (
          <div key={k.label} className="card p-4 flex flex-col gap-1">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{k.label}</span>
            <span
              className="text-lg font-bold"
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
            <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{k.sub}</span>
          </div>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input
            className="form-input h-8 text-sm pl-8 w-full"
            placeholder="Search changes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="form-input h-8 text-sm px-2 pr-7" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="under_review">Under Review</option>
        </select>
        <select className="form-input h-8 text-sm px-2 pr-7" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
          <option value="all">All Risk</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select className="form-input h-8 text-sm px-2 pr-7">
          <option value="all">All Packages</option>
          <option value="PKG-02">PKG-02</option>
          <option value="PKG-03">PKG-03</option>
          <option value="PKG-04">PKG-04</option>
        </select>
        <div className="flex gap-2 ml-auto">
          <button className="btn btn-secondary btn-sm text-xs"><Download size={12} />Export</button>
          <button className="btn btn-primary btn-sm text-xs"><Plus size={12} />New Change</button>
        </div>
      </div>

      {/* Table + Right Panel */}
      <div className="flex gap-4" style={{ minHeight: 500 }}>
        {/* Table */}
        <div className="card overflow-hidden flex-1 min-w-0">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Title</th>
                  <th>Package</th>
                  <th>Raised By</th>
                  <th className="text-right">Requested</th>
                  <th className="text-right">Assessed</th>
                  <th>Status</th>
                  <th>Risk</th>
                  <th className="text-center">Docs</th>
                  <th>Date Raised</th>
                  <th>Decision Due</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.ref}
                    className={cn("cursor-pointer", selectedRef === c.ref && "bg-[var(--bg-muted)]")}
                    onClick={() => setSelectedRef(c.ref)}
                  >
                    <td>
                      <button
                        className="text-xs font-mono font-semibold"
                        style={{ color: "var(--primary)" }}
                        onClick={(e) => { e.stopPropagation(); setSelectedRef(c.ref); }}
                      >
                        {c.ref}
                      </button>
                    </td>
                    <td className="font-medium text-sm max-w-[180px]">
                      <span className="line-clamp-2">{c.title}</span>
                    </td>
                    <td>
                      <span className="badge chip-muted text-[11px]">{c.package}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Avatar name={c.raisedBy} idx={RIVERSIDE_CHANGES.indexOf(c)} />
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{c.raisedBy}</span>
                      </div>
                    </td>
                    <td className="text-right text-xs tabular-nums font-semibold">{formatCurrency(c.requestedValue)}</td>
                    <td className="text-right text-xs tabular-nums">{formatCurrency(c.assessedValue)}</td>
                    <td>
                      <span className={cn("badge", STATUS_CHIP[c.status] ?? "chip-muted")}>
                        {STATUS_LABEL[c.status] ?? c.status}
                      </span>
                    </td>
                    <td>
                      <span className={cn("badge", RISK_CHIP[c.risk] ?? "chip-muted")} style={{ textTransform: "capitalize" }}>
                        {c.risk}
                      </span>
                    </td>
                    <td className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
                      <span className="flex items-center gap-1 justify-center">
                        <FileText size={11} />{c.evidenceCount}
                      </span>
                    </td>
                    <td className="text-xs" style={{ color: "var(--text-muted)" }}>{c.dateRaised}</td>
                    <td
                      className="text-xs font-medium"
                      style={{ color: c.isOverdue ? "var(--danger)" : "var(--text-muted)" }}
                    >
                      {c.decisionDue}
                      {c.isOverdue && (
                        <span className="ml-1 text-[10px]">(Overdue)</span>
                      )}
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-icon btn-sm"><MoreHorizontal size={13} /></button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={12} className="text-center py-10" style={{ color: "var(--text-muted)" }}>
                      No changes match your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel */}
        {selected && (
          <div className="card p-5 flex-shrink-0 w-96 flex flex-col gap-4 overflow-y-auto" style={{ maxHeight: 700 }}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold" style={{ color: "var(--primary)" }}>{selected.ref}</span>
                <span className={cn("badge", STATUS_CHIP[selected.status] ?? "chip-muted")}>
                  {STATUS_LABEL[selected.status] ?? selected.status}
                </span>
              </div>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelectedRef("")}>
                <ChevronRight size={13} />
              </button>
            </div>

            <div>
              <h4 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{selected.title}</h4>
              <span className="badge chip-muted text-[11px] mt-1">{selected.package}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Requested", value: formatCurrency(selected.requestedValue) },
                { label: "Assessed",  value: formatCurrency(selected.assessedValue) },
                { label: "Date Raised", value: selected.dateRaised },
                { label: "Decision Due", value: selected.decisionDue },
              ].map((r) => (
                <div key={r.label} className="flex flex-col gap-0.5">
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{r.label}</span>
                  <span
                    className="text-xs font-semibold"
                    style={{
                      color:
                        r.label === "Decision Due" && selected.isOverdue
                          ? "var(--danger)"
                          : "var(--text-primary)",
                    }}
                  >
                    {r.value}
                    {r.label === "Decision Due" && selected.isOverdue && (
                      <span className="ml-1 font-normal text-[10px]">(Overdue)</span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: selected.risk === "high" ? "var(--danger)" : selected.risk === "medium" ? "var(--warning)" : "var(--success)" }}
              />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Risk Level: <span className="font-semibold capitalize" style={{ color: "var(--text-primary)" }}>{selected.risk}</span>
              </span>
            </div>

            <div>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Raised By</span>
              <div className="flex items-center gap-2 mt-1">
                <Avatar name={selected.raisedBy} idx={0} />
                <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{selected.raisedBy}</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>/ Riverside Living</span>
              </div>
            </div>

            {selected.ref === "CH-024-011" && (
              <div>
                <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  Upgrade to balcony glazing system to improve thermal performance and acoustic rating in line with planning condition 12.
                </p>
                <button className="text-xs mt-1 font-medium" style={{ color: "var(--primary)" }}>View more</button>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Linked Evidence: <strong style={{ color: "var(--text-primary)" }}>{selected.evidenceCount} documents</strong>
                </span>
                <button className="text-xs font-medium" style={{ color: "var(--primary)" }}>View all</button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Impacted Areas: <strong style={{ color: "var(--text-primary)" }}>2 packages</strong>
                </span>
                <button className="text-xs font-medium" style={{ color: "var(--primary)" }}>View details</button>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold block mb-2" style={{ color: "var(--text-primary)" }}>Responsible Team</span>
              <div className="flex gap-1.5">
                {["James Walker", "Sophie Morgan", "Michael Green"].map((name, i) => (
                  <Avatar key={name} name={name} idx={i} />
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold block mb-2" style={{ color: "var(--text-primary)" }}>Approval Path</span>
              <div className="flex flex-col gap-2">
                {APPROVAL_STEPS.map((step) => (
                  <div key={step.step} className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                      style={{ background: "var(--bg-muted)", color: "var(--text-muted)" }}
                    >
                      {step.step}
                    </span>
                    <div className="flex-1">
                      <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{step.label}</span>
                      <span className="text-xs ml-1" style={{ color: "var(--text-muted)" }}>— {step.assignee}</span>
                    </div>
                    <span className="badge chip-muted text-[11px]">{step.status}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl p-3 flex flex-col gap-2" style={{ background: "#f5f3ff", border: "1px solid #ede9fe" }}>
              <div className="flex items-center gap-1.5">
                <AlertTriangle size={13} style={{ color: "#8B5CF6" }} />
                <span className="text-xs font-semibold" style={{ color: "#8B5CF6" }}>AI Recommendation (High Risk)</span>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "#6d28d9" }}>
                This change is high risk due to late submission and potential impact on critical path activities. Evidence package should be completed before decision due date.
              </p>
              <button className="text-[11px] font-medium self-start" style={{ color: "#8B5CF6" }}>View AI Analysis</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
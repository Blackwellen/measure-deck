"use client";

import { useState, useMemo } from "react";
import { Search, Download, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type AuditAction = "CREATE" | "UPDATE" | "DELETE" | "VIEW" | "APPROVE";

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  oldValue: string | null;
  newValue: string | null;
  ip: string;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const AUDIT_LOG: AuditEntry[] = [
  { id: "AUD-847", timestamp: "2025-05-14 14:23:11", user: "Sarah Chen",      action: "UPDATE",  resourceType: "change_event",        resourceId: "CH-024-014", oldValue: "status: draft",                      newValue: "status: submitted",             ip: "192.168.1.42" },
  { id: "AUD-846", timestamp: "2025-05-14 11:05:33", user: "James Ward",      action: "APPROVE", resourceType: "payment_application",  resourceId: "APP-008",    oldValue: "certified: null",                    newValue: "certified: £842,500",           ip: "192.168.1.18" },
  { id: "AUD-845", timestamp: "2025-05-13 16:44:22", user: "Rachel Kim",      action: "CREATE",  resourceType: "evidence_item",        resourceId: "EV-008",     oldValue: null,                                 newValue: "title: Delay Analysis Report",  ip: "192.168.1.55" },
  { id: "AUD-844", timestamp: "2025-05-13 09:12:05", user: "Marcus Thompson", action: "CREATE",  resourceType: "change_event",        resourceId: "CH-024-015", oldValue: null,                                 newValue: "ref: CH-024-015, value: £18,400", ip: "192.168.1.31" },
  { id: "AUD-843", timestamp: "2025-05-12 15:30:18", user: "Sarah Chen",      action: "UPDATE",  resourceType: "change_event",        resourceId: "CH-024-012", oldValue: "assessed_value: £31,000",            newValue: "assessed_value: £34,200",       ip: "192.168.1.42" },
  { id: "AUD-842", timestamp: "2025-05-11 10:55:44", user: "James Ward",      action: "CREATE",  resourceType: "payment_notice",       resourceId: "PLN-008",    oldValue: null,                                 newValue: "application: APP-008, amount: £842,500", ip: "192.168.1.18" },
  { id: "AUD-841", timestamp: "2025-05-11 09:20:11", user: "Rachel Kim",      action: "UPDATE",  resourceType: "evidence_item",        resourceId: "EV-005",     oldValue: "linked_to: null",                    newValue: "linked_to: CH-024-012",         ip: "192.168.1.55" },
  { id: "AUD-840", timestamp: "2025-05-09 14:08:55", user: "Marcus Thompson", action: "UPDATE",  resourceType: "change_event",        resourceId: "CH-024-009", oldValue: "status: assessed",                   newValue: "status: disputed",              ip: "192.168.1.31" },
  { id: "AUD-839", timestamp: "2025-05-08 11:33:27", user: "James Ward",      action: "VIEW",    resourceType: "report",               resourceId: "RPT-023",    oldValue: null,                                 newValue: null,                            ip: "192.168.1.18" },
  { id: "AUD-838", timestamp: "2025-05-07 16:22:09", user: "Sarah Chen",      action: "DELETE",  resourceType: "draft",                resourceId: "DRAFT-005",  oldValue: "title: Preliminary pricing draft",   newValue: null,                            ip: "192.168.1.42" },
  { id: "AUD-837", timestamp: "2025-05-06 13:11:40", user: "Rachel Kim",      action: "CREATE",  resourceType: "evidence_item",        resourceId: "EV-007",     oldValue: null,                                 newValue: "title: Site Survey Photos",     ip: "192.168.1.55" },
  { id: "AUD-836", timestamp: "2025-05-05 10:44:22", user: "Marcus Thompson", action: "UPDATE",  resourceType: "change_event",        resourceId: "CH-024-010", oldValue: "status: draft",                      newValue: "status: notified",              ip: "192.168.1.31" },
  { id: "AUD-835", timestamp: "2025-05-04 09:30:00", user: "James Ward",      action: "APPROVE", resourceType: "payment_application",  resourceId: "APP-007",    oldValue: "certified: null",                    newValue: "certified: £716,000",           ip: "192.168.1.18" },
  { id: "AUD-834", timestamp: "2025-05-03 15:55:11", user: "Sarah Chen",      action: "UPDATE",  resourceType: "change_event",        resourceId: "CH-024-008", oldValue: "contractor_submission: £22,000",     newValue: "contractor_submission: £25,500", ip: "192.168.1.42" },
  { id: "AUD-833", timestamp: "2025-05-02 11:20:33", user: "Rachel Kim",      action: "CREATE",  resourceType: "evidence_item",        resourceId: "EV-006",     oldValue: null,                                 newValue: "title: RFI-041 Response",       ip: "192.168.1.55" },
];

const ALL_USERS = Array.from(new Set(AUDIT_LOG.map((e) => e.user)));
const ALL_ACTIONS: AuditAction[] = ["CREATE", "UPDATE", "DELETE", "VIEW", "APPROVE"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ACTION_CHIP: Record<AuditAction, string> = {
  CREATE:  "chip-success",
  UPDATE:  "chip-info",
  APPROVE: "chip-success",
  DELETE:  "chip-danger",
  VIEW:    "chip-muted",
};

function formatResourceType(rt: string): string {
  return rt.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Version History Panel ────────────────────────────────────────────────────

function VersionHistoryPanel({ entry }: { entry: AuditEntry | null }) {
  if (!entry) {
    return (
      <div
        className="card p-4 flex flex-col gap-3 h-fit"
        style={{ minHeight: 200 }}
      >
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Version History
        </h3>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Select a row to inspect its version history and diff.
        </p>
      </div>
    );
  }

  const chainOfCustody = [
    { label: "Created",  value: `Record created`, by: "System", when: entry.timestamp },
    { label: "Modified", value: `${entry.action} by ${entry.user}`, by: entry.user, when: entry.timestamp },
    { label: "Current",  value: entry.newValue ?? "—", by: entry.user, when: entry.timestamp },
  ];

  return (
    <div className="card p-4 flex flex-col gap-4 h-fit">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Version History
        </h3>
        <span className="badge chip-muted text-[10px]">{entry.id}</span>
      </div>

      {/* JSON Diff */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
          Change Diff
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div
            className="rounded-lg p-2.5"
            style={{ background: "#FEF2F2" }}
          >
            <p className="text-[10px] font-semibold mb-1" style={{ color: "var(--danger)" }}>
              Before
            </p>
            <p className="text-[11px] font-mono break-all leading-relaxed" style={{ color: "#7F1D1D" }}>
              {entry.oldValue ?? "—"}
            </p>
          </div>
          <div
            className="rounded-lg p-2.5"
            style={{ background: "#ECFDF5" }}
          >
            <p className="text-[10px] font-semibold mb-1" style={{ color: "var(--success)" }}>
              After
            </p>
            <p className="text-[11px] font-mono break-all leading-relaxed" style={{ color: "#064E3B" }}>
              {entry.newValue ?? "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Chain of Custody */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
          Chain of Custody
        </p>
        <div className="flex flex-col gap-0">
          {chainOfCustody.map((step, i) => (
            <div key={i} className="flex gap-2">
              <div className="flex flex-col items-center">
                <div
                  className="w-2 h-2 rounded-full mt-1 flex-shrink-0"
                  style={{ background: "var(--primary)" }}
                />
                {i < chainOfCustody.length - 1 && (
                  <div
                    className="w-px flex-1 my-0.5"
                    style={{ background: "var(--border)", minHeight: 14 }}
                  />
                )}
              </div>
              <div className="pb-2 min-w-0">
                <p className="text-[10px] font-semibold" style={{ color: "var(--text-secondary)" }}>
                  {step.label}
                </p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {step.by} · {step.when}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export button */}
      <button
        type="button"
        className="btn btn-secondary btn-sm flex items-center gap-2 w-full justify-center"
      >
        <Download size={12} />
        Export this record
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function GovernanceAuditPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<AuditAction | "">("");
  const [userFilter, setUserFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedId, setSelectedId] = useState<string>("AUD-847");
  const [page, setPage] = useState(1);

  const PAGE_SIZE = 10;
  const TOTAL = 847;

  const filtered = useMemo(() => {
    return AUDIT_LOG.filter((entry) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        entry.id.toLowerCase().includes(q) ||
        entry.user.toLowerCase().includes(q) ||
        entry.resourceId.toLowerCase().includes(q) ||
        entry.resourceType.toLowerCase().includes(q);
      const matchAction = !actionFilter || entry.action === actionFilter;
      const matchUser = !userFilter || entry.user === userFilter;
      const matchFrom = !dateFrom || entry.timestamp >= dateFrom;
      const matchTo = !dateTo || entry.timestamp <= dateTo + " 23:59:59";
      return matchSearch && matchAction && matchUser && matchFrom && matchTo;
    });
  }, [search, actionFilter, userFilter, dateFrom, dateTo]);

  const selectedEntry = AUDIT_LOG.find((e) => e.id === selectedId) ?? null;

  const handleExportCsv = () => {
    const header = "ID,Timestamp,User,Action,Resource Type,Resource ID,Old Value,New Value,IP";
    const rows = filtered.map((e) =>
      [e.id, e.timestamp, e.user, e.action, e.resourceType, e.resourceId, e.oldValue ?? "", e.newValue ?? "", e.ip]
        .map((v) => `"${v}"`)
        .join(",")
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "audit-log.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card p-4 flex flex-col gap-1 border-l-4" style={{ borderLeftColor: "var(--primary)" }}>
          <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Total Events</span>
          <span className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>847</span>
        </div>
        <div className="card p-4 flex flex-col gap-1 border-l-4" style={{ borderLeftColor: "var(--success)" }}>
          <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>This Week</span>
          <span className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>23</span>
        </div>
        <div className="card p-4 flex flex-col gap-1 border-l-4" style={{ borderLeftColor: "var(--warning)" }}>
          <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Data Changes</span>
          <span className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>156</span>
        </div>
      </div>

      {/* Main layout: table + side panel */}
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Left: Filters + Table */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Filter toolbar */}
          <div className="card p-3 flex flex-col sm:flex-row gap-2 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[160px]">
              <Search
                size={13}
                className="absolute left-2.5 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type="text"
                placeholder="Search audit log…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input pl-7 text-xs w-full"
              />
            </div>

            {/* Action type */}
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value as AuditAction | "")}
              className="form-input text-xs"
              style={{ minWidth: 130 }}
            >
              <option value="">All Actions</option>
              {ALL_ACTIONS.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>

            {/* User */}
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="form-input text-xs"
              style={{ minWidth: 140 }}
            >
              <option value="">All Users</option>
              {ALL_USERS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>

            {/* Date from */}
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="form-input text-xs"
              aria-label="From date"
            />
            {/* Date to */}
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="form-input text-xs"
              aria-label="To date"
            />

            {/* Export */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="btn btn-secondary btn-sm flex items-center gap-1.5 whitespace-nowrap"
            >
              <Download size={12} />
              Export CSV
            </button>
          </div>

          {/* Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Resource Type</th>
                    <th>Resource ID</th>
                    <th>Old Value</th>
                    <th>New Value</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-8 text-sm" style={{ color: "var(--text-muted)" }}>
                        No audit entries match your filters.
                      </td>
                    </tr>
                  )}
                  {filtered.map((entry) => (
                    <tr
                      key={entry.id}
                      onClick={() => setSelectedId(entry.id)}
                      className={cn(
                        "cursor-pointer transition-colors",
                        selectedId === entry.id && "bg-blue-50"
                      )}
                      style={
                        selectedId === entry.id
                          ? { background: "#EFF2FD" }
                          : undefined
                      }
                    >
                      <td>
                        <span className="font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>
                          {entry.timestamp}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                          {entry.user}
                        </span>
                      </td>
                      <td>
                        <span className={cn("badge text-[10px]", ACTION_CHIP[entry.action])}>
                          {entry.action}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          {formatResourceType(entry.resourceType)}
                        </span>
                      </td>
                      <td>
                        <span className="badge chip-muted text-[10px] font-mono">
                          {entry.resourceId}
                        </span>
                      </td>
                      <td>
                        <span
                          className="text-[11px] font-mono truncate block max-w-[120px]"
                          style={{ color: "var(--text-muted)" }}
                          title={entry.oldValue ?? ""}
                        >
                          {entry.oldValue ?? "—"}
                        </span>
                      </td>
                      <td>
                        <span
                          className="text-[11px] font-mono truncate block max-w-[120px]"
                          style={{ color: "var(--text-muted)" }}
                          title={entry.newValue ?? ""}
                        >
                          {entry.newValue ?? "—"}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>
                          {entry.ip}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div
              className="flex items-center justify-between px-4 py-3 border-t"
              style={{ borderColor: "var(--border)" }}
            >
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                1–{Math.min(PAGE_SIZE, filtered.length)} of {TOTAL}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="btn btn-ghost btn-sm flex items-center gap-1 disabled:opacity-40"
                >
                  <ChevronLeft size={13} /> Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  className="btn btn-ghost btn-sm flex items-center gap-1"
                >
                  Next <ChevronRight size={13} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Version History Panel (1/4) */}
        <div className="lg:w-72 xl:w-80 flex-shrink-0">
          <VersionHistoryPanel entry={selectedEntry} />
        </div>
      </div>
    </div>
  );
}

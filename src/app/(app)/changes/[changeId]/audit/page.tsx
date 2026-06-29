"use client";

import { useState } from "react";
import { ShieldCheck, Download } from "lucide-react";
import { CE025_AUDIT_TRAIL, type SeedAuditEntry } from "@/lib/seed/projects";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDateTime(s: string): string {
  return new Date(s).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }) + " UTC";
}

function timeAgo(s: string): string {
  const diff = Date.now() - new Date(s).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function actionColor(action: SeedAuditEntry["action"]): string {
  const map: Record<SeedAuditEntry["action"], string> = {
    CREATED: "var(--primary)",
    SUBMITTED: "var(--success)",
    UPDATED: "var(--warning)",
    PRICING_UPDATED: "var(--warning)",
    EVIDENCE_LINKED: "#8B5CF6",
    APPROVED: "var(--success)",
  };
  return map[action] ?? "var(--text-muted)";
}

function actionChip(action: SeedAuditEntry["action"]): string {
  const map: Record<SeedAuditEntry["action"], string> = {
    CREATED: "chip-primary",
    SUBMITTED: "chip-success",
    UPDATED: "chip-warning",
    PRICING_UPDATED: "chip-warning",
    EVIDENCE_LINKED: "chip-violet",
    APPROVED: "chip-success",
  };
  return map[action] ?? "chip-muted";
}

type FilterOption = "All" | "Data Changes" | "Submissions" | "System";

function filterFn(entry: SeedAuditEntry, filter: FilterOption): boolean {
  if (filter === "All") return true;
  if (filter === "Data Changes")
    return ["UPDATED", "PRICING_UPDATED", "EVIDENCE_LINKED"].includes(entry.action);
  if (filter === "Submissions") return entry.action === "SUBMITTED";
  if (filter === "System") return entry.actor === "System";
  return true;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AuditPage() {
  const [filter, setFilter] = useState<FilterOption>("All");

  const filtered = CE025_AUDIT_TRAIL.filter((e) => filterFn(e, filter));
  const lastEntry = CE025_AUDIT_TRAIL[CE025_AUDIT_TRAIL.length - 1];

  return (
    <div className="flex flex-col gap-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="kpi-card">
          <div className="kpi-label">Total Events</div>
          <div className="kpi-value text-2xl">{CE025_AUDIT_TRAIL.length}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Data Changes</div>
          <div className="kpi-value text-2xl">
            {
              CE025_AUDIT_TRAIL.filter((e) =>
                ["UPDATED", "PRICING_UPDATED", "EVIDENCE_LINKED"].includes(e.action)
              ).length
            }
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Last Activity</div>
          <div className="text-lg font-semibold mt-1" style={{ color: "var(--text-primary)" }}>
            {lastEntry ? timeAgo(lastEntry.timestamp) : "—"}
          </div>
        </div>
      </div>

      {/* Filter + Export */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {(["All", "Data Changes", "Submissions", "System"] as FilterOption[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="btn btn-sm text-xs"
              style={{
                background: filter === f ? "var(--primary)" : "var(--bg-muted)",
                color: filter === f ? "#fff" : "var(--text-secondary)",
                border: "1px solid",
                borderColor: filter === f ? "var(--primary)" : "var(--border)",
              }}
            >
              {f}
            </button>
          ))}
        </div>
        <button className="btn btn-secondary btn-sm">
          <Download size={13} />
          Export Audit Log (PDF)
        </button>
      </div>

      {/* Timeline */}
      <div className="flex flex-col gap-0">
        {filtered.map((entry, idx) => {
          const color = actionColor(entry.action);
          const chip = actionChip(entry.action);
          return (
            <div key={entry.id} className="relative flex gap-4 pb-5 last:pb-0">
              {idx < filtered.length - 1 && (
                <div
                  className="absolute left-3.5 top-8 bottom-0 w-px"
                  style={{ background: "var(--border)" }}
                />
              )}
              {/* Dot */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 mt-0.5"
                style={{
                  background: `${color}15`,
                  border: `2px solid ${color}`,
                }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: color }}
                />
              </div>

              {/* Card */}
              <div className="flex-1 card p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {entry.actor}
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {entry.actorRole}
                    </span>
                    <span className={`badge text-[10px] ${chip}`}>{entry.action}</span>
                  </div>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {fmtDateTime(entry.timestamp)}
                  </span>
                </div>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {entry.notes}
                </p>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="card p-8 text-center">
            <div className="text-sm" style={{ color: "var(--text-muted)" }}>
              No audit entries match the selected filter.
            </div>
          </div>
        )}
      </div>

      {/* Chain of Custody */}
      <div
        className="card p-5"
        style={{ background: "rgba(16,185,129,0.04)", borderColor: "rgba(16,185,129,0.25)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={16} style={{ color: "var(--success)" }} />
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Chain of Custody Verified ✓
          </h3>
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              SHA-256 Hash:
            </span>
            <code
              className="text-xs font-mono px-2 py-1 rounded"
              style={{ background: "var(--bg-muted)", color: "var(--text-secondary)" }}
            >
              a3f4c29e8d1b67f3...9d21
            </code>
          </div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            Last verified: 14 May 2025 14:23 UTC
          </div>
          <div
            className="text-xs font-medium"
            style={{ color: "var(--success)" }}
          >
            No unauthorized modifications detected
          </div>
        </div>
      </div>
    </div>
  );
}

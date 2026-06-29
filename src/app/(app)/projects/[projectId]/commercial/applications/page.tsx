"use client";

import { Download, CheckCircle2, Clock, ChevronRight } from "lucide-react";
import { cn, formatCurrency, getInitials } from "@/lib/utils";
import { RIVERSIDE_APPLICATIONS } from "@/lib/seed/projects";

type SeedApp = typeof RIVERSIDE_APPLICATIONS[number];

const STATUS_CHIP: Record<string, string> = {
  paid:     "chip-success",
  pending:  "chip-warning",
  disputed: "chip-danger",
};

const AVATAR_COLORS = ["#3B5EE8", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444", "#06b6d4", "#ec4899", "#f97316"];

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

function CertBar({ pct }: { pct: number }) {
  const color = pct >= 90 ? "var(--success)" : pct >= 75 ? "var(--primary)" : pct >= 50 ? "var(--warning)" : "var(--danger)";
  return (
    <div className="flex items-center gap-2" style={{ minWidth: 80 }}>
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: color }} />
      </div>
      <span className="text-[11px] tabular-nums font-medium flex-shrink-0" style={{ color, minWidth: 32 }}>
        {pct.toFixed(0)}%
      </span>
    </div>
  );
}

const TIMELINE_STEPS = ["Submitted", "Under Review", "Certified", "Paid"];

export default function ApplicationsPage() {
  const apps: SeedApp[] = RIVERSIDE_APPLICATIONS;

  const totalApps    = apps.length;
  const certifiedVal = apps.reduce((s, a) => s + a.certifiedValue, 0);
  const pendingApps  = apps.filter((a) => a.status === "pending");
  const disputedApps = apps.filter((a) => a.status === "disputed");
  const paidApps     = apps.filter((a) => a.status === "paid");
  const pendingVal   = pendingApps.reduce((s, a)  => s + a.appValue, 0);
  const disputedVal  = disputedApps.reduce((s, a) => s + a.appValue, 0);
  const paidVal      = paidApps.reduce((s, a)     => s + a.certifiedValue, 0);

  return (
    <div className="flex flex-col gap-5">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total Applications",    value: String(totalApps),            sub: "across all periods",  variant: "" },
          { label: "Certified Value",        value: formatCurrency(certifiedVal), sub: "64.1% of contract",   variant: "success" },
          { label: "Pending Value",          value: formatCurrency(pendingVal),   sub: "14.1%",               variant: "warning" },
          { label: "Disputed Value",         value: formatCurrency(disputedVal),  sub: "4.4%",                variant: "danger" },
          { label: "Paid to Date",           value: formatCurrency(paidVal),      sub: "50.0%",               variant: "" },
          { label: "Avg Approval Days",      value: "8.6 days",                   sub: "Target: 10 days",     variant: "success" },
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

      {/* Actions */}
      <div className="flex justify-end">
        <button className="btn btn-secondary btn-sm text-xs"><Download size={12} />Export</button>
      </div>

      {/* Applications Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Application No</th>
                <th>Period</th>
                <th className="text-right">App Value</th>
                <th className="text-right">Certified</th>
                <th style={{ minWidth: 120 }}>Cert %</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Due</th>
                <th>Paid</th>
                <th>Notice</th>
                <th className="text-center">Docs</th>
                <th>Owner</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {apps.map((a, i) => {
                const certPct = a.appValue > 0 ? (a.certifiedValue / a.appValue) * 100 : 0;
                return (
                  <tr key={a.ref}>
                    <td>
                      <span className="font-mono text-xs font-semibold" style={{ color: "var(--primary)" }}>{a.ref}</span>
                    </td>
                    <td className="text-xs" style={{ color: "var(--text-secondary)" }}>{a.period}</td>
                    <td className="text-right text-xs tabular-nums font-semibold">{formatCurrency(a.appValue)}</td>
                    <td className="text-right text-xs tabular-nums">{formatCurrency(a.certifiedValue)}</td>
                    <td><CertBar pct={certPct} /></td>
                    <td>
                      <span className={cn("badge", STATUS_CHIP[a.status] ?? "chip-muted")} style={{ textTransform: "capitalize" }}>
                        {a.status}
                      </span>
                    </td>
                    <td className="text-xs" style={{ color: "var(--text-muted)" }}>{a.submittedDate}</td>
                    <td className="text-xs" style={{ color: a.status === "disputed" ? "var(--danger)" : "var(--text-muted)" }}>{a.dueDate}</td>
                    <td className="text-xs" style={{ color: "var(--text-muted)" }}>{a.paidDate ?? "—"}</td>
                    <td>
                      <button className="text-xs font-medium" style={{ color: "var(--primary)" }}>{a.noticeRef}</button>
                    </td>
                    <td className="text-center text-xs" style={{ color: "var(--text-muted)" }}>{a.evidenceCount}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <Avatar name={a.owner} idx={i} />
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{a.owner}</span>
                      </div>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-icon btn-sm"><ChevronRight size={13} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom 3 panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Certification Timeline */}
        <div className="card p-5">
          <h4 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Certification Timeline</h4>
          <div className="flex items-center gap-0">
            {TIMELINE_STEPS.map((step, i) => {
              const isDone = i < 3;
              return (
                <div key={step} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{
                        background: isDone ? "var(--success)" : "var(--bg-muted)",
                        border: `2px solid ${isDone ? "var(--success)" : "var(--border)"}`,
                      }}
                    >
                      {isDone ? (
                        <CheckCircle2 size={14} color="#fff" />
                      ) : (
                        <Clock size={14} style={{ color: "var(--text-muted)" }} />
                      )}
                    </div>
                    <span className="text-[11px] mt-1 text-center" style={{ color: isDone ? "var(--success)" : "var(--text-muted)" }}>
                      {step}
                    </span>
                  </div>
                  {i < TIMELINE_STEPS.length - 1 && (
                    <div className="h-0.5 flex-1 mx-1 mb-5" style={{ background: isDone ? "var(--success)" : "var(--border)" }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Overdue Items */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b" style={{ background: "#fef2f2", borderColor: "#fecaca" }}>
            <h4 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--danger)" }}>
              Overdue Items <span className="badge chip-danger">2</span>
            </h4>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {[
              { ref: "App #03", due: "15 Jan 2026", value: formatCurrency(258400), days: 148 },
              { ref: "App #02", due: "12 Dec 2025", value: formatCurrency(236750), days: 182 },
            ].map((item) => (
              <div key={item.ref} className="flex items-start justify-between gap-2 p-3 rounded-lg" style={{ background: "#fef2f2" }}>
                <div>
                  <span className="text-xs font-semibold" style={{ color: "var(--danger)" }}>{item.ref}</span>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Due {item.due}</p>
                  <p className="text-xs font-semibold mt-0.5" style={{ color: "var(--text-primary)" }}>{item.value}</p>
                </div>
                <span className="badge chip-danger text-[11px] flex-shrink-0">Overdue by {item.days} days</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Copilot Suggestions */}
        <div className="card overflow-hidden" style={{ borderColor: "#ede9fe" }}>
          <div className="px-5 py-3 border-b" style={{ background: "#f5f3ff", borderColor: "#ede9fe" }}>
            <h4 className="text-sm font-semibold" style={{ color: "#8B5CF6" }}>AI Copilot Suggestions</h4>
          </div>
          <div className="p-4 flex flex-col gap-3">
            {[
              "App #04 is due for certification in 2 days. Consider scheduling review.",
              "Variation costs in App #03 exceed approved budget by £18,250.",
              "Supporting evidence is missing for 3 line items in App #05.",
            ].map((suggestion, i) => (
              <div key={i} className="flex gap-2 p-3 rounded-lg" style={{ background: "#f5f3ff" }}>
                <span className="text-[11px] font-semibold flex-shrink-0 w-4" style={{ color: "#8B5CF6" }}>{i + 1}.</span>
                <p className="text-xs leading-relaxed" style={{ color: "#6d28d9" }}>{suggestion}</p>
              </div>
            ))}
            <button className="text-xs font-medium self-start" style={{ color: "#8B5CF6" }}>View all suggestions</button>
          </div>
        </div>
      </div>
    </div>
  );
}
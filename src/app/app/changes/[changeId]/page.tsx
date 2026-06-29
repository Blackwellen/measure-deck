"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Star, CheckCircle2, Clock, Circle, ArrowRight, Sparkles } from "lucide-react";
import { CE025_CHANGE, CE025_NEC4_STEPS } from "@/lib/seed/projects";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
  }).format(n);
}

function InitialsAvatar({ name, color = "#3B5EE8" }: { name: string; color?: string }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
      style={{ background: color }}
    >
      {initials}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChangeOverviewPage() {
  const params = useParams();
  const changeId = params.changeId as string;
  const ce = CE025_CHANGE;

  const variance = ce.pmAssessment - ce.contractorAssessment; // negative = contractor higher

  const deadlines = [
    { label: "Notification", date: "18 Mar 2025", done: true, active: false, pending: false },
    { label: "Quotation", date: "8 Apr 2025", done: true, active: false, pending: false },
    { label: "PM Assessment", date: "22 Apr 2025", done: false, active: true, pending: false },
    { label: "Implementation", date: "6 May 2025", done: false, active: false, pending: true },
  ];

  const people = [
    { name: ce.pm, role: "Project Manager", badge: "PM", color: "#3B5EE8" },
    { name: ce.qs, role: "Quantity Surveyor", badge: "QS Lead", color: "#10B981" },
    { name: ce.raisedBy, role: "Site Manager", badge: "Raised By", color: "#8B5CF6" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ── Left main content (2/3) ───────────────────────────────────── */}
      <div className="lg:col-span-2 flex flex-col gap-6">

        {/* Financial Summary */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Financial Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="kpi-card border-l-4" style={{ borderLeftColor: "var(--primary)" }}>
              <div className="kpi-label">Contractor Assessment</div>
              <div className="kpi-value text-lg" style={{ color: "var(--primary)" }}>
                {fmt(ce.contractorAssessment)}
              </div>
            </div>
            <div className="kpi-card border-l-4" style={{ borderLeftColor: "var(--warning)" }}>
              <div className="kpi-label">PM Assessment</div>
              <div className="kpi-value text-lg" style={{ color: "var(--warning)" }}>
                {fmt(ce.pmAssessment)}
              </div>
            </div>
            <div className="kpi-card">
              <div className="kpi-label">Agreed Value</div>
              <div className="kpi-value text-lg" style={{ color: "var(--text-muted)" }}>
                Pending
              </div>
            </div>
            <div className="kpi-card border-l-4" style={{ borderLeftColor: "var(--danger)" }}>
              <div className="kpi-label">Variance</div>
              <div className="kpi-value text-lg" style={{ color: "var(--danger)" }}>
                {fmt(variance)}
              </div>
              <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                Contractor higher
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
            Description
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {ce.description}
          </p>
          <div
            className="inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{ background: "var(--bg-muted)", color: "var(--text-secondary)" }}
          >
            <span className="font-mono font-bold">Clause:</span>
            NEC4 {ce.clauseReference} – Unforeseen physical conditions
          </div>
        </div>

        {/* Programme Impact */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Programme Impact
          </h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <div className="kpi-label">Days Claimed</div>
              <div className="text-2xl font-bold" style={{ color: "var(--warning)" }}>
                {ce.daysClaimedDelay}
              </div>
            </div>
            <div>
              <div className="kpi-label">Days Agreed (PM)</div>
              <div className="text-2xl font-bold" style={{ color: "var(--success)" }}>
                {ce.daysAgreedDelay}
              </div>
            </div>
            <div>
              <div className="kpi-label">Delay Type</div>
              <div className="text-sm font-semibold mt-1" style={{ color: "var(--text-primary)" }}>
                Extension of Time
              </div>
            </div>
          </div>

          {/* Bar visualization */}
          <div className="space-y-2">
            <div>
              <div
                className="flex items-center justify-between text-xs mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                <span>Claimed – {ce.daysClaimedDelay} days</span>
                <span>100%</span>
              </div>
              <div
                className="h-4 rounded-full w-full"
                style={{ background: "var(--warning)", opacity: 0.7 }}
              />
            </div>
            <div>
              <div
                className="flex items-center justify-between text-xs mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                <span>Agreed (PM) – {ce.daysAgreedDelay} days</span>
                <span>{Math.round((ce.daysAgreedDelay / ce.daysClaimedDelay) * 100)}%</span>
              </div>
              <div
                className="h-4 rounded-full"
                style={{
                  width: `${(ce.daysAgreedDelay / ce.daysClaimedDelay) * 100}%`,
                  background: "var(--success)",
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3">
            <div className="kpi-label">Critical Path:</div>
            <span className="badge chip-warning">Yes</span>
          </div>
        </div>

        {/* NEC4 Status Progress */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-5" style={{ color: "var(--text-primary)" }}>
            NEC4 Compensation Event Workflow
          </h3>
          <div className="flex items-start gap-0 overflow-x-auto pb-2">
            {CE025_NEC4_STEPS.map((step, i) => {
              const isLast = i === CE025_NEC4_STEPS.length - 1;
              return (
                <div key={step.id} className="flex items-start gap-0 flex-1 min-w-[80px]">
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{
                        background:
                          step.status === "completed"
                            ? "var(--success)"
                            : step.status === "in_progress"
                            ? "var(--primary)"
                            : step.status === "overdue"
                            ? "var(--danger)"
                            : "var(--bg-muted)",
                        color:
                          step.status === "pending"
                            ? "var(--text-muted)"
                            : "#fff",
                        border:
                          step.status === "pending"
                            ? "1px solid var(--border)"
                            : "none",
                        boxShadow:
                          step.status === "in_progress"
                            ? "0 0 0 4px rgba(59,94,232,0.18)"
                            : "none",
                      }}
                    >
                      {step.status === "completed" ? (
                        <CheckCircle2 size={13} />
                      ) : (
                        <span>{step.stepNumber}</span>
                      )}
                    </div>
                    <span
                      className="text-[9px] font-medium text-center leading-tight px-0.5"
                      style={{
                        color:
                          step.status === "completed"
                            ? "var(--success)"
                            : step.status === "in_progress"
                            ? "var(--primary)"
                            : step.status === "overdue"
                            ? "var(--danger)"
                            : "var(--text-muted)",
                        maxWidth: "80px",
                      }}
                    >
                      {step.name}
                    </span>
                  </div>
                  {!isLast && (
                    <div
                      className="flex-1 h-px mt-4 mx-0.5"
                      style={{
                        background:
                          step.status === "completed"
                            ? "var(--success)"
                            : "var(--border)",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Evidence Summary */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Evidence Summary
          </h3>
          <div className="flex items-center gap-1 mb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={18}
                fill={i < ce.evidenceStrengthScore ? "#F59E0B" : "none"}
                stroke="#F59E0B"
              />
            ))}
            <span className="ml-2 text-sm font-semibold" style={{ color: "var(--warning)" }}>
              {ce.evidenceStrengthScore}/5
            </span>
          </div>
          <div className="h-2 rounded-full mb-4" style={{ background: "var(--bg-muted)" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${(ce.evidenceStrengthScore / 5) * 100}%`,
                background: "var(--success)",
              }}
            />
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: "Photos", count: 3 },
              { label: "Documents", count: 5 },
              { label: "Notices", count: 4 },
            ].map(({ label, count }) => (
              <div
                key={label}
                className="text-center p-3 rounded-lg"
                style={{ background: "var(--bg-muted)" }}
              >
                <div className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                  {count}
                </div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</div>
              </div>
            ))}
          </div>
          <Link
            href={`/changes/${changeId}/evidence`}
            className="inline-flex items-center gap-1.5 text-xs font-medium"
            style={{ color: "var(--primary)" }}
          >
            View All Evidence <ArrowRight size={12} />
          </Link>
        </div>
      </div>

      {/* ── Right sidebar (1/3) ───────────────────────────────────────── */}
      <div className="flex flex-col gap-6">

        {/* Deadlines */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Deadlines
          </h3>
          <div className="flex flex-col gap-3">
            {deadlines.map(({ label, date, done, active, pending }) => (
              <div key={label} className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  {done ? (
                    <CheckCircle2 size={16} style={{ color: "var(--success)" }} />
                  ) : active ? (
                    <Clock size={16} style={{ color: "var(--warning)" }} />
                  ) : (
                    <Circle size={16} style={{ color: "var(--border)" }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-xs font-semibold"
                    style={{
                      color: done
                        ? "var(--success)"
                        : active
                        ? "var(--warning)"
                        : "var(--text-muted)",
                    }}
                  >
                    {label}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {date}
                  </div>
                </div>
                {done && <span className="badge chip-success text-[10px]">Done</span>}
                {active && <span className="badge chip-warning text-[10px]">Active</span>}
                {pending && <span className="badge chip-muted text-[10px]">Pending</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Key People */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Key People
          </h3>
          <div className="flex flex-col gap-3">
            {people.map(({ name, role, badge, color }) => (
              <div key={name} className="flex items-center gap-3">
                <InitialsAvatar name={name} color={color} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                    {name}
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{role}</div>
                </div>
                <span className="badge chip-muted text-[10px] flex-shrink-0">{badge}</span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Risk Assessment */}
        <div
          className="card p-5"
          style={{ background: "rgba(139,92,246,0.04)", borderColor: "rgba(139,92,246,0.2)" }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={14} style={{ color: "#8B5CF6" }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              AI Risk Assessment
            </h3>
          </div>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="kpi-label">Confidence</span>
              <span className="text-sm font-bold" style={{ color: "#8B5CF6" }}>
                {Math.round(ce.aiConfidenceScore * 100)}%
              </span>
            </div>
            <div className="h-2 rounded-full" style={{ background: "var(--bg-muted)" }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${ce.aiConfidenceScore * 100}%`, background: "#8B5CF6" }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <span className="kpi-label">Risk Level:</span>
            <span className="badge chip-warning">Medium</span>
          </div>
          <p className="text-xs leading-relaxed mb-3" style={{ color: "var(--text-secondary)" }}>
            Strong physical evidence and contemporaneous records support this CE. The £7,300 variance
            between contractor and PM assessments is primarily in plant mobilisation costs — recommend
            independent plant rate verification.
          </p>
          <Link
            href={`/changes/${changeId}/ai-narrative`}
            className="inline-flex items-center gap-1.5 text-xs font-medium"
            style={{ color: "#8B5CF6" }}
          >
            View Full AI Narrative <ArrowRight size={12} />
          </Link>
          <div
            className="mt-3 pt-3 text-[10px] leading-relaxed"
            style={{ borderTop: "1px solid rgba(139,92,246,0.15)", color: "var(--text-muted)" }}
          >
            AI analysis for reference only. Human review required.
          </div>
        </div>

        {/* Linked Applications */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Linked Applications
          </h3>
          <div className="flex flex-col gap-2 mb-4">
            {[
              { ref: "APP-008", status: "Applied", amount: "£8,500 included", period: "April 2025" },
              { ref: "APP-007", status: "Certified", amount: "£8,500", period: "March 2025" },
            ].map(({ ref, status, amount, period }) => (
              <div
                key={ref}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ background: "var(--bg-muted)" }}
              >
                <div>
                  <div className="font-mono text-xs font-bold" style={{ color: "var(--primary)" }}>
                    {ref}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {amount} · {period}
                  </div>
                </div>
                <span
                  className={`badge text-[10px] ${
                    status === "Certified" ? "chip-success" : "chip-info"
                  }`}
                >
                  {status}
                </span>
              </div>
            ))}
          </div>
          <Link
            href={`/changes/${changeId}/application-links`}
            className="btn btn-secondary btn-sm w-full justify-center"
          >
            Link to Application →
          </Link>
        </div>
      </div>
    </div>
  );
}

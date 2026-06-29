"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  AlertTriangle, AlertCircle, ChevronRight, TrendingUp, TrendingDown,
  Brain, Sparkles, Mail, Phone, Users,
} from "lucide-react";
import { cn, formatCurrency, formatDate, formatRelative, getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  SEED_PROJECTS,
  SEED_CHANGES,
  SEED_APPLICATIONS,
  SEED_AUDIT_LOG,
  type SeedProject,
} from "@/lib/seed/projects";
import { KpiCard } from "@/components/ui/kpi-card";

// ─── Seed data for Riverside Apartments (proj-004) ────────────────────────────

const RIVERSIDE_RISKS = [
  { severity: "danger" as const, title: "Section 4.1 EoT Notice Overdue", description: "Extension of Time notice under JCT DB 2016 clause 2.26 — deadline passed. Immediate action required." },
  { severity: "warning" as const, title: "2 Applications Outstanding", description: "PA-003 (£189,500) and PA-004 (£129,250) are both pending certification past due date." },
  { severity: "warning" as const, title: "Retail Unit Fit-Out Scope Gap", description: "Ground-floor retail tenant requirements not fully captured in ER. Scope risk of £35,000–£60,000." },
];

const RIVERSIDE_DEADLINES = [
  { date: "2026-06-16", title: "Issue EoT Notice (JCT 2.26)", type: "critical" },
  { date: "2026-06-20", title: "Application #5 Payment Due", type: "warning" },
  { date: "2026-06-28", title: "Sign off CVR Period 2", type: "info" },
  { date: "2026-07-01", title: "Contractor Design Submission", type: "info" },
];

const RIVERSIDE_ACTIVITY = [
  { id: "a1", user: "Rachel Okafor",   action: "Submitted Application #4", detail: "Net this period: £129,250. Gross cumulative: £590,000.", timestamp: "2026-06-10T09:15:00Z" },
  { id: "a2", user: "Daniel Price",    action: "Raised EoT Claim",         detail: "Delay to drainage diversions — 18 calendar days claimed.", timestamp: "2026-06-08T14:30:00Z" },
  { id: "a3", user: "Sarah Mitchell",  action: "Approved CVR Period 1",    detail: "Margin: 15.9%. Approved and issued to client.", timestamp: "2026-06-05T11:00:00Z" },
];

const RIVERSIDE_MILESTONES = [
  { name: "Site Mobilisation",         baseline: "2025-07-01", forecast: "2025-07-01", status: "done" },
  { name: "Groundworks Complete",      baseline: "2025-10-31", forecast: "2025-11-18", status: "done" },
  { name: "Ground Floor Slab",         baseline: "2025-12-15", forecast: "2026-01-08", status: "done" },
  { name: "Superstructure Complete",   baseline: "2026-06-30", forecast: "2026-07-19", status: "in_progress" },
  { name: "Weathertight",             baseline: "2026-09-30", forecast: "2026-10-21", status: "upcoming" },
  { name: "Practical Completion",      baseline: "2027-06-30", forecast: "2027-07-28", status: "upcoming" },
];

const RIVERSIDE_CONTACTS = [
  { name: "Rachel Okafor",    role: "Project Lead",          company: "MeasureDeck",        phone: "+44 7700 900123", email: "rachel@measuredeck.co.uk" },
  { name: "Daniel Price",     role: "Commercial Manager",    company: "MeasureDeck",        phone: "+44 7700 900124", email: "daniel@measuredeck.co.uk" },
  { name: "Claire Hargreaves",role: "Client Contact",        company: "Riverside Living",   phone: "+44 161 490 2200", email: "c.hargreaves@riversiveliving.co.uk" },
  { name: "Tom Webb",         role: "Employer's Agent",      company: "Webb Consult",       phone: "+44 7911 445566", email: "tom@webbconsult.co.uk" },
];

const AI_SUMMARY_TEXT =
  "Riverside Apartments is performing slightly below target with a current margin of 15.9% (target 18.0%). CVR shows a positive trend over the last 8 periods. Key risk is the overdue Section 4.1 EoT notice which could impact entitlement. 2 applications are outstanding totalling £318,750. No critical delivery delays forecast. Forecast final account is £3,067,250 (3.97% above contract).";
const AI_CONFIDENCE = 84;

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProjectOverviewPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<SeedProject | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProject = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      if (data) {
        setProject(data as SeedProject);
      } else {
        setProject(SEED_PROJECTS.find((p) => p.id === projectId) ?? SEED_PROJECTS[3]);
      }
    } catch {
      setProject(SEED_PROJECTS.find((p) => p.id === projectId) ?? SEED_PROJECTS[3]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { void loadProject(); }, [loadProject]);

  if (loading) return <OverviewSkeleton />;
  if (!project) return null;

  const changes       = SEED_CHANGES.filter((c) => c.projectId === project.id);
  const openChanges   = changes.filter((c) => c.status === "pending" || c.status === "disputed").length;
  const apps          = SEED_APPLICATIONS.filter((a) => a.projectId === project.id);
  const outstandingApps = apps.filter((a) => a.status === "outstanding");
  const outstandingTotal = outstandingApps.reduce((s, a) => s + a.value, 0);

  const certPct = project.contractValue > 0
    ? ((project.certifiedToDate / project.contractValue) * 100).toFixed(1)
    : "0.0";

  const forecastFA = project.contractValue * 1.0397;
  const forecastAbove = (((forecastFA / project.contractValue) - 1) * 100).toFixed(2);

  return (
    <div className="flex flex-col gap-6">
      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard
          label="Contract Value"
          value={formatCurrency(project.contractValue)}
          change={project.contractType}
          variant="default"
        />
        <KpiCard
          label="Certified %"
          value={`${certPct}%`}
          change={`${formatCurrency(project.certifiedToDate)} certified`}
          variant={parseFloat(certPct) >= 50 ? "success" : "default"}
        />
        <KpiCard
          label="CVR Margin"
          value={`${project.margin.toFixed(1)}%`}
          change="Current period"
          trend={project.margin >= 15 ? "up" : "down"}
          variant={project.margin >= 15 ? "success" : "warning"}
        />
        <KpiCard
          label="Open Changes"
          value={openChanges}
          change={`${formatCurrency(changes.reduce((s, c) => s + c.value, 0))} total`}
          trend={openChanges > 0 ? "up" : undefined}
          variant={openChanges > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="Applications Outstanding"
          value={outstandingApps.length}
          change={outstandingTotal > 0 ? formatCurrency(outstandingTotal) : "None"}
          variant={outstandingApps.length > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="Forecast Final Account"
          value={formatCurrency(forecastFA)}
          change={`${forecastAbove}% above contract`}
          trend="up"
          variant="success"
        />
      </div>

      {/* ── 3-column grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT — wider 2-col area */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Risk Warnings */}
          <div className="card p-5 flex flex-col gap-3">
            <h3
              className="text-sm font-semibold flex items-center gap-2"
              style={{ color: "var(--text-primary)" }}
            >
              <AlertTriangle size={15} style={{ color: "var(--warning)" }} />
              Risk Warnings
            </h3>
            {RIVERSIDE_RISKS.map((r, i) => (
              <RiskItem key={i} severity={r.severity} title={r.title} description={r.description} />
            ))}
          </div>

          {/* Upcoming Deadlines */}
          <div className="card p-5 flex flex-col gap-4">
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Upcoming Deadlines
            </h3>
            <div className="flex flex-col gap-3">
              {RIVERSIDE_DEADLINES.map((d, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex flex-col items-center justify-center text-white text-[10px] font-bold leading-tight flex-shrink-0"
                    style={{
                      background:
                        d.type === "critical"
                          ? "var(--danger)"
                          : d.type === "warning"
                          ? "var(--warning)"
                          : "var(--primary)",
                    }}
                  >
                    <span>{new Date(d.date).getDate()}</span>
                    <span>
                      {new Date(d.date).toLocaleString("en-GB", { month: "short" })}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {d.title}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {formatDate(d.date)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "badge flex-shrink-0",
                      d.type === "critical"
                        ? "chip-danger"
                        : d.type === "warning"
                        ? "chip-warning"
                        : "chip-info"
                    )}
                  >
                    {d.type === "critical" ? "Urgent" : d.type === "warning" ? "Due soon" : "Upcoming"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Recent Activity
              </h3>
              <button
                className="text-xs font-medium flex items-center gap-1"
                style={{ color: "var(--primary)" }}
              >
                View all <ChevronRight size={12} />
              </button>
            </div>
            <div className="flex flex-col gap-0">
              {RIVERSIDE_ACTIVITY.map((log, idx) => (
                <div
                  key={log.id}
                  className={cn(
                    "flex items-start gap-3 py-3",
                    idx < RIVERSIDE_ACTIVITY.length - 1 && "border-b"
                  )}
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                    style={{ background: "var(--primary)" }}
                  >
                    {getInitials(log.user)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                      <span className="font-semibold">{log.user}</span> — {log.action}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {log.detail}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {formatRelative(log.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT column */}
        <div className="flex flex-col gap-5">
          {/* AI Summary */}
          <div
            className="card p-5 flex flex-col gap-3"
            style={{ borderColor: "var(--violet)", borderWidth: 1 }}
          >
            <div className="flex items-center gap-2">
              <Brain size={16} style={{ color: "var(--violet)" }} />
              <h3 className="text-sm font-semibold" style={{ color: "var(--violet)" }}>
                AI Summary
              </h3>
              <span
                className="badge ml-1"
                style={{
                  background: "var(--violet-bg, #ede9fe)",
                  color: "var(--violet)",
                  fontSize: 10,
                }}
              >
                New
              </span>
              <button
                className="btn btn-sm ml-auto text-[11px]"
                style={{ background: "var(--violet)", color: "#fff" }}
              >
                <Sparkles size={11} />Ask Copilot
              </button>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {AI_SUMMARY_TEXT}
            </p>
            <div>
              <div
                className="flex items-center justify-between text-[11px] mb-1"
                style={{ color: "var(--violet)" }}
              >
                <span>Confidence</span>
                <span>{AI_CONFIDENCE}%</span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: "var(--bg-muted)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${AI_CONFIDENCE}%`, background: "var(--violet)" }}
                />
              </div>
            </div>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Last analysed 13 Jun 2026, 08:45
            </p>
          </div>

          {/* Milestone Snapshot */}
          <div className="card p-5 flex flex-col gap-3">
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Milestone Snapshot
            </h3>
            <div className="overflow-x-auto -mx-1">
              <table style={{ width: "100%", fontSize: 12, borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <th className="text-left pb-2 pr-2" style={{ color: "var(--text-muted)", fontWeight: 500 }}>
                      Milestone
                    </th>
                    <th className="text-left pb-2 pr-2" style={{ color: "var(--text-muted)", fontWeight: 500 }}>
                      Baseline
                    </th>
                    <th className="text-left pb-2 pr-2" style={{ color: "var(--text-muted)", fontWeight: 500 }}>
                      Forecast
                    </th>
                    <th className="text-left pb-2" style={{ color: "var(--text-muted)", fontWeight: 500 }}>
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {RIVERSIDE_MILESTONES.map((m, i) => (
                    <tr
                      key={i}
                      style={{
                        borderBottom:
                          i < RIVERSIDE_MILESTONES.length - 1
                            ? "1px solid var(--border-subtle)"
                            : undefined,
                      }}
                    >
                      <td
                        className="py-2 pr-2 font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {m.name}
                      </td>
                      <td className="py-2 pr-2" style={{ color: "var(--text-muted)" }}>
                        {formatDate(m.baseline)}
                      </td>
                      <td className="py-2 pr-2" style={{ color: "var(--text-muted)" }}>
                        {formatDate(m.forecast)}
                      </td>
                      <td className="py-2">
                        <span
                          className={cn(
                            "badge",
                            m.status === "done"
                              ? "chip-success"
                              : m.status === "in_progress"
                              ? "chip-primary"
                              : "chip-muted"
                          )}
                        >
                          {m.status === "done"
                            ? "Done"
                            : m.status === "in_progress"
                            ? "In Progress"
                            : "Upcoming"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Key Contacts */}
          <div className="card p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Users size={14} style={{ color: "var(--text-muted)" }} />
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Key Contacts
              </h3>
            </div>
            <div className="flex flex-col gap-3">
              {RIVERSIDE_CONTACTS.map((c, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                    style={{ background: "var(--primary)" }}
                  >
                    {getInitials(c.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {c.name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {c.role} · {c.company}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <a
                        href={`tel:${c.phone}`}
                        className="flex items-center gap-1 text-[11px]"
                        style={{ color: "var(--primary)" }}
                      >
                        <Phone size={10} />{c.phone}
                      </a>
                      <a
                        href={`mailto:${c.email}`}
                        className="flex items-center gap-1 text-[11px]"
                        style={{ color: "var(--primary)" }}
                      >
                        <Mail size={10} />Email
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Risk Item ────────────────────────────────────────────────────────────────

function RiskItem({
  severity,
  title,
  description,
}: {
  severity: "danger" | "warning";
  title: string;
  description: string;
}) {
  const isDanger = severity === "danger";
  return (
    <div
      className="flex gap-3 p-3 rounded-xl"
      style={{ background: isDanger ? "var(--danger-bg)" : "var(--warning-bg)" }}
    >
      <div
        className="flex-shrink-0 mt-0.5"
        style={{ color: isDanger ? "var(--danger)" : "var(--warning)" }}
      >
        {isDanger ? <AlertCircle size={14} /> : <AlertTriangle size={14} />}
      </div>
      <div>
        <p
          className="text-xs font-semibold"
          style={{ color: isDanger ? "var(--danger-text, var(--danger))" : "var(--warning-text, var(--warning))" }}
        >
          {title}
        </p>
        <p
          className="text-xs mt-0.5"
          style={{
            color: isDanger ? "var(--danger-text, var(--danger))" : "var(--warning-text, var(--warning))",
            opacity: 0.8,
          }}
        >
          {description}
        </p>
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function OverviewSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-20 rounded-[var(--radius)]" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 flex flex-col gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-[var(--radius)]" />
          ))}
        </div>
        <div className="flex flex-col gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-40 rounded-[var(--radius)]" />
          ))}
        </div>
      </div>
    </div>
  );
}

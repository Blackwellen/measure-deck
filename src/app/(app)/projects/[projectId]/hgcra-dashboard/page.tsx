"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  XCircle,
  Shield,
} from "lucide-react";
import { cn, formatCurrencyFull, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  calculatePaymentTimeline,
  getDaysOverdue,
  type PaymentTimeline,
} from "@/lib/hgcra/payment-timeline";
import { getWorkspaceId } from "@/lib/workspace";
import { KpiCard } from "@/components/ui/kpi-card";
import { ComplianceBadge } from "@/components/ui/compliance-badge";
import { FeatureGate } from "@/components/ui/feature-gate";

interface ApplicationRow {
  id: string;
  ref: string;
  app_number: number;
  project_id: string;
  contractor: string;
  submission_date: string | null;
  certified_value: number | null;
  payment_terms_days: number | null;
  prescribed_period_days: number | null;
  status: string;
  workspace_id: string;
}

interface PayLessNoticeRow {
  id: string;
  application_id: string;
  issue_date: string;
  issued_at: string;
  status: string;
}

interface SuspensionNoticeRow {
  id: string;
  application_id: string;
  suspension_effective_date: string;
  reinstated_at: string | null;
  amount_outstanding: number;
  eot_days_entitlement: number | null;
  status: string;
}

interface AppWithTimeline {
  app: ApplicationRow;
  timeline: PaymentTimeline;
  pln: PayLessNoticeRow | null;
  suspension: SuspensionNoticeRow | null;
}

const SEED_APPS: ApplicationRow[] = [
  {
    id: "app3",
    ref: "APP-003",
    app_number: 3,
    project_id: "p1",
    contractor: "Meridian Build Ltd",
    submission_date: "2025-09-30",
    certified_value: 890_000,
    payment_terms_days: 30,
    prescribed_period_days: 5,
    status: "Paid",
    workspace_id: "ws1",
  },
  {
    id: "app4",
    ref: "APP-004",
    app_number: 4,
    project_id: "p1",
    contractor: "Meridian Build Ltd",
    submission_date: "2025-10-31",
    certified_value: 1_045_000,
    payment_terms_days: 30,
    prescribed_period_days: 5,
    status: "Certified",
    workspace_id: "ws1",
  },
  {
    id: "app5",
    ref: "APP-005",
    app_number: 5,
    project_id: "p1",
    contractor: "Meridian Build Ltd",
    submission_date: "2025-11-30",
    certified_value: 1_120_500,
    payment_terms_days: 30,
    prescribed_period_days: 5,
    status: "Submitted",
    workspace_id: "ws1",
  },
];

interface UpcomingDate {
  label: string;
  date: Date;
  urgencyDays: number;
  type: "pln_cutoff" | "payment_due" | "overdue";
  appRef: string;
  applicationId: string;
}

function statusToCompliance(
  status: PaymentTimeline["status"]
): "compliant" | "at_risk" | "non_compliant" | "expired" | "pending" {
  switch (status) {
    case "on_track":
      return "compliant";
    case "pln_overdue":
      return "non_compliant";
    case "payment_overdue":
      return "non_compliant";
    case "suspended":
      return "expired";
    case "paid":
      return "compliant";
    default:
      return "pending";
  }
}

function statusLabel(status: PaymentTimeline["status"]): string {
  switch (status) {
    case "on_track":
      return "On Track";
    case "pln_overdue":
      return "PLN Overdue";
    case "payment_overdue":
      return "Payment Overdue";
    case "suspended":
      return "Suspended";
    case "paid":
      return "Paid";
  }
}

export default function HGCRADashboardPage() {
  const params = useParams();
  const projectId = String(params.projectId ?? "p1");

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<AppWithTimeline[]>([]);
  const [suspensions, setSuspensions] = useState<SuspensionNoticeRow[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const wsId = await getWorkspaceId(supabase).catch(() => "ws1");

        const { data: appsData } = await supabase
          .from("applications")
          .select("*")
          .eq("project_id", projectId)
          .eq("workspace_id", wsId)
          .order("app_number", { ascending: true });

        const apps: ApplicationRow[] =
          appsData && appsData.length > 0 ? (appsData as ApplicationRow[]) : SEED_APPS;

        const appIds = apps.map((a) => a.id);

        const { data: plnsData } = await supabase
          .from("pay_less_notices")
          .select("*")
          .in("application_id", appIds)
          .eq("workspace_id", wsId);

        const { data: suspData } = await supabase
          .from("suspension_notices")
          .select("*")
          .in("application_id", appIds)
          .eq("workspace_id", wsId);

        const plnMap = new Map<string, PayLessNoticeRow>();
        if (plnsData) {
          for (const p of plnsData as PayLessNoticeRow[]) {
            plnMap.set(p.application_id, p);
          }
        }

        const suspMap = new Map<string, SuspensionNoticeRow>();
        const allSuspensions: SuspensionNoticeRow[] = [];
        if (suspData) {
          for (const s of suspData as SuspensionNoticeRow[]) {
            suspMap.set(s.application_id, s);
            allSuspensions.push(s);
          }
        }
        setSuspensions(allSuspensions);

        const result: AppWithTimeline[] = apps.map((app) => {
          const pln = plnMap.get(app.id) ?? null;
          const susp = suspMap.get(app.id) ?? null;
          const timeline = calculatePaymentTimeline({
            application_date: app.submission_date ?? new Date().toISOString(),
            payment_terms_days: app.payment_terms_days ?? 30,
            prescribed_period_days: app.prescribed_period_days ?? 5,
            pln_issued_at: pln?.issued_at ?? null,
            suspended_at: susp?.suspension_effective_date ?? null,
            paid_at: app.status === "Paid" ? app.submission_date : null,
          });
          return { app, timeline, pln, suspension: susp };
        });

        setRows(result);
      } catch {
        const result = SEED_APPS.map((app) => ({
          app,
          timeline: calculatePaymentTimeline({
            application_date: app.submission_date ?? new Date().toISOString(),
            payment_terms_days: app.payment_terms_days ?? 30,
            prescribed_period_days: app.prescribed_period_days ?? 5,
          }),
          pln: null,
          suspension: null,
        }));
        setRows(result);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  const totalApps = rows.length;
  const onTrack = rows.filter((r) => r.timeline.status === "on_track").length;
  const plnIssued = rows.filter((r) => r.pln != null).length;
  const paymentOverdue = rows.filter(
    (r) => r.timeline.status === "payment_overdue"
  ).length;

  const upcomingDates: UpcomingDate[] = [];
  const now = new Date();

  for (const { app, timeline } of rows) {
    if (timeline.status === "paid") continue;

    const daysToPlnCutoff = timeline.days_to_pln_cutoff;
    const daysToDue = timeline.days_to_due_date;

    if (daysToPlnCutoff >= -14) {
      upcomingDates.push({
        label: `PLN Cutoff — ${app.ref}`,
        date: timeline.pln_cutoff,
        urgencyDays: daysToPlnCutoff,
        type: daysToDue < 0 ? "overdue" : "pln_cutoff",
        appRef: app.ref,
        applicationId: app.id,
      });
    }

    if (daysToDue >= -14) {
      upcomingDates.push({
        label: `Payment Due — ${app.ref}`,
        date: timeline.final_date_for_payment,
        urgencyDays: daysToDue,
        type: daysToDue < 0 ? "overdue" : "payment_due",
        appRef: app.ref,
        applicationId: app.id,
      });
    }
  }

  upcomingDates.sort((a, b) => a.date.getTime() - b.date.getTime());

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="page-header">
          <div className="skeleton h-6 w-80 rounded" />
        </div>
        <div className="page-content space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-24 rounded-xl" />
            ))}
          </div>
          <div className="skeleton h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <FeatureGate flag="hgcra_suite">
      <div className="flex flex-col min-h-full">
        <div className="page-header">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href={`/projects/${projectId}`}
              className="btn btn-ghost btn-icon flex-shrink-0"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold">HGCRA Payment Compliance Dashboard</h1>
                <span className="badge chip-info flex items-center gap-1.5">
                  <Shield size={10} /> HGCRA 1996
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Housing Grants, Construction and Regeneration Act 1996 — Payment Compliance
              </p>
            </div>
          </div>
        </div>

        <div className="page-content space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard
              label="Total Applications"
              value={totalApps}
              icon={FileText}
              variant="default"
            />
            <KpiCard
              label="On Track"
              value={onTrack}
              icon={CheckCircle2}
              variant="success"
              change={`${Math.round((onTrack / Math.max(totalApps, 1)) * 100)}% compliant`}
            />
            <KpiCard
              label="PLN Issued"
              value={plnIssued}
              icon={AlertTriangle}
              variant="warning"
            />
            <KpiCard
              label="Payment Overdue"
              value={paymentOverdue}
              icon={XCircle}
              variant={paymentOverdue > 0 ? "danger" : "default"}
            />
          </div>

          <div className="card overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="text-sm font-semibold">Applications Timeline</h2>
              <span className="text-xs text-[var(--text-muted)]">
                {rows.length} application(s)
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>App Ref</th>
                    <th className="text-right">Certified Value</th>
                    <th>Application Date</th>
                    <th>PLN Cutoff</th>
                    <th>Payment Due</th>
                    <th>Status</th>
                    <th>PLN</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ app, timeline, pln }) => {
                    const daysOverdue = getDaysOverdue(timeline);
                    return (
                      <tr key={app.id}>
                        <td>
                          <Link
                            href={`/applications/${app.id}`}
                            className="font-mono text-xs font-semibold text-[var(--primary)] hover:underline"
                          >
                            {app.ref}
                          </Link>
                        </td>
                        <td className="text-right tabular-nums font-semibold">
                          {app.certified_value != null
                            ? formatCurrencyFull(app.certified_value)
                            : "—"}
                        </td>
                        <td className="text-[var(--text-muted)]">
                          {app.submission_date ? formatDate(app.submission_date) : "—"}
                        </td>
                        <td>
                          <div className="flex flex-col">
                            <span
                              className={cn(
                                "text-sm",
                                timeline.days_to_pln_cutoff <= 0
                                  ? "text-red-600 font-semibold"
                                  : timeline.days_to_pln_cutoff <= 2
                                  ? "text-red-500 font-medium"
                                  : "text-[var(--text-muted)]"
                              )}
                            >
                              {formatDate(timeline.pln_cutoff)}
                            </span>
                            {timeline.days_to_pln_cutoff <= 2 &&
                              timeline.days_to_pln_cutoff >= 0 && (
                                <span className="text-xs text-red-600 font-semibold">
                                  {timeline.days_to_pln_cutoff === 0
                                    ? "TODAY"
                                    : `${timeline.days_to_pln_cutoff}d left`}
                                </span>
                              )}
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-col">
                            <span
                              className={cn(
                                "text-sm",
                                timeline.days_to_due_date <= 0
                                  ? "text-red-600 font-semibold"
                                  : timeline.days_to_due_date <= 5
                                  ? "text-amber-500 font-medium"
                                  : "text-[var(--text-muted)]"
                              )}
                            >
                              {formatDate(timeline.final_date_for_payment)}
                            </span>
                            {daysOverdue > 0 && (
                              <span className="text-xs text-red-600 font-semibold">
                                {daysOverdue}d overdue
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <ComplianceBadge
                            status={statusToCompliance(timeline.status)}
                            label={statusLabel(timeline.status)}
                          />
                        </td>
                        <td>
                          {pln ? (
                            <span className="badge chip-warning flex items-center gap-1 w-fit">
                              <FileText size={10} /> Issued
                            </span>
                          ) : (
                            <span className="text-xs text-[var(--text-muted)]">—</span>
                          )}
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-1">
                            <Link
                              href={`/applications/${app.id}/pay-less-notice`}
                              className="btn btn-ghost btn-sm text-xs"
                              title="Pay Less Notice"
                            >
                              PLN
                            </Link>
                            <Link
                              href={`/applications/${app.id}/suspension-notice`}
                              className="btn btn-ghost btn-sm text-xs"
                              title="Suspension Notice"
                            >
                              S112
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--border)]">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <Clock size={14} className="text-[var(--primary)]" />
                  Compliance Calendar
                </h2>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Upcoming dates sorted by urgency
                </p>
              </div>
              <div className="p-4 space-y-2">
                {upcomingDates.length === 0 ? (
                  <div className="empty-state py-8">
                    <div className="empty-icon">
                      <CheckCircle2 size={20} />
                    </div>
                    <p className="text-sm font-medium">No upcoming deadlines</p>
                  </div>
                ) : (
                  upcomingDates.map((ud, i) => {
                    const isOverdue = ud.urgencyDays < 0;
                    const isCritical = ud.urgencyDays >= 0 && ud.urgencyDays <= 2;
                    const isWarning =
                      !isOverdue && !isCritical && ud.urgencyDays <= 5;
                    return (
                      <div
                        key={i}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl border",
                          isOverdue
                            ? "bg-red-50 border-red-200"
                            : isCritical
                            ? "bg-red-50 border-red-200"
                            : isWarning
                            ? "bg-amber-50 border-amber-200"
                            : "bg-[var(--bg-muted)] border-[var(--border)]"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          {isOverdue || isCritical ? (
                            <XCircle size={14} className="text-red-600 flex-shrink-0" />
                          ) : isWarning ? (
                            <AlertTriangle
                              size={14}
                              className="text-amber-600 flex-shrink-0"
                            />
                          ) : (
                            <Clock
                              size={14}
                              className="text-[var(--text-muted)] flex-shrink-0"
                            />
                          )}
                          <div>
                            <p
                              className={cn(
                                "text-xs font-semibold",
                                isOverdue || isCritical
                                  ? "text-red-800"
                                  : isWarning
                                  ? "text-amber-800"
                                  : "text-[var(--text-primary)]"
                              )}
                            >
                              {ud.label}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">
                              {formatDate(ud.date)}
                            </p>
                          </div>
                        </div>
                        <span
                          className={cn(
                            "text-xs font-bold tabular-nums",
                            isOverdue
                              ? "text-red-600"
                              : isCritical
                              ? "text-red-600"
                              : isWarning
                              ? "text-amber-600"
                              : "text-[var(--text-muted)]"
                          )}
                        >
                          {isOverdue
                            ? `${Math.abs(ud.urgencyDays)}d overdue`
                            : ud.urgencyDays === 0
                            ? "TODAY"
                            : `${ud.urgencyDays}d`}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--border)]">
                <h2 className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle size={14} className="text-[var(--danger)]" />
                  Suspension Log
                </h2>
              </div>
              <div className="p-4">
                {suspensions.length === 0 ? (
                  <div className="empty-state py-8">
                    <div className="empty-icon">
                      <CheckCircle2 size={20} />
                    </div>
                    <p className="text-sm font-medium">No suspension notices</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      No s.112 suspension notices have been issued on this project.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {suspensions.map((s) => {
                      const appRow = rows.find(
                        (r) => r.app.id === s.application_id
                      );
                      const isActive = s.reinstated_at == null;
                      return (
                        <div
                          key={s.id}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-xl border",
                            isActive
                              ? "bg-red-50 border-red-200"
                              : "bg-green-50 border-green-200"
                          )}
                        >
                          <div>
                            <p className="text-xs font-semibold">
                              {appRow?.app.ref ?? s.application_id}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">
                              Effective {formatDate(s.suspension_effective_date)}
                              {s.reinstated_at && (
                                <> — Reinstated {formatDate(s.reinstated_at)}</>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {s.eot_days_entitlement != null && (
                              <span className="badge chip-info">
                                EOT: {s.eot_days_entitlement}d
                              </span>
                            )}
                            <ComplianceBadge
                              status={isActive ? "non_compliant" : "compliant"}
                              label={isActive ? "Active" : "Reinstated"}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card p-4 border border-[var(--border)]">
            <Link
              href={`/projects/${projectId}`}
              className="btn btn-secondary btn-sm"
            >
              <ArrowLeft size={13} /> Back to Project
            </Link>
          </div>
        </div>
      </div>
    </FeatureGate>
  );
}

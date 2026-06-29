"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  FileText,
  Lock,
  Send,
  Clock,
  RotateCcw,
} from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import React from "react";
import { toast } from "sonner";
import { cn, formatCurrencyFull, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  calculatePaymentTimeline,
  calculateSuspensionReinstatementDate,
  getDaysOverdue,
} from "@/lib/hgcra/payment-timeline";
import { uploadFile } from "@/lib/storage";
import { createAuditEvent } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { getWorkspaceId } from "@/lib/workspace";
import { FeatureGate } from "@/components/ui/feature-gate";
import { ComplianceBadge } from "@/components/ui/compliance-badge";
import { SuspensionNoticeDocument } from "@/lib/pdf-templates/suspension-notice";

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

interface SuspensionNotice {
  id: string;
  application_id: string;
  workspace_id: string;
  grounds: string;
  notice_period_days: number;
  suspension_effective_date: string;
  works_suspended: string;
  amount_outstanding: number;
  days_overdue: number;
  issued_at: string;
  reinstated_at: string | null;
  eot_days_entitlement: number | null;
  pdf_path: string | null;
  status: string;
  is_immutable: boolean;
  created_at: string;
}

const SEED_APP: ApplicationRow = {
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
};

const NOTICE_PERIOD_DAYS = 7;

interface PrerequisiteCheck {
  label: string;
  passed: boolean;
  detail: string;
}

export default function SuspensionNoticePage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = String(params.applicationId ?? "app5");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reinstating, setReinstating] = useState(false);
  const [app, setApp] = useState<ApplicationRow | null>(null);
  const [suspension, setSuspension] = useState<SuspensionNotice | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const [grounds, setGrounds] = useState(
    "Non-payment of the notified sum pursuant to s.112(1) HGCRA 1996."
  );
  const [worksSuspended, setWorksSuspended] = useState("");

  const effectiveSuspensionDate = calculateSuspensionReinstatementDate(
    new Date(),
    NOTICE_PERIOD_DAYS
  );

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();

        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) setCurrentUserId(user.id);

        const wsId = await getWorkspaceId(supabase).catch(() => "ws1");
        setWorkspaceId(wsId);

        const { data: appData } = await supabase
          .from("applications")
          .select("*")
          .eq("id", applicationId)
          .eq("workspace_id", wsId)
          .single();

        setApp(appData ?? SEED_APP);

        const { data: suspData } = await supabase
          .from("suspension_notices")
          .select("*")
          .eq("application_id", applicationId)
          .eq("workspace_id", wsId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (suspData) setSuspension(suspData as SuspensionNotice);
      } catch {
        setApp(SEED_APP);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [applicationId]);

  const timeline = app
    ? calculatePaymentTimeline({
        application_date: app.submission_date ?? new Date().toISOString(),
        payment_terms_days: app.payment_terms_days ?? 30,
        prescribed_period_days: app.prescribed_period_days ?? 5,
        suspended_at: suspension?.issued_at ?? null,
        paid_at: app.status === "Paid" ? app.submission_date : null,
      })
    : null;

  const daysOverdue = timeline ? getDaysOverdue(timeline) : 0;
  const amountOutstanding = app?.certified_value ?? 0;

  const plnWindowPassed = timeline ? new Date() > timeline.pln_cutoff : false;
  const paymentIsOverdue = timeline
    ? new Date() > timeline.final_date_for_payment
    : false;

  const prerequisites: PrerequisiteCheck[] = [
    {
      label: "Payment is overdue",
      passed: paymentIsOverdue,
      detail: paymentIsOverdue
        ? `${daysOverdue} calendar day(s) overdue`
        : `Final date for payment: ${timeline ? formatDate(timeline.final_date_for_payment) : "—"}`,
    },
    {
      label: "PLN cutoff has passed (or no PLN issued)",
      passed: plnWindowPassed,
      detail: plnWindowPassed
        ? "PLN prescribed period has elapsed"
        : `PLN cutoff: ${timeline ? formatDate(timeline.pln_cutoff) : "—"}`,
    },
    {
      label: "Adequate notice given (7 days minimum under s.112)",
      passed: true,
      detail: `${NOTICE_PERIOD_DAYS} days notice will be given — statutory minimum satisfied`,
    },
  ];

  const allPrerequisitesMet = prerequisites.every((p) => p.passed);

  const suspensionIsActive =
    suspension != null &&
    suspension.reinstated_at == null &&
    new Date(suspension.suspension_effective_date) <= new Date();

  const eotDays =
    suspension?.reinstated_at != null
      ? Math.max(
          0,
          Math.floor(
            (new Date(suspension.reinstated_at).getTime() -
              new Date(suspension.suspension_effective_date).getTime()) /
              86_400_000
          )
        )
      : suspension != null && suspension.reinstated_at == null
      ? Math.max(
          0,
          Math.floor(
            (new Date().getTime() -
              new Date(suspension.suspension_effective_date).getTime()) /
              86_400_000
          )
        )
      : 0;

  const handleIssueSuspension = useCallback(async () => {
    if (!app || !allPrerequisitesMet || suspension) return;
    if (!worksSuspended.trim()) {
      toast.error("Please describe the works to be suspended");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const suspId = crypto.randomUUID();

      const pdfBlob = await pdf(
        <SuspensionNoticeDocument
          documentId={suspId}
          workspaceName="MeasureDeck Workspace"
          suspendingParty="Your Organisation"
          employerParty={app.contractor}
          applicationRef={app.ref}
          amountOutstanding={amountOutstanding}
          daysOverdue={daysOverdue}
          noticePeriodDays={NOTICE_PERIOD_DAYS}
          suspensionEffectiveDate={effectiveSuspensionDate}
          worksSuspended={worksSuspended}
          issueDate={new Date().toISOString()}
        />
      ).toBlob();

      const pdfFile = new File([pdfBlob], `suspension-${suspId}.pdf`, {
        type: "application/pdf",
      });

      const { path: pdfPath } = await uploadFile(supabase, {
        bucket: "legal-notices",
        path: `${workspaceId}/suspension-${suspId}.pdf`,
        file: pdfFile,
      });

      const { error: insertError } = await supabase
        .from("suspension_notices")
        .insert({
          id: suspId,
          application_id: applicationId,
          workspace_id: workspaceId,
          grounds,
          notice_period_days: NOTICE_PERIOD_DAYS,
          suspension_effective_date: effectiveSuspensionDate.toISOString(),
          works_suspended: worksSuspended,
          amount_outstanding: amountOutstanding,
          days_overdue: daysOverdue,
          issued_at: new Date().toISOString(),
          reinstated_at: null,
          eot_days_entitlement: null,
          pdf_path: pdfPath,
          status: "issued",
          is_immutable: true,
        });

      if (insertError) throw new Error(insertError.message);

      await createAuditEvent(supabase, {
        workspace_id: workspaceId,
        user_id: currentUserId,
        action: "suspension_notice.issued",
        resource_type: "suspension_notice",
        resource_id: suspId,
        new_values: {
          application_id: applicationId,
          amount_outstanding: amountOutstanding,
          suspension_effective_date: effectiveSuspensionDate.toISOString(),
        },
      });

      const { data: members } = await supabase
        .from("workspace_memberships")
        .select("user_id")
        .eq("workspace_id", workspaceId);

      if (members) {
        for (const m of members) {
          await createNotification(supabase, {
            workspace_id: workspaceId,
            recipient_user_id: m.user_id as string,
            type: "suspension_notice_issued",
            title: "Suspension Notice Issued",
            body: `Suspension notice issued for ${app.ref}. Effective ${formatDate(effectiveSuspensionDate)}.`,
            action_url: `/app/applications/${applicationId}/suspension-notice`,
            urgency: "critical",
          });
        }
      }

      const { data: newSupp } = await supabase
        .from("suspension_notices")
        .select("*")
        .eq("id", suspId)
        .single();

      if (newSupp) setSuspension(newSupp as SuspensionNotice);

      toast.success("Suspension Notice issued successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to issue suspension notice");
    } finally {
      setSubmitting(false);
    }
  }, [
    app,
    allPrerequisitesMet,
    suspension,
    worksSuspended,
    grounds,
    amountOutstanding,
    daysOverdue,
    effectiveSuspensionDate,
    applicationId,
    workspaceId,
    currentUserId,
  ]);

  const handleReinstate = useCallback(async () => {
    if (!suspension) return;
    setReinstating(true);
    try {
      const supabase = createClient();
      const now = new Date().toISOString();
      const calculatedEot = Math.max(
        0,
        Math.floor(
          (new Date().getTime() -
            new Date(suspension.suspension_effective_date).getTime()) /
            86_400_000
        )
      );

      const { error } = await supabase
        .from("suspension_notices")
        .update({
          reinstated_at: now,
          eot_days_entitlement: calculatedEot,
          status: "reinstated",
        })
        .eq("id", suspension.id)
        .eq("workspace_id", workspaceId);

      if (error) throw new Error(error.message);

      await createAuditEvent(supabase, {
        workspace_id: workspaceId,
        user_id: currentUserId,
        action: "suspension_notice.reinstated",
        resource_type: "suspension_notice",
        resource_id: suspension.id,
        new_values: { reinstated_at: now, eot_days_entitlement: calculatedEot },
      });

      setSuspension({
        ...suspension,
        reinstated_at: now,
        eot_days_entitlement: calculatedEot,
        status: "reinstated",
      });

      toast.success(
        `Performance reinstated. EOT entitlement: ${calculatedEot} calendar day(s).`
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reinstate");
    } finally {
      setReinstating(false);
    }
  }, [suspension, workspaceId, currentUserId]);

  const handleDownloadPDF = useCallback(async () => {
    if (!suspension?.pdf_path) return;
    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from("legal-notices")
        .createSignedUrl(suspension.pdf_path, 3600);
      if (error || !data) throw new Error("Cannot generate download link");
      window.open(data.signedUrl, "_blank");
    } catch {
      toast.error("Failed to retrieve PDF");
    }
  }, [suspension]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="page-header">
          <div className="skeleton h-6 w-72 rounded" />
        </div>
        <div className="page-content space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="page-header">
          <button onClick={() => router.back()} className="btn btn-ghost btn-icon">
            <ArrowLeft size={16} />
          </button>
        </div>
        <div className="page-content">
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">
                <FileText size={22} />
              </div>
              <h3 className="text-base font-semibold">Application not found</h3>
            </div>
          </div>
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
              href={`/app/applications/${applicationId}`}
              className="btn btn-ghost btn-icon flex-shrink-0"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl font-bold">Notice of Suspension under HGCRA s.112</h1>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {app.ref} &nbsp;·&nbsp; {app.contractor}
              </p>
            </div>
          </div>
          {suspensionIsActive && (
            <span className="badge chip-danger flex items-center gap-1.5 animate-pulse">
              <AlertTriangle size={11} /> SUSPENSION ACTIVE
            </span>
          )}
          {suspension?.reinstated_at && (
            <span className="badge chip-success flex items-center gap-1.5">
              <CheckCircle2 size={11} /> REINSTATED
            </span>
          )}
        </div>

        <div className="page-content space-y-6">
          {suspensionIsActive && (
            <div className="card p-5 border-l-4 border-l-red-600 bg-red-50">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={22} className="text-red-600 flex-shrink-0" />
                  <div>
                    <p className="text-base font-bold text-red-800">SUSPENSION IN EFFECT</p>
                    <p className="text-sm text-red-700 mt-1">
                      Performance suspended since{" "}
                      {formatDate(suspension!.suspension_effective_date)}.{" "}
                      {eotDays} calendar day(s) elapsed.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-xs text-red-600 uppercase tracking-wide font-semibold">
                      EOT Entitlement
                    </p>
                    <p className="text-2xl font-bold text-red-800">{eotDays}d</p>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ background: "var(--success)", borderColor: "var(--success)" }}
                    onClick={handleReinstate}
                    disabled={reinstating}
                  >
                    {reinstating ? (
                      <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <RotateCcw size={13} />
                    )}
                    Reinstate Performance
                  </button>
                </div>
              </div>
            </div>
          )}

          {suspension?.reinstated_at && (
            <div className="card p-5 border-l-4 border-l-green-600 bg-green-50">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={18} className="text-green-700 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Performance Reinstated</p>
                  <p className="text-sm text-green-700 mt-1">
                    Reinstatement date:{" "}
                    {formatDate(suspension.reinstated_at)}. EOT entitlement under s.112(4):{" "}
                    <strong>{suspension.eot_days_entitlement ?? eotDays} calendar days</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="card p-5">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Clock size={14} className="text-[var(--primary)]" />
              Application Context
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="kpi-card">
                <span className="kpi-label">Amount Outstanding</span>
                <span className="kpi-value text-[var(--danger)]">
                  {formatCurrencyFull(amountOutstanding)}
                </span>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">Days Overdue</span>
                <span className={cn("kpi-value", paymentIsOverdue ? "text-[var(--danger)]" : "")}>
                  {paymentIsOverdue ? `${daysOverdue} days` : "Not yet overdue"}
                </span>
              </div>
              <div className="kpi-card">
                <span className="kpi-label">Payment Status</span>
                <ComplianceBadge
                  status={paymentIsOverdue ? "non_compliant" : "at_risk"}
                  label={paymentIsOverdue ? "Overdue" : "Approaching Due Date"}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <CheckCircle2 size={14} className="text-[var(--primary)]" />
              Prerequisite Checks (s.112 HGCRA 1996)
            </h2>
            <div className="space-y-3">
              {prerequisites.map((check) => (
                <div
                  key={check.label}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-xl border",
                    check.passed
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                  )}
                >
                  {check.passed ? (
                    <CheckCircle2 size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p
                      className={cn(
                        "text-sm font-semibold",
                        check.passed ? "text-green-800" : "text-red-800"
                      )}
                    >
                      {check.label}
                    </p>
                    <p
                      className={cn(
                        "text-xs mt-0.5",
                        check.passed ? "text-green-700" : "text-red-700"
                      )}
                    >
                      {check.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {!allPrerequisitesMet && (
              <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-xs text-amber-800 font-medium">
                  All prerequisites must be met before issuing a suspension notice. The right to
                  suspend under s.112 HGCRA 1996 only arises after the final date for payment has
                  passed.
                </p>
              </div>
            )}
          </div>

          {suspension ? (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock size={14} className="text-[var(--danger)]" />
                  <h2 className="text-sm font-semibold">Suspension Notice — Issued</h2>
                </div>
                <div className="flex items-center gap-2">
                  <ComplianceBadge
                    status={suspension.reinstated_at ? "compliant" : "non_compliant"}
                    label={suspension.reinstated_at ? "Reinstated" : "Active"}
                  />
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleDownloadPDF}
                  >
                    <Download size={13} /> Download PDF
                  </button>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: "Issued At", value: formatDate(suspension.issued_at) },
                    { label: "Notice Period", value: `${suspension.notice_period_days} days` },
                    {
                      label: "Suspension Effective Date",
                      value: formatDate(suspension.suspension_effective_date),
                    },
                    {
                      label: "Amount Outstanding",
                      value: formatCurrencyFull(suspension.amount_outstanding),
                    },
                    {
                      label: "Reinstated At",
                      value: suspension.reinstated_at
                        ? formatDate(suspension.reinstated_at)
                        : "Still active",
                    },
                    {
                      label: "EOT Entitlement (s.112(4))",
                      value:
                        suspension.eot_days_entitlement != null
                          ? `${suspension.eot_days_entitlement} calendar days`
                          : `${eotDays} days (running)`,
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-muted)]"
                    >
                      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                        {label}
                      </span>
                      <span className="text-sm font-medium">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-muted)]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">
                    Works Suspended
                  </p>
                  <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                    {suspension.works_suspended}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-5">
              <h2 className="text-sm font-semibold mb-5 flex items-center gap-2">
                <AlertTriangle size={14} className="text-[var(--danger)]" />
                Issue Suspension Notice
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="form-label">Grounds for Suspension</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={grounds}
                    onChange={(e) => setGrounds(e.target.value)}
                  />
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    s.112(1) HGCRA 1996 — non-payment of the notified sum by the final date.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-[var(--bg-muted)]">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">
                      Notice Period
                    </p>
                    <p className="text-xl font-bold text-[var(--text-primary)]">
                      {NOTICE_PERIOD_DAYS} days
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Fixed per statute (s.112(2))
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg-muted)]">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1">
                      Suspension Effective Date
                    </p>
                    <p className="text-xl font-bold text-[var(--danger)]">
                      {formatDate(effectiveSuspensionDate)}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Today + {NOTICE_PERIOD_DAYS} days
                    </p>
                  </div>
                </div>

                <div>
                  <label className="form-label">
                    Works to be Suspended
                    <span className="text-[var(--danger)] ml-1">*</span>
                  </label>
                  <textarea
                    className="form-input"
                    rows={4}
                    value={worksSuspended}
                    onChange={(e) => setWorksSuspended(e.target.value)}
                    placeholder={"Describe the specific works that will be suspended, e.g.:\n• All structural steel erection works\n• Curtain walling installation\n• M&E first fix activities\n• All on-site operations managed by the Contractor"}
                  />
                </div>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleIssueSuspension}
                  disabled={submitting || !allPrerequisitesMet}
                  title={
                    !allPrerequisitesMet
                      ? "Prerequisites not met — payment must be overdue"
                      : undefined
                  }
                >
                  {submitting ? (
                    <>
                      <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                      Issuing…
                    </>
                  ) : (
                    <>
                      <Send size={14} /> Issue Suspension Notice
                    </>
                  )}
                </button>

                {!allPrerequisitesMet && (
                  <p className="text-xs text-[var(--text-muted)]">
                    The Issue button will be enabled once all prerequisite checks are satisfied.
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="card p-4 border border-[var(--border)]">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">
              Related Actions
            </h3>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/app/applications/${applicationId}`}
                className="btn btn-secondary btn-sm"
              >
                <ArrowLeft size={13} /> Back to Application
              </Link>
              <Link
                href={`/app/applications/${applicationId}/pay-less-notice`}
                className="btn btn-secondary btn-sm"
              >
                <FileText size={13} /> Pay Less Notice
              </Link>
            </div>
          </div>
        </div>
      </div>
    </FeatureGate>
  );
}

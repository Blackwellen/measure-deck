"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  Lock,
  Send,
  Clock,
  XCircle,
} from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import React from "react";
import { toast } from "sonner";
import { cn, formatCurrencyFull, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { calculatePaymentTimeline } from "@/lib/hgcra/payment-timeline";
import { uploadFile } from "@/lib/storage";
import { createAuditEvent } from "@/lib/audit";
import { createNotification } from "@/lib/notifications";
import { getWorkspaceId } from "@/lib/workspace";
import { CountdownClock } from "@/components/ui/countdown-clock";
import { ComplianceBadge } from "@/components/ui/compliance-badge";
import { FeatureGate } from "@/components/ui/feature-gate";
import { PayLessNoticeDocument } from "@/lib/pdf-templates/pay-less-notice";

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

interface PayLessNotice {
  id: string;
  application_id: string;
  workspace_id: string;
  notified_sum: number;
  withheld_amount: number;
  amount_to_pay: number;
  withholding_reasons: string;
  issue_date: string;
  issued_at: string;
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

function statusToCompliance(
  status: "on_track" | "pln_overdue" | "payment_overdue" | "suspended" | "paid"
): "compliant" | "at_risk" | "non_compliant" | "expired" | "pending" {
  switch (status) {
    case "on_track":        return "compliant";
    case "pln_overdue":     return "non_compliant";
    case "payment_overdue": return "non_compliant";
    case "suspended":       return "expired";
    case "paid":            return "compliant";
    default:                return "pending";
  }
}

export default function PayLessNoticePage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = String(params.applicationId ?? "app5");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [app, setApp] = useState<ApplicationRow | null>(null);
  const [pln, setPln] = useState<PayLessNotice | null>(null);
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");

  const [notifiedSum, setNotifiedSum] = useState("");
  const [withheldAmount, setWithheldAmount] = useState("");
  const [withholdingReasons, setWithholdingReasons] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);

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

        const appRow: ApplicationRow = appData ?? SEED_APP;
        setApp(appRow);
        setNotifiedSum(String(appRow.certified_value ?? 0));

        const { data: plnData } = await supabase
          .from("pay_less_notices")
          .select("*")
          .eq("application_id", applicationId)
          .eq("workspace_id", wsId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (plnData) setPln(plnData as PayLessNotice);
      } catch {
        setApp(SEED_APP);
        setNotifiedSum(String(SEED_APP.certified_value ?? 0));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [applicationId]);

  const notifiedSumNum = parseFloat(notifiedSum || "0");
  const withheldNum = parseFloat(withheldAmount || "0");
  const amountToPay = notifiedSumNum - withheldNum;

  const timeline = app
    ? calculatePaymentTimeline({
        application_date: app.submission_date ?? new Date().toISOString(),
        payment_terms_days: app.payment_terms_days ?? 30,
        prescribed_period_days: app.prescribed_period_days ?? 5,
        pln_issued_at: pln?.issued_at ?? null,
        paid_at: app.status === "Paid" ? app.submission_date : null,
      })
    : null;

  const plnWindowClosed = timeline ? new Date() > timeline.pln_cutoff : false;
  const canIssuePLN = !pln && !plnWindowClosed;

  const handlePreviewPDF = useCallback(async () => {
    if (!app) return;
    try {
      const blob = await pdf(
        <PayLessNoticeDocument
          documentId="PREVIEW"
          workspaceName="MeasureDeck Workspace"
          issuingParty="Your Organisation"
          receivingParty={app.contractor}
          applicationRef={app.ref}
          applicationDate={app.submission_date ?? new Date().toISOString()}
          notifiedSum={notifiedSumNum}
          withheldAmount={withheldNum}
          withholdingReasons={withholdingReasons || "(Not yet entered)"}
          amountToPay={amountToPay}
          issueDate={issueDate}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch {
      toast.error("Failed to generate PDF preview");
    }
  }, [app, notifiedSumNum, withheldNum, withholdingReasons, amountToPay, issueDate]);

  const handleIssuePLN = useCallback(async () => {
    if (!app || !canIssuePLN) return;
    if (!withholdingReasons.trim()) {
      toast.error("Withholding reasons are required");
      return;
    }
    if (withheldNum <= 0) {
      toast.error("Withheld amount must be greater than zero");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const plnId = crypto.randomUUID();

      const pdfBlob = await pdf(
        <PayLessNoticeDocument
          documentId={plnId}
          workspaceName="MeasureDeck Workspace"
          issuingParty="Your Organisation"
          receivingParty={app.contractor}
          applicationRef={app.ref}
          applicationDate={app.submission_date ?? new Date().toISOString()}
          notifiedSum={notifiedSumNum}
          withheldAmount={withheldNum}
          withholdingReasons={withholdingReasons}
          amountToPay={amountToPay}
          issueDate={issueDate}
        />
      ).toBlob();

      const pdfFile = new File([pdfBlob], `pln-${plnId}.pdf`, {
        type: "application/pdf",
      });

      const { path: pdfPath } = await uploadFile(supabase, {
        bucket: "legal-notices",
        path: `${workspaceId}/pln-${plnId}.pdf`,
        file: pdfFile,
      });

      const { error: insertError } = await supabase
        .from("pay_less_notices")
        .insert({
          id: plnId,
          application_id: applicationId,
          workspace_id: workspaceId,
          notified_sum: notifiedSumNum,
          withheld_amount: withheldNum,
          amount_to_pay: amountToPay,
          withholding_reasons: withholdingReasons,
          issue_date: issueDate,
          issued_at: new Date().toISOString(),
          pdf_path: pdfPath,
          status: "issued",
          is_immutable: true,
        });

      if (insertError) throw new Error(insertError.message);

      await createAuditEvent(supabase, {
        workspace_id: workspaceId,
        user_id: currentUserId,
        action: "pay_less_notice.issued",
        resource_type: "pay_less_notice",
        resource_id: plnId,
        new_values: {
          application_id: applicationId,
          notified_sum: notifiedSumNum,
          withheld_amount: withheldNum,
          amount_to_pay: amountToPay,
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
            type: "pay_less_notice_issued",
            title: "Pay Less Notice Issued",
            body: `PLN issued for ${app.ref}. Amount to pay: ${formatCurrencyFull(amountToPay)}`,
            action_url: `/app/applications/${applicationId}/pay-less-notice`,
            urgency: "high",
          });
        }
      }

      const { data: newPln } = await supabase
        .from("pay_less_notices")
        .select("*")
        .eq("id", plnId)
        .single();

      if (newPln) setPln(newPln as PayLessNotice);

      toast.success("Pay Less Notice issued and stored");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to issue PLN");
    } finally {
      setSubmitting(false);
    }
  }, [
    app,
    canIssuePLN,
    withholdingReasons,
    withheldNum,
    notifiedSumNum,
    amountToPay,
    issueDate,
    applicationId,
    workspaceId,
    currentUserId,
  ]);

  const handleDownloadPDF = useCallback(async () => {
    if (!pln?.pdf_path) return;
    try {
      const supabase = createClient();
      const { data, error } = await supabase.storage
        .from("legal-notices")
        .createSignedUrl(pln.pdf_path, 3600);
      if (error || !data) throw new Error("Cannot generate download link");
      window.open(data.signedUrl, "_blank");
    } catch {
      toast.error("Failed to retrieve PDF");
    }
  }, [pln]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="page-header">
          <div className="skeleton h-6 w-64 rounded" />
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
              <h1 className="text-xl font-bold">Pay Less Notice</h1>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {app.ref} &nbsp;·&nbsp; {app.contractor} &nbsp;·&nbsp; HGCRA s.111
              </p>
            </div>
          </div>
          {pln && (
            <span className="badge chip-danger flex items-center gap-1.5">
              <Lock size={11} /> ISSUED — IMMUTABLE
            </span>
          )}
        </div>

        <div className="page-content space-y-6">
          {timeline && (
            <div className="card p-5">
              <h2 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Clock size={14} className="text-[var(--primary)]" />
                HGCRA Compliance Timelines
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[var(--bg-muted)]">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    PLN Cutoff
                  </span>
                  <CountdownClock
                    deadline={timeline.pln_cutoff}
                    label={formatDate(timeline.pln_cutoff)}
                    urgencyThresholdDays={3}
                  />
                </div>
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[var(--bg-muted)]">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Final Date for Payment
                  </span>
                  <CountdownClock
                    deadline={timeline.final_date_for_payment}
                    label={formatDate(timeline.final_date_for_payment)}
                    urgencyThresholdDays={5}
                  />
                </div>
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[var(--bg-muted)]">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    Compliance Status
                  </span>
                  <ComplianceBadge
                    status={statusToCompliance(timeline.status)}
                    label={
                      timeline.status === "on_track"
                        ? "On Track"
                        : timeline.status === "pln_overdue"
                        ? "PLN Overdue"
                        : timeline.status === "payment_overdue"
                        ? "Payment Overdue"
                        : timeline.status === "suspended"
                        ? "Suspended"
                        : "Paid"
                    }
                  />
                </div>
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-[var(--bg-muted)]">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                    PLN Compliant
                  </span>
                  {timeline.is_pln_compliant ? (
                    <div className="flex items-center gap-1.5 text-green-600 font-semibold">
                      <CheckCircle2 size={16} /> Yes
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-red-600 font-semibold">
                      <XCircle size={16} /> No — Late
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {plnWindowClosed && !pln && (
            <div className="card p-5 border-l-4 border-l-amber-500 bg-amber-50">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800">PLN Window Closed</p>
                  <p className="text-sm text-amber-700 mt-1">
                    The prescribed period for issuing a Pay Less Notice has passed. The notified
                    sum is now the certified amount payable in full — no further deductions can be
                    made under s.111 HGCRA 1996.
                  </p>
                </div>
              </div>
            </div>
          )}

          {pln && !timeline?.is_pln_compliant && (
            <div className="card p-5 border-l-4 border-l-red-500 bg-red-50">
              <div className="flex items-start gap-3">
                <XCircle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-800">
                    Non-Compliant PLN — Issued After Cutoff
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    This Pay Less Notice was issued after the prescribed period cutoff. It may not
                    be effective to withhold the stated amount. Legal advice is recommended.
                  </p>
                </div>
              </div>
            </div>
          )}

          {pln ? (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock size={14} className="text-[var(--danger)]" />
                  <h2 className="text-sm font-semibold">Pay Less Notice — Issued</h2>
                </div>
                <div className="flex items-center gap-2">
                  <ComplianceBadge
                    status={timeline?.is_pln_compliant ? "compliant" : "non_compliant"}
                    label={timeline?.is_pln_compliant ? "Compliant" : "Non-Compliant"}
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
                    { label: "Notified Sum", value: formatCurrencyFull(pln.notified_sum) },
                    { label: "Amount Withheld", value: `(${formatCurrencyFull(pln.withheld_amount)})` },
                    { label: "Amount to Pay", value: formatCurrencyFull(pln.amount_to_pay), bold: true },
                    { label: "Issue Date", value: formatDate(pln.issue_date) },
                  ].map(({ label, value, bold }) => (
                    <div
                      key={label}
                      className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-muted)]"
                    >
                      <span className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                        {label}
                      </span>
                      <span
                        className={cn(
                          "text-sm",
                          bold ? "font-bold text-[var(--text-primary)]" : "font-medium"
                        )}
                      >
                        {value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-muted)]">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-2">
                    Withholding Reasons
                  </p>
                  <p className="text-sm text-[var(--text-secondary)] whitespace-pre-wrap">
                    {pln.withholding_reasons}
                  </p>
                </div>

                <div className="p-3 rounded-xl border border-[var(--border)] flex items-center gap-2">
                  <Lock size={13} className="text-[var(--text-muted)]" />
                  <p className="text-xs text-[var(--text-muted)]">
                    This document is immutable and cannot be edited after issue in accordance with
                    HGCRA 1996 s.111.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            canIssuePLN && (
              <div className="card p-5">
                <h2 className="text-sm font-semibold mb-5 flex items-center gap-2">
                  <FileText size={14} className="text-[var(--primary)]" />
                  Issue Pay Less Notice
                </h2>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="form-label">
                        Notified Sum (£)
                        <span className="text-[var(--danger)] ml-1">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-input"
                        value={notifiedSum}
                        onChange={(e) => setNotifiedSum(e.target.value)}
                        placeholder="Pre-filled from certified value"
                      />
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        From application certified value
                      </p>
                    </div>
                    <div>
                      <label className="form-label">
                        Withheld Amount (£)
                        <span className="text-[var(--danger)] ml-1">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="form-input"
                        value={withheldAmount}
                        onChange={(e) => setWithheldAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border-2 border-[var(--primary)] bg-[var(--primary-light)]">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary)] mb-1">
                      Amount to Pay (Auto-calculated)
                    </p>
                    <p className="text-2xl font-bold text-[var(--primary)]">
                      {formatCurrencyFull(Math.max(0, amountToPay))}
                    </p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {formatCurrencyFull(notifiedSumNum)} − {formatCurrencyFull(withheldNum)}
                    </p>
                  </div>

                  <div>
                    <label className="form-label">
                      Withholding Reasons (Itemised by Statutory Requirement)
                      <span className="text-[var(--danger)] ml-1">*</span>
                    </label>
                    <textarea
                      className="form-input"
                      rows={5}
                      value={withholdingReasons}
                      onChange={(e) => setWithholdingReasons(e.target.value)}
                      placeholder={"Set out each ground for withholding on a separate line, e.g.:\n1. Defective works to Level 3 cladding — £12,000\n2. Contra charge for site clearance — £5,000\n3. Retention deduction per contract — £8,500"}
                    />
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      Required by s.111(3A) HGCRA 1996 — must specify the sum and the ground for
                      each withholding.
                    </p>
                  </div>

                  <div>
                    <label className="form-label">Issue Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center gap-3 flex-wrap pt-2">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={handlePreviewPDF}
                    >
                      <FileText size={13} /> Preview PDF
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleIssuePLN}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                          Issuing…
                        </>
                      ) : (
                        <>
                          <Send size={14} /> Issue PLN
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )
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
                href={`/app/applications/${applicationId}/suspension-notice`}
                className="btn btn-secondary btn-sm"
              >
                <AlertTriangle size={13} /> Suspension Notice
              </Link>
            </div>
          </div>
        </div>
      </div>
    </FeatureGate>
  );
}

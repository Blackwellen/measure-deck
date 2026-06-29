"use client";

import { useState, useEffect, useCallback } from "react";
import React from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, CheckCircle2, Download, AlertTriangle, Clock,
  FileText, Shield, Calendar, AlertCircle, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { pdf } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/client";
import { getWorkspaceId } from "@/lib/workspace";
import { createAuditEvent } from "@/lib/audit";
import { uploadFile, getSignedUrl } from "@/lib/storage";
import { createNotification } from "@/lib/notifications";
import { FeatureGate } from "@/components/ui/feature-gate";
import {
  validatePCCertificate,
  calculateDLPEndDate,
  calculateMakeGoodDeadline,
} from "@/lib/pc/certificate-validator";
import { PCCertificateDocument } from "@/lib/pdf-templates/pc-certificate";
import { cn, formatDate } from "@/lib/utils";

interface Project {
  id: string;
  name: string;
  ref: string;
  start_date: string;
  end_date?: string;
  address?: string;
  dlp_months?: number;
}

interface PracticalCompletion {
  id: string;
  certificate_number: string;
  pc_date: string;
  contract_administrator_name: string;
  contract_administrator_company: string;
  dlp_start_date: string;
  dlp_end_date: string;
  dlp_months: number;
  outstanding_defects: boolean;
  outstanding_defects_detail?: string;
  certificate_url?: string;
  is_immutable: boolean;
  mgd_certificate_number?: string;
  mgd_date?: string;
}

type DLPStatus = "in_dlp" | "dlp_complete" | "overdue_defects";

function getDLPStatus(
  dlpEndDate: Date,
  openSnags: number
): DLPStatus {
  const now = new Date();
  if (now > dlpEndDate) {
    if (openSnags > 0) return "overdue_defects";
    return "dlp_complete";
  }
  return "in_dlp";
}

function ComplianceBadge({ status }: { status: DLPStatus }) {
  const map: Record<DLPStatus, { label: string; cls: string }> = {
    in_dlp: { label: "In DLP", cls: "chip-warning" },
    dlp_complete: { label: "DLP Complete", cls: "chip-success" },
    overdue_defects: { label: "Overdue Defects", cls: "chip-danger" },
  };
  const m = map[status];
  return <span className={cn("badge", m.cls)}>{m.label}</span>;
}

function CountdownClock({ targetDate }: { targetDate: Date }) {
  const [remaining, setRemaining] = useState<string>("");

  useEffect(() => {
    function compute() {
      const now = Date.now();
      const diff = targetDate.getTime() - now;
      if (diff <= 0) {
        setRemaining("Expired");
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setRemaining(`${days}d ${hours}h ${mins}m`);
    }
    compute();
    const t = setInterval(compute, 60000);
    return () => clearInterval(t);
  }, [targetDate]);

  return (
    <span className="font-mono text-sm font-semibold" style={{ color: "var(--primary)" }}>
      {remaining}
    </span>
  );
}

function PCForm({
  project,
  workspaceId,
  userId,
  onIssued,
}: {
  project: Project;
  workspaceId: string;
  userId: string;
  onIssued: () => void;
}) {
  const defaultCertNumber = `PC-${project.ref}-001`;
  const defaultDlpMonths = project.dlp_months ?? 12;

  const [pcDate, setPcDate] = useState<string>("");
  const [certNumber, setCertNumber] = useState<string>(defaultCertNumber);
  const [caName, setCaName] = useState<string>("");
  const [caCompany, setCaCompany] = useState<string>("");
  const [hasOutstandingDefects, setHasOutstandingDefects] = useState<boolean>(false);
  const [defectsDetail, setDefectsDetail] = useState<string>("");
  const [dlpMonths] = useState<number>(defaultDlpMonths);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  const computedDlpEnd = pcDate
    ? calculateDLPEndDate(new Date(pcDate), dlpMonths)
    : null;

  const computedMakeGood = computedDlpEnd
    ? calculateMakeGoodDeadline(computedDlpEnd)
    : null;

  function handleDateChange(val: string) {
    setPcDate(val);
    if (!val) {
      setValidationErrors([]);
      setValidationWarnings([]);
      return;
    }
    const result = validatePCCertificate({
      proposed_pc_date: new Date(val),
      contract_start_date: new Date(project.start_date),
      contract_end_date: project.end_date ? new Date(project.end_date) : undefined,
      existing_pc: null,
    });
    setValidationErrors(result.errors);
    setValidationWarnings(result.warnings);
  }

  async function handleIssue() {
    if (!pcDate || !caName || !caCompany) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const validation = validatePCCertificate({
      proposed_pc_date: new Date(pcDate),
      contract_start_date: new Date(project.start_date),
      contract_end_date: project.end_date ? new Date(project.end_date) : undefined,
      existing_pc: null,
    });

    if (!validation.can_issue) {
      toast.error(validation.errors[0] ?? "Cannot issue PC Certificate.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const pcDateObj = new Date(pcDate);
      const dlpEndDate = calculateDLPEndDate(pcDateObj, dlpMonths);
      const now = new Date();
      const documentId = `PC-${project.ref}-${Date.now()}`;

      const certData = {
        projectName: project.name,
        projectAddress: project.address ?? "See contract",
        contractNumber: project.ref,
        certificateNumber: certNumber,
        pcDate: pcDateObj,
        contractAdministratorName: caName,
        contractAdministratorCompany: caCompany,
        issuedDate: now,
        dlpStartDate: pcDateObj,
        dlpEndDate: dlpEndDate,
        dlpMonths: dlpMonths,
        outstandingDefects: hasOutstandingDefects,
        outstandingDefectsDetail: hasOutstandingDefects ? defectsDetail : undefined,
        documentId,
        workspaceName: workspaceId,
      };

      const pdfBlob = await pdf(
        <PCCertificateDocument data={certData} />
      ).toBlob();

      const pdfFile = new File(
        [pdfBlob],
        `${certNumber.replace(/\//g, "-")}.pdf`,
        { type: "application/pdf" }
      );

      const storagePath = `${workspaceId}/pc-certificates/${project.id}/${certNumber.replace(/\//g, "-")}-${Date.now()}.pdf`;

      const { path } = await uploadFile(supabase, {
        bucket: "legal-notices",
        path: storagePath,
        file: pdfFile,
        metadata: {
          certificate_number: certNumber,
          project_id: project.id,
          workspace_id: workspaceId,
          immutable: "true",
        },
      });

      const { error: insertError } = await supabase
        .from("practical_completions")
        .insert({
          project_id: project.id,
          workspace_id: workspaceId,
          certificate_number: certNumber,
          pc_date: pcDate,
          contract_administrator_name: caName,
          contract_administrator_company: caCompany,
          dlp_start_date: pcDate,
          dlp_end_date: dlpEndDate.toISOString().split("T")[0],
          dlp_months: dlpMonths,
          outstanding_defects: hasOutstandingDefects,
          outstanding_defects_detail: hasOutstandingDefects ? defectsDetail : null,
          certificate_storage_path: path,
          is_immutable: true,
          document_id: documentId,
        });

      if (insertError) throw new Error(insertError.message);

      await supabase
        .from("projects")
        .update({ status: "practical_completion", pc_date: pcDate })
        .eq("id", project.id);

      await createAuditEvent(supabase, {
        workspace_id: workspaceId,
        user_id: userId,
        action: "practical_completion_issued",
        resource_type: "practical_completion",
        resource_id: project.id,
        new_values: {
          certificate_number: certNumber,
          pc_date: pcDate,
          dlp_end_date: dlpEndDate.toISOString().split("T")[0],
        },
      });

      const { data: members } = await supabase
        .from("workspace_memberships")
        .select("user_id")
        .eq("workspace_id", workspaceId);

      if (members) {
        for (const m of members as Array<{ user_id: string }>) {
          await createNotification(supabase, {
            workspace_id: workspaceId,
            recipient_user_id: m.user_id,
            type: "practical_completion_issued",
            title: "Practical Completion Issued",
            body: `Certificate ${certNumber} issued for ${project.name}. DLP ends ${formatDate(dlpEndDate.toISOString())}.`,
            action_url: `/app/projects/${project.id}/practical-completion`,
            urgency: "high",
          });
        }
      }

      toast.success("Practical Completion Certificate issued.");
      onIssued();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to issue certificate.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card p-6 flex flex-col gap-5 max-w-2xl">
      <div>
        <h2
          className="text-base font-semibold"
          style={{ color: "var(--text-primary)" }}
        >
          Issue Practical Completion Certificate
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Issuing this certificate is irreversible and triggers the Defects Liability Period.
        </p>
      </div>

      {validationErrors.length > 0 && (
        <div
          className="flex flex-col gap-1 p-3 rounded-xl"
          style={{ background: "var(--danger-bg)" }}
        >
          {validationErrors.map((e, i) => (
            <div key={i} className="flex items-start gap-2">
              <AlertCircle size={14} style={{ color: "var(--danger)", marginTop: 2 }} />
              <span className="text-sm" style={{ color: "var(--danger-text)" }}>{e}</span>
            </div>
          ))}
        </div>
      )}

      {validationWarnings.length > 0 && (
        <div
          className="flex flex-col gap-1 p-3 rounded-xl"
          style={{ background: "var(--warning-bg)" }}
        >
          {validationWarnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2">
              <AlertTriangle size={14} style={{ color: "var(--warning)", marginTop: 2 }} />
              <span className="text-sm" style={{ color: "var(--warning-text)" }}>{w}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="form-label">
            PC Date <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          <input
            type="date"
            className="form-input"
            value={pcDate}
            max={new Date().toISOString().split("T")[0]}
            onChange={e => handleDateChange(e.target.value)}
          />
        </div>

        <div>
          <label className="form-label">Certificate Number</label>
          <input
            type="text"
            className="form-input font-mono"
            value={certNumber}
            onChange={e => setCertNumber(e.target.value)}
          />
        </div>

        <div>
          <label className="form-label">
            Contract Administrator Name <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. John Smith"
            value={caName}
            onChange={e => setCaName(e.target.value)}
          />
        </div>

        <div>
          <label className="form-label">
            CA Company <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Thornton Architects Ltd"
            value={caCompany}
            onChange={e => setCaCompany(e.target.value)}
          />
        </div>
      </div>

      {pcDate && computedDlpEnd && (
        <div
          className="rounded-xl p-4 flex flex-col gap-2"
          style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}
        >
          <p
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: "var(--text-muted)" }}
          >
            DLP Summary
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>DLP Start</p>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {formatDate(pcDate)}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>DLP End</p>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {formatDate(computedDlpEnd.toISOString())}
              </p>
            </div>
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Make Good Notice</p>
              <p className="text-sm font-semibold" style={{ color: "var(--warning-text)" }}>
                {computedMakeGood ? formatDate(computedMakeGood.toISOString()) : "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <div className="flex items-center gap-3 mb-2">
          <label className="form-label mb-0">Outstanding Defects at PC?</label>
          <button
            type="button"
            onClick={() => setHasOutstandingDefects(v => !v)}
            className={cn(
              "relative inline-flex h-5 w-9 rounded-full transition-colors",
              hasOutstandingDefects
                ? "bg-[var(--primary)]"
                : "bg-[var(--border)]"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                hasOutstandingDefects && "translate-x-4"
              )}
            />
          </button>
        </div>
        {hasOutstandingDefects && (
          <textarea
            className="form-input min-h-[80px] resize-none"
            placeholder="Describe the outstanding defects to be remedied during the DLP…"
            value={defectsDetail}
            onChange={e => setDefectsDetail(e.target.value)}
          />
        )}
      </div>

      <div
        className="rounded-xl p-3 flex items-start gap-2"
        style={{ background: "var(--warning-bg)" }}
      >
        <AlertTriangle size={14} style={{ color: "var(--warning)", marginTop: 1, flexShrink: 0 }} />
        <p className="text-xs" style={{ color: "var(--warning-text)" }}>
          Once issued, this certificate cannot be deleted or altered. It will be stored in
          immutable secure storage. Ensure all details are correct before proceeding.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          className="btn btn-primary"
          disabled={
            submitting ||
            !pcDate ||
            !caName ||
            !caCompany ||
            validationErrors.length > 0
          }
          onClick={() => void handleIssue()}
        >
          {submitting ? (
            <>
              <span
                className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"
              />
              Issuing…
            </>
          ) : (
            <>
              <CheckCircle2 size={16} />
              Issue PC Certificate
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function PCIssuedView({
  pc,
  projectId,
  workspaceId,
  openSnagCount,
}: {
  pc: PracticalCompletion;
  projectId: string;
  workspaceId: string;
  openSnagCount: number;
}) {
  const router = useRouter();
  const dlpEnd = new Date(pc.dlp_end_date);
  const dlpStatus = getDLPStatus(dlpEnd, openSnagCount);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [showMGDForm, setShowMGDForm] = useState(false);
  const [mgdCertNumber, setMgdCertNumber] = useState(
    `MGD-${pc.certificate_number.replace("PC-", "")}-001`
  );
  const [mgdDate, setMgdDate] = useState<string>("");
  const [mgdSubmitting, setMgdSubmitting] = useState(false);

  async function handleDownload() {
    if (!pc.certificate_url && workspaceId) {
      setDownloadLoading(true);
      try {
        const supabase = createClient();
        const { data: pcData } = await supabase
          .from("practical_completions")
          .select("certificate_storage_path")
          .eq("id", pc.id)
          .single();
        if (pcData && (pcData as { certificate_storage_path: string }).certificate_storage_path) {
          const url = await getSignedUrl(supabase, {
            bucket: "legal-notices",
            path: (pcData as { certificate_storage_path: string }).certificate_storage_path,
            expiresIn: 300,
          });
          window.open(url, "_blank");
        }
      } catch {
        toast.error("Could not retrieve certificate.");
      } finally {
        setDownloadLoading(false);
      }
    } else if (pc.certificate_url) {
      window.open(pc.certificate_url, "_blank");
    }
  }

  async function handleIssueMGD() {
    if (!mgdDate) {
      toast.error("Please select a date for the Making Good Defects Certificate.");
      return;
    }
    setMgdSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      await supabase
        .from("practical_completions")
        .update({
          mgd_certificate_number: mgdCertNumber,
          mgd_date: mgdDate,
        })
        .eq("id", pc.id);

      await createAuditEvent(supabase, {
        workspace_id: workspaceId,
        user_id: user?.id ?? "",
        action: "mgd_certificate_issued",
        resource_type: "practical_completion",
        resource_id: pc.id,
        new_values: { mgd_certificate_number: mgdCertNumber, mgd_date: mgdDate },
      });

      toast.success("Making Good Defects Certificate issued.");
      setShowMGDForm(false);
    } catch {
      toast.error("Failed to issue MGD certificate.");
    } finally {
      setMgdSubmitting(false);
    }
  }

  const dlpNow = new Date();
  const dlpTotal = dlpEnd.getTime() - new Date(pc.dlp_start_date).getTime();
  const dlpElapsed = Math.min(
    dlpNow.getTime() - new Date(pc.dlp_start_date).getTime(),
    dlpTotal
  );
  const dlpPercent =
    dlpTotal > 0 ? Math.max(0, Math.min(100, (dlpElapsed / dlpTotal) * 100)) : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="card p-6 flex flex-col gap-4">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <CheckCircle2 size={20} style={{ color: "var(--success)" }} />
              <h2
                className="text-base font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Practical Completion Issued
              </h2>
            </div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Certificate No: <span className="font-mono font-semibold">{pc.certificate_number}</span>
            </p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => void handleDownload()}
            disabled={downloadLoading}
          >
            <Download size={14} />
            {downloadLoading ? "Loading…" : "Download Certificate"}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>PC Date</p>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {formatDate(pc.pc_date)}
            </p>
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Contract Administrator</p>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {pc.contract_administrator_name}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {pc.contract_administrator_company}
            </p>
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>DLP Status</p>
            <ComplianceBadge status={dlpStatus} />
          </div>
        </div>

        {pc.outstanding_defects && pc.outstanding_defects_detail && (
          <div
            className="rounded-xl p-3"
            style={{ background: "var(--warning-bg)" }}
          >
            <p
              className="text-xs font-semibold mb-1"
              style={{ color: "var(--warning-text)" }}
            >
              Outstanding Defects at PC
            </p>
            <p className="text-xs" style={{ color: "var(--warning-text)" }}>
              {pc.outstanding_defects_detail}
            </p>
          </div>
        )}
      </div>

      <div className="card p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3
            className="text-sm font-semibold flex items-center gap-2"
            style={{ color: "var(--text-primary)" }}
          >
            <Clock size={16} style={{ color: "var(--primary)" }} />
            Defects Liability Period
          </h3>
          <ComplianceBadge status={dlpStatus} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>DLP Start</p>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {formatDate(pc.dlp_start_date)}
            </p>
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>DLP End</p>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {formatDate(pc.dlp_end_date)}
            </p>
          </div>
          {dlpStatus === "in_dlp" && (
            <div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Time Remaining</p>
              <CountdownClock targetDate={dlpEnd} />
            </div>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              DLP Progress ({pc.dlp_months} months)
            </p>
            <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              {dlpPercent.toFixed(0)}%
            </p>
          </div>
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: "var(--bg-muted)" }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${dlpPercent}%`,
                background:
                  dlpStatus === "overdue_defects"
                    ? "var(--danger)"
                    : dlpStatus === "dlp_complete"
                    ? "var(--success)"
                    : "var(--primary)",
              }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--bg-subtle)" }}>
          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Open Snagging Items</p>
            <p
              className="text-sm font-semibold"
              style={{ color: openSnagCount > 0 ? "var(--warning)" : "var(--success)" }}
            >
              {openSnagCount} open
            </p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => router.push(`/app/projects/${projectId}/snagging`)}
          >
            View Snag Register <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {!pc.mgd_certificate_number && (
        <div className="card p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Making Good Defects Certificate
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                Issue when all defects notified during the DLP have been made good.
              </p>
            </div>
            <button
              className="btn btn-primary btn-sm"
              disabled={openSnagCount > 0}
              onClick={() => setShowMGDForm(v => !v)}
            >
              <Shield size={14} />
              Issue MGD Certificate
            </button>
          </div>

          {openSnagCount > 0 && (
            <div
              className="rounded-xl p-3 flex items-start gap-2"
              style={{ background: "var(--bg-subtle)" }}
            >
              <AlertTriangle size={14} style={{ color: "var(--text-muted)", marginTop: 1 }} />
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                There are {openSnagCount} open snag(s). Close all snags before issuing the MGD Certificate.
              </p>
            </div>
          )}

          {showMGDForm && openSnagCount === 0 && (
            <div className="flex flex-col gap-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">MGD Certificate Number</label>
                  <input
                    type="text"
                    className="form-input font-mono"
                    value={mgdCertNumber}
                    onChange={e => setMgdCertNumber(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Date of Issue</label>
                  <input
                    type="date"
                    className="form-input"
                    value={mgdDate}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={e => setMgdDate(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn btn-primary btn-sm"
                  disabled={mgdSubmitting || !mgdDate}
                  onClick={() => void handleIssueMGD()}
                >
                  {mgdSubmitting ? "Issuing…" : "Confirm Issue MGD"}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowMGDForm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {pc.mgd_certificate_number && (
        <div className="card p-6 flex items-center gap-3">
          <CheckCircle2 size={20} style={{ color: "var(--success)" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Making Good Defects Certificate Issued
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Certificate {pc.mgd_certificate_number} · {pc.mgd_date ? formatDate(pc.mgd_date) : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PracticalCompletionPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [pc, setPc] = useState<PracticalCompletion | null>(null);
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [openSnagCount, setOpenSnagCount] = useState<number>(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const wid = await getWorkspaceId(supabase);
      const { data: { user } } = await supabase.auth.getUser();
      setWorkspaceId(wid);
      setUserId(user?.id ?? "");

      const { data: proj } = await supabase
        .from("projects")
        .select("id, name, ref, start_date, end_date, address, dlp_months")
        .eq("id", projectId)
        .single();

      if (proj) setProject(proj as Project);

      const { data: pcData } = await supabase
        .from("practical_completions")
        .select("*")
        .eq("project_id", projectId)
        .eq("workspace_id", wid)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pcData) setPc(pcData as PracticalCompletion);

      const { count } = await supabase
        .from("snagging_items")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId)
        .eq("workspace_id", wid)
        .in("status", ["open", "in_progress", "awaiting_inspection"]);

      setOpenSnagCount(count ?? 0);
    } catch {
      setProject({
        id: projectId,
        name: "Project",
        ref: "PRJ-001",
        start_date: "2024-01-01",
        dlp_months: 12,
      });
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div className="skeleton h-8 w-48 rounded-[var(--radius)]" />
        <div className="skeleton h-64 rounded-[var(--radius)]" />
      </div>
    );
  }

  return (
    <FeatureGate flag="pc_snagging">
      <div className="flex flex-col min-h-full">
        <div className="page-header flex-col items-start gap-4">
          <button
            className="btn btn-ghost btn-sm text-xs"
            style={{ color: "var(--text-muted)" }}
            onClick={() => router.push(`/app/projects/${projectId}`)}
          >
            <ArrowLeft size={13} />
            Back to Project
          </button>

          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: "var(--success)18" }}
            >
              <FileText size={20} style={{ color: "var(--success)" }} />
            </div>
            <div>
              <h1
                className="text-xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Practical Completion
              </h1>
              {project && (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {project.name}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="page-content flex-1">
          {project && !pc && (
            <PCForm
              project={project}
              workspaceId={workspaceId}
              userId={userId}
              onIssued={() => void load()}
            />
          )}

          {project && pc && (
            <PCIssuedView
              pc={pc}
              projectId={projectId}
              workspaceId={workspaceId}
              openSnagCount={openSnagCount}
            />
          )}
        </div>
      </div>
    </FeatureGate>
  );
}

"use client";

import { WizardShell, SummaryRow, SummarySection } from "@/components/wizards/wizard-shell";
import { createAuditEvent } from "@/lib/audit";
import { getWorkspaceId } from "@/lib/workspace";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React from "react";

interface Project {
  id: string;
  name: string;
}

interface AdjudicationWizardProps {
  onClose: () => void;
  onCreated?: () => void;
  initialProjectId?: string;
}

type DisputeType =
  | "payment"
  | "variation"
  | "extension_of_time"
  | "delay_disruption"
  | "other";

const DISPUTE_TYPE_LABELS: Record<DisputeType, string> = {
  payment: "Payment",
  variation: "Variation",
  extension_of_time: "Extension of Time",
  delay_disruption: "Delay & Disruption",
  other: "Other",
};

const WIZARD_STEPS = [
  { id: "dispute-details", label: "Dispute Details" },
  { id: "key-dates", label: "Key Dates" },
  { id: "review", label: "Review & Create" },
];

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDateDisplay(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function toInputValue(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function AdjudicationWizard({ onClose, onCreated, initialProjectId }: AdjudicationWizardProps) {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [createdId, setCreatedId] = React.useState<string | null>(null);

  const [caseNumber, setCaseNumber] = React.useState("ADJ-2026-001");
  const [projectId, setProjectId] = React.useState(initialProjectId ?? "");
  const [disputeType, setDisputeType] = React.useState<DisputeType>("payment");
  const [disputeDescription, setDisputeDescription] = React.useState("");
  const [amountInDispute, setAmountInDispute] = React.useState("");
  const [respondingParty, setRespondingParty] = React.useState("");
  const [noticeDate, setNoticeDate] = React.useState(toInputValue(new Date()));

  const [appointmentDate, setAppointmentDate] = React.useState("");
  const [jurisdictionNotes, setJurisdictionNotes] = React.useState("");

  const noticeDateObj = noticeDate ? new Date(noticeDate) : new Date();
  const referralDue = addDays(noticeDateObj, 7);
  const appointmentDateObj = appointmentDate ? new Date(appointmentDate) : null;
  const responseDue = appointmentDateObj ? addDays(appointmentDateObj, 7) : null;
  const decisionDue = appointmentDateObj ? addDays(appointmentDateObj, 28) : null;

  React.useEffect(() => {
    async function init() {
      try {
        const supabase = createClient();
        const workspaceId = await getWorkspaceId(supabase);
        const [{ data: proj }, { count }] = await Promise.all([
          supabase.from("projects").select("id, name").eq("workspace_id", workspaceId).order("name"),
          supabase
            .from("adjudication_cases")
            .select("id", { count: "exact", head: true })
            .eq("workspace_id", workspaceId),
        ]);
        if (proj) setProjects(proj as Project[]);
        const seq = (count ?? 0) + 1;
        const year = new Date().getFullYear();
        setCaseNumber(`ADJ-${year}-${String(seq).padStart(3, "0")}`);
      } catch {
        // silently ignore
      }
    }
    void init();
  }, []);

  const formData = React.useMemo(
    () => ({
      caseNumber,
      projectId,
      disputeType,
      disputeDescription,
      amountInDispute,
      respondingParty,
      noticeDate,
      appointmentDate,
      jurisdictionNotes,
    }),
    [
      caseNumber,
      projectId,
      disputeType,
      disputeDescription,
      amountInDispute,
      respondingParty,
      noticeDate,
      appointmentDate,
      jurisdictionNotes,
    ]
  );

  function handleDraftResume(resumeStep: number, data: Record<string, unknown>) {
    setStep(resumeStep);
    if (data.caseNumber) setCaseNumber(data.caseNumber as string);
    if (data.projectId) setProjectId(data.projectId as string);
    if (data.disputeType) setDisputeType(data.disputeType as DisputeType);
    if (data.disputeDescription) setDisputeDescription(data.disputeDescription as string);
    if (data.amountInDispute) setAmountInDispute(data.amountInDispute as string);
    if (data.respondingParty) setRespondingParty(data.respondingParty as string);
    if (data.noticeDate) setNoticeDate(data.noticeDate as string);
    if (data.appointmentDate) setAppointmentDate(data.appointmentDate as string);
    if (data.jurisdictionNotes) setJurisdictionNotes(data.jurisdictionNotes as string);
  }

  async function handleNext(): Promise<boolean> {
    if (step === 0) {
      if (!disputeDescription.trim() || !amountInDispute) return false;
      return true;
    }
    if (step === 1) {
      return true;
    }

    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return false;
      const workspaceId = await getWorkspaceId(supabase);

      const { data: newCase, error } = await supabase
        .from("adjudication_cases")
        .insert({
          workspace_id: workspaceId,
          project_id: projectId || null,
          case_number: caseNumber,
          dispute_type: disputeType,
          dispute_description: disputeDescription.trim(),
          amount_in_dispute: parseFloat(amountInDispute),
          responding_party: respondingParty.trim() || null,
          notice_date: noticeDate,
          appointment_date: appointmentDate || null,
          jurisdiction_notes: jurisdictionNotes.trim() || null,
          status: "notice_issued",
          created_by: user.id,
        })
        .select("id")
        .single();

      if (error) throw error;

      await createAuditEvent(supabase, {
        workspace_id: workspaceId,
        user_id: user.id,
        action: "adjudication_case_created",
        resource_type: "adjudication_case",
        resource_id: newCase?.id ?? "",
        new_values: {
          case_number: caseNumber,
          dispute_type: disputeType,
          amount_in_dispute: parseFloat(amountInDispute),
        },
      });

      setCreatedId(newCase?.id ?? null);
      setShowSuccess(true);
      onCreated?.();
      return true;
    } catch {
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedProject = projects.find((p) => p.id === projectId);

  const rightPanel = (
    <div>
      <SummarySection title="Dispute Details">
        <SummaryRow label="Case No." value={caseNumber} />
        <SummaryRow label="Project" value={selectedProject?.name} />
        <SummaryRow label="Dispute Type" value={DISPUTE_TYPE_LABELS[disputeType]} />
        <SummaryRow
          label="Amount in Dispute"
          value={amountInDispute ? `£${parseFloat(amountInDispute).toLocaleString()}` : undefined}
        />
        <SummaryRow label="Responding Party" value={respondingParty || undefined} />
      </SummarySection>
      <SummarySection title="Key Dates">
        <SummaryRow label="Notice Date" value={noticeDate ? formatDateDisplay(noticeDateObj) : undefined} />
        <SummaryRow label="Referral Due" value={formatDateDisplay(referralDue)} />
        {appointmentDateObj && (
          <>
            <SummaryRow label="Appointment Date" value={formatDateDisplay(appointmentDateObj)} />
            {responseDue && <SummaryRow label="Response Due" value={formatDateDisplay(responseDue)} />}
            {decisionDue && <SummaryRow label="Decision Due" value={formatDateDisplay(decisionDue)} />}
          </>
        )}
      </SummarySection>
    </div>
  );

  return (
    <WizardShell
      title="New Adjudication Case"
      subtitle="UK HGCRA Part II — Construction Act adjudication"
      steps={WIZARD_STEPS}
      currentStep={step}
      onStepChange={setStep}
      onClose={onClose}
      onNext={handleNext}
      isLastStep={step === 2}
      isSubmitting={isSubmitting}
      showSuccess={showSuccess}
      rightPanel={rightPanel}
      wizardId="adjudication-wizard"
      formData={formData}
      onDraftResume={handleDraftResume}
      successContent={
        <div className="flex flex-col items-center gap-3">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
          <h3 className="text-[17px] font-700" style={{ color: "var(--text-primary)" }}>
            Adjudication Case Created
          </h3>
          <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
            {caseNumber} has been registered. Referral due:{" "}
            {formatDateDisplay(referralDue)}.
          </p>
          <div className="flex gap-2 mt-2">
            {createdId && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => {
                  onClose();
                  router.push(`/app/adjudication/${createdId}`);
                }}
              >
                Open Case
              </button>
            )}
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm">
              Close
            </button>
          </div>
        </div>
      }
    >
      {step === 0 && (
        <div className="flex flex-col gap-5">
          <h3 className="text-[14px] font-700" style={{ color: "var(--text-primary)" }}>
            Dispute Details
          </h3>

          <div className="flex flex-col gap-1.5">
            <label className="form-label">Case Number</label>
            <input
              className="form-input"
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
              placeholder="ADJ-2026-001"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="form-label">Project</label>
            <select
              className="form-input"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">— Select project —</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="form-label">Dispute Type</label>
            <select
              className="form-input"
              value={disputeType}
              onChange={(e) => setDisputeType(e.target.value as DisputeType)}
            >
              {(Object.keys(DISPUTE_TYPE_LABELS) as DisputeType[]).map((k) => (
                <option key={k} value={k}>
                  {DISPUTE_TYPE_LABELS[k]}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="form-label">
              Dispute Description <span className="text-red-500">*</span>
            </label>
            <textarea
              className="form-input min-h-[100px] resize-y"
              value={disputeDescription}
              onChange={(e) => setDisputeDescription(e.target.value)}
              placeholder="Describe the nature of the dispute…"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="form-label">
                Amount in Dispute (£) <span className="text-red-500">*</span>
              </label>
              <input
                className="form-input"
                type="number"
                min={0}
                step={1000}
                value={amountInDispute}
                onChange={(e) => setAmountInDispute(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="form-label">Responding Party</label>
              <input
                className="form-input"
                value={respondingParty}
                onChange={(e) => setRespondingParty(e.target.value)}
                placeholder="Name of respondent…"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="form-label">Notice of Adjudication Date</label>
            <input
              className="form-input"
              type="date"
              value={noticeDate}
              onChange={(e) => setNoticeDate(e.target.value)}
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-5">
          <h3 className="text-[14px] font-700" style={{ color: "var(--text-primary)" }}>
            Key Dates
          </h3>

          <div
            className="rounded-xl p-4 flex flex-col gap-3"
            style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}
          >
            <p className="text-[12px] font-700" style={{ color: "var(--text-secondary)" }}>
              Auto-calculated dates
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  Notice of Adjudication
                </p>
                <p className="text-[13px] font-600" style={{ color: "var(--text-primary)" }}>
                  {formatDateDisplay(noticeDateObj)}
                </p>
              </div>
              <div>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  Referral Due (notice + 7 days)
                </p>
                <p className="text-[13px] font-600 text-amber-700">
                  {formatDateDisplay(referralDue)}
                </p>
              </div>
              {responseDue && (
                <div>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    Response Due (appointment + 7 days)
                  </p>
                  <p className="text-[13px] font-600" style={{ color: "var(--text-primary)" }}>
                    {formatDateDisplay(responseDue)}
                  </p>
                </div>
              )}
              {decisionDue && (
                <div>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    Decision Due (appointment + 28 days)
                  </p>
                  <p className="text-[13px] font-600 text-red-700">
                    {formatDateDisplay(decisionDue)}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="form-label">
              Adjudicator Appointment Date{" "}
              <span className="text-[11px] font-400" style={{ color: "var(--text-muted)" }}>
                (leave blank until known)
              </span>
            </label>
            <input
              className="form-input"
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="form-label">Jurisdiction Notes</label>
            <textarea
              className="form-input min-h-[100px] resize-y"
              value={jurisdictionNotes}
              onChange={(e) => setJurisdictionNotes(e.target.value)}
              placeholder="e.g. NEC4 Clause 90 / JCT Section 9 / HGCRA Part II applicable. Any bespoke contract provisions…"
            />
          </div>

          <div
            className="rounded-xl p-4 text-[12px]"
            style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}
          >
            <p className="font-700 mb-2" style={{ color: "var(--text-secondary)" }}>
              UK Statutory Timescales — HGCRA Part II
            </p>
            <ul className="flex flex-col gap-1" style={{ color: "var(--text-muted)" }}>
              <li>• Notice to Referral: 7 days (s.108(2)(b))</li>
              <li>• Decision period: 28 days from referral</li>
              <li>• Extension by agreement: up to 14 additional days</li>
              <li>• Adjudicator fees payable regardless of outcome</li>
            </ul>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5">
          <h3 className="text-[14px] font-700" style={{ color: "var(--text-primary)" }}>
            Review &amp; Create
          </h3>

          <div
            className="rounded-xl p-4 flex flex-col gap-3"
            style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}
          >
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-[12px]">
              <span style={{ color: "var(--text-muted)" }}>Case Number:</span>
              <span className="font-600" style={{ color: "var(--text-primary)" }}>
                {caseNumber}
              </span>

              <span style={{ color: "var(--text-muted)" }}>Project:</span>
              <span className="font-600" style={{ color: "var(--text-primary)" }}>
                {selectedProject?.name ?? "—"}
              </span>

              <span style={{ color: "var(--text-muted)" }}>Dispute Type:</span>
              <span className="font-600" style={{ color: "var(--text-primary)" }}>
                {DISPUTE_TYPE_LABELS[disputeType]}
              </span>

              <span style={{ color: "var(--text-muted)" }}>Amount in Dispute:</span>
              <span className="font-600 text-red-700">
                {amountInDispute ? `£${parseFloat(amountInDispute).toLocaleString()}` : "—"}
              </span>

              <span style={{ color: "var(--text-muted)" }}>Responding Party:</span>
              <span className="font-600" style={{ color: "var(--text-primary)" }}>
                {respondingParty || "—"}
              </span>

              <span style={{ color: "var(--text-muted)" }}>Notice Date:</span>
              <span className="font-600" style={{ color: "var(--text-primary)" }}>
                {noticeDate ? formatDateDisplay(noticeDateObj) : "—"}
              </span>

              <span style={{ color: "var(--text-muted)" }}>Referral Due:</span>
              <span className="font-600 text-amber-700">{formatDateDisplay(referralDue)}</span>

              {appointmentDateObj && (
                <>
                  <span style={{ color: "var(--text-muted)" }}>Appointment Date:</span>
                  <span className="font-600" style={{ color: "var(--text-primary)" }}>
                    {formatDateDisplay(appointmentDateObj)}
                  </span>
                </>
              )}

              {decisionDue && (
                <>
                  <span style={{ color: "var(--text-muted)" }}>Decision Due:</span>
                  <span className="font-600 text-red-700">{formatDateDisplay(decisionDue)}</span>
                </>
              )}
            </div>
          </div>

          {disputeDescription && (
            <div className="flex flex-col gap-1">
              <p className="text-[11px] font-700 uppercase tracking-[0.05em]" style={{ color: "var(--text-muted)" }}>
                Dispute Description
              </p>
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {disputeDescription}
              </p>
            </div>
          )}

          {jurisdictionNotes && (
            <div className="flex flex-col gap-1">
              <p className="text-[11px] font-700 uppercase tracking-[0.05em]" style={{ color: "var(--text-muted)" }}>
                Jurisdiction Notes
              </p>
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {jurisdictionNotes}
              </p>
            </div>
          )}
        </div>
      )}
    </WizardShell>
  );
}

export default AdjudicationWizard;

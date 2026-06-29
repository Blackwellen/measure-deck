"use client";

import { WizardShell, SummaryRow, SummarySection } from "@/components/wizards/wizard-shell";
import { createAuditEvent } from "@/lib/audit";
import { getWorkspaceId } from "@/lib/workspace";
import { uploadFile } from "@/lib/storage";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, Upload } from "lucide-react";
import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
}

interface ProgrammeWizardProps {
  onClose: () => void;
  onCreated?: () => void;
}

const WIZARD_STEPS = [
  { id: "revision", label: "Revision" },
  { id: "baseline", label: "Baseline" },
  { id: "notify", label: "Notify" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nextRevisionLetter(lastLetter: string | null): string {
  if (!lastLetter) return "A";
  const code = lastLetter.toUpperCase().charCodeAt(0);
  if (code >= 90) return "AA"; // Z → AA (simple edge-case)
  return String.fromCharCode(code + 1);
}

function addWeeks(date: Date, weeks: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

function toInputDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

// ─── Programme Wizard ─────────────────────────────────────────────────────────

export function ProgrammeWizard({ onClose, onCreated }: ProgrammeWizardProps) {
  const [step, setStep] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [projects, setProjects] = React.useState<Project[]>([]);

  // Step 1 — Revision
  const [revisionLetter, setRevisionLetter] = React.useState("A");
  const [projectId, setProjectId] = React.useState("");
  const [submissionDate, setSubmissionDate] = React.useState(toInputDate(new Date()));
  const [dueDate, setDueDate] = React.useState(toInputDate(addWeeks(new Date(), 8)));
  const [file, setFile] = React.useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = React.useState<number>(0);

  // Step 2 — Baseline
  const [isRevisedBaseline, setIsRevisedBaseline] = React.useState(false);
  const [terminalFloat, setTerminalFloat] = React.useState<string>("");
  const [totalFloat, setTotalFloat] = React.useState<string>("");

  // Step 3 — Notify
  const [notifyPM, setNotifyPM] = React.useState(false);

  // Load projects and last submitted revision letter
  React.useEffect(() => {
    async function init() {
      try {
        const supabase = createClient();
        const workspaceId = await getWorkspaceId(supabase);

        const [{ data: proj }, { data: lastProg }] = await Promise.all([
          supabase.from("projects").select("id, name").eq("workspace_id", workspaceId).order("name"),
          supabase
            .from("programme_notifications")
            .select("revision_letter")
            .eq("workspace_id", workspaceId)
            .order("submission_date", { ascending: false })
            .limit(1),
        ]);

        if (proj) setProjects(proj as Project[]);

        const last = (lastProg as Array<{ revision_letter: string }> | null)?.[0]?.revision_letter ?? null;
        setRevisionLetter(nextRevisionLetter(last));
      } catch {
        // silently ignore
      }
    }
    void init();
  }, []);

  // When submission date changes, auto-update due date to +8 weeks
  React.useEffect(() => {
    if (submissionDate) {
      setDueDate(toInputDate(addWeeks(new Date(submissionDate), 8)));
    }
  }, [submissionDate]);

  const formData = React.useMemo(() => ({
    revisionLetter, projectId, submissionDate, dueDate,
    isRevisedBaseline, terminalFloat, totalFloat, notifyPM,
  }), [revisionLetter, projectId, submissionDate, dueDate, isRevisedBaseline, terminalFloat, totalFloat, notifyPM]);

  function handleDraftResume(resumeStep: number, data: Record<string, unknown>) {
    setStep(resumeStep);
    if (data.revisionLetter) setRevisionLetter(data.revisionLetter as string);
    if (data.projectId) setProjectId(data.projectId as string);
    if (data.submissionDate) setSubmissionDate(data.submissionDate as string);
    if (data.dueDate) setDueDate(data.dueDate as string);
    if (data.isRevisedBaseline !== undefined) setIsRevisedBaseline(data.isRevisedBaseline as boolean);
    if (data.terminalFloat) setTerminalFloat(data.terminalFloat as string);
    if (data.totalFloat) setTotalFloat(data.totalFloat as string);
    if (data.notifyPM !== undefined) setNotifyPM(data.notifyPM as boolean);
  }

  async function handleNext(): Promise<boolean> {
    if (step === 0) {
      if (!revisionLetter.trim() || !submissionDate) return false;
      return true;
    }
    if (step === 1) {
      return true;
    }

    // Step 2 → Submit
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const workspaceId = await getWorkspaceId(supabase);

      // Upload file if provided
      let fileUrl: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop() ?? "bin";
        const path = `programmes/${workspaceId}/${Date.now()}.${ext}`;
        const { url } = await uploadFile(supabase, {
          bucket: "project-media",
          path,
          file,
          onProgress: setUploadProgress,
        });
        fileUrl = url;
      }

      const { data: newProg, error } = await supabase
        .from("programme_notifications")
        .insert({
          workspace_id: workspaceId,
          project_id: projectId || null,
          revision_letter: revisionLetter.trim().toUpperCase(),
          submission_date: submissionDate,
          due_date: dueDate,
          file_url: fileUrl,
          is_revised_baseline: isRevisedBaseline,
          terminal_float_days: terminalFloat ? parseInt(terminalFloat, 10) : null,
          total_float_days: totalFloat ? parseInt(totalFloat, 10) : null,
          pm_response: "awaiting",
          created_by: user.id,
        })
        .select("id")
        .single();

      if (error) throw error;

      await createAuditEvent(supabase, {
        workspace_id: workspaceId,
        user_id: user.id,
        action: "programme_submitted",
        resource_type: "programme_notification",
        resource_id: newProg?.id ?? "",
        new_values: {
          revision_letter: revisionLetter,
          submission_date: submissionDate,
          due_date: dueDate,
          is_revised_baseline: isRevisedBaseline,
        },
      });

      if (notifyPM) {
        try {
          await supabase.from("notifications").insert({
            workspace_id: workspaceId,
            recipient_user_id: user.id,
            title: `Programme Rev ${revisionLetter} submitted`,
            body: `Submitted on ${submissionDate}. Due: ${dueDate}. Awaiting PM response.`,
            type: "programme_notification",
            resource_type: "programme_notification",
            resource_id: newProg?.id ?? "",
          });
        } catch {
          // silently ignore
        }
      }

      setShowSuccess(true);
      onCreated?.();
      return true;
    } catch {
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  const rightPanel = (
    <div>
      <SummarySection title="Revision">
        <SummaryRow label="Revision Letter" value={revisionLetter} />
        <SummaryRow label="Submission Date" value={submissionDate} />
        <SummaryRow label="Due Date" value={dueDate} />
        <SummaryRow label="File" value={file?.name} />
      </SummarySection>
      <SummarySection title="Baseline">
        <SummaryRow label="Revised Baseline?" value={isRevisedBaseline ? "Yes" : "No"} />
        <SummaryRow label="Terminal Float" value={terminalFloat ? `${terminalFloat} days` : undefined} />
        <SummaryRow label="Total Float" value={totalFloat ? `${totalFloat} days` : undefined} />
      </SummarySection>
    </div>
  );

  return (
    <WizardShell
      title="Submit Programme"
      subtitle="Clause 32 NEC4 Programme Notification"
      steps={WIZARD_STEPS}
      currentStep={step}
      onStepChange={setStep}
      onClose={onClose}
      onNext={handleNext}
      isLastStep={step === 2}
      isSubmitting={isSubmitting}
      showSuccess={showSuccess}
      rightPanel={rightPanel}
      wizardId="programme-wizard"
      formData={formData}
      onDraftResume={handleDraftResume}
      successContent={
        <div className="flex flex-col items-center gap-3">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
          <h3 className="text-[17px] font-700" style={{ color: "var(--text-primary)" }}>
            Programme Submitted
          </h3>
          <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
            Revision {revisionLetter} submitted on {submissionDate}. Due date: {dueDate}.
          </p>
          <button type="button" onClick={onClose} className="btn btn-primary btn-sm mt-2">
            Close
          </button>
        </div>
      }
    >
      {/* ── Step 0: Revision ── */}
      {step === 0 && (
        <div className="flex flex-col gap-5">
          <h3 className="text-[14px] font-700" style={{ color: "var(--text-primary)" }}>Revision Details</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="form-label">Revision Letter <span className="text-red-500">*</span></label>
              <input
                className="form-input uppercase"
                value={revisionLetter}
                onChange={e => setRevisionLetter(e.target.value)}
                maxLength={3}
                placeholder="A"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="form-label">Project</label>
              <select className="form-input" value={projectId} onChange={e => setProjectId(e.target.value)}>
                <option value="">— Select project —</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="form-label">Submission Date <span className="text-red-500">*</span></label>
              <input
                className="form-input"
                type="date"
                value={submissionDate}
                onChange={e => setSubmissionDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="form-label">Due Date (auto: +8 weeks)</label>
              <input
                className="form-input"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="form-label">Programme File</label>
            <label
              className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed cursor-pointer py-8 transition-colors"
              style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}
            >
              <Upload className="w-6 h-6" style={{ color: "var(--text-muted)" }} />
              <span className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                {file ? file.name : "Click to upload or drag & drop"}
              </span>
              <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                XER, MPP, PDF, P6 — max 50 MB
              </span>
              <input
                type="file"
                className="sr-only"
                accept=".xer,.mpp,.pdf,.p6,.xml,.xlsx"
                onChange={e => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${uploadProgress}%`, background: "var(--primary)" }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Step 1: Baseline ── */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <h3 className="text-[14px] font-700" style={{ color: "var(--text-primary)" }}>Baseline & Float Analysis</h3>

          <label className="flex items-center gap-3 cursor-pointer select-none rounded-xl p-4" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
            <input
              type="checkbox"
              className="form-checkbox"
              checked={isRevisedBaseline}
              onChange={e => setIsRevisedBaseline(e.target.checked)}
            />
            <div>
              <span className="text-[13px] font-600" style={{ color: "var(--text-primary)" }}>
                This is a revised baseline programme
              </span>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                Tick if this submission represents a new accepted baseline rather than a progress update.
              </p>
            </div>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="form-label">Terminal Float (days)</label>
              <input
                className="form-input"
                type="number"
                min={0}
                value={terminalFloat}
                onChange={e => setTerminalFloat(e.target.value)}
                placeholder="0"
              />
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Float between last activity and completion date
              </p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="form-label">Total Float Remaining (days)</label>
              <input
                className="form-input"
                type="number"
                min={0}
                value={totalFloat}
                onChange={e => setTotalFloat(e.target.value)}
                placeholder="0"
              />
              <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                Total project float across critical path
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Notify ── */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          <h3 className="text-[14px] font-700" style={{ color: "var(--text-primary)" }}>Review & Notify</h3>

          <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
            <p className="text-[12px] font-700" style={{ color: "var(--text-secondary)" }}>Submission Summary</p>
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <span style={{ color: "var(--text-muted)" }}>Revision Letter:</span>
              <span className="font-600" style={{ color: "var(--text-primary)" }}>{revisionLetter.toUpperCase()}</span>
              <span style={{ color: "var(--text-muted)" }}>Submission Date:</span>
              <span className="font-600" style={{ color: "var(--text-primary)" }}>{submissionDate}</span>
              <span style={{ color: "var(--text-muted)" }}>PM Response Due:</span>
              <span className="font-600" style={{ color: "var(--text-primary)" }}>{dueDate}</span>
              <span style={{ color: "var(--text-muted)" }}>Revised Baseline:</span>
              <span className="font-600" style={{ color: "var(--text-primary)" }}>{isRevisedBaseline ? "Yes" : "No"}</span>
              {terminalFloat && (
                <>
                  <span style={{ color: "var(--text-muted)" }}>Terminal Float:</span>
                  <span className="font-600" style={{ color: "var(--text-primary)" }}>{terminalFloat} days</span>
                </>
              )}
              {totalFloat && (
                <>
                  <span style={{ color: "var(--text-muted)" }}>Total Float:</span>
                  <span className="font-600" style={{ color: "var(--text-primary)" }}>{totalFloat} days</span>
                </>
              )}
              {file && (
                <>
                  <span style={{ color: "var(--text-muted)" }}>File:</span>
                  <span className="font-600 truncate" style={{ color: "var(--text-primary)" }}>{file.name}</span>
                </>
              )}
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              className="form-checkbox"
              checked={notifyPM}
              onChange={e => setNotifyPM(e.target.checked)}
            />
            <span className="text-[13px]" style={{ color: "var(--text-primary)" }}>
              Notify PM of this programme submission
            </span>
          </label>
        </div>
      )}
    </WizardShell>
  );
}

export default ProgrammeWizard;

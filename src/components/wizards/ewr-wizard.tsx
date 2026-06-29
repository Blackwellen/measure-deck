"use client";

import { WizardShell, SummaryRow, SummarySection } from "@/components/wizards/wizard-shell";
import { createAuditEvent } from "@/lib/audit";
import { getWorkspaceId } from "@/lib/workspace";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2 } from "lucide-react";
import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
}

interface EWRWizardProps {
  onClose: () => void;
  onCreated?: () => void;
  /** Pre-selected project id (e.g. from project detail page) */
  initialProjectId?: string;
}

type EWCategory = "cost" | "time" | "quality" | "safety" | "environmental" | "other";

const LIKELIHOOD_LABELS: Record<number, string> = {
  1: "Remote",
  2: "Unlikely",
  3: "Possible",
  4: "Likely",
  5: "Almost Certain",
};

const IMPACT_LABELS: Record<number, string> = {
  1: "Negligible",
  2: "Minor",
  3: "Moderate",
  4: "Major",
  5: "Catastrophic",
};

function riskColourClass(score: number): string {
  if (score >= 15) return "text-red-700 bg-red-100";
  if (score >= 10) return "text-red-600 bg-red-50";
  if (score >= 5) return "text-amber-700 bg-amber-50";
  return "text-green-700 bg-green-50";
}

function riskLabel(score: number): string {
  if (score >= 15) return "Critical";
  if (score >= 10) return "High";
  if (score >= 5) return "Medium";
  return "Low";
}

const WIZARD_STEPS = [
  { id: "risk-details", label: "Risk Details" },
  { id: "impact", label: "Impact Assessment" },
  { id: "notify", label: "Notify & Assign" },
];

// ─── EWR Wizard ───────────────────────────────────────────────────────────────

export function EWRWizard({ onClose, onCreated, initialProjectId }: EWRWizardProps) {
  const [step, setStep] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [projects, setProjects] = React.useState<Project[]>([]);

  // Step 1 fields
  const [ewNumber, setEwNumber] = React.useState("EW-001");
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [projectId, setProjectId] = React.useState(initialProjectId ?? "");
  const [category, setCategory] = React.useState<EWCategory>("cost");

  // Step 2 fields
  const [costImpact, setCostImpact] = React.useState<string>("");
  const [programmeImpactDays, setProgrammeImpactDays] = React.useState<string>("");
  const [likelihood, setLikelihood] = React.useState(3);
  const [impact, setImpact] = React.useState(3);
  const [riskOwner, setRiskOwner] = React.useState("");

  // Step 3 fields
  const [mitigationActions, setMitigationActions] = React.useState("");
  const [notifyPM, setNotifyPM] = React.useState(false);

  const riskScore = likelihood * impact;

  // Load projects + auto-generate EW number
  React.useEffect(() => {
    async function init() {
      try {
        const supabase = createClient();
        const workspaceId = await getWorkspaceId(supabase);

        const [{ data: proj }, { count }] = await Promise.all([
          supabase.from("projects").select("id, name").eq("workspace_id", workspaceId).order("name"),
          supabase.from("early_warnings").select("id", { count: "exact", head: true }).eq("workspace_id", workspaceId),
        ]);

        if (proj) setProjects(proj as Project[]);
        const next = (count ?? 0) + 1;
        setEwNumber("EW-" + String(next).padStart(3, "0"));
      } catch {
        // silently ignore — user can edit EW number manually
      }
    }
    void init();
  }, []);

  const formData = React.useMemo(() => ({
    ewNumber, title, description, projectId, category,
    costImpact, programmeImpactDays, likelihood, impact, riskOwner,
    mitigationActions, notifyPM,
  }), [ewNumber, title, description, projectId, category, costImpact, programmeImpactDays, likelihood, impact, riskOwner, mitigationActions, notifyPM]);

  function handleDraftResume(resumeStep: number, data: Record<string, unknown>) {
    setStep(resumeStep);
    if (data.ewNumber) setEwNumber(data.ewNumber as string);
    if (data.title) setTitle(data.title as string);
    if (data.description) setDescription(data.description as string);
    if (data.projectId) setProjectId(data.projectId as string);
    if (data.category) setCategory(data.category as EWCategory);
    if (data.costImpact) setCostImpact(data.costImpact as string);
    if (data.programmeImpactDays) setProgrammeImpactDays(data.programmeImpactDays as string);
    if (data.likelihood) setLikelihood(data.likelihood as number);
    if (data.impact) setImpact(data.impact as number);
    if (data.riskOwner) setRiskOwner(data.riskOwner as string);
    if (data.mitigationActions) setMitigationActions(data.mitigationActions as string);
    if (data.notifyPM !== undefined) setNotifyPM(data.notifyPM as boolean);
  }

  async function handleNext(): Promise<boolean> {
    if (step === 0) {
      if (!title.trim()) return false;
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

      const { data: newEW, error } = await supabase
        .from("early_warnings")
        .insert({
          workspace_id: workspaceId,
          project_id: projectId || null,
          ew_number: ewNumber,
          title: title.trim(),
          description: description.trim() || null,
          category,
          risk_owner: riskOwner.trim() || null,
          cost_impact: costImpact ? parseFloat(costImpact) : null,
          programme_impact_days: programmeImpactDays ? parseInt(programmeImpactDays, 10) : null,
          likelihood,
          impact,
          status: "open",
          mitigation_actions: mitigationActions ? [{ text: mitigationActions, owner: riskOwner, status: "open" }] : [],
          created_by: user.id,
        })
        .select("id")
        .single();

      if (error) throw error;

      await createAuditEvent(supabase, {
        workspace_id: workspaceId,
        user_id: user.id,
        action: "early_warning_created",
        resource_type: "early_warning",
        resource_id: newEW?.id ?? "",
        new_values: { title: title.trim(), ew_number: ewNumber, risk_score: riskScore },
      });

      if (notifyPM) {
        // Notification is best-effort; silently ignore errors
        try {
          await supabase.from("notifications").insert({
            workspace_id: workspaceId,
            recipient_user_id: user.id,
            title: `Early Warning raised: ${ewNumber}`,
            body: `${title} — Risk score: ${riskScore}`,
            type: "early_warning",
            resource_type: "early_warning",
            resource_id: newEW?.id ?? "",
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
      <SummarySection title="Risk Details">
        <SummaryRow label="EW Number" value={ewNumber} />
        <SummaryRow label="Title" value={title || "—"} />
        <SummaryRow label="Category" value={category} />
      </SummarySection>
      <SummarySection title="Impact">
        <SummaryRow label="Likelihood" value={`${likelihood} — ${LIKELIHOOD_LABELS[likelihood]}`} />
        <SummaryRow label="Impact" value={`${impact} — ${IMPACT_LABELS[impact]}`} />
        <SummaryRow label="Cost Impact" value={costImpact ? `£${parseFloat(costImpact).toLocaleString()}` : undefined} />
        <SummaryRow label="Programme Impact" value={programmeImpactDays ? `${programmeImpactDays} days` : undefined} />
      </SummarySection>
      {riskScore > 0 && (
        <div className={cn("rounded-xl px-4 py-3 text-center", riskColourClass(riskScore))}>
          <p className="text-[11px] font-700 uppercase tracking-[0.06em] mb-0.5">Risk Score</p>
          <p className="text-3xl font-800">{riskScore}</p>
          <p className="text-[12px] font-600">{riskLabel(riskScore)}</p>
        </div>
      )}
    </div>
  );

  return (
    <WizardShell
      title="New Early Warning"
      subtitle="Register a risk under NEC4 Clause 15"
      steps={WIZARD_STEPS}
      currentStep={step}
      onStepChange={setStep}
      onClose={onClose}
      onNext={handleNext}
      isLastStep={step === 2}
      isSubmitting={isSubmitting}
      showSuccess={showSuccess}
      rightPanel={rightPanel}
      wizardId="ewr-wizard"
      formData={formData}
      onDraftResume={handleDraftResume}
      successContent={
        <div className="flex flex-col items-center gap-3">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
          <h3 className="text-[17px] font-700" style={{ color: "var(--text-primary)" }}>
            Early Warning Registered
          </h3>
          <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
            {ewNumber} — {title} has been created with a risk score of {riskScore}.
          </p>
          <button type="button" onClick={onClose} className="btn btn-primary btn-sm mt-2">
            Close
          </button>
        </div>
      }
    >
      {/* ── Step 0: Risk Details ── */}
      {step === 0 && (
        <div className="flex flex-col gap-5">
          <h3 className="text-[14px] font-700" style={{ color: "var(--text-primary)" }}>Risk Details</h3>

          <div className="flex flex-col gap-1.5">
            <label className="form-label">EW Number</label>
            <input
              className="form-input"
              value={ewNumber}
              onChange={e => setEwNumber(e.target.value)}
              placeholder="EW-001"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="form-label">Title <span className="text-red-500">*</span></label>
            <input
              className="form-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Brief description of the risk…"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="form-label">Description</label>
            <textarea
              className="form-input min-h-[80px] resize-y"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detailed description of the early warning…"
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

          <div className="flex flex-col gap-1.5">
            <label className="form-label">Category</label>
            <select className="form-input" value={category} onChange={e => setCategory(e.target.value as EWCategory)}>
              <option value="cost">Cost</option>
              <option value="time">Time</option>
              <option value="quality">Quality</option>
              <option value="safety">Safety</option>
              <option value="environmental">Environmental</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      )}

      {/* ── Step 1: Impact Assessment ── */}
      {step === 1 && (
        <div className="flex flex-col gap-5">
          <h3 className="text-[14px] font-700" style={{ color: "var(--text-primary)" }}>Impact Assessment</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="form-label">Cost Impact (£)</label>
              <input
                className="form-input"
                type="number"
                min={0}
                step={100}
                value={costImpact}
                onChange={e => setCostImpact(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="form-label">Programme Impact (days)</label>
              <input
                className="form-input"
                type="number"
                min={0}
                step={1}
                value={programmeImpactDays}
                onChange={e => setProgrammeImpactDays(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Likelihood slider */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="form-label mb-0">Likelihood</label>
              <span className="text-[12px] font-600" style={{ color: "var(--text-secondary)" }}>
                {likelihood} — {LIKELIHOOD_LABELS[likelihood]}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={likelihood}
              onChange={e => setLikelihood(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[10px]" style={{ color: "var(--text-muted)" }}>
              <span>1 Remote</span>
              <span>3 Possible</span>
              <span>5 Almost Certain</span>
            </div>
          </div>

          {/* Impact slider */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="form-label mb-0">Impact</label>
              <span className="text-[12px] font-600" style={{ color: "var(--text-secondary)" }}>
                {impact} — {IMPACT_LABELS[impact]}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={impact}
              onChange={e => setImpact(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-[10px]" style={{ color: "var(--text-muted)" }}>
              <span>1 Negligible</span>
              <span>3 Moderate</span>
              <span>5 Catastrophic</span>
            </div>
          </div>

          {/* Risk score display */}
          <div className={cn("rounded-xl px-4 py-4 text-center", riskColourClass(riskScore))}>
            <p className="text-[11px] font-700 uppercase tracking-[0.06em] mb-1">Calculated Risk Score</p>
            <p className="text-4xl font-800">{riskScore}</p>
            <p className="text-[13px] font-600 mt-1">{riskLabel(riskScore)}</p>
            <p className="text-[11px] mt-0.5 opacity-70">{likelihood} likelihood × {impact} impact</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="form-label">Risk Owner</label>
            <input
              className="form-input"
              value={riskOwner}
              onChange={e => setRiskOwner(e.target.value)}
              placeholder="Name of person responsible for managing this risk…"
            />
          </div>
        </div>
      )}

      {/* ── Step 2: Notify & Assign ── */}
      {step === 2 && (
        <div className="flex flex-col gap-5">
          <h3 className="text-[14px] font-700" style={{ color: "var(--text-primary)" }}>Notify & Assign</h3>

          <div className="flex flex-col gap-1.5">
            <label className="form-label">Mitigation Actions</label>
            <textarea
              className="form-input min-h-[120px] resize-y"
              value={mitigationActions}
              onChange={e => setMitigationActions(e.target.value)}
              placeholder="Describe the mitigation actions to reduce or eliminate this risk…"
            />
          </div>

          <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
            <p className="text-[12px] font-700" style={{ color: "var(--text-secondary)" }}>Summary</p>
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              <span style={{ color: "var(--text-muted)" }}>EW Number:</span>
              <span className="font-600" style={{ color: "var(--text-primary)" }}>{ewNumber}</span>
              <span style={{ color: "var(--text-muted)" }}>Risk Score:</span>
              <span className={cn("font-700 rounded px-1.5 py-0.5 inline-block text-[11px]", riskColourClass(riskScore))}>
                {riskScore} — {riskLabel(riskScore)}
              </span>
              <span style={{ color: "var(--text-muted)" }}>Category:</span>
              <span className="font-600 capitalize" style={{ color: "var(--text-primary)" }}>{category}</span>
              {costImpact && (
                <>
                  <span style={{ color: "var(--text-muted)" }}>Cost Risk:</span>
                  <span className="font-600" style={{ color: "var(--text-primary)" }}>£{parseFloat(costImpact).toLocaleString()}</span>
                </>
              )}
              {programmeImpactDays && (
                <>
                  <span style={{ color: "var(--text-muted)" }}>Programme Risk:</span>
                  <span className="font-600" style={{ color: "var(--text-primary)" }}>{programmeImpactDays} days</span>
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
              Notify PM about this early warning
            </span>
          </label>
        </div>
      )}
    </WizardShell>
  );
}

export default EWRWizard;

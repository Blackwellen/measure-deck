"use client";

import { createClient } from "@/lib/supabase/client";
import { generateRef } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { SummaryRow, SummarySection, WizardShell } from "./wizard-shell";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const step1Schema = z.object({
  title: z.string().min(2, "Title is required"),
  reference: z.string().optional(),
  project_id: z.string().min(1, "Project is required"),
  change_type: z.string().min(1, "Type is required"),
  description: z.string().optional(),
  date_issued: z.string().min(1, "Date issued is required"),
  status: z.string().default("draft"),
});

const step2Schema = z.object({
  contract_sum_impact: z.coerce.number().default(0),
  programme_impact_days: z.coerce.number().default(0),
  cost_basis: z.string().optional(),
  labour_cost: z.coerce.number().default(0),
  materials_cost: z.coerce.number().default(0),
  plant_cost: z.coerce.number().default(0),
  overhead_percent: z.coerce.number().min(0).max(100).default(15),
  profit_percent: z.coerce.number().min(0).max(100).default(10),
});

const step3Schema = z.object({
  evidence_notes: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

// ─── Constants ────────────────────────────────────────────────────────────────

const CHANGE_TYPES = [
  "Employer Variation",
  "Site Condition",
  "Design Change",
  "Omission",
  "Provisional Sum Instruction",
  "Statutory Requirement",
  "Acceleration",
  "Other",
];

const STATUS_OPTIONS = ["draft", "submitted", "under_review", "agreed", "disputed", "withdrawn"];

const STEPS = [
  { id: "details", label: "Details" },
  { id: "valuation", label: "Valuation" },
  { id: "evidence", label: "Evidence" },
  { id: "review", label: "Review" },
];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[12px] mt-1" style={{ color: "var(--danger)" }}>{message}</p>;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ChangeWizardProps {
  projectId?: string;
  onClose?: () => void;
  onSuccess?: (id: string) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ChangeWizard({ projectId, onClose, onSuccess }: ChangeWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { project_id: projectId ?? "", date_issued: new Date().toISOString().split("T")[0], status: "draft" },
  });
  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { contract_sum_impact: 0, programme_impact_days: 0, overhead_percent: 15, profit_percent: 10 },
  });
  const form3 = useForm<Step3Data>({ resolver: zodResolver(step3Schema) });

  const v1 = form1.watch();
  const v2 = form2.watch();

  const subTotal = (v2.labour_cost ?? 0) + (v2.materials_cost ?? 0) + (v2.plant_cost ?? 0);
  const overhead = subTotal * ((v2.overhead_percent ?? 0) / 100);
  const profit = (subTotal + overhead) * ((v2.profit_percent ?? 0) / 100);
  const totalValuation = subTotal + overhead + profit;

  const handleNext = async (): Promise<boolean> => {
    if (currentStep === 0) return form1.trigger();
    if (currentStep === 1) return form2.trigger();
    if (currentStep === 2) return true;
    if (currentStep === 3) { await handleSubmit(); return false; }
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const ref = v1.reference || generateRef("CE");

      const { data: ce, error: ceError } = await supabase
        .from("change_events")
        .insert({
          project_id: v1.project_id,
          title: v1.title,
          reference: ref,
          change_type: v1.change_type,
          description: v1.description || null,
          date_issued: v1.date_issued,
          status: v1.status,
          programme_impact_days: v2.programme_impact_days || 0,
          evidence_notes: form3.getValues("evidence_notes") || null,
          created_by: user?.id ?? null,
        })
        .select("id")
        .single();

      if (ceError) throw ceError;

      await supabase.from("change_event_pricing").insert({
        change_event_id: ce.id,
        project_id: v1.project_id,
        labour_cost: v2.labour_cost || 0,
        materials_cost: v2.materials_cost || 0,
        plant_cost: v2.plant_cost || 0,
        overhead_percent: v2.overhead_percent || 0,
        profit_percent: v2.profit_percent || 0,
        total_valuation: totalValuation,
        contract_sum_impact: v2.contract_sum_impact || totalValuation,
      });

      setCreatedId(ce.id);
      setShowSuccess(true);
      toast.success("Change event created");
      onSuccess?.(ce.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create change event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const rightPanel = (
    <div>
      {v1.title && (
        <SummarySection title="Change Details">
          <SummaryRow label="Title" value={v1.title} />
          <SummaryRow label="Reference" value={v1.reference} />
          <SummaryRow label="Type" value={v1.change_type} />
          <SummaryRow label="Status" value={v1.status} />
        </SummarySection>
      )}
      {totalValuation > 0 && (
        <SummarySection title="Valuation">
          <SummaryRow label="Labour" value={`£${(v2.labour_cost || 0).toLocaleString()}`} />
          <SummaryRow label="Materials" value={`£${(v2.materials_cost || 0).toLocaleString()}`} />
          <SummaryRow label="Plant" value={`£${(v2.plant_cost || 0).toLocaleString()}`} />
          <SummaryRow label="Overhead" value={`${v2.overhead_percent}%`} />
          <SummaryRow label="Profit" value={`${v2.profit_percent}%`} />
          <SummaryRow label="Total" value={`£${totalValuation.toLocaleString()}`} />
        </SummarySection>
      )}
    </div>
  );

  const successContent = (
    <>
      <div>
        <h3 className="text-[20px] font-700" style={{ color: "var(--text-primary)" }}>Change Event Created!</h3>
        <p className="text-[14px] mt-1" style={{ color: "var(--text-secondary)" }}>
          <strong>{v1.title}</strong> has been logged.
        </p>
      </div>
      <div className="flex gap-3">
        <button type="button" className="btn btn-primary" onClick={() => { if (createdId) router.push(`/app/changes/${createdId}`); onClose?.(); }}>
          View Change Event
        </button>
        {onClose && <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>}
      </div>
    </>
  );

  return (
    <WizardShell
      steps={STEPS}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      title="Log Change Event"
      subtitle="Record a contract variation or change instruction"
      rightPanel={rightPanel}
      onClose={onClose}
      isLastStep={currentStep === 3}
      nextLabel={currentStep === 3 ? "Create Change Event" : undefined}
      isSubmitting={isSubmitting}
      onNext={handleNext}
      showSuccess={showSuccess}
      successContent={successContent}
    >
      {/* Step 0: Details */}
      {currentStep === 0 && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Change Details</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Describe the change event.</p>
          </div>
          <div>
            <label className="form-label">Title <span style={{ color: "var(--danger)" }}>*</span></label>
            <input {...form1.register("title")} className="form-input" placeholder="e.g. Ground conditions variation" />
            <FieldError message={form1.formState.errors.title?.message} />
          </div>
          <div>
            <label className="form-label">Reference</label>
            <input {...form1.register("reference")} className="form-input" placeholder="Auto-generated if blank" />
          </div>
          {!projectId && (
            <div>
              <label className="form-label">Project ID <span style={{ color: "var(--danger)" }}>*</span></label>
              <input {...form1.register("project_id")} className="form-input" placeholder="Project UUID" />
              <FieldError message={form1.formState.errors.project_id?.message} />
            </div>
          )}
          <div>
            <label className="form-label">Change Type <span style={{ color: "var(--danger)" }}>*</span></label>
            <select {...form1.register("change_type")} className="form-input">
              <option value="">Select type…</option>
              {CHANGE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <FieldError message={form1.formState.errors.change_type?.message} />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select {...form1.register("status")} className="form-input">
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Date Issued <span style={{ color: "var(--danger)" }}>*</span></label>
            <input {...form1.register("date_issued")} type="date" className="form-input" />
            <FieldError message={form1.formState.errors.date_issued?.message} />
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea {...form1.register("description")} rows={3} className="form-input" placeholder="Describe the change in detail…" />
          </div>
        </div>
      )}

      {/* Step 1: Valuation */}
      {currentStep === 1 && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Valuation</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Break down the cost impact.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Labour (£)</label>
              <input {...form2.register("labour_cost")} type="number" className="form-input" placeholder="0" />
            </div>
            <div>
              <label className="form-label">Materials (£)</label>
              <input {...form2.register("materials_cost")} type="number" className="form-input" placeholder="0" />
            </div>
            <div>
              <label className="form-label">Plant (£)</label>
              <input {...form2.register("plant_cost")} type="number" className="form-input" placeholder="0" />
            </div>
            <div>
              <label className="form-label">Programme Impact (days)</label>
              <input {...form2.register("programme_impact_days")} type="number" className="form-input" placeholder="0" />
            </div>
            <div>
              <label className="form-label">Overhead (%)</label>
              <input {...form2.register("overhead_percent")} type="number" className="form-input" min="0" max="100" step="0.5" />
            </div>
            <div>
              <label className="form-label">Profit (%)</label>
              <input {...form2.register("profit_percent")} type="number" className="form-input" min="0" max="100" step="0.5" />
            </div>
          </div>
          <div className="rounded-xl p-4" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
            <p className="text-[12px] font-600 mb-2" style={{ color: "var(--text-muted)" }}>Calculated Total</p>
            <p className="text-[24px] font-700" style={{ color: "var(--text-primary)" }}>
              £{totalValuation.toLocaleString("en-GB", { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      )}

      {/* Step 2: Evidence */}
      {currentStep === 2 && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Evidence Notes</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Note any supporting evidence (attach files after creation).</p>
          </div>
          <div>
            <label className="form-label">Evidence Notes</label>
            <textarea {...form3.register("evidence_notes")} rows={5} className="form-input"
              placeholder="List supporting documents, photos, correspondence references…" />
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {currentStep === 3 && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Review & Submit</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Confirm all details before creating the change event.</p>
          </div>
          <SummarySection title="Change Details">
            <SummaryRow label="Title" value={v1.title} />
            <SummaryRow label="Type" value={v1.change_type} />
            <SummaryRow label="Date Issued" value={v1.date_issued} />
            <SummaryRow label="Status" value={v1.status} />
          </SummarySection>
          <SummarySection title="Valuation">
            <SummaryRow label="Labour" value={`£${(v2.labour_cost || 0).toLocaleString()}`} />
            <SummaryRow label="Materials" value={`£${(v2.materials_cost || 0).toLocaleString()}`} />
            <SummaryRow label="Plant" value={`£${(v2.plant_cost || 0).toLocaleString()}`} />
            <SummaryRow label="Total" value={`£${totalValuation.toLocaleString()}`} />
            <SummaryRow label="Programme Impact" value={`${v2.programme_impact_days || 0} days`} />
          </SummarySection>
          <div className="rounded-[var(--radius)] p-4 flex gap-3"
            style={{ background: "var(--info-bg)", border: "1px solid var(--info)" }}>
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--info)" }} />
            <p className="text-[13px]" style={{ color: "var(--info-text)" }}>
              This will create the change event and pricing record. Evidence files can be uploaded afterwards.
            </p>
          </div>
        </div>
      )}
    </WizardShell>
  );
}

export default ChangeWizard;

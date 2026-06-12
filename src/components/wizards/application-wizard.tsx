"use client";

import { createClient } from "@/lib/supabase/client";
import { formatCurrency, generateRef } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { SummaryRow, SummarySection, WizardShell } from "./wizard-shell";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const step1Schema = z.object({
  project_id: z.string().min(1, "Project is required"),
  application_number: z.coerce.number().min(1, "Application number is required"),
  period_from: z.string().min(1, "Period from is required"),
  period_to: z.string().min(1, "Period to is required"),
  submission_date: z.string().min(1, "Submission date is required"),
  due_date: z.string().optional(),
  status: z.string().default("draft"),
  notes: z.string().optional(),
});

const lineSchema = z.object({
  description: z.string().min(1, "Description required"),
  contract_value: z.coerce.number().min(0),
  percent_complete: z.coerce.number().min(0).max(100),
  previous_certified: z.coerce.number().min(0).default(0),
});

const step2Schema = z.object({
  lines: z.array(lineSchema).min(1, "At least one line item is required"),
});

const variationSchema = z.object({
  reference: z.string().optional(),
  description: z.string().min(1, "Description required"),
  claimed_amount: z.coerce.number().min(0),
});

const step3Schema = z.object({
  variations: z.array(variationSchema),
});

const step4Schema = z.object({
  retention_percent: z.coerce.number().min(0).max(100).default(5),
  previous_retention_released: z.coerce.number().min(0).default(0),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;
type Step4Data = z.infer<typeof step4Schema>;

const STATUS_OPTIONS = ["draft", "submitted", "under_review", "certified", "disputed"];

const STEPS = [
  { id: "details", label: "Details" },
  { id: "lines", label: "Line Items" },
  { id: "variations", label: "Variations" },
  { id: "retention", label: "Retention" },
  { id: "review", label: "Review" },
];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[12px] mt-1" style={{ color: "var(--danger)" }}>{message}</p>;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ApplicationWizardProps {
  projectId?: string;
  onClose?: () => void;
  onSuccess?: (id: string) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ApplicationWizard({ projectId, onClose, onSuccess }: ApplicationWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      project_id: projectId ?? "",
      application_number: 1,
      submission_date: new Date().toISOString().split("T")[0],
      status: "draft",
    },
  });

  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      lines: [{ description: "", contract_value: 0, percent_complete: 0, previous_certified: 0 }],
    },
  });

  const form3 = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: { variations: [] },
  });

  const form4 = useForm<Step4Data>({
    resolver: zodResolver(step4Schema),
    defaultValues: { retention_percent: 5, previous_retention_released: 0 },
  });

  const {
    fields: lineFields,
    append: addLine,
    remove: removeLine,
  } = useFieldArray({ control: form2.control, name: "lines" });

  const {
    fields: varFields,
    append: addVar,
    remove: removeVar,
  } = useFieldArray({ control: form3.control, name: "variations" });

  const v1 = form1.watch();
  const v2 = form2.watch();
  const v3 = form3.watch();
  const v4 = form4.watch();

  // ── Calculations ──────────────────────────────────────────────────────────
  const linesTotal = (v2.lines ?? []).reduce((sum, l) => {
    const gross = (l.contract_value ?? 0) * ((l.percent_complete ?? 0) / 100);
    const prev = l.previous_certified ?? 0;
    return sum + Math.max(0, gross - prev);
  }, 0);

  const variationsTotal = (v3.variations ?? []).reduce((sum, v) => sum + (v.claimed_amount ?? 0), 0);

  const grossClaim = linesTotal + variationsTotal;
  const retention = grossClaim * ((v4.retention_percent ?? 0) / 100);
  const netClaim = grossClaim - retention + (v4.previous_retention_released ?? 0);

  const handleNext = async (): Promise<boolean> => {
    if (currentStep === 0) return form1.trigger();
    if (currentStep === 1) return form2.trigger();
    if (currentStep === 2) return true;
    if (currentStep === 3) return form4.trigger();
    if (currentStep === 4) { await handleSubmit(); return false; }
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const ref = generateRef("PA");

      const { data: app, error: appError } = await supabase
        .from("applications")
        .insert({
          project_id: v1.project_id,
          application_number: v1.application_number,
          reference: ref,
          period_from: v1.period_from,
          period_to: v1.period_to,
          submission_date: v1.submission_date,
          due_date: v1.due_date || null,
          status: v1.status,
          notes: v1.notes || null,
          gross_claimed: grossClaim,
          retention_amount: retention,
          net_claimed: netClaim,
          variations_total: variationsTotal,
          created_by: user?.id ?? null,
        })
        .select("id")
        .single();

      if (appError) throw appError;

      const lineInserts = v2.lines.map((l) => ({
        application_id: app.id,
        project_id: v1.project_id,
        description: l.description,
        contract_value: l.contract_value,
        percent_complete: l.percent_complete,
        previous_certified: l.previous_certified,
        this_period: (l.contract_value * (l.percent_complete / 100)) - l.previous_certified,
      }));

      await supabase.from("payment_application_lines").insert(lineInserts);

      setCreatedId(app.id);
      setShowSuccess(true);
      toast.success("Payment application created");
      onSuccess?.(app.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create application");
    } finally {
      setIsSubmitting(false);
    }
  };

  const rightPanel = (
    <div>
      {v1.application_number && (
        <SummarySection title="Application">
          <SummaryRow label="Number" value={`#${v1.application_number}`} />
          <SummaryRow label="Period" value={v1.period_from && v1.period_to ? `${v1.period_from} – ${v1.period_to}` : undefined} />
          <SummaryRow label="Status" value={v1.status} />
        </SummarySection>
      )}
      {grossClaim > 0 && (
        <SummarySection title="Amounts">
          <SummaryRow label="Lines Subtotal" value={formatCurrency(linesTotal)} />
          <SummaryRow label="Variations" value={formatCurrency(variationsTotal)} />
          <SummaryRow label="Gross Claim" value={formatCurrency(grossClaim)} />
          <SummaryRow label="Retention" value={`-${formatCurrency(retention)}`} />
          <SummaryRow label="Net Claim" value={formatCurrency(netClaim)} />
        </SummarySection>
      )}
    </div>
  );

  const successContent = (
    <>
      <div>
        <h3 className="text-[20px] font-700" style={{ color: "var(--text-primary)" }}>Application Created!</h3>
        <p className="text-[14px] mt-1" style={{ color: "var(--text-secondary)" }}>
          Payment Application #{v1.application_number} — net claim: <strong>{formatCurrency(netClaim)}</strong>
        </p>
      </div>
      <div className="flex gap-3">
        <button type="button" className="btn btn-primary" onClick={() => { if (createdId) router.push(`/app/applications/${createdId}`); onClose?.(); }}>
          View Application
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
      title="New Payment Application"
      subtitle="Submit a payment application for this period"
      rightPanel={rightPanel}
      onClose={onClose}
      isLastStep={currentStep === 4}
      nextLabel={currentStep === 4 ? "Submit Application" : undefined}
      isSubmitting={isSubmitting}
      onNext={handleNext}
      showSuccess={showSuccess}
      successContent={successContent}
    >
      {/* Step 0: Details */}
      {currentStep === 0 && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Application Details</h3>
          </div>
          {!projectId && (
            <div>
              <label className="form-label">Project ID <span style={{ color: "var(--danger)" }}>*</span></label>
              <input {...form1.register("project_id")} className="form-input" placeholder="Project UUID" />
              <FieldError message={form1.formState.errors.project_id?.message} />
            </div>
          )}
          <div>
            <label className="form-label">Application Number <span style={{ color: "var(--danger)" }}>*</span></label>
            <input {...form1.register("application_number")} type="number" className="form-input" min="1" />
            <FieldError message={form1.formState.errors.application_number?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Period From <span style={{ color: "var(--danger)" }}>*</span></label>
              <input {...form1.register("period_from")} type="date" className="form-input" />
              <FieldError message={form1.formState.errors.period_from?.message} />
            </div>
            <div>
              <label className="form-label">Period To <span style={{ color: "var(--danger)" }}>*</span></label>
              <input {...form1.register("period_to")} type="date" className="form-input" />
              <FieldError message={form1.formState.errors.period_to?.message} />
            </div>
            <div>
              <label className="form-label">Submission Date <span style={{ color: "var(--danger)" }}>*</span></label>
              <input {...form1.register("submission_date")} type="date" className="form-input" />
              <FieldError message={form1.formState.errors.submission_date?.message} />
            </div>
            <div>
              <label className="form-label">Due Date</label>
              <input {...form1.register("due_date")} type="date" className="form-input" />
            </div>
          </div>
          <div>
            <label className="form-label">Status</label>
            <select {...form1.register("status")} className="form-input">
              {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Notes</label>
            <textarea {...form1.register("notes")} rows={2} className="form-input" />
          </div>
        </div>
      )}

      {/* Step 1: Line Items */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Line Items</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Enter the schedule of works items and % complete.</p>
          </div>
          {lineFields.map((field, idx) => (
            <div key={field.id} className="rounded-xl border p-4 space-y-3"
              style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-600" style={{ color: "var(--text-muted)" }}>Item {idx + 1}</span>
                {lineFields.length > 1 && (
                  <button type="button" onClick={() => removeLine(idx)} className="btn btn-ghost btn-icon btn-sm">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div>
                <label className="form-label">Description <span style={{ color: "var(--danger)" }}>*</span></label>
                <input {...form2.register(`lines.${idx}.description`)} className="form-input" placeholder="Work description" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="form-label">Contract Value (£)</label>
                  <input {...form2.register(`lines.${idx}.contract_value`)} type="number" className="form-input" />
                </div>
                <div>
                  <label className="form-label">% Complete</label>
                  <input {...form2.register(`lines.${idx}.percent_complete`)} type="number" className="form-input" min="0" max="100" />
                </div>
                <div>
                  <label className="form-label">Prev. Certified (£)</label>
                  <input {...form2.register(`lines.${idx}.previous_certified`)} type="number" className="form-input" />
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => addLine({ description: "", contract_value: 0, percent_complete: 0, previous_certified: 0 })}
            className="btn btn-secondary btn-sm w-full">
            <Plus className="w-4 h-4" /> Add Line Item
          </button>
        </div>
      )}

      {/* Step 2: Variations */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Variations</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Add any variation claims to this application.</p>
          </div>
          {varFields.map((field, idx) => (
            <div key={field.id} className="rounded-xl border p-4 space-y-3"
              style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-600" style={{ color: "var(--text-muted)" }}>Variation {idx + 1}</span>
                <button type="button" onClick={() => removeVar(idx)} className="btn btn-ghost btn-icon btn-sm">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Reference</label>
                  <input {...form3.register(`variations.${idx}.reference`)} className="form-input" placeholder="CE-001" />
                </div>
                <div>
                  <label className="form-label">Claimed Amount (£)</label>
                  <input {...form3.register(`variations.${idx}.claimed_amount`)} type="number" className="form-input" />
                </div>
              </div>
              <div>
                <label className="form-label">Description <span style={{ color: "var(--danger)" }}>*</span></label>
                <input {...form3.register(`variations.${idx}.description`)} className="form-input" />
              </div>
            </div>
          ))}
          <button type="button" onClick={() => addVar({ reference: "", description: "", claimed_amount: 0 })}
            className="btn btn-secondary btn-sm w-full">
            <Plus className="w-4 h-4" /> Add Variation
          </button>
          {varFields.length === 0 && (
            <p className="text-center text-[13px] py-4" style={{ color: "var(--text-muted)" }}>
              No variations to claim — continue to next step.
            </p>
          )}
        </div>
      )}

      {/* Step 3: Retention */}
      {currentStep === 3 && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Retention</h3>
          </div>
          <div>
            <label className="form-label">Retention Rate (%)</label>
            <input {...form4.register("retention_percent")} type="number" className="form-input" min="0" max="100" step="0.5" />
          </div>
          <div>
            <label className="form-label">Previous Retention Released (£)</label>
            <input {...form4.register("previous_retention_released")} type="number" className="form-input" />
          </div>
          <div className="rounded-xl p-4" style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}>
            <div className="space-y-2">
              <div className="flex justify-between text-[13px]">
                <span style={{ color: "var(--text-muted)" }}>Gross Claim</span>
                <span style={{ color: "var(--text-primary)" }}>{formatCurrency(grossClaim)}</span>
              </div>
              <div className="flex justify-between text-[13px]">
                <span style={{ color: "var(--text-muted)" }}>Retention ({v4.retention_percent}%)</span>
                <span style={{ color: "var(--danger)" }}>-{formatCurrency(retention)}</span>
              </div>
              {(v4.previous_retention_released ?? 0) > 0 && (
                <div className="flex justify-between text-[13px]">
                  <span style={{ color: "var(--text-muted)" }}>Retention Released</span>
                  <span style={{ color: "var(--success)" }}>+{formatCurrency(v4.previous_retention_released)}</span>
                </div>
              )}
              <div className="flex justify-between text-[15px] font-700 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
                <span style={{ color: "var(--text-primary)" }}>Net Claim</span>
                <span style={{ color: "var(--primary)" }}>{formatCurrency(netClaim)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Review */}
      {currentStep === 4 && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Review & Submit</h3>
          </div>
          <SummarySection title="Application">
            <SummaryRow label="Number" value={`#${v1.application_number}`} />
            <SummaryRow label="Period" value={`${v1.period_from} – ${v1.period_to}`} />
            <SummaryRow label="Submission" value={v1.submission_date} />
            <SummaryRow label="Status" value={v1.status} />
          </SummarySection>
          <SummarySection title="Financial Summary">
            <SummaryRow label="Line Items" value={formatCurrency(linesTotal)} />
            <SummaryRow label="Variations" value={formatCurrency(variationsTotal)} />
            <SummaryRow label="Gross Claim" value={formatCurrency(grossClaim)} />
            <SummaryRow label="Retention" value={`-${formatCurrency(retention)}`} />
            <SummaryRow label="Net Claim" value={formatCurrency(netClaim)} />
          </SummarySection>
          <div className="rounded-[var(--radius)] p-4 flex gap-3"
            style={{ background: "var(--info-bg)", border: "1px solid var(--info)" }}>
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--info)" }} />
            <p className="text-[13px]" style={{ color: "var(--info-text)" }}>
              Submitting will create the application record with {v2.lines?.length ?? 0} line items
              and {v3.variations?.length ?? 0} variations.
            </p>
          </div>
        </div>
      )}
    </WizardShell>
  );
}

export default ApplicationWizard;

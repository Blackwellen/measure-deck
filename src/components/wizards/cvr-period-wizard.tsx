"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, TrendingUp } from "lucide-react";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { WizardShell, SummaryRow, SummarySection } from "./wizard-shell";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const step1Schema = z.object({
  period_name: z.string().min(2, "Period name is required"),
  period_month: z.coerce.number().min(1).max(12),
  period_year: z.coerce.number().min(2020).max(2030),
  project_id: z.string().min(1, "Project is required"),
  date_from: z.string().min(1, "From date is required"),
  date_to: z.string().min(1, "To date is required"),
});

const step2Schema = z.object({
  contract_sum: z.coerce.number().min(0),
  approved_changes: z.coerce.number().min(0).default(0),
  pending_changes: z.coerce.number().min(0).default(0),
  risk_allowance: z.coerce.number().min(0).default(0),
  opportunity_allowance: z.coerce.number().min(0).default(0),
});

const step3Schema = z.object({
  budgeted_cost: z.coerce.number().min(0),
  actual_cost_to_date: z.coerce.number().min(0).default(0),
  forecast_cost_at_completion: z.coerce.number().min(0),
  prelims_budget: z.coerce.number().min(0).default(0),
  prelims_actual: z.coerce.number().min(0).default(0),
  prelims_forecast: z.coerce.number().min(0).default(0),
});

const step4Schema = z.object({
  notes: z.string().optional(),
  submit_action: z.enum(["draft", "submit"]).default("draft"),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;
type Step4Data = z.infer<typeof step4Schema>;

// ─── Constants ────────────────────────────────────────────────────────────────

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const YEARS = Array.from({ length: 11 }, (_, i) => 2020 + i);

const STEPS = [
  { id: "period", label: "Period Details" },
  { id: "financial", label: "Financial Position" },
  { id: "cost", label: "Cost Position" },
  { id: "review", label: "Review & Submit" },
];

const DRAFT_KEY = "md_cvr_period_wizard_draft";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[12px] mt-1" style={{ color: "var(--danger)" }}>{message}</p>;
}

function fmt(n: number | undefined | null) {
  if (!n && n !== 0) return "—";
  return `£${Number(n).toLocaleString("en-GB", { minimumFractionDigits: 0 })}`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CVRPeriodWizardProps {
  onClose?: () => void;
  onSuccess?: (id: string) => void;
  defaultProjectId?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function CVRPeriodWizard({ onClose, onSuccess, defaultProjectId }: CVRPeriodWizardProps) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [createdId, setCreatedId] = React.useState<string | null>(null);
  const [projects, setProjects] = React.useState<{ id: string; name: string }[]>([]);
  const [submitAction, setSubmitAction] = React.useState<"draft" | "submit">("draft");

  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { project_id: defaultProjectId ?? "", period_month: new Date().getMonth() + 1, period_year: new Date().getFullYear() },
  });
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema), defaultValues: { approved_changes: 0, pending_changes: 0, risk_allowance: 0, opportunity_allowance: 0 } });
  const form3 = useForm<Step3Data>({ resolver: zodResolver(step3Schema), defaultValues: { actual_cost_to_date: 0, prelims_budget: 0, prelims_actual: 0, prelims_forecast: 0 } });
  const form4 = useForm<Step4Data>({ resolver: zodResolver(step4Schema) });

  const v1 = form1.watch();
  const v2 = form2.watch();
  const v3 = form3.watch();

  // ── Derived calculations ─────────────────────────────────────────────────
  const ffa = (v2.contract_sum || 0) + (v2.approved_changes || 0) + (v2.pending_changes || 0) * 0.5;
  const marginPct = ffa > 0 ? (((ffa - (v3.forecast_cost_at_completion || 0)) / ffa) * 100) : 0;
  const riskAdjusted = ffa - (v2.risk_allowance || 0) + (v2.opportunity_allowance || 0);

  // ── Load projects ────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.from("projects").select("id, name").order("name");
        if (data) setProjects(data);
      } catch { /* silent */ }
    })();
  }, []);

  // ── Draft persistence ────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.step1) form1.reset(d.step1);
        if (d.step2) form2.reset(d.step2);
        if (d.step3) form3.reset(d.step3);
        if (typeof d.currentStep === "number") setCurrentStep(d.currentStep);
      }
    } catch { /* ignore */ }
  }, []);

  const saveDraft = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ currentStep, step1: form1.getValues(), step2: form2.getValues(), step3: form3.getValues() }));
      toast.success("Draft saved");
    } catch { toast.error("Could not save draft"); }
  };

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleNext = async (): Promise<boolean> => {
    if (currentStep === 0) return form1.trigger();
    if (currentStep === 1) return form2.trigger();
    if (currentStep === 2) return form3.trigger();
    if (currentStep === 3) { await handleSubmit(); return false; }
    return true;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase.from("cvr_periods").insert({
        period_name: v1.period_name,
        period_month: v1.period_month,
        period_year: v1.period_year,
        project_id: v1.project_id,
        date_from: v1.date_from,
        date_to: v1.date_to,
        contract_sum: v2.contract_sum,
        approved_changes: v2.approved_changes,
        pending_changes: v2.pending_changes,
        forecast_final_account: ffa,
        risk_allowance: v2.risk_allowance,
        opportunity_allowance: v2.opportunity_allowance,
        budgeted_cost: v3.budgeted_cost,
        actual_cost_to_date: v3.actual_cost_to_date,
        forecast_cost_at_completion: v3.forecast_cost_at_completion,
        margin_at_completion_pct: parseFloat(marginPct.toFixed(2)),
        prelims_budget: v3.prelims_budget,
        prelims_actual: v3.prelims_actual,
        prelims_forecast: v3.prelims_forecast,
        notes: form4.getValues("notes") || null,
        status: submitAction,
        created_by: user?.id ?? null,
      }).select("id").single();

      if (error) throw error;
      localStorage.removeItem(DRAFT_KEY);
      setCreatedId(data.id);
      setShowSuccess(true);
      toast.success(submitAction === "submit" ? "CVR Period submitted for approval" : "CVR Period saved as draft");
      onSuccess?.(data.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save CVR Period");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Right panel ───────────────────────────────────────────────────────────
  const rightPanel = (
    <div>
      <SummarySection title="Calculated Position">
        <SummaryRow label="Forecast Final Account" value={fmt(ffa)} />
        <SummaryRow label="Margin at Completion" value={`${marginPct.toFixed(1)}%`} />
        <SummaryRow label="Risk-Adjusted Position" value={fmt(riskAdjusted)} />
      </SummarySection>
      {v1.period_name && (
        <SummarySection title="Period">
          <SummaryRow label="Name" value={v1.period_name} />
          <SummaryRow label="Month/Year" value={v1.period_month ? `${MONTHS[(v1.period_month || 1) - 1]} ${v1.period_year}` : undefined} />
          <SummaryRow label="Date From" value={v1.date_from} />
          <SummaryRow label="Date To" value={v1.date_to} />
        </SummarySection>
      )}
      {v2.contract_sum > 0 && (
        <SummarySection title="Financial">
          <SummaryRow label="Contract Sum" value={fmt(v2.contract_sum)} />
          <SummaryRow label="Approved Changes" value={fmt(v2.approved_changes)} />
          <SummaryRow label="Pending Changes" value={fmt(v2.pending_changes)} />
        </SummarySection>
      )}
      {v3.forecast_cost_at_completion > 0 && (
        <SummarySection title="Cost">
          <SummaryRow label="Budgeted Cost" value={fmt(v3.budgeted_cost)} />
          <SummaryRow label="Actual to Date" value={fmt(v3.actual_cost_to_date)} />
          <SummaryRow label="Forecast at Completion" value={fmt(v3.forecast_cost_at_completion)} />
        </SummarySection>
      )}
    </div>
  );

  const successContent = (
    <>
      <div>
        <h3 className="text-[20px] font-700" style={{ color: "var(--text-primary)" }}>CVR Period Saved!</h3>
        <p className="text-[14px] mt-1" style={{ color: "var(--text-secondary)" }}>
          <strong>{v1.period_name}</strong> has been {submitAction === "submit" ? "submitted for approval" : "saved as draft"}.
        </p>
      </div>
      <div className="flex gap-3">
        {onClose && <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>}
      </div>
    </>
  );

  return (
    <WizardShell
      steps={STEPS}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      title="New CVR Period"
      subtitle="Create a Cost Value Reconciliation period"
      rightPanel={rightPanel}
      onSaveDraft={saveDraft}
      onClose={onClose}
      isLastStep={currentStep === 3}
      nextLabel={currentStep === 3 ? (submitAction === "submit" ? "Submit for Approval" : "Save as Draft") : undefined}
      isSubmitting={isSubmitting}
      onNext={handleNext}
      showSuccess={showSuccess}
      successContent={successContent}
    >
      {/* ── Step 0: Period Details ── */}
      {currentStep === 0 && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Period Details</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Enter the reporting period information.</p>
          </div>
          <div>
            <label className="form-label">Period Name <span style={{ color: "var(--danger)" }}>*</span></label>
            <input {...form1.register("period_name")} className="form-input" placeholder="e.g. Period 12 — June 2025" />
            <FieldError message={form1.formState.errors.period_name?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Month <span style={{ color: "var(--danger)" }}>*</span></label>
              <select {...form1.register("period_month")} className="form-input">
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Year <span style={{ color: "var(--danger)" }}>*</span></label>
              <select {...form1.register("period_year")} className="form-input">
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Project <span style={{ color: "var(--danger)" }}>*</span></label>
            <select {...form1.register("project_id")} className="form-input">
              <option value="">Select project…</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <FieldError message={form1.formState.errors.project_id?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Date From <span style={{ color: "var(--danger)" }}>*</span></label>
              <input {...form1.register("date_from")} type="date" className="form-input" />
              <FieldError message={form1.formState.errors.date_from?.message} />
            </div>
            <div>
              <label className="form-label">Date To <span style={{ color: "var(--danger)" }}>*</span></label>
              <input {...form1.register("date_to")} type="date" className="form-input" />
              <FieldError message={form1.formState.errors.date_to?.message} />
            </div>
          </div>
        </div>
      )}

      {/* ── Step 1: Financial Position ── */}
      {currentStep === 1 && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Financial Position</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Enter current contract and change values.</p>
          </div>
          <div>
            <label className="form-label">Contract Sum (£) <span style={{ color: "var(--danger)" }}>*</span></label>
            <input {...form2.register("contract_sum")} type="number" className="form-input" placeholder="0" min="0" />
            <FieldError message={form2.formState.errors.contract_sum?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Approved Changes (£)</label>
              <input {...form2.register("approved_changes")} type="number" className="form-input" placeholder="0" min="0" />
            </div>
            <div>
              <label className="form-label">Pending Changes (£)</label>
              <input {...form2.register("pending_changes")} type="number" className="form-input" placeholder="0" min="0" />
            </div>
          </div>
          <div className="rounded-[var(--radius)] p-3 border" style={{ background: "var(--bg-subtle)", borderColor: "var(--border)" }}>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-600" style={{ color: "var(--text-secondary)" }}>Forecast Final Account (auto)</span>
              <span className="text-[15px] font-700" style={{ color: "var(--primary)" }}>{fmt(ffa)}</span>
            </div>
            <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>Contract Sum + Approved + 50% Pending</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Risk Allowance (£)</label>
              <input {...form2.register("risk_allowance")} type="number" className="form-input" placeholder="0" min="0" />
            </div>
            <div>
              <label className="form-label">Opportunity Allowance (£)</label>
              <input {...form2.register("opportunity_allowance")} type="number" className="form-input" placeholder="0" min="0" />
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Cost Position ── */}
      {currentStep === 2 && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Cost Position</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Enter budget and cost forecast data.</p>
          </div>
          <div>
            <label className="form-label">Budgeted Cost (£) <span style={{ color: "var(--danger)" }}>*</span></label>
            <input {...form3.register("budgeted_cost")} type="number" className="form-input" placeholder="0" min="0" />
            <FieldError message={form3.formState.errors.budgeted_cost?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Actual Cost to Date (£)</label>
              <input {...form3.register("actual_cost_to_date")} type="number" className="form-input" placeholder="0" min="0" />
            </div>
            <div>
              <label className="form-label">Forecast Cost at Completion (£) <span style={{ color: "var(--danger)" }}>*</span></label>
              <input {...form3.register("forecast_cost_at_completion")} type="number" className="form-input" placeholder="0" min="0" />
              <FieldError message={form3.formState.errors.forecast_cost_at_completion?.message} />
            </div>
          </div>
          {ffa > 0 && v3.forecast_cost_at_completion > 0 && (
            <div className="rounded-[var(--radius)] p-3 border flex items-center justify-between" style={{ background: "var(--bg-subtle)", borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" style={{ color: marginPct >= 0 ? "var(--success)" : "var(--danger)" }} />
                <span className="text-[13px] font-600" style={{ color: "var(--text-secondary)" }}>Margin at Completion (auto)</span>
              </div>
              <span className="text-[15px] font-700" style={{ color: marginPct >= 0 ? "var(--success)" : "var(--danger)" }}>
                {marginPct.toFixed(1)}%
              </span>
            </div>
          )}
          <div>
            <p className="text-[13px] font-600 mb-3" style={{ color: "var(--text-secondary)" }}>Preliminaries</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="form-label">Budget (£)</label>
                <input {...form3.register("prelims_budget")} type="number" className="form-input" placeholder="0" min="0" />
              </div>
              <div>
                <label className="form-label">Actual (£)</label>
                <input {...form3.register("prelims_actual")} type="number" className="form-input" placeholder="0" min="0" />
              </div>
              <div>
                <label className="form-label">Forecast (£)</label>
                <input {...form3.register("prelims_forecast")} type="number" className="form-input" placeholder="0" min="0" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Review & Submit ── */}
      {currentStep === 3 && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Review & Submit</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Check all values before saving.</p>
          </div>
          <SummarySection title="Period">
            <SummaryRow label="Name" value={v1.period_name} />
            <SummaryRow label="Month / Year" value={`${MONTHS[(v1.period_month || 1) - 1]} ${v1.period_year}`} />
            <SummaryRow label="Date From" value={v1.date_from} />
            <SummaryRow label="Date To" value={v1.date_to} />
          </SummarySection>
          <SummarySection title="Financial Position">
            <SummaryRow label="Contract Sum" value={fmt(v2.contract_sum)} />
            <SummaryRow label="Approved Changes" value={fmt(v2.approved_changes)} />
            <SummaryRow label="Pending Changes" value={fmt(v2.pending_changes)} />
            <SummaryRow label="Forecast Final Account" value={fmt(ffa)} />
            <SummaryRow label="Risk Allowance" value={fmt(v2.risk_allowance)} />
            <SummaryRow label="Opportunity Allowance" value={fmt(v2.opportunity_allowance)} />
          </SummarySection>
          <SummarySection title="Cost Position">
            <SummaryRow label="Budgeted Cost" value={fmt(v3.budgeted_cost)} />
            <SummaryRow label="Actual to Date" value={fmt(v3.actual_cost_to_date)} />
            <SummaryRow label="Forecast at Completion" value={fmt(v3.forecast_cost_at_completion)} />
            <SummaryRow label="Margin at Completion" value={`${marginPct.toFixed(1)}%`} />
          </SummarySection>
          <div>
            <label className="form-label">Notes</label>
            <textarea {...form4.register("notes")} className="form-input" rows={3} placeholder="Any additional notes or commentary…" />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setSubmitAction("draft")}
              className={cn("btn flex-1", submitAction === "draft" ? "btn-primary" : "btn-secondary")}
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={() => setSubmitAction("submit")}
              className={cn("btn flex-1", submitAction === "submit" ? "btn-primary" : "btn-secondary")}
            >
              Submit for Approval
            </button>
          </div>
          <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
            Selected: <strong>{submitAction === "submit" ? "Submit for Approval" : "Save as Draft"}</strong>. Click the button above then press the action button below.
          </p>
        </div>
      )}
    </WizardShell>
  );
}

export default CVRPeriodWizard;

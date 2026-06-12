"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Minus, Plus } from "lucide-react";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { WizardShell, SummaryRow, SummarySection } from "./wizard-shell";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const step1Schema = z.object({
  title: z.string().min(2, "Title is required"),
  project_id: z.string().min(1, "Project is required"),
  reference: z.string().min(1, "Reference is required"),
  contract_sum: z.coerce.number().min(0),
  contract_completion_date: z.string().min(1, "Contract completion date is required"),
});

const step3Schema = z.object({
  provisional_sums: z.coerce.number().default(0),
  dayworks: z.coerce.number().default(0),
  fluctuations: z.coerce.number().default(0),
  loss_expense: z.coerce.number().default(0),
  contra_charges: z.coerce.number().default(0),
});

const step4Schema = z.object({
  retention_percentage: z.coerce.number().min(0).max(100).default(5),
  practical_completion_date: z.string().optional(),
  defects_liability_period: z.coerce.number().min(0).default(12),
});

const step5Schema = z.object({
  status: z.enum(["draft", "submitted"]).default("draft"),
  notes: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step3Data = z.infer<typeof step3Schema>;
type Step4Data = z.infer<typeof step4Schema>;
type Step5Data = z.infer<typeof step5Schema>;

// ─── Types ────────────────────────────────────────────────────────────────────

interface ChangeEvent {
  id: string;
  reference: string;
  title: string;
  agreed_amount: number;
  included: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: "setup", label: "Setup" },
  { id: "changes", label: "Change Events" },
  { id: "adjustments", label: "Adjustments" },
  { id: "retention", label: "Retention" },
  { id: "review", label: "Review & Issue" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[12px] mt-1" style={{ color: "var(--danger)" }}>{message}</p>;
}

function fmt(n: number | undefined | null) {
  if (n === undefined || n === null) return "—";
  return `£${Number(n).toLocaleString("en-GB", { minimumFractionDigits: 0 })}`;
}

function addMonths(dateStr: string, months: number): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split("T")[0];
  } catch { return ""; }
}

function generateFARef(): string {
  const year = new Date().getFullYear();
  const num = String(Math.floor(Math.random() * 900) + 100);
  return `FA-${year}-${num}`;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface FinalAccountWizardProps {
  onClose?: () => void;
  onSuccess?: (id: string) => void;
  defaultProjectId?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function FinalAccountWizard({ onClose, onSuccess, defaultProjectId }: FinalAccountWizardProps) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [createdId, setCreatedId] = React.useState<string | null>(null);
  const [projects, setProjects] = React.useState<{ id: string; name: string; contract_sum?: number }[]>([]);
  const [changeEvents, setChangeEvents] = React.useState<ChangeEvent[]>([]);

  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { project_id: defaultProjectId ?? "", reference: generateFARef() },
  });
  const form3 = useForm<Step3Data>({ resolver: zodResolver(step3Schema), defaultValues: { provisional_sums: 0, dayworks: 0, fluctuations: 0, loss_expense: 0, contra_charges: 0 } });
  const form4 = useForm<Step4Data>({ resolver: zodResolver(step4Schema), defaultValues: { retention_percentage: 5, defects_liability_period: 12 } });
  const form5 = useForm<Step5Data>({ resolver: zodResolver(step5Schema), defaultValues: { status: "draft" } });

  const v1 = form1.watch();
  const v3 = form3.watch();
  const v4 = form4.watch();

  // ── Derived calcs ────────────────────────────────────────────────────────
  const includedCETotal = changeEvents.filter((ce) => ce.included).reduce((s, ce) => s + ce.agreed_amount, 0);
  const adjustmentsTotal = (v3.provisional_sums || 0) + (v3.dayworks || 0) + (v3.fluctuations || 0) + (v3.loss_expense || 0);
  const contraCharges = v3.contra_charges || 0;
  const faTotal = (v1.contract_sum || 0) + includedCETotal + adjustmentsTotal - contraCharges;
  const retentionHeld = faTotal * ((v4.retention_percentage || 5) / 100);
  const defectsExpiry = addMonths(v4.practical_completion_date || "", v4.defects_liability_period || 12);

  // ── Load projects & CEs ──────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.from("projects").select("id, name, contract_sum").order("name");
        if (data) setProjects(data);
      } catch { /* silent */ }
    })();
  }, []);

  // Reload CEs when project changes
  const selectedProjectId = v1.project_id;
  useEffect(() => {
    if (!selectedProjectId) return;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("change_events")
          .select("id, reference, title, agreed_amount")
          .eq("project_id", selectedProjectId)
          .eq("status", "approved");
        if (data) {
          setChangeEvents(data.map((ce: Omit<ChangeEvent, "included">) => ({ ...ce, included: true })));
        }
      } catch { /* silent */ }
    })();
    // Auto-fill contract sum from project
    const proj = projects.find((p) => p.id === selectedProjectId);
    if (proj?.contract_sum) form1.setValue("contract_sum", proj.contract_sum);
  }, [selectedProjectId, projects]);

  const toggleCE = (id: string) => {
    setChangeEvents((prev) => prev.map((ce) => ce.id === id ? { ...ce, included: !ce.included } : ce));
  };

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleNext = async (): Promise<boolean> => {
    if (currentStep === 0) return form1.trigger();
    if (currentStep === 1) return true; // CE selection optional
    if (currentStep === 2) return form3.trigger();
    if (currentStep === 3) return form4.trigger();
    if (currentStep === 4) { await handleSubmit(); return false; }
    return true;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase.from("final_accounts").insert({
        title: v1.title,
        project_id: v1.project_id,
        reference: v1.reference,
        contract_sum: v1.contract_sum,
        contract_completion_date: v1.contract_completion_date,
        ce_total: includedCETotal,
        provisional_sums: v3.provisional_sums,
        dayworks: v3.dayworks,
        fluctuations: v3.fluctuations,
        loss_expense: v3.loss_expense,
        contra_charges: v3.contra_charges,
        adjustments_total: adjustmentsTotal,
        final_account_total: faTotal,
        retention_percentage: v4.retention_percentage,
        retention_held: retentionHeld,
        practical_completion_date: v4.practical_completion_date || null,
        defects_liability_period: v4.defects_liability_period,
        defects_expiry_date: defectsExpiry || null,
        status: form5.getValues("status"),
        notes: form5.getValues("notes") || null,
        created_by: user?.id ?? null,
      }).select("id").single();

      if (error) throw error;

      // Insert CE line items
      const includedCEs = changeEvents.filter((ce) => ce.included);
      if (includedCEs.length > 0) {
        await supabase.from("final_account_line_items").insert(
          includedCEs.map((ce) => ({
            final_account_id: data.id,
            change_event_id: ce.id,
            reference: ce.reference,
            description: ce.title,
            amount: ce.agreed_amount,
            line_type: "change_event",
          }))
        );
      }

      setCreatedId(data.id);
      setShowSuccess(true);
      toast.success("Final Account created successfully");
      onSuccess?.(data.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create Final Account");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Right panel ───────────────────────────────────────────────────────────
  const rightPanel = (
    <div>
      <SummarySection title="Final Account Total">
        <SummaryRow label="Contract Sum" value={fmt(v1.contract_sum)} />
        <SummaryRow label="+ Change Events" value={fmt(includedCETotal)} />
        <SummaryRow label="+ Adjustments" value={fmt(adjustmentsTotal)} />
        {contraCharges > 0 && <SummaryRow label="− Contra Charges" value={fmt(contraCharges)} />}
        <SummaryRow label="= FA Total" value={fmt(faTotal)} />
      </SummarySection>
      {v4.retention_percentage > 0 && (
        <SummarySection title="Retention">
          <SummaryRow label="Retention %" value={`${v4.retention_percentage}%`} />
          <SummaryRow label="Retention Held" value={fmt(retentionHeld)} />
          <SummaryRow label="Defects Expiry" value={defectsExpiry} />
        </SummarySection>
      )}
    </div>
  );

  const successContent = (
    <>
      <div>
        <h3 className="text-[20px] font-700" style={{ color: "var(--text-primary)" }}>Final Account Created!</h3>
        <p className="text-[14px] mt-1" style={{ color: "var(--text-secondary)" }}>
          <strong>{v1.reference}</strong> — {v1.title} has been created.
        </p>
        <p className="text-[14px] mt-1 font-700" style={{ color: "var(--primary)" }}>Total: {fmt(faTotal)}</p>
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
      title="New Final Account"
      subtitle="Create and issue a Final Account settlement"
      rightPanel={rightPanel}
      onClose={onClose}
      isLastStep={currentStep === 4}
      nextLabel={currentStep === 4 ? "Create Final Account" : undefined}
      isSubmitting={isSubmitting}
      onNext={handleNext}
      showSuccess={showSuccess}
      successContent={successContent}
    >
      {/* ── Step 0: Setup ── */}
      {currentStep === 0 && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Final Account Setup</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Enter the basic details for this Final Account.</p>
          </div>
          <div>
            <label className="form-label">Title <span style={{ color: "var(--danger)" }}>*</span></label>
            <input {...form1.register("title")} className="form-input" placeholder="e.g. Main Contract Final Account" />
            <FieldError message={form1.formState.errors.title?.message} />
          </div>
          <div>
            <label className="form-label">Project <span style={{ color: "var(--danger)" }}>*</span></label>
            <select {...form1.register("project_id")} className="form-input">
              <option value="">Select project…</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <FieldError message={form1.formState.errors.project_id?.message} />
          </div>
          <div>
            <label className="form-label">Reference <span style={{ color: "var(--danger)" }}>*</span></label>
            <input {...form1.register("reference")} className="form-input" placeholder="FA-YYYY-NNN" />
            <FieldError message={form1.formState.errors.reference?.message} />
          </div>
          <div>
            <label className="form-label">Contract Sum (£) <span style={{ color: "var(--danger)" }}>*</span></label>
            <input {...form1.register("contract_sum")} type="number" className="form-input" placeholder="0" min="0" />
            <FieldError message={form1.formState.errors.contract_sum?.message} />
          </div>
          <div>
            <label className="form-label">Contract Completion Date <span style={{ color: "var(--danger)" }}>*</span></label>
            <input {...form1.register("contract_completion_date")} type="date" className="form-input" />
            <FieldError message={form1.formState.errors.contract_completion_date?.message} />
          </div>
        </div>
      )}

      {/* ── Step 1: Change Events ── */}
      {currentStep === 1 && (
        <div className="space-y-5">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Change Events</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Select approved change events to include in this Final Account.</p>
          </div>
          {changeEvents.length === 0 ? (
            <div className="rounded-xl border p-8 text-center" style={{ borderColor: "var(--border)" }}>
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>No approved change events found for this project.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {changeEvents.map((ce) => (
                <div
                  key={ce.id}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors",
                    ce.included ? "border-[var(--primary)]" : ""
                  )}
                  style={{ borderColor: ce.included ? "var(--primary)" : "var(--border)", background: ce.included ? "var(--primary-bg)" : "var(--bg-surface)" }}
                  onClick={() => toggleCE(ce.id)}
                >
                  <div className={cn(
                    "w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center",
                    ce.included ? "bg-[var(--primary)] border-[var(--primary)]" : "border-[var(--border)]"
                  )}>
                    {ce.included && <CheckCircle2 className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-600" style={{ color: "var(--text-primary)" }}>{ce.reference} — {ce.title}</p>
                  </div>
                  <span className="text-[13px] font-700 flex-shrink-0" style={{ color: ce.agreed_amount >= 0 ? "var(--success)" : "var(--danger)" }}>
                    {fmt(ce.agreed_amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
          {changeEvents.length > 0 && (
            <div className="flex items-center justify-between rounded-xl p-3 border" style={{ background: "var(--bg-subtle)", borderColor: "var(--border)" }}>
              <span className="text-[13px] font-600" style={{ color: "var(--text-secondary)" }}>
                {changeEvents.filter((ce) => ce.included).length} of {changeEvents.length} CEs included
              </span>
              <span className="text-[14px] font-700" style={{ color: "var(--primary)" }}>{fmt(includedCETotal)}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Adjustments ── */}
      {currentStep === 2 && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Adjustments</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Enter any additional adjustments to the Final Account.</p>
          </div>
          <div>
            <label className="form-label">Provisional Sums (£)</label>
            <input {...form3.register("provisional_sums")} type="number" className="form-input" placeholder="0" />
          </div>
          <div>
            <label className="form-label">Dayworks (£)</label>
            <input {...form3.register("dayworks")} type="number" className="form-input" placeholder="0" />
          </div>
          <div>
            <label className="form-label">Fluctuations (£)</label>
            <input {...form3.register("fluctuations")} type="number" className="form-input" placeholder="0" />
          </div>
          <div>
            <label className="form-label">Loss & Expense (£)</label>
            <input {...form3.register("loss_expense")} type="number" className="form-input" placeholder="0" />
          </div>
          <div>
            <label className="form-label">Contra Charges (£) <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>— will be deducted</span></label>
            <input {...form3.register("contra_charges")} type="number" className="form-input" placeholder="0" min="0" />
          </div>
        </div>
      )}

      {/* ── Step 3: Retention ── */}
      {currentStep === 3 && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Retention & Defects</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Enter retention and defects liability period details.</p>
          </div>
          <div>
            <label className="form-label">Retention Percentage (%)</label>
            <input {...form4.register("retention_percentage")} type="number" className="form-input" min="0" max="100" step="0.5" />
          </div>
          <div className="rounded-[var(--radius)] p-3 border flex items-center justify-between" style={{ background: "var(--bg-subtle)", borderColor: "var(--border)" }}>
            <span className="text-[13px] font-600" style={{ color: "var(--text-secondary)" }}>Retention Held (auto)</span>
            <span className="text-[15px] font-700" style={{ color: "var(--primary)" }}>{fmt(retentionHeld)}</span>
          </div>
          <div>
            <label className="form-label">Practical Completion Date</label>
            <input {...form4.register("practical_completion_date")} type="date" className="form-input" />
          </div>
          <div>
            <label className="form-label">Defects Liability Period (months)</label>
            <input {...form4.register("defects_liability_period")} type="number" className="form-input" min="0" defaultValue={12} />
          </div>
          {defectsExpiry && (
            <div className="rounded-[var(--radius)] p-3 border" style={{ background: "var(--bg-subtle)", borderColor: "var(--border)" }}>
              <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>Defects Expiry Date (auto-calculated)</p>
              <p className="text-[14px] font-700" style={{ color: "var(--text-primary)" }}>{defectsExpiry}</p>
            </div>
          )}
        </div>
      )}

      {/* ── Step 4: Review & Issue ── */}
      {currentStep === 4 && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Review & Issue</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Review the Final Account summary before issuing.</p>
          </div>
          <SummarySection title="Final Account Summary">
            <SummaryRow label="Reference" value={v1.reference} />
            <SummaryRow label="Title" value={v1.title} />
            <SummaryRow label="Contract Sum" value={fmt(v1.contract_sum)} />
            <SummaryRow label="+ Change Events" value={fmt(includedCETotal)} />
            <SummaryRow label="+ Adjustments" value={fmt(adjustmentsTotal)} />
            <SummaryRow label="− Contra Charges" value={fmt(contraCharges)} />
            <SummaryRow label="= Final Account Total" value={fmt(faTotal)} />
            <SummaryRow label="Retention Held" value={fmt(retentionHeld)} />
          </SummarySection>
          <div>
            <label className="form-label">Status</label>
            <select {...form5.register("status")} className="form-input">
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
            </select>
          </div>
          <div>
            <label className="form-label">Notes</label>
            <textarea {...form5.register("notes")} className="form-input" rows={3} placeholder="Any additional notes…" />
          </div>
          <div className="rounded-[var(--radius)] p-4 flex gap-3" style={{ background: "var(--info-bg)", border: "1px solid var(--info)" }}>
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--info)" }} />
            <p className="text-[13px]" style={{ color: "var(--info-text)" }}>
              This will create a Final Account record and attach all included Change Events as line items.
            </p>
          </div>
        </div>
      )}
    </WizardShell>
  );
}

export default FinalAccountWizard;

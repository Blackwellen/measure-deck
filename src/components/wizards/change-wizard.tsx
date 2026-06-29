"use client";

import { createClient } from "@/lib/supabase/client";
import {
  NEC4_CE_CATEGORIES,
  type NEC4CECategory,
} from "@/lib/nec4/ce-categories";
import {
  calculateQuotationDueDate,
} from "@/lib/nec4/ce-state-machine";
import { generateRef } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, CheckCircle2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
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
  instruction_date: z.string().optional(),
  notification_date: z.string().optional(),
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

// ─── NEC4 form state ──────────────────────────────────────────────────────────

interface NEC4State {
  nec4_clause: string;
  risk_party: NEC4CECategory["risk_party"] | "";
  notified_within_8_weeks: boolean | null;
  quotation_due_date: string;
}

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

const STATUS_OPTIONS = [
  "draft",
  "submitted",
  "under_review",
  "agreed",
  "disputed",
  "withdrawn",
];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-[12px] mt-1" style={{ color: "var(--danger)" }}>
      {message}
    </p>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ChangeWizardProps {
  projectId?: string;
  /** If provided, the wizard shows NEC4 steps automatically */
  contractType?: string;
  onClose?: () => void;
  onSuccess?: (id: string) => void;
}

// ─── CECategorySelector ───────────────────────────────────────────────────────

function CECategorySelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (cat: NEC4CECategory) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = NEC4_CE_CATEGORIES.filter(
    (c) =>
      c.code.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase()) ||
      c.common_examples.some((ex) =>
        ex.toLowerCase().includes(search.toLowerCase())
      )
  );

  const RISK_COLORS: Record<NEC4CECategory["risk_party"], string> = {
    Employer: "var(--danger)",
    Contractor: "var(--warning)",
    Neutral: "var(--info)",
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
        />
        <input
          className="form-input pl-8"
          placeholder="Search clauses or examples…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div
        className="flex flex-col gap-1 max-h-72 overflow-y-auto rounded-[var(--radius)] border border-[var(--border)]"
        style={{ background: "var(--bg-subtle)" }}
      >
        {filtered.length === 0 && (
          <div className="p-4 text-sm text-[var(--text-muted)] text-center">
            No clauses match your search.
          </div>
        )}
        {filtered.map((cat) => (
          <button
            key={cat.code}
            type="button"
            onClick={() => onChange(cat)}
            className="w-full text-left px-3 py-2.5 hover:bg-[var(--primary-light)] transition-colors border-b border-[var(--border)] last:border-b-0"
            style={{
              background:
                value === cat.code ? "var(--primary-light)" : undefined,
            }}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <span className="font-mono text-xs font-bold text-[var(--primary)]">
                {cat.code}
              </span>
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{
                  background: `${RISK_COLORS[cat.risk_party]}20`,
                  color: RISK_COLORS[cat.risk_party],
                }}
              >
                {cat.risk_party} Risk
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-snug">
              {cat.description}
            </p>
            {cat.common_examples.slice(0, 2).map((ex) => (
              <span
                key={ex}
                className="inline-block text-[10px] text-[var(--text-muted)] mr-2 mt-0.5"
              >
                • {ex}
              </span>
            ))}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ChangeWizard({
  projectId,
  contractType,
  onClose,
  onSuccess,
}: ChangeWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  // Detect whether NEC4 mode should be on — either via prop or if we detect it
  const isNEC4 = contractType?.startsWith("NEC4") ?? false;

  // NEC4-specific form state
  const [nec4State, setNec4State] = useState<NEC4State>({
    nec4_clause: "",
    risk_party: "",
    notified_within_8_weeks: null,
    quotation_due_date: "",
  });

  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      project_id: projectId ?? "",
      date_issued: new Date().toISOString().split("T")[0],
      status: "draft",
      instruction_date: new Date().toISOString().split("T")[0],
      notification_date: new Date().toISOString().split("T")[0],
    },
  });
  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      contract_sum_impact: 0,
      programme_impact_days: 0,
      overhead_percent: 15,
      profit_percent: 10,
    },
  });
  const form3 = useForm<Step3Data>({ resolver: zodResolver(step3Schema) });

  const v1 = form1.watch();
  const v2 = form2.watch();

  const subTotal =
    (v2.labour_cost ?? 0) +
    (v2.materials_cost ?? 0) +
    (v2.plant_cost ?? 0);
  const overhead = subTotal * ((v2.overhead_percent ?? 0) / 100);
  const profit = (subTotal + overhead) * ((v2.profit_percent ?? 0) / 100);
  const totalValuation = subTotal + overhead + profit;

  // Auto-calculate quotation_due_date when instruction_date changes
  useEffect(() => {
    if (isNEC4 && v1.instruction_date) {
      const due = calculateQuotationDueDate(new Date(v1.instruction_date));
      setNec4State((prev) => ({
        ...prev,
        quotation_due_date: due.toISOString().split("T")[0],
      }));
    }
  }, [isNEC4, v1.instruction_date]);

  // Build steps dynamically based on contract type
  const BASE_STEPS = [
    { id: "details", label: "Details" },
    { id: "valuation", label: "Valuation" },
  ];
  const NEC4_STEPS = isNEC4
    ? [
        { id: "nec4_clause", label: "NEC4 Clause" },
        { id: "notification_check", label: "Notification Check" },
      ]
    : [];
  const TAIL_STEPS = [
    { id: "evidence", label: "Evidence" },
    { id: "review", label: "Review" },
  ];
  const STEPS = [...BASE_STEPS, ...NEC4_STEPS, ...TAIL_STEPS];

  const lastStepIdx = STEPS.length - 1;

  const handleNext = async (): Promise<boolean> => {
    const stepId = STEPS[currentStep]?.id;
    if (stepId === "details") return form1.trigger();
    if (stepId === "valuation") return form2.trigger();
    if (stepId === "nec4_clause") {
      if (!nec4State.nec4_clause) {
        toast.error("Please select an NEC4 clause");
        return false;
      }
      return true;
    }
    if (stepId === "notification_check") return true;
    if (stepId === "evidence") return true;
    if (stepId === "review") {
      await handleSubmit();
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

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
          ...(isNEC4 && {
            nec4_clause: nec4State.nec4_clause || null,
            risk_party: nec4State.risk_party || null,
            instruction_date: v1.instruction_date || null,
            notification_date: v1.notification_date || null,
          }),
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

      // If NEC4, create the workflow state record
      if (isNEC4 && nec4State.nec4_clause) {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        // Get workspace_id from the project
        const { data: project } = await supabase
          .from("projects")
          .select("workspace_id")
          .eq("id", v1.project_id)
          .single();

        const workspaceId = project?.workspace_id ?? null;

        await supabase.from("ce_workflow_states").insert({
          workspace_id: workspaceId,
          change_event_id: ce.id,
          state: "ce_notified",
          clause_reference: nec4State.nec4_clause,
          notification_date: v1.notification_date || null,
          instruction_date: v1.instruction_date || null,
          quotation_due_date: nec4State.quotation_due_date || null,
        });
      }

      setCreatedId(ce.id);
      setShowSuccess(true);
      toast.success("Change event created");
      onSuccess?.(ce.id);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create change event"
      );
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
          <SummaryRow
            label="Labour"
            value={`£${(v2.labour_cost || 0).toLocaleString()}`}
          />
          <SummaryRow
            label="Materials"
            value={`£${(v2.materials_cost || 0).toLocaleString()}`}
          />
          <SummaryRow
            label="Plant"
            value={`£${(v2.plant_cost || 0).toLocaleString()}`}
          />
          <SummaryRow label="Overhead" value={`${v2.overhead_percent}%`} />
          <SummaryRow label="Profit" value={`${v2.profit_percent}%`} />
          <SummaryRow
            label="Total"
            value={`£${totalValuation.toLocaleString()}`}
          />
        </SummarySection>
      )}
      {isNEC4 && nec4State.nec4_clause && (
        <SummarySection title="NEC4">
          <SummaryRow label="Clause" value={nec4State.nec4_clause} />
          <SummaryRow label="Risk Party" value={nec4State.risk_party || "—"} />
          <SummaryRow
            label="Quotation Due"
            value={nec4State.quotation_due_date || "—"}
          />
        </SummarySection>
      )}
    </div>
  );

  const successContent = (
    <>
      <div>
        <h3
          className="text-[20px] font-700"
          style={{ color: "var(--text-primary)" }}
        >
          Change Event Created!
        </h3>
        <p className="text-[14px] mt-1" style={{ color: "var(--text-secondary)" }}>
          <strong>{v1.title}</strong> has been logged.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            if (createdId) router.push(`/changes/${createdId}`);
            onClose?.();
          }}
        >
          View Change Event
        </button>
        {onClose && (
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    </>
  );

  const currentStepId = STEPS[currentStep]?.id;

  return (
    <WizardShell
      steps={STEPS}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      title="Log Change Event"
      subtitle="Record a contract variation or change instruction"
      rightPanel={rightPanel}
      onClose={onClose}
      isLastStep={currentStep === lastStepIdx}
      nextLabel={
        currentStep === lastStepIdx ? "Create Change Event" : undefined
      }
      isSubmitting={isSubmitting}
      onNext={handleNext}
      showSuccess={showSuccess}
      successContent={successContent}
    >
      {/* Step: Details */}
      {currentStepId === "details" && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3
              className="text-[15px] font-600 mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              Change Details
            </h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
              Describe the change event.
            </p>
          </div>
          <div>
            <label className="form-label">
              Title <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              {...form1.register("title")}
              className="form-input"
              placeholder="e.g. Ground conditions variation"
            />
            <FieldError message={form1.formState.errors.title?.message} />
          </div>
          <div>
            <label className="form-label">Reference</label>
            <input
              {...form1.register("reference")}
              className="form-input"
              placeholder="Auto-generated if blank"
            />
          </div>
          {!projectId && (
            <div>
              <label className="form-label">
                Project ID <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                {...form1.register("project_id")}
                className="form-input"
                placeholder="Project UUID"
              />
              <FieldError
                message={form1.formState.errors.project_id?.message}
              />
            </div>
          )}
          <div>
            <label className="form-label">
              Change Type <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <select {...form1.register("change_type")} className="form-input">
              <option value="">Select type…</option>
              {CHANGE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <FieldError
              message={form1.formState.errors.change_type?.message}
            />
          </div>
          <div>
            <label className="form-label">Status</label>
            <select {...form1.register("status")} className="form-input">
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">
              Date Issued <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              {...form1.register("date_issued")}
              type="date"
              className="form-input"
            />
            <FieldError
              message={form1.formState.errors.date_issued?.message}
            />
          </div>
          {isNEC4 && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Instruction Date</label>
                <input
                  {...form1.register("instruction_date")}
                  type="date"
                  className="form-input"
                />
              </div>
              <div>
                <label className="form-label">Notification Date</label>
                <input
                  {...form1.register("notification_date")}
                  type="date"
                  className="form-input"
                />
              </div>
            </div>
          )}
          <div>
            <label className="form-label">Description</label>
            <textarea
              {...form1.register("description")}
              rows={3}
              className="form-input"
              placeholder="Describe the change in detail…"
            />
          </div>
        </div>
      )}

      {/* Step: Valuation */}
      {currentStepId === "valuation" && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3
              className="text-[15px] font-600 mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              Valuation
            </h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
              Break down the cost impact.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Labour (£)</label>
              <input
                {...form2.register("labour_cost")}
                type="number"
                className="form-input"
                placeholder="0"
              />
            </div>
            <div>
              <label className="form-label">Materials (£)</label>
              <input
                {...form2.register("materials_cost")}
                type="number"
                className="form-input"
                placeholder="0"
              />
            </div>
            <div>
              <label className="form-label">Plant (£)</label>
              <input
                {...form2.register("plant_cost")}
                type="number"
                className="form-input"
                placeholder="0"
              />
            </div>
            <div>
              <label className="form-label">Programme Impact (days)</label>
              <input
                {...form2.register("programme_impact_days")}
                type="number"
                className="form-input"
                placeholder="0"
              />
            </div>
            <div>
              <label className="form-label">Overhead (%)</label>
              <input
                {...form2.register("overhead_percent")}
                type="number"
                className="form-input"
                min="0"
                max="100"
                step="0.5"
              />
            </div>
            <div>
              <label className="form-label">Profit (%)</label>
              <input
                {...form2.register("profit_percent")}
                type="number"
                className="form-input"
                min="0"
                max="100"
                step="0.5"
              />
            </div>
          </div>
          <div
            className="rounded-xl p-4"
            style={{
              background: "var(--bg-subtle)",
              border: "1px solid var(--border)",
            }}
          >
            <p
              className="text-[12px] font-600 mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Calculated Total
            </p>
            <p
              className="text-[24px] font-700"
              style={{ color: "var(--text-primary)" }}
            >
              £{totalValuation.toLocaleString("en-GB", { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      )}

      {/* NEC4 Step: Clause Selector */}
      {currentStepId === "nec4_clause" && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3
              className="text-[15px] font-600 mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              NEC4 Clause
            </h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
              Select the NEC4 clause that gives rise to this compensation event.
            </p>
          </div>
          <CECategorySelector
            value={nec4State.nec4_clause}
            onChange={(cat) =>
              setNec4State((prev) => ({
                ...prev,
                nec4_clause: cat.code,
                risk_party: cat.risk_party,
              }))
            }
          />
          {nec4State.nec4_clause && (
            <div
              className="rounded-[var(--radius)] p-3 text-sm"
              style={{
                background: "var(--primary-light)",
                border: "1px solid var(--primary)",
                color: "var(--primary)",
              }}
            >
              Selected: <strong>{nec4State.nec4_clause}</strong> —{" "}
              {
                NEC4_CE_CATEGORIES.find(
                  (c) => c.code === nec4State.nec4_clause
                )?.description
              }
            </div>
          )}
        </div>
      )}

      {/* NEC4 Step: Notification Check */}
      {currentStepId === "notification_check" && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3
              className="text-[15px] font-600 mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              Notification Check
            </h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
              NEC4 clause 61.3 — Was this CE notified within 8 weeks of first
              becoming aware?
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() =>
                setNec4State((prev) => ({
                  ...prev,
                  notified_within_8_weeks: true,
                }))
              }
              className="flex-1 btn"
              style={{
                background:
                  nec4State.notified_within_8_weeks === true
                    ? "var(--success)"
                    : "var(--bg-subtle)",
                color:
                  nec4State.notified_within_8_weeks === true
                    ? "#fff"
                    : "var(--text-primary)",
                border: "1px solid var(--border)",
              }}
            >
              Yes — notified within 8 weeks
            </button>
            <button
              type="button"
              onClick={() =>
                setNec4State((prev) => ({
                  ...prev,
                  notified_within_8_weeks: false,
                }))
              }
              className="flex-1 btn"
              style={{
                background:
                  nec4State.notified_within_8_weeks === false
                    ? "var(--danger)"
                    : "var(--bg-subtle)",
                color:
                  nec4State.notified_within_8_weeks === false
                    ? "#fff"
                    : "var(--text-primary)",
                border: "1px solid var(--border)",
              }}
            >
              No — late notification
            </button>
          </div>

          {nec4State.notified_within_8_weeks === false && (
            <div
              className="rounded-lg p-4 flex items-start gap-3"
              style={{
                background: "var(--warning-bg, #fffbeb)",
                border: "1px solid var(--warning, #f59e0b)",
              }}
            >
              <AlertTriangle
                size={16}
                className="flex-shrink-0 mt-0.5"
                style={{ color: "var(--warning)" }}
              />
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--warning-text, #92400e)" }}
                >
                  Late notification — entitlement risk
                </p>
                <p
                  className="text-xs mt-1"
                  style={{ color: "var(--warning-text, #92400e)" }}
                >
                  Late notification may affect entitlement under clause 61.3.
                  The PM may not be obliged to instruct a compensation event if
                  the Contractor did not notify within 8 weeks of becoming
                  aware. Consider seeking legal advice before proceeding.
                </p>
              </div>
            </div>
          )}

          {nec4State.notified_within_8_weeks === true && (
            <div
              className="rounded-lg p-4 flex items-start gap-3"
              style={{
                background: "var(--success-bg, #f0fdf4)",
                border: "1px solid var(--success, #22c55e)",
              }}
            >
              <CheckCircle2
                size={16}
                className="flex-shrink-0 mt-0.5"
                style={{ color: "var(--success)" }}
              />
              <p
                className="text-sm"
                style={{ color: "var(--success-text, #166534)" }}
              >
                Notification is within the 8-week window. Entitlement preserved
                under clause 61.3.
              </p>
            </div>
          )}

          {nec4State.quotation_due_date && (
            <div
              className="rounded-[var(--radius)] p-3 text-sm"
              style={{
                background: "var(--bg-subtle)",
                border: "1px solid var(--border)",
              }}
            >
              <span className="text-[var(--text-muted)]">
                Quotation due (21 days from instruction):
              </span>{" "}
              <strong>{nec4State.quotation_due_date}</strong>
            </div>
          )}
        </div>
      )}

      {/* Step: Evidence */}
      {currentStepId === "evidence" && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3
              className="text-[15px] font-600 mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              Evidence Notes
            </h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
              Note any supporting evidence (attach files after creation).
            </p>
          </div>
          <div>
            <label className="form-label">Evidence Notes</label>
            <textarea
              {...form3.register("evidence_notes")}
              rows={5}
              className="form-input"
              placeholder="List supporting documents, photos, correspondence references…"
            />
          </div>
        </div>
      )}

      {/* Step: Review */}
      {currentStepId === "review" && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3
              className="text-[15px] font-600 mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              Review &amp; Submit
            </h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
              Confirm all details before creating the change event.
            </p>
          </div>
          <SummarySection title="Change Details">
            <SummaryRow label="Title" value={v1.title} />
            <SummaryRow label="Type" value={v1.change_type} />
            <SummaryRow label="Date Issued" value={v1.date_issued} />
            <SummaryRow label="Status" value={v1.status} />
          </SummarySection>
          <SummarySection title="Valuation">
            <SummaryRow
              label="Labour"
              value={`£${(v2.labour_cost || 0).toLocaleString()}`}
            />
            <SummaryRow
              label="Materials"
              value={`£${(v2.materials_cost || 0).toLocaleString()}`}
            />
            <SummaryRow
              label="Plant"
              value={`£${(v2.plant_cost || 0).toLocaleString()}`}
            />
            <SummaryRow
              label="Total"
              value={`£${totalValuation.toLocaleString()}`}
            />
            <SummaryRow
              label="Programme Impact"
              value={`${v2.programme_impact_days || 0} days`}
            />
          </SummarySection>
          {isNEC4 && nec4State.nec4_clause && (
            <SummarySection title="NEC4 Workflow">
              <SummaryRow label="Clause" value={nec4State.nec4_clause} />
              <SummaryRow
                label="Risk Party"
                value={nec4State.risk_party || "—"}
              />
              <SummaryRow
                label="Notified in Time"
                value={
                  nec4State.notified_within_8_weeks === true
                    ? "Yes"
                    : nec4State.notified_within_8_weeks === false
                    ? "No (late)"
                    : "Not answered"
                }
              />
              <SummaryRow
                label="Quotation Due"
                value={nec4State.quotation_due_date || "—"}
              />
            </SummarySection>
          )}
          <div
            className="rounded-[var(--radius)] p-4 flex gap-3"
            style={{
              background: "var(--info-bg)",
              border: "1px solid var(--info)",
            }}
          >
            <CheckCircle2
              className="w-4 h-4 flex-shrink-0 mt-0.5"
              style={{ color: "var(--info)" }}
            />
            <p className="text-[13px]" style={{ color: "var(--info-text)" }}>
              This will create the change event and pricing record. Evidence
              files can be uploaded afterwards.
              {isNEC4 &&
                nec4State.nec4_clause &&
                " An NEC4 workflow record will also be created."}
            </p>
          </div>
        </div>
      )}
    </WizardShell>
  );
}

export default ChangeWizard;

"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { WizardShell, SummaryRow, SummarySection } from "./wizard-shell";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const step1Schema = z.object({
  name: z.string().min(2, "Project name is required"),
  reference: z.string().optional(),
  client_name: z.string().min(1, "Client name is required"),
  client_contact: z.string().optional(),
});

const step2Schema = z.object({
  contract_type: z.string().min(1, "Contract type is required"),
  contract_sum: z.coerce.number().min(0, "Contract sum must be positive"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().optional(),
  procurement_route: z.string().optional(),
});

const step3Schema = z.object({
  retention_percent: z.coerce.number().min(0).max(100).optional().default(5),
  payment_terms_days: z.coerce.number().min(1).max(365).optional().default(30),
  dlp_months: z.coerce.number().min(0).max(120).optional().default(12),
  nec4_option: z.string().optional(),
  contract_administrator: z.string().optional(),
  contract_administrator_company: z.string().optional(),
  notice_requirements: z.string().optional(),
});

const step4Schema = z.object({
  project_lead: z.string().optional(),
  commercial_lead: z.string().optional(),
  site_manager: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

const NEC4_OPTIONS = ["Option A", "Option B", "Option C", "Option D", "Option E", "Option F"];
type Step4Data = z.infer<typeof step4Schema>;

// ─── Constants ────────────────────────────────────────────────────────────────

const DRAFT_KEY = "md_project_wizard_draft";
const CONTRACT_TYPES = ["JCT SBC", "JCT Design & Build", "NEC4 ECC", "NEC4 ECS", "NEC4 ECS SP", "Bespoke", "Other"];
const PROCUREMENT_ROUTES = ["Traditional", "Design & Build", "Management Contracting", "Construction Management", "PFI/PPP", "Two-Stage"];

const STEPS = [
  { id: "details", label: "Details" },
  { id: "contract", label: "Contract" },
  { id: "commercial", label: "Commercial" },
  { id: "team", label: "Team" },
  { id: "review", label: "Review" },
];

// ─── Field error helper ───────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[12px] mt-1" style={{ color: "var(--danger)" }}>{message}</p>;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ProjectWizardProps {
  onClose?: () => void;
  /** If provided, wizard renders inside the modal; otherwise full-page */
  mode?: "page" | "modal";
  onSuccess?: (projectId: string) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ProjectWizard({ onClose, mode = "modal", onSuccess }: ProjectWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [createdId, setCreatedId] = React.useState<string | null>(null);

  // Per-step forms
  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema) });
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema) });
  const form3 = useForm<Step3Data>({ resolver: zodResolver(step3Schema) });
  const form4 = useForm<Step4Data>({ resolver: zodResolver(step4Schema) });

  // Watch all values for summary panel
  const v1 = form1.watch();
  const v2 = form2.watch();
  const v3 = form3.watch();
  const v4 = form4.watch();

  // ── Draft persistence ────────────────────────────────────────────────────
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.step1) form1.reset(d.step1);
        if (d.step2) form2.reset(d.step2);
        if (d.step3) form3.reset(d.step3);
        if (d.step4) form4.reset(d.step4);
        if (typeof d.currentStep === "number") setCurrentStep(d.currentStep);
      }
    } catch { /* ignore */ }
  }, []);

  const saveDraft = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        currentStep,
        step1: form1.getValues(),
        step2: form2.getValues(),
        step3: form3.getValues(),
        step4: form4.getValues(),
      }));
      toast.success("Draft saved");
    } catch {
      toast.error("Could not save draft");
    }
  };

  // ── Step validation & advance ─────────────────────────────────────────────
  const handleNext = async (): Promise<boolean> => {
    if (currentStep === 0) {
      const ok = await form1.trigger();
      return ok;
    }
    if (currentStep === 1) {
      const ok = await form2.trigger();
      return ok;
    }
    if (currentStep === 2) {
      await form3.trigger();
      return true; // all optional
    }
    if (currentStep === 3) {
      await form4.trigger();
      return true;
    }
    if (currentStep === 4) {
      // Review step — submit
      await handleSubmit();
      return false; // prevent auto-advance; success state handles it
    }
    return true;
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const payload = {
        name: v1.name,
        reference: v1.reference || null,
        client_name: v1.client_name,
        client_contact: v1.client_contact || null,
        contract_type: v2.contract_type,
        contract_sum: v2.contract_sum,
        start_date: v2.start_date,
        end_date: v2.end_date || null,
        procurement_route: v2.procurement_route || null,
        retention_percent: v3.retention_percent ?? 5,
        payment_terms_days: v3.payment_terms_days ?? 30,
        dlp_months: v3.dlp_months ?? 12,
        nec4_option: v3.nec4_option || null,
        contract_administrator: v3.contract_administrator || null,
        contract_administrator_company: v3.contract_administrator_company || null,
        notice_requirements: v3.notice_requirements || null,
        project_lead: v4.project_lead || null,
        commercial_lead: v4.commercial_lead || null,
        site_manager: v4.site_manager || null,
        created_by: user?.id ?? null,
        status: "active",
      };

      const { data, error } = await supabase
        .from("projects")
        .insert(payload)
        .select("id")
        .single();

      if (error) throw error;

      localStorage.removeItem(DRAFT_KEY);
      setCreatedId(data.id);
      setShowSuccess(true);
      toast.success("Project created successfully");
      onSuccess?.(data.id);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create project";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Right panel ───────────────────────────────────────────────────────────
  const rightPanel = (
    <div>
      {v1.name && (
        <SummarySection title="Project Details">
          <SummaryRow label="Name" value={v1.name} />
          <SummaryRow label="Reference" value={v1.reference} />
          <SummaryRow label="Client" value={v1.client_name} />
          <SummaryRow label="Contact" value={v1.client_contact} />
        </SummarySection>
      )}
      {v2.contract_sum > 0 && (
        <SummarySection title="Contract">
          <SummaryRow label="Type" value={v2.contract_type} />
          <SummaryRow label="Sum" value={v2.contract_sum ? `£${Number(v2.contract_sum).toLocaleString()}` : undefined} />
          <SummaryRow label="Start Date" value={v2.start_date} />
          <SummaryRow label="End Date" value={v2.end_date} />
          <SummaryRow label="Procurement" value={v2.procurement_route} />
        </SummarySection>
      )}
      {(v3.retention_percent || v3.payment_terms_days) && (
        <SummarySection title="Commercial">
          <SummaryRow label="Retention" value={v3.retention_percent ? `${v3.retention_percent}%` : undefined} />
          <SummaryRow label="Payment Terms" value={v3.payment_terms_days ? `${v3.payment_terms_days} days` : undefined} />
          <SummaryRow label="DLP" value={v3.dlp_months ? `${v3.dlp_months} months` : undefined} />
          {v3.nec4_option && <SummaryRow label="NEC4 Option" value={v3.nec4_option} />}
          {v3.contract_administrator && <SummaryRow label="Contract Admin" value={v3.contract_administrator} />}
        </SummarySection>
      )}
      {(v4.project_lead || v4.commercial_lead) && (
        <SummarySection title="Team">
          <SummaryRow label="Project Lead" value={v4.project_lead} />
          <SummaryRow label="Commercial Lead" value={v4.commercial_lead} />
          <SummaryRow label="Site Manager" value={v4.site_manager} />
        </SummarySection>
      )}
    </div>
  );

  // ── Success state ─────────────────────────────────────────────────────────
  const successContent = (
    <>
      <div>
        <h3 className="text-[20px] font-700" style={{ color: "var(--text-primary)" }}>
          Project Created!
        </h3>
        <p className="text-[14px] mt-1" style={{ color: "var(--text-secondary)" }}>
          <strong>{v1.name}</strong> has been created successfully.
        </p>
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            if (createdId) router.push(`/app/projects/${createdId}`);
            onClose?.();
          }}
        >
          View Project
        </button>
        {onClose && (
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    </>
  );

  return (
    <WizardShell
      steps={STEPS}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      title="New Project"
      subtitle="Set up a new construction project"
      rightPanel={rightPanel}
      onSaveDraft={saveDraft}
      onClose={onClose}
      isLastStep={currentStep === 4}
      nextLabel={currentStep === 4 ? "Create Project" : undefined}
      isSubmitting={isSubmitting}
      onNext={handleNext}
      showSuccess={showSuccess}
      successContent={successContent}
    >
      {/* ── Step 0: Project Details ── */}
      {currentStep === 0 && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Project Details</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Enter the basic project information.</p>
          </div>

          <div>
            <label className="form-label">Project Name <span style={{ color: "var(--danger)" }}>*</span></label>
            <input
              {...form1.register("name")}
              className="form-input"
              placeholder="e.g. Westfield Tower Block A"
            />
            <FieldError message={form1.formState.errors.name?.message} />
          </div>

          <div>
            <label className="form-label">Project Reference</label>
            <input
              {...form1.register("reference")}
              className="form-input"
              placeholder="e.g. PRJ-2024-001"
            />
          </div>

          <div>
            <label className="form-label">Client Name <span style={{ color: "var(--danger)" }}>*</span></label>
            <input
              {...form1.register("client_name")}
              className="form-input"
              placeholder="e.g. Westfield Developments Ltd"
            />
            <FieldError message={form1.formState.errors.client_name?.message} />
          </div>

          <div>
            <label className="form-label">Client Contact</label>
            <input
              {...form1.register("client_contact")}
              className="form-input"
              placeholder="Name or email"
            />
          </div>
        </div>
      )}

      {/* ── Step 1: Contract ── */}
      {currentStep === 1 && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Contract Details</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Specify the contract terms.</p>
          </div>

          <div>
            <label className="form-label">Contract Type <span style={{ color: "var(--danger)" }}>*</span></label>
            <select {...form2.register("contract_type")} className="form-input">
              <option value="">Select type…</option>
              {CONTRACT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <FieldError message={form2.formState.errors.contract_type?.message} />
          </div>

          <div>
            <label className="form-label">Contract Sum (£) <span style={{ color: "var(--danger)" }}>*</span></label>
            <input
              {...form2.register("contract_sum")}
              type="number"
              className="form-input"
              placeholder="0"
              min="0"
            />
            <FieldError message={form2.formState.errors.contract_sum?.message} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Start Date <span style={{ color: "var(--danger)" }}>*</span></label>
              <input {...form2.register("start_date")} type="date" className="form-input" />
              <FieldError message={form2.formState.errors.start_date?.message} />
            </div>
            <div>
              <label className="form-label">End Date</label>
              <input {...form2.register("end_date")} type="date" className="form-input" />
            </div>
          </div>

          <div>
            <label className="form-label">Procurement Route</label>
            <select {...form2.register("procurement_route")} className="form-input">
              <option value="">Select route…</option>
              {PROCUREMENT_ROUTES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* ── Step 2: Commercial Setup ── */}
      {currentStep === 2 && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Commercial Setup</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Set financial, notice and contract admin terms.</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="form-label">Retention (%)</label>
              <input
                {...form3.register("retention_percent")}
                type="number"
                className="form-input"
                placeholder="5"
                min="0"
                max="100"
                step="0.5"
              />
            </div>
            <div>
              <label className="form-label">Payment Terms (days)</label>
              <input
                {...form3.register("payment_terms_days")}
                type="number"
                className="form-input"
                placeholder="30"
                min="1"
                max="365"
              />
            </div>
            <div>
              <label className="form-label">DLP (months)</label>
              <input
                {...form3.register("dlp_months")}
                type="number"
                className="form-input"
                placeholder="12"
                min="0"
                max="120"
              />
            </div>
          </div>

          {/* NEC4 option — shown only when contract_type starts with NEC4 */}
          {v2.contract_type?.startsWith("NEC4") && (
            <div>
              <label className="form-label">NEC4 Pricing Option</label>
              <select {...form3.register("nec4_option")} className="form-input">
                <option value="">Select NEC4 option…</option>
                {NEC4_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Contract Administrator</label>
              <input
                {...form3.register("contract_administrator")}
                className="form-input"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="form-label">CA Company</label>
              <input
                {...form3.register("contract_administrator_company")}
                className="form-input"
                placeholder="Company name"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Notice Requirements</label>
            <textarea
              {...form3.register("notice_requirements")}
              className="form-input"
              rows={3}
              placeholder="e.g. 7 days written notice for variations…"
            />
          </div>
        </div>
      )}

      {/* ── Step 3: Team ── */}
      {currentStep === 3 && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Team</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Assign key team members to the project.</p>
          </div>

          <div>
            <label className="form-label">Project Lead</label>
            <input {...form4.register("project_lead")} className="form-input" placeholder="Full name" />
          </div>

          <div>
            <label className="form-label">Commercial Lead</label>
            <input {...form4.register("commercial_lead")} className="form-input" placeholder="Full name" />
          </div>

          <div>
            <label className="form-label">Site Manager</label>
            <input {...form4.register("site_manager")} className="form-input" placeholder="Full name" />
          </div>
        </div>
      )}

      {/* ── Step 4: Review ── */}
      {currentStep === 4 && (
        <div className="space-y-6 max-w-lg">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Review & Create</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Check all details before creating the project.</p>
          </div>

          <SummarySection title="Project Details">
            <SummaryRow label="Name" value={v1.name} />
            <SummaryRow label="Reference" value={v1.reference} />
            <SummaryRow label="Client" value={v1.client_name} />
            <SummaryRow label="Client Contact" value={v1.client_contact} />
          </SummarySection>

          <SummarySection title="Contract">
            <SummaryRow label="Type" value={v2.contract_type} />
            <SummaryRow label="Sum" value={`£${Number(v2.contract_sum || 0).toLocaleString()}`} />
            <SummaryRow label="Start Date" value={v2.start_date} />
            <SummaryRow label="End Date" value={v2.end_date} />
            <SummaryRow label="Procurement" value={v2.procurement_route} />
          </SummarySection>

          <SummarySection title="Commercial">
            <SummaryRow label="Retention" value={v3.retention_percent ? `${v3.retention_percent}%` : "5%"} />
            <SummaryRow label="Payment Terms" value={v3.payment_terms_days ? `${v3.payment_terms_days} days` : "30 days"} />
            <SummaryRow label="DLP" value={v3.dlp_months ? `${v3.dlp_months} months` : "12 months"} />
            {v3.nec4_option && <SummaryRow label="NEC4 Option" value={v3.nec4_option} />}
            {v3.contract_administrator && <SummaryRow label="Contract Admin" value={v3.contract_administrator} />}
            <SummaryRow label="Notice Requirements" value={v3.notice_requirements || "—"} />
          </SummarySection>

          <SummarySection title="Team">
            <SummaryRow label="Project Lead" value={v4.project_lead || "—"} />
            <SummaryRow label="Commercial Lead" value={v4.commercial_lead || "—"} />
            <SummaryRow label="Site Manager" value={v4.site_manager || "—"} />
          </SummarySection>

          <div className="rounded-[var(--radius)] p-4 flex gap-3" style={{ background: "var(--info-bg)", border: "1px solid var(--info)" }}>
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--info)" }} />
            <p className="text-[13px]" style={{ color: "var(--info-text)" }}>
              Clicking <strong>Create Project</strong> will add this project to your account. You can edit it at any time.
            </p>
          </div>
        </div>
      )}
    </WizardShell>
  );
}

export default ProjectWizard;

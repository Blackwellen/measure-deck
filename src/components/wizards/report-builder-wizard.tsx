"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { BarChart2, CheckCircle2, FileSpreadsheet, FileText, Loader2, Plus, X } from "lucide-react";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { WizardShell, SummaryRow, SummarySection } from "./wizard-shell";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const step1Schema = z.object({
  report_type: z.string().min(1, "Report type is required"),
  project_id: z.string().optional(),
  period_from: z.string().optional(),
  period_to: z.string().optional(),
});

const step3Schema = z.object({
  output_format: z.enum(["pdf", "excel", "word"]).default("pdf"),
  include_logo: z.boolean().default(true),
  include_charts: z.boolean().default(true),
  confidentiality_level: z.enum(["public", "internal", "confidential", "restricted"]).default("internal"),
  prepared_by: z.string().optional(),
  approved_by: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step3Data = z.infer<typeof step3Schema>;

// ─── Constants ────────────────────────────────────────────────────────────────

const REPORT_TYPES = [
  { id: "cvr_report", label: "CVR Report", icon: BarChart2, description: "Cost Value Reconciliation summary report" },
  { id: "application_schedule", label: "Application Schedule", icon: FileText, description: "Payment application schedule" },
  { id: "ce_register", label: "CE Register", icon: FileText, description: "Change Event register and status" },
  { id: "final_account_summary", label: "Final Account Summary", icon: FileSpreadsheet, description: "Final account settlement summary" },
  { id: "progress_report", label: "Progress Report", icon: BarChart2, description: "Construction progress report" },
  { id: "board_report", label: "Board Report", icon: BarChart2, description: "Executive-level board report" },
];

const DEFAULT_SECTIONS = [
  { id: "executive_summary", label: "Executive Summary", checked: true },
  { id: "kpi_dashboard", label: "KPI Dashboard", checked: true },
  { id: "financial_position", label: "Financial Position", checked: true },
  { id: "change_events", label: "Change Events", checked: false },
  { id: "risk_register", label: "Risk Register", checked: false },
  { id: "programme_update", label: "Programme Update", checked: false },
  { id: "cash_flow", label: "Cash Flow", checked: false },
  { id: "subcontract_summary", label: "Subcontract Summary", checked: false },
];

const STEPS = [
  { id: "type", label: "Report Type" },
  { id: "content", label: "Content" },
  { id: "branding", label: "Branding & Format" },
  { id: "generate", label: "Generate" },
];

const CONFIDENTIALITY_LABELS: Record<string, string> = {
  public: "Public",
  internal: "Internal",
  confidential: "Confidential",
  restricted: "Restricted",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[12px] mt-1" style={{ color: "var(--danger)" }}>{message}</p>;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ReportBuilderWizardProps {
  onClose?: () => void;
  onSuccess?: (id: string) => void;
  defaultProjectId?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ReportBuilderWizard({ onClose, onSuccess, defaultProjectId }: ReportBuilderWizardProps) {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);
  const [createdId, setCreatedId] = React.useState<string | null>(null);
  const [projects, setProjects] = React.useState<{ id: string; name: string }[]>([]);
  const [sections, setSections] = React.useState(DEFAULT_SECTIONS);
  const [customSection, setCustomSection] = React.useState("");
  const [generating, setGenerating] = React.useState(false);

  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { project_id: defaultProjectId ?? "" },
  });
  const form3 = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: { output_format: "pdf", include_logo: true, include_charts: true, confidentiality_level: "internal" },
  });

  const v1 = form1.watch();
  const v3 = form3.watch();

  const selectedType = REPORT_TYPES.find((t) => t.id === v1.report_type);
  const selectedSections = sections.filter((s) => s.checked);

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

  const toggleSection = (id: string) => {
    setSections((prev) => prev.map((s) => s.id === id ? { ...s, checked: !s.checked } : s));
  };

  const addCustomSection = () => {
    if (!customSection.trim()) return;
    setSections((prev) => [...prev, { id: `custom_${Date.now()}`, label: customSection.trim(), checked: true }]);
    setCustomSection("");
  };

  const removeSection = (id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  };

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleNext = async (): Promise<boolean> => {
    if (currentStep === 0) return form1.trigger();
    if (currentStep === 1) {
      if (selectedSections.length === 0) { toast.error("Select at least one section"); return false; }
      return true;
    }
    if (currentStep === 2) return form3.trigger();
    if (currentStep === 3) { await handleGenerate(); return false; }
    return true;
  };

  // ── Generate ──────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    setIsSubmitting(true);
    setGenerating(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase.from("reports").insert({
        report_type: v1.report_type,
        project_id: v1.project_id || null,
        period_from: v1.period_from || null,
        period_to: v1.period_to || null,
        sections: selectedSections.map((s) => s.id),
        output_format: v3.output_format,
        include_logo: v3.include_logo,
        include_charts: v3.include_charts,
        confidentiality_level: v3.confidentiality_level,
        prepared_by: v3.prepared_by || null,
        approved_by: v3.approved_by || null,
        status: "generating",
        created_by: user?.id ?? null,
      }).select("id").single();

      if (error) throw error;
      setCreatedId(data.id);
      setShowSuccess(true);
      toast.success("Report queued for generation");
      onSuccess?.(data.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to generate report");
    } finally {
      setIsSubmitting(false);
      setGenerating(false);
    }
  };

  // ── Right panel ───────────────────────────────────────────────────────────
  const rightPanel = (
    <div>
      {selectedType && (
        <SummarySection title="Report">
          <SummaryRow label="Type" value={selectedType.label} />
          <SummaryRow label="Project" value={v1.project_id ? (projects.find((p) => p.id === v1.project_id)?.name ?? "—") : "All Projects"} />
          <SummaryRow label="Period From" value={v1.period_from} />
          <SummaryRow label="Period To" value={v1.period_to} />
        </SummarySection>
      )}
      {selectedSections.length > 0 && (
        <SummarySection title="Sections">
          <SummaryRow label="Count" value={`${selectedSections.length} sections`} />
          <SummaryRow label="Sections" value={selectedSections.map((s) => s.label).join(", ")} />
        </SummarySection>
      )}
      {v3.output_format && (
        <SummarySection title="Format">
          <SummaryRow label="Output" value={v3.output_format.toUpperCase()} />
          <SummaryRow label="Confidentiality" value={CONFIDENTIALITY_LABELS[v3.confidentiality_level]} />
        </SummarySection>
      )}
    </div>
  );

  const successContent = (
    <>
      <div>
        <h3 className="text-[20px] font-700" style={{ color: "var(--text-primary)" }}>Report Generation Started!</h3>
        <p className="text-[14px] mt-1" style={{ color: "var(--text-secondary)" }}>
          Your <strong>{selectedType?.label}</strong> report is being generated. You will be notified when it is ready.
        </p>
        <p className="text-[12px] mt-2" style={{ color: "var(--text-muted)" }}>
          Report ID: {createdId}
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
      title="Report Builder"
      subtitle="Configure and generate a commercial report"
      rightPanel={rightPanel}
      onClose={onClose}
      isLastStep={currentStep === 3}
      nextLabel={currentStep === 3 ? "Generate Report" : undefined}
      isSubmitting={isSubmitting}
      onNext={handleNext}
      showSuccess={showSuccess}
      successContent={successContent}
    >
      {/* ── Step 0: Report Type ── */}
      {currentStep === 0 && (
        <div className="space-y-5">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Select Report Type</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Choose the type of report to generate.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {REPORT_TYPES.map((rt) => {
              const Icon = rt.icon;
              const isSelected = v1.report_type === rt.id;
              return (
                <button
                  key={rt.id}
                  type="button"
                  onClick={() => form1.setValue("report_type", rt.id, { shouldValidate: true })}
                  className={cn(
                    "text-left rounded-xl border p-4 transition-all",
                    isSelected ? "border-[var(--primary)] bg-[var(--primary-bg)]" : "hover:border-[var(--primary)]"
                  )}
                  style={{ borderColor: isSelected ? "var(--primary)" : "var(--border)" }}
                >
                  <Icon className="w-5 h-5 mb-2" style={{ color: isSelected ? "var(--primary)" : "var(--text-muted)" }} />
                  <p className="text-[13px] font-600" style={{ color: "var(--text-primary)" }}>{rt.label}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{rt.description}</p>
                </button>
              );
            })}
          </div>
          <FieldError message={form1.formState.errors.report_type?.message} />
          <div className="grid grid-cols-2 gap-4 max-w-lg">
            <div>
              <label className="form-label">Project</label>
              <select {...form1.register("project_id")} className="form-input">
                <option value="">All Projects</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div />
            <div>
              <label className="form-label">Period From</label>
              <input {...form1.register("period_from")} type="date" className="form-input" />
            </div>
            <div>
              <label className="form-label">Period To</label>
              <input {...form1.register("period_to")} type="date" className="form-input" />
            </div>
          </div>
        </div>
      )}

      {/* ── Step 1: Content Selection ── */}
      {currentStep === 1 && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Content Selection</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Choose which sections to include in the report.</p>
          </div>
          <div className="space-y-2">
            {sections.map((section) => (
              <div
                key={section.id}
                className="flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer"
                style={{ borderColor: section.checked ? "var(--primary)" : "var(--border)", background: section.checked ? "var(--primary-bg)" : "var(--bg-surface)" }}
                onClick={() => toggleSection(section.id)}
              >
                <div className={cn(
                  "w-4 h-4 rounded border-2 flex-shrink-0 transition-colors",
                  section.checked ? "bg-[var(--primary)] border-[var(--primary)]" : "border-[var(--border)]"
                )} />
                <span className="text-[13px] font-500 flex-1" style={{ color: "var(--text-primary)" }}>{section.label}</span>
                {section.id.startsWith("custom_") && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}
                    className="btn btn-ghost btn-icon btn-sm"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={customSection}
              onChange={(e) => setCustomSection(e.target.value)}
              className="form-input flex-1"
              placeholder="Add custom section…"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomSection(); } }}
            />
            <button type="button" onClick={addCustomSection} className="btn btn-secondary btn-sm flex-shrink-0">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Branding & Format ── */}
      {currentStep === 2 && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Branding & Format</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Configure output format and report options.</p>
          </div>
          <div>
            <label className="form-label">Output Format</label>
            <div className="flex gap-3">
              {(["pdf", "excel", "word"] as const).map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => form3.setValue("output_format", fmt)}
                  className={cn("btn flex-1", v3.output_format === fmt ? "btn-primary" : "btn-secondary")}
                >
                  {fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" {...form3.register("include_logo")} className="w-4 h-4 rounded" />
              <span className="text-[13px]" style={{ color: "var(--text-primary)" }}>Include company logo</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" {...form3.register("include_charts")} className="w-4 h-4 rounded" />
              <span className="text-[13px]" style={{ color: "var(--text-primary)" }}>Include charts & graphs</span>
            </label>
          </div>
          <div>
            <label className="form-label">Confidentiality Level</label>
            <select {...form3.register("confidentiality_level")} className="form-input">
              <option value="public">Public</option>
              <option value="internal">Internal</option>
              <option value="confidential">Confidential</option>
              <option value="restricted">Restricted</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Prepared By</label>
              <input {...form3.register("prepared_by")} className="form-input" placeholder="Full name" />
            </div>
            <div>
              <label className="form-label">Approved By</label>
              <input {...form3.register("approved_by")} className="form-input" placeholder="Full name" />
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Generate ── */}
      {currentStep === 3 && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Ready to Generate</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Review your report configuration before generating.</p>
          </div>
          <SummarySection title="Report Structure Preview">
            <SummaryRow label="Type" value={selectedType?.label} />
            <SummaryRow label="Format" value={v3.output_format?.toUpperCase()} />
            <SummaryRow label="Sections" value={`${selectedSections.length} sections`} />
            <SummaryRow label="Confidentiality" value={CONFIDENTIALITY_LABELS[v3.confidentiality_level]} />
            {v3.prepared_by && <SummaryRow label="Prepared By" value={v3.prepared_by} />}
            {v3.approved_by && <SummaryRow label="Approved By" value={v3.approved_by} />}
          </SummarySection>
          <div className="space-y-1.5">
            <p className="text-[12px] font-600" style={{ color: "var(--text-secondary)" }}>Sections to include:</p>
            {selectedSections.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--success)" }} />
                <span className="text-[13px]" style={{ color: "var(--text-primary)" }}>{s.label}</span>
              </div>
            ))}
          </div>
          {generating && (
            <div className="flex items-center gap-3 p-4 rounded-xl border" style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}>
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--primary)" }} />
              <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>Generating report…</span>
            </div>
          )}
        </div>
      )}
    </WizardShell>
  );
}

export default ReportBuilderWizard;

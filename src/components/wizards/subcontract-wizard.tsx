"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, CheckCircle, FileText, Package } from "lucide-react";
import { toast } from "sonner";
import { createBrowserClient } from "@supabase/ssr";
import { WizardShell, SummaryRow, SummarySection } from "@/components/wizards/wizard-shell";
import { createAuditEvent } from "@/lib/audit";
import { getWorkspaceId } from "@/lib/workspace";
import { uploadFile } from "@/lib/storage";
import { formatCurrency, formatDate } from "@/lib/utils";

/* ─── Types ──────────────────────────────────────────────────────── */

interface SupplierOption {
  id: string;
  name: string;
  cis_registered: boolean;
  compliance_status: string;
  ch_verified: boolean;
}

interface ProjectOption {
  id: string;
  name: string;
}

type ContractType = "NEC4" | "JCT" | "Bespoke";

interface WizardFormData {
  supplier_id: string;
  supplier_name: string;
  supplier_cis_registered: boolean;
  supplier_compliance_status: string;
  project_id: string;
  project_name: string;
  description: string;
  scope_summary: string;
  contract_sum: string;
  retention_rate: string;
  payment_terms: string;
  contract_type: ContractType | "";
  start_date: string;
  end_date: string;
  draft_doc: File | null;
  sor_doc: File | null;
}

const EMPTY_FORM: WizardFormData = {
  supplier_id: "",
  supplier_name: "",
  supplier_cis_registered: false,
  supplier_compliance_status: "",
  project_id: "",
  project_name: "",
  description: "",
  scope_summary: "",
  contract_sum: "",
  retention_rate: "3",
  payment_terms: "30",
  contract_type: "",
  start_date: "",
  end_date: "",
  draft_doc: null,
  sor_doc: null,
};

const SEED_SUPPLIERS: SupplierOption[] = [
  { id: "sup-001", name: "Apex Groundworks Ltd", cis_registered: true, compliance_status: "Compliant", ch_verified: true },
  { id: "sup-002", name: "BrightBuild Materials", cis_registered: false, compliance_status: "Compliant", ch_verified: true },
  { id: "sup-003", name: "CraneKing Plant Hire", cis_registered: true, compliance_status: "Expiring Soon", ch_verified: false },
  { id: "sup-004", name: "Delta Electrical Specialists", cis_registered: false, compliance_status: "Non-Compliant", ch_verified: false },
  { id: "sup-007", name: "Grove Structural Steel", cis_registered: true, compliance_status: "Compliant", ch_verified: true },
];

const SEED_PROJECTS: ProjectOption[] = [
  { id: "proj-001", name: "Thornfield Commercial Hub" },
  { id: "proj-002", name: "Eastside Residential Block A" },
  { id: "proj-003", name: "Waterfront Apartments" },
  { id: "proj-004", name: "Office Block Phase 2" },
];

const WIZARD_STEPS = [
  { id: "supplier",   label: "Supplier",       description: "Select a supplier" },
  { id: "project",    label: "Project & Scope", description: "Link project and describe scope" },
  { id: "commercial", label: "Commercial",      description: "Contract terms and values" },
  { id: "documents",  label: "Documents",       description: "Attach relevant documents" },
  { id: "review",     label: "Review & Issue",  description: "Confirm and issue order" },
];

/* ─── Helpers ────────────────────────────────────────────────────── */

function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(Math.random() * 9000) + 1000;
  return `SC-${year}-${String(seq).padStart(4, "0")}`;
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-1.5">
      {children} {required && <span className="text-[var(--danger)]">*</span>}
    </label>
  );
}

function FormGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-1">{children}</div>;
}

/* ─── Step components ─────────────────────────────────────────────── */

function StepSupplier({
  form,
  onChange,
}: {
  form: WizardFormData;
  onChange: (updates: Partial<WizardFormData>) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = SEED_SUPPLIERS.filter((s) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase())
  );

  function select(s: SupplierOption) {
    onChange({
      supplier_id: s.id,
      supplier_name: s.name,
      supplier_cis_registered: s.cis_registered,
      supplier_compliance_status: s.compliance_status,
    });
  }

  const selected = SEED_SUPPLIERS.find((s) => s.id === form.supplier_id);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-base font-semibold mb-1">Select Supplier</h3>
        <p className="text-sm text-[var(--text-muted)]">Choose the subcontractor for this order.</p>
      </div>

      <div className="relative">
        <input
          type="search"
          placeholder="Search suppliers…"
          className="form-input w-full"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
        {filtered.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => select(s)}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              form.supplier_id === s.id
                ? "border-[var(--primary)] bg-[var(--primary-light)]"
                : "border-[var(--border)] bg-white hover:border-[var(--primary-light)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{s.name}</p>
                <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-muted)]">
                  <span>{s.cis_registered ? "CIS Registered" : "No CIS"}</span>
                  <span>·</span>
                  <span className={
                    s.compliance_status === "Compliant" ? "text-[#15803D]" :
                    s.compliance_status === "Expiring Soon" ? "text-[#D97706]" :
                    s.compliance_status === "Non-Compliant" ? "text-[#DC2626]" : "text-gray-500"
                  }>{s.compliance_status}</span>
                  {!s.ch_verified && <span className="text-[#D97706]">· Unverified</span>}
                </div>
              </div>
              {form.supplier_id === s.id && <CheckCircle size={16} className="text-[var(--primary)] flex-shrink-0" />}
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-[var(--text-muted)] text-center py-4">No suppliers found</p>
        )}
      </div>

      {selected && selected.compliance_status !== "Compliant" && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-[#FEF9C3] border border-[#FDE047]">
          <AlertTriangle size={14} className="text-[#D97706] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#92400E]">
            This supplier has compliance status: <strong>{selected.compliance_status}</strong>. Review their compliance before issuing.
          </p>
        </div>
      )}

      {selected && !selected.ch_verified && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-[#FEF9C3] border border-[#FDE047]">
          <AlertTriangle size={14} className="text-[#D97706] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-[#92400E]">
            This supplier has not been verified via Companies House. Consider running a KYC check first.
          </p>
        </div>
      )}
    </div>
  );
}

function StepProject({
  form,
  onChange,
}: {
  form: WizardFormData;
  onChange: (updates: Partial<WizardFormData>) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-base font-semibold mb-1">Project &amp; Scope</h3>
        <p className="text-sm text-[var(--text-muted)]">Link this subcontract to a project and describe the scope of works.</p>
      </div>

      <FormGroup>
        <FieldLabel required>Project</FieldLabel>
        <select
          className="form-input"
          value={form.project_id}
          onChange={(e) => {
            const proj = SEED_PROJECTS.find((p) => p.id === e.target.value);
            onChange({ project_id: e.target.value, project_name: proj?.name ?? "" });
          }}
        >
          <option value="">Select a project…</option>
          {SEED_PROJECTS.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </FormGroup>

      <FormGroup>
        <FieldLabel required>Order Description</FieldLabel>
        <input
          type="text"
          className="form-input"
          placeholder="e.g. Groundworks Package — Phase 1"
          value={form.description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </FormGroup>

      <FormGroup>
        <FieldLabel>Scope of Works Summary</FieldLabel>
        <textarea
          className="form-input resize-none"
          rows={5}
          placeholder="Describe the works covered by this subcontract order…"
          value={form.scope_summary}
          onChange={(e) => onChange({ scope_summary: e.target.value })}
        />
      </FormGroup>
    </div>
  );
}

function StepCommercial({
  form,
  onChange,
}: {
  form: WizardFormData;
  onChange: (updates: Partial<WizardFormData>) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-base font-semibold mb-1">Commercial Terms</h3>
        <p className="text-sm text-[var(--text-muted)]">Set contract sum, retention, payment terms and dates.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormGroup>
          <FieldLabel required>Contract Sum (£)</FieldLabel>
          <input
            type="number"
            className="form-input"
            placeholder="0"
            min="0"
            step="1"
            value={form.contract_sum}
            onChange={(e) => onChange({ contract_sum: e.target.value })}
          />
        </FormGroup>

        <FormGroup>
          <FieldLabel required>Retention Rate (%)</FieldLabel>
          <input
            type="number"
            className="form-input"
            placeholder="3"
            min="0"
            max="100"
            step="0.5"
            value={form.retention_rate}
            onChange={(e) => onChange({ retention_rate: e.target.value })}
          />
        </FormGroup>

        <FormGroup>
          <FieldLabel required>Payment Terms (days)</FieldLabel>
          <input
            type="number"
            className="form-input"
            placeholder="30"
            min="0"
            max="120"
            value={form.payment_terms}
            onChange={(e) => onChange({ payment_terms: e.target.value })}
          />
        </FormGroup>

        <FormGroup>
          <FieldLabel required>Contract Type</FieldLabel>
          <select
            className="form-input"
            value={form.contract_type}
            onChange={(e) => onChange({ contract_type: e.target.value as ContractType })}
          >
            <option value="">Select type…</option>
            <option value="NEC4">NEC4</option>
            <option value="JCT">JCT</option>
            <option value="Bespoke">Bespoke</option>
          </select>
        </FormGroup>

        <FormGroup>
          <FieldLabel required>Start Date</FieldLabel>
          <input
            type="date"
            className="form-input"
            value={form.start_date}
            onChange={(e) => onChange({ start_date: e.target.value })}
          />
        </FormGroup>

        <FormGroup>
          <FieldLabel>End Date</FieldLabel>
          <input
            type="date"
            className="form-input"
            value={form.end_date}
            onChange={(e) => onChange({ end_date: e.target.value })}
          />
        </FormGroup>
      </div>

      {form.contract_sum && (
        <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border)]">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-2">Retention Preview</p>
          <div className="flex items-center justify-between text-sm">
            <span>Retention at {form.retention_rate}%</span>
            <span className="font-semibold text-[#D97706]">
              {formatCurrency((parseFloat(form.contract_sum) || 0) * (parseFloat(form.retention_rate) || 0) / 100)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function StepDocuments({
  form,
  onChange,
}: {
  form: WizardFormData;
  onChange: (updates: Partial<WizardFormData>) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-base font-semibold mb-1">Supporting Documents</h3>
        <p className="text-sm text-[var(--text-muted)]">Attach the subcontract order and schedule of rates (optional).</p>
      </div>

      {(
        [
          { key: "draft_doc" as const, label: "Draft Subcontract", hint: "PDF of the signed or draft subcontract order" },
          { key: "sor_doc" as const, label: "Schedule of Rates", hint: "Pricing schedule or bill of quantities" },
        ] as { key: keyof Pick<WizardFormData, "draft_doc" | "sor_doc">; label: string; hint: string }[]
      ).map(({ key, label, hint }) => (
        <div key={key} className="p-4 rounded-xl border border-dashed border-[var(--border)] bg-[var(--bg-subtle)]">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="text-sm font-medium">{label}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{hint}</p>
            </div>
            {form[key] && (
              <button
                type="button"
                className="text-xs text-[var(--danger)] hover:underline"
                onClick={() => onChange({ [key]: null })}
              >
                Remove
              </button>
            )}
          </div>
          {form[key] ? (
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mt-2">
              <FileText size={13} />
              <span>{(form[key] as File).name}</span>
            </div>
          ) : (
            <label className="btn btn-secondary btn-sm mt-2 cursor-pointer">
              <FileText size={13} />
              Choose file
              <input
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  onChange({ [key]: file });
                }}
              />
            </label>
          )}
        </div>
      ))}
    </div>
  );
}

function StepReview({
  form,
  orderNumber,
}: {
  form: WizardFormData;
  orderNumber: string;
}) {
  const contractSum = parseFloat(form.contract_sum) || 0;
  const retentionRate = parseFloat(form.retention_rate) || 0;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-base font-semibold mb-1">Review &amp; Issue</h3>
        <p className="text-sm text-[var(--text-muted)]">Review the subcontract details before issuing. This will create the order record.</p>
      </div>

      <div className="p-4 rounded-xl border border-[var(--primary)] bg-[var(--primary-light)]">
        <div className="flex items-center gap-2">
          <Package size={16} className="text-[var(--primary)]" />
          <div>
            <p className="text-xs text-[var(--text-muted)]">Order Number (auto-generated)</p>
            <p className="text-base font-bold font-mono text-[var(--primary)]">{orderNumber}</p>
          </div>
        </div>
      </div>

      <SummarySection title="Supplier">
        <SummaryRow label="Company" value={form.supplier_name} />
        <SummaryRow label="CIS Registered" value={form.supplier_cis_registered ? "Yes" : "No"} />
        <SummaryRow label="Compliance Status" value={form.supplier_compliance_status} />
      </SummarySection>

      <SummarySection title="Project & Scope">
        <SummaryRow label="Project" value={form.project_name} />
        <SummaryRow label="Description" value={form.description} />
        {form.scope_summary && <SummaryRow label="Scope" value={form.scope_summary} />}
      </SummarySection>

      <SummarySection title="Commercial Terms">
        <SummaryRow label="Contract Sum" value={formatCurrency(contractSum)} />
        <SummaryRow label="Retention Rate" value={`${retentionRate}%`} />
        <SummaryRow label="Retention Amount" value={formatCurrency(contractSum * retentionRate / 100)} />
        <SummaryRow label="Payment Terms" value={`${form.payment_terms} days`} />
        <SummaryRow label="Contract Type" value={form.contract_type} />
        <SummaryRow label="Start Date" value={formatDate(form.start_date)} />
        {form.end_date && <SummaryRow label="End Date" value={formatDate(form.end_date)} />}
      </SummarySection>

      {(form.draft_doc || form.sor_doc) && (
        <SummarySection title="Documents">
          {form.draft_doc && <SummaryRow label="Draft Subcontract" value={(form.draft_doc as File).name} />}
          {form.sor_doc && <SummaryRow label="Schedule of Rates" value={(form.sor_doc as File).name} />}
        </SummarySection>
      )}
    </div>
  );
}

/* ─── Main wizard ─────────────────────────────────────────────────── */

interface SubcontractWizardProps {
  onClose: () => void;
  initialSupplierId?: string;
  initialSupplierName?: string;
}

export function SubcontractWizard({ onClose, initialSupplierId, initialSupplierName }: SubcontractWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<WizardFormData>({
    ...EMPTY_FORM,
    supplier_id: initialSupplierId ?? "",
    supplier_name: initialSupplierName ?? "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [orderNumber] = useState(() => generateOrderNumber());

  const updateForm = useCallback((updates: Partial<WizardFormData>) => {
    setForm((prev) => ({ ...prev, ...updates }));
  }, []);

  const formDataForDraft: Record<string, unknown> = {
    supplier_id: form.supplier_id,
    supplier_name: form.supplier_name,
    project_id: form.project_id,
    project_name: form.project_name,
    description: form.description,
    scope_summary: form.scope_summary,
    contract_sum: form.contract_sum,
    retention_rate: form.retention_rate,
    payment_terms: form.payment_terms,
    contract_type: form.contract_type,
    start_date: form.start_date,
    end_date: form.end_date,
  };

  async function handleNext(): Promise<boolean> {
    if (step === 0 && !form.supplier_id) {
      toast.error("Please select a supplier");
      return false;
    }
    if (step === 1 && (!form.project_id || !form.description.trim())) {
      toast.error("Please select a project and enter a description");
      return false;
    }
    if (step === 2 && (!form.contract_sum || !form.contract_type || !form.start_date)) {
      toast.error("Please complete all required commercial fields");
      return false;
    }
    if (step === 4) {
      return handleIssue();
    }
    return true;
  }

  async function handleIssue(): Promise<boolean> {
    setIsSubmitting(true);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const workspaceId = await getWorkspaceId(supabase);

      const { data: newOrder, error } = await supabase
        .from("subcontract_orders")
        .insert({
          workspace_id: workspaceId,
          order_number: orderNumber,
          supplier_id: form.supplier_id,
          project_id: form.project_id,
          description: form.description,
          scope_summary: form.scope_summary || null,
          contract_sum: parseFloat(form.contract_sum),
          retention_rate: parseFloat(form.retention_rate),
          payment_terms_days: parseInt(form.payment_terms, 10),
          contract_type: form.contract_type,
          start_date: form.start_date,
          end_date: form.end_date || null,
          status: "issued",
          created_by: user.id,
        })
        .select("id")
        .single();

      if (error) throw error;
      if (!newOrder) throw new Error("No order returned");

      const documentUploads: Promise<void>[] = [];

      if (form.draft_doc) {
        documentUploads.push(
          uploadFile(supabase, {
            bucket: "project-media",
            path: `subcontracts/${newOrder.id}/draft-subcontract-${Date.now()}`,
            file: form.draft_doc,
          }).then(() => undefined)
        );
      }

      if (form.sor_doc) {
        documentUploads.push(
          uploadFile(supabase, {
            bucket: "project-media",
            path: `subcontracts/${newOrder.id}/schedule-of-rates-${Date.now()}`,
            file: form.sor_doc,
          }).then(() => undefined)
        );
      }

      await Promise.allSettled(documentUploads);

      await createAuditEvent(supabase, {
        workspace_id: workspaceId,
        user_id: user.id,
        action: "subcontract_issued",
        resource_type: "subcontract_orders",
        resource_id: newOrder.id,
        new_values: {
          order_number: orderNumber,
          supplier_id: form.supplier_id,
          contract_sum: parseFloat(form.contract_sum),
        },
      });

      setCreatedId(newOrder.id);
      setShowSuccess(true);
      toast.success(`Subcontract ${orderNumber} issued`);
      return false;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to issue subcontract";
      toast.error(msg);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }

  const stepContent = [
    <StepSupplier key="supplier" form={form} onChange={updateForm} />,
    <StepProject key="project" form={form} onChange={updateForm} />,
    <StepCommercial key="commercial" form={form} onChange={updateForm} />,
    <StepDocuments key="documents" form={form} onChange={updateForm} />,
    <StepReview key="review" form={form} orderNumber={orderNumber} />,
  ];

  const rightPanel = (
    <div>
      <SummarySection title="Order Summary">
        <SummaryRow label="Order No." value={orderNumber} />
        {form.supplier_name && <SummaryRow label="Supplier" value={form.supplier_name} />}
        {form.project_name && <SummaryRow label="Project" value={form.project_name} />}
        {form.description && <SummaryRow label="Description" value={form.description} />}
        {form.contract_sum && <SummaryRow label="Contract Sum" value={formatCurrency(parseFloat(form.contract_sum) || 0)} />}
        {form.retention_rate && form.contract_sum && (
          <SummaryRow
            label="Retention"
            value={`${form.retention_rate}% = ${formatCurrency((parseFloat(form.contract_sum) || 0) * (parseFloat(form.retention_rate) || 0) / 100)}`}
          />
        )}
        {form.contract_type && <SummaryRow label="Contract Type" value={form.contract_type} />}
        {form.start_date && <SummaryRow label="Start" value={formatDate(form.start_date)} />}
      </SummarySection>
    </div>
  );

  const successContent = (
    <div className="flex flex-col items-center gap-4">
      <h3 className="text-xl font-bold">Subcontract Issued</h3>
      <p className="text-[var(--text-muted)] text-sm">
        Order <strong className="font-mono">{orderNumber}</strong> has been created and issued to <strong>{form.supplier_name}</strong>.
      </p>
      <div className="flex gap-3">
        <button
          className="btn btn-primary btn-sm"
          onClick={() => {
            if (createdId) router.push(`/app/subcontracts/${createdId}`);
            onClose();
          }}
        >
          View Order
        </button>
        <button className="btn btn-secondary btn-sm" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );

  return (
    <WizardShell
      title="New Subcontract Order"
      subtitle="Create a subcontract order for a supplier"
      steps={WIZARD_STEPS}
      currentStep={step}
      onStepChange={setStep}
      onClose={onClose}
      onNext={handleNext}
      isLastStep={step === 4}
      nextLabel={step === 4 ? "Issue Subcontract" : undefined}
      isSubmitting={isSubmitting}
      showSuccess={showSuccess}
      successContent={successContent}
      rightPanel={rightPanel}
      showRightPanel
      wizardId="subcontract-wizard"
      formData={formDataForDraft}
      onDraftResume={(savedStep, savedData) => {
        setStep(savedStep);
        setForm((prev) => ({ ...prev, ...savedData }));
      }}
    >
      {stepContent[step]}
    </WizardShell>
  );
}

"use client";

import { createClient } from "@/lib/supabase/client";
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
  name: z.string().min(2, "Company name is required"),
  trading_name: z.string().optional(),
  company_number: z.string().optional(),
  vat_number: z.string().optional(),
  address_line_1: z.string().optional(),
  address_line_2: z.string().optional(),
  city: z.string().optional(),
  postcode: z.string().optional(),
  country: z.string().default("United Kingdom"),
  website: z.string().optional(),
  status: z.string().default("active"),
});

const contactSchema = z.object({
  first_name: z.string().min(1, "First name required"),
  last_name: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  role: z.string().optional(),
  is_primary: z.boolean().default(false),
});

const step2Schema = z.object({
  contacts: z.array(contactSchema).min(1, "At least one contact is required"),
});

const serviceSchema = z.object({
  service: z.string().min(1, "Service required"),
  trade: z.string().optional(),
  notes: z.string().optional(),
});

const step3Schema = z.object({
  services: z.array(serviceSchema),
  insurance_expiry: z.string().optional(),
  accreditations: z.string().optional(),
  payment_terms: z.string().optional(),
  notes: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

const SUPPLIER_STATUS = ["active", "pending", "inactive", "blacklisted"];
const SERVICES = [
  "Groundworks", "Concrete Structures", "Steelwork", "Brickwork / Masonry",
  "Roofing", "Cladding / Facades", "MEP - Mechanical", "MEP - Electrical",
  "MEP - Plumbing", "Fit-Out / Joinery", "Painting & Decorating",
  "Piling", "Drainage", "Landscaping", "Temporary Works", "Plant Hire",
  "Scaffolding", "Demolition", "Surveying", "Other",
];

const STEPS = [
  { id: "company", label: "Company" },
  { id: "contacts", label: "Contacts" },
  { id: "services", label: "Services" },
  { id: "review", label: "Review" },
];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[12px] mt-1" style={{ color: "var(--danger)" }}>{message}</p>;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface SupplierWizardProps {
  onClose?: () => void;
  onSuccess?: (id: string) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function SupplierWizard({ onClose, onSuccess }: SupplierWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { country: "United Kingdom", status: "active" },
  });
  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { contacts: [{ first_name: "", is_primary: true }] },
  });
  const form3 = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: { services: [] },
  });

  const {
    fields: contactFields,
    append: addContact,
    remove: removeContact,
  } = useFieldArray({ control: form2.control, name: "contacts" });

  const {
    fields: serviceFields,
    append: addService,
    remove: removeService,
  } = useFieldArray({ control: form3.control, name: "services" });

  const v1 = form1.watch();
  const v2 = form2.watch();
  const v3 = form3.watch();

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

      const { data: supplier, error: supplierError } = await supabase
        .from("suppliers")
        .insert({
          name: v1.name,
          trading_name: v1.trading_name || null,
          company_number: v1.company_number || null,
          vat_number: v1.vat_number || null,
          address_line_1: v1.address_line_1 || null,
          address_line_2: v1.address_line_2 || null,
          city: v1.city || null,
          postcode: v1.postcode || null,
          country: v1.country,
          website: v1.website || null,
          status: v1.status,
          insurance_expiry: v3.insurance_expiry || null,
          accreditations: v3.accreditations || null,
          payment_terms: v3.payment_terms || null,
          services: v3.services.map((s) => s.service),
          notes: v3.notes || null,
          created_by: user?.id ?? null,
        })
        .select("id")
        .single();

      if (supplierError) throw supplierError;

      if (v2.contacts.length > 0) {
        await supabase.from("contacts").insert(
          v2.contacts.map((c) => ({
            supplier_id: supplier.id,
            first_name: c.first_name,
            last_name: c.last_name || null,
            email: c.email || null,
            phone: c.phone || null,
            role: c.role || null,
            is_primary: c.is_primary,
          }))
        );
      }

      setCreatedId(supplier.id);
      setShowSuccess(true);
      toast.success("Supplier created");
      onSuccess?.(supplier.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create supplier");
    } finally {
      setIsSubmitting(false);
    }
  };

  const rightPanel = (
    <div>
      {v1.name && (
        <SummarySection title="Company">
          <SummaryRow label="Name" value={v1.name} />
          <SummaryRow label="Trading As" value={v1.trading_name} />
          <SummaryRow label="Company No." value={v1.company_number} />
          <SummaryRow label="Status" value={v1.status} />
        </SummarySection>
      )}
      {v2.contacts?.[0]?.first_name && (
        <SummarySection title="Primary Contact">
          <SummaryRow label="Name" value={`${v2.contacts[0].first_name} ${v2.contacts[0].last_name ?? ""}`.trim()} />
          <SummaryRow label="Email" value={v2.contacts[0].email} />
          <SummaryRow label="Phone" value={v2.contacts[0].phone} />
        </SummarySection>
      )}
      {v3.services?.length > 0 && (
        <SummarySection title="Services">
          <SummaryRow label="Count" value={`${v3.services.length} service(s)`} />
        </SummarySection>
      )}
    </div>
  );

  const successContent = (
    <>
      <div>
        <h3 className="text-[20px] font-700" style={{ color: "var(--text-primary)" }}>Supplier Added!</h3>
        <p className="text-[14px] mt-1" style={{ color: "var(--text-secondary)" }}>
          <strong>{v1.name}</strong> has been added to your supplier network.
        </p>
      </div>
      <div className="flex gap-3">
        <button type="button" className="btn btn-primary" onClick={() => { if (createdId) router.push(`/app/suppliers/${createdId}`); onClose?.(); }}>
          View Supplier
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
      title="Add Supplier"
      subtitle="Register a new supplier or subcontractor"
      rightPanel={rightPanel}
      onClose={onClose}
      isLastStep={currentStep === 3}
      nextLabel={currentStep === 3 ? "Create Supplier" : undefined}
      isSubmitting={isSubmitting}
      onNext={handleNext}
      showSuccess={showSuccess}
      successContent={successContent}
    >
      {/* Step 0: Company */}
      {currentStep === 0 && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Company Details</h3>
          </div>
          <div>
            <label className="form-label">Company Name <span style={{ color: "var(--danger)" }}>*</span></label>
            <input {...form1.register("name")} className="form-input" placeholder="e.g. Apex Groundworks Ltd" />
            <FieldError message={form1.formState.errors.name?.message} />
          </div>
          <div>
            <label className="form-label">Trading Name</label>
            <input {...form1.register("trading_name")} className="form-input" placeholder="If different from registered name" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Company Number</label>
              <input {...form1.register("company_number")} className="form-input" placeholder="01234567" />
            </div>
            <div>
              <label className="form-label">VAT Number</label>
              <input {...form1.register("vat_number")} className="form-input" placeholder="GB123456789" />
            </div>
          </div>
          <div>
            <label className="form-label">Address Line 1</label>
            <input {...form1.register("address_line_1")} className="form-input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">City</label>
              <input {...form1.register("city")} className="form-input" />
            </div>
            <div>
              <label className="form-label">Postcode</label>
              <input {...form1.register("postcode")} className="form-input" />
            </div>
          </div>
          <div>
            <label className="form-label">Status</label>
            <select {...form1.register("status")} className="form-input">
              {SUPPLIER_STATUS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Website</label>
            <input {...form1.register("website")} className="form-input" placeholder="https://…" />
          </div>
        </div>
      )}

      {/* Step 1: Contacts */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Contacts</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Add key contacts for this supplier.</p>
          </div>
          {contactFields.map((field, idx) => (
            <div key={field.id} className="rounded-xl border p-4 space-y-3"
              style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-600" style={{ color: "var(--text-muted)" }}>
                  Contact {idx + 1} {idx === 0 && "(Primary)"}
                </span>
                {contactFields.length > 1 && (
                  <button type="button" onClick={() => removeContact(idx)} className="btn btn-ghost btn-icon btn-sm">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">First Name <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input {...form2.register(`contacts.${idx}.first_name`)} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Last Name</label>
                  <input {...form2.register(`contacts.${idx}.last_name`)} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Email</label>
                  <input {...form2.register(`contacts.${idx}.email`)} type="email" className="form-input" />
                </div>
                <div>
                  <label className="form-label">Phone</label>
                  <input {...form2.register(`contacts.${idx}.phone`)} className="form-input" />
                </div>
                <div>
                  <label className="form-label">Role</label>
                  <input {...form2.register(`contacts.${idx}.role`)} className="form-input" placeholder="e.g. Contracts Manager" />
                </div>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => addContact({ first_name: "", is_primary: false })}
            className="btn btn-secondary btn-sm w-full">
            <Plus className="w-4 h-4" /> Add Contact
          </button>
        </div>
      )}

      {/* Step 2: Services */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Services & Compliance</h3>
          </div>
          {serviceFields.map((field, idx) => (
            <div key={field.id} className="rounded-xl border p-4 space-y-3" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-600" style={{ color: "var(--text-muted)" }}>Service {idx + 1}</span>
                <button type="button" onClick={() => removeService(idx)} className="btn btn-ghost btn-icon btn-sm">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div>
                <label className="form-label">Service <span style={{ color: "var(--danger)" }}>*</span></label>
                <select {...form3.register(`services.${idx}.service`)} className="form-input">
                  <option value="">Select…</option>
                  {SERVICES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Trade Description</label>
                <input {...form3.register(`services.${idx}.trade`)} className="form-input" />
              </div>
            </div>
          ))}
          <button type="button" onClick={() => addService({ service: "", trade: "", notes: "" })}
            className="btn btn-secondary btn-sm w-full">
            <Plus className="w-4 h-4" /> Add Service
          </button>

          <div className="mt-4 space-y-4">
            <div>
              <label className="form-label">Insurance Expiry</label>
              <input {...form3.register("insurance_expiry")} type="date" className="form-input" />
            </div>
            <div>
              <label className="form-label">Accreditations</label>
              <input {...form3.register("accreditations")} className="form-input" placeholder="e.g. CHAS, Constructionline, ISO 9001" />
            </div>
            <div>
              <label className="form-label">Payment Terms</label>
              <input {...form3.register("payment_terms")} className="form-input" placeholder="e.g. 30 days from invoice" />
            </div>
            <div>
              <label className="form-label">Notes</label>
              <textarea {...form3.register("notes")} rows={3} className="form-input" />
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {currentStep === 3 && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Review & Create</h3>
          </div>
          <SummarySection title="Company">
            <SummaryRow label="Name" value={v1.name} />
            <SummaryRow label="Company No." value={v1.company_number || "—"} />
            <SummaryRow label="VAT" value={v1.vat_number || "—"} />
            <SummaryRow label="Status" value={v1.status} />
            <SummaryRow label="Location" value={[v1.city, v1.postcode].filter(Boolean).join(", ") || "—"} />
          </SummarySection>
          <SummarySection title="Contacts">
            <SummaryRow label="Total Contacts" value={`${v2.contacts?.length ?? 0}`} />
            {v2.contacts?.[0] && (
              <SummaryRow label="Primary Contact" value={`${v2.contacts[0].first_name} ${v2.contacts[0].last_name ?? ""}`.trim()} />
            )}
          </SummarySection>
          <SummarySection title="Services">
            <SummaryRow label="Services Listed" value={`${v3.services?.length ?? 0}`} />
            <SummaryRow label="Insurance Expiry" value={v3.insurance_expiry || "—"} />
            <SummaryRow label="Payment Terms" value={v3.payment_terms || "—"} />
          </SummarySection>
          <div className="rounded-[var(--radius)] p-4 flex gap-3"
            style={{ background: "var(--info-bg)", border: "1px solid var(--info)" }}>
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--info)" }} />
            <p className="text-[13px]" style={{ color: "var(--info-text)" }}>
              This will create the supplier and all contacts. Documents can be uploaded afterwards.
            </p>
          </div>
        </div>
      )}
    </WizardShell>
  );
}

export default SupplierWizard;

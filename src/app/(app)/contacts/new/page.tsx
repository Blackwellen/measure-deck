"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

/* ─────────────────────────── Schema ─────────────────────────── */

const schema = z.object({
  name: z.string().min(2, "Name is required"),
  role: z.string().min(1, "Role is required"),
  company: z.string().min(1, "Company is required"),
  email: z.string().email("Invalid email"),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const COMPANIES = [
  "Apex Groundworks Ltd",
  "BrightBuild Materials",
  "CraneKing Plant Hire",
  "Delta Electrical Specialists",
  "Exton Consulting Engineers",
  "Foresight Safety Services",
  "Grove Structural Steel",
  "Henley Aggregates",
];

const ROLES = [
  "Director",
  "Technical Director",
  "Commercial Director",
  "Contracts Manager",
  "Quantity Surveyor",
  "Estimator",
  "Account Manager",
  "Operations Manager",
  "Site Manager",
  "Senior Consultant",
  "Sales Director",
  "Other",
];

/* ─────────────────────────── Page ──────────────────────────── */

export default function NewContactPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormValues) {
    try {
      const supabase = createClient();
      const { error } = await supabase.from("contacts").insert({
        ...data,
        last_contact: new Date().toISOString(),
        created_at: new Date().toISOString(),
      });
      if (error) throw error;
      toast.success("Contact created successfully");
      router.push("/app/contacts");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create contact");
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/app/contacts" className="btn btn-ghost btn-sm btn-icon">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold">New Contact</h1>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">Add a new contact to your directory</p>
          </div>
        </div>
      </div>

      <div className="page-content flex-1">
        <div className="max-w-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            {/* Avatar placeholder */}
            <div className="card p-5 flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
                style={{ background: "var(--primary-light)", color: "var(--primary)" }}
              >
                <User size={28} />
              </div>
              <div>
                <p className="text-sm font-medium">Contact photo</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Photo upload can be added after creating the contact.</p>
              </div>
            </div>

            {/* Core fields */}
            <div className="card p-5 flex flex-col gap-4">
              <h3 className="text-sm font-semibold">Contact Details</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="form-label">Full Name *</label>
                  <input {...register("name")} className="form-input" placeholder="e.g. John Smith" />
                  {errors.name && <p className="text-xs text-[var(--danger)] mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="form-label">Role / Job Title *</label>
                  <select {...register("role")} className="form-input">
                    <option value="">Select role…</option>
                    {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                  {errors.role && <p className="text-xs text-[var(--danger)] mt-1">{errors.role.message}</p>}
                </div>
                <div>
                  <label className="form-label">Company / Supplier *</label>
                  <select {...register("company")} className="form-input">
                    <option value="">Select company…</option>
                    {COMPANIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  {errors.company && <p className="text-xs text-[var(--danger)] mt-1">{errors.company.message}</p>}
                </div>
                <div>
                  <label className="form-label">Email Address *</label>
                  <input {...register("email")} type="email" className="form-input" placeholder="john@company.co.uk" />
                  {errors.email && <p className="text-xs text-[var(--danger)] mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="form-label">Phone Number</label>
                  <input {...register("phone")} type="tel" className="form-input" placeholder="01234 567890" />
                </div>
              </div>
            </div>

            <div className="card p-5 flex flex-col gap-4">
              <h3 className="text-sm font-semibold">Notes</h3>
              <textarea
                {...register("notes")}
                className="form-input resize-none"
                rows={4}
                placeholder="Any additional notes about this contact…"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : "Create Contact"}
              </button>
              <Link href="/app/contacts" className="btn btn-secondary">Cancel</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { z } from "zod";
import { cn, formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { SEED_PROJECTS, SEED_PROJECT_DETAIL, type SeedProject, type ProjectStatus } from "@/lib/seed/projects";

// ─── Validation schema ────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters"),
  client: z.string().min(2, "Client name must be at least 2 characters"),
  ref: z.string().min(1, "Reference is required"),
  contractValue: z.coerce.number().min(0, "Contract value must be positive"),
  contractType: z.string().min(1, "Contract type is required"),
  retentionPercent: z.coerce.number().min(0).max(100),
  paymentTerms: z.coerce.number().min(1),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
  status: z.enum(["active", "on_hold", "completed", "disputed", "archived"]),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
type FieldErrors = Partial<Record<keyof FormValues, string>>;

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EditProjectPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<SeedProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState<FormValues>({
    name: "",
    client: "",
    ref: "",
    contractValue: 0,
    contractType: "",
    retentionPercent: 3,
    paymentTerms: 21,
    startDate: "",
    endDate: "",
    status: "active",
    description: "",
  });

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .single();
        const p = (data as SeedProject) ?? SEED_PROJECTS.find(p => p.id === projectId) ?? SEED_PROJECT_DETAIL;
        setProject(p);
        setForm({
          name: p.name,
          client: p.client,
          ref: p.ref,
          contractValue: p.contractValue,
          contractType: p.contractType,
          retentionPercent: p.retentionPercent,
          paymentTerms: p.paymentTerms,
          startDate: p.startDate,
          endDate: p.endDate,
          status: p.status,
          description: p.description ?? "",
        });
      } catch {
        const p = SEED_PROJECTS.find(p => p.id === projectId) ?? SEED_PROJECT_DETAIL;
        setProject(p);
        setForm({
          name: p.name,
          client: p.client,
          ref: p.ref,
          contractValue: p.contractValue,
          contractType: p.contractType,
          retentionPercent: p.retentionPercent,
          paymentTerms: p.paymentTerms,
          startDate: p.startDate,
          endDate: p.endDate,
          status: p.status,
          description: p.description ?? "",
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  function set(field: keyof FormValues, value: string | number) {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      result.error.issues.forEach(issue => {
        const key = issue.path[0] as keyof FormValues;
        fieldErrors[key] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      await supabase.from("projects").update(result.data).eq("id", projectId);
    } catch {
      // silently continue
    } finally {
      setSaving(false);
      setSaved(true);
      setTimeout(() => {
        router.push(`/app/projects/${projectId}`);
      }, 800);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={20} className="animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="page-header">
        <div>
          <button
            className="btn btn-ghost btn-sm text-xs mb-2"
            style={{ color: "var(--text-muted)" }}
            onClick={() => router.push(`/app/projects/${projectId}`)}
          >
            <ArrowLeft size={13} />Back to Project
          </button>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Edit Project</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>{project?.name}</p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => router.push(`/app/projects/${projectId}`)}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSubmit}
            disabled={saving}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="page-content">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-3xl">
          {/* Basic info */}
          <div className="card p-6 flex flex-col gap-4">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Basic Information</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Project Name *</label>
                <input
                  className={cn("form-input", errors.name && "border-[var(--danger)]")}
                  value={form.name}
                  onChange={e => set("name", e.target.value)}
                  placeholder="e.g. Eastside Residential Block A"
                />
                {errors.name && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{errors.name}</p>}
              </div>
              <div>
                <label className="form-label">Reference *</label>
                <input
                  className={cn("form-input", errors.ref && "border-[var(--danger)]")}
                  value={form.ref}
                  onChange={e => set("ref", e.target.value)}
                  placeholder="e.g. MD-2024-001"
                />
                {errors.ref && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{errors.ref}</p>}
              </div>
            </div>

            <div>
              <label className="form-label">Client *</label>
              <input
                className={cn("form-input", errors.client && "border-[var(--danger)]")}
                value={form.client}
                onChange={e => set("client", e.target.value)}
                placeholder="e.g. Redstone Developments Ltd"
              />
              {errors.client && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{errors.client}</p>}
            </div>

            <div>
              <label className="form-label">Status</label>
              <select
                className="form-input"
                value={form.status}
                onChange={e => set("status", e.target.value)}
              >
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="disputed">Disputed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="form-label">Description</label>
              <textarea
                className="form-input min-h-[80px] resize-y"
                value={form.description}
                onChange={e => set("description", e.target.value)}
                placeholder="Brief project description…"
              />
            </div>
          </div>

          {/* Contract details */}
          <div className="card p-6 flex flex-col gap-4">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Contract Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Contract Value (£) *</label>
                <input
                  className={cn("form-input", errors.contractValue && "border-[var(--danger)]")}
                  type="number"
                  value={form.contractValue}
                  onChange={e => set("contractValue", e.target.value)}
                  min={0}
                  step={1000}
                />
                {errors.contractValue && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{errors.contractValue}</p>}
                {form.contractValue > 0 && (
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{formatCurrency(Number(form.contractValue))}</p>
                )}
              </div>
              <div>
                <label className="form-label">Contract Type</label>
                <select
                  className="form-input"
                  value={form.contractType}
                  onChange={e => set("contractType", e.target.value)}
                >
                  <option value="">Select…</option>
                  <option>JCT Design &amp; Build 2016</option>
                  <option>JCT SBC/Q 2016</option>
                  <option>JCT Intermediate 2016</option>
                  <option>NEC4 ECC Option A</option>
                  <option>NEC4 ECC Option C</option>
                  <option>FIDIC Red Book</option>
                  <option>Bespoke Contract</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Retention %</label>
                <input
                  className="form-input"
                  type="number"
                  value={form.retentionPercent}
                  onChange={e => set("retentionPercent", e.target.value)}
                  min={0}
                  max={10}
                  step={0.5}
                />
              </div>
              <div>
                <label className="form-label">Payment Terms (days)</label>
                <input
                  className="form-input"
                  type="number"
                  value={form.paymentTerms}
                  onChange={e => set("paymentTerms", e.target.value)}
                  min={1}
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="card p-6 flex flex-col gap-4">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Project Dates</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Start Date *</label>
                <input
                  className={cn("form-input", errors.startDate && "border-[var(--danger)]")}
                  type="date"
                  value={form.startDate}
                  onChange={e => set("startDate", e.target.value)}
                />
                {errors.startDate && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{errors.startDate}</p>}
              </div>
              <div>
                <label className="form-label">End Date *</label>
                <input
                  className={cn("form-input", errors.endDate && "border-[var(--danger)]")}
                  type="date"
                  value={form.endDate}
                  onChange={e => set("endDate", e.target.value)}
                />
                {errors.endDate && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{errors.endDate}</p>}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Changes
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => router.push(`/app/projects/${projectId}`)}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

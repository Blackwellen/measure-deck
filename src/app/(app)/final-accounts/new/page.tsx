"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { z } from "zod";
import { cn, formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { SEED_PROJECTS } from "@/lib/seed/projects";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  project_id: z.string().min(1, "Project is required"),
  originalSum: z.coerce.number().min(1, "Original sum must be greater than 0"),
  targetAgreementDate: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;
type FieldErrors = Partial<Record<keyof FormValues, string>>;

// ─── Main page ────────────────────────────────────────────────────────────────

export default function NewFinalAccountPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const [form, setForm] = useState<FormValues>({
    project_id: "",
    originalSum: 0,
    targetAgreementDate: "",
    notes: "",
  });

  function set(field: keyof FormValues, value: string | number) {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }

  const selectedProject = SEED_PROJECTS.find(p => p.id === form.project_id);

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
      const { data } = await supabase
        .from("final_accounts")
        .insert({
          project_id: result.data.project_id,
          original_sum: result.data.originalSum,
          final_sum: result.data.originalSum,
          status: "draft",
          target_agreement_date: result.data.targetAgreementDate || null,
          notes: result.data.notes || null,
        })
        .select()
        .single();
      if (data) {
        router.push(`/app/final-accounts/${data.id}`);
      } else {
        router.push("/app/final-accounts");
      }
    } catch {
      router.push("/app/final-accounts");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="page-header">
        <div>
          <button
            className="btn btn-ghost btn-sm text-xs mb-2"
            style={{ color: "var(--text-muted)" }}
            onClick={() => router.push("/app/final-accounts")}
          >
            <ArrowLeft size={13} />Back to Final Accounts
          </button>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>New Final Account</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>Start the close-out process for a project</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => router.push("/app/final-accounts")}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Create Final Account
          </button>
        </div>
      </div>

      <div className="page-content">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-2xl">
          <div className="card p-6 flex flex-col gap-4">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Account Details</h2>

            <div>
              <label className="form-label">Project *</label>
              <select
                className={cn("form-input", errors.project_id && "border-[var(--danger)]")}
                value={form.project_id}
                onChange={e => set("project_id", e.target.value)}
              >
                <option value="">Select a project…</option>
                {SEED_PROJECTS.filter(p => p.status !== "archived").map(p => (
                  <option key={p.id} value={p.id}>{p.name} — {p.ref}</option>
                ))}
              </select>
              {errors.project_id && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{errors.project_id}</p>}
            </div>

            {selectedProject && (
              <div className="p-3 rounded-xl" style={{ background: "var(--bg-subtle)" }}>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Selected project</p>
                <p className="text-sm font-semibold mt-0.5">{selectedProject.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  {selectedProject.client} · Contract value: {formatCurrency(selectedProject.contractValue)}
                </p>
              </div>
            )}

            <div>
              <label className="form-label">Original Contract Sum (£) *</label>
              <input
                className={cn("form-input", errors.originalSum && "border-[var(--danger)]")}
                type="number"
                min={0}
                step={1000}
                value={form.originalSum || ""}
                onChange={e => set("originalSum", e.target.value)}
                placeholder="e.g. 4850000"
              />
              {errors.originalSum && <p className="text-xs mt-1" style={{ color: "var(--danger)" }}>{errors.originalSum}</p>}
              {Number(form.originalSum) > 0 && (
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{formatCurrency(Number(form.originalSum))}</p>
              )}
            </div>

            <div>
              <label className="form-label">Target Agreement Date</label>
              <input
                className="form-input"
                type="date"
                value={form.targetAgreementDate}
                onChange={e => set("targetAgreementDate", e.target.value)}
              />
            </div>

            <div>
              <label className="form-label">Initial Notes</label>
              <textarea
                className="form-input min-h-[80px] resize-y"
                value={form.notes}
                onChange={e => set("notes", e.target.value)}
                placeholder="Any initial notes or context for this final account…"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Create Final Account
            </button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => router.push("/app/final-accounts")}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

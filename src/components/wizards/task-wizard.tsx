"use client";

import { createClient } from "@/lib/supabase/client";
import { generateRef } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { SummaryRow, SummarySection, WizardShell } from "./wizard-shell";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const step1Schema = z.object({
  title: z.string().min(2, "Title is required"),
  project_id: z.string().optional(),
  description: z.string().optional(),
  priority: z.string().default("medium"),
  status: z.string().default("todo"),
  due_date: z.string().optional(),
  task_type: z.string().optional(),
});

const step2Schema = z.object({
  assigned_to: z.string().optional(),
  assigned_name: z.string().optional(),
  estimated_hours: z.coerce.number().min(0).optional(),
  tags: z.string().optional(),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;

const PRIORITIES = ["low", "medium", "high", "critical"];
const STATUS_OPTIONS = ["todo", "in_progress", "done", "on_hold", "cancelled"];
const TASK_TYPES = ["Action", "Review", "Approval", "Submission", "Inspection", "Other"];

const STEPS = [
  { id: "details", label: "Details" },
  { id: "assignment", label: "Assignment" },
  { id: "review", label: "Review" },
];

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[12px] mt-1" style={{ color: "var(--danger)" }}>{message}</p>;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface TaskWizardProps {
  projectId?: string;
  onClose?: () => void;
  onSuccess?: (id: string) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function TaskWizard({ projectId, onClose, onSuccess }: TaskWizardProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { project_id: projectId ?? "", priority: "medium", status: "todo" },
  });
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema) });

  const v1 = form1.watch();
  const v2 = form2.watch();

  const handleNext = async (): Promise<boolean> => {
    if (currentStep === 0) return form1.trigger();
    if (currentStep === 1) return true;
    if (currentStep === 2) { await handleSubmit(); return false; }
    return true;
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("tasks")
        .insert({
          project_id: v1.project_id || null,
          title: v1.title,
          reference: generateRef("TSK"),
          description: v1.description || null,
          priority: v1.priority,
          status: v1.status,
          due_date: v1.due_date || null,
          task_type: v1.task_type || null,
          assigned_to: v2.assigned_to || null,
          assigned_name: v2.assigned_name || null,
          estimated_hours: v2.estimated_hours || null,
          tags: v2.tags ? v2.tags.split(",").map((t) => t.trim()).filter(Boolean) : null,
          created_by: user?.id ?? null,
        })
        .select("id")
        .single();

      if (error) throw error;

      setCreatedId(data.id);
      setShowSuccess(true);
      toast.success("Task created");
      onSuccess?.(data.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const rightPanel = (
    <div>
      {v1.title && (
        <SummarySection title="Task">
          <SummaryRow label="Title" value={v1.title} />
          <SummaryRow label="Priority" value={v1.priority} />
          <SummaryRow label="Status" value={v1.status} />
          <SummaryRow label="Due Date" value={v1.due_date} />
          <SummaryRow label="Type" value={v1.task_type} />
        </SummarySection>
      )}
      {(v2.assigned_name || v2.assigned_to) && (
        <SummarySection title="Assignment">
          <SummaryRow label="Assigned To" value={v2.assigned_name || v2.assigned_to} />
          <SummaryRow label="Est. Hours" value={v2.estimated_hours ? `${v2.estimated_hours}h` : undefined} />
        </SummarySection>
      )}
    </div>
  );

  const successContent = (
    <>
      <div>
        <h3 className="text-[20px] font-700" style={{ color: "var(--text-primary)" }}>Task Created!</h3>
        <p className="text-[14px] mt-1" style={{ color: "var(--text-secondary)" }}>
          <strong>{v1.title}</strong> has been added.
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
      title="New Task"
      subtitle="Create an action item or task"
      rightPanel={rightPanel}
      onClose={onClose}
      isLastStep={currentStep === 2}
      nextLabel={currentStep === 2 ? "Create Task" : undefined}
      isSubmitting={isSubmitting}
      onNext={handleNext}
      showSuccess={showSuccess}
      successContent={successContent}
    >
      {/* Step 0: Details */}
      {currentStep === 0 && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Task Details</h3>
          </div>
          <div>
            <label className="form-label">Title <span style={{ color: "var(--danger)" }}>*</span></label>
            <input {...form1.register("title")} className="form-input" placeholder="e.g. Review retention calculation" />
            <FieldError message={form1.formState.errors.title?.message} />
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea {...form1.register("description")} rows={3} className="form-input" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Priority</label>
              <select {...form1.register("priority")} className="form-input">
                {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Status</label>
              <select {...form1.register("status")} className="form-input">
                {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Due Date</label>
              <input {...form1.register("due_date")} type="date" className="form-input" />
            </div>
            <div>
              <label className="form-label">Task Type</label>
              <select {...form1.register("task_type")} className="form-input">
                <option value="">Select…</option>
                {TASK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Assignment */}
      {currentStep === 1 && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Assignment</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Optionally assign this task to a team member.</p>
          </div>
          <div>
            <label className="form-label">Assigned To (name)</label>
            <input {...form2.register("assigned_name")} className="form-input" placeholder="Full name" />
          </div>
          <div>
            <label className="form-label">Assigned To (user ID)</label>
            <input {...form2.register("assigned_to")} className="form-input" placeholder="User UUID or email" />
          </div>
          <div>
            <label className="form-label">Estimated Hours</label>
            <input {...form2.register("estimated_hours")} type="number" className="form-input" min="0" step="0.5" />
          </div>
          <div>
            <label className="form-label">Tags (comma separated)</label>
            <input {...form2.register("tags")} className="form-input" placeholder="e.g. cvr, retention, urgent" />
          </div>
        </div>
      )}

      {/* Step 2: Review */}
      {currentStep === 2 && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Review</h3>
          </div>
          <SummarySection title="Task Details">
            <SummaryRow label="Title" value={v1.title} />
            <SummaryRow label="Priority" value={v1.priority} />
            <SummaryRow label="Status" value={v1.status} />
            <SummaryRow label="Due Date" value={v1.due_date || "—"} />
            <SummaryRow label="Type" value={v1.task_type || "—"} />
          </SummarySection>
          <SummarySection title="Assignment">
            <SummaryRow label="Assigned To" value={v2.assigned_name || "Unassigned"} />
            <SummaryRow label="Estimated Hours" value={v2.estimated_hours ? `${v2.estimated_hours}h` : "—"} />
          </SummarySection>
          <div className="rounded-[var(--radius)] p-4 flex gap-3"
            style={{ background: "var(--info-bg)", border: "1px solid var(--info)" }}>
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--info)" }} />
            <p className="text-[13px]" style={{ color: "var(--info-text)" }}>
              Click <strong>Create Task</strong> to save this task.
            </p>
          </div>
        </div>
      )}
    </WizardShell>
  );
}

export default TaskWizard;

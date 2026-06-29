"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Box, CheckCircle2, Cpu, Loader2, Plus, Upload, X } from "lucide-react";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { WizardShell, SummaryRow, SummarySection } from "./wizard-shell";

// ─── Schema ───────────────────────────────────────────────────────────────────

const step2Schema = z.object({
  name: z.string().min(2, "Model name is required"),
  model_type: z.enum(["IFC", "Revit", "NavisWorks", "Other"]),
  version: z.string().optional(),
  model_date: z.string().optional(),
  discipline: z.enum(["Architectural", "Structural", "MEP", "Civil", "All Disciplines"]),
  description: z.string().optional(),
});

type Step2Data = z.infer<typeof step2Schema>;

// ─── Types ────────────────────────────────────────────────────────────────────

type ModelType = "IFC" | "Revit" | "NavisWorks" | "Other";

interface BimFile {
  file: File;
  detectedType: ModelType;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = [
  { id: "select", label: "Select Model" },
  { id: "details", label: "Model Details" },
  { id: "process", label: "Processing" },
];

const MODEL_TYPE_FROM_EXT: Record<string, ModelType> = {
  ifc: "IFC",
  rvt: "Revit",
  nwd: "NavisWorks",
  zip: "IFC", // assume ifc.zip
};

const MODEL_TYPE_ACCEPT: Record<string, string[]> = {
  "application/octet-stream": [".ifc", ".rvt", ".nwd"],
  "application/zip": [".zip"],
};

const MAX_SIZE = 500 * 1024 * 1024; // 500 MB

// ─── Helpers ──────────────────────────────────────────────────────────────────

function detectModelType(filename: string): ModelType {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return MODEL_TYPE_FROM_EXT[ext] ?? "Other";
}

function fmtSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-[12px] mt-1" style={{ color: "var(--danger)" }}>{message}</p>;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface BimModelWizardProps {
  onClose?: () => void;
  onSuccess?: (id: string) => void;
  defaultProjectId?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function BimModelWizard({ onClose, onSuccess, defaultProjectId }: BimModelWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [bimFile, setBimFile] = useState<BimFile | null>(null);
  const [projectId, setProjectId] = useState(defaultProjectId ?? "");
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const form2 = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { model_type: "IFC", discipline: "All Disciplines" },
  });

  const v2 = form2.watch();

  // ── Load projects ────────────────────────────────────────────────────────
  React.useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.from("projects").select("id, name").order("name");
        if (data) setProjects(data);
      } catch { /* silent */ }
    })();
  }, []);

  // ── Dropzone ──────────────────────────────────────────────────────────────
  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length === 0) return;
    const f = accepted[0];
    setBimFile({ file: f, detectedType: detectModelType(f.name) });
    form2.setValue("model_type", detectModelType(f.name));
    if (!form2.getValues("name")) {
      form2.setValue("name", f.name.replace(/\.[^.]+$/, ""));
    }
  }, [form2]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: MAX_SIZE,
    accept: MODEL_TYPE_ACCEPT,
    maxFiles: 1,
    onDropRejected: (rejections) => {
      const reason = rejections[0]?.errors[0]?.message ?? "File rejected";
      toast.error(reason);
    },
  });

  // ── Tags ──────────────────────────────────────────────────────────────────
  const addTag = () => {
    const t = tagInput.trim();
    if (!t || tags.includes(t)) return;
    setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag));

  // ── Simulated progress ────────────────────────────────────────────────────
  const simulateProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) { clearInterval(interval); return prev; }
        return prev + Math.random() * 15;
      });
    }, 300);
    return interval;
  };

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleNext = async (): Promise<boolean> => {
    if (currentStep === 0) {
      if (!bimFile) { toast.error("Please select a BIM model file"); return false; }
      if (!projectId) { toast.error("Please select a project"); return false; }
      return true;
    }
    if (currentStep === 1) return form2.trigger();
    if (currentStep === 2) { await handleUpload(); return false; }
    return true;
  };

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    if (!bimFile) return;
    setIsSubmitting(true);
    const interval = simulateProgress();
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const ext = bimFile.file.name.split(".").pop() ?? "ifc";
      const path = `${projectId}/${v2.name.replace(/\s+/g, "_")}_${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("bim_models")
        .upload(path, bimFile.file, { upsert: false });

      if (uploadError) throw uploadError;

      clearInterval(interval);
      setUploadProgress(100);

      const { data, error: dbError } = await supabase.from("bim_models").insert({
        project_id: projectId,
        name: v2.name,
        model_type: v2.model_type,
        version: v2.version || null,
        model_date: v2.model_date || null,
        discipline: v2.discipline,
        description: v2.description || null,
        tags: tags.length > 0 ? tags : null,
        file_name: bimFile.file.name,
        file_size: bimFile.file.size,
        storage_path: path,
        status: "processing",
        uploaded_by: user?.id ?? null,
      }).select("id").single();

      if (dbError) throw dbError;

      setCreatedId(data.id);
      setShowSuccess(true);
      toast.success("BIM model uploaded and queued for processing");
      onSuccess?.(data.id);
    } catch (err) {
      clearInterval(interval);
      setUploadProgress(0);
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const successContent = (
    <>
      <div>
        <h3 className="text-[20px] font-700" style={{ color: "var(--text-primary)" }}>BIM Model Uploaded!</h3>
        <p className="text-[14px] mt-1" style={{ color: "var(--text-secondary)" }}>
          <strong>{v2.name}</strong> has been uploaded and is now being processed.
        </p>
        <p className="text-[12px] mt-2" style={{ color: "var(--text-muted)" }}>Model ID: {createdId}</p>
        <p className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>
          Processing may take several minutes depending on model size. You will be notified when complete.
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
      title="Upload BIM Model"
      subtitle="Add a BIM model to the project"
      onClose={onClose}
      isLastStep={currentStep === 2}
      nextLabel={currentStep === 2 ? "Upload & Process" : undefined}
      isSubmitting={isSubmitting}
      onNext={handleNext}
      showSuccess={showSuccess}
      successContent={successContent}
      showRightPanel={currentStep > 0}
      rightPanel={
        <div>
          {bimFile && (
            <SummarySection title="Selected Model">
              <SummaryRow label="File" value={bimFile.file.name} />
              <SummaryRow label="Size" value={fmtSize(bimFile.file.size)} />
              <SummaryRow label="Detected Type" value={bimFile.detectedType} />
            </SummarySection>
          )}
          {v2.name && (
            <SummarySection title="Details">
              <SummaryRow label="Name" value={v2.name} />
              <SummaryRow label="Type" value={v2.model_type} />
              <SummaryRow label="Discipline" value={v2.discipline} />
              <SummaryRow label="Version" value={v2.version} />
            </SummarySection>
          )}
          {tags.length > 0 && (
            <SummarySection title="Tags">
              <SummaryRow label="Tags" value={tags.join(", ")} />
            </SummarySection>
          )}
        </div>
      }
    >
      {/* ── Step 0: Select Model ── */}
      {currentStep === 0 && (
        <div className="space-y-5">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Select BIM Model</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Upload an IFC, Revit, or NavisWorks file. Max 500 MB.</p>
          </div>

          {/* Project selector */}
          <div className="max-w-sm">
            <label className="form-label">Project <span style={{ color: "var(--danger)" }}>*</span></label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="form-input"
            >
              <option value="">Select project…</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors",
              isDragActive ? "border-[var(--primary)] bg-blue-50/50" : "hover:border-[var(--primary)]"
            )}
            style={{ borderColor: isDragActive ? "var(--primary)" : "var(--border)" }}
          >
            <input {...getInputProps()} />
            <Box className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
            <p className="text-[14px] font-600" style={{ color: "var(--text-primary)" }}>
              {isDragActive ? "Drop model here" : "Drag & drop BIM model"}
            </p>
            <p className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>
              .ifc, .rvt, .nwd, .ifc.zip • Max 500 MB
            </p>
            <button type="button" className="btn btn-secondary btn-sm mt-3">Browse Files</button>
          </div>

          {/* Selected file */}
          {bimFile && (
            <div className="flex items-center gap-3 rounded-xl border px-4 py-3" style={{ borderColor: "var(--primary)", background: "var(--primary-bg)" }}>
              <Box className="w-5 h-5 flex-shrink-0" style={{ color: "var(--primary)" }} />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-600 truncate" style={{ color: "var(--text-primary)" }}>{bimFile.file.name}</p>
                <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {fmtSize(bimFile.file.size)} • Detected: {bimFile.detectedType}
                </p>
              </div>
              <button type="button" onClick={() => setBimFile(null)} className="btn btn-ghost btn-icon btn-sm">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Step 1: Model Details ── */}
      {currentStep === 1 && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Model Details</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Enter metadata for the BIM model.</p>
          </div>
          <div>
            <label className="form-label">Model Name <span style={{ color: "var(--danger)" }}>*</span></label>
            <input {...form2.register("name")} className="form-input" placeholder="e.g. Structural Model Rev A" />
            <FieldError message={form2.formState.errors.name?.message} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Model Type</label>
              <select {...form2.register("model_type")} className="form-input">
                <option value="IFC">IFC</option>
                <option value="Revit">Revit</option>
                <option value="NavisWorks">NavisWorks</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="form-label">Discipline</label>
              <select {...form2.register("discipline")} className="form-input">
                <option value="Architectural">Architectural</option>
                <option value="Structural">Structural</option>
                <option value="MEP">MEP</option>
                <option value="Civil">Civil</option>
                <option value="All Disciplines">All Disciplines</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Version</label>
              <input {...form2.register("version")} className="form-input" placeholder="e.g. Rev A" />
            </div>
            <div>
              <label className="form-label">Model Date</label>
              <input {...form2.register("model_date")} type="date" className="form-input" />
            </div>
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea {...form2.register("description")} className="form-input" rows={3} placeholder="Brief description of the model…" />
          </div>
          <div>
            <label className="form-label">Tags</label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-500"
                  style={{ background: "var(--primary-bg)", color: "var(--primary)", border: "1px solid var(--primary)" }}
                >
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)}>
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="form-input flex-1"
                placeholder="Add tag…"
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              />
              <button type="button" onClick={addTag} className="btn btn-secondary btn-sm flex-shrink-0">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Processing ── */}
      {currentStep === 2 && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Upload & Process</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Upload the model file and begin server-side processing.</p>
          </div>
          <SummarySection title="Model Summary">
            <SummaryRow label="File" value={bimFile?.file.name} />
            <SummaryRow label="Size" value={bimFile ? fmtSize(bimFile.file.size) : undefined} />
            <SummaryRow label="Name" value={v2.name} />
            <SummaryRow label="Type" value={v2.model_type} />
            <SummaryRow label="Discipline" value={v2.discipline} />
            <SummaryRow label="Project" value={projects.find((p) => p.id === projectId)?.name ?? projectId} />
            {tags.length > 0 && <SummaryRow label="Tags" value={tags.join(", ")} />}
          </SummarySection>
          {isSubmitting && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" style={{ color: "var(--primary)" }} />
                <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                  {uploadProgress < 100 ? "Uploading model file…" : "Processing model…"}
                </span>
                <span className="ml-auto text-[13px] font-700" style={{ color: "var(--primary)" }}>
                  {Math.min(Math.round(uploadProgress), 100)}%
                </span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ background: "var(--primary)", width: `${Math.min(uploadProgress, 100)}%` }}
                />
              </div>
            </div>
          )}
          {!isSubmitting && (
            <div className="rounded-[var(--radius)] p-4 flex gap-3" style={{ background: "var(--info-bg)", border: "1px solid var(--info)" }}>
              <Cpu className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--info)" }} />
              <p className="text-[13px]" style={{ color: "var(--info-text)" }}>
                After upload, the model will be processed server-side. Status will be set to <strong>processing</strong>. Large models may take several minutes.
              </p>
            </div>
          )}
        </div>
      )}
    </WizardShell>
  );
}

export default BimModelWizard;

"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { CheckCircle2, File, FileImage, FileText, Loader2, Upload, X } from "lucide-react";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { WizardShell, SummaryRow, SummarySection } from "./wizard-shell";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DrawingFile {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
  storagePath?: string;
  dbId?: string;
  // metadata
  drawing_number: string;
  title: string;
  discipline: string;
  revision: string;
  drawing_date: string;
  drawing_status: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DISCIPLINES = ["Architectural", "Structural", "MEP", "Civil", "Landscape", "Interior"];
const DRAWING_STATUSES = ["Current", "Superseded", "Preliminary", "For Construction", "As-Built"];

const STEPS = [
  { id: "select", label: "Select Files" },
  { id: "details", label: "Drawing Details" },
  { id: "review", label: "Review" },
  { id: "upload", label: "Upload" },
];

const ACCEPT_TYPES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/svg+xml": [".svg"],
  "application/acad": [".dwg"],
  "application/dgn": [".dgn"],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fileIcon(file: File) {
  if (file.type.startsWith("image/")) return <FileImage className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />;
  if (file.type === "application/pdf") return <FileText className="w-4 h-4 flex-shrink-0" style={{ color: "var(--danger)" }} />;
  return <File className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />;
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DrawingUploadWizardProps {
  onClose?: () => void;
  onSuccess?: (ids: string[]) => void;
  defaultProjectId?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function DrawingUploadWizard({ onClose, onSuccess, defaultProjectId }: DrawingUploadWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [files, setFiles] = useState<DrawingFile[]>([]);
  const [projectId, setProjectId] = useState(defaultProjectId ?? "");
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [createdIds, setCreatedIds] = useState<string[]>([]);

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
    const newFiles: DrawingFile[] = accepted.map((f) => ({
      file: f,
      status: "pending",
      drawing_number: "",
      title: f.name.replace(/\.[^.]+$/, ""),
      discipline: "Architectural",
      revision: "P01",
      drawing_date: new Date().toISOString().split("T")[0],
      drawing_status: "Preliminary",
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 100 * 1024 * 1024, // 100 MB
    accept: ACCEPT_TYPES,
    onDropRejected: (rejections) => {
      rejections.forEach((r) => {
        const reason = r.errors[0]?.message ?? "Rejected";
        toast.error(`${r.file.name}: ${reason}`);
      });
    },
  });

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateField = (idx: number, field: keyof DrawingFile, value: string) => {
    setFiles((prev) => prev.map((f, i) => i === idx ? { ...f, [field]: value } : f));
  };

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleNext = async (): Promise<boolean> => {
    if (currentStep === 0) {
      if (files.length === 0) { toast.error("Please select at least one file"); return false; }
      if (!projectId) { toast.error("Please select a project"); return false; }
      return true;
    }
    if (currentStep === 1) {
      const missing = files.some((f) => !f.drawing_number.trim() || !f.title.trim());
      if (missing) { toast.error("Please fill in drawing number and title for all files"); return false; }
      return true;
    }
    if (currentStep === 2) return true;
    if (currentStep === 3) { await handleUpload(); return false; }
    return true;
  };

  // ── Upload ────────────────────────────────────────────────────────────────
  const handleUpload = async () => {
    setIsSubmitting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const ids: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const df = files[i];
        setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, status: "uploading" } : f));

        try {
          const ext = df.file.name.split(".").pop() ?? "bin";
          const safeName = sanitizeFilename(df.file.name);
          const path = `${projectId}/${df.drawing_number || "DWG"}_${Date.now()}_${safeName}`;

          const { error: uploadError } = await supabase.storage
            .from("drawings")
            .upload(path, df.file, { upsert: false });

          if (uploadError) throw uploadError;

          const { data: record, error: dbError } = await supabase
            .from("drawing_register")
            .insert({
              project_id: projectId,
              drawing_number: df.drawing_number,
              title: df.title,
              discipline: df.discipline,
              revision: df.revision,
              drawing_date: df.drawing_date || null,
              status: df.drawing_status,
              file_name: df.file.name,
              file_size: df.file.size,
              storage_path: path,
              mime_type: df.file.type,
              uploaded_by: user?.id ?? null,
            })
            .select("id")
            .single();

          if (dbError) throw dbError;

          ids.push(record.id);
          setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, status: "done", storagePath: path, dbId: record.id } : f));
        } catch (err) {
          setFiles((prev) => prev.map((f, idx) => idx === i ? {
            ...f,
            status: "error",
            error: err instanceof Error ? err.message : "Upload failed",
          } : f));
        }
      }

      setCreatedIds(ids);
      setShowSuccess(true);
      const doneCount = files.filter((_, i) => ids.length > i).length;
      toast.success(`${ids.length} drawing(s) uploaded successfully`);
      onSuccess?.(ids);
    } finally {
      setIsSubmitting(false);
    }
  };

  const doneCount = files.filter((f) => f.status === "done").length;
  const errorCount = files.filter((f) => f.status === "error").length;
  const totalSize = files.reduce((s, f) => s + f.file.size, 0);

  const successContent = (
    <>
      <div>
        <h3 className="text-[20px] font-700" style={{ color: "var(--text-primary)" }}>Drawings Uploaded!</h3>
        <p className="text-[14px] mt-1" style={{ color: "var(--text-secondary)" }}>
          {doneCount} drawing(s) added to the register.
          {errorCount > 0 && ` (${errorCount} failed)`}
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
      title="Upload Drawings"
      subtitle="Add drawings to the project register"
      onClose={onClose}
      isLastStep={currentStep === 3}
      nextLabel={currentStep === 3 ? "Upload Drawings" : undefined}
      isSubmitting={isSubmitting}
      onNext={handleNext}
      showSuccess={showSuccess}
      successContent={successContent}
      showRightPanel={false}
    >
      {/* ── Step 0: Select Files ── */}
      {currentStep === 0 && (
        <div className="space-y-5">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Select Files</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Upload PDF, DWG, DGN, JPG, PNG, or SVG files. Max 100 MB per file.</p>
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
              "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors",
              isDragActive ? "border-[var(--primary)] bg-blue-50/50" : "hover:border-[var(--primary)]"
            )}
            style={{ borderColor: isDragActive ? "var(--primary)" : "var(--border)" }}
          >
            <input {...getInputProps()} />
            <Upload className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
            <p className="text-[14px] font-600" style={{ color: "var(--text-primary)" }}>
              {isDragActive ? "Drop drawings here" : "Drag & drop drawings here"}
            </p>
            <p className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>
              PDF, DWG, DGN, JPG, PNG, SVG • Max 100 MB per file
            </p>
            <button type="button" className="btn btn-secondary btn-sm mt-3">Browse Files</button>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((df, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
                  style={{ borderColor: "var(--border)" }}>
                  {fileIcon(df.file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] truncate" style={{ color: "var(--text-primary)" }}>{df.file.name}</p>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{fmtSize(df.file.size)}</p>
                  </div>
                  <button type="button" onClick={() => removeFile(idx)} className="btn btn-ghost btn-icon btn-sm">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Step 1: Drawing Details ── */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Drawing Details</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Enter metadata for each drawing. You can edit these individually.</p>
          </div>
          {files.map((df, idx) => (
            <div key={idx} className="rounded-xl border p-4 space-y-3" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                {fileIcon(df.file)}
                <p className="text-[13px] font-600 truncate" style={{ color: "var(--text-primary)" }}>{df.file.name}</p>
                <span className="text-[11px] ml-auto flex-shrink-0" style={{ color: "var(--text-muted)" }}>{fmtSize(df.file.size)}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Drawing Number <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input
                    value={df.drawing_number}
                    onChange={(e) => updateField(idx, "drawing_number", e.target.value)}
                    className="form-input"
                    placeholder="e.g. A-001"
                  />
                </div>
                <div>
                  <label className="form-label">Title <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input
                    value={df.title}
                    onChange={(e) => updateField(idx, "title", e.target.value)}
                    className="form-input"
                    placeholder="Drawing title"
                  />
                </div>
                <div>
                  <label className="form-label">Discipline</label>
                  <select
                    value={df.discipline}
                    onChange={(e) => updateField(idx, "discipline", e.target.value)}
                    className="form-input"
                  >
                    {DISCIPLINES.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Revision</label>
                  <input
                    value={df.revision}
                    onChange={(e) => updateField(idx, "revision", e.target.value)}
                    className="form-input"
                    placeholder="e.g. P01"
                  />
                </div>
                <div>
                  <label className="form-label">Drawing Date</label>
                  <input
                    value={df.drawing_date}
                    onChange={(e) => updateField(idx, "drawing_date", e.target.value)}
                    type="date"
                    className="form-input"
                  />
                </div>
                <div>
                  <label className="form-label">Status</label>
                  <select
                    value={df.drawing_status}
                    onChange={(e) => updateField(idx, "drawing_status", e.target.value)}
                    className="form-input"
                  >
                    {DRAWING_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Step 2: Review ── */}
      {currentStep === 2 && (
        <div className="space-y-5">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Review</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Review all drawings before uploading.</p>
          </div>
          <SummarySection title="Upload Summary">
            <SummaryRow label="Total Drawings" value={`${files.length}`} />
            <SummaryRow label="Total Size" value={fmtSize(totalSize)} />
            <SummaryRow label="Project" value={projects.find((p) => p.id === projectId)?.name ?? projectId} />
          </SummarySection>
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ background: "var(--bg-subtle)" }}>
                  <th className="text-left px-3 py-2 font-600" style={{ color: "var(--text-secondary)" }}>Number</th>
                  <th className="text-left px-3 py-2 font-600" style={{ color: "var(--text-secondary)" }}>Title</th>
                  <th className="text-left px-3 py-2 font-600" style={{ color: "var(--text-secondary)" }}>Discipline</th>
                  <th className="text-left px-3 py-2 font-600" style={{ color: "var(--text-secondary)" }}>Rev</th>
                  <th className="text-left px-3 py-2 font-600" style={{ color: "var(--text-secondary)" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {files.map((df, idx) => (
                  <tr key={idx} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="px-3 py-2" style={{ color: "var(--text-primary)" }}>{df.drawing_number || "—"}</td>
                    <td className="px-3 py-2 truncate max-w-[150px]" style={{ color: "var(--text-primary)" }}>{df.title}</td>
                    <td className="px-3 py-2" style={{ color: "var(--text-muted)" }}>{df.discipline}</td>
                    <td className="px-3 py-2" style={{ color: "var(--text-muted)" }}>{df.revision}</td>
                    <td className="px-3 py-2" style={{ color: "var(--text-muted)" }}>{df.drawing_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalSize > 500 * 1024 * 1024 && (
            <div className="rounded-[var(--radius)] p-3 border" style={{ background: "var(--warning-bg)", borderColor: "var(--warning)" }}>
              <p className="text-[12px]" style={{ color: "var(--warning-text)" }}>Total upload size is large. This may take a few minutes.</p>
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: Upload ── */}
      {currentStep === 3 && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Upload Progress</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Files are being uploaded to the drawing register.</p>
          </div>
          <div className="space-y-2">
            {files.map((df, idx) => (
              <div key={idx} className="flex items-center gap-3 rounded-xl border px-3 py-2.5" style={{ borderColor: "var(--border)" }}>
                {df.status === "pending" && <File className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />}
                {df.status === "uploading" && <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" style={{ color: "var(--primary)" }} />}
                {df.status === "done" && <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "var(--success)" }} />}
                {df.status === "error" && <X className="w-4 h-4 flex-shrink-0" style={{ color: "var(--danger)" }} />}
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] truncate" style={{ color: "var(--text-primary)" }}>{df.drawing_number ? `${df.drawing_number} — ` : ""}{df.title}</p>
                  {df.status === "error" && df.error && (
                    <p className="text-[11px]" style={{ color: "var(--danger)" }}>{df.error}</p>
                  )}
                  {df.status === "uploading" && (
                    <div className="w-full h-1 rounded-full mt-1 overflow-hidden" style={{ background: "var(--border)" }}>
                      <div className="h-full rounded-full animate-pulse" style={{ background: "var(--primary)", width: "60%" }} />
                    </div>
                  )}
                </div>
                <span className="text-[11px] flex-shrink-0" style={{ color: "var(--text-muted)" }}>{fmtSize(df.file.size)}</span>
              </div>
            ))}
          </div>
          {!isSubmitting && files.every((f) => f.status === "pending") && (
            <div className="rounded-[var(--radius)] p-4 flex gap-3" style={{ background: "var(--info-bg)", border: "1px solid var(--info)" }}>
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--info)" }} />
              <p className="text-[13px]" style={{ color: "var(--info-text)" }}>
                Click <strong>Upload Drawings</strong> to begin. Files will be stored securely and added to the drawing register.
              </p>
            </div>
          )}
        </div>
      )}
    </WizardShell>
  );
}

export default DrawingUploadWizard;

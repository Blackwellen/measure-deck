"use client";

import { createClient } from "@/lib/supabase/client";
import { generateRef, cn } from "@/lib/utils";
import { CheckCircle2, File, Loader2, Paperclip, Trash2, Upload, X } from "lucide-react";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { SummaryRow, SummarySection, WizardShell } from "./wizard-shell";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UploadedFile {
  file: File;
  preview?: string;
  status: "pending" | "uploading" | "done" | "error";
  storagePath?: string;
  dbId?: string;
  error?: string;
}

interface ClassifiedFile extends UploadedFile {
  file_type: string;
  description: string;
  tags: string;
}

const FILE_TYPES = [
  "Photograph",
  "Correspondence",
  "Drawing",
  "Specification",
  "Programme",
  "Minutes / Notes",
  "Invoice",
  "Quote / Tender",
  "Site Report",
  "Expert Report",
  "Contract Document",
  "Other",
];

const LINK_ENTITY_TYPES = ["change_event", "payment_application", "cvr_period", "task", "project"];

const STEPS = [
  { id: "upload", label: "Upload" },
  { id: "classify", label: "Classify" },
  { id: "link", label: "Link" },
  { id: "review", label: "Review" },
];

// ─── Props ────────────────────────────────────────────────────────────────────

export interface EvidenceUploadWizardProps {
  projectId?: string;
  linkedEntityType?: string;
  linkedEntityId?: string;
  onClose?: () => void;
  onSuccess?: (ids: string[]) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function EvidenceUploadWizard({
  projectId,
  linkedEntityType: defaultEntityType,
  linkedEntityId: defaultEntityId,
  onClose,
  onSuccess,
}: EvidenceUploadWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [files, setFiles] = useState<ClassifiedFile[]>([]);
  const [linkEntityType, setLinkEntityType] = useState(defaultEntityType ?? "");
  const [linkEntityId, setLinkEntityId] = useState(defaultEntityId ?? "");
  const [createdIds, setCreatedIds] = useState<string[]>([]);

  // ── Dropzone ──────────────────────────────────────────────────────────────
  const onDrop = useCallback((accepted: File[]) => {
    const newFiles: ClassifiedFile[] = accepted.map((f) => ({
      file: f,
      status: "pending",
      file_type: "Other",
      description: f.name.replace(/\.[^.]+$/, ""),
      tags: "",
      preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: 50 * 1024 * 1024, // 50 MB
    accept: {
      "image/*": [],
      "application/pdf": [],
      "application/msword": [],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [],
      "application/vnd.ms-excel": [],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [],
      "text/plain": [],
    },
  });

  const removeFile = (idx: number) => {
    setFiles((prev) => {
      const updated = [...prev];
      if (updated[idx].preview) URL.revokeObjectURL(updated[idx].preview!);
      updated.splice(idx, 1);
      return updated;
    });
  };

  const updateFileField = (idx: number, field: keyof ClassifiedFile, value: string) => {
    setFiles((prev) => prev.map((f, i) => (i === idx ? { ...f, [field]: value } : f)));
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const handleNext = async (): Promise<boolean> => {
    if (currentStep === 0) {
      if (files.length === 0) {
        toast.error("Please upload at least one file");
        return false;
      }
      return true;
    }
    if (currentStep === 1) return true;
    if (currentStep === 2) return true;
    if (currentStep === 3) { await handleSubmit(); return false; }
    return true;
  };

  // ── Upload + Insert ───────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setIsSubmitting(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const ids: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const cf = files[i];
        setFiles((prev) => prev.map((f, idx) => idx === i ? { ...f, status: "uploading" } : f));

        try {
          const ext = cf.file.name.split(".").pop() ?? "bin";
          const path = `${user?.id ?? "anon"}/${generateRef("EVD")}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from("evidence")
            .upload(path, cf.file, { upsert: false });

          if (uploadError) throw uploadError;

          const { data: record, error: dbError } = await supabase
            .from("evidence_files")
            .insert({
              project_id: projectId ?? null,
              file_name: cf.file.name,
              file_type: cf.file_type,
              file_size: cf.file.size,
              storage_path: path,
              mime_type: cf.file.type,
              description: cf.description || null,
              tags: cf.tags ? cf.tags.split(",").map((t) => t.trim()).filter(Boolean) : null,
              uploaded_by: user?.id ?? null,
            })
            .select("id")
            .single();

          if (dbError) throw dbError;

          ids.push(record.id);

          if (linkEntityType && linkEntityId) {
            await supabase.from("evidence_links").insert({
              evidence_file_id: record.id,
              entity_type: linkEntityType,
              entity_id: linkEntityId,
            });
          }

          setFiles((prev) =>
            prev.map((f, idx) => idx === i ? { ...f, status: "done", storagePath: path, dbId: record.id } : f)
          );
        } catch (err) {
          setFiles((prev) =>
            prev.map((f, idx) => idx === i ? { ...f, status: "error", error: err instanceof Error ? err.message : "Upload failed" } : f)
          );
        }
      }

      setCreatedIds(ids);
      setShowSuccess(true);
      toast.success(`${ids.length} file(s) uploaded`);
      onSuccess?.(ids);
    } finally {
      setIsSubmitting(false);
    }
  };

  const doneCount = files.filter((f) => f.status === "done").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  const successContent = (
    <>
      <div>
        <h3 className="text-[20px] font-700" style={{ color: "var(--text-primary)" }}>Evidence Uploaded!</h3>
        <p className="text-[14px] mt-1" style={{ color: "var(--text-secondary)" }}>
          {doneCount} file(s) uploaded successfully.
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
      title="Upload Evidence"
      subtitle="Add supporting documents and files"
      onClose={onClose}
      isLastStep={currentStep === 3}
      nextLabel={currentStep === 3 ? "Upload Files" : undefined}
      isSubmitting={isSubmitting}
      onNext={handleNext}
      showSuccess={showSuccess}
      successContent={successContent}
      showRightPanel={false}
    >
      {/* Step 0: Upload */}
      {currentStep === 0 && (
        <div className="space-y-5">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Upload Files</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Drag & drop or click to select files. Max 50 MB each.</p>
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
              {isDragActive ? "Drop files here" : "Drag & drop files here"}
            </p>
            <p className="text-[12px] mt-1" style={{ color: "var(--text-muted)" }}>
              PDF, Word, Excel, Images • Max 50 MB per file
            </p>
            <button type="button" className="btn btn-secondary btn-sm mt-3">
              Browse Files
            </button>
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div className="space-y-2">
              {files.map((cf, idx) => (
                <div key={idx} className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
                  style={{ borderColor: "var(--border)" }}>
                  {cf.preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cf.preview} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                  ) : (
                    <File className="w-5 h-5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] truncate" style={{ color: "var(--text-primary)" }}>{cf.file.name}</p>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {(cf.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
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

      {/* Step 1: Classify */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Classify Files</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Set the type and description for each file.</p>
          </div>
          {files.map((cf, idx) => (
            <div key={idx} className="rounded-xl border p-4 space-y-3" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                <p className="text-[13px] font-600 truncate" style={{ color: "var(--text-primary)" }}>{cf.file.name}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">File Type</label>
                  <select
                    value={cf.file_type}
                    onChange={(e) => updateFileField(idx, "file_type", e.target.value)}
                    className="form-input"
                  >
                    {FILE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Tags</label>
                  <input
                    value={cf.tags}
                    onChange={(e) => updateFileField(idx, "tags", e.target.value)}
                    className="form-input"
                    placeholder="comma, separated"
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Description</label>
                <input
                  value={cf.description}
                  onChange={(e) => updateFileField(idx, "description", e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step 2: Link */}
      {currentStep === 2 && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Link to Record</h3>
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Optionally link these files to a specific record.</p>
          </div>
          <div>
            <label className="form-label">Entity Type</label>
            <select
              value={linkEntityType}
              onChange={(e) => setLinkEntityType(e.target.value)}
              className="form-input"
            >
              <option value="">None (attach to project only)</option>
              {LINK_ENTITY_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
            </select>
          </div>
          {linkEntityType && (
            <div>
              <label className="form-label">Record ID</label>
              <input
                value={linkEntityId}
                onChange={(e) => setLinkEntityId(e.target.value)}
                className="form-input"
                placeholder="UUID of the record"
              />
            </div>
          )}
        </div>
      )}

      {/* Step 3: Review */}
      {currentStep === 3 && (
        <div className="space-y-5 max-w-lg">
          <div>
            <h3 className="text-[15px] font-600 mb-1" style={{ color: "var(--text-primary)" }}>Review & Upload</h3>
          </div>
          <SummarySection title="Files">
            <SummaryRow label="Total Files" value={`${files.length}`} />
            <SummaryRow label="Total Size" value={`${(files.reduce((s, f) => s + f.file.size, 0) / 1024 / 1024).toFixed(1)} MB`} />
          </SummarySection>
          {linkEntityType && (
            <SummarySection title="Link">
              <SummaryRow label="Entity Type" value={linkEntityType} />
              <SummaryRow label="Record ID" value={linkEntityId || "—"} />
            </SummarySection>
          )}
          <div className="space-y-2">
            {files.map((cf, idx) => (
              <div key={idx} className="flex items-center gap-2">
                {cf.status === "uploading" && <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "var(--primary)" }} />}
                {cf.status === "done" && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "var(--success)" }} />}
                {cf.status === "error" && <X className="w-3.5 h-3.5" style={{ color: "var(--danger)" }} />}
                {cf.status === "pending" && <File className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />}
                <span className="text-[12px] truncate" style={{ color: "var(--text-primary)" }}>{cf.file.name}</span>
                <span className="text-[11px] ml-auto flex-shrink-0" style={{ color: "var(--text-muted)" }}>{cf.file_type}</span>
              </div>
            ))}
          </div>
          <div className="rounded-[var(--radius)] p-4 flex gap-3"
            style={{ background: "var(--info-bg)", border: "1px solid var(--info)" }}>
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: "var(--info)" }} />
            <p className="text-[13px]" style={{ color: "var(--info-text)" }}>
              Files will be uploaded to secure storage and linked to the evidence register.
            </p>
          </div>
        </div>
      )}
    </WizardShell>
  );
}

export default EvidenceUploadWizard;

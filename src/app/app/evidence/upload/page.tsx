"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Upload, X, CheckCircle, AlertCircle, Image, FileText, Video, File,
  ChevronRight, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf", "video/mp4", "video/quicktime", "video/x-msvideo"];

const CLASSIFICATION_OPTIONS = [
  "Site Progress Photo",
  "Inspection Record",
  "Survey Document",
  "Contract Document",
  "Drawing",
  "Change Evidence",
  "Defect Record",
  "Completion Evidence",
  "Other",
];

const PROJECTS = [
  { id: "prj-001", name: "Phase 1 - Foundation Works" },
  { id: "prj-002", name: "Office Block Refurbishment" },
  { id: "prj-003", name: "Drainage Upgrade - Site B" },
];

const CHANGES = [
  { id: "ch-001", ref: "CHG-001", name: "Additional Concrete Depth" },
  { id: "ch-002", ref: "CHG-002", name: "Extra Drainage Run" },
  { id: "ch-003", ref: "CHG-003", name: "Foundation Width Increase" },
];

interface FileEntry {
  id: string;
  file: File;
  preview?: string;
  project_id: string;
  change_id: string;
  classification: string;
  description: string;
  date_taken: string;
  progress: number;
  status: "idle" | "uploading" | "done" | "error";
  error?: string;
}

function FileTypeIcon({ type, size = 20 }: { type: string; size?: number }) {
  if (type.startsWith("image/")) return <Image size={size} style={{ color: "#3B5EE8" }} />;
  if (type === "application/pdf") return <FileText size={size} style={{ color: "#EF4444" }} />;
  if (type.startsWith("video/")) return <Video size={size} style={{ color: "#10B981" }} />;
  return <File size={size} style={{ color: "#6B7280" }} />;
}

function formatBytes(bytes: number) {
  if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

export default function EvidenceUploadPage() {
  const router = useRouter();
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter((f) => ACCEPTED_TYPES.includes(f.type));
    const entries: FileEntry[] = validFiles.map((f) => ({
      id: `${Date.now()}-${Math.random()}`,
      file: f,
      preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
      project_id: PROJECTS[0].id,
      change_id: "",
      classification: "Site Progress Photo",
      description: "",
      date_taken: new Date().toISOString().slice(0, 10),
      progress: 0,
      status: "idle",
    }));
    setFiles((prev) => [...prev, ...entries]);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    processFiles(Array.from(e.dataTransfer.files));
  }, []);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(Array.from(e.target.files));
  };

  const updateEntry = (id: string, updates: Partial<FileEntry>) => {
    setFiles((prev) => prev.map((f) => f.id === id ? { ...f, ...updates } : f));
  };

  const removeEntry = (id: string) => {
    setFiles((prev) => {
      const entry = prev.find((f) => f.id === id);
      if (entry?.preview) URL.revokeObjectURL(entry.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  const uploadAll = async () => {
    if (files.length === 0) return;
    setIsUploading(true);

    for (const entry of files) {
      updateEntry(entry.id, { status: "uploading", progress: 0 });
      // Simulate upload progress
      for (let p = 10; p <= 90; p += 10) {
        await new Promise((r) => setTimeout(r, 80));
        updateEntry(entry.id, { progress: p });
      }
      // Simulate success
      await new Promise((r) => setTimeout(r, 200));
      updateEntry(entry.id, { progress: 100, status: "done" });
    }

    setIsUploading(false);
    setUploadComplete(true);
  };

  const allMetadataFilled = files.every((f) => f.project_id && f.classification);
  const someUploading = files.some((f) => f.status === "uploading");

  if (uploadComplete) {
    return (
      <div>
        <div className="page-header">
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Upload Evidence</h1>
        </div>
        <div className="page-content">
          <div className="card" style={{ padding: 48, textAlign: "center" }}>
            <CheckCircle size={48} style={{ color: "#10B981", margin: "0 auto 16px" }} />
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Upload Complete!</h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginBottom: 24 }}>
              {files.length} file(s) uploaded successfully.
            </p>

            {/* Uploaded files list */}
            <div style={{ textAlign: "left", marginBottom: 24 }}>
              {files.map((f) => (
                <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <CheckCircle size={14} style={{ color: "#10B981", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, flex: 1 }}>{f.file.name}</span>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ fontSize: 12 }}
                    onClick={() => alert("Navigate to evidence file")}
                  >
                    View <ChevronRight size={12} />
                  </button>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button className="btn btn-primary" onClick={() => { setFiles([]); setUploadComplete(false); }}>Upload More</button>
              <button className="btn btn-secondary" onClick={() => router.push("/evidence")}>View Evidence</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Upload Evidence</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            Upload photos, PDFs, and videos to your project evidence library
          </p>
        </div>
      </div>

      <div className="page-content">
        {/* Drop Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          style={{
            border: `2px dashed ${isDragOver ? "var(--primary)" : "var(--border)"}`,
            borderRadius: "var(--radius)",
            padding: 48,
            textAlign: "center",
            cursor: "pointer",
            background: isDragOver ? "var(--primary-light)" : "var(--surface)",
            transition: "all 0.2s",
            marginBottom: 24,
          }}
        >
          <Upload size={32} style={{ color: isDragOver ? "var(--primary)" : "var(--text-muted)", margin: "0 auto 12px" }} />
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
            {isDragOver ? "Drop files here" : "Drag & drop files here"}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
            or click to browse — accepts images, PDFs, and videos
          </div>
          <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
            Supported: JPG, PNG, GIF, WebP, PDF, MP4, MOV, AVI
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            multiple
            style={{ display: "none" }}
            onChange={onFileInput}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
            {files.map((entry) => (
              <div key={entry.id} className="card" style={{ padding: 20 }}>
                <div style={{ display: "flex", gap: 16 }}>
                  {/* Preview */}
                  <div style={{
                    width: 80, height: 80, flexShrink: 0, borderRadius: "var(--radius)",
                    overflow: "hidden", background: "var(--surface-raised)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {entry.preview ? (
                      <img src={entry.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <FileTypeIcon type={entry.file.type} size={32} />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{entry.file.name}</div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          {entry.file.type} · {formatBytes(entry.file.size)}
                        </div>
                      </div>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => removeEntry(entry.id)}
                        disabled={entry.status !== "idle"}
                      >
                        <X size={14} />
                      </button>
                    </div>

                    {entry.status === "idle" && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div>
                          <label className="form-label" style={{ fontSize: 11 }}>Project *</label>
                          <select
                            className="form-input"
                            style={{ fontSize: 13 }}
                            value={entry.project_id}
                            onChange={(e) => updateEntry(entry.id, { project_id: e.target.value })}
                          >
                            {PROJECTS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: 11 }}>Link to Change (optional)</label>
                          <select
                            className="form-input"
                            style={{ fontSize: 13 }}
                            value={entry.change_id}
                            onChange={(e) => updateEntry(entry.id, { change_id: e.target.value })}
                          >
                            <option value="">None</option>
                            {CHANGES.map((c) => <option key={c.id} value={c.id}>{c.ref} — {c.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: 11 }}>Classification *</label>
                          <select
                            className="form-input"
                            style={{ fontSize: 13 }}
                            value={entry.classification}
                            onChange={(e) => updateEntry(entry.id, { classification: e.target.value })}
                          >
                            {CLASSIFICATION_OPTIONS.map((c) => <option key={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="form-label" style={{ fontSize: 11 }}>Date Taken</label>
                          <input
                            className="form-input"
                            type="date"
                            style={{ fontSize: 13 }}
                            value={entry.date_taken}
                            onChange={(e) => updateEntry(entry.id, { date_taken: e.target.value })}
                          />
                        </div>
                        <div style={{ gridColumn: "1 / -1" }}>
                          <label className="form-label" style={{ fontSize: 11 }}>Description</label>
                          <input
                            className="form-input"
                            style={{ fontSize: 13 }}
                            placeholder="Brief description of this evidence…"
                            value={entry.description}
                            onChange={(e) => updateEntry(entry.id, { description: e.target.value })}
                          />
                        </div>
                      </div>
                    )}

                    {(entry.status === "uploading" || entry.status === "done") && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-muted)", marginBottom: 4 }}>
                          <span>{entry.status === "done" ? "Uploaded" : "Uploading…"}</span>
                          <span>{entry.progress}%</span>
                        </div>
                        <div style={{ height: 6, background: "var(--border)", borderRadius: 999 }}>
                          <div style={{
                            height: "100%",
                            width: `${entry.progress}%`,
                            background: entry.status === "done" ? "#10B981" : "#3B5EE8",
                            borderRadius: 999, transition: "width 0.2s",
                          }} />
                        </div>
                        {entry.status === "done" && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, color: "#10B981", fontSize: 13 }}>
                            <CheckCircle size={14} /> Uploaded successfully
                          </div>
                        )}
                      </div>
                    )}

                    {entry.status === "error" && (
                      <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#EF4444", fontSize: 13, marginTop: 8 }}>
                        <AlertCircle size={14} /> {entry.error ?? "Upload failed"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload All */}
        {files.length > 0 && (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setFiles([])} disabled={isUploading}>
              Clear All
            </button>
            <button
              className="btn btn-primary"
              onClick={uploadAll}
              disabled={!allMetadataFilled || isUploading || someUploading}
              style={{ display: "flex", alignItems: "center", gap: 8 }}
            >
              {isUploading ? (
                <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Uploading…</>
              ) : (
                <><Upload size={14} /> Upload All ({files.filter((f) => f.status === "idle").length} files)</>
              )}
            </button>
          </div>
        )}

        {files.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon"><Upload size={20} /></div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>No files selected</div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>Drag and drop files above or click to browse</div>
          </div>
        )}
      </div>
    </div>
  );
}

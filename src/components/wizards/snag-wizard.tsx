"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Camera, Upload, X, CheckCircle2, ChevronLeft, ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { getWorkspaceId } from "@/lib/workspace";
import { createAuditEvent } from "@/lib/audit";
import { uploadFile } from "@/lib/storage";
import { createNotification } from "@/lib/notifications";
import { cn } from "@/lib/utils";

type Trade =
  | "Brickwork"
  | "Plastering"
  | "Electrical"
  | "Plumbing"
  | "Carpentry"
  | "General"
  | "Other";

type Priority = "P1-Critical" | "P2-High" | "P3-Medium" | "P4-Low";

const TRADES: Trade[] = [
  "Brickwork",
  "Plastering",
  "Electrical",
  "Plumbing",
  "Carpentry",
  "General",
  "Other",
];

const PRIORITIES: { value: Priority; label: string; cls: string }[] = [
  { value: "P1-Critical", label: "P1 · Critical", cls: "chip-danger" },
  { value: "P2-High", label: "P2 · High", cls: "chip-warning" },
  { value: "P3-Medium", label: "P3 · Medium", cls: "chip-info" },
  { value: "P4-Low", label: "P4 · Low", cls: "chip-muted" },
];

interface SnagWizardProps {
  projectId: string;
  onClose: () => void;
  onCreated?: () => void;
}

interface UploadedPhoto {
  file: File;
  preview: string;
  storagePath?: string;
}

const WIZARD_STEPS = [
  { id: "details", label: "Snag Details" },
  { id: "evidence", label: "Evidence" },
  { id: "assignment", label: "Assignment & Target" },
];

export function SnagWizard({ projectId, onClose, onCreated }: SnagWizardProps) {
  const router = useRouter();

  const [step, setStep] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [showSuccess, setShowSuccess] = React.useState(false);

  const [location, setLocation] = React.useState<string>("");
  const [description, setDescription] = React.useState<string>("");
  const [trade, setTrade] = React.useState<Trade>("General");
  const [priority, setPriority] = React.useState<Priority>("P3-Medium");
  const [snagNumber, setSnagNumber] = React.useState<string>("");

  const [photos, setPhotos] = React.useState<UploadedPhoto[]>([]);
  const [videoUrl, setVideoUrl] = React.useState<string>("");
  const [evidenceNotes, setEvidenceNotes] = React.useState<string>("");

  const [assignee, setAssignee] = React.useState<string>("");
  const [targetDate, setTargetDate] = React.useState<string>("");
  const [sendNotification, setSendNotification] = React.useState<boolean>(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    async function loadSequence() {
      try {
        const supabase = createClient();
        const wid = await getWorkspaceId(supabase);
        const { count } = await supabase
          .from("snagging_items")
          .select("id", { count: "exact", head: true })
          .eq("project_id", projectId)
          .eq("workspace_id", wid);
        const seq = (count ?? 0) + 1;
        setSnagNumber(`SN-${String(seq).padStart(4, "0")}`);
      } catch {
        setSnagNumber(`SN-${String(Math.floor(Math.random() * 9000) + 1000)}`);
      }
    }
    void loadSequence();
  }, [projectId]);

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    for (const file of files) {
      const preview = URL.createObjectURL(file);
      setPhotos(prev => [...prev, { file, preview }]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removePhoto(index: number) {
    setPhotos(prev => {
      const p = prev[index];
      if (p) URL.revokeObjectURL(p.preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  function canAdvance(): boolean {
    if (step === 0) return location.trim().length > 0 && description.trim().length > 0;
    if (step === 1) return true;
    return true;
  }

  async function handleNext() {
    if (step < WIZARD_STEPS.length - 1) {
      setStep(s => s + 1);
      return;
    }
    await handleSubmit();
  }

  async function handleSubmit() {
    if (!description || !location) {
      toast.error("Please fill in required fields.");
      return;
    }
    setSubmitting(true);
    try {
      const supabase = createClient();
      const wid = await getWorkspaceId(supabase);
      const { data: { user } } = await supabase.auth.getUser();

      const uploadedPaths: string[] = [];
      for (const photo of photos) {
        try {
          const ext = photo.file.name.split(".").pop() ?? "jpg";
          const path = `${wid}/${projectId}/snags/${snagNumber}-${Date.now()}.${ext}`;
          const { path: storedPath } = await uploadFile(supabase, {
            bucket: "project-media",
            path,
            file: photo.file,
          });
          uploadedPaths.push(storedPath);
        } catch {
          // skip failed uploads — don't block the snag creation
        }
      }

      const { data: insertedSnag, error: insertError } = await supabase
        .from("snagging_items")
        .insert({
          project_id: projectId,
          workspace_id: wid,
          snag_number: snagNumber,
          location,
          description,
          trade,
          priority,
          status: "open",
          assignee: assignee || null,
          target_date: targetDate || null,
          video_url: videoUrl || null,
          evidence_notes: evidenceNotes || null,
          photo_paths: uploadedPaths,
        })
        .select("id")
        .single();

      if (insertError) throw new Error(insertError.message);

      await createAuditEvent(supabase, {
        workspace_id: wid,
        user_id: user?.id ?? "",
        action: "snag_created",
        resource_type: "snagging_item",
        resource_id: (insertedSnag as { id: string }).id,
        new_values: {
          snag_number: snagNumber,
          location,
          description,
          trade,
          priority,
          status: "open",
        },
      });

      if (sendNotification && assignee) {
        await createNotification(supabase, {
          workspace_id: wid,
          recipient_user_id: user?.id ?? "",
          type: "snag_assigned",
          title: `Snag ${snagNumber} Assigned`,
          body: `You have been assigned snag ${snagNumber}: ${description.slice(0, 80)}`,
          action_url: `/app/projects/${projectId}/snagging/${(insertedSnag as { id: string }).id}`,
          urgency: priority === "P1-Critical" ? "critical" : priority === "P2-High" ? "high" : "medium",
        });
      }

      setShowSuccess(true);
      onCreated?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create snag.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div
          className="card w-full max-w-md p-8 flex flex-col items-center gap-4"
          style={{ background: "var(--bg-surface)" }}
        >
          <CheckCircle2 size={48} style={{ color: "var(--success)" }} />
          <h3
            className="text-lg font-semibold text-center"
            style={{ color: "var(--text-primary)" }}
          >
            Snag {snagNumber} Created
          </h3>
          <p
            className="text-sm text-center"
            style={{ color: "var(--text-muted)" }}
          >
            The snag has been added to the register.
          </p>
          <div className="flex gap-3">
            <button
              className="btn btn-secondary"
              onClick={() => {
                setShowSuccess(false);
                setStep(0);
                setLocation("");
                setDescription("");
                setPhotos([]);
                setAssignee("");
                setTargetDate("");
                setSendNotification(false);
              }}
            >
              Add Another
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                onClose();
                router.push(`/app/projects/${projectId}/snagging`);
              }}
            >
              View Register
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div
        className="card w-full max-w-lg flex flex-col"
        style={{ background: "var(--bg-surface)", maxHeight: "90vh" }}
      >
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <h3
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Add Snag
            </h3>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {WIZARD_STEPS[step]?.label} — Step {step + 1} of {WIZARD_STEPS.length}
            </p>
          </div>
          <button
            className="btn btn-ghost btn-icon btn-sm"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <div
          className="flex gap-0 px-4 pt-3"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          {WIZARD_STEPS.map((s, i) => (
            <div
              key={s.id}
              className="flex-1 flex flex-col items-center pb-3 relative"
            >
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mb-1",
                  i < step
                    ? "bg-[var(--success)] text-white"
                    : i === step
                    ? "bg-[var(--primary)] text-white"
                    : "bg-[var(--bg-muted)] text-[var(--text-muted)]"
                )}
              >
                {i < step ? <CheckCircle2 size={12} /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-[10px] text-center",
                  i === step
                    ? "font-semibold text-[var(--text-primary)]"
                    : "text-[var(--text-muted)]"
                )}
              >
                {s.label}
              </span>
              {i === step && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ background: "var(--primary)" }}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="form-label">
                  Snag Number
                </label>
                <input
                  type="text"
                  className="form-input font-mono"
                  value={snagNumber}
                  readOnly
                  style={{ background: "var(--bg-subtle)" }}
                />
              </div>

              <div>
                <label className="form-label">
                  Location <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Level 3 – Room 301"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">
                  Description <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <textarea
                  className="form-input min-h-[100px] resize-none"
                  placeholder="Describe the defect or snag…"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">Trade Responsible</label>
                <select
                  className="form-input"
                  value={trade}
                  onChange={e => setTrade(e.target.value as Trade)}
                >
                  {TRADES.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Priority</label>
                <div className="flex flex-wrap gap-2">
                  {PRIORITIES.map(p => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPriority(p.value)}
                      className={cn(
                        "badge cursor-pointer border-2 transition-all",
                        p.cls,
                        priority === p.value
                          ? "border-[var(--text-primary)]"
                          : "border-transparent opacity-60"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div>
                <label className="form-label">Photos</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {photos.map((photo, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
                      <img
                        src={photo.preview}
                        alt={`Photo ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center"
                        onClick={() => removePhoto(i)}
                      >
                        <X size={10} color="white" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-colors hover:border-[var(--primary)]"
                    style={{ borderColor: "var(--border)" }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera size={18} style={{ color: "var(--text-muted)" }} />
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      Add Photo
                    </span>
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  multiple
                  className="sr-only"
                  onChange={handlePhotoSelect}
                />
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  On mobile this will open your camera. Multiple photos supported.
                </p>
              </div>

              <div>
                <label className="form-label">Video URL (optional)</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://…"
                  value={videoUrl}
                  onChange={e => setVideoUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">Additional Notes</label>
                <textarea
                  className="form-input min-h-[80px] resize-none"
                  placeholder="Any additional context about this snag…"
                  value={evidenceNotes}
                  onChange={e => setEvidenceNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div
                className="rounded-xl p-4 flex flex-col gap-2"
                style={{ background: "var(--bg-subtle)" }}
              >
                <p
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: "var(--text-muted)" }}
                >
                  Summary
                </p>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  {snagNumber} · {location}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {description}
                </p>
                <div className="flex items-center gap-2">
                  <span className="badge chip-muted">{trade}</span>
                  <span
                    className={cn(
                      "badge",
                      PRIORITIES.find(p => p.value === priority)?.cls ?? "chip-muted"
                    )}
                  >
                    {priority}
                  </span>
                  {photos.length > 0 && (
                    <span className="badge chip-muted">
                      {photos.length} photo{photos.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="form-label">Assign To</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Name of team member responsible"
                  value={assignee}
                  onChange={e => setAssignee(e.target.value)}
                />
              </div>

              <div>
                <label className="form-label">Target Completion Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={targetDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={e => setTargetDate(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="form-label mb-0">Send notification on assignment</label>
                <button
                  type="button"
                  onClick={() => setSendNotification(v => !v)}
                  className={cn(
                    "relative inline-flex h-5 w-9 rounded-full transition-colors flex-shrink-0",
                    sendNotification
                      ? "bg-[var(--primary)]"
                      : "bg-[var(--border)]"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
                      sendNotification && "translate-x-4"
                    )}
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        <div
          className="flex items-center justify-between p-4 border-t"
          style={{ borderColor: "var(--border)" }}
        >
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              if (step === 0) onClose();
              else setStep(s => s - 1);
            }}
          >
            <ChevronLeft size={14} />
            {step === 0 ? "Cancel" : "Back"}
          </button>

          <button
            className="btn btn-primary btn-sm"
            disabled={!canAdvance() || submitting}
            onClick={() => void handleNext()}
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saving…
              </>
            ) : step === WIZARD_STEPS.length - 1 ? (
              <>
                <CheckCircle2 size={14} />
                Create Snag
              </>
            ) : (
              <>
                Next
                <ChevronRight size={14} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

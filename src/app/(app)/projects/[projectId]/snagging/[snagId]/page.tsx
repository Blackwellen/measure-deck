"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, CheckCircle2, Image as ImageIcon, User,
  Calendar, Clock, AlertCircle, AlertTriangle, X, Camera,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { getWorkspaceId } from "@/lib/workspace";
import { createAuditEvent } from "@/lib/audit";
import { uploadFile, getSignedUrl } from "@/lib/storage";
import { FeatureGate } from "@/components/ui/feature-gate";
import { cn, formatDate, formatDateTime, formatRelative, getInitials } from "@/lib/utils";
import React from "react";

type SnagStatus = "open" | "in_progress" | "awaiting_inspection" | "closed";
type SnagPriority = "P1-Critical" | "P2-High" | "P3-Medium" | "P4-Low";

interface SnagItem {
  id: string;
  snag_number: string;
  location: string;
  description: string;
  trade: string;
  priority: SnagPriority;
  status: SnagStatus;
  assignee?: string;
  target_date?: string;
  photo_paths?: string[];
  video_url?: string;
  evidence_notes?: string;
  reported_at: string;
  resolved_at?: string;
  project_id: string;
  workspace_id: string;
}

interface AuditEvent {
  id: string;
  action: string;
  new_values?: Record<string, unknown>;
  created_at: string;
  user_id: string;
}

const STATUS_CHIP: Record<SnagStatus, string> = {
  open: "chip-danger",
  in_progress: "chip-warning",
  awaiting_inspection: "chip-info",
  closed: "chip-success",
};

const STATUS_LABEL: Record<SnagStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  awaiting_inspection: "Awaiting Inspection",
  closed: "Closed",
};

const PRIORITY_CHIP: Record<SnagPriority, string> = {
  "P1-Critical": "chip-danger",
  "P2-High": "chip-warning",
  "P3-Medium": "chip-info",
  "P4-Low": "chip-muted",
};

const NEXT_STATUSES: Record<SnagStatus, SnagStatus[]> = {
  open: ["in_progress", "awaiting_inspection", "closed"],
  in_progress: ["awaiting_inspection", "closed"],
  awaiting_inspection: ["in_progress", "closed"],
  closed: [],
};

function PhotoGallery({ paths }: { paths: string[] }) {
  const [urls, setUrls] = useState<string[]>([]);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    async function loadUrls() {
      const supabase = createClient();
      const resolved: string[] = [];
      for (const path of paths) {
        try {
          const url = await getSignedUrl(supabase, {
            bucket: "project-media",
            path,
            expiresIn: 3600,
          });
          resolved.push(url);
        } catch {
          resolved.push("");
        }
      }
      setUrls(resolved);
    }
    if (paths.length > 0) void loadUrls();
  }, [paths]);

  if (paths.length === 0) return null;

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {urls.map((url, i) => (
          url ? (
            <button
              key={i}
              type="button"
              className="w-20 h-20 rounded-xl overflow-hidden border hover:opacity-80 transition-opacity"
              style={{ borderColor: "var(--border)" }}
              onClick={() => setLightboxIdx(i)}
            >
              <img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ) : (
            <div
              key={i}
              className="w-20 h-20 rounded-xl border flex items-center justify-center"
              style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}
            >
              <ImageIcon size={18} style={{ color: "var(--text-muted)" }} />
            </div>
          )
        ))}
      </div>

      {lightboxIdx !== null && urls[lightboxIdx] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
            onClick={() => setLightboxIdx(null)}
          >
            <X size={16} color="white" />
          </button>
          <img
            src={urls[lightboxIdx]}
            alt="Snag photo"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}

function StatusTimeline({ events }: { events: AuditEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        No status updates yet.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      {events.map((ev, idx) => {
        const note = typeof ev.new_values?.note === "string"
          ? ev.new_values.note
          : null;
        const newStatus = typeof ev.new_values?.status === "string"
          ? ev.new_values.status
          : null;

        return (
          <div
            key={ev.id}
            className="flex items-start gap-3 pb-4 relative"
          >
            {idx < events.length - 1 && (
              <div
                className="absolute left-3 top-7 bottom-0 w-0.5"
                style={{ background: "var(--border)" }}
              />
            )}
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 mt-0.5"
              style={{
                background: newStatus === "closed"
                  ? "var(--success)"
                  : "var(--primary)",
              }}
            >
              {newStatus === "closed" ? (
                <CheckCircle2 size={11} color="white" />
              ) : (
                <Clock size={10} color="white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                {ev.action.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                {newStatus && (
                  <span
                    className={cn(
                      "ml-2 badge",
                      STATUS_CHIP[newStatus as SnagStatus] ?? "chip-muted"
                    )}
                  >
                    {STATUS_LABEL[newStatus as SnagStatus] ?? newStatus}
                  </span>
                )}
              </p>
              {note && (
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {note}
                </p>
              )}
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                {formatRelative(ev.created_at)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SnagDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const snagId = params.snagId as string;

  const [snag, setSnag] = useState<SnagItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);

  const [statusUpdating, setStatusUpdating] = useState(false);
  const [updateNote, setUpdateNote] = useState<string>("");
  const [pendingStatus, setPendingStatus] = useState<SnagStatus | null>(null);

  const [closing, setClosing] = useState(false);
  const [closingNote, setClosingNote] = useState<string>("");
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [closingPhoto, setClosingPhoto] = useState<File | null>(null);
  const closePhotoRef = React.useRef<HTMLInputElement>(null);

  const [editAssignee, setEditAssignee] = useState<string>("");
  const [editTargetDate, setEditTargetDate] = useState<string>("");
  const [reassigning, setReassigning] = useState(false);
  const [showReassign, setShowReassign] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const wid = await getWorkspaceId(supabase);
      const { data: { user } } = await supabase.auth.getUser();
      setWorkspaceId(wid);
      setUserId(user?.id ?? "");

      const { data: snagData } = await supabase
        .from("snagging_items")
        .select("*")
        .eq("id", snagId)
        .eq("workspace_id", wid)
        .single();

      if (snagData) {
        setSnag(snagData as SnagItem);
        setEditAssignee((snagData as SnagItem).assignee ?? "");
        setEditTargetDate((snagData as SnagItem).target_date ?? "");
      }

      const { data: events } = await supabase
        .from("audit_events")
        .select("id, action, new_values, created_at, user_id")
        .eq("resource_type", "snagging_item")
        .eq("resource_id", snagId)
        .order("created_at", { ascending: false });

      setAuditEvents((events ?? []) as AuditEvent[]);
    } catch {
      setSnag(null);
    } finally {
      setLoading(false);
    }
  }, [snagId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function updateStatus(newStatus: SnagStatus, note: string) {
    if (!snag) return;
    setStatusUpdating(true);
    try {
      const supabase = createClient();
      const updates: Record<string, unknown> = { status: newStatus };
      if (newStatus === "closed") {
        updates.resolved_at = new Date().toISOString();
      }

      await supabase
        .from("snagging_items")
        .update(updates)
        .eq("id", snagId);

      await createAuditEvent(supabase, {
        workspace_id: workspaceId,
        user_id: userId,
        action: "snag_status_updated",
        resource_type: "snagging_item",
        resource_id: snagId,
        old_values: { status: snag.status },
        new_values: { status: newStatus, note },
      });

      setSnag(prev =>
        prev
          ? {
              ...prev,
              status: newStatus,
              resolved_at: newStatus === "closed" ? new Date().toISOString() : prev.resolved_at,
            }
          : prev
      );

      setAuditEvents(prev => [
        {
          id: `ev-${Date.now()}`,
          action: "snag_status_updated",
          new_values: { status: newStatus, note },
          created_at: new Date().toISOString(),
          user_id: userId,
        },
        ...prev,
      ]);

      setPendingStatus(null);
      setUpdateNote("");
      toast.success("Status updated.");
    } catch {
      toast.error("Failed to update status.");
    } finally {
      setStatusUpdating(false);
    }
  }

  async function handleClose() {
    if (!closingNote.trim()) {
      toast.error("A closing note is required.");
      return;
    }
    setClosing(true);
    try {
      const supabase = createClient();

      if (closingPhoto) {
        const ext = closingPhoto.name.split(".").pop() ?? "jpg";
        const path = `${workspaceId}/${projectId}/snags/resolved-${snagId}-${Date.now()}.${ext}`;
        const { path: storedPath } = await uploadFile(supabase, {
          bucket: "project-media",
          path,
          file: closingPhoto,
        });

        if (snag) {
          const existing = snag.photo_paths ?? [];
          await supabase
            .from("snagging_items")
            .update({ photo_paths: [...existing, storedPath] })
            .eq("id", snagId);
        }
      }

      await updateStatus("closed", closingNote);
      setShowCloseForm(false);
      setClosingNote("");
      setClosingPhoto(null);
    } finally {
      setClosing(false);
    }
  }

  async function handleReassign() {
    if (!snag) return;
    setReassigning(true);
    try {
      const supabase = createClient();
      await supabase
        .from("snagging_items")
        .update({
          assignee: editAssignee || null,
          target_date: editTargetDate || null,
        })
        .eq("id", snagId);

      await createAuditEvent(supabase, {
        workspace_id: workspaceId,
        user_id: userId,
        action: "snag_reassigned",
        resource_type: "snagging_item",
        resource_id: snagId,
        old_values: { assignee: snag.assignee, target_date: snag.target_date },
        new_values: { assignee: editAssignee, target_date: editTargetDate },
      });

      setSnag(prev =>
        prev ? { ...prev, assignee: editAssignee, target_date: editTargetDate } : prev
      );
      setShowReassign(false);
      toast.success("Assignment updated.");
    } catch {
      toast.error("Failed to update assignment.");
    } finally {
      setReassigning(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div className="skeleton h-8 w-40 rounded-[var(--radius)]" />
        <div className="skeleton h-48 rounded-[var(--radius)]" />
        <div className="skeleton h-32 rounded-[var(--radius)]" />
      </div>
    );
  }

  if (!snag) {
    return (
      <FeatureGate flag="pc_snagging">
        <div className="flex flex-col items-center justify-center gap-4 p-12">
          <AlertCircle size={32} style={{ color: "var(--text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Snag not found.
          </p>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => router.push(`/app/projects/${projectId}/snagging`)}
          >
            <ArrowLeft size={13} />
            Back to Register
          </button>
        </div>
      </FeatureGate>
    );
  }

  const availableStatuses = NEXT_STATUSES[snag.status];

  return (
    <FeatureGate flag="pc_snagging">
      <div className="flex flex-col min-h-full">
        <div className="page-header flex-col items-start gap-4">
          <button
            className="btn btn-ghost btn-sm text-xs"
            style={{ color: "var(--text-muted)" }}
            onClick={() => router.push(`/app/projects/${projectId}/snagging`)}
          >
            <ArrowLeft size={13} />
            Back to Register
          </button>

          <div className="flex items-start justify-between w-full gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <span
                  className="font-mono text-lg font-bold"
                  style={{ color: "var(--primary)" }}
                >
                  {snag.snag_number}
                </span>
                <span className={cn("badge", PRIORITY_CHIP[snag.priority])}>
                  {snag.priority}
                </span>
                <span className={cn("badge", STATUS_CHIP[snag.status])}>
                  {STATUS_LABEL[snag.status]}
                </span>
              </div>
              <p
                className="text-xl font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {snag.description}
              </p>
            </div>

            {snag.status !== "closed" && (
              <button
                className="btn btn-danger btn-sm"
                onClick={() => setShowCloseForm(v => !v)}
              >
                <CheckCircle2 size={14} />
                Mark as Resolved
              </button>
            )}
          </div>
        </div>

        <div className="page-content flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 flex flex-col gap-5">
              <div className="card p-5 flex flex-col gap-4">
                <h3
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Snag Details
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Location
                    </p>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {snag.location}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Trade
                    </p>
                    <span className="badge chip-muted">{snag.trade}</span>
                  </div>
                  <div>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Reported
                    </p>
                    <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                      {formatDate(snag.reported_at)}
                    </p>
                  </div>
                  {snag.resolved_at && (
                    <div>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Resolved
                      </p>
                      <p className="text-sm" style={{ color: "var(--success)" }}>
                        {formatDate(snag.resolved_at)}
                      </p>
                    </div>
                  )}
                </div>

                {snag.evidence_notes && (
                  <div>
                    <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                      Additional Notes
                    </p>
                    <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                      {snag.evidence_notes}
                    </p>
                  </div>
                )}

                {snag.photo_paths && snag.photo_paths.length > 0 && (
                  <div>
                    <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                      Photos
                    </p>
                    <PhotoGallery
                      paths={snag.photo_paths}
                    />
                  </div>
                )}

                {snag.video_url && (
                  <div>
                    <p className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                      Video Reference
                    </p>
                    <a
                      href={snag.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm"
                      style={{ color: "var(--primary)" }}
                    >
                      {snag.video_url}
                    </a>
                  </div>
                )}
              </div>

              {snag.status !== "closed" && (
                <div className="card p-5 flex flex-col gap-4">
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Update Status
                  </h3>

                  {availableStatuses.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-wrap gap-2">
                        {availableStatuses.map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() =>
                              setPendingStatus(pendingStatus === s ? null : s)
                            }
                            className={cn(
                              "badge cursor-pointer border-2 transition-all",
                              STATUS_CHIP[s],
                              pendingStatus === s
                                ? "border-[var(--text-primary)]"
                                : "border-transparent"
                            )}
                          >
                            {STATUS_LABEL[s]}
                          </button>
                        ))}
                      </div>

                      {pendingStatus && (
                        <div className="flex flex-col gap-2">
                          <label className="form-label">
                            Note (required)
                          </label>
                          <textarea
                            className="form-input min-h-[70px] resize-none"
                            placeholder="Describe the update…"
                            value={updateNote}
                            onChange={e => setUpdateNote(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <button
                              className="btn btn-primary btn-sm"
                              disabled={!updateNote.trim() || statusUpdating}
                              onClick={() => void updateStatus(pendingStatus, updateNote)}
                            >
                              {statusUpdating ? "Saving…" : "Confirm Update"}
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setPendingStatus(null);
                                setUpdateNote("");
                              }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                      This snag is closed.
                    </p>
                  )}
                </div>
              )}

              {showCloseForm && snag.status !== "closed" && (
                <div
                  className="card p-5 flex flex-col gap-4"
                  style={{ borderColor: "var(--success)", borderWidth: 1 }}
                >
                  <h3
                    className="text-sm font-semibold flex items-center gap-2"
                    style={{ color: "var(--success)" }}
                  >
                    <CheckCircle2 size={15} />
                    Mark as Resolved
                  </h3>

                  <div>
                    <label className="form-label">
                      Closing Note <span style={{ color: "var(--danger)" }}>*</span>
                    </label>
                    <textarea
                      className="form-input min-h-[80px] resize-none"
                      placeholder="Describe how the defect was resolved…"
                      value={closingNote}
                      onChange={e => setClosingNote(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label">Resolution Photo (optional)</label>
                    <div className="flex items-center gap-3">
                      {closingPhoto ? (
                        <div className="flex items-center gap-2">
                          <img
                            src={URL.createObjectURL(closingPhoto)}
                            alt="Resolution"
                            className="w-16 h-16 rounded-xl object-cover border"
                            style={{ borderColor: "var(--border)" }}
                          />
                          <button
                            type="button"
                            className="btn btn-ghost btn-icon btn-sm"
                            onClick={() => setClosingPhoto(null)}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => closePhotoRef.current?.click()}
                        >
                          <Camera size={13} />
                          Attach Photo
                        </button>
                      )}
                      <input
                        ref={closePhotoRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="sr-only"
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) setClosingPhoto(f);
                          if (closePhotoRef.current) closePhotoRef.current.value = "";
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={!closingNote.trim() || closing}
                      onClick={() => void handleClose()}
                    >
                      {closing ? "Resolving…" : "Confirm Resolution"}
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => {
                        setShowCloseForm(false);
                        setClosingNote("");
                        setClosingPhoto(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="card p-5 flex flex-col gap-4">
                <h3
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Timeline
                </h3>
                <StatusTimeline events={auditEvents} />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="card p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Assignment
                  </h3>
                  {snag.status !== "closed" && (
                    <button
                      className="btn btn-ghost btn-sm text-xs"
                      onClick={() => setShowReassign(v => !v)}
                    >
                      {showReassign ? "Cancel" : "Reassign"}
                    </button>
                  )}
                </div>

                {!showReassign ? (
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Assignee
                      </p>
                      {snag.assignee ? (
                        <div className="flex items-center gap-2 mt-1">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                            style={{ background: "var(--primary)" }}
                          >
                            {getInitials(snag.assignee)}
                          </div>
                          <span
                            className="text-sm font-medium"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {snag.assignee}
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                          Unassigned
                        </p>
                      )}
                    </div>

                    {snag.target_date && (
                      <div>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          Target Date
                        </p>
                        <p
                          className="text-sm font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {formatDate(snag.target_date)}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="form-label">Assignee</label>
                      <input
                        type="text"
                        className="form-input"
                        value={editAssignee}
                        onChange={e => setEditAssignee(e.target.value)}
                        placeholder="Team member name"
                      />
                    </div>
                    <div>
                      <label className="form-label">Target Date</label>
                      <input
                        type="date"
                        className="form-input"
                        value={editTargetDate}
                        onChange={e => setEditTargetDate(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-primary btn-sm flex-1"
                        disabled={reassigning}
                        onClick={() => void handleReassign()}
                      >
                        {reassigning ? "Saving…" : "Save"}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="card p-5 flex flex-col gap-3">
                <h3
                  className="text-sm font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  Snag Info
                </h3>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between py-1.5 border-b last:border-0" style={{ borderColor: "var(--border-subtle)" }}>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Number</span>
                    <span className="text-xs font-mono font-semibold" style={{ color: "var(--primary)" }}>
                      {snag.snag_number}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b last:border-0" style={{ borderColor: "var(--border-subtle)" }}>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Priority</span>
                    <span className={cn("badge text-xs", PRIORITY_CHIP[snag.priority])}>
                      {snag.priority}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b last:border-0" style={{ borderColor: "var(--border-subtle)" }}>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Trade</span>
                    <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                      {snag.trade}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b last:border-0" style={{ borderColor: "var(--border-subtle)" }}>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Photos</span>
                    <span className="text-xs" style={{ color: "var(--text-primary)" }}>
                      {snag.photo_paths?.length ?? 0}
                    </span>
                  </div>
                  <div className="flex justify-between py-1.5 last:border-0" style={{ borderColor: "var(--border-subtle)" }}>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Status Updates</span>
                    <span className="text-xs" style={{ color: "var(--text-primary)" }}>
                      {auditEvents.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FeatureGate>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import React from "react";

interface NoteEvent {
  id: string;
  actor_name: string;
  created_at: string;
  new_values: { note: string };
}

interface NotesComposerProps {
  entityType: string;
  entityId: string;
  workspaceId: string;
  className?: string;
}

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const MAX_CHARS = 2000;

export function NotesComposer({ entityType, entityId, workspaceId, className }: NotesComposerProps) {
  const [text, setText] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [notes, setNotes] = React.useState<NoteEvent[]>([]);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  const supabase = React.useMemo(() => createClient(), []);

  React.useEffect(() => {
    async function fetchNotes() {
      const { data, error } = await supabase
        .from("audit_events")
        .select("id, actor_name, created_at, new_values")
        .eq("action", "note_added")
        .eq("resource_id", entityId)
        .order("created_at", { ascending: false });

      if (error) {
        setFetchError(error.message);
        return;
      }
      setNotes((data as NoteEvent[]) ?? []);
    }
    void fetchNotes();
  }, [entityId, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || loading) return;
    setLoading(true);
    const { error } = await supabase.from("audit_events").insert({
      workspace_id: workspaceId,
      action: "note_added",
      resource_type: entityType,
      resource_id: entityId,
      new_values: { note: text.trim() },
    });
    if (!error) {
      const { data } = await supabase
        .from("audit_events")
        .select("id, actor_name, created_at, new_values")
        .eq("action", "note_added")
        .eq("resource_id", entityId)
        .order("created_at", { ascending: false });
      setNotes((data as NoteEvent[]) ?? []);
      setText("");
    }
    setLoading(false);
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
          placeholder="Add a note..."
          rows={3}
          className="w-full rounded-lg border px-3 py-2 text-[13px] resize-none focus:outline-none focus:ring-2"
          style={{
            borderColor: "var(--border)",
            background: "var(--bg-surface)",
            color: "var(--text-primary)",
          }}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {text.length}/{MAX_CHARS}
          </span>
          <button
            type="submit"
            disabled={!text.trim() || loading}
            className="btn btn-primary btn-sm"
          >
            {loading ? "Saving..." : "Add Note"}
          </button>
        </div>
      </form>

      {fetchError && (
        <p className="text-[12px] text-red-600">{fetchError}</p>
      )}

      {notes.length > 0 && (
        <div className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
          {notes.map((note) => (
            <div key={note.id} className="flex gap-3 py-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-700 shrink-0"
                style={{ background: "var(--primary)", color: "#fff" }}
              >
                {initials(note.actor_name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-600" style={{ color: "var(--text-primary)" }}>
                    {note.actor_name}
                  </span>
                  <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                    {relativeTime(note.created_at)}
                  </span>
                </div>
                <p className="text-[13px] mt-0.5 leading-snug" style={{ color: "var(--text-secondary)" }}>
                  {note.new_values?.note}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default NotesComposer;

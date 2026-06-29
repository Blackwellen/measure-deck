"use client";

import { useState } from "react";
import { Mail, Archive, Monitor, Users, Plus, ChevronDown, ChevronUp, Paperclip } from "lucide-react";
import { CE025_CORRESPONDENCE, type SeedCorrespondence } from "@/lib/seed/projects";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDateTime(s: string): string {
  const d = new Date(s);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function channelIcon(ch: SeedCorrespondence["channel"]) {
  if (ch === "Email") return <Mail size={12} />;
  if (ch === "Portal") return <Monitor size={12} />;
  if (ch === "Meeting") return <Users size={12} />;
  return <Archive size={12} />;
}

function channelChip(ch: SeedCorrespondence["channel"]): string {
  const map: Record<SeedCorrespondence["channel"], string> = {
    Email: "chip-info",
    Portal: "chip-primary",
    Letter: "chip-muted",
    Meeting: "chip-violet",
  };
  return map[ch];
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CorrespondencePage() {
  const [dirFilter, setDirFilter] = useState<"All" | "Sent" | "Received">("All");
  const [channelFilter, setChannelFilter] = useState<string>("All");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formSubject, setFormSubject] = useState("");
  const [formDirection, setFormDirection] = useState<"Sent" | "Received">("Sent");
  const [formChannel, setFormChannel] = useState<SeedCorrespondence["channel"]>("Email");
  const [formCorrespondent, setFormCorrespondent] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formSummary, setFormSummary] = useState("");

  const channels = ["All", "Email", "Portal", "Letter", "Meeting"];

  const filtered = CE025_CORRESPONDENCE.filter((c) => {
    const matchDir = dirFilter === "All" || c.direction === dirFilter;
    const matchCh = channelFilter === "All" || c.channel === channelFilter;
    return matchDir && matchCh;
  });

  function toggle(id: string) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Filters + Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {(["All", "Sent", "Received"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDirFilter(d)}
              className="btn btn-sm"
              style={{
                background: dirFilter === d ? "var(--primary)" : "var(--bg-muted)",
                color: dirFilter === d ? "#fff" : "var(--text-secondary)",
                border: "1px solid",
                borderColor: dirFilter === d ? "var(--primary)" : "var(--border)",
              }}
            >
              {d}
            </button>
          ))}
          <select
            className="form-input h-9 text-sm w-36"
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
          >
            {channels.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={13} />
          Record Correspondence
        </button>
      </div>

      {/* Timeline */}
      <div className="flex flex-col gap-0">
        {filtered.map((item, idx) => {
          const isSent = item.direction === "Sent";
          const isOpen = expanded === item.id;
          return (
            <div key={item.id} className="relative flex gap-4 pb-6 last:pb-0">
              {/* Connector line */}
              {idx < filtered.length - 1 && (
                <div
                  className="absolute left-4 top-10 bottom-0 w-px"
                  style={{ background: "var(--border)" }}
                />
              )}

              {/* Icon */}
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10 mt-0.5"
                style={{
                  background: isSent ? "rgba(59,94,232,0.12)" : "var(--bg-muted)",
                  border: `2px solid ${isSent ? "var(--primary)" : "var(--border)"}`,
                  color: isSent ? "var(--primary)" : "var(--text-muted)",
                }}
              >
                <Mail size={14} />
              </div>

              {/* Card */}
              <div className="flex-1 card p-4">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`badge text-[10px] ${isSent ? "chip-info" : "chip-muted"}`}
                    >
                      {item.direction}
                    </span>
                    <span
                      className={`badge text-[10px] flex items-center gap-1 ${channelChip(item.channel)}`}
                    >
                      {channelIcon(item.channel)}
                      {item.channel}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {fmtDateTime(item.date)}
                  </span>
                </div>

                {/* Subject + parties */}
                <h4 className="text-sm font-semibold mb-1" style={{ color: "var(--text-primary)" }}>
                  {item.subject}
                </h4>
                <div className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
                  {isSent ? "To:" : "From:"} {item.correspondent}
                </div>

                {/* Summary */}
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {item.summary}
                </p>

                {/* Body (expanded) */}
                {isOpen && (
                  <div
                    className="mt-3 p-3 rounded-lg text-sm leading-relaxed whitespace-pre-line"
                    style={{
                      background: "var(--bg-muted)",
                      color: "var(--text-secondary)",
                      borderLeft: "3px solid var(--primary)",
                    }}
                  >
                    {item.body}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    className="btn btn-ghost btn-sm text-xs"
                    onClick={() => toggle(item.id)}
                  >
                    {isOpen ? (
                      <>
                        <ChevronUp size={11} /> Collapse
                      </>
                    ) : (
                      <>
                        <ChevronDown size={11} /> Read Full
                      </>
                    )}
                  </button>
                  <button className="btn btn-ghost btn-sm text-xs">
                    <Paperclip size={11} /> Attach
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="card p-8 text-center">
            <div className="text-sm" style={{ color: "var(--text-muted)" }}>
              No correspondence matches the current filter.
            </div>
          </div>
        )}
      </div>

      {/* Inline Form */}
      {showForm && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Record Correspondence
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="sm:col-span-2">
              <label className="form-label">Subject</label>
              <input
                className="form-input"
                placeholder="Correspondence subject..."
                value={formSubject}
                onChange={(e) => setFormSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Direction</label>
              <select
                className="form-input"
                value={formDirection}
                onChange={(e) => setFormDirection(e.target.value as "Sent" | "Received")}
              >
                <option>Sent</option>
                <option>Received</option>
              </select>
            </div>
            <div>
              <label className="form-label">Channel</label>
              <select
                className="form-input"
                value={formChannel}
                onChange={(e) => setFormChannel(e.target.value as SeedCorrespondence["channel"])}
              >
                <option>Email</option>
                <option>Portal</option>
                <option>Letter</option>
                <option>Meeting</option>
              </select>
            </div>
            <div>
              <label className="form-label">Correspondent</label>
              <input
                className="form-input"
                placeholder="Name and organisation..."
                value={formCorrespondent}
                onChange={(e) => setFormCorrespondent(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Date</label>
              <input
                className="form-input"
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Summary</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Brief summary of the correspondence..."
                value={formSummary}
                onChange={(e) => setFormSummary(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-primary btn-sm">Save</button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface AuditEvent {
  id: string;
  actor_name: string;
  actor_avatar?: string;
  action: string;
  summary: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

interface AuditFeedProps {
  events: AuditEvent[];
  className?: string;
}

function relativeTime(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function AuditEventRow({ event }: { event: AuditEvent }) {
  const [expanded, setExpanded] = React.useState(false);
  const hasMetadata = event.metadata && Object.keys(event.metadata).length > 0;

  return (
    <div className="flex gap-3 py-3 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
      <div className="shrink-0">
        {event.actor_avatar ? (
          <img
            src={event.actor_avatar}
            alt={event.actor_name}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-700"
            style={{ background: "var(--primary)", color: "#fff" }}
          >
            {initials(event.actor_name)}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="text-[13px] font-600" style={{ color: "var(--text-primary)" }}>
              {event.actor_name}
            </span>{" "}
            <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
              {event.action}
            </span>
          </div>
          <span className="text-[11px] shrink-0" style={{ color: "var(--text-muted)" }}>
            {relativeTime(event.created_at)}
          </span>
        </div>
        <p className="text-[12px] mt-0.5 leading-snug" style={{ color: "var(--text-muted)" }}>
          {event.summary}
        </p>
        {hasMetadata && (
          <button
            type="button"
            onClick={() => setExpanded((p) => !p)}
            className="text-[11px] mt-1 underline underline-offset-2"
            style={{ color: "var(--primary)" }}
          >
            {expanded ? "Hide details" : "Show details"}
          </button>
        )}
        {expanded && hasMetadata && (
          <pre
            className={cn(
              "mt-2 text-[10px] rounded-md p-2 overflow-x-auto leading-relaxed"
            )}
            style={{
              background: "var(--bg-subtle)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
            }}
          >
            {JSON.stringify(event.metadata, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

export function AuditFeed({ events, className }: AuditFeedProps) {
  if (events.length === 0) {
    return (
      <p className="text-[13px] py-4 text-center" style={{ color: "var(--text-muted)" }}>
        No activity yet.
      </p>
    );
  }
  return (
    <div className={cn("flex flex-col", className)}>
      {events.map((event) => (
        <AuditEventRow key={event.id} event={event} />
      ))}
    </div>
  );
}

export default AuditFeed;

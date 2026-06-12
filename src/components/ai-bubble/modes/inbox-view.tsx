"use client";

import { cn } from "@/lib/utils";
import { formatRelative } from "@/lib/utils";
import { ArrowLeft, CheckCheck, Inbox } from "lucide-react";
import React, { useState } from "react";

interface Thread {
  id: string;
  subject: string;
  preview: string;
  timestamp: string;
  unread: boolean;
  type: "payment" | "change" | "task" | "system";
  messages: { from: string; body: string; timestamp: string }[];
}

const MOCK_THREADS: Thread[] = [
  {
    id: "1",
    subject: "Payment Application #12 Certified",
    preview: "Your application for £245,000 has been certified by the QS.",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    unread: true,
    type: "payment",
    messages: [
      {
        from: "MeasureDeck System",
        body: "Payment Application #12 for £245,000 has been certified. The certified sum is £238,500. Reference: PA-12.",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
    ],
  },
  {
    id: "2",
    subject: "Change Event CE-042 Approved",
    preview: "Change event for 'Ground conditions variation' has been agreed.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    unread: true,
    type: "change",
    messages: [
      {
        from: "Project Manager",
        body: "The change event CE-042 for 'Ground conditions variation' at £18,400 has been agreed and added to the contract sum.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
    ],
  },
  {
    id: "3",
    subject: "Task overdue: Site inspection report",
    preview: "This task was due 2 days ago and remains incomplete.",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    unread: false,
    type: "task",
    messages: [
      {
        from: "MeasureDeck System",
        body: "The task 'Site inspection report' was due on 8 Jun 2026 and is still marked as in progress. Please update the status.",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
      },
    ],
  },
];

const TYPE_LABELS: Record<Thread["type"], string> = {
  payment: "Payment",
  change: "Change",
  task: "Task",
  system: "System",
};

export function InboxView() {
  const [threads, setThreads] = useState<Thread[]>(MOCK_THREADS);
  const [selected, setSelected] = useState<Thread | null>(null);

  const markAllRead = () => {
    setThreads((prev) => prev.map((t) => ({ ...t, unread: false })));
  };

  const openThread = (thread: Thread) => {
    setSelected(thread);
    setThreads((prev) =>
      prev.map((t) => (t.id === thread.id ? { ...t, unread: false } : t))
    );
  };

  if (selected) {
    return (
      <div className="flex flex-col h-full">
        {/* Thread header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="btn btn-ghost btn-icon btn-sm"
            aria-label="Back to inbox"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h3 className="text-[13px] font-600 truncate" style={{ color: "var(--text-primary)" }}>
            {selected.subject}
          </h3>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {selected.messages.map((msg, i) => (
            <div key={i} className="rounded-xl p-3" style={{ background: "var(--bg-subtle)" }}>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[12px] font-600" style={{ color: "var(--text-primary)" }}>
                  {msg.from}
                </span>
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                  {formatRelative(msg.timestamp)}
                </span>
              </div>
              <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                {msg.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const unreadCount = threads.filter((t) => t.unread).length;

  return (
    <div className="flex flex-col h-full">
      {/* Header row */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
        <span className="text-[12px] font-600" style={{ color: "var(--text-muted)" }}>
          {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        </span>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="flex items-center gap-1 text-[12px]"
            style={{ color: "var(--primary)" }}
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto">
        {threads.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Inbox className="w-8 h-8" style={{ color: "var(--text-muted)" }} />
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Your inbox is empty</p>
          </div>
        ) : (
          threads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              onClick={() => openThread(thread)}
              className={cn(
                "w-full text-left flex items-start gap-3 px-4 py-3 border-b transition-colors hover:bg-[var(--bg-subtle)]",
                thread.unread && "bg-blue-50/50"
              )}
              style={{ borderColor: "var(--border)" }}
            >
              {/* Unread dot */}
              <div className="flex-shrink-0 mt-1.5 w-2">
                {thread.unread && (
                  <div className="w-2 h-2 rounded-full" style={{ background: "var(--primary)" }} />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={cn("text-[13px] truncate", thread.unread ? "font-600" : "font-500")}
                    style={{ color: "var(--text-primary)" }}>
                    {thread.subject}
                  </p>
                  <span className="text-[11px] flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                    {formatRelative(thread.timestamp)}
                  </span>
                </div>
                <p className="text-[12px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {thread.preview}
                </p>
                <span className="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{ background: "var(--bg-subtle)", color: "var(--text-muted)" }}>
                  {TYPE_LABELS[thread.type]}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default InboxView;

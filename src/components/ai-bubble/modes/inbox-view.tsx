"use client";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  Archive,
  ArrowLeft,
  Bell,
  CheckCheck,
  FileText,
  Inbox,
  Loader2,
  RefreshCw,
  Zap,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

/* ─── Types ─────────────────────────────────────────────────────────── */

export type NotificationType = "payment" | "change" | "task" | "system" | "mention" | "risk";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  archived: boolean;
  related_url?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

/* ─── Seed data fallback ─────────────────────────────────────────────── */

const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    user_id: "seed",
    type: "payment",
    title: "Payment Application #12 Certified",
    body: "Payment Application #12 for £245,000 has been certified by the QS. Certified sum: £238,500.",
    read: false,
    archived: false,
    related_url: "/app/applications",
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: "n2",
    user_id: "seed",
    type: "change",
    title: "Change Event CE-042 Approved",
    body: "Change event for 'Ground conditions variation' at £18,400 has been agreed and added to the contract sum.",
    read: false,
    archived: false,
    related_url: "/app/changes",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "n3",
    user_id: "seed",
    type: "task",
    title: "Task Overdue: Site Inspection Report",
    body: "This task was due 2 days ago and remains incomplete. Please update the status.",
    read: true,
    archived: false,
    related_url: "/app/tasks",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: "n4",
    user_id: "seed",
    type: "risk",
    title: "New Risk Flagged: Retention Release Delayed",
    body: "Half-retention release has passed the contractual release date by 14 days. Action required.",
    read: false,
    archived: false,
    related_url: "/app/cvr",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "n5",
    user_id: "seed",
    type: "mention",
    title: "You were mentioned in Final Account",
    body: "Sarah O'Brien mentioned you in the final account discussion: '@You please review the disputed sums.'",
    read: true,
    archived: false,
    related_url: "/app/final-accounts",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
];

/* ─── Helpers ─────────────────────────────────────────────────────── */

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const TYPE_CONFIG: Record<NotificationType, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  payment:  { label: "Payment",  color: "#16a34a", bg: "#f0fdf4", Icon: FileText },
  change:   { label: "Change",   color: "#d97706", bg: "#fffbeb", Icon: RefreshCw },
  task:     { label: "Task",     color: "#7c3aed", bg: "#f5f3ff", Icon: CheckCheck },
  system:   { label: "System",   color: "#64748b", bg: "#f8fafc", Icon: Bell },
  mention:  { label: "Mention",  color: "#0ea5e9", bg: "#f0f9ff", Icon: Zap },
  risk:     { label: "Risk",     color: "#dc2626", bg: "#fef2f2", Icon: Zap },
};

/* ─── Component ─────────────────────────────────────────────────────── */

export function InboxView() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Notification | null>(null);
  const [filter, setFilter] = useState<NotificationType | "all" | "unread">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("no user");

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .eq("archived", false)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error || !data?.length) throw new Error("empty");
      setNotifications(data as Notification[]);
    } catch {
      setNotifications(SEED_NOTIFICATIONS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    try {
      const supabase = createClient();
      await supabase.from("notifications").update({ read: true }).eq("id", id);
    } catch { /* fail silently */ }
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("archived", false);
    } catch { /* fail silently */ }
  };

  const archive = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (selected?.id === id) setSelected(null);
    try {
      const supabase = createClient();
      await supabase.from("notifications").update({ archived: true }).eq("id", id);
    } catch { /* fail silently */ }
  };

  const openNotification = (n: Notification) => {
    setSelected(n);
    if (!n.read) markRead(n.id);
  };

  const visible = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter !== "all") return n.type === filter;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  /* ─ Thread detail ─ */
  if (selected) {
    const cfg = TYPE_CONFIG[selected.type];
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b flex-shrink-0" style={{ borderColor: "var(--border)" }}>
          <button type="button" onClick={() => setSelected(null)} className="btn btn-ghost btn-icon btn-sm" aria-label="Back">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h3 className="text-[13px] font-semibold flex-1 truncate" style={{ color: "var(--text-primary)" }}>
            {selected.title}
          </h3>
          <button
            type="button"
            onClick={() => archive(selected.id)}
            className="btn btn-ghost btn-icon btn-sm"
            title="Archive"
          >
            <Archive className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          <div
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-full w-fit text-[11px] font-medium"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            <cfg.Icon className="w-3 h-3" />
            {cfg.label}
          </div>
          <div className="rounded-xl p-4 border" style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}>
            <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {selected.body}
            </p>
            <p className="text-[11px] mt-3" style={{ color: "var(--text-muted)" }}>
              {formatRelative(selected.created_at)}
            </p>
          </div>
          {selected.related_url && (
            <a
              href={selected.related_url}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-colors"
              style={{ background: "var(--primary)", color: "white" }}
            >
              View details
            </a>
          )}
        </div>
      </div>
    );
  }

  /* ─ List ─ */
  const FILTER_TABS: { id: typeof filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "unread", label: `Unread${unreadCount ? ` (${unreadCount})` : ""}` },
    { id: "payment", label: "Payment" },
    { id: "change", label: "Change" },
    { id: "task", label: "Task" },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0" style={{ borderColor: "var(--border)" }}>
        <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
          {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
        </span>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button type="button" onClick={markAllRead} className="flex items-center gap-1 text-[12px] px-2 py-1 rounded-lg hover:bg-[var(--bg-subtle)]" style={{ color: "var(--primary)" }}>
              <CheckCheck className="w-3 h-3" />
              Mark all read
            </button>
          )}
          <button type="button" onClick={load} className="btn btn-ghost btn-icon" style={{ width: 28, height: 28 }} title="Refresh">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-0.5 px-3 py-1.5 border-b overflow-x-auto flex-shrink-0" style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}>
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={cn(
              "flex-shrink-0 px-2.5 py-1 rounded-lg text-[11.5px] font-medium transition-colors whitespace-nowrap",
              filter === tab.id ? "bg-white shadow-sm" : "hover:bg-white/60"
            )}
            style={{ color: filter === tab.id ? "var(--primary)" : "var(--text-muted)" }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--text-muted)" }} />
          </div>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Inbox className="w-8 h-8" style={{ color: "var(--text-muted)" }} />
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
              {filter === "unread" ? "No unread notifications" : "Nothing here"}
            </p>
          </div>
        ) : (
          visible.map((n) => {
            const cfg = TYPE_CONFIG[n.type];
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => openNotification(n)}
                className={cn(
                  "w-full text-left flex items-start gap-3 px-4 py-3 border-b transition-colors hover:bg-[var(--bg-subtle)]",
                  !n.read && "bg-blue-50/40"
                )}
                style={{ borderColor: "var(--border)" }}
              >
                {/* Type icon */}
                <div className="flex-shrink-0 mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: cfg.bg }}>
                  <cfg.Icon className="w-3.5 h-3.5" style={{ color: cfg.color } as React.CSSProperties} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn("text-[12.5px] truncate", !n.read ? "font-semibold" : "font-medium")} style={{ color: "var(--text-primary)" }}>
                      {n.title}
                    </p>
                    <span className="text-[10.5px] flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                      {formatRelative(n.created_at)}
                    </span>
                  </div>
                  <p className="text-[11.5px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>{n.body}</p>
                </div>

                {/* Unread dot */}
                {!n.read && (
                  <div className="flex-shrink-0 w-2 h-2 rounded-full mt-2" style={{ background: "var(--primary)" }} />
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

export default InboxView;

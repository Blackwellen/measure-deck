"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, AlertTriangle, Info, CheckCircle2, CreditCard, Users,
  Clock, CheckCheck, Inbox, ChevronLeft, ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn, formatRelative } from "@/lib/utils";
import { toast } from "sonner";

const PAGE_SIZE = 20;

type NotifFilter = "all" | "unread" | "deadline" | "payment" | "alert" | "info";

interface DbNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  action_url: string | null;
  urgency: string;
  created_at: string;
}

function notifIcon(type: string) {
  if (type === "deadline") return <AlertTriangle size={15} style={{ color: "#d97706" }} />;
  if (type === "payment")  return <CreditCard    size={15} style={{ color: "#16a34a" }} />;
  if (type === "alert")    return <AlertTriangle size={15} style={{ color: "#dc2626" }} />;
  if (type === "mention")  return <Users         size={15} style={{ color: "#3b82f6" }} />;
  if (type === "success")  return <CheckCircle2  size={15} style={{ color: "#16a34a" }} />;
  return <Info size={15} style={{ color: "var(--text-muted)" }} />;
}

function notifIconBg(type: string): string {
  if (type === "deadline") return "#fffbeb";
  if (type === "payment")  return "#f0fdf4";
  if (type === "alert")    return "#fef2f2";
  if (type === "mention")  return "#eff6ff";
  if (type === "success")  return "#f0fdf4";
  return "var(--bg-subtle)";
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<NotifFilter>("all");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from("notifications")
        .select("id, type, title, body, read, action_url, urgency, created_at", { count: "exact" })
        .eq("recipient_user_id", user.id)
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (filter === "unread") {
        query = query.eq("read", false);
      } else if (filter !== "all") {
        query = query.eq("type", filter);
      }

      const { data, count } = await query;
      setNotifications((data ?? []) as DbNotification[]);
      setTotal(count ?? 0);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(0);
  }, [filter]);

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    const supabase = createClient();
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  }

  async function handleMarkAll() {
    setMarkingAll(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("recipient_user_id", user.id)
        .eq("read", false);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark notifications as read");
    } finally {
      setMarkingAll(false);
    }
  }

  function handleItemClick(n: DbNotification) {
    void markRead(n.id);
    if (n.action_url) {
      router.push(n.action_url);
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const FILTER_TABS: { id: NotifFilter; label: string }[] = [
    { id: "all",      label: "All" },
    { id: "unread",   label: "Unread" },
    { id: "deadline", label: "Deadlines" },
    { id: "payment",  label: "Payments" },
    { id: "alert",    label: "Alerts" },
    { id: "info",     label: "Info" },
  ];

  return (
    <div className="flex flex-col gap-0 max-w-3xl mx-auto">
      <div className="flex items-center justify-between py-6 px-1">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Notifications</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {total > 0 ? `${total} notification${total !== 1 ? "s" : ""}` : "No notifications"}
            {unreadCount > 0 ? ` · ${unreadCount} unread` : ""}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleMarkAll}
            disabled={markingAll}
          >
            <CheckCheck size={14} />
            {markingAll ? "Marking…" : "Mark all read"}
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center gap-0.5 px-4 py-2 border-b overflow-x-auto" style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}>
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors whitespace-nowrap",
                filter === tab.id ? "bg-white shadow-sm" : "hover:bg-white/60"
              )}
              style={{ color: filter === tab.id ? "var(--primary)" : "var(--text-muted)" }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <Clock size={24} className="animate-spin" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading notifications…</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3 text-center">
            <Inbox size={40} style={{ color: "var(--text-muted)" }} className="opacity-30" />
            <p className="text-[15px] font-medium" style={{ color: "var(--text-primary)" }}>You&apos;re all caught up!</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {filter !== "all" ? "No notifications match this filter." : "No notifications yet."}
            </p>
          </div>
        ) : (
          <div>
            {notifications.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => handleItemClick(n)}
                className={cn(
                  "w-full text-left flex items-start gap-4 px-4 py-4 border-b transition-colors hover:bg-[var(--bg-subtle)]",
                  !n.read && "bg-blue-50/40"
                )}
                style={{ borderColor: "var(--border)" }}
              >
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
                  style={{ background: notifIconBg(n.type) }}
                >
                  {notifIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <p
                      className={cn("text-[13.5px] leading-snug", !n.read ? "font-semibold" : "font-medium")}
                      style={{ color: "var(--text-primary)" }}
                    >
                      {n.title}
                    </p>
                    <span className="text-[11px] flex-shrink-0 mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {formatRelative(n.created_at)}
                    </span>
                  </div>
                  <p className="text-[12.5px] mt-1 leading-snug" style={{ color: "var(--text-secondary)" }}>
                    {n.body}
                  </p>
                  {n.action_url && (
                    <span className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-medium" style={{ color: "var(--primary)" }}>
                      View details →
                    </span>
                  )}
                </div>

                {!n.read && (
                  <div className="flex-shrink-0 w-2.5 h-2.5 rounded-full mt-2" style={{ background: "var(--primary)" }} />
                )}
              </button>
            ))}

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3" style={{ background: "var(--bg-subtle)" }}>
                <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                  Page {page + 1} of {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="btn btn-ghost btn-icon btn-sm"
                    aria-label="Previous page"
                  >
                    <ChevronLeft size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="btn btn-ghost btn-icon btn-sm"
                    aria-label="Next page"
                  >
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";
import { formatRelative } from "@/lib/utils";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  CreditCard,
  Info,
  Loader2,
  Users,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface DbNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  action_url: string | null;
  urgency: string;
  created_at: string;
  recipient_user_id: string;
}

function notifIcon(type: string): React.ReactNode {
  if (type === "deadline") return <AlertTriangle size={13} style={{ color: "#d97706" }} />;
  if (type === "payment")  return <CreditCard    size={13} style={{ color: "#16a34a" }} />;
  if (type === "alert")    return <AlertTriangle size={13} style={{ color: "#dc2626" }} />;
  if (type === "mention")  return <Users         size={13} style={{ color: "#3b82f6" }} />;
  if (type === "success")  return <CheckCircle2  size={13} style={{ color: "#16a34a" }} />;
  return <Info size={13} style={{ color: "var(--text-muted)" }} />;
}

type FilterTab = "all" | "unread";

export function NotificationsView() {
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("no user");

      const { data, error } = await supabase
        .from("notifications")
        .select("id, type, title, body, read, action_url, urgency, created_at, recipient_user_id")
        .eq("recipient_user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications((data ?? []) as DbNotification[]);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const markRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    try {
      const supabase = createClient();
      await supabase.from("notifications").update({ read: true }).eq("id", id);
    } catch { }
  };

  const filtered = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const tabs: { id: FilterTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-0.5 px-3 pt-2 pb-1 border-b" style={{ borderColor: "var(--border)" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={cn(
              "px-3 py-1.5 text-[12px] font-500 rounded-lg transition-colors",
              filter === tab.id
                ? "bg-[var(--bg-subtle)] font-600"
                : "hover:bg-[var(--bg-subtle)]"
            )}
            style={{ color: filter === tab.id ? "var(--text-primary)" : "var(--text-muted)" }}
          >
            {tab.label}
            {tab.id === "unread" && unreadCount > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center rounded-full px-1.5 text-[10px] font-600"
                style={{ background: "var(--primary)", color: "white", minWidth: 18 }}>
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--text-muted)" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Bell className="w-8 h-8" style={{ color: "var(--text-muted)" }} />
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
              {filter === "unread" ? "No unread notifications" : "No notifications yet"}
            </p>
          </div>
        ) : (
          filtered.map((notif) => (
            <button
              key={notif.id}
              type="button"
              onClick={() => { void markRead(notif.id); }}
              className={cn(
                "w-full text-left flex items-start gap-3 px-4 py-3 border-b transition-colors hover:bg-[var(--bg-subtle)]",
                !notif.read && "bg-blue-50/40"
              )}
              style={{ borderColor: "var(--border)" }}
            >
              <div
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5"
                style={{ background: "var(--bg-subtle)" }}
              >
                {notifIcon(notif.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={cn("text-[12px] truncate", !notif.read ? "font-600" : "font-500")}
                    style={{ color: "var(--text-primary)" }}>
                    {notif.title}
                  </p>
                  <span className="text-[11px] flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                    {formatRelative(notif.created_at)}
                  </span>
                </div>
                <p className="text-[12px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  {notif.body}
                </p>
              </div>

              {!notif.read && (
                <div className="flex-shrink-0 w-2 h-2 rounded-full mt-2" style={{ background: "var(--primary)" }} />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

export default NotificationsView;

"use client";

import { cn } from "@/lib/utils";
import { formatRelative } from "@/lib/utils";
import {
  AlertTriangle,
  AtSign,
  Bell,
  CheckCircle2,
  Info,
  TrendingUp,
  Zap,
} from "lucide-react";
import React, { useState } from "react";

type NotifType = "mention" | "alert" | "success" | "info" | "update";

interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "mention",
    title: "You were mentioned",
    body: "James mentioned you in Project Apollo CVR review",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    read: false,
  },
  {
    id: "2",
    type: "alert",
    title: "Payment overdue",
    body: "Application #11 is 14 days past the due date",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    read: false,
  },
  {
    id: "3",
    type: "success",
    title: "Change event approved",
    body: "CE-038 'Structural steel uplift' agreed at £32,000",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    read: false,
  },
  {
    id: "4",
    type: "update",
    title: "CVR Period finalised",
    body: "Period 5 CVR has been locked and filed",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    read: true,
  },
  {
    id: "5",
    type: "info",
    title: "Evidence expiring soon",
    body: "2 compliance documents expire within 30 days",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    read: true,
  },
];

const TYPE_ICON: Record<NotifType, React.ElementType> = {
  mention: AtSign,
  alert: AlertTriangle,
  success: CheckCircle2,
  info: Info,
  update: TrendingUp,
};

const TYPE_COLOR: Record<NotifType, string> = {
  mention: "var(--primary)",
  alert: "var(--danger)",
  success: "var(--success)",
  info: "var(--info)",
  update: "var(--text-muted)",
};

type FilterTab = "all" | "unread" | "mentions";

export function NotificationsView() {
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState<FilterTab>("all");

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter === "mentions") return n.type === "mention";
    return true;
  });

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const tabs: { id: FilterTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "unread", label: "Unread" },
    { id: "mentions", label: "Mentions" },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex flex-col h-full">
      {/* Filter tabs */}
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

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Bell className="w-8 h-8" style={{ color: "var(--text-muted)" }} />
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>No notifications</p>
          </div>
        ) : (
          filtered.map((notif) => {
            const Icon = TYPE_ICON[notif.type];
            return (
              <button
                key={notif.id}
                type="button"
                onClick={() => markRead(notif.id)}
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
                  <Icon className="w-3.5 h-3.5" style={{ color: TYPE_COLOR[notif.type] }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn("text-[12px] truncate", !notif.read ? "font-600" : "font-500")}
                      style={{ color: "var(--text-primary)" }}>
                      {notif.title}
                    </p>
                    <span className="text-[11px] flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                      {formatRelative(notif.timestamp)}
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
            );
          })
        )}
      </div>
    </div>
  );
}

export default NotificationsView;

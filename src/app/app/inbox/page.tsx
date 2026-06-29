"use client";

import { Avatar } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  Archive, Bell, CheckCheck, ChevronRight, FileText, Inbox as InboxIcon,
  MessageSquare, Paperclip, Plus, RefreshCw, Search, Send, Smile, Zap,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

/* ════════════════════════ Types ════════════════════════ */

type NotificationType = "payment" | "change" | "task" | "system" | "mention" | "risk";

interface Notification {
  id: string; type: NotificationType; title: string; body: string;
  read: boolean; related_url?: string | null; created_at: string;
}

interface ChatMessage {
  id: string; conversation_id: string; sender: string; me: boolean;
  body: string; created_at: string;
}

interface Conversation {
  id: string; subject: string; participants: string[]; project?: string;
  unread: number; lastAt: string;
}

const ME = "You";

/* ════════════════════════ Seed data ════════════════════════ */

const SEED_NOTIFICATIONS: Notification[] = [
  { id: "n1", type: "payment", title: "Payment Application #12 Certified", body: "PA-12 for £245,000 certified by the QS. Certified sum £238,500.", read: false, related_url: "/app/applications", created_at: iso(0.5) },
  { id: "n2", type: "change", title: "Change Event CE-042 Approved", body: "Ground conditions variation £18,400 agreed and added to contract sum.", read: false, related_url: "/app/changes", created_at: iso(2) },
  { id: "n4", type: "risk", title: "Risk Alert: Retention Release Overdue", body: "Half-retention release 14 days overdue. £12,250 at risk.", read: false, related_url: "/app/cvr", created_at: iso(5) },
  { id: "n3", type: "task", title: "Task Overdue: Site Inspection Report", body: "Due 8 Jun 2026, still in-progress. Please update the status.", read: true, related_url: "/app/tasks", created_at: iso(48) },
  { id: "n5", type: "mention", title: "Mentioned in Final Account Discussion", body: "Sarah O'Brien: '@You please review the disputed sums on section 4.'", read: true, related_url: "/app/final-accounts", created_at: iso(8) },
  { id: "n7", type: "system", title: "Monthly CVR Reminder", body: "June 2026 CVR not yet submitted. Deadline 15 Jun 2026.", read: false, related_url: "/app/cvr", created_at: iso(24) },
];

const SEED_CONVERSATIONS: Conversation[] = [
  { id: "c1", subject: "Application #14 certification", participants: ["Sarah Mitchell"], project: "Eastside Residential Block A", unread: 2, lastAt: iso(0.3) },
  { id: "c2", subject: "CE-047 dispute strategy", participants: ["Tom Baxter", "Rachel Okafor"], project: "Thornfield Commercial Hub", unread: 0, lastAt: iso(3) },
  { id: "c3", subject: "Retention release — Whitfield", participants: ["James Thornton"], project: "Whitfield Leisure Centre", unread: 1, lastAt: iso(20) },
  { id: "c4", subject: "Programme delay notice", participants: ["Daniel Price"], project: "Meridian Office Park", unread: 0, lastAt: iso(50) },
];

const SEED_MESSAGES: Record<string, ChatMessage[]> = {
  c1: [
    { id: "m1", conversation_id: "c1", sender: "Sarah Mitchell", me: false, body: "Hi — the QS has come back on Application #14. They're querying the prelims line, want a breakdown before they certify.", created_at: iso(1.2) },
    { id: "m2", conversation_id: "c1", sender: ME, me: true, body: "Thanks Sarah. The prelims are per the agreed schedule of works — I'll pull the substantiation and send it across this afternoon.", created_at: iso(1.0) },
    { id: "m3", conversation_id: "c1", sender: "Sarah Mitchell", me: false, body: "Perfect. They also flagged the retention calc looks 0.5% high vs the contract.", created_at: iso(0.4) },
    { id: "m4", conversation_id: "c1", sender: "Sarah Mitchell", me: false, body: "Can you double-check before we resubmit? Final date for payment is the 13th.", created_at: iso(0.3) },
  ],
  c2: [
    { id: "m5", conversation_id: "c2", sender: "Tom Baxter", me: false, body: "CE-047 has been rejected again. EA says insufficient substantiation on the M&E reroute.", created_at: iso(4) },
    { id: "m6", conversation_id: "c2", sender: ME, me: true, body: "We have the daywork sheets and the AI instruction. Let's compile a full narrative and resubmit under clause 5.1.", created_at: iso(3.5) },
    { id: "m7", conversation_id: "c2", sender: "Rachel Okafor", me: false, body: "I'll draft the cost breakdown. Tom, can you get the marked-up drawings?", created_at: iso(3) },
  ],
  c3: [
    { id: "m8", conversation_id: "c3", sender: "James Thornton", me: false, body: "Whitfield half-retention was due for release on the practical completion anniversary. Client hasn't actioned it.", created_at: iso(21) },
    { id: "m9", conversation_id: "c3", sender: "James Thornton", me: false, body: "Can you issue a formal request? £12,250 outstanding.", created_at: iso(20) },
  ],
  c4: [
    { id: "m10", conversation_id: "c4", sender: "Daniel Price", me: false, body: "Meridian programme is slipping on the M&E first fix. We should issue an early warning before it hits the critical path.", created_at: iso(51) },
    { id: "m11", conversation_id: "c4", sender: ME, me: true, body: "Agreed. Draft the EW notice and I'll review — reference the NEC4 clause 16.", created_at: iso(50) },
  ],
};

function iso(hoursAgo: number) { return new Date(Date.now() - hoursAgo * 3600_000).toISOString(); }
function rel(s: string) {
  const m = Math.floor((Date.now() - new Date(s).getTime()) / 60000);
  if (m < 1) return "now"; if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24); if (d < 7) return `${d}d`;
  return new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

const TYPE_CFG: Record<NotificationType, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  payment: { label: "Payment", color: "#16a34a", bg: "#f0fdf4", Icon: FileText },
  change:  { label: "Change",  color: "#d97706", bg: "#fffbeb", Icon: RefreshCw },
  task:    { label: "Task",    color: "#7c3aed", bg: "#f5f3ff", Icon: CheckCheck },
  system:  { label: "System",  color: "#64748b", bg: "#f8fafc", Icon: Bell },
  mention: { label: "Mention", color: "#0ea5e9", bg: "#f0f9ff", Icon: Zap },
  risk:    { label: "Risk",    color: "#dc2626", bg: "#fef2f2", Icon: Zap },
};

/* ════════════════════════ Page ════════════════════════ */

export default function InboxPage() {
  const [mode, setMode] = useState<"messages" | "notifications">("messages");
  const [notifications, setNotifications] = useState<Notification[]>(SEED_NOTIFICATIONS);

  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const unreadMsgs = SEED_CONVERSATIONS.reduce((s, c) => s + c.unread, 0);

  return (
    <div className="page-container" style={{ maxWidth: 1240 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inbox</h1>
          <p className="page-subtitle">Team messages & notifications in one place</p>
        </div>
      </div>

      {/* Mode switcher */}
      <div className="flex items-center gap-1 bg-[var(--bg-muted)] rounded-[var(--radius)] p-1 w-fit mb-4">
        {([
          { id: "messages", label: "Messages", Icon: MessageSquare, count: unreadMsgs },
          { id: "notifications", label: "Notifications", Icon: Bell, count: unreadNotifs },
        ] as const).map(({ id, label, Icon, count }) => (
          <button
            key={id}
            onClick={() => setMode(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] text-sm font-semibold transition-all",
              mode === id ? "bg-white shadow-sm text-[var(--text-primary)]" : "text-[var(--text-muted)]"
            )}
          >
            <Icon size={15} />{label}
            {count > 0 && (
              <span className={cn("text-[10px] px-1.5 rounded-full font-bold", mode === id ? "bg-[var(--primary)] text-white" : "bg-[var(--bg-surface)] text-[var(--text-muted)]")}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {mode === "messages"
        ? <MessagesPane />
        : <NotificationsPane notifications={notifications} setNotifications={setNotifications} />}
    </div>
  );
}

/* ════════════════════════ Messages ════════════════════════ */

function MessagesPane() {
  const [conversations] = useState<Conversation[]>(SEED_CONVERSATIONS);
  const [activeId, setActiveId] = useState<string>(SEED_CONVERSATIONS[0].id);
  const [messagesByConv, setMessagesByConv] = useState<Record<string, ChatMessage[]>>(SEED_MESSAGES);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const active = conversations.find((c) => c.id === activeId)!;
  const messages = messagesByConv[activeId] ?? [];

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length, activeId]);

  const filtered = conversations.filter((c) =>
    !search || c.subject.toLowerCase().includes(search.toLowerCase()) ||
    c.participants.join(" ").toLowerCase().includes(search.toLowerCase())
  );

  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text) return;
    const msg: ChatMessage = {
      id: `m${Date.now()}`, conversation_id: activeId, sender: ME, me: true,
      body: text, created_at: new Date().toISOString(),
    };
    setMessagesByConv((prev) => ({ ...prev, [activeId]: [...(prev[activeId] ?? []), msg] }));
    setDraft("");
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) await supabase.from("messages").insert({ conversation_id: activeId, sender_id: user.id, body: text });
    } catch { /* offline-safe: kept in local state */ }
  }, [draft, activeId]);

  return (
    <div className="flex border rounded-2xl overflow-hidden bg-white" style={{ borderColor: "var(--border)", height: "calc(100vh - 230px)", minHeight: 520 }}>
      {/* Conversation list */}
      <div className="flex flex-col border-r" style={{ width: 320, flexShrink: 0, borderColor: "var(--border)" }}>
        <div className="p-3 flex items-center gap-2 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl border flex-1" style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}>
            <Search size={14} style={{ color: "var(--text-muted)" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search messages…" className="flex-1 bg-transparent text-[13px] outline-none" style={{ color: "var(--text-primary)" }} />
          </div>
          <button className="btn btn-primary btn-icon btn-sm flex-shrink-0" title="New message"><Plus size={15} /></button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={cn(
                "w-full text-left flex items-start gap-3 px-3 py-3 border-b transition-colors",
                c.id === activeId ? "bg-blue-50/60" : "hover:bg-[var(--bg-subtle)]"
              )}
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex -space-x-2 flex-shrink-0">
                {c.participants.slice(0, 2).map((p) => <Avatar key={p} name={p} size="sm" className="ring-2 ring-white" />)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={cn("text-[13px] truncate", c.unread ? "font-bold" : "font-medium")} style={{ color: "var(--text-primary)" }}>
                    {c.participants.join(", ")}
                  </p>
                  <span className="text-[10.5px] flex-shrink-0" style={{ color: "var(--text-muted)" }}>{rel(c.lastAt)}</span>
                </div>
                <p className="text-[12px] truncate" style={{ color: "var(--text-secondary)" }}>{c.subject}</p>
                {c.project && <p className="text-[10.5px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>{c.project}</p>}
              </div>
              {c.unread > 0 && (
                <span className="flex-shrink-0 mt-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ background: "var(--primary)" }}>
                  {c.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Thread */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Thread header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b flex-shrink-0" style={{ borderColor: "var(--border)" }}>
          <div className="flex -space-x-2">
            {active.participants.map((p) => <Avatar key={p} name={p} size="sm" className="ring-2 ring-white" />)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{active.subject}</p>
            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
              {active.participants.join(", ")}{active.project ? ` · ${active.project}` : ""}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3" style={{ background: "var(--bg-subtle)" }}>
          {messages.map((m) => (
            <div key={m.id} className={cn("flex gap-2", m.me ? "justify-end" : "justify-start")}>
              {!m.me && <Avatar name={m.sender} size="xs" className="mt-auto" />}
              <div className="max-w-[68%]">
                {!m.me && <p className="text-[11px] mb-0.5 ml-1" style={{ color: "var(--text-muted)" }}>{m.sender}</p>}
                <div
                  className="rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed"
                  style={m.me
                    ? { background: "var(--primary)", color: "white", borderBottomRightRadius: 4 }
                    : { background: "white", color: "var(--text-primary)", border: "1px solid var(--border)", borderBottomLeftRadius: 4 }}
                >
                  {m.body}
                </div>
                <p className={cn("text-[10px] mt-0.5", m.me ? "text-right mr-1" : "ml-1")} style={{ color: "var(--text-muted)" }}>{rel(m.created_at)}</p>
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Composer */}
        <div className="border-t p-3 flex-shrink-0" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-end gap-2 rounded-2xl border p-2 focus-within:border-[var(--primary)] transition-colors" style={{ borderColor: "var(--border)" }}>
            <button className="btn btn-ghost btn-icon btn-sm flex-shrink-0" title="Attach"><Paperclip size={16} /></button>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={`Message ${active.participants[0]}…`}
              rows={1}
              className="flex-1 resize-none bg-transparent text-[13px] outline-none py-1.5"
              style={{ color: "var(--text-primary)", maxHeight: 120 }}
            />
            <button className="btn btn-ghost btn-icon btn-sm flex-shrink-0" title="Emoji"><Smile size={16} /></button>
            <button onClick={send} disabled={!draft.trim()} className="btn btn-primary btn-icon btn-sm flex-shrink-0 disabled:opacity-40" title="Send">
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════ Notifications ════════════════════════ */

function NotificationsPane({ notifications, setNotifications }: {
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}) {
  const [filter, setFilter] = useState<NotificationType | "all" | "unread">("all");
  const [selected, setSelected] = useState<Notification | null>(null);

  const visible = useMemo(() => notifications.filter((n) => {
    if (filter === "unread") return !n.read;
    if (filter !== "all") return n.type === filter;
    return true;
  }), [notifications, filter]);

  const unread = notifications.filter((n) => !n.read).length;

  const markRead = (id: string) => setNotifications((p) => p.map((n) => n.id === id ? { ...n, read: true } : n));
  const markAll = () => setNotifications((p) => p.map((n) => ({ ...n, read: true })));
  const archive = (id: string) => { setNotifications((p) => p.filter((n) => n.id !== id)); setSelected(null); };

  const TABS: { id: typeof filter; label: string }[] = [
    { id: "all", label: "All" }, { id: "unread", label: "Unread" },
    { id: "payment", label: "Payments" }, { id: "change", label: "Changes" },
    { id: "risk", label: "Risks" }, { id: "task", label: "Tasks" },
  ];

  return (
    <div className="flex border rounded-2xl overflow-hidden bg-white" style={{ borderColor: "var(--border)", height: "calc(100vh - 230px)", minHeight: 520 }}>
      {/* List */}
      <div className="flex flex-col border-r" style={{ width: 380, flexShrink: 0, borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between px-4 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{unread > 0 ? `${unread} unread` : "All caught up"}</span>
          {unread > 0 && (
            <button onClick={markAll} className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg hover:bg-[var(--bg-subtle)]" style={{ color: "var(--primary)" }}>
              <CheckCheck size={13} />Mark all read
            </button>
          )}
        </div>
        <div className="px-3 py-2 flex gap-1 flex-wrap border-b" style={{ borderColor: "var(--border)" }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setFilter(t.id)}
              className={cn("px-2.5 py-1 rounded-lg text-[12px] font-medium transition-colors",
                filter === t.id ? "bg-[var(--primary)] text-white" : "bg-[var(--bg-subtle)] hover:bg-[var(--bg-muted)]")}
              style={filter !== t.id ? { color: "var(--text-secondary)" } : {}}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <InboxIcon size={28} style={{ color: "var(--text-muted)" }} />
              <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>Nothing here</p>
            </div>
          ) : visible.map((n) => {
            const cfg = TYPE_CFG[n.type];
            return (
              <button key={n.id} onClick={() => { setSelected(n); if (!n.read) markRead(n.id); }}
                className={cn("w-full text-left flex items-start gap-3 px-4 py-3.5 border-b transition-colors",
                  selected?.id === n.id ? "bg-blue-50/60" : !n.read ? "bg-blue-50/30 hover:bg-blue-50/50" : "hover:bg-[var(--bg-subtle)]")}
                style={{ borderColor: "var(--border)" }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
                  <cfg.Icon size={15} style={{ color: cfg.color } as React.CSSProperties} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn("text-[12.5px] truncate", !n.read ? "font-semibold" : "font-medium")} style={{ color: "var(--text-primary)" }}>{n.title}</p>
                    <span className="text-[10.5px] flex-shrink-0" style={{ color: "var(--text-muted)" }}>{rel(n.created_at)}</span>
                  </div>
                  <p className="text-[11.5px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>{n.body}</p>
                </div>
                {!n.read && <span className="w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: "var(--primary)" }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detail */}
      <div className="flex-1 flex flex-col min-w-0">
        {selected ? (
          <>
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: TYPE_CFG[selected.type].bg }}>
                  {(() => { const I = TYPE_CFG[selected.type].Icon; return <I size={18} style={{ color: TYPE_CFG[selected.type].color } as React.CSSProperties} />; })()}
                </div>
                <div className="min-w-0">
                  <h2 className="text-[15px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>{selected.title}</h2>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{rel(selected.created_at)} · {TYPE_CFG[selected.type].label}</p>
                </div>
              </div>
              <button onClick={() => archive(selected.id)} className="btn btn-ghost btn-sm flex-shrink-0"><Archive size={15} />Archive</button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="max-w-2xl p-5 rounded-2xl border" style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}>
                <p className="text-[14px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>{selected.body}</p>
              </div>
              {selected.related_url && (
                <a href={selected.related_url} className="inline-flex items-center gap-2 mt-4 px-4 py-2.5 rounded-xl text-[13px] font-medium" style={{ background: "var(--primary)", color: "white" }}>
                  View details <ChevronRight size={16} />
                </a>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "var(--bg-subtle)" }}>
              <Bell size={30} style={{ color: "var(--text-muted)" }} />
            </div>
            <p className="text-[15px] font-medium" style={{ color: "var(--text-primary)" }}>Select a notification</p>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { MessageSquare, Send, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";

type TicketStatus = "Open" | "In Progress" | "Resolved" | "Closed";

interface Ticket {
  id: string;
  subject: string;
  from: string;
  workspace: string;
  status: TicketStatus;
  created_at: string;
  last_message: string;
  messages: { author: string; text: string; ts: string; isAdmin: boolean }[];
}

const TICKETS: Ticket[] = [
  {
    id: "t-001",
    subject: "Cannot upload drawings larger than 50MB",
    from: "james@apex.co.uk",
    workspace: "Apex Construction Ltd",
    status: "Open",
    created_at: "10 Jun 2026",
    last_message: "We have 3 DWG files that keep failing on upload.",
    messages: [
      { author: "James Thornton", text: "Hi, we have 3 DWG files that keep failing on upload — they are around 60MB each. Is there a limit?", ts: "10 Jun 2026, 09:00", isAdmin: false },
      { author: "Support", text: "Hi James, the current upload limit is 50MB per file. We are working on increasing this. As a workaround, could you compress the DWG files?", ts: "10 Jun 2026, 09:45", isAdmin: true },
    ],
  },
  {
    id: "t-002",
    subject: "Billing query — double charged this month",
    from: "ops@oldham.biz",
    workspace: "Oldham & Partners",
    status: "In Progress",
    created_at: "08 Jun 2026",
    last_message: "We see two charges of £49 in our bank statement.",
    messages: [
      { author: "Ops Team", text: "We noticed two charges of £49 appearing on our statement for June. Could you investigate?", ts: "08 Jun 2026, 14:00", isAdmin: false },
    ],
  },
  {
    id: "t-003",
    subject: "AI Copilot not responding",
    from: "info@meridian.co.uk",
    workspace: "Meridian Contractors",
    status: "Resolved",
    created_at: "05 Jun 2026",
    last_message: "Issue resolved after cache clear.",
    messages: [
      { author: "Meridian Team", text: "The AI Copilot panel is not loading — just shows a spinner.", ts: "05 Jun 2026, 10:00", isAdmin: false },
      { author: "Support", text: "We have identified the issue and deployed a fix. Please clear your browser cache and reload.", ts: "05 Jun 2026, 11:30", isAdmin: true },
      { author: "Meridian Team", text: "That fixed it, thank you!", ts: "05 Jun 2026, 12:00", isAdmin: false },
    ],
  },
  {
    id: "t-004",
    subject: "Need to add more seats",
    from: "contact@buildright.com",
    workspace: "BuildRight Group",
    status: "Closed",
    created_at: "01 Jun 2026",
    last_message: "Seats added, ticket closed.",
    messages: [
      { author: "BuildRight Team", text: "We need to add 2 more seats to our Starter plan. How do we do this?", ts: "01 Jun 2026, 08:00", isAdmin: false },
      { author: "Support", text: "You can upgrade to our Professional plan which includes up to 20 seats, or purchase a seat add-on. See Settings > Plan.", ts: "01 Jun 2026, 08:30", isAdmin: true },
    ],
  },
];

const STATUS_CHIP: Record<TicketStatus, string> = {
  Open: "chip-danger",
  "In Progress": "chip-warning",
  Resolved: "chip-success",
  Closed: "chip-muted",
};

export default function AdminInboxPage() {
  const [selected, setSelected] = useState<Ticket>(TICKETS[0]);
  const [reply, setReply] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>(TICKETS);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<TicketStatus | "All">("All");

  const filtered = tickets.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.subject.toLowerCase().includes(q) || t.from.toLowerCase().includes(q);
    const matchFilter = filter === "All" || t.status === filter;
    return matchSearch && matchFilter;
  });

  const sendReply = () => {
    if (!reply.trim()) return;
    const newMsg = { author: "Admin", text: reply, ts: new Date().toLocaleString("en-GB"), isAdmin: true };
    setTickets((prev) =>
      prev.map((t) =>
        t.id === selected.id
          ? { ...t, messages: [...t.messages, newMsg], last_message: reply, status: "In Progress" as TicketStatus }
          : t
      )
    );
    setSelected((prev) => ({ ...prev, messages: [...prev.messages, newMsg], status: "In Progress" }));
    setReply("");
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Support Inbox</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            {tickets.filter((t) => t.status === "Open").length} open tickets
          </p>
        </div>
      </div>

      <div className="page-content" style={{ padding: 0 }}>
        <div style={{ display: "flex", height: "calc(100vh - 160px)", overflow: "hidden" }}>
          {/* LEFT: Ticket List */}
          <div style={{ width: 320, flexShrink: 0, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", background: "var(--surface)" }}>
            <div style={{ padding: 12, borderBottom: "1px solid var(--border)" }}>
              <div style={{ position: "relative", marginBottom: 8 }}>
                <Search size={13} style={{ position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: 28, fontSize: 13 }}
                  placeholder="Search tickets…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {(["All", "Open", "In Progress", "Resolved", "Closed"] as const).map((s) => (
                  <button
                    key={s}
                    className={cn("btn btn-ghost btn-sm", filter === s && "active")}
                    style={{ fontSize: 11, padding: "2px 8px", background: filter === s ? "var(--primary-light)" : undefined }}
                    onClick={() => setFilter(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {filtered.map((t) => (
                <div
                  key={t.id}
                  onClick={() => setSelected(t)}
                  style={{
                    padding: "12px 16px", cursor: "pointer", borderBottom: "1px solid var(--border)",
                    background: selected.id === t.id ? "var(--primary-light)" : undefined,
                    borderLeft: selected.id === t.id ? "3px solid var(--primary)" : "3px solid transparent",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{t.from.split("@")[0]}</span>
                    <span className={cn("badge", STATUS_CHIP[t.status])} style={{ fontSize: 10 }}>{t.status}</span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2, color: "var(--text)" }}>{t.subject}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {t.last_message}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>{t.created_at}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Thread View */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Thread Header */}
            <div style={{ padding: "16px 24px", borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{selected.subject}</h2>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    {selected.from} · {selected.workspace} · Opened {selected.created_at}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span className={cn("badge", STATUS_CHIP[selected.status])}>{selected.status}</span>
                  <button className="btn btn-secondary btn-sm" onClick={() => alert("Status changed to Resolved")}>Resolve</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => alert("Ticket closed")}>Close</button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              {selected.messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex", gap: 12, flexDirection: msg.isAdmin ? "row-reverse" : "row",
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: 9999, background: msg.isAdmin ? "var(--primary)" : "var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                    color: msg.isAdmin ? "#fff" : "var(--text-muted)",
                  }}>
                    <User size={14} />
                  </div>
                  <div style={{ maxWidth: "70%" }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 4, flexDirection: msg.isAdmin ? "row-reverse" : "row" }}>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{msg.author}</span>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{msg.ts}</span>
                    </div>
                    <div style={{
                      padding: "10px 14px", borderRadius: 10, fontSize: 13,
                      background: msg.isAdmin ? "var(--primary)" : "var(--surface-raised)",
                      color: msg.isAdmin ? "#fff" : "var(--text)",
                      border: msg.isAdmin ? "none" : "1px solid var(--border)",
                    }}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply */}
            <div style={{ padding: 16, borderTop: "1px solid var(--border)", background: "var(--surface)" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <textarea
                  className="form-input"
                  style={{ flex: 1, resize: "none", height: 72, fontSize: 13 }}
                  placeholder="Type your reply…"
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) sendReply(); }}
                />
                <button className="btn btn-primary" onClick={sendReply} style={{ alignSelf: "flex-end" }}>
                  <Send size={14} /> Send
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

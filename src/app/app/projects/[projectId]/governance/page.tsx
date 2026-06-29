"use client";

import { useState } from "react";
import { Brain, Sparkles, Circle, ExternalLink, Users } from "lucide-react";
import { cn, getInitials } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActivityType = "change" | "application" | "document" | "system";

interface ActivityEvent {
  id: number;
  type: ActivityType;
  user: string;
  action: string;
  entity: string;
  time: string;
  date: string;
}

type UrgencyLevel = "Critical" | "High" | "Medium";

interface WatchlistItem {
  id: string;
  entity: string;
  title: string;
  urgency: UrgencyLevel;
  lastUpdate: string;
}

interface NextAction {
  id: number;
  label: string;
  href: string;
}

interface TeamMember {
  id: number;
  name: string;
  initials: string;
  online: boolean;
}

type FilterType = "All" | "Changes" | "Applications" | "Documents" | "System";

// ─── Seed data ────────────────────────────────────────────────────────────────

const ACTIVITY_FEED: ActivityEvent[] = [
  { id: 1,  type: "change",      user: "Sarah Chen",       action: "submitted Change Event CH-024-014 for assessment",        entity: "CH-024-014", time: "2h ago",    date: "2025-05-14" },
  { id: 2,  type: "application", user: "James Ward",       action: "certified Application #8 for £842,500",                  entity: "APP-008",    time: "4h ago",    date: "2025-05-14" },
  { id: 3,  type: "document",    user: "Rachel Kim",       action: "uploaded Delay Analysis Report",                          entity: "EV-008",     time: "Yesterday", date: "2025-05-13" },
  { id: 4,  type: "change",      user: "Marcus Thompson",  action: "raised new Change Event CH-024-015",                     entity: "CH-024-015", time: "Yesterday", date: "2025-05-13" },
  { id: 5,  type: "system",      user: "System",           action: "NEC4 deadline reminder: CH-024-011 quotation due in 3 days", entity: "CH-024-011", time: "2d ago",    date: "2025-05-12" },
  { id: 6,  type: "change",      user: "Sarah Chen",       action: "updated pricing for CH-024-012 to £34,200",              entity: "CH-024-012", time: "2d ago",    date: "2025-05-12" },
  { id: 7,  type: "application", user: "James Ward",       action: "issued PLN for Application #8",                          entity: "APP-008",    time: "3d ago",    date: "2025-05-11" },
  { id: 8,  type: "document",    user: "Rachel Kim",       action: "linked EV-005 (RFI-042) to CH-024-012",                  entity: "EV-005",     time: "3d ago",    date: "2025-05-11" },
  { id: 9,  type: "system",      user: "System",           action: "Application #7 – Pay Less Notice window opens tomorrow",  entity: "APP-007",    time: "4d ago",    date: "2025-05-10" },
  { id: 10, type: "change",      user: "Marcus Thompson",  action: "escalated CH-024-009 to dispute",                        entity: "CH-024-009", time: "5d ago",    date: "2025-05-09" },
];

const WATCHLIST: WatchlistItem[] = [
  { id: "w1", entity: "CH-024-011", title: "Unforeseen ground conditions",      urgency: "Critical", lastUpdate: "2h ago"  },
  { id: "w2", entity: "APP-008",    title: "Application #8 — Payment due",      urgency: "High",     lastUpdate: "4h ago"  },
  { id: "w3", entity: "CH-024-009", title: "Steel Frame scope dispute £124,500", urgency: "High",    lastUpdate: "5d ago"  },
  { id: "w4", entity: "EV-008",     title: "Delay Analysis Report — review",    urgency: "Medium",   lastUpdate: "Yesterday" },
  { id: "w5", entity: "APP-007",    title: "PLN window — action required",      urgency: "Medium",   lastUpdate: "4d ago"  },
];

const NEXT_ACTIONS: NextAction[] = [
  { id: 1, label: "Submit quotation for CH-024-011 by 17 May",      href: "#" },
  { id: 2, label: "Issue PLN for Application #9 by 19 May",         href: "#" },
  { id: 3, label: "Resolve evidence gap for CH-024-009",            href: "#" },
  { id: 4, label: "Review disputed £124,500 with Steel Frame",       href: "#" },
];

const TEAM_ONLINE: TeamMember[] = [
  { id: 1, name: "Sarah Chen",      initials: "SC", online: true  },
  { id: 2, name: "James Ward",      initials: "JW", online: true  },
  { id: 3, name: "Rachel Kim",      initials: "RK", online: true  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DOT_COLOUR: Record<ActivityType, string> = {
  change:      "var(--primary)",
  application: "var(--success)",
  document:    "var(--warning)",
  system:      "var(--text-muted)",
};

const AVATAR_BG: Record<ActivityType, string> = {
  change:      "#EFF2FD",
  application: "#ECFDF5",
  document:    "#FFFBEB",
  system:      "var(--bg-muted)",
};

const AVATAR_TEXT_COLOUR: Record<ActivityType, string> = {
  change:      "var(--primary)",
  application: "var(--success)",
  document:    "#B45309",
  system:      "var(--text-muted)",
};

const URGENCY_CHIP: Record<UrgencyLevel, string> = {
  Critical: "chip-danger",
  High:     "chip-warning",
  Medium:   "chip-info",
};

const FILTER_MAP: Record<FilterType, ActivityType | null> = {
  All:          null,
  Changes:      "change",
  Applications: "application",
  Documents:    "document",
  System:       "system",
};

const FILTERS: FilterType[] = ["All", "Changes", "Applications", "Documents", "System"];

// ─── Component ────────────────────────────────────────────────────────────────

export default function GovernanceActivityPage() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");

  const filteredEvents = ACTIVITY_FEED.filter((ev) => {
    const filterType = FILTER_MAP[activeFilter];
    return filterType === null || ev.type === filterType;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* ── LEFT: Activity Feed (2/3) ── */}
      <div className="lg:col-span-2 flex flex-col gap-0">
        <div className="card p-5 flex flex-col gap-4">
          {/* Header + Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <h2 className="text-sm font-semibold flex-1" style={{ color: "var(--text-primary)" }}>
              Activity Feed
            </h2>
            <div
              className="flex gap-1 flex-wrap"
              role="group"
              aria-label="Filter activity"
            >
              {FILTERS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setActiveFilter(f)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
                    activeFilter === f
                      ? "text-white"
                      : ""
                  )}
                  style={
                    activeFilter === f
                      ? { background: "var(--primary)", color: "#fff" }
                      : { background: "var(--bg-muted)", color: "var(--text-secondary)" }
                  }
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Timeline */}
          <div className="flex flex-col">
            {filteredEvents.length === 0 && (
              <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
                No activity for this filter.
              </p>
            )}
            {filteredEvents.map((ev, idx) => (
              <div
                key={ev.id}
                className={cn(
                  "flex gap-3 py-3",
                  idx < filteredEvents.length - 1 && "border-b"
                )}
                style={{ borderColor: "var(--border)" }}
              >
                {/* Left: coloured dot */}
                <div className="flex flex-col items-center gap-1 pt-1">
                  <Circle
                    size={9}
                    fill={DOT_COLOUR[ev.type]}
                    style={{ color: DOT_COLOUR[ev.type], flexShrink: 0 }}
                  />
                  {idx < filteredEvents.length - 1 && (
                    <div
                      className="w-px flex-1 min-h-[16px]"
                      style={{ background: "var(--border)" }}
                    />
                  )}
                </div>

                {/* Avatar */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{
                    background: ev.user === "System" ? "var(--bg-muted)" : AVATAR_BG[ev.type],
                    color: AVATAR_TEXT_COLOUR[ev.type],
                  }}
                >
                  {ev.user === "System" ? "SY" : getInitials(ev.user)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug" style={{ color: "var(--text-primary)" }}>
                    <span className="font-semibold">{ev.user}</span>{" "}
                    {ev.action}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span
                      className="badge chip-muted text-[10px] px-2 py-0.5"
                    >
                      {ev.entity}
                    </span>
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {ev.time}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Watchlist + AI Actions + Team ── */}
      <div className="flex flex-col gap-4">

        {/* Watchlist */}
        <div className="card p-4 flex flex-col gap-3">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Watchlist
            <span className="ml-1.5 text-xs font-normal" style={{ color: "var(--text-muted)" }}>
              Items being monitored
            </span>
          </h3>
          <div className="flex flex-col gap-2">
            {WATCHLIST.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 p-2.5 rounded-xl"
                style={{ background: "var(--bg-muted)" }}
              >
                <span
                  className="badge chip-muted text-[10px] px-1.5 py-0.5 flex-shrink-0 font-mono"
                >
                  {item.entity}
                </span>
                <p
                  className="text-xs flex-1 min-w-0 truncate font-medium"
                  style={{ color: "var(--text-primary)" }}
                  title={item.title}
                >
                  {item.title}
                </p>
                <span className={cn("badge flex-shrink-0 text-[10px]", URGENCY_CHIP[item.urgency])}>
                  {item.urgency}
                </span>
                <span className="text-[10px] flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                  {item.lastUpdate}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Next Best Actions (violet-tinted) */}
        <div
          className="card p-4 flex flex-col gap-3"
          style={{ borderColor: "var(--violet)", borderWidth: 1 }}
        >
          <div className="flex items-center gap-2">
            <Brain size={15} style={{ color: "var(--violet)" }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--violet)" }}>
              Next Best Actions
            </h3>
            <span
              className="badge ml-auto text-[10px] px-1.5 py-0.5"
              style={{ background: "#ede9fe", color: "var(--violet)" }}
            >
              AI
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {NEXT_ACTIONS.map((action) => (
              <div
                key={action.id}
                className="flex items-center gap-2 p-2.5 rounded-xl"
                style={{ background: "#f5f3ff" }}
              >
                <Sparkles size={11} style={{ color: "var(--violet)", flexShrink: 0 }} />
                <p
                  className="text-xs flex-1 leading-snug"
                  style={{ color: "var(--text-primary)" }}
                >
                  {action.label}
                </p>
                <a
                  href={action.href}
                  className="btn btn-sm btn-secondary flex-shrink-0 text-[10px] px-2 py-1 flex items-center gap-1"
                >
                  Action <ExternalLink size={9} />
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Team Online */}
        <div className="card p-4 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Users size={14} style={{ color: "var(--text-muted)" }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Team Online
            </h3>
            <span
              className="ml-auto text-[10px]"
              style={{ color: "var(--success)" }}
            >
              {TEAM_ONLINE.filter((m) => m.online).length} active
            </span>
          </div>
          <div className="flex items-center gap-2">
            {TEAM_ONLINE.map((member) => (
              <div key={member.id} className="relative" title={member.name}>
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
                  style={{ background: "var(--primary)" }}
                >
                  {member.initials}
                </div>
                {member.online && (
                  <span
                    className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white"
                    style={{ background: "var(--success)" }}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            {TEAM_ONLINE.map((member) => (
              <div key={member.id} className="flex items-center gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: member.online ? "var(--success)" : "var(--border)" }}
                />
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {member.name}
                </span>
                <span className="text-[10px] ml-auto" style={{ color: "var(--text-muted)" }}>
                  {member.online ? "Online" : "Away"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

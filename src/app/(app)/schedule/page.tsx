"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Plus, Download, Filter, Calendar, GitBranch, BarChart2,
  List, ChevronLeft, ChevronRight, Diamond, AlertTriangle,
  Clock, CheckCircle2, ExternalLink,
} from "lucide-react";
import { cn, formatDate, formatRelative, getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

/* ─────────────────────────── Types ─────────────────────────── */

type EventType = "milestone" | "payment_deadline" | "notice_deadline" | "application_date";

interface ScheduleEvent {
  id: string;
  title: string;
  type: EventType;
  date: string;
  project: string;
  project_id: string;
  description?: string;
}

/* ─────────────────────────── Seed ──────────────────────────── */

const TODAY = new Date("2026-06-10");

const SEED_EVENTS: ScheduleEvent[] = [
  { id: "s-001", title: "Practical Completion — Thornfield Hub", type: "milestone", date: "2026-06-28", project: "Thornfield Commercial Hub", project_id: "p-001" },
  { id: "s-002", title: "Application No. 12 Due", type: "application_date", date: "2026-06-12", project: "Thornfield Commercial Hub", project_id: "p-001" },
  { id: "s-003", title: "Retention Release — Whitfield Leisure", type: "payment_deadline", date: "2026-06-20", project: "Whitfield Leisure Centre", project_id: "p-004" },
  { id: "s-004", title: "Notice of Delay — Weather Event", type: "notice_deadline", date: "2026-06-11", project: "Motorway Service Station", project_id: "p-006" },
  { id: "s-005", title: "Section 107 Completion — Eastside A", type: "milestone", date: "2026-07-15", project: "Eastside Residential Block A", project_id: "p-003" },
  { id: "s-006", title: "Substructure Complete", type: "milestone", date: "2026-06-30", project: "City Centre Retail Fit-Out", project_id: "p-002" },
  { id: "s-007", title: "Application No. 8 Due", type: "application_date", date: "2026-07-01", project: "Eastside Residential Block A", project_id: "p-003" },
  { id: "s-008", title: "Final Account Submission Deadline", type: "notice_deadline", date: "2026-07-31", project: "Office Block Phase 2", project_id: "p-005" },
  { id: "s-009", title: "Snagging List Sign-Off", type: "milestone", date: "2026-08-15", project: "Whitfield Leisure Centre", project_id: "p-004" },
  { id: "s-010", title: "Interim Payment — Motorway", type: "payment_deadline", date: "2026-06-25", project: "Motorway Service Station", project_id: "p-006" },
];

/* ─────────────────────────── Helpers ───────────────────────── */

const EVENT_CONFIG: Record<EventType, { label: string; color: string; chipCls: string }> = {
  milestone: { label: "Milestone", color: "var(--primary)", chipCls: "chip-primary" },
  payment_deadline: { label: "Payment Deadline", color: "var(--success)", chipCls: "chip-success" },
  notice_deadline: { label: "Notice Deadline", color: "var(--warning)", chipCls: "chip-warning" },
  application_date: { label: "Application Date", color: "var(--violet)", chipCls: "chip-violet" },
};

function daysUntil(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date(TODAY);
  return Math.ceil((d.getTime() - now.getTime()) / 86400000);
}

function countdownChip(days: number) {
  if (days < 0) return <span className="badge chip-danger text-[10px]">Overdue {Math.abs(days)}d</span>;
  if (days < 7) return <span className="badge chip-danger text-[10px]">{days}d left</span>;
  if (days < 14) return <span className="badge chip-warning text-[10px]">{days}d left</span>;
  return <span className="badge chip-success text-[10px]">{days}d left</span>;
}

type ViewTab = "calendar" | "milestone-timeline" | "commercial-deadlines" | "project-schedule" | "gantt";
const TABS: { id: ViewTab; label: string }[] = [
  { id: "calendar", label: "Calendar" },
  { id: "milestone-timeline", label: "Milestone Timeline" },
  { id: "commercial-deadlines", label: "Commercial Deadlines" },
  { id: "project-schedule", label: "Project Schedule" },
  { id: "gantt", label: "Gantt Chart" },
];

/* ─────────────────────────── Page ──────────────────────────── */

export default function SchedulePage() {
  const [tab, setTab] = useState<ViewTab>("calendar");
  const [events, setEvents] = useState<ScheduleEvent[]>(SEED_EVENTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase.from("schedule_events").select("*").order("date", { ascending: true });
        if (data && data.length > 0) setEvents(data as ScheduleEvent[]);
      } catch {
        // use seed
      } finally {
        setLoading(false);
      }
    }
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, []);

  const upcomingDeadlines = events
    .filter((e) => {
      const d = daysUntil(e.date);
      return d >= -1 && d <= 90;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-xl font-semibold">Schedule</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Milestones, deadlines, and programme dates</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn btn-secondary btn-sm"><Filter size={14} />Filter</button>
          <button className="btn btn-secondary btn-sm"><Download size={14} />Export Schedule</button>
          <button className="btn btn-secondary btn-sm" onClick={() => toast.info("New schedule item")}><Plus size={14} />New Schedule Item</button>
          <button className="btn btn-primary btn-sm" onClick={() => toast.info("New milestone")}><Diamond size={14} />New Milestone</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar mt-4">
        {TABS.map((t) => (
          <button key={t.id} className={cn("tab-item", tab === t.id && "active")} onClick={() => {
            if (t.id === "gantt") window.location.href = "/app/schedule/gantt";
            else setTab(t.id);
          }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="page-content flex-1">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
          </div>
        ) : (
          <>
            {tab === "calendar" && <CalendarView events={events} />}
            {tab === "milestone-timeline" && <MilestoneTimeline events={events.filter((e) => e.type === "milestone")} />}
            {tab === "commercial-deadlines" && <CommercialDeadlines events={upcomingDeadlines} />}
            {tab === "project-schedule" && <ProjectScheduleView events={events} />}
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── Calendar View ─────────────────── */

function CalendarView({ events }: { events: ScheduleEvent[] }) {
  const [year, setYear] = useState(TODAY.getFullYear());
  const [month, setMonth] = useState(TODAY.getMonth());
  const [selected, setSelected] = useState<ScheduleEvent | null>(null);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = new Date(year, month).toLocaleString("en-GB", { month: "long", year: "numeric" });

  const eventsByDate: Record<string, ScheduleEvent[]> = {};
  events.forEach((e) => {
    const d = e.date.slice(0, 10);
    if (!eventsByDate[d]) eventsByDate[d] = [];
    eventsByDate[d].push(e);
  });

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }).map(() => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  function prevMonth() { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }
  function nextMonth() { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }

  return (
    <div className="flex flex-col gap-4">
      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap text-xs">
        {Object.entries(EVENT_CONFIG).map(([type, cfg]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: cfg.color }} />
            <span className="text-[var(--text-secondary)]">{cfg.label}</span>
          </div>
        ))}
      </div>

      <div className="card p-5">
        {/* Nav */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <button className="btn btn-secondary btn-sm btn-icon" onClick={prevMonth}><ChevronLeft size={14} /></button>
            <span className="font-semibold text-sm">{monthName}</span>
            <button className="btn btn-secondary btn-sm btn-icon" onClick={nextMonth}><ChevronRight size={14} /></button>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => { setYear(TODAY.getFullYear()); setMonth(TODAY.getMonth()); }}>Today</button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-[var(--text-muted)] py-1">{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-px bg-[var(--border)]">
          {cells.map((day, idx) => {
            const dateStr = day ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : "";
            const dayEvents = day ? (eventsByDate[dateStr] ?? []) : [];
            const isToday = day === TODAY.getDate() && month === TODAY.getMonth() && year === TODAY.getFullYear();
            return (
              <div
                key={idx}
                className="bg-[var(--bg-surface)] min-h-[90px] p-1.5"
                style={{ background: !day ? "var(--bg-muted)" : undefined }}
              >
                {day && (
                  <>
                    <div className={cn("text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1", isToday ? "bg-[var(--primary)] text-white" : "text-[var(--text-secondary)]")}>
                      {day}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {dayEvents.slice(0, 3).map((evt) => {
                        const cfg = EVENT_CONFIG[evt.type];
                        return (
                          <button
                            key={evt.id}
                            className="text-[10px] font-medium px-1 py-0.5 rounded truncate w-full text-left text-white"
                            style={{ background: cfg.color }}
                            title={evt.title}
                            onClick={() => setSelected(evt)}
                          >
                            {evt.type === "milestone" && "◆ "}{evt.title}
                          </button>
                        );
                      })}
                      {dayEvents.length > 3 && (
                        <span className="text-[10px] text-[var(--text-muted)] px-1">+{dayEvents.length - 3} more</span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event detail panel */}
      {selected && (
        <div className="card p-4 border-l-4" style={{ borderLeftColor: EVENT_CONFIG[selected.type].color }}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className={cn("badge mb-2 inline-block", EVENT_CONFIG[selected.type].chipCls)}>
                {EVENT_CONFIG[selected.type].label}
              </span>
              <h3 className="text-sm font-semibold">{selected.title}</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{selected.project} · {formatDate(selected.date)}</p>
            </div>
            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setSelected(null)}>×</button>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Link href={`/app/schedule/${selected.id}`} className="btn btn-secondary btn-sm">
              <ExternalLink size={13} />View Details
            </Link>
            <Link href={`/app/projects/${selected.project_id}`} className="btn btn-ghost btn-sm">
              View Project
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Milestone Timeline ────────────── */

function MilestoneTimeline({ events }: { events: ScheduleEvent[] }) {
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><Diamond size={22} /></div>
        <p className="font-semibold">No milestones</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl flex flex-col gap-0 relative pl-8">
      <div className="absolute left-3 top-0 bottom-0 w-px bg-[var(--border)]" />
      {sorted.map((evt, idx) => {
        const days = daysUntil(evt.date);
        const isPast = days < 0;
        return (
          <div key={evt.id} className={cn("flex gap-4 pb-6 relative", idx === sorted.length - 1 && "pb-0")}>
            <div
              className="absolute -left-5 w-4 h-4 rounded-full border-2 bg-[var(--bg-surface)] flex items-center justify-center"
              style={{
                borderColor: isPast ? "var(--success)" : "var(--primary)",
                background: isPast ? "var(--success)" : "var(--bg-surface)",
              }}
            >
              {isPast && <CheckCircle2 size={8} className="text-white" />}
            </div>
            <div className="card p-4 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-[var(--text-muted)] font-mono mb-1">{formatDate(evt.date)}</p>
                  <Link href={`/app/schedule/${evt.id}`} className="text-sm font-semibold hover:text-[var(--primary)] transition-colors">
                    {evt.title}
                  </Link>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{evt.project}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn("badge", EVENT_CONFIG[evt.type].chipCls, "text-[10px]")}>
                    {EVENT_CONFIG[evt.type].label}
                  </span>
                  {countdownChip(days)}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────── Commercial Deadlines ──────────── */

function CommercialDeadlines({ events }: { events: ScheduleEvent[] }) {
  const deadlines = events.filter((e) => e.type !== "milestone");

  if (deadlines.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><AlertTriangle size={22} /></div>
        <p className="font-semibold">No upcoming commercial deadlines</p>
        <p className="text-sm text-[var(--text-muted)]">Next 90 days are clear.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Description</th>
              <th>Project</th>
              <th>Due Date</th>
              <th>Days Remaining</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {deadlines.map((evt) => {
              const days = daysUntil(evt.date);
              return (
                <tr key={evt.id}>
                  <td>
                    <span className={cn("badge", EVENT_CONFIG[evt.type].chipCls, "text-[10px]")}>
                      {EVENT_CONFIG[evt.type].label}
                    </span>
                  </td>
                  <td>
                    <Link href={`/app/schedule/${evt.id}`} className="font-medium hover:text-[var(--primary)] transition-colors">
                      {evt.title}
                    </Link>
                  </td>
                  <td>
                    <Link href={`/app/projects/${evt.project_id}`} className="text-sm text-[var(--primary)] hover:underline">
                      {evt.project}
                    </Link>
                  </td>
                  <td className="text-sm tabular-nums">{formatDate(evt.date)}</td>
                  <td>{countdownChip(days)}</td>
                  <td>
                    <Link href={`/app/schedule/${evt.id}`} className="btn btn-ghost btn-sm">Open</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────── Project Schedule ──────────────── */

function ProjectScheduleView({ events }: { events: ScheduleEvent[] }) {
  const projects = Array.from(new Set(events.map((e) => e.project)));

  return (
    <div className="flex flex-col gap-6">
      {projects.map((project) => {
        const pEvents = events.filter((e) => e.project === project).sort((a, b) => a.date.localeCompare(b.date));
        return (
          <div key={project}>
            <h3 className="text-sm font-semibold mb-3">{project}</h3>
            <div className="card overflow-hidden">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Date</th>
                    <th>Days</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {pEvents.map((evt) => (
                    <tr key={evt.id}>
                      <td className="font-medium">
                        <Link href={`/app/schedule/${evt.id}`} className="hover:text-[var(--primary)] transition-colors">
                          {evt.title}
                        </Link>
                      </td>
                      <td><span className={cn("badge text-[10px]", EVENT_CONFIG[evt.type].chipCls)}>{EVENT_CONFIG[evt.type].label}</span></td>
                      <td className="text-sm tabular-nums">{formatDate(evt.date)}</td>
                      <td>{countdownChip(daysUntil(evt.date))}</td>
                      <td>
                        <Link href={`/app/schedule/${evt.id}`} className="btn btn-ghost btn-sm">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

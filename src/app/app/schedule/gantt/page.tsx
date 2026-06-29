"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Diamond, ZoomIn, ZoomOut, BarChart2 } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

/* ─────────────────────────── Types ─────────────────────────── */

interface GanttItem {
  id: string;
  title: string;
  project: string;
  project_id: string;
  start_date: string;
  end_date: string;
  color: string;
  type: "task" | "milestone";
  milestone_date?: string;
}

/* ─────────────────────────── Seed ──────────────────────────── */

const SEED_ITEMS: GanttItem[] = [
  { id: "g-001", title: "Thornfield Hub — Main Works", project: "Thornfield Commercial Hub", project_id: "p-001", start_date: "2026-03-01", end_date: "2026-06-28", color: "var(--primary)", type: "task" },
  { id: "g-002", title: "City Centre Retail — Fit-Out", project: "City Centre Retail Fit-Out", project_id: "p-002", start_date: "2026-04-15", end_date: "2026-08-30", color: "var(--success)", type: "task" },
  { id: "g-003", title: "Eastside Block A — Structure", project: "Eastside Residential Block A", project_id: "p-003", start_date: "2026-02-01", end_date: "2026-07-15", color: "var(--violet)", type: "task" },
  { id: "g-004", title: "Whitfield Leisure — Defects", project: "Whitfield Leisure Centre", project_id: "p-004", start_date: "2026-05-01", end_date: "2026-07-31", color: "var(--warning)", type: "task" },
  { id: "g-005", title: "Motorway Service Station", project: "Motorway Service Station", project_id: "p-006", start_date: "2026-05-15", end_date: "2026-09-30", color: "#06B6D4", type: "task" },
  { id: "g-006", title: "Office Block Phase 2 — Close-Out", project: "Office Block Phase 2", project_id: "p-005", start_date: "2026-01-01", end_date: "2026-06-30", color: "#F97316", type: "task" },
  // Milestones
  { id: "m-001", title: "PC — Thornfield", project: "Thornfield Commercial Hub", project_id: "p-001", start_date: "2026-06-28", end_date: "2026-06-28", color: "var(--primary)", type: "milestone", milestone_date: "2026-06-28" },
  { id: "m-002", title: "Section 107 — Eastside A", project: "Eastside Residential Block A", project_id: "p-003", start_date: "2026-07-15", end_date: "2026-07-15", color: "var(--violet)", type: "milestone", milestone_date: "2026-07-15" },
];

type Zoom = "month" | "quarter" | "year";

/* ─────────────────────────── Gantt Logic ───────────────────── */

function getDateRange(items: GanttItem[], zoom: Zoom): { start: Date; end: Date; headers: Date[] } {
  const allDates = items.flatMap((i) => [new Date(i.start_date), new Date(i.end_date)]);
  let rangeStart = new Date(Math.min(...allDates.map((d) => d.getTime())));
  let rangeEnd = new Date(Math.max(...allDates.map((d) => d.getTime())));

  // Pad
  rangeStart = new Date(rangeStart.getFullYear(), rangeStart.getMonth() - 1, 1);
  rangeEnd = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth() + 2, 0);

  const headers: Date[] = [];
  const current = new Date(rangeStart);

  if (zoom === "month") {
    // Weekly headers
    while (current <= rangeEnd) {
      headers.push(new Date(current));
      current.setDate(current.getDate() + 7);
    }
  } else if (zoom === "quarter") {
    // Monthly headers
    while (current <= rangeEnd) {
      headers.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }
  } else {
    // Quarterly headers
    while (current <= rangeEnd) {
      headers.push(new Date(current));
      current.setMonth(current.getMonth() + 3);
    }
  }

  return { start: rangeStart, end: rangeEnd, headers };
}

function getBarStyle(item: GanttItem, rangeStart: Date, rangeEnd: Date): { left: string; width: string } {
  const totalMs = rangeEnd.getTime() - rangeStart.getTime();
  const startMs = Math.max(new Date(item.start_date).getTime(), rangeStart.getTime()) - rangeStart.getTime();
  const endMs = Math.min(new Date(item.end_date).getTime(), rangeEnd.getTime()) - rangeStart.getTime();

  const left = (startMs / totalMs) * 100;
  const width = Math.max((endMs - startMs) / totalMs * 100, 0.5);

  return { left: `${left}%`, width: `${width}%` };
}

function getCurrentDateOffset(rangeStart: Date, rangeEnd: Date): string {
  const totalMs = rangeEnd.getTime() - rangeStart.getTime();
  const nowMs = Date.now() - rangeStart.getTime();
  const pct = (nowMs / totalMs) * 100;
  return `${Math.max(0, Math.min(100, pct))}%`;
}

/* ─────────────────────────── Page ──────────────────────────── */

export default function GanttPage() {
  const [zoom, setZoom] = useState<Zoom>("month");
  const timelineRef = useRef<HTMLDivElement>(null);

  const { start, end, headers } = getDateRange(SEED_ITEMS, zoom);
  const todayOffset = getCurrentDateOffset(start, end);

  const HEADER_LABEL_FMT: Record<Zoom, Intl.DateTimeFormatOptions> = {
    month: { day: "numeric", month: "short" },
    quarter: { month: "short", year: "2-digit" },
    year: { month: "short", year: "numeric" },
  };

  const LEFT_COL_W = 240;

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/app/schedule" className="btn btn-ghost btn-sm btn-icon">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold">Gantt Chart</h1>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">{SEED_ITEMS.filter((i) => i.type === "task").length} work items · {SEED_ITEMS.filter((i) => i.type === "milestone").length} milestones</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--text-muted)]">Zoom:</span>
          {(["month", "quarter", "year"] as Zoom[]).map((z) => (
            <button
              key={z}
              className={cn("btn btn-sm capitalize", zoom === z ? "btn-primary" : "btn-secondary")}
              onClick={() => setZoom(z)}
            >
              {z}
            </button>
          ))}
        </div>
      </div>

      <div className="page-content flex-1 overflow-hidden">
        <div className="card overflow-hidden">
          {/* Column headers */}
          <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
            {/* Fixed left col */}
            <div
              className="flex-shrink-0 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] bg-[var(--bg-subtle)]"
              style={{ width: LEFT_COL_W }}
            >
              Project / Item
            </div>
            {/* Timeline headers */}
            <div className="flex-1 overflow-x-auto" ref={timelineRef}>
              <div className="relative flex min-w-max">
                {headers.map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 min-w-[80px] px-2 py-2 text-xs text-[var(--text-muted)] border-l text-center"
                    style={{ borderColor: "var(--border-subtle)" }}
                  >
                    {h.toLocaleDateString("en-GB", HEADER_LABEL_FMT[zoom])}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Rows */}
          <div className="overflow-x-auto">
            {SEED_ITEMS.map((item, rowIdx) => {
              const barStyle = getBarStyle(item, start, end);
              const isMilestone = item.type === "milestone";
              return (
                <div
                  key={item.id}
                  className={cn("flex items-center border-b last:border-0 hover:bg-[var(--bg-subtle)] transition-colors")}
                  style={{ borderColor: "var(--border-subtle)", height: 44 }}
                >
                  {/* Left: project info */}
                  <div
                    className="flex-shrink-0 flex items-center gap-2 px-4 border-r"
                    style={{ width: LEFT_COL_W, borderColor: "var(--border)", height: "100%" }}
                  >
                    {isMilestone ? (
                      <Diamond size={12} style={{ color: item.color, flexShrink: 0 }} />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: item.color }} />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{item.title}</p>
                      <p className="text-[10px] text-[var(--text-muted)] truncate">{item.project}</p>
                    </div>
                  </div>

                  {/* Right: timeline bar */}
                  <div className="flex-1 relative min-w-[600px] h-full">
                    {/* Today line */}
                    <div
                      className="absolute top-0 bottom-0 w-px z-10"
                      style={{ left: todayOffset, background: "var(--danger)", opacity: 0.6 }}
                    />

                    {/* Grid lines */}
                    {headers.map((_, i) => (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 w-px"
                        style={{
                          left: `${(i / headers.length) * 100}%`,
                          background: "var(--border-subtle)",
                        }}
                      />
                    ))}

                    {/* Bar or Milestone diamond */}
                    {isMilestone ? (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rotate-45 z-10"
                        style={{
                          left: barStyle.left,
                          background: item.color,
                          transform: "translateY(-50%) rotate(45deg)",
                        }}
                        title={item.title}
                      />
                    ) : (
                      <div
                        className="absolute top-1/2 rounded h-6 z-10 flex items-center px-2"
                        style={{
                          left: barStyle.left,
                          width: barStyle.width,
                          background: item.color,
                          transform: "translateY(-50%)",
                          minWidth: 8,
                        }}
                        title={`${item.title}: ${formatDate(item.start_date)} – ${formatDate(item.end_date)}`}
                      >
                        <span className="text-white text-[10px] font-medium truncate">{item.title}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="px-4 py-3 border-t flex items-center gap-6 text-xs text-[var(--text-muted)]" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-0.5 bg-[var(--danger)]" />
              <span>Today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[var(--primary)]" />
              <span>Work item</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rotate-45 bg-[var(--violet)]" />
              <span>Milestone</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

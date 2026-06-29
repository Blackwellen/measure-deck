"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Diamond, Upload, X, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { FeatureGate } from "@/components/ui/feature-gate";
import { parseXER } from "@/lib/asta/xer-parser";
import type { XERParseResult } from "@/lib/asta/xer-parser";
import { createClient } from "@/lib/supabase/client";
import { createAuditEvent } from "@/lib/audit";
import { getWorkspaceId } from "@/lib/workspace";
import { toast } from "sonner";

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
  { id: "m-001", title: "PC — Thornfield", project: "Thornfield Commercial Hub", project_id: "p-001", start_date: "2026-06-28", end_date: "2026-06-28", color: "var(--primary)", type: "milestone", milestone_date: "2026-06-28" },
  { id: "m-002", title: "Section 107 — Eastside A", project: "Eastside Residential Block A", project_id: "p-003", start_date: "2026-07-15", end_date: "2026-07-15", color: "var(--violet)", type: "milestone", milestone_date: "2026-07-15" },
];

type Zoom = "month" | "quarter" | "year";

/* ─────────────────────────── Gantt Logic ───────────────────── */

function getDateRange(items: GanttItem[], zoom: Zoom): { start: Date; end: Date; headers: Date[] } {
  const allDates = items.flatMap((i) => [new Date(i.start_date), new Date(i.end_date)]);
  let rangeStart = new Date(Math.min(...allDates.map((d) => d.getTime())));
  let rangeEnd = new Date(Math.max(...allDates.map((d) => d.getTime())));

  rangeStart = new Date(rangeStart.getFullYear(), rangeStart.getMonth() - 1, 1);
  rangeEnd = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth() + 2, 0);

  const headers: Date[] = [];
  const current = new Date(rangeStart);

  if (zoom === "month") {
    while (current <= rangeEnd) {
      headers.push(new Date(current));
      current.setDate(current.getDate() + 7);
    }
  } else if (zoom === "quarter") {
    while (current <= rangeEnd) {
      headers.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }
  } else {
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

/* ─────────────────────────── Asta Import Panel ──────────────── */

interface AstaImportPanelProps {
  onClose: () => void;
  onImported: (items: GanttItem[]) => void;
}

function AstaImportPanel({ onClose, onImported }: AstaImportPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parseResult, setParseResult] = useState<XERParseResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result;
      if (typeof content !== "string") return;
      try {
        const result = parseXER(content);
        setParseResult(result);
      } catch {
        toast.error("Failed to parse XER file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handleImport() {
    if (!parseResult) return;
    setImporting(true);
    try {
      const supabase = createClient();
      const workspaceId = await getWorkspaceId(supabase);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Unauthenticated");

      const rows = parseResult.tasks.map((task) => ({
        workspace_id: workspaceId,
        name: task.task_name,
        start_date: task.start_date.toISOString().split("T")[0],
        end_date: task.end_date.toISOString().split("T")[0],
        status: task.percent_complete === 100 ? "complete" : task.percent_complete > 0 ? "in_progress" : "not_started",
        percent_complete: task.percent_complete,
        source: "asta_xer",
        external_id: task.task_id,
      }));

      if (rows.length > 0) {
        const { error } = await supabase.from("schedule_items").insert(rows);
        if (error) throw error;
      }

      await createAuditEvent(supabase, {
        workspace_id: workspaceId,
        user_id: user.id,
        action: "schedule_imported_from_asta",
        resource_type: "schedule",
        resource_id: workspaceId,
        new_values: {
          task_count: parseResult.total_tasks,
          project_name: parseResult.project_name,
        },
      });

      const COLOURS = [
        "var(--primary)", "var(--success)", "var(--violet)", "var(--warning)",
        "#06B6D4", "#F97316", "#8B5CF6", "#EC4899",
      ];

      const newItems: GanttItem[] = parseResult.tasks.map((task, idx) => ({
        id: `asta-${task.task_id}`,
        title: task.task_name,
        project: parseResult.project_name,
        project_id: "asta-import",
        start_date: task.start_date.toISOString().split("T")[0],
        end_date: task.end_date.toISOString().split("T")[0],
        color: COLOURS[idx % COLOURS.length],
        type: "task" as const,
      }));

      onImported(newItems);
      toast.success(`${parseResult.total_tasks} tasks imported from Asta`);
    } catch (err) {
      toast.error("Import failed — see console for details");
      console.error(err);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div
      className="card p-5 flex flex-col gap-4"
      style={{ border: "1px solid var(--primary)", boxShadow: "0 0 0 3px var(--primary-subtle)" }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[14px] font-700" style={{ color: "var(--text-primary)" }}>
            Import from Asta Powerproject
          </h3>
          <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            Select a .xer file exported from Asta Powerproject
          </p>
        </div>
        <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {!parseResult ? (
        <div
          className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:bg-[var(--bg-subtle)] transition-colors"
          style={{ borderColor: "var(--border)" }}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8" style={{ color: "var(--text-muted)" }} />
          <p className="text-[13px] font-500" style={{ color: "var(--text-secondary)" }}>
            Click to select a .xer file
          </p>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            Supports Asta Powerproject XER format
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xer"
            className="sr-only"
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div
            className="rounded-xl p-4"
            style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <p className="text-[13px] font-700" style={{ color: "var(--text-primary)" }}>
                File parsed: {fileName}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[12px]">
              <div>
                <p style={{ color: "var(--text-muted)" }}>Project Name</p>
                <p className="font-600" style={{ color: "var(--text-primary)" }}>
                  {parseResult.project_name}
                </p>
              </div>
              <div>
                <p style={{ color: "var(--text-muted)" }}>Tasks Found</p>
                <p className="font-700 text-green-700">{parseResult.total_tasks}</p>
              </div>
              <div>
                <p style={{ color: "var(--text-muted)" }}>Start Date</p>
                <p className="font-600" style={{ color: "var(--text-primary)" }}>
                  {parseResult.start_date.toLocaleDateString("en-GB")}
                </p>
              </div>
              <div>
                <p style={{ color: "var(--text-muted)" }}>Finish Date</p>
                <p className="font-600" style={{ color: "var(--text-primary)" }}>
                  {parseResult.finish_date.toLocaleDateString("en-GB")}
                </p>
              </div>
            </div>
            {parseResult.parse_errors.length > 0 && (
              <div className="mt-3 flex flex-col gap-1">
                <div className="flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                  <p className="text-[11px] font-600 text-amber-700">
                    {parseResult.parse_errors.length} parse warning{parseResult.parse_errors.length !== 1 ? "s" : ""}
                  </p>
                </div>
                {parseResult.parse_errors.slice(0, 3).map((err, i) => (
                  <p key={i} className="text-[10px] pl-5" style={{ color: "var(--text-muted)" }}>
                    {err}
                  </p>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => { setParseResult(null); setFileName(null); }}
            >
              Change File
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm flex-1"
              onClick={() => void handleImport()}
              disabled={importing || parseResult.total_tasks === 0}
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Importing…
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import {parseResult.total_tasks} Tasks
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Page ──────────────────────────── */

export default function GanttPage() {
  const [zoom, setZoom] = useState<Zoom>("month");
  const [ganttItems, setGanttItems] = useState<GanttItem[]>(SEED_ITEMS);
  const [showAstaImport, setShowAstaImport] = useState(false);
  const timelineRef = useRef<HTMLDivElement>(null);

  const { start, end, headers } = getDateRange(ganttItems, zoom);
  const todayOffset = getCurrentDateOffset(start, end);

  const HEADER_LABEL_FMT: Record<Zoom, Intl.DateTimeFormatOptions> = {
    month: { day: "numeric", month: "short" },
    quarter: { month: "short", year: "2-digit" },
    year: { month: "short", year: "numeric" },
  };

  const LEFT_COL_W = 240;

  function handleImported(newItems: GanttItem[]) {
    setGanttItems((prev) => [...prev, ...newItems]);
    setShowAstaImport(false);
  }

  return (
    <div className="flex flex-col min-h-full gap-4">
      <div className="page-header">
        <div className="flex items-center gap-3">
          <Link href="/app/schedule" className="btn btn-ghost btn-sm btn-icon">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold">Gantt Chart</h1>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              {ganttItems.filter((i) => i.type === "task").length} work items ·{" "}
              {ganttItems.filter((i) => i.type === "milestone").length} milestones
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FeatureGate flag="asta_import" fallback={null}>
            <button
              type="button"
              className={cn("btn btn-sm", showAstaImport ? "btn-primary" : "btn-secondary")}
              onClick={() => setShowAstaImport((v) => !v)}
            >
              <Upload size={14} />
              Import from Asta
            </button>
          </FeatureGate>
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

      {showAstaImport && (
        <div className="page-content">
          <AstaImportPanel
            onClose={() => setShowAstaImport(false)}
            onImported={handleImported}
          />
        </div>
      )}

      <div className="page-content flex-1 overflow-hidden">
        <div className="card overflow-hidden">
          <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
            <div
              className="flex-shrink-0 px-4 py-2 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] bg-[var(--bg-subtle)]"
              style={{ width: LEFT_COL_W }}
            >
              Project / Item
            </div>
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

          <div className="overflow-x-auto">
            {ganttItems.map((item) => {
              const barStyle = getBarStyle(item, start, end);
              const isMilestone = item.type === "milestone";
              return (
                <div
                  key={item.id}
                  className={cn("flex items-center border-b last:border-0 hover:bg-[var(--bg-subtle)] transition-colors")}
                  style={{ borderColor: "var(--border-subtle)", height: 44 }}
                >
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

                  <div className="flex-1 relative min-w-[600px] h-full">
                    <div
                      className="absolute top-0 bottom-0 w-px z-10"
                      style={{ left: todayOffset, background: "var(--danger)", opacity: 0.6 }}
                    />

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

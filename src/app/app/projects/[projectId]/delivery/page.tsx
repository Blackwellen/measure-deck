"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Search, ChevronDown, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type ActivityStatus = "Complete" | "On Track" | "Delayed" | "Not Started" | "Critical";

interface ScheduleActivity {
  id: string;
  name: string;
  package: string;
  start: string;
  finish: string;
  duration: string;
  status: ActivityStatus;
  progress: number;
  float: number;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SCHEDULE_ACTIVITIES: ScheduleActivity[] = [
  { id: "A001", name: "Site Clearance & Demolition",     package: "Civil",     start: "2024-08-01", finish: "2024-09-15", duration: "45d",  status: "Complete",    progress: 100, float: 0   },
  { id: "A002", name: "Substructure – Piling",           package: "Civil",     start: "2024-09-01", finish: "2024-10-20", duration: "49d",  status: "Complete",    progress: 100, float: 0   },
  { id: "A003", name: "Groundworks & Drainage",          package: "Civil",     start: "2024-10-01", finish: "2024-11-30", duration: "60d",  status: "Complete",    progress: 100, float: 0   },
  { id: "A004", name: "RC Frame – Level 1",              package: "Structure", start: "2024-11-01", finish: "2025-01-15", duration: "75d",  status: "Complete",    progress: 100, float: 0   },
  { id: "A005", name: "RC Frame – Level 2",              package: "Structure", start: "2024-12-15", finish: "2025-02-28", duration: "75d",  status: "Complete",    progress: 100, float: 2   },
  { id: "A006", name: "RC Frame – Level 3",              package: "Structure", start: "2025-02-01", finish: "2025-04-15", duration: "73d",  status: "Complete",    progress: 100, float: 0   },
  { id: "A007", name: "RC Frame – Level 4",              package: "Structure", start: "2025-03-15", finish: "2025-05-30", duration: "76d",  status: "Delayed",     progress: 78,  float: -8  },
  { id: "A008", name: "External Envelope – Phase 1",     package: "External",  start: "2025-04-01", finish: "2025-06-30", duration: "90d",  status: "On Track",    progress: 45,  float: 5   },
  { id: "A009", name: "MEP Rough-in – Levels 1–2",      package: "MEP",       start: "2025-03-01", finish: "2025-05-15", duration: "75d",  status: "On Track",    progress: 60,  float: 3   },
  { id: "A010", name: "MEP Rough-in – Levels 3–4",      package: "MEP",       start: "2025-05-01", finish: "2025-07-15", duration: "75d",  status: "Not Started", progress: 0,   float: 8   },
  { id: "A011", name: "Internal Partitions – L1–L2",    package: "Finishes",  start: "2025-05-15", finish: "2025-07-30", duration: "76d",  status: "Not Started", progress: 0,   float: 12  },
  { id: "A012", name: "Fit-out – Apartments L1",        package: "Finishes",  start: "2025-07-01", finish: "2025-09-30", duration: "91d",  status: "Not Started", progress: 0,   float: 6   },
  { id: "A013", name: "Roof Waterproofing",             package: "External",  start: "2025-06-15", finish: "2025-07-30", duration: "45d",  status: "Not Started", progress: 0,   float: 4   },
  { id: "A014", name: "Commissioning – MEP",            package: "MEP",       start: "2025-10-01", finish: "2025-11-15", duration: "45d",  status: "Not Started", progress: 0,   float: 0   },
  { id: "A015", name: "Practical Completion",           package: "Civil",     start: "2025-12-01", finish: "2025-12-01", duration: "1d",   status: "Not Started", progress: 0,   float: 0   },
];

const PACKAGES = ["All", "Civil", "Structure", "MEP", "Finishes", "External", "Temp Works"];
const STATUSES: Array<ActivityStatus | "All"> = ["All", "Complete", "On Track", "Delayed", "Not Started", "Critical"];

const PROGRESS_SPARKLINE = [
  { m: "Jan", v: 28 }, { m: "Feb", v: 34 }, { m: "Mar", v: 42 },
  { m: "Apr", v: 51 }, { m: "May", v: 58 }, { m: "Jun", v: 62 },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusChip(status: ActivityStatus) {
  const map: Record<ActivityStatus, string> = {
    Complete:    "badge chip-success",
    "On Track":  "badge chip-info",
    Delayed:     "badge chip-danger",
    "Not Started":"badge chip-muted",
    Critical:    "badge chip-warning",
  };
  return map[status] ?? "badge chip-muted";
}

function floatColor(f: number) {
  if (f < 0)  return "text-red-600 font-600";
  if (f === 0) return "text-amber-600 font-500";
  return "text-green-600";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
}

function ganttColor(status: ActivityStatus) {
  const map: Record<ActivityStatus, string> = {
    Complete:    "#10B981",
    "On Track":  "#3B5EE8",
    Delayed:     "#EF4444",
    "Not Started":"#94A3B8",
    Critical:    "#F59E0B",
  };
  return map[status] ?? "#94A3B8";
}

// ─── Gantt bar data ───────────────────────────────────────────────────────────

const PROJECT_START = new Date("2024-08-01").getTime();

function toGanttData(activities: ScheduleActivity[]) {
  return activities.slice(0, 8).map((a) => {
    const startMs  = new Date(a.start).getTime();
    const finishMs = new Date(a.finish).getTime();
    const offsetDays = Math.round((startMs - PROJECT_START) / 86_400_000);
    const durationDays = Math.max(1, Math.round((finishMs - startMs) / 86_400_000));
    return {
      name: a.name.length > 26 ? a.name.slice(0, 26) + "…" : a.name,
      offset: offsetDays,
      duration: durationDays,
      fill: ganttColor(a.status),
    };
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  const color =
    value === 100 ? "#10B981" :
    value >= 50   ? "#3B5EE8" :
    value > 0     ? "#F59E0B" : "#E2E8F0";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-muted)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="text-[11px] font-500 w-7 text-right" style={{ color: "var(--text-muted)" }}>
        {value}%
      </span>
    </div>
  );
}

function SelectDropdown({
  value,
  options,
  onChange,
  label,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none form-input pr-8 py-1.5 text-[13px] cursor-pointer"
        aria-label={label}
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--text-muted)" }} />
    </div>
  );
}

// ─── Custom Gantt tooltip ─────────────────────────────────────────────────────

function GanttTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; offset: number; duration: number } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border px-3 py-2 text-[12px] shadow-lg" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
      <p className="font-600" style={{ color: "var(--text-primary)" }}>{d.name}</p>
      <p style={{ color: "var(--text-muted)" }}>Start offset: {d.offset}d · Duration: {d.duration}d</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DeliverySchedulePage() {
  const [search, setSearch]       = useState("");
  const [pkg, setPkg]             = useState("All");
  const [status, setStatus]       = useState<ActivityStatus | "All">("All");

  const filtered = useMemo(() => {
    return SCHEDULE_ACTIVITIES.filter((a) => {
      const matchSearch = search === "" || a.name.toLowerCase().includes(search.toLowerCase()) || a.id.toLowerCase().includes(search.toLowerCase());
      const matchPkg    = pkg === "All" || a.package === pkg;
      const matchStatus = status === "All" || a.status === status;
      return matchSearch && matchPkg && matchStatus;
    });
  }, [search, pkg, status]);

  const ganttData = useMemo(() => toGanttData(SCHEDULE_ACTIVITIES), []);

  return (
    <div className="flex flex-col gap-6">

      {/* ── KPI Strip ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Overall Progress */}
        <div className="card p-4 flex flex-col gap-2">
          <span className="kpi-label">Overall Progress</span>
          <span className="kpi-value">62%</span>
          <div className="h-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={PROGRESS_SPARKLINE} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="pgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3B5EE8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B5EE8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#3B5EE8" strokeWidth={1.5} fill="url(#pgGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activities On Track */}
        <div className="card p-4 flex flex-col gap-1">
          <span className="kpi-label">Activities On Track</span>
          <span className="kpi-value">38/52</span>
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>73% of programme</span>
        </div>

        {/* Delayed Activities */}
        <div className="card p-4 flex flex-col gap-1">
          <span className="kpi-label">Delayed Activities</span>
          <div className="flex items-center gap-2">
            <span className="kpi-value">7</span>
            <span className="badge chip-danger">At risk</span>
          </div>
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Max delay: 8 days</span>
        </div>

        {/* Float Available */}
        <div className="card p-4 flex flex-col gap-1">
          <span className="kpi-label">Float Available</span>
          <span className="kpi-value">12 days</span>
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Critical path items: 7</span>
        </div>
      </div>

      {/* ── Filter Toolbar ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
          <input
            type="text"
            placeholder="Search activities…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input w-full pl-8 py-1.5 text-[13px]"
          />
        </div>
        <SelectDropdown value={pkg}    options={PACKAGES}  onChange={setPkg}    label="Package" />
        <SelectDropdown value={status} options={STATUSES}  onChange={(v) => setStatus(v as ActivityStatus | "All")} label="Status" />
      </div>

      {/* ── Schedule Table ─────────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th className="w-16">#</th>
                <th>Activity</th>
                <th>Package</th>
                <th>Start</th>
                <th>Finish</th>
                <th className="w-20">Duration</th>
                <th>Status</th>
                <th className="w-36">Progress</th>
                <th className="w-20 text-right">Float</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-10" style={{ color: "var(--text-muted)" }}>
                    No activities match the current filters
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id}>
                    <td className="font-mono text-[12px]" style={{ color: "var(--text-muted)" }}>{a.id}</td>
                    <td className="font-500 text-[13px]" style={{ color: "var(--text-primary)" }}>{a.name}</td>
                    <td>
                      <span className="badge chip-muted">{a.package}</span>
                    </td>
                    <td className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{fmtDate(a.start)}</td>
                    <td className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{fmtDate(a.finish)}</td>
                    <td className="text-[12px]" style={{ color: "var(--text-muted)" }}>{a.duration}</td>
                    <td><span className={statusChip(a.status)}>{a.status}</span></td>
                    <td><ProgressBar value={a.progress} /></td>
                    <td className={cn("text-right text-[12px]", floatColor(a.float))}>
                      {a.float > 0 ? `+${a.float}d` : a.float === 0 ? "0d" : `${a.float}d`}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Gantt Visual Summary ───────────────────────────────────────────── */}
      <div className="card p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-600" style={{ color: "var(--text-primary)" }}>
            Programme Overview (Top 8 Activities)
          </h3>
          <div className="flex items-center gap-3 text-[11px]" style={{ color: "var(--text-muted)" }}>
            {(["Complete", "On Track", "Delayed", "Not Started"] as ActivityStatus[]).map((s) => (
              <span key={s} className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: ganttColor(s) }} />
                {s}
              </span>
            ))}
          </div>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={ganttData}
              margin={{ top: 0, right: 16, bottom: 16, left: 0 }}
              barSize={14}
            >
              <XAxis
                type="number"
                domain={[0, 500]}
                tickCount={6}
                tick={{ fontSize: 11, fill: "#94A3B8" }}
                tickFormatter={(v: number) => `+${v}d`}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={170}
                tick={{ fontSize: 11, fill: "#475569" }}
              />
              <Tooltip content={<GanttTooltip />} />
              {/* Transparent offset bar to push the actual bar */}
              <Bar dataKey="offset" stackId="g" fill="transparent" radius={0} />
              <Bar
                dataKey="duration"
                stackId="g"
                radius={[2, 2, 2, 2]}
                label={false}
              >
                {ganttData.map((entry, index) => (
                  <Cell key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
          X-axis shows days offset from project start (01 Aug 2024). Bar length represents activity duration.
        </p>
      </div>

      {/* ── Critical Path Alert ────────────────────────────────────────────── */}
      <div
        className="card border-l-4 px-5 py-4 flex items-start gap-3"
        style={{ borderLeftColor: "var(--danger)" }}
      >
        <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0 text-red-500" />
        <div className="flex flex-col gap-1">
          <p className="text-[14px] font-600" style={{ color: "var(--text-primary)" }}>
            Critical Path Alert — 7 Activities at Risk
          </p>
          <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
            7 activities are on the critical path. <strong>RC Frame – Level 4</strong> is delayed by 8 days —
            this cascades to Commissioning (MEP) and Practical Completion. Immediate action required to
            recover programme float.
          </p>
        </div>
      </div>

    </div>
  );
}

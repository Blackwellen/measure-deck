"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Edit2, Link2, CheckCircle2, Trash2, Plus,
  AlertTriangle, Clock, User, Calendar, ChevronRight,
  Save, X, BarChart2, GitMerge, TrendingUp, Activity,
  Layers, Hammer, Package, AlertCircle,
} from "lucide-react";
import { cn, formatDate, formatDateTime, formatRelative, formatCurrency, getInitials } from "@/lib/utils";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "details" | "dependencies" | "resources" | "delays" | "progress" | "audit";
type ItemType = "Milestone" | "Activity" | "Summary" | "Phase";
type ItemStatus = "Not Started" | "In Progress" | "Complete" | "On Hold" | "Delayed";

interface ScheduleItem {
  id: string;
  title: string;
  type: ItemType;
  status: ItemStatus;
  wbs_code: string;
  responsible_party: string;
  notes: string;
  start_date: string;
  end_date: string;
  baseline_start: string;
  baseline_end: string;
  actual_start: string | null;
  actual_end: string | null;
  progress_percent: number;
  duration_days: number;
  float_days: number;
  is_critical: boolean;
  dependencies: string[];
  colour: string;
  description?: string;
}

interface Dependency {
  id: string; activity: string; wbs: string;
  lag: number; type: "FS" | "SS" | "FF" | "SF"; direction: "predecessor" | "successor";
}

interface Resource {
  id: string; resource_type: "Labour" | "Plant" | "Material";
  name: string; quantity: number; unit: string;
  budgeted_cost: number; actual_cost: number; notes: string;
}

interface DelayEvent {
  id: string; ref: string;
  type: "Excusable" | "Compensable" | "Concurrent";
  days: number; ce_reference: string;
  status: "Assessed" | "Pending" | "Rejected"; notes: string;
}

interface ProgressUpdate {
  id: string; date: string; percent_complete: number;
  remaining_days: number; updated_by: string; notes: string;
}

interface AuditEntry {
  id: string; timestamp: string; user: string; action: string; detail: string;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_ITEM: ScheduleItem = {
  id: "si-001",
  title: "Concrete Frame — Level 1 to Level 5",
  type: "Activity",
  status: "In Progress",
  wbs_code: "03.02.01",
  responsible_party: "Galliford Try (Main Contractor)",
  notes: "Concrete frame construction for Levels 1–5. Formwork and reinforcement on Level 2 outstanding.",
  start_date: "2025-10-06",
  end_date: "2026-01-16",
  baseline_start: "2025-10-06",
  baseline_end: "2025-12-19",
  actual_start: "2025-10-06",
  actual_end: null,
  progress_percent: 62,
  duration_days: 72,
  float_days: 0,
  is_critical: true,
  dependencies: ["si-000", "si-002"],
  colour: "#3B5EE8",
  description: "Reinforced concrete frame construction for the main tower, Levels 1 through 5. Includes all formwork, reinforcement, pour and striking works. Current programme shows 4 week delay versus baseline due to unforeseen groundworks issues impacting crane set-up.",
};

const SEED_DEPS: Dependency[] = [
  { id: "d1", activity: "Groundworks & Foundations",      wbs: "03.01.01", lag: 0, type: "FS", direction: "predecessor" },
  { id: "d2", activity: "Pile Caps & Ground Beams",        wbs: "03.01.02", lag: 5, type: "FS", direction: "predecessor" },
  { id: "d3", activity: "Concrete Frame Level 6–Roof",    wbs: "03.02.02", lag: 0, type: "FS", direction: "successor" },
  { id: "d4", activity: "External Cladding Level 1–5",    wbs: "04.01.01", lag: 10, type: "SS", direction: "successor" },
];

const SEED_RESOURCES: Resource[] = [
  { id: "rs1", resource_type: "Labour",   name: "Concretor Gang (8 operatives)", quantity: 8,  unit: "Person/day", budgeted_cost: 384000, actual_cost: 240000, notes: "Rate £600/person/day" },
  { id: "rs2", resource_type: "Plant",    name: "Tower Crane",                  quantity: 1,  unit: "Week",       budgeted_cost: 120000, actual_cost: 142000, notes: "Extended hire due to programme delay" },
  { id: "rs3", resource_type: "Plant",    name: "Concrete Pump",                quantity: 1,  unit: "Day",        budgeted_cost: 18000,  actual_cost: 21500,  notes: "Additional pours required" },
  { id: "rs4", resource_type: "Material", name: "Reinforced Concrete C32/40",   quantity: 1850, unit: "m³",       budgeted_cost: 275000, actual_cost: 195000, notes: "Ongoing delivery schedule" },
  { id: "rs5", resource_type: "Material", name: "Reinforcement Bar (B500B)",    quantity: 185,  unit: "Tonne",    budgeted_cost: 162000, actual_cost: 108000, notes: "On programme" },
];

const SEED_DELAYS: DelayEvent[] = [
  { id: "de1", ref: "DEL-001", type: "Excusable",     days: 14, ce_reference: "CE-027", status: "Assessed", notes: "Unforeseen ground conditions — rock obstruction at pile cap C12 requiring hand breaking." },
  { id: "de2", ref: "DEL-002", type: "Excusable",     days: 7,  ce_reference: "CE-031", status: "Pending",  notes: "Exceptionally inclement weather — 14–21 Nov 2025. 7 days non-working claimed." },
  { id: "de3", ref: "DEL-003", type: "Compensable",   days: 5,  ce_reference: "CE-038", status: "Pending",  notes: "Late issue of revised structural drawings by CA. 5-day impact on critical path." },
];

const SEED_PROGRESS: ProgressUpdate[] = [
  { id: "pu1", date: "2026-06-02", percent_complete: 62, remaining_days: 28, updated_by: "James Walsh",  notes: "Levels 1–3 complete and struck. Level 4 pour complete, striking next week. Level 5 formwork ongoing." },
  { id: "pu2", date: "2026-05-05", percent_complete: 48, remaining_days: 42, updated_by: "James Walsh",  notes: "Levels 1–3 poured and curing. Level 4 formwork and rebar ongoing." },
  { id: "pu3", date: "2026-04-07", percent_complete: 32, remaining_days: 56, updated_by: "Sarah Chen",   notes: "Level 2 pour complete. Level 3 formwork progressing." },
  { id: "pu4", date: "2026-03-03", percent_complete: 18, remaining_days: 70, updated_by: "Sarah Chen",   notes: "Level 1 pour complete. Crane delay impacted programme by 1 week." },
  { id: "pu5", date: "2026-01-06", percent_complete: 5,  remaining_days: 90, updated_by: "James Walsh",  notes: "Commenced on site — formwork Level 1. Programme impacted by groundworks delay." },
];

const SEED_AUDIT: AuditEntry[] = [
  { id: "au1", timestamp: "2026-06-02T09:00:00Z", user: "James Walsh",  action: "Progress updated",    detail: "Progress updated to 62% · Remaining: 28 days" },
  { id: "au2", timestamp: "2026-05-20T14:00:00Z", user: "Admin",        action: "Status changed",      detail: "Status changed from Not Started to In Progress" },
  { id: "au3", timestamp: "2026-05-05T10:00:00Z", user: "James Walsh",  action: "Progress updated",    detail: "Progress updated to 48% · Remaining: 42 days" },
  { id: "au4", timestamp: "2026-04-15T11:00:00Z", user: "Sarah Chen",   action: "Delay recorded",      detail: "DEL-003 added: Late structural drawings — 5 days compensable delay" },
  { id: "au5", timestamp: "2026-03-10T09:30:00Z", user: "Tom Hughes",   action: "Resource added",      detail: "Concrete Pump added to resource plan" },
  { id: "au6", timestamp: "2026-01-05T08:00:00Z", user: "Admin",        action: "Activity created",    detail: "Schedule item created — WBS 03.02.01" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_CHIP: Record<ItemType, string> = {
  Milestone: "chip-violet",
  Activity:  "chip-info",
  Summary:   "chip-muted",
  Phase:     "chip-warning",
};

const STATUS_CHIP: Record<ItemStatus, string> = {
  "Not Started": "chip-muted",
  "In Progress": "chip-warning",
  "Complete":    "chip-success",
  "On Hold":     "chip-muted",
  "Delayed":     "chip-danger",
};

const RESOURCE_ICON: Record<Resource["resource_type"], React.ReactNode> = {
  Labour:   <User size={13} />,
  Plant:    <Hammer size={13} />,
  Material: <Package size={13} />,
};

const DELAY_CHIP: Record<DelayEvent["type"], string> = {
  Excusable:    "chip-warning",
  Compensable:  "chip-success",
  Concurrent:   "chip-muted",
};

const DEP_TYPE_LABEL: Record<Dependency["type"], string> = {
  FS: "Finish-to-Start",
  SS: "Start-to-Start",
  FF: "Finish-to-Finish",
  SF: "Start-to-Finish",
};

const TABS: { id: Tab; label: string }[] = [
  { id: "details",      label: "Details" },
  { id: "dependencies", label: "Dependencies" },
  { id: "resources",    label: "Resources" },
  { id: "delays",       label: "Delay Events" },
  { id: "progress",     label: "Progress" },
  { id: "audit",        label: "Audit" },
];

// ─── Tab: Details ─────────────────────────────────────────────────────────────

function DetailsTab({ item }: { item: ScheduleItem }) {
  const [form, setForm] = useState({
    title: item.title,
    type: item.type as string,
    wbs_code: item.wbs_code,
    responsible_party: item.responsible_party,
    description: item.description ?? "",
    notes: item.notes,
    start_date: item.start_date,
    end_date: item.end_date,
    baseline_start: item.baseline_start,
    baseline_end: item.baseline_end,
    actual_start: item.actual_start ?? "",
    actual_end: item.actual_end ?? "",
    progress_percent: item.progress_percent,
    float_days: item.float_days,
    is_critical: item.is_critical,
  });
  const [saving, setSaving] = useState(false);

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5EE8]";

  async function handleSave() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    toast.success("Activity details saved");
  }

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Activity details */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-sm">Activity Details</h3>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Title</label>
            <input type="text" className={inputCls} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Type</label>
              <select className={inputCls} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option>Milestone</option>
                <option>Activity</option>
                <option>Summary</option>
                <option>Phase</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>WBS Code</label>
              <input type="text" className={inputCls} value={form.wbs_code} onChange={e => setForm(f => ({ ...f, wbs_code: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Responsible Party</label>
            <input type="text" className={inputCls} value={form.responsible_party} onChange={e => setForm(f => ({ ...f, responsible_party: e.target.value }))} />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Description</label>
            <textarea rows={3} className={inputCls} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Notes</label>
            <textarea rows={2} className={inputCls} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Critical Path Activity</label>
            <button
              className={cn("w-10 h-6 rounded-full flex items-center transition-colors", form.is_critical ? "bg-red-500 justify-end" : "bg-gray-200 justify-start")}
              onClick={() => setForm(f => ({ ...f, is_critical: !f.is_critical }))}
            >
              <span className="w-5 h-5 rounded-full bg-white shadow mx-0.5 block" />
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Float Days</label>
            <input type="number" className={inputCls} value={form.float_days} onChange={e => setForm(f => ({ ...f, float_days: Number(e.target.value) }))} />
          </div>

          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            <Save size={14} /> {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>

        {/* Right: Dates + progress */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h3 className="font-semibold text-sm">Dates</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Planned Start", key: "start_date" },
                { label: "Planned End",   key: "end_date" },
                { label: "Baseline Start", key: "baseline_start" },
                { label: "Baseline End",   key: "baseline_end" },
                { label: "Actual Start",   key: "actual_start" },
                { label: "Actual End",     key: "actual_end" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>{label}</label>
                  <input
                    type="date"
                    className={inputCls}
                    value={(form as any)[key] ?? ""}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h3 className="font-semibold text-sm">Progress</h3>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>Percent Complete</label>
                <span className="font-bold text-base" style={{ color: "var(--primary)" }}>{form.progress_percent}%</span>
              </div>
              <input
                type="range"
                min={0} max={100} step={5}
                value={form.progress_percent}
                className="w-full accent-[#3B5EE8]"
                onChange={e => setForm(f => ({ ...f, progress_percent: Number(e.target.value) }))}
              />
              <div className="h-2 rounded-full mt-2 overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${form.progress_percent}%`, background: "var(--primary)" }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Duration (working days)</p>
                <p className="font-semibold mt-0.5">{item.duration_days} days</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Float Days</p>
                <p className="font-semibold mt-0.5">{form.float_days} days</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Dependencies ────────────────────────────────────────────────────────

function DependenciesTab({ item }: { item: ScheduleItem }) {
  const predecessors = SEED_DEPS.filter(d => d.direction === "predecessor");
  const successors   = SEED_DEPS.filter(d => d.direction === "successor");

  function DepTable({ deps, title, add }: { deps: Dependency[]; title: string; add: string }) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="font-semibold text-sm">{title} ({deps.length})</span>
          <button className="btn btn-ghost btn-sm text-xs"><Plus size={12} /> {add}</button>
        </div>
        {deps.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>None defined</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr><th>Activity</th><th>WBS</th><th>Type</th><th>Lag (days)</th><th /></tr>
            </thead>
            <tbody>
              {deps.map(d => (
                <tr key={d.id}>
                  <td className="font-medium text-sm">{d.activity}</td>
                  <td className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{d.wbs}</td>
                  <td>
                    <span className="badge chip-info text-xs" title={DEP_TYPE_LABEL[d.type]}>{d.type}</span>
                  </td>
                  <td className="text-sm tabular-nums">{d.lag > 0 ? `+${d.lag}` : d.lag}d</td>
                  <td>
                    <button className="btn btn-ghost btn-icon btn-sm"><ChevronRight size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <DepTable deps={predecessors} title="Predecessors" add="Add Predecessor" />
        <DepTable deps={successors}   title="Successors"   add="Add Successor" />
      </div>

      {/* Mini network diagram */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-semibold text-sm mb-4">Dependency Network (Immediate)</h3>
        <div className="flex items-center gap-4 overflow-x-auto pb-2">
          {/* Predecessors */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            {predecessors.map(d => (
              <div key={d.id} className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium max-w-[180px]" style={{ color: "var(--text-secondary)" }}>
                <div className="truncate">{d.activity}</div>
                <div className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{d.wbs}</div>
              </div>
            ))}
          </div>
          {/* Arrows */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="w-8 h-px bg-gray-300" />
            <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
          </div>
          {/* This activity */}
          <div className="flex-shrink-0 px-4 py-3 rounded-xl border-2 text-sm font-bold max-w-[200px] text-center"
            style={{ borderColor: "var(--primary)", color: "var(--primary)", background: "var(--primary-light)" }}>
            <div className="truncate">{item.title}</div>
            <div className="text-xs font-normal mt-0.5" style={{ color: "var(--primary)" }}>{item.wbs_code}</div>
          </div>
          {/* Arrows */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <div className="w-8 h-px bg-gray-300" />
            <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
          </div>
          {/* Successors */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            {successors.map(d => (
              <div key={d.id} className="px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium max-w-[180px]" style={{ color: "var(--text-secondary)" }}>
                <div className="truncate">{d.activity}</div>
                <div className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>{d.wbs}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Resources ───────────────────────────────────────────────────────────

function ResourcesTab() {
  const totalBudgeted = SEED_RESOURCES.reduce((acc, r) => acc + r.budgeted_cost, 0);
  const totalActual   = SEED_RESOURCES.reduce((acc, r) => acc + r.actual_cost,   0);
  const variance = totalActual - totalBudgeted;

  return (
    <div className="p-6 space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Budgeted Cost",  value: formatCurrency(totalBudgeted), color: "var(--text-primary)" },
          { label: "Actual Cost",    value: formatCurrency(totalActual),   color: "var(--text-primary)" },
          { label: "Variance",       value: (variance > 0 ? "+" : "") + formatCurrency(variance), color: variance > 0 ? "var(--danger)" : "var(--success)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</p>
            <p className="font-bold text-lg mt-0.5" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Assigned Resources ({SEED_RESOURCES.length})</h3>
        <button className="btn btn-primary btn-sm"><Plus size={14} /> Add Resource</button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Name</th>
              <th className="text-right">Qty</th>
              <th>Unit</th>
              <th className="text-right">Budgeted</th>
              <th className="text-right">Actual</th>
              <th className="text-right">Variance</th>
              <th>Notes</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {SEED_RESOURCES.map(r => {
              const var_ = r.actual_cost - r.budgeted_cost;
              return (
                <tr key={r.id}>
                  <td>
                    <span className="flex items-center gap-1.5 badge chip-muted">
                      {RESOURCE_ICON[r.resource_type]}
                      {r.resource_type}
                    </span>
                  </td>
                  <td className="font-medium text-sm">{r.name}</td>
                  <td className="text-right tabular-nums text-sm">{r.quantity.toLocaleString()}</td>
                  <td className="text-sm" style={{ color: "var(--text-muted)" }}>{r.unit}</td>
                  <td className="text-right tabular-nums text-sm font-medium">{formatCurrency(r.budgeted_cost)}</td>
                  <td className="text-right tabular-nums text-sm font-medium">{formatCurrency(r.actual_cost)}</td>
                  <td className={cn("text-right tabular-nums text-sm font-semibold", var_ > 0 ? "text-[var(--danger)]" : "text-[var(--success)]")}>
                    {var_ > 0 ? "+" : ""}{formatCurrency(var_)}
                  </td>
                  <td className="text-xs max-w-[160px] truncate" style={{ color: "var(--text-muted)" }} title={r.notes}>{r.notes || "—"}</td>
                  <td><button className="btn btn-ghost btn-icon btn-sm"><X size={13} /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab: Delay Events ────────────────────────────────────────────────────────

function DelayEventsTab() {
  const [showAdd, setShowAdd] = useState(false);
  const totalDays = SEED_DELAYS.reduce((acc, d) => acc + d.days, 0);
  const assessedDays = SEED_DELAYS.filter(d => d.status === "Assessed").reduce((acc, d) => acc + d.days, 0);

  return (
    <div className="p-6 space-y-5">
      {/* Banner */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Delay Days Claimed", value: `${totalDays} days`, color: "var(--danger)" },
          { label: "Days Assessed / Agreed",   value: `${assessedDays} days`, color: "var(--success)" },
          { label: "EoT Applied",              value: `${assessedDays} days`, color: "var(--primary)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</p>
            <p className="font-bold text-lg mt-0.5" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Delay Events ({SEED_DELAYS.length})</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={14} /> Add Delay Event</button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">New Delay Event</h4>
            <button onClick={() => setShowAdd(false)} className="btn btn-ghost btn-icon btn-sm"><X size={14} /></button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Delay Ref</label>
              <input type="text" placeholder="DEL-004" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Type</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
                <option>Excusable</option><option>Compensable</option><option>Concurrent</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Days</label>
              <input type="number" placeholder="0" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>CE Reference</label>
              <input type="text" placeholder="CE-XXX" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Status</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
                <option>Pending</option><option>Assessed</option><option>Rejected</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Notes</label>
            <textarea rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary btn-sm" onClick={() => { setShowAdd(false); toast.success("Delay event added"); }}>
              <Plus size={14} /> Add Delay Event
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ref</th>
              <th>Type</th>
              <th className="text-right">Days</th>
              <th>CE Reference</th>
              <th>Status</th>
              <th>Notes</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {SEED_DELAYS.map(d => (
              <tr key={d.id}>
                <td><span className="font-mono text-xs font-bold" style={{ color: "var(--danger)" }}>{d.ref}</span></td>
                <td><span className={cn("badge", DELAY_CHIP[d.type])}>{d.type}</span></td>
                <td className="text-right tabular-nums font-semibold text-sm" style={{ color: "var(--danger)" }}>{d.days}d</td>
                <td>
                  <span className="font-mono text-xs font-semibold" style={{ color: "var(--primary)" }}>{d.ce_reference}</span>
                </td>
                <td>
                  <span className={cn("badge", d.status === "Assessed" ? "chip-success" : d.status === "Rejected" ? "chip-danger" : "chip-warning")}>
                    {d.status}
                  </span>
                </td>
                <td className="text-xs max-w-[220px] truncate" style={{ color: "var(--text-muted)" }} title={d.notes}>{d.notes}</td>
                <td><button className="btn btn-ghost btn-icon btn-sm"><X size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab: Progress ────────────────────────────────────────────────────────────

const S_CURVE_DATA = [
  { period: "Jan",  planned: 5,  actual: 5  },
  { period: "Feb",  planned: 12, actual: 8  },
  { period: "Mar",  planned: 22, actual: 18 },
  { period: "Apr",  planned: 35, actual: 32 },
  { period: "May",  planned: 50, actual: 48 },
  { period: "Jun",  planned: 65, actual: 62 },
  { period: "Jul",  planned: 78, actual: null },
  { period: "Aug",  planned: 88, actual: null },
  { period: "Sep",  planned: 95, actual: null },
  { period: "Oct",  planned: 100, actual: null },
];

function ProgressTab({ item }: { item: ScheduleItem }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newPercent, setNewPercent] = useState(item.progress_percent);

  return (
    <div className="p-6 space-y-5">
      {/* S-Curve Chart */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-semibold text-sm mb-4">S-Curve: Planned vs Actual Progress</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={S_CURVE_DATA} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
            <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#94A3B8" }} />
            <YAxis tickFormatter={v => `${v}%`} tick={{ fontSize: 11, fill: "#94A3B8" }} domain={[0, 100]} />
            <Tooltip formatter={(v: unknown) => v != null ? `${v}%` : "—"} />
            <Legend />
            <Line type="monotone" dataKey="planned" stroke="#94A3B8" strokeWidth={2} dot={false} name="Planned %" strokeDasharray="5 5" />
            <Line type="monotone" dataKey="actual"  stroke="#3B5EE8" strokeWidth={2} dot={{ r: 4 }} connectNulls={false} name="Actual %" />
          </LineChart>
        </ResponsiveContainer>
        <p className="text-xs mt-2 text-center" style={{ color: "var(--text-muted)" }}>
          Current: <strong>{item.progress_percent}%</strong> complete · Behind planned by <strong>3%</strong> as of Jun 2026
        </p>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Progress Update History</h3>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}><Plus size={14} /> Add Progress Update</button>
      </div>

      {showAdd && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">New Progress Update</h4>
            <button onClick={() => setShowAdd(false)} className="btn btn-ghost btn-icon btn-sm"><X size={14} /></button>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Date</label>
              <input type="date" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>% Complete</label>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <input
                    type="range" min={0} max={100} step={5}
                    value={newPercent}
                    className="flex-1 accent-[#3B5EE8]"
                    onChange={e => setNewPercent(Number(e.target.value))}
                  />
                  <span className="text-sm font-bold w-10 text-right">{newPercent}%</span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Remaining Days</label>
              <input type="number" placeholder="0" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Notes</label>
            <textarea rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary btn-sm" onClick={() => { setShowAdd(false); toast.success("Progress update saved"); }}>
              <Save size={14} /> Save Update
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-3">
        {SEED_PROGRESS.map((p, i) => (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex gap-3 items-start">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: i === 0 ? "var(--primary)" : "#94A3B8" }}>
              {getInitials(p.updated_by)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <span className="font-semibold text-sm">{p.updated_by}</span>
                <span className="font-bold text-sm" style={{ color: "var(--primary)" }}>{p.percent_complete}% complete</span>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{p.remaining_days} days remaining</span>
                <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>{formatDate(p.date)}</span>
              </div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{p.notes}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Audit ───────────────────────────────────────────────────────────────

function AuditTab() {
  return (
    <div className="p-6 space-y-4">
      <h3 className="font-semibold text-sm">Audit Log</h3>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {SEED_AUDIT.map(e => (
              <tr key={e.id}>
                <td className="font-mono text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>{formatDateTime(e.timestamp)}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                      style={{ background: "var(--primary)" }}>
                      {getInitials(e.user)}
                    </div>
                    <span className="text-sm">{e.user}</span>
                  </div>
                </td>
                <td className="font-medium text-sm">{e.action}</td>
                <td className="text-sm max-w-[280px]" style={{ color: "var(--text-secondary)" }}>
                  <span className="line-clamp-2">{e.detail}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ScheduleItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const scheduleItemId = (params.scheduleItemId ?? params.id) as string;

  const [tab, setTab] = useState<Tab>("details");
  const [item, setItem] = useState<ScheduleItem>(SEED_ITEM);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data } = await supabase.from("schedule_items").select("*").eq("id", scheduleItemId).single();
        if (data) setItem(data as ScheduleItem);
      } catch {
        // use seed
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [scheduleItemId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="skeleton h-28 rounded-2xl" />
        <div className="skeleton h-12 rounded-xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3 min-w-0">
          <button className="btn btn-ghost btn-sm btn-icon flex-shrink-0" onClick={() => router.back()}>
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md"
                style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                {item.wbs_code}
              </span>
              <span className={cn("badge", TYPE_CHIP[item.type])}>{item.type}</span>
              <span className={cn("badge", STATUS_CHIP[item.status])}>{item.status}</span>
              {item.is_critical && (
                <span className="badge chip-danger flex items-center gap-1">
                  <AlertTriangle size={10} /> Critical Path
                </span>
              )}
            </div>
            <h1 className="text-lg font-bold truncate" style={{ color: "var(--text-primary)" }}>{item.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
          <button className="btn btn-secondary btn-sm" onClick={() => toast.info("Open edit form")}><Edit2 size={14} /> Edit</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setTab("delays")}><Link2 size={14} /> Link to CE</button>
          <button className="btn btn-secondary btn-sm" onClick={() => toast.success("Marked complete")}><CheckCircle2 size={14} /> Mark Complete</button>
          {showDelete ? (
            <div className="flex items-center gap-1">
              <button className="btn btn-sm" style={{ background: "var(--danger)", color: "#fff" }} onClick={() => toast.error("Deleted")}>
                Confirm Delete
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowDelete(false)}>Cancel</button>
            </div>
          ) : (
            <button className="btn btn-secondary btn-sm text-[var(--danger)]" onClick={() => setShowDelete(true)}>
              <Trash2 size={14} /> Delete
            </button>
          )}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="px-6 py-3">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Duration",      value: `${item.duration_days} days` },
            { label: "Float",         value: `${item.float_days} days`, danger: item.float_days === 0 },
            { label: "Progress",      value: `${item.progress_percent}%` },
            { label: "Status",        value: item.status },
            { label: "Critical Path", value: item.is_critical ? "Yes — Critical" : "No", danger: item.is_critical },
          ].map(({ label, value, danger }) => (
            <div key={label} className={cn("bg-white rounded-2xl border shadow-sm p-3", danger ? "border-red-200" : "border-gray-200")}>
              <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</p>
              <p className={cn("font-semibold text-sm mt-0.5 truncate", danger && "text-[var(--danger)]")} style={danger ? {} : { color: "var(--text-primary)" }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar px-6 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            className={cn("tab-item flex-shrink-0", tab === t.id && "active")}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="flex-1"
        >
          {tab === "details"      && <DetailsTab item={item} />}
          {tab === "dependencies" && <DependenciesTab item={item} />}
          {tab === "resources"    && <ResourcesTab />}
          {tab === "delays"       && <DelayEventsTab />}
          {tab === "progress"     && <ProgressTab item={item} />}
          {tab === "audit"        && <AuditTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

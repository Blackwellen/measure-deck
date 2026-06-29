"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Building2, Box, Link2,
  Download, Eye, Archive, ExternalLink, Play, Pause,
  Layers, RotateCcw, MousePointer2,
} from "lucide-react";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";
import BimViewer, { buildElements, type BimElement, type ViewerMode } from "@/components/bim/bim-canvas";

// ─── Types ────────────────────────────────────────────────────────────────────

type ModelType = "IFC" | "Revit" | "NavisWorks" | "Other";
type ModelStatus = "processing" | "ready" | "error";
type Discipline = "Architectural" | "Structural" | "MEP" | "Civil" | "All Disciplines";
type TabId = "info" | "preview" | "drawings" | "4d-schedule" | "5d-cost";

interface BimModel {
  id: string;
  project_id: string | null;
  project: string;
  name: string;
  model_type: ModelType;
  discipline: Discipline;
  file_size: number;
  status: ModelStatus;
  metadata?: Record<string, unknown>;
  created_at: string;
}

interface LinkedDrawing {
  id: string;
  drawing_no: string;
  title: string;
  discipline: string;
  revision: string;
  status: string;
}

interface ScheduleItem {
  id: string;
  activity: string;
  wbs: string;
  start_date: string;
  end_date: string;
  bim_element_id: string;
}

// ─── Static fallback data ─────────────────────────────────────────────────────

const FALLBACK_MODEL: BimModel = {
  id: "bim-001",
  project_id: "proj-001",
  project: "Eastside Residential Block A",
  name: "Eastside-Block-A-Arch-P4.ifc",
  model_type: "IFC",
  discipline: "Architectural",
  file_size: 84_300_000,
  status: "ready",
  metadata: {
    author: "James Thornton",
    software: "Archicad 26",
    elements: 18420,
    coordinates: "OSGB36",
    ifc_schema: "IFC4",
  },
  created_at: "2026-05-20T10:00:00Z",
};

const FALLBACK_DRAWINGS: LinkedDrawing[] = [
  { id: "d1", drawing_no: "A-001", title: "Ground Floor Plan", discipline: "Architectural", revision: "P4", status: "Current" },
  { id: "d2", drawing_no: "A-002", title: "First Floor Plan", discipline: "Architectural", revision: "P3", status: "Issued for Construction" },
  { id: "d3", drawing_no: "S-001", title: "Structural Frame Layout", discipline: "Structural", revision: "C2", status: "Under Review" },
];

const FALLBACK_SCHEDULE: ScheduleItem[] = [
  { id: "si-001", activity: "Substructure Works", wbs: "1.1", start_date: "2026-03-01", end_date: "2026-04-30", bim_element_id: "IFC-GRP-001" },
  { id: "si-002", activity: "Ground Floor Slab", wbs: "1.2", start_date: "2026-04-15", end_date: "2026-05-15", bim_element_id: "IFC-SLB-001" },
  { id: "si-003", activity: "Level 1 Frame", wbs: "2.1", start_date: "2026-05-01", end_date: "2026-06-30", bim_element_id: "IFC-COL-L1" },
  { id: "si-004", activity: "Level 1 External Walls", wbs: "2.2", start_date: "2026-06-01", end_date: "2026-07-31", bim_element_id: "IFC-WALL-EXT-L1" },
  { id: "si-005", activity: "MEP First Fix", wbs: "3.1", start_date: "2026-07-01", end_date: "2026-09-30", bim_element_id: "IFC-MEP-FF-L1" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MODEL_TYPE_META: Record<ModelType, { label: string; color: string; bg: string }> = {
  IFC:        { label: "IFC",        color: "#0EA5E9", bg: "#E0F2FE" },
  Revit:      { label: "Revit",      color: "#8B5CF6", bg: "#EDE9FE" },
  NavisWorks: { label: "NavisWorks", color: "#F59E0B", bg: "#FEF3C7" },
  Other:      { label: "Other",      color: "#64748B", bg: "#F1F5F9" },
};

const STATUS_META: Record<ModelStatus, { chip: string; label: string }> = {
  processing: { chip: "chip-warning", label: "Processing" },
  ready:      { chip: "chip-success", label: "Ready" },
  error:      { chip: "chip-danger",  label: "Error" },
};

function fmtBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

const TABS: { id: TabId; label: string }[] = [
  { id: "info",         label: "Model Info" },
  { id: "preview",      label: "3D Preview" },
  { id: "drawings",     label: "Linked Drawings" },
  { id: "4d-schedule",  label: "4D Schedule" },
  { id: "5d-cost",      label: "5D Cost" },
];

// ─── Tab content components ───────────────────────────────────────────────────

function ModelInfoTab({ model }: { model: BimModel }) {
  const typeMeta = MODEL_TYPE_META[model.model_type];
  const statusMeta = STATUS_META[model.status];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Details */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        <div className="card p-5">
          <h3 className="font-semibold text-sm mb-4" style={{ color: "var(--text-primary)" }}>Model Details</h3>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <dt className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Model Name</dt>
              <dd className="font-medium truncate" style={{ color: "var(--text-primary)" }}>{model.name}</dd>
            </div>
            <div>
              <dt className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Type</dt>
              <dd>
                <span
                  className="px-2 py-0.5 rounded-md text-xs font-bold"
                  style={{ background: typeMeta.bg, color: typeMeta.color }}
                >
                  {typeMeta.label}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Discipline</dt>
              <dd className="font-medium" style={{ color: "var(--text-primary)" }}>{model.discipline}</dd>
            </div>
            <div>
              <dt className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Status</dt>
              <dd><span className={cn("badge", statusMeta.chip)}>{statusMeta.label}</span></dd>
            </div>
            <div>
              <dt className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>File Size</dt>
              <dd className="font-medium" style={{ color: "var(--text-primary)" }}>{fmtBytes(model.file_size)}</dd>
            </div>
            <div>
              <dt className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Uploaded</dt>
              <dd className="font-medium" style={{ color: "var(--text-primary)" }}>{formatDate(model.created_at)}</dd>
            </div>
            <div className="col-span-2">
              <dt className="text-xs mb-0.5" style={{ color: "var(--text-muted)" }}>Linked Project</dt>
              <dd>
                <button
                  className="text-sm font-medium flex items-center gap-1 hover:underline"
                  style={{ color: "var(--primary)" }}
                  onClick={() => model.project_id && window.open(`/app/projects/${model.project_id}`, "_blank")}
                >
                  {model.project}
                  <ExternalLink size={11} />
                </button>
              </dd>
            </div>
          </dl>
        </div>

        {/* Metadata JSON viewer */}
        {model.metadata && Object.keys(model.metadata).length > 0 && (
          <div className="card p-5">
            <h3 className="font-semibold text-sm mb-3" style={{ color: "var(--text-primary)" }}>Model Metadata</h3>
            <div
              className="rounded-lg p-4 text-xs font-mono overflow-x-auto"
              style={{ background: "var(--bg-muted)", color: "var(--text-secondary)" }}
            >
              {Object.entries(model.metadata).map(([key, value]) => (
                <div key={key} className="flex gap-3 py-0.5">
                  <span className="flex-shrink-0" style={{ color: "var(--primary)" }}>{key}:</span>
                  <span>{String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions sidebar */}
      <div className="flex flex-col gap-3">
        <div className="card p-4 flex flex-col gap-2">
          <h3 className="font-semibold text-xs uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>Actions</h3>
          <button className="btn btn-primary w-full justify-start"><Eye size={14} />View 3D Preview</button>
          <button className="btn btn-secondary w-full justify-start"><Download size={14} />Download Model</button>
          <button className="btn btn-secondary w-full justify-start"><Link2 size={14} />Link Drawing</button>
          <div className="border-t my-1" style={{ borderColor: "var(--border)" }} />
          <button className="btn btn-secondary w-full justify-start text-[var(--danger)]" onClick={() => toast.success("Model archived")}>
            <Archive size={14} />Archive Model
          </button>
        </div>

        <div
          className="card p-4 text-xs"
          style={{ background: "linear-gradient(135deg, #0e7490 0%, #1d4ed8 100%)", border: "none" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Box size={16} className="text-white" />
            <span className="font-semibold text-white">Federated Model</span>
          </div>
          <p className="text-white/80 leading-relaxed">
            Open the <strong>3D Preview</strong> to inspect elements interactively, the
            <strong> 4D Schedule</strong> to simulate the construction sequence, and
            <strong> 5D Cost</strong> to visualise budget variance across the model.
          </p>
        </div>
      </div>
    </div>
  );
}

const DISCIPLINE_SWATCH: { d: BimElement["discipline"]; label: string; color: string }[] = [
  { d: "structural",    label: "Structural", color: "#64748b" },
  { d: "architectural", label: "Architectural", color: "#3b82f6" },
  { d: "mep",           label: "MEP", color: "#f59e0b" },
];

function PreviewTab({ model, elements }: { model: BimModel; elements: BimElement[] }) {
  const [mode, setMode] = useState<ViewerMode>("model");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = elements.find((e) => e.id === selectedId) ?? null;

  return (
    <div className="flex flex-col gap-4">
      {/* Viewer toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-[var(--bg-muted)] rounded-[var(--radius)] p-1">
          {([
            { m: "model", label: "Solid", Icon: Box },
            { m: "discipline", label: "By Discipline", Icon: Layers },
          ] as { m: ViewerMode; label: string; Icon: React.ElementType }[]).map(({ m, label, Icon }) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all",
                mode === m ? "bg-white shadow-sm text-[var(--text-primary)]" : "text-[var(--text-muted)]"
              )}
            >
              <Icon size={13} />{label}
            </button>
          ))}
        </div>
        <span className="text-xs flex items-center gap-1.5 ml-1" style={{ color: "var(--text-muted)" }}>
          <MousePointer2 size={12} />Click an element to inspect · drag to orbit · scroll to zoom
        </span>
        <button className="btn btn-secondary btn-sm ml-auto" onClick={() => setSelectedId(null)}>
          <RotateCcw size={13} />Reset selection
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* 3D viewer */}
        <div className="lg:col-span-3 card overflow-hidden p-0">
          <BimViewer elements={elements} mode={mode} selectedId={selectedId} onSelect={setSelectedId} height={500} />
        </div>

        {/* Inspector */}
        <div className="flex flex-col gap-3">
          {/* Legend */}
          <div className="card p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Disciplines</h4>
            <div className="flex flex-col gap-1.5">
              {DISCIPLINE_SWATCH.map((s) => (
                <div key={s.d} className="flex items-center gap-2 text-sm">
                  <span className="w-3 h-3 rounded" style={{ background: s.color }} />
                  <span style={{ color: "var(--text-secondary)" }}>{s.label}</span>
                  <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>
                    {elements.filter((e) => e.discipline === s.d).length}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Selected element */}
          <div className="card p-4 flex-1">
            <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>Element Inspector</h4>
            {selected ? (
              <dl className="flex flex-col gap-2 text-sm">
                <div>
                  <dt className="text-xs" style={{ color: "var(--text-muted)" }}>Element</dt>
                  <dd className="font-semibold" style={{ color: "var(--text-primary)" }}>{selected.label}</dd>
                </div>
                <div className="flex gap-6">
                  <div>
                    <dt className="text-xs" style={{ color: "var(--text-muted)" }}>ID</dt>
                    <dd className="font-mono text-xs" style={{ color: "var(--primary)" }}>{selected.id}</dd>
                  </div>
                  <div>
                    <dt className="text-xs" style={{ color: "var(--text-muted)" }}>Level</dt>
                    <dd className="font-medium" style={{ color: "var(--text-primary)" }}>{selected.floor}</dd>
                  </div>
                </div>
                <div>
                  <dt className="text-xs" style={{ color: "var(--text-muted)" }}>Discipline</dt>
                  <dd className="font-medium capitalize" style={{ color: "var(--text-primary)" }}>{selected.discipline}</dd>
                </div>
                <div className="border-t pt-2 mt-1" style={{ borderColor: "var(--border)" }}>
                  <dt className="text-xs" style={{ color: "var(--text-muted)" }}>Budget / Actual</dt>
                  <dd className="font-medium" style={{ color: "var(--text-primary)" }}>
                    {formatCurrency(selected.budget)} / {selected.actual > 0 ? formatCurrency(selected.actual) : "—"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Select an element in the model to view its properties, level and cost mapping.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Model summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Elements", value: elements.length.toLocaleString() },
          { label: "Discipline", value: model.discipline },
          { label: "File Size", value: fmtBytes(model.file_size) },
          { label: "IFC Schema", value: String(model.metadata?.ifc_schema ?? "IFC4") },
        ].map(({ label, value }) => (
          <div key={label} className="kpi-card">
            <div className="kpi-label">{label}</div>
            <div className="kpi-value text-base">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LinkedDrawingsTab({ drawings, onLinkNew }: { drawings: LinkedDrawing[]; onLinkNew: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {drawings.length} drawing{drawings.length !== 1 ? "s" : ""} linked to this model
        </p>
        <button className="btn btn-primary btn-sm" onClick={onLinkNew}>
          <Link2 size={13} />Link Drawing
        </button>
      </div>

      {drawings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Link2 size={32} style={{ color: "var(--text-muted)" }} />
          <p className="font-semibold" style={{ color: "var(--text-primary)" }}>No linked drawings</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>Link drawings from the register to associate them with this BIM model</p>
          <button className="btn btn-primary btn-sm" onClick={onLinkNew}><Link2 size={13} />Link Drawing</button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Drawing No.</th>
                  <th>Title</th>
                  <th>Discipline</th>
                  <th>Revision</th>
                  <th>Status</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {drawings.map(d => (
                  <tr key={d.id} className="cursor-pointer">
                    <td className="font-mono text-xs font-semibold" style={{ color: "var(--primary)" }}>{d.drawing_no}</td>
                    <td className="font-medium">{d.title}</td>
                    <td className="text-sm" style={{ color: "var(--text-secondary)" }}>{d.discipline}</td>
                    <td><span className="badge chip-info">{d.revision}</span></td>
                    <td><span className="badge chip-success">{d.status}</span></td>
                    <td>
                      <button className="btn btn-ghost btn-icon btn-sm"><Eye size={13} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ScheduleTab({ items, elements }: { items: ScheduleItem[]; elements: BimElement[] }) {
  const [progress, setProgress] = useState(0.55);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const t = setInterval(() => {
      setProgress((p) => {
        if (p >= 1) { setPlaying(false); return 1; }
        return Math.min(1, p + 0.01);
      });
    }, 60);
    return () => clearInterval(t);
  }, [playing]);

  /* Derive a simulated date from progress across the programme span. */
  const programmeStart = new Date("2026-03-01").getTime();
  const programmeEnd = new Date("2026-12-31").getTime();
  const simDate = new Date(programmeStart + (programmeEnd - programmeStart) * progress);
  const builtCount = Math.round(progress * elements.length);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          4D construction sequence · {builtCount} of {elements.length} elements built
        </p>
        <button className="btn btn-primary btn-sm"><Link2 size={13} />Link Activity</button>
      </div>

      {/* 4D viewer */}
      <div className="card overflow-hidden p-0">
        <BimViewer elements={elements} mode="4d" progress={progress} height={440} />
      </div>

      {/* Timeline control */}
      <div className="card p-4 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <button
            className="btn btn-primary btn-icon"
            onClick={() => { if (progress >= 1) setProgress(0); setPlaying((p) => !p); }}
            aria-label={playing ? "Pause" : "Play"}
          >
            {playing ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <div className="flex-1">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={progress}
              onChange={(e) => { setPlaying(false); setProgress(parseFloat(e.target.value)); }}
              className="w-full accent-[var(--primary)]"
            />
          </div>
          <div className="text-right flex-shrink-0" style={{ minWidth: 110 }}>
            <p className="text-sm font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
              {simDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{Math.round(progress * 100)}% complete</p>
          </div>
        </div>
      </div>

      {/* Linked activities */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Activity</th>
                <th>WBS</th>
                <th>Start</th>
                <th>End</th>
                <th>BIM Element ID</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => {
                const itemStart = new Date(item.start_date).getTime();
                const built = simDate.getTime() >= new Date(item.end_date).getTime();
                const active = !built && simDate.getTime() >= itemStart;
                return (
                  <tr key={item.id}>
                    <td className="font-medium">{item.activity}</td>
                    <td className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{item.wbs}</td>
                    <td className="text-sm" style={{ color: "var(--text-secondary)" }}>{formatDate(item.start_date)}</td>
                    <td className="text-sm" style={{ color: "var(--text-secondary)" }}>{formatDate(item.end_date)}</td>
                    <td className="font-mono text-xs" style={{ color: "var(--primary)" }}>{item.bim_element_id}</td>
                    <td>
                      <span className={cn("badge", built ? "chip-success" : active ? "chip-warning" : "chip-muted")}>
                        {built ? "Complete" : active ? "In Progress" : "Not Started"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CostTab({ elements }: { elements: BimElement[] }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const totalBudget = elements.reduce((s, e) => s + e.budget, 0);
  const totalActual = elements.reduce((s, e) => s + e.actual, 0);
  const variance = totalActual - totalBudget;

  return (
    <div className="flex flex-col gap-4">
      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="kpi-card">
          <div className="kpi-label">Total Budget</div>
          <div className="kpi-value">{formatCurrency(totalBudget)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Actual to Date</div>
          <div className="kpi-value">{formatCurrency(totalActual)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Variance</div>
          <div className={cn("kpi-value", variance > 0 ? "text-[var(--danger)]" : "text-[var(--success)]")}>
            {formatCurrency(Math.abs(variance))} {variance > 0 ? "over" : "under"}
          </div>
        </div>
      </div>

      {/* 5D cost-coloured model */}
      <div className="card overflow-hidden p-0 relative">
        <BimViewer elements={elements} mode="5d" selectedId={selectedId} onSelect={setSelectedId} height={400} />
        {/* Legend overlay */}
        <div className="absolute bottom-3 left-3 bg-white/95 rounded-lg px-3 py-2 shadow-md flex flex-col gap-1 text-xs">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded" style={{ background: "#10b981" }} />Under / on budget</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded" style={{ background: "#ef4444" }} />Over budget</div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded" style={{ background: "#cbd5e1" }} />Not started</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{elements.length} BIM elements mapped to cost codes</p>
        <button className="btn btn-primary btn-sm"><Link2 size={13} />Map Element</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>BIM Element</th>
                <th>Element ID</th>
                <th className="text-right">Budget</th>
                <th className="text-right">Actual</th>
                <th className="text-right">Variance</th>
              </tr>
            </thead>
            <tbody>
              {elements.map(el => {
                const v = el.actual - el.budget;
                return (
                  <tr
                    key={el.id}
                    className={cn("cursor-pointer", selectedId === el.id && "bg-[var(--bg-subtle)]")}
                    onClick={() => setSelectedId(el.id)}
                  >
                    <td className="font-medium">{el.label}</td>
                    <td className="font-mono text-xs" style={{ color: "var(--primary)" }}>{el.id}</td>
                    <td className="text-right tabular-nums">{formatCurrency(el.budget)}</td>
                    <td className="text-right tabular-nums">
                      {el.actual > 0 ? formatCurrency(el.actual) : <span style={{ color: "var(--text-muted)" }}>—</span>}
                    </td>
                    <td className={cn("text-right tabular-nums font-semibold", v > 0 ? "text-[var(--danger)]" : v < 0 ? "text-[var(--success)]" : "text-[var(--text-muted)]")}>
                      {el.actual > 0 ? (v >= 0 ? "+" : "") + formatCurrency(v) : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BimModelDetailPage() {
  const params = useParams<{ modelId: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("info");
  const [model, setModel] = useState<BimModel>(FALLBACK_MODEL);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data } = await supabase
          .from("bim_models")
          .select("*")
          .eq("id", params.modelId)
          .single();
        if (data) setModel(data as BimModel);
      } catch {
        // use fallback
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.modelId]);

  const typeMeta = MODEL_TYPE_META[model.model_type];
  const statusMeta = STATUS_META[model.status];
  const viewerElements = useMemo(() => buildElements(), []);

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="page-header">
          <div className="skeleton h-6 w-48 rounded" />
        </div>
        <div className="page-content pt-6">
          <div className="skeleton h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3 min-w-0">
          <button
            className="btn btn-ghost btn-icon btn-sm flex-shrink-0"
            onClick={() => router.back()}
          >
            <ArrowLeft size={16} />
          </button>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)" }}
          >
            <Building2 size={18} className="text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold truncate" style={{ color: "var(--text-primary)" }}>
                {model.name}
              </h1>
              <span
                className="px-2 py-0.5 rounded-md text-[10px] font-bold flex-shrink-0"
                style={{ background: typeMeta.bg, color: typeMeta.color }}
              >
                {typeMeta.label}
              </span>
              <span className={cn("badge flex-shrink-0", statusMeta.chip)}>{statusMeta.label}</span>
            </div>
            <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
              {model.project} · {model.discipline} · {fmtBytes(model.file_size)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="btn btn-secondary btn-sm"><Download size={14} />Download</button>
          <button className="btn btn-primary btn-sm" onClick={() => setTab("preview")}><Eye size={14} />3D Preview</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                tab === t.id
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="page-content flex-1 pt-5">
        {tab === "info" && <ModelInfoTab model={model} />}
        {tab === "preview" && <PreviewTab model={model} elements={viewerElements} />}
        {tab === "drawings" && (
          <LinkedDrawingsTab
            drawings={FALLBACK_DRAWINGS}
            onLinkNew={() => toast.success("Drawing linked to model")}
          />
        )}
        {tab === "4d-schedule" && <ScheduleTab items={FALLBACK_SCHEDULE} elements={viewerElements} />}
        {tab === "5d-cost" && <CostTab elements={viewerElements} />}
      </div>
    </div>
  );
}

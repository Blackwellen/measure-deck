"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Building2, Box, Link2,
  Download, MoreHorizontal, Eye, Archive,
  Clock, DollarSign, ExternalLink,
} from "lucide-react";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
import { createBrowserClient } from "@supabase/ssr";
import { getFlag } from "@/lib/feature-flags";
import { toast } from "sonner";

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

interface CostElement {
  id: string;
  bim_element: string;
  cost_code: string;
  budget: number;
  actual: number;
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

const FALLBACK_COST: CostElement[] = [
  { id: "ce-001", bim_element: "Substructure / Foundations", cost_code: "CC-100", budget: 380000, actual: 364200 },
  { id: "ce-002", bim_element: "Ground Floor Slab", cost_code: "CC-120", budget: 145000, actual: 147500 },
  { id: "ce-003", bim_element: "Structural Frame — Level 1", cost_code: "CC-210", budget: 295000, actual: 281300 },
  { id: "ce-004", bim_element: "External Walls — Level 1", cost_code: "CC-310", budget: 420000, actual: 0 },
  { id: "ce-005", bim_element: "MEP First Fix — Level 1", cost_code: "CC-420", budget: 185000, actual: 0 },
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
                  onClick={() => model.project_id && window.open(`/projects/${model.project_id}`, "_blank")}
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
            <span className="font-semibold text-white">BIM V1.5</span>
          </div>
          <p className="text-white/80 leading-relaxed">
            4D Schedule linking and 5D Cost mapping are available in the tabs above.
            Full 3D viewer launches from the Preview tab.
          </p>
        </div>
      </div>
    </div>
  );
}

function PreviewTab({ model }: { model: BimModel }) {
  return (
    <div className="flex flex-col gap-6">
      {/* 3D viewer placeholder */}
      <div
        className="rounded-2xl overflow-hidden relative"
        style={{
          background: "linear-gradient(135deg, #0e7490 0%, #1d4ed8 50%, #4f46e5 100%)",
          height: 420,
        }}
      >
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white">
          <div className="relative">
            <Building2 size={64} className="opacity-60" />
            <div
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
              style={{ background: "#F59E0B" }}
            >
              1.5
            </div>
          </div>
          <div className="text-center max-w-sm px-4">
            <h3 className="text-xl font-bold mb-2">3D Viewer Coming in V1.5 Full Release</h3>
            <p className="text-white/70 text-sm">
              Interactive WebGL-based 3D viewer for IFC, Revit and NavisWorks models.
              Includes element selection, clash detection and 4D animation.
            </p>
          </div>
          <div className="flex items-center gap-3 mt-2">
            <button className="btn btn-sm bg-white/20 hover:bg-white/30 text-white border-0">
              <Clock size={13} />Coming Soon
            </button>
            <button
              className="btn btn-sm bg-white/10 hover:bg-white/20 text-white border-white/20"
              onClick={() => toast.info("Register interest for early 3D viewer access")}
            >
              Register Interest
            </button>
          </div>
        </div>
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Model summary below viewer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Model Type", value: model.model_type },
          { label: "Discipline", value: model.discipline },
          { label: "File Size", value: fmtBytes(model.file_size) },
          { label: "Status", value: STATUS_META[model.status].label },
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

function ScheduleTab({ items }: { items: ScheduleItem[] }) {
  const bimEnabled = getFlag("v1_5_bim");

  if (!bimEnabled) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)" }}
        >
          <Clock size={24} className="text-white" />
        </div>
        <div className="max-w-xs">
          <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>4D Schedule — V1.5 Feature</h3>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Link BIM elements to programme activities for 4D construction simulation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {items.length} schedule activities linked to BIM elements
        </p>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => toast.info("4D simulation viewer launching in V1.5 full release")}
          >
            <Eye size={13} />4D Simulation
          </button>
          <button className="btn btn-primary btn-sm">
            <Link2 size={13} />Link Activity
          </button>
        </div>
      </div>

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
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id}>
                  <td className="font-medium">{item.activity}</td>
                  <td className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{item.wbs}</td>
                  <td className="text-sm" style={{ color: "var(--text-secondary)" }}>{formatDate(item.start_date)}</td>
                  <td className="text-sm" style={{ color: "var(--text-secondary)" }}>{formatDate(item.end_date)}</td>
                  <td className="font-mono text-xs" style={{ color: "var(--primary)" }}>{item.bim_element_id}</td>
                  <td>
                    <button className="btn btn-ghost btn-icon btn-sm"><MoreHorizontal size={13} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CostTab({ elements }: { elements: CostElement[] }) {
  const bimEnabled = getFlag("v1_5_bim");

  if (!bimEnabled) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
        >
          <DollarSign size={24} className="text-white" />
        </div>
        <div className="max-w-xs">
          <h3 className="font-bold" style={{ color: "var(--text-primary)" }}>5D Cost Mapping — V1.5 Feature</h3>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Map BIM elements to cost codes and track budget vs actual at element level.
          </p>
        </div>
      </div>
    );
  }

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

      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{elements.length} BIM elements mapped</p>
        <button className="btn btn-primary btn-sm"><Link2 size={13} />Map Element</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>BIM Element</th>
                <th>Cost Code</th>
                <th className="text-right">Budget</th>
                <th className="text-right">Actual</th>
                <th className="text-right">Variance</th>
              </tr>
            </thead>
            <tbody>
              {elements.map(el => {
                const v = el.actual - el.budget;
                return (
                  <tr key={el.id}>
                    <td className="font-medium">{el.bim_element}</td>
                    <td className="font-mono text-xs" style={{ color: "var(--primary)" }}>{el.cost_code}</td>
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
          <button className="btn btn-primary btn-sm"><Eye size={14} />3D Preview</button>
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
        {tab === "preview" && <PreviewTab model={model} />}
        {tab === "drawings" && (
          <LinkedDrawingsTab
            drawings={FALLBACK_DRAWINGS}
            onLinkNew={() => toast.info("Drawing linking UI coming in next sprint")}
          />
        )}
        {tab === "4d-schedule" && <ScheduleTab items={FALLBACK_SCHEDULE} />}
        {tab === "5d-cost" && <CostTab elements={FALLBACK_COST} />}
      </div>
    </div>
  );
}

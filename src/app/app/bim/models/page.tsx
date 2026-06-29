"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Search, Filter, MoreHorizontal, Box,
  Download, Link2, Archive, Building2, AlertTriangle,
  HardDrive, Calendar, Eye, RefreshCw,
} from "lucide-react";
import { cn, formatRelative } from "@/lib/utils";
import { createBrowserClient } from "@supabase/ssr";
import { BimModelWizard } from "@/components/wizards/bim-model-wizard";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type ModelType = "IFC" | "Revit" | "NavisWorks" | "Other";
type ModelStatus = "processing" | "ready" | "error";
type Discipline = "Architectural" | "Structural" | "MEP" | "Civil" | "All Disciplines";

interface BimModel {
  id: string;
  workspace_id?: string;
  project_id: string | null;
  project: string;
  name: string;
  model_type: ModelType;
  discipline: Discipline;
  storage_path?: string;
  file_size: number;
  status: ModelStatus;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// ─── Static placeholder data ──────────────────────────────────────────────────

const PLACEHOLDER_MODELS: BimModel[] = [
  {
    id: "bim-001",
    project_id: "proj-001",
    project: "Eastside Residential Block A",
    name: "Eastside-Block-A-Arch-P4.ifc",
    model_type: "IFC",
    discipline: "Architectural",
    file_size: 84_300_000,
    status: "ready",
    created_at: "2026-05-20T10:00:00Z",
  },
  {
    id: "bim-002",
    project_id: "proj-001",
    project: "Eastside Residential Block A",
    name: "Eastside-Block-A-Structure-C2.rvt",
    model_type: "Revit",
    discipline: "Structural",
    file_size: 142_500_000,
    status: "ready",
    created_at: "2026-05-18T09:30:00Z",
  },
  {
    id: "bim-003",
    project_id: "proj-002",
    project: "Meridian Office Park Phase 2",
    name: "Meridian-Ph2-Coordination.nwd",
    model_type: "NavisWorks",
    discipline: "All Disciplines",
    file_size: 315_000_000,
    status: "ready",
    created_at: "2026-05-15T14:00:00Z",
  },
  {
    id: "bim-004",
    project_id: "proj-002",
    project: "Meridian Office Park Phase 2",
    name: "Meridian-MEP-Services-B1.ifc",
    model_type: "IFC",
    discipline: "MEP",
    file_size: 67_800_000,
    status: "processing",
    created_at: "2026-06-09T16:45:00Z",
  },
  {
    id: "bim-005",
    project_id: "proj-003",
    project: "Thornfield Commercial Hub",
    name: "Thornfield-Civil-A2.ifc",
    model_type: "IFC",
    discipline: "Civil",
    file_size: 29_100_000,
    status: "error",
    created_at: "2026-06-01T11:00:00Z",
  },
  {
    id: "bim-006",
    project_id: "proj-004",
    project: "Riverside Apartments",
    name: "Riverside-Arch-P2.rvt",
    model_type: "Revit",
    discipline: "Architectural",
    file_size: 98_400_000,
    status: "ready",
    created_at: "2026-05-28T08:00:00Z",
  },
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

const DISCIPLINES: (Discipline | "All")[] = [
  "All", "Architectural", "Structural", "MEP", "Civil", "All Disciplines",
];

function fmtBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

// ─── Model card ───────────────────────────────────────────────────────────────

function ModelCard({
  model,
  onView,
  onDownload,
  onLinkDrawing,
  onArchive,
}: {
  model: BimModel;
  onView: () => void;
  onDownload: () => void;
  onLinkDrawing: () => void;
  onArchive: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const typeMeta = MODEL_TYPE_META[model.model_type];
  const statusMeta = STATUS_META[model.status];

  return (
    <div className="card hover:shadow-md transition-shadow cursor-pointer group" onClick={onView}>
      {/* 3D preview placeholder */}
      <div
        className="rounded-t-xl h-36 flex items-center justify-center relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0e7490 0%, #1d4ed8 50%, #4f46e5 100%)",
        }}
      >
        {model.status === "processing" ? (
          <div className="flex flex-col items-center gap-2 text-white">
            <RefreshCw size={28} className="animate-spin opacity-80" />
            <span className="text-xs font-semibold opacity-80">Processing…</span>
          </div>
        ) : model.status === "error" ? (
          <div className="flex flex-col items-center gap-2 text-white">
            <AlertTriangle size={28} className="opacity-80" />
            <span className="text-xs font-semibold opacity-80">Processing Error</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-white">
            <Building2 size={36} className="opacity-80" />
            <span className="text-xs font-semibold opacity-60">Open to view 3D model</span>
          </div>
        )}
        {/* Type badge */}
        <div
          className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold"
          style={{ background: typeMeta.bg, color: typeMeta.color }}
        >
          {typeMeta.label}
        </div>
        {/* Actions overlay */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="btn btn-icon btn-sm bg-white/20 hover:bg-white/30 text-white border-0"
            onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-8 w-44 rounded-xl shadow-xl border py-1 z-50"
              style={{ background: "var(--bg-card)", borderColor: "var(--border)" }}
              onClick={e => e.stopPropagation()}
            >
              <button className="dropdown-item" onClick={() => { setMenuOpen(false); onView(); }}>
                <Eye size={13} />View Model
              </button>
              <button className="dropdown-item" onClick={() => { setMenuOpen(false); onDownload(); }}>
                <Download size={13} />Download
              </button>
              <button className="dropdown-item" onClick={() => { setMenuOpen(false); onLinkDrawing(); }}>
                <Link2 size={13} />Link Drawing
              </button>
              <div className="my-1 border-t" style={{ borderColor: "var(--border)" }} />
              <button className="dropdown-item text-[var(--danger)]" onClick={() => { setMenuOpen(false); onArchive(); }}>
                <Archive size={13} />Archive
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Card body */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-sm leading-snug truncate flex-1" style={{ color: "var(--text-primary)" }}>
            {model.name}
          </h3>
          <span className={cn("badge flex-shrink-0", statusMeta.chip)}>{statusMeta.label}</span>
        </div>

        <p className="text-xs truncate mb-3" style={{ color: "var(--text-muted)" }}>
          {model.project}
        </p>

        <div className="grid grid-cols-2 gap-y-1.5 text-xs">
          <div className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
            <Box size={11} />
            <span>{model.discipline}</span>
          </div>
          <div className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
            <HardDrive size={11} />
            <span>{fmtBytes(model.file_size)}</span>
          </div>
          <div className="col-span-2 flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
            <Calendar size={11} />
            <span>Uploaded {formatRelative(model.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onUpload }: { onUpload: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)" }}
      >
        <Building2 size={28} className="text-white" />
      </div>
      <div className="max-w-xs">
        <h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>No BIM Models Yet</h3>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Upload your first IFC, Revit or NavisWorks model to start linking BIM data to your commercial records.
        </p>
      </div>
      <button className="btn btn-primary btn-sm" onClick={onUpload}>
        <Plus size={14} />Upload First Model
      </button>
      <div className="flex items-center gap-4 text-xs mt-2" style={{ color: "var(--text-muted)" }}>
        <span>Supports IFC · Revit (.rvt) · NavisWorks (.nwd)</span>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function BimModelsPage() {
  const router = useRouter();

  const [models, setModels] = useState<BimModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState<Discipline | "All">("All");
  const [typeFilter, setTypeFilter] = useState<ModelType | "All">("All");
  const [statusFilter, setStatusFilter] = useState<ModelStatus | "All">("All");
  const [showWizard, setShowWizard] = useState(false);

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
          .order("created_at", { ascending: false });
        setModels(data && data.length > 0 ? (data as BimModel[]) : PLACEHOLDER_MODELS);
      } catch {
        setModels(PLACEHOLDER_MODELS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = models.filter(m => {
    const matchSearch = !search ||
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.project.toLowerCase().includes(search.toLowerCase());
    const matchDiscipline = disciplineFilter === "All" || m.discipline === disciplineFilter;
    const matchType = typeFilter === "All" || m.model_type === typeFilter;
    const matchStatus = statusFilter === "All" || m.status === statusFilter;
    return matchSearch && matchDiscipline && matchType && matchStatus;
  });

  const readyCount = models.filter(m => m.status === "ready").length;
  const processingCount = models.filter(m => m.status === "processing").length;
  const totalSize = models.reduce((s, m) => s + m.file_size, 0);

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>BIM Library</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {readyCount} models ready · {processingCount > 0 ? `${processingCount} processing · ` : ""}{fmtBytes(totalSize)} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary btn-sm"><Download size={14} />Export List</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowWizard(true)}>
            <Plus size={14} />Upload Model
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="px-6 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="kpi-card">
          <div className="kpi-label">Total Models</div>
          <div className="kpi-value">{models.length}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Ready</div>
          <div className="kpi-value text-[var(--success)]">{readyCount}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Processing</div>
          <div className="kpi-value text-[var(--warning)]">{processingCount}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Storage Used</div>
          <div className="kpi-value">{fmtBytes(totalSize)}</div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="px-6 pt-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            className="form-input h-8 text-sm pl-8 w-full"
            placeholder="Search models…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-input h-8 text-sm w-44"
          value={disciplineFilter}
          onChange={e => setDisciplineFilter(e.target.value as Discipline | "All")}
        >
          {DISCIPLINES.map(d => <option key={d} value={d}>{d === "All" ? "All Disciplines" : d}</option>)}
        </select>
        <select
          className="form-input h-8 text-sm w-36"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as ModelType | "All")}
        >
          <option value="All">All Types</option>
          <option value="IFC">IFC</option>
          <option value="Revit">Revit</option>
          <option value="NavisWorks">NavisWorks</option>
          <option value="Other">Other</option>
        </select>
        <select
          className="form-input h-8 text-sm w-36"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as ModelStatus | "All")}
        >
          <option value="All">All Statuses</option>
          <option value="ready">Ready</option>
          <option value="processing">Processing</option>
          <option value="error">Error</option>
        </select>
        <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
          <Filter size={12} />
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Content */}
      <div className="page-content flex-1 pt-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card overflow-hidden">
                <div className="skeleton h-36 rounded-none" />
                <div className="p-4 flex flex-col gap-2">
                  <div className="skeleton h-4 w-3/4 rounded" />
                  <div className="skeleton h-3 w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          models.length === 0
            ? <EmptyState onUpload={() => setShowWizard(true)} />
            : (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
                <Search size={32} style={{ color: "var(--text-muted)" }} />
                <p className="font-semibold" style={{ color: "var(--text-primary)" }}>No models match your filters</p>
                <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(""); setDisciplineFilter("All"); setTypeFilter("All"); setStatusFilter("All"); }}>
                  Clear Filters
                </button>
              </div>
            )
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(model => (
              <ModelCard
                key={model.id}
                model={model}
                onView={() => router.push(`/app/bim/${model.id}`)}
                onDownload={() => toast.info("Download will be available once model processing is complete")}
                onLinkDrawing={() => toast.info("Open the model detail to link drawings")}
                onArchive={() => toast.success(`${model.name} archived`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upload wizard */}
      {showWizard && (
        <BimModelWizard
          onClose={() => setShowWizard(false)}
          onSuccess={(_id: string) => {
            setShowWizard(false);
            // Reload
            setLoading(true);
            setTimeout(() => setLoading(false), 500);
          }}
        />
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Upload, Plus, Download, Eye, Link2, RefreshCw, Filter,
  FileText, Image, Box, Layers, AlertTriangle, ChevronDown,
  MoreHorizontal, Building2, Cpu, TreePine, GitBranch,
  Zap, Lock, Sparkles, X,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

type DrawingStatus = "Current" | "Superseded" | "Under Review" | "Issued for Construction";
type Discipline = "Architectural" | "Structural" | "MEP" | "Civil" | "Landscape" | "Coordination";
type FileType = "PDF" | "Image" | "DWG" | "IFC" | "glTF";
type ViewMode = "register" | "timeline" | "2d-viewer" | "bim-models";

// ─── Placeholder data ──────────────────────────────────────────────────────────

const DRAWINGS = [
  { id: "d1", drawingNo: "A-001", title: "Ground Floor Plan", revision: "P4", date: "2025-11-10", discipline: "Architectural" as Discipline, status: "Current" as DrawingStatus, fileType: "PDF" as FileType, project: "The Arc Tower, Birmingham", projectId: "p1" },
  { id: "d2", drawingNo: "A-002", title: "First Floor Plan", revision: "P3", date: "2025-10-28", discipline: "Architectural" as Discipline, status: "Issued for Construction" as DrawingStatus, fileType: "PDF" as FileType, project: "The Arc Tower, Birmingham", projectId: "p1" },
  { id: "d3", drawingNo: "S-001", title: "Structural Frame Layout", revision: "C2", date: "2025-11-15", discipline: "Structural" as Discipline, status: "Under Review" as DrawingStatus, fileType: "DWG" as FileType, project: "Granary Wharf Offices", projectId: "p2" },
  { id: "d4", drawingNo: "M-001", title: "MEP Services Route – L3", revision: "B1", date: "2025-09-30", discipline: "MEP" as Discipline, status: "Superseded" as DrawingStatus, fileType: "IFC" as FileType, project: "Granary Wharf Offices", projectId: "p2" },
  { id: "d5", drawingNo: "C-001", title: "Site Drainage Layout", revision: "A5", date: "2025-11-20", discipline: "Civil" as Discipline, status: "Current" as DrawingStatus, fileType: "DWG" as FileType, project: "Riverside Apartments Ph2", projectId: "p3" },
  { id: "d6", drawingNo: "L-001", title: "Soft Landscape Masterplan", revision: "A2", date: "2025-10-05", discipline: "Landscape" as Discipline, status: "Current" as DrawingStatus, fileType: "Image" as FileType, project: "Riverside Apartments Ph2", projectId: "p3" },
  { id: "d7", drawingNo: "CO-001", title: "BIM Coordination Model", revision: "C1", date: "2025-11-22", discipline: "Coordination" as Discipline, status: "Under Review" as DrawingStatus, fileType: "IFC" as FileType, project: "Station Square Retail", projectId: "p4" },
  { id: "d8", drawingNo: "S-002", title: "Foundation Detail Sections", revision: "P2", date: "2025-11-01", discipline: "Structural" as Discipline, status: "Issued for Construction" as DrawingStatus, fileType: "PDF" as FileType, project: "The Arc Tower, Birmingham", projectId: "p1" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_META: Record<DrawingStatus, { chip: string; label: string }> = {
  "Current":                  { chip: "chip-success", label: "Current" },
  "Superseded":               { chip: "chip-muted",   label: "Superseded" },
  "Under Review":             { chip: "chip-warning", label: "Under Review" },
  "Issued for Construction":  { chip: "chip-info",    label: "Issued for Construction" },
};

const DISCIPLINE_META: Record<Discipline, { icon: React.ReactNode; color: string }> = {
  Architectural:  { icon: <Building2 size={14} />, color: "var(--primary)" },
  Structural:     { icon: <Layers size={14} />,    color: "var(--warning)" },
  MEP:            { icon: <Zap size={14} />,        color: "var(--danger)" },
  Civil:          { icon: <GitBranch size={14} />,  color: "var(--success)" },
  Landscape:      { icon: <TreePine size={14} />,   color: "#22C55E" },
  Coordination:   { icon: <Cpu size={14} />,        color: "var(--cyan)" },
};

function FileTypeIcon({ type }: { type: FileType }) {
  const configs: Record<FileType, { icon: React.ReactNode; color: string; bg: string }> = {
    PDF:   { icon: <FileText size={14} />, color: "#DC2626", bg: "#FEF2F2" },
    Image: { icon: <Image size={14} />,   color: "#2563EB", bg: "#EFF6FF" },
    DWG:   { icon: <Box size={14} />,     color: "#EA580C", bg: "#FFF7ED" },
    IFC:   { icon: <Cpu size={14} />,     color: "var(--cyan)", bg: "var(--cyan-bg)" },
    glTF:  { icon: <Box size={14} />,     color: "var(--success)", bg: "var(--success-bg)" },
  };
  const c = configs[type];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold" style={{ background: c.bg, color: c.color }}>
      {c.icon} {type}
    </span>
  );
}

const VIEWS: { id: ViewMode; label: string }[] = [
  { id: "register",   label: "Drawing Register" },
  { id: "timeline",   label: "Revision Timeline" },
  { id: "2d-viewer",  label: "2D Viewer" },
  { id: "bim-models", label: "BIM Models" },
];

// ─── BIM Model Library ────────────────────────────────────────────────────────

const BIM_MODELS = [
  { id: "bim-001", name: "Eastside-Block-A-Arch-P4.ifc", discipline: "Architectural", type: "IFC", size: "84.3 MB", elements: 18420, status: "ready", project: "The Arc Tower, Birmingham" },
  { id: "bim-002", name: "Granary-Wharf-Struct-C2.ifc", discipline: "Structural", type: "IFC", size: "62.1 MB", elements: 11240, status: "ready", project: "Granary Wharf Offices" },
  { id: "bim-003", name: "Granary-Wharf-MEP-B1.rvt", discipline: "MEP", type: "Revit", size: "118.5 MB", elements: 24890, status: "ready", project: "Granary Wharf Offices" },
  { id: "bim-004", name: "Station-Square-Coord-C1.nwd", discipline: "Coordination", type: "NavisWorks", size: "203.7 MB", elements: 41030, status: "processing", project: "Station Square Retail" },
];

function BimModelList() {
  const router = useRouter();
  return (
    <div className="page-content">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {BIM_MODELS.map(m => (
          <div key={m.id} className="card overflow-hidden flex flex-col">
            {/* 3D thumbnail */}
            <div className="relative h-32 flex items-center justify-center" style={{ background: "linear-gradient(135deg,#0e7490 0%,#1d4ed8 100%)" }}>
              <Box size={40} className="text-white/80" />
              <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded bg-white/90" style={{ color: "var(--primary)" }}>{m.type}</span>
              <span className={cn("absolute bottom-2 left-2 badge", m.status === "ready" ? "chip-success" : "chip-warning")}>{m.status === "ready" ? "Ready" : "Processing"}</span>
            </div>
            <div className="p-4 flex flex-col gap-2 flex-1">
              <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>{m.name}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{m.project}</p>
              <div className="grid grid-cols-2 gap-y-1 text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                <span className="flex items-center gap-1.5"><Layers size={12} />{m.discipline}</span>
                <span className="flex items-center gap-1.5"><Cpu size={12} />{m.elements.toLocaleString()} els</span>
                <span className="flex items-center gap-1.5"><FileText size={12} />{m.size}</span>
              </div>
              <button
                onClick={() => router.push(`/app/bim/${m.id}`)}
                disabled={m.status !== "ready"}
                className="btn btn-primary btn-sm w-full mt-2 disabled:opacity-50"
              >
                <Eye size={14} />Open 3D · 4D · 5D
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Revision Timeline ────────────────────────────────────────────────────────

function RevisionTimeline() {
  const grouped = DRAWINGS.reduce<Record<string, typeof DRAWINGS>>((acc, d) => {
    acc[d.drawingNo] = acc[d.drawingNo] || [];
    acc[d.drawingNo].push(d);
    return acc;
  }, {});

  return (
    <div className="page-content space-y-4">
      {Object.entries(grouped).map(([no, drawings]) => (
        <div key={no} className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>{no}</span>
            <span className="font-semibold text-sm">{drawings[0].title}</span>
          </div>
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {drawings.map((d, i) => (
              <div key={d.id} className="flex items-center gap-1">
                <div className="flex flex-col items-center min-w-[80px]">
                  <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2", i === drawings.length - 1 ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "bg-white border-[var(--border)] text-[var(--text-secondary)]")}>
                    {d.revision}
                  </div>
                  <span className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{formatDate(d.date)}</span>
                  <span className={cn("badge mt-1", STATUS_META[d.status].chip)}>{STATUS_META[d.status].label}</span>
                </div>
                {i < drawings.length - 1 && <div className="w-8 h-0.5 flex-shrink-0" style={{ background: "var(--border)" }} />}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 2D Viewer List ───────────────────────────────────────────────────────────

function ViewerList() {
  const router = useRouter();
  const viewable = DRAWINGS.filter(d => ["PDF", "Image"].includes(d.fileType));
  return (
    <div className="page-content">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {viewable.map(d => (
          <div key={d.id} className="card p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-mono text-xs font-bold mb-1" style={{ color: "var(--primary)" }}>{d.drawingNo} Rev {d.revision}</div>
                <div className="font-semibold text-sm">{d.title}</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{d.project}</div>
              </div>
              <FileTypeIcon type={d.fileType} />
            </div>
            <div className="h-24 rounded-lg flex items-center justify-center" style={{ background: "var(--bg-muted)" }}>
              <FileText size={32} style={{ color: "var(--text-disabled)" }} />
            </div>
            <button onClick={() => router.push(`/app/drawings/${d.id}/viewer`)} className="btn btn-secondary btn-sm w-full">
              <Eye size={14} /> Open Viewer
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Drawing Register ─────────────────────────────────────────────────────────

function DrawingRegister() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [disciplineFilter, setDisciplineFilter] = useState<Discipline | "All">("All");
  const [statusFilter, setStatusFilter] = useState<DrawingStatus | "All">("All");

  const filtered = DRAWINGS.filter(d => {
    const matchSearch = !search || d.drawingNo.toLowerCase().includes(search.toLowerCase()) || d.title.toLowerCase().includes(search.toLowerCase());
    const matchDisc = disciplineFilter === "All" || d.discipline === disciplineFilter;
    const matchStatus = statusFilter === "All" || d.status === statusFilter;
    return matchSearch && matchDisc && matchStatus;
  });

  return (
    <div className="page-content">
      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          className="form-input"
          style={{ maxWidth: 240 }}
          placeholder="Search drawings..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="form-input" style={{ maxWidth: 180 }} value={disciplineFilter} onChange={e => setDisciplineFilter(e.target.value as Discipline | "All")}>
          <option value="All">All Disciplines</option>
          {(["Architectural","Structural","MEP","Civil","Landscape","Coordination"] as Discipline[]).map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select className="form-input" style={{ maxWidth: 200 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value as DrawingStatus | "All")}>
          <option value="All">All Statuses</option>
          {(["Current","Superseded","Under Review","Issued for Construction"] as DrawingStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="ml-auto flex items-center gap-2">
          <button className="btn btn-ghost btn-sm"><Filter size={14} /> Filter</button>
          <button className="btn btn-secondary btn-sm"><Download size={14} /> Export Register</button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Drawing No</th>
                <th>Title</th>
                <th>Rev</th>
                <th>Date</th>
                <th>Discipline</th>
                <th>Status</th>
                <th>File Type</th>
                <th>Project</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state">
                      <div className="empty-icon"><FileText size={22} /></div>
                      <p className="font-medium">No drawings found</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map(d => {
                const disc = DISCIPLINE_META[d.discipline];
                return (
                  <tr key={d.id} className="cursor-pointer" onClick={() => router.push(`/app/drawings/${d.id}`)}>
                    <td><span className="font-mono text-xs font-bold" style={{ color: "var(--primary)" }}>{d.drawingNo}</span></td>
                    <td><span className="font-medium">{d.title}</span></td>
                    <td><span className="badge chip-muted font-mono">{d.revision}</span></td>
                    <td><span style={{ color: "var(--text-secondary)" }}>{formatDate(d.date)}</span></td>
                    <td>
                      <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: disc.color }}>
                        {disc.icon} {d.discipline}
                      </span>
                    </td>
                    <td><span className={cn("badge", STATUS_META[d.status].chip)}>{STATUS_META[d.status].label}</span></td>
                    <td onClick={e => e.stopPropagation()}><FileTypeIcon type={d.fileType} /></td>
                    <td><span className="text-xs" style={{ color: "var(--text-muted)" }}>{d.project}</span></td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <button onClick={() => router.push(`/app/drawings/${d.id}/viewer`)} className="btn btn-ghost btn-sm btn-icon" title="Open Viewer"><Eye size={14} /></button>
                        <button className="btn btn-ghost btn-sm btn-icon" title="Link"><Link2 size={14} /></button>
                        <button className="btn btn-ghost btn-sm btn-icon" title="More"><MoreHorizontal size={14} /></button>
                      </div>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DrawingsPage() {
  const [view, setView] = useState<ViewMode>("register");
  const [showUploadModal, setShowUploadModal] = useState(false);

  const currentView = VIEWS.find(v => v.id === view)!;

  return (
    <>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold">Drawings &amp; BIM</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Drawing register, revision control, and BIM model management
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn btn-secondary btn-sm">
            <RefreshCw size={14} /> New Revision
          </button>
          <button className="btn btn-secondary btn-sm">
            <Link2 size={14} /> Link to Project
          </button>
          <button onClick={() => setShowUploadModal(true)} className="btn btn-secondary btn-sm">
            <Upload size={14} /> Upload BIM Model
          </button>
          <button onClick={() => setShowUploadModal(true)} className="btn btn-primary btn-sm">
            <Upload size={14} /> Upload Drawing
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="tab-bar mt-4">
        {VIEWS.map(v => (
          <button
            key={v.id}
            className={cn("tab-item flex items-center gap-1.5", view === v.id && "active")}
            onClick={() => setView(v.id)}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {view === "register"   && <DrawingRegister />}
          {view === "timeline"   && <RevisionTimeline />}
          {view === "2d-viewer"  && <ViewerList />}
          {view === "bim-models" && <BimModelList />}
        </motion.div>
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.4)" }} onClick={() => setShowUploadModal(false)} />
            <motion.div
              className="card relative z-10 w-full max-w-md p-6"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-base font-bold">Upload Drawing</h2>
                <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setShowUploadModal(false)}><X size={16} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Drawing No <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input className="form-input" placeholder="e.g. A-010" />
                </div>
                <div>
                  <label className="form-label">Title <span style={{ color: "var(--danger)" }}>*</span></label>
                  <input className="form-input" placeholder="Drawing title" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Revision</label>
                    <input className="form-input" placeholder="e.g. P1" />
                  </div>
                  <div>
                    <label className="form-label">Discipline</label>
                    <select className="form-input">
                      {["Architectural","Structural","MEP","Civil","Landscape","Coordination"].map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="form-label">File</label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors hover:border-[var(--primary)]" style={{ borderColor: "var(--border)" }}>
                    <Upload size={24} className="mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
                    <p className="text-sm font-medium">Click to upload or drag &amp; drop</p>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>PDF, DWG, IFC, PNG, JPG (max 200MB)</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>Cancel</button>
                  <button className="btn btn-primary"><Upload size={14} /> Upload</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Camera,
  Upload,
  Layers,
  Link2,
  FileArchive,
  Sparkles,
  SlidersHorizontal,
  Download,
  Grid2X2,
  List,
  FolderOpen,
  AlertTriangle,
  Eye,
  FileText,
  Video,
  Mail,
  DraftingCompass,
  Image as ImageIcon,
  ChevronRight,
  Search,
} from "lucide-react";
import { cn, formatDate, formatRelative } from "@/lib/utils";
import {
  SEED_EVIDENCE,
  SEED_EVIDENCE_GAPS,
  formatFileSize,
  getTypeChipClass,
  type EvidenceType,
} from "@/lib/seed/evidence";

/* ─────────────────────────────────────────────── */
/*  Types & constants                               */
/* ─────────────────────────────────────────────── */

type ViewMode = "grid" | "table" | "grouped" | "unlinked" | "gaps";

const VIEW_TABS: { id: ViewMode; label: string }[] = [
  { id: "grid",     label: "Media Grid"       },
  { id: "table",    label: "Table"            },
  { id: "grouped",  label: "Project Grouped"  },
  { id: "unlinked", label: "Unlinked Evidence"},
  { id: "gaps",     label: "Evidence Gap"     },
];

const TYPE_OPTIONS: EvidenceType[] = ["Photo", "Video", "Document", "Drawing", "Correspondence"];

const PROJECT_OPTIONS = [
  { id: "", label: "All Projects" },
  { id: "proj-001", label: "Eastside Block A" },
  { id: "proj-002", label: "Meridian Phase 2" },
  { id: "proj-003", label: "Thornfield Hub" },
  { id: "proj-005", label: "Harlow Civic" },
  { id: "proj-006", label: "Kings Cross Fit-out" },
  { id: "proj-007", label: "Riverside Apartments" },
];

/* ─────────────────────────────────────────────── */
/*  Type icon                                       */
/* ─────────────────────────────────────────────── */

function TypeIcon({ type, size = 16 }: { type: EvidenceType; size?: number }) {
  const cls = `text-[var(--text-muted)]`;
  switch (type) {
    case "Photo":          return <ImageIcon size={size} className={cls} />;
    case "Video":          return <Video size={size} className={cls} />;
    case "Document":       return <FileText size={size} className={cls} />;
    case "Drawing":        return <DraftingCompass size={size} className={cls} />;
    case "Correspondence": return <Mail size={size} className={cls} />;
  }
}

/* ─────────────────────────────────────────────── */
/*  Evidence thumbnail card                         */
/* ─────────────────────────────────────────────── */

function EvidenceCard({ item }: { item: typeof SEED_EVIDENCE[0] }) {
  return (
    <Link
      href={`/app/evidence/${item.id}`}
      className="card group relative flex flex-col overflow-hidden hover:shadow-md transition-shadow duration-150 cursor-pointer"
    >
      {/* Thumbnail */}
      <div
        className="h-40 w-full flex items-center justify-center relative overflow-hidden"
        style={{ background: item.thumbnailColor }}
      >
        <TypeIcon type={item.type} size={36} />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-150 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); }}
            className="btn btn-sm"
            style={{ background: "rgba(255,255,255,0.92)" }}
            aria-label="Preview"
          >
            <Eye size={13} />
            Preview
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); }}
            className="btn btn-sm"
            style={{ background: "rgba(255,255,255,0.92)" }}
            aria-label="Download"
          >
            <Download size={13} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); }}
            className="btn btn-sm"
            style={{ background: "rgba(255,255,255,0.92)" }}
            aria-label="Link to record"
          >
            <Link2 size={13} />
          </button>
        </div>
      </div>

      {/* Card body */}
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <p className="text-[13px] font-medium text-[var(--text-primary)] line-clamp-2 leading-snug">
          {item.fileName}
        </p>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={cn("badge", getTypeChipClass(item.type))}>{item.type}</span>
          {item.status === "unlinked" && (
            <span className="badge chip-warning">Unlinked</span>
          )}
        </div>

        <p className="text-[11.5px] text-[var(--text-muted)] truncate">{item.projectName}</p>

        <div className="flex items-center justify-between mt-auto pt-1">
          <span className="text-[11px] text-[var(--text-muted)]">{formatDate(item.uploadDate)}</span>
          {item.linkedRecordsCount > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)]">
              <Link2 size={10} />
              {item.linkedRecordsCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────── */
/*  Table view                                      */
/* ─────────────────────────────────────────────── */

function TableView({ items }: { items: typeof SEED_EVIDENCE }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Type</th>
              <th>Project</th>
              <th>Linked Records</th>
              <th>Upload Date</th>
              <th>Size</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <Link
                    href={`/app/evidence/${item.id}`}
                    className="flex items-center gap-2 hover:text-[var(--primary)] transition-colors"
                  >
                    <TypeIcon type={item.type} size={14} />
                    <span className="font-medium max-w-[280px] truncate">{item.fileName}</span>
                  </Link>
                </td>
                <td>
                  <span className={cn("badge", getTypeChipClass(item.type))}>{item.type}</span>
                </td>
                <td>
                  <span className="text-[var(--text-secondary)] truncate max-w-[160px] block">
                    {item.projectName}
                  </span>
                </td>
                <td>
                  <span className={cn(
                    "text-[13px] font-medium",
                    item.linkedRecordsCount === 0
                      ? "text-[var(--warning)]"
                      : "text-[var(--text-primary)]"
                  )}>
                    {item.linkedRecordsCount === 0 ? "Unlinked" : item.linkedRecordsCount}
                  </span>
                </td>
                <td className="text-[var(--text-secondary)]">{formatDate(item.uploadDate)}</td>
                <td className="text-[var(--text-secondary)]">{formatFileSize(item.sizeBytes)}</td>
                <td>
                  <div className="flex items-center gap-1.5">
                    <Link href={`/app/evidence/${item.id}`} className="btn btn-sm btn-secondary">
                      <Eye size={12} /> View
                    </Link>
                    <button type="button" className="btn btn-sm btn-secondary btn-icon" aria-label="Download">
                      <Download size={12} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/*  Project Grouped view                            */
/* ─────────────────────────────────────────────── */

function GroupedView({ items }: { items: typeof SEED_EVIDENCE }) {
  const grouped = useMemo(() => {
    const map: Record<string, typeof SEED_EVIDENCE> = {};
    items.forEach((item) => {
      if (!map[item.projectId]) map[item.projectId] = [];
      map[item.projectId].push(item);
    });
    return Object.entries(map);
  }, [items]);

  return (
    <div className="flex flex-col gap-6">
      {grouped.map(([, groupItems]) => {
        const first = groupItems[0];
        return (
          <div key={first.projectId} className="card overflow-hidden">
            <div
              className="flex items-center justify-between px-5 py-3.5 border-b"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-3">
                <FolderOpen size={16} className="text-[var(--primary)]" />
                <div>
                  <p className="font-semibold text-[13.5px] text-[var(--text-primary)]">{first.projectName}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">{first.projectRef}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge chip-muted">{groupItems.length} files</span>
                <Link href={`/app/projects/${first.projectId}/evidence`} className="btn btn-sm btn-secondary">
                  View All <ChevronRight size={12} />
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 p-4">
              {groupItems.map((item) => (
                <EvidenceCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/*  Evidence Gap view                               */
/* ─────────────────────────────────────────────── */

function GapView() {
  return (
    <div className="flex flex-col gap-4">
      <div
        className="flex items-start gap-3 p-4 rounded-xl border"
        style={{ background: "var(--warning-bg)", borderColor: "#FDE68A" }}
      >
        <AlertTriangle size={16} className="text-[var(--warning)] mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-[13px] font-semibold text-[var(--warning-text)]">Evidence coverage affects your commercial position</p>
          <p className="text-[12.5px] text-[var(--warning-text)] mt-0.5 opacity-80">
            Changes without supporting evidence are harder to defend in adjudication or final account negotiations. Use AI Gap Check to identify missing contemporary records.
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Changes</th>
              <th>With Evidence</th>
              <th>Coverage</th>
              <th>Unlinked Files</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {SEED_EVIDENCE_GAPS.map((gap) => (
              <tr key={gap.projectId}>
                <td>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">{gap.projectName}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">{gap.projectRef}</p>
                  </div>
                </td>
                <td className="text-[var(--text-secondary)]">{gap.totalChanges}</td>
                <td className="text-[var(--text-secondary)]">{gap.changesWithEvidence}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 rounded-full bg-[var(--bg-muted)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${gap.coveragePercent}%`,
                          background:
                            gap.gapSeverity === "success"
                              ? "var(--success)"
                              : gap.gapSeverity === "warning"
                              ? "var(--warning)"
                              : "var(--danger)",
                        }}
                      />
                    </div>
                    <span
                      className={cn(
                        "text-[12.5px] font-semibold",
                        gap.gapSeverity === "success"
                          ? "text-[var(--success)]"
                          : gap.gapSeverity === "warning"
                          ? "text-[var(--warning)]"
                          : "text-[var(--danger)]"
                      )}
                    >
                      {gap.coveragePercent}%
                    </span>
                  </div>
                </td>
                <td>
                  {gap.unlinkedCount > 0 ? (
                    <span className="badge chip-warning">{gap.unlinkedCount} unlinked</span>
                  ) : (
                    <span className="badge chip-success">None</span>
                  )}
                </td>
                <td>
                  <div className="flex items-center gap-1.5">
                    {gap.aiCheckAvailable && (
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        style={{ color: "var(--violet)" }}
                      >
                        <Sparkles size={12} />
                        AI Gap Check
                      </button>
                    )}
                    <Link
                      href={`/app/projects/${gap.projectId}/evidence`}
                      className="btn btn-sm btn-secondary"
                    >
                      View
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/*  Filter bar                                      */
/* ─────────────────────────────────────────────── */

interface FilterBarProps {
  projectFilter: string;
  typeFilter: EvidenceType | "";
  linkedFilter: "all" | "linked" | "unlinked";
  search: string;
  onProjectChange: (v: string) => void;
  onTypeChange: (v: EvidenceType | "") => void;
  onLinkedChange: (v: "all" | "linked" | "unlinked") => void;
  onSearchChange: (v: string) => void;
}

function FilterBar({
  projectFilter, typeFilter, linkedFilter, search,
  onProjectChange, onTypeChange, onLinkedChange, onSearchChange,
}: FilterBarProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Search */}
      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="search"
          placeholder="Search files…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="form-input pl-8 h-8 text-[13px] w-48"
        />
      </div>

      {/* Project */}
      <select
        value={projectFilter}
        onChange={(e) => onProjectChange(e.target.value)}
        className="form-input h-8 text-[13px] w-44 cursor-pointer"
      >
        {PROJECT_OPTIONS.map((p) => (
          <option key={p.id} value={p.id}>{p.label}</option>
        ))}
      </select>

      {/* Type */}
      <select
        value={typeFilter}
        onChange={(e) => onTypeChange(e.target.value as EvidenceType | "")}
        className="form-input h-8 text-[13px] w-36 cursor-pointer"
      >
        <option value="">All Types</option>
        {TYPE_OPTIONS.map((t) => (
          <option key={t} value={t}>{t}</option>
        ))}
      </select>

      {/* Linked */}
      <select
        value={linkedFilter}
        onChange={(e) => onLinkedChange(e.target.value as "all" | "linked" | "unlinked")}
        className="form-input h-8 text-[13px] w-36 cursor-pointer"
      >
        <option value="all">Linked &amp; Unlinked</option>
        <option value="linked">Linked Only</option>
        <option value="unlinked">Unlinked Only</option>
      </select>
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/*  KPI strip                                       */
/* ─────────────────────────────────────────────── */

function EvidenceKpiStrip() {
  const totalFiles = SEED_EVIDENCE.length;
  const linked = SEED_EVIDENCE.filter((e) => e.linkedRecordsCount > 0).length;
  const unlinked = SEED_EVIDENCE.filter((e) => e.linkedRecordsCount === 0).length;
  const totalSize = SEED_EVIDENCE.reduce((acc, e) => acc + e.sizeBytes, 0);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[
        { label: "Total Files",    value: totalFiles.toString(),       color: undefined },
        { label: "Linked",         value: linked.toString(),           color: "var(--success)" },
        { label: "Unlinked",       value: unlinked.toString(),         color: "var(--warning)" },
        { label: "Total Storage",  value: formatFileSize(totalSize),   color: undefined },
      ].map((kpi) => (
        <div key={kpi.label} className="kpi-card">
          <span className="kpi-label">{kpi.label}</span>
          <span
            className="kpi-value"
            style={kpi.color ? { color: kpi.color } : undefined}
          >
            {kpi.value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/*  Page                                            */
/* ─────────────────────────────────────────────── */

export default function EvidencePage() {
  const [view, setView]                 = useState<ViewMode>("grid");
  const [projectFilter, setProject]     = useState("");
  const [typeFilter, setType]           = useState<EvidenceType | "">("");
  const [linkedFilter, setLinked]       = useState<"all" | "linked" | "unlinked">("all");
  const [search, setSearch]             = useState("");

  const filtered = useMemo(() => {
    return SEED_EVIDENCE.filter((item) => {
      if (projectFilter && item.projectId !== projectFilter) return false;
      if (typeFilter && item.type !== typeFilter) return false;
      if (linkedFilter === "linked"   && item.linkedRecordsCount === 0) return false;
      if (linkedFilter === "unlinked" && item.linkedRecordsCount > 0)  return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !item.fileName.toLowerCase().includes(q) &&
          !item.projectName.toLowerCase().includes(q) &&
          !item.description.toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [projectFilter, typeFilter, linkedFilter, search]);

  const unlinkedItems = SEED_EVIDENCE.filter((e) => e.linkedRecordsCount === 0);

  return (
    <>
      {/* ── Page header ─────────────────────────────── */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--primary-light)" }}
          >
            <Camera size={18} style={{ color: "var(--primary)" }} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[var(--text-primary)]">Evidence</h1>
            <p className="text-[12.5px] text-[var(--text-muted)] mt-0.5">
              Site photos, documents, drawings and correspondence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button type="button" className="btn btn-secondary btn-sm">
            <SlidersHorizontal size={13} />
            Filter
          </button>
          <button type="button" className="btn btn-secondary btn-sm">
            <Download size={13} />
            Export
          </button>
          <button type="button" className="btn btn-secondary btn-sm" style={{ color: "var(--violet)" }}>
            <Sparkles size={13} />
            AI Classify
          </button>
          <button type="button" className="btn btn-secondary btn-sm">
            <FileArchive size={13} />
            Generate Evidence Pack
          </button>
          <button type="button" className="btn btn-secondary btn-sm">
            <Layers size={13} />
            Bulk Upload
          </button>
          <Link href="/app/evidence/upload" className="btn btn-primary btn-sm">
            <Upload size={13} />
            Upload Evidence
          </Link>
        </div>
      </div>

      {/* ── Page content ────────────────────────────── */}
      <div className="page-content flex flex-col gap-5">
        {/* KPIs */}
        <EvidenceKpiStrip />

        {/* View tabs */}
        <div className="tab-bar -mx-6 px-6">
          {VIEW_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setView(tab.id)}
              className={cn("tab-item", view === tab.id && "active")}
            >
              {tab.label}
              {tab.id === "unlinked" && unlinkedItems.length > 0 && (
                <span className="ml-1.5 badge chip-warning" style={{ fontSize: "10px", padding: "1px 5px" }}>
                  {unlinkedItems.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filter bar (not shown on gap view) */}
        {view !== "gaps" && (
          <FilterBar
            projectFilter={projectFilter}
            typeFilter={typeFilter}
            linkedFilter={linkedFilter}
            search={search}
            onProjectChange={setProject}
            onTypeChange={setType}
            onLinkedChange={setLinked}
            onSearchChange={setSearch}
          />
        )}

        {/* ── Views ──────────────────────────────────── */}

        {/* Gap view */}
        {view === "gaps" && <GapView />}

        {/* Unlinked view */}
        {view === "unlinked" && (
          unlinkedItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Camera size={22} /></div>
              <p className="text-[15px] font-semibold text-[var(--text-primary)]">No unlinked evidence</p>
              <p className="text-[13px] text-[var(--text-muted)] max-w-sm">
                All your uploaded files are linked to at least one project record.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {unlinkedItems.map((item) => (
                <EvidenceCard key={item.id} item={item} />
              ))}
            </div>
          )
        )}

        {/* Grouped view */}
        {view === "grouped" && <GroupedView items={filtered} />}

        {/* Table view */}
        {view === "table" && (
          filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Camera size={22} /></div>
              <p className="text-[15px] font-semibold">No evidence matches your filters</p>
              <p className="text-[13px] text-[var(--text-muted)]">Try adjusting or clearing the filters above.</p>
            </div>
          ) : (
            <TableView items={filtered} />
          )
        )}

        {/* Grid view */}
        {view === "grid" && (
          filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Camera size={22} /></div>
              <p className="text-[15px] font-semibold text-[var(--text-primary)]">No evidence found</p>
              <p className="text-[13px] text-[var(--text-muted)] max-w-sm">
                Upload your first site photo, document or drawing to get started.
              </p>
              <Link href="/app/evidence/upload" className="btn btn-primary btn-sm mt-2">
                <Upload size={13} />
                Upload Evidence
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {filtered.map((item) => (
                <EvidenceCard key={item.id} item={item} />
              ))}
            </div>
          )
        )}
      </div>
    </>
  );
}

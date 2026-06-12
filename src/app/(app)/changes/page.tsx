"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Upload, Download, Filter, BookmarkPlus, RefreshCw,
  LayoutList, Columns3, LayoutGrid, Clock, BarChart2,
  MoreHorizontal, ChevronDown, Sparkles, CheckSquare,
  FileText, Zap, AlertCircle, CheckCircle2, XCircle,
  MinusCircle, ArrowRight,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { ChangeWizard } from "@/components/wizards/change-wizard";

// ─── Types ───────────────────────────────────────────────────────────────────

type ChangeStatus = "Draft" | "Submitted" | "Under Review" | "Approved" | "Disputed" | "Withdrawn";
type ChangeType   = "Variation" | "Delay/Extension" | "Provisional Sum" | "Daywork" | "Claim" | "Instruction";

interface Change {
  id: string;
  ref: string;
  title: string;
  project: string;
  project_id: string;
  type: ChangeType;
  value: number;
  status: ChangeStatus;
  submitted_date: string | null;
  evidence_score: number;
  created_at: string;
}

// ─── Static placeholder data ──────────────────────────────────────────────────

const PLACEHOLDER: Change[] = [
  { id: "c1", ref: "VAR-001", title: "Additional groundworks – unforeseen rock", project: "The Arc Tower, Birmingham", project_id: "p1", type: "Variation", value: 48500, status: "Under Review", submitted_date: "2025-11-14", evidence_score: 82, created_at: "2025-11-01" },
  { id: "c2", ref: "VAR-002", title: "Structural steel design change – L3 beam", project: "The Arc Tower, Birmingham", project_id: "p1", type: "Variation", value: 17200, status: "Approved", submitted_date: "2025-10-28", evidence_score: 95, created_at: "2025-10-15" },
  { id: "c3", ref: "DEL-001", title: "Programme delay – utility diversion", project: "Granary Wharf Offices", project_id: "p2", type: "Delay/Extension", value: 31000, status: "Submitted", submitted_date: "2025-11-20", evidence_score: 67, created_at: "2025-11-08" },
  { id: "c4", ref: "CLM-001", title: "Loss & expense – prolongation costs Q3", project: "Granary Wharf Offices", project_id: "p2", type: "Claim", value: 124000, status: "Disputed", submitted_date: "2025-09-30", evidence_score: 54, created_at: "2025-09-15" },
  { id: "c5", ref: "PS-001", title: "PC Sum – specialist cladding works", project: "Riverside Apartments Ph2", project_id: "p3", type: "Provisional Sum", value: 85000, status: "Draft", submitted_date: null, evidence_score: 30, created_at: "2025-11-22" },
  { id: "c6", ref: "DW-001", title: "Daywork – emergency pipe repair", project: "Riverside Apartments Ph2", project_id: "p3", type: "Daywork", value: 6800, status: "Approved", submitted_date: "2025-10-05", evidence_score: 100, created_at: "2025-10-01" },
  { id: "c7", ref: "INS-001", title: "Instruction – omit feature wall", project: "Station Square Retail", project_id: "p4", type: "Instruction", value: -12000, status: "Approved", submitted_date: "2025-11-01", evidence_score: 100, created_at: "2025-10-28" },
  { id: "c8", ref: "VAR-003", title: "Acoustic upgrade – cinema suite", project: "Station Square Retail", project_id: "p4", type: "Variation", value: 29500, status: "Draft", submitted_date: null, evidence_score: 20, created_at: "2025-11-25" },
  { id: "c9", ref: "VAR-004", title: "MEP coordination changes – level 5", project: "The Arc Tower, Birmingham", project_id: "p1", type: "Variation", value: 9750, status: "Withdrawn", submitted_date: "2025-10-10", evidence_score: 0, created_at: "2025-10-08" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_META: Record<ChangeStatus, { chip: string; label: string }> = {
  Draft:        { chip: "chip-muted",    label: "Draft" },
  Submitted:    { chip: "chip-info",     label: "Submitted" },
  "Under Review": { chip: "chip-warning", label: "Under Review" },
  Approved:     { chip: "chip-success",  label: "Approved" },
  Disputed:     { chip: "chip-danger",   label: "Disputed" },
  Withdrawn:    { chip: "chip-muted",    label: "Withdrawn" },
};

const ALL_STATUSES: ChangeStatus[] = ["Draft", "Submitted", "Under Review", "Approved", "Disputed", "Withdrawn"];

function StatusChip({ status }: { status: ChangeStatus }) {
  const m = STATUS_META[status];
  return <span className={cn("badge", m.chip)}>{m.label}</span>;
}

function EvidenceBar({ score }: { score: number }) {
  const color = score >= 80 ? "var(--success)" : score >= 50 ? "var(--warning)" : "var(--danger)";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-muted)] min-w-[80px]">
        <div style={{ width: `${score}%`, background: color }} className="h-full rounded-full transition-all" />
      </div>
      <span className="text-xs font-semibold tabular-nums" style={{ color }}>{score}%</span>
    </div>
  );
}

type ViewMode = "table" | "kanban" | "card" | "aging" | "evidence";

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChangesPage() {
  const router = useRouter();
  const [changes, setChanges] = useState<Change[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ChangeStatus | "All">("All");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase.from("changes").select("*").order("created_at", { ascending: false });
        setChanges(data && data.length > 0 ? data : PLACEHOLDER);
      } catch {
        setChanges(PLACEHOLDER);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = changes.filter(c => {
    const matchSearch = !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.ref.toLowerCase().includes(search.toLowerCase()) || c.project.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalValue = filtered.reduce((s, c) => s + c.value, 0);
  const approvedCount = filtered.filter(c => c.status === "Approved").length;
  const disputedValue = filtered.filter(c => c.status === "Disputed").reduce((s, c) => s + c.value, 0);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const VIEW_TABS: { mode: ViewMode; label: string; Icon: React.ElementType }[] = [
    { mode: "table",    label: "Table",            Icon: LayoutList },
    { mode: "kanban",   label: "Status Board",     Icon: Columns3 },
    { mode: "card",     label: "Cards",            Icon: LayoutGrid },
    { mode: "aging",    label: "Aging View",       Icon: Clock },
    { mode: "evidence", label: "Evidence Strength", Icon: BarChart2 },
  ];

  return (
    <div className="flex flex-col min-h-full">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Changes &amp; Claims</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Variations, extensions of time and contractual claims</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn btn-secondary btn-sm"><Download size={14} />Export</button>
          <button className="btn btn-secondary btn-sm"><Upload size={14} />Import</button>
          <button className="btn btn-secondary btn-sm"><Filter size={14} />Filter</button>
          <button className="btn btn-secondary btn-sm"><BookmarkPlus size={14} />Saved Views</button>
          {selectedIds.size > 0 && (
            <button className="btn btn-secondary btn-sm"><CheckSquare size={14} />Bulk Update ({selectedIds.size})</button>
          )}
          <button className="btn btn-secondary btn-sm gap-1.5"><Sparkles size={14} className="text-[var(--violet)]" />AI Draft Narrative</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowWizard(true)}><Plus size={14} />New Change</button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="px-6 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="kpi-card">
          <div className="kpi-label">Total Changes</div>
          <div className="kpi-value">{filtered.length}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Value</div>
          <div className="kpi-value">{formatCurrency(totalValue)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Approved</div>
          <div className="kpi-value text-[var(--success)]">{approvedCount}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Disputed Value</div>
          <div className="kpi-value text-[var(--danger)]">{formatCurrency(disputedValue)}</div>
        </div>
      </div>

      {/* View tabs + search */}
      <div className="px-6 pt-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1 bg-[var(--bg-muted)] rounded-[var(--radius)] p-1">
          {VIEW_TABS.map(({ mode, label, Icon }) => (
            <button
              key={mode}
              onClick={() => setView(mode)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-600 transition-all",
                view === mode
                  ? "bg-white text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              )}
            >
              <Icon size={13} />{label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            className="form-input h-8 text-sm w-52"
            placeholder="Search changes…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="form-input h-8 text-sm w-40"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as ChangeStatus | "All")}
          >
            <option value="All">All Statuses</option>
            {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="page-content flex-1 pt-4">
        {loading ? (
          <LoadingSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState onNew={() => {}} />
        ) : (
          <>
            {view === "table"    && <TableView    changes={filtered} selectedIds={selectedIds} onToggle={toggleSelect} onRowClick={id => router.push(`/changes/${id}`)} />}
            {view === "kanban"   && <KanbanView   changes={filtered} onCardClick={id => router.push(`/changes/${id}`)} />}
            {view === "card"     && <CardView     changes={filtered} onCardClick={id => router.push(`/changes/${id}`)} />}
            {view === "aging"    && <AgingView    changes={filtered} onRowClick={id => router.push(`/changes/${id}`)} />}
            {view === "evidence" && <EvidenceView changes={filtered} onRowClick={id => router.push(`/changes/${id}`)} />}
          </>
        )}
      </div>

      {showWizard && (
        <ChangeWizard
          onClose={() => setShowWizard(false)}
          onSuccess={(_id: string) => setShowWizard(false)}
        />
      )}
    </div>
  );
}

// ─── Table View ───────────────────────────────────────────────────────────────

function TableView({ changes, selectedIds, onToggle, onRowClick }: {
  changes: Change[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onRowClick: (id: string) => void;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-10"><input type="checkbox" className="w-3.5 h-3.5" /></th>
              <th>Ref</th>
              <th>Title</th>
              <th>Project</th>
              <th>Type</th>
              <th className="text-right">Value</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Evidence</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {changes.map(c => (
              <tr
                key={c.id}
                className="cursor-pointer"
                onClick={() => onRowClick(c.id)}
              >
                <td onClick={e => { e.stopPropagation(); onToggle(c.id); }}>
                  <input type="checkbox" className="w-3.5 h-3.5" checked={selectedIds.has(c.id)} onChange={() => {}} />
                </td>
                <td className="font-mono text-xs font-semibold text-[var(--primary)]">{c.ref}</td>
                <td className="max-w-[260px]">
                  <span className="line-clamp-2 font-medium">{c.title}</span>
                </td>
                <td className="text-[var(--text-secondary)] text-xs">{c.project}</td>
                <td>
                  <TypeChip type={c.type} />
                </td>
                <td className={cn("text-right font-semibold tabular-nums", c.value < 0 ? "text-[var(--danger)]" : "text-[var(--text-primary)]")}>
                  {formatCurrency(c.value)}
                </td>
                <td><StatusChip status={c.status} /></td>
                <td className="text-[var(--text-muted)] text-xs">{formatDate(c.submitted_date)}</td>
                <td><EvidenceBar score={c.evidence_score} /></td>
                <td onClick={e => e.stopPropagation()}>
                  <button className="btn btn-ghost btn-icon btn-sm"><MoreHorizontal size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TypeChip({ type }: { type: ChangeType }) {
  const map: Record<ChangeType, string> = {
    "Variation":       "chip-primary",
    "Delay/Extension": "chip-warning",
    "Provisional Sum": "chip-cyan",
    "Daywork":         "chip-muted",
    "Claim":           "chip-danger",
    "Instruction":     "chip-violet",
  };
  return <span className={cn("badge", map[type])}>{type}</span>;
}

// ─── Kanban View ──────────────────────────────────────────────────────────────

function KanbanView({ changes, onCardClick }: { changes: Change[]; onCardClick: (id: string) => void }) {
  const columns = ALL_STATUSES.map(status => ({
    status,
    items: changes.filter(c => c.status === status),
  }));

  const COLUMN_COLORS: Record<ChangeStatus, string> = {
    Draft:           "#94A3B8",
    Submitted:       "var(--info)",
    "Under Review":  "var(--warning)",
    Approved:        "var(--success)",
    Disputed:        "var(--danger)",
    Withdrawn:       "#CBD5E1",
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 480 }}>
      {columns.map(({ status, items }) => (
        <div key={status} className="flex-shrink-0 w-64">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full" style={{ background: COLUMN_COLORS[status] }} />
            <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">{status}</span>
            <span className="ml-auto text-xs text-[var(--text-muted)] bg-[var(--bg-muted)] rounded-full px-2 py-0.5">{items.length}</span>
          </div>
          <div className="flex flex-col gap-2">
            {items.map(c => (
              <button
                key={c.id}
                onClick={() => onCardClick(c.id)}
                className="card p-3 text-left w-full hover:shadow-md transition-shadow"
              >
                <div className="text-[10px] font-mono font-semibold text-[var(--primary)] mb-1">{c.ref}</div>
                <div className="text-sm font-medium text-[var(--text-primary)] line-clamp-2 mb-2">{c.title}</div>
                <div className="text-xs text-[var(--text-muted)] mb-2">{c.project}</div>
                <div className="flex items-center justify-between">
                  <TypeChip type={c.type} />
                  <span className={cn("text-xs font-semibold tabular-nums", c.value < 0 ? "text-[var(--danger)]" : "text-[var(--text-primary)]")}>
                    {formatCurrency(c.value)}
                  </span>
                </div>
                <div className="mt-2">
                  <EvidenceBar score={c.evidence_score} />
                </div>
              </button>
            ))}
            {items.length === 0 && (
              <div className="rounded-[var(--radius)] border-2 border-dashed border-[var(--border)] h-20 flex items-center justify-center text-xs text-[var(--text-muted)]">
                No changes
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Card View ────────────────────────────────────────────────────────────────

function CardView({ changes, onCardClick }: { changes: Change[]; onCardClick: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {changes.map(c => (
        <button
          key={c.id}
          onClick={() => onCardClick(c.id)}
          className="card p-4 text-left hover:shadow-md transition-shadow flex flex-col gap-3"
        >
          <div className="flex items-start justify-between gap-2">
            <span className="font-mono text-xs font-semibold text-[var(--primary)]">{c.ref}</span>
            <StatusChip status={c.status} />
          </div>
          <div className="text-sm font-semibold text-[var(--text-primary)] line-clamp-2">{c.title}</div>
          <div className="text-xs text-[var(--text-muted)]">{c.project}</div>
          <div className="flex items-center justify-between mt-auto">
            <TypeChip type={c.type} />
            <span className={cn("text-sm font-bold tabular-nums", c.value < 0 ? "text-[var(--danger)]" : "text-[var(--text-primary)]")}>
              {formatCurrency(c.value)}
            </span>
          </div>
          <EvidenceBar score={c.evidence_score} />
        </button>
      ))}
    </div>
  );
}

// ─── Aging View ───────────────────────────────────────────────────────────────

function AgingView({ changes, onRowClick }: { changes: Change[]; onRowClick: (id: string) => void }) {
  const today = new Date("2026-06-10");

  function ageDays(c: Change): number {
    const ref = c.submitted_date ?? c.created_at;
    return Math.floor((today.getTime() - new Date(ref).getTime()) / 86400000);
  }

  function ageBand(days: number): { label: string; color: string } {
    if (days <= 14) return { label: "0–14 days",  color: "var(--success)" };
    if (days <= 30) return { label: "15–30 days", color: "var(--warning)" };
    if (days <= 60) return { label: "31–60 days", color: "var(--warning)" };
    return              { label: "60+ days",     color: "var(--danger)" };
  }

  const sorted = [...changes].sort((a, b) => ageDays(b) - ageDays(a));

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ref</th>
              <th>Title</th>
              <th>Project</th>
              <th>Status</th>
              <th className="text-right">Value</th>
              <th>Submitted / Created</th>
              <th>Age</th>
              <th>Band</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(c => {
              const days = ageDays(c);
              const band = ageBand(days);
              return (
                <tr key={c.id} className="cursor-pointer" onClick={() => onRowClick(c.id)}>
                  <td className="font-mono text-xs font-semibold text-[var(--primary)]">{c.ref}</td>
                  <td className="font-medium max-w-[220px]"><span className="line-clamp-2">{c.title}</span></td>
                  <td className="text-xs text-[var(--text-muted)]">{c.project}</td>
                  <td><StatusChip status={c.status} /></td>
                  <td className="text-right font-semibold tabular-nums">{formatCurrency(c.value)}</td>
                  <td className="text-xs text-[var(--text-muted)]">{formatDate(c.submitted_date ?? c.created_at)}</td>
                  <td className="font-semibold tabular-nums" style={{ color: band.color }}>{days}d</td>
                  <td>
                    <span className="badge text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: band.color + "20", color: band.color }}>
                      {band.label}
                    </span>
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

// ─── Evidence Strength View ───────────────────────────────────────────────────

function EvidenceView({ changes, onRowClick }: { changes: Change[]; onRowClick: (id: string) => void }) {
  const sorted = [...changes].sort((a, b) => a.evidence_score - b.evidence_score);

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ref</th>
              <th>Title</th>
              <th>Project</th>
              <th>Type</th>
              <th>Status</th>
              <th className="text-right">Value</th>
              <th>Evidence Strength</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(c => (
              <tr key={c.id} className="cursor-pointer" onClick={() => onRowClick(c.id)}>
                <td className="font-mono text-xs font-semibold text-[var(--primary)]">{c.ref}</td>
                <td className="font-medium max-w-[240px]"><span className="line-clamp-2">{c.title}</span></td>
                <td className="text-xs text-[var(--text-muted)]">{c.project}</td>
                <td><TypeChip type={c.type} /></td>
                <td><StatusChip status={c.status} /></td>
                <td className="text-right font-semibold tabular-nums">{formatCurrency(c.value)}</td>
                <td className="min-w-[180px]">
                  <EvidenceBar score={c.evidence_score} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Loading / Empty ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="p-4 flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-10 rounded-[var(--radius)]" />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="card">
      <div className="empty-state">
        <div className="empty-icon"><FileText size={22} /></div>
        <h3 className="text-base font-semibold">No changes yet</h3>
        <p className="text-sm text-[var(--text-muted)] max-w-xs">
          Start recording variations, extensions of time, and contractual claims. Click <strong>New Change</strong> to create your first record.
        </p>
        <button onClick={onNew} className="btn btn-primary btn-sm mt-2"><Plus size={14} />New Change</button>
      </div>
    </div>
  );
}

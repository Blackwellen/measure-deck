"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Upload, Download, Filter, BookmarkPlus, Search,
  LayoutList, LayoutGrid, Columns3, BarChart3, Archive,
  MoreHorizontal, ChevronRight, TrendingUp, TrendingDown,
  FolderKanban, Pencil, Eye,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { SEED_PROJECTS, type SeedProject, type ProjectStatus } from "@/lib/seed/projects";
import { ProjectWizard } from "@/components/wizards/project-wizard";

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = "table" | "card" | "board" | "commercial" | "archived";

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_META: Record<ProjectStatus, { chip: string; label: string; color: string }> = {
  active:    { chip: "chip-success", label: "Active",    color: "var(--success)" },
  on_hold:   { chip: "chip-warning", label: "On Hold",   color: "var(--warning)" },
  completed: { chip: "chip-info",    label: "Completed", color: "var(--info)" },
  disputed:  { chip: "chip-danger",  label: "Disputed",  color: "var(--danger)" },
  archived:  { chip: "chip-muted",   label: "Archived",  color: "var(--text-muted)" },
};

function StatusChip({ status }: { status: ProjectStatus }) {
  const m = STATUS_META[status];
  return <span className={cn("badge", m.chip)}>{m.label}</span>;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<SeedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("projects")
          .select("*")
          .order("created_at", { ascending: false });
        setProjects(data && data.length > 0 ? (data as SeedProject[]) : SEED_PROJECTS);
      } catch {
        setProjects(SEED_PROJECTS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = projects.filter(p => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase()) ||
      p.ref.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    const isArchived = p.status === "archived";
    if (view === "archived") return isArchived && matchSearch;
    return !isArchived && matchSearch && matchStatus;
  });

  const VIEW_TABS: { mode: ViewMode; label: string; Icon: React.ElementType }[] = [
    { mode: "table",      label: "Table",                Icon: LayoutList },
    { mode: "card",       label: "Cards",                Icon: LayoutGrid },
    { mode: "board",      label: "Board",                Icon: Columns3 },
    { mode: "commercial", label: "Commercial Dashboard", Icon: BarChart3 },
    { mode: "archived",   label: "Archived",             Icon: Archive },
  ];

  const allStatuses: ProjectStatus[] = ["active", "on_hold", "completed", "disputed"];

  return (
    <div className="flex flex-col min-h-full">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Projects</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {projects.filter(p => p.status !== "archived").length} active projects · {formatCurrency(
              projects.filter(p => p.status !== "archived").reduce((s, p) => s + p.contractValue, 0)
            )} total contract value
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn btn-secondary btn-sm"><Download size={14} />Export</button>
          <button className="btn btn-secondary btn-sm"><Upload size={14} />Import</button>
          <button className="btn btn-secondary btn-sm"><Filter size={14} />Filter</button>
          <button className="btn btn-secondary btn-sm"><BookmarkPlus size={14} />Saved Views</button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowWizard(true)}>
            <Plus size={14} />New Project
          </button>
        </div>
      </div>

      {/* View tabs + filters */}
      <div className="px-6 pt-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1 bg-[var(--bg-muted)] rounded-[var(--radius)] p-1">
          {VIEW_TABS.map(({ mode, label, Icon }) => (
            <button
              key={mode}
              onClick={() => setView(mode)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all",
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
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              className="form-input h-8 text-sm pl-8 w-52"
              placeholder="Search projects…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {view !== "archived" && (
            <select
              className="form-input h-8 text-sm w-40"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as ProjectStatus | "all")}
            >
              <option value="all">All Statuses</option>
              {allStatuses.map(s => (
                <option key={s} value={s}>{STATUS_META[s].label}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="page-content flex-1 pt-4" ref={menuRef}>
        {loading ? (
          <LoadingSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState onNew={() => router.push("/app/projects/new")} />
        ) : (
          <>
            {view === "table" && (
              <TableView
                projects={filtered}
                onRowClick={id => router.push(`/app/projects/${id}`)}
                onEdit={id => router.push(`/app/projects/${id}/edit`)}
                openMenuId={openMenuId}
                setOpenMenuId={setOpenMenuId}
              />
            )}
            {view === "card" && (
              <CardView
                projects={filtered}
                onOpen={id => router.push(`/app/projects/${id}`)}
              />
            )}
            {view === "board" && (
              <BoardView
                projects={filtered}
                onCardClick={id => router.push(`/app/projects/${id}`)}
              />
            )}
            {view === "commercial" && (
              <CommercialDashboard projects={filtered} />
            )}
            {view === "archived" && (
              <TableView
                projects={filtered}
                onRowClick={id => router.push(`/app/projects/${id}`)}
                onEdit={id => router.push(`/app/projects/${id}/edit`)}
                openMenuId={openMenuId}
                setOpenMenuId={setOpenMenuId}
              />
            )}
          </>
        )}
      </div>

      {showWizard && (
        <ProjectWizard
          onClose={() => setShowWizard(false)}
          onSuccess={(_projectId: string) => {
            setShowWizard(false);
            setLoading(true);
            const supabase = createClient();
            supabase.from("projects").select("*").order("created_at", { ascending: false }).then(({ data }: { data: SeedProject[] | null }) => {
              setProjects(data && data.length > 0 ? data : SEED_PROJECTS);
              setLoading(false);
            });
          }}
        />
      )}
    </div>
  );
}

// ─── Table View ───────────────────────────────────────────────────────────────

function TableView({
  projects, onRowClick, onEdit, openMenuId, setOpenMenuId,
}: {
  projects: SeedProject[];
  onRowClick: (id: string) => void;
  onEdit: (id: string) => void;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ref</th>
              <th>Project Name</th>
              <th>Client</th>
              <th className="text-right">Contract Value</th>
              <th className="text-right">Certified %</th>
              <th className="text-right">Margin %</th>
              <th>Status</th>
              <th>End Date</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {projects.map(p => {
              const certPct = p.contractValue > 0
                ? ((p.certifiedToDate / p.contractValue) * 100).toFixed(1)
                : "0.0";
              return (
                <tr
                  key={p.id}
                  className="cursor-pointer"
                  onClick={() => onRowClick(p.id)}
                >
                  <td className="font-mono text-xs font-semibold" style={{ color: "var(--primary)" }}>{p.ref}</td>
                  <td className="font-semibold max-w-[220px]">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-md flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                        style={{ background: p.logoColor }}
                      >
                        {p.logoInitials}
                      </div>
                      <span className="truncate">{p.name}</span>
                    </div>
                  </td>
                  <td className="text-sm" style={{ color: "var(--text-secondary)" }}>{p.client}</td>
                  <td className="text-right font-semibold tabular-nums">{formatCurrency(p.contractValue)}</td>
                  <td className="text-right tabular-nums">
                    <span className={cn("font-semibold", parseFloat(certPct) >= 80 ? "text-[var(--success)]" : "")}>
                      {certPct}%
                    </span>
                  </td>
                  <td className="text-right tabular-nums">
                    <span className={cn("font-semibold", p.margin >= 15 ? "text-[var(--success)]" : p.margin >= 10 ? "text-[var(--warning)]" : "text-[var(--danger)]")}>
                      {p.margin.toFixed(1)}%
                    </span>
                  </td>
                  <td><StatusChip status={p.status} /></td>
                  <td className="text-sm" style={{ color: "var(--text-muted)" }}>{formatDate(p.endDate)}</td>
                  <td onClick={e => e.stopPropagation()} className="relative">
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => setOpenMenuId(openMenuId === p.id ? null : p.id)}
                    >
                      <MoreHorizontal size={14} />
                    </button>
                    {openMenuId === p.id && (
                      <div
                        className="absolute right-0 top-8 z-50 min-w-[140px] rounded-[var(--radius)] shadow-[var(--shadow-md)] border overflow-hidden"
                        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                      >
                        <button
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-[var(--bg-subtle)] text-left"
                          onClick={() => { setOpenMenuId(null); onRowClick(p.id); }}
                        >
                          <Eye size={13} />Open
                        </button>
                        <button
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-[var(--bg-subtle)] text-left"
                          onClick={() => { setOpenMenuId(null); onEdit(p.id); }}
                        >
                          <Pencil size={13} />Edit
                        </button>
                        <button
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-[var(--bg-subtle)] text-left"
                          style={{ color: "var(--text-muted)" }}
                          onClick={() => setOpenMenuId(null)}
                        >
                          <Archive size={13} />Archive
                        </button>
                      </div>
                    )}
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

// ─── Card View ────────────────────────────────────────────────────────────────

function CardView({ projects, onOpen }: { projects: SeedProject[]; onOpen: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {projects.map(p => {
        const certPct = p.contractValue > 0 ? (p.certifiedToDate / p.contractValue) * 100 : 0;
        const statusColor = STATUS_META[p.status].color;
        return (
          <div
            key={p.id}
            className="card overflow-hidden flex flex-col hover:shadow-[var(--shadow-md)] transition-shadow cursor-pointer"
            onClick={() => onOpen(p.id)}
          >
            {/* Colour bar */}
            <div className="h-1.5" style={{ background: statusColor }} />
            <div className="p-4 flex flex-col gap-3 flex-1">
              {/* Avatar + ref */}
              <div className="flex items-start justify-between gap-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: p.logoColor }}
                >
                  {p.logoInitials}
                </div>
                <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: "var(--bg-muted)", color: "var(--text-muted)" }}>
                  {p.ref}
                </span>
              </div>
              {/* Name + client */}
              <div>
                <p className="font-semibold text-sm leading-tight" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{p.client}</p>
              </div>
              {/* Contract value */}
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Contract Value</p>
                <p className="text-lg font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
                  {formatCurrency(p.contractValue)}
                </p>
              </div>
              {/* Margin */}
              <div className="flex items-center gap-1.5">
                {p.margin >= 15
                  ? <TrendingUp size={13} style={{ color: "var(--success)" }} />
                  : <TrendingDown size={13} style={{ color: "var(--warning)" }} />}
                <span
                  className="text-sm font-semibold"
                  style={{ color: p.margin >= 15 ? "var(--success)" : "var(--warning)" }}
                >
                  {p.margin.toFixed(1)}% margin
                </span>
              </div>
              {/* Certified progress */}
              <div>
                <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                  <span>Certified</span>
                  <span className="font-semibold">{certPct.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(certPct, 100)}%`,
                      background: certPct >= 80 ? "var(--success)" : "var(--primary)",
                    }}
                  />
                </div>
              </div>
              {/* Footer */}
              <div className="flex items-center justify-between mt-auto pt-2">
                <StatusChip status={p.status} />
                <button
                  className="btn btn-secondary btn-sm text-xs"
                  onClick={e => { e.stopPropagation(); onOpen(p.id); }}
                >
                  Open Project <ChevronRight size={11} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Board View ───────────────────────────────────────────────────────────────

function BoardView({ projects, onCardClick }: { projects: SeedProject[]; onCardClick: (id: string) => void }) {
  const columns: { status: ProjectStatus; label: string }[] = [
    { status: "active",    label: "Active" },
    { status: "on_hold",   label: "On Hold" },
    { status: "completed", label: "Completed" },
    { status: "disputed",  label: "Disputed" },
  ];

  return (
    <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 480 }}>
      {columns.map(({ status, label }) => {
        const items = projects.filter(p => p.status === status);
        const meta = STATUS_META[status];
        return (
          <div key={status} className="flex-shrink-0 w-72">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>{label}</span>
              <span className="ml-auto text-xs bg-[var(--bg-muted)] rounded-full px-2 py-0.5" style={{ color: "var(--text-muted)" }}>{items.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {items.map(p => (
                <button
                  key={p.id}
                  onClick={() => onCardClick(p.id)}
                  className="card p-3 text-left w-full hover:shadow-[var(--shadow-md)] transition-shadow"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                      style={{ background: p.logoColor }}
                    >
                      {p.logoInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--text-primary)" }}>{p.name}</p>
                      <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{p.client}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold tabular-nums">{formatCurrency(p.contractValue)}</span>
                    <span style={{ color: p.margin >= 15 ? "var(--success)" : "var(--warning)" }}>
                      {p.margin.toFixed(1)}%
                    </span>
                  </div>
                </button>
              ))}
              {items.length === 0 && (
                <div className="rounded-[var(--radius)] border-2 border-dashed h-20 flex items-center justify-center text-xs" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                  No projects
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Commercial Dashboard ─────────────────────────────────────────────────────

function CommercialDashboard({ projects }: { projects: SeedProject[] }) {
  const totalTCV = projects.reduce((s, p) => s + p.contractValue, 0);
  const totalCert = projects.reduce((s, p) => s + p.certifiedToDate, 0);
  const avgMargin = projects.length > 0
    ? (projects.reduce((s, p) => s + p.margin, 0) / projects.length)
    : 0;
  const disputed = projects.filter(p => p.status === "disputed");

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="kpi-label">Total Contract Value</div>
          <div className="kpi-value">{formatCurrency(totalTCV)}</div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>{projects.length} projects</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Certified to Date</div>
          <div className="kpi-value">{formatCurrency(totalCert)}</div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>
            {totalTCV > 0 ? ((totalCert / totalTCV) * 100).toFixed(1) : 0}% of portfolio
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Avg CVR Margin</div>
          <div className="kpi-value" style={{ color: avgMargin >= 15 ? "var(--success)" : "var(--warning)" }}>
            {avgMargin.toFixed(1)}%
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Disputed Projects</div>
          <div className="kpi-value" style={{ color: disputed.length > 0 ? "var(--danger)" : "var(--text-primary)" }}>
            {disputed.length}
          </div>
          <div className="text-xs" style={{ color: "var(--danger)" }}>
            {disputed.length > 0 ? formatCurrency(disputed.reduce((s, p) => s + p.contractValue, 0)) : "None"}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Project Commercial Summary</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Client</th>
                <th className="text-right">Contract Value</th>
                <th className="text-right">Certified</th>
                <th className="text-right">Cert %</th>
                <th className="text-right">Margin</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(p => {
                const certPct = p.contractValue > 0 ? ((p.certifiedToDate / p.contractValue) * 100).toFixed(1) : "0.0";
                return (
                  <tr key={p.id}>
                    <td className="font-semibold">{p.name}</td>
                    <td className="text-sm" style={{ color: "var(--text-muted)" }}>{p.client}</td>
                    <td className="text-right tabular-nums font-semibold">{formatCurrency(p.contractValue)}</td>
                    <td className="text-right tabular-nums">{formatCurrency(p.certifiedToDate)}</td>
                    <td className="text-right tabular-nums font-semibold" style={{ color: "var(--text-secondary)" }}>{certPct}%</td>
                    <td
                      className="text-right tabular-nums font-bold"
                      style={{ color: p.margin >= 15 ? "var(--success)" : p.margin >= 10 ? "var(--warning)" : "var(--danger)" }}
                    >
                      {p.margin.toFixed(1)}%
                    </td>
                    <td><StatusChip status={p.status} /></td>
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

// ─── Loading / Empty ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="p-4 flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-12 rounded-[var(--radius)]" />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="card">
      <div className="empty-state">
        <div className="empty-icon"><FolderKanban size={22} /></div>
        <h3 className="text-base font-semibold">No projects yet</h3>
        <p className="text-sm max-w-xs" style={{ color: "var(--text-muted)" }}>
          Create your first project to start managing contracts, applications and commercial data.
        </p>
        <button onClick={onNew} className="btn btn-primary btn-sm mt-2">
          <Plus size={14} />Create First Project
        </button>
      </div>
    </div>
  );
}

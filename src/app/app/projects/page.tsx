"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Plus, Upload, Download, Filter, BookmarkPlus, Search,
  LayoutList, LayoutGrid, Columns3, BarChart3, Map,
  MoreHorizontal, ChevronRight, TrendingUp, TrendingDown,
  FolderKanban, Pencil, Eye, ArrowUpDown, Archive, MapPin,
  MessageSquare, FileText, X,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { SEED_PROJECTS, type SeedProject, type ProjectStatus } from "@/lib/seed/projects";
import { ProjectWizard } from "@/components/wizards/project-wizard";
import { FilterDrawer, type FilterState } from "@/components/ui/filter-drawer";

// â”€â”€â”€ Dynamic map import (no SSR) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const MapView = dynamic(() => import("@/components/projects/project-map-view"), { ssr: false });

// â”€â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type ViewMode = "table" | "cards" | "board" | "map" | "commercial";
type SortKey = "end_date_asc" | "value_desc" | "start_date_desc" | "name_asc";

// â”€â”€â”€ Status helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const STATUS_META: Record<
  ProjectStatus,
  { chip: string; label: string; color: string; dot: string }
> = {
  active:    { chip: "chip-success", label: "Active",    color: "var(--success)", dot: "#10B981" },
  on_hold:   { chip: "chip-warning", label: "On Hold",   color: "var(--warning)", dot: "#F59E0B" },
  completed: { chip: "chip-info",    label: "Completed", color: "var(--info)",    dot: "#06B6D4" },
  disputed:  { chip: "chip-danger",  label: "Disputed",  color: "var(--danger)",  dot: "#EF4444" },
  archived:  { chip: "chip-muted",   label: "Archived",  color: "var(--text-muted)", dot: "#94A3B8" },
};

function StatusChip({ status }: { status: ProjectStatus | string }) {
  const m = STATUS_META[status as ProjectStatus] ?? { chip: "chip-muted", label: String(status).replace(/_/g, " ") };
  return <span className={cn("badge", m.chip)}>{m.label}</span>;
}

// â”€â”€â”€ Avatar stack â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function AvatarStack({ names, max = 3 }: { names: string[]; max?: number }) {
  const shown = names.slice(0, max);
  const rest = names.length - max;
  const COLORS = ["#3B5EE8", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];
  return (
    <div className="flex items-center">
      {shown.map((name, i) => (
        <div
          key={name}
          title={name}
          className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0"
          style={{
            background: COLORS[i % COLORS.length],
            marginLeft: i > 0 ? -6 : 0,
            zIndex: shown.length - i,
            position: "relative",
          }}
        >
          {name.split(" ").map(n => n[0]).join("").slice(0, 2)}
        </div>
      ))}
      {rest > 0 && (
        <div
          className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold"
          style={{
            background: "var(--bg-muted)",
            color: "var(--text-muted)",
            marginLeft: -6,
            position: "relative",
          }}
        >
          +{rest}
        </div>
      )}
    </div>
  );
}

// â”€â”€â”€ CSV Export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function exportCsv(projects: SeedProject[]): void {
  const headers = ["Project Number", "Name", "Client", "Contract Type", "Contract Sum", "Start Date", "End Date", "Status", "Margin %"];
  const rows = projects.map(p => [
    p.ref,
    `"${p.name.replace(/"/g, '""')}"`,
    `"${p.client.replace(/"/g, '""')}"`,
    `"${p.contractType}"`,
    p.contractValue,
    p.startDate,
    p.endDate,
    p.status,
    (p.margin ?? 0).toFixed(2),
  ]);
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "projects-export.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// â”€â”€â”€ Sort helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function sortProjects(projects: SeedProject[], sort: SortKey): SeedProject[] {
  return [...projects].sort((a, b) => {
    if (sort === "end_date_asc")     return new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
    if (sort === "value_desc")       return b.contractValue - a.contractValue;
    if (sort === "start_date_desc")  return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
    if (sort === "name_asc")         return a.name.localeCompare(b.name);
    return 0;
  });
}

// â”€â”€â”€ Gradient helper per project â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function heroGradient(color: string): string {
  const darken = (hex: string): string => {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.max(0, (n >> 16) - 40);
    const g = Math.max(0, ((n >> 8) & 0xff) - 40);
    const b = Math.max(0, (n & 0xff) - 40);
    return `#${[r, g, b].map(v => v.toString(16).padStart(2, "0")).join("")}`;
  };
  return `linear-gradient(135deg, ${color} 0%, ${darken(color)} 100%)`;
}

// â”€â”€â”€ Open-change & next-app seed lookup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const OPEN_CHANGES: Record<string, number> = {
  "proj-001": 1, "proj-002": 0, "proj-003": 2, "proj-004": 0,
  "proj-005": 0, "proj-006": 1, "proj-007": 0,
};
const NEXT_APP: Record<string, string> = {
  "proj-001": "23 Jun", "proj-002": "14 Jul", "proj-003": "â€”",
  "proj-004": "30 Jun", "proj-005": "01 Jul", "proj-006": "â€”", "proj-007": "â€”",
};
const RISK_LABEL: Record<string, { label: string; chip: string }> = {
  "proj-001": { label: "Low",  chip: "chip-success" },
  "proj-002": { label: "Low",  chip: "chip-success" },
  "proj-003": { label: "High", chip: "chip-danger"  },
  "proj-004": { label: "Low",  chip: "chip-success" },
  "proj-005": { label: "Low",  chip: "chip-success" },
  "proj-006": { label: "Med",  chip: "chip-warning" },
  "proj-007": { label: "Low",  chip: "chip-success" },
};

// â”€â”€â”€ Portfolio KPIs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const PORTFOLIO_KPIS = {
  totalContractValue: 25_220_000,
  avgMarginPct: 14.1,
  certifiedToDate: 15_990_200,
  atRiskProjects: 2,
  nextApps30Days: 3,
};

// â”€â”€â”€ Inner page (needs useSearchParams) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ProjectsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = ((searchParams.get("view") as ViewMode) ?? "table") as ViewMode;

  const [projects, setProjects] = useState<SeedProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [pmFilter, setPmFilter] = useState("all");
  const [riskFilter, setRiskFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("end_date_asc");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [drawerFilters, setDrawerFilters] = useState<FilterState>({ statuses: [] });
  const menuRef = useRef<HTMLDivElement>(null);

  // â”€â”€â”€ Data load â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const loadProjects = useCallback(async () => {
    setLoading(true);
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
  }, []);

  useEffect(() => { void loadProjects(); }, [loadProjects]);

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

  // â”€â”€â”€ View navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function setView(v: ViewMode) {
    router.push(`/app/projects?view=${v}`);
  }

  // â”€â”€â”€ Filters â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const activeProjects = projects.filter(p => p.status !== "archived");

  const clients = Array.from(new Set(activeProjects.map(p => p.client))).sort();
  const leads   = Array.from(new Set(activeProjects.map(p => p.projectLead))).sort();

  const filtered = activeProjects.filter(p => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase()) ||
      p.ref.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    const matchClient = clientFilter === "all" || p.client === clientFilter;
    const matchPm     = pmFilter     === "all" || p.projectLead === pmFilter;
    const matchRisk   = riskFilter   === "all" || (RISK_LABEL[p.id]?.label ?? "Low").toLowerCase() === riskFilter;
    const matchDrawer =
      drawerFilters.statuses.length === 0 ||
      drawerFilters.statuses.map(s => s.toLowerCase()).includes(p.status);
    const matchDateFrom = !drawerFilters.dateFrom || new Date(p.startDate) >= new Date(drawerFilters.dateFrom);
    const matchDateTo   = !drawerFilters.dateTo   || new Date(p.startDate) <= new Date(drawerFilters.dateTo);
    return matchSearch && matchStatus && matchClient && matchPm && matchRisk && matchDrawer && matchDateFrom && matchDateTo;
  });

  const sorted = sortProjects(filtered, sortKey);

  const totalValue = activeProjects.reduce((s, p) => s + p.contractValue, 0);

  const hasActiveFilters =
    search || statusFilter !== "all" || clientFilter !== "all" ||
    pmFilter !== "all" || riskFilter !== "all" ||
    drawerFilters.statuses.length > 0;

  function clearFilters() {
    setSearch("");
    setStatusFilter("all");
    setClientFilter("all");
    setGroupFilter("all");
    setPmFilter("all");
    setRiskFilter("all");
    setDrawerFilters({ statuses: [] });
  }

  // â”€â”€â”€ View tab config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const VIEW_TABS: { mode: ViewMode; label: string; Icon: React.ElementType }[] = [
    { mode: "table",      label: "Table",      Icon: LayoutList },
    { mode: "cards",      label: "Cards",      Icon: LayoutGrid },
    { mode: "board",      label: "Board",      Icon: Columns3 },
    { mode: "map",        label: "Map",        Icon: Map },
    { mode: "commercial", label: "Commercial", Icon: BarChart3 },
  ];

  const allStatuses: ProjectStatus[] = ["active", "on_hold", "completed", "disputed"];

  return (
    <div className="flex flex-col min-h-full">
      {/* â”€â”€â”€ Page header â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Projects</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {activeProjects.filter(p => p.status === "active").length} active projects Â· {formatCurrency(totalValue)} total contract value
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn btn-primary btn-sm" onClick={() => setShowWizard(true)}>
            <Plus size={14} />New Project
          </button>
          <button className="btn btn-secondary btn-sm">
            <BookmarkPlus size={14} />Saved Views
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => exportCsv(sorted)}>
            <Download size={14} />Export
          </button>
          <button className="btn btn-secondary btn-sm">
            <Upload size={14} />Import
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setFilterDrawerOpen(true)}
          >
            <Filter size={14} />Filter
          </button>
        </div>
      </div>

      {/* â”€â”€â”€ View switcher tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="px-6 pt-4 flex items-end gap-0 border-b" style={{ borderColor: "var(--border)" }}>
        {VIEW_TABS.map(({ mode, label, Icon }) => (
          <button
            key={mode}
            onClick={() => setView(mode)}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px",
              view === mode
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            )}
          >
            <Icon size={14} />{label}
          </button>
        ))}
      </div>

      {/* â”€â”€â”€ Portfolio KPI strip (board view) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {view === "board" && (
        <div className="px-6 pt-4 grid grid-cols-5 gap-3">
          <div className="kpi-card">
            <div className="kpi-label">Total Contract Value</div>
            <div className="kpi-value" style={{ fontSize: 18 }}>
              {formatCurrency(PORTFOLIO_KPIS.totalContractValue)}
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Avg Portfolio Margin</div>
            <div className="kpi-value" style={{ fontSize: 18, color: "var(--success)" }}>
              {PORTFOLIO_KPIS.avgMarginPct}%
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Certified to Date</div>
            <div className="kpi-value" style={{ fontSize: 18 }}>
              {formatCurrency(PORTFOLIO_KPIS.certifiedToDate)}
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">At Risk Projects</div>
            <div className="kpi-value" style={{ fontSize: 18, color: "var(--danger)" }}>
              {PORTFOLIO_KPIS.atRiskProjects}
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Next Apps (30 Days)</div>
            <div className="kpi-value" style={{ fontSize: 18, color: "var(--primary)" }}>
              {PORTFOLIO_KPIS.nextApps30Days}
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€â”€ Filter toolbar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {view !== "map" && (
        <div className="px-6 pt-3 pb-2 flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              className="form-input h-8 text-sm pl-8 w-52"
              placeholder="Search projectsâ€¦"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {/* Status */}
          <select
            className="form-input h-8 text-sm w-36"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as ProjectStatus | "all")}
          >
            <option value="all">All Statuses</option>
            {allStatuses.map(s => (
              <option key={s} value={s}>{STATUS_META[s].label}</option>
            ))}
          </select>
          {/* Client */}
          <select
            className="form-input h-8 text-sm w-40"
            value={clientFilter}
            onChange={e => setClientFilter(e.target.value)}
          >
            <option value="all">All Clients</option>
            {clients.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {/* Group */}
          <select
            className="form-input h-8 text-sm w-36"
            value={groupFilter}
            onChange={e => setGroupFilter(e.target.value)}
          >
            <option value="all">All Groups</option>
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="public">Public Sector</option>
          </select>
          {/* PM/QS */}
          <select
            className="form-input h-8 text-sm w-40"
            value={pmFilter}
            onChange={e => setPmFilter(e.target.value)}
          >
            <option value="all">All PM/QS</option>
            {leads.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          {/* Risk */}
          <select
            className="form-input h-8 text-sm w-32"
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value)}
          >
            <option value="all">All Risk</option>
            <option value="low">Low</option>
            <option value="med">Medium</option>
            <option value="high">High</option>
          </select>
          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              className="flex items-center gap-1 text-xs font-medium btn btn-ghost"
              style={{ color: "var(--text-muted)", height: 32 }}
              onClick={clearFilters}
            >
              <X size={12} />Clear filters
            </button>
          )}
          {/* Sort */}
          <div className="flex items-center gap-1 ml-auto">
            <ArrowUpDown size={13} className="text-[var(--text-muted)]" />
            <select
              className="form-input h-8 text-sm w-48"
              value={sortKey}
              onChange={e => setSortKey(e.target.value as SortKey)}
            >
              <option value="end_date_asc">End Date (Earliest)</option>
              <option value="value_desc">Value (High to Low)</option>
              <option value="start_date_desc">Start Date (Newest)</option>
              <option value="name_asc">Name (A-Z)</option>
            </select>
          </div>
        </div>
      )}

      {/* â”€â”€â”€ Content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="page-content flex-1" ref={menuRef}>
        {loading ? (
          <LoadingSkeleton />
        ) : sorted.length === 0 && view !== "map" ? (
          <EmptyState onNew={() => setShowWizard(true)} />
        ) : (
          <>
            {view === "table" && (
              <TableView
                projects={sorted}
                onRowClick={id => router.push(`/app/projects/${id}`)}
                onEdit={id => router.push(`/app/projects/${id}/edit`)}
                openMenuId={openMenuId}
                setOpenMenuId={setOpenMenuId}
              />
            )}
            {view === "cards" && (
              <CardView
                projects={sorted}
                onOpen={id => router.push(`/app/projects/${id}`)}
              />
            )}
            {view === "board" && (
              <BoardView
                projects={sorted}
                onCardClick={id => router.push(`/app/projects/${id}`)}
              />
            )}
            {view === "map" && (
              <MapView
                projects={activeProjects}
                onProjectClick={id => router.push(`/app/projects/${id}`)}
              />
            )}
            {view === "commercial" && (
              <CommercialDashboard projects={sorted} />
            )}
          </>
        )}

        {/* Pagination footer */}
        {!loading && sorted.length > 0 && view !== "board" && view !== "map" && (
          <div className="mt-6 flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
            <span>Showing {sorted.length} of {activeProjects.length} projects</span>
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select className="form-input h-7 text-xs w-16">
                <option key="25">25</option>
                <option key="50">50</option>
                <option key="100">100</option>
              </select>
              <button className="btn btn-ghost btn-sm text-xs" disabled>Prev</button>
              <span className="px-2 py-0.5 rounded text-xs font-semibold" style={{ background: "var(--bg-muted)" }}>1</span>
              <button className="btn btn-ghost btn-sm text-xs" disabled>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* â”€â”€â”€ Filter Drawer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <FilterDrawer
        isOpen={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        onApply={(f: FilterState) => setDrawerFilters(f)}
        statusOptions={["Active", "On Hold", "Completed", "Disputed"]}
        showDateRange
        showValueRange={false}
      />

      {/* â”€â”€â”€ Project Wizard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {showWizard && (
        <ProjectWizard
          onClose={() => setShowWizard(false)}
          onSuccess={(_projectId: string) => {
            setShowWizard(false);
            void loadProjects();
          }}
        />
      )}
    </div>
  );
}

// â”€â”€â”€ Suspense wrapper (required for useSearchParams) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function ProjectsPage() {
  return (
    <Suspense fallback={<div className="page-content"><div className="skeleton h-96 rounded-xl" /></div>}>
      <ProjectsPageInner />
    </Suspense>
  );
}

// â”€â”€â”€ Table View â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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
                <tr key={p.id} className="cursor-pointer" onClick={() => onRowClick(p.id)}>
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
                    <span className={cn(
                      "font-semibold",
                      (p.margin ?? 0) >= 15 ? "text-[var(--success)]" :
                      (p.margin ?? 0) >= 10 ? "text-[var(--warning)]" : "text-[var(--danger)]"
                    )}>
                      {(p.margin ?? 0).toFixed(1)}%
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

// â”€â”€â”€ Premium Project Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ProjectCard({ project: p, onOpen }: { project: SeedProject; onOpen: () => void }) {
  const certPct = p.contractValue > 0 ? (p.certifiedToDate / p.contractValue) * 100 : 0;
  const risk = RISK_LABEL[p.id] ?? { label: "Low", chip: "chip-success" };
  const openChanges = OPEN_CHANGES[p.id] ?? 0;
  const nextApp = NEXT_APP[p.id] ?? "â€”";

  return (
    <div
      className="card overflow-hidden flex flex-col cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
      onClick={onOpen}
    >
      {/* Hero image / gradient */}
      <div
        className="h-40 relative overflow-hidden flex-shrink-0"
        style={{ background: heroGradient(p.logoColor) }}
      >
        {/* Initials avatar */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md"
            style={{ background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)", border: "1.5px solid rgba(255,255,255,0.35)" }}
          >
            {p.logoInitials}
          </div>
        </div>
        {/* Ref badge */}
        <div className="absolute top-2 right-2">
          <span
            className="text-[10px] font-mono font-semibold px-2 py-1 rounded-full"
            style={{ background: "rgba(0,0,0,0.45)", color: "white", letterSpacing: "0.04em" }}
          >
            {p.ref}
          </span>
        </div>
        {/* Location chip */}
        <div
          className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }}
        >
          <MapPin size={9} className="text-white opacity-80" />
          <span className="text-[10px] text-white font-medium">{p.postcode}</span>
        </div>
      </div>

      {/* Card body */}
      <div className="p-4 flex flex-col gap-2.5 flex-1">
        {/* Project name + client */}
        <div>
          <p className="font-semibold text-sm leading-snug" style={{ color: "var(--text-primary)" }}>{p.name}</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{p.client}</p>
        </div>

        {/* Contract value + margin */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Contract Value</p>
            <p className="text-base font-bold tabular-nums leading-tight" style={{ color: "var(--text-primary)" }}>
              {formatCurrency(p.contractValue)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Margin</p>
            <p
              className="text-base font-bold tabular-nums leading-tight flex items-center gap-0.5"
              style={{
                color: (p.margin ?? 0) >= 15 ? "var(--success)" :
                       (p.margin ?? 0) >= 10 ? "var(--warning)" : "var(--danger)",
              }}
            >
              {(p.margin ?? 0) >= 10
                ? <TrendingUp size={12} />
                : <TrendingDown size={12} />}
              {(p.margin ?? 0).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Certified progress bar */}
        <div>
          <div className="flex justify-between text-[10px] mb-1" style={{ color: "var(--text-muted)" }}>
            <span className="font-medium">Certified</span>
            <span className="font-semibold">{certPct.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(certPct, 100)}%`,
                background: certPct >= 80 ? "var(--success)" : "var(--primary)",
              }}
            />
          </div>
        </div>

        {/* Status, risk, changes, next app */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <StatusChip status={p.status} />
          <span className={cn("badge", risk.chip)}>{risk.label}</span>
          {openChanges > 0 && (
            <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>
              {openChanges} change{openChanges !== 1 ? "s" : ""}
            </span>
          )}
          {nextApp !== "â€”" && (
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ background: "var(--bg-muted)", color: "var(--text-secondary)" }}
            >
              App: {nextApp}
            </span>
          )}
        </div>

        {/* Team avatars + open button */}
        <div className="flex items-center justify-between mt-auto pt-1">
          <AvatarStack names={p.team} max={3} />
          <button
            className="btn btn-secondary btn-sm text-xs flex items-center gap-1"
            onClick={e => { e.stopPropagation(); onOpen(); }}
          >
            Open Project <ChevronRight size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

// â”€â”€â”€ Card View â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function CardView({ projects, onOpen }: { projects: SeedProject[]; onOpen: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {projects.map(p => (
        <ProjectCard key={p.id} project={p} onOpen={() => onOpen(p.id)} />
      ))}
    </div>
  );
}

// â”€â”€â”€ Board Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function BoardCard({ project: p, onClick }: { project: SeedProject; onClick: () => void }) {
  const certPct = p.contractValue > 0 ? (p.certifiedToDate / p.contractValue) * 100 : 0;
  const risk = RISK_LABEL[p.id] ?? { label: "Low", chip: "chip-success" };
  const nextApp = NEXT_APP[p.id] ?? "â€”";

  return (
    <button
      onClick={onClick}
      className="card p-3 text-left w-full hover:shadow-md transition-all hover:-translate-y-0.5 flex flex-col gap-2"
    >
      {/* Hero strip */}
      <div
        className="h-20 rounded-lg relative overflow-hidden"
        style={{ background: heroGradient(p.logoColor) }}
      >
        <div className="absolute top-1.5 left-1.5">
          <span
            className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-full"
            style={{ background: "rgba(0,0,0,0.45)", color: "white" }}
          >
            {p.ref}
          </span>
        </div>
        <div
          className="absolute bottom-1.5 left-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full"
          style={{ background: "rgba(0,0,0,0.4)" }}
        >
          <span className="text-[9px] text-white font-bold">{p.logoInitials}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-semibold leading-snug text-left" style={{ color: "var(--text-primary)" }}>{p.name}</p>
        <p className="text-xs text-left" style={{ color: "var(--text-muted)" }}>{p.client}</p>

        <div className="flex items-center justify-between text-xs">
          <span className="font-bold tabular-nums">{formatCurrency(p.contractValue)}</span>
          <span
            className="font-bold"
            style={{
              color: (p.margin ?? 0) >= 15 ? "var(--success)" :
                     (p.margin ?? 0) >= 10 ? "var(--warning)" : "var(--danger)",
            }}
          >
            {(p.margin ?? 0).toFixed(1)}%
          </span>
        </div>

        {/* Cert bar */}
        <div>
          <div className="flex justify-between text-[10px] mb-0.5" style={{ color: "var(--text-muted)" }}>
            <span>Cert.</span><span>{certPct.toFixed(0)}%</span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(certPct, 100)}%`,
                background: certPct >= 80 ? "var(--success)" : "var(--primary)",
              }}
            />
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex items-center justify-between mt-0.5">
          <div className="flex items-center gap-1">
            <span className={cn("badge text-[9px]", risk.chip)}>{risk.label}</span>
            {nextApp !== "â€”" && (
              <span className="text-[9px] font-medium" style={{ color: "var(--text-muted)" }}>App: {nextApp}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              onClick={e => e.stopPropagation()}
              title="Comments"
            >
              <MessageSquare size={11} />
            </button>
            <button
              className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              onClick={e => e.stopPropagation()}
              title="Documents"
            >
              <FileText size={11} />
            </button>
            <button
              className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              onClick={e => e.stopPropagation()}
              title="More"
            >
              <MoreHorizontal size={11} />
            </button>
          </div>
        </div>
      </div>
    </button>
  );
}

// â”€â”€â”€ Board View â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type BoardStatus = "pre_construction" | "active" | "on_hold" | "disputed" | "completed";

const BOARD_COLUMNS: { status: BoardStatus; label: string; color: string }[] = [
  { status: "pre_construction", label: "Pre-Construction", color: "#8B5CF6" },
  { status: "active",           label: "Active",           color: "#10B981" },
  { status: "on_hold",          label: "On Hold",          color: "#F59E0B" },
  { status: "disputed",         label: "Disputed",         color: "#EF4444" },
  { status: "completed",        label: "Completed",        color: "#06B6D4" },
];

function BoardView({ projects, onCardClick }: { projects: SeedProject[]; onCardClick: (id: string) => void }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 520 }}>
      {BOARD_COLUMNS.map(col => {
        const items = projects.filter(p =>
          col.status === "pre_construction"
            ? (p.status as string) === "pre_construction"
            : p.status === col.status
        );
        const colValue = items.reduce((s, p) => s + p.contractValue, 0);
        return (
          <div key={col.status} className="flex-shrink-0 w-72 flex flex-col gap-3">
            {/* Column header */}
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
              style={{ background: "var(--bg-muted)" }}
            >
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: col.color }} />
              <span className="text-xs font-semibold uppercase tracking-wider flex-1" style={{ color: "var(--text-secondary)" }}>
                {col.label}
              </span>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: "white", color: "var(--text-secondary)" }}
              >
                {items.length}
              </span>
              {items.length > 0 && (
                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  Â£{(colValue / 1_000_000).toFixed(1)}m
                </span>
              )}
            </div>
            {/* Cards */}
            <div className="flex flex-col gap-2">
              {items.map(p => (
                <BoardCard key={p.id} project={p} onClick={() => onCardClick(p.id)} />
              ))}
              {items.length === 0 && (
                <div
                  className="rounded-xl border-2 border-dashed h-24 flex items-center justify-center text-xs"
                  style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                >
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

// â”€â”€â”€ Commercial Dashboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function CommercialDashboard({ projects }: { projects: SeedProject[] }) {
  const totalTCV  = projects.reduce((s, p) => s + p.contractValue, 0);
  const totalCert = projects.reduce((s, p) => s + p.certifiedToDate, 0);
  const avgMargin = projects.length > 0
    ? projects.reduce((s, p) => s + p.margin, 0) / projects.length
    : 0;
  const disputed  = projects.filter(p => p.status === "disputed");

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
          <div
            className="kpi-value"
            style={{ color: avgMargin >= 15 ? "var(--success)" : "var(--warning)" }}
          >
            {avgMargin.toFixed(1)}%
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Disputed Projects</div>
          <div
            className="kpi-value"
            style={{ color: disputed.length > 0 ? "var(--danger)" : "var(--text-primary)" }}
          >
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
                const certPct = p.contractValue > 0
                  ? ((p.certifiedToDate / p.contractValue) * 100).toFixed(1)
                  : "0.0";
                return (
                  <tr key={p.id}>
                    <td className="font-semibold">{p.name}</td>
                    <td className="text-sm" style={{ color: "var(--text-muted)" }}>{p.client}</td>
                    <td className="text-right tabular-nums font-semibold">{formatCurrency(p.contractValue)}</td>
                    <td className="text-right tabular-nums">{formatCurrency(p.certifiedToDate)}</td>
                    <td className="text-right tabular-nums font-semibold" style={{ color: "var(--text-secondary)" }}>{certPct}%</td>
                    <td
                      className="text-right tabular-nums font-bold"
                      style={{
                        color: (p.margin ?? 0) >= 15 ? "var(--success)" :
                               (p.margin ?? 0) >= 10 ? "var(--warning)" : "var(--danger)",
                      }}
                    >
                      {(p.margin ?? 0).toFixed(1)}%
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

// â”€â”€â”€ Loading / Empty â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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



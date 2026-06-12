"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Download, Filter, BookmarkPlus, Search,
  LayoutGrid, Settings2, Clock, History, Sparkles,
  FileText, BarChart3, FileCheck, FolderKanban, Eye,
  Copy, Calendar, ChevronRight, MoreHorizontal, RefreshCw,
  Share2, Loader2,
} from "lucide-react";
import { cn, formatDate, formatRelative } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { SEED_REPORTS } from "@/lib/seed/reports";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportType =
  | "CVR Report"
  | "Application Summary"
  | "Change Register"
  | "Final Account Summary"
  | "Evidence Pack"
  | "Commercial Dashboard"
  | "Project Status Report"
  | "Custom";

type ReportStatus = "draft" | "generating" | "final" | "archived" | "generated" | "exported" | "shared" | "scheduled";
type ViewMode = "library" | "builder" | "scheduled" | "history";

interface Report {
  id: string;
  title: string;
  type: ReportType;
  // Supports both seed shape and DB shape
  project?: string;
  project_id?: string;
  projectName?: string | null;
  projectId?: string | null;
  status: ReportStatus;
  generatedAt?: string;
  createdAt?: string;
  generatedDate?: string;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const REPORTS_SEED: Report[] = SEED_REPORTS.map(r => ({
  id: r.id,
  title: r.title,
  type: r.type as ReportType,
  projectName: r.projectName,
  projectId: r.projectId,
  project: r.projectName ?? "All Projects",
  project_id: r.projectId ?? "",
  status: r.status as ReportStatus,
  generatedAt: r.generatedDate,
  createdAt: r.generatedDate,
  generatedDate: r.generatedDate,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_META: Record<ReportType, { icon: React.ReactNode; chip: string }> = {
  "CVR Report":              { icon: <BarChart3 size={14} />,   chip: "chip-primary" },
  "Application Summary":     { icon: <FileCheck size={14} />,   chip: "chip-success" },
  "Change Register":         { icon: <FileText size={14} />,    chip: "chip-warning" },
  "Final Account Summary":   { icon: <FileCheck size={14} />,   chip: "chip-info" },
  "Evidence Pack":           { icon: <FolderKanban size={14} />,chip: "chip-muted" },
  "Commercial Dashboard":    { icon: <BarChart3 size={14} />,   chip: "chip-violet" },
  "Project Status Report":   { icon: <FileText size={14} />,    chip: "chip-info" },
  "Custom":                  { icon: <Settings2 size={14} />,   chip: "chip-muted" },
};

const STATUS_META: Record<string, { chip: string; label: string }> = {
  draft:      { chip: "chip-muted",    label: "Draft" },
  generating: { chip: "chip-warning",  label: "Generating" },
  final:      { chip: "chip-success",  label: "Final" },
  archived:   { chip: "chip-muted",    label: "Archived" },
  generated:  { chip: "chip-info",     label: "Generated" },
  exported:   { chip: "chip-success",  label: "Exported" },
  shared:     { chip: "chip-violet",   label: "Shared" },
  scheduled:  { chip: "chip-warning",  label: "Scheduled" },
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("library");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<ReportType | "all">("all");

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
        setReports(data && data.length > 0 ? (data as Report[]) : REPORTS_SEED);
      } catch {
        setReports(REPORTS_SEED);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = reports.filter(r => {
    const proj = r.project ?? r.projectName ?? "";
    const matchSearch = !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      proj.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || r.type === typeFilter;
    return matchSearch && matchType;
  });

  const VIEW_TABS: { mode: ViewMode; label: string; Icon: React.ElementType }[] = [
    { mode: "library",   label: "Report Library",    Icon: LayoutGrid },
    { mode: "builder",   label: "Report Builder",    Icon: Settings2 },
    { mode: "scheduled", label: "Scheduled Reports", Icon: Clock },
    { mode: "history",   label: "Export History",    Icon: History },
  ];

  const allTypes: ReportType[] = [
    "CVR Report", "Application Summary", "Change Register",
    "Final Account Summary", "Evidence Pack", "Commercial Dashboard", "Custom",
  ];

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Reports</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {reports.length} reports · Generate, export and share commercial reports
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn btn-secondary btn-sm"><Download size={14} />Export PDF</button>
          <button className="btn btn-secondary btn-sm"><Download size={14} />Export Excel</button>
          <button className="btn btn-secondary btn-sm"><Share2 size={14} />Share Secure Link</button>
          <button className="btn btn-secondary btn-sm"><Calendar size={14} />Schedule Report</button>
          <button className="btn btn-secondary btn-sm" style={{ color: "var(--violet)" }}>
            <Sparkles size={14} />AI Generate
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => router.push("/app/reports/new")}>
            <Plus size={14} />New Report
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
        {view === "library" && (
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
              <input
                className="form-input h-8 text-sm pl-8 w-52"
                placeholder="Search reports…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="form-input h-8 text-sm w-48"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value as ReportType | "all")}
            >
              <option value="all">All Types</option>
              {allTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="page-content flex-1 pt-4">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-40 rounded-[var(--radius)]" />
            ))}
          </div>
        ) : (
          <>
            {view === "library" && (
              <LibraryView reports={filtered} onOpen={id => router.push(`/app/reports/${id}`)} />
            )}
            {view === "builder" && <ReportBuilder />}
            {view === "scheduled" && <ScheduledView />}
            {view === "history" && <HistoryView reports={reports} />}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Library View ─────────────────────────────────────────────────────────────

function LibraryView({ reports, onOpen }: { reports: Report[]; onOpen: (id: string) => void }) {
  if (reports.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-icon"><FileText size={22} /></div>
          <h3 className="text-base font-semibold">No reports yet</h3>
          <p className="text-sm max-w-xs" style={{ color: "var(--text-muted)" }}>
            Generate your first report to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {reports.map(r => {
        const typeMeta = TYPE_META[r.type] ?? { icon: <FileText size={14} />, chip: "chip-muted" };
        const statusMeta = STATUS_META[r.status];
        return (
          <div
            key={r.id}
            className="card overflow-hidden flex flex-col hover:shadow-[var(--shadow-md)] transition-shadow group cursor-pointer"
            onClick={() => onOpen(r.id)}
          >
            {/* Thumbnail */}
            <div
              className="h-28 flex items-center justify-center"
              style={{ background: "var(--bg-subtle)" }}
            >
              <div className="text-[var(--primary)] opacity-30">
                {typeMeta.icon}
              </div>
              <div
                className="w-16 h-20 rounded-lg shadow-[var(--shadow-sm)] flex items-center justify-center"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
              >
                <FileText size={20} style={{ color: "var(--primary)", opacity: 0.6 }} />
              </div>
            </div>
            <div className="p-4 flex flex-col gap-2 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className={cn("badge text-[10px]", typeMeta.chip)}>{r.type}</span>
                <span className={cn("badge text-[10px]", statusMeta.chip)}>{statusMeta.label}</span>
              </div>
              <p className="text-sm font-semibold leading-tight" style={{ color: "var(--text-primary)" }}>{r.title}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>{r.project ?? r.projectName ?? "All Projects"}</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Generated {formatDate(r.generatedAt ?? r.generatedDate)}</p>
              {/* Hover actions */}
              <div className="flex gap-1 mt-auto pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="btn btn-secondary btn-sm flex-1 text-xs"
                  onClick={e => { e.stopPropagation(); onOpen(r.id); }}
                >
                  <Eye size={11} />Open
                </button>
                <button
                  className="btn btn-secondary btn-sm text-xs"
                  onClick={e => e.stopPropagation()}
                >
                  <Download size={11} />
                </button>
                <button
                  className="btn btn-secondary btn-sm text-xs"
                  onClick={e => e.stopPropagation()}
                >
                  <Copy size={11} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Report Builder ───────────────────────────────────────────────────────────

function ReportBuilder() {
  const [reportType, setReportType] = useState<ReportType>("CVR Report");
  const [projectId, setProjectId] = useState("proj-001");
  const [generating, setGenerating] = useState(false);

  const sections: Record<ReportType, string[]> = {
    "CVR Report":              ["Executive Summary", "Cost vs Value Analysis", "Margin Trend", "Risk Register", "Forecast"],
    "Application Summary":     ["Application Details", "Cumulative Position", "Previous Certified", "Net Due"],
    "Change Register":         ["Change Summary", "Variations Table", "Claims Status", "Evidence Health"],
    "Final Account Summary":   ["Reconciliation", "Agreed Variations", "Claims", "Retention", "Balance Due"],
    "Evidence Pack":           ["Evidence Index", "Linked Documents", "Photo Register", "Unlinked Files"],
    "Commercial Dashboard":    ["Portfolio KPIs", "CVR Margins", "Payment Status", "Risk Alerts"],
    "Project Status Report":   ["Programme Summary", "Key Milestones", "Risk & Issues", "Financial Snapshot"],
    "Custom":                  ["Cover Page", "Executive Summary", "Custom Section 1"],
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: config */}
      <div className="lg:col-span-1 flex flex-col gap-4">
        <div className="card p-5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Report Configuration</h3>
          <div>
            <label className="form-label">Report Type</label>
            <select className="form-input" value={reportType} onChange={e => setReportType(e.target.value as ReportType)}>
              {(Object.keys(sections) as ReportType[]).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Project</label>
            <select className="form-input" value={projectId} onChange={e => setProjectId(e.target.value)}>
              <option value="proj-001">Eastside Residential Block A</option>
              <option value="proj-002">Meridian Office Park Phase 2</option>
              <option value="proj-003">Thornfield Commercial Hub</option>
              <option value="">All Projects</option>
            </select>
          </div>
          <div>
            <label className="form-label">Date Range</label>
            <select className="form-input">
              <option>Current Period</option>
              <option>Last 3 Months</option>
              <option>Last 6 Months</option>
              <option>Full Project</option>
            </select>
          </div>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setGenerating(true)}
            disabled={generating}
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {generating ? "Generating…" : "Generate Report"}
          </button>
        </div>
      </div>

      {/* Right: sections */}
      <div className="lg:col-span-2 card p-5">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Report Sections</h3>
        <div className="flex flex-col gap-2">
          {sections[reportType].map((section, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl cursor-grab"
              style={{ background: "var(--bg-subtle)" }}
            >
              <div className="flex items-center gap-3">
                <div className="w-1 h-5 rounded-full" style={{ background: "var(--primary)" }} />
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{section}</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" defaultChecked className="w-3.5 h-3.5" />
                <button className="btn btn-ghost btn-icon btn-sm"><MoreHorizontal size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Scheduled Reports ────────────────────────────────────────────────────────

function ScheduledView() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Automated report schedules</p>
        <button className="btn btn-primary btn-sm"><Plus size={13} />Schedule Report</button>
      </div>
      <div className="card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Report</th>
              <th>Type</th>
              <th>Frequency</th>
              <th>Next Run</th>
              <th>Recipients</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {[
              { title: "Monthly CVR Report – Eastside", type: "CVR Report",          freq: "Monthly (1st)", next: "2026-07-01", recipients: 3, active: true },
              { title: "Weekly Application Summary",    type: "Application Summary",  freq: "Weekly (Mon)",  next: "2026-06-15", recipients: 2, active: true },
              { title: "Quarterly Dashboard",           type: "Commercial Dashboard", freq: "Quarterly",     next: "2026-10-01", recipients: 5, active: false },
            ].map((s, i) => (
              <tr key={i}>
                <td className="font-semibold">{s.title}</td>
                <td><span className={cn("badge", TYPE_META[s.type as ReportType]?.chip ?? "chip-muted")}>{s.type}</span></td>
                <td className="text-xs" style={{ color: "var(--text-secondary)" }}>{s.freq}</td>
                <td className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(s.next)}</td>
                <td className="text-xs" style={{ color: "var(--text-muted)" }}>{s.recipients} recipients</td>
                <td><span className={cn("badge", s.active ? "chip-success" : "chip-muted")}>{s.active ? "Active" : "Paused"}</span></td>
                <td><button className="btn btn-ghost btn-icon btn-sm"><MoreHorizontal size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Export History ───────────────────────────────────────────────────────────

function HistoryView({ reports }: { reports: Report[] }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>All past exports and generated reports</p>
      <div className="card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Report</th>
              <th>Type</th>
              <th>Project</th>
              <th>Format</th>
              <th>Generated</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {reports.slice(0, 10).map(r => (
              <tr key={r.id}>
                <td className="font-medium">{r.title}</td>
                <td><span className={cn("badge", TYPE_META[r.type]?.chip ?? "chip-muted")}>{r.type}</span></td>
                <td className="text-xs" style={{ color: "var(--text-muted)" }}>{r.project ?? r.projectName ?? "All Projects"}</td>
                <td><span className="badge chip-muted">PDF</span></td>
                <td className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(r.generatedAt ?? r.generatedDate)}</td>
                <td><span className={cn("badge", STATUS_META[r.status].chip)}>{STATUS_META[r.status].label}</span></td>
                <td>
                  <div className="flex gap-1">
                    <button className="btn btn-ghost btn-icon btn-sm"><Download size={13} /></button>
                    <button className="btn btn-ghost btn-icon btn-sm"><Share2 size={13} /></button>
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

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Download, Filter, BookmarkPlus, LayoutList, LayoutGrid,
  CreditCard, Calendar, Layers, MoreHorizontal, ChevronDown,
  FileText, CheckCircle2, DollarSign, AlertTriangle,
  Building2, ArrowRight,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { ApplicationWizard } from "@/components/wizards/application-wizard";

// ─── Types ────────────────────────────────────────────────────────────────────

type AppStatus = "Draft" | "Submitted" | "Certified" | "Paid" | "Disputed" | "Withdrawn";

interface Application {
  id: string;
  ref: string;
  app_number: number;
  project: string;
  project_id: string;
  gross_value: number;
  deductions: number;
  net_certified: number;
  status: AppStatus;
  submission_date: string | null;
  due_date: string | null;
  created_at: string;
}

// ─── Placeholder data ─────────────────────────────────────────────────────────

const PLACEHOLDER: Application[] = [
  { id: "app1", ref: "APP-001", app_number: 1, project: "The Arc Tower, Birmingham", project_id: "p1", gross_value: 320000, deductions: 32000, net_certified: 288000, status: "Paid", submission_date: "2025-07-31", due_date: "2025-08-28", created_at: "2025-07-28" },
  { id: "app2", ref: "APP-002", app_number: 2, project: "The Arc Tower, Birmingham", project_id: "p1", gross_value: 485000, deductions: 48500, net_certified: 436500, status: "Paid", submission_date: "2025-08-31", due_date: "2025-09-28", created_at: "2025-08-28" },
  { id: "app3", ref: "APP-003", app_number: 3, project: "The Arc Tower, Birmingham", project_id: "p1", gross_value: 714000, deductions: 71400, net_certified: 642600, status: "Certified", submission_date: "2025-09-30", due_date: "2025-10-28", created_at: "2025-09-27" },
  { id: "app4", ref: "APP-004", app_number: 4, project: "The Arc Tower, Birmingham", project_id: "p1", gross_value: 910000, deductions: 91000, net_certified: 819000, status: "Certified", submission_date: "2025-10-31", due_date: "2025-11-28", created_at: "2025-10-28" },
  { id: "app5", ref: "APP-005", app_number: 5, project: "The Arc Tower, Birmingham", project_id: "p1", gross_value: 1245000, deductions: 0, net_certified: 0, status: "Submitted", submission_date: "2025-11-30", due_date: "2025-12-28", created_at: "2025-11-28" },
  { id: "app6", ref: "APP-006", app_number: 1, project: "Granary Wharf Offices", project_id: "p2", gross_value: 185000, deductions: 18500, net_certified: 166500, status: "Paid", submission_date: "2025-09-30", due_date: "2025-10-28", created_at: "2025-09-27" },
  { id: "app7", ref: "APP-007", app_number: 2, project: "Granary Wharf Offices", project_id: "p2", gross_value: 362000, deductions: 36200, net_certified: 325800, status: "Disputed", submission_date: "2025-10-31", due_date: "2025-11-28", created_at: "2025-10-28" },
  { id: "app8", ref: "APP-008", app_number: 1, project: "Riverside Apartments Ph2", project_id: "p3", gross_value: 98000, deductions: 9800, net_certified: 88200, status: "Certified", submission_date: "2025-11-14", due_date: "2025-12-12", created_at: "2025-11-12" },
  { id: "app9", ref: "APP-009", app_number: 1, project: "Station Square Retail", project_id: "p4", gross_value: 54000, deductions: 0, net_certified: 0, status: "Draft", submission_date: null, due_date: "2025-12-31", created_at: "2025-11-25" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_META: Record<AppStatus, { chip: string }> = {
  Draft:     { chip: "chip-muted" },
  Submitted: { chip: "chip-info" },
  Certified: { chip: "chip-warning" },
  Paid:      { chip: "chip-success" },
  Disputed:  { chip: "chip-danger" },
  Withdrawn: { chip: "chip-muted" },
};

const ALL_STATUSES: AppStatus[] = ["Draft", "Submitted", "Certified", "Paid", "Disputed", "Withdrawn"];

function StatusChip({ status }: { status: AppStatus }) {
  return <span className={cn("badge", STATUS_META[status].chip)}>{status}</span>;
}

type ViewMode = "table" | "card" | "payment" | "dates" | "grouped";

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppStatus | "All">("All");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase.from("applications").select("*").order("created_at", { ascending: false });
        setApplications(data && data.length > 0 ? data : PLACEHOLDER);
      } catch {
        setApplications(PLACEHOLDER);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = applications.filter(a => {
    const matchSearch = !search || a.ref.toLowerCase().includes(search.toLowerCase()) || a.project.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalGross = filtered.reduce((s, a) => s + a.gross_value, 0);
  const totalCertified = filtered.reduce((s, a) => s + a.net_certified, 0);
  const outstanding = filtered.filter(a => a.status === "Submitted" || a.status === "Certified").reduce((s, a) => s + a.gross_value, 0);
  const disputed = filtered.filter(a => a.status === "Disputed").reduce((s, a) => s + a.gross_value, 0);

  const toggleSelect = (id: string) => setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const VIEW_TABS: { mode: ViewMode; label: string; Icon: React.ElementType }[] = [
    { mode: "table",   label: "Table",           Icon: LayoutList },
    { mode: "card",    label: "Cards",           Icon: LayoutGrid },
    { mode: "payment", label: "Payment Status",  Icon: CreditCard },
    { mode: "dates",   label: "Due Dates",       Icon: Calendar },
    { mode: "grouped", label: "By Project",      Icon: Layers },
  ];

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Payment Applications</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Interim applications, certifications and payment records</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn btn-secondary btn-sm"><Download size={14} />Export</button>
          <button className="btn btn-secondary btn-sm"><Filter size={14} />Filter</button>
          <button className="btn btn-secondary btn-sm"><BookmarkPlus size={14} />Saved Views</button>
          {selectedIds.size > 0 && (
            <>
              <button className="btn btn-secondary btn-sm"><CheckCircle2 size={14} />Mark Submitted ({selectedIds.size})</button>
              <button className="btn btn-secondary btn-sm"><CreditCard size={14} />Record Certification</button>
              <button className="btn btn-secondary btn-sm"><DollarSign size={14} />Record Payment</button>
            </>
          )}
          <button className="btn btn-primary btn-sm" onClick={() => setShowWizard(true)}><Plus size={14} />New Application</button>
          <button className="btn btn-secondary btn-sm gap-1.5">Open Builder <ChevronDown size={13} /></button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="px-6 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="kpi-card">
          <div className="kpi-label">Total Gross Applied</div>
          <div className="kpi-value">{formatCurrency(totalGross)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Net Certified</div>
          <div className="kpi-value text-[var(--success)]">{formatCurrency(totalCertified)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Awaiting Certification</div>
          <div className="kpi-value text-[var(--warning)]">{formatCurrency(outstanding)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Disputed</div>
          <div className="kpi-value text-[var(--danger)]">{formatCurrency(disputed)}</div>
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
          <input className="form-input h-8 text-sm w-52" placeholder="Search applications…" value={search} onChange={e => setSearch(e.target.value)} />
          <select className="form-input h-8 text-sm w-40" value={statusFilter} onChange={e => setStatusFilter(e.target.value as AppStatus | "All")}>
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
          <EmptyState />
        ) : (
          <>
            {view === "table"   && <TableView   apps={filtered} selectedIds={selectedIds} onToggle={toggleSelect} onRowClick={id => router.push(`/applications/${id}`)} />}
            {view === "card"    && <CardView    apps={filtered} onCardClick={id => router.push(`/applications/${id}`)} />}
            {view === "payment" && <PaymentStatusView apps={filtered} onCardClick={id => router.push(`/applications/${id}`)} />}
            {view === "dates"   && <DueDatesView apps={filtered} onRowClick={id => router.push(`/applications/${id}`)} />}
            {view === "grouped" && <GroupedView  apps={filtered} onRowClick={id => router.push(`/applications/${id}`)} />}
          </>
        )}
      </div>

      {showWizard && (
        <ApplicationWizard
          onClose={() => setShowWizard(false)}
          onSuccess={(_id: string) => setShowWizard(false)}
        />
      )}
    </div>
  );
}

// ─── Table View ───────────────────────────────────────────────────────────────

function TableView({ apps, selectedIds, onToggle, onRowClick }: {
  apps: Application[];
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
              <th>No.</th>
              <th>Project</th>
              <th className="text-right">Gross Value</th>
              <th className="text-right">Deductions</th>
              <th className="text-right">Net Certified</th>
              <th>Status</th>
              <th>Submission</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {apps.map(a => (
              <tr key={a.id} className="cursor-pointer" onClick={() => onRowClick(a.id)}>
                <td onClick={e => { e.stopPropagation(); onToggle(a.id); }}>
                  <input type="checkbox" className="w-3.5 h-3.5" checked={selectedIds.has(a.id)} onChange={() => {}} />
                </td>
                <td className="font-mono text-xs font-semibold text-[var(--primary)]">{a.ref}</td>
                <td className="text-sm font-semibold">#{a.app_number}</td>
                <td className="text-xs text-[var(--text-secondary)]">{a.project}</td>
                <td className="text-right tabular-nums font-semibold">{formatCurrency(a.gross_value)}</td>
                <td className="text-right tabular-nums text-[var(--danger)]">{a.deductions > 0 ? `(${formatCurrency(a.deductions)})` : "—"}</td>
                <td className="text-right tabular-nums font-semibold text-[var(--success)]">{a.net_certified > 0 ? formatCurrency(a.net_certified) : "—"}</td>
                <td><StatusChip status={a.status} /></td>
                <td className="text-xs text-[var(--text-muted)]">{formatDate(a.submission_date)}</td>
                <td onClick={e => e.stopPropagation()}>
                  <button className="btn btn-ghost btn-icon btn-sm"><MoreHorizontal size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[var(--bg-subtle)]">
              <td colSpan={4} className="px-3.5 py-2.5 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">Totals ({apps.length})</td>
              <td className="px-3.5 py-2.5 text-right tabular-nums font-bold">{formatCurrency(apps.reduce((s, a) => s + a.gross_value, 0))}</td>
              <td className="px-3.5 py-2.5 text-right tabular-nums font-bold text-[var(--danger)]">({formatCurrency(apps.reduce((s, a) => s + a.deductions, 0))})</td>
              <td className="px-3.5 py-2.5 text-right tabular-nums font-bold text-[var(--success)]">{formatCurrency(apps.reduce((s, a) => s + a.net_certified, 0))}</td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ─── Card View ────────────────────────────────────────────────────────────────

function CardView({ apps, onCardClick }: { apps: Application[]; onCardClick: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {apps.map(a => (
        <button key={a.id} onClick={() => onCardClick(a.id)} className="card p-4 text-left hover:shadow-md transition-shadow flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <span className="font-mono text-xs font-semibold text-[var(--primary)]">{a.ref}</span>
            <StatusChip status={a.status} />
          </div>
          <div className="text-sm font-semibold">Application #{a.app_number}</div>
          <div className="text-xs text-[var(--text-muted)]">{a.project}</div>
          <div className="border-t border-[var(--border)] pt-3 flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)]">Gross Applied</span>
              <span className="font-semibold tabular-nums">{formatCurrency(a.gross_value)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--text-muted)]">Net Certified</span>
              <span className={cn("font-semibold tabular-nums", a.net_certified > 0 ? "text-[var(--success)]" : "text-[var(--text-muted)]")}>{a.net_certified > 0 ? formatCurrency(a.net_certified) : "—"}</span>
            </div>
          </div>
          {a.due_date && (
            <div className="text-xs text-[var(--text-muted)] flex items-center gap-1.5"><Calendar size={11} />Due {formatDate(a.due_date)}</div>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Payment Status View ──────────────────────────────────────────────────────

function PaymentStatusView({ apps, onCardClick }: { apps: Application[]; onCardClick: (id: string) => void }) {
  const projects = Array.from(new Set(apps.map(a => a.project)));

  const PROJECT_STATS = projects.map(project => {
    const projectApps = apps.filter(a => a.project === project);
    const totalApplied = projectApps.reduce((s, a) => s + a.gross_value, 0);
    const totalCertified = projectApps.reduce((s, a) => s + a.net_certified, 0);
    const totalPaid = projectApps.filter(a => a.status === "Paid").reduce((s, a) => s + a.net_certified, 0);
    const certPct = totalApplied > 0 ? (totalCertified / totalApplied) * 100 : 0;
    const payPct = totalCertified > 0 ? (totalPaid / totalCertified) * 100 : 0;
    return { project, projectApps, totalApplied, totalCertified, totalPaid, certPct, payPct };
  });

  return (
    <div className="flex flex-col gap-6">
      {PROJECT_STATS.map(({ project, projectApps, totalApplied, totalCertified, totalPaid, certPct, payPct }) => (
        <div key={project} className="card overflow-hidden">
          <div className="px-5 py-3.5 bg-[var(--bg-subtle)] border-b border-[var(--border)] flex items-center gap-2">
            <Building2 size={14} className="text-[var(--text-muted)]" />
            <span className="font-semibold text-sm">{project}</span>
            <span className="ml-auto text-xs text-[var(--text-muted)]">{projectApps.length} applications</span>
          </div>
          {/* Payment position bar */}
          <div className="px-5 py-4 flex flex-col gap-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[var(--text-muted)]">Applied → Certified</span>
                <span className="font-semibold">{certPct.toFixed(0)}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-[var(--bg-muted)]">
                <div style={{ width: `${Math.min(certPct, 100)}%` }} className="h-full rounded-full bg-[var(--warning)] transition-all" />
              </div>
              <div className="flex items-center justify-between text-xs mt-1 text-[var(--text-muted)]">
                <span>{formatCurrency(totalApplied)} applied</span>
                <span>{formatCurrency(totalCertified)} certified</span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[var(--text-muted)]">Certified → Paid</span>
                <span className="font-semibold">{payPct.toFixed(0)}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-[var(--bg-muted)]">
                <div style={{ width: `${Math.min(payPct, 100)}%` }} className="h-full rounded-full bg-[var(--success)] transition-all" />
              </div>
              <div className="flex items-center justify-between text-xs mt-1 text-[var(--text-muted)]">
                <span>{formatCurrency(totalCertified)} certified</span>
                <span>{formatCurrency(totalPaid)} paid</span>
              </div>
            </div>
          </div>
          {/* Application list */}
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead><tr><th>Ref</th><th>No.</th><th className="text-right">Gross</th><th className="text-right">Certified</th><th>Status</th><th>Due Date</th><th></th></tr></thead>
              <tbody>
                {projectApps.map(a => (
                  <tr key={a.id} className="cursor-pointer" onClick={() => onCardClick(a.id)}>
                    <td className="font-mono text-xs font-semibold text-[var(--primary)]">{a.ref}</td>
                    <td className="text-sm">#{a.app_number}</td>
                    <td className="text-right tabular-nums text-sm font-semibold">{formatCurrency(a.gross_value)}</td>
                    <td className="text-right tabular-nums text-sm font-semibold text-[var(--success)]">{a.net_certified > 0 ? formatCurrency(a.net_certified) : "—"}</td>
                    <td><StatusChip status={a.status} /></td>
                    <td className="text-xs text-[var(--text-muted)]">{formatDate(a.due_date)}</td>
                    <td><ArrowRight size={13} className="text-[var(--text-muted)]" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Due Dates View ───────────────────────────────────────────────────────────

function DueDatesView({ apps, onRowClick }: { apps: Application[]; onRowClick: (id: string) => void }) {
  const today = new Date("2026-06-10");
  function daysUntil(date: string | null): number | null {
    if (!date) return null;
    return Math.floor((new Date(date).getTime() - today.getTime()) / 86400000);
  }
  const sorted = [...apps].sort((a, b) => {
    const da = daysUntil(a.due_date) ?? 9999;
    const db = daysUntil(b.due_date) ?? 9999;
    return da - db;
  });

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ref</th><th>No.</th><th>Project</th><th>Status</th>
              <th className="text-right">Gross Value</th><th>Submission</th><th>Due Date</th><th>Days Until Due</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(a => {
              const days = daysUntil(a.due_date);
              const urgency = days === null ? null : days < 0 ? "overdue" : days <= 7 ? "urgent" : days <= 21 ? "warn" : "ok";
              const urgencyColor = { overdue: "var(--danger)", urgent: "var(--danger)", warn: "var(--warning)", ok: "var(--success)" };
              return (
                <tr key={a.id} className="cursor-pointer" onClick={() => onRowClick(a.id)}>
                  <td className="font-mono text-xs font-semibold text-[var(--primary)]">{a.ref}</td>
                  <td className="text-sm">#{a.app_number}</td>
                  <td className="text-xs text-[var(--text-muted)]">{a.project}</td>
                  <td><StatusChip status={a.status} /></td>
                  <td className="text-right tabular-nums font-semibold">{formatCurrency(a.gross_value)}</td>
                  <td className="text-xs text-[var(--text-muted)]">{formatDate(a.submission_date)}</td>
                  <td className="text-sm font-medium">{formatDate(a.due_date)}</td>
                  <td>
                    {days !== null ? (
                      <span className="text-sm font-bold tabular-nums" style={{ color: urgencyColor[urgency!] }}>
                        {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Today" : `${days}d`}
                      </span>
                    ) : "—"}
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

// ─── Grouped View ─────────────────────────────────────────────────────────────

function GroupedView({ apps, onRowClick }: { apps: Application[]; onRowClick: (id: string) => void }) {
  const projects = Array.from(new Set(apps.map(a => a.project)));
  return (
    <div className="flex flex-col gap-6">
      {projects.map(project => {
        const projectApps = apps.filter(a => a.project === project);
        return (
          <div key={project} className="card overflow-hidden">
            <div className="px-5 py-3 bg-[var(--bg-subtle)] border-b border-[var(--border)] flex items-center gap-2">
              <Building2 size={14} className="text-[var(--primary)]" />
              <span className="font-semibold text-sm">{project}</span>
              <span className="ml-auto text-xs text-[var(--text-muted)] bg-[var(--bg-muted)] rounded-full px-2 py-0.5">{projectApps.length} apps</span>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead><tr><th>Ref</th><th>No.</th><th className="text-right">Gross</th><th className="text-right">Certified</th><th>Status</th><th>Due Date</th><th></th></tr></thead>
                <tbody>
                  {projectApps.map(a => (
                    <tr key={a.id} className="cursor-pointer" onClick={() => onRowClick(a.id)}>
                      <td className="font-mono text-xs font-semibold text-[var(--primary)]">{a.ref}</td>
                      <td>#{a.app_number}</td>
                      <td className="text-right tabular-nums font-semibold">{formatCurrency(a.gross_value)}</td>
                      <td className="text-right tabular-nums font-semibold text-[var(--success)]">{a.net_certified > 0 ? formatCurrency(a.net_certified) : "—"}</td>
                      <td><StatusChip status={a.status} /></td>
                      <td className="text-xs text-[var(--text-muted)]">{formatDate(a.due_date)}</td>
                      <td><ArrowRight size={13} className="text-[var(--text-muted)]" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Loading / Empty ──────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="p-4 flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-10 rounded-[var(--radius)]" />)}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card">
      <div className="empty-state">
        <div className="empty-icon"><FileText size={22} /></div>
        <h3 className="text-base font-semibold">No applications yet</h3>
        <p className="text-sm text-[var(--text-muted)] max-w-xs">
          Create interim payment applications, track certifications, and reconcile payments. Click <strong>New Application</strong> to begin.
        </p>
        <button className="btn btn-primary btn-sm mt-2"><Plus size={14} />New Application</button>
      </div>
    </div>
  );
}

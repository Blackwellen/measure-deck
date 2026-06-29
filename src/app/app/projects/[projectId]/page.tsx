"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, Pencil, Plus, Upload, Download, Brain, Sparkles,
  AlertTriangle, AlertCircle, Calendar, Clock, FileText,
  BarChart3, Building2, MapPin, Shield, LayoutDashboard,
  ChevronRight, TrendingUp, TrendingDown, Eye, Link2,
  CheckCircle2, Circle, MoreHorizontal, Archive, Mail, Phone,
} from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import ProjectMap from "@/components/map/map-view";
import { projectCover } from "@/lib/project-media";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from "recharts";
import { cn, formatCurrency, formatDate, formatRelative, getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  SEED_PROJECTS, SEED_PROJECT_DETAIL, SEED_CHANGES,
  SEED_APPLICATIONS, SEED_CVR_PERIODS, SEED_EVIDENCE,
  SEED_TASKS, SEED_AUDIT_LOG, SEED_DRAWINGS,
  type SeedProject, type ProjectStatus,
} from "@/lib/seed/projects";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId =
  | "overview" | "contract" | "changes" | "applications"
  | "cvr" | "final-account" | "evidence" | "reports"
  | "suppliers" | "tasks" | "schedule" | "site-map"
  | "drawings" | "activity" | "audit" | "settings";

/* Grouped navigation — five primary sections, each with a secondary view
   switcher. Replaces the previous flat 16-tab bar to reduce bloat. */
const TAB_GROUPS: { id: string; label: string; Icon: React.ElementType; tabs: { id: TabId; label: string }[] }[] = [
  { id: "overview",   label: "Overview",        Icon: LayoutDashboard, tabs: [
    { id: "overview", label: "Overview" },
  ] },
  { id: "commercial", label: "Commercial",      Icon: BarChart3, tabs: [
    { id: "contract",      label: "Contract" },
    { id: "changes",       label: "Changes" },
    { id: "applications",  label: "Applications" },
    { id: "cvr",           label: "CVR" },
    { id: "final-account", label: "Final Account" },
  ] },
  { id: "records",    label: "Evidence & Docs", Icon: FileText, tabs: [
    { id: "evidence",  label: "Evidence" },
    { id: "drawings",  label: "Drawings & BIM" },
    { id: "reports",   label: "Reports" },
  ] },
  { id: "delivery",   label: "Delivery",        Icon: Building2, tabs: [
    { id: "tasks",     label: "Tasks" },
    { id: "schedule",  label: "Schedule" },
    { id: "suppliers", label: "Suppliers" },
    { id: "site-map",  label: "Site Map" },
  ] },
  { id: "governance", label: "Governance",      Icon: Shield, tabs: [
    { id: "activity",  label: "Activity" },
    { id: "audit",     label: "Audit" },
    { id: "settings",  label: "Settings" },
  ] },
];

function groupForTab(tabId: TabId): string {
  return TAB_GROUPS.find(g => g.tabs.some(t => t.id === tabId))?.id ?? "overview";
}

const STATUS_META: Record<ProjectStatus, { chip: string; label: string; color: string }> = {
  active:    { chip: "chip-success", label: "Active",    color: "var(--success)" },
  on_hold:   { chip: "chip-warning", label: "On Hold",   color: "var(--warning)" },
  completed: { chip: "chip-info",    label: "Completed", color: "var(--info)" },
  disputed:  { chip: "chip-danger",  label: "Disputed",  color: "var(--danger)" },
  archived:  { chip: "chip-muted",   label: "Archived",  color: "var(--text-muted)" },
};

const TOOLTIP_STYLE = {
  background: "var(--bg-surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  fontSize: "12px",
  color: "var(--text-primary)",
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<SeedProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("overview");

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .single();
        if (data) { setProject(data as SeedProject); }
        else {
          const found = SEED_PROJECTS.find(p => p.id === projectId);
          setProject(found ?? SEED_PROJECT_DETAIL);
        }
      } catch {
        const found = SEED_PROJECTS.find(p => p.id === projectId);
        setProject(found ?? SEED_PROJECT_DETAIL);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [projectId]);

  if (loading) return <DetailSkeleton />;
  if (!project) return null;

  const certPct = (project.contractValue ?? 0) > 0
    ? (((project.certifiedToDate ?? 0) / (project.contractValue ?? 1)) * 100).toFixed(1)
    : "0.0";
  const statusMeta = STATUS_META[project.status];

  return (
    <div className="flex flex-col min-h-full">
      {/* Hero */}
      <div className="page-header flex-col items-start gap-4 pb-0">
        <button
          className="btn btn-ghost btn-sm text-xs"
          style={{ color: "var(--text-muted)" }}
          onClick={() => router.push("/app/projects")}
        >
          <ArrowLeft size={13} />Back to Projects
        </button>

        <div className="flex items-start justify-between w-full gap-4 flex-wrap">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
              style={{ background: project.logoColor }}
            >
              {project.logoInitials}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{project.name}</h1>
                <span className="font-mono text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "var(--bg-muted)", color: "var(--text-muted)" }}>
                  {project.ref}
                </span>
                <span className={cn("badge", statusMeta.chip)}>{statusMeta.label}</span>
              </div>
              <div className="flex items-center gap-4 flex-wrap text-sm" style={{ color: "var(--text-muted)" }}>
                <span className="flex items-center gap-1"><Building2 size={13} />{project.client}</span>
                <span className="flex items-center gap-1"><Calendar size={13} />{formatDate(project.startDate)} → {formatDate(project.endDate)}</span>
                <span className="font-semibold text-lg" style={{ color: "var(--text-primary)" }}>{formatCurrency(project.contractValue)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="btn btn-secondary btn-sm"><Upload size={14} />Upload Evidence</button>
            <button className="btn btn-secondary btn-sm"><Plus size={14} />New Change</button>
            <button className="btn btn-secondary btn-sm"><BarChart3 size={14} />Open CVR</button>
            <button className="btn btn-primary btn-sm" onClick={() => router.push(`/app/projects/${project.id}/edit`)}>
              <Pencil size={14} />Edit Project
            </button>
          </div>
        </div>

        {/* Primary group bar */}
        <div className="tab-bar mt-2 w-full overflow-x-auto">
          {TAB_GROUPS.map(g => {
            const isActive = groupForTab(tab) === g.id;
            const Icon = g.Icon;
            return (
              <button
                key={g.id}
                className={cn("tab-item flex-shrink-0 flex items-center gap-1.5", isActive && "active")}
                onClick={() => setTab(g.tabs[0].id)}
              >
                <Icon size={14} />{g.label}
              </button>
            );
          })}
        </div>

        {/* Secondary view switcher (only when the group has >1 view) */}
        {(() => {
          const group = TAB_GROUPS.find(g => g.id === groupForTab(tab));
          if (!group || group.tabs.length <= 1) return null;
          return (
            <div className="flex items-center gap-1 bg-[var(--bg-muted)] rounded-[var(--radius)] p-1 w-fit mb-1">
              {group.tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all",
                    tab === t.id
                      ? "bg-white text-[var(--text-primary)] shadow-sm"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          );
        })()}
      </div>

      {/* Tab content */}
      <div className="page-content flex-1">
        {tab === "overview"      && <OverviewTab project={project} certPct={certPct} />}
        {tab === "contract"      && <ContractTab project={project} />}
        {tab === "changes"       && <ChangesTab projectId={project.id} />}
        {tab === "applications"  && <ApplicationsTab projectId={project.id} />}
        {tab === "cvr"           && <CVRTab projectId={project.id} />}
        {tab === "final-account" && <FinalAccountTab projectId={project.id} />}
        {tab === "evidence"      && <EvidenceTab projectId={project.id} />}
        {tab === "reports"       && <ReportsTab />}
        {tab === "suppliers"     && <SuppliersTab />}
        {tab === "tasks"         && <TasksTab projectId={project.id} />}
        {tab === "schedule"      && <ScheduleTab />}
        {tab === "site-map"      && <SiteMapTab project={project} />}
        {tab === "drawings"      && <DrawingsTab />}
        {tab === "activity"      && <ActivityTab projectId={project.id} />}
        {tab === "audit"         && <AuditTab projectId={project.id} />}
        {tab === "settings"      && <SettingsTab project={project} router={router} />}
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ project, certPct }: { project: SeedProject; certPct: string }) {
  const changes = SEED_CHANGES.filter(c => c.projectId === project.id);
  const totalChangeValue = changes.reduce((s, c) => s + c.value, 0);
  const openChanges = changes.filter(c => c.status === "pending" || c.status === "disputed").length;

  return (
    <div className="flex flex-col gap-6">
      {/* Cover photo + team */}
      <div className="card overflow-hidden p-0">
        <div className="relative h-44 w-full" style={{ background: project.logoColor }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={projectCover(project.id, 1200)}
            alt={project.name}
            className="w-full h-full object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
          <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.6) 100%)" }} />
          <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-3">
            <div className="text-white">
              <p className="text-xs flex items-center gap-1 opacity-90"><MapPin size={12} />{project.address}</p>
              <p className="text-lg font-bold drop-shadow">{project.postcode}</p>
            </div>
            {/* Team avatars */}
            <div className="flex items-center gap-3">
              <div className="text-right text-white">
                <p className="text-[10px] uppercase tracking-wide opacity-80">Project Lead</p>
                <p className="text-xs font-semibold drop-shadow">{project.projectLead}</p>
              </div>
              <div className="flex items-center -space-x-2">
                <Avatar name={project.projectLead} size="sm" className="ring-2 ring-white" />
                {project.team.map((m) => (
                  <Avatar key={m} name={m} size="sm" className="ring-2 ring-white" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="kpi-label">Contract Value</div>
          <div className="kpi-value">{formatCurrency(project.contractValue)}</div>
          <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{project.contractType}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Certified %</div>
          <div className="kpi-value" style={{ color: parseFloat(certPct) >= 80 ? "var(--success)" : "var(--text-primary)" }}>
            {certPct}%
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{formatCurrency(project.certifiedToDate)} certified</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">CVR Margin</div>
          <div className="kpi-value flex items-center gap-1">
            {(project.margin ?? 0) >= 15
              ? <TrendingUp size={16} style={{ color: "var(--success)" }} />
              : <TrendingDown size={16} style={{ color: "var(--warning)" }} />}
            <span style={{ color: (project.margin ?? 0) >= 15 ? "var(--success)" : "var(--warning)" }}>
              {(project.margin ?? 0).toFixed(1)}%
            </span>
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Current period</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Open Changes</div>
          <div className="kpi-value" style={{ color: openChanges > 0 ? "var(--warning)" : "var(--text-primary)" }}>
            {openChanges}
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{formatCurrency(totalChangeValue)} total</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Risk warnings */}
        <div className="card p-5 flex flex-col gap-3">
          <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <AlertTriangle size={15} style={{ color: "var(--warning)" }} />Risk Warnings
          </h3>
          <RiskItem severity="danger" title="EoT Notice Overdue" description="Section 4.1 notice deadline passed. Immediate action required." />
          <RiskItem severity="warning" title="Application #14 Outstanding" description="Payment due 13 Jun 2026. £380k at risk if not certified." />
          <RiskItem severity="warning" title="3 unlinked evidence files" description="Daywork sheets DW-048 to DW-053 have no change association." />
        </div>

        {/* Upcoming deadlines */}
        <div className="card p-5 flex flex-col gap-3">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Upcoming Deadlines</h3>
          {[
            { date: "2026-06-11", title: "Issue EoT Notice", type: "critical" },
            { date: "2026-06-13", title: "App #14 Payment Due", type: "warning" },
            { date: "2026-06-14", title: "Sign off CVR Period 8", type: "info" },
            { date: "2026-06-21", title: "Upload Daywork Sheets", type: "info" },
          ].map((d, i) => (
            <div key={i} className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex flex-col items-center justify-center text-white text-[10px] font-bold leading-tight flex-shrink-0"
                style={{
                  background: d.type === "critical" ? "var(--danger)" : d.type === "warning" ? "var(--warning)" : "var(--primary)",
                }}
              >
                <span>{new Date(d.date).getDate()}</span>
                <span>{new Date(d.date).toLocaleString("en-GB", { month: "short" })}</span>
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{d.title}</p>
            </div>
          ))}
        </div>

        {/* AI Summary */}
        <div
          className="card p-5 flex flex-col gap-3"
          style={{ borderColor: "var(--violet)", borderWidth: 1 }}
        >
          <div className="flex items-center gap-2">
            <Brain size={16} style={{ color: "var(--violet)" }} />
            <h3 className="text-sm font-semibold" style={{ color: "var(--violet-text)" }}>AI Summary</h3>
            <button className="btn btn-sm ml-auto" style={{ background: "var(--violet)", color: "#fff", fontSize: "11px" }}>
              <Sparkles size={11} />Ask Copilot
            </button>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            <strong>Eastside Block A</strong> is performing above target at <strong>16.4% margin</strong> (target 15%). CVR shows a positive trend over 8 periods. The most urgent action is issuing the Section 4.1 EoT notice — this is now overdue. Application #14 (£380k) remains outstanding. 5 evidence files require linking to changes before the next payment cycle.
          </p>
          <div className="flex items-center gap-2 text-xs flex-wrap" style={{ color: "var(--violet-text)" }}>
            <span className="badge" style={{ background: "var(--violet-bg)", color: "var(--violet-text)" }}>87% confidence</span>
            <span>Last analysed 10 Jun 2026, 09:00</span>
          </div>
        </div>
      </div>

      {/* Recent activity */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Recent Activity</h3>
          <button className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--primary)" }}>
            View all <ChevronRight size={12} />
          </button>
        </div>
        <div className="flex flex-col gap-0">
          {SEED_AUDIT_LOG.slice(0, 4).map((log, idx) => (
            <div key={log.id} className={cn("flex items-start gap-3 py-3", idx < 3 && "border-b")} style={{ borderColor: "var(--border-subtle)" }}>
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                style={{ background: "var(--primary)" }}
              >
                {getInitials(log.user)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm" style={{ color: "var(--text-primary)" }}>
                  <span className="font-semibold">{log.user}</span> — {log.action}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{log.detail}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{formatRelative(log.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RiskItem({ severity, title, description }: { severity: "danger" | "warning"; title: string; description: string }) {
  const isDanger = severity === "danger";
  return (
    <div
      className="flex gap-3 p-3 rounded-xl"
      style={{ background: isDanger ? "var(--danger-bg)" : "var(--warning-bg)" }}
    >
      <div className="flex-shrink-0 mt-0.5" style={{ color: isDanger ? "var(--danger)" : "var(--warning)" }}>
        {isDanger ? <AlertCircle size={14} /> : <AlertTriangle size={14} />}
      </div>
      <div>
        <p className="text-xs font-semibold" style={{ color: isDanger ? "var(--danger-text)" : "var(--warning-text)" }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: isDanger ? "var(--danger-text)" : "var(--warning-text)", opacity: 0.8 }}>{description}</p>
      </div>
    </div>
  );
}

// ─── Contract Tab ─────────────────────────────────────────────────────────────

function ContractTab({ project }: { project: SeedProject }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Contract terms */}
        <div className="card p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Contract Terms</h3>
            <button className="btn btn-secondary btn-sm"><Pencil size={13} />Edit Contract</button>
          </div>
          {[
            { label: "Contract Type", value: project.contractType },
            { label: "Contract Value", value: formatCurrency(project.contractValue) },
            { label: "Retention %", value: `${project.retentionPercent}%` },
            { label: "Payment Terms", value: `${project.paymentTerms} days` },
            { label: "Notice Period", value: "7 days" },
          ].map(row => (
            <div key={row.label} className="flex justify-between py-1.5 border-b last:border-0" style={{ borderColor: "var(--border-subtle)" }}>
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>{row.label}</span>
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{row.value}</span>
            </div>
          ))}
        </div>

        {/* Key dates */}
        <div className="card p-5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Key Dates</h3>
          {[
            { label: "Contract Start", value: formatDate(project.startDate) },
            { label: "Planned Completion", value: formatDate(project.endDate) },
            { label: "Practical Completion", value: "TBC" },
            { label: "Defects Period End", value: "TBC" },
            { label: "Final Account Target", value: "Dec 2026" },
          ].map(row => (
            <div key={row.label} className="flex justify-between py-1.5 border-b last:border-0" style={{ borderColor: "var(--border-subtle)" }}>
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>{row.label}</span>
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Contract documents */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Contract Documents</h3>
          <button className="btn btn-secondary btn-sm"><Upload size={13} />Upload Contract</button>
        </div>
        <div className="flex flex-col gap-2">
          {[
            { name: "JCT Design & Build 2016 – Executed Copy", date: "01 Mar 2024", type: "Contract" },
            { name: "Employer's Requirements – Rev C", date: "15 Feb 2024", type: "Specification" },
            { name: "BQ Priced Summary", date: "28 Feb 2024", type: "Commercial" },
          ].map((doc, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--bg-subtle)" }}>
              <div className="flex items-center gap-3">
                <FileText size={16} style={{ color: "var(--primary)" }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{doc.name}</p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>{doc.type} · {doc.date}</p>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm"><Download size={13} /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Changes Tab ──────────────────────────────────────────────────────────────

function ChangesTab({ projectId }: { projectId: string }) {
  const changes = SEED_CHANGES.filter(c => c.projectId === projectId);
  const [sortField, setSortField] = useState<string>("raisedDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function toggle(field: string) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  }

  const sorted = [...changes].sort((a, b) => {
    const av = (a as Record<string, unknown>)[sortField];
    const bv = (b as Record<string, unknown>)[sortField];
    if (typeof av === "number" && typeof bv === "number") return sortDir === "asc" ? av - bv : bv - av;
    return sortDir === "asc"
      ? String(av).localeCompare(String(bv))
      : String(bv).localeCompare(String(av));
  });

  const STATUS_CHIP: Record<string, string> = {
    approved: "chip-success", pending: "chip-warning", disputed: "chip-danger",
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{changes.length} changes · {formatCurrency(changes.reduce((s, c) => s + c.value, 0))} total</p>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm"><Download size={13} />Export</button>
          <button className="btn btn-primary btn-sm"><Plus size={13} />New Change</button>
        </div>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                {[
                  { field: "ref", label: "Ref" },
                  { field: "title", label: "Title" },
                  { field: "type", label: "Type" },
                  { field: "value", label: "Value" },
                  { field: "status", label: "Status" },
                  { field: "raisedDate", label: "Raised" },
                ].map(col => (
                  <th
                    key={col.field}
                    className="cursor-pointer select-none"
                    onClick={() => toggle(col.field)}
                  >
                    <span className="flex items-center gap-1">
                      {col.label}
                      {sortField === col.field && (
                        <span className="text-[10px]">{sortDir === "asc" ? "↑" : "↓"}</span>
                      )}
                    </span>
                  </th>
                ))}
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8" style={{ color: "var(--text-muted)" }}>No changes</td></tr>
              ) : sorted.map(c => (
                <tr key={c.id}>
                  <td className="font-mono text-xs font-semibold" style={{ color: "var(--primary)" }}>{c.ref}</td>
                  <td className="font-medium max-w-[280px]"><span className="line-clamp-2">{c.title}</span></td>
                  <td>
                    <span className="badge chip-muted capitalize">{c.type.replace("_", " ")}</span>
                  </td>
                  <td className="font-semibold tabular-nums text-right">{formatCurrency(c.value)}</td>
                  <td><span className={cn("badge", STATUS_CHIP[c.status] ?? "chip-muted")}>{c.status}</span></td>
                  <td className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(c.raisedDate)}</td>
                  <td><button className="btn btn-ghost btn-icon btn-sm"><MoreHorizontal size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Applications Tab ─────────────────────────────────────────────────────────

function ApplicationsTab({ projectId }: { projectId: string }) {
  const apps = SEED_APPLICATIONS.filter(a => a.projectId === projectId);
  const APP_STATUS: Record<string, string> = {
    paid: "chip-success", certified: "chip-info", outstanding: "chip-warning",
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{apps.length} applications</p>
        <button className="btn btn-primary btn-sm"><Plus size={13} />New Application</button>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>App No</th>
                <th className="text-right">Gross Cumulative</th>
                <th className="text-right">Net This Period</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Due</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {apps.map(a => (
                <tr key={a.id}>
                  <td className="font-mono text-xs font-semibold" style={{ color: "var(--primary)" }}>{a.ref}</td>
                  <td className="text-right tabular-nums font-semibold">{formatCurrency(a.grossCumulative)}</td>
                  <td className="text-right tabular-nums">{formatCurrency(a.value)}</td>
                  <td><span className={cn("badge", APP_STATUS[a.status] ?? "chip-muted")}>{a.status}</span></td>
                  <td className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(a.submittedDate)}</td>
                  <td className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(a.dueDate)}</td>
                  <td><button className="btn btn-ghost btn-icon btn-sm"><MoreHorizontal size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── CVR Tab ──────────────────────────────────────────────────────────────────

function CVRTab({ projectId }: { projectId: string }) {
  const periods = SEED_CVR_PERIODS.filter(c => c.projectId === projectId);
  const CVR_STATUS: Record<string, string> = {
    draft: "chip-muted", approved: "chip-success",
  };
  const chartData = [...periods].reverse().map(p => ({
    period: `P${p.period}`,
    margin: p.margin,
    target: 15.0,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{periods.length} CVR periods</p>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm"><Plus size={13} />New Period</button>
          <button className="btn btn-primary btn-sm"><BarChart3 size={13} />Open CVR</button>
        </div>
      </div>

      {/* Margin sparkline */}
      {chartData.length > 1 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Margin Trend</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="period" tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip formatter={(v: number) => [`${v}%`, ""]} contentStyle={TOOLTIP_STYLE} />
              <Area type="monotone" dataKey="target" name="Target" stroke="var(--border-strong)" strokeDasharray="4 2" fill="transparent" />
              <Area type="monotone" dataKey="margin" name="Margin" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Report Date</th>
                <th className="text-right">Contract Value</th>
                <th className="text-right">Cost to Date</th>
                <th className="text-right">Value to Date</th>
                <th className="text-right">Margin</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {periods.map(p => (
                <tr key={p.id}>
                  <td className="font-semibold">Period {p.period}</td>
                  <td className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(p.reportDate)}</td>
                  <td className="text-right tabular-nums">{formatCurrency(p.contractValue)}</td>
                  <td className="text-right tabular-nums">{formatCurrency(p.costToDate)}</td>
                  <td className="text-right tabular-nums">{formatCurrency(p.valueToDate)}</td>
                  <td className="text-right tabular-nums font-bold" style={{ color: (p.margin ?? 0) >= 15 ? "var(--success)" : "var(--warning)" }}>
                    {(p.margin ?? 0)}%
                  </td>
                  <td><span className={cn("badge", CVR_STATUS[p.status] ?? "chip-muted")}>{p.status}</span></td>
                  <td><button className="btn btn-ghost btn-icon btn-sm"><ChevronRight size={13} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Final Account Tab ────────────────────────────────────────────────────────

function FinalAccountTab({ projectId }: { projectId: string }) {
  return (
    <div className="card">
      <div className="empty-state">
        <div className="empty-icon"><FileText size={22} /></div>
        <h3 className="text-base font-semibold">No Final Account Started</h3>
        <p className="text-sm max-w-xs" style={{ color: "var(--text-muted)" }}>
          Create a final account to reconcile the contract sum, agreed variations, claims and retention.
        </p>
        <button className="btn btn-primary btn-sm mt-2">
          <Plus size={14} />Create Final Account
        </button>
      </div>
    </div>
  );
}

// ─── Evidence Tab ─────────────────────────────────────────────────────────────

function EvidenceTab({ projectId }: { projectId: string }) {
  const evidence = SEED_EVIDENCE.filter(e => e.projectId === projectId);
  const TYPE_ICON: Record<string, React.ReactNode> = {
    photo: <Eye size={14} />, instruction: <FileText size={14} />,
    programme: <Calendar size={14} />, daywork: <Clock size={14} />,
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{evidence.length} files · {evidence.filter(e => e.status === "linked").length} linked</p>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" style={{ color: "var(--violet)" }}>
            <Brain size={13} />AI Gap Check
          </button>
          <button className="btn btn-primary btn-sm"><Upload size={13} />Upload Evidence</button>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {evidence.map(ev => (
          <div key={ev.id} className="card p-4 flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: "var(--primary)18", color: "var(--primary)" }}
              >
                {TYPE_ICON[ev.type] ?? <FileText size={14} />}
              </div>
              <span className={cn("badge flex-shrink-0", ev.status === "linked" ? "chip-success" : "chip-warning")}>
                {ev.status}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{ev.title}</p>
              <p className="text-xs mt-0.5 capitalize" style={{ color: "var(--text-muted)" }}>{ev.type} · {formatDate(ev.uploadedDate)}</p>
            </div>
            {ev.linkedChange && (
              <div className="flex items-center gap-1 text-xs" style={{ color: "var(--primary)" }}>
                <Link2 size={11} />
                Linked to {ev.linkedChange}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Reports Tab ──────────────────────────────────────────────────────────────

function ReportsTab() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Project reports</p>
        <button className="btn btn-primary btn-sm"><Plus size={13} />Create Report</button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: "CVR Period 8 Report", type: "CVR Report", date: "01 Jun 2026", status: "final" },
          { title: "Application #14 Summary", type: "Application Summary", date: "23 May 2026", status: "final" },
          { title: "Change Register Export", type: "Change Register", date: "10 Jun 2026", status: "draft" },
        ].map((r, i) => (
          <div key={i} className="card p-4 flex flex-col gap-3 hover:shadow-[var(--shadow-md)] transition-shadow cursor-pointer">
            <div className="flex items-center justify-between">
              <span className="badge chip-primary">{r.type}</span>
              <span className={cn("badge", r.status === "final" ? "chip-success" : "chip-muted")}>{r.status}</span>
            </div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{r.title}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Generated {r.date}</p>
            <div className="flex gap-2 mt-auto">
              <button className="btn btn-secondary btn-sm flex-1 text-xs"><Eye size={12} />Open</button>
              <button className="btn btn-secondary btn-sm"><Download size={12} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Suppliers Tab ────────────────────────────────────────────────────────────

function SuppliersTab() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Project suppliers & subcontractors</p>
        <button className="btn btn-primary btn-sm"><Plus size={13} />Add Supplier</button>
      </div>
      <div className="card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Company</th>
              <th>Package</th>
              <th className="text-right">Subcontract Value</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {[
              { name: "A&B Groundworks Ltd", package: "Groundworks & Drainage", value: 420000, status: "active" },
              { name: "Meridian Structural Engineers", package: "Structural Steelwork", value: 680000, status: "active" },
              { name: "Pinnacle MEP Solutions", package: "M&E Package", value: 940000, status: "active" },
              { name: "Skyline Cladding Systems", package: "Façade & Cladding", value: 520000, status: "on_hold" },
            ].map((s, i) => (
              <tr key={i}>
                <td className="font-semibold">{s.name}</td>
                <td style={{ color: "var(--text-muted)" }}>{s.package}</td>
                <td className="text-right tabular-nums font-semibold">{formatCurrency(s.value)}</td>
                <td>
                  <span className={cn("badge", s.status === "active" ? "chip-success" : "chip-warning")}>
                    {s.status === "active" ? "Active" : "On Hold"}
                  </span>
                </td>
                <td><button className="btn btn-ghost btn-icon btn-sm"><ChevronRight size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tasks Tab ────────────────────────────────────────────────────────────────

function TasksTab({ projectId }: { projectId: string }) {
  const tasks = SEED_TASKS.filter(t => t.projectId === projectId);
  const PRIORITY: Record<string, string> = {
    critical: "chip-danger", high: "chip-warning", medium: "chip-info", low: "chip-muted",
  };
  const STATUS_TASK: Record<string, string> = {
    open: "chip-muted", in_progress: "chip-primary", done: "chip-success",
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{tasks.length} tasks · {tasks.filter(t => t.status === "open").length} open</p>
        <button className="btn btn-primary btn-sm"><Plus size={13} />New Task</button>
      </div>
      <div className="card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Assignee</th>
              <th>Priority</th>
              <th>Due Date</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(t => (
              <tr key={t.id}>
                <td className="font-medium max-w-[280px]"><span className="line-clamp-2">{t.title}</span></td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ background: "var(--primary)" }}>
                      {getInitials(t.assignee)}
                    </div>
                    <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{t.assignee}</span>
                  </div>
                </td>
                <td><span className={cn("badge", PRIORITY[t.priority] ?? "chip-muted")}>{t.priority}</span></td>
                <td className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(t.dueDate)}</td>
                <td><span className={cn("badge", STATUS_TASK[t.status] ?? "chip-muted")}>{t.status.replace("_", " ")}</span></td>
                <td><button className="btn btn-ghost btn-icon btn-sm"><MoreHorizontal size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Schedule Tab ─────────────────────────────────────────────────────────────

function ScheduleTab() {
  const milestones = [
    { title: "Ground works completion", date: "2024-08-31", status: "done" },
    { title: "Superstructure topping out", date: "2025-03-15", status: "done" },
    { title: "Roofing & weathertight", date: "2025-07-01", status: "done" },
    { title: "M&E first fix complete", date: "2025-11-01", status: "done" },
    { title: "Internal plastering", date: "2026-03-01", status: "in_progress" },
    { title: "Fit-out complete", date: "2026-07-31", status: "upcoming" },
    { title: "Practical Completion", date: "2026-09-30", status: "upcoming" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{milestones.length} milestones</p>
        <button className="btn btn-primary btn-sm"><Plus size={13} />Add Milestone</button>
      </div>
      <div className="card p-5">
        <div className="relative flex flex-col gap-0">
          {milestones.map((m, idx) => {
            const isDone = m.status === "done";
            const isProgress = m.status === "in_progress";
            return (
              <div key={idx} className="flex items-start gap-4 pb-6 last:pb-0 relative">
                {/* Vertical line */}
                {idx < milestones.length - 1 && (
                  <div className="absolute left-[13px] top-7 bottom-0 w-0.5" style={{ background: "var(--border)" }} />
                )}
                {/* Icon */}
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                  style={{
                    background: isDone ? "var(--success)" : isProgress ? "var(--primary)" : "var(--bg-muted)",
                    border: `2px solid ${isDone ? "var(--success)" : isProgress ? "var(--primary)" : "var(--border)"}`,
                  }}
                >
                  {isDone
                    ? <CheckCircle2 size={13} color="#fff" />
                    : isProgress
                      ? <Circle size={13} color="#fff" fill="#fff" />
                      : <Circle size={13} style={{ color: "var(--text-muted)" }} />}
                </div>
                {/* Content */}
                <div className="flex-1 flex items-center justify-between pt-0.5">
                  <p
                    className="text-sm font-medium"
                    style={{ color: isDone ? "var(--text-muted)" : "var(--text-primary)" }}
                  >
                    {m.title}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(m.date)}</span>
                    <span className={cn("badge", isDone ? "chip-success" : isProgress ? "chip-primary" : "chip-muted")}>
                      {m.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Site Map Tab ─────────────────────────────────────────────────────────────

function SiteMapTab({ project }: { project: SeedProject }) {
  const sitePins = [
    { id: "site", name: project.name, lat: project.lat, lng: project.lng, color: STATUS_META[project.status].color, ref: project.ref, address: `${project.address}, ${project.postcode}`, contractValue: project.contractValue },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button className="btn btn-secondary btn-sm"><Upload size={13} />Upload Site Plan</button>
        <button className="btn btn-secondary btn-sm"><MapPin size={13} />Add Pin</button>
        <button className="btn btn-secondary btn-sm"><Link2 size={13} />Link Evidence</button>
        <a
          className="btn btn-secondary btn-sm ml-auto"
          href={`https://www.openstreetmap.org/?mlat=${project.lat}&mlon=${project.lng}#map=16/${project.lat}/${project.lng}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Eye size={13} />Open in OpenStreetMap
        </a>
      </div>

      {/* Location header */}
      <div className="card p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--primary-light, #EEF2FF)" }}>
          <MapPin size={18} style={{ color: "var(--primary)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{project.address}</p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>{project.postcode} · {project.lat.toFixed(4)}, {project.lng.toFixed(4)}</p>
        </div>
      </div>

      {/* Real interactive map */}
      <div className="card overflow-hidden p-0">
        <ProjectMap points={sitePins} height={480} single zoom={15} />
      </div>
    </div>
  );
}

// ─── Drawings/BIM Tab ─────────────────────────────────────────────────────────

function DrawingsTab() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{SEED_DRAWINGS.length} drawings</p>
        <button className="btn btn-primary btn-sm"><Upload size={13} />Upload Drawing</button>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Drawing No</th>
                <th>Title</th>
                <th>Type</th>
                <th>Revision</th>
                <th>Date</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {SEED_DRAWINGS.map(d => {
                const STATUS_CHIP: Record<string, string> = {
                  issued: "chip-success", for_construction: "chip-primary", for_comment: "chip-warning",
                };
                return (
                  <tr key={d.id}>
                    <td className="font-mono text-xs font-semibold" style={{ color: "var(--primary)" }}>{d.drawingNo}</td>
                    <td className="font-medium">{d.title}</td>
                    <td><span className="badge chip-muted">{d.type}</span></td>
                    <td className="font-mono text-xs">{d.revision}</td>
                    <td className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(d.date)}</td>
                    <td><span className={cn("badge", STATUS_CHIP[d.status] ?? "chip-muted")}>{d.status.replace("_", " ")}</span></td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn btn-ghost btn-icon btn-sm"><Eye size={13} /></button>
                        <button className="btn btn-ghost btn-icon btn-sm"><Download size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* BIM section */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>BIM Models</h3>
          <Link href="/app/bim/models" className="btn btn-secondary btn-sm"><Building2 size={13} />Open BIM Library</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { id: "bim-001", name: "Eastside-Block-A-Arch-P4.ifc", discipline: "Architectural", elements: "18,420" },
            { id: "bim-002", name: "Eastside-Block-A-Struct-C2.ifc", discipline: "Structural", elements: "11,240" },
          ].map(m => (
            <Link key={m.id} href={`/app/bim/${m.id}`} className="flex items-center gap-3 p-3 rounded-xl border hover:shadow-[var(--shadow-md)] transition-shadow" style={{ borderColor: "var(--border)" }}>
              <div className="w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg,#0e7490,#1d4ed8)" }}>
                <Building2 size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{m.name}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{m.discipline} · {m.elements} elements</p>
              </div>
              <span className="btn btn-primary btn-sm flex-shrink-0"><Eye size={13} />3D·4D·5D</span>
            </Link>
          ))}
        </div>
        <p className="text-xs mt-3" style={{ color: "var(--text-muted)" }}>
          Open a model to inspect it in 3D, simulate the 4D construction sequence, and view 5D cost variance.
        </p>
      </div>
    </div>
  );
}

// ─── Activity Tab ─────────────────────────────────────────────────────────────

function ActivityTab({ projectId }: { projectId: string }) {
  const logs = SEED_AUDIT_LOG.filter(l => l.projectId === projectId);

  return (
    <div className="flex flex-col gap-4">
      <div className="card p-5">
        <div className="flex flex-col gap-0">
          {logs.map((log, idx) => (
            <div
              key={log.id}
              className={cn("flex items-start gap-4 py-4", idx < logs.length - 1 && "border-b")}
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <div className="relative flex-shrink-0">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: "var(--primary)" }}
                >
                  {getInitials(log.user)}
                </div>
                {idx < logs.length - 1 && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-9 h-full w-0.5" style={{ background: "var(--border-subtle)" }} />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{log.user}</span>
                    <span className="text-sm ml-1" style={{ color: "var(--text-secondary)" }}>{log.action}</span>
                  </div>
                  <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>{formatRelative(log.timestamp)}</span>
                </div>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{log.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Audit Tab ────────────────────────────────────────────────────────────────

function AuditTab({ projectId }: { projectId: string }) {
  const logs = SEED_AUDIT_LOG.filter(l => l.projectId === projectId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>{logs.length} audit entries</p>
        <button className="btn btn-secondary btn-sm"><Download size={13} />Export</button>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(l => (
                <tr key={l.id}>
                  <td className="text-xs font-mono tabular-nums" style={{ color: "var(--text-muted)" }}>
                    {new Date(l.timestamp).toLocaleString("en-GB")}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ background: "var(--primary)" }}>
                        {getInitials(l.user)}
                      </div>
                      <span className="text-sm">{l.user}</span>
                    </div>
                  </td>
                  <td className="font-medium">{l.action}</td>
                  <td className="text-sm max-w-[320px]" style={{ color: "var(--text-secondary)" }}>
                    <span className="line-clamp-2">{l.detail}</span>
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

// ─── Settings Tab ─────────────────────────────────────────────────────────────

function SettingsTab({ project, router }: { project: SeedProject; router: ReturnType<typeof useRouter> }) {
  const [showArchive, setShowArchive] = useState(false);

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Project Settings</h3>
        <div className="flex flex-col gap-4">
          <div>
            <label className="form-label">Project Name</label>
            <input className="form-input" defaultValue={project.name} />
          </div>
          <div>
            <label className="form-label">Client</label>
            <input className="form-input" defaultValue={project.client} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Contract Value</label>
              <input className="form-input" defaultValue={project.contractValue} type="number" />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select className="form-input" defaultValue={project.status}>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="disputed">Disputed</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Start Date</label>
              <input className="form-input" type="date" defaultValue={project.startDate} />
            </div>
            <div>
              <label className="form-label">End Date</label>
              <input className="form-input" type="date" defaultValue={project.endDate} />
            </div>
          </div>
          <button className="btn btn-primary btn-sm self-start">Save Changes</button>
        </div>
      </div>

      {/* Danger zone */}
      <div className="card p-5" style={{ borderColor: "var(--danger)44", borderWidth: 1 }}>
        <h3 className="text-sm font-semibold mb-1" style={{ color: "var(--danger)" }}>Danger Zone</h3>
        <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
          Archiving will hide this project from active views. This action can be reversed.
        </p>
        {!showArchive ? (
          <button
            className="btn btn-sm"
            style={{ background: "var(--danger)", color: "#fff" }}
            onClick={() => setShowArchive(true)}
          >
            <Archive size={13} />Archive Project
          </button>
        ) : (
          <div className="flex flex-col gap-3 p-4 rounded-xl" style={{ background: "var(--danger-bg)" }}>
            <p className="text-sm font-semibold" style={{ color: "var(--danger-text)" }}>
              Are you sure you want to archive <strong>{project.name}</strong>?
            </p>
            <div className="flex gap-2">
              <button className="btn btn-sm" style={{ background: "var(--danger)", color: "#fff" }}>
                Confirm Archive
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowArchive(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="skeleton h-8 w-48 rounded" />
      <div className="skeleton h-20 rounded-[var(--radius-lg)]" />
      <div className="flex gap-1">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton h-8 w-20 rounded" />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-[var(--radius)]" />
        ))}
      </div>
    </div>
  );
}

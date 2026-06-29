"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Upload, Download, Filter, Sparkles, CheckSquare,
  AlertTriangle, AlertCircle, Clock, TrendingUp, TrendingDown,
  BarChart3, FileCheck, Shield, CalendarDays, Activity,
  ArrowRight, MoreHorizontal, ChevronRight, Brain,
  FileText, FolderKanban, CircleDollarSign, RefreshCw,
  Zap, CheckCircle2, XCircle, Info,
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, LineChart, Line, RadialBarChart, RadialBar,
} from "recharts";
import { cn, formatCurrency, formatDate, formatRelative, getInitials } from "@/lib/utils";
import { getFlag } from "@/lib/feature-flags";
import { createClient } from "@/lib/supabase/client";
import {
  SEED_KPI, SEED_RISK_ALERTS, SEED_ACTION_QUEUE, SEED_UPCOMING_DEADLINES,
  SEED_ACTIVITY_FEED, SEED_PAYMENT_STATUS, SEED_CVR_MARGIN,
  SEED_FINAL_ACCOUNT, SEED_EVIDENCE_HEALTH,
} from "@/lib/seed/dashboard";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = "overview" | "action-queue" | "commercial-health" | "upcoming-deadlines" | "recent-activity" | "ai-insights";

// ─── Tab config ───────────────────────────────────────────────────────────────

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "action-queue", label: "Action Queue" },
  { id: "commercial-health", label: "Commercial Health" },
  { id: "upcoming-deadlines", label: "Upcoming Deadlines" },
  { id: "recent-activity", label: "Recent Activity" },
  { id: "ai-insights", label: "AI Insights" },
];

// ─── Audit event type ────────────────────────────────────────────────────────

interface LiveAuditEvent {
  id: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
  user_id: string | null;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function HomeDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("overview");
  const [loading, setLoading] = useState(true);
  const [kpi, setKpi] = useState(SEED_KPI);
  const [liveActivities, setLiveActivities] = useState<LiveAuditEvent[]>([]);

  // Attempt live Supabase fetch; fall back to seed data
  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data: projects } = await supabase
          .from("projects")
          .select("contract_value, certified_to_date, margin")
          .neq("status", "archived");

        if (projects && projects.length > 0) {
          const totalContractValue = projects.reduce((s: number, p: { contract_value: number }) => s + (p.contract_value ?? 0), 0);
          const certifiedToDate = projects.reduce((s: number, p: { certified_to_date: number }) => s + (p.certified_to_date ?? 0), 0);
          const avgMargin = projects.reduce((s: number, p: { margin: number }) => s + (p.margin ?? 0), 0) / projects.length;
          setKpi(prev => ({ ...prev, totalContractValue, certifiedToDate, cvrMargin: +avgMargin.toFixed(1) }));
        }

        // Fetch live audit events for activity feed
        const { data: activities } = await supabase
          .from("audit_events")
          .select("id, action, resource_type, resource_id, new_values, created_at, user_id")
          .order("created_at", { ascending: false })
          .limit(20);

        if (activities && activities.length > 0) {
          setLiveActivities(activities as LiveAuditEvent[]);
        }
      } catch {
        // Fall through – keep seed data
      } finally {
        setLoading(false);
      }
    }
    // Simulate brief load so skeletons are visible
    const t = setTimeout(() => {
      load();
    }, 600);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="flex flex-col min-h-full">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Good morning, James
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Tuesday, 10 June 2026 · 6 active projects · 4 alerts
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn btn-secondary btn-sm" onClick={() => router.push("/app/reports")}>
            <Download size={14} />Export Dashboard
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => router.push("/app/tasks")}>
            <CheckSquare size={14} />View All Tasks
          </button>
          <button
            className="btn btn-sm"
            style={{ background: "var(--violet-bg)", color: "var(--violet)" }}
          >
            <Sparkles size={14} />Ask Copilot
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => router.push("/app/evidence/new")}>
            <Upload size={14} />Upload Evidence
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => router.push("/app/reports/new")}>
            <FileText size={14} />Create Report
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => router.push("/app/changes/new")}>
            <Plus size={14} />New Change
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => router.push("/app/applications/new")}>
            <CircleDollarSign size={14} />New Application
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => router.push("/app/projects?new=true")}>
            <FolderKanban size={14} />New Project
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="tab-bar mt-4">
        {TABS.map(t => (
          <button
            key={t.id}
            className={cn("tab-item", tab === t.id && "active")}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="page-content flex-1">
        {tab === "overview"             && <OverviewTab loading={loading} kpi={kpi} router={router} liveActivities={liveActivities} />}
        {tab === "action-queue"         && <ActionQueueTab />}
        {tab === "commercial-health"    && <CommercialHealthTab loading={loading} />}
        {tab === "upcoming-deadlines"   && <UpcomingDeadlinesTab />}
        {tab === "recent-activity"      && <RecentActivityTab liveActivities={liveActivities} />}
        {tab === "ai-insights"          && <AIInsightsTab />}
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({ loading, kpi, router, liveActivities }: {
  loading: boolean;
  kpi: typeof SEED_KPI;
  router: ReturnType<typeof useRouter>;
  liveActivities: LiveAuditEvent[];
}) {
  return (
    <div className="flex flex-col gap-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="kpi-card gap-3">
              <div className="skeleton h-3 w-28 rounded" />
              <div className="skeleton h-8 w-36 rounded" />
              <div className="skeleton h-3 w-20 rounded" />
            </div>
          ))
        ) : (
          <>
            <KPICard
              label="Total Contract Value"
              value={formatCurrency(kpi.totalContractValue)}
              sub="Across 6 active projects"
              trend="up"
              trendLabel="+2 since last month"
              icon={<FolderKanban size={16} />}
              iconColor="var(--primary)"
            />
            <KPICard
              label="Certified to Date"
              value={formatCurrency(kpi.certifiedToDate)}
              sub={`${kpi.certifiedPercent}% of total contract`}
              trend="up"
              trendLabel="+£380k this period"
              icon={<CheckCircle2 size={16} />}
              iconColor="var(--success)"
            />
            <KPICard
              label="Outstanding Applications"
              value={String(kpi.outstandingApplications)}
              sub="Across 4 projects"
              trend="neutral"
              trendLabel="£2.6M total applied"
              icon={<CircleDollarSign size={16} />}
              iconColor="var(--warning)"
            />
            <KPICard
              label="CVR Margin"
              value={`${kpi.cvrMargin}%`}
              sub={`Prev: ${kpi.previousMargin}%`}
              trend={kpi.cvrMargin >= kpi.previousMargin ? "up" : "down"}
              trendLabel={`+${(kpi.cvrMargin - kpi.previousMargin).toFixed(1)}% vs last period`}
              icon={<BarChart3 size={16} />}
              iconColor="var(--violet)"
            />
          </>
        )}
      </div>

      {/* Risk alerts + Action queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Risk Alerts
            </h2>
            <span className="badge chip-danger">{SEED_RISK_ALERTS.filter(r => r.severity === "danger").length} Critical</span>
          </div>
          {SEED_RISK_ALERTS.map(alert => (
            <RiskAlertCard key={alert.id} alert={alert} />
          ))}
        </div>

        <div className="card p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Today's Actions
            </h2>
            <button
              className="text-xs font-medium flex items-center gap-1"
              style={{ color: "var(--primary)" }}
              onClick={() => {}}
            >
              View all <ArrowRight size={12} />
            </button>
          </div>
          {SEED_ACTION_QUEUE.slice(0, 5).map(action => (
            <ActionQueueItem key={action.id} action={action} compact />
          ))}
        </div>
      </div>

      {/* Upcoming deadlines + Activity feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Upcoming Deadlines
              <span className="ml-2 text-xs font-normal" style={{ color: "var(--text-muted)" }}>Next 7 days</span>
            </h2>
          </div>
          <div className="flex flex-col gap-2">
            {SEED_UPCOMING_DEADLINES.map(dl => (
              <DeadlineItem key={dl.id} deadline={dl} />
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 card p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Recent Activity
            </h2>
            <button className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--primary)" }}>
              View all <ArrowRight size={12} />
            </button>
          </div>
          <div className="flex flex-col gap-0">
            {liveActivities.length > 0 ? (
              liveActivities.slice(0, 8).map((event, idx) => (
                <LiveActivityFeedItem key={event.id} event={event} last={idx === Math.min(7, liveActivities.length - 1)} />
              ))
            ) : (
              SEED_ACTIVITY_FEED.slice(0, 8).map((item, idx) => (
                <ActivityFeedItem key={item.id} item={item} last={idx === 7} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <PaymentStatusWidget />
        <CVRMarginSnapshot />
        <EvidenceHealthWidget />
      </div>

      {/* Portfolio Health Score (cross_project_analytics flag) */}
      {getFlag("cross_project_analytics") && <PortfolioHealthWidget />}

      {/* Final account closeout */}
      <FinalAccountWidget />
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({ label, value, sub, trend, trendLabel, icon, iconColor }: {
  label: string;
  value: string;
  sub?: string;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  icon?: React.ReactNode;
  iconColor?: string;
}) {
  return (
    <div className="kpi-card hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-1">
        <div className="kpi-label">{label}</div>
        {icon && (
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: iconColor ? iconColor + "18" : "var(--bg-muted)", color: iconColor ?? "var(--text-muted)" }}
          >
            {icon}
          </div>
        )}
      </div>
      <div className="kpi-value">{value}</div>
      {sub && <div className="text-xs" style={{ color: "var(--text-muted)" }}>{sub}</div>}
      {trendLabel && (
        <div className="flex items-center gap-1 mt-1">
          {trend === "up" && <TrendingUp size={12} style={{ color: "var(--success)" }} />}
          {trend === "down" && <TrendingDown size={12} style={{ color: "var(--danger)" }} />}
          <span
            className="text-[11px] font-medium"
            style={{
              color: trend === "up" ? "var(--success)" : trend === "down" ? "var(--danger)" : "var(--text-muted)",
            }}
          >
            {trendLabel}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Risk Alert Card ──────────────────────────────────────────────────────────

function RiskAlertCard({ alert }: { alert: typeof SEED_RISK_ALERTS[0] }) {
  const isDanger = alert.severity === "danger";
  return (
    <div
      className="rounded-xl p-4 flex gap-3"
      style={{
        background: isDanger ? "var(--danger-bg)" : "var(--warning-bg)",
        border: `1px solid ${isDanger ? "var(--danger)" : "var(--warning)"}22`,
      }}
    >
      <div
        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5"
        style={{
          background: isDanger ? "var(--danger)" : "var(--warning)",
          color: "#fff",
        }}
      >
        {isDanger ? <AlertCircle size={15} /> : <AlertTriangle size={15} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold" style={{ color: isDanger ? "var(--danger-text)" : "var(--warning-text)" }}>
            {alert.title}
          </p>
          <span
            className="badge flex-shrink-0"
            style={{
              background: isDanger ? "var(--danger)" : "var(--warning)",
              color: "#fff",
              fontSize: "10px",
            }}
          >
            {isDanger ? "Critical" : "Warning"}
          </span>
        </div>
        <p className="text-xs mt-0.5" style={{ color: isDanger ? "var(--danger-text)" : "var(--warning-text)", opacity: 0.85 }}>
          {alert.description}
        </p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs font-mono font-semibold" style={{ color: "var(--text-muted)" }}>
            {alert.projectRef}
          </span>
          {alert.dueDate && (
            <span className="text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
              <Clock size={10} /> Due {formatDate(alert.dueDate)}
            </span>
          )}
          <a
            href={alert.link}
            className="text-xs font-semibold ml-auto flex items-center gap-1"
            style={{ color: isDanger ? "var(--danger)" : "var(--warning)" }}
          >
            Take action <ChevronRight size={12} />
          </a>
        </div>
      </div>
    </div>
  );
}

// ─── Action Queue Item ────────────────────────────────────────────────────────

const ACTION_TYPE_META: Record<string, { color: string; label: string }> = {
  notice:      { color: "var(--danger)",  label: "Notice" },
  application: { color: "var(--primary)", label: "Application" },
  evidence:    { color: "var(--warning)", label: "Evidence" },
  cvr:         { color: "var(--violet)",  label: "CVR" },
  report:      { color: "var(--cyan)",    label: "Report" },
};

function ActionQueueItem({ action, compact = false }: {
  action: typeof SEED_ACTION_QUEUE[0];
  compact?: boolean;
}) {
  const meta = ACTION_TYPE_META[action.type] ?? { color: "var(--text-muted)", label: action.type };
  const isCritical = action.priority === "critical";
  return (
    <div className={cn("flex items-start gap-3 py-2 border-b last:border-0", isCritical && "")}>
      <div
        className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-2"
        style={{ background: meta.color }}
      />
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium leading-tight", isCritical && "font-semibold")} style={{ color: "var(--text-primary)" }}>
          {action.title}
        </p>
        {!compact && (
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{action.project}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span
            className="badge text-[10px] px-1.5 py-0"
            style={{ background: meta.color + "18", color: meta.color }}
          >
            {meta.label}
          </span>
          <span className="text-[11px]" style={{ color: isCritical ? "var(--danger)" : "var(--text-muted)" }}>
            Due {formatDate(action.dueDate)}
          </span>
        </div>
      </div>
      <button className="btn btn-ghost btn-icon btn-sm flex-shrink-0">
        <ChevronRight size={13} />
      </button>
    </div>
  );
}

// ─── Deadline Item ────────────────────────────────────────────────────────────

function DeadlineItem({ deadline }: { deadline: typeof SEED_UPCOMING_DEADLINES[0] }) {
  const colorMap = {
    danger: "var(--danger)",
    warning: "var(--warning)",
    info: "var(--primary)",
    success: "var(--success)",
  };
  const color = colorMap[deadline.severity] ?? "var(--text-muted)";
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div
        className="flex-shrink-0 w-10 h-10 rounded-lg flex flex-col items-center justify-center text-white text-[10px] font-bold leading-tight"
        style={{ background: color }}
      >
        <span>{new Date(deadline.date).getDate()}</span>
        <span>{new Date(deadline.date).toLocaleString("en-GB", { month: "short" })}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{deadline.title}</p>
        <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{deadline.project}</p>
      </div>
    </div>
  );
}

// ─── Activity Feed Item ───────────────────────────────────────────────────────

function ActivityFeedItem({ item, last }: { item: typeof SEED_ACTIVITY_FEED[0]; last: boolean }) {
  return (
    <div className={cn("flex items-start gap-3 py-2.5", !last && "border-b")} style={{ borderColor: "var(--border-subtle)" }}>
      <div
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
        style={{ background: "var(--primary)" }}
      >
        {item.initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-tight" style={{ color: "var(--text-primary)" }}>
          <span className="font-semibold">{item.user}</span>
          {" "}{item.action}{" "}
          <span style={{ color: "var(--text-secondary)" }}>{item.subject}</span>
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
          {formatRelative(item.timestamp)}
        </p>
      </div>
    </div>
  );
}

// ─── Live Activity Feed Item ──────────────────────────────────────────────────

function LiveActivityFeedItem({ event, last }: { event: LiveAuditEvent; last: boolean }) {
  const label = event.action.replace(/_/g, " ");
  const resource = event.resource_type ? `${event.resource_type}${event.resource_id ? ` #${event.resource_id.slice(0, 8)}` : ""}` : "";
  const actorInitials = (event.user_id ?? "SYS").slice(0, 2).toUpperCase();

  return (
    <div className={cn("flex items-start gap-3 py-2.5", !last && "border-b")} style={{ borderColor: "var(--border-subtle)" }}>
      <div
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold"
        style={{ background: "var(--primary)" }}
      >
        {actorInitials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-tight" style={{ color: "var(--text-primary)" }}>
          <span className="font-semibold capitalize">{label}</span>
          {resource && <span style={{ color: "var(--text-secondary)" }}> · {resource}</span>}
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
          {formatRelative(event.created_at)}
        </p>
      </div>
    </div>
  );
}

// ─── Payment Status Widget ────────────────────────────────────────────────────

const TOOLTIP_STYLE = {
  background: "var(--bg-surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  fontSize: "12px",
  color: "var(--text-primary)",
  boxShadow: "var(--shadow-sm)",
};

function PaymentStatusWidget() {
  const total = SEED_PAYMENT_STATUS.reduce((s, d) => s + d.value, 0);
  return (
    <div className="card p-5 flex flex-col gap-4">
      <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        Payment Status
      </h3>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={SEED_PAYMENT_STATUS}
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={78}
            paddingAngle={3}
            dataKey="value"
          >
            {SEED_PAYMENT_STATUS.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: number) => formatCurrency(v)}
            contentStyle={TOOLTIP_STYLE}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-col gap-1.5">
        {SEED_PAYMENT_STATUS.map(d => (
          <div key={d.name} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.fill }} />
            <span className="text-xs flex-1 truncate" style={{ color: "var(--text-secondary)" }}>{d.name}</span>
            <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
              {((d.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CVR Margin Snapshot ──────────────────────────────────────────────────────

function CVRMarginSnapshot() {
  return (
    <div className="card p-5 flex flex-col gap-4">
      <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        CVR Margin by Project
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={SEED_CVR_MARGIN} margin={{ top: 0, right: 4, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="project"
            tick={{ fontSize: 10, fill: "var(--text-muted)" }}
            tickLine={false}
            axisLine={false}
            interval={0}
            angle={-30}
            textAnchor="end"
            height={48}
          />
          <YAxis
            tick={{ fontSize: 10, fill: "var(--text-muted)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            formatter={(v: number) => [`${v}%`, ""]}
            contentStyle={TOOLTIP_STYLE}
          />
          <Bar dataKey="target" name="Target" fill="var(--border-strong)" radius={[3, 3, 0, 0]} />
          <Bar dataKey="margin" name="Margin" fill="var(--primary)" radius={[3, 3, 0, 0]} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Evidence Health Widget ───────────────────────────────────────────────────

function EvidenceHealthWidget() {
  const total = SEED_EVIDENCE_HEALTH.reduce((s, d) => s + d.value, 0);
  return (
    <div className="card p-5 flex flex-col gap-4">
      <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
        Evidence Health
      </h3>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={SEED_EVIDENCE_HEALTH}
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={78}
            paddingAngle={3}
            dataKey="value"
          >
            {SEED_EVIDENCE_HEALTH.map((entry, i) => (
              <Cell key={i} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v: number) => [`${v} files`, ""]}
            contentStyle={TOOLTIP_STYLE}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-col gap-1.5">
        {SEED_EVIDENCE_HEALTH.map(d => (
          <div key={d.name} className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: d.fill }} />
            <span className="text-xs flex-1 truncate" style={{ color: "var(--text-secondary)" }}>{d.name}</span>
            <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
              {d.value}
            </span>
          </div>
        ))}
        <div className="mt-1 pt-1.5 border-t" style={{ borderColor: "var(--border)" }}>
          <div className="flex justify-between text-xs">
            <span style={{ color: "var(--text-muted)" }}>Total files</span>
            <span className="font-semibold">{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Portfolio Health Widget ──────────────────────────────────────────────────

const HEALTH_COMPONENTS = [
  { label: "Margin Performance", score: 78 },
  { label: "Payment Performance", score: 62 },
  { label: "CE Resolution", score: 55 },
];

function PortfolioHealthWidget() {
  const compositeScore = Math.round(
    HEALTH_COMPONENTS.reduce((s, c) => s + c.score, 0) / HEALTH_COMPONENTS.length
  );

  const color = compositeScore > 75 ? "var(--success)" : compositeScore >= 50 ? "var(--warning)" : "var(--danger)";
  const label = compositeScore > 75 ? "Healthy" : compositeScore >= 50 ? "At Risk" : "Critical";

  const gaugeData = [
    { name: "score", value: compositeScore, fill: color },
    { name: "remainder", value: 100 - compositeScore, fill: "var(--bg-muted)" },
  ];

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Portfolio Health Score
        </h3>
        <span
          className="badge text-xs font-semibold"
          style={{
            background: color + "18",
            color,
          }}
        >
          {label}
        </span>
      </div>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative flex-shrink-0">
          <ResponsiveContainer width={140} height={140}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={65}
              startAngle={180}
              endAngle={0}
              data={gaugeData}
            >
              <RadialBar dataKey="value" cornerRadius={4} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ paddingTop: 20 }}>
            <span className="text-3xl font-bold tabular-nums" style={{ color }}>{compositeScore}</span>
            <span className="text-[10px] font-medium" style={{ color: "var(--text-muted)" }}>/ 100</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-3 w-full">
          {HEALTH_COMPONENTS.map(c => {
            const compColor = c.score > 75 ? "var(--success)" : c.score >= 50 ? "var(--warning)" : "var(--danger)";
            return (
              <div key={c.label} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{c.label}</span>
                  <span className="text-xs font-bold tabular-nums" style={{ color: compColor }}>{c.score}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${c.score}%`, background: compColor }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Final Account Close-Out Widget ──────────────────────────────────────────

function FinalAccountWidget() {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Final Account Close-Out Progress
        </h3>
        <button className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--primary)" }}>
          View all <ArrowRight size={12} />
        </button>
      </div>
      <div className="flex flex-col gap-4">
        {SEED_FINAL_ACCOUNT.map(fa => (
          <div key={fa.project} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{fa.project}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{formatCurrency(fa.value)}</span>
                <span
                  className="badge"
                  style={{
                    background: fa.status === "closing" ? "var(--warning-bg)" : "var(--success-bg)",
                    color: fa.status === "closing" ? "var(--warning-text)" : "var(--success-text)",
                  }}
                >
                  {fa.status === "closing" ? "Closing" : "Active"}
                </span>
                <span className="text-xs font-bold tabular-nums w-8 text-right" style={{ color: fa.percent >= 80 ? "var(--success)" : "var(--text-secondary)" }}>
                  {fa.percent}%
                </span>
              </div>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${fa.percent}%`,
                  background: fa.percent >= 90 ? "var(--success)" : fa.percent >= 60 ? "var(--primary)" : "var(--warning)",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Action Queue Tab ─────────────────────────────────────────────────────────

function ActionQueueTab() {
  const grouped = {
    critical: SEED_ACTION_QUEUE.filter(a => a.priority === "critical"),
    high: SEED_ACTION_QUEUE.filter(a => a.priority === "high"),
    medium: SEED_ACTION_QUEUE.filter(a => a.priority === "medium"),
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {SEED_ACTION_QUEUE.length} actions requiring attention across your projects.
        </p>
        <button className="btn btn-secondary btn-sm"><RefreshCw size={14} />Refresh</button>
      </div>
      {(["critical", "high", "medium"] as const).map(priority => (
        grouped[priority].length > 0 && (
          <div key={priority}>
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: priority === "critical" ? "var(--danger)" : priority === "high" ? "var(--warning)" : "var(--primary)",
                }}
              />
              <h3 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
                {priority} Priority
              </h3>
              <span className="badge chip-muted ml-1">{grouped[priority].length}</span>
            </div>
            <div className="card overflow-hidden">
              {grouped[priority].map((action, idx) => (
                <div
                  key={action.id}
                  className={cn("flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer", idx < grouped[priority].length - 1 && "border-b")}
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: (ACTION_TYPE_META[action.type]?.color ?? "var(--bg-muted)") + "18",
                      color: ACTION_TYPE_META[action.type]?.color ?? "var(--text-muted)",
                    }}
                  >
                    <Zap size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{action.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{action.project}</p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className="badge text-[10px]"
                      style={{
                        background: ACTION_TYPE_META[action.type]?.color + "18",
                        color: ACTION_TYPE_META[action.type]?.color,
                      }}
                    >
                      {ACTION_TYPE_META[action.type]?.label ?? action.type}
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Due {formatDate(action.dueDate)}</span>
                    <button className="btn btn-secondary btn-sm">Open</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      ))}
    </div>
  );
}

// ─── Commercial Health Tab ────────────────────────────────────────────────────

function CommercialHealthTab({ loading }: { loading: boolean }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Portfolio TCV" value={formatCurrency(SEED_KPI.totalContractValue)} icon={<FolderKanban size={16} />} iconColor="var(--primary)" />
        <KPICard label="Certified" value={formatCurrency(SEED_KPI.certifiedToDate)} icon={<CheckCircle2 size={16} />} iconColor="var(--success)" />
        <KPICard label="Avg CVR Margin" value={`${SEED_KPI.cvrMargin}%`} trend="up" trendLabel="+1.4% vs prior period" icon={<BarChart3 size={16} />} iconColor="var(--violet)" />
        <KPICard label="Disputed" value={formatCurrency(600_000)} trend="down" trendLabel="1 active dispute" icon={<AlertCircle size={16} />} iconColor="var(--danger)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CVRMarginSnapshot />
        <PaymentStatusWidget />
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          Project Commercial Summary
        </h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Project</th>
                <th className="text-right">Contract Value</th>
                <th className="text-right">Certified</th>
                <th className="text-right">Margin %</th>
                <th>Target</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {SEED_CVR_MARGIN.map(p => (
                <tr key={p.project}>
                  <td className="font-medium">{p.project}</td>
                  <td className="text-right tabular-nums">{formatCurrency(4_850_000)}</td>
                  <td className="text-right tabular-nums">{formatCurrency(3_492_000)}</td>
                  <td className={cn("text-right font-bold tabular-nums", p.margin >= p.target ? "text-[var(--success)]" : "text-[var(--danger)]")}>
                    {p.margin}%
                  </td>
                  <td className="text-right tabular-nums" style={{ color: "var(--text-muted)" }}>{p.target}%</td>
                  <td>
                    <span className={cn("badge", p.margin >= p.target ? "chip-success" : "chip-danger")}>
                      {p.margin >= p.target ? "On Target" : "Below Target"}
                    </span>
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

// ─── Upcoming Deadlines Tab ───────────────────────────────────────────────────

function UpcomingDeadlinesTab() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        {SEED_UPCOMING_DEADLINES.length} deadlines in the next 7 days.
      </p>
      <div className="card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Title</th>
              <th>Project</th>
              <th>Type</th>
              <th>Priority</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {SEED_UPCOMING_DEADLINES.map(dl => (
              <tr key={dl.id}>
                <td className="font-medium tabular-nums">{formatDate(dl.date)}</td>
                <td className="font-medium">{dl.title}</td>
                <td style={{ color: "var(--text-muted)" }}>{dl.project}</td>
                <td>
                  <span className="badge chip-muted capitalize">{dl.type.replace("_", " ")}</span>
                </td>
                <td>
                  <span
                    className={cn(
                      "badge",
                      dl.severity === "danger" && "chip-danger",
                      dl.severity === "warning" && "chip-warning",
                      dl.severity === "info" && "chip-info",
                    )}
                  >
                    {dl.severity}
                  </span>
                </td>
                <td>
                  <button className="btn btn-ghost btn-sm btn-icon">
                    <ChevronRight size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Recent Activity Tab ──────────────────────────────────────────────────────

function RecentActivityTab({ liveActivities }: { liveActivities: LiveAuditEvent[] }) {
  const useLive = liveActivities.length > 0;
  const count = useLive ? liveActivities.length : SEED_ACTIVITY_FEED.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Last {count} events across all projects.
          {useLive && <span className="ml-2 badge chip-success text-[10px]">Live</span>}
        </p>
        <button className="btn btn-secondary btn-sm"><Download size={14} />Export</button>
      </div>
      <div className="card p-5">
        {useLive ? (
          liveActivities.map((event, idx) => (
            <LiveActivityFeedItem key={event.id} event={event} last={idx === liveActivities.length - 1} />
          ))
        ) : (
          SEED_ACTIVITY_FEED.map((item, idx) => (
            <ActivityFeedItem key={item.id} item={item} last={idx === SEED_ACTIVITY_FEED.length - 1} />
          ))
        )}
      </div>
    </div>
  );
}

// ─── AI Insights Tab ─────────────────────────────────────────────────────────

const AI_INSIGHTS = [
  {
    id: "ai-1",
    type: "risk",
    title: "High dispute risk on Thornfield Commercial Hub",
    body: "VO-047 has been outstanding for 80 days without agreed position. Based on similar cases in your portfolio, I estimate a 73% probability of formal adjudication if not resolved within 14 days. Recommend initiating without prejudice discussion with Thornfield Estates.",
    project: "Thornfield Commercial Hub",
    confidence: 87,
  },
  {
    id: "ai-2",
    type: "opportunity",
    title: "Retention release window – Whitfield Leisure",
    body: "Defects liability period on Whitfield Leisure Centre expired 2026-05-31. Retention of £72,000 (3% of £2.4M) is now recoverable. No formal claim has been submitted yet.",
    project: "Whitfield Leisure Centre",
    confidence: 98,
  },
  {
    id: "ai-3",
    type: "evidence",
    title: "Evidence gap on Harlow Civic – 12 unlinked changes",
    body: "12 changes totalling £184,000 have no linked contemporary records. In a dispute scenario, unsubstantiated claims are typically reduced by 40–60%. Recommend uploading site diaries and AI-generated daywork sheets.",
    project: "Harlow Civic Centre Refurb",
    confidence: 91,
  },
  {
    id: "ai-4",
    type: "forecast",
    title: "CVR margin trend: Eastside Block A",
    body: "Margin has improved from 14.6% (Period 4) to 16.4% (Period 8), outperforming the 15.0% target. If current cost performance holds, projected final margin is 17.1%.",
    project: "Eastside Residential Block A",
    confidence: 82,
  },
];

function AIInsightsTab() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3 p-4 rounded-xl" style={{ background: "var(--violet-bg)", border: "1px solid var(--violet)22" }}>
        <Brain size={20} style={{ color: "var(--violet)", flexShrink: 0 }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--violet-text)" }}>MeasureDeck AI – Commercial Intelligence</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--violet-text)", opacity: 0.8 }}>
            Analysed 6 active projects, 428 changes, 1,014 evidence files and payment history. Last updated: 10 Jun 2026, 09:00.
          </p>
        </div>
        <button className="btn btn-sm ml-auto flex-shrink-0" style={{ background: "var(--violet)", color: "#fff" }}>
          <Sparkles size={13} />Ask Copilot
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {AI_INSIGHTS.map(insight => {
          const typeColor = insight.type === "risk" ? "var(--danger)" : insight.type === "opportunity" ? "var(--success)" : insight.type === "evidence" ? "var(--warning)" : "var(--primary)";
          return (
            <div key={insight.id} className="card p-5 flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: typeColor + "18", color: typeColor }}
                >
                  {insight.type === "risk" && <AlertCircle size={15} />}
                  {insight.type === "opportunity" && <CheckCircle2 size={15} />}
                  {insight.type === "evidence" && <Shield size={15} />}
                  {insight.type === "forecast" && <TrendingUp size={15} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="badge text-[10px] capitalize" style={{ background: typeColor + "18", color: typeColor }}>
                      {insight.type}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {insight.confidence}% confidence
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold mt-1" style={{ color: "var(--text-primary)" }}>{insight.title}</h4>
                </div>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{insight.body}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{insight.project}</span>
                <button className="btn btn-ghost btn-sm text-xs" style={{ color: "var(--primary)" }}>
                  View details <ArrowRight size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft, ShieldOff, Eye, CreditCard, Users, Building2, HardDrive,
  Activity, Shield, ToggleLeft, ToggleRight, UserPlus, Trash2, AlertTriangle,
  Download, Flag, Zap, CheckCircle, XCircle, Globe, Key, RefreshCw,
  Webhook, Lock, Plus, Send, DollarSign, Calendar, TrendingUp, BarChart2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import { cn, formatCurrency, formatDate, formatDateTime, formatRelative, getInitials } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  created_at: string;
  updated_at: string;
  owner_name: string;
  owner_email: string;
  billing_cycle: "monthly" | "annual";
  mrr: number;
  storage_used_mb: number;
  storage_limit_mb: number;
  ai_credits_used: number;
  ai_credits_limit: number;
}

interface Member {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  status: "active" | "invited" | "suspended";
  joined_at: string;
  last_active_at: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
  contract_sum: number;
  created_at: string;
  member_count: number;
  last_activity: string;
}

interface Invoice {
  id: string;
  number: string;
  date: string;
  amount: number;
  status: "paid" | "open" | "void" | "uncollectible";
}

interface FeatureFlag {
  key: string;
  label: string;
  description: string;
  default_value: boolean;
  override: boolean | null;
}

interface StorageBucket {
  name: string;
  files_count: number;
  total_mb: number;
  last_upload: string;
}

interface AuditEntry {
  id: string;
  actor: string;
  action: string;
  entity_type: string;
  summary: string;
  created_at: string;
}

interface Integration {
  key: string;
  name: string;
  description: string;
  connected: boolean;
  icon: React.ReactNode;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_WORKSPACE: Workspace = {
  id: "ws-001",
  name: "Apex Construction Ltd",
  slug: "apex-construction",
  plan: "Professional",
  status: "active",
  created_at: "2025-01-15T09:00:00Z",
  updated_at: "2026-06-09T14:00:00Z",
  owner_name: "James Thornton",
  owner_email: "james@apex.co.uk",
  billing_cycle: "annual",
  mrr: 199,
  storage_used_mb: 2340,
  storage_limit_mb: 10000,
  ai_credits_used: 340,
  ai_credits_limit: 1000,
};

const SEED_MEMBERS: Member[] = [
  { id: "u1", name: "James Thornton", email: "james@apex.co.uk", avatar_url: null, role: "Admin", status: "active", joined_at: "2025-01-15T09:00:00Z", last_active_at: "2026-06-10T08:55:00Z" },
  { id: "u2", name: "Sarah Malik", email: "sarah@apex.co.uk", avatar_url: null, role: "Manager", status: "active", joined_at: "2025-02-20T10:00:00Z", last_active_at: "2026-06-09T16:20:00Z" },
  { id: "u3", name: "Oliver Reed", email: "oliver@apex.co.uk", avatar_url: null, role: "Viewer", status: "active", joined_at: "2025-03-01T09:00:00Z", last_active_at: "2026-06-05T11:00:00Z" },
  { id: "u4", name: "Priya Nair", email: "priya@apex.co.uk", avatar_url: null, role: "Manager", status: "active", joined_at: "2025-04-12T10:00:00Z", last_active_at: "2026-06-08T09:00:00Z" },
  { id: "u5", name: "Tom Whitfield", email: "tom@apex.co.uk", avatar_url: null, role: "Viewer", status: "invited", joined_at: "2026-06-08T09:00:00Z", last_active_at: "" },
];

const SEED_PROJECTS: Project[] = [
  { id: "p1", name: "Phase 1 — Foundation Works", status: "active", contract_sum: 485000, created_at: "2025-02-01T09:00:00Z", member_count: 4, last_activity: "2026-06-10T09:14:00Z" },
  { id: "p2", name: "Phase 2 — Superstructure", status: "active", contract_sum: 1240000, created_at: "2025-06-01T09:00:00Z", member_count: 3, last_activity: "2026-06-09T15:00:00Z" },
  { id: "p3", name: "Office Fit-Out — Block A", status: "completed", contract_sum: 320000, created_at: "2025-01-20T09:00:00Z", member_count: 2, last_activity: "2026-03-20T10:00:00Z" },
  { id: "p4", name: "M&E Package Review", status: "draft", contract_sum: 95000, created_at: "2026-05-10T09:00:00Z", member_count: 1, last_activity: "2026-05-10T09:00:00Z" },
];

const SEED_INVOICES: Invoice[] = [
  { id: "inv-001", number: "INV-2026-042", date: "2026-06-01T00:00:00Z", amount: 199, status: "paid" },
  { id: "inv-002", number: "INV-2026-036", date: "2026-05-01T00:00:00Z", amount: 199, status: "paid" },
  { id: "inv-003", number: "INV-2026-029", date: "2026-04-01T00:00:00Z", amount: 199, status: "paid" },
  { id: "inv-004", number: "INV-2026-022", date: "2026-03-01T00:00:00Z", amount: 199, status: "paid" },
  { id: "inv-005", number: "INV-2025-001", date: "2025-01-15T00:00:00Z", amount: 1990, status: "paid" },
];

const SEED_FLAGS: FeatureFlag[] = [
  { key: "ai_copilot", label: "AI Copilot", description: "Enable AI-powered QS analysis and suggestions", default_value: true, override: null },
  { key: "bim_viewer", label: "BIM Viewer", description: "3D BIM model viewer within projects", default_value: false, override: true },
  { key: "advanced_analytics", label: "Advanced Analytics", description: "Enhanced reporting and dashboard insights", default_value: true, override: null },
  { key: "export_pdf", label: "PDF Export", description: "Export reports and documents as PDF", default_value: true, override: null },
  { key: "custom_branding", label: "Custom Branding", description: "White-label portal with custom logo/colours", default_value: false, override: false },
  { key: "api_access", label: "API Access", description: "REST API access for integrations", default_value: false, override: true },
  { key: "bulk_upload", label: "Bulk Upload", description: "Upload multiple files simultaneously", default_value: true, override: null },
  { key: "enterprise_sso", label: "Enterprise SSO", description: "SAML/OIDC single sign-on support", default_value: false, override: null },
];

const SEED_STORAGE: StorageBucket[] = [
  { name: "evidence-files", files_count: 342, total_mb: 1200, last_upload: "2026-06-10T09:14:00Z" },
  { name: "drawings", files_count: 87, total_mb: 900, last_upload: "2026-06-09T15:30:00Z" },
  { name: "exports", files_count: 56, total_mb: 240, last_upload: "2026-06-08T11:00:00Z" },
];

const SEED_AUDIT: AuditEntry[] = [
  { id: "ae1", actor: "James Thornton", action: "project.create", entity_type: "project", summary: "Created Phase 1 — Foundation Works", created_at: "2026-06-10T09:14:00Z" },
  { id: "ae2", actor: "Sarah Malik", action: "evidence.upload", entity_type: "file", summary: "Uploaded IMG_2044.jpg to Phase 2", created_at: "2026-06-09T15:32:00Z" },
  { id: "ae3", actor: "Oliver Reed", action: "report.view", entity_type: "report", summary: "Viewed Monthly Cost Summary", created_at: "2026-06-08T11:00:00Z" },
  { id: "ae4", actor: "Priya Nair", action: "member.invite", entity_type: "invite", summary: "Invited tom@apex.co.uk as Viewer", created_at: "2026-06-07T08:50:00Z" },
  { id: "ae5", actor: "James Thornton", action: "plan.upgrade", entity_type: "subscription", summary: "Upgraded from Starter to Professional", created_at: "2025-01-15T14:00:00Z" },
];

const SEED_USAGE_CHART = [
  { month: "Jan", ai: 180, api: 420 },
  { month: "Feb", ai: 220, api: 530 },
  { month: "Mar", ai: 290, api: 600 },
  { month: "Apr", ai: 260, api: 480 },
  { month: "May", ai: 310, api: 720 },
  { month: "Jun", ai: 340, api: 650 },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  "Overview", "Members", "Projects", "Billing & Subscription",
  "Feature Flags", "Storage", "Activity", "Integrations", "Security", "Admin Actions",
] as const;
type Tab = typeof TABS[number];

const PLAN_STYLES: Record<string, string> = {
  Professional: "bg-violet-100 text-violet-700",
  Enterprise: "bg-amber-100 text-amber-700",
  Starter: "bg-blue-100 text-blue-700",
};

const STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  suspended: "bg-red-100 text-red-700",
  trial: "bg-amber-100 text-amber-700",
  cancelled: "bg-gray-100 text-gray-600",
};

const PROJECT_STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  draft: "bg-gray-100 text-gray-600",
  archived: "bg-gray-100 text-gray-500",
  on_hold: "bg-amber-100 text-amber-700",
};

const INVOICE_STATUS_STYLES: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  open: "bg-amber-100 text-amber-700",
  void: "bg-gray-100 text-gray-500",
  uncollectible: "bg-red-100 text-red-700",
};

const MEMBER_STATUS_STYLES: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  invited: "bg-blue-100 text-blue-700",
  suspended: "bg-red-100 text-red-700",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-gray-200 rounded", className)} />;
}

function Chip({ label, className }: { label: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold", className)}>
      {label}
    </span>
  );
}

function KpiCard({ label, value, icon, sub }: { label: string; value: string | number; icon: React.ReactNode; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        <span className="text-[var(--primary)] opacity-70">{icon}</span>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-400">{sub}</div>}
    </div>
  );
}

function UsageBar({ label, used, limit, unit }: { label: string; used: number; limit: number; unit: string }) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const color = pct > 85 ? "#EF4444" : pct > 60 ? "#F59E0B" : "#10B981";
  return (
    <div className="mb-5">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">{used.toLocaleString()} / {limit.toLocaleString()} {unit} ({pct}%)</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div style={{ width: `${pct}%`, background: color }} className="h-full rounded-full transition-all duration-500" />
      </div>
    </div>
  );
}

function ConfirmDialog({
  open, title, description, confirmLabel, danger,
  onConfirm, onCancel, children,
}: {
  open: boolean; title: string; description: string; confirmLabel: string; danger?: boolean;
  onConfirm: () => void; onCancel: () => void; children?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-md p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 mb-4">{description}</p>
        {children}
        <div className="flex gap-3 justify-end mt-6">
          <button className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
          <button className={cn("btn btn-sm", danger ? "btn-danger" : "btn-primary")} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WorkspaceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const workspaceId = params?.workspaceId as string;

  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [loading, setLoading] = useState(true);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [storage, setStorage] = useState<StorageBucket[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [roleFilter, setRoleFilter] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] = useState("");
  const [auditActorFilter, setAuditActorFilter] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<null | "suspend" | "delete" | "impersonate" | "extend_trial" | "export">(null);
  const [deleteSlug, setDeleteSlug] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [twoFAEnforced, setTwoFAEnforced] = useState(false);
  const [ipAllowlist, setIpAllowlist] = useState("");
  const [sessionTimeout, setSessionTimeout] = useState("8");

  useEffect(() => {
    const timer = setTimeout(() => {
      setWorkspace(SEED_WORKSPACE);
      setMembers(SEED_MEMBERS);
      setProjects(SEED_PROJECTS);
      setInvoices(SEED_INVOICES);
      setFlags(SEED_FLAGS);
      setStorage(SEED_STORAGE);
      setAuditLog(SEED_AUDIT);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [workspaceId]);

  const toggleFlag = (key: string) => {
    setFlags((prev) =>
      prev.map((f) => {
        if (f.key !== key) return f;
        const currentEffective = f.override !== null ? f.override : f.default_value;
        return { ...f, override: !currentEffective };
      })
    );
    toast.success("Feature flag updated");
  };

  const resetFlag = (key: string) => {
    setFlags((prev) => prev.map((f) => f.key === key ? { ...f, override: null } : f));
    toast.success("Flag reset to default");
  };

  const handleSuspend = () => {
    toast.success(workspace?.status === "suspended" ? "Workspace unsuspended" : "Workspace suspended");
    setConfirmDialog(null);
    setSuspendReason("");
  };

  const handleDelete = () => {
    if (deleteSlug !== workspace?.slug) { toast.error("Slug does not match"); return; }
    toast.success("Workspace deletion queued — this may take a few minutes");
    setConfirmDialog(null);
    setDeleteSlug("");
  };

  const handleImpersonate = () => {
    toast.success(`Impersonating workspace owner ${workspace?.owner_name} — action logged`);
    setConfirmDialog(null);
  };

  const totalContractValue = projects.reduce((s, p) => s + p.contract_sum, 0);
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const filteredMembers = members.filter((m) => !roleFilter || m.role === roleFilter);
  const filteredProjects = projects.filter((p) => !projectStatusFilter || p.status === projectStatusFilter);
  const filteredAudit = auditLog.filter((e) => !auditActorFilter || e.actor.toLowerCase().includes(auditActorFilter.toLowerCase()));
  const activeMembers = members.filter((m) => m.status === "active").length;

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <XCircle size={40} className="text-red-400" />
        <p className="text-gray-500">Workspace not found</p>
        <button className="btn btn-secondary btn-sm" onClick={() => router.push("/admin/workspaces")}>Back to Workspaces</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dialogs */}
      <ConfirmDialog
        open={confirmDialog === "suspend"}
        title={workspace.status === "suspended" ? "Unsuspend Workspace" : "Suspend Workspace"}
        description={`${workspace.status === "suspended" ? "Restore access for" : "Block all members from accessing"} ${workspace.name}.`}
        confirmLabel={workspace.status === "suspended" ? "Unsuspend" : "Suspend"}
        danger={workspace.status !== "suspended"}
        onConfirm={handleSuspend}
        onCancel={() => setConfirmDialog(null)}
      >
        {workspace.status !== "suspended" && (
          <div className="mt-2">
            <label className="form-label">Reason (will be emailed to workspace owner)</label>
            <input className="form-input" value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} placeholder="Reason for suspension..." />
          </div>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmDialog === "impersonate"}
        title="Impersonate Workspace Owner"
        description={`You are about to impersonate ${workspace.owner_name} (${workspace.owner_email}). All actions taken will be attributed to them. This is logged.`}
        confirmLabel="Impersonate"
        danger
        onConfirm={handleImpersonate}
        onCancel={() => setConfirmDialog(null)}
      />

      <ConfirmDialog
        open={confirmDialog === "extend_trial"}
        title="Extend Trial"
        description={`Extend the trial period for ${workspace.name} by 14 days.`}
        confirmLabel="Extend Trial"
        onConfirm={() => { toast.success("Trial extended by 14 days"); setConfirmDialog(null); }}
        onCancel={() => setConfirmDialog(null)}
      />

      <ConfirmDialog
        open={confirmDialog === "export"}
        title="Export All Data"
        description={`This will queue a full data export for ${workspace.name}. The workspace owner will receive a download link via email when ready.`}
        confirmLabel="Start Export"
        onConfirm={() => { toast.success("Data export queued"); setConfirmDialog(null); }}
        onCancel={() => setConfirmDialog(null)}
      />

      <ConfirmDialog
        open={confirmDialog === "delete"}
        title="Delete Workspace — Irreversible"
        description={`This will permanently delete ${workspace.name} and all its data. Type the workspace slug to confirm.`}
        confirmLabel="Permanently Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => { setConfirmDialog(null); setDeleteSlug(""); }}
      >
        <div className="mt-3">
          <label className="form-label">Type <strong>{workspace.slug}</strong> to confirm</label>
          <input className="form-input" value={deleteSlug} onChange={(e) => setDeleteSlug(e.target.value)} placeholder={workspace.slug} />
        </div>
      </ConfirmDialog>

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button className="btn btn-ghost btn-sm" onClick={() => router.push("/admin/workspaces")}>
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[var(--primary)] flex items-center justify-center text-white font-bold text-lg">
                {getInitials(workspace.name)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl font-bold text-gray-900">{workspace.name}</h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 uppercase tracking-wide">
                    ADMIN
                  </span>
                  <code className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{workspace.slug}</code>
                  <Chip label={workspace.plan} className={PLAN_STYLES[workspace.plan] ?? "bg-gray-100 text-gray-700"} />
                  <Chip label={workspace.status} className={STATUS_STYLES[workspace.status] ?? "bg-gray-100 text-gray-600"} />
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{workspace.owner_email} · Created {formatDate(workspace.created_at)}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDialog("impersonate")}>
              <Eye size={14} /> Impersonate Owner
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => { setActiveTab("Billing & Subscription"); }}>
              <CreditCard size={14} /> Edit Plan
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDialog("export")}>
              <Download size={14} /> Export Data
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => setConfirmDialog("suspend")}>
              <ShieldOff size={14} /> {workspace.status === "suspended" ? "Unsuspend" : "Suspend"}
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Strip ───────────────────────────────────────────────────────── */}
      <div className="px-6 pt-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard label="Plan" value={workspace.plan} icon={<Zap size={16} />} sub={workspace.billing_cycle} />
          <KpiCard label="Members" value={members.length} icon={<Users size={16} />} sub={`${activeMembers} active`} />
          <KpiCard label="Projects" value={projects.length} icon={<Building2 size={16} />} sub={`${activeProjects} active`} />
          <KpiCard label="Monthly Revenue" value={formatCurrency(workspace.mrr)} icon={<TrendingUp size={16} />} sub={`ARR ${formatCurrency(workspace.mrr * 12)}`} />
          <KpiCard label="Storage Used" value={`${(workspace.storage_used_mb / 1000).toFixed(1)} GB`} icon={<HardDrive size={16} />} sub={`of ${workspace.storage_limit_mb / 1000} GB`} />
          <KpiCard label="Created" value={formatDate(workspace.created_at)} icon={<Calendar size={16} />} />
        </div>
      </div>

      {/* ── Tab Bar ─────────────────────────────────────────────────────────── */}
      <div className="px-6 mt-5">
        <div className="flex items-center gap-1 border-b border-gray-200 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                activeTab === t
                  ? "border-b-2 border-[var(--primary)] text-[var(--primary)]"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ─────────────────────────────────────────────────────── */}
      <div className="px-6 py-6 space-y-6">

        {/* ── 1. Overview ─────────────────────────────────────────────────── */}
        {activeTab === "Overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Workspace Details */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Workspace Details</h3>
              {[
                { label: "Name", value: workspace.name },
                { label: "Slug", value: workspace.slug, mono: true },
                { label: "Owner", value: `${workspace.owner_name} (${workspace.owner_email})` },
                { label: "Plan", value: workspace.plan },
                { label: "Billing Cycle", value: workspace.billing_cycle === "annual" ? "Annual" : "Monthly" },
                { label: "MRR", value: formatCurrency(workspace.mrr) },
                { label: "ARR", value: formatCurrency(workspace.mrr * 12) },
                { label: "Status", value: workspace.status },
                { label: "Created", value: formatDate(workspace.created_at) },
                { label: "Last Updated", value: formatDateTime(workspace.updated_at) },
              ].map(({ label, value, mono }) => (
                <div key={label} className="flex justify-between py-1.5 border-b border-gray-100 last:border-0 text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className={cn("font-medium text-gray-900 text-right max-w-xs truncate", mono && "font-mono text-xs")}>{value}</span>
                </div>
              ))}
            </div>

            <div className="space-y-6">
              {/* Activity Summary */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Activity Summary</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Total Projects", value: projects.length },
                    { label: "Active Projects", value: activeProjects },
                    { label: "Total Members", value: members.length },
                    { label: "Total Contract Value", value: formatCurrency(totalContractValue) },
                    { label: "AI Credits Used", value: `${workspace.ai_credits_used} / ${workspace.ai_credits_limit}` },
                    { label: "Audit Events (30d)", value: auditLog.length },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500 mb-1">{label}</p>
                      <p className="font-bold text-gray-900 text-sm">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Usage Bars */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-5">Resource Usage</h3>
                <UsageBar label="Storage" used={workspace.storage_used_mb} limit={workspace.storage_limit_mb} unit="MB" />
                <UsageBar label="AI Credits" used={workspace.ai_credits_used} limit={workspace.ai_credits_limit} unit="credits" />
                <UsageBar label="Members" used={activeMembers} limit={20} unit="seats" />
              </div>

              {/* Usage Chart */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Usage Trends (6 months)</h3>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={SEED_USAGE_CHART} margin={{ top: 0, right: 0, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="ai" name="AI Credits" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="api" name="API Calls" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ── 2. Members ──────────────────────────────────────────────────── */}
        {activeTab === "Members" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-gray-900">Members ({filteredMembers.length})</h3>
                <select className="form-input py-1 text-xs w-36" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="">All Roles</option>
                  <option value="Admin">Admin</option>
                  <option value="Manager">Manager</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-secondary btn-sm" onClick={() => toast.success("CSV export started")}>
                  <Download size={13} /> Export CSV
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => toast.info("Invite member modal opened")}>
                  <UserPlus size={13} /> Invite Member
                </button>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Last Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white text-xs font-bold flex items-center justify-center shrink-0">
                            {getInitials(m.name)}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{m.name}</span>
                        </div>
                      </td>
                      <td className="text-xs text-gray-500">{m.email}</td>
                      <td>
                        <Chip
                          label={m.role}
                          className={m.role === "Admin" ? "bg-red-100 text-red-700" : m.role === "Manager" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"}
                        />
                      </td>
                      <td><Chip label={m.status} className={MEMBER_STATUS_STYLES[m.status] ?? "bg-gray-100 text-gray-600"} /></td>
                      <td className="text-xs text-gray-500">{formatDate(m.joined_at)}</td>
                      <td className="text-xs text-gray-500">{m.last_active_at ? formatRelative(m.last_active_at) : "Never"}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button className="btn btn-ghost btn-sm text-xs" onClick={() => toast.info(`Change role for ${m.name}`)}>
                            Role
                          </button>
                          <button
                            className="btn btn-ghost btn-sm text-red-500 hover:text-red-700"
                            onClick={() => toast.success(`${m.name} removed from workspace`)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredMembers.length === 0 && (
                <div className="py-12 text-center text-sm text-gray-400">No members found</div>
              )}
            </div>
          </div>
        )}

        {/* ── 3. Projects ─────────────────────────────────────────────────── */}
        {activeTab === "Projects" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-gray-900">Projects ({filteredProjects.length})</h3>
                <select className="form-input py-1 text-xs w-36" value={projectStatusFilter} onChange={(e) => setProjectStatusFilter(e.target.value)}>
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
              <div className="text-sm text-gray-600 font-medium">
                Total Contract Value: <span className="text-gray-900 font-bold">{formatCurrency(totalContractValue)}</span>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Project Name</th>
                    <th>Status</th>
                    <th>Contract Sum</th>
                    <th>Created</th>
                    <th>Members</th>
                    <th>Last Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((p) => (
                    <tr key={p.id}>
                      <td className="text-sm font-semibold text-gray-900">{p.name}</td>
                      <td><Chip label={p.status} className={PROJECT_STATUS_STYLES[p.status] ?? "bg-gray-100 text-gray-600"} /></td>
                      <td className="text-sm font-medium text-gray-900">{formatCurrency(p.contract_sum)}</td>
                      <td className="text-xs text-gray-500">{formatDate(p.created_at)}</td>
                      <td className="text-sm text-gray-700">{p.member_count}</td>
                      <td className="text-xs text-gray-500">{formatRelative(p.last_activity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredProjects.length === 0 && (
                <div className="py-12 text-center text-sm text-gray-400">No projects found</div>
              )}
            </div>
          </div>
        )}

        {/* ── 4. Billing & Subscription ───────────────────────────────────── */}
        {activeTab === "Billing & Subscription" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Subscription Details */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Subscription</h3>
                {[
                  { label: "Plan", value: workspace.plan },
                  { label: "Status", value: workspace.status },
                  { label: "Billing Cycle", value: workspace.billing_cycle === "annual" ? "Annual" : "Monthly" },
                  { label: "MRR", value: formatCurrency(workspace.mrr) },
                  { label: "ARR", value: formatCurrency(workspace.mrr * 12) },
                  { label: "Current Period", value: "1 Jun 2026 – 31 May 2027" },
                  { label: "Next Renewal", value: "1 Jun 2027" },
                  { label: "Payment Method", value: "Visa ending ···· 4242" },
                  { label: "Discount", value: "None" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between py-1.5 border-b border-gray-100 last:border-0 text-sm">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium text-gray-900">{value}</span>
                  </div>
                ))}
                <div className="pt-3 flex gap-2 flex-wrap">
                  <button className="btn btn-primary btn-sm" onClick={() => toast.info("Upgrade plan modal")}>Upgrade Plan</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => toast.info("Downgrade plan modal")}>Downgrade</button>
                  <button className="btn btn-danger btn-sm" onClick={() => toast.error("Cancel subscription confirmation required")}>Cancel</button>
                </div>
              </div>

              {/* Coupon / Credit */}
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Apply Coupon / Credit</h3>
                  <div className="flex gap-2">
                    <input className="form-input flex-1 text-sm" placeholder="COUPON-CODE" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} />
                    <button className="btn btn-primary btn-sm" onClick={() => { toast.success(`Coupon ${couponCode} applied`); setCouponCode(""); }}>Apply</button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Extend Trial</h3>
                  <p className="text-sm text-gray-500 mb-3">Add 14 days to the current trial period.</p>
                  <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDialog("extend_trial")}>Extend 14 Days</button>
                </div>
              </div>
            </div>

            {/* Invoice History */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Invoice History</h3>
              </div>
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td><code className="text-xs text-gray-700">{inv.number}</code></td>
                      <td className="text-xs text-gray-500">{formatDate(inv.date)}</td>
                      <td className="text-sm font-medium text-gray-900">{formatCurrency(inv.amount)}</td>
                      <td><Chip label={inv.status} className={INVOICE_STATUS_STYLES[inv.status] ?? "bg-gray-100"} /></td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => toast.success(`Downloading ${inv.number}`)}>
                          <Download size={13} /> PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 5. Feature Flags ────────────────────────────────────────────── */}
        {activeTab === "Feature Flags" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h3 className="text-sm font-semibold text-gray-900">Feature Flag Overrides ({flags.length})</h3>
              <div className="flex gap-2">
                <button className="btn btn-secondary btn-sm" onClick={() => { setFlags((p) => p.map((f) => ({ ...f, override: true }))); toast.success("All flags enabled"); }}>
                  Enable All
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => { setFlags((p) => p.map((f) => ({ ...f, override: null }))); toast.success("All flags reset to default"); }}>
                  Reset All Defaults
                </button>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Key</th>
                    <th>Default</th>
                    <th>Override</th>
                    <th>Effective</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {flags.map((f) => {
                    const effective = f.override !== null ? f.override : f.default_value;
                    return (
                      <tr key={f.key}>
                        <td>
                          <p className="text-sm font-medium text-gray-900">{f.label}</p>
                          <p className="text-xs text-gray-400">{f.description}</p>
                        </td>
                        <td><code className="text-xs text-gray-500">{f.key}</code></td>
                        <td>
                          <Chip label={f.default_value ? "On" : "Off"} className={f.default_value ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"} />
                        </td>
                        <td>
                          {f.override !== null ? (
                            <Chip label={f.override ? "On" : "Off"} className={f.override ? "bg-violet-100 text-violet-700" : "bg-red-100 text-red-700"} />
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td>
                          <button
                            onClick={() => toggleFlag(f.key)}
                            className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", effective ? "bg-[var(--primary)]" : "bg-gray-300")}
                          >
                            <span className={cn("inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform", effective ? "translate-x-4.5" : "translate-x-0.5")} />
                          </button>
                        </td>
                        <td>
                          {f.override !== null && (
                            <button className="btn btn-ghost btn-sm text-xs" onClick={() => resetFlag(f.key)}>Reset</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 6. Storage ──────────────────────────────────────────────────── */}
        {activeTab === "Storage" && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <KpiCard label="Total Used" value={`${(workspace.storage_used_mb / 1000).toFixed(1)} GB`} icon={<HardDrive size={16} />} />
              <KpiCard label="Limit" value={`${workspace.storage_limit_mb / 1000} GB`} icon={<HardDrive size={16} />} />
              <KpiCard label="Used %" value={`${Math.round((workspace.storage_used_mb / workspace.storage_limit_mb) * 100)}%`} icon={<BarChart2 size={16} />} />
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <UsageBar label="Total Storage" used={workspace.storage_used_mb} limit={workspace.storage_limit_mb} unit="MB" />
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Bucket Breakdown</h3>
              </div>
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Bucket</th>
                    <th>Files</th>
                    <th>Total Size</th>
                    <th>Last Upload</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {storage.map((b) => (
                    <tr key={b.name}>
                      <td><code className="text-sm text-gray-800">{b.name}</code></td>
                      <td className="text-sm text-gray-900">{b.files_count.toLocaleString()}</td>
                      <td className="text-sm font-medium text-gray-900">{b.total_mb >= 1000 ? `${(b.total_mb / 1000).toFixed(1)} GB` : `${b.total_mb} MB`}</td>
                      <td className="text-xs text-gray-500">{formatRelative(b.last_upload)}</td>
                      <td>
                        <button className="btn btn-ghost btn-sm text-xs" onClick={() => toast.info(`Opening file browser for ${b.name}`)}>Browse</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 max-w-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Increase Storage Limit</h3>
              <div className="flex gap-2">
                <select className="form-input text-sm flex-1">
                  <option value="20">20 GB</option>
                  <option value="50">50 GB</option>
                  <option value="100">100 GB</option>
                </select>
                <button className="btn btn-primary btn-sm" onClick={() => toast.success("Storage limit updated")}>Update</button>
              </div>
            </div>
          </div>
        )}

        {/* ── 7. Activity ─────────────────────────────────────────────────── */}
        {activeTab === "Activity" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-gray-900">Audit Log ({filteredAudit.length})</h3>
                <input
                  className="form-input py-1 text-xs w-44"
                  placeholder="Filter by actor..."
                  value={auditActorFilter}
                  onChange={(e) => setAuditActorFilter(e.target.value)}
                />
              </div>
              <button className="btn btn-secondary btn-sm" onClick={() => toast.success("Export started")}>
                <Download size={13} /> Export CSV
              </button>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Actor</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Summary</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAudit.map((e) => (
                    <tr key={e.id}>
                      <td className="text-xs text-gray-500 whitespace-nowrap">{formatDateTime(e.created_at)}</td>
                      <td className="text-sm font-medium text-gray-900">{e.actor}</td>
                      <td><code className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{e.action}</code></td>
                      <td className="text-xs text-gray-500">{e.entity_type}</td>
                      <td className="text-sm text-gray-700 max-w-xs truncate">{e.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAudit.length === 0 && (
                <div className="py-12 text-center text-sm text-gray-400">No audit events found</div>
              )}
            </div>
          </div>
        )}

        {/* ── 8. Integrations ─────────────────────────────────────────────── */}
        {activeTab === "Integrations" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: "stripe", name: "Stripe", description: "Payment processing and billing", connected: true, icon: <CreditCard size={20} /> },
                { key: "email", name: "Email Provider (Resend)", description: "Transactional email delivery", connected: true, icon: <Send size={20} /> },
                { key: "slack", name: "Slack", description: "Team notifications and alerts", connected: false, icon: <Globe size={20} /> },
                { key: "zapier", name: "Zapier", description: "Workflow automation", connected: false, icon: <Zap size={20} /> },
              ].map((intg) => (
                <div key={intg.key} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", intg.connected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400")}>
                      {intg.icon}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{intg.name}</p>
                      <p className="text-xs text-gray-400">{intg.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Chip label={intg.connected ? "Connected" : "Disconnected"} className={intg.connected ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"} />
                    <button className="btn btn-ghost btn-sm text-xs" onClick={() => toast.info(`${intg.connected ? "Configuring" : "Connecting"} ${intg.name}`)}>
                      {intg.connected ? "Configure" : "Connect"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Webhook Endpoints */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Webhook size={15} /> Webhook Endpoints</h3>
                <button className="btn btn-secondary btn-sm" onClick={() => toast.info("Add webhook modal")}>
                  <Plus size={13} /> Add
                </button>
              </div>
              {[
                { url: "https://api.apex.co.uk/webhooks/measuredeck", events: "project.*, evidence.*", active: true },
                { url: "https://integration.apex.co.uk/hook/qsevents", events: "subscription.*", active: false },
              ].map((wh, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-xs font-mono text-gray-800">{wh.url}</p>
                    <p className="text-xs text-gray-400">Events: {wh.events}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Chip label={wh.active ? "Active" : "Inactive"} className={wh.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"} />
                    <button className="btn btn-ghost btn-sm text-xs" onClick={() => toast.success("Test payload sent")}>Test</button>
                  </div>
                </div>
              ))}
            </div>

            {/* API Keys */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2"><Key size={15} /> API Keys</h3>
                <button className="btn btn-secondary btn-sm" onClick={() => toast.info("Create API key modal")}>
                  <Plus size={13} /> New Key
                </button>
              </div>
              {[
                { name: "Production Key", created: "15 Jan 2025", last_used: "10 Jun 2026", prefix: "md_pk_live_..." },
                { name: "CI/CD Key", created: "20 Mar 2026", last_used: "08 Jun 2026", prefix: "md_pk_live_..." },
              ].map((k, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{k.name}</p>
                    <p className="text-xs text-gray-400"><code>{k.prefix}</code> · Created {k.created}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Last used {k.last_used}</span>
                    <button className="btn btn-ghost btn-sm text-red-500 text-xs" onClick={() => toast.success(`API key revoked`)}>Revoke</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 9. Security ─────────────────────────────────────────────────── */}
        {activeTab === "Security" && (
          <div className="space-y-6 max-w-2xl">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
              <h3 className="text-sm font-semibold text-gray-900">Authentication & Access Controls</h3>

              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">Enforce 2FA for all members</p>
                  <p className="text-xs text-gray-400">Require two-factor authentication workspace-wide</p>
                </div>
                <button
                  onClick={() => { setTwoFAEnforced((v) => !v); toast.success(`2FA enforcement ${twoFAEnforced ? "disabled" : "enabled"}`); }}
                  className={cn("relative inline-flex h-5 w-9 items-center rounded-full transition-colors", twoFAEnforced ? "bg-[var(--primary)]" : "bg-gray-300")}
                >
                  <span className={cn("inline-block h-3.5 w-3.5 rounded-full bg-white shadow transform transition-transform", twoFAEnforced ? "translate-x-4.5" : "translate-x-0.5")} />
                </button>
              </div>

              <div className="py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900 mb-1">SSO Configuration</p>
                <p className="text-xs text-gray-400 mb-3">SAML / OIDC single sign-on for Enterprise plan</p>
                <Chip label="Not Configured" className="bg-gray-100 text-gray-500" />
                <button className="btn btn-secondary btn-sm ml-3" onClick={() => toast.info("SSO configuration requires Enterprise plan")}>Configure SSO</button>
              </div>

              <div className="py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900 mb-2">IP Allowlist</p>
                <p className="text-xs text-gray-400 mb-2">Restrict access to specific IP ranges (CIDR notation, comma-separated)</p>
                <input
                  className="form-input text-sm"
                  placeholder="82.34.0.0/16, 10.0.0.0/8"
                  value={ipAllowlist}
                  onChange={(e) => setIpAllowlist(e.target.value)}
                />
                <button className="btn btn-secondary btn-sm mt-2" onClick={() => toast.success("IP allowlist saved")}>Save</button>
              </div>

              <div className="py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900 mb-2">Session Timeout (hours)</p>
                <select className="form-input text-sm w-32" value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)}>
                  <option value="1">1 hour</option>
                  <option value="4">4 hours</option>
                  <option value="8">8 hours</option>
                  <option value="24">24 hours</option>
                  <option value="168">7 days</option>
                </select>
                <button className="btn btn-secondary btn-sm ml-2" onClick={() => toast.success("Session timeout updated")}>Save</button>
              </div>

              <div className="py-2">
                <p className="text-sm font-medium text-gray-900 mb-3">Compliance Flags</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "GDPR Compliant", ok: true },
                    { label: "SOC2 Reviewed", ok: true },
                    { label: "ISO 27001", ok: false },
                    { label: "Data Processing Agreement", ok: true },
                  ].map(({ label, ok }) => (
                    <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium bg-white" style={{ borderColor: ok ? "#10B981" : "#D1D5DB", color: ok ? "#065F46" : "#6B7280" }}>
                      {ok ? <CheckCircle size={12} /> : <XCircle size={12} />}
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 10. Admin Actions ───────────────────────────────────────────── */}
        {activeTab === "Admin Actions" && (
          <div className="space-y-6 max-w-2xl">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Plan Management</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Change Plan</label>
                  <div className="flex gap-2">
                    <select className="form-input text-sm flex-1">
                      <option>Starter</option>
                      <option selected>Professional</option>
                      <option>Enterprise</option>
                    </select>
                    <button className="btn btn-primary btn-sm" onClick={() => toast.success("Plan updated")}>Apply</button>
                  </div>
                </div>
                <div>
                  <label className="form-label">Apply Discount (%)</label>
                  <div className="flex gap-2">
                    <input className="form-input text-sm flex-1" type="number" min="0" max="100" placeholder="e.g. 20" />
                    <button className="btn btn-secondary btn-sm" onClick={() => toast.success("Discount applied")}>Apply</button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Account Operations</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button className="btn btn-secondary" onClick={() => setConfirmDialog("impersonate")}>
                  <Eye size={14} /> Impersonate Owner
                </button>
                <button className="btn btn-secondary" onClick={() => setConfirmDialog("extend_trial")}>
                  <Calendar size={14} /> Extend Trial +14d
                </button>
                <button className="btn btn-secondary" onClick={() => setConfirmDialog("export")}>
                  <Download size={14} /> Export All Data
                </button>
                <button className="btn btn-secondary" onClick={() => toast.info("Transfer ownership modal")}>
                  <Users size={14} /> Transfer Ownership
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={16} className="text-red-500" />
                <h3 className="text-sm font-semibold text-red-700">Danger Zone</h3>
              </div>

              <div className="p-4 border border-amber-200 bg-amber-50 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-900">{workspace.status === "suspended" ? "Unsuspend Workspace" : "Suspend Workspace"}</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {workspace.status === "suspended"
                      ? "Restore workspace access for all members."
                      : "Block all workspace members immediately. Reason will be emailed to owner."}
                  </p>
                </div>
                <button className="btn btn-warning btn-sm" onClick={() => setConfirmDialog("suspend")}>
                  <ShieldOff size={13} /> {workspace.status === "suspended" ? "Unsuspend" : "Suspend"}
                </button>
              </div>

              <div className="p-4 border border-red-200 bg-red-50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-red-900">Delete Workspace</p>
                    <p className="text-xs text-red-700 mt-0.5">Permanently delete this workspace, all projects, files, and members. Irreversible.</p>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => setConfirmDialog("delete")}>
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

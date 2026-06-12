"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft, Shield, ShieldOff, AlertTriangle, CheckCircle, XCircle,
  UserX, Key, RefreshCw, Trash2, Eye, Lock, Unlock, Activity, Clock,
  Globe, Smartphone, Monitor, MessageSquare, Bot, Ticket, Plus, Download,
  User, Mail, Phone, Calendar, LogIn, Settings, MoreHorizontal, Flag,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { cn, formatCurrency, formatDate, formatDateTime, formatRelative, getInitials } from "@/lib/utils";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  role: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

interface WorkspaceMembership {
  id: string;
  workspace_id: string;
  workspace_name: string;
  workspace_slug: string;
  workspace_plan: string;
  workspace_status: string;
  role: string;
  joined_at: string;
  projects_count: number;
}

interface AuditEvent {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  summary: string;
  workspace_name: string;
  created_at: string;
}

interface AIUsageEntry {
  id: string;
  model: string;
  action_type: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  created_at: string;
}

interface AIUsageDay {
  date: string;
  tokens: number;
  cost: number;
}

interface SupportTicket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

interface AdminNote {
  id: string;
  author: string;
  author_initials: string;
  content: string;
  created_at: string;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_USER: UserProfile = {
  id: "u-001",
  full_name: "James Thornton",
  email: "james@apex.co.uk",
  avatar_url: null,
  role: "member",
  phone: "+44 7700 900123",
  created_at: "2025-01-15T09:00:00Z",
  updated_at: "2026-06-08T14:22:00Z",
};

const SEED_WORKSPACES: WorkspaceMembership[] = [
  { id: "wm-001", workspace_id: "ws-001", workspace_name: "Apex Construction Ltd", workspace_slug: "apex-construction", workspace_plan: "Professional", workspace_status: "active", role: "Admin", joined_at: "2025-01-15T09:00:00Z", projects_count: 8 },
  { id: "wm-002", workspace_id: "ws-002", workspace_name: "Thornton Consulting", workspace_slug: "thornton-consulting", workspace_plan: "Starter", workspace_status: "active", role: "Member", joined_at: "2025-06-01T10:00:00Z", projects_count: 2 },
];

const SEED_AUDIT: AuditEvent[] = [
  { id: "a1", action: "evidence.upload", entity_type: "file", entity_id: "f-001", summary: "Uploaded IMG_2044.jpg", workspace_name: "Apex Construction Ltd", created_at: "2026-06-10T09:14:00Z" },
  { id: "a2", action: "project.create", entity_type: "project", entity_id: "p-001", summary: "Created Phase 1 - Foundation Works", workspace_name: "Apex Construction Ltd", created_at: "2026-03-15T10:00:00Z" },
  { id: "a3", action: "member.invite", entity_type: "invite", entity_id: "i-001", summary: "Invited sarah@apex.co.uk", workspace_name: "Apex Construction Ltd", created_at: "2026-02-20T09:30:00Z" },
  { id: "a4", action: "plan.upgrade", entity_type: "subscription", entity_id: "s-001", summary: "Upgraded to Professional Plan", workspace_name: "Apex Construction Ltd", created_at: "2025-01-15T14:00:00Z" },
  { id: "a5", action: "report.export", entity_type: "report", entity_id: "r-001", summary: "Exported Monthly Summary PDF", workspace_name: "Thornton Consulting", created_at: "2026-05-28T16:45:00Z" },
];

const SEED_AI_USAGE: AIUsageEntry[] = [
  { id: "ai-001", model: "claude-3-5-sonnet", action_type: "qs_analysis", input_tokens: 1240, output_tokens: 890, cost_usd: 0.042, created_at: "2026-06-10T08:30:00Z" },
  { id: "ai-002", model: "claude-3-5-haiku", action_type: "document_summary", input_tokens: 3200, output_tokens: 450, cost_usd: 0.018, created_at: "2026-06-09T14:20:00Z" },
  { id: "ai-003", model: "claude-3-5-sonnet", action_type: "cost_estimate", input_tokens: 2100, output_tokens: 1200, cost_usd: 0.063, created_at: "2026-06-08T11:00:00Z" },
  { id: "ai-004", model: "claude-3-5-haiku", action_type: "document_summary", input_tokens: 1800, output_tokens: 320, cost_usd: 0.011, created_at: "2026-06-05T09:15:00Z" },
  { id: "ai-005", model: "claude-3-5-sonnet", action_type: "qs_analysis", input_tokens: 950, output_tokens: 700, cost_usd: 0.031, created_at: "2026-06-03T16:40:00Z" },
];

const SEED_AI_CHART: AIUsageDay[] = [
  { date: "Jun 3", tokens: 1650, cost: 0.031 },
  { date: "Jun 4", tokens: 0, cost: 0 },
  { date: "Jun 5", tokens: 2120, cost: 0.011 },
  { date: "Jun 6", tokens: 0, cost: 0 },
  { date: "Jun 7", tokens: 0, cost: 0 },
  { date: "Jun 8", tokens: 3300, cost: 0.063 },
  { date: "Jun 9", tokens: 3650, cost: 0.018 },
  { date: "Jun 10", tokens: 2130, cost: 0.042 },
];

const SEED_TICKETS: SupportTicket[] = [
  { id: "tk-001", subject: "Cannot export PDF on mobile", status: "open", priority: "high", created_at: "2026-06-08T10:00:00Z", updated_at: "2026-06-09T14:00:00Z" },
  { id: "tk-002", subject: "BIM viewer crashes on load", status: "resolved", priority: "medium", created_at: "2026-05-20T09:00:00Z", updated_at: "2026-05-22T16:00:00Z" },
  { id: "tk-003", subject: "Billing discrepancy on invoice #1042", status: "pending", priority: "high", created_at: "2026-04-10T08:00:00Z", updated_at: "2026-04-11T10:00:00Z" },
];

const SEED_NOTES: AdminNote[] = [
  { id: "n1", author: "Platform Admin", author_initials: "PA", content: "User requested plan upgrade consultation call. Scheduled for 15 Jun 2026.", created_at: "2026-06-08T11:00:00Z" },
  { id: "n2", author: "Support Team", author_initials: "ST", content: "Investigated billing issue tk-003. Refund processed £28. Customer satisfied.", created_at: "2026-04-11T10:30:00Z" },
];

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = ["Profile", "Workspaces", "Activity", "AI Usage", "Support Tickets", "Security", "Admin Actions", "Notes"] as const;
type Tab = typeof TABS[number];

const PLAN_CHIP: Record<string, string> = {
  Professional: "bg-violet-100 text-violet-700",
  Enterprise: "bg-amber-100 text-amber-700",
  Starter: "bg-blue-100 text-blue-700",
};

const STATUS_CHIP: Record<string, string> = {
  open: "bg-red-100 text-red-700",
  pending: "bg-amber-100 text-amber-700",
  resolved: "bg-green-100 text-green-700",
  closed: "bg-gray-100 text-gray-600",
};

const PRIORITY_CHIP: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-gray-100 text-gray-600",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-gray-200 rounded", className)} />;
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

function Chip({ label, className }: { label: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold", className)}>
      {label}
    </span>
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

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params?.userId as string;

  const [activeTab, setActiveTab] = useState<Tab>("Profile");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isPlatformAdmin, setIsPlatformAdmin] = useState(false);
  const [isSuspended, setIsSuspended] = useState(false);
  const [workspaces, setWorkspaces] = useState<WorkspaceMembership[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [aiUsage, setAiUsage] = useState<AIUsageEntry[]>([]);
  const [aiChart, setAiChart] = useState<AIUsageDay[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<null | "suspend" | "delete" | "reset_password" | "revoke_sessions" | "grant_admin" | "impersonate">(null);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [suspendReason, setSuspendReason] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setUser(SEED_USER);
      setIsPlatformAdmin(false);
      setIsSuspended(false);
      setWorkspaces(SEED_WORKSPACES);
      setAuditEvents(SEED_AUDIT);
      setAiUsage(SEED_AI_USAGE);
      setAiChart(SEED_AI_CHART);
      setTickets(SEED_TICKETS);
      setNotes(SEED_NOTES);
      setLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [userId]);

  const totalTokens = aiUsage.reduce((s, a) => s + a.input_tokens + a.output_tokens, 0);
  const totalCost = aiUsage.reduce((s, a) => s + a.cost_usd, 0);
  const topModel = aiUsage.length
    ? Object.entries(aiUsage.reduce<Record<string, number>>((acc, e) => { acc[e.model] = (acc[e.model] ?? 0) + 1; return acc; }, {}))
        .sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"
    : "—";
  const openTickets = tickets.filter((t) => t.status === "open" || t.status === "pending").length;

  const handleSuspend = () => {
    setIsSuspended((s) => !s);
    toast.success(isSuspended ? "Account unsuspended" : "Account suspended");
    setConfirmDialog(null);
  };

  const handleGrantAdmin = () => {
    setIsPlatformAdmin((v) => !v);
    toast.success(isPlatformAdmin ? "Platform admin revoked" : "Platform admin granted");
    setConfirmDialog(null);
  };

  const handleResetPassword = () => {
    toast.success("Password reset email sent");
    setConfirmDialog(null);
  };

  const handleRevokeSessions = () => {
    toast.success("All sessions revoked");
    setConfirmDialog(null);
  };

  const handleDelete = () => {
    if (deleteConfirmEmail !== user?.email) {
      toast.error("Email does not match");
      return;
    }
    toast.success("Account deletion queued");
    setConfirmDialog(null);
    setDeleteConfirmEmail("");
  };

  const handleImpersonate = () => {
    toast.success(`Impersonating ${user?.full_name} — action logged`);
    setConfirmDialog(null);
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const note: AdminNote = {
      id: `n-${Date.now()}`,
      author: "Platform Admin",
      author_initials: "PA",
      content: newNote.trim(),
      created_at: new Date().toISOString(),
    };
    setNotes((prev) => [note, ...prev]);
    setNewNote("");
    toast.success("Note added");
  };

  const filteredAudit = auditEvents.filter((e) =>
    (!auditActionFilter || e.action.toLowerCase().includes(auditActionFilter.toLowerCase()))
  );
  const filteredWorkspaces = workspaces.filter((w) =>
    (!roleFilter || w.role === roleFilter)
  );

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

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <XCircle size={40} className="text-red-400" />
        <p className="text-gray-500">User not found</p>
        <button className="btn btn-secondary btn-sm" onClick={() => router.push("/admin/users")}>Back to Users</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={confirmDialog === "suspend"}
        title={isSuspended ? "Unsuspend Account" : "Suspend Account"}
        description={isSuspended ? `This will restore ${user.full_name}'s access.` : `This will immediately block ${user.full_name} from signing in.`}
        confirmLabel={isSuspended ? "Unsuspend" : "Suspend"}
        danger={!isSuspended}
        onConfirm={handleSuspend}
        onCancel={() => setConfirmDialog(null)}
      >
        {!isSuspended && (
          <div>
            <label className="form-label">Reason (optional)</label>
            <input className="form-input" value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} placeholder="Reason for suspension..." />
          </div>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmDialog === "reset_password"}
        title="Force Password Reset"
        description={`A password reset email will be sent to ${user.email}. The user must reset their password before signing in.`}
        confirmLabel="Send Reset Email"
        onConfirm={handleResetPassword}
        onCancel={() => setConfirmDialog(null)}
      />

      <ConfirmDialog
        open={confirmDialog === "revoke_sessions"}
        title="Revoke All Sessions"
        description={`All active sessions for ${user.full_name} will be immediately terminated. They will need to sign in again.`}
        confirmLabel="Revoke All"
        danger
        onConfirm={handleRevokeSessions}
        onCancel={() => setConfirmDialog(null)}
      />

      <ConfirmDialog
        open={confirmDialog === "grant_admin"}
        title={isPlatformAdmin ? "Revoke Platform Admin" : "Grant Platform Admin"}
        description={isPlatformAdmin ? `This will remove ${user.full_name}'s platform admin privileges.` : `This will give ${user.full_name} full platform admin access. This action is logged.`}
        confirmLabel={isPlatformAdmin ? "Revoke" : "Grant Admin"}
        danger={!isPlatformAdmin}
        onConfirm={handleGrantAdmin}
        onCancel={() => setConfirmDialog(null)}
      />

      <ConfirmDialog
        open={confirmDialog === "impersonate"}
        title="Impersonate User"
        description={`You are about to impersonate ${user.full_name}. This action will be logged in the audit trail.`}
        confirmLabel="Impersonate"
        danger
        onConfirm={handleImpersonate}
        onCancel={() => setConfirmDialog(null)}
      />

      <ConfirmDialog
        open={confirmDialog === "delete"}
        title="Delete Account — Irreversible"
        description={`This will permanently delete ${user.full_name}'s account and all associated data. Type the user's email to confirm.`}
        confirmLabel="Permanently Delete"
        danger
        onConfirm={handleDelete}
        onCancel={() => { setConfirmDialog(null); setDeleteConfirmEmail(""); }}
      >
        <div className="mt-3">
          <label className="form-label">Type <strong>{user.email}</strong> to confirm</label>
          <input className="form-input" value={deleteConfirmEmail} onChange={(e) => setDeleteConfirmEmail(e.target.value)} placeholder={user.email} />
        </div>
      </ConfirmDialog>

      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button className="btn btn-ghost btn-sm" onClick={() => router.push("/admin/users")}>
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold text-lg">
                {getInitials(user.full_name)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900">{user.full_name}</h1>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700 uppercase tracking-wide">
                    ADMIN
                  </span>
                  {isSuspended && <Chip label="Suspended" className="bg-red-100 text-red-700" />}
                  {isPlatformAdmin && <Chip label="Platform Admin" className="bg-violet-100 text-violet-700" />}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{user.email} · {user.role}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDialog("impersonate")}>
              <Eye size={14} /> Impersonate
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setConfirmDialog("reset_password")}>
              <Key size={14} /> Reset Password
            </button>
            <button
              className={cn("btn btn-sm", isPlatformAdmin ? "btn-warning" : "btn-secondary")}
              onClick={() => setConfirmDialog("grant_admin")}
            >
              <Shield size={14} /> {isPlatformAdmin ? "Revoke Admin" : "Grant Admin"}
            </button>
            <button
              className={cn("btn btn-sm", isSuspended ? "btn-success" : "btn-danger")}
              onClick={() => setConfirmDialog("suspend")}
            >
              <ShieldOff size={14} /> {isSuspended ? "Unsuspend" : "Suspend"}
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI Strip ───────────────────────────────────────────────────────── */}
      <div className="px-6 pt-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <KpiCard label="Member Since" value={formatDate(user.created_at)} icon={<Calendar size={16} />} />
          <KpiCard label="Last Sign In" value={formatRelative(user.updated_at)} icon={<LogIn size={16} />} sub={formatDateTime(user.updated_at)} />
          <KpiCard label="Workspaces" value={workspaces.length} icon={<Globe size={16} />} />
          <KpiCard label="Total Projects" value={workspaces.reduce((s, w) => s + w.projects_count, 0)} icon={<Activity size={16} />} />
          <KpiCard label="AI Credits Used" value={`$${totalCost.toFixed(2)}`} icon={<Bot size={16} />} sub={`${totalTokens.toLocaleString()} tokens`} />
          <KpiCard label="Support Tickets" value={tickets.length} icon={<Ticket size={16} />} sub={`${openTickets} open`} />
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

        {/* ── 1. Profile ──────────────────────────────────────────────────── */}
        {activeTab === "Profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Details */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">User Details</h3>
                <button className="btn btn-secondary btn-sm"><Settings size={13} /> Edit Profile</button>
              </div>
              <div className="flex items-center gap-4 py-2">
                <div className="w-16 h-16 rounded-full bg-[var(--primary)] flex items-center justify-center text-white font-bold text-xl">
                  {getInitials(user.full_name)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{user.full_name}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <Chip label={user.role} className="mt-1 bg-blue-100 text-blue-700" />
                </div>
              </div>
              {[
                { label: "Full Name", value: user.full_name, icon: <User size={14} /> },
                { label: "Email", value: user.email, icon: <Mail size={14} /> },
                { label: "Phone", value: user.phone ?? "Not provided", icon: <Phone size={14} /> },
                { label: "Role", value: user.role, icon: <Shield size={14} /> },
                { label: "Member Since", value: formatDate(user.created_at), icon: <Calendar size={14} /> },
                { label: "Last Updated", value: formatDateTime(user.updated_at), icon: <Clock size={14} /> },
              ].map(({ label, value, icon }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <span className="text-gray-400">{icon}</span>
                    {label}
                  </div>
                  <span className="font-medium text-gray-900 text-right max-w-[200px] truncate">{value}</span>
                </div>
              ))}
            </div>

            {/* Auth Info */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">Authentication</h3>
                <button className="btn btn-secondary btn-sm" onClick={() => toast.info("MFA management opened")}>
                  <Lock size={13} /> Manage MFA
                </button>
              </div>
              {[
                { label: "Auth Provider", value: "Email / Password" },
                { label: "MFA Enabled", value: "Enabled", badge: true, good: true },
                { label: "Email Verified", value: "Verified", badge: true, good: true },
                { label: "Last Sign In", value: formatDateTime(user.updated_at) },
                { label: "Sign In Count", value: "247" },
                { label: "Account Status", value: isSuspended ? "Suspended" : "Active", badge: true, good: !isSuspended },
                { label: "Platform Admin", value: isPlatformAdmin ? "Yes" : "No", badge: true, good: isPlatformAdmin },
              ].map(({ label, value, badge, good }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 text-sm">
                  <span className="text-gray-500">{label}</span>
                  {badge ? (
                    <Chip label={value} className={cn(good ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")} />
                  ) : (
                    <span className="font-medium text-gray-900">{value}</span>
                  )}
                </div>
              ))}

              <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
                <button className="btn btn-secondary btn-sm w-full" onClick={() => setConfirmDialog("reset_password")}>
                  <Key size={13} /> Send Password Reset Email
                </button>
                <button className="btn btn-secondary btn-sm w-full" onClick={() => toast.info("MFA reset sent")}>
                  <RefreshCw size={13} /> Reset MFA Device
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── 2. Workspaces ───────────────────────────────────────────────── */}
        {activeTab === "Workspaces" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-gray-900">Workspace Memberships ({filteredWorkspaces.length})</h3>
                <select className="form-input py-1 text-xs w-36" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="">All Roles</option>
                  <option value="Admin">Admin</option>
                  <option value="Member">Member</option>
                  <option value="Viewer">Viewer</option>
                </select>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Workspace</th>
                    <th>Slug</th>
                    <th>Plan</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th>Projects</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWorkspaces.map((ws) => (
                    <tr key={ws.id}>
                      <td>
                        <button
                          className="text-sm font-semibold text-[var(--primary)] hover:underline"
                          onClick={() => router.push(`/admin/workspaces/${ws.workspace_id}`)}
                        >
                          {ws.workspace_name}
                        </button>
                      </td>
                      <td><code className="text-xs text-gray-500">{ws.workspace_slug}</code></td>
                      <td><Chip label={ws.workspace_plan} className={PLAN_CHIP[ws.workspace_plan] ?? "bg-gray-100 text-gray-700"} /></td>
                      <td><Chip label={ws.role} className={ws.role === "Admin" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"} /></td>
                      <td className="text-xs text-gray-500">{formatDate(ws.joined_at)}</td>
                      <td className="text-sm font-medium text-gray-900">{ws.projects_count}</td>
                      <td><Chip label={ws.workspace_status} className={ws.workspace_status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"} /></td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm text-red-500 hover:text-red-700"
                          onClick={() => toast.success(`Removed from ${ws.workspace_name}`)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredWorkspaces.length === 0 && (
                <div className="py-12 text-center text-sm text-gray-400">No workspaces found</div>
              )}
            </div>
          </div>
        )}

        {/* ── 3. Activity ─────────────────────────────────────────────────── */}
        {activeTab === "Activity" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-gray-900">Audit Log ({filteredAudit.length})</h3>
                <input
                  className="form-input py-1 text-xs w-48"
                  placeholder="Filter by action..."
                  value={auditActionFilter}
                  onChange={(e) => setAuditActionFilter(e.target.value)}
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
                    <th>Action</th>
                    <th>Entity Type</th>
                    <th>Summary</th>
                    <th>Workspace</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAudit.map((e) => (
                    <tr key={e.id}>
                      <td className="text-xs text-gray-500 whitespace-nowrap">{formatDateTime(e.created_at)}</td>
                      <td>
                        <code className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{e.action}</code>
                      </td>
                      <td className="text-xs text-gray-500">{e.entity_type}</td>
                      <td className="text-sm text-gray-900">{e.summary}</td>
                      <td className="text-xs text-gray-500">{e.workspace_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredAudit.length === 0 && (
                <div className="py-12 text-center text-sm text-gray-400">No activity found</div>
              )}
            </div>
          </div>
        )}

        {/* ── 4. AI Usage ─────────────────────────────────────────────────── */}
        {activeTab === "AI Usage" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <KpiCard label="Total Tokens" value={totalTokens.toLocaleString()} icon={<Bot size={16} />} />
              <KpiCard label="Total Cost" value={`$${totalCost.toFixed(3)}`} icon={<Activity size={16} />} />
              <KpiCard label="Top Model" value={topModel.split("-").slice(-1)[0]} icon={<Monitor size={16} />} sub={topModel} />
              <KpiCard label="Invocations" value={aiUsage.length} icon={<RefreshCw size={16} />} />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Token Usage — Last 30 Days</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={aiChart} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => [v.toLocaleString(), "Tokens"]} />
                  <Bar dataKey="tokens" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">Recent Invocations</h3>
              </div>
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Model</th>
                    <th>Action Type</th>
                    <th>Input Tokens</th>
                    <th>Output Tokens</th>
                    <th>Cost (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {aiUsage.map((e) => (
                    <tr key={e.id}>
                      <td className="text-xs text-gray-500 whitespace-nowrap">{formatDateTime(e.created_at)}</td>
                      <td><code className="text-xs text-gray-700">{e.model}</code></td>
                      <td className="text-xs text-gray-600">{e.action_type.replace("_", " ")}</td>
                      <td className="text-sm text-gray-900">{e.input_tokens.toLocaleString()}</td>
                      <td className="text-sm text-gray-900">{e.output_tokens.toLocaleString()}</td>
                      <td className="text-sm font-medium text-gray-900">${e.cost_usd.toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── 5. Support Tickets ──────────────────────────────────────────── */}
        {activeTab === "Support Tickets" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-gray-900">Support Tickets ({tickets.length})</h3>
                {openTickets > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                    {openTickets} open
                  </span>
                )}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Ticket #</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Created</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id}>
                      <td><code className="text-xs text-gray-500">{t.id}</code></td>
                      <td className="text-sm font-medium text-gray-900 max-w-xs truncate">{t.subject}</td>
                      <td><Chip label={t.status} className={STATUS_CHIP[t.status] ?? "bg-gray-100 text-gray-600"} /></td>
                      <td><Chip label={t.priority} className={PRIORITY_CHIP[t.priority] ?? "bg-gray-100 text-gray-600"} /></td>
                      <td className="text-xs text-gray-500">{formatDate(t.created_at)}</td>
                      <td className="text-xs text-gray-500">{formatRelative(t.updated_at)}</td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => toast.info(`Opening ticket ${t.id}`)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {tickets.length === 0 && (
                <div className="py-12 text-center text-sm text-gray-400">No support tickets</div>
              )}
            </div>
          </div>
        )}

        {/* ── 6. Security ─────────────────────────────────────────────────── */}
        {activeTab === "Security" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Logins */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <LogIn size={15} /> Recent Authentication
                </h3>
                {[
                  { ip: "82.34.12.55", device: "Chrome 124 / Windows 11", location: "London, UK", ts: "10 Jun 2026, 08:55", success: true },
                  { ip: "82.34.12.55", device: "Safari / iPhone 16", location: "London, UK", ts: "08 Jun 2026, 19:00", success: true },
                  { ip: "203.45.67.89", device: "Firefox 126 / macOS", location: "Unknown", ts: "05 Jun 2026, 03:12", success: false },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-3">
                      {s.success
                        ? <CheckCircle size={14} className="text-green-500 shrink-0" />
                        : <XCircle size={14} className="text-red-500 shrink-0" />
                      }
                      <div>
                        <p className="text-xs font-medium text-gray-900">{s.device}</p>
                        <p className="text-xs text-gray-400">{s.ip} · {s.location}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{s.ts}</span>
                  </div>
                ))}
              </div>

              {/* MFA Events */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield size={15} /> MFA &amp; Security Events
                </h3>
                {[
                  { event: "MFA Enabled", ts: "15 Jan 2025", icon: <CheckCircle size={13} className="text-green-500" /> },
                  { event: "Password Changed", ts: "22 Mar 2026", icon: <Key size={13} className="text-blue-500" /> },
                  { event: "Failed Login (×3)", ts: "05 Jun 2026, 03:12", icon: <AlertTriangle size={13} className="text-amber-500" /> },
                ].map((e, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      {e.icon}
                      {e.event}
                    </div>
                    <span className="text-xs text-gray-400">{e.ts}</span>
                  </div>
                ))}
                <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <p className="text-xs text-amber-700 flex items-center gap-2">
                    <AlertTriangle size={13} /> 3 failed login attempts from unknown IP on 5 Jun 2026
                  </p>
                </div>
              </div>

              {/* Password Reset History */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Key size={15} /> Password Reset History
                </h3>
                {[
                  { ts: "22 Mar 2026", method: "Self-service email", ip: "82.34.12.55" },
                  { ts: "15 Jan 2025", method: "Admin forced reset", ip: "—" },
                ].map((r, i) => (
                  <div key={i} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0 text-sm">
                    <div>
                      <p className="font-medium text-gray-900">{r.method}</p>
                      <p className="text-xs text-gray-400">IP: {r.ip}</p>
                    </div>
                    <span className="text-xs text-gray-400">{r.ts}</span>
                  </div>
                ))}
              </div>

              {/* Impersonation Log */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Eye size={15} /> Impersonation Log
                </h3>
                <div className="py-8 text-center text-sm text-gray-400">
                  No impersonation events recorded
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 7. Admin Actions ────────────────────────────────────────────── */}
        {activeTab === "Admin Actions" && (
          <div className="space-y-6 max-w-2xl">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Account Management</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button className="btn btn-secondary" onClick={() => setConfirmDialog("reset_password")}>
                  <Key size={14} /> Force Password Reset
                </button>
                <button className="btn btn-secondary" onClick={() => setConfirmDialog("revoke_sessions")}>
                  <RefreshCw size={14} /> Revoke All Sessions
                </button>
                <button className="btn btn-secondary" onClick={() => setConfirmDialog("impersonate")}>
                  <Eye size={14} /> Impersonate User
                </button>
                <button
                  className={cn("btn", isPlatformAdmin ? "btn-warning" : "btn-secondary")}
                  onClick={() => setConfirmDialog("grant_admin")}
                >
                  <Shield size={14} /> {isPlatformAdmin ? "Revoke Platform Admin" : "Grant Platform Admin"}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Workspace Transfer</h3>
              <p className="text-sm text-gray-500">Transfer ownership of a workspace to another member.</p>
              <select className="form-input text-sm">
                {workspaces.map((ws) => (
                  <option key={ws.workspace_id} value={ws.workspace_id}>{ws.workspace_name}</option>
                ))}
              </select>
              <button className="btn btn-secondary btn-sm" onClick={() => toast.info("Transfer ownership modal opened")}>
                Select New Owner &amp; Transfer
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle size={16} className="text-red-500" />
                <h3 className="text-sm font-semibold text-red-700">Danger Zone</h3>
              </div>

              <div className="p-4 border border-amber-200 bg-amber-50 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-amber-900">{isSuspended ? "Unsuspend Account" : "Suspend Account"}</p>
                  <p className="text-xs text-amber-700 mt-0.5">
                    {isSuspended ? "Restore access for this user." : "Block this user from signing in immediately."}
                  </p>
                </div>
                <button className="btn btn-warning btn-sm" onClick={() => setConfirmDialog("suspend")}>
                  <ShieldOff size={13} /> {isSuspended ? "Unsuspend" : "Suspend"}
                </button>
              </div>

              <div className="p-4 border border-red-200 bg-red-50 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-900">Delete Account</p>
                  <p className="text-xs text-red-700 mt-0.5">Permanently remove this user and all their data. Irreversible.</p>
                </div>
                <button className="btn btn-danger btn-sm" onClick={() => setConfirmDialog("delete")}>
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── 8. Notes ────────────────────────────────────────────────────── */}
        {activeTab === "Notes" && (
          <div className="space-y-5 max-w-2xl">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare size={15} /> Add Internal Note
              </h3>
              <p className="text-xs text-gray-400 mb-3">Notes are only visible to platform admins and are not shared with the user.</p>
              <textarea
                className="form-input w-full text-sm resize-none"
                rows={4}
                placeholder="Write an internal note about this user..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <div className="flex justify-end mt-3">
                <button className="btn btn-primary btn-sm" onClick={handleAddNote} disabled={!newNote.trim()}>
                  <Plus size={13} /> Add Note
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex gap-4">
                  <div className="w-9 h-9 rounded-full bg-violet-100 text-violet-700 font-bold text-sm flex items-center justify-center shrink-0">
                    {note.author_initials}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-gray-900">{note.author}</span>
                      <span className="text-xs text-gray-400">{formatDateTime(note.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-700">{note.content}</p>
                  </div>
                </div>
              ))}
              {notes.length === 0 && (
                <div className="py-12 text-center text-sm text-gray-400">No notes yet</div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Settings, Users, Shield, Palette, Key, Bell, Puzzle, AlertTriangle,
  Plus, Trash2, Eye, EyeOff, Copy, MoreHorizontal, Check, Mail,
  Crown, ChevronDown,
} from "lucide-react";
import { cn, formatDate, formatRelative, getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

/* ─────────────────────────── Tabs ──────────────────────────── */

type TabId = "general" | "members" | "roles" | "branding" | "api-keys" | "channels" | "integrations" | "danger";
const TABS: { id: TabId; label: string }[] = [
  { id: "general", label: "General" },
  { id: "members", label: "Members" },
  { id: "roles", label: "Roles" },
  { id: "branding", label: "Branding" },
  { id: "api-keys", label: "API Keys" },
  { id: "channels", label: "Channels" },
  { id: "integrations", label: "Integrations" },
  { id: "danger", label: "Danger" },
];

/* ─────────────────────────── Page ──────────────────────────── */

export default function WorkspaceSettingsPage() {
  const [tab, setTab] = useState<TabId>("general");

  return (
    <div className="flex flex-col min-h-full">
      <div className="page-header">
        <div>
          <h1 className="text-xl font-semibold">Workspace Settings</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Manage your workspace configuration and team</p>
        </div>
      </div>

      <div className="tab-bar mt-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={cn("tab-item", tab === t.id && "active", t.id === "danger" && tab !== "danger" && "text-[var(--danger)] hover:text-[var(--danger)]")}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="page-content flex-1">
        <div className="max-w-3xl">
          {tab === "general" && <GeneralTab />}
          {tab === "members" && <MembersTab />}
          {tab === "roles" && <RolesTab />}
          {tab === "branding" && <BrandingTab />}
          {tab === "api-keys" && <ApiKeysTab />}
          {tab === "channels" && <ChannelsTab />}
          {tab === "integrations" && <IntegrationsTab />}
          {tab === "danger" && <DangerTab />}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── General ───────────────────────── */

const generalSchema = z.object({
  name: z.string().min(2, "Workspace name is required"),
  slug: z.string().min(2, "Slug is required").regex(/^[a-z0-9-]+$/, "Slug must be lowercase with hyphens only"),
  description: z.string().optional(),
  timezone: z.string(),
  currency: z.string(),
});
type GeneralValues = z.infer<typeof generalSchema>;

const TIMEZONES = ["Europe/London", "Europe/Paris", "Europe/Berlin", "America/New_York", "America/Chicago", "America/Los_Angeles"];
const CURRENCIES = [{ value: "GBP", label: "GBP — British Pound" }, { value: "EUR", label: "EUR — Euro" }, { value: "USD", label: "USD — US Dollar" }];

function GeneralTab() {
  const { register, handleSubmit, formState: { errors, isSubmitting, isDirty } } = useForm<GeneralValues>({
    resolver: zodResolver(generalSchema),
    defaultValues: { name: "MeasureDeck Workspace", slug: "measuredeck-workspace", description: "Commercial management for construction projects.", timezone: "Europe/London", currency: "GBP" },
  });

  async function onSubmit(data: GeneralValues) {
    try {
      toast.success("Workspace settings saved");
    } catch { toast.error("Failed to save"); }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {/* Logo */}
      <div className="card p-5 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold flex-shrink-0" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>MD</div>
        <div>
          <p className="text-sm font-semibold">Workspace Logo</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">PNG or SVG, min 200×200px.</p>
          <button type="button" className="btn btn-secondary btn-sm mt-2">Upload Logo</button>
        </div>
      </div>

      <div className="card p-5 flex flex-col gap-4">
        <h3 className="text-sm font-semibold">Workspace Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Workspace Name</label>
            <input {...register("name")} className="form-input" />
            {errors.name && <p className="text-xs text-[var(--danger)] mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="form-label">Workspace Slug</label>
            <input {...register("slug")} className="form-input" />
            {errors.slug && <p className="text-xs text-[var(--danger)] mt-1">{errors.slug.message}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Description</label>
            <textarea {...register("description")} className="form-input resize-none" rows={3} />
          </div>
          <div>
            <label className="form-label">Timezone</label>
            <select {...register("timezone")} className="form-input">
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label">Currency</label>
            <select {...register("currency")} className="form-input">
              {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <button type="submit" className="btn btn-primary w-fit" disabled={isSubmitting || !isDirty}>
        {isSubmitting ? "Saving…" : "Save Changes"}
      </button>
    </form>
  );
}

/* ─────────────────────────── Members ───────────────────────── */

const MEMBERS = [
  { id: "m-001", name: "James Whitfield", email: "j.whitfield@company.co.uk", role: "Admin", joined: "2025-01-01", avatar: "JW" },
  { id: "m-002", name: "Sarah Chen", email: "s.chen@company.co.uk", role: "Manager", joined: "2025-02-14", avatar: "SC" },
  { id: "m-003", name: "Mark Hughes", email: "mark.hughes@company.co.uk", role: "Manager", joined: "2025-03-01", avatar: "MH" },
  { id: "m-004", name: "Claire Morton", email: "claire@company.co.uk", role: "Viewer", joined: "2025-04-10", avatar: "CM" },
];

const PENDING_INVITES = [
  { email: "new.user@company.co.uk", role: "Viewer", sent: "2026-06-08" },
];

function MembersTab() {
  const [members, setMembers] = useState(MEMBERS);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("Viewer");

  function removeMember(id: string) {
    setMembers((m) => m.filter((mb) => mb.id !== id));
    toast.success("Member removed");
  }

  function sendInvite() {
    if (!inviteEmail) return;
    toast.success(`Invite sent to ${inviteEmail}`);
    setInviteEmail("");
    setShowInvite(false);
  }

  const roleBadge = (role: string) => {
    if (role === "Admin") return <span className="badge chip-danger text-[10px]">{role}</span>;
    if (role === "Manager") return <span className="badge chip-info text-[10px]">{role}</span>;
    return <span className="badge chip-muted text-[10px]">{role}</span>;
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-muted)]">{members.length} members</p>
        <button className="btn btn-primary btn-sm" onClick={() => setShowInvite(true)}><Plus size={14} />Invite Member</button>
      </div>

      {/* Invite modal */}
      {showInvite && (
        <div className="card p-4 flex flex-col gap-3 border-2" style={{ borderColor: "var(--primary)" }}>
          <h3 className="text-sm font-semibold">Invite New Member</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" placeholder="colleague@company.co.uk" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
            </div>
            <div>
              <label className="form-label">Role</label>
              <select className="form-input" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                {["Admin", "Manager", "Viewer"].map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary btn-sm" onClick={sendInvite}><Mail size={13} />Send Invite</button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowInvite(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="data-table">
          <thead><tr><th>Member</th><th>Role</th><th>Joined</th><th></th></tr></thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                      {m.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-xs text-[var(--text-muted)]">{m.email}</p>
                    </div>
                  </div>
                </td>
                <td>{roleBadge(m.role)}</td>
                <td className="text-sm text-[var(--text-muted)]">{formatDate(m.joined)}</td>
                <td>
                  <div className="flex items-center gap-1">
                    <button className="btn btn-secondary btn-sm" onClick={() => toast.info("Change role")}>Change Role</button>
                    {m.role !== "Admin" && (
                      <button className="btn btn-danger btn-sm" onClick={() => removeMember(m.id)}>Remove</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pending invites */}
      {PENDING_INVITES.length > 0 && (
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Pending Invites</h3>
          <div className="card overflow-hidden">
            <table className="data-table">
              <thead><tr><th>Email</th><th>Role</th><th>Sent</th><th></th></tr></thead>
              <tbody>
                {PENDING_INVITES.map((inv, i) => (
                  <tr key={i}>
                    <td className="text-sm">{inv.email}</td>
                    <td><span className="badge chip-muted text-[10px]">{inv.role}</span></td>
                    <td className="text-sm text-[var(--text-muted)]">{formatDate(inv.sent)}</td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn btn-secondary btn-sm" onClick={() => toast.info("Resend invite")}>Resend</button>
                        <button className="btn btn-ghost btn-sm btn-icon"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Roles ─────────────────────────── */

const ROLE_DEFS = [
  { name: "Admin", description: "Full access to all workspace settings and data.", permissions: ["Manage members", "Manage billing", "Create/delete projects", "Manage API keys", "View all data", "Change workspace settings"] },
  { name: "Manager", description: "Can manage projects, evidence and applications.", permissions: ["Create/edit projects", "Upload evidence", "Submit applications", "Manage changes", "View all data"] },
  { name: "Viewer", description: "Read-only access to workspace data.", permissions: ["View projects", "View applications", "View evidence", "View reports"] },
];

function RolesTab() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-muted)]">3 built-in roles</p>
        <button className="btn btn-secondary btn-sm" onClick={() => toast.info("Custom roles require Premium plan")}>
          <Crown size={13} />
          Create Custom Role
          <span className="badge chip-warning text-[10px] ml-1">Premium</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {ROLE_DEFS.map((role) => (
          <div key={role.name} className="card p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-[var(--primary)]" />
              <h3 className="text-sm font-semibold">{role.name}</h3>
            </div>
            <p className="text-xs text-[var(--text-muted)]">{role.description}</p>
            <ul className="flex flex-col gap-1.5">
              {role.permissions.map((p) => (
                <li key={p} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <Check size={11} className="text-[var(--success)] flex-shrink-0" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── Branding ──────────────────────── */

function BrandingTab() {
  return (
    <div className="flex flex-col gap-4">
      <div className="card p-5 flex flex-col gap-4">
        <h3 className="text-sm font-semibold">Brand Colours</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Primary Colour</label>
            <div className="flex items-center gap-2">
              <input type="color" defaultValue="#3B5EE8" className="w-10 h-10 rounded-lg border cursor-pointer" style={{ borderColor: "var(--border)" }} />
              <input type="text" defaultValue="#3B5EE8" className="form-input font-mono" />
            </div>
          </div>
          <div>
            <label className="form-label">Accent Colour</label>
            <div className="flex items-center gap-2">
              <input type="color" defaultValue="#8B5CF6" className="w-10 h-10 rounded-lg border cursor-pointer" style={{ borderColor: "var(--border)" }} />
              <input type="text" defaultValue="#8B5CF6" className="form-input font-mono" />
            </div>
          </div>
        </div>
      </div>
      <button className="btn btn-primary w-fit" onClick={() => toast.success("Branding saved")}>Save Branding</button>
    </div>
  );
}

/* ─────────────────────────── API Keys ──────────────────────── */

const API_KEYS_SEED = [
  { id: "key-001", name: "CI/CD Pipeline", prefix: "mk_live_...3f8a", created: "2026-01-15", last_used: "2026-06-09" },
  { id: "key-002", name: "Reporting Integration", prefix: "mk_live_...9b2c", created: "2026-03-01", last_used: "2026-05-22" },
];

function ApiKeysTab() {
  const [keys, setKeys] = useState(API_KEYS_SEED);
  const [newKey, setNewKey] = useState<string | null>(null);

  function generateKey() {
    const fullKey = `mk_live_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
    setNewKey(fullKey);
    const entry = { id: `key-${Date.now()}`, name: "New API Key", prefix: `mk_live_...${fullKey.slice(-4)}`, created: "2026-06-10", last_used: "Never" };
    setKeys((k) => [...k, entry]);
    toast.success("API key generated");
  }

  function revokeKey(id: string) {
    setKeys((k) => k.filter((key) => key.id !== id));
    toast.success("API key revoked");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-muted)]">{keys.length} API key{keys.length !== 1 ? "s" : ""}</p>
        <button className="btn btn-primary btn-sm" onClick={generateKey}><Plus size={14} />Generate New Key</button>
      </div>

      {/* Show new key once */}
      {newKey && (
        <div className="card p-4 border-2 flex flex-col gap-3" style={{ borderColor: "var(--success)" }}>
          <p className="text-sm font-semibold text-[var(--success)]">New API Key — copy it now, it won't be shown again</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-sm font-mono p-2 rounded-lg" style={{ background: "var(--bg-muted)" }}>{newKey}</code>
            <button className="btn btn-secondary btn-sm" onClick={() => { navigator.clipboard.writeText(newKey); toast.success("Copied!"); }}>
              <Copy size={13} />Copy
            </button>
          </div>
          <button className="btn btn-ghost btn-sm w-fit" onClick={() => setNewKey(null)}>Dismiss</button>
        </div>
      )}

      {keys.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Key size={22} /></div>
          <p className="font-semibold">No API keys</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead><tr><th>Name</th><th>Key</th><th>Created</th><th>Last Used</th><th></th></tr></thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id}>
                  <td className="text-sm font-medium">{key.name}</td>
                  <td><code className="text-xs font-mono text-[var(--text-secondary)]">{key.prefix}</code></td>
                  <td className="text-sm text-[var(--text-muted)]">{formatDate(key.created)}</td>
                  <td className="text-sm text-[var(--text-muted)]">{key.last_used}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => revokeKey(key.id)}>Revoke</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Channels ──────────────────────── */

function ChannelsTab() {
  return (
    <div className="flex flex-col gap-4">
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-3">Notification Channels</h3>
        <p className="text-sm text-[var(--text-muted)]">Configure where workspace notifications are delivered.</p>
      </div>
      <div className="card overflow-hidden">
        {[{ name: "Email", status: "Active" }, { name: "Slack", status: "Not connected" }, { name: "Microsoft Teams", status: "Not connected" }].map((ch, i, arr) => (
          <div key={ch.name} className={cn("flex items-center justify-between px-5 py-4", i < arr.length - 1 && "border-b")} style={{ borderColor: "var(--border-subtle)" }}>
            <div>
              <p className="text-sm font-medium">{ch.name}</p>
              <p className="text-xs text-[var(--text-muted)]">{ch.status}</p>
            </div>
            <button className={cn("btn btn-sm", ch.status === "Active" ? "btn-secondary" : "btn-primary")} onClick={() => toast.info(`Configure ${ch.name}`)}>
              {ch.status === "Active" ? "Configure" : "Connect"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── Integrations ──────────────────── */

function IntegrationsTab() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          { name: "Xero", description: "Sync invoices and payment data", connected: false },
          { name: "QuickBooks", description: "Accounting integration", connected: false },
          { name: "Procore", description: "Project management sync", connected: false },
          { name: "Autodesk ACC", description: "Drawing and model sync", connected: false },
        ].map((int) => (
          <div key={int.name} className="card p-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{int.name}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{int.description}</p>
            </div>
            <button className={cn("btn btn-sm flex-shrink-0", int.connected ? "btn-secondary" : "btn-primary")} onClick={() => toast.info(`Configure ${int.name}`)}>
              {int.connected ? "Configure" : "Connect"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── Danger ────────────────────────── */

function DangerTab() {
  const [confirmText, setConfirmText] = useState("");
  const WORKSPACE_NAME = "MeasureDeck Workspace";

  return (
    <div className="flex flex-col gap-4">
      <div className="card p-5 flex flex-col gap-4" style={{ borderColor: "var(--danger)", borderWidth: 1 }}>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>
            <AlertTriangle size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--danger)]">Delete Workspace</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Permanently delete this workspace and all projects, applications, evidence and data. This cannot be undone.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl text-sm" style={{ background: "var(--danger-bg)" }}>
          <p className="text-[var(--danger-text)] font-medium">⚠ All workspace data will be permanently and immediately deleted.</p>
        </div>

        <div>
          <label className="form-label">Type <strong>{WORKSPACE_NAME}</strong> to confirm</label>
          <input
            type="text"
            className="form-input"
            placeholder={WORKSPACE_NAME}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
        </div>

        <button
          className="btn btn-danger w-fit"
          disabled={confirmText !== WORKSPACE_NAME}
          onClick={() => toast.error("Workspace deletion is not enabled in this environment.")}
        >
          <Trash2 size={14} />Delete Workspace Permanently
        </button>
      </div>
    </div>
  );
}

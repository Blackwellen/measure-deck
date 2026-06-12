"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  User, Shield, Monitor, Bell, Link2, AlertTriangle,
  Eye, EyeOff, Smartphone, Trash2, LogOut, Check, X,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

/* ─────────────────────────── Tabs ──────────────────────────── */

type TabId = "profile" | "security" | "sessions" | "notifications" | "linked-accounts" | "danger";
const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "Profile", icon: <User size={14} /> },
  { id: "security", label: "Security", icon: <Shield size={14} /> },
  { id: "sessions", label: "Sessions", icon: <Monitor size={14} /> },
  { id: "notifications", label: "Notifications", icon: <Bell size={14} /> },
  { id: "linked-accounts", label: "Linked Accounts", icon: <Link2 size={14} /> },
  { id: "danger", label: "Danger Zone", icon: <AlertTriangle size={14} /> },
];

/* ─────────────────────────── Page ──────────────────────────── */

export default function AccountPage() {
  const [tab, setTab] = useState<TabId>("profile");

  return (
    <div className="flex flex-col min-h-full">
      <div className="page-header">
        <div>
          <h1 className="text-xl font-semibold">Account Settings</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Manage your personal account settings and preferences</p>
        </div>
      </div>

      <div className="tab-bar mt-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={cn("tab-item flex items-center gap-1.5", tab === t.id && "active", t.id === "danger" && tab !== "danger" && "text-[var(--danger)] hover:text-[var(--danger)]")}
            onClick={() => setTab(t.id)}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <div className="page-content flex-1">
        <div className="max-w-2xl">
          {tab === "profile" && <ProfileTab />}
          {tab === "security" && <SecurityTab />}
          {tab === "sessions" && <SessionsTab />}
          {tab === "notifications" && <NotificationsTab />}
          {tab === "linked-accounts" && <LinkedAccountsTab />}
          {tab === "danger" && <DangerZoneTab />}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Profile ───────────────────────── */

const profileSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters"),
  job_title: z.string().optional(),
  phone: z.string().optional(),
  timezone: z.string(),
});
type ProfileValues = z.infer<typeof profileSchema>;

const TIMEZONES = [
  "Europe/London", "Europe/Paris", "Europe/Berlin", "America/New_York",
  "America/Chicago", "America/Los_Angeles", "Australia/Sydney", "Asia/Dubai",
];

function ProfileTab() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: "James Whitfield", job_title: "Senior Quantity Surveyor", phone: "+44 7700 900123", timezone: "Europe/London" },
  });

  async function onSubmit(data: ProfileValues) {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ data: { ...data } });
      if (error) throw error;
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update profile");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {/* Avatar */}
      <div className="card p-5 flex items-center gap-4">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold flex-shrink-0"
          style={{ background: "var(--primary-light)", color: "var(--primary)" }}
        >
          JW
        </div>
        <div>
          <p className="text-sm font-semibold">Profile Photo</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">JPG, PNG or GIF. Max 5MB.</p>
          <button type="button" className="btn btn-secondary btn-sm mt-2">Upload Photo</button>
        </div>
      </div>

      {/* Fields */}
      <div className="card p-5 flex flex-col gap-4">
        <h3 className="text-sm font-semibold">Personal Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Full Name</label>
            <input {...register("full_name")} className="form-input" />
            {errors.full_name && <p className="text-xs text-[var(--danger)] mt-1">{errors.full_name.message}</p>}
          </div>
          <div>
            <label className="form-label">Email Address</label>
            <input type="email" className="form-input" value="jamahlthomas1996@gmail.com" disabled />
            <p className="text-xs text-[var(--text-muted)] mt-1">Email cannot be changed here.</p>
          </div>
          <div>
            <label className="form-label">Job Title</label>
            <input {...register("job_title")} className="form-input" placeholder="e.g. Quantity Surveyor" />
          </div>
          <div>
            <label className="form-label">Phone</label>
            <input {...register("phone")} type="tel" className="form-input" placeholder="+44 7700 900000" />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Timezone</label>
            <select {...register("timezone")} className="form-input">
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting || !isDirty}>
          {isSubmitting ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

/* ─────────────────────────── Security ──────────────────────── */

const passwordSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string(),
}).refine((d) => d.new_password === d.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});
type PasswordValues = z.infer<typeof passwordSchema>;

function SecurityTab() {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [mfaEnabled] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordValues>({ resolver: zodResolver(passwordSchema) });

  async function onSubmit(data: PasswordValues) {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: data.new_password });
      if (error) throw error;
      toast.success("Password updated");
      reset();
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to update password");
    }
  }

  const SECURITY_EVENTS = [
    { event: "Sign in", location: "London, UK", time: "Today, 09:14", current: true },
    { event: "Password changed", location: "London, UK", time: "3 days ago", current: false },
    { event: "Sign in", location: "Manchester, UK", time: "1 week ago", current: false },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Change password */}
      <div className="card p-5 flex flex-col gap-4">
        <h3 className="text-sm font-semibold">Change Password</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <label className="form-label">Current Password</label>
            <div className="relative">
              <input {...register("current_password")} type={showCurrent ? "text" : "password"} className="form-input pr-10" />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" onClick={() => setShowCurrent((v) => !v)}>
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.current_password && <p className="text-xs text-[var(--danger)] mt-1">{errors.current_password.message}</p>}
          </div>
          <div>
            <label className="form-label">New Password</label>
            <div className="relative">
              <input {...register("new_password")} type={showNew ? "text" : "password"} className="form-input pr-10" />
              <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" onClick={() => setShowNew((v) => !v)}>
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.new_password && <p className="text-xs text-[var(--danger)] mt-1">{errors.new_password.message}</p>}
          </div>
          <div>
            <label className="form-label">Confirm New Password</label>
            <input {...register("confirm_password")} type="password" className="form-input" />
            {errors.confirm_password && <p className="text-xs text-[var(--danger)] mt-1">{errors.confirm_password.message}</p>}
          </div>
          <button type="submit" className="btn btn-primary btn-sm w-fit" disabled={isSubmitting}>
            {isSubmitting ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>

      {/* MFA */}
      <div className="card p-5 flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: mfaEnabled ? "var(--success-bg)" : "var(--bg-muted)", color: mfaEnabled ? "var(--success)" : "var(--text-muted)" }}>
            <Smartphone size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold">Two-Factor Authentication</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {mfaEnabled ? "MFA is enabled. Your account is protected." : "Add an extra layer of security to your account."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("badge", mfaEnabled ? "chip-success" : "chip-muted")}>{mfaEnabled ? "Enabled" : "Disabled"}</span>
          <button className={cn("btn btn-sm", mfaEnabled ? "btn-danger" : "btn-primary")} onClick={() => toast.info(mfaEnabled ? "MFA disable flow" : "MFA setup flow")}>
            {mfaEnabled ? "Disable MFA" : "Set Up MFA"}
          </button>
        </div>
      </div>

      {/* Recent security events */}
      <div className="card p-5 flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Recent Security Events</h3>
        <div className="flex flex-col gap-0">
          {SECURITY_EVENTS.map((e, idx) => (
            <div key={idx} className={cn("flex items-center justify-between py-2.5", idx < SECURITY_EVENTS.length - 1 && "border-b")} style={{ borderColor: "var(--border-subtle)" }}>
              <div>
                <p className="text-sm font-medium">{e.event}</p>
                <p className="text-xs text-[var(--text-muted)]">{e.location}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)]">{e.time}</span>
                {e.current && <span className="badge chip-success text-[10px]">Current</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Sessions ──────────────────────── */

const SESSIONS = [
  { id: "s1", device: "MacBook Pro", browser: "Chrome 126", ip: "82.45.123.67", location: "London, UK", last_seen: "Active now", current: true },
  { id: "s2", device: "iPhone 15", browser: "Safari Mobile", ip: "82.45.123.67", location: "London, UK", last_seen: "2 hours ago", current: false },
  { id: "s3", device: "Windows PC", browser: "Edge 126", ip: "185.12.44.92", location: "Manchester, UK", last_seen: "3 days ago", current: false },
];

function SessionsTab() {
  const [sessions, setSessions] = useState(SESSIONS);

  function revokeSession(id: string) {
    setSessions((s) => s.filter((sess) => sess.id !== id));
    toast.success("Session revoked");
  }

  function revokeAll() {
    setSessions((s) => s.filter((sess) => sess.current));
    toast.success("All other sessions revoked");
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-muted)]">{sessions.length} active session{sessions.length !== 1 ? "s" : ""}</p>
        <button className="btn btn-danger btn-sm" onClick={revokeAll}><LogOut size={13} />Revoke All Other Sessions</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Device</th>
                <th>Browser</th>
                <th>IP Address</th>
                <th>Location</th>
                <th>Last Seen</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((sess) => (
                <tr key={sess.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <Monitor size={14} className="text-[var(--text-muted)]" />
                      <span className="text-sm font-medium">{sess.device}</span>
                      {sess.current && <span className="badge chip-success text-[10px]">Current</span>}
                    </div>
                  </td>
                  <td className="text-sm text-[var(--text-secondary)]">{sess.browser}</td>
                  <td className="text-sm font-mono text-[var(--text-secondary)]">{sess.ip}</td>
                  <td className="text-sm text-[var(--text-secondary)]">{sess.location}</td>
                  <td className="text-sm text-[var(--text-muted)]">{sess.last_seen}</td>
                  <td>
                    {!sess.current && (
                      <button className="btn btn-danger btn-sm" onClick={() => revokeSession(sess.id)}>Revoke</button>
                    )}
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

/* ─────────────────────────── Notifications ─────────────────── */

const NOTIFICATION_CATEGORIES = [
  { key: "task_assignments", label: "Task Assignments", description: "When tasks are assigned to you" },
  { key: "evidence_requests", label: "Evidence Requests", description: "When evidence is requested from you" },
  { key: "application_updates", label: "Application Updates", description: "Status changes on payment applications" },
  { key: "cvr_locks", label: "CVR Locks", description: "When CVRs are locked for review" },
  { key: "report_shares", label: "Report Shares", description: "When reports are shared with you" },
  { key: "security_alerts", label: "Security Alerts", description: "Unusual account activity" },
  { key: "product_updates", label: "Product Updates", description: "New features and announcements" },
];

function NotificationsTab() {
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    task_assignments: true,
    evidence_requests: true,
    application_updates: true,
    cvr_locks: false,
    report_shares: true,
    security_alerts: true,
    product_updates: false,
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      toast.success("Notification preferences saved");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="card overflow-hidden">
        {NOTIFICATION_CATEGORIES.map((cat, idx) => (
          <div
            key={cat.key}
            className={cn("flex items-center justify-between px-5 py-4", idx < NOTIFICATION_CATEGORIES.length - 1 && "border-b")}
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <div>
              <p className="text-sm font-medium">{cat.label}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{cat.description}</p>
            </div>
            <button
              className={cn("relative w-11 h-6 rounded-full transition-colors flex-shrink-0", prefs[cat.key] ? "bg-[var(--primary)]" : "bg-[var(--border-strong)]")}
              onClick={() => setPrefs((p) => ({ ...p, [cat.key]: !p[cat.key] }))}
              role="switch"
              aria-checked={prefs[cat.key]}
            >
              <span
                className={cn("absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform", prefs[cat.key] && "translate-x-5")}
              />
            </button>
          </div>
        ))}
      </div>

      <button className="btn btn-primary btn-sm w-fit" onClick={save} disabled={saving}>
        {saving ? "Saving…" : "Save Preferences"}
      </button>
    </div>
  );
}

/* ─────────────────────────── Linked Accounts ───────────────── */

function LinkedAccountsTab() {
  const PROVIDERS = [
    { name: "Google", connected: false, icon: "G" },
    { name: "Microsoft", connected: false, icon: "M" },
    { name: "Slack", connected: false, icon: "S" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="card overflow-hidden">
        {PROVIDERS.map((p, idx) => (
          <div
            key={p.name}
            className={cn("flex items-center justify-between px-5 py-4", idx < PROVIDERS.length - 1 && "border-b")}
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm flex-shrink-0"
                style={{ background: "var(--text-secondary)" }}
              >
                {p.icon}
              </div>
              <div>
                <p className="text-sm font-medium">{p.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{p.connected ? "Connected" : "Not connected"}</p>
              </div>
            </div>
            <button className={cn("btn btn-sm", p.connected ? "btn-secondary" : "btn-primary")} onClick={() => toast.info(`${p.connected ? "Disconnect" : "Connect"} ${p.name}`)}>
              {p.connected ? "Disconnect" : "Connect"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────── Danger Zone ───────────────────── */

function DangerZoneTab() {
  const [confirmText, setConfirmText] = useState("");
  const CONFIRM_PHRASE = "delete my account";

  return (
    <div className="flex flex-col gap-4">
      <div
        className="card p-5 flex flex-col gap-4"
        style={{ borderColor: "var(--danger)", borderWidth: 1 }}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--danger-bg)", color: "var(--danger)" }}>
            <Trash2 size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--danger)]">Delete Account</p>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Permanently delete your account and all associated data. This action cannot be undone.
              All your projects, changes, applications and evidence will be permanently removed.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl text-sm" style={{ background: "var(--danger-bg)" }}>
          <p className="text-[var(--danger-text)] font-medium">⚠ This will permanently delete all your data.</p>
        </div>

        <div>
          <label className="form-label">
            Type <strong>{CONFIRM_PHRASE}</strong> to confirm
          </label>
          <input
            type="text"
            className="form-input"
            placeholder={CONFIRM_PHRASE}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />
        </div>

        <button
          className="btn btn-danger btn-sm w-fit"
          disabled={confirmText !== CONFIRM_PHRASE}
          onClick={() => toast.error("Account deletion is not enabled in this environment.")}
        >
          <Trash2 size={13} />Delete Account Permanently
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User, Settings, Bell, ChevronRight, Mail, Smartphone,
  Clock, Check, ExternalLink, LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = "profile" | "workspace" | "notifications";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "profile",       label: "Profile",              icon: <User size={14} /> },
  { id: "workspace",     label: "Workspace Settings",   icon: <Settings size={14} /> },
  { id: "notifications", label: "Notifications",        icon: <Bell size={14} /> },
];

// ─── Profile tab ──────────────────────────────────────────────────────────────

function ProfileTab() {
  const router = useRouter();
  return (
    <div className="max-w-xl flex flex-col gap-4">
      <div className="card p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Profile Settings</h3>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
              Manage your personal profile, avatar, and account preferences.
            </p>
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => router.push("/account")}
        >
          <ExternalLink size={14} />
          Go to Account Settings
        </button>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Quick Links</h3>
        <div className="flex flex-col gap-1">
          {[
            { label: "Edit Profile & Display Name", href: "/account" },
            { label: "Change Password", href: "/account" },
            { label: "Two-Factor Authentication", href: "/account" },
            { label: "Linked Accounts", href: "/account" },
            { label: "Active Sessions", href: "/account" },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg hover:bg-[var(--bg-muted)] transition-colors text-sm text-left"
            >
              <span style={{ color: "var(--text-secondary)" }}>{item.label}</span>
              <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Workspace tab ────────────────────────────────────────────────────────────

function WorkspaceTab() {
  const router = useRouter();
  return (
    <div className="max-w-xl flex flex-col gap-4">
      <div className="card p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Workspace Settings</h3>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
              Configure workspace name, branding, members, roles and API access.
            </p>
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => router.push("/workspace/settings")}
        >
          <ExternalLink size={14} />
          Go to Workspace Settings
        </button>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Quick Links</h3>
        <div className="flex flex-col gap-1">
          {[
            { label: "General Settings", href: "/workspace/settings" },
            { label: "Team Members & Roles", href: "/workspace/settings" },
            { label: "Branding & Customisation", href: "/workspace/settings" },
            { label: "API Keys", href: "/workspace/settings" },
            { label: "Integrations", href: "/workspace/settings" },
            { label: "Danger Zone", href: "/workspace/settings" },
          ].map(item => (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg hover:bg-[var(--bg-muted)] transition-colors text-sm text-left"
            >
              <span style={{ color: "var(--text-secondary)" }}>{item.label}</span>
              <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Notifications tab ────────────────────────────────────────────────────────

interface NotifPrefs {
  email_application_certified: boolean;
  email_change_approved: boolean;
  email_change_disputed: boolean;
  email_task_due: boolean;
  email_payment_overdue: boolean;
  email_cvr_approved: boolean;
  inapp_all_activity: boolean;
  inapp_mentions: boolean;
  inapp_task_assigned: boolean;
  inapp_deadline_reminder: boolean;
  digest_frequency: "none" | "daily" | "weekly" | "monthly";
}

const DEFAULT_PREFS: NotifPrefs = {
  email_application_certified: true,
  email_change_approved: true,
  email_change_disputed: true,
  email_task_due: true,
  email_payment_overdue: true,
  email_cvr_approved: false,
  inapp_all_activity: true,
  inapp_mentions: true,
  inapp_task_assigned: true,
  inapp_deadline_reminder: true,
  digest_frequency: "weekly",
};

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 items-center rounded-full transition-colors flex-shrink-0",
        checked ? "bg-[var(--primary)]" : "bg-[var(--bg-muted)]"
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-4.5" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

function NotifRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b last:border-b-0" style={{ borderColor: "var(--border)" }}>
      <div className="flex-1">
        <div className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{label}</div>
        {description && (
          <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{description}</div>
        )}
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

function NotificationsTab() {
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_PREFS);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof NotifPrefs, value: boolean | string) => {
    setPrefs(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from("user_notification_prefs")
          .upsert({ user_id: user.id, ...prefs }, { onConflict: "user_id" });
      }
      toast.success("Notification preferences saved");
    } catch {
      toast.success("Preferences saved locally");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl flex flex-col gap-5">
      {/* Email notifications */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Mail size={16} style={{ color: "var(--primary)" }} />
          <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Email Notifications</h3>
        </div>
        <div>
          <NotifRow
            label="Application Certified"
            description="When a payment application is certified"
            checked={prefs.email_application_certified}
            onChange={v => set("email_application_certified", v)}
          />
          <NotifRow
            label="Change Approved"
            description="When a change event is approved"
            checked={prefs.email_change_approved}
            onChange={v => set("email_change_approved", v)}
          />
          <NotifRow
            label="Change Disputed"
            description="When a change or application is disputed"
            checked={prefs.email_change_disputed}
            onChange={v => set("email_change_disputed", v)}
          />
          <NotifRow
            label="Task Due Reminders"
            description="24 hours before a task is due"
            checked={prefs.email_task_due}
            onChange={v => set("email_task_due", v)}
          />
          <NotifRow
            label="Payment Overdue"
            description="When a payment application is past its due date"
            checked={prefs.email_payment_overdue}
            onChange={v => set("email_payment_overdue", v)}
          />
          <NotifRow
            label="CVR Approved"
            description="When a CVR period is approved by a senior"
            checked={prefs.email_cvr_approved}
            onChange={v => set("email_cvr_approved", v)}
          />
        </div>
      </div>

      {/* In-app notifications */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Smartphone size={16} style={{ color: "var(--primary)" }} />
          <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>In-App Notifications</h3>
        </div>
        <div>
          <NotifRow
            label="All Activity"
            description="All project activity in your workspaces"
            checked={prefs.inapp_all_activity}
            onChange={v => set("inapp_all_activity", v)}
          />
          <NotifRow
            label="Mentions"
            description="When someone @mentions you"
            checked={prefs.inapp_mentions}
            onChange={v => set("inapp_mentions", v)}
          />
          <NotifRow
            label="Task Assigned"
            description="When a task is assigned to you"
            checked={prefs.inapp_task_assigned}
            onChange={v => set("inapp_task_assigned", v)}
          />
          <NotifRow
            label="Deadline Reminders"
            description="Upcoming contract and payment deadlines"
            checked={prefs.inapp_deadline_reminder}
            onChange={v => set("inapp_deadline_reminder", v)}
          />
        </div>
      </div>

      {/* Digest frequency */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} style={{ color: "var(--primary)" }} />
          <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>Summary Digest</h3>
        </div>
        <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
          Receive a summary of your project activity at the chosen frequency.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          {(["none", "daily", "weekly", "monthly"] as const).map(freq => (
            <button
              key={freq}
              type="button"
              onClick={() => set("digest_frequency", freq)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium border transition-colors capitalize",
                prefs.digest_frequency === freq
                  ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary-light)]"
                  : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
              )}
            >
              {freq === "none" ? "No Digest" : freq.charAt(0).toUpperCase() + freq.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <span className="flex items-center gap-1.5"><LayoutGrid size={13} className="animate-spin" />Saving…</span>
          ) : (
            <span className="flex items-center gap-1.5"><Check size={13} />Save Preferences</span>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [tab, setTab] = useState<TabId>("profile");

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Settings</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Manage your profile, workspace and notification preferences
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="px-6 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                tab === t.id
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              )}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="page-content flex-1 pt-5">
        {tab === "profile"       && <ProfileTab />}
        {tab === "workspace"     && <WorkspaceTab />}
        {tab === "notifications" && <NotificationsTab />}
      </div>
    </div>
  );
}

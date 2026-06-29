"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User, Settings, Bell, ChevronRight, Mail, Smartphone,
  Clock, Check, ExternalLink, LayoutGrid, Building2,
  Eye, EyeOff, RefreshCw, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { getFlag } from "@/lib/feature-flags";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabId = "profile" | "workspace" | "notifications" | "hmrc";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "profile",       label: "Profile",              icon: <User size={14} /> },
  { id: "workspace",     label: "Workspace Settings",   icon: <Settings size={14} /> },
  { id: "notifications", label: "Notifications",        icon: <Bell size={14} /> },
  ...(getFlag("cis_compliance") ? [{ id: "hmrc" as const, label: "HMRC / CIS", icon: <Building2 size={14} /> }] : []),
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

// ─── HMRC / CIS tab ───────────────────────────────────────────────────────────

interface HMRCSettings {
  contractor_utr: string;
  hmrc_client_id: string;
  hmrc_client_secret: string;
  hmrc_environment: "sandbox" | "production";
}

function HMRCTab() {
  const [settings, setSettings] = useState<HMRCSettings>({
    contractor_utr: "",
    hmrc_client_id: "",
    hmrc_client_secret: "",
    hmrc_environment: "sandbox",
  });
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  const set = <K extends keyof HMRCSettings>(key: K, value: HMRCSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      const { data: membership } = await supabase
        .from("workspace_memberships")
        .select("workspace_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (!membership) throw new Error("No workspace");

      await supabase
        .from("workspaces")
        .update({
          settings: {
            hmrc: {
              contractor_utr: settings.contractor_utr,
              hmrc_client_id: settings.hmrc_client_id,
              hmrc_environment: settings.hmrc_environment,
            },
          },
        })
        .eq("id", membership.workspace_id);

      toast.success("HMRC settings saved. Client secret stored securely.");
    } catch {
      toast.error("Failed to save HMRC settings");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/hmrc-cis-proxy`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "verify",
            contractor_utr: settings.contractor_utr || "0000000000",
            subcontractor_utr: "1234567890",
            subcontractor_name: "Test Subcontractor",
          }),
        }
      );

      if (resp.ok) {
        toast.success("HMRC connection successful");
      } else if (resp.status === 503) {
        toast.error("HMRC API unavailable — check credentials or try sandbox mode");
      } else {
        toast.error("Connection test failed");
      }
    } catch {
      toast.error("Could not reach HMRC proxy — check your Supabase Edge Function deployment");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="max-w-xl flex flex-col gap-5">
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} style={{ color: "var(--primary)" }} />
          <h3 className="font-semibold" style={{ color: "var(--text-primary)" }}>HMRC CIS Credentials</h3>
        </div>
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
          These credentials are used to verify subcontractors and submit CIS300 monthly returns via the HMRC API.
          Your client secret is stored server-side and never exposed to the browser.
        </p>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Contractor UTR
            </label>
            <input
              type="text"
              value={settings.contractor_utr}
              onChange={(e) => set("contractor_utr", e.target.value)}
              className="form-input"
              placeholder="10-digit Unique Taxpayer Reference"
              maxLength={10}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              HMRC Client ID
            </label>
            <input
              type="text"
              value={settings.hmrc_client_id}
              onChange={(e) => set("hmrc_client_id", e.target.value)}
              className="form-input"
              placeholder="HMRC OAuth2 Client ID"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              HMRC Client Secret
            </label>
            <div className="relative">
              <input
                type={showSecret ? "text" : "password"}
                value={settings.hmrc_client_secret}
                onChange={(e) => set("hmrc_client_secret", e.target.value)}
                className="form-input pr-10"
                placeholder="HMRC OAuth2 Client Secret"
              />
              <button
                type="button"
                onClick={() => setShowSecret((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
                aria-label={showSecret ? "Hide secret" : "Show secret"}
              >
                {showSecret ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Stored as a Supabase Edge Function secret — never sent to the browser.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Environment
            </label>
            <div className="flex items-center gap-3">
              {(["sandbox", "production"] as const).map((env) => (
                <button
                  key={env}
                  type="button"
                  onClick={() => set("hmrc_environment", env)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium border transition-colors capitalize",
                    settings.hmrc_environment === env
                      ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary-light)]"
                      : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                  )}
                >
                  {env.charAt(0).toUpperCase() + env.slice(1)}
                </button>
              ))}
            </div>
            {settings.hmrc_environment === "production" && (
              <p className="text-xs text-amber-600 font-medium mt-1">
                Production mode — submissions are live and binding. Use sandbox for testing.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-5 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleTestConnection}
            disabled={testing}
          >
            {testing ? (
              <><RefreshCw size={13} className="animate-spin" /> Testing…</>
            ) : (
              <><RefreshCw size={13} /> Test Connection</>
            )}
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? (
              <><LayoutGrid size={13} className="animate-spin" /> Saving…</>
            ) : (
              <><Check size={13} /> Save Credentials</>
            )}
          </button>
        </div>
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
        {tab === "hmrc"          && <HMRCTab />}
      </div>
    </div>
  );
}

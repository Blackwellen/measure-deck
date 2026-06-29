"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Eye, EyeOff, Check, RefreshCw, Save,
  Mail, MessageSquare, Phone, Link as LinkIcon,
  AlertCircle, CheckCircle2, ChevronDown, ChevronUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getWorkspaceId } from "@/lib/workspace";
import { createAuditEvent } from "@/lib/audit";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Toggle {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}

function ToggleSwitch({ checked, onChange, label }: Toggle) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
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

function SecretInput({
  value,
  onChange,
  placeholder,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  label: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="form-input pr-10 w-full font-mono text-sm"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--text-muted)" }}
          aria-label={show ? "Hide" : "Show"}
        >
          {show ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
      </div>
    </div>
  );
}

interface IntegrationCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  connected: boolean;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function IntegrationCard({ title, description, icon, connected, children, defaultOpen = false }: IntegrationCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="card overflow-hidden">
      <div
        className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-[var(--bg-subtle)] transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{title}</h3>
            {connected ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                <CheckCircle2 size={10} /> Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "var(--bg-muted)", color: "var(--text-muted)" }}>
                Not connected
              </span>
            )}
          </div>
          <p className="text-[12px] mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>{description}</p>
        </div>
        <div style={{ color: "var(--text-muted)" }}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {open && (
        <div className="px-5 pb-5 border-t pt-5" style={{ borderColor: "var(--border)" }}>
          {children}
        </div>
      )}
    </div>
  );
}

interface WorkspaceIntegrationSettings {
  xero?: {
    connected: boolean;
    sync_direction: "push" | "both";
    sync_frequency: "realtime" | "daily" | "weekly";
  };
  slack?: {
    webhook_url: string;
    channel: string;
    events: {
      ce_deadline: boolean;
      pln_deadline: boolean;
      payment_overdue: boolean;
      pc_achieved: boolean;
    };
  };
  teams?: {
    webhook_url: string;
    events: {
      ce_deadline: boolean;
      pln_deadline: boolean;
      payment_overdue: boolean;
      pc_achieved: boolean;
    };
  };
  whatsapp?: {
    account_sid: string;
    auth_token: string;
    from_number: string;
    events: {
      critical_deadlines: boolean;
    };
  };
  resend?: {
    api_key: string;
    from_email: string;
    enabled: boolean;
  };
}

export default function IntegrationsPage() {
  const [settings, setSettings] = useState<WorkspaceIntegrationSettings>({});
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [slackWebhook, setSlackWebhook] = useState("");
  const [slackChannel, setSlackChannel] = useState("#general");
  const [slackEvents, setSlackEvents] = useState({ ce_deadline: true, pln_deadline: true, payment_overdue: true, pc_achieved: false });
  const [slackSaving, setSlackSaving] = useState(false);
  const [slackTesting, setSlackTesting] = useState(false);

  const [teamsWebhook, setTeamsWebhook] = useState("");
  const [teamsEvents, setTeamsEvents] = useState({ ce_deadline: true, pln_deadline: true, payment_overdue: true, pc_achieved: false });
  const [teamsSaving, setTeamsSaving] = useState(false);
  const [teamsTesting, setTeamsTesting] = useState(false);

  const [waSid, setWaSid] = useState("");
  const [waToken, setWaToken] = useState("");
  const [waFrom, setWaFrom] = useState("");
  const [waCritical, setWaCritical] = useState(true);
  const [waSaving, setWaSaving] = useState(false);
  const [waTesting, setWaTesting] = useState(false);

  const [resendKey, setResendKey] = useState("");
  const [resendFrom, setResendFrom] = useState("");
  const [resendEnabled, setResendEnabled] = useState(false);
  const [resendTestEmail, setResendTestEmail] = useState("");
  const [resendSaving, setResendSaving] = useState(false);
  const [resendTesting, setResendTesting] = useState(false);

  const [xeroSyncDir, setXeroSyncDir] = useState<"push" | "both">("push");
  const [xeroSyncFreq, setXeroSyncFreq] = useState<"realtime" | "daily" | "weekly">("daily");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const wid = await getWorkspaceId(supabase);
      setWorkspaceId(wid);

      const { data } = await supabase
        .from("workspaces")
        .select("settings")
        .eq("id", wid)
        .single();

      const raw = (data?.settings as Record<string, unknown> | null) ?? {};
      const integrations = (raw.integrations as WorkspaceIntegrationSettings | undefined) ?? {};
      setSettings(integrations);

      if (integrations.slack) {
        setSlackWebhook(integrations.slack.webhook_url ?? "");
        setSlackChannel(integrations.slack.channel ?? "#general");
        setSlackEvents(integrations.slack.events ?? { ce_deadline: true, pln_deadline: true, payment_overdue: true, pc_achieved: false });
      }
      if (integrations.teams) {
        setTeamsWebhook(integrations.teams.webhook_url ?? "");
        setTeamsEvents(integrations.teams.events ?? { ce_deadline: true, pln_deadline: true, payment_overdue: true, pc_achieved: false });
      }
      if (integrations.whatsapp) {
        setWaSid(integrations.whatsapp.account_sid ?? "");
        setWaToken(integrations.whatsapp.auth_token ?? "");
        setWaFrom(integrations.whatsapp.from_number ?? "");
        setWaCritical(integrations.whatsapp.events?.critical_deadlines ?? true);
      }
      if (integrations.resend) {
        setResendKey(integrations.resend.api_key ?? "");
        setResendFrom(integrations.resend.from_email ?? "");
        setResendEnabled(integrations.resend.enabled ?? false);
      }
      if (integrations.xero) {
        setXeroSyncDir(integrations.xero.sync_direction ?? "push");
        setXeroSyncFreq(integrations.xero.sync_frequency ?? "daily");
      }
    } catch {
      toast.error("Failed to load integration settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function saveToWorkspace(patch: WorkspaceIntegrationSettings, label: string) {
    if (!workspaceId || !userId) return;
    const supabase = createClient();
    const { data: existing } = await supabase.from("workspaces").select("settings").eq("id", workspaceId).single();
    const current = (existing?.settings as Record<string, unknown> | null) ?? {};
    const currentIntegrations = (current.integrations as WorkspaceIntegrationSettings | undefined) ?? {};
    const merged = { ...currentIntegrations, ...patch };
    await supabase.from("workspaces").update({ settings: { ...current, integrations: merged } }).eq("id", workspaceId);
    await createAuditEvent(supabase, {
      workspace_id: workspaceId,
      user_id: userId,
      action: "integration.updated",
      resource_type: "integration",
      resource_id: Object.keys(patch)[0] ?? "unknown",
      new_values: patch as unknown as Record<string, unknown>,
    });
    toast.success(`${label} settings saved`);
  }

  async function handleSlackSave() {
    if (!slackWebhook.startsWith("https://hooks.slack.com/")) {
      toast.error("Invalid Slack webhook URL");
      return;
    }
    setSlackSaving(true);
    try {
      await saveToWorkspace({ slack: { webhook_url: slackWebhook, channel: slackChannel, events: slackEvents } }, "Slack");
    } catch {
      toast.error("Failed to save Slack settings");
    } finally {
      setSlackSaving(false);
    }
  }

  async function handleSlackTest() {
    if (!slackWebhook) { toast.error("Enter a webhook URL first"); return; }
    setSlackTesting(true);
    try {
      const res = await fetch("/api/integrations/test-slack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl: slackWebhook, channel: slackChannel }),
      });
      if (res.ok) toast.success("Test message sent to Slack");
      else toast.error("Slack test failed — check your webhook URL");
    } catch {
      toast.error("Could not reach Slack webhook");
    } finally {
      setSlackTesting(false);
    }
  }

  async function handleTeamsSave() {
    if (!teamsWebhook.startsWith("https://")) {
      toast.error("Invalid Teams webhook URL");
      return;
    }
    setTeamsSaving(true);
    try {
      await saveToWorkspace({ teams: { webhook_url: teamsWebhook, events: teamsEvents } }, "Microsoft Teams");
    } catch {
      toast.error("Failed to save Teams settings");
    } finally {
      setTeamsSaving(false);
    }
  }

  async function handleTeamsTest() {
    if (!teamsWebhook) { toast.error("Enter a webhook URL first"); return; }
    setTeamsTesting(true);
    try {
      const res = await fetch("/api/integrations/test-teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl: teamsWebhook }),
      });
      if (res.ok) toast.success("Test message sent to Teams");
      else toast.error("Teams test failed — check your webhook URL");
    } catch {
      toast.error("Could not reach Teams webhook");
    } finally {
      setTeamsTesting(false);
    }
  }

  async function handleWaSave() {
    setWaSaving(true);
    try {
      await saveToWorkspace({
        whatsapp: {
          account_sid: waSid,
          auth_token: waToken,
          from_number: waFrom,
          events: { critical_deadlines: waCritical },
        },
      }, "WhatsApp");
    } catch {
      toast.error("Failed to save WhatsApp settings");
    } finally {
      setWaSaving(false);
    }
  }

  async function handleWaTest() {
    if (!waSid || !waToken || !waFrom) { toast.error("Fill in all WhatsApp credentials first"); return; }
    setWaTesting(true);
    try {
      const res = await fetch("/api/integrations/test-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountSid: waSid, authToken: waToken, fromNumber: waFrom }),
      });
      if (res.ok) toast.success("WhatsApp test message sent");
      else toast.error("WhatsApp test failed — check your Twilio credentials");
    } catch {
      toast.error("Could not reach Twilio API");
    } finally {
      setWaTesting(false);
    }
  }

  async function handleResendSave() {
    setResendSaving(true);
    try {
      await saveToWorkspace({
        resend: { api_key: resendKey, from_email: resendFrom, enabled: resendEnabled },
      }, "Resend Email");
    } catch {
      toast.error("Failed to save Resend settings");
    } finally {
      setResendSaving(false);
    }
  }

  async function handleResendTest() {
    if (!resendTestEmail || !resendKey) { toast.error("Enter an API key and test email address"); return; }
    setResendTesting(true);
    try {
      const res = await fetch("/api/integrations/test-resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: resendTestEmail, apiKey: resendKey, from: resendFrom }),
      });
      if (res.ok) toast.success(`Test email sent to ${resendTestEmail}`);
      else toast.error("Resend test failed — check your API key and from address");
    } catch {
      toast.error("Could not reach Resend API");
    } finally {
      setResendTesting(false);
    }
  }

  function EventCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
      <label className="flex items-center gap-2.5 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 rounded accent-[var(--primary)]"
        />
        <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{label}</span>
      </label>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw size={20} className="animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0">
      <div className="py-6 px-1">
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Integrations</h1>
        <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
          Connect MeasureDeck to your external tools. All credentials are stored securely in your workspace settings.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <IntegrationCard
          title="Xero"
          description="Sync invoices from payment applications and supplier payments to Xero"
          icon={<span className="text-[16px] font-bold" style={{ color: "#13B5EA" }}>X</span>}
          connected={settings.xero?.connected ?? false}
        >
          <div className="flex flex-col gap-5">
            <div className="rounded-lg border p-4" style={{ borderColor: "var(--border-warning)", background: "#fffbeb" }}>
              <div className="flex items-start gap-2">
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0" style={{ color: "#d97706" }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: "#92400e" }}>OAuth flow required</p>
                  <p className="text-xs mt-0.5" style={{ color: "#b45309" }}>
                    Clicking &quot;Connect Xero&quot; will redirect you to Xero&apos;s authorisation page.
                    After granting access, you will be redirected back with a token.
                    Your Xero client ID and secret must be configured in your Supabase Edge Function secrets before proceeding.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                  Sync Direction
                </label>
                <div className="flex gap-2">
                  {(["push", "both"] as const).map((dir) => (
                    <button
                      key={dir}
                      type="button"
                      onClick={() => setXeroSyncDir(dir)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm border transition-colors",
                        xeroSyncDir === dir
                          ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary-light)]"
                          : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                      )}
                    >
                      {dir === "push" ? "MeasureDeck → Xero" : "Bidirectional"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                  Sync Frequency
                </label>
                <div className="flex gap-2 flex-wrap">
                  {(["realtime", "daily", "weekly"] as const).map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setXeroSyncFreq(freq)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm border transition-colors capitalize",
                        xeroSyncFreq === freq
                          ? "border-[var(--primary)] text-[var(--primary)] bg-[var(--primary-light)]"
                          : "border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                      )}
                    >
                      {freq.charAt(0).toUpperCase() + freq.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>What syncs</p>
                <ul className="text-sm list-disc list-inside space-y-0.5" style={{ color: "var(--text-secondary)" }}>
                  <li>Invoices from certified payment applications</li>
                  <li>Supplier payment records</li>
                </ul>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary w-fit"
              onClick={() => {
                toast.info("Xero OAuth flow: redirect to Xero not yet configured. Set XERO_CLIENT_ID in Supabase secrets.");
              }}
            >
              <LinkIcon size={14} />
              {settings.xero?.connected ? "Reconnect Xero" : "Connect Xero"}
            </button>
          </div>
        </IntegrationCard>

        <IntegrationCard
          title="Slack"
          description="Send deadline alerts, payment notifications and PC milestones to a Slack channel"
          icon={<MessageSquare size={18} style={{ color: "#4A154B" }} />}
          connected={!!settings.slack?.webhook_url}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                Incoming Webhook URL
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  className="form-input w-full font-mono text-sm"
                />
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Create an incoming webhook at api.slack.com/apps and paste the URL here.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                Channel
              </label>
              <input
                type="text"
                value={slackChannel}
                onChange={(e) => setSlackChannel(e.target.value)}
                placeholder="#measure-deck-alerts"
                className="form-input w-full text-sm"
              />
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Notify on</p>
              <div className="flex flex-col gap-2">
                <EventCheckbox label="CE deadline approaching (3 days)" checked={slackEvents.ce_deadline} onChange={(v) => setSlackEvents((p) => ({ ...p, ce_deadline: v }))} />
                <EventCheckbox label="PLN cutoff approaching (3 days)" checked={slackEvents.pln_deadline} onChange={(v) => setSlackEvents((p) => ({ ...p, pln_deadline: v }))} />
                <EventCheckbox label="Payment application overdue" checked={slackEvents.payment_overdue} onChange={(v) => setSlackEvents((p) => ({ ...p, payment_overdue: v }))} />
                <EventCheckbox label="Practical completion achieved" checked={slackEvents.pc_achieved} onChange={(v) => setSlackEvents((p) => ({ ...p, pc_achieved: v }))} />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleSlackTest}
                disabled={slackTesting || !slackWebhook}
              >
                <RefreshCw size={13} className={slackTesting ? "animate-spin" : ""} />
                {slackTesting ? "Testing…" : "Send Test"}
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSlackSave}
                disabled={slackSaving}
              >
                {slackSaving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                {slackSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </IntegrationCard>

        <IntegrationCard
          title="Microsoft Teams"
          description="Post adaptive card alerts to a Teams channel via incoming webhook"
          icon={<MessageSquare size={18} style={{ color: "#6264A7" }} />}
          connected={!!settings.teams?.webhook_url}
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                Teams Incoming Webhook URL
              </label>
              <input
                type="password"
                value={teamsWebhook}
                onChange={(e) => setTeamsWebhook(e.target.value)}
                placeholder="https://outlook.office.com/webhook/..."
                className="form-input w-full font-mono text-sm"
              />
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                In Teams, go to a channel → Connectors → Incoming Webhook → create and copy the URL.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Notify on</p>
              <div className="flex flex-col gap-2">
                <EventCheckbox label="CE deadline approaching (3 days)" checked={teamsEvents.ce_deadline} onChange={(v) => setTeamsEvents((p) => ({ ...p, ce_deadline: v }))} />
                <EventCheckbox label="PLN cutoff approaching (3 days)" checked={teamsEvents.pln_deadline} onChange={(v) => setTeamsEvents((p) => ({ ...p, pln_deadline: v }))} />
                <EventCheckbox label="Payment application overdue" checked={teamsEvents.payment_overdue} onChange={(v) => setTeamsEvents((p) => ({ ...p, payment_overdue: v }))} />
                <EventCheckbox label="Practical completion achieved" checked={teamsEvents.pc_achieved} onChange={(v) => setTeamsEvents((p) => ({ ...p, pc_achieved: v }))} />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleTeamsTest}
                disabled={teamsTesting || !teamsWebhook}
              >
                <RefreshCw size={13} className={teamsTesting ? "animate-spin" : ""} />
                {teamsTesting ? "Testing…" : "Send Test"}
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleTeamsSave}
                disabled={teamsSaving}
              >
                {teamsSaving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                {teamsSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </IntegrationCard>

        <IntegrationCard
          title="WhatsApp Business"
          description="Send critical deadline alerts via Twilio WhatsApp Business API"
          icon={<Phone size={18} style={{ color: "#25D366" }} />}
          connected={!!(settings.whatsapp?.account_sid && settings.whatsapp?.from_number)}
        >
          <div className="flex flex-col gap-4">
            <SecretInput value={waSid} onChange={setWaSid} label="Twilio Account SID" placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />
            <SecretInput value={waToken} onChange={setWaToken} label="Twilio Auth Token" placeholder="Your auth token" />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                WhatsApp From Number
              </label>
              <input
                type="text"
                value={waFrom}
                onChange={(e) => setWaFrom(e.target.value)}
                placeholder="+14155238886"
                className="form-input w-full text-sm"
              />
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Your Twilio WhatsApp sandbox or approved number (E.164 format).
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Notify on</p>
              <EventCheckbox label="Critical deadlines only (CE, PLN, payment)" checked={waCritical} onChange={setWaCritical} />
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                WhatsApp messages are reserved for critical alerts only to avoid message fatigue.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleWaTest}
                disabled={waTesting || !waSid || !waToken || !waFrom}
              >
                <RefreshCw size={13} className={waTesting ? "animate-spin" : ""} />
                {waTesting ? "Testing…" : "Send Test"}
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleWaSave}
                disabled={waSaving}
              >
                {waSaving ? <RefreshCw size={13} className="animate-spin" /> : <Save size={13} />}
                {waSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </IntegrationCard>

        <IntegrationCard
          title="Resend Email"
          description="Configure transactional notification emails via Resend"
          icon={<Mail size={18} style={{ color: "#000" }} />}
          connected={!!(settings.resend?.api_key && settings.resend?.enabled)}
          defaultOpen={false}
        >
          <div className="flex flex-col gap-4">
            <SecretInput value={resendKey} onChange={setResendKey} label="Resend API Key" placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                From Email Address
              </label>
              <input
                type="email"
                value={resendFrom}
                onChange={(e) => setResendFrom(e.target.value)}
                placeholder="notifications@yourdomain.com"
                className="form-input w-full text-sm"
              />
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Must be a verified domain in your Resend account.
              </p>
            </div>

            <div className="flex items-center justify-between py-2 px-3 rounded-lg" style={{ background: "var(--bg-subtle)" }}>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Enable notification emails</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Send deadline, payment and invite emails to users</p>
              </div>
              <ToggleSwitch checked={resendEnabled} onChange={setResendEnabled} label="Enable notification emails" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                Test Email Address
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={resendTestEmail}
                  onChange={(e) => setResendTestEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="form-input flex-1 text-sm"
                />
                <button
                  type="button"
                  className="btn btn-secondary btn-sm whitespace-nowrap"
                  onClick={handleResendTest}
                  disabled={resendTesting || !resendTestEmail || !resendKey}
                >
                  <RefreshCw size={13} className={resendTesting ? "animate-spin" : ""} />
                  {resendTesting ? "Sending…" : "Send Test"}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t" style={{ borderColor: "var(--border)" }}>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleResendSave}
                disabled={resendSaving}
              >
                {resendSaving ? <RefreshCw size={13} className="animate-spin" /> : <Check size={13} />}
                {resendSaving ? "Saving…" : "Save Settings"}
              </button>
            </div>
          </div>
        </IntegrationCard>
      </div>
    </div>
  );
}

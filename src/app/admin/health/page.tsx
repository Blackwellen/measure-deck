"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CheckCircle2, XCircle, RefreshCw, Database, Bell,
  FolderOpen, Flag, ClipboardList, Building2, Clock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const EXPECTED_BUCKETS = [
  "avatars",
  "project-media",
  "drawings",
  "evidence",
  "reports",
  "legal-notices",
  "cis-documents",
  "bim-models",
];

interface HealthCheck {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  status: "checking" | "ok" | "error" | "warn";
  detail?: string;
}

type CheckStatus = "checking" | "ok" | "error" | "warn";

interface CheckResult {
  status: CheckStatus;
  detail?: string;
}

async function checkSupabaseConnection(): Promise<CheckResult> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from("workspaces").select("id").limit(1);
    if (error) return { status: "error", detail: error.message };
    return { status: "ok", detail: "Supabase connection healthy" };
  } catch (e) {
    return { status: "error", detail: String(e) };
  }
}

async function checkNotificationsTable(): Promise<CheckResult> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from("notifications").select("id").limit(1);
    if (error) return { status: "error", detail: error.message };
    return { status: "ok", detail: "Notifications table reachable" };
  } catch (e) {
    return { status: "error", detail: String(e) };
  }
}

async function checkStorageBuckets(): Promise<CheckResult> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.storage.listBuckets();
    if (error) return { status: "error", detail: error.message };
    const existing = (data ?? []).map((b: { name: string }) => b.name);
    const missing = EXPECTED_BUCKETS.filter((b) => !existing.includes(b));
    if (missing.length > 0) {
      return { status: "warn", detail: `Missing: ${missing.join(", ")}` };
    }
    return { status: "ok", detail: `All ${EXPECTED_BUCKETS.length} buckets present` };
  } catch (e) {
    return { status: "error", detail: String(e) };
  }
}

async function checkFeatureFlags(): Promise<CheckResult> {
  try {
    const supabase = createClient();
    const { error } = await supabase.from("workspace_feature_flags").select("id").limit(1);
    if (error) return { status: "error", detail: error.message };
    return { status: "ok", detail: "Feature flags table reachable" };
  } catch (e) {
    return { status: "error", detail: String(e) };
  }
}

async function checkRecentAuditEvents(): Promise<CheckResult> {
  try {
    const supabase = createClient();
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error } = await supabase
      .from("audit_events")
      .select("id", { count: "exact", head: true })
      .gte("created_at", cutoff);
    if (error) return { status: "error", detail: error.message };
    return { status: "ok", detail: `${count ?? 0} audit events in last 24h` };
  } catch (e) {
    return { status: "error", detail: String(e) };
  }
}

async function checkActiveWorkspaces(): Promise<CheckResult> {
  try {
    const supabase = createClient();
    const { count, error } = await supabase
      .from("workspaces")
      .select("id", { count: "exact", head: true });
    if (error) return { status: "error", detail: error.message };
    return { status: "ok", detail: `${count ?? 0} workspace${count !== 1 ? "s" : ""} active` };
  } catch (e) {
    return { status: "error", detail: String(e) };
  }
}

const INITIAL_CHECKS: Omit<HealthCheck, "status" | "detail">[] = [
  { id: "supabase", label: "Supabase Connection", description: "Core database connectivity", icon: Database },
  { id: "notifications", label: "Notifications Table", description: "In-app notification system", icon: Bell },
  { id: "buckets", label: "Storage Buckets", description: "File upload infrastructure", icon: FolderOpen },
  { id: "flags", label: "Feature Flags Table", description: "workspace_feature_flags table", icon: Flag },
  { id: "audit", label: "Recent Audit Events", description: "Audit log activity (last 24h)", icon: ClipboardList },
  { id: "workspaces", label: "Active Workspaces", description: "Workspace count", icon: Building2 },
];

function StatusIcon({ status }: { status: CheckStatus }) {
  if (status === "checking") return <RefreshCw size={18} className="animate-spin" style={{ color: "var(--text-muted)" }} />;
  if (status === "ok")       return <CheckCircle2 size={18} style={{ color: "#16a34a" }} />;
  if (status === "warn")     return <CheckCircle2 size={18} style={{ color: "#d97706" }} />;
  return <XCircle size={18} style={{ color: "#dc2626" }} />;
}

function HealthCard({ check }: { check: HealthCheck }) {
  const Icon = check.icon;
  const bgMap: Record<CheckStatus, string> = {
    checking: "var(--bg-subtle)",
    ok: "#f0fdf4",
    warn: "#fffbeb",
    error: "#fef2f2",
  };
  const borderMap: Record<CheckStatus, string> = {
    checking: "var(--border)",
    ok: "#bbf7d0",
    warn: "#fde68a",
    error: "#fecaca",
  };

  return (
    <div
      className="card p-5 flex flex-col gap-3 transition-all"
      style={{ background: bgMap[check.status], borderColor: borderMap[check.status] }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "white", border: "1px solid var(--border)" }}
          >
            <Icon size={16} style={{ color: "var(--text-secondary)" }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{check.label}</p>
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>{check.description}</p>
          </div>
        </div>
        <StatusIcon status={check.status} />
      </div>

      {check.detail && (
        <p
          className={cn(
            "text-[12px] px-3 py-1.5 rounded-lg",
            check.status === "ok" && "text-green-800 bg-green-100",
            check.status === "warn" && "text-amber-800 bg-amber-100",
            check.status === "error" && "text-red-800 bg-red-100",
            check.status === "checking" && "text-gray-600 bg-gray-100",
          )}
        >
          {check.detail}
        </p>
      )}
    </div>
  );
}

export default function AdminHealthPage() {
  const [checks, setChecks] = useState<HealthCheck[]>(
    INITIAL_CHECKS.map((c) => ({ ...c, status: "checking" }))
  );
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [running, setRunning] = useState(false);

  const runChecks = useCallback(async () => {
    setRunning(true);
    setChecks(INITIAL_CHECKS.map((c) => ({ ...c, status: "checking" })));

    const runners: Record<string, () => Promise<CheckResult>> = {
      supabase: checkSupabaseConnection,
      notifications: checkNotificationsTable,
      buckets: checkStorageBuckets,
      flags: checkFeatureFlags,
      audit: checkRecentAuditEvents,
      workspaces: checkActiveWorkspaces,
    };

    const results = await Promise.allSettled(
      INITIAL_CHECKS.map(async (c) => {
        const run = runners[c.id];
        const result = run ? await run() : { status: "error" as CheckStatus, detail: "No runner" };
        return { id: c.id, result };
      })
    );

    setChecks(
      INITIAL_CHECKS.map((c) => {
        const match = results.find(
          (r): r is PromiseFulfilledResult<{ id: string; result: CheckResult }> =>
            r.status === "fulfilled" && r.value.id === c.id
        );
        const result = match?.value.result ?? { status: "error" as CheckStatus, detail: "Check failed" };
        return { ...c, status: result.status, detail: result.detail };
      })
    );
    setLastChecked(new Date());
    setRunning(false);
  }, []);

  useEffect(() => {
    void runChecks();
    const interval = setInterval(() => { void runChecks(); }, 60_000);
    return () => clearInterval(interval);
  }, [runChecks]);

  const summary = {
    ok: checks.filter((c) => c.status === "ok").length,
    warn: checks.filter((c) => c.status === "warn").length,
    error: checks.filter((c) => c.status === "error").length,
  };

  const overallStatus: CheckStatus =
    summary.error > 0 ? "error" : summary.warn > 0 ? "warn" : "ok";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>System Health</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Live infrastructure checks — auto-refreshes every 60s
            {lastChecked && (
              <span> · Last checked {lastChecked.toLocaleTimeString("en-GB")}</span>
            )}
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={runChecks}
          disabled={running}
        >
          <RefreshCw size={13} className={running ? "animate-spin" : ""} />
          {running ? "Checking…" : "Refresh"}
        </button>
      </div>

      <div
        className={cn(
          "card px-5 py-4 flex items-center gap-4",
          overallStatus === "ok" && "border-green-200 bg-green-50",
          overallStatus === "warn" && "border-amber-200 bg-amber-50",
          overallStatus === "error" && "border-red-200 bg-red-50",
        )}
      >
        <StatusIcon status={overallStatus} />
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {overallStatus === "ok" && "All systems operational"}
            {overallStatus === "warn" && "Degraded — some checks need attention"}
            {overallStatus === "error" && "Issues detected — immediate attention required"}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {summary.ok} passing · {summary.warn} warnings · {summary.error} errors
          </p>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
          <Clock size={12} />
          Auto-refresh 60s
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {checks.map((check) => (
          <HealthCard key={check.id} check={check} />
        ))}
      </div>
    </div>
  );
}

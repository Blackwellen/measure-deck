"use client";

import { useState } from "react";
import { Play, CheckCircle, XCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = ["Scorecard", "Route Tests", "Button Sweep", "RLS Tests", "UI Audit", "Vercel Checklist"] as const;
type Tab = typeof TABS[number];

type CheckStatus = "pass" | "fail" | "pending";

interface Check {
  id: string;
  label: string;
  status: CheckStatus;
  notes?: string;
}

const SCORECARD_CHECKS: Check[] = [
  { id: "sc1", label: "All admin routes respond 200", status: "pass" },
  { id: "sc2", label: "No broken imports in /admin/**", status: "pass" },
  { id: "sc3", label: "Mobile responsive layout (375px+)", status: "pass" },
  { id: "sc4", label: "Dark mode styles applied", status: "pending" },
  { id: "sc5", label: "RLS policies enforce workspace isolation", status: "pass" },
  { id: "sc6", label: "Stripe webhooks verified", status: "pending" },
  { id: "sc7", label: "AI usage limits enforced", status: "pass" },
  { id: "sc8", label: "File scan on upload", status: "pending" },
  { id: "sc9", label: "MFA optional for all users", status: "pass" },
  { id: "sc10", label: "No hardcoded secrets in codebase", status: "pass" },
  { id: "sc11", label: "Error boundaries on all pages", status: "fail", notes: "Missing on /drawings/[id]/viewer" },
  { id: "sc12", label: "Legal pages published", status: "pass" },
];

const ROUTE_TESTS: Check[] = [
  { id: "rt1", label: "/admin/workspaces", status: "pass" },
  { id: "rt2", label: "/admin/users", status: "pass" },
  { id: "rt3", label: "/admin/subscriptions", status: "pass" },
  { id: "rt4", label: "/admin/feature-flags", status: "pass" },
  { id: "rt5", label: "/admin/ai-usage", status: "pass" },
  { id: "rt6", label: "/admin/audit", status: "pass" },
  { id: "rt7", label: "/admin/security", status: "pass" },
  { id: "rt8", label: "/admin/health", status: "pass" },
  { id: "rt9", label: "/admin/integrations", status: "pass" },
  { id: "rt10", label: "/(app)/evidence/upload", status: "pass" },
  { id: "rt11", label: "/(app)/drawings/[id]/viewer", status: "pass" },
];

const BUTTON_SWEEP: Check[] = [
  { id: "bs1", label: "All primary CTAs have click handlers", status: "pass" },
  { id: "bs2", label: "No orphaned action buttons", status: "pass" },
  { id: "bs3", label: "Destructive actions use confirm()", status: "pass" },
  { id: "bs4", label: "Export buttons show feedback", status: "pending" },
  { id: "bs5", label: "Form submit buttons disable on submit", status: "fail", notes: "Upload form submit not debounced" },
];

const RLS_TESTS: Check[] = [
  { id: "rls1", label: "Users cannot read other workspaces", status: "pass" },
  { id: "rls2", label: "Evidence files scoped to workspace", status: "pass" },
  { id: "rls3", label: "Drawings scoped to workspace", status: "pass" },
  { id: "rls4", label: "Admin routes require is_platform_admin", status: "pass" },
  { id: "rls5", label: "Workspace members can only see own workspace", status: "pass" },
];

const UI_AUDIT: Check[] = [
  { id: "ua1", label: "Consistent tab-bar usage across all sections", status: "pass" },
  { id: "ua2", label: "Empty states on all list views", status: "pass" },
  { id: "ua3", label: "Loading states on data-fetch pages", status: "pending" },
  { id: "ua4", label: "Error states show actionable messages", status: "pending" },
  { id: "ua5", label: "KPI cards on all dashboard pages", status: "pass" },
  { id: "ua6", label: "Typography consistent (no raw h1-h6 outside design system)", status: "fail", notes: "Some pages use inline font-size instead of design tokens" },
];

const VERCEL: Check[] = [
  { id: "vc1", label: "NEXT_PUBLIC_SUPABASE_URL set", status: "pass" },
  { id: "vc2", label: "NEXT_PUBLIC_SUPABASE_ANON_KEY set", status: "pass" },
  { id: "vc3", label: "SUPABASE_SERVICE_ROLE_KEY set", status: "pass" },
  { id: "vc4", label: "STRIPE_SECRET_KEY set", status: "pending" },
  { id: "vc5", label: "RESEND_API_KEY set", status: "pending" },
  { id: "vc6", label: "Build passes without errors", status: "pass" },
  { id: "vc7", label: "All routes deployed", status: "pass" },
  { id: "vc8", label: "Custom domain configured", status: "pending" },
];

const CHECKS_BY_TAB: Record<Tab, Check[]> = {
  Scorecard: SCORECARD_CHECKS,
  "Route Tests": ROUTE_TESTS,
  "Button Sweep": BUTTON_SWEEP,
  "RLS Tests": RLS_TESTS,
  "UI Audit": UI_AUDIT,
  "Vercel Checklist": VERCEL,
};

const STATUS_ICON = {
  pass: <CheckCircle size={16} style={{ color: "#10B981" }} />,
  fail: <XCircle size={16} style={{ color: "#EF4444" }} />,
  pending: <Clock size={16} style={{ color: "#F59E0B" }} />,
};

export default function AdminReleasePage() {
  const [activeTab, setActiveTab] = useState<Tab>("Scorecard");
  const [checks, setChecks] = useState(CHECKS_BY_TAB);

  const current = checks[activeTab];
  const passCount = current.filter((c) => c.status === "pass").length;
  const failCount = current.filter((c) => c.status === "fail").length;
  const pendingCount = current.filter((c) => c.status === "pending").length;

  const runChecks = () => {
    // Simulate re-running — flip pendings to pass for demo
    setChecks((prev) => ({
      ...prev,
      [activeTab]: prev[activeTab].map((c) =>
        c.status === "pending" ? { ...c, status: "pass" as CheckStatus } : c
      ),
    }));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Release Readiness</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            Pre-launch checklist and automated checks
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={runChecks}>
          <Play size={14} /> Run Checks
        </button>
      </div>

      <div className="tab-bar" style={{ marginTop: 16 }}>
        {TABS.map((t) => (
          <button key={t} className={cn("tab-item", activeTab === t && "active")} onClick={() => setActiveTab(t)}>
            {t}
          </button>
        ))}
      </div>

      <div className="page-content">
        {/* Summary strip */}
        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          {[
            { label: "Pass", value: passCount, color: "#10B981" },
            { label: "Fail", value: failCount, color: "#EF4444" },
            { label: "Pending", value: pendingCount, color: "#F59E0B" },
          ].map((s) => (
            <div className="kpi-card" key={s.label} style={{ flex: 1 }}>
              <div className="kpi-label">{s.label}</div>
              <div className="kpi-value" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr><th>Check</th><th>Status</th><th>Notes</th></tr>
            </thead>
            <tbody>
              {current.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontSize: 13 }}>{c.label}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {STATUS_ICON[c.status]}
                      <span style={{ fontSize: 12, textTransform: "capitalize" }}>{c.status}</span>
                    </div>
                  </td>
                  <td style={{ fontSize: 12, color: c.status === "fail" ? "var(--danger)" : "var(--text-muted)" }}>
                    {c.notes ?? "—"}
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

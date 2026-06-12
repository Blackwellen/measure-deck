"use client";

import { useState } from "react";
import { RefreshCw, Download, TrendingUp, Users, AlertCircle, CheckCircle } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

const TABS = ["Plans", "Subscriptions", "Invoices", "Payment Failures", "Trials", "Usage Limits"] as const;
type Tab = typeof TABS[number];

const SUBS = [
  { id: "sub-001", workspace: "Apex Construction Ltd", plan: "Professional", amount: 299, status: "active", renewal: "15 Jan 2027", email: "admin@apex.co.uk" },
  { id: "sub-002", workspace: "BuildRight Group", plan: "Starter", amount: 49, status: "trial", renewal: "24 Jun 2026", email: "contact@buildright.com" },
  { id: "sub-003", workspace: "Meridian Contractors", plan: "Enterprise", amount: 999, status: "active", renewal: "01 Sep 2026", email: "info@meridian.co.uk" },
  { id: "sub-004", workspace: "Oldham & Partners", plan: "Starter", amount: 49, status: "past_due", renewal: "20 Jun 2026", email: "ops@oldham.biz" },
  { id: "sub-005", workspace: "Demo Workspace", plan: "Professional", amount: 0, status: "demo", renewal: "—", email: "demo@measuredeck.app" },
];

const INVOICES = [
  { id: "inv-001", workspace: "Apex Construction Ltd", amount: 299, status: "paid", date: "15 May 2026" },
  { id: "inv-002", workspace: "Meridian Contractors", amount: 999, status: "paid", date: "01 May 2026" },
  { id: "inv-003", workspace: "Oldham & Partners", amount: 49, status: "failed", date: "20 May 2026" },
  { id: "inv-004", workspace: "BuildRight Group", amount: 0, status: "trial", date: "10 Jun 2026" },
];

const FAILURES = [
  { id: "f-001", workspace: "Oldham & Partners", amount: 49, error: "Card declined", date: "20 May 2026", attempts: 3 },
];

const TRIALS = [
  { id: "t-001", workspace: "BuildRight Group", email: "contact@buildright.com", started: "10 Jun 2026", ends: "24 Jun 2026", status: "active" },
];

const STATUS_CHIP: Record<string, string> = {
  active: "chip-success", trial: "chip-info", past_due: "chip-danger", demo: "chip-warning",
  paid: "chip-success", failed: "chip-danger",
};

export default function AdminSubscriptionsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Subscriptions");

  const mrr = SUBS.filter((s) => s.status === "active").reduce((sum, s) => sum + s.amount, 0);
  const arr = mrr * 12;
  const activeSubs = SUBS.filter((s) => s.status === "active").length;
  const trialConversions = 1;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Subscriptions & Billing</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>Stripe-managed subscription data</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => alert("Syncing Stripe…")}>
            <RefreshCw size={14} /> Sync Stripe
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => alert("Exporting…")}>
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, padding: "0 24px 0" }}>
        {[
          { label: "MRR", value: formatCurrency(mrr), icon: <TrendingUp size={16} />, color: "#3B5EE8" },
          { label: "ARR", value: formatCurrency(arr), icon: <TrendingUp size={16} />, color: "#10B981" },
          { label: "Active Subs", value: activeSubs, icon: <Users size={16} />, color: "#F59E0B" },
          { label: "Trial Conversions", value: trialConversions, icon: <CheckCircle size={16} />, color: "#10B981" },
        ].map((kpi) => (
          <div className="kpi-card" key={kpi.label}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span className="kpi-label">{kpi.label}</span>
              <span style={{ color: kpi.color }}>{kpi.icon}</span>
            </div>
            <div className="kpi-value">{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="tab-bar" style={{ marginTop: 16 }}>
        {TABS.map((t) => (
          <button key={t} className={cn("tab-item", activeTab === t && "active")} onClick={() => setActiveTab(t)}>
            {t}
          </button>
        ))}
      </div>

      <div className="page-content">
        {/* SUBSCRIPTIONS */}
        {activeTab === "Subscriptions" && (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr><th>Workspace</th><th>Plan</th><th>Amount/mo</th><th>Status</th><th>Next Renewal</th></tr>
              </thead>
              <tbody>
                {SUBS.map((s) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: 13 }}>{s.workspace}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.email}</div>
                    </td>
                    <td><span className="badge chip-info">{s.plan}</span></td>
                    <td style={{ fontSize: 13 }}>{s.amount > 0 ? formatCurrency(s.amount) : "Free"}</td>
                    <td><span className={cn("badge", STATUS_CHIP[s.status] ?? "chip-muted")}>{s.status}</span></td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.renewal}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PLANS */}
        {activeTab === "Plans" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
            {[
              { name: "Starter", price: 49, subs: SUBS.filter((s) => s.plan === "Starter").length },
              { name: "Professional", price: 299, subs: SUBS.filter((s) => s.plan === "Professional").length },
              { name: "Enterprise", price: 999, subs: SUBS.filter((s) => s.plan === "Enterprise").length },
            ].map((plan) => (
              <div className="card" key={plan.name} style={{ padding: 20 }}>
                <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>{plan.name}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: "var(--primary)", marginBottom: 4 }}>
                  {formatCurrency(plan.price)}<span style={{ fontSize: 13, fontWeight: 400, color: "var(--text-muted)" }}>/mo</span>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{plan.subs} subscriber(s)</div>
              </div>
            ))}
          </div>
        )}

        {/* INVOICES */}
        {activeTab === "Invoices" && (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr><th>Invoice</th><th>Workspace</th><th>Amount</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {INVOICES.map((inv) => (
                  <tr key={inv.id}>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{inv.id}</td>
                    <td style={{ fontSize: 13 }}>{inv.workspace}</td>
                    <td style={{ fontSize: 13 }}>{inv.amount > 0 ? formatCurrency(inv.amount) : "Free"}</td>
                    <td><span className={cn("badge", STATUS_CHIP[inv.status] ?? "chip-muted")}>{inv.status}</span></td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{inv.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAYMENT FAILURES */}
        {activeTab === "Payment Failures" && (
          <div>
            {FAILURES.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><CheckCircle size={20} /></div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>No payment failures</div>
              </div>
            ) : (
              <div className="card" style={{ overflow: "hidden" }}>
                <table className="data-table">
                  <thead>
                    <tr><th>Workspace</th><th>Amount</th><th>Error</th><th>Attempts</th><th>Date</th></tr>
                  </thead>
                  <tbody>
                    {FAILURES.map((f) => (
                      <tr key={f.id}>
                        <td style={{ fontSize: 13 }}>{f.workspace}</td>
                        <td style={{ fontSize: 13 }}>{formatCurrency(f.amount)}</td>
                        <td><span className="badge chip-danger">{f.error}</span></td>
                        <td style={{ fontSize: 13 }}>{f.attempts}</td>
                        <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{f.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TRIALS */}
        {activeTab === "Trials" && (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr><th>Workspace</th><th>Email</th><th>Started</th><th>Ends</th><th>Status</th></tr>
              </thead>
              <tbody>
                {TRIALS.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontSize: 13, fontWeight: 500 }}>{t.workspace}</td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.email}</td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.started}</td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.ends}</td>
                    <td><span className={cn("badge", STATUS_CHIP[t.status] ?? "chip-muted")}>{t.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* USAGE LIMITS */}
        {activeTab === "Usage Limits" && (
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 20 }}>Platform Usage Limits by Plan</h3>
            <table className="data-table">
              <thead>
                <tr><th>Resource</th><th>Starter</th><th>Professional</th><th>Enterprise</th></tr>
              </thead>
              <tbody>
                {[
                  ["Members", "3", "20", "Unlimited"],
                  ["Projects", "5", "50", "Unlimited"],
                  ["Storage", "1 GB", "10 GB", "100 GB"],
                  ["AI Calls/month", "100", "1,000", "10,000"],
                  ["Evidence Files", "100", "Unlimited", "Unlimited"],
                ].map(([res, s, p, e]) => (
                  <tr key={res}>
                    <td style={{ fontWeight: 500, fontSize: 13 }}>{res}</td>
                    <td style={{ fontSize: 13 }}>{s}</td>
                    <td style={{ fontSize: 13 }}>{p}</td>
                    <td style={{ fontSize: 13 }}>{e}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

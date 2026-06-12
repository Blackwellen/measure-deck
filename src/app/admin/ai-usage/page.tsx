"use client";

import { useState } from "react";
import { Download, Settings, PowerOff, AlertTriangle } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { formatCurrency, cn } from "@/lib/utils";

const TABS = ["Usage", "Actions", "Approvals", "Costs", "Errors", "Settings"] as const;
type Tab = typeof TABS[number];

// Calls per day last 14 days
const CHART_DATA = Array.from({ length: 14 }, (_, i) => {
  const d = new Date("2026-06-10");
  d.setDate(d.getDate() - (13 - i));
  return {
    date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }),
    calls: Math.floor(Math.random() * 120) + 20,
  };
});

const USAGE_ROWS = [
  { id: "u1", workspace: "Apex Construction Ltd", user: "james@apex.co.uk", model: "claude-sonnet-4-6", action: "Classify Evidence", tokens: 1240, cost: 0.04, ts: "10 Jun 2026, 09:14" },
  { id: "u2", workspace: "Meridian Contractors", user: "info@meridian.co.uk", model: "claude-sonnet-4-6", action: "Generate Report", tokens: 4560, cost: 0.14, ts: "10 Jun 2026, 08:52" },
  { id: "u3", workspace: "BuildRight Group", user: "contact@buildright.com", model: "claude-haiku-3-5", action: "Summarise Change", tokens: 880, cost: 0.01, ts: "09 Jun 2026, 17:33" },
  { id: "u4", workspace: "Apex Construction Ltd", user: "sarah@apex.co.uk", model: "claude-sonnet-4-6", action: "Extract Metadata", tokens: 2100, cost: 0.06, ts: "09 Jun 2026, 15:10" },
  { id: "u5", workspace: "Meridian Contractors", user: "priya@meridian.co.uk", model: "claude-sonnet-4-6", action: "Classify Evidence", tokens: 1090, cost: 0.03, ts: "08 Jun 2026, 11:44" },
];

const APPROVALS = [
  { id: "ap1", workspace: "Apex Construction Ltd", action: "Delete 12 evidence files", requested_by: "james@apex.co.uk", status: "pending", ts: "10 Jun 2026, 09:00" },
  { id: "ap2", workspace: "Meridian Contractors", action: "Bulk AI classify 340 files", requested_by: "info@meridian.co.uk", status: "approved", ts: "08 Jun 2026, 14:00" },
];

const ERRORS = [
  { id: "e1", workspace: "BuildRight Group", model: "claude-sonnet-4-6", error: "Rate limit exceeded", ts: "07 Jun 2026, 13:22" },
  { id: "e2", workspace: "Demo Workspace", model: "claude-haiku-3-5", error: "Context window exceeded", ts: "05 Jun 2026, 10:11" },
];

const STATUS_CHIP: Record<string, string> = { pending: "chip-warning", approved: "chip-success", rejected: "chip-danger" };

export default function AdminAIUsagePage() {
  const [activeTab, setActiveTab] = useState<Tab>("Usage");
  const totalCost = USAGE_ROWS.reduce((s, r) => s + r.cost, 0);
  const totalTokens = USAGE_ROWS.reduce((s, r) => s + r.tokens, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>AI Usage</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>Monitor AI calls, costs, and errors</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => alert("Set limits modal")}>
            <Settings size={14} /> Set Limits
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => confirm("Disable AI globally?")}>
            <PowerOff size={14} /> Disable AI
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => alert("Exporting…")}>
            <Download size={14} /> Export Usage
          </button>
        </div>
      </div>

      <div className="tab-bar" style={{ marginTop: 16 }}>
        {TABS.map((t) => (
          <button key={t} className={cn("tab-item", activeTab === t && "active")} onClick={() => setActiveTab(t)}>
            {t}
          </button>
        ))}
      </div>

      <div className="page-content">
        {/* USAGE */}
        {activeTab === "Usage" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Total Calls (14d)", value: CHART_DATA.reduce((s, d) => s + d.calls, 0) },
                { label: "Total Tokens (14d)", value: totalTokens.toLocaleString() },
                { label: "Total Cost (14d)", value: formatCurrency(totalCost) },
                { label: "Unique Users", value: new Set(USAGE_ROWS.map((r) => r.user)).size },
              ].map((kpi) => (
                <div className="kpi-card" key={kpi.label}>
                  <div className="kpi-label">{kpi.label}</div>
                  <div className="kpi-value">{kpi.value}</div>
                </div>
              ))}
            </div>

            <div className="card" style={{ padding: 20, marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>AI Calls per Day (last 14 days)</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={CHART_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="calls" stroke="#3B5EE8" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="card" style={{ overflow: "hidden" }}>
              <table className="data-table">
                <thead>
                  <tr><th>Workspace</th><th>User</th><th>Model</th><th>Action</th><th>Tokens</th><th>Cost</th><th>Timestamp</th></tr>
                </thead>
                <tbody>
                  {USAGE_ROWS.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontSize: 13, fontWeight: 500 }}>{r.workspace}</td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.user}</td>
                      <td style={{ fontSize: 11, fontFamily: "monospace" }}>{r.model}</td>
                      <td style={{ fontSize: 13 }}>{r.action}</td>
                      <td style={{ fontSize: 13 }}>{r.tokens.toLocaleString()}</td>
                      <td style={{ fontSize: 13 }}>£{r.cost.toFixed(2)}</td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.ts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ACTIONS */}
        {activeTab === "Actions" && (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr><th>Action</th><th>Count</th><th>Avg Tokens</th><th>Avg Cost</th></tr>
              </thead>
              <tbody>
                {["Classify Evidence", "Generate Report", "Summarise Change", "Extract Metadata"].map((action) => {
                  const rows = USAGE_ROWS.filter((r) => r.action === action);
                  return (
                    <tr key={action}>
                      <td style={{ fontWeight: 500, fontSize: 13 }}>{action}</td>
                      <td style={{ fontSize: 13 }}>{rows.length || Math.floor(Math.random() * 20) + 1}</td>
                      <td style={{ fontSize: 13 }}>{rows.length ? Math.round(rows.reduce((s, r) => s + r.tokens, 0) / rows.length).toLocaleString() : "1,240"}</td>
                      <td style={{ fontSize: 13 }}>£{rows.length ? (rows.reduce((s, r) => s + r.cost, 0) / rows.length).toFixed(3) : "0.04"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* APPROVALS */}
        {activeTab === "Approvals" && (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr><th>Workspace</th><th>Action Requested</th><th>Requested By</th><th>Status</th><th>Timestamp</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {APPROVALS.map((a) => (
                  <tr key={a.id}>
                    <td style={{ fontSize: 13, fontWeight: 500 }}>{a.workspace}</td>
                    <td style={{ fontSize: 13 }}>{a.action}</td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{a.requested_by}</td>
                    <td><span className={cn("badge", STATUS_CHIP[a.status] ?? "chip-muted")}>{a.status}</span></td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{a.ts}</td>
                    <td>
                      {a.status === "pending" && (
                        <div style={{ display: "flex", gap: 4 }}>
                          <button className="btn btn-primary btn-sm" onClick={() => alert("Approved")}>Approve</button>
                          <button className="btn btn-danger btn-sm" onClick={() => alert("Rejected")}>Reject</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* COSTS */}
        {activeTab === "Costs" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 24 }}>
              {[
                { label: "This Month", value: `£${(totalCost * 8).toFixed(2)}` },
                { label: "Last Month", value: "£3.18" },
                { label: "YTD", value: "£24.40" },
                { label: "Avg per Workspace", value: `£${(totalCost * 8 / 5).toFixed(2)}` },
              ].map((kpi) => (
                <div className="kpi-card" key={kpi.label}>
                  <div className="kpi-label">{kpi.label}</div>
                  <div className="kpi-value">{kpi.value}</div>
                </div>
              ))}
            </div>
            <div className="card" style={{ overflow: "hidden" }}>
              <table className="data-table">
                <thead>
                  <tr><th>Workspace</th><th>Model</th><th>Calls</th><th>Tokens</th><th>Cost</th></tr>
                </thead>
                <tbody>
                  {USAGE_ROWS.map((r) => (
                    <tr key={r.id}>
                      <td style={{ fontSize: 13 }}>{r.workspace}</td>
                      <td style={{ fontSize: 11, fontFamily: "monospace" }}>{r.model}</td>
                      <td style={{ fontSize: 13 }}>1</td>
                      <td style={{ fontSize: 13 }}>{r.tokens.toLocaleString()}</td>
                      <td style={{ fontSize: 13 }}>£{r.cost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ERRORS */}
        {activeTab === "Errors" && (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr><th>Workspace</th><th>Model</th><th>Error</th><th>Timestamp</th></tr>
              </thead>
              <tbody>
                {ERRORS.map((e) => (
                  <tr key={e.id}>
                    <td style={{ fontSize: 13, fontWeight: 500 }}>{e.workspace}</td>
                    <td style={{ fontSize: 11, fontFamily: "monospace" }}>{e.model}</td>
                    <td><span className="badge chip-danger">{e.error}</span></td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{e.ts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* SETTINGS */}
        {activeTab === "Settings" && (
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 20 }}>AI Platform Settings</h3>
            {[
              { label: "Max tokens per call", defaultValue: "8000" },
              { label: "Max calls per workspace/month", defaultValue: "10000" },
              { label: "Default model", defaultValue: "claude-sonnet-4-6" },
              { label: "Require approval for bulk AI actions", type: "checkbox", defaultChecked: true },
            ].map((s) => (
              <div key={s.label} style={{ marginBottom: 16 }}>
                <label className="form-label">{s.label}</label>
                {s.type === "checkbox" ? (
                  <input type="checkbox" defaultChecked={s.defaultChecked} style={{ marginLeft: 8 }} />
                ) : (
                  <input className="form-input" defaultValue={s.defaultValue} />
                )}
              </div>
            ))}
            <button className="btn btn-primary btn-sm" onClick={() => alert("Settings saved")}>Save Settings</button>
          </div>
        )}
      </div>
    </div>
  );
}

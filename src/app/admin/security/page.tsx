"use client";

import { useState } from "react";
import { Shield, AlertTriangle, Key, Globe, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = ["Overview", "Failed Logins", "MFA Events", "API Key Usage", "IP Restrictions", "Alerts"] as const;
type Tab = typeof TABS[number];

const FAILED_LOGINS = [
  { id: "fl1", email: "james@apex.co.uk", ip: "82.34.12.55", ts: "10 Jun 2026, 08:50", attempts: 3, status: "locked" },
  { id: "fl2", email: "unknown@attacker.net", ip: "94.102.34.1", ts: "09 Jun 2026, 23:12", attempts: 12, status: "blocked" },
  { id: "fl3", email: "info@meridian.co.uk", ip: "10.0.0.4", ts: "08 Jun 2026, 09:00", attempts: 2, status: "warning" },
];

const MFA_EVENTS = [
  { id: "me1", email: "james@apex.co.uk", event: "MFA Enabled", ts: "15 Jan 2026, 09:00" },
  { id: "me2", email: "sarah@apex.co.uk", event: "MFA Challenge", ts: "10 Jun 2026, 08:55" },
  { id: "me3", email: "ops@oldham.biz", event: "MFA Reset by Admin", ts: "20 May 2026, 14:00" },
  { id: "me4", email: "contact@buildright.com", event: "MFA Disabled", ts: "01 Jun 2026, 10:00" },
];

const API_KEYS = [
  { id: "ak1", workspace: "Meridian Contractors", key_prefix: "mk_live_***", last_used: "10 Jun 2026", calls_today: 145 },
  { id: "ak2", workspace: "Demo Workspace", key_prefix: "mk_test_***", last_used: "05 Jun 2026", calls_today: 0 },
];

const ALERTS = [
  { id: "a1", level: "high", message: "12 consecutive failed login attempts from 94.102.34.1", ts: "09 Jun 2026, 23:12" },
  { id: "a2", level: "medium", message: "Account locked after 3 failed attempts: james@apex.co.uk", ts: "10 Jun 2026, 08:50" },
  { id: "a3", level: "low", message: "MFA disabled for contact@buildright.com", ts: "01 Jun 2026, 10:00" },
];

const LEVEL_CHIP: Record<string, string> = { high: "chip-danger", medium: "chip-warning", low: "chip-info" };
const LOGIN_CHIP: Record<string, string> = { locked: "chip-warning", blocked: "chip-danger", warning: "chip-info" };

export default function AdminSecurityPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Security</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>Platform security monitoring and controls</p>
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
        {/* OVERVIEW */}
        {activeTab === "Overview" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Failed Logins (24h)", value: FAILED_LOGINS.reduce((s, f) => s + f.attempts, 0), color: "#EF4444" },
                { label: "MFA Coverage", value: "75%", color: "#10B981" },
                { label: "Active API Keys", value: API_KEYS.length, color: "#3B5EE8" },
                { label: "Open Alerts", value: ALERTS.length, color: "#F59E0B" },
              ].map((kpi) => (
                <div className="kpi-card" key={kpi.label}>
                  <div className="kpi-label">{kpi.label}</div>
                  <div className="kpi-value" style={{ color: kpi.color }}>{kpi.value}</div>
                </div>
              ))}
            </div>

            {/* Threat Indicators */}
            <div className="card" style={{ padding: 20, marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Threat Indicators</h3>
              {ALERTS.map((a) => (
                <div key={a.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
                  <AlertTriangle size={16} style={{ color: a.level === "high" ? "#EF4444" : a.level === "medium" ? "#F59E0B" : "#3B5EE8", flexShrink: 0, marginTop: 1 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13 }}>{a.message}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{a.ts}</div>
                  </div>
                  <span className={cn("badge", LEVEL_CHIP[a.level])}>{a.level}</span>
                </div>
              ))}
            </div>

            {/* Security Event Timeline */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Recent Security Events</h3>
              {[...FAILED_LOGINS.map((f) => ({ ts: f.ts, event: `Failed login: ${f.email}`, type: "login" })),
                ...MFA_EVENTS.map((m) => ({ ts: m.ts, event: `${m.event}: ${m.email}`, type: "mfa" }))
              ].sort((a, b) => b.ts.localeCompare(a.ts)).slice(0, 6).map((e, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ width: 8, height: 8, borderRadius: 9999, background: e.type === "login" ? "#EF4444" : "#3B5EE8", marginTop: 4, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13 }}>{e.event}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{e.ts}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAILED LOGINS */}
        {activeTab === "Failed Logins" && (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr><th>Email</th><th>IP Address</th><th>Attempts</th><th>Status</th><th>Timestamp</th></tr>
              </thead>
              <tbody>
                {FAILED_LOGINS.map((f) => (
                  <tr key={f.id}>
                    <td style={{ fontSize: 13, fontWeight: 500 }}>{f.email}</td>
                    <td style={{ fontSize: 12, fontFamily: "monospace" }}>{f.ip}</td>
                    <td style={{ fontSize: 13, color: f.attempts > 5 ? "var(--danger)" : undefined, fontWeight: f.attempts > 5 ? 700 : undefined }}>{f.attempts}</td>
                    <td><span className={cn("badge", LOGIN_CHIP[f.status] ?? "chip-muted")}>{f.status}</span></td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{f.ts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MFA EVENTS */}
        {activeTab === "MFA Events" && (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr><th>Email</th><th>Event</th><th>Timestamp</th></tr>
              </thead>
              <tbody>
                {MFA_EVENTS.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontSize: 13 }}>{m.email}</td>
                    <td style={{ fontSize: 13 }}>{m.event}</td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{m.ts}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* API KEY USAGE */}
        {activeTab === "API Key Usage" && (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr><th>Workspace</th><th>Key</th><th>Calls Today</th><th>Last Used</th></tr>
              </thead>
              <tbody>
                {API_KEYS.map((k) => (
                  <tr key={k.id}>
                    <td style={{ fontSize: 13, fontWeight: 500 }}>{k.workspace}</td>
                    <td style={{ fontSize: 12, fontFamily: "monospace" }}>{k.key_prefix}</td>
                    <td style={{ fontSize: 13 }}>{k.calls_today}</td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{k.last_used}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* IP RESTRICTIONS */}
        {activeTab === "IP Restrictions" && (
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>IP Allow / Block List</h3>
            <div style={{ marginBottom: 16 }}>
              <label className="form-label">Blocked IPs (one per line)</label>
              <textarea
                className="form-input"
                style={{ minHeight: 120, resize: "vertical", fontFamily: "monospace", fontSize: 13 }}
                defaultValue={"94.102.34.1\n"}
                placeholder="Enter IP addresses to block…"
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="form-label">Allowed IPs (admin access)</label>
              <textarea
                className="form-input"
                style={{ minHeight: 80, resize: "vertical", fontFamily: "monospace", fontSize: 13 }}
                defaultValue={"127.0.0.1\n"}
                placeholder="Enter trusted IP addresses…"
              />
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => alert("IP restrictions saved")}>Save Restrictions</button>
          </div>
        )}

        {/* ALERTS */}
        {activeTab === "Alerts" && (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr><th>Level</th><th>Message</th><th>Timestamp</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {ALERTS.map((a) => (
                  <tr key={a.id}>
                    <td><span className={cn("badge", LEVEL_CHIP[a.level])}>{a.level}</span></td>
                    <td style={{ fontSize: 13 }}>{a.message}</td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{a.ts}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => alert("Alert dismissed")}>Dismiss</button>
                    </td>
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

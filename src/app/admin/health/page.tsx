"use client";

import { useState } from "react";
import { RefreshCw, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

const SERVICES = [
  { id: "api", name: "API", status: "healthy", uptime: 99.97, avg_ms: 142 },
  { id: "db", name: "Database", status: "healthy", uptime: 99.99, avg_ms: 8 },
  { id: "storage", name: "Storage", status: "healthy", uptime: 99.95, avg_ms: 230 },
  { id: "ai", name: "AI Service", status: "degraded", uptime: 97.2, avg_ms: 1840 },
  { id: "email", name: "Email", status: "healthy", uptime: 99.8, avg_ms: 340 },
  { id: "auth", name: "Auth", status: "healthy", uptime: 99.99, avg_ms: 55 },
];

const INCIDENTS = [
  { id: "inc1", service: "AI Service", description: "Elevated latency on claude-sonnet-4-6 endpoint", started: "10 Jun 2026, 08:00", resolved: null, status: "ongoing" },
  { id: "inc2", service: "Storage", description: "Temporary spike in upload failure rate (0.2%)", started: "07 Jun 2026, 14:30", resolved: "07 Jun 2026, 15:10", status: "resolved" },
  { id: "inc3", service: "API", description: "Increased 503 errors on /api/projects endpoint", started: "01 Jun 2026, 09:15", resolved: "01 Jun 2026, 09:45", status: "resolved" },
];

// Response time data per service
const CHART_DATA = Array.from({ length: 24 }, (_, i) => ({
  hour: `${String(i).padStart(2, "0")}:00`,
  api: 120 + Math.floor(Math.random() * 80),
  db: 5 + Math.floor(Math.random() * 10),
  storage: 200 + Math.floor(Math.random() * 120),
}));

const STATUS_ICON = {
  healthy: <CheckCircle size={16} style={{ color: "#10B981" }} />,
  degraded: <AlertTriangle size={16} style={{ color: "#F59E0B" }} />,
  down: <XCircle size={16} style={{ color: "#EF4444" }} />,
};

const STATUS_CHIP: Record<string, string> = { healthy: "chip-success", degraded: "chip-warning", down: "chip-danger" };
const INC_CHIP: Record<string, string> = { ongoing: "chip-danger", resolved: "chip-success" };

export default function AdminHealthPage() {
  const [lastChecked, setLastChecked] = useState("10 Jun 2026, 09:30");

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>System Health</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            Last checked: {lastChecked}
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setLastChecked(new Date().toLocaleString("en-GB"))}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="page-content">
        {/* Service Status Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12, marginBottom: 24 }}>
          {SERVICES.map((svc) => (
            <div className="card" key={svc.id} style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: 14 }}>{svc.name}</span>
                {STATUS_ICON[svc.status as keyof typeof STATUS_ICON]}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                <span className={cn("badge", STATUS_CHIP[svc.status] ?? "chip-muted")}>{svc.status}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 2 }}>
                Uptime: <strong>{svc.uptime}%</strong>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                Avg response: <strong>{svc.avg_ms} ms</strong>
              </div>
              {/* Uptime bar */}
              <div style={{ height: 4, background: "var(--border)", borderRadius: 999, marginTop: 10 }}>
                <div style={{
                  height: "100%",
                  width: `${svc.uptime}%`,
                  background: svc.uptime > 99 ? "#10B981" : svc.uptime > 97 ? "#F59E0B" : "#EF4444",
                  borderRadius: 999,
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Response Time Chart */}
        <div className="card" style={{ padding: 20, marginBottom: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Response Time — Last 24h (ms)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={CHART_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={3} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="api" stroke="#3B5EE8" strokeWidth={2} dot={false} name="API" />
              <Line type="monotone" dataKey="db" stroke="#10B981" strokeWidth={2} dot={false} name="DB" />
              <Line type="monotone" dataKey="storage" stroke="#F59E0B" strokeWidth={2} dot={false} name="Storage" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Incidents */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Incidents</h2>
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr><th>Service</th><th>Description</th><th>Started</th><th>Resolved</th><th>Status</th></tr>
              </thead>
              <tbody>
                {INCIDENTS.map((inc) => (
                  <tr key={inc.id}>
                    <td style={{ fontSize: 13, fontWeight: 500 }}>{inc.service}</td>
                    <td style={{ fontSize: 13 }}>{inc.description}</td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{inc.started}</td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{inc.resolved ?? "—"}</td>
                    <td><span className={cn("badge", INC_CHIP[inc.status] ?? "chip-muted")}>{inc.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

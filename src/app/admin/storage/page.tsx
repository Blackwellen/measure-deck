"use client";

import { useState } from "react";
import { HardDrive, RefreshCw, Download, ShieldOff, Search } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

const BUCKET_DATA = [
  { name: "evidence-files", value: 8400, color: "#3B5EE8" },
  { name: "drawings", value: 5200, color: "#10B981" },
  { name: "exports", value: 1100, color: "#F59E0B" },
  { name: "avatars", value: 80, color: "#6B7280" },
];

const TOTAL_MB = BUCKET_DATA.reduce((s, b) => s + b.value, 0);
const TOTAL_LIMIT_MB = 50000;

const FILES = [
  { id: "f1", name: "site-photo-001.jpg", workspace: "Apex Construction Ltd", type: "image/jpeg", size_mb: 2.4, created: "10 Jun 2026", scan: "clean" },
  { id: "f2", name: "foundation-drawing.pdf", workspace: "Apex Construction Ltd", type: "application/pdf", size_mb: 8.1, created: "09 Jun 2026", scan: "clean" },
  { id: "f3", name: "bim-model-phase1.ifc", workspace: "Meridian Contractors", type: "application/octet-stream", size_mb: 42.0, created: "07 Jun 2026", scan: "pending" },
  { id: "f4", name: "contract-scan.pdf", workspace: "Oldham & Partners", type: "application/pdf", size_mb: 3.8, created: "05 Jun 2026", scan: "clean" },
  { id: "f5", name: "elevation.dwg", workspace: "Meridian Contractors", type: "application/acad", size_mb: 18.2, created: "04 Jun 2026", scan: "clean" },
  { id: "f6", name: "suspicious-file.exe", workspace: "Demo Workspace", type: "application/octet-stream", size_mb: 0.5, created: "01 Jun 2026", scan: "flagged" },
];

const SCAN_CHIP: Record<string, string> = { clean: "chip-success", pending: "chip-warning", flagged: "chip-danger" };

export default function AdminStoragePage() {
  const [search, setSearch] = useState("");

  const filtered = FILES.filter((f) => {
    const q = search.toLowerCase();
    return !q || f.name.toLowerCase().includes(q) || f.workspace.toLowerCase().includes(q);
  });

  const usedPct = Math.round((TOTAL_MB / TOTAL_LIMIT_MB) * 100);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Storage Overview</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            {(TOTAL_MB / 1000).toFixed(1)} GB of {(TOTAL_LIMIT_MB / 1000).toFixed(0)} GB used ({usedPct}%)
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => alert("Reprocessing files…")}>
            <RefreshCw size={14} /> Reprocess
          </button>
          <button className="btn btn-danger btn-sm" onClick={() => confirm("Revoke access?")}>
            <ShieldOff size={14} /> Revoke Access
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => alert("Exporting…")}>
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Overview */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Total Storage Used</h3>
            <div style={{ fontSize: 28, fontWeight: 700, color: "var(--primary)", marginBottom: 8 }}>
              {(TOTAL_MB / 1000).toFixed(1)} GB
            </div>
            <div style={{ height: 8, background: "var(--border)", borderRadius: 999, marginBottom: 8 }}>
              <div style={{ height: "100%", width: `${usedPct}%`, background: usedPct > 85 ? "#EF4444" : "#3B5EE8", borderRadius: 999 }} />
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
              of {(TOTAL_LIMIT_MB / 1000).toFixed(0)} GB total capacity
            </div>
            <div style={{ marginTop: 16 }}>
              {BUCKET_DATA.map((b) => (
                <div key={b.name} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: b.color, display: "inline-block" }} />
                    <span style={{ fontFamily: "monospace", fontSize: 12 }}>{b.name}</span>
                  </span>
                  <span style={{ color: "var(--text-muted)" }}>{(b.value / 1000).toFixed(1)} GB</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>By Bucket</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={BUCKET_DATA} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={false}>
                  {BUCKET_DATA.map((b) => (
                    <Cell key={b.name} fill={b.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${(v / 1000).toFixed(1)} GB`, ""]} />
                <Legend formatter={(v) => <span style={{ fontSize: 11 }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Files Table */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              className="form-input"
              style={{ paddingLeft: 32 }}
              placeholder="Search files…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th><th>Workspace</th><th>Type</th><th>Size (MB)</th><th>Created</th><th>Scan Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((f) => (
                <tr key={f.id}>
                  <td style={{ fontSize: 13, fontWeight: 500 }}>{f.name}</td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{f.workspace}</td>
                  <td style={{ fontSize: 11, fontFamily: "monospace" }}>{f.type}</td>
                  <td style={{ fontSize: 13 }}>{f.size_mb.toFixed(1)}</td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{f.created}</td>
                  <td><span className={cn("badge", SCAN_CHIP[f.scan] ?? "chip-muted")}>{f.scan}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => alert(`Reprocessing ${f.name}`)}>
                        <RefreshCw size={12} />
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => confirm(`Revoke access to ${f.name}?`)}>
                        <ShieldOff size={12} style={{ color: "var(--danger)" }} />
                      </button>
                    </div>
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

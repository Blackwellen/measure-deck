"use client";

import { useState } from "react";
import { Search, Download, TrendingUp } from "lucide-react";
import { formatCurrency, formatDate, cn } from "@/lib/utils";

const RECORDS = [
  { id: "cr1", ref: "CVR-001", type: "CVR", project: "Phase 1 - Foundation Works", workspace: "Apex Construction Ltd", value: 245000, status: "approved", date: "2026-05-31" },
  { id: "cr2", ref: "CHG-007", type: "Change", project: "Office Block Refurbishment", workspace: "Meridian Contractors", value: 18500, status: "pending", date: "2026-06-05" },
  { id: "cr3", ref: "CVR-002", type: "CVR", project: "Phase 1 - Foundation Works", workspace: "Apex Construction Ltd", value: 312000, status: "draft", date: "2026-06-10" },
  { id: "cr4", ref: "CHG-003", type: "Change", project: "Drainage Upgrade - Site B", workspace: "BuildRight Group", value: 5200, status: "approved", date: "2024-11-20" },
  { id: "cr5", ref: "CVR-003", type: "CVR", project: "Office Block Refurbishment", workspace: "Meridian Contractors", value: 780000, status: "approved", date: "2026-04-30" },
];

const STATUS_CHIP: Record<string, string> = { approved: "chip-success", pending: "chip-warning", draft: "chip-muted" };

export default function AdminCommercialPage() {
  const [search, setSearch] = useState("");

  const filtered = RECORDS.filter((r) => {
    const q = search.toLowerCase();
    return !q || r.ref.toLowerCase().includes(q) || r.project.toLowerCase().includes(q) || r.workspace.toLowerCase().includes(q);
  });

  const totalValue = RECORDS.reduce((s, r) => s + r.value, 0);
  const approvedValue = RECORDS.filter((r) => r.status === "approved").reduce((s, r) => s + r.value, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Commercial Records</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>CVRs and change orders across all workspaces</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => alert("Exporting…")}><Download size={14} /> Export</button>
      </div>

      <div className="page-content">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16, marginBottom: 24 }}>
          {[
            { label: "Total Value", value: formatCurrency(totalValue) },
            { label: "Approved Value", value: formatCurrency(approvedValue) },
            { label: "Pending Records", value: RECORDS.filter((r) => r.status === "pending").length },
            { label: "Total Records", value: RECORDS.length },
          ].map((kpi) => (
            <div className="kpi-card" key={kpi.label}>
              <div className="kpi-label">{kpi.label}</div>
              <div className="kpi-value">{kpi.value}</div>
            </div>
          ))}
        </div>

        <div style={{ position: "relative", maxWidth: 360, marginBottom: 16 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input className="form-input" style={{ paddingLeft: 32 }} placeholder="Search records…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr><th>Ref</th><th>Type</th><th>Project</th><th>Workspace</th><th>Value</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontFamily: "monospace", fontSize: 12 }}>{r.ref}</td>
                  <td><span className="badge chip-info">{r.type}</span></td>
                  <td style={{ fontSize: 13 }}>{r.project}</td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{r.workspace}</td>
                  <td style={{ fontSize: 13, fontWeight: 600 }}>{formatCurrency(r.value)}</td>
                  <td><span className={cn("badge", STATUS_CHIP[r.status] ?? "chip-muted")}>{r.status}</span></td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{formatDate(r.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

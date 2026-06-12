"use client";

import { useState } from "react";
import { Search, Download } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

const SUPPLIERS = [
  { id: "s1", name: "BuildCore Materials Ltd", workspace: "Apex Construction Ltd", contact: "james@buildcore.co.uk", type: "Materials", status: "active", created_at: "2025-01-20" },
  { id: "s2", name: "SteelFab UK", workspace: "Meridian Contractors", contact: "info@steelfab.co.uk", type: "Structural", status: "active", created_at: "2024-11-05" },
  { id: "s3", name: "Precision Groundwork Co", workspace: "BuildRight Group", contact: "ops@precisionground.com", type: "Groundworks", status: "active", created_at: "2025-06-01" },
  { id: "s4", name: "Omega Electrical", workspace: "Apex Construction Ltd", contact: "omega@elec.co.uk", type: "M&E", status: "inactive", created_at: "2024-08-15" },
  { id: "s5", name: "Nordic Timber Supplies", workspace: "Meridian Contractors", contact: "orders@nordic-timber.com", type: "Materials", status: "active", created_at: "2025-03-22" },
];

export default function AdminSuppliersPage() {
  const [search, setSearch] = useState("");

  const filtered = SUPPLIERS.filter((s) => {
    const q = search.toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || s.workspace.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Suppliers</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{SUPPLIERS.length} suppliers across all workspaces</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => alert("Exporting…")}><Download size={14} /> Export</button>
      </div>

      <div className="page-content">
        <div style={{ position: "relative", maxWidth: 360, marginBottom: 16 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input className="form-input" style={{ paddingLeft: 32 }} placeholder="Search suppliers…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Workspace</th><th>Contact</th><th>Type</th><th>Status</th><th>Created</th></tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 500, fontSize: 13 }}>{s.name}</td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.workspace}</td>
                  <td style={{ fontSize: 12 }}>{s.contact}</td>
                  <td><span className="badge chip-info">{s.type}</span></td>
                  <td><span className={cn("badge", s.status === "active" ? "chip-success" : "chip-muted")}>{s.status}</span></td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{formatDate(s.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Search, Download } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

const PROJECTS = [
  { id: "p1", name: "Phase 1 - Foundation Works", workspace: "Apex Construction Ltd", status: "active", created_at: "2025-02-01", manager: "James Thornton", evidence_count: 24, changes_count: 3 },
  { id: "p2", name: "Office Block Refurbishment", workspace: "Meridian Contractors", status: "active", created_at: "2024-10-15", manager: "Priya Nair", evidence_count: 87, changes_count: 12 },
  { id: "p3", name: "Drainage Upgrade - Site B", workspace: "BuildRight Group", status: "complete", created_at: "2024-07-01", manager: "Oliver Reed", evidence_count: 42, changes_count: 5 },
  { id: "p4", name: "Temporary Access Road", workspace: "Oldham & Partners", status: "on-hold", created_at: "2025-04-20", manager: "Sarah Malik", evidence_count: 8, changes_count: 1 },
  { id: "p5", name: "Demo Site Project", workspace: "Demo Workspace", status: "active", created_at: "2025-12-01", manager: "Demo User", evidence_count: 15, changes_count: 2 },
];

const STATUS_CHIP: Record<string, string> = { active: "chip-success", complete: "chip-info", "on-hold": "chip-warning" };

export default function AdminProjectsPage() {
  const [search, setSearch] = useState("");

  const filtered = PROJECTS.filter((p) => {
    const q = search.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.workspace.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Projects</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{PROJECTS.length} projects across all workspaces</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => alert("Exporting…")}><Download size={14} /> Export</button>
      </div>

      <div className="page-content">
        <div style={{ position: "relative", maxWidth: 360, marginBottom: 16 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input className="form-input" style={{ paddingLeft: 32 }} placeholder="Search projects…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Workspace</th><th>Manager</th><th>Evidence</th><th>Changes</th><th>Status</th><th>Created</th></tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500, fontSize: 13 }}>{p.name}</td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{p.workspace}</td>
                  <td style={{ fontSize: 13 }}>{p.manager}</td>
                  <td style={{ fontSize: 13 }}>{p.evidence_count}</td>
                  <td style={{ fontSize: 13 }}>{p.changes_count}</td>
                  <td><span className={cn("badge", STATUS_CHIP[p.status] ?? "chip-muted")}>{p.status}</span></td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{formatDate(p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

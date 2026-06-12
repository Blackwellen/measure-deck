"use client";

import { useState } from "react";
import { Search, Download } from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

const TASKS = [
  { id: "t1", title: "Review phase 1 progress photos", project: "Phase 1 - Foundation Works", workspace: "Apex Construction Ltd", assignee: "James Thornton", priority: "high", status: "in-progress", due: "2026-06-15" },
  { id: "t2", title: "Submit CVR for April", project: "Office Block Refurbishment", workspace: "Meridian Contractors", assignee: "Priya Nair", priority: "high", status: "open", due: "2026-06-10" },
  { id: "t3", title: "Check drainage inspection report", project: "Drainage Upgrade - Site B", workspace: "BuildRight Group", assignee: "Oliver Reed", priority: "medium", status: "complete", due: "2024-12-01" },
  { id: "t4", title: "Upload supplier invoices", project: "Phase 1 - Foundation Works", workspace: "Apex Construction Ltd", assignee: "Sarah Malik", priority: "low", status: "open", due: "2026-06-20" },
  { id: "t5", title: "Complete demo walkthrough", project: "Demo Site Project", workspace: "Demo Workspace", assignee: "Demo User", priority: "medium", status: "open", due: "2026-06-30" },
];

const STATUS_CHIP: Record<string, string> = { open: "chip-info", "in-progress": "chip-warning", complete: "chip-success" };
const PRIORITY_CHIP: Record<string, string> = { high: "chip-danger", medium: "chip-warning", low: "chip-muted" };

export default function AdminTasksPage() {
  const [search, setSearch] = useState("");

  const filtered = TASKS.filter((t) => {
    const q = search.toLowerCase();
    return !q || t.title.toLowerCase().includes(q) || t.workspace.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Tasks</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{TASKS.length} tasks across all workspaces</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => alert("Exporting…")}><Download size={14} /> Export</button>
      </div>

      <div className="page-content">
        <div style={{ position: "relative", maxWidth: 360, marginBottom: 16 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input className="form-input" style={{ paddingLeft: 32 }} placeholder="Search tasks…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          <table className="data-table">
            <thead>
              <tr><th>Title</th><th>Project</th><th>Workspace</th><th>Assignee</th><th>Priority</th><th>Status</th><th>Due</th></tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id}>
                  <td style={{ fontWeight: 500, fontSize: 13 }}>{t.title}</td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.project}</td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{t.workspace}</td>
                  <td style={{ fontSize: 13 }}>{t.assignee}</td>
                  <td><span className={cn("badge", PRIORITY_CHIP[t.priority] ?? "chip-muted")}>{t.priority}</span></td>
                  <td><span className={cn("badge", STATUS_CHIP[t.status] ?? "chip-muted")}>{t.status}</span></td>
                  <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{formatDate(t.due)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

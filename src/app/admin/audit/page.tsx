"use client";

import { useState } from "react";
import { Download, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const AUDIT_LOGS = [
  { id: "al1", ts: "10 Jun 2026, 09:14", user: "james@apex.co.uk", workspace: "Apex Construction Ltd", action: "evidence.upload", resource_type: "evidence_file", resource_id: "ef-001", ip: "82.34.12.55" },
  { id: "al2", ts: "10 Jun 2026, 09:00", user: "james@apex.co.uk", workspace: "Apex Construction Ltd", action: "project.create", resource_type: "project", resource_id: "prj-012", ip: "82.34.12.55" },
  { id: "al3", ts: "09 Jun 2026, 17:33", user: "contact@buildright.com", workspace: "BuildRight Group", action: "report.generate", resource_type: "report", resource_id: "rpt-007", ip: "195.22.88.1" },
  { id: "al4", ts: "09 Jun 2026, 15:10", user: "sarah@apex.co.uk", workspace: "Apex Construction Ltd", action: "member.invite", resource_type: "workspace_member", resource_id: "wm-050", ip: "82.34.12.55" },
  { id: "al5", ts: "08 Jun 2026, 14:20", user: "info@meridian.co.uk", workspace: "Meridian Contractors", action: "drawing.upload", resource_type: "drawing_file", resource_id: "df-088", ip: "10.0.0.4" },
  { id: "al6", ts: "07 Jun 2026, 10:00", user: "admin@measuredeck.app", workspace: "—", action: "workspace.suspend", resource_type: "workspace", resource_id: "ws-004", ip: "127.0.0.1" },
  { id: "al7", ts: "05 Jun 2026, 09:00", user: "priya@meridian.co.uk", workspace: "Meridian Contractors", action: "change.approve", resource_type: "change", resource_id: "ch-033", ip: "10.0.0.7" },
  { id: "al8", ts: "04 Jun 2026, 16:00", user: "ops@oldham.biz", workspace: "Oldham & Partners", action: "plan.downgrade", resource_type: "subscription", resource_id: "sub-004", ip: "77.99.44.11" },
];

const ACTION_TYPES = [...new Set(AUDIT_LOGS.map((l) => l.action))];
const USERS = [...new Set(AUDIT_LOGS.map((l) => l.user))];

export default function AdminAuditPage() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [userFilter, setUserFilter] = useState("All");
  const [actionFilter, setActionFilter] = useState("All");

  const filtered = AUDIT_LOGS.filter((l) => {
    const matchUser = userFilter === "All" || l.user === userFilter;
    const matchAction = actionFilter === "All" || l.action === actionFilter;
    return matchUser && matchAction;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Audit Log</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            Full platform event history
          </p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => alert("Exporting audit log…")}>
          <Download size={14} /> Export
        </button>
      </div>

      <div className="page-content">
        {/* Filters */}
        <div className="card" style={{ padding: 16, marginBottom: 16, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div>
            <label className="form-label" style={{ fontSize: 11 }}>From Date</label>
            <input className="form-input" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={{ width: 160 }} />
          </div>
          <div>
            <label className="form-label" style={{ fontSize: 11 }}>To Date</label>
            <input className="form-input" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={{ width: 160 }} />
          </div>
          <div>
            <label className="form-label" style={{ fontSize: 11 }}>User</label>
            <select className="form-input" value={userFilter} onChange={(e) => setUserFilter(e.target.value)} style={{ width: 200 }}>
              <option value="All">All Users</option>
              {USERS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="form-label" style={{ fontSize: 11 }}>Action Type</label>
            <select className="form-input" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)} style={{ width: 200 }}>
              <option value="All">All Actions</option>
              {ACTION_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <button className="btn btn-secondary btn-sm"><Filter size={14} /> Apply</button>
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th><th>User</th><th>Workspace</th><th>Action</th><th>Resource Type</th><th>Resource ID</th><th>IP</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: 12, color: "var(--text-muted)", whiteSpace: "nowrap" }}>{log.ts}</td>
                    <td style={{ fontSize: 12 }}>{log.user}</td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{log.workspace}</td>
                    <td>
                      <span className="badge chip-info" style={{ fontFamily: "monospace", fontSize: 11 }}>{log.action}</span>
                    </td>
                    <td style={{ fontSize: 12, fontFamily: "monospace" }}>{log.resource_type}</td>
                    <td style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-muted)" }}>{log.resource_id}</td>
                    <td style={{ fontSize: 12, fontFamily: "monospace", color: "var(--text-muted)" }}>{log.ip}</td>
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

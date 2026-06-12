"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2, Plus, Download, Search, Filter,
  Eye, ShieldOff, Shield, CreditCard, Trash2,
  MoreHorizontal, ChevronDown,
} from "lucide-react";
import { formatDate, cn } from "@/lib/utils";

const TABS = ["All", "Active", "Trial", "Suspended", "Demo", "By Usage"] as const;
type Tab = typeof TABS[number];

const SEED_WORKSPACES = [
  { id: "ws-001", name: "Apex Construction Ltd", owner_email: "admin@apex.co.uk", plan: "Professional", users_count: 12, projects_count: 8, storage_mb: 2340, status: "active", created_at: "2025-01-15" },
  { id: "ws-002", name: "BuildRight Group", owner_email: "contact@buildright.com", plan: "Starter", users_count: 3, projects_count: 2, storage_mb: 340, status: "trial", created_at: "2026-03-10" },
  { id: "ws-003", name: "Meridian Contractors", owner_email: "info@meridian.co.uk", plan: "Enterprise", users_count: 45, projects_count: 32, storage_mb: 18400, status: "active", created_at: "2024-09-01" },
  { id: "ws-004", name: "Oldham & Partners", owner_email: "ops@oldham.biz", plan: "Starter", users_count: 2, projects_count: 1, storage_mb: 120, status: "suspended", created_at: "2025-06-20" },
  { id: "ws-005", name: "Demo Workspace", owner_email: "demo@measuredeck.app", plan: "Professional", users_count: 1, projects_count: 5, storage_mb: 890, status: "demo", created_at: "2025-12-01" },
];

const STATUS_CHIP: Record<string, string> = {
  active: "chip-success",
  trial: "chip-info",
  suspended: "chip-danger",
  demo: "chip-warning",
};

export default function AdminWorkspacesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const [search, setSearch] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const filtered = SEED_WORKSPACES.filter((w) => {
    const q = search.toLowerCase();
    const matchSearch = !q || w.name.toLowerCase().includes(q) || w.owner_email.toLowerCase().includes(q);
    if (!matchSearch) return false;
    if (activeTab === "Active") return w.status === "active";
    if (activeTab === "Trial") return w.status === "trial";
    if (activeTab === "Suspended") return w.status === "suspended";
    if (activeTab === "Demo") return w.status === "demo";
    return true;
  });

  const sortedByUsage = activeTab === "By Usage"
    ? [...filtered].sort((a, b) => b.storage_mb - a.storage_mb)
    : filtered;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Workspaces</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            {SEED_WORKSPACES.length} total workspaces
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn btn-secondary btn-sm" onClick={() => alert("Suspend selected")}>
            <ShieldOff size={14} /> Suspend
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => alert("Change plan modal")}>
            <CreditCard size={14} /> Change Plan
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => alert("Exporting CSV…")}>
            <Download size={14} /> Export CSV
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => alert("Create workspace modal")}>
            <Plus size={14} /> Create Workspace
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
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              className="form-input"
              style={{ paddingLeft: 32 }}
              placeholder="Search workspaces…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-secondary btn-sm"><Filter size={14} /> Filter</button>
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          {sortedByUsage.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><Building2 size={20} /></div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>No workspaces found</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Owner Email</th>
                    <th>Plan</th>
                    <th>Users</th>
                    <th>Projects</th>
                    <th>Storage (MB)</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedByUsage.map((ws) => (
                    <tr key={ws.id}>
                      <td style={{ fontWeight: 500, fontSize: 13 }}>{ws.name}</td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{ws.owner_email}</td>
                      <td><span className="badge chip-info">{ws.plan}</span></td>
                      <td style={{ fontSize: 13 }}>{ws.users_count}</td>
                      <td style={{ fontSize: 13 }}>{ws.projects_count}</td>
                      <td style={{ fontSize: 13 }}>{ws.storage_mb.toLocaleString()}</td>
                      <td><span className={cn("badge", STATUS_CHIP[ws.status])}>{ws.status}</span></td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{formatDate(ws.created_at)}</td>
                      <td>
                        <div style={{ position: "relative", display: "inline-block" }}>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => setOpenMenu(openMenu === ws.id ? null : ws.id)}
                          >
                            <MoreHorizontal size={14} />
                          </button>
                          {openMenu === ws.id && (
                            <div style={{
                              position: "absolute", right: 0, top: "100%", zIndex: 50,
                              background: "var(--surface)", border: "1px solid var(--border)",
                              borderRadius: "var(--radius)", boxShadow: "var(--shadow-md)",
                              minWidth: 160, padding: 4,
                            }}>
                              {[
                                { label: "View", icon: <Eye size={13} />, action: () => router.push(`/admin/workspaces/${ws.id}`) },
                                { label: ws.status === "suspended" ? "Reactivate" : "Suspend", icon: <ShieldOff size={13} />, action: () => alert(`${ws.status === "suspended" ? "Reactivating" : "Suspending"} ${ws.name}`) },
                                { label: "Change Plan", icon: <CreditCard size={13} />, action: () => alert(`Change plan for ${ws.name}`) },
                                { label: "Delete", icon: <Trash2 size={13} />, action: () => confirm(`Delete ${ws.name}?`) && alert("Deleted") },
                              ].map((item) => (
                                <button
                                  key={item.label}
                                  style={{
                                    display: "flex", alignItems: "center", gap: 8, width: "100%",
                                    padding: "7px 12px", fontSize: 13, background: "none", border: "none",
                                    cursor: "pointer", color: item.label === "Delete" ? "var(--danger)" : "inherit",
                                    borderRadius: "var(--radius-sm)",
                                  }}
                                  onClick={() => { item.action(); setOpenMenu(null); }}
                                >
                                  {item.icon} {item.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

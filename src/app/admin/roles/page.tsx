"use client";

import { useState } from "react";
import { Plus, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = ["Roles", "Permissions", "Role Matrix", "Route Access", "Feature Access"] as const;
type Tab = typeof TABS[number];

const ROLES = ["Admin", "Manager", "Viewer", "Custom"] as const;
type Role = typeof ROLES[number];

const PERMISSIONS = [
  "projects.create", "projects.read", "projects.update", "projects.delete",
  "evidence.upload", "evidence.read", "evidence.delete",
  "drawings.upload", "drawings.read",
  "changes.create", "changes.read", "changes.approve",
  "reports.generate", "reports.read",
  "members.invite", "members.remove",
  "settings.read", "settings.update",
  "billing.read",
];

const DEFAULT_MATRIX: Record<Role, Record<string, boolean>> = {
  Admin: Object.fromEntries(PERMISSIONS.map((p) => [p, true])),
  Manager: Object.fromEntries(PERMISSIONS.map((p) => [p, !p.includes("delete") && !p.includes("billing") && !p.includes("settings.update")])),
  Viewer: Object.fromEntries(PERMISSIONS.map((p) => [p, p.includes(".read")])),
  Custom: Object.fromEntries(PERMISSIONS.map((p) => [p, false])),
};

const ROUTES = [
  "/dashboard", "/projects", "/evidence", "/drawings", "/changes", "/reports", "/settings",
];

const FEATURES = [
  "AI Copilot", "BIM Viewer", "PDF Export", "Advanced Analytics", "Custom Branding", "API Access",
];

export default function AdminRolesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Roles");
  const [matrix, setMatrix] = useState(DEFAULT_MATRIX);

  const togglePerm = (role: Role, perm: string) => {
    setMatrix((prev) => ({
      ...prev,
      [role]: { ...prev[role], [perm]: !prev[role][perm] },
    }));
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Roles & Permissions</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            Manage platform roles and permission assignments
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => alert("Create role modal")}>
          <Plus size={14} /> Create Role
        </button>
      </div>

      <div className="tab-bar" style={{ marginTop: 16 }}>
        {TABS.map((t) => (
          <button key={t} className={cn("tab-item", activeTab === t && "active")} onClick={() => setActiveTab(t)}>
            {t}
          </button>
        ))}
      </div>

      <div className="page-content">
        {/* ROLES TAB */}
        {activeTab === "Roles" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16 }}>
            {(["Admin", "Manager", "Viewer", "Custom"] as const).map((role) => {
              const colors: Record<string, string> = { Admin: "#EF4444", Manager: "#F59E0B", Viewer: "#6B7280", Custom: "#3B5EE8" };
              const count = Object.values(matrix[role]).filter(Boolean).length;
              return (
                <div className="card" key={role} style={{ padding: 20 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                    <Shield size={20} style={{ color: colors[role] }} />
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{role}</span>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 12 }}>
                    {count} / {PERMISSIONS.length} permissions enabled
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => alert(`Edit ${role} role`)}>Edit Role</button>
                </div>
              );
            })}
          </div>
        )}

        {/* PERMISSIONS TAB */}
        {activeTab === "Permissions" && (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr><th>Permission Key</th><th>Category</th><th>Description</th></tr>
              </thead>
              <tbody>
                {PERMISSIONS.map((p) => {
                  const [cat, action] = p.split(".");
                  return (
                    <tr key={p}>
                      <td style={{ fontFamily: "monospace", fontSize: 12 }}>{p}</td>
                      <td><span className="badge chip-info">{cat}</span></td>
                      <td style={{ fontSize: 13, color: "var(--text-muted)", textTransform: "capitalize" }}>{action?.replace(/_/g, " ")}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ROLE MATRIX TAB */}
        {activeTab === "Role Matrix" && (
          <div className="card" style={{ overflow: "auto" }}>
            <table className="data-table" style={{ minWidth: 600 }}>
              <thead>
                <tr>
                  <th style={{ minWidth: 200 }}>Permission</th>
                  {ROLES.map((r) => <th key={r} style={{ textAlign: "center" }}>{r}</th>)}
                </tr>
              </thead>
              <tbody>
                {PERMISSIONS.map((perm) => (
                  <tr key={perm}>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{perm}</td>
                    {ROLES.map((role) => (
                      <td key={role} style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          checked={!!matrix[role][perm]}
                          onChange={() => togglePerm(role, perm)}
                          style={{ cursor: "pointer", width: 16, height: 16 }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ROUTE ACCESS TAB */}
        {activeTab === "Route Access" && (
          <div className="card" style={{ overflow: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Route</th>
                  {ROLES.map((r) => <th key={r} style={{ textAlign: "center" }}>{r}</th>)}
                </tr>
              </thead>
              <tbody>
                {ROUTES.map((route) => (
                  <tr key={route}>
                    <td style={{ fontFamily: "monospace", fontSize: 13 }}>{route}</td>
                    {ROLES.map((role) => (
                      <td key={role} style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          defaultChecked={role !== "Custom" && !(route === "/settings" && role === "Viewer")}
                          style={{ cursor: "pointer", width: 16, height: 16 }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* FEATURE ACCESS TAB */}
        {activeTab === "Feature Access" && (
          <div className="card" style={{ overflow: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  {ROLES.map((r) => <th key={r} style={{ textAlign: "center" }}>{r}</th>)}
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((feat) => (
                  <tr key={feat}>
                    <td style={{ fontSize: 13 }}>{feat}</td>
                    {ROLES.map((role) => (
                      <td key={role} style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          defaultChecked={role === "Admin" || (role === "Manager" && !feat.includes("Branding") && !feat.includes("API"))}
                          style={{ cursor: "pointer", width: 16, height: 16 }}
                        />
                      </td>
                    ))}
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

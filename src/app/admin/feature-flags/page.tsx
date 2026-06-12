"use client";

import { useState } from "react";
import { Plus, History, ToggleLeft, ToggleRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = ["All Flags", "V1", "V1.5", "Internal", "Beta", "Workspace Overrides"] as const;
type Tab = typeof TABS[number];

interface Flag {
  key: string;
  label: string;
  description: string;
  default_enabled: boolean;
  enabled: boolean;
  enabled_workspaces: number;
  category: "V1" | "V1.5" | "Internal" | "Beta";
}

const INITIAL_FLAGS: Flag[] = [
  { key: "ai_copilot", label: "AI Copilot", description: "AI-powered copilot panel in app sidebar", default_enabled: false, enabled: true, enabled_workspaces: 3, category: "V1" },
  { key: "bim_viewer", label: "BIM Viewer", description: "IFC/BIM file viewer for drawings section", default_enabled: false, enabled: false, enabled_workspaces: 1, category: "V1.5" },
  { key: "advanced_analytics", label: "Advanced Analytics", description: "Extended analytics dashboard with trend charts", default_enabled: true, enabled: true, enabled_workspaces: 5, category: "V1" },
  { key: "pdf_export", label: "PDF Export", description: "Export reports and evidence as PDF", default_enabled: true, enabled: true, enabled_workspaces: 5, category: "V1" },
  { key: "custom_branding", label: "Custom Branding", description: "White-label branding per workspace", default_enabled: false, enabled: false, enabled_workspaces: 0, category: "V1.5" },
  { key: "api_access", label: "API Access", description: "Public API key generation for external integrations", default_enabled: false, enabled: false, enabled_workspaces: 1, category: "V1.5" },
  { key: "debug_panel", label: "Debug Panel", description: "Internal debug overlay for platform admins", default_enabled: false, enabled: true, enabled_workspaces: 0, category: "Internal" },
  { key: "admin_impersonate", label: "Admin Impersonation", description: "Allow admins to view workspace as user", default_enabled: false, enabled: true, enabled_workspaces: 0, category: "Internal" },
  { key: "new_editor", label: "New Evidence Editor", description: "Redesigned evidence upload experience (beta)", default_enabled: false, enabled: false, enabled_workspaces: 2, category: "Beta" },
  { key: "ai_classification", label: "AI Auto-Classification", description: "Auto-classify evidence files using AI", default_enabled: false, enabled: false, enabled_workspaces: 1, category: "Beta" },
];

const WORKSPACE_OVERRIDES = [
  { workspace: "Apex Construction Ltd", flag: "bim_viewer", enabled: true },
  { workspace: "Meridian Contractors", flag: "api_access", enabled: true },
  { workspace: "BuildRight Group", flag: "new_editor", enabled: true },
  { workspace: "BuildRight Group", flag: "ai_classification", enabled: true },
];

const CAT_CHIP: Record<string, string> = {
  V1: "chip-success", "V1.5": "chip-info", Internal: "chip-warning", Beta: "chip-muted",
};

export default function AdminFeatureFlagsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("All Flags");
  const [flags, setFlags] = useState<Flag[]>(INITIAL_FLAGS);
  const [search, setSearch] = useState("");

  const toggleFlag = (key: string) =>
    setFlags((prev) => prev.map((f) => f.key === key ? { ...f, enabled: !f.enabled } : f));

  const filtered = flags.filter((f) => {
    const q = search.toLowerCase();
    const matchSearch = !q || f.label.toLowerCase().includes(q) || f.key.includes(q);
    if (!matchSearch) return false;
    if (activeTab === "All Flags") return true;
    if (activeTab === "Workspace Overrides") return false;
    return f.category === activeTab;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Feature Flags</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            {flags.filter((f) => f.enabled).length} of {flags.length} flags enabled
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => alert("Audit changes modal")}>
            <History size={14} /> Audit Changes
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => alert("Create flag modal")}>
            <Plus size={14} /> Create Flag
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
        {activeTab !== "Workspace Overrides" && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
                <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  className="form-input"
                  style={{ paddingLeft: 32 }}
                  placeholder="Search flags…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="card" style={{ overflow: "hidden" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Flag Name</th>
                    <th>Key</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Default</th>
                    <th>Enabled Workspaces</th>
                    <th>Toggle</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((f) => (
                    <tr key={f.key}>
                      <td style={{ fontWeight: 500, fontSize: 13 }}>{f.label}</td>
                      <td style={{ fontFamily: "monospace", fontSize: 11, color: "var(--text-muted)" }}>{f.key}</td>
                      <td><span className={cn("badge", CAT_CHIP[f.category] ?? "chip-muted")}>{f.category}</span></td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)", maxWidth: 240 }}>{f.description}</td>
                      <td>
                        {f.default_enabled
                          ? <span className="badge chip-success">On</span>
                          : <span className="badge chip-muted">Off</span>
                        }
                      </td>
                      <td style={{ fontSize: 13 }}>{f.enabled_workspaces}</td>
                      <td>
                        <button
                          onClick={() => toggleFlag(f.key)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: f.enabled ? "var(--success)" : "var(--text-muted)", display: "flex", alignItems: "center" }}
                        >
                          {f.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === "Workspace Overrides" && (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr><th>Workspace</th><th>Flag</th><th>Override</th></tr>
              </thead>
              <tbody>
                {WORKSPACE_OVERRIDES.map((o, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: 13, fontWeight: 500 }}>{o.workspace}</td>
                    <td style={{ fontFamily: "monospace", fontSize: 12 }}>{o.flag}</td>
                    <td>
                      <span className={cn("badge", o.enabled ? "chip-success" : "chip-danger")}>
                        {o.enabled ? "Enabled" : "Disabled"}
                      </span>
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

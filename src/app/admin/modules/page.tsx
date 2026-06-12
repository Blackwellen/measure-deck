"use client";

import { useState } from "react";
import { Layers, ToggleLeft, ToggleRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface WorkspaceModule {
  workspaceId: string;
  workspaceName: string;
  plan: string;
  v1_5_enabled: boolean;
  modules: Record<string, boolean>;
}

const MODULES = [
  { key: "bim_viewer", label: "BIM Viewer", version: "V1.5" },
  { key: "advanced_analytics", label: "Advanced Analytics", version: "V1" },
  { key: "ai_copilot", label: "AI Copilot", version: "V1" },
  { key: "custom_branding", label: "Custom Branding", version: "V1.5" },
  { key: "api_access", label: "API Access", version: "V1.5" },
  { key: "sso", label: "SSO", version: "V1.5" },
];

const INITIAL: WorkspaceModule[] = [
  { workspaceId: "ws-001", workspaceName: "Apex Construction Ltd", plan: "Professional", v1_5_enabled: false, modules: { bim_viewer: false, advanced_analytics: true, ai_copilot: true, custom_branding: false, api_access: false, sso: false } },
  { workspaceId: "ws-002", workspaceName: "BuildRight Group", plan: "Starter", v1_5_enabled: false, modules: { bim_viewer: false, advanced_analytics: false, ai_copilot: false, custom_branding: false, api_access: false, sso: false } },
  { workspaceId: "ws-003", workspaceName: "Meridian Contractors", plan: "Enterprise", v1_5_enabled: true, modules: { bim_viewer: true, advanced_analytics: true, ai_copilot: true, custom_branding: true, api_access: true, sso: false } },
  { workspaceId: "ws-004", workspaceName: "Oldham & Partners", plan: "Starter", v1_5_enabled: false, modules: { bim_viewer: false, advanced_analytics: false, ai_copilot: false, custom_branding: false, api_access: false, sso: false } },
  { workspaceId: "ws-005", workspaceName: "Demo Workspace", plan: "Professional", v1_5_enabled: true, modules: { bim_viewer: true, advanced_analytics: true, ai_copilot: true, custom_branding: false, api_access: false, sso: false } },
];

export default function AdminModulesPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceModule[]>(INITIAL);

  const toggleModule = (wsId: string, modKey: string) => {
    setWorkspaces((prev) =>
      prev.map((ws) =>
        ws.workspaceId === wsId
          ? { ...ws, modules: { ...ws.modules, [modKey]: !ws.modules[modKey] } }
          : ws
      )
    );
  };

  const toggleV15 = (wsId: string) => {
    setWorkspaces((prev) =>
      prev.map((ws) =>
        ws.workspaceId === wsId ? { ...ws, v1_5_enabled: !ws.v1_5_enabled } : ws
      )
    );
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Module Releases</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            Enable or disable V1.5 modules per workspace
          </p>
        </div>
      </div>

      <div className="page-content">
        <div className="card" style={{ overflow: "auto" }}>
          <table className="data-table" style={{ minWidth: 700 }}>
            <thead>
              <tr>
                <th>Workspace</th>
                <th>Plan</th>
                <th style={{ textAlign: "center" }}>V1.5 Enabled</th>
                {MODULES.map((m) => (
                  <th key={m.key} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 11 }}>{m.label}</div>
                    <div style={{ fontSize: 10, color: "var(--text-muted)" }}>{m.version}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workspaces.map((ws) => (
                <tr key={ws.workspaceId}>
                  <td style={{ fontWeight: 500, fontSize: 13 }}>{ws.workspaceName}</td>
                  <td><span className="badge chip-info">{ws.plan}</span></td>
                  <td style={{ textAlign: "center" }}>
                    <button
                      onClick={() => toggleV15(ws.workspaceId)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: ws.v1_5_enabled ? "var(--success)" : "var(--text-muted)", display: "inline-flex" }}
                    >
                      {ws.v1_5_enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                    </button>
                  </td>
                  {MODULES.map((m) => (
                    <td key={m.key} style={{ textAlign: "center" }}>
                      <button
                        onClick={() => toggleModule(ws.workspaceId, m.key)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: ws.modules[m.key] ? "var(--success)" : "var(--text-muted)", display: "inline-flex" }}
                      >
                        {ws.modules[m.key] ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

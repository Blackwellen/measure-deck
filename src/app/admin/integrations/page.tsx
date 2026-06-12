"use client";

import { Settings, CheckCircle, Circle, Database, CreditCard, Bot, Mail, Cloud, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

const INTEGRATIONS = [
  {
    id: "supabase",
    name: "Supabase",
    description: "Database, authentication, and file storage infrastructure",
    status: "connected",
    icon: <Database size={20} />,
    color: "#3ECF8E",
    meta: "Project: measure-deck-prod · Region: eu-west-2",
  },
  {
    id: "stripe",
    name: "Stripe",
    description: "Payment processing and subscription management",
    status: "connected",
    icon: <CreditCard size={20} />,
    color: "#635BFF",
    meta: "Mode: Live · Account: MeasureDeck Ltd",
  },
  {
    id: "openai",
    name: "OpenAI / Anthropic",
    description: "AI model provider for copilot and classification features",
    status: "configure",
    icon: <Bot size={20} />,
    color: "#10A37F",
    meta: "No API key configured",
  },
  {
    id: "resend",
    name: "Resend",
    description: "Transactional email delivery for notifications and invites",
    status: "configure",
    icon: <Mail size={20} />,
    color: "#000000",
    meta: "No domain verified",
  },
  {
    id: "r2",
    name: "Cloudflare R2",
    description: "Object storage for large files and CDN delivery",
    status: "configure",
    icon: <Cloud size={20} />,
    color: "#F6821F",
    meta: "No bucket configured",
  },
  {
    id: "companies-house",
    name: "Companies House API",
    description: "UK company data lookup and verification",
    status: "configure",
    icon: <Building2 size={20} />,
    color: "#1D70B8",
    meta: "No API key set",
  },
];

export default function AdminIntegrationsPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Integrations</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            Platform service connections and configuration
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <span style={{ fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircle size={14} style={{ color: "#10B981" }} />
            {INTEGRATIONS.filter((i) => i.status === "connected").length} connected
          </span>
          <span style={{ fontSize: 13, color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 6, marginLeft: 12 }}>
            <Circle size={14} style={{ color: "#F59E0B" }} />
            {INTEGRATIONS.filter((i) => i.status === "configure").length} need configuration
          </span>
        </div>
      </div>

      <div className="page-content">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 16 }}>
          {INTEGRATIONS.map((intg) => (
            <div className="card" key={intg.id} style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 10, background: `${intg.color}18`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: intg.color, flexShrink: 0,
                }}>
                  {intg.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{intg.name}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{
                        width: 8, height: 8, borderRadius: 9999,
                        background: intg.status === "connected" ? "#10B981" : "#F59E0B",
                      }} />
                      <span style={{ fontSize: 12, color: intg.status === "connected" ? "#10B981" : "#F59E0B", fontWeight: 500 }}>
                        {intg.status === "connected" ? "Connected" : "Not configured"}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 8 }}>{intg.description}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace", marginBottom: 12 }}>{intg.meta}</div>
                  <button
                    className={cn("btn btn-sm", intg.status === "connected" ? "btn-secondary" : "btn-primary")}
                    onClick={() => alert(`Configure ${intg.name}`)}
                  >
                    <Settings size={13} />
                    {intg.status === "connected" ? "Manage" : "Configure"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

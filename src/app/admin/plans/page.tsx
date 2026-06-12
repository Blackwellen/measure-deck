"use client";

import { useState } from "react";
import { RefreshCw, Plus, Edit, Check, X } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 49,
    color: "#6B7280",
    features: ["Up to 3 members", "5 projects", "1 GB storage", "100 AI calls/month", "PDF export", "Email support"],
  },
  {
    id: "professional",
    name: "Professional",
    price: 299,
    color: "#3B5EE8",
    features: ["Up to 20 members", "50 projects", "10 GB storage", "1,000 AI calls/month", "BIM viewer", "Advanced analytics", "Priority support", "Custom branding"],
    highlighted: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 999,
    color: "#10B981",
    features: ["Unlimited members", "Unlimited projects", "100 GB storage", "10,000 AI calls/month", "All features", "Dedicated support", "SSO", "API access", "SLA guarantee"],
  },
];

const ENTITLEMENTS = [
  { feature: "Members", starter: "3", professional: "20", enterprise: "Unlimited" },
  { feature: "Projects", starter: "5", professional: "50", enterprise: "Unlimited" },
  { feature: "Storage", starter: "1 GB", professional: "10 GB", enterprise: "100 GB" },
  { feature: "AI Calls/month", starter: "100", professional: "1,000", enterprise: "10,000" },
  { feature: "BIM Viewer", starter: false, professional: true, enterprise: true },
  { feature: "Advanced Analytics", starter: false, professional: true, enterprise: true },
  { feature: "Custom Branding", starter: false, professional: true, enterprise: true },
  { feature: "API Access", starter: false, professional: false, enterprise: true },
  { feature: "SSO", starter: false, professional: false, enterprise: true },
  { feature: "SLA", starter: false, professional: false, enterprise: true },
  { feature: "PDF Export", starter: true, professional: true, enterprise: true },
  { feature: "Priority Support", starter: false, professional: true, enterprise: true },
];

const ADDONS = [
  { id: "ao-001", name: "Extra Storage (10 GB)", price: 25, description: "Add 10 GB to any plan" },
  { id: "ao-002", name: "Extra AI Calls (1,000)", price: 50, description: "Top-up AI call allowance" },
  { id: "ao-003", name: "Extra Members (5 seats)", price: 30, description: "Add 5 additional seats" },
  { id: "ao-004", name: "BIM Viewer Add-on", price: 75, description: "BIM/IFC viewer for Starter plan" },
];

function BoolCell({ value }: { value: boolean | string }) {
  if (typeof value === "string") return <span style={{ fontSize: 13 }}>{value}</span>;
  return value
    ? <Check size={15} style={{ color: "#10B981" }} />
    : <X size={15} style={{ color: "#EF4444" }} />;
}

export default function AdminPlansPage() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Plans & Entitlements</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>Manage subscription plans and feature entitlements</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => alert("Edit entitlement modal")}>
            <Edit size={14} /> Edit Entitlement
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => alert("Syncing with Stripe…")}>
            <RefreshCw size={14} /> Sync Stripe
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => alert("Create add-on modal")}>
            <Plus size={14} /> Create Add-on
          </button>
        </div>
      </div>

      <div className="page-content">
        {/* Plan Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16, marginBottom: 32 }}>
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className="card"
              style={{
                padding: 24,
                border: plan.highlighted ? `2px solid ${plan.color}` : undefined,
                position: "relative",
              }}
            >
              {plan.highlighted && (
                <div style={{
                  position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
                  background: plan.color, color: "#fff", fontSize: 11, fontWeight: 700,
                  padding: "2px 10px", borderRadius: 999,
                }}>
                  MOST POPULAR
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: plan.color }}>{plan.name}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>
                    {formatCurrency(plan.price)}<span style={{ fontSize: 13, fontWeight: 400, color: "var(--text-muted)" }}>/mo</span>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => alert(`Edit ${plan.name} plan`)}>
                  <Edit size={14} />
                </button>
              </div>
              <ul style={{ padding: 0, margin: 0, listStyle: "none" }}>
                {plan.features.map((f) => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, padding: "4px 0" }}>
                    <Check size={13} style={{ color: plan.color, flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Entitlement Matrix */}
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Entitlement Matrix</h2>
          <div className="card" style={{ overflow: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Feature</th>
                  <th style={{ textAlign: "center" }}>Starter</th>
                  <th style={{ textAlign: "center" }}>Professional</th>
                  <th style={{ textAlign: "center" }}>Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {ENTITLEMENTS.map((e) => (
                  <tr key={e.feature}>
                    <td style={{ fontWeight: 500, fontSize: 13 }}>{e.feature}</td>
                    <td style={{ textAlign: "center" }}><BoolCell value={e.starter} /></td>
                    <td style={{ textAlign: "center" }}><BoolCell value={e.professional} /></td>
                    <td style={{ textAlign: "center" }}><BoolCell value={e.enterprise} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add-ons */}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>Add-ons</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 12 }}>
            {ADDONS.map((addon) => (
              <div className="card" key={addon.id} style={{ padding: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{addon.name}</div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 8 }}>{addon.description}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--primary)" }}>
                    {formatCurrency(addon.price)}<span style={{ fontSize: 12, fontWeight: 400, color: "var(--text-muted)" }}>/mo</span>
                  </div>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => alert(`Edit ${addon.name}`)}>
                  <Edit size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

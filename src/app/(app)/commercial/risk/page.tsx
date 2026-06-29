"use client";

import { ShieldAlert } from "lucide-react";

export default function CommercialRiskPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Risk
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Portfolio-wide commercial risk register and early warning tracking.
          </p>
        </div>
      </div>
      <div className="card">
        <div className="empty-state py-20">
          <div className="empty-icon">
            <ShieldAlert size={24} />
          </div>
          <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Commercial Risk Register
          </h3>
          <p className="text-sm max-w-xs text-center" style={{ color: "var(--text-muted)" }}>
            Aggregate commercial risks, dispute exposure and early warnings from all projects in one dashboard. Coming soon.
          </p>
          <span className="badge chip-info mt-2">Coming Soon</span>
        </div>
      </div>
    </div>
  );
}

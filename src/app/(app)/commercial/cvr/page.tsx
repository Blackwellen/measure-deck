"use client";

import { BarChart3 } from "lucide-react";

export default function CommercialCVRPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            CVR
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Cost Value Reconciliation summary across all projects and periods.
          </p>
        </div>
      </div>
      <div className="card">
        <div className="empty-state py-20">
          <div className="empty-icon">
            <BarChart3 size={24} />
          </div>
          <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Portfolio CVR Analysis
          </h3>
          <p className="text-sm max-w-xs text-center" style={{ color: "var(--text-muted)" }}>
            Compare CVR periods, margin trends and cost performance across all active projects. Coming soon.
          </p>
          <span className="badge chip-info mt-2">Coming Soon</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { GitBranch } from "lucide-react";

export default function CommercialChangesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Changes
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Portfolio-wide change register and compensation event tracking.
          </p>
        </div>
      </div>
      <div className="card">
        <div className="empty-state py-20">
          <div className="empty-icon">
            <GitBranch size={24} />
          </div>
          <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Portfolio Change Register
          </h3>
          <p className="text-sm max-w-xs text-center" style={{ color: "var(--text-muted)" }}>
            A consolidated view of all changes, variations and compensation events across all active projects. Coming soon.
          </p>
          <span className="badge chip-info mt-2">Coming Soon</span>
        </div>
      </div>
    </div>
  );
}

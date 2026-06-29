"use client";

import { Receipt } from "lucide-react";

export default function CommercialApplicationsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Applications
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Consolidated applications for payment across all projects.
          </p>
        </div>
      </div>
      <div className="card">
        <div className="empty-state py-20">
          <div className="empty-icon">
            <Receipt size={24} />
          </div>
          <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Portfolio Applications View
          </h3>
          <p className="text-sm max-w-xs text-center" style={{ color: "var(--text-muted)" }}>
            Track all payment applications, certifications and due dates across the portfolio in one place. Coming soon.
          </p>
          <span className="badge chip-info mt-2">Coming Soon</span>
        </div>
      </div>
    </div>
  );
}

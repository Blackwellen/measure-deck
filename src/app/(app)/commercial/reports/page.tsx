"use client";

import { FileText } from "lucide-react";

export default function CommercialReportsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Reports
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Generate and export commercial reports, board packs and summaries.
          </p>
        </div>
      </div>
      <div className="card">
        <div className="empty-state py-20">
          <div className="empty-icon">
            <FileText size={24} />
          </div>
          <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Commercial Reports
          </h3>
          <p className="text-sm max-w-xs text-center" style={{ color: "var(--text-muted)" }}>
            Generate CVR summaries, application schedules, change registers and board packs for any project or the full portfolio. Coming soon.
          </p>
          <span className="badge chip-info mt-2">Coming Soon</span>
        </div>
      </div>
    </div>
  );
}

"use client";

import { FileCheck } from "lucide-react";

export default function CommercialFinalAccountsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>
            Final Accounts
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Final account status and reconciliation across all projects.
          </p>
        </div>
      </div>
      <div className="card">
        <div className="empty-state py-20">
          <div className="empty-icon">
            <FileCheck size={24} />
          </div>
          <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            Final Accounts Overview
          </h3>
          <p className="text-sm max-w-xs text-center" style={{ color: "var(--text-muted)" }}>
            Manage and track final account negotiations, agreed values and retention release across the portfolio. Coming soon.
          </p>
          <span className="badge chip-info mt-2">Coming Soon</span>
        </div>
      </div>
    </div>
  );
}

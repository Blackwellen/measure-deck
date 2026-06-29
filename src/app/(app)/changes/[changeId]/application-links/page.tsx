"use client";

import { useState } from "react";
import { Link2, ExternalLink } from "lucide-react";

function fmt(n: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
  }).format(n);
}

interface AppRow {
  ref: string;
  period: string;
  applied: string;
  certified: string;
  ceAmount: string;
  status: "Certified" | "Not Yet Applied";
  actionable: boolean;
}

const APPLICATIONS: AppRow[] = [
  {
    ref: "APP-008",
    period: "March 2025",
    applied: "£892,500",
    certified: "£842,500",
    ceAmount: "£8,500 included",
    status: "Certified",
    actionable: true,
  },
  {
    ref: "APP-007",
    period: "February 2025",
    applied: "£748,200",
    certified: "£748,200",
    ceAmount: "£8,500 included",
    status: "Certified",
    actionable: true,
  },
  {
    ref: "APP-009",
    period: "April 2025",
    applied: "Pending",
    certified: "—",
    ceAmount: "£31,000 to include",
    status: "Not Yet Applied",
    actionable: false,
  },
];

export default function ApplicationLinksPage() {
  const [selectedApp, setSelectedApp] = useState("APP-009");
  const [amount, setAmount] = useState("31500");
  const [notes, setNotes] = useState("");

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Card */}
      <div className="grid grid-cols-3 gap-4">
        <div className="kpi-card">
          <div className="kpi-label">Total Included in Applications</div>
          <div className="kpi-value text-xl">{fmt(17000)}</div>
        </div>
        <div className="kpi-card border-l-4" style={{ borderLeftColor: "var(--success)" }}>
          <div className="kpi-label">Certified</div>
          <div className="kpi-value text-xl" style={{ color: "var(--success)" }}>
            {fmt(8500)}
          </div>
        </div>
        <div className="kpi-card border-l-4" style={{ borderLeftColor: "var(--warning)" }}>
          <div className="kpi-label">Outstanding</div>
          <div className="kpi-value text-xl" style={{ color: "var(--warning)" }}>
            {fmt(39500)}
          </div>
        </div>
      </div>

      {/* Applications Table */}
      <div className="card overflow-hidden">
        <div
          className="px-5 py-3 border-b flex items-center justify-between"
          style={{ borderColor: "var(--border)", background: "var(--bg-muted)" }}
        >
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Payment Applications
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Application</th>
                <th>Period</th>
                <th className="text-right">Applied</th>
                <th className="text-right">Certified</th>
                <th>CE-025 Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {APPLICATIONS.map((app) => (
                <tr key={app.ref}>
                  <td className="font-mono text-xs font-bold" style={{ color: "var(--primary)" }}>
                    {app.ref}
                  </td>
                  <td className="text-sm">{app.period}</td>
                  <td className="text-right tabular-nums text-sm">{app.applied}</td>
                  <td
                    className="text-right tabular-nums text-sm"
                    style={{ color: app.certified === "—" ? "var(--text-muted)" : undefined }}
                  >
                    {app.certified}
                  </td>
                  <td className="text-sm font-medium">{app.ceAmount}</td>
                  <td>
                    <span
                      className={`badge text-[10px] ${
                        app.status === "Certified" ? "chip-success" : "chip-muted"
                      }`}
                    >
                      {app.status}
                    </span>
                  </td>
                  <td>
                    {app.actionable && (
                      <button className="btn btn-ghost btn-sm text-xs">
                        <ExternalLink size={11} />
                        View
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CE Amount Tracker */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          CE Amount Tracker
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <div className="kpi-label">Total CE Value</div>
            <div className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              {fmt(48500)}
            </div>
          </div>
          <div>
            <div className="kpi-label">Included in Applications</div>
            <div className="text-xl font-bold" style={{ color: "var(--warning)" }}>
              {fmt(17000)}
            </div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>35%</div>
          </div>
          <div>
            <div className="kpi-label">Remaining to Claim</div>
            <div className="text-xl font-bold" style={{ color: "var(--primary)" }}>
              {fmt(31500)}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-3 rounded-full mb-3" style={{ background: "var(--bg-muted)" }}>
          <div
            className="h-full rounded-full"
            style={{ width: "35%", background: "var(--warning)" }}
          />
        </div>
        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
          Note: Full amount can be included in Application #9 (due 30 Apr 2025)
        </div>
      </div>

      {/* Link to Application Flow */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Link2 size={15} style={{ color: "var(--primary)" }} />
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Link to Application
          </h3>
        </div>
        <div className="flex flex-col gap-4">
          <div>
            <label className="form-label">Select Application</label>
            <select
              className="form-input"
              value={selectedApp}
              onChange={(e) => setSelectedApp(e.target.value)}
            >
              <option value="APP-009">APP-009 – Current Month (April 2025)</option>
              <option value="APP-010">APP-010 – Next Month (May 2025)</option>
            </select>
          </div>
          <div>
            <label className="form-label">Amount to Include (£)</label>
            <input
              className="form-input"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="31500"
            />
          </div>
          <div>
            <label className="form-label">Notes</label>
            <textarea
              className="form-input"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes for the QS..."
            />
          </div>
          <div>
            <button className="btn btn-primary btn-sm" disabled>
              Link CE to Application
            </button>
            <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
              This will be actioned by QS on submission.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

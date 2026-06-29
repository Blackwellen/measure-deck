"use client";

import { useState } from "react";
import { CheckCircle2, Clock, Circle, AlertTriangle, Download, Bell, ExternalLink } from "lucide-react";
import { CE025_NEC4_STEPS, type SeedNEC4Step } from "@/lib/seed/projects";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(s: string): string {
  return new Date(s).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function stepBg(status: SeedNEC4Step["status"]): string {
  return (
    {
      completed: "var(--success)",
      in_progress: "var(--primary)",
      pending: "var(--bg-muted)",
      overdue: "var(--danger)",
    }[status] ?? "var(--bg-muted)"
  );
}

function stepColor(status: SeedNEC4Step["status"]): string {
  return status === "pending" ? "var(--text-muted)" : "#fff";
}

function stepGlow(status: SeedNEC4Step["status"]): string | undefined {
  if (status === "in_progress") return "0 0 0 5px rgba(59,94,232,0.18)";
  return undefined;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const CLAUSES = [
  { clause: "60.1(12)", desc: "Unforeseen physical conditions", triggered: "Yes" },
  { clause: "61.1",     desc: "PM notifies CE",                  triggered: "Yes" },
  { clause: "61.3",     desc: "Contractor notifies CE",          triggered: "Yes" },
  { clause: "62.1",     desc: "Contractor submits quotation",    triggered: "Yes" },
  { clause: "62.3",     desc: "PM instructs revised quotation",  triggered: "—" },
  { clause: "64.1",     desc: "PM makes own assessment",         triggered: "In Progress" },
  { clause: "65.1",     desc: "Implementation",                  triggered: "Pending" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function NEC4WorkflowPage() {
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [showAssessmentConfirm, setShowAssessmentConfirm] = useState(false);
  const [reminderDate, setReminderDate] = useState("");
  const [reminderEmail, setReminderEmail] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left – main workflow + tables */}
      <div className="lg:col-span-2 flex flex-col gap-6">

        {/* Header */}
        <div>
          <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text-primary)" }}>
            NEC4 CE Workflow
          </h2>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Tracking CE-025 through the NEC4 compensation event process
          </p>
        </div>

        {/* Visual Workflow */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-6" style={{ color: "var(--text-primary)" }}>
            Workflow Progress
          </h3>
          <div className="flex flex-col gap-0">
            {CE025_NEC4_STEPS.map((step, idx) => {
              const isLast = idx === CE025_NEC4_STEPS.length - 1;
              return (
                <div key={step.id} className="relative flex gap-4">
                  {/* Connector line */}
                  {!isLast && (
                    <div
                      className="absolute left-5 top-10 bottom-0 w-0.5 z-0"
                      style={{
                        background:
                          step.status === "completed" ? "var(--success)" : "var(--border)",
                      }}
                    />
                  )}

                  {/* Circle */}
                  <div className="flex-shrink-0 z-10">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                      style={{
                        background: stepBg(step.status),
                        color: stepColor(step.status),
                        border:
                          step.status === "pending" ? "2px solid var(--border)" : "none",
                        boxShadow: stepGlow(step.status),
                      }}
                    >
                      {step.status === "completed" ? (
                        <CheckCircle2 size={16} />
                      ) : step.status === "in_progress" ? (
                        <Clock size={16} />
                      ) : step.status === "overdue" ? (
                        <AlertTriangle size={14} />
                      ) : (
                        <span>{step.stepNumber}</span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className={`flex-1 pb-6 ${isLast ? "pb-0" : ""}`}>
                    <div className="flex items-start justify-between gap-3 flex-wrap mb-1">
                      <div>
                        <span
                          className="text-sm font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {step.name}
                        </span>
                        <span
                          className="ml-2 badge text-[10px] chip-muted"
                        >
                          Clause {step.clauseRef}
                        </span>
                      </div>
                      {step.status === "in_progress" && (
                        <span className="badge chip-warning text-[10px]">Action Required</span>
                      )}
                    </div>

                    {/* Dates */}
                    <div className="text-xs mb-1.5" style={{ color: "var(--text-muted)" }}>
                      {step.completedDate ? (
                        <span style={{ color: "var(--success)" }}>
                          Completed: {fmtDate(step.completedDate)}
                        </span>
                      ) : step.dueDate ? (
                        <span>Due: {fmtDate(step.dueDate)}</span>
                      ) : null}
                    </div>

                    {/* Notes */}
                    {step.notes && (
                      <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        {step.notes}
                      </p>
                    )}

                    {/* In-progress indicator */}
                    {step.status === "in_progress" && (
                      <div className="mt-2">
                        <div
                          className="h-1.5 rounded-full"
                          style={{ background: "var(--bg-muted)" }}
                        >
                          <div
                            className="h-full rounded-full animate-pulse"
                            style={{ width: "40%", background: "var(--primary)" }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Deadline Calculator */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            NEC4 Deadline Calculator
          </h3>
          <div className="flex flex-col gap-3">
            {[
              { label: "CE Notification Date", value: "18 Mar 2025", status: null },
              { label: "Quotation Due (21 days)", value: "8 Apr 2025", status: "Submitted", ok: true },
              { label: "Acceptance Due (14 days after quotation)", value: "22 Apr 2025", status: "Current", ok: null },
              { label: "Deemed Accepted if no response (+1 day)", value: "23 Apr 2025", status: null, note: true },
            ].map(({ label, value, status, ok, note }) => (
              <div
                key={label}
                className="flex items-center justify-between gap-3 p-3 rounded-lg"
                style={{ background: "var(--bg-muted)" }}
              >
                <div>
                  <div className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                    {label}
                  </div>
                  {note && (
                    <div className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                      Under Clause 62.6
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {value}
                  </span>
                  {status && (
                    <span
                      className={`badge text-[10px] ${
                        ok ? "chip-success" : "chip-warning"
                      }`}
                    >
                      {status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div
            className="mt-4 p-3 rounded-lg text-xs"
            style={{
              background: "rgba(245,158,11,0.08)",
              borderLeft: "3px solid var(--warning)",
              color: "var(--text-secondary)",
            }}
          >
            If PM fails to respond by 22 Apr 2025, the quotation is deemed accepted under Clause 62.6.
          </div>
        </div>

        {/* Clause Quick Reference */}
        <div className="card overflow-hidden">
          <div
            className="px-5 py-3 border-b"
            style={{ borderColor: "var(--border)", background: "var(--bg-muted)" }}
          >
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Clause Quick Reference
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-20">Clause</th>
                  <th>Description</th>
                  <th className="w-28">Triggered?</th>
                </tr>
              </thead>
              <tbody>
                {CLAUSES.map(({ clause, desc, triggered }) => (
                  <tr key={clause}>
                    <td className="font-mono text-xs font-bold" style={{ color: "var(--primary)" }}>
                      {clause}
                    </td>
                    <td className="text-sm">{desc}</td>
                    <td>
                      <span
                        className={`badge text-[10px] ${
                          triggered === "Yes"
                            ? "chip-success"
                            : triggered === "—"
                            ? "chip-muted"
                            : triggered === "In Progress"
                            ? "chip-warning"
                            : "chip-info"
                        }`}
                      >
                        {triggered}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Early Warning Register */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Linked Early Warning Register
          </h3>
          <div
            className="flex items-center justify-between p-3 rounded-lg"
            style={{ background: "var(--bg-muted)" }}
          >
            <div>
              <div className="font-mono text-xs font-bold" style={{ color: "var(--primary)" }}>
                EW-031
              </div>
              <div className="text-sm font-medium mt-0.5" style={{ color: "var(--text-primary)" }}>
                Potential unforeseen ground conditions
              </div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                14 Mar 2025
              </div>
            </div>
            <span className="badge chip-success text-[10px]">Resolved</span>
          </div>
          <button
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium"
            style={{ color: "var(--primary)" }}
          >
            View full EW register <ExternalLink size={11} />
          </button>
        </div>
      </div>

      {/* Right sidebar – Actions */}
      <div className="flex flex-col gap-4">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Actions
        </h3>

        {/* Record PM Assessment */}
        <div className="card p-4">
          {showAssessmentConfirm ? (
            <div className="flex flex-col gap-3">
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                This will update the CE status to &quot;agreed&quot; once PM value is entered. Are you sure?
              </p>
              <div className="flex gap-2">
                <button
                  className="btn btn-primary btn-sm flex-1"
                  onClick={() => setShowAssessmentConfirm(false)}
                >
                  Confirm
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowAssessmentConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              className="btn btn-primary btn-sm w-full justify-center"
              onClick={() => setShowAssessmentConfirm(true)}
            >
              Record PM Assessment
            </button>
          )}
        </div>

        {/* Mark as Disputed */}
        <div className="card p-4">
          {showDisputeForm ? (
            <div className="flex flex-col gap-3">
              <label className="form-label">Reason for Dispute</label>
              <textarea
                className="form-input text-sm"
                rows={3}
                placeholder="Describe the basis of dispute..."
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  className="btn btn-sm flex-1"
                  style={{ background: "var(--danger)", color: "#fff" }}
                  onClick={() => setShowDisputeForm(false)}
                >
                  Confirm Dispute
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setShowDisputeForm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              className="btn btn-sm w-full justify-center"
              style={{ background: "rgba(239,68,68,0.1)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.3)" }}
              onClick={() => setShowDisputeForm(true)}
            >
              Mark as Disputed
            </button>
          )}
        </div>

        {/* Export */}
        <button className="btn btn-secondary btn-sm w-full justify-center">
          <Download size={13} />
          Export NEC4 Timeline
        </button>

        {/* Set Reminder */}
        <div className="card p-4">
          <button
            className="btn btn-ghost btn-sm w-full justify-center mb-3"
            onClick={() => setShowReminderForm(!showReminderForm)}
          >
            <Bell size={13} />
            Set Reminder
          </button>
          {showReminderForm && (
            <div className="flex flex-col gap-3">
              <div>
                <label className="form-label">Reminder Date</label>
                <input
                  className="form-input"
                  type="date"
                  value={reminderDate}
                  onChange={(e) => setReminderDate(e.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="checkbox"
                  className="w-4 h-4"
                  checked={reminderEmail}
                  onChange={(e) => setReminderEmail(e.target.checked)}
                />
                <span style={{ color: "var(--text-secondary)" }}>Send email reminder</span>
              </label>
              <button className="btn btn-primary btn-sm">Save Reminder</button>
            </div>
          )}
        </div>

        {/* Key deadline summary */}
        <div
          className="card p-4"
          style={{ background: "rgba(59,94,232,0.04)", borderColor: "rgba(59,94,232,0.2)" }}
        >
          <div className="text-xs font-semibold mb-2" style={{ color: "var(--primary)" }}>
            Current Deadline
          </div>
          <div className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
            PM Assessment Due
          </div>
          <div className="text-sm font-semibold" style={{ color: "var(--warning)" }}>
            22 April 2025
          </div>
          <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            NEC4 Clause 64.1 — 14-day window
          </div>
        </div>
      </div>
    </div>
  );
}

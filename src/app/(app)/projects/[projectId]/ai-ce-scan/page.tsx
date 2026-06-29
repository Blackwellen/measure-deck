"use client";

import { FeatureGate } from "@/components/ui/feature-gate";
import { PageHeader } from "@/components/ui/page-header";
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  ScanSearch,
  X,
} from "lucide-react";
import { useParams } from "next/navigation";
import React, { useState } from "react";

/* ─── Types ─────────────────────────────────────────────────────────── */

interface CEClause {
  code: string;
  description: string;
  strength: "High" | "Medium" | "Low";
  action: string;
}

interface CEScanResult {
  clauses: CEClause[];
  notificationRequired: boolean;
  notificationDeadline: string;
  recommendedDescription: string;
}

/* ─── Strength style ─────────────────────────────────────────────────── */

function strengthStyle(strength: string): React.CSSProperties {
  if (strength === "High") return { color: "#dc2626", background: "#fef2f2" };
  if (strength === "Medium") return { color: "#d97706", background: "#fffbeb" };
  return { color: "#16a34a", background: "#f0fdf4" };
}

/* ─── Confirmation Modal ─────────────────────────────────────────────── */

interface ConfirmModalProps {
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmModal({ description, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div
        className="relative bg-white rounded-2xl shadow-xl border p-6 max-w-md w-full mx-4"
        style={{ borderColor: "var(--border)" }}
      >
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 btn btn-ghost btn-icon btn-sm"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(139,92,246,0.1)" }}
          >
            <FileText className="w-5 h-5" style={{ color: "var(--violet)" }} />
          </div>
          <div>
            <h2 className="text-[15px] font-700 mb-1" style={{ color: "var(--text-primary)" }}>
              Create Change Event from Scan?
            </h2>
            <p className="text-[12.5px]" style={{ color: "var(--text-muted)" }}>
              This will open the Change Event wizard pre-filled with the AI-suggested data. You will review and confirm all details before saving.
            </p>
          </div>
        </div>

        <div
          className="rounded-xl p-3 border mb-4"
          style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}
        >
          <p className="text-[12.5px] font-medium mb-0.5" style={{ color: "var(--text-secondary)" }}>
            CE Description
          </p>
          <p className="text-[12.5px]" style={{ color: "var(--text-primary)" }}>
            {description}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 btn btn-primary"
          >
            <CheckCircle2 className="w-4 h-4" />
            Open CE Wizard
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────── */

export default function AICeScanPage() {
  const params = useParams();
  const projectId = typeof params.projectId === "string" ? params.projectId : "";

  const [inputText, setInputText] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CEScanResult | null>(null);
  const [editableDescription, setEditableDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const scan = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const notificationDeadline = eventDate
      ? new Date(new Date(eventDate).getTime() + 56 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB")
      : "8 weeks from event date";

    const prompt = `You are a UK construction commercial specialist. Analyse the following text for NEC4 Compensation Event entitlement under Clause 60.1.

Text to analyse:
${inputText}

Event Date: ${eventDate || "Not specified"}

Respond in this EXACT JSON format:
{
  "clauses": [
    {
      "code": "60.1(X)",
      "description": "Description of the CE ground",
      "strength": "High|Medium|Low",
      "action": "Recommended action"
    }
  ],
  "notificationRequired": true,
  "notificationDeadline": "${notificationDeadline}",
  "recommendedDescription": "Suggested CE description text"
}

Only return valid JSON, no other text.`;

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          context: { mode: "ce_scanner", projectId },
        }),
      });

      if (!res.ok) throw new Error("Request failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
          for (const line of lines) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") break;
            try {
              const parsed = JSON.parse(data) as { choices?: { delta?: { content?: string } }[] };
              fullText += parsed?.choices?.[0]?.delta?.content ?? "";
            } catch { /* ignore */ }
          }
        }
      }

      const jsonMatch = /\{[\s\S]*\}/.exec(fullText);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as CEScanResult;
        parsed.notificationDeadline = notificationDeadline;
        setResult(parsed);
        setEditableDescription(parsed.recommendedDescription ?? "");
      } else {
        throw new Error("Could not parse AI response");
      }
    } catch {
      setError("Unable to analyse the text. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWizard = () => {
    setShowConfirm(false);
    const query = new URLSearchParams({
      ai_prefill: "1",
      description: editableDescription,
      project_id: projectId,
    }).toString();
    window.location.href = `/app/changes?${query}`;
  };

  return (
    <FeatureGate flag="ai_ce_identifier">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="AI CE Entitlement Scanner"
          subtitle="Analyse site instructions, RFI responses, and events for NEC4 Compensation Event entitlement"
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="card p-5 space-y-4">
              <div>
                <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Paste instruction, RFI, or site event description
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full rounded-xl border p-3 text-[13px] outline-none resize-y transition-colors focus:border-[var(--primary)]"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                    background: "var(--bg-subtle)",
                    minHeight: 150,
                  }}
                  placeholder="e.g. Site Instruction #14: Contractor instructed to extend drainage run by 35m due to unforeseen buried services discovered at chainage 120. Employer's Design Coordinator confirmed in writing..."
                  rows={6}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Date of event
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="form-input h-9 text-sm w-full"
                  />
                </div>
              </div>

              {error && (
                <div
                  className="rounded-xl p-3 border text-[13px]"
                  style={{ borderColor: "rgba(220,38,38,0.3)", background: "#fef2f2", color: "#dc2626" }}
                >
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={() => void scan()}
                disabled={!inputText.trim() || loading}
                className="btn btn-primary disabled:opacity-40"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanSearch className="w-4 h-4" />}
                {loading ? "Scanning for CE Entitlement…" : "Scan for CE Entitlement"}
              </button>
            </div>

            {result && (
              <div className="space-y-4">
                <div className="card p-5 space-y-4">
                  <h2 className="text-[15px] font-700" style={{ color: "var(--text-primary)" }}>
                    Entitlement Assessment
                  </h2>

                  {result.clauses.length === 0 ? (
                    <div
                      className="rounded-xl p-4 border text-center"
                      style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}
                    >
                      <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
                        No CE grounds identified in the provided text.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {result.clauses.map((clause, i) => (
                        <div
                          key={i}
                          className="rounded-xl border p-4 space-y-2"
                          style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}
                        >
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <span className="text-[13px] font-mono font-semibold" style={{ color: "var(--primary)" }}>
                              NEC4 {clause.code}
                            </span>
                            <span
                              className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                              style={strengthStyle(clause.strength)}
                            >
                              {clause.strength} Entitlement
                            </span>
                          </div>
                          <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                            {clause.description}
                          </p>
                          <p className="text-[12.5px] font-medium" style={{ color: "var(--text-muted)" }}>
                            Action: {clause.action}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {result.notificationRequired && (
                  <div
                    className="card p-4 border-l-4 space-y-1"
                    style={{ borderLeftColor: "#dc2626" }}
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: "#dc2626" }} />
                      <h3 className="text-[13px] font-700" style={{ color: "#dc2626" }}>
                        Notification Required
                      </h3>
                    </div>
                    <p className="text-[12.5px]" style={{ color: "var(--text-secondary)" }}>
                      Under NEC4 Clause 61.3, the contractor must notify the PM within 8 weeks of becoming aware.
                    </p>
                    <p className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
                      Deadline: {result.notificationDeadline}
                    </p>
                  </div>
                )}

                <div className="card p-5 space-y-3">
                  <h2 className="text-[15px] font-700" style={{ color: "var(--text-primary)" }}>
                    Recommended CE Description
                  </h2>
                  <p className="text-[12.5px]" style={{ color: "var(--text-muted)" }}>
                    Edit this description before creating the Change Event.
                  </p>
                  <textarea
                    value={editableDescription}
                    onChange={(e) => setEditableDescription(e.target.value)}
                    className="w-full rounded-xl border p-3 text-[13px] outline-none resize-y transition-colors focus:border-[var(--primary)]"
                    style={{ borderColor: "var(--border)", color: "var(--text-primary)", background: "var(--bg-subtle)" }}
                    rows={4}
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirm(true)}
                    className="btn btn-primary"
                    disabled={!editableDescription.trim()}
                  >
                    <FileText className="w-4 h-4" />
                    Create CE from this Scan
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div
              className="card p-4 space-y-3"
              style={{ borderColor: "rgba(139,92,246,0.2)", background: "rgba(245,243,255,0.5)" }}
            >
              <h3 className="text-[13px] font-700" style={{ color: "var(--text-primary)" }}>
                NEC4 CE Grounds (Clause 60.1)
              </h3>
              <ul className="space-y-2 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                <li><strong className="font-mono">60.1(1)</strong> — PM instruction changing scope</li>
                <li><strong className="font-mono">60.1(2)</strong> — PM does not allow access</li>
                <li><strong className="font-mono">60.1(3)</strong> — PM does not reply to communication</li>
                <li><strong className="font-mono">60.1(4)</strong> — PM gives wrong instruction</li>
                <li><strong className="font-mono">60.1(5)</strong> — Work by others / employer</li>
                <li><strong className="font-mono">60.1(6)</strong> — Late replies to RFIs</li>
                <li><strong className="font-mono">60.1(12)</strong> — Physical conditions</li>
                <li><strong className="font-mono">60.1(13)</strong> — Weather events</li>
                <li><strong className="font-mono">60.1(19)</strong> — Prevention</li>
              </ul>
            </div>

            <div className="card p-4 space-y-2">
              <h3 className="text-[12px] font-700" style={{ color: "var(--text-primary)" }}>
                Important Timescales
              </h3>
              <ul className="space-y-1.5 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                <li><strong>8 weeks</strong> — Contractor notification (Clause 61.3)</li>
                <li><strong>3 weeks</strong> — Quotation from instruction (Clause 62.3)</li>
                <li><strong>2 weeks</strong> — PM to assess quotation (Clause 62.3)</li>
                <li><strong>2 weeks</strong> — Deemed acceptance if PM silent (Clause 62.6)</li>
              </ul>
            </div>

            <div
              className="card p-4 space-y-2"
              style={{ borderColor: "rgba(220,38,38,0.2)", background: "#fef2f2" }}
            >
              <h3 className="text-[12px] font-700" style={{ color: "#dc2626" }}>
                Disclaimer
              </h3>
              <p className="text-[11.5px] leading-relaxed" style={{ color: "#991b1b" }}>
                AI analysis is for guidance only. Always consult a qualified QS or construction law specialist before submitting CE notifications.
              </p>
            </div>
          </div>
        </div>
      </div>

      {showConfirm && (
        <ConfirmModal
          description={editableDescription}
          onConfirm={handleOpenWizard}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </FeatureGate>
  );
}

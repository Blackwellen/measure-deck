"use client";

import { PageHeader } from "@/components/ui/page-header";
import { FeatureGate } from "@/components/ui/feature-gate";
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Download,
  FileSearch,
  FileText,
  Loader2,
} from "lucide-react";
import { useParams } from "next/navigation";
import React, { useState } from "react";
/* ─── Types ─────────────────────────────────────────────────────────── */

interface ContractRisk {
  clause: string;
  issue: string;
  level: "Red" | "Amber" | "Green";
  action: string;
}

interface ContractAnalysis {
  risks: ContractRisk[];
  missingProtections: string[];
  keyTerms: Record<string, string>;
}

interface AnalysisHistory {
  id: string;
  contractType: string;
  analysedAt: string;
  riskCount: number;
  highRiskCount: number;
}

/* ─── Risk accordion item ────────────────────────────────────────────── */

function RiskItem({ risk }: { risk: ContractRisk }) {
  const [open, setOpen] = useState(false);

  const riskStyle = () => {
    if (risk.level === "Red") return {
      border: "rgba(220,38,38,0.4)", bg: "#fef2f2",
      badge: { color: "#dc2626", background: "#fecaca" },
    };
    if (risk.level === "Amber") return {
      border: "rgba(245,158,11,0.4)", bg: "#fffbeb",
      badge: { color: "#d97706", background: "#fde68a" },
    };
    return {
      border: "rgba(22,163,74,0.4)", bg: "#f0fdf4",
      badge: { color: "#16a34a", background: "#bbf7d0" },
    };
  };

  const style = riskStyle();

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: style.border }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:brightness-95"
        style={{ background: style.bg }}
      >
        <span
          className="text-[10.5px] font-bold px-2 py-0.5 rounded-full uppercase flex-shrink-0"
          style={style.badge}
        >
          {risk.level}
        </span>
        <span className="text-[12px] font-mono text-[var(--text-muted)] flex-shrink-0 w-28 truncate">
          {risk.clause}
        </span>
        <span className="flex-1 text-[13px] font-medium truncate" style={{ color: "var(--text-primary)" }}>
          {risk.issue}
        </span>
        {open ? (
          <ChevronDown className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
        ) : (
          <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
        )}
      </button>
      {open && (
        <div className="px-4 py-3 border-t" style={{ borderColor: style.border, background: "white" }}>
          <p className="text-[13px] mb-2" style={{ color: "var(--text-secondary)" }}>
            <strong>Issue:</strong> {risk.issue}
          </p>
          <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
            <strong>Recommended Action:</strong> {risk.action}
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────── */

export default function AIContractReviewPage() {
  const params = useParams();
  const projectId = typeof params.projectId === "string" ? params.projectId : "";

  const [contractText, setContractText] = useState("");
  const [contractType, setContractType] = useState("NEC4");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ContractAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history] = useState<AnalysisHistory[]>([]);

  const analyse = async () => {
    if (!contractText.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const prompt = `You are a UK construction contract specialist. Analyse the following ${contractType} contract clauses for risks to the contractor.

Contract Text:
${contractText}

Respond in this EXACT JSON format:
{
  "risks": [
    {
      "clause": "Clause reference or section",
      "issue": "Description of the risk or unfavourable term",
      "level": "Red|Amber|Green",
      "action": "Recommended action to mitigate or negotiate"
    }
  ],
  "missingProtections": [
    "Description of missing standard protection"
  ],
  "keyTerms": {
    "paymentTerms": "e.g. 30 days",
    "retention": "e.g. 5%",
    "dlp": "e.g. 12 months",
    "disputeResolution": "e.g. Adjudication per HGCRA 1996"
  }
}

Only return valid JSON, no other text.`;

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          context: { mode: "contract_analyser", projectId },
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
        setResult(JSON.parse(jsonMatch[0]) as ContractAnalysis);
      } else {
        throw new Error("Could not parse AI response");
      }
    } catch {
      setError("Unable to analyse the contract. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const exportAnalysis = () => {
    if (!result) return;
    const lines: string[] = [
      `AI Contract Analysis — ${contractType}`,
      `Generated: ${new Date().toLocaleDateString("en-GB")}`,
      `Project ID: ${projectId}`,
      "",
      "RISK FLAGS",
      "==========",
      ...result.risks.map(
        (r) => `[${r.level}] ${r.clause}\nIssue: ${r.issue}\nAction: ${r.action}\n`
      ),
      "",
      "MISSING PROTECTIONS",
      "===================",
      ...result.missingProtections.map((p) => `• ${p}`),
      "",
      "KEY COMMERCIAL TERMS",
      "====================",
      ...Object.entries(result.keyTerms).map(([k, v]) => `${k}: ${v}`),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contract-analysis-${projectId}-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const redCount = result?.risks.filter((r) => r.level === "Red").length ?? 0;
  const amberCount = result?.risks.filter((r) => r.level === "Amber").length ?? 0;
  const greenCount = result?.risks.filter((r) => r.level === "Green").length ?? 0;

  return (
    <FeatureGate flag="ai_contract_analyser">
      <div className="flex flex-col gap-6">
        <PageHeader
          title="AI Contract Review"
          subtitle="Analyse contract clauses for risks, missing protections, and commercial terms"
          actions={
            result && (
              <button
                type="button"
                onClick={exportAnalysis}
                className="btn btn-secondary btn-sm"
              >
                <Download className="w-4 h-4" />
                Export Analysis
              </button>
            )
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="card p-5 space-y-4">
              <div className="space-y-2">
                <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                  Paste contract clauses, special conditions, or amendments for AI analysis. The AI will identify risks, flag missing protections, and summarise key commercial terms.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                    Contract type
                  </label>
                  <select
                    value={contractType}
                    onChange={(e) => setContractType(e.target.value)}
                    className="form-input h-9 text-sm w-full"
                  >
                    <option value="NEC4">NEC4</option>
                    <option value="JCT">JCT 2016</option>
                    <option value="FIDIC">FIDIC</option>
                    <option value="Bespoke">Bespoke</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                  Contract clauses or amendments
                </label>
                <textarea
                  value={contractText}
                  onChange={(e) => setContractText(e.target.value)}
                  className="w-full rounded-xl border p-3 text-[13px] outline-none resize-y transition-colors focus:border-[var(--primary)]"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--text-primary)",
                    background: "var(--bg-subtle)",
                    minHeight: 200,
                  }}
                  placeholder="Paste contract text here — e.g. Z-clauses, special conditions, amended standard clauses…"
                  rows={8}
                />
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
                onClick={() => void analyse()}
                disabled={!contractText.trim() || loading}
                className="btn btn-primary disabled:opacity-40"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSearch className="w-4 h-4" />}
                {loading ? "Analysing contract…" : "Analyse Contract"}
              </button>
            </div>

            {result && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  {redCount > 0 && (
                    <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full" style={{ color: "#dc2626", background: "#fecaca" }}>
                      {redCount} Red
                    </span>
                  )}
                  {amberCount > 0 && (
                    <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full" style={{ color: "#d97706", background: "#fde68a" }}>
                      {amberCount} Amber
                    </span>
                  )}
                  {greenCount > 0 && (
                    <span className="text-[12px] font-semibold px-2.5 py-1 rounded-full" style={{ color: "#16a34a", background: "#bbf7d0" }}>
                      {greenCount} Green
                    </span>
                  )}
                </div>

                {result.risks.length > 0 && (
                  <div className="card p-5 space-y-3">
                    <h2 className="text-[15px] font-700" style={{ color: "var(--text-primary)" }}>
                      Risk Flags
                    </h2>
                    <div className="space-y-2">
                      {result.risks.map((risk, i) => (
                        <RiskItem key={i} risk={risk} />
                      ))}
                    </div>
                  </div>
                )}

                {result.missingProtections.length > 0 && (
                  <div className="card p-5 space-y-3">
                    <h2 className="text-[15px] font-700" style={{ color: "var(--text-primary)" }}>
                      Missing Protections
                    </h2>
                    <ul className="space-y-2">
                      {result.missingProtections.map((p, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#d97706" }} />
                          <span className="text-[13px]" style={{ color: "var(--text-secondary)" }}>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.keyTerms && Object.keys(result.keyTerms).length > 0 && (
                  <div className="card p-5 space-y-3">
                    <h2 className="text-[15px] font-700" style={{ color: "var(--text-primary)" }}>
                      Key Commercial Terms
                    </h2>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(result.keyTerms).map(([k, v]) => (
                        <div
                          key={k}
                          className="rounded-xl p-3 border"
                          style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}
                        >
                          <dt className="text-[11px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "var(--text-muted)" }}>
                            {k.replace(/([A-Z])/g, " $1").trim()}
                          </dt>
                          <dd className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="card p-4 space-y-3">
              <h3 className="text-[13px] font-700" style={{ color: "var(--text-primary)" }}>
                Analysis History
              </h3>
              {history.length === 0 ? (
                <div className="text-center py-6" style={{ color: "var(--text-muted)" }}>
                  <FileText className="w-6 h-6 mx-auto mb-2 opacity-40" />
                  <p className="text-[12px]">No previous analyses for this project</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((h) => (
                    <div
                      key={h.id}
                      className="rounded-xl border p-3 space-y-1"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <p className="text-[12.5px] font-medium" style={{ color: "var(--text-primary)" }}>
                        {h.contractType}
                      </p>
                      <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {h.analysedAt} · {h.riskCount} risks
                      </p>
                      {h.highRiskCount > 0 && (
                        <span className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full" style={{ color: "#dc2626", background: "#fecaca" }}>
                          {h.highRiskCount} Red
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              className="card p-4 space-y-2"
              style={{ borderColor: "rgba(139,92,246,0.2)", background: "rgba(245,243,255,0.5)" }}
            >
              <h3 className="text-[12px] font-700" style={{ color: "var(--text-primary)" }}>
                Disclaimer
              </h3>
              <p className="text-[11.5px] leading-relaxed" style={{ color: "var(--text-muted)" }}>
                AI analysis is for guidance only and does not constitute legal advice. Always consult a qualified solicitor or construction law specialist before acting on contract analysis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </FeatureGate>
  );
}

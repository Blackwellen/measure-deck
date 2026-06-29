"use client";

import { cn } from "@/lib/utils";
import { buildSystemPrompt, type PageContext } from "@/lib/ai/context-builder";
import { getFlag } from "@/lib/feature-flags";
import { createClient } from "@/lib/supabase/client";
import { createAuditEvent } from "@/lib/audit";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  FileSearch,
  FileText,
  Loader2,
  MapPin,
  ScanSearch,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";

/* ─── Types ─────────────────────────────────────────────────────────── */

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface MutationSuggestion {
  id: string;
  messageId: string;
  text: string;
  dismissed: boolean;
}

interface CEClause {
  code: string;
  description: string;
  strength: "High" | "Medium" | "Low";
  action: string;
}

interface CEScans {
  clauses: CEClause[];
  notificationRequired: boolean;
  notificationDeadline: string;
  recommendedDescription: string;
}

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

type CopilotTab = "chat" | "ce-scanner" | "contract";

/* ─── Props ─────────────────────────────────────────────────────────── */

interface CopilotViewProps {
  pageContext?: PageContext;
}

/* ─── Slash commands ─────────────────────────────────────────────────── */

const SLASH_COMMANDS = [
  { cmd: "/summarise",      desc: "Summarise this project's current status",       group: "Project" },
  { cmd: "/cvr",            desc: "Explain the current CVR position",               group: "Project" },
  { cmd: "/cashflow",       desc: "Show cash flow forecast and key dates",          group: "Project" },
  { cmd: "/risk",           desc: "Identify commercial and programme risks",        group: "Project" },
  { cmd: "/margin",         desc: "Analyse current margin and forecast",            group: "Project" },
  { cmd: "/application",   desc: "Draft a payment application narrative",          group: "Payments" },
  { cmd: "/certification", desc: "Explain certification status and gaps",          group: "Payments" },
  { cmd: "/retention",     desc: "Calculate retention and release schedule",       group: "Payments" },
  { cmd: "/change",        desc: "Log or explain a change event",                 group: "Changes" },
  { cmd: "/variation",     desc: "Draft a variation order submission",             group: "Changes" },
  { cmd: "/dispute",       desc: "Help structure a dispute position",             group: "Changes" },
  { cmd: "/eot",           desc: "Analyse extension of time entitlement",         group: "Changes" },
  { cmd: "/programme",     desc: "Review programme delays and critical path",     group: "Programme" },
  { cmd: "/delay",         desc: "Analyse delay events and impact",               group: "Programme" },
  { cmd: "/evidence",      desc: "List evidence gaps and coverage",               group: "Evidence" },
  { cmd: "/notice",        desc: "Draft a contractual notice",                    group: "Evidence" },
  { cmd: "/correspondence",desc: "Help draft a formal correspondence",            group: "Evidence" },
  { cmd: "/final-account", desc: "Assist with final account preparation",         group: "Final Account" },
  { cmd: "/settlement",    desc: "Summarise agreed and disputed sums",            group: "Final Account" },
  { cmd: "/supplier",      desc: "Query about a supplier or subcontractor",       group: "General" },
  { cmd: "/contract",      desc: "Explain a contract clause or provision",        group: "General" },
  { cmd: "/report",        desc: "Draft a management report summary",             group: "General" },
  { cmd: "/help",          desc: "Show all available commands",                   group: "General" },
];

/* ─── Context-aware suggestions per route ───────────────────────────── */

const ROUTE_SUGGESTIONS: Record<string, string[]> = {
  "/changes/": [
    "Draft quotation narrative",
    "Check NEC4 compliance",
    "What's the deemed acceptance risk?",
  ],
  "/applications/": [
    "Check HGCRA compliance",
    "Calculate PLN cutoff",
    "Draft pay less notice",
  ],
  "/projects/": [
    "Summarise commercial position",
    "Flag risks",
    "Draft board pack narrative",
  ],
  "/cvr": [
    "Explain CVR position",
    "Analyse current margin",
    "Cash flow forecast",
  ],
  "/final-accounts": [
    "Assist with final account",
    "Summarise agreed and disputed sums",
    "Draft settlement letter",
  ],
  "/evidence": [
    "List evidence gaps",
    "Draft contractual notice",
    "Help draft formal correspondence",
  ],
  "/schedule": [
    "Programme delay review",
    "Analyse delay events",
    "EoT entitlement check",
  ],
};

const DEFAULT_SUGGESTIONS = [
  "What can you help me with?",
  "Explain NEC4 clause 60.1",
  "HGCRA payment timeline",
];

function getPageSuggestions(pathname: string): string[] {
  for (const [route, suggestions] of Object.entries(ROUTE_SUGGESTIONS)) {
    if (pathname.includes(route)) return suggestions;
  }
  return DEFAULT_SUGGESTIONS;
}

/* ─── Mutation detection ─────────────────────────────────────────────── */

const MUTATION_PATTERNS = [
  /I suggest(?:ing)? (?:you )?(.+?)(?:\.|$)/i,
  /You should (.+?)(?:\.|$)/i,
  /Would you like me to (.+?)(?:\?|$)/i,
  /I recommend(?:ing)? (.+?)(?:\.|$)/i,
  /Shall I (.+?)(?:\?|$)/i,
];

function detectMutationSuggestion(text: string): string | null {
  for (const pattern of MUTATION_PATTERNS) {
    const match = pattern.exec(text);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

/* ─── Markdown renderer ─────────────────────────────────────────────── */

function renderMarkdown(text: string): React.ReactNode {
  if (!text) return null;
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = (key: string) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${key}`} className="space-y-0.5 my-1.5 pl-3">
          {listItems.map((item, i) => (
            <li key={i} className="flex items-start gap-1.5 text-[13px]">
              <span className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full" style={{ background: "var(--violet, #7c3aed)" }} />
              <span style={{ color: "var(--text-primary)" }}>{inlineMarkdown(item)}</span>
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, idx) => {
    const key = String(idx);
    if (/^#{1,3}\s/.test(line)) {
      flushList(key);
      elements.push(
        <p key={key} className="text-[13px] font-semibold mt-2 mb-0.5" style={{ color: "var(--text-primary)" }}>
          {inlineMarkdown(line.replace(/^#{1,3}\s/, ""))}
        </p>
      );
    } else if (/^[-*]\s/.test(line)) {
      listItems.push(line.replace(/^[-*]\s/, ""));
    } else if (/^\d+\.\s/.test(line)) {
      listItems.push(line.replace(/^\d+\.\s/, ""));
    } else if (line.trim() === "") {
      flushList(key);
      if (elements.length > 0) elements.push(<div key={key} className="h-1" />);
    } else {
      flushList(key);
      elements.push(
        <p key={key} className="text-[13px] leading-relaxed" style={{ color: "var(--text-primary)" }}>
          {inlineMarkdown(line)}
        </p>
      );
    }
  });

  flushList("end");
  return <>{elements}</>;
}

function inlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="text-[12px] px-1 py-0.5 rounded font-mono" style={{ background: "rgba(139,92,246,0.1)", color: "var(--violet)" }}>
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

/* ─── Copy button ─────────────────────────────────────────────────── */

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }, [text]);

  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] opacity-0 group-hover:opacity-100 transition-opacity"
      style={{ color: "var(--text-muted)" }}
      title="Copy message"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

/* ─── Mutation Suggestion Card ───────────────────────────────────────── */

interface MutationCardProps {
  suggestion: MutationSuggestion;
  onConfirm: (id: string) => void;
  onDismiss: (id: string) => void;
}

function MutationCard({ suggestion, onConfirm, onDismiss }: MutationCardProps) {
  if (suggestion.dismissed) return null;
  return (
    <div
      className="mx-4 my-2 rounded-xl border p-3"
      style={{ borderColor: "rgba(245,158,11,0.4)", background: "rgba(255,251,235,0.8)" }}
    >
      <div className="flex items-start gap-2 mb-2">
        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "#d97706" }} />
        <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "#d97706" }}>
          AI Suggestion
        </span>
      </div>
      <p className="text-[12.5px] mb-3" style={{ color: "var(--text-primary)" }}>
        &ldquo;{suggestion.text}&rdquo;
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onConfirm(suggestion.id)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium transition-colors"
          style={{ background: "var(--primary)", color: "white" }}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Confirm Action
        </button>
        <button
          type="button"
          onClick={() => onDismiss(suggestion.id)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium transition-colors"
          style={{ background: "var(--bg-muted)", color: "var(--text-secondary)" }}
        >
          <X className="w-3.5 h-3.5" />
          Dismiss
        </button>
      </div>
    </div>
  );
}

/* ─── CE Scanner ─────────────────────────────────────────────────────── */

function CEScannerTab() {
  const [inputText, setInputText] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CEScans | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);

  const scan = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const notificationDeadline = eventDate
      ? new Date(new Date(eventDate).getTime() + 56 * 24 * 60 * 60 * 1000).toLocaleDateString("en-GB")
      : "Calculate from event date";

    const prompt = `You are a UK construction commercial specialist. Analyse the following site instruction, RFI response, or site event for NEC4 Compensation Event entitlement under Clause 60.1.

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
          context: { mode: "ce_scanner" },
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
        const parsed = JSON.parse(jsonMatch[0]) as CEScans;
        parsed.notificationDeadline = notificationDeadline;
        setResult(parsed);
      } else {
        throw new Error("Could not parse AI response");
      }
    } catch {
      setError("Unable to analyse the text. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const strengthColour = (s: string) => {
    if (s === "High") return { color: "#dc2626", background: "#fef2f2" };
    if (s === "Medium") return { color: "#d97706", background: "#fffbeb" };
    return { color: "#16a34a", background: "#f0fdf4" };
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        <div>
          <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
            Paste instruction, RFI, or site event description
          </label>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full rounded-xl border p-3 text-[12.5px] outline-none resize-none transition-colors focus:border-[var(--violet)]"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)", background: "var(--bg-subtle)", minHeight: 100 }}
            placeholder="e.g. Site Instruction #14: Contractor instructed to extend drainage run by 35m due to unforeseen buried services discovered at chainage 120..."
            rows={4}
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
            Date of event
          </label>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="form-input h-9 text-sm w-full"
          />
        </div>

        {error && (
          <div
            className="rounded-xl p-3 border text-[12.5px]"
            style={{ borderColor: "rgba(220,38,38,0.3)", background: "#fef2f2", color: "#dc2626" }}
          >
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <div className="rounded-xl border p-4 space-y-3" style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}>
              <h3 className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>
                CE Entitlement Assessment
              </h3>
              {result.clauses.length === 0 ? (
                <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>No CE grounds identified in the provided text.</p>
              ) : (
                result.clauses.map((clause, i) => (
                  <div key={i} className="rounded-lg border p-3 space-y-1.5" style={{ borderColor: "var(--border)", background: "white" }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[12px] font-mono font-semibold" style={{ color: "var(--primary)" }}>
                        NEC4 {clause.code}
                      </span>
                      <span
                        className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full"
                        style={strengthColour(clause.strength)}
                      >
                        {clause.strength} Entitlement
                      </span>
                    </div>
                    <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{clause.description}</p>
                    <p className="text-[11.5px] font-medium" style={{ color: "var(--text-muted)" }}>
                      Action: {clause.action}
                    </p>
                  </div>
                ))
              )}
            </div>

            {result.notificationRequired && (
              <div
                className="rounded-xl p-3 border"
                style={{ borderColor: "rgba(220,38,38,0.3)", background: "#fef2f2" }}
              >
                <p className="text-[12px] font-semibold" style={{ color: "#dc2626" }}>
                  Notification Required
                </p>
                <p className="text-[11.5px] mt-1" style={{ color: "#991b1b" }}>
                  8-week deadline: <strong>{result.notificationDeadline}</strong>
                </p>
              </div>
            )}

            {result.recommendedDescription && (
              <div className="space-y-1.5">
                <label className="block text-[11px] font-semibold" style={{ color: "var(--text-secondary)" }}>
                  Recommended CE Description
                </label>
                <textarea
                  defaultValue={result.recommendedDescription}
                  className="w-full rounded-xl border p-3 text-[12.5px] outline-none resize-none"
                  style={{ borderColor: "var(--border)", color: "var(--text-primary)", background: "white" }}
                  rows={3}
                />
              </div>
            )}

            {!showCreateConfirm ? (
              <button
                type="button"
                onClick={() => setShowCreateConfirm(true)}
                className="w-full btn btn-primary btn-sm"
              >
                <FileText className="w-4 h-4" />
                Create CE from this Scan
              </button>
            ) : (
              <div
                className="rounded-xl border p-4 space-y-3"
                style={{ borderColor: "rgba(139,92,246,0.4)", background: "rgba(245,243,255,0.8)" }}
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "var(--violet)" }} />
                  <div>
                    <p className="text-[12.5px] font-semibold" style={{ color: "var(--text-primary)" }}>
                      Create Change Event with this description?
                    </p>
                    <p className="text-[11.5px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                      This will open the Change Event wizard pre-filled with the AI-suggested data. You will review and confirm all details before saving.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a
                    href="/app/changes?ai_prefill=1"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-medium"
                    style={{ background: "var(--primary)", color: "white" }}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Open CE Wizard
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowCreateConfirm(false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-medium"
                    style={{ background: "var(--bg-muted)", color: "var(--text-secondary)" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-4 pb-4 border-t pt-3 flex-shrink-0" style={{ borderColor: "var(--border)" }}>
        <button
          type="button"
          onClick={() => void scan()}
          disabled={!inputText.trim() || loading}
          className="w-full btn btn-primary btn-sm disabled:opacity-40"
          style={{ background: "var(--violet)", borderColor: "var(--violet)" }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanSearch className="w-4 h-4" />}
          {loading ? "Scanning…" : "Scan for CE Entitlement"}
        </button>
      </div>
    </div>
  );
}

/* ─── Contract Review Tab ────────────────────────────────────────────── */

function ContractReviewTab() {
  const [contractText, setContractText] = useState("");
  const [contractType, setContractType] = useState("NEC4");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ContractAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    "disputeResolution": "e.g. Adjudication per HGCRA"
  }
}

Only return valid JSON, no other text.`;

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: prompt }],
          context: { mode: "contract_analyser" },
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
      setError("Unable to analyse the contract. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const riskStyle = (level: string) => {
    if (level === "Red") return { border: "rgba(220,38,38,0.4)", bg: "#fef2f2", badge: { color: "#dc2626", background: "#fecaca" } };
    if (level === "Amber") return { border: "rgba(245,158,11,0.4)", bg: "#fffbeb", badge: { color: "#d97706", background: "#fde68a" } };
    return { border: "rgba(22,163,74,0.4)", bg: "#f0fdf4", badge: { color: "#16a34a", background: "#bbf7d0" } };
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
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
          <label className="block text-[11px] font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
            Paste contract clauses or special conditions
          </label>
          <textarea
            value={contractText}
            onChange={(e) => setContractText(e.target.value)}
            className="w-full rounded-xl border p-3 text-[12.5px] outline-none resize-none transition-colors focus:border-[var(--violet)]"
            style={{ borderColor: "var(--border)", color: "var(--text-primary)", background: "var(--bg-subtle)", minHeight: 120 }}
            placeholder="Paste contract clauses, amendments, or special conditions here…"
            rows={5}
          />
        </div>

        {error && (
          <div
            className="rounded-xl p-3 border text-[12.5px]"
            style={{ borderColor: "rgba(220,38,38,0.3)", background: "#fef2f2", color: "#dc2626" }}
          >
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {result.risks.length > 0 && (
              <div>
                <h3 className="text-[12px] font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                  Risk Flags
                </h3>
                <div className="space-y-2">
                  {result.risks.map((risk, i) => {
                    const style = riskStyle(risk.level);
                    return (
                      <div
                        key={i}
                        className="rounded-xl border p-3 space-y-1"
                        style={{ borderColor: style.border, background: style.bg }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11.5px] font-mono font-semibold" style={{ color: "var(--text-secondary)" }}>
                            {risk.clause}
                          </span>
                          <span
                            className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                            style={style.badge}
                          >
                            {risk.level}
                          </span>
                        </div>
                        <p className="text-[12.5px]" style={{ color: "var(--text-primary)" }}>{risk.issue}</p>
                        <p className="text-[11.5px]" style={{ color: "var(--text-muted)" }}>Action: {risk.action}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {result.missingProtections.length > 0 && (
              <div>
                <h3 className="text-[12px] font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                  Missing Protections
                </h3>
                <ul className="space-y-1.5">
                  {result.missingProtections.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-[12px]" style={{ color: "var(--text-secondary)" }}>
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: "#d97706" }} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.keyTerms && (
              <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}>
                <h3 className="text-[12px] font-semibold mb-2" style={{ color: "var(--text-primary)" }}>
                  Key Commercial Terms
                </h3>
                <dl className="space-y-1">
                  {Object.entries(result.keyTerms).map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <dt className="text-[11.5px] font-medium w-28 flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                        {k.replace(/([A-Z])/g, " $1").trim()}:
                      </dt>
                      <dd className="text-[11.5px]" style={{ color: "var(--text-secondary)" }}>{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-4 pb-4 border-t pt-3 flex-shrink-0" style={{ borderColor: "var(--border)" }}>
        <button
          type="button"
          onClick={() => void analyse()}
          disabled={!contractText.trim() || loading}
          className="w-full btn btn-primary btn-sm disabled:opacity-40"
          style={{ background: "var(--violet)", borderColor: "var(--violet)" }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSearch className="w-4 h-4" />}
          {loading ? "Analysing…" : "Analyse Contract"}
        </button>
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────── */

const MAX_CREDITS = 100;

const INITIAL_MESSAGE: Message = {
  id: "0",
  role: "assistant",
  content: "Hi! I'm your **MeasureDeck AI Copilot** — a specialist construction commercial assistant.\n\nAsk me anything about your project, or type **/** to see all available commands.",
};

export function CopilotView({ pageContext }: CopilotViewProps) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<CopilotTab>("chat");
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [creditsUsed, setCreditsUsed] = useState(12);
  const [showCommands, setShowCommands] = useState(false);
  const [cmdIndex, setCmdIndex] = useState(0);
  const [mutationSuggestions, setMutationSuggestions] = useState<MutationSuggestion[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const hasCEScanner = getFlag("ai_ce_identifier");
  const hasContractAnalyser = getFlag("ai_contract_analyser");

  const entityLabel = pageContext
    ? `${pageContext.entity_type.replace(/_/g, " ")}${pageContext.entity_data?.name ? ` — ${String(pageContext.entity_data.name)}` : ""}`
    : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredCommands = input.startsWith("/")
    ? SLASH_COMMANDS.filter((c) => c.cmd.startsWith(input.split(" ")[0].toLowerCase()))
    : [];

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInput(val);
    setCmdIndex(0);
    setShowCommands(val.startsWith("/") && val.trim().length > 0);
  };

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: content.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setShowCommands(false);
    setIsLoading(true);

    const systemPrompt = pageContext ? buildSystemPrompt(pageContext) : undefined;

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          context: {
            pathname,
            page: pathname?.split("/").at(-1),
            ...(systemPrompt ? { systemPrompt } : {}),
          },
        }),
      });

      if (!res.ok) throw new Error("Request failed");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantText = "";
      const assistantId = (Date.now() + 1).toString();

      setMessages((prev) => [...prev, { id: assistantId, role: "assistant", content: "" }]);

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
              const delta = parsed?.choices?.[0]?.delta?.content ?? "";
              assistantText += delta;
              setMessages((prev) =>
                prev.map((m) => (m.id === assistantId ? { ...m, content: assistantText } : m))
              );
            } catch { /* ignore */ }
          }
        }
      }

      const mutationText = detectMutationSuggestion(assistantText);
      if (mutationText) {
        const suggestionId = `s-${Date.now()}`;
        setMutationSuggestions((prev) => [
          ...prev,
          { id: suggestionId, messageId: assistantId, text: mutationText, dismissed: false },
        ]);

        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (user && pageContext) {
            await createAuditEvent(supabase, {
              workspace_id: pageContext.workspace_id,
              user_id: user.id,
              action: "ai_suggestion_shown",
              resource_type: pageContext.entity_type,
              resource_id: pageContext.entity_id ?? "general",
              new_values: { suggestion: mutationText },
            });
          }
        } catch { /* audit failures must not break flow */ }
      }

      setCreditsUsed((prev) => Math.min(prev + 2, MAX_CREDITS));
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: "assistant", content: "Sorry, I couldn't process that request. Please try again." },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, pageContext, pathname]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommands && filteredCommands.length > 0) {
      if (e.key === "ArrowDown") { e.preventDefault(); setCmdIndex((i) => Math.min(i + 1, filteredCommands.length - 1)); return; }
      if (e.key === "ArrowUp")   { e.preventDefault(); setCmdIndex((i) => Math.max(i - 1, 0)); return; }
      if (e.key === "Tab" || (e.key === "Enter" && showCommands)) {
        e.preventDefault();
        selectCommand(filteredCommands[cmdIndex].cmd);
        return;
      }
    }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendMessage(input); }
    if (e.key === "Escape") setShowCommands(false);
  };

  const selectCommand = (cmd: string) => {
    setInput(cmd + " ");
    setShowCommands(false);
    inputRef.current?.focus();
  };

  const clearConversation = () => {
    setMessages([INITIAL_MESSAGE]);
    setCreditsUsed(0);
    setMutationSuggestions([]);
  };

  const handleMutationConfirm = async (id: string) => {
    const suggestion = mutationSuggestions.find((s) => s.id === id);
    if (!suggestion) return;

    setMutationSuggestions((prev) => prev.map((s) => s.id === id ? { ...s, dismissed: true } : s));

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "assistant",
        content: "Action confirmed. Please use the relevant form or wizard to make this change — I cannot modify data directly.",
      },
    ]);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user && pageContext) {
        await createAuditEvent(supabase, {
          workspace_id: pageContext.workspace_id,
          user_id: user.id,
          action: "ai_suggestion_confirmed",
          resource_type: pageContext.entity_type,
          resource_id: pageContext.entity_id ?? "general",
          new_values: { suggestion: suggestion.text },
        });
      }
    } catch { /* audit failures must not break flow */ }
  };

  const handleMutationDismiss = (id: string) => {
    setMutationSuggestions((prev) => prev.map((s) => s.id === id ? { ...s, dismissed: true } : s));
  };

  const suggestions = getPageSuggestions(pathname ?? "/");

  const groupedCommands = filteredCommands.reduce<Record<string, typeof filteredCommands>>((acc, c) => {
    if (!acc[c.group]) acc[c.group] = [];
    acc[c.group].push(c);
    return acc;
  }, {});

  const availableTabs: { id: CopilotTab; label: string }[] = [
    { id: "chat", label: "Chat" },
    ...(hasCEScanner ? [{ id: "ce-scanner" as CopilotTab, label: "CE Scanner" }] : []),
    ...(hasContractAnalyser ? [{ id: "contract" as CopilotTab, label: "Contract" }] : []),
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {(hasCEScanner || hasContractAnalyser) && availableTabs.length > 1 && (
        <div
          className="flex items-center gap-0.5 px-3 py-1.5 border-b flex-shrink-0"
          style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}
        >
          {availableTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11.5px] font-medium transition-all",
                activeTab === tab.id ? "bg-white shadow-sm" : "hover:bg-white/60"
              )}
              style={{ color: activeTab === tab.id ? "var(--primary)" : "var(--text-muted)" }}
            >
              {tab.id === "ce-scanner" && <ScanSearch className="w-3 h-3" />}
              {tab.id === "contract" && <FileSearch className="w-3 h-3" />}
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {activeTab === "ce-scanner" && <CEScannerTab />}
      {activeTab === "contract" && <ContractReviewTab />}

      {activeTab === "chat" && (
        <>
          <div
            className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <MapPin className="w-3 h-3 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
              {entityLabel ? (
                <span className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>
                  Viewing: <strong>{entityLabel}</strong>
                </span>
              ) : (
                <span className="text-[11px] font-mono truncate" style={{ color: "var(--text-muted)" }}>
                  {pathname ?? "/"}
                </span>
              )}
            </div>
            {messages.length > 1 && (
              <button
                type="button"
                onClick={clearConversation}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] hover:bg-[var(--bg-muted)] transition-colors flex-shrink-0"
                style={{ color: "var(--text-muted)" }}
                title="Clear conversation"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>

          {messages.length === 1 && (
            <div className="flex items-center gap-1.5 px-4 py-2 border-b flex-shrink-0 flex-wrap" style={{ borderColor: "var(--border)" }}>
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => void sendMessage(s)}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] font-medium transition-colors",
                    "border hover:border-[var(--violet)] hover:bg-[var(--violet-bg)]"
                  )}
                  style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
                >
                  <Sparkles className="w-3 h-3" style={{ color: "var(--violet)" }} />
                  {s}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg) => (
              <React.Fragment key={msg.id}>
                <div className={cn("flex group", msg.role === "user" ? "justify-end" : "justify-start")}>
                  {msg.role === "assistant" ? (
                    <div className="max-w-[92%]">
                      <div
                        className="rounded-xl p-3 border"
                        style={{ borderColor: "rgba(139,92,246,0.2)", background: "var(--violet-bg, #f5f3ff)" }}
                      >
                        <div className="flex items-center gap-1.5 mb-2">
                          <Sparkles className="w-3.5 h-3.5" style={{ color: "var(--violet)" }} />
                          <span className="text-[11px] font-semibold" style={{ color: "var(--violet)" }}>
                            MeasureDeck AI
                          </span>
                        </div>
                        {msg.content ? (
                          renderMarkdown(msg.content)
                        ) : isLoading ? (
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--violet)", animationDelay: "0ms" }} />
                            <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--violet)", animationDelay: "150ms" }} />
                            <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: "var(--violet)", animationDelay: "300ms" }} />
                          </div>
                        ) : null}
                      </div>
                      {msg.content && <div className="flex justify-start mt-0.5"><CopyButton text={msg.content} /></div>}
                    </div>
                  ) : (
                    <div className="max-w-[85%] group">
                      <div
                        className="rounded-xl px-3 py-2"
                        style={{ background: "var(--primary)", color: "white" }}
                      >
                        <p className="text-[13px] whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    </div>
                  )}
                </div>

                {mutationSuggestions
                  .filter((s) => s.messageId === msg.id && !s.dismissed)
                  .map((s) => (
                    <MutationCard
                      key={s.id}
                      suggestion={s}
                      onConfirm={(id) => void handleMutationConfirm(id)}
                      onDismiss={handleMutationDismiss}
                    />
                  ))}
              </React.Fragment>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {showCommands && Object.keys(groupedCommands).length > 0 && (
            <div
              className="mx-3 mb-1 rounded-xl border shadow-lg overflow-hidden max-h-[200px] overflow-y-auto"
              style={{ background: "white", borderColor: "var(--border)" }}
            >
              {Object.entries(groupedCommands).map(([group, cmds]) => (
                <div key={group}>
                  <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    {group}
                  </p>
                  {cmds.map((c) => {
                    const globalIdx = filteredCommands.indexOf(c);
                    return (
                      <button
                        key={c.cmd}
                        type="button"
                        onClick={() => selectCommand(c.cmd)}
                        className={cn(
                          "w-full flex items-center gap-2 px-3 py-2 text-left transition-colors",
                          globalIdx === cmdIndex ? "bg-[var(--bg-muted)]" : "hover:bg-[var(--bg-subtle)]"
                        )}
                      >
                        <span className="text-[12px] font-semibold font-mono" style={{ color: "var(--primary)", minWidth: 120 }}>
                          {c.cmd}
                        </span>
                        <span className="text-[12px] truncate" style={{ color: "var(--text-muted)" }}>
                          {c.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          <div className="px-3 pb-3 pt-1 border-t flex-shrink-0" style={{ borderColor: "var(--border)" }}>
            <div
              className="flex items-end gap-2 rounded-xl border p-2 transition-colors focus-within:border-[var(--violet)]"
              style={{ borderColor: "var(--border)" }}
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything… or type / for commands"
                rows={1}
                className="flex-1 resize-none bg-transparent text-[13px] outline-none"
                style={{ color: "var(--text-primary)", maxHeight: 80 }}
              />
              <button
                type="button"
                onClick={() => void sendMessage(input)}
                disabled={!input.trim() || isLoading}
                className="flex-shrink-0 btn btn-primary btn-icon btn-sm disabled:opacity-40"
                aria-label="Send"
                style={{ background: "var(--violet)", borderColor: "var(--violet)" }}
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center gap-2 mt-2 px-1">
              <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--bg-subtle)" }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${(creditsUsed / MAX_CREDITS) * 100}%`,
                    background: creditsUsed > 80 ? "var(--danger)" : creditsUsed > 60 ? "var(--warning)" : "var(--violet)",
                  }}
                />
              </div>
              <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                {creditsUsed}/{MAX_CREDITS} credits
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CopilotView;

"use client";

import { useState, useCallback } from "react";
import { Sparkles, RefreshCw, Copy, CheckCircle2, AlertTriangle } from "lucide-react";

// ─── Narrative content ─────────────────────────────────────────────────────

const NARRATIVES = {
  executive: `Executive Summary — CE-025 Unforeseen Igneous Rock
Generated: 14 May 2025 | Model: MeasureDeck AI v2.1 | Confidence: 87%

This compensation event arises from the contractor's encounter with unforeseen igneous rock (dolerite) during bulk excavation works, a condition that was not indicated in the Ground Investigation Report dated March 2023. The contractor issued an Early Warning Notice on the same day as discovery (14 March 2025), demonstrating exemplary NEC4 contract administration.

Financial Impact:
The contractor's assessed value of £48,500 reflects the actual cost of specialist plant (hydraulic rock-breaker), additional labour, and extended site preliminaries over 12 working days. The PM's current assessment of £41,200 disputes the disposal costs and applies a concurrent delay deduction of 4 days.

Programme Impact:
A 12-day delay to the critical groundworks activity has been demonstrated through Time Impact Analysis. The PM has accepted 8 days, attributing 4 days to concurrent contractor delays in mobilising specialist plant.

Recommendation:
Evidence strength is rated 4/5. The primary weakness is the absence of a laboratory report confirming the dolerite classification, which would strengthen the "unforeseen" argument. Recommend obtaining this report before the acceptance deadline of 22 April 2025. The disposal cost dispute (£2,940) may be settled by providing the 2 missing skip manifests.`,

  technical: `Technical Narrative — CE-025 Unforeseen Physical Conditions
Generated: 14 May 2025 | Model: MeasureDeck AI v2.1 | Confidence: 87%

1. Physical Conditions Encountered

During bulk excavation for pile caps and ground beams at grid lines C–F / 3–7, the Contractor encountered a band of igneous rock (dolerite) at approximately -3.2m below existing ground level (BGL). The rock band presented as a dense, crystalline formation extending across the full width of the excavation, requiring specialist hydraulic rock-breaking plant to excavate.

2. Ground Investigation Report Discrepancy

The pre-contract Ground Investigation Report (GIR, March 2023) identified soil strata consisting of made ground (0–1.5m BGL), firm to stiff clay (1.5–3.5m BGL), and dense gravel/sand below. No igneous intrusion was identified at formation level. The probability of encountering dolerite at this horizon was not considered significant by the GIR authors.

3. NEC4 Clause 60.1(12) Analysis

The test under Clause 60.1(12) is whether "an experienced contractor" would have judged the encountered conditions to have "such a small chance of occurring that it would have been unreasonable to have allowed for them." Given that:
(a) the GIR did not identify rock at this horizon,
(b) dolerite intrusions are geologically rare in this formation,
(c) no boreholes in the immediate vicinity indicated rock,
the threshold for a compensation event is clearly met.

4. Cost Assessment

Direct additional costs are assessed as follows:
- Hydraulic rock-breaker (12 days @ £1,850/day): £22,200
- Additional labour gang: £9,000
- Specialist subcontract survey: £3,800
- Disposal (14 loads @ £420/load): £5,880
- Extended site prelims: £4,560
- Risk allowance (10%): £3,000
- OH&P (8%): £3,860

The PM's proposed deduction of £7,300 relates primarily to the disposal claim and a concurrent delay reduction.`,

  legal: `Legal Narrative — CE-025 Entitlement Assessment
Generated: 14 May 2025 | Model: MeasureDeck AI v2.1 | Confidence: 87%

Under NEC4 Clause 60.1(12), the contractor is entitled to a compensation event where physical conditions within the Site are encountered which an experienced contractor would have judged at the Contract Date to have such a small chance of occurring that it would have been unreasonable to have allowed for them.

Entitlement Analysis:

The Contractor's entitlement is established on three grounds:

First, the Ground Investigation Report (March 2023), which formed part of the Scope documents, did not disclose the presence of igneous rock at the relevant formation level. The absence of this information in the pre-contract information provided by the Employer is a material factor in assessing what an "experienced contractor" would have reasonably anticipated.

Second, the notification obligations under Clause 61.3 were satisfied within 8 weeks of the Contractor becoming aware of the event (notification issued 18 March 2025, discovery 14 March 2025).

Third, the quotation was submitted within the 21-day period prescribed by Clause 62.3, and was accompanied by supporting documentation including plant hire records, daywork sheets, and a delay analysis prepared under TIA methodology.

Programme Entitlement:

Extension of Time is claimed under Clause 63.5. The TIA demonstrates 12 days delay to a critical path activity. The concurrent contractor delay of 4 days (late mobilisation) is acknowledged; however, this does not extinguish the remaining 8-day entitlement, which the PM has accepted.

Risk Allocation:

The physical conditions risk allocated between the parties under Schedule Part 1 does not include igneous rock intrusion. The Employer retains this risk under the default risk allocation of NEC4.`,

  pmDraft: `DRAFT PM RESPONSE — CE-025
Generated: 14 May 2025 | Model: MeasureDeck AI v2.1
⚠ AI-GENERATED DRAFT — MUST BE REVIEWED AND EDITED BY QUALIFIED QS BEFORE SENDING

Dear Rachel Okafor,

Further to your assessment of £41,200 for CE-025 (unforeseen igneous rock — groundworks), we write to address the two areas of disagreement and to provide the additional information requested in your letter of 15 April 2025.

1. Disposal Costs (Dolerite Removal)

We note that your assessment reduces the disposal claim to 7 loads (£2,940) on the basis that 2 manifests were not provided at the time of quotation submission. We are pleased to advise that we have now obtained both outstanding skip lorry manifests from Davidson Haulage Ltd (copies enclosed). These confirm that 14 loads of dolerite were removed from the site during the period 14–25 March 2025.

We respectfully request that you reinstate the full disposal claim of £5,880 (14 loads × £420/load), which is consistent with the market rate range of £350–£450/load confirmed in your own rate library.

2. Concurrent Delay

We acknowledge your assessment of 8 days' Extension of Time. However, we maintain that the 4-day concurrent delay attributed to late mobilisation of the hydraulic rock-breaker is not borne out by the contemporaneous site records. Our daily site diaries confirm that the rock-breaker was ordered on the same day as the Early Warning Notice (14 March 2025) and arrived on site on 15 March 2025 — the earliest available delivery slot.

We therefore request that the 12-day Extension of Time claim be reconsidered.

We trust that this additional information is satisfactory and look forward to agreeing CE-025 at the earliest opportunity.

Yours sincerely,
[NAME]
Quantity Surveyor`,
};

type Tab = "executive" | "technical" | "legal" | "pmDraft";

const TAB_LABELS: { id: Tab; label: string }[] = [
  { id: "executive", label: "Executive Summary" },
  { id: "technical", label: "Technical Narrative" },
  { id: "legal", label: "Legal Narrative" },
  { id: "pmDraft", label: "PM Response Draft" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function AINarrativePage() {
  const [activeTab, setActiveTab] = useState<Tab>("executive");
  const [content, setContent] = useState<Record<Tab, string>>(NARRATIVES);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleRegenerate = useCallback(() => {
    setShowConfirm(true);
  }, []);

  const confirmRegenerate = useCallback(() => {
    setShowConfirm(false);
    setGenerating(true);
    setTimeout(() => setGenerating(false), 2000);
  }, []);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(content[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [content, activeTab]);

  const wordCount = content[activeTab].split(/\s+/).filter(Boolean).length;

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* AI Confidence Summary */}
      <div
        className="card p-5"
        style={{ background: "rgba(139,92,246,0.04)", borderColor: "rgba(139,92,246,0.2)" }}
      >
        <div className="flex items-center gap-3 mb-4">
          <Sparkles size={18} style={{ color: "#8B5CF6" }} />
          <div>
            <div className="text-3xl font-bold" style={{ color: "#8B5CF6" }}>
              87%
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              AI Confidence Score
            </div>
          </div>
        </div>

        {/* Tab selector */}
        <div className="flex items-center gap-2 flex-wrap">
          {TAB_LABELS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className="btn btn-sm text-xs"
              style={{
                background: activeTab === id ? "#8B5CF6" : "rgba(139,92,246,0.08)",
                color: activeTab === id ? "#fff" : "#8B5CF6",
                border: `1px solid ${activeTab === id ? "#8B5CF6" : "rgba(139,92,246,0.2)"}`,
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Narrative Content */}
      <div className="card overflow-hidden">
        <div
          className="px-5 py-3 border-b flex items-center justify-between flex-wrap gap-2"
          style={{ borderColor: "var(--border)", background: "var(--bg-muted)" }}
        >
          <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
            {TAB_LABELS.find((t) => t.id === activeTab)?.label}
          </span>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-ghost btn-sm text-xs"
              onClick={handleCopy}
            >
              {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              className="btn btn-ghost btn-sm text-xs"
              onClick={handleRegenerate}
              disabled={generating}
            >
              <RefreshCw size={12} className={generating ? "animate-spin" : ""} />
              {generating ? "Generating..." : "Regenerate"}
            </button>
          </div>
        </div>

        {/* Confirm dialog */}
        {showConfirm && (
          <div
            className="px-5 py-4 border-b"
            style={{
              borderColor: "rgba(245,158,11,0.3)",
              background: "rgba(245,158,11,0.05)",
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} style={{ color: "var(--warning)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--warning)" }}>
                Confirm Regeneration
              </span>
            </div>
            <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>
              This will replace the current narrative with a newly generated version. The existing
              text will be lost unless you have copied it.
            </p>
            <div className="flex items-center gap-2">
              <button
                className="btn btn-sm"
                style={{ background: "var(--warning)", color: "#fff" }}
                onClick={confirmRegenerate}
              >
                Yes, Regenerate
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* PM Draft Warning */}
        {activeTab === "pmDraft" && (
          <div
            className="px-5 py-3 border-b flex items-start gap-2"
            style={{ borderColor: "rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.06)" }}
          >
            <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" style={{ color: "var(--success)" }} />
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              <strong>AI-Generated Draft</strong> — Must be reviewed and edited by a qualified QS before
              sending. Do not send directly.
            </p>
          </div>
        )}

        {/* Content */}
        <div className="p-5">
          {generating ? (
            <div className="space-y-3">
              {[90, 80, 95, 70, 85, 75, 88].map((w, i) => (
                <div
                  key={i}
                  className="h-3 rounded-full animate-pulse"
                  style={{ width: `${w}%`, background: "var(--bg-muted)" }}
                />
              ))}
            </div>
          ) : (
            <textarea
              className="form-input text-sm leading-relaxed resize-none w-full min-h-[360px]"
              value={content[activeTab]}
              onChange={(e) =>
                setContent((prev) => ({ ...prev, [activeTab]: e.target.value }))
              }
            />
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 border-t flex items-center justify-between"
          style={{ borderColor: "var(--border)", background: "var(--bg-muted)" }}
        >
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {wordCount} words
          </span>
          <button className="btn btn-ghost btn-sm text-xs">
            <Copy size={11} />
            Export PDF
          </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div
        className="card p-4"
        style={{ background: "var(--bg-muted)", borderColor: "var(--border)" }}
      >
        <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
          This narrative was generated by AI and is provided for reference only. All content must be
          reviewed by a qualified professional before use. MeasureDeck AI may make errors.
        </p>
      </div>
    </div>
  );
}

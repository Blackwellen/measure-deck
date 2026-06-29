"use client";

import { useState } from "react";
import { Plus, AlertCircle } from "lucide-react";
import { CE025_PRICING_LINES, type SeedPricingLine } from "@/lib/seed/projects";

function fmt(n: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
  }).format(n);
}

type ViewMode = "contractor" | "pm" | "comparison";

const CATEGORY_COLORS: Record<SeedPricingLine["category"], string> = {
  Plant: "chip-info",
  Labour: "chip-success",
  Subcontract: "chip-violet",
  Prelims: "chip-muted",
  Disposal: "chip-warning",
  Risk: "chip-cyan",
  "OH&P": "chip-primary",
};

// Comparison summary table data
const COMPARISON_SUMMARY = [
  { category: "Plant",       contractor: 22200, pm: 18500 },
  { category: "Labour",      contractor: 9000,  pm: 9000  },
  { category: "Subcontract", contractor: 3800,  pm: 3800  },
  { category: "Prelims",     contractor: 4560,  pm: 4560  },
  { category: "Disposal",    contractor: 5880,  pm: 3000  },
  { category: "Risk (10%)",  contractor: 3000,  pm: 2340  },
  { category: "OH&P (8%)",   contractor: 3860,  pm: 3000  },
];

const GRAND_CONTRACTOR = COMPARISON_SUMMARY.reduce((s, r) => s + r.contractor, 0);
const GRAND_PM = COMPARISON_SUMMARY.reduce((s, r) => s + r.pm, 0);
const GRAND_VARIANCE = GRAND_CONTRACTOR - GRAND_PM;

export default function PricingDetailPage() {
  const [view, setView] = useState<ViewMode>("comparison");

  const totals = {
    contractor: CE025_PRICING_LINES.reduce((s, l) => s + l.amountContractor, 0),
    pm: CE025_PRICING_LINES.reduce((s, l) => s + l.amountPm, 0),
  };

  return (
    <div className="flex flex-col gap-6">
      {/* View Toggle */}
      <div className="flex items-center gap-2">
        {(["contractor", "pm", "comparison"] as ViewMode[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="btn btn-sm capitalize"
            style={{
              background: view === v ? "var(--primary)" : "var(--bg-muted)",
              color: view === v ? "#fff" : "var(--text-secondary)",
              border: "1px solid",
              borderColor: view === v ? "var(--primary)" : "var(--border)",
            }}
          >
            {v === "comparison" ? "Comparison View" : v === "contractor" ? "Contractor View" : "PM View"}
          </button>
        ))}
      </div>

      {/* Comparison Summary */}
      {view === "comparison" && (
        <div className="card overflow-hidden">
          <div
            className="px-5 py-3 border-b"
            style={{ borderColor: "var(--border)", background: "var(--bg-muted)" }}
          >
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Comparison Summary
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th className="text-right">Contractor</th>
                  <th className="text-right">PM Assessment</th>
                  <th className="text-right">Variance</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_SUMMARY.map(({ category, contractor, pm }) => {
                  const variance = contractor - pm;
                  const hasVariance = variance !== 0;
                  return (
                    <tr
                      key={category}
                      style={
                        hasVariance
                          ? { background: "rgba(245,158,11,0.04)" }
                          : undefined
                      }
                    >
                      <td className="font-medium text-sm">{category}</td>
                      <td className="text-right tabular-nums text-sm">{fmt(contractor)}</td>
                      <td className="text-right tabular-nums text-sm">{fmt(pm)}</td>
                      <td
                        className="text-right tabular-nums text-sm font-semibold"
                        style={{
                          color: hasVariance
                            ? variance > 0
                              ? "var(--danger)"
                              : "var(--success)"
                            : "var(--text-muted)",
                        }}
                      >
                        {variance === 0 ? "—" : `${variance > 0 ? "-" : "+"}${fmt(Math.abs(variance))}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr style={{ background: "var(--bg-muted)", fontWeight: 700 }}>
                  <td className="font-bold text-sm px-4 py-3">Total</td>
                  <td className="text-right tabular-nums text-sm px-4 py-3" style={{ color: "var(--primary)" }}>
                    {fmt(GRAND_CONTRACTOR)}
                  </td>
                  <td className="text-right tabular-nums text-sm px-4 py-3" style={{ color: "var(--warning)" }}>
                    {fmt(GRAND_PM)}
                  </td>
                  <td
                    className="text-right tabular-nums text-sm px-4 py-3"
                    style={{ color: "var(--danger)" }}
                  >
                    -{fmt(GRAND_VARIANCE)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Pricing Line Detail */}
      <div className="card overflow-hidden">
        <div
          className="px-5 py-3 border-b flex items-center justify-between"
          style={{ borderColor: "var(--border)", background: "var(--bg-muted)" }}
        >
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            CE-025 Pricing Breakdown
          </h3>
          <button className="btn btn-primary btn-sm">
            <Plus size={13} />
            Add Line
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10">#</th>
                <th>Description</th>
                <th className="text-right w-16">Qty</th>
                <th className="w-16">Unit</th>
                {view !== "pm" && <th className="text-right w-24">Rate (C)</th>}
                {view !== "pm" && <th className="text-right w-28">Amount (C)</th>}
                {view !== "contractor" && <th className="text-right w-24">Rate (PM)</th>}
                {view !== "contractor" && <th className="text-right w-28">Amount (PM)</th>}
                <th className="w-24">Category</th>
                <th className="w-20">Disputed</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {CE025_PRICING_LINES.map((line, idx) => (
                <tr
                  key={line.id}
                  style={
                    line.isDisputed
                      ? { background: "rgba(239,68,68,0.04)", borderLeft: "3px solid var(--danger)" }
                      : undefined
                  }
                >
                  <td className="font-mono text-xs text-[var(--text-muted)]">{idx + 1}</td>
                  <td className="text-sm font-medium">{line.description}</td>
                  <td className="text-right tabular-nums text-sm">{line.qty}</td>
                  <td className="text-xs text-[var(--text-muted)]">{line.unit}</td>
                  {view !== "pm" && (
                    <td className="text-right tabular-nums text-sm">{fmt(line.rateContractor)}</td>
                  )}
                  {view !== "pm" && (
                    <td
                      className="text-right tabular-nums text-sm font-semibold"
                      style={{ color: "var(--primary)" }}
                    >
                      {fmt(line.amountContractor)}
                    </td>
                  )}
                  {view !== "contractor" && (
                    <td className="text-right tabular-nums text-sm">{fmt(line.ratePm)}</td>
                  )}
                  {view !== "contractor" && (
                    <td
                      className="text-right tabular-nums text-sm font-semibold"
                      style={{ color: "var(--warning)" }}
                    >
                      {fmt(line.amountPm)}
                    </td>
                  )}
                  <td>
                    <span className={`badge text-[10px] ${CATEGORY_COLORS[line.category]}`}>
                      {line.category}
                    </span>
                  </td>
                  <td>
                    {line.isDisputed && (
                      <span className="badge chip-danger text-[10px]">Disputed</span>
                    )}
                  </td>
                  <td className="text-xs" style={{ color: "var(--text-muted)", maxWidth: "200px" }}>
                    {line.notes}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: "var(--bg-muted)", fontWeight: 700 }}>
                <td colSpan={4} className="px-4 py-3 text-sm font-bold">Totals</td>
                {view !== "pm" && <td />}
                {view !== "pm" && (
                  <td
                    className="text-right tabular-nums px-4 py-3 text-sm"
                    style={{ color: "var(--primary)" }}
                  >
                    {fmt(totals.contractor)}
                  </td>
                )}
                {view !== "contractor" && <td />}
                {view !== "contractor" && (
                  <td
                    className="text-right tabular-nums px-4 py-3 text-sm"
                    style={{ color: "var(--warning)" }}
                  >
                    {fmt(totals.pm)}
                  </td>
                )}
                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Dispute Analysis */}
      <div
        className="card p-5"
        style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.02)" }}
      >
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle size={15} style={{ color: "var(--danger)" }} />
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Dispute Analysis
          </h3>
        </div>
        <div
          className="p-4 rounded-lg mb-4"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}
        >
          <div className="text-sm font-semibold mb-1" style={{ color: "var(--danger)" }}>
            PL-05 — Disposal (Dolerite) · Disputed: £2,880
          </div>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            PM disputes 14 loads; accepting 7 loads at same rate (£420/load = £2,940). Two skip lorry
            manifests (loads 13 &amp; 14) are missing.
          </p>
        </div>
        <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
          Settlement Options
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-sm" style={{ background: "var(--success)", color: "#fff" }}>
            Accept PM Position (−{fmt(2940)})
          </button>
          <button className="btn btn-secondary btn-sm">Counter-Propose</button>
          <button className="btn btn-sm" style={{ background: "var(--danger)", color: "#fff" }}>
            Escalate
          </button>
        </div>
      </div>

      {/* Rate Library Reference */}
      <div
        className="card p-5"
        style={{ background: "var(--bg-muted)", borderColor: "var(--border)" }}
      >
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          Plant Rate Benchmarks (Q2 2025)
        </h3>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Plant Item</th>
                <th>Market Rate Range</th>
                <th>Claimed Rate</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  item: "Hydraulic Rock-Breaker",
                  range: "£1,650–£2,100/day",
                  claimed: "£1,850/day",
                  ok: true,
                },
                {
                  item: "Skip Lorry (20t)",
                  range: "£350–£450/load",
                  claimed: "£420/load",
                  ok: true,
                },
              ].map(({ item, range, claimed, ok }) => (
                <tr key={item}>
                  <td className="text-sm font-medium">{item}</td>
                  <td className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    {range}
                  </td>
                  <td className="text-sm font-semibold">{claimed}</td>
                  <td>
                    <span className={`badge ${ok ? "chip-success" : "chip-danger"} text-[10px]`}>
                      {ok ? "✓ Within Range" : "Outside Range"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

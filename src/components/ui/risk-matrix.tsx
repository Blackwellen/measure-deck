"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface RiskItem {
  id: string;
  label: string;
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
}

interface RiskMatrixProps {
  items: RiskItem[];
  className?: string;
}

function cellColour(likelihood: number, impact: number): string {
  const score = likelihood * impact;
  if (score >= 15) return "bg-red-900";
  if (score >= 10) return "bg-red-500";
  if (score >= 5) return "bg-amber-400";
  return "bg-green-400";
}

function dotColour(likelihood: number, impact: number): string {
  const score = likelihood * impact;
  if (score >= 15) return "bg-red-300";
  if (score >= 10) return "bg-red-200";
  if (score >= 5) return "bg-amber-200";
  return "bg-green-200";
}

interface TooltipState {
  itemId: string;
  x: number;
  y: number;
}

export function RiskMatrix({ items, className }: RiskMatrixProps) {
  const [tooltip, setTooltip] = React.useState<TooltipState | null>(null);

  const cellItems = (likelihood: number, impact: number) =>
    items.filter((i) => i.likelihood === likelihood && i.impact === impact);

  return (
    <div className={cn("flex gap-6 items-start flex-wrap", className)}>
      <div className="flex gap-2 items-start">
        <div className="flex flex-col items-center gap-0 mr-1">
          <span
            className="text-[10px] font-600 uppercase tracking-[0.06em] mb-1 whitespace-nowrap"
            style={{ color: "var(--text-muted)", writingMode: "vertical-rl", transform: "rotate(180deg)", height: 110 }}
          >
            Likelihood
          </span>
        </div>
        <div className="flex flex-col gap-0">
          {[5, 4, 3, 2, 1].map((likelihood) => (
            <div key={likelihood} className="flex items-center gap-0">
              <span
                className="text-[10px] font-600 w-4 text-right mr-1 shrink-0"
                style={{ color: "var(--text-muted)" }}
              >
                {likelihood}
              </span>
              <div className="flex gap-0">
                {[1, 2, 3, 4, 5].map((impact) => {
                  const cellRisks = cellItems(likelihood, impact);
                  return (
                    <div
                      key={impact}
                      className={cn(
                        "w-[44px] h-[44px] border border-white/30 relative flex flex-wrap items-center justify-center gap-0.5 p-0.5",
                        cellColour(likelihood, impact)
                      )}
                    >
                      {cellRisks.map((risk) => (
                        <div
                          key={risk.id}
                          className={cn(
                            "w-2 h-2 rounded-full cursor-pointer shrink-0",
                            dotColour(likelihood, impact)
                          )}
                          onMouseEnter={(e) => {
                            const rect = (e.target as HTMLElement).getBoundingClientRect();
                            setTooltip({ itemId: risk.id, x: rect.left, y: rect.top });
                          }}
                          onMouseLeave={() => setTooltip(null)}
                          title={risk.label}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="flex items-center gap-0 mt-1 ml-5">
            {[1, 2, 3, 4, 5].map((v) => (
              <div key={v} className="w-[44px] text-center">
                <span className="text-[10px] font-600" style={{ color: "var(--text-muted)" }}>
                  {v}
                </span>
              </div>
            ))}
          </div>
          <div className="text-center mt-0.5 ml-5">
            <span
              className="text-[10px] font-600 uppercase tracking-[0.06em]"
              style={{ color: "var(--text-muted)" }}
            >
              Impact
            </span>
          </div>
        </div>
      </div>

      {tooltip && (
        <div
          className="fixed z-50 rounded-md px-2 py-1 text-[11px] font-500 pointer-events-none shadow-lg"
          style={{
            top: tooltip.y - 32,
            left: tooltip.x + 8,
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
        >
          {items.find((i) => i.id === tooltip.itemId)?.label}
        </div>
      )}

      <div className="flex flex-col gap-1.5 text-[11px]">
        <p className="font-700 mb-0.5" style={{ color: "var(--text-secondary)" }}>Risk Score</p>
        {[
          { label: "Low (≤4)", cls: "bg-green-400" },
          { label: "Medium (5–9)", cls: "bg-amber-400" },
          { label: "High (10–14)", cls: "bg-red-500" },
          { label: "Critical (≥15)", cls: "bg-red-900" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-sm shrink-0", l.cls)} />
            <span style={{ color: "var(--text-muted)" }}>{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RiskMatrix;

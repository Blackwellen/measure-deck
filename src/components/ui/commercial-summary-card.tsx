"use client";

import { cn } from "@/lib/utils";

interface StatItem {
  label: string;
  value: string;
}

interface CommercialSummaryCardProps {
  title: string;
  status: string;
  primaryValue: string;
  secondaryValue?: string;
  stats?: StatItem[];
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function CommercialSummaryCard({
  title,
  status,
  primaryValue,
  secondaryValue,
  stats,
  actionLabel,
  onAction,
  className,
}: CommercialSummaryCardProps) {
  return (
    <div
      className={cn("rounded-xl border p-4 flex flex-col gap-3", className)}
      style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
    >
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <h3 className="text-[14px] font-700 leading-snug" style={{ color: "var(--text-primary)" }}>
          {title}
        </h3>
        <span className="chip chip-info text-[11px] shrink-0">{status}</span>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-2xl font-700 tabular-nums" style={{ color: "var(--text-primary)" }}>
          {primaryValue}
        </span>
        {secondaryValue && (
          <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
            {secondaryValue}
          </span>
        )}
      </div>

      {stats && stats.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t" style={{ borderColor: "var(--border)" }}>
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-0.5">
              <span className="text-[10px] font-600 uppercase tracking-[0.05em]" style={{ color: "var(--text-muted)" }}>
                {s.label}
              </span>
              <span className="text-[13px] font-600 tabular-nums" style={{ color: "var(--text-primary)" }}>
                {s.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {actionLabel && onAction && (
        <div className="pt-1">
          <button
            type="button"
            onClick={onAction}
            className="btn btn-secondary btn-sm w-full sm:w-auto"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}

export default CommercialSummaryCard;

"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";

type KpiVariant = "default" | "success" | "warning" | "danger";
type KpiTrend = "up" | "down" | "flat";

interface KpiCardProps {
  label: string;
  value: string | number;
  change?: string;
  trend?: KpiTrend;
  icon?: LucideIcon;
  variant?: KpiVariant;
  className?: string;
}

const VARIANT_BORDER: Record<KpiVariant, string> = {
  default: "border-l-[var(--primary)]",
  success: "border-l-green-500",
  warning: "border-l-amber-500",
  danger: "border-l-red-500",
};

const VARIANT_TINT: Record<KpiVariant, string> = {
  default: "",
  success: "bg-green-50",
  warning: "bg-amber-50",
  danger: "bg-red-50",
};

function TrendIcon({ trend }: { trend: KpiTrend }) {
  if (trend === "up") return <TrendingUp className="w-3.5 h-3.5 text-green-600" />;
  if (trend === "down") return <TrendingDown className="w-3.5 h-3.5 text-red-600" />;
  return <Minus className="w-3.5 h-3.5 text-gray-400" />;
}

export function KpiCard({
  label,
  value,
  change,
  trend,
  icon: Icon,
  variant = "default",
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-l-4 p-4 flex flex-col gap-2",
        VARIANT_BORDER[variant],
        VARIANT_TINT[variant],
        className
      )}
      style={{ borderColor: "var(--border)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-500 leading-none" style={{ color: "var(--text-muted)" }}>
          {label}
        </span>
        {Icon && (
          <Icon className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />
        )}
      </div>
      <div className="text-2xl font-700 leading-none" style={{ color: "var(--text-primary)" }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {(change !== undefined || trend !== undefined) && (
        <div className="flex items-center gap-1">
          {trend && <TrendIcon trend={trend} />}
          {change && (
            <span className="text-[11px] font-500" style={{ color: "var(--text-muted)" }}>
              {change}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default KpiCard;

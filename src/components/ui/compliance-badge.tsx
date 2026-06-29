"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";

type ComplianceStatus = "compliant" | "at_risk" | "non_compliant" | "expired" | "pending";

interface ComplianceBadgeProps {
  status: ComplianceStatus;
  label?: string;
  className?: string;
}

const CONFIG: Record<
  ComplianceStatus,
  { icon: React.ElementType; bg: string; text: string; border: string; defaultLabel: string }
> = {
  compliant: {
    icon: CheckCircle,
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
    defaultLabel: "Compliant",
  },
  at_risk: {
    icon: AlertTriangle,
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    defaultLabel: "At Risk",
  },
  non_compliant: {
    icon: XCircle,
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    defaultLabel: "Non-Compliant",
  },
  expired: {
    icon: Clock,
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-200",
    defaultLabel: "Expired",
  },
  pending: {
    icon: Clock,
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    defaultLabel: "Pending",
  },
};

export function ComplianceBadge({ status, label, className }: ComplianceBadgeProps) {
  const cfg = CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-600 border",
        cfg.bg,
        cfg.text,
        cfg.border,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {label ?? cfg.defaultLabel}
    </span>
  );
}

export default ComplianceBadge;

import { cn } from "@/lib/utils";

type ChipVariant =
  | "chip-success"
  | "chip-muted"
  | "chip-info"
  | "chip-warning"
  | "chip-danger"
  | "chip-violet"
  | "chip-cyan";

function resolveVariant(status: string): ChipVariant {
  const s = status.toLowerCase().replace(/[\s-]/g, "_");

  if (s.startsWith("ai/") || s.startsWith("ai_")) return "chip-violet";
  if (s.startsWith("bim/") || s.startsWith("bim_")) return "chip-cyan";

  switch (s) {
    case "active":
    case "approved":
    case "agreed":
    case "paid":
    case "compliant":
    case "done":
    case "current":
    case "accepted":
    case "deemed_accepted":
    case "implemented":
    case "gross":
      return "chip-success";

    case "draft":
    case "pending":
    case "todo":
    case "processing":
    case "archived":
    case "closed":
    case "withdrawn":
    case "quotation_requested":
    case "quotation_submitted":
    case "pln_issued":
    case "unverified":
      return "chip-muted";

    case "submitted":
    case "in_progress":
    case "in_negotiation":
    case "under_review":
    case "pm_instruction_issued":
    case "ce_notified":
    case "issued":
    case "net":
      return "chip-info";

    case "warning":
    case "expiring":
    case "on_hold":
    case "pln_overdue":
    case "payment_overdue":
    case "unmatched":
      return "chip-warning";

    case "disputed":
    case "danger":
    case "overdue":
    case "non_compliant":
    case "cancelled":
    case "superseded":
    case "suspended":
    case "terminated":
    case "higher_rate":
      return "chip-danger";

    case "completed":
      return "chip-success";

    default:
      return "chip-muted";
  }
}

export interface StatusChipProps {
  status: string;
  size?: "sm" | "md";
  className?: string;
}

export function StatusChip({ status, size = "md", className }: StatusChipProps) {
  const variant = resolveVariant(status);
  const label = status
    .replace(/^(ai|bim)\//i, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={cn(
        "chip",
        variant,
        size === "sm" && "text-[10px] px-1.5 py-0.5",
        className
      )}
    >
      {label}
    </span>
  );
}

export default StatusChip;

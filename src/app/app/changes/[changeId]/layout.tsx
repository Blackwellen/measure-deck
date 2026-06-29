import Link from "next/link"; // used for back button
import { cookies } from "next/headers";
import { ArrowLeft, Edit2, Send, MoreHorizontal } from "lucide-react";
import { CE025_CHANGE, CE025_NEC4_STEPS } from "@/lib/seed/projects";
import { ChangeTabNav } from "./_components/tab-nav";

interface Props {
  children: React.ReactNode;
  params: Promise<{ changeId: string }>;
}

const TABS = [
  { label: "Overview",          href: "" },
  { label: "Pricing Detail",    href: "/pricing-detail" },
  { label: "Programme & Delay", href: "/programme-delay" },
  { label: "Evidence",          href: "/evidence" },
  { label: "Application Links", href: "/application-links" },
  { label: "Correspondence",    href: "/correspondence" },
  { label: "Tasks",             href: "/tasks" },
  { label: "AI Narrative",      href: "/ai-narrative" },
  { label: "Audit",             href: "/audit" },
  { label: "NEC4 Workflow",     href: "/nec4-workflow" },
] as const;

function getDaysAged(dateStr: string): number {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function getDeadlineInfo(dueDateStr: string): { label: string; daysLeft: number } {
  const due = new Date(dueDateStr);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return { label: due.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }), daysLeft };
}

export default async function ChangeDetailLayout({ children, params }: Props) {
  const { changeId } = await params;
  void cookies(); // ensure dynamic rendering

  const ce = CE025_CHANGE;
  const daysAged = getDaysAged(ce.notificationDate);

  // Find the active in_progress NEC4 step deadline
  const activeStep = CE025_NEC4_STEPS.find((s) => s.status === "in_progress" && s.dueDate);
  const deadline = activeStep?.dueDate ? getDeadlineInfo(activeStep.dueDate) : null;
  const deadlineLabel = activeStep ? `${activeStep.name} due ${deadline?.label}` : null;
  const deadlineUrgent = deadline && deadline.daysLeft <= 7;
  const deadlineOverdue = deadline && deadline.daysLeft < 0;

  const contractValue = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0 }).format(ce.contractValue);

  return (
    <div className="flex flex-col min-h-full">
      {/* Hero Header */}
      <div
        className="px-6 pt-5 pb-0"
        style={{ background: "linear-gradient(135deg, #1E3A5F 0%, #2D5986 100%)" }}
      >
        {/* Back + badge + title row */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div className="flex flex-col gap-2">
            {/* Back link */}
            <Link
              href="/changes"
              className="inline-flex items-center gap-1.5 text-xs text-blue-200 hover:text-white transition-colors w-fit"
            >
              <ArrowLeft size={13} />
              Changes
            </Link>

            {/* CE badge + title */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className="font-mono text-xs font-bold px-2.5 py-1 rounded"
                style={{ background: "rgba(255,255,255,0.12)", color: "#CBD5E1" }}
              >
                {ce.ceNumber}
              </span>
              <span
                className="badge"
                style={{ background: "rgba(245,158,11,0.2)", color: "#FCD34D", border: "1px solid rgba(245,158,11,0.3)" }}
              >
                {ce.status === "submitted" ? "Submitted" : ce.status}
              </span>
              <span
                className="badge"
                style={{ background: "rgba(239,68,68,0.18)", color: "#FCA5A5", border: "1px solid rgba(239,68,68,0.3)" }}
              >
                {ce.priority === "high" ? "High Priority" : ce.priority}
              </span>
            </div>

            <h1 className="text-xl font-bold text-white leading-tight max-w-2xl">
              {ce.title}
            </h1>

            <div className="flex items-center gap-1.5 text-xs text-blue-200">
              <span className="font-medium text-blue-100">{ce.projectName}</span>
              <span className="text-blue-300">·</span>
              <span>NEC4 Clause {ce.clauseReference}</span>
              <span className="text-blue-300">·</span>
              <span>{ce.ceType}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              className="btn btn-sm"
              style={{ background: "rgba(255,255,255,0.1)", color: "#E2E8F0", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              <Edit2 size={13} />
              Edit
            </button>
            <button
              className="btn btn-sm"
              style={{ background: "rgba(59,94,232,0.8)", color: "#fff", border: "1px solid rgba(99,131,255,0.5)" }}
            >
              <Send size={13} />
              Submit
            </button>
            <button
              className="btn btn-sm"
              style={{ background: "rgba(255,255,255,0.1)", color: "#E2E8F0", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              <MoreHorizontal size={13} />
            </button>
          </div>
        </div>

        {/* Meta strip */}
        <div
          className="flex items-center gap-5 flex-wrap py-3 border-t text-xs"
          style={{ borderColor: "rgba(255,255,255,0.12)", color: "#94A3B8" }}
        >
          {[
            { label: "Client", value: ce.client },
            { label: "PM", value: ce.pm },
            { label: "QS", value: ce.qs },
            { label: "Contract Value", value: contractValue },
            { label: "Raised By", value: ce.raisedBy },
            { label: "Days Aged", value: `${daysAged}d` },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span style={{ color: "#64748B" }}>{label}:</span>
              <span className="font-medium text-blue-100">{value}</span>
            </div>
          ))}
        </div>

        {/* Tab navigation (client component for active state) */}
        <ChangeTabNav tabs={TABS} changeId={changeId} />
      </div>

      {/* Deadline alert strip */}
      {deadlineLabel && (deadlineUrgent || deadlineOverdue) && (
        <div
          className="px-6 py-2.5 flex items-center gap-2 text-sm font-medium"
          style={{
            background: deadlineOverdue ? "#FEF2F2" : "#FFFBEB",
            borderBottom: `1px solid ${deadlineOverdue ? "#FECACA" : "#FDE68A"}`,
            color: deadlineOverdue ? "#B91C1C" : "#92400E",
          }}
        >
          <span>{deadlineOverdue ? "🔴" : "⚠"}</span>
          <span>
            {deadlineLabel}
            {deadline && deadline.daysLeft >= 0
              ? ` · ${deadline.daysLeft} day${deadline.daysLeft !== 1 ? "s" : ""} remaining`
              : deadline && ` · ${Math.abs(deadline.daysLeft)} day${Math.abs(deadline.daysLeft) !== 1 ? "s" : ""} overdue`}
          </span>
        </div>
      )}

      {/* Page content */}
      <div className="flex-1 px-6 py-6">{children}</div>
    </div>
  );
}

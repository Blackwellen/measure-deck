"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  BarChart2,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { FeatureGate } from "@/components/ui/feature-gate";
import {
  type NEC4CEState,
  getCEUrgencyLevel,
  type UrgencyLevel,
} from "@/lib/nec4/ce-state-machine";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CEWithWorkflow {
  id: string;
  reference: string;
  title: string;
  project_id: string;
  project_name?: string;
  status: string;
  contract_sum_impact: number;
  workflow_state: NEC4CEState;
  clause_reference: string | null;
  quotation_due_date: string | null;
  acceptance_due_date: string | null;
  notification_date: string | null;
  urgency: UrgencyLevel;
}

// ─── Seed data for demo ───────────────────────────────────────────────────────

const SEED_CES: CEWithWorkflow[] = [
  {
    id: "ce-001",
    reference: "CE-025",
    title: "Additional groundworks – unforeseen igneous rock",
    project_id: "proj-001",
    project_name: "The Arc Tower, Birmingham",
    status: "submitted",
    contract_sum_impact: 48500,
    workflow_state: "quotation_submitted",
    clause_reference: "60.1(12)",
    quotation_due_date: "2025-11-10",
    acceptance_due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    notification_date: "2025-10-15",
    urgency: "overdue",
  },
  {
    id: "ce-002",
    reference: "CE-026",
    title: "Utility diversion delay – Section 3A",
    project_id: "proj-002",
    project_name: "Granary Wharf Offices",
    status: "notified",
    contract_sum_impact: 31000,
    workflow_state: "ce_notified",
    clause_reference: "60.1(2)",
    quotation_due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    acceptance_due_date: null,
    notification_date: "2025-11-01",
    urgency: "critical",
  },
  {
    id: "ce-003",
    reference: "CE-027",
    title: "Weather event – exceptional rainfall October",
    project_id: "proj-002",
    project_name: "Granary Wharf Offices",
    status: "notified",
    contract_sum_impact: 12400,
    workflow_state: "quotation_requested",
    clause_reference: "60.1(13)",
    quotation_due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    acceptance_due_date: null,
    notification_date: "2025-11-05",
    urgency: "warning",
  },
  {
    id: "ce-004",
    reference: "CE-028",
    title: "Design change – acoustic upgrade cinema suite",
    project_id: "proj-004",
    project_name: "Station Square Retail",
    status: "draft",
    contract_sum_impact: 29500,
    workflow_state: "ce_notified",
    clause_reference: "60.1(1)",
    quotation_due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    acceptance_due_date: null,
    notification_date: "2025-11-18",
    urgency: "on_track",
  },
  {
    id: "ce-005",
    reference: "CE-029",
    title: "MEP coordination changes – Level 5 reroute",
    project_id: "proj-001",
    project_name: "The Arc Tower, Birmingham",
    status: "submitted",
    contract_sum_impact: 9750,
    workflow_state: "accepted",
    clause_reference: "60.1(1)",
    quotation_due_date: "2025-10-25",
    acceptance_due_date: "2025-11-08",
    notification_date: "2025-10-04",
    urgency: "no_deadline",
  },
];

// ─── Column config ────────────────────────────────────────────────────────────

const COLUMN_CONFIG: {
  urgency: UrgencyLevel[];
  label: string;
  headerClass: string;
  iconColor: string;
  Icon: React.ElementType;
}[] = [
  {
    urgency: ["overdue"],
    label: "Overdue",
    headerClass: "bg-red-600 text-white",
    iconColor: "text-red-600",
    Icon: AlertTriangle,
  },
  {
    urgency: ["critical", "warning"],
    label: "Due This Week",
    headerClass: "bg-amber-500 text-white",
    iconColor: "text-amber-500",
    Icon: Clock,
  },
  {
    urgency: ["on_track", "no_deadline"],
    label: "On Track",
    headerClass: "bg-green-600 text-white",
    iconColor: "text-green-600",
    Icon: CheckCircle2,
  },
];

// ─── CE Card ─────────────────────────────────────────────────────────────────

function CECard({
  ce,
  onClick,
}: {
  ce: CEWithWorkflow;
  onClick: () => void;
}) {
  const URGENCY_BORDER: Record<UrgencyLevel, string> = {
    overdue:     "border-l-red-500",
    critical:    "border-l-amber-500",
    warning:     "border-l-yellow-400",
    on_track:    "border-l-green-500",
    no_deadline: "border-l-[var(--border)]",
  };

  const deadline =
    ["ce_notified", "quotation_requested"].includes(ce.workflow_state) &&
    ce.quotation_due_date
      ? ce.quotation_due_date
      : ce.acceptance_due_date;

  const STATE_LABELS: Record<NEC4CEState, string> = {
    pm_instruction_issued: "PM Instruction",
    ce_notified:           "Notified",
    quotation_requested:   "Quotation Requested",
    quotation_submitted:   "Quotation Submitted",
    pm_response_received:  "PM Response Received",
    accepted:              "Accepted",
    deemed_accepted:       "Deemed Accepted",
    implemented:           "Implemented",
    disputed:              "Disputed",
    withdrawn:             "Withdrawn",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "card w-full text-left p-4 border-l-4 hover:shadow-md transition-shadow flex flex-col gap-2",
        URGENCY_BORDER[ce.urgency]
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-mono text-xs font-bold text-[var(--primary)]">
          {ce.reference}
        </span>
        {ce.clause_reference && (
          <span className="badge chip-primary text-[10px]">
            NEC4 {ce.clause_reference}
          </span>
        )}
      </div>
      <p className="text-sm font-semibold text-[var(--text-primary)] line-clamp-2 leading-snug">
        {ce.title}
      </p>
      <p className="text-xs text-[var(--text-muted)]">{ce.project_name}</p>
      <div className="flex items-center justify-between mt-1">
        <span className="badge chip-info text-[10px]">
          {STATE_LABELS[ce.workflow_state]}
        </span>
        <span className="text-sm font-bold tabular-nums text-[var(--text-primary)]">
          {formatCurrency(ce.contract_sum_impact)}
        </span>
      </div>
      {deadline && (
        <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
          <Calendar size={10} />
          <span>
            {ce.urgency === "overdue" ? "Was due" : "Due"}: {formatDate(deadline)}
          </span>
        </div>
      )}
    </button>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

function NEC4DashboardContent() {
  const router = useRouter();
  const [ces, setCes] = useState<CEWithWorkflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("change_events")
          .select(
            `
            id,
            reference,
            title,
            project_id,
            status,
            contract_sum_impact,
            ce_workflow_states (
              state,
              clause_reference,
              quotation_due_date,
              acceptance_due_date,
              notification_date,
              pm_response_at
            )
          `
          )
          .not("ce_workflow_states", "is", null)
          .order("created_at", { ascending: false });

        if (data && data.length > 0) {
          type WFRow = {
            state: NEC4CEState;
            clause_reference: string | null;
            quotation_due_date: string | null;
            acceptance_due_date: string | null;
            notification_date: string | null;
            pm_response_at: string | null;
          };
          type DataRow = {
            id: string;
            reference: string;
            title: string;
            project_id: string;
            status: string;
            contract_sum_impact: number;
            ce_workflow_states: WFRow[] | WFRow | null;
          };
          const rows = data as DataRow[];
          const mapped: CEWithWorkflow[] = rows.map((row) => {
            const wfRaw = row.ce_workflow_states;
            const wf: WFRow | null = Array.isArray(wfRaw) ? (wfRaw[0] ?? null) : wfRaw;
            const urgency = wf
              ? getCEUrgencyLevel({
                  state: wf.state,
                  quotation_due_date: wf.quotation_due_date,
                  acceptance_due_date: wf.acceptance_due_date,
                })
              : ("no_deadline" as const);
            return {
              id: row.id,
              reference: row.reference ?? "",
              title: row.title ?? "",
              project_id: row.project_id,
              status: row.status ?? "",
              contract_sum_impact: row.contract_sum_impact ?? 0,
              workflow_state: wf?.state ?? "ce_notified",
              clause_reference: wf?.clause_reference ?? null,
              quotation_due_date: wf?.quotation_due_date ?? null,
              acceptance_due_date: wf?.acceptance_due_date ?? null,
              notification_date: wf?.notification_date ?? null,
              urgency,
            };
          });
          setCes(mapped);
        } else {
          setCes(SEED_CES);
        }
      } catch {
        setCes(SEED_CES);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // KPI calculations
  const totalValue = ces.reduce((s, c) => s + c.contract_sum_impact, 0);
  const atRiskCount = ces.filter(
    (c) => c.urgency === "overdue" || c.urgency === "critical"
  ).length;

  // Sort CEs into columns
  const columns = COLUMN_CONFIG.map((col) => ({
    ...col,
    items: ces.filter((c) => col.urgency.includes(c.urgency)),
  }));

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton h-24 rounded-[var(--radius-lg)]" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-96 rounded-[var(--radius-lg)]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">
            NEC4 CE Dashboard
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Real-time view of all NEC4 compensation event deadlines
          </p>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => router.push("/changes")}
        >
          All Changes
        </button>
      </div>

      {/* KPI strip */}
      <div className="px-6 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="kpi-card">
          <div className="kpi-label">Total CEs</div>
          <div className="kpi-value">{ces.length}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total CE Value</div>
          <div className="kpi-value">{formatCurrency(totalValue)}</div>
        </div>
        <div className="kpi-card border-l-4 border-l-[var(--danger)]">
          <div className="kpi-label">At Risk</div>
          <div className="kpi-value text-[var(--danger)]">{atRiskCount}</div>
          <div className="text-xs text-[var(--text-muted)]">Overdue or critical</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">On Track</div>
          <div className="kpi-value text-[var(--success)]">
            {ces.filter((c) => c.urgency === "on_track").length}
          </div>
        </div>
      </div>

      {/* Three-column layout */}
      <div className="page-content flex-1 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {columns.map((col) => (
            <div key={col.label} className="flex flex-col gap-3">
              {/* Column header */}
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-[var(--radius)]",
                  col.headerClass
                )}
              >
                <col.Icon size={14} />
                <span className="text-sm font-bold">{col.label}</span>
                <span className="ml-auto text-xs font-semibold bg-white/20 rounded-full px-2 py-0.5">
                  {col.items.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-3">
                {col.items.map((ce) => (
                  <CECard
                    key={ce.id}
                    ce={ce}
                    onClick={() => router.push(`/changes/${ce.id}`)}
                  />
                ))}
                {col.items.length === 0 && (
                  <div className="flex items-center justify-center h-24 rounded-[var(--radius)] border border-dashed border-[var(--border)] text-xs text-[var(--text-muted)]">
                    No CEs in this category
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page wrapper with feature gate ──────────────────────────────────────────

export default function NEC4DashboardPage() {
  return (
    <FeatureGate flag="nec4_ce_engine">
      <NEC4DashboardContent />
    </FeatureGate>
  );
}

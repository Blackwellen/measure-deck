"use client";

import { AdjudicationWizard } from "@/components/wizards/adjudication-wizard";
import { CountdownClock } from "@/components/ui/countdown-clock";
import { FeatureGate } from "@/components/ui/feature-gate";
import { KpiCard } from "@/components/ui/kpi-card";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { createClient } from "@/lib/supabase/client";
import { getWorkspaceId } from "@/lib/workspace";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  FileText,
  Plus,
  Scale,
  Search,
} from "lucide-react";
import Link from "next/link";
import React from "react";

type AdjStatus =
  | "notice_issued"
  | "referral_pending"
  | "appointment_pending"
  | "response_pending"
  | "decision_pending"
  | "settled"
  | "won"
  | "lost"
  | "withdrawn";

interface AdjCase {
  id: string;
  case_number: string;
  project_id: string | null;
  dispute_type: string;
  dispute_description: string;
  amount_in_dispute: number;
  responding_party: string | null;
  notice_date: string | null;
  appointment_date: string | null;
  decision_due: string | null;
  status: AdjStatus;
  settlement_amount: number | null;
  created_at: string;
  projects: { name: string } | null;
}

function addDays(dateStr: string | null, days: number): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d;
}

function isOverdue(date: Date | null): boolean {
  if (!date) return false;
  return date.getTime() < Date.now();
}

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtGBP(n: number): string {
  return `£${n.toLocaleString("en-GB", { minimumFractionDigits: 0 })}`;
}

const STATUS_LABELS: Record<AdjStatus, string> = {
  notice_issued: "Notice Issued",
  referral_pending: "Referral Pending",
  appointment_pending: "Appt. Pending",
  response_pending: "Response Pending",
  decision_pending: "Decision Pending",
  settled: "Settled",
  won: "Won",
  lost: "Lost",
  withdrawn: "Withdrawn",
};

const ACTIVE_STATUSES: AdjStatus[] = [
  "notice_issued",
  "referral_pending",
  "appointment_pending",
  "response_pending",
  "decision_pending",
];

export default function AdjudicationPage() {
  return (
    <FeatureGate flag="adjudication_module">
      <AdjudicationPageContent />
    </FeatureGate>
  );
}

function AdjudicationPageContent() {
  const [cases, setCases] = React.useState<AdjCase[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showWizard, setShowWizard] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [projectFilter, setProjectFilter] = React.useState("all");

  async function load() {
    setLoading(true);
    try {
      const supabase = createClient();
      const workspaceId = await getWorkspaceId(supabase);
      const { data } = await supabase
        .from("adjudication_cases")
        .select("*, projects(name)")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      setCases((data ?? []) as AdjCase[]);
    } catch {
      setCases([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void load();
  }, []);

  const totalCount = cases.length;
  const activeCount = cases.filter((c) => ACTIVE_STATUSES.includes(c.status)).length;
  const wonCount = cases.filter((c) => c.status === "won").length;
  const settlementValue = cases
    .filter((c) => c.status === "settled" && c.settlement_amount)
    .reduce((sum, c) => sum + (c.settlement_amount ?? 0), 0);

  const uniqueProjects = Array.from(
    new Map(cases.map((c) => [c.project_id, c.projects?.name])).entries()
  ).filter(([id]) => !!id) as [string, string][];

  const filtered = cases.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (projectFilter !== "all" && c.project_id !== projectFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        c.case_number.toLowerCase().includes(q) ||
        (c.projects?.name ?? "").toLowerCase().includes(q) ||
        (c.responding_party ?? "").toLowerCase().includes(q) ||
        c.dispute_type.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Adjudication Register"
        subtitle="UK HGCRA Part II — Construction Act dispute tracker"
        actions={
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowWizard(true)}
          >
            <Plus className="w-4 h-4" />
            New Case
          </button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Total Cases"
          value={totalCount}
          icon={Scale}
          variant="default"
        />
        <KpiCard
          label="Active"
          value={activeCount}
          icon={CalendarClock}
          variant={activeCount > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="Won"
          value={wonCount}
          icon={CheckCircle2}
          variant={wonCount > 0 ? "success" : "default"}
        />
        <KpiCard
          label="Settlement Value"
          value={settlementValue > 0 ? fmtGBP(settlementValue) : "£0"}
          icon={FileText}
          variant="default"
        />
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="search"
            className="form-input pl-9 h-9 w-full text-sm"
            placeholder="Search cases…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="form-input h-9 text-sm w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          {(Object.keys(STATUS_LABELS) as AdjStatus[]).map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        {uniqueProjects.length > 0 && (
          <select
            className="form-input h-9 text-sm w-auto"
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
          >
            <option value="all">All projects</option>
            {uniqueProjects.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="md:hidden flex flex-col gap-3">
        {loading ? (
          <div className="card p-6 text-center">
            <div className="skeleton h-4 w-32 rounded mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-8 text-center">
            <Scale className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
              No adjudication cases found
            </p>
            <button
              type="button"
              className="btn btn-primary btn-sm mt-3"
              onClick={() => setShowWizard(true)}
            >
              <Plus className="w-4 h-4" />
              New Case
            </button>
          </div>
        ) : (
          filtered.map((c) => {
            const referralDue = addDays(c.notice_date, 7);
            const decisionDue = c.appointment_date
              ? addDays(c.appointment_date, 28)
              : null;
            return (
              <Link key={c.id} href={`/app/adjudication/${c.id}`}>
                <div
                  className="card p-4 flex flex-col gap-2 hover:shadow-md transition-shadow"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div className="flex justify-between items-start">
                    <span
                      className="font-mono text-sm font-600"
                      style={{ color: "var(--primary)" }}
                    >
                      {c.case_number}
                    </span>
                    <StatusChip status={c.status} size="sm" />
                  </div>
                  <p
                    className="font-semibold text-[14px] line-clamp-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {c.dispute_description}
                  </p>
                  <div className="flex flex-wrap gap-3 text-[12px]" style={{ color: "var(--text-muted)" }}>
                    {c.projects?.name && <span>{c.projects.name}</span>}
                    <span className="font-600 text-red-700">
                      {fmtGBP(c.amount_in_dispute)}
                    </span>
                    {referralDue && (
                      <span className={cn(isOverdue(referralDue) && "text-red-600 font-600")}>
                        Referral: {fmtDate(referralDue)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      <div className="card overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Case No.</th>
                <th>Project</th>
                <th className="text-right">Dispute Value</th>
                <th>Respondent</th>
                <th>Notice Date</th>
                <th>Referral Due</th>
                <th>Appt. Due</th>
                <th>Decision Due</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-10">
                    <span className="skeleton inline-block h-4 w-32 rounded" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                    <Scale className="w-6 h-6 mx-auto mb-2 opacity-40" />
                    <p className="text-[13px]">No adjudication cases found</p>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm mt-3"
                      onClick={() => setShowWizard(true)}
                    >
                      <Plus className="w-4 h-4" />
                      New Case
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const referralDue = addDays(c.notice_date, 7);
                  const apptDue = c.notice_date ? addDays(c.notice_date, 21) : null;
                  const decisionDue = c.appointment_date
                    ? addDays(c.appointment_date, 28)
                    : null;
                  const isActive = ACTIVE_STATUSES.includes(c.status);

                  return (
                    <tr key={c.id} className="cursor-pointer hover:bg-[var(--bg-subtle)] transition-colors">
                      <td>
                        <Link
                          href={`/app/adjudication/${c.id}`}
                          className="font-mono text-[12px] font-600 hover:underline"
                          style={{ color: "var(--primary)" }}
                        >
                          {c.case_number}
                        </Link>
                      </td>
                      <td className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                        {c.projects?.name ?? "—"}
                      </td>
                      <td className="text-right tabular-nums text-[12px] font-600 text-red-700">
                        {fmtGBP(c.amount_in_dispute)}
                      </td>
                      <td className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                        {c.responding_party ?? "—"}
                      </td>
                      <td className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                        {c.notice_date
                          ? new Date(c.notice_date).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td
                        className={cn(
                          "text-[12px]",
                          isOverdue(referralDue) ? "text-red-600 font-600" : ""
                        )}
                      >
                        {fmtDate(referralDue)}
                        {isOverdue(referralDue) && (
                          <AlertTriangle className="inline w-3 h-3 ml-1 text-red-500" />
                        )}
                      </td>
                      <td
                        className={cn(
                          "text-[12px]",
                          isOverdue(apptDue) ? "text-red-600 font-600" : ""
                        )}
                      >
                        {fmtDate(apptDue)}
                      </td>
                      <td className="text-[12px]">
                        {isActive && decisionDue ? (
                          <CountdownClock deadline={decisionDue} urgencyThresholdDays={7} />
                        ) : (
                          <span
                            className={cn(isOverdue(decisionDue) ? "text-red-600 font-600" : "")}
                          >
                            {fmtDate(decisionDue)}
                          </span>
                        )}
                      </td>
                      <td>
                        <StatusChip status={c.status} size="sm" />
                      </td>
                      <td>
                        <Link
                          href={`/app/adjudication/${c.id}`}
                          className="btn btn-ghost btn-icon btn-sm"
                        >
                          &rsaquo;
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showWizard && (
        <AdjudicationWizard
          onClose={() => setShowWizard(false)}
          onCreated={() => {
            void load();
          }}
        />
      )}
    </div>
  );
}

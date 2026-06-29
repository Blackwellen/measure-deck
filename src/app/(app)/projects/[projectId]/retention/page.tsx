"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Download, Plus, ChevronRight, Lock, Clock, AlertTriangle,
} from "lucide-react";
import { cn, formatCurrencyFull, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { FeatureGate } from "@/components/ui/feature-gate";
import { KpiCard } from "@/components/ui/kpi-card";
import { CountdownClock } from "@/components/ui/countdown-clock";
import { createAuditEvent } from "@/lib/audit";
import { getWorkspaceId } from "@/lib/workspace";
import {
  calculateFirstMoietyRelease,
  calculateSecondMoietyRelease,
  projectRetentionSchedule,
} from "@/lib/retention/calculator";

interface LedgerRow {
  id: string;
  date: string;
  entry_type: string;
  amount: number;
  description: string;
  application_id: string | null;
  balance_after: number;
}

interface ProjectMeta {
  id: string;
  name: string;
  contract_sum: number;
  retention_percent: number;
  projected_pc_date: string | null;
  dlp_months: number;
}

const SEED_META: ProjectMeta = {
  id: "seed",
  name: "Southbank Resi",
  contract_sum: 9_800_000,
  retention_percent: 5,
  projected_pc_date: "2026-09-30",
  dlp_months: 12,
};

const SEED_LEDGER: LedgerRow[] = [
  { id: "l1", date: "2025-08-01", entry_type: "deduction", amount: 14_400, description: "Retention App #1 — Aug 2025", application_id: null, balance_after: 14_400 },
  { id: "l2", date: "2025-09-01", entry_type: "deduction", amount: 21_825, description: "Retention App #2 — Sep 2025", application_id: null, balance_after: 36_225 },
  { id: "l3", date: "2025-10-01", entry_type: "deduction", amount: 32_175, description: "Retention App #3 — Oct 2025", application_id: null, balance_after: 68_400 },
  { id: "l4", date: "2025-11-01", entry_type: "deduction", amount: 40_950, description: "Retention App #4 — Nov 2025", application_id: null, balance_after: 109_350 },
  { id: "l5", date: "2026-01-01", entry_type: "adjustment", amount: -2_500, description: "Correction: over-deduction Dec 2025", application_id: null, balance_after: 106_850 },
  { id: "l6", date: "2026-04-01", entry_type: "deduction", amount: 48_750, description: "Retention App #8 — Apr 2026", application_id: null, balance_after: 155_600 },
];

const SUBCONTRACT_RETENTION: Array<{ supplier: string; trade: string; order_value: number; retention_held: number }> = [
  { supplier: "Alpha Steelwork Ltd", trade: "Structural Steel", order_value: 1_850_000, retention_held: 63_000 },
  { supplier: "Fenwick Cladding Systems", trade: "Curtain Walling", order_value: 820_000, retention_held: 20_750 },
  { supplier: "PowerTech MEP", trade: "M&E Services", order_value: 1_240_000, retention_held: 34_500 },
  { supplier: "BuildRight Groundworks", trade: "Groundworks", order_value: 485_000, retention_held: 24_250 },
  { supplier: "InteriorCo Ltd", trade: "Internal Finishes", order_value: 620_000, retention_held: 4_250 },
];

function entryTypeBadge(type: string) {
  const map: Record<string, string> = {
    deduction: "chip-warning",
    release_first_moiety: "chip-success",
    release_second_moiety: "chip-success",
    adjustment: "chip-info",
  };
  const labels: Record<string, string> = {
    deduction: "Deduction",
    release_first_moiety: "Release (1st Moiety)",
    release_second_moiety: "Release (2nd Moiety)",
    adjustment: "Adjustment",
  };
  return (
    <span className={cn("badge", map[type] ?? "chip-muted")}>
      {labels[type] ?? type}
    </span>
  );
}

function RetentionTimelineBar(props: {
  pcDate: Date;
  dlpEndDate: Date;
}) {
  const now = new Date();
  const start = new Date("2025-07-01");
  const totalMs = props.dlpEndDate.getTime() - start.getTime();
  const nowPct = Math.min(100, Math.max(0, ((now.getTime() - start.getTime()) / totalMs) * 100));
  const pcPct = Math.min(100, Math.max(0, ((props.pcDate.getTime() - start.getTime()) / totalMs) * 100));

  return (
    <div className="card p-5 space-y-4">
      <h3 className="text-sm font-semibold">Retention Schedule Timeline</h3>
      <div className="relative h-10 rounded-xl overflow-hidden" style={{ background: "var(--bg-muted)" }}>
        <div
          className="absolute inset-y-0 left-0 rounded-l-xl"
          style={{ width: `${pcPct}%`, background: "var(--warning)", opacity: 0.5 }}
        />
        <div
          className="absolute inset-y-0 rounded-r-xl"
          style={{
            left: `${pcPct}%`,
            right: 0,
            background: "var(--success)",
            opacity: 0.35,
          }}
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white"
          style={{ left: `${nowPct}%` }}
          title="Today"
        />
        <div
          className="absolute top-0 bottom-0 w-0.5"
          style={{ left: `${pcPct}%`, background: "var(--warning)" }}
          title="PC Date"
        />
        <div className="absolute inset-0 flex items-center justify-between px-3">
          <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>Deduction Period</span>
          <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>DLP</span>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
        <span>Contract Start: Jul 2025</span>
        <span>PC: {formatDate(props.pcDate.toISOString())}</span>
        <span>DLP End: {formatDate(props.dlpEndDate.toISOString())}</span>
      </div>
    </div>
  );
}

function RetentionPageContent() {
  const params = useParams();
  const router = useRouter();
  const projectId = String(params.projectId ?? "seed");

  const [meta, setMeta] = useState<ProjectMeta>(SEED_META);
  const [ledger, setLedger] = useState<LedgerRow[]>(SEED_LEDGER);
  const [loading, setLoading] = useState(true);
  const [releasing, setReleasing] = useState(false);

  const load = useCallback(async () => {
    try {
      const supabase = createClient();
      const [projRes, ledgerRes] = await Promise.all([
        supabase
          .from("projects")
          .select("id, name, contract_sum, retention_percent, projected_pc_date, dlp_months")
          .eq("id", projectId)
          .single(),
        supabase
          .from("retention_ledger")
          .select("id, date, entry_type, amount, description, application_id, balance_after")
          .eq("project_id", projectId)
          .order("date", { ascending: true }),
      ]);

      if (projRes.data) {
        setMeta({
          id: projRes.data.id as string,
          name: (projRes.data.name as string) ?? "Project",
          contract_sum: (projRes.data.contract_sum as number) ?? 0,
          retention_percent: (projRes.data.retention_percent as number) ?? 5,
          projected_pc_date: projRes.data.projected_pc_date as string | null,
          dlp_months: (projRes.data.dlp_months as number) ?? 12,
        });
      }
      if (ledgerRes.data && ledgerRes.data.length > 0) {
        setLedger(
          (ledgerRes.data as LedgerRow[]).sort((a, b) => a.date.localeCompare(b.date))
        );
      }
    } catch {
      // fallback to seed
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalHeld = ledger.reduce((sum, row) => {
    if (row.entry_type === "deduction") return sum + row.amount;
    if (row.entry_type === "release_first_moiety" || row.entry_type === "release_second_moiety") return sum - row.amount;
    return sum + row.amount;
  }, 0);

  const firstMoietyReleased = ledger
    .filter((r) => r.entry_type === "release_first_moiety")
    .reduce((s, r) => s + r.amount, 0);

  const totalReleased = ledger
    .filter((r) => r.entry_type === "release_first_moiety" || r.entry_type === "release_second_moiety")
    .reduce((s, r) => s + r.amount, 0);

  const pcDate = meta.projected_pc_date ? new Date(meta.projected_pc_date) : new Date("2026-09-30");
  const schedule = projectRetentionSchedule({
    contract_sum: meta.contract_sum,
    retention_rate_percent: meta.retention_percent,
    projected_pc_date: pcDate,
    dlp_months: meta.dlp_months,
  });

  const isPCReached = new Date() >= pcDate;
  const firstMoietyNotYetReleased = firstMoietyReleased === 0;
  const nextReleaseDate = firstMoietyReleased === 0 ? pcDate : schedule.second_moiety_release_date;
  const nextReleaseLabel = firstMoietyReleased === 0 ? "First Moiety (PC)" : "Second Moiety (DLP End)";

  async function handleReleaseFirstMoiety() {
    if (releasing) return;
    setReleasing(true);
    try {
      const supabase = createClient();
      const wsId = await getWorkspaceId(supabase);
      const { data: { user } } = await supabase.auth.getUser();
      const releaseAmount = calculateFirstMoietyRelease(totalHeld);
      const newBalance = totalHeld - releaseAmount;

      await supabase.from("retention_ledger").insert({
        project_id: projectId,
        workspace_id: wsId,
        date: new Date().toISOString().slice(0, 10),
        entry_type: "release_first_moiety",
        amount: releaseAmount,
        description: "First moiety retention release — Practical Completion",
        balance_after: newBalance,
      });

      await createAuditEvent(supabase, {
        workspace_id: wsId,
        user_id: user?.id ?? "",
        action: "retention_first_moiety_released",
        resource_type: "project",
        resource_id: projectId,
        new_values: { amount: releaseAmount, balance_after: newBalance },
      });

      await load();
    } catch {
      // silently ignored
    } finally {
      setReleasing(false);
    }
  }

  if (loading) {
    return (
      <div className="page-content space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-[var(--radius)]" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="page-header">
        <div className="flex items-center gap-3 min-w-0">
          <button
            className="btn btn-ghost btn-icon"
            onClick={() => router.push(`/app/projects/${projectId}`)}
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold">Retention Ledger</h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {meta.name} &nbsp;·&nbsp; {meta.retention_percent}% retention
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn btn-secondary btn-sm">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      <div className="page-content flex-1 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Total Retention Held"
            value={formatCurrencyFull(Math.max(0, totalHeld))}
            variant="warning"
          />
          <KpiCard
            label={`First Moiety Due (PC: ${formatDate(pcDate.toISOString())})`}
            value={formatCurrencyFull(schedule.first_moiety_amount)}
            variant="default"
          />
          <KpiCard
            label={`Second Moiety Due (${formatDate(schedule.second_moiety_release_date.toISOString())})`}
            value={formatCurrencyFull(schedule.second_moiety_amount)}
            variant="default"
          />
          <KpiCard
            label="Retention Released to Date"
            value={formatCurrencyFull(totalReleased)}
            variant="success"
          />
        </div>

        <RetentionTimelineBar
          pcDate={pcDate}
          dlpEndDate={schedule.second_moiety_release_date}
        />

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Clock size={14} style={{ color: "var(--primary)" }} />
              Next Release Event: {nextReleaseLabel}
            </h3>
          </div>
          <CountdownClock deadline={nextReleaseDate} label={nextReleaseLabel} urgencyThresholdDays={30} />
        </div>

        {isPCReached && firstMoietyNotYetReleased && (
          <div
            className="card p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            style={{ borderColor: "var(--success)", borderWidth: 1 }}
          >
            <div>
              <p className="text-sm font-semibold">Practical Completion Reached</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                You can now release the first moiety: {formatCurrencyFull(calculateFirstMoietyRelease(totalHeld))}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Second moiety of {formatCurrencyFull(calculateSecondMoietyRelease(totalHeld, calculateFirstMoietyRelease(totalHeld)))} due at DLP end: {formatDate(schedule.second_moiety_release_date.toISOString())}
              </p>
            </div>
            <button
              className="btn btn-primary btn-sm flex-shrink-0"
              onClick={() => void handleReleaseFirstMoiety()}
              disabled={releasing}
            >
              <Lock size={13} /> Release First Moiety
            </button>
          </div>
        )}

        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <h3 className="text-sm font-semibold">Retention Ledger</h3>
            <button className="btn btn-primary btn-sm">
              <Plus size={13} /> Add Entry
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th className="text-right">Amount</th>
                  <th>Description</th>
                  <th className="text-right">Balance After</th>
                  <th>Application</th>
                </tr>
              </thead>
              <tbody>
                {ledger.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8" style={{ color: "var(--text-muted)" }}>
                      No retention entries yet
                    </td>
                  </tr>
                ) : (
                  ledger.map((row) => (
                    <tr key={row.id}>
                      <td className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(row.date)}</td>
                      <td>{entryTypeBadge(row.entry_type)}</td>
                      <td className={cn(
                        "text-right tabular-nums font-semibold",
                        row.entry_type === "deduction" ? "text-[var(--warning)]" : "text-[var(--success)]"
                      )}>
                        {row.entry_type === "adjustment" && row.amount < 0 ? "" : row.entry_type === "deduction" ? "-" : "+"}
                        {formatCurrencyFull(Math.abs(row.amount))}
                      </td>
                      <td className="max-w-xs">
                        <span className="line-clamp-2 text-sm">{row.description}</span>
                      </td>
                      <td className="text-right tabular-nums">{formatCurrencyFull(row.balance_after)}</td>
                      <td>
                        {row.application_id ? (
                          <Link href={`/app/applications/${row.application_id}`} className="btn btn-ghost btn-icon btn-sm">
                            <ChevronRight size={13} />
                          </Link>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {ledger.length > 0 && (
                <tfoot>
                  <tr style={{ background: "var(--bg-subtle)" }}>
                    <td colSpan={2} className="px-3.5 py-3 font-bold text-xs uppercase" style={{ color: "var(--text-muted)" }}>
                      Current Balance
                    </td>
                    <td colSpan={4} className="px-3.5 py-3 text-right font-bold text-lg" style={{ color: "var(--warning)" }}>
                      {formatCurrencyFull(Math.max(0, totalHeld))}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} style={{ color: "var(--warning)" }} />
              <h3 className="text-sm font-semibold">Subcontract Retention (Back-to-Back)</h3>
            </div>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              Retention held from subcontractors — mirrors main contract retention position
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Trade</th>
                  <th className="text-right">Order Value</th>
                  <th className="text-right">Retention Held</th>
                  <th className="text-right">Retention %</th>
                </tr>
              </thead>
              <tbody>
                {SUBCONTRACT_RETENTION.map((s) => (
                  <tr key={s.supplier}>
                    <td className="font-semibold">{s.supplier}</td>
                    <td style={{ color: "var(--text-muted)" }}>{s.trade}</td>
                    <td className="text-right tabular-nums">{formatCurrencyFull(s.order_value)}</td>
                    <td className="text-right tabular-nums font-semibold" style={{ color: "var(--warning)" }}>
                      {formatCurrencyFull(s.retention_held)}
                    </td>
                    <td className="text-right tabular-nums text-xs" style={{ color: "var(--text-muted)" }}>
                      {((s.retention_held / s.order_value) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "var(--bg-subtle)" }}>
                  <td colSpan={3} className="px-3.5 py-3 font-bold text-xs uppercase" style={{ color: "var(--text-muted)" }}>Total Subcontract Retention</td>
                  <td className="px-3.5 py-3 text-right font-bold" style={{ color: "var(--warning)" }}>
                    {formatCurrencyFull(SUBCONTRACT_RETENTION.reduce((s, r) => s + r.retention_held, 0))}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RetentionPage() {
  return (
    <FeatureGate flag="retention_module">
      <RetentionPageContent />
    </FeatureGate>
  );
}

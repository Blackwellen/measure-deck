"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, RefreshCw, Settings2 } from "lucide-react";
import { cn, formatCurrencyFull, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { FeatureGate } from "@/components/ui/feature-gate";
import { KpiCard } from "@/components/ui/kpi-card";
import { SCurveChart } from "@/components/ui/s-curve-chart";
import { createAuditEvent } from "@/lib/audit";
import { getWorkspaceId } from "@/lib/workspace";
import {
  generateSCurve,
  updateActuals,
  forecastToComplete,
  type CashflowPeriod,
} from "@/lib/cashflow/s-curve";

type CashflowProfile = "linear" | "front_loaded" | "back_loaded" | "bell_curve";

interface ProjectMeta {
  id: string;
  name: string;
  contract_sum: number;
  start_date: string;
  end_date: string;
  projected_pc_date: string | null;
}

const SEED_META: ProjectMeta = {
  id: "seed",
  name: "Southbank Resi",
  contract_sum: 9_800_000,
  start_date: "2025-07-01",
  end_date: "2027-01-01",
  projected_pc_date: "2026-09-30",
};

const SEED_CERTIFICATIONS = [
  { month_year: "2025-07", certified_value: 288_000 },
  { month_year: "2025-08", certified_value: 436_500 },
  { month_year: "2025-09", certified_value: 642_600 },
  { month_year: "2025-10", certified_value: 819_000 },
  { month_year: "2025-11", certified_value: 950_000 },
  { month_year: "2025-12", certified_value: 780_000 },
  { month_year: "2026-01", certified_value: 1_045_000 },
  { month_year: "2026-02", certified_value: 890_000 },
  { month_year: "2026-03", certified_value: 1_210_000 },
  { month_year: "2026-04", certified_value: 1_358_900 },
];

const PROFILE_LABELS: Record<CashflowProfile, string> = {
  linear: "Linear",
  bell_curve: "Bell Curve",
  front_loaded: "Front Loaded",
  back_loaded: "Back Loaded",
};

function varianceClass(planned: number, actual: number): string {
  if (actual <= 0 || planned <= 0) return "";
  const ratio = actual / planned;
  if (ratio > 1.05) return "text-[var(--danger)]";
  if (ratio < 0.95) return "text-[var(--success)]";
  return "";
}

function CashflowPageContent() {
  const params = useParams();
  const router = useRouter();
  const projectId = String(params.projectId ?? "seed");

  const [meta, setMeta] = useState<ProjectMeta>(SEED_META);
  const [periods, setPeriods] = useState<CashflowPeriod[]>([]);
  const [profile, setProfile] = useState<CashflowProfile>("bell_curve");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showProfileEditor, setShowProfileEditor] = useState(false);

  const periodsRef = useRef<CashflowPeriod[]>([]);
  periodsRef.current = periods;

  const buildPeriods = useCallback((m: ProjectMeta, p: CashflowProfile, certs: Array<{ month_year: string; certified_value: number }>) => {
    const raw = generateSCurve({
      contract_sum: m.contract_sum,
      start_date: new Date(m.start_date),
      end_date: new Date(m.end_date),
      profile: p,
    });
    const withActuals = updateActuals(raw, certs);
    return forecastToComplete(withActuals, m.contract_sum, p === "front_loaded" || p === "back_loaded" ? "linear" : "bell_curve");
  }, []);

  const load = useCallback(async () => {
    try {
      const supabase = createClient();
      const [projRes, certsRes] = await Promise.all([
        supabase
          .from("projects")
          .select("id, name, contract_sum, start_date, end_date, projected_pc_date")
          .eq("id", projectId)
          .single(),
        supabase
          .from("applications")
          .select("month_year, certified_amount")
          .eq("project_id", projectId)
          .not("certified_amount", "is", null),
      ]);

      const projMeta: ProjectMeta = projRes.data
        ? {
            id: projRes.data.id as string,
            name: (projRes.data.name as string) ?? "Project",
            contract_sum: (projRes.data.contract_sum as number) ?? 9_800_000,
            start_date: (projRes.data.start_date as string) ?? "2025-07-01",
            end_date: (projRes.data.end_date as string) ?? "2027-01-01",
            projected_pc_date: projRes.data.projected_pc_date as string | null,
          }
        : SEED_META;

      setMeta(projMeta);

      const certs = certsRes.data && certsRes.data.length > 0
        ? (certsRes.data as Array<{ month_year: string; certified_amount: number }>).map((r) => ({
            month_year: r.month_year,
            certified_value: r.certified_amount,
          }))
        : SEED_CERTIFICATIONS;

      setPeriods(buildPeriods(projMeta, profile, certs));
    } catch {
      setPeriods(buildPeriods(SEED_META, profile, SEED_CERTIFICATIONS));
    } finally {
      setLoading(false);
    }
  }, [projectId, profile, buildPeriods]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRecalculate() {
    if (saving) return;
    setSaving(true);
    try {
      const supabase = createClient();
      const wsId = await getWorkspaceId(supabase);
      const { data: { user } } = await supabase.auth.getUser();

      const currentPeriods = periodsRef.current;
      const upserts = currentPeriods.map((p) => ({
        project_id: projectId,
        workspace_id: wsId,
        month_year: p.month_year,
        planned_cumulative: p.planned_cumulative,
        planned_monthly: p.planned_monthly,
        forecast_cumulative: p.forecast_cumulative ?? null,
        profile,
      }));

      await supabase.from("cashflow_forecasts").upsert(upserts, {
        onConflict: "project_id,month_year",
      });

      await createAuditEvent(supabase, {
        workspace_id: wsId,
        user_id: user?.id ?? "",
        action: "cashflow_forecast_recalculated",
        resource_type: "project",
        resource_id: projectId,
        new_values: { profile, periods: currentPeriods.length },
      });
    } catch {
      // silently ignored
    } finally {
      setSaving(false);
    }
  }

  function handleExportCSV() {
    const rows = [
      ["Month", "Planned Monthly", "Actual Monthly", "Planned Cumulative", "Actual Cumulative", "Forecast Cumulative", "Variance"],
      ...periods.map((p) => {
        const variance = p.actual_monthly !== undefined ? p.actual_monthly - p.planned_monthly : "";
        return [
          p.month_year,
          p.planned_monthly.toFixed(2),
          p.actual_monthly?.toFixed(2) ?? "",
          p.planned_cumulative.toFixed(2),
          p.actual_cumulative?.toFixed(2) ?? "",
          p.forecast_cumulative?.toFixed(2) ?? "",
          String(variance),
        ];
      }),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cashflow-${projectId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const chartData = periods.map((p) => ({
    month: p.month_year.slice(5),
    planned: p.planned_cumulative,
    actual: p.actual_cumulative,
    forecast: p.forecast_cumulative,
  }));

  const lastActual = periods.find((p) => p.actual_cumulative !== undefined && p.forecast_cumulative === undefined)?.actual_cumulative ?? 0;
  const currentSpendRate = lastActual / Math.max(1, periods.filter((p) => p.actual_monthly !== undefined).length);

  if (loading) {
    return (
      <div className="page-content space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-40 rounded-[var(--radius)]" />
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
            <h1 className="text-xl font-bold">Cashflow Forecast</h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {meta.name} &nbsp;·&nbsp; Profile: {PROFILE_LABELS[profile]}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn btn-secondary btn-sm" onClick={() => setShowProfileEditor(!showProfileEditor)}>
            <Settings2 size={14} /> Edit Profile
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => void handleRecalculate()}
            disabled={saving}
          >
            <RefreshCw size={14} className={saving ? "animate-spin" : ""} />
            {saving ? "Saving…" : "Recalculate Forecast"}
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <div className="page-content flex-1 space-y-6">
        {showProfileEditor && (
          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-3">Select Distribution Profile</h3>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(PROFILE_LABELS) as CashflowProfile[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={cn("btn btn-sm", profile === p ? "btn-primary" : "btn-secondary")}
                  onClick={() => {
                    setProfile(p);
                    setShowProfileEditor(false);
                  }}
                >
                  {PROFILE_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <KpiCard label="Contract Sum" value={formatCurrencyFull(meta.contract_sum)} variant="default" />
          <KpiCard label="Start Date" value={formatDate(meta.start_date)} variant="default" />
          <KpiCard label="End Date" value={formatDate(meta.end_date)} variant="default" />
          {meta.projected_pc_date && (
            <KpiCard label="PC Date" value={formatDate(meta.projected_pc_date)} variant="default" />
          )}
          <KpiCard label="Avg Monthly Spend" value={formatCurrencyFull(currentSpendRate)} variant="default" />
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4">S-Curve — Planned / Actual / Forecast</h3>
          <SCurveChart data={chartData} height={340} />
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
            <h3 className="text-sm font-semibold">Monthly Cashflow Breakdown</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th className="text-right">Planned Monthly</th>
                  <th className="text-right">Actual Monthly</th>
                  <th className="text-right">Forecast Monthly</th>
                  <th className="text-right">Cumul. Planned</th>
                  <th className="text-right">Cumul. Actual</th>
                  <th className="text-right">Variance</th>
                </tr>
              </thead>
              <tbody>
                {periods.map((p) => {
                  const variance = p.actual_monthly !== undefined
                    ? p.actual_monthly - p.planned_monthly
                    : null;
                  return (
                    <tr key={p.month_year}>
                      <td className="font-mono text-xs">{p.month_year}</td>
                      <td className="text-right tabular-nums">{formatCurrencyFull(p.planned_monthly)}</td>
                      <td className="text-right tabular-nums font-semibold">
                        {p.actual_monthly !== undefined ? formatCurrencyFull(p.actual_monthly) : "—"}
                      </td>
                      <td className="text-right tabular-nums text-xs" style={{ color: "var(--text-muted)" }}>
                        {p.forecast_cumulative !== undefined && p.actual_monthly === undefined
                          ? formatCurrencyFull(
                              periods[periods.indexOf(p) - 1]?.forecast_cumulative !== undefined
                                ? p.forecast_cumulative - (periods[periods.indexOf(p) - 1]?.forecast_cumulative ?? p.planned_cumulative - p.planned_monthly)
                                : p.planned_monthly
                            )
                          : "—"}
                      </td>
                      <td className="text-right tabular-nums" style={{ color: "var(--text-muted)" }}>
                        {formatCurrencyFull(p.planned_cumulative)}
                      </td>
                      <td className="text-right tabular-nums">
                        {p.actual_cumulative !== undefined ? formatCurrencyFull(p.actual_cumulative) : "—"}
                      </td>
                      <td className={cn("text-right tabular-nums font-semibold", variance !== null ? varianceClass(p.planned_monthly, p.actual_monthly ?? 0) : "")}>
                        {variance !== null
                          ? `${variance >= 0 ? "+" : ""}${formatCurrencyFull(variance)}`
                          : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CashflowPage() {
  return (
    <FeatureGate flag="cashflow_forecasting">
      <CashflowPageContent />
    </FeatureGate>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, TrendingUp, TrendingDown } from "lucide-react";
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from "recharts";
import { cn, formatCurrencyFull } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { FeatureGate } from "@/components/ui/feature-gate";
import { KpiCard } from "@/components/ui/kpi-card";
import { ComplianceBadge } from "@/components/ui/compliance-badge";
import { calculateEVM, type EVMMetrics } from "@/lib/evm/calculator";

type KpiVariant = "default" | "success" | "warning" | "danger";

interface EVMChartPoint {
  month: string;
  pv: number;
  ev: number;
  ac: number;
}

interface ProjectMeta {
  id: string;
  name: string;
  contract_sum: number;
}

const SEED_META: ProjectMeta = {
  id: "seed",
  name: "Southbank Resi",
  contract_sum: 9_800_000,
};

const SEED_EVM_CHART: EVMChartPoint[] = [
  { month: "Jul 25", pv: 280_000, ev: 288_000, ac: 260_000 },
  { month: "Aug 25", pv: 620_000, ev: 724_500, ac: 680_000 },
  { month: "Sep 25", pv: 1_100_000, ev: 1_367_100, ac: 1_210_000 },
  { month: "Oct 25", pv: 1_700_000, ev: 2_186_100, ac: 1_980_000 },
  { month: "Nov 25", pv: 2_500_000, ev: 3_136_100, ac: 2_900_000 },
  { month: "Dec 25", pv: 3_100_000, ev: 3_916_100, ac: 3_620_000 },
  { month: "Jan 26", pv: 3_900_000, ev: 4_961_100, ac: 4_620_000 },
  { month: "Feb 26", pv: 4_800_000, ev: 5_851_100, ac: 5_450_000 },
  { month: "Mar 26", pv: 5_700_000, ev: 7_061_100, ac: 6_540_000 },
  { month: "Apr 26", pv: 6_500_000, ev: 8_420_000, ac: 7_820_000 },
];

function cpiVariant(cpi: number): KpiVariant {
  if (cpi >= 0.95) return "success";
  if (cpi >= 0.85) return "warning";
  return "danger";
}

function spiVariant(spi: number): KpiVariant {
  if (spi >= 0.95) return "success";
  if (spi >= 0.85) return "warning";
  return "danger";
}

function statusToCompliance(status: EVMMetrics["status"]): "compliant" | "non_compliant" | "at_risk" {
  if (status === "on_track" || status === "under_budget" || status === "ahead_of_schedule") return "compliant";
  if (status === "over_budget_behind_schedule" || status === "over_budget") return "non_compliant";
  return "at_risk";
}

function statusLabel(status: EVMMetrics["status"]): string {
  const labels: Record<EVMMetrics["status"], string> = {
    on_track: "On Track",
    over_budget: "Over Budget",
    behind_schedule: "Behind Schedule",
    over_budget_behind_schedule: "Over Budget & Behind Schedule",
    under_budget: "Under Budget",
    ahead_of_schedule: "Ahead of Schedule",
  };
  return labels[status];
}

function EVMNarrative({ m }: { m: EVMMetrics }) {
  const cpiText = m.CPI >= 1 ? "under budget" : "over budget";
  const spiText = m.SPI > 1.02 ? "ahead of" : m.SPI < 0.98 ? "behind" : "on";
  const vacText = m.VAC >= 0 ? `under budget by ${formatCurrencyFull(Math.abs(m.VAC))}` : `over budget by ${formatCurrencyFull(Math.abs(m.VAC))}`;

  return (
    <div className="card p-5 space-y-2">
      <h3 className="text-sm font-semibold">EVM Narrative</h3>
      <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        At a CPI of{" "}
        <strong style={{ color: m.CPI >= 0.95 ? "var(--success)" : "var(--danger)" }}>
          {m.CPI.toFixed(3)}
        </strong>
        , the project is forecast to complete at{" "}
        <strong>{formatCurrencyFull(m.EAC)}</strong>, {vacText}. An SPI of{" "}
        <strong style={{ color: m.SPI >= 0.95 ? "var(--success)" : "var(--warning)" }}>
          {m.SPI.toFixed(3)}
        </strong>{" "}
        indicates the project is {spiText} schedule. The cost performance is{" "}
        <strong>{cpiText}</strong> with{" "}
        <strong>{formatCurrencyFull(Math.abs(m.CV))}</strong>{" "}
        {m.CV >= 0 ? "saving" : "overrun"}. The To-Complete Performance Index (TCPI) of{" "}
        <strong>{m.TCPI.toFixed(3)}</strong> reflects the efficiency required to complete within budget.
      </p>
    </div>
  );
}

function EVMPageContent() {
  const params = useParams();
  const router = useRouter();
  const projectId = String(params.projectId ?? "seed");

  const [meta, setMeta] = useState<ProjectMeta>(SEED_META);
  const [chartData, setChartData] = useState<EVMChartPoint[]>(SEED_EVM_CHART);
  const [metrics, setMetrics] = useState<EVMMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const supabase = createClient();
      const [projRes, cvrRes, cashflowRes] = await Promise.all([
        supabase
          .from("projects")
          .select("id, name, contract_sum")
          .eq("id", projectId)
          .single(),
        supabase
          .from("cvr_periods")
          .select("value_to_date, cost_to_date")
          .eq("project_id", projectId)
          .order("created_at", { ascending: false })
          .limit(1),
        supabase
          .from("cashflow_forecasts")
          .select("month_year, planned_cumulative")
          .eq("project_id", projectId)
          .order("month_year", { ascending: false })
          .limit(1),
      ]);

      const projData = projRes.data;
      const BAC = projData ? (projData.contract_sum as number) : SEED_META.contract_sum;
      const projName = projData ? (projData.name as string) : SEED_META.name;

      setMeta({ id: projectId, name: projName, contract_sum: BAC });

      const cvrData = cvrRes.data && cvrRes.data.length > 0 ? cvrRes.data[0] : null;
      const cashData = cashflowRes.data && cashflowRes.data.length > 0 ? cashflowRes.data[0] : null;

      const lastPoint = SEED_EVM_CHART[SEED_EVM_CHART.length - 1];
      const EV = cvrData ? (cvrData.value_to_date as number) : lastPoint.ev;
      const AC = cvrData ? (cvrData.cost_to_date as number) : lastPoint.ac;
      const PV = cashData ? (cashData.planned_cumulative as number) : lastPoint.pv;

      setMetrics(calculateEVM({ BAC, PV, EV, AC }));
      setChartData(SEED_EVM_CHART);
    } catch {
      const lastPoint = SEED_EVM_CHART[SEED_EVM_CHART.length - 1];
      const BAC = SEED_META.contract_sum;
      setMetrics(calculateEVM({ BAC, PV: lastPoint.pv, EV: lastPoint.ev, AC: lastPoint.ac }));
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || !metrics) {
    return (
      <div className="page-content space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-40 rounded-[var(--radius)]" />
        ))}
      </div>
    );
  }

  const complianceStatus = statusToCompliance(metrics.status);

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
            <h1 className="text-xl font-bold">Earned Value Management</h1>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {meta.name} &nbsp;·&nbsp; BAC: {formatCurrencyFull(metrics.BAC)}
            </p>
          </div>
        </div>
        <ComplianceBadge status={complianceStatus} label={statusLabel(metrics.status)} />
      </div>

      <div className="page-content flex-1 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KpiCard
            label="CPI"
            value={metrics.CPI.toFixed(3)}
            variant={cpiVariant(metrics.CPI)}
            change={metrics.CPI >= 1 ? "Under budget pace" : "Over budget pace"}
            trend={metrics.CPI >= 1 ? "up" : "down"}
          />
          <KpiCard
            label="SPI"
            value={metrics.SPI.toFixed(3)}
            variant={spiVariant(metrics.SPI)}
            change={metrics.SPI >= 1 ? "Ahead of schedule" : "Behind schedule"}
            trend={metrics.SPI >= 1 ? "up" : "down"}
          />
          <KpiCard
            label="EAC"
            value={formatCurrencyFull(metrics.EAC)}
            variant={metrics.EAC <= metrics.BAC ? "success" : "danger"}
            change={`BAC: ${formatCurrencyFull(metrics.BAC)}`}
          />
          <KpiCard
            label="VAC"
            value={formatCurrencyFull(metrics.VAC)}
            variant={metrics.VAC >= 0 ? "success" : "danger"}
            trend={metrics.VAC >= 0 ? "up" : "down"}
            change={metrics.VAC >= 0 ? "Under budget" : "Over budget"}
          />
          <KpiCard
            label="% Complete"
            value={`${metrics.percent_complete.toFixed(1)}%`}
            variant="default"
          />
          <KpiCard
            label="TCPI"
            value={metrics.TCPI.toFixed(3)}
            variant={metrics.TCPI <= 1.05 ? "success" : metrics.TCPI <= 1.1 ? "warning" : "danger"}
            change="Efficiency required"
          />
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4">EVM Performance Chart — PV / EV / AC</h3>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="cvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--text-muted)" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `£${(v / 1_000_000).toFixed(1)}m`}
              />
              <Tooltip
                formatter={(v: number, name: string) => [
                  formatCurrencyFull(v),
                  name === "pv" ? "Planned Value (PV)" : name === "ev" ? "Earned Value (EV)" : "Actual Cost (AC)",
                ]}
                contentStyle={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  fontSize: 12,
                }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(v: string) => {
                  const labels: Record<string, string> = { pv: "Planned Value (PV)", ev: "Earned Value (EV)", ac: "Actual Cost (AC)" };
                  return <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{labels[v] ?? v}</span>;
                }}
              />
              <Area
                type="monotone"
                dataKey="ac"
                name="ac"
                stroke="#ef4444"
                strokeWidth={2}
                fill="url(#cvGrad)"
                dot={false}
              />
              <Line type="monotone" dataKey="pv" name="pv" stroke="#3b82f6" strokeWidth={2} dot={false} strokeDasharray="5 3" />
              <Line type="monotone" dataKey="ev" name="ev" stroke="#22c55e" strokeWidth={2.5} dot={{ r: 3, fill: "#22c55e" }} />
              <ReferenceLine y={metrics.BAC} stroke="var(--border-strong)" strokeDasharray="4 2" label={{ value: "BAC", fontSize: 10, fill: "var(--text-muted)" }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="card p-5 space-y-3">
            <h3 className="text-sm font-semibold">Variance Waterfall</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--bg-subtle)" }}>
                <div className="flex items-center gap-2">
                  {metrics.SV >= 0
                    ? <TrendingUp size={15} style={{ color: "var(--success)" }} />
                    : <TrendingDown size={15} style={{ color: "var(--danger)" }} />}
                  <span className="text-sm font-medium">Schedule Variance (SV)</span>
                </div>
                <div className="text-right">
                  <span className={cn("text-sm font-bold tabular-nums", metrics.SV >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]")}>
                    {metrics.SV >= 0 ? "+" : ""}{formatCurrencyFull(metrics.SV)}
                  </span>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {metrics.SV >= 0 ? "Ahead of schedule" : "Behind schedule"}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--bg-subtle)" }}>
                <div className="flex items-center gap-2">
                  {metrics.CV >= 0
                    ? <TrendingUp size={15} style={{ color: "var(--success)" }} />
                    : <TrendingDown size={15} style={{ color: "var(--danger)" }} />}
                  <span className="text-sm font-medium">Cost Variance (CV)</span>
                </div>
                <div className="text-right">
                  <span className={cn("text-sm font-bold tabular-nums", metrics.CV >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]")}>
                    {metrics.CV >= 0 ? "+" : ""}{formatCurrencyFull(metrics.CV)}
                  </span>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {metrics.CV >= 0 ? "Under budget" : "Over budget"}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: "var(--bg-subtle)" }}>
                <span className="text-sm font-medium">Estimate to Complete (ETC)</span>
                <span className="text-sm font-bold tabular-nums">{formatCurrencyFull(metrics.ETC)}</span>
              </div>
            </div>
          </div>

          <EVMNarrative m={metrics} />
        </div>
      </div>
    </div>
  );
}

export default function EVMPage() {
  return (
    <FeatureGate flag="evm_dashboard">
      <EVMPageContent />
    </FeatureGate>
  );
}

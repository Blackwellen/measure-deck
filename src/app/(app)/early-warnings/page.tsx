"use client";

import { EWRWizard } from "@/components/wizards/ewr-wizard";
import { KpiCard } from "@/components/ui/kpi-card";
import { MobileCardList } from "@/components/ui/mobile-card-list";
import { PageHeader } from "@/components/ui/page-header";
import { RiskMatrix } from "@/components/ui/risk-matrix";
import { StatusChip } from "@/components/ui/status-chip";
import { createClient } from "@/lib/supabase/client";
import { getWorkspaceId } from "@/lib/workspace";
import { cn } from "@/lib/utils";
import {
  AlertTriangle, Download, Plus, Search,
  TrendingUp, TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type EWStatus = "open" | "reducing" | "mitigated" | "converted_to_ce" | "closed";

interface EarlyWarning {
  id: string;
  ew_number: string;
  title: string;
  category: string;
  risk_owner: string | null;
  cost_impact: number | null;
  programme_impact_days: number | null;
  likelihood: number;
  impact: number;
  status: EWStatus;
  linked_ce_id: string | null;
  created_at: string;
  projects: { name: string } | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function riskScore(ew: EarlyWarning): number {
  return (ew.likelihood ?? 1) * (ew.impact ?? 1);
}

function riskBadgeClass(score: number): string {
  if (score >= 15) return "chip-danger";
  if (score >= 10) return "chip-warning";
  if (score >= 5) return "chip-info";
  return "chip-success";
}

function riskColourText(score: number): string {
  if (score >= 15) return "text-red-700";
  if (score >= 10) return "text-red-600";
  if (score >= 5) return "text-amber-700";
  return "text-green-700";
}

function exportToCSV(ews: EarlyWarning[]): void {
  const headers = [
    "EW#", "Title", "Project", "Category", "Cost Risk (£)",
    "Programme Risk (days)", "Likelihood", "Impact", "Risk Score",
    "Status", "Linked CE", "Risk Owner",
  ];
  const rows = ews.map(ew => [
    ew.ew_number,
    `"${ew.title.replace(/"/g, '""')}"`,
    ew.projects?.name ?? "",
    ew.category,
    ew.cost_impact ?? "",
    ew.programme_impact_days ?? "",
    ew.likelihood,
    ew.impact,
    riskScore(ew),
    ew.status,
    ew.linked_ce_id ?? "",
    ew.risk_owner ?? "",
  ]);
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `early-warning-register-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EarlyWarningsPage() {
  const [ews, setEws] = React.useState<EarlyWarning[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showWizard, setShowWizard] = React.useState(false);
  const [selectedEwId, setSelectedEwId] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const tableRef = React.useRef<HTMLDivElement>(null);

  async function load() {
    setLoading(true);
    try {
      const supabase = createClient();
      const workspaceId = await getWorkspaceId(supabase);
      const { data } = await supabase
        .from("early_warnings")
        .select("*, projects(name)")
        .eq("workspace_id", workspaceId)
        .order("risk_score", { ascending: false });
      setEws((data ?? []) as EarlyWarning[]);
    } catch {
      setEws([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void load();
  }, []);

  // Scroll + highlight on matrix click
  function handleMatrixItemClick(id: string) {
    setSelectedEwId(id);
    setTimeout(() => {
      const row = document.getElementById(`ew-row-${id}`);
      if (row) {
        row.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  }

  // KPIs
  const openCount = ews.filter(e => e.status === "open").length;
  const highRiskCount = ews.filter(e => riskScore(e) >= 15).length;
  const convertedCount = ews.filter(e => e.status === "converted_to_ce").length;
  const totalCostRisk = ews
    .filter(e => e.status === "open" || e.status === "reducing")
    .reduce((s, e) => s + (e.cost_impact ?? 0), 0);

  // Filters
  const filtered = ews.filter(ew => {
    if (statusFilter !== "all" && ew.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        ew.ew_number.toLowerCase().includes(q) ||
        ew.title.toLowerCase().includes(q) ||
        (ew.projects?.name ?? "").toLowerCase().includes(q) ||
        (ew.risk_owner ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Risk matrix items (open + reducing only)
  const matrixItems = ews
    .filter(e => e.status === "open" || e.status === "reducing")
    .map(e => ({
      id: e.id,
      label: `${e.ew_number}: ${e.title}`,
      likelihood: Math.max(1, Math.min(5, e.likelihood)) as 1 | 2 | 3 | 4 | 5,
      impact: Math.max(1, Math.min(5, e.impact)) as 1 | 2 | 3 | 4 | 5,
    }));

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Early Warning Register"
        subtitle="NEC4 Clause 15 risk notification tracker"
        actions={
          <>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => exportToCSV(ews)}
              disabled={ews.length === 0}
            >
              <Download className="w-4 h-4" />
              Export EWR
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => setShowWizard(true)}
            >
              <Plus className="w-4 h-4" />
              Add Early Warning
            </button>
          </>
        }
      />

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Open EWs"
          value={openCount}
          icon={AlertTriangle}
          variant={openCount > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="High / Critical Risk"
          value={highRiskCount}
          icon={TriangleAlert}
          variant={highRiskCount > 0 ? "danger" : "default"}
        />
        <KpiCard
          label="Converted to CE"
          value={convertedCount}
          icon={TrendingUp}
          variant="default"
        />
        <KpiCard
          label="Total Cost Risk"
          value={totalCostRisk > 0 ? `£${totalCostRisk.toLocaleString()}` : "£0"}
          variant={totalCostRisk > 50000 ? "danger" : totalCostRisk > 0 ? "warning" : "default"}
        />
      </div>

      {/* Risk Matrix */}
      {matrixItems.length > 0 && (
        <div className="card p-5">
          <h3
            className="text-[13px] font-700 mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Risk Matrix — Open &amp; Reducing EWs
          </h3>
          <RiskMatrixWithClick items={matrixItems} onItemClick={handleMatrixItemClick} />
        </div>
      )}

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="search"
            className="form-input pl-9 h-9 w-full text-sm"
            placeholder="Search EWs…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="form-input h-9 text-sm w-auto"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="open">Open</option>
          <option value="reducing">Reducing</option>
          <option value="mitigated">Mitigated</option>
          <option value="converted_to_ce">Converted to CE</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Mobile card list */}
      <div className="md:hidden">
        <MobileCardList
          items={filtered}
          keyExtractor={ew => ew.id}
          isLoading={loading}
          emptyState={
            <div className="text-center py-12" style={{ color: "var(--text-muted)" }}>
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-[13px]">No early warnings found</p>
            </div>
          }
          renderCard={ew => {
            const score = riskScore(ew);
            return (
              <Link href={`/app/early-warnings/${ew.id}`} className="block">
                <div
                  className={cn(
                    "p-4 border rounded-lg transition-colors",
                    selectedEwId === ew.id && "ring-2 ring-[var(--primary)]"
                  )}
                  style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
                >
                  <div className="flex justify-between items-start">
                    <span
                      className="font-mono text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {ew.ew_number}
                    </span>
                    <StatusChip status={ew.status} size="sm" />
                  </div>
                  <p
                    className="font-semibold mt-1 text-[14px]"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {ew.title}
                  </p>
                  <div
                    className="flex gap-3 mt-2 text-sm flex-wrap"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {ew.projects?.name && <span>{ew.projects.name}</span>}
                    <span>
                      Risk:{" "}
                      <strong className={riskColourText(score)}>{score}</strong>
                    </span>
                    {ew.cost_impact != null && (
                      <span>£{ew.cost_impact.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          }}
        />
      </div>

      {/* Desktop data table */}
      <div ref={tableRef} className="card overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>EW #</th>
                <th>Title</th>
                <th>Project</th>
                <th>Risk Owner</th>
                <th className="text-right">Cost Risk (£)</th>
                <th className="text-right">Programme (days)</th>
                <th className="text-center">Risk Score</th>
                <th>Status</th>
                <th>Linked CE</th>
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
                  <td
                    colSpan={10}
                    className="text-center py-12"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <AlertTriangle className="w-6 h-6 mx-auto mb-2 opacity-40" />
                    <p className="text-[13px]">No early warnings found</p>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm mt-3"
                      onClick={() => setShowWizard(true)}
                    >
                      <Plus className="w-4 h-4" />
                      Add First EW
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map(ew => {
                  const score = riskScore(ew);
                  const isSelected = selectedEwId === ew.id;
                  return (
                    <tr
                      key={ew.id}
                      id={`ew-row-${ew.id}`}
                      className={cn(
                        "transition-colors cursor-pointer",
                        isSelected && "bg-[var(--primary-subtle)] ring-1 ring-[var(--primary)]"
                      )}
                      onClick={() => setSelectedEwId(ew.id)}
                    >
                      <td>
                        <Link
                          href={`/app/early-warnings/${ew.id}`}
                          className="font-mono text-[12px] font-600 hover:underline"
                          style={{ color: "var(--primary)" }}
                          onClick={e => e.stopPropagation()}
                        >
                          {ew.ew_number}
                        </Link>
                      </td>
                      <td className="font-medium max-w-[240px]">
                        <span className="line-clamp-2">{ew.title}</span>
                      </td>
                      <td className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                        {ew.projects?.name ?? "—"}
                      </td>
                      <td className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                        {ew.risk_owner ?? "—"}
                      </td>
                      <td className="text-right tabular-nums text-[12px]">
                        {ew.cost_impact != null
                          ? `£${ew.cost_impact.toLocaleString()}`
                          : "—"}
                      </td>
                      <td className="text-right tabular-nums text-[12px]">
                        {ew.programme_impact_days != null
                          ? `${ew.programme_impact_days}d`
                          : "—"}
                      </td>
                      <td className="text-center">
                        <span className={cn("chip text-[11px] font-700", riskBadgeClass(score))}>
                          {score}
                        </span>
                      </td>
                      <td>
                        <StatusChip status={ew.status} size="sm" />
                      </td>
                      <td className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {ew.linked_ce_id ? (
                          <span className="chip chip-info text-[10px]">Linked</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        <Link
                          href={`/app/early-warnings/${ew.id}`}
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={e => e.stopPropagation()}
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

      {/* Wizard */}
      {showWizard && (
        <EWRWizard
          onClose={() => setShowWizard(false)}
          onCreated={() => { void load(); }}
        />
      )}
    </div>
  );
}

// ─── Risk Matrix with click callback ─────────────────────────────────────────
// We extend the RiskMatrix by wrapping each dot with an onClick handler.
// Since RiskMatrix doesn't expose per-item click callbacks, we recreate the
// dot-click logic here as a thin wrapper that intercepts the title attribute.

interface RMItem {
  id: string;
  label: string;
  likelihood: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
}

function RiskMatrixWithClick({
  items,
  onItemClick,
}: {
  items: RMItem[];
  onItemClick: (id: string) => void;
}) {
  // We use a wrapper div to intercept title-based hover clicks
  // The RiskMatrix renders dots with title={risk.label} — we match label to id
  // Instead of rewriting RiskMatrix, we capture clicks on the container
  // and walk up to find the title, then match against items.
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const target = e.target as HTMLElement;
    const title = target.getAttribute("title");
    if (!title) return;
    const match = items.find(i => i.label === title);
    if (match) onItemClick(match.id);
  }

  return (
    <div onClick={handleClick}>
      <RiskMatrix items={items} />
    </div>
  );
}

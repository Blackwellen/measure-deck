"use client";

import React from "react";
import Link from "next/link";
import { Download, Plus, Search, ClipboardList } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getWorkspaceId } from "@/lib/workspace";
import { getFlag } from "@/lib/feature-flags";
import { cn } from "@/lib/utils";

interface DayworkSheet {
  id: string;
  sheet_number: string;
  date: string;
  description: string;
  labour_total: number;
  plant_total: number;
  material_total: number;
  grand_total: number;
  status: string;
  agreed_on_site: boolean;
  projects: { name: string } | null;
}

function fmtCurrency(n: number): string {
  return `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function statusChipClass(status: string): string {
  if (status === "agreed") return "chip chip-success";
  if (status === "submitted") return "chip chip-info";
  if (status === "draft") return "chip chip-warning";
  if (status === "disputed") return "chip chip-danger";
  return "chip";
}

function exportCSV(sheets: DayworkSheet[]) {
  const headers = [
    "DW #", "Project", "Date", "Description",
    "Labour (£)", "Plant (£)", "Materials (£)", "Grand Total (£)",
    "Status", "Agreed on Site",
  ];
  const rows = sheets.map(s => [
    s.sheet_number,
    s.projects?.name ?? "",
    s.date,
    `"${s.description.replace(/"/g, '""')}"`,
    s.labour_total.toFixed(2),
    s.plant_total.toFixed(2),
    s.material_total.toFixed(2),
    s.grand_total.toFixed(2),
    s.status,
    s.agreed_on_site ? "Yes" : "No",
  ]);
  const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `daywork-register-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DayworksPage() {
  const [flagEnabled] = React.useState(() => getFlag("mobile_dayworks"));
  const [sheets, setSheets] = React.useState<DayworkSheet[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [projectFilter, setProjectFilter] = React.useState("all");
  const [projects, setProjects] = React.useState<{ id: string; name: string }[]>([]);

  async function load() {
    setLoading(true);
    try {
      const supabase = createClient();
      const wsId = await getWorkspaceId(supabase);
      const { data } = await supabase
        .from("daywork_sheets")
        .select("*, projects(name)")
        .eq("workspace_id", wsId)
        .order("date", { ascending: false });
      const rows = (data ?? []) as DayworkSheet[];
      setSheets(rows);
      const seen = new Set<string>();
      const ps: { id: string; name: string }[] = [];
      for (const r of rows) {
        if (r.projects?.name && !seen.has(r.projects.name)) {
          seen.add(r.projects.name);
          ps.push({ id: r.projects.name, name: r.projects.name });
        }
      }
      setProjects(ps);
    } catch {
      setSheets([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    if (flagEnabled) void load();
    else setLoading(false);
  }, [flagEnabled]);

  const filtered = sheets.filter(s => {
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    if (projectFilter !== "all" && s.projects?.name !== projectFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.sheet_number.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        (s.projects?.name ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalSheets = sheets.length;
  const submitted = sheets.filter(s => s.status === "submitted").length;
  const agreed = sheets.filter(s => s.status === "agreed").length;
  const totalValue = sheets.reduce((a, s) => a + s.grand_total, 0);

  if (!flagEnabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
        <ClipboardList size={48} style={{ color: "var(--text-muted)" }} className="opacity-40" />
        <h2 className="text-xl font-semibold" style={{ color: "var(--text-primary)" }}>
          Dayworks not enabled
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          This feature requires the Mobile Dayworks add-on.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Daywork Register
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Site daywork capture and management
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => exportCSV(sheets)}
            disabled={sheets.length === 0}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <Link href="/app/dayworks/mobile" className="btn btn-primary btn-sm">
            <Plus className="w-4 h-4" />
            New Daywork
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total Sheets" value={totalSheets} />
        <KpiCard label="Submitted" value={submitted} />
        <KpiCard label="Agreed" value={agreed} />
        <KpiCard label="Total Value" value={fmtCurrency(totalValue)} />
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
            placeholder="Search dayworks…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-input h-9 text-sm w-auto"
          value={projectFilter}
          onChange={e => setProjectFilter(e.target.value)}
        >
          <option value="all">All projects</option>
          {projects.map(p => (
            <option key={p.id} value={p.name}>{p.name}</option>
          ))}
        </select>
        <select
          className="form-input h-9 text-sm w-auto"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="agreed">Agreed</option>
          <option value="disputed">Disputed</option>
        </select>
      </div>

      <div className="md:hidden flex flex-col gap-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-4 space-y-2">
              <div className="skeleton h-4 w-24 rounded" />
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-16" style={{ color: "var(--text-muted)" }}>
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium mb-3">No daywork sheets found</p>
            <Link href="/app/dayworks/mobile" className="btn btn-primary btn-sm">
              <Plus className="w-4 h-4" />
              Capture First Daywork
            </Link>
          </div>
        ) : (
          filtered.map(s => (
            <div
              key={s.id}
              className="card p-4 flex flex-col gap-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold" style={{ color: "var(--primary)" }}>
                  {s.sheet_number}
                </span>
                <span className={statusChipClass(s.status)}>{s.status}</span>
              </div>
              <p className="text-sm font-medium line-clamp-2" style={{ color: "var(--text-primary)" }}>
                {s.description}
              </p>
              <div className="flex flex-wrap gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                {s.projects?.name && <span>{s.projects.name}</span>}
                <span>{s.date}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Grand Total</span>
                <span className="font-mono font-bold text-sm" style={{ color: "var(--primary)" }}>
                  {fmtCurrency(s.grand_total)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="card overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>DW #</th>
                <th>Project</th>
                <th>Date</th>
                <th>Description</th>
                <th className="text-right">Labour (£)</th>
                <th className="text-right">Plant (£)</th>
                <th className="text-right">Materials (£)</th>
                <th className="text-right">Grand Total (£)</th>
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
                    <ClipboardList className="w-6 h-6 mx-auto mb-2 opacity-40" />
                    <p className="text-[13px] mb-3">No daywork sheets found</p>
                    <Link href="/app/dayworks/mobile" className="btn btn-primary btn-sm">
                      <Plus className="w-4 h-4" />
                      Capture First Daywork
                    </Link>
                  </td>
                </tr>
              ) : (
                filtered.map(s => (
                  <tr key={s.id}>
                    <td>
                      <span className="font-mono text-[12px] font-semibold" style={{ color: "var(--primary)" }}>
                        {s.sheet_number}
                      </span>
                    </td>
                    <td className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                      {s.projects?.name ?? "—"}
                    </td>
                    <td className="text-[12px] tabular-nums" style={{ color: "var(--text-muted)" }}>
                      {s.date}
                    </td>
                    <td className="max-w-[240px]">
                      <span className="text-[12px] line-clamp-2">{s.description}</span>
                    </td>
                    <td className="text-right tabular-nums text-[12px]">
                      {fmtCurrency(s.labour_total)}
                    </td>
                    <td className="text-right tabular-nums text-[12px]">
                      {fmtCurrency(s.plant_total)}
                    </td>
                    <td className="text-right tabular-nums text-[12px]">
                      {fmtCurrency(s.material_total)}
                    </td>
                    <td className="text-right tabular-nums font-semibold text-[13px]" style={{ color: "var(--primary)" }}>
                      {fmtCurrency(s.grand_total)}
                    </td>
                    <td>
                      <span className={cn(statusChipClass(s.status), "text-[11px]")}>
                        {s.status}
                      </span>
                    </td>
                    <td>
                      <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                        {s.agreed_on_site ? "✓ Agreed" : ""}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Link
        href="/app/dayworks/mobile"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-20 md:hidden"
        style={{ background: "var(--primary)" }}
        aria-label="New Daywork"
      >
        <Plus size={24} color="white" />
      </Link>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card p-4 flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        {label}
      </span>
      <span className="text-xl font-bold tabular-nums" style={{ color: "var(--text-primary)" }}>
        {value}
      </span>
    </div>
  );
}

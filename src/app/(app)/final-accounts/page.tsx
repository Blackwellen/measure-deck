"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Plus, Download, Filter, BookmarkPlus, Search,
  LayoutList, LayoutGrid, Columns3, AlertCircle, Brain,
  MoreHorizontal, ChevronRight, FileText, Sparkles, Eye,
} from "lucide-react";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type FAStatus = "draft" | "in_negotiation" | "agreed" | "disputed" | "closed" | "archived";

interface FinalAccount {
  id: string;
  ref: string;
  project: string;
  project_id: string;
  originalSum: number;
  finalSum: number;
  status: FAStatus;
  targetAgreementDate: string | null;
  createdAt: string;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_FINAL_ACCOUNTS: FinalAccount[] = [
  {
    id: "fa-001",
    ref: "FA-2026-001",
    project: "Whitfield Leisure Centre",
    project_id: "proj-007",
    originalSum: 2_400_000,
    finalSum: 2_463_500,
    status: "in_negotiation",
    targetAgreementDate: "2026-08-31",
    createdAt: "2026-04-01",
  },
  {
    id: "fa-002",
    ref: "FA-2025-002",
    project: "Thornfield Commercial Hub",
    project_id: "proj-003",
    originalSum: 3_850_000,
    finalSum: 3_935_000,
    status: "disputed",
    targetAgreementDate: "2026-07-01",
    createdAt: "2026-01-15",
  },
  {
    id: "fa-003",
    ref: "FA-2024-003",
    project: "Parklands Primary School",
    project_id: "proj-008",
    originalSum: 4_200_000,
    finalSum: 4_246_000,
    status: "agreed",
    targetAgreementDate: "2025-06-30",
    createdAt: "2025-01-10",
  },
];

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_META: Record<FAStatus, { chip: string; label: string; color: string }> = {
  draft:          { chip: "chip-muted",    label: "Draft",          color: "var(--text-muted)" },
  in_negotiation: { chip: "chip-warning",  label: "In Negotiation", color: "var(--warning)" },
  agreed:         { chip: "chip-success",  label: "Agreed",         color: "var(--success)" },
  disputed:       { chip: "chip-danger",   label: "Disputed",       color: "var(--danger)" },
  closed:         { chip: "chip-info",     label: "Closed",         color: "var(--info)" },
  archived:       { chip: "chip-muted",    label: "Archived",       color: "var(--text-muted)" },
};

type ViewMode = "table" | "card" | "closeout" | "dispute" | "outstanding";

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FinalAccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<FinalAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<FAStatus | "all">("all");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase.from("final_accounts").select("*").order("created_at", { ascending: false });
        setAccounts(data && data.length > 0 ? (data as FinalAccount[]) : SEED_FINAL_ACCOUNTS);
      } catch {
        setAccounts(SEED_FINAL_ACCOUNTS);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = accounts.filter(fa => {
    const matchSearch = !search ||
      fa.project.toLowerCase().includes(search.toLowerCase()) ||
      fa.ref.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || fa.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const VIEW_TABS: { mode: ViewMode; label: string }[] = [
    { mode: "table",       label: "Table" },
    { mode: "card",        label: "Cards" },
    { mode: "closeout",    label: "Close-Out Board" },
    { mode: "dispute",     label: "Dispute View" },
    { mode: "outstanding", label: "Outstanding Items" },
  ];

  const totalOriginal = filtered.reduce((s, fa) => s + fa.originalSum, 0);
  const totalFinal = filtered.reduce((s, fa) => s + fa.finalSum, 0);
  const disputed = filtered.filter(fa => fa.status === "disputed").length;

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Final Accounts</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {accounts.length} final accounts · {formatCurrency(totalFinal)} total agreed
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn btn-secondary btn-sm" style={{ color: "var(--violet)" }}>
            <Sparkles size={14} />AI Close-Out Summary
          </button>
          <button className="btn btn-secondary btn-sm"><Download size={14} />Export</button>
          <button className="btn btn-secondary btn-sm"><Filter size={14} />Filter</button>
          <button className="btn btn-secondary btn-sm"><BookmarkPlus size={14} />Saved Views</button>
          <button className="btn btn-primary btn-sm" onClick={() => router.push("/app/final-accounts/new")}>
            <Plus size={14} />New Final Account
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="px-6 pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="kpi-card">
          <div className="kpi-label">Total Accounts</div>
          <div className="kpi-value">{accounts.length}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Original Sum</div>
          <div className="kpi-value">{formatCurrency(totalOriginal)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Final Sum</div>
          <div className="kpi-value">{formatCurrency(totalFinal)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Disputed</div>
          <div className="kpi-value" style={{ color: disputed > 0 ? "var(--danger)" : "var(--text-primary)" }}>
            {disputed}
          </div>
        </div>
      </div>

      {/* View tabs + search */}
      <div className="px-6 pt-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-1 bg-[var(--bg-muted)] rounded-[var(--radius)] p-1">
          {VIEW_TABS.map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => setView(mode)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all",
                view === mode
                  ? "bg-white text-[var(--text-primary)] shadow-sm"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
            <input
              className="form-input h-8 text-sm pl-8 w-52"
              placeholder="Search final accounts…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-input h-8 text-sm w-44"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as FAStatus | "all")}
          >
            <option value="all">All Statuses</option>
            {(Object.keys(STATUS_META) as FAStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_META[s].label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="page-content flex-1 pt-4" ref={menuRef}>
        {loading ? (
          <div className="card p-4 flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-12 rounded-[var(--radius)]" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon"><FileText size={22} /></div>
              <h3 className="text-base font-semibold">No final accounts yet</h3>
              <p className="text-sm max-w-xs" style={{ color: "var(--text-muted)" }}>
                Create a final account to start the close-out process for a completed project.
              </p>
              <button className="btn btn-primary btn-sm mt-2" onClick={() => router.push("/app/final-accounts/new")}>
                <Plus size={14} />New Final Account
              </button>
            </div>
          </div>
        ) : (
          <>
            {view === "table" && (
              <TableView accounts={filtered} onRowClick={id => router.push(`/app/final-accounts/${id}`)} openMenuId={openMenuId} setOpenMenuId={setOpenMenuId} />
            )}
            {view === "card" && (
              <CardView accounts={filtered} onOpen={id => router.push(`/app/final-accounts/${id}`)} />
            )}
            {view === "closeout" && <CloseOutBoard accounts={filtered} onOpen={id => router.push(`/app/final-accounts/${id}`)} />}
            {view === "dispute" && <DisputeView accounts={filtered.filter(fa => fa.status === "disputed")} />}
            {view === "outstanding" && <OutstandingView accounts={filtered} />}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Table View ───────────────────────────────────────────────────────────────

function TableView({ accounts, onRowClick, openMenuId, setOpenMenuId }: {
  accounts: FinalAccount[];
  onRowClick: (id: string) => void;
  openMenuId: string | null;
  setOpenMenuId: (id: string | null) => void;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Ref</th>
              <th>Project</th>
              <th className="text-right">Original Sum</th>
              <th className="text-right">Final Sum</th>
              <th className="text-right">Movement</th>
              <th>Status</th>
              <th>Target Agreement</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {accounts.map(fa => {
              const movement = fa.finalSum - fa.originalSum;
              return (
                <tr key={fa.id} className="cursor-pointer" onClick={() => onRowClick(fa.id)}>
                  <td className="font-mono text-xs font-semibold" style={{ color: "var(--primary)" }}>{fa.ref}</td>
                  <td className="font-semibold">{fa.project}</td>
                  <td className="text-right tabular-nums">{formatCurrency(fa.originalSum)}</td>
                  <td className="text-right tabular-nums font-semibold">{formatCurrency(fa.finalSum)}</td>
                  <td className={cn("text-right tabular-nums font-semibold", movement >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]")}>
                    {movement >= 0 ? "+" : ""}{formatCurrency(movement)}
                  </td>
                  <td>
                    <span className={cn("badge", STATUS_META[fa.status].chip)}>{STATUS_META[fa.status].label}</span>
                  </td>
                  <td className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {fa.targetAgreementDate ? formatDate(fa.targetAgreementDate) : "—"}
                  </td>
                  <td onClick={e => e.stopPropagation()} className="relative">
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => setOpenMenuId(openMenuId === fa.id ? null : fa.id)}
                    >
                      <MoreHorizontal size={14} />
                    </button>
                    {openMenuId === fa.id && (
                      <div
                        className="absolute right-0 top-8 z-50 min-w-[140px] rounded-[var(--radius)] shadow-[var(--shadow-md)] border overflow-hidden"
                        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                      >
                        <button
                          className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-[var(--bg-subtle)] text-left"
                          onClick={() => { setOpenMenuId(null); onRowClick(fa.id); }}
                        >
                          <Eye size={13} />Open
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Card View ────────────────────────────────────────────────────────────────

function CardView({ accounts, onOpen }: { accounts: FinalAccount[]; onOpen: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {accounts.map(fa => {
        const movement = fa.finalSum - fa.originalSum;
        const pct = fa.originalSum > 0 ? ((fa.finalSum / fa.originalSum) * 100 - 100) : 0;
        return (
          <div
            key={fa.id}
            className="card p-5 flex flex-col gap-3 hover:shadow-[var(--shadow-md)] transition-shadow cursor-pointer"
            onClick={() => onOpen(fa.id)}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-mono text-xs font-semibold" style={{ color: "var(--primary)" }}>{fa.ref}</span>
              <span className={cn("badge", STATUS_META[fa.status].chip)}>{STATUS_META[fa.status].label}</span>
            </div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{fa.project}</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Original Sum</p>
                <p className="text-sm font-semibold tabular-nums">{formatCurrency(fa.originalSum)}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Final Sum</p>
                <p className="text-sm font-semibold tabular-nums">{formatCurrency(fa.finalSum)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span
                className="text-xs font-semibold"
                style={{ color: movement >= 0 ? "var(--success)" : "var(--danger)" }}
              >
                {movement >= 0 ? "+" : ""}{formatCurrency(movement)} ({pct >= 0 ? "+" : ""}{pct.toFixed(1)}%)
              </span>
              {fa.targetAgreementDate && (
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Target: {formatDate(fa.targetAgreementDate)}</span>
              )}
            </div>
            <button
              className="btn btn-secondary btn-sm w-full text-xs"
              onClick={e => { e.stopPropagation(); onOpen(fa.id); }}
            >
              Open Final Account <ChevronRight size={11} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Close-Out Board ──────────────────────────────────────────────────────────

function CloseOutBoard({ accounts, onOpen }: { accounts: FinalAccount[]; onOpen: (id: string) => void }) {
  const columns: FAStatus[] = ["draft", "in_negotiation", "agreed", "disputed", "closed"];

  return (
    <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 400 }}>
      {columns.map(status => {
        const items = accounts.filter(fa => fa.status === status);
        const meta = STATUS_META[status];
        return (
          <div key={status} className="flex-shrink-0 w-64">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-secondary)" }}>{meta.label}</span>
              <span className="ml-auto text-xs bg-[var(--bg-muted)] rounded-full px-2 py-0.5" style={{ color: "var(--text-muted)" }}>{items.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {items.map(fa => (
                <button
                  key={fa.id}
                  onClick={() => onOpen(fa.id)}
                  className="card p-3 text-left w-full hover:shadow-[var(--shadow-md)] transition-shadow"
                >
                  <p className="font-mono text-[10px] font-semibold mb-1" style={{ color: "var(--primary)" }}>{fa.ref}</p>
                  <p className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>{fa.project}</p>
                  <p className="text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>{formatCurrency(fa.finalSum)}</p>
                </button>
              ))}
              {items.length === 0 && (
                <div className="rounded-[var(--radius)] border-2 border-dashed h-20 flex items-center justify-center text-xs" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                  None
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Dispute View ─────────────────────────────────────────────────────────────

function DisputeView({ accounts }: { accounts: FinalAccount[] }) {
  if (accounts.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-icon"><AlertCircle size={22} /></div>
          <h3 className="text-base font-semibold">No Disputed Accounts</h3>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>There are no final accounts currently in dispute.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ref</th>
                <th>Project</th>
                <th className="text-right">Original Sum</th>
                <th className="text-right">Final Sum</th>
                <th>Target Agreement</th>
                <th>Dispute Value</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(fa => (
                <tr key={fa.id}>
                  <td className="font-mono text-xs font-semibold" style={{ color: "var(--primary)" }}>{fa.ref}</td>
                  <td className="font-semibold">{fa.project}</td>
                  <td className="text-right tabular-nums">{formatCurrency(fa.originalSum)}</td>
                  <td className="text-right tabular-nums font-semibold" style={{ color: "var(--danger)" }}>{formatCurrency(fa.finalSum)}</td>
                  <td className="text-xs" style={{ color: "var(--text-muted)" }}>{fa.targetAgreementDate ? formatDate(fa.targetAgreementDate) : "—"}</td>
                  <td className="font-semibold tabular-nums" style={{ color: "var(--danger)" }}>
                    {formatCurrency(Math.abs(fa.finalSum - fa.originalSum))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Outstanding View ─────────────────────────────────────────────────────────

function OutstandingView({ accounts }: { accounts: FinalAccount[] }) {
  const outstanding = accounts.filter(fa => fa.status !== "agreed" && fa.status !== "closed" && fa.status !== "archived");

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        {outstanding.length} outstanding items requiring resolution
      </p>
      <div className="flex flex-col gap-3">
        {outstanding.map(fa => (
          <div key={fa.id} className="card p-4 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                style={{ background: STATUS_META[fa.status].color }}
              />
              <div>
                <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{fa.project}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {fa.ref} · Target: {fa.targetAgreementDate ? formatDate(fa.targetAgreementDate) : "Not set"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-right">
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Final Sum</p>
                <p className="text-sm font-semibold tabular-nums">{formatCurrency(fa.finalSum)}</p>
              </div>
              <span className={cn("badge", STATUS_META[fa.status].chip)}>{STATUS_META[fa.status].label}</span>
              <button className="btn btn-ghost btn-icon btn-sm"><ChevronRight size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

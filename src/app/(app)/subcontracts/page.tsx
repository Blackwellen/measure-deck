"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus, Download, Search, Filter, Eye, MoreHorizontal, Package,
  CheckCircle, Clock, XCircle,
} from "lucide-react";
import { cn, formatDate, formatCurrency } from "@/lib/utils";
import { FeatureGate } from "@/components/ui/feature-gate";
import { SubcontractWizard } from "@/components/wizards/subcontract-wizard";
import { toast } from "sonner";

/* ──────────────────────── Types ──────────────────────── */

type SubcontractStatus = "draft" | "issued" | "active" | "completed" | "terminated";

interface SubcontractOrder {
  id: string;
  order_number: string;
  supplier_id: string;
  supplier_name: string;
  project_id: string;
  project_name: string;
  description: string;
  contract_sum: number;
  retention_rate: number;
  retention_held: number;
  gross_paid: number;
  status: SubcontractStatus;
  start_date: string;
  end_date: string;
  contract_type: string;
  created_at: string;
}

/* ──────────────────────── Seed ──────────────────────── */

const SEED_ORDERS: SubcontractOrder[] = [
  {
    id: "sc-001", order_number: "SC-2025-0001",
    supplier_id: "sup-001", supplier_name: "Apex Groundworks Ltd",
    project_id: "proj-001", project_name: "Thornfield Commercial Hub",
    description: "Groundworks Package — Phase 1 & 2",
    contract_sum: 320000, retention_rate: 5, retention_held: 11200, gross_paid: 201600,
    status: "active", start_date: "2025-03-01", end_date: "2026-08-31",
    contract_type: "NEC4", created_at: "2025-02-15T09:00:00Z",
  },
  {
    id: "sc-002", order_number: "SC-2024-0012",
    supplier_id: "sup-001", supplier_name: "Apex Groundworks Ltd",
    project_id: "proj-002", project_name: "Eastside Residential Block A",
    description: "Foundations & Drainage Works",
    contract_sum: 185000, retention_rate: 5, retention_held: 9250, gross_paid: 175750,
    status: "completed", start_date: "2024-06-01", end_date: "2025-02-28",
    contract_type: "JCT", created_at: "2024-05-15T09:00:00Z",
  },
  {
    id: "sc-003", order_number: "SC-2025-0003",
    supplier_id: "sup-007", supplier_name: "Grove Structural Steel",
    project_id: "proj-001", project_name: "Thornfield Commercial Hub",
    description: "Structural Steelwork Frame — Levels 1-4",
    contract_sum: 485000, retention_rate: 3, retention_held: 14550, gross_paid: 290000,
    status: "active", start_date: "2025-05-01", end_date: "2026-10-31",
    contract_type: "NEC4", created_at: "2025-04-20T09:00:00Z",
  },
  {
    id: "sc-004", order_number: "SC-2025-0007",
    supplier_id: "sup-003", supplier_name: "CraneKing Plant Hire",
    project_id: "proj-003", project_name: "Waterfront Apartments",
    description: "Tower Crane Supply & Operation",
    contract_sum: 95000, retention_rate: 3, retention_held: 0, gross_paid: 0,
    status: "issued", start_date: "2026-09-01", end_date: "2027-06-30",
    contract_type: "Bespoke", created_at: "2026-05-10T09:00:00Z",
  },
  {
    id: "sc-005", order_number: "SC-2024-0005",
    supplier_id: "sup-004", supplier_name: "Delta Electrical Specialists",
    project_id: "proj-002", project_name: "Eastside Residential Block A",
    description: "First Fix & Second Fix Electrical",
    contract_sum: 210000, retention_rate: 5, retention_held: 0, gross_paid: 210000,
    status: "completed", start_date: "2024-08-01", end_date: "2025-01-31",
    contract_type: "JCT", created_at: "2024-07-01T09:00:00Z",
  },
  {
    id: "sc-006", order_number: "SC-2026-0001",
    supplier_id: "sup-005", supplier_name: "Exton Consulting Engineers",
    project_id: "proj-003", project_name: "Waterfront Apartments",
    description: "Structural Engineering Consultancy",
    contract_sum: 68000, retention_rate: 0, retention_held: 0, gross_paid: 0,
    status: "draft", start_date: "2026-10-01", end_date: "2027-03-31",
    contract_type: "Bespoke", created_at: "2026-06-01T09:00:00Z",
  },
];

/* ──────────────────────── Helpers ──────────────────────── */

function statusBadge(status: SubcontractStatus) {
  const map: Record<SubcontractStatus, { cls: string; icon: React.ReactNode; label: string }> = {
    draft:      { cls: "bg-gray-100 text-gray-600",       icon: <Clock size={10} />,         label: "Draft" },
    issued:     { cls: "bg-[#DBEAFE] text-[#1D4ED8]",    icon: <Package size={10} />,        label: "Issued" },
    active:     { cls: "bg-[#DCFCE7] text-[#15803D]",    icon: <CheckCircle size={10} />,    label: "Active" },
    completed:  { cls: "bg-gray-100 text-gray-600",       icon: <CheckCircle size={10} />,    label: "Completed" },
    terminated: { cls: "bg-[#FEE2E2] text-[#B91C1C]",    icon: <XCircle size={10} />,        label: "Terminated" },
  };
  const { cls, icon, label } = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", cls)}>
      {icon}{label}
    </span>
  );
}

function exportCSV(orders: SubcontractOrder[]) {
  const headers = ["Order No", "Supplier", "Project", "Description", "Contract Sum", "Retention %", "Status", "Start", "End", "Contract Type"];
  const rows = orders.map((o) => [
    o.order_number, o.supplier_name, o.project_name, o.description,
    String(o.contract_sum), `${o.retention_rate}%`, o.status,
    o.start_date, o.end_date, o.contract_type,
  ]);
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `subcontracts-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("Exported");
}

/* ──────────────────────── Inner Page ──────────────────────── */

function SubcontractsInner() {
  const [showWizard, setShowWizard] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SubcontractStatus | "All">("All");
  const [supplierFilter, setSupplierFilter] = useState("All");

  const filtered = useMemo(() => {
    return SEED_ORDERS.filter((o) => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        o.order_number.toLowerCase().includes(q) ||
        o.supplier_name.toLowerCase().includes(q) ||
        o.project_name.toLowerCase().includes(q) ||
        o.description.toLowerCase().includes(q);
      const matchStatus = statusFilter === "All" || o.status === statusFilter;
      const matchSupplier = supplierFilter === "All" || o.supplier_id === supplierFilter;
      return matchSearch && matchStatus && matchSupplier;
    });
  }, [search, statusFilter, supplierFilter]);

  const totalValue = SEED_ORDERS.reduce((s, o) => s + o.contract_sum, 0);
  const activeCount = SEED_ORDERS.filter((o) => o.status === "active").length;
  const retentionHeld = SEED_ORDERS.reduce((s, o) => s + o.retention_held, 0);

  const uniqueSuppliers = Array.from(new Set(SEED_ORDERS.map((o) => o.supplier_id))).map((id) => {
    const o = SEED_ORDERS.find((x) => x.supplier_id === id);
    return { id, name: o?.supplier_name ?? id };
  });

  const statuses: SubcontractStatus[] = ["draft", "issued", "active", "completed", "terminated"];

  return (
    <div className="flex flex-col min-h-full">
      {showWizard && <SubcontractWizard onClose={() => setShowWizard(false)} />}

      <div className="page-header">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Subcontract Register</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">All subcontract orders across the workspace</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => exportCSV(filtered)}>
            <Download size={14} />Export
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setShowWizard(true)}>
            <Plus size={14} />New Subcontract
          </button>
        </div>
      </div>

      <div className="px-6 pt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="kpi-card">
          <div className="kpi-label">Total Subcontracts</div>
          <div className="kpi-value">{SEED_ORDERS.length}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Active Orders</div>
          <div className="kpi-value" style={{ color: "var(--success)" }}>{activeCount}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Value</div>
          <div className="kpi-value">{formatCurrency(totalValue)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Retention Held</div>
          <div className="kpi-value" style={{ color: "var(--warning)" }}>{formatCurrency(retentionHeld)}</div>
        </div>
      </div>

      <div className="px-6 py-3 mt-2 flex items-center gap-2 flex-wrap border-b" style={{ borderColor: "var(--border)" }}>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="search"
            placeholder="Search subcontracts…"
            className="form-input pl-9 h-8 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-input h-8 text-sm w-auto pr-8"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as SubcontractStatus | "All")}
        >
          <option value="All">All Statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select
          className="form-input h-8 text-sm w-auto pr-8"
          value={supplierFilter}
          onChange={(e) => setSupplierFilter(e.target.value)}
        >
          <option value="All">All Suppliers</option>
          {uniqueSuppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <button className="btn btn-secondary btn-sm ml-auto"><Filter size={14} />Filter</button>
      </div>

      <div className="page-content flex-1">
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Package size={22} /></div>
            <p className="font-semibold text-[var(--text-primary)]">No subcontracts found</p>
            <p className="text-sm text-[var(--text-muted)]">Try adjusting filters or create a new order.</p>
            <button className="btn btn-primary btn-sm mt-3" onClick={() => setShowWizard(true)}>
              <Plus size={14} />New Subcontract
            </button>
          </div>
        ) : (
          <>
            <div className="card overflow-hidden hidden md:block">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Order No</th>
                      <th>Supplier</th>
                      <th>Project</th>
                      <th>Description</th>
                      <th>Contract Sum</th>
                      <th>Retention %</th>
                      <th>Status</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((o) => (
                      <tr key={o.id} className="cursor-pointer" onClick={() => {}}>
                        <td className="font-mono text-xs font-semibold">{o.order_number}</td>
                        <td>
                          <Link href={`/app/suppliers/${o.supplier_id}`}
                            className="text-[var(--primary)] hover:underline text-sm font-medium"
                            onClick={(e) => e.stopPropagation()}>
                            {o.supplier_name}
                          </Link>
                        </td>
                        <td>
                          <Link href={`/app/projects/${o.project_id}`}
                            className="text-sm hover:text-[var(--primary)] transition-colors"
                            onClick={(e) => e.stopPropagation()}>
                            {o.project_name}
                          </Link>
                        </td>
                        <td className="text-sm text-[var(--text-secondary)] max-w-[200px] truncate">{o.description}</td>
                        <td className="font-semibold">{formatCurrency(o.contract_sum)}</td>
                        <td className="text-sm">{o.retention_rate}%</td>
                        <td>{statusBadge(o.status)}</td>
                        <td className="text-sm text-[var(--text-muted)]">{formatDate(o.start_date)}</td>
                        <td className="text-sm text-[var(--text-muted)]">{o.end_date ? formatDate(o.end_date) : "—"}</td>
                        <td>
                          <div className="flex items-center gap-1">
                            <Link href={`/app/subcontracts/${o.id}`} className="btn btn-ghost btn-sm btn-icon">
                              <Eye size={14} />
                            </Link>
                            <button className="btn btn-ghost btn-sm btn-icon">
                              <MoreHorizontal size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:hidden">
              {filtered.map((o) => (
                <Link key={o.id} href={`/app/subcontracts/${o.id}`} className="card p-4 block">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-mono text-xs font-bold text-[var(--text-muted)]">{o.order_number}</p>
                      <p className="font-semibold text-sm mt-0.5">{o.supplier_name}</p>
                    </div>
                    {statusBadge(o.status)}
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mb-2">{o.project_name} · {o.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold">{formatCurrency(o.contract_sum)}</span>
                    <span className="text-xs text-[var(--text-muted)]">{o.retention_rate}% retention</span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────── Page export ──────────────────────── */

export default function SubcontractsPage() {
  return (
    <FeatureGate flag="subcontract_orders">
      <SubcontractsInner />
    </FeatureGate>
  );
}

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Package, Building2, FolderKanban, FileText, Activity,
  StickyNote, Banknote, Shield, Plus, Upload, Download, RefreshCw,
  ExternalLink, Edit2, Save, X,
  MoreHorizontal, PinIcon,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn, formatDate, formatCurrency, formatRelative, getInitials } from "@/lib/utils";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";
import { FeatureGate } from "@/components/ui/feature-gate";
import { uploadFile } from "@/lib/storage";

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
  scope_summary: string;
  contract_sum: number;
  retention_rate: number;
  payment_terms_days: number;
  contract_type: string;
  start_date: string;
  end_date: string;
  status: SubcontractStatus;
  created_at: string;
}

interface PaymentLine {
  id: string;
  period: string;
  gross_applied: number;
  gross_certified: number;
  retention_deducted: number;
  net_certified: number;
  paid: number;
  date: string;
  status: string;
}

interface RetentionRelease {
  id: string;
  release_type: string;
  amount: number;
  released_on: string;
  released_by: string;
}

interface SubcontractDocument {
  id: string;
  name: string;
  doc_type: string;
  file_name: string;
  size: string;
  uploaded_at: string;
  uploaded_by: string;
}

interface SubcontractNote {
  id: string;
  text: string;
  author: string;
  created_at: string;
  pinned: boolean;
}

interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  created_at: string;
  new_values?: Record<string, unknown>;
}

/* ──────────────────────── Seed ──────────────────────── */

const SEED_ORDERS: Record<string, SubcontractOrder> = {
  "sc-001": {
    id: "sc-001", order_number: "SC-2025-0001",
    supplier_id: "sup-001", supplier_name: "Apex Groundworks Ltd",
    project_id: "proj-001", project_name: "Thornfield Commercial Hub",
    description: "Groundworks Package — Phase 1 & 2",
    scope_summary: "Earthworks, substructure, drainage, piling, blinding and slab formation for all phases of the development.",
    contract_sum: 320000, retention_rate: 5, payment_terms_days: 30,
    contract_type: "NEC4", start_date: "2025-03-01", end_date: "2026-08-31",
    status: "active", created_at: "2025-02-15T09:00:00Z",
  },
  "sc-003": {
    id: "sc-003", order_number: "SC-2025-0003",
    supplier_id: "sup-007", supplier_name: "Grove Structural Steel",
    project_id: "proj-001", project_name: "Thornfield Commercial Hub",
    description: "Structural Steelwork Frame — Levels 1-4",
    scope_summary: "Fabrication, supply and erection of structural steelwork for levels 1-4 of the main building.",
    contract_sum: 485000, retention_rate: 3, payment_terms_days: 30,
    contract_type: "NEC4", start_date: "2025-05-01", end_date: "2026-10-31",
    status: "active", created_at: "2025-04-20T09:00:00Z",
  },
};

const DEFAULT_ORDER: SubcontractOrder = {
  id: "", order_number: "SC-0000-0000",
  supplier_id: "", supplier_name: "Unknown Supplier",
  project_id: "", project_name: "Unknown Project",
  description: "No description", scope_summary: "",
  contract_sum: 0, retention_rate: 0, payment_terms_days: 30,
  contract_type: "Bespoke", start_date: "", end_date: "",
  status: "draft", created_at: "",
};

const PAYMENT_SEED: Record<string, PaymentLine[]> = {
  "sc-001": [
    { id: "p1", period: "Mar 2025", gross_applied: 35000, gross_certified: 35000, retention_deducted: 1750, net_certified: 33250, paid: 33250, date: "2025-03-31", status: "Paid" },
    { id: "p2", period: "Apr 2025", gross_applied: 48000, gross_certified: 45000, retention_deducted: 2250, net_certified: 42750, paid: 42750, date: "2025-04-30", status: "Paid" },
    { id: "p3", period: "May 2025", gross_applied: 52000, gross_certified: 50000, retention_deducted: 2500, net_certified: 47500, paid: 47500, date: "2025-05-31", status: "Paid" },
    { id: "p4", period: "Jun 2025", gross_applied: 44000, gross_certified: 42000, retention_deducted: 2100, net_certified: 39900, paid: 39900, date: "2025-06-30", status: "Paid" },
    { id: "p5", period: "May 2026", gross_applied: 38000, gross_certified: 36000, retention_deducted: 1800, net_certified: 34200, paid: 0, date: "2026-05-31", status: "Certified" },
    { id: "p6", period: "Jun 2026", gross_applied: 41000, gross_certified: 0, retention_deducted: 0, net_certified: 0, paid: 0, date: "2026-06-30", status: "Submitted" },
  ],
  "sc-003": [
    { id: "p7", period: "May 2025", gross_applied: 48000, gross_certified: 45000, retention_deducted: 1350, net_certified: 43650, paid: 43650, date: "2025-05-31", status: "Paid" },
    { id: "p8", period: "Jun 2025", gross_applied: 55000, gross_certified: 52000, retention_deducted: 1560, net_certified: 50440, paid: 50440, date: "2025-06-30", status: "Paid" },
  ],
};

const RETENTION_SEED: Record<string, RetentionRelease[]> = {
  "sc-001": [],
  "sc-003": [],
};

const DOCS_SEED: Record<string, SubcontractDocument[]> = {
  "sc-001": [
    { id: "d1", name: "Subcontract Order SC-2025-0001", doc_type: "Contract", file_name: "SC-2025-0001.pdf", size: "1.2 MB", uploaded_at: "2025-02-15", uploaded_by: "J. Thompson" },
    { id: "d2", name: "Schedule of Rates — Groundworks", doc_type: "Schedule", file_name: "SOR-Groundworks.xlsx", size: "0.4 MB", uploaded_at: "2025-02-15", uploaded_by: "J. Thompson" },
    { id: "d3", name: "Construction Programme v1", doc_type: "Programme", file_name: "Programme-v1.pdf", size: "2.1 MB", uploaded_at: "2025-03-01", uploaded_by: "S. Okafor" },
  ],
  "sc-003": [
    { id: "d4", name: "Subcontract Order SC-2025-0003", doc_type: "Contract", file_name: "SC-2025-0003.pdf", size: "1.5 MB", uploaded_at: "2025-04-20", uploaded_by: "J. Thompson" },
  ],
};

const NOTES_SEED: Record<string, SubcontractNote[]> = {
  "sc-001": [
    { id: "n1", text: "Programme revised due to unforeseen ground conditions in Zone B. Agreed 3-week extension.", author: "J. Thompson", created_at: "2025-05-15T10:00:00Z", pinned: true },
    { id: "n2", text: "Meeting with Mark Hughes to agree final retention release programme.", author: "S. Okafor", created_at: "2026-05-20T14:00:00Z", pinned: false },
  ],
  "sc-003": [
    { id: "n3", text: "Steel delivery phased in line with erection sequence. Phase 1 complete.", author: "J. Thompson", created_at: "2025-06-01T09:00:00Z", pinned: false },
  ],
};

const AUDIT_SEED: Record<string, AuditEntry[]> = {
  "sc-001": [
    { id: "a1", action: "subcontract_issued", actor: "J. Thompson", created_at: "2025-02-15T09:00:00Z", new_values: { status: "issued" } },
    { id: "a2", action: "status_changed", actor: "J. Thompson", created_at: "2025-03-01T09:00:00Z", new_values: { status: "active" } },
    { id: "a3", action: "payment_certified", actor: "J. Thompson", created_at: "2026-05-31T10:00:00Z", new_values: { period: "May 2026", certified: 36000 } },
  ],
  "sc-003": [
    { id: "a4", action: "subcontract_issued", actor: "S. Okafor", created_at: "2025-04-20T09:00:00Z", new_values: { status: "issued" } },
    { id: "a5", action: "status_changed", actor: "S. Okafor", created_at: "2025-05-01T08:00:00Z", new_values: { status: "active" } },
  ],
};

/* ──────────────────────── Helpers ──────────────────────── */

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft:      "bg-gray-100 text-gray-600",
    issued:     "bg-[#DBEAFE] text-[#1D4ED8]",
    active:     "bg-[#DCFCE7] text-[#15803D]",
    completed:  "bg-gray-100 text-gray-600",
    terminated: "bg-[#FEE2E2] text-[#B91C1C]",
    Paid:       "bg-[#DCFCE7] text-[#15803D]",
    Certified:  "bg-[#DBEAFE] text-[#1D4ED8]",
    Submitted:  "bg-[#FEF9C3] text-[#854D0E]",
  };
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize", map[status] ?? "bg-gray-100 text-gray-600")}>
      {status}
    </span>
  );
}

/* ──────────────────────── Tabs ──────────────────────── */

type TabId = "overview" | "financial" | "retention" | "documents" | "notes" | "activity";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "overview",   label: "Overview",          icon: <Package size={13} /> },
  { id: "financial",  label: "Financial Summary",  icon: <Banknote size={13} /> },
  { id: "retention",  label: "Retention",          icon: <Shield size={13} /> },
  { id: "documents",  label: "Documents",          icon: <FileText size={13} /> },
  { id: "notes",      label: "Notes",              icon: <StickyNote size={13} /> },
  { id: "activity",   label: "Activity",           icon: <Activity size={13} /> },
];

/* ──────────────────────── Overview Tab ──────────────────────── */

function OverviewTab({ order }: { order: SubcontractOrder }) {
  const [editing, setEditing] = useState<string | null>(null);
  const [editVal, setEditVal] = useState("");

  function startEdit(field: string, val: string) {
    setEditing(field);
    setEditVal(val);
  }

  function cancelEdit() { setEditing(null); setEditVal(""); }

  function saveEdit(field: string) {
    toast.success(`${field} updated`);
    setEditing(null);
  }

  const fields = [
    { key: "description",         label: "Description",         value: order.description },
    { key: "contract_type",       label: "Contract Type",       value: order.contract_type },
    { key: "payment_terms_days",  label: "Payment Terms",       value: `${order.payment_terms_days} days` },
    { key: "start_date",          label: "Start Date",          value: formatDate(order.start_date) },
    { key: "end_date",            label: "End Date",            value: order.end_date ? formatDate(order.end_date) : "—" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 flex flex-col gap-5">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold mb-4">Contract Details</h3>
          <dl className="flex flex-col gap-4">
            {fields.map(({ key, label, value }) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <dt className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-widest">{label}</dt>
                {editing === key ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      className="form-input h-7 text-sm w-40"
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                    />
                    <button className="btn btn-primary btn-sm btn-icon" onClick={() => saveEdit(key)}><Save size={12} /></button>
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={cancelEdit}><X size={12} /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <dd className="font-medium text-sm">{value}</dd>
                    <button className="btn btn-ghost btn-sm btn-icon opacity-50 hover:opacity-100" onClick={() => startEdit(key, value)}>
                      <Edit2 size={11} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </dl>
        </div>

        {order.scope_summary && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="text-sm font-semibold mb-3">Scope of Works</h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{order.scope_summary}</p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Order Status</h3>
          <div className="flex flex-col gap-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-muted)]">Status</span>
              <StatusBadge status={order.status} />
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Order No.</span>
              <span className="font-mono font-semibold text-xs">{order.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Contract Sum</span>
              <span className="font-bold text-[var(--text-primary)]">{formatCurrency(order.contract_sum)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Retention Rate</span>
              <span className="font-medium">{order.retention_rate}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Linked Records</h3>
          <div className="flex flex-col gap-2">
            <Link href={`/app/suppliers/${order.supplier_id}`}
              className="flex items-center gap-2 text-sm text-[var(--primary)] hover:underline">
              <Building2 size={13} />{order.supplier_name}
            </Link>
            <Link href={`/app/projects/${order.project_id}`}
              className="flex items-center gap-2 text-sm text-[var(--primary)] hover:underline">
              <FolderKanban size={13} />{order.project_name}
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => toast.info("Edit status")}>
            <Edit2 size={13} />Change Status
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => toast.info("Print order")}>
            <Download size={13} />Print / Export
          </button>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────── Financial Tab ──────────────────────── */

function FinancialTab({ order, payments }: { order: SubcontractOrder; payments: PaymentLine[] }) {
  const grossPaid = payments.filter((p) => p.status === "Paid").reduce((s, p) => s + p.gross_certified, 0);
  const retentionHeld = payments.reduce((s, p) => s + p.retention_deducted, 0);
  const netPaid = payments.filter((p) => p.status === "Paid").reduce((s, p) => s + p.paid, 0);
  const balance = order.contract_sum - grossPaid;

  const chartData = payments.map((p) => ({
    period: p.period,
    applied: p.gross_applied,
    certified: p.gross_certified,
    paid: p.paid,
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: "Contract Sum", value: formatCurrency(order.contract_sum), color: "" },
          { label: "Gross Paid to Date", value: formatCurrency(grossPaid), color: "#15803D" },
          { label: "Retention Held", value: formatCurrency(retentionHeld), color: "#D97706" },
          { label: "Net Paid", value: formatCurrency(netPaid), color: "#15803D" },
          { label: "Balance Remaining", value: formatCurrency(balance), color: balance > 0 ? "" : "#15803D" },
          { label: "Retention Released", value: formatCurrency(0), color: "" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
            <p className="text-lg font-bold" style={{ color: color || "var(--text-primary)" }}>{value}</p>
          </div>
        ))}
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold mb-4">Payment History</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="period" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `£${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [formatCurrency(v), ""]} />
              <Bar dataKey="applied" fill="#DBEAFE" radius={[3, 3, 0, 0]} name="Applied" />
              <Bar dataKey="certified" fill="var(--primary)" radius={[3, 3, 0, 0]} name="Certified" />
              <Bar dataKey="paid" fill="#15803D" radius={[3, 3, 0, 0]} name="Paid" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold">Payment Application History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Period", "Applied", "Certified", "Retention", "Net Certified", "Paid", "Date", "Status"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">No payment applications yet</td></tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium">{p.period}</td>
                    <td className="px-4 py-3">{formatCurrency(p.gross_applied)}</td>
                    <td className="px-4 py-3">{p.gross_certified > 0 ? formatCurrency(p.gross_certified) : "—"}</td>
                    <td className="px-4 py-3 text-[#D97706]">{p.retention_deducted > 0 ? formatCurrency(p.retention_deducted) : "—"}</td>
                    <td className="px-4 py-3">{p.net_certified > 0 ? formatCurrency(p.net_certified) : "—"}</td>
                    <td className="px-4 py-3 text-[#15803D] font-medium">{p.paid > 0 ? formatCurrency(p.paid) : "—"}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(p.date)}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────── Retention Tab ──────────────────────── */

function RetentionTab({ order, payments, releases }: { order: SubcontractOrder; payments: PaymentLine[]; releases: RetentionRelease[] }) {
  const totalRetentionHeld = payments.reduce((s, p) => s + p.retention_deducted, 0);
  const halfRetention = totalRetentionHeld / 2;
  const grossPaid = payments.filter((p) => p.status === "Paid").reduce((s, p) => s + p.gross_certified, 0);
  const contractRetention = order.contract_sum * (order.retention_rate / 100);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Retention Rate", value: `${order.retention_rate}%`, color: "" },
          { label: "Total Retention Held", value: formatCurrency(totalRetentionHeld), color: "#D97706" },
          { label: "First Moiety (50%)", value: formatCurrency(halfRetention), color: "" },
          { label: "Second Moiety (50%)", value: formatCurrency(halfRetention), color: "" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
            <p className="text-lg font-bold" style={{ color: color || "var(--text-primary)" }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold mb-4">Retention Release Schedule</h3>
        <div className="flex flex-col gap-3">
          {[
            {
              label: "First Moiety — At Practical Completion",
              amount: halfRetention,
              description: "50% of total retention released upon certification of Practical Completion",
              status: "pending",
            },
            {
              label: "Second Moiety — End of Defects Liability Period",
              amount: halfRetention,
              description: "Remaining 50% released upon expiry of the Defects Liability Period (usually 12 months after PC)",
              status: "pending",
            },
          ].map(({ label, amount, description, status }) => (
            <div key={label} className={cn(
              "p-4 rounded-xl border",
              status === "released" ? "border-[#86EFAC] bg-[#F0FDF4]" : "border-[var(--border)] bg-[var(--bg-subtle)]"
            )}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className="font-bold text-sm">{formatCurrency(amount)}</p>
                  <StatusBadge status={status} />
                </div>
              </div>
              <FeatureGate flag="retention_module" fallback={
                <button className="btn btn-secondary btn-sm mt-2 opacity-60" disabled>
                  <Shield size={12} />Release Retention (Phase 12)
                </button>
              }>
                <button className="btn btn-primary btn-sm mt-2" onClick={() => toast.info("Release retention")}>
                  <Shield size={12} />Release Retention
                </button>
              </FeatureGate>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold">Release History</h3>
        </div>
        {releases.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--text-muted)]">No retention released yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Type", "Amount", "Released On", "Released By"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {releases.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3">{r.release_type}</td>
                  <td className="px-4 py-3 font-semibold text-[#15803D]">{formatCurrency(r.amount)}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(r.released_on)}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{r.released_by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────── Documents Tab ──────────────────────── */

function DocumentsTab({ docs, orderId }: { docs: SubcontractDocument[]; orderId: string }) {
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      await uploadFile(supabase, {
        bucket: "project-media",
        path: `subcontracts/${orderId}/${Date.now()}-${file.name}`,
        file,
      });
      toast.success(`${file.name} uploaded`);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">{docs.length} Document{docs.length !== 1 ? "s" : ""}</h2>
          <p className="text-sm text-[var(--text-muted)]">Subcontract order, schedule of rates, and programme</p>
        </div>
        <label className={cn("btn btn-primary btn-sm cursor-pointer", uploading && "opacity-60")}>
          {uploading ? <RefreshCw size={13} className="animate-spin" /> : <Upload size={13} />}
          Upload Document
          <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={handleUpload} disabled={uploading} />
        </label>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {["Document", "Type", "Uploaded By", "Date", ""].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {docs.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-[var(--text-muted)]">No documents uploaded yet</td></tr>
            ) : (
              docs.map((d) => (
                <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-[var(--text-muted)] flex-shrink-0" />
                      <div>
                        <p className="font-medium">{d.name}</p>
                        <p className="text-xs text-[var(--text-muted)]">{d.size}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">{d.doc_type}</span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{d.uploaded_by}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(d.uploaded_at)}</td>
                  <td className="px-4 py-3">
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => toast.info(`Download ${d.file_name}`)}>
                      <Download size={13} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ──────────────────────── Notes Tab ──────────────────────── */

function NotesTab({ notes, orderId }: { notes: SubcontractNote[]; orderId: string }) {
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function addNote() {
    if (!newNote.trim()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    setSaving(false);
    setNewNote("");
    toast.success("Note added");
  }

  return (
    <div className="max-w-2xl flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Internal Notes</h2>
        <p className="text-xs text-[var(--text-muted)]">Visible to workspace members only</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h3 className="text-sm font-semibold mb-3">Add Note</h3>
        <textarea
          className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
          rows={4}
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note about this subcontract…"
        />
        <button className="btn btn-primary btn-sm mt-3" onClick={addNote} disabled={saving || !newNote.trim()}>
          {saving ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={13} />}
          Add Note
        </button>
      </div>
      {notes.map((n) => (
        <div key={n.id} className={cn("bg-white rounded-2xl border shadow-sm p-5", n.pinned ? "border-[var(--primary)]" : "border-gray-200")}>
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                {getInitials(n.author)}
              </div>
              <div>
                <p className="text-xs font-semibold">{n.author}</p>
                <p className="text-xs text-[var(--text-muted)]">{formatRelative(n.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {n.pinned && <span className="px-1.5 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-xs font-medium flex items-center gap-1"><PinIcon size={10} />Pinned</span>}
              <button className="btn btn-ghost btn-sm btn-icon" onClick={() => toast.info("Options")}><MoreHorizontal size={14} /></button>
            </div>
          </div>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{n.text}</p>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────── Activity Tab ──────────────────────── */

function ActivityTab({ entries }: { entries: AuditEntry[] }) {
  const actionLabels: Record<string, string> = {
    subcontract_issued: "Subcontract issued",
    status_changed: "Status updated",
    payment_certified: "Payment certified",
    document_uploaded: "Document uploaded",
    note_added: "Note added",
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Activity Log</h2>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        {entries.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-4">No activity yet</p>
        ) : (
          <div className="flex flex-col gap-0">
            {entries.map((e, idx) => (
              <div key={e.id} className={cn("flex items-start gap-3 py-4", idx < entries.length - 1 && "border-b border-gray-50")}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-[#DBEAFE] text-[#1D4ED8] flex-shrink-0">
                  <Activity size={13} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{actionLabels[e.action] ?? e.action}</p>
                  {e.new_values && (
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {Object.entries(e.new_values).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] mt-0.5">
                    <span>{e.actor}</span>
                    <span>·</span>
                    <span>{formatRelative(e.created_at)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────── Page ──────────────────────── */

function SubcontractDetailInner() {
  const { subcontractId } = useParams<{ subcontractId: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [order, setOrder] = useState<SubcontractOrder>(() => SEED_ORDERS[subcontractId] ?? DEFAULT_ORDER);
  const [loading, setLoading] = useState(true);

  const payments = PAYMENT_SEED[subcontractId] ?? [];
  const releases = RETENTION_SEED[subcontractId] ?? [];
  const docs = DOCS_SEED[subcontractId] ?? [];
  const notes = NOTES_SEED[subcontractId] ?? [];
  const auditEntries = AUDIT_SEED[subcontractId] ?? [];

  useEffect(() => {
    async function load() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data } = await supabase
          .from("subcontract_orders")
          .select("*")
          .eq("id", subcontractId)
          .single();
        if (data) setOrder(data as SubcontractOrder);
      } catch {
        // use seed
      } finally {
        setLoading(false);
      }
    }
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [subcontractId]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="page-header"><div className="h-6 w-48 bg-gray-100 rounded animate-pulse" /></div>
        <div className="page-content flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="page-header">
        <div className="flex items-center gap-3 min-w-0">
          <button className="btn btn-ghost btn-sm btn-icon flex-shrink-0" onClick={() => router.push("/app/subcontracts")}>
            <ArrowLeft size={16} />
          </button>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--primary-light)" }}>
            <Package size={18} className="text-[var(--primary)]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold text-[var(--text-primary)]">{order.order_number}</h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-sm text-[var(--text-muted)]">{order.supplier_name} · {order.project_name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/app/suppliers/${order.supplier_id}`} className="btn btn-secondary btn-sm">
            <ExternalLink size={13} />Supplier
          </Link>
          <button className="btn btn-secondary btn-sm" onClick={() => toast.info("Edit order")}>
            <Edit2 size={13} />Edit
          </button>
        </div>
      </div>

      <div className="px-6 py-3 flex items-center gap-6 flex-wrap border-b text-sm" style={{ borderColor: "var(--border-subtle)" }}>
        <span className="text-[var(--text-muted)]">Contract Sum: <strong className="text-[var(--text-primary)]">{formatCurrency(order.contract_sum)}</strong></span>
        <span className="text-[var(--text-muted)]">Retention: <strong className="text-[#D97706]">{order.retention_rate}%</strong></span>
        <span className="text-[var(--text-muted)]">Type: <strong className="text-[var(--text-primary)]">{order.contract_type}</strong></span>
        <span className="text-[var(--text-muted)]">Start: <strong className="text-[var(--text-primary)]">{formatDate(order.start_date)}</strong></span>
        {order.end_date && <span className="text-[var(--text-muted)]">End: <strong className="text-[var(--text-primary)]">{formatDate(order.end_date)}</strong></span>}
      </div>

      <div className="tab-bar overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id}
            className={cn("tab-item flex items-center gap-1.5 whitespace-nowrap", activeTab === t.id && "active")}
            onClick={() => setActiveTab(t.id)}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <div className="page-content flex-1">
        {activeTab === "overview"  && <OverviewTab order={order} />}
        {activeTab === "financial" && <FinancialTab order={order} payments={payments} />}
        {activeTab === "retention" && <RetentionTab order={order} payments={payments} releases={releases} />}
        {activeTab === "documents" && <DocumentsTab docs={docs} orderId={subcontractId} />}
        {activeTab === "notes"     && <NotesTab notes={notes} orderId={subcontractId} />}
        {activeTab === "activity"  && <ActivityTab entries={auditEntries} />}
      </div>
    </div>
  );
}

export default function SubcontractDetailPage() {
  return (
    <FeatureGate flag="subcontract_orders">
      <SubcontractDetailInner />
    </FeatureGate>
  );
}

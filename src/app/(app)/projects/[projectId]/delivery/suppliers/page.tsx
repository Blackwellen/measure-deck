"use client";

import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Search,
  ChevronDown,
  FileText,
  CreditCard,
  Flag,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type SupplierStatus = "Active" | "Mobilising" | "Complete";

interface Supplier {
  company:       string;
  package:       string;
  contact:       string;
  contractValue: number;
  paidToDate:    number;
  outstanding:   number;
  performance:   number;
  status:        SupplierStatus;
}

interface Cert {
  type:   string;
  expiry: string;
  status: "Valid" | "Expiring Soon" | "Expired";
}

interface Doc {
  name:   string;
  status: string;
  date:   string;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SUPPLIERS: Supplier[] = [
  { company: "Hartley Civil Engineering",  package: "Civil",      contact: "Mark Hartley",    contractValue: 1850000, paidToDate: 1620000, outstanding: 230000, performance: 92, status: "Active"     },
  { company: "Steel Frame Solutions Ltd",  package: "Structure",  contact: "Priya Patel",     contractValue: 2340000, paidToDate: 1890000, outstanding: 450000, performance: 85, status: "Active"     },
  { company: "BuildTech MEP",             package: "MEP",        contact: "Liam O'Brien",    contractValue: 1560000, paidToDate: 780000,  outstanding: 780000, performance: 76, status: "Active"     },
  { company: "Apex Facades Ltd",          package: "External",   contact: "Sophie Grant",    contractValue: 980000,  paidToDate: 245000,  outstanding: 735000, performance: 88, status: "Active"     },
  { company: "Premier Finishes",          package: "Finishes",   contact: "James White",     contractValue: 720000,  paidToDate: 0,       outstanding: 720000, performance: 0,  status: "Mobilising" },
  { company: "Skyline Scaffolding",       package: "Temp Works", contact: "Connor Walsh",    contractValue: 185000,  paidToDate: 148000,  outstanding: 37000,  performance: 94, status: "Active"     },
  { company: "Precision Groundworks",     package: "Civil",      contact: "Tom Richards",    contractValue: 340000,  paidToDate: 340000,  outstanding: 0,      performance: 91, status: "Complete"   },
  { company: "Clearview Glazing",         package: "External",   contact: "Yuki Tanaka",     contractValue: 445000,  paidToDate: 89000,   outstanding: 356000, performance: 72, status: "Active"     },
  { company: "National Piling Co.",       package: "Civil",      contact: "Steve Morrison",  contractValue: 620000,  paidToDate: 620000,  outstanding: 0,      performance: 89, status: "Complete"   },
  { company: "EnviroSite Services",       package: "Civil",      contact: "Maria Santos",    contractValue: 95000,   paidToDate: 85000,   outstanding: 10000,  performance: 96, status: "Active"     },
];

const PACKAGES_FILTER = ["All", "Civil", "Structure", "MEP", "Finishes", "External", "Temp Works"];
const STATUSES_FILTER: Array<SupplierStatus | "All"> = ["All", "Active", "Mobilising", "Complete"];

const PERF_TREND = [
  { m: "Jan", v: 78 }, { m: "Feb", v: 80 }, { m: "Mar", v: 82 },
  { m: "Apr", v: 84 }, { m: "May", v: 85 }, { m: "Jun", v: 85 },
];

const CERTS: Cert[] = [
  { type: "Public Liability",    expiry: "2025-12-31", status: "Valid"         },
  { type: "Employers Liability", expiry: "2025-08-31", status: "Expiring Soon" },
  { type: "ISO 9001",           expiry: "2026-03-15", status: "Valid"         },
];

const DOCS: Doc[] = [
  { name: "Subcontract Agreement",  status: "Signed",   date: "2024-09-15" },
  { name: "Programme",             status: "Current",  date: "2025-04-01" },
  { name: "Insurance Schedule",    status: "Valid",    date: "2025-01-10" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function statusChip(status: SupplierStatus) {
  const map: Record<SupplierStatus, string> = {
    Active:     "badge chip-success",
    Mobilising: "badge chip-info",
    Complete:   "badge chip-muted",
  };
  return map[status];
}

function certChip(status: Cert["status"]) {
  if (status === "Valid")         return "badge chip-success";
  if (status === "Expiring Soon") return "badge chip-warning";
  return "badge chip-danger";
}

function certIcon(status: Cert["status"]) {
  if (status === "Valid")         return <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />;
  if (status === "Expiring Soon") return <Clock className="w-3.5 h-3.5 text-amber-500" />;
  return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
}

function PerfBar({ value }: { value: number }) {
  const color = value >= 85 ? "#10B981" : value >= 70 ? "#F59E0B" : value === 0 ? "#E2E8F0" : "#EF4444";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-muted)] overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="text-[11px] font-500 w-7 text-right" style={{ color: "var(--text-muted)" }}>
        {value > 0 ? `${value}%` : "—"}
      </span>
    </div>
  );
}

function SelectDropdown({ value, options, onChange, label }: { value: string; options: string[]; onChange: (v: string) => void; label: string }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none form-input pr-8 py-1.5 text-[13px] cursor-pointer"
        aria-label={label}
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: "var(--text-muted)" }} />
    </div>
  );
}

// ─── Right panel ──────────────────────────────────────────────────────────────

function SupplierPanel({ supplier }: { supplier: Supplier }) {
  return (
    <div className="flex flex-col gap-5 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-[13px] font-700 shrink-0"
          style={{ background: "var(--primary)" }}
        >
          {getInitials(supplier.company)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-600 text-[14px] leading-tight" style={{ color: "var(--text-primary)" }}>
            {supplier.company}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="badge chip-muted">{supplier.package}</span>
            <span className={statusChip(supplier.status)}>{supplier.status}</span>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="flex flex-col gap-1">
        <p className="text-[11px] font-600 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Contact</p>
        <p className="text-[13px] font-500" style={{ color: "var(--text-primary)" }}>{supplier.contact}</p>
        <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
          {supplier.contact.toLowerCase().replace(" ", ".").replace("'", "")}@supplier.co.uk
        </p>
        <p className="text-[12px]" style={{ color: "var(--text-secondary)" }}>+44 7700 900 {Math.floor(Math.random() * 900) + 100}</p>
      </div>

      {/* Financial summary */}
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-600 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Financials</p>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Contract Value",   value: fmt(supplier.contractValue) },
            { label: "Paid to Date",     value: fmt(supplier.paidToDate)    },
            { label: "Outstanding",      value: fmt(supplier.outstanding)   },
          ].map((f) => (
            <div key={f.label} className="rounded-lg p-2 text-center" style={{ background: "var(--bg-muted)" }}>
              <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>{f.label}</p>
              <p className="text-[12px] font-600 mt-0.5" style={{ color: "var(--text-primary)" }}>{f.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Performance trend */}
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-600 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Performance Trend (6 months)</p>
        <div className="h-24">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={PERF_TREND} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <XAxis dataKey="m" tick={{ fontSize: 10, fill: "#94A3B8" }} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 10, fill: "#94A3B8" }} />
              <Tooltip
                contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid var(--border)" }}
                formatter={(v: number) => [`${v}%`, "Score"]}
              />
              <Line type="monotone" dataKey="v" stroke="#10B981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insurance & Certs */}
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-600 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Insurance &amp; Certificates</p>
        <div className="rounded-lg overflow-hidden border" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ background: "var(--bg-muted)" }}>
                <th className="text-left px-3 py-2 font-500" style={{ color: "var(--text-secondary)" }}>Type</th>
                <th className="text-left px-3 py-2 font-500" style={{ color: "var(--text-secondary)" }}>Expiry</th>
                <th className="text-left px-3 py-2 font-500" style={{ color: "var(--text-secondary)" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {CERTS.map((c) => (
                <tr key={c.type} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="px-3 py-2 font-500" style={{ color: "var(--text-primary)" }}>{c.type}</td>
                  <td className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>{fmtDate(c.expiry)}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      {certIcon(c.status)}
                      <span className={certChip(c.status)}>{c.status}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Documents */}
      <div className="flex flex-col gap-2">
        <p className="text-[11px] font-600 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>Documents</p>
        <div className="flex flex-col gap-1.5">
          {DOCS.map((d) => (
            <div key={d.name} className="flex items-center justify-between rounded-lg px-3 py-2 border" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
                <span className="text-[12px] font-500" style={{ color: "var(--text-primary)" }}>{d.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="badge chip-success">{d.status}</span>
                <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{fmtDate(d.date)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-1">
        <button className="btn btn-primary btn-sm flex items-center gap-2 justify-center w-full">
          <FileText className="w-3.5 h-3.5" /> View Contract
        </button>
        <button className="btn btn-secondary btn-sm flex items-center gap-2 justify-center w-full">
          <CreditCard className="w-3.5 h-3.5" /> Record Payment
        </button>
        <button className="btn btn-ghost btn-sm flex items-center gap-2 justify-center w-full text-red-500 hover:bg-red-50">
          <Flag className="w-3.5 h-3.5" /> Flag Issue
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DeliverySuppliersPage() {
  const [search, setSearch]   = useState("");
  const [pkg, setPkg]         = useState("All");
  const [status, setStatus]   = useState<SupplierStatus | "All">("All");
  const [selected, setSelected] = useState<string>("Steel Frame Solutions Ltd");

  const filtered = useMemo(() => {
    return SUPPLIERS.filter((s) => {
      const matchSearch = search === "" || s.company.toLowerCase().includes(search.toLowerCase()) || s.contact.toLowerCase().includes(search.toLowerCase());
      const matchPkg    = pkg === "All" || s.package === pkg;
      const matchStatus = status === "All" || s.status === status;
      return matchSearch && matchPkg && matchStatus;
    });
  }, [search, pkg, status]);

  const selectedSupplier = SUPPLIERS.find((s) => s.company === selected) ?? SUPPLIERS[1];

  return (
    <div className="flex flex-col gap-6">

      {/* ── KPI Strip ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card p-4 flex flex-col gap-1">
          <span className="kpi-label">Active Suppliers</span>
          <span className="kpi-value">12</span>
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Across 6 packages</span>
        </div>
        <div className="card p-4 flex flex-col gap-1">
          <span className="kpi-label">Avg Performance</span>
          <span className="kpi-value" style={{ color: "var(--success)" }}>78%</span>
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Target: 85%</span>
        </div>
        <div className="card p-4 flex flex-col gap-1">
          <span className="kpi-label">Payments Outstanding</span>
          <span className="kpi-value" style={{ color: "var(--warning)" }}>£124,500</span>
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Across 4 suppliers</span>
        </div>
        <div className="card p-4 flex flex-col gap-1">
          <span className="kpi-label">Expiring Soon</span>
          <div className="flex items-center gap-2">
            <span className="kpi-value">3</span>
            <span className="badge chip-warning">Certs</span>
          </div>
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Insurance / qualifications</span>
        </div>
      </div>

      {/* ── Main layout ───────────────────────────────────────────────────── */}
      <div className="flex gap-5 items-start">

        {/* Table side */}
        <div className="flex-1 flex flex-col gap-3 min-w-0">

          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Search suppliers…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="form-input w-full pl-8 py-1.5 text-[13px]"
              />
            </div>
            <SelectDropdown value={pkg}    options={PACKAGES_FILTER} onChange={setPkg}    label="Package" />
            <SelectDropdown value={status} options={STATUSES_FILTER} onChange={(v) => setStatus(v as SupplierStatus | "All")} label="Status" />
          </div>

          {/* Table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Package</th>
                    <th>Contact</th>
                    <th className="text-right">Contract Value</th>
                    <th className="text-right">Paid to Date</th>
                    <th className="text-right">Outstanding</th>
                    <th className="w-28">Performance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10" style={{ color: "var(--text-muted)" }}>
                        No suppliers match the current filters
                      </td>
                    </tr>
                  ) : (
                    filtered.map((s) => (
                      <tr
                        key={s.company}
                        onClick={() => setSelected(s.company)}
                        className={cn(
                          "cursor-pointer transition-colors",
                          selected === s.company ? "bg-blue-50" : "hover:bg-[var(--bg-muted)]"
                        )}
                      >
                        <td className="font-500 text-[13px]" style={{ color: "var(--text-primary)" }}>
                          {s.company}
                        </td>
                        <td><span className="badge chip-muted">{s.package}</span></td>
                        <td className="text-[12px]" style={{ color: "var(--text-secondary)" }}>{s.contact}</td>
                        <td className="text-right text-[12px] font-500" style={{ color: "var(--text-primary)" }}>{fmt(s.contractValue)}</td>
                        <td className="text-right text-[12px]" style={{ color: "var(--text-secondary)" }}>{fmt(s.paidToDate)}</td>
                        <td className="text-right text-[12px]" style={{ color: s.outstanding > 0 ? "var(--warning)" : "var(--text-muted)" }}>
                          {s.outstanding > 0 ? fmt(s.outstanding) : "—"}
                        </td>
                        <td><PerfBar value={s.performance} /></td>
                        <td><span className={statusChip(s.status)}>{s.status}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div
          className="w-80 shrink-0 card p-5 sticky top-4"
          style={{ maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}
        >
          <SupplierPanel supplier={selectedSupplier} />
        </div>

      </div>
    </div>
  );
}

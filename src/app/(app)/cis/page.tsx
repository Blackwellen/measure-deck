"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Building2, RefreshCw, AlertTriangle, CheckCircle2,
  Users, FileText, Calendar, ChevronRight, ToggleLeft,
  ToggleRight, Plus, Download,
} from "lucide-react";
import { cn, formatCurrencyFull, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { FeatureGate } from "@/components/ui/feature-gate";
import { KpiCard } from "@/components/ui/kpi-card";
import { ComplianceBadge } from "@/components/ui/compliance-badge";
import { toast } from "sonner";
import type { CISStatus } from "@/lib/cis/deduction-calculator";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CISRecord {
  id: string;
  supplier_name: string;
  subcontractor_utr: string;
  cis_status: CISStatus;
  last_verified_at: string | null;
  is_vat_reverse_charge: boolean;
  verification_number: string | null;
}

interface MonthlyReturn {
  id: string;
  tax_month: string;
  total_gross: number;
  total_deductions: number;
  net_payments: number;
  status: "draft" | "filed" | "pending" | "overdue";
  submission_reference: string | null;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_CIS_RECORDS: CISRecord[] = [
  {
    id: "cr1",
    supplier_name: "Alpha Steelwork Ltd",
    subcontractor_utr: "1234567890",
    cis_status: "net",
    last_verified_at: "2026-05-15T10:00:00Z",
    is_vat_reverse_charge: true,
    verification_number: "V20260515001",
  },
  {
    id: "cr2",
    supplier_name: "Fenwick Cladding Systems",
    subcontractor_utr: "9876543210",
    cis_status: "gross",
    last_verified_at: "2026-04-20T09:00:00Z",
    is_vat_reverse_charge: false,
    verification_number: "V20260420002",
  },
  {
    id: "cr3",
    supplier_name: "PowerTech MEP",
    subcontractor_utr: "5551234567",
    cis_status: "higher_rate",
    last_verified_at: "2026-03-01T08:00:00Z",
    is_vat_reverse_charge: false,
    verification_number: null,
  },
  {
    id: "cr4",
    supplier_name: "GreenTech Concrete",
    subcontractor_utr: "4449876543",
    cis_status: "unverified",
    last_verified_at: null,
    is_vat_reverse_charge: false,
    verification_number: null,
  },
];

const SEED_MONTHLY_RETURNS: MonthlyReturn[] = [
  {
    id: "mr1",
    tax_month: "2026-05",
    total_gross: 540_000,
    total_deductions: 90_000,
    net_payments: 450_000,
    status: "filed",
    submission_reference: "CIS-2026-05-REF001",
  },
  {
    id: "mr2",
    tax_month: "2026-04",
    total_gross: 480_000,
    total_deductions: 78_000,
    net_payments: 402_000,
    status: "filed",
    submission_reference: "CIS-2026-04-REF001",
  },
  {
    id: "mr3",
    tax_month: "2026-03",
    total_gross: 620_000,
    total_deductions: 103_000,
    net_payments: 517_000,
    status: "pending",
    submission_reference: null,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cisStatusToCompliance(status: CISStatus): "compliant" | "at_risk" | "non_compliant" | "expired" {
  switch (status) {
    case "gross":       return "compliant";
    case "net":         return "at_risk";
    case "higher_rate": return "non_compliant";
    case "unverified":  return "expired";
  }
}

function cisStatusLabel(status: CISStatus): string {
  switch (status) {
    case "gross":       return "Gross (0%)";
    case "net":         return "Net (20%)";
    case "higher_rate": return "Higher Rate (30%)";
    case "unverified":  return "Unverified";
  }
}

function returnStatusChip(status: MonthlyReturn["status"]): string {
  switch (status) {
    case "filed":   return "chip-success";
    case "pending": return "chip-warning";
    case "overdue": return "chip-danger";
    case "draft":   return "chip-muted";
  }
}

function filingDeadline(taxMonth: string): string {
  const [year, month] = taxMonth.split("-").map(Number);
  const deadlineMonth = month === 12 ? 1 : month + 1;
  const deadlineYear = month === 12 ? year + 1 : year;
  return `19 ${new Date(deadlineYear, deadlineMonth - 1, 1).toLocaleString("en-GB", { month: "long" })} ${deadlineYear}`;
}

function daysUntilDeadline(taxMonth: string): number {
  const [year, month] = taxMonth.split("-").map(Number);
  const deadlineMonth = month === 12 ? 1 : month + 1;
  const deadlineYear = month === 12 ? year + 1 : year;
  const deadline = new Date(deadlineYear, deadlineMonth - 1, 19);
  const today = new Date("2026-06-14");
  return Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

// ─── Toggle component ─────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex items-center gap-1.5 text-xs font-medium transition-colors"
      style={{ color: checked ? "var(--primary)" : "var(--text-muted)" }}
    >
      {checked ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
      {checked ? "DRC On" : "DRC Off"}
    </button>
  );
}

// ─── Monthly Returns section ───────────────────────────────────────────────────

function MonthlyReturnsSection({ returns }: { returns: MonthlyReturn[] }) {
  const currentMonth = "2026-06";
  const days = daysUntilDeadline(currentMonth);

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b flex items-center justify-between gap-4 flex-wrap" style={{ borderColor: "var(--border)" }}>
        <div>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Monthly Returns (CIS300)</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Filing deadline for {new Date("2026-06-01").toLocaleString("en-GB", { month: "long", year: "numeric" })}: 19 July 2026
            {days > 0 && (
              <span className={cn(
                "ml-2 font-semibold",
                days <= 7 ? "text-red-600" : days <= 14 ? "text-amber-600" : "text-green-700"
              )}>
                ({days} days remaining)
              </span>
            )}
          </p>
        </div>
        <Link href="/app/cis/monthly-return" className="btn btn-primary btn-sm">
          <Plus size={13} /> New Monthly Return
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tax Month</th>
              <th>Filing Deadline</th>
              <th className="text-right">Total Gross</th>
              <th className="text-right">Total Deductions</th>
              <th className="text-right">Net Payments</th>
              <th>Status</th>
              <th>Reference</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {returns.map((r) => (
              <tr key={r.id}>
                <td className="font-semibold">
                  {new Date(r.tax_month + "-01").toLocaleString("en-GB", { month: "long", year: "numeric" })}
                </td>
                <td className="text-xs" style={{ color: "var(--text-muted)" }}>{filingDeadline(r.tax_month)}</td>
                <td className="text-right tabular-nums">{formatCurrencyFull(r.total_gross)}</td>
                <td className="text-right tabular-nums" style={{ color: "var(--warning)" }}>
                  ({formatCurrencyFull(r.total_deductions)})
                </td>
                <td className="text-right tabular-nums font-semibold" style={{ color: "var(--success)" }}>
                  {formatCurrencyFull(r.net_payments)}
                </td>
                <td>
                  <span className={cn("badge", returnStatusChip(r.status))}>
                    {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                  </span>
                </td>
                <td className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                  {r.submission_reference ?? "—"}
                </td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    <Link
                      href={`/app/cis/monthly-return?month=${r.tax_month}`}
                      className="btn btn-ghost btn-icon btn-sm"
                      title="View Return"
                    >
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── DRC section ──────────────────────────────────────────────────────────────

function DRCSection({
  records,
  onToggleDRC,
}: {
  records: CISRecord[];
  onToggleDRC: (id: string, value: boolean) => void;
}) {
  const drcActive = records.filter((r) => r.is_vat_reverse_charge);

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Domestic Reverse Charge (DRC)
        </h2>
        <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
          DRC applies when: the subcontractor is CIS-registered, the supply is standard-rated construction,
          and the customer is a VAT-registered end user or intermediary supplier. When DRC applies, the contractor
          accounts for VAT — no VAT is charged on the invoice.
        </p>
      </div>

      {drcActive.length > 0 && (
        <div className="px-5 py-3 flex items-start gap-3" style={{ background: "var(--warning-bg, #fffbeb)" }}>
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" style={{ color: "var(--warning)" }} />
          <p className="text-xs" style={{ color: "var(--warning-text, #92400e)" }}>
            <strong>{drcActive.length} subcontractor{drcActive.length > 1 ? "s" : ""}</strong> have DRC enabled.
            No VAT is charged on their invoices — you must account for the VAT under the Domestic Reverse Charge mechanism.
          </p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Subcontractor</th>
              <th>UTR</th>
              <th>CIS Status</th>
              <th>DRC Applicable</th>
              <th>VAT Treatment</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td className="font-semibold">{r.supplier_name}</td>
                <td className="font-mono text-xs">{r.subcontractor_utr}</td>
                <td>
                  <ComplianceBadge
                    status={cisStatusToCompliance(r.cis_status)}
                    label={cisStatusLabel(r.cis_status)}
                  />
                </td>
                <td>
                  <Toggle
                    checked={r.is_vat_reverse_charge}
                    onChange={(v) => onToggleDRC(r.id, v)}
                  />
                </td>
                <td className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {r.is_vat_reverse_charge
                    ? <span className="font-semibold" style={{ color: "var(--warning)" }}>No VAT charged — contractor accounts for VAT under DRC</span>
                    : "Standard VAT applies"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Subcontractor status table ───────────────────────────────────────────────

function SubcontractorTable({
  records,
  onVerify,
  verifying,
}: {
  records: CISRecord[];
  onVerify: (id: string, utr: string, name: string) => void;
  verifying: string | null;
}) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const bulkVerify = () => {
    const toVerify = records.filter((r) => selected.includes(r.id));
    toVerify.forEach((r) => onVerify(r.id, r.subcontractor_utr, r.supplier_name));
    setSelected([]);
  };

  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-4 border-b flex items-center justify-between gap-4 flex-wrap" style={{ borderColor: "var(--border)" }}>
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Subcontractor CIS Status</h2>
        {selected.length > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={bulkVerify}>
            <RefreshCw size={13} /> Bulk Verify ({selected.length})
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-10">
                <input
                  type="checkbox"
                  checked={selected.length === records.length}
                  onChange={() => setSelected(selected.length === records.length ? [] : records.map((r) => r.id))}
                  className="rounded"
                  aria-label="Select all"
                />
              </th>
              <th>Supplier Name</th>
              <th>UTR</th>
              <th>CIS Status</th>
              <th>Last Verified</th>
              <th>Verification No.</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.includes(r.id)}
                    onChange={() => toggleSelect(r.id)}
                    className="rounded"
                    aria-label={`Select ${r.supplier_name}`}
                  />
                </td>
                <td className="font-semibold">{r.supplier_name}</td>
                <td className="font-mono text-xs">{r.subcontractor_utr}</td>
                <td>
                  <ComplianceBadge
                    status={cisStatusToCompliance(r.cis_status)}
                    label={cisStatusLabel(r.cis_status)}
                  />
                </td>
                <td className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {r.last_verified_at ? formatDate(r.last_verified_at) : (
                    <span className="text-red-600 font-semibold">Never verified</span>
                  )}
                </td>
                <td className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                  {r.verification_number ?? "—"}
                </td>
                <td>
                  <div className="flex items-center justify-end gap-1">
                    {r.cis_status === "unverified" && (
                      <span className="badge chip-danger mr-1">Unverified</span>
                    )}
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onVerify(r.id, r.subcontractor_utr, r.supplier_name)}
                      disabled={verifying === r.id}
                      title="Verify via HMRC"
                    >
                      {verifying === r.id ? (
                        <RefreshCw size={12} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={12} />
                      )}
                      Verify
                    </button>
                    <Link href="/app/cis" className="btn btn-ghost btn-icon btn-sm" title="Manage">
                      <ChevronRight size={14} />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function CISDashboardContent() {
  const [cisRecords, setCisRecords] = useState<CISRecord[]>(SEED_CIS_RECORDS);
  const [monthlyReturns, setMonthlyReturns] = useState<MonthlyReturn[]>(SEED_MONTHLY_RETURNS);
  const [verifying, setVerifying] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data: records } = await supabase
          .from("cis_records")
          .select("*")
          .order("created_at", { ascending: false });
        if (records && records.length > 0) {
          setCisRecords(records as CISRecord[]);
        }
        const { data: returns } = await supabase
          .from("cis_monthly_returns")
          .select("*")
          .order("tax_month", { ascending: false });
        if (returns && returns.length > 0) {
          setMonthlyReturns(returns as MonthlyReturn[]);
        }
      } catch {
        // fallback to seed data
      }
    };
    load();
  }, []);

  const handleVerify = useCallback(async (id: string, utr: string, name: string) => {
    setVerifying(id);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/hmrc-cis-proxy`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "verify",
            contractor_utr: "0000000000",
            subcontractor_utr: utr,
            subcontractor_name: name,
          }),
        }
      );

      if (resp.ok) {
        const data = await resp.json() as { status: CISStatus; verification_number: string };
        setCisRecords((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  cis_status: data.status,
                  verification_number: data.verification_number,
                  last_verified_at: new Date().toISOString(),
                }
              : r
          )
        );
        toast.success(`${name} verified — status: ${cisStatusLabel(data.status)}`);
      } else {
        toast.error("HMRC verification failed. Please try again.");
      }
    } catch {
      toast.error("Could not connect to HMRC. Please check your credentials.");
    } finally {
      setVerifying(null);
    }
  }, []);

  const handleToggleDRC = useCallback(async (id: string, value: boolean) => {
    setCisRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_vat_reverse_charge: value } : r))
    );
    try {
      const supabase = createClient();
      await supabase
        .from("cis_records")
        .update({ is_vat_reverse_charge: value })
        .eq("id", id);
      toast.success(value ? "DRC enabled for subcontractor" : "DRC disabled for subcontractor");
    } catch {
      toast.error("Failed to update DRC setting");
    }
  }, []);

  const grossCount = cisRecords.filter((r) => r.cis_status === "gross").length;
  const netCount = cisRecords.filter((r) => r.cis_status === "net").length;
  const higherRateCount = cisRecords.filter((r) => r.cis_status === "higher_rate").length;

  return (
    <div className="flex flex-col min-h-full">
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            CIS Compliance Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            Construction Industry Scheme — subcontractor verification, monthly returns & Domestic Reverse Charge
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/app/cis/monthly-return" className="btn btn-primary btn-sm">
            <FileText size={14} /> New CIS300 Return
          </Link>
        </div>
      </div>

      <div className="page-content flex flex-col gap-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Total Subcontractors"
            value={cisRecords.length}
            icon={Users}
          />
          <KpiCard
            label="Gross Payment Status"
            value={grossCount}
            icon={CheckCircle2}
            variant="success"
            change="0% deduction"
          />
          <KpiCard
            label="Net Deduction (20%)"
            value={netCount}
            icon={Building2}
            variant="warning"
            change="Standard CIS"
          />
          <KpiCard
            label="Higher Rate (30%)"
            value={higherRateCount}
            icon={AlertTriangle}
            variant="danger"
            change={higherRateCount > 0 ? "Requires attention" : "None"}
          />
        </div>

        <MonthlyReturnsSection returns={monthlyReturns} />

        <SubcontractorTable
          records={cisRecords}
          onVerify={handleVerify}
          verifying={verifying}
        />

        <DRCSection records={cisRecords} onToggleDRC={handleToggleDRC} />
      </div>
    </div>
  );
}

export default function CISPage() {
  return (
    <FeatureGate flag="cis_compliance">
      <CISDashboardContent />
    </FeatureGate>
  );
}

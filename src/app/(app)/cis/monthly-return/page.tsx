"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Download, Send, Save, CheckCircle2,
  Plus, Trash2, AlertTriangle, Calendar, Lock,
} from "lucide-react";
import { cn, formatCurrencyFull, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { FeatureGate } from "@/components/ui/feature-gate";
import { toast } from "sonner";
import { calculateCISDeduction, formatCIS300XML } from "@/lib/cis/deduction-calculator";
import type { CISStatus } from "@/lib/cis/deduction-calculator";
import { createAuditEvent } from "@/lib/audit";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentLine {
  id: string;
  subcontractor_name: string;
  subcontractor_utr: string;
  gross_payment: number;
  materials_cost: number;
  cis_status: CISStatus;
  is_drc: boolean;
}

// ─── Seed lines ───────────────────────────────────────────────────────────────

const SEED_LINES: PaymentLine[] = [
  {
    id: "pl1",
    subcontractor_name: "Alpha Steelwork Ltd",
    subcontractor_utr: "1234567890",
    gross_payment: 140_000,
    materials_cost: 40_000,
    cis_status: "net",
    is_drc: true,
  },
  {
    id: "pl2",
    subcontractor_name: "Fenwick Cladding Systems",
    subcontractor_utr: "9876543210",
    gross_payment: 85_000,
    materials_cost: 25_000,
    cis_status: "gross",
    is_drc: false,
  },
  {
    id: "pl3",
    subcontractor_name: "PowerTech MEP",
    subcontractor_utr: "5551234567",
    gross_payment: 65_000,
    materials_cost: 15_000,
    cis_status: "higher_rate",
    is_drc: false,
  },
];

// ─── Inline edit cell ─────────────────────────────────────────────────────────

function EditableAmount({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState(String(value));

  const commit = () => {
    const parsed = parseFloat(raw.replace(/,/g, ""));
    if (!isNaN(parsed) && parsed >= 0) onChange(parsed);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        type="number"
        min={0}
        step={0.01}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); }}
        className="form-input h-7 text-sm w-28 text-right tabular-nums"
        autoFocus
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => { setRaw(String(value)); setEditing(true); }}
      className="text-sm tabular-nums underline decoration-dashed text-right w-full"
      style={{ color: "var(--text-primary)" }}
      title="Click to edit"
    >
      {formatCurrencyFull(value)}
    </button>
  );
}

function cisRateLabel(status: CISStatus): string {
  switch (status) {
    case "gross":       return "0%";
    case "net":         return "20%";
    case "higher_rate": return "30%";
    case "unverified":  return "30%";
  }
}

// ─── Monthly Return builder ────────────────────────────────────────────────────

function MonthlyReturnContent() {
  const searchParams = useSearchParams();
  const presetMonth = searchParams.get("month") ?? new Date().toISOString().slice(0, 7);

  const [taxMonth, setTaxMonth] = useState(presetMonth);
  const [lines, setLines] = useState<PaymentLine[]>(SEED_LINES);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [contractorUtr, setContractorUtr] = useState("0000000000");
  const [contractorName, setContractorName] = useState("MeasureDeck Contractor Ltd");

  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("cis_monthly_returns")
          .select("payment_lines")
          .eq("tax_month", taxMonth)
          .limit(1)
          .single();
        if (data?.payment_lines) {
          setLines(data.payment_lines as PaymentLine[]);
        }
      } catch {
        // use seed
      }
    };
    load();
  }, [taxMonth]);

  const updateLine = useCallback((id: string, field: keyof PaymentLine, value: unknown) => {
    setLines((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: value } : l)));
  }, []);

  const removeLine = useCallback((id: string) => {
    setLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const addLine = useCallback(() => {
    const newLine: PaymentLine = {
      id: `pl-${Date.now()}`,
      subcontractor_name: "",
      subcontractor_utr: "",
      gross_payment: 0,
      materials_cost: 0,
      cis_status: "net",
      is_drc: false,
    };
    setLines((prev) => [...prev, newLine]);
  }, []);

  const computedLines = lines.map((line) =>
    calculateCISDeduction({
      gross_payment: line.gross_payment,
      materials_cost: line.materials_cost,
      cis_status: line.cis_status,
      is_vat_reverse_charge: line.is_drc,
    })
  );

  const totalGross = computedLines.reduce((s, l) => s + l.gross_payment, 0);
  const totalMaterials = computedLines.reduce((s, l) => s + l.materials_cost, 0);
  const totalDeductions = computedLines.reduce((s, l) => s + l.deduction_amount, 0);
  const totalNet = computedLines.reduce((s, l) => s + l.net_payment, 0);

  const filingDeadlineDate = (() => {
    const [y, m] = taxMonth.split("-").map(Number);
    const dm = m === 12 ? 1 : m + 1;
    const dy = m === 12 ? y + 1 : y;
    return `19 ${new Date(dy, dm - 1, 1).toLocaleString("en-GB", { month: "long" })} ${dy}`;
  })();

  const handleDownloadXML = useCallback(() => {
    const xml = formatCIS300XML({
      contractor_utr: contractorUtr,
      contractor_name: contractorName,
      tax_month: taxMonth,
      payment_lines: lines.map((line, i) => ({
        subcontractor_utr: line.subcontractor_utr,
        subcontractor_name: line.subcontractor_name,
        gross_payment: computedLines[i].gross_payment,
        materials_cost: computedLines[i].materials_cost,
        deduction_amount: computedLines[i].deduction_amount,
        cis_status: line.cis_status,
      })),
    });

    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `CIS300-${taxMonth}.xml`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CIS300 XML downloaded");
  }, [lines, computedLines, contractorUtr, contractorName, taxMonth]);

  const handleSaveDraft = useCallback(async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      const { data: membership } = await supabase
        .from("workspace_memberships")
        .select("workspace_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      const workspaceId = membership?.workspace_id as string | undefined;
      if (!workspaceId) throw new Error("No workspace");

      await supabase.from("cis_monthly_returns").upsert(
        {
          workspace_id: workspaceId,
          tax_month: taxMonth,
          total_gross: totalGross,
          total_deductions: totalDeductions,
          net_payments: totalNet,
          status: "draft",
          payment_lines: lines,
        },
        { onConflict: "workspace_id,tax_month" }
      );

      await createAuditEvent(supabase, {
        workspace_id: workspaceId,
        user_id: user.id,
        action: "cis_monthly_return.save_draft",
        resource_type: "cis_monthly_return",
        resource_id: taxMonth,
        new_values: { tax_month: taxMonth, status: "draft", total_gross: totalGross },
      });

      toast.success("Draft saved");
    } catch {
      toast.error("Failed to save draft");
    } finally {
      setSaving(false);
    }
  }, [lines, taxMonth, totalGross, totalDeductions, totalNet]);

  const handleMarkFiled = useCallback(async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      const { data: membership } = await supabase
        .from("workspace_memberships")
        .select("workspace_id")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      const workspaceId = membership?.workspace_id as string | undefined;
      if (!workspaceId) throw new Error("No workspace");

      await supabase.from("cis_monthly_returns").upsert(
        {
          workspace_id: workspaceId,
          tax_month: taxMonth,
          total_gross: totalGross,
          total_deductions: totalDeductions,
          net_payments: totalNet,
          status: "filed",
          payment_lines: lines,
          is_immutable: true,
          filed_at: new Date().toISOString(),
          filed_by: user.id,
        },
        { onConflict: "workspace_id,tax_month" }
      );

      await createAuditEvent(supabase, {
        workspace_id: workspaceId,
        user_id: user.id,
        action: "cis_monthly_return.mark_filed",
        resource_type: "cis_monthly_return",
        resource_id: taxMonth,
        new_values: { tax_month: taxMonth, status: "filed", total_gross: totalGross },
      });

      toast.success("Return marked as filed and locked");
    } catch {
      toast.error("Failed to mark as filed");
    } finally {
      setSaving(false);
    }
  }, [lines, taxMonth, totalGross, totalDeductions, totalNet]);

  const handleSubmitHMRC = useCallback(async () => {
    setSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const xml = formatCIS300XML({
        contractor_utr: contractorUtr,
        contractor_name: contractorName,
        tax_month: taxMonth,
        payment_lines: lines.map((line, i) => ({
          subcontractor_utr: line.subcontractor_utr,
          subcontractor_name: line.subcontractor_name,
          gross_payment: computedLines[i].gross_payment,
          materials_cost: computedLines[i].materials_cost,
          deduction_amount: computedLines[i].deduction_amount,
          cis_status: line.cis_status,
        })),
      });

      const resp = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/hmrc-cis-proxy`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "submit_return",
            tax_month: taxMonth,
            xml_payload: xml,
          }),
        }
      );

      if (resp.ok) {
        const data = await resp.json() as { success: boolean; submission_reference: string };
        if (data.success) {
          toast.success(`Return submitted to HMRC. Reference: ${data.submission_reference}`);
        } else {
          toast.error("HMRC submission failed. Please try again or mark as manually filed.");
        }
      } else {
        toast.error("HMRC API unavailable. Please try again later.");
      }
    } catch {
      toast.error("Submission error. Please check HMRC credentials in Settings.");
    } finally {
      setSubmitting(false);
    }
  }, [lines, computedLines, contractorUtr, contractorName, taxMonth]);

  return (
    <div className="flex flex-col min-h-full">
      <div className="page-header">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/app/cis" className="btn btn-ghost btn-icon flex-shrink-0">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
              CIS300 Monthly Return
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
              Construction Industry Scheme — monthly return to HMRC
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn btn-secondary btn-sm" onClick={handleDownloadXML}>
            <Download size={14} /> Download CIS300 XML
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleSaveDraft}
            disabled={saving}
          >
            <Save size={14} /> {saving ? "Saving…" : "Save Draft"}
          </button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={handleMarkFiled}
            disabled={saving}
          >
            <Lock size={14} /> Mark as Filed
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSubmitHMRC}
            disabled={submitting}
          >
            <Send size={14} /> {submitting ? "Submitting…" : "Submit to HMRC"}
          </button>
        </div>
      </div>

      <div className="page-content flex flex-col gap-6">
        {/* Section 1: Tax Month */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Calendar size={15} style={{ color: "var(--primary)" }} /> Tax Month
          </h2>
          <div className="flex items-start gap-6 flex-wrap">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                Tax Month
              </label>
              <input
                type="month"
                value={taxMonth}
                onChange={(e) => setTaxMonth(e.target.value)}
                className="form-input h-9 text-sm w-48"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                Contractor UTR
              </label>
              <input
                type="text"
                value={contractorUtr}
                onChange={(e) => setContractorUtr(e.target.value)}
                className="form-input h-9 text-sm w-48"
                placeholder="10-digit UTR"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                Contractor Name
              </label>
              <input
                type="text"
                value={contractorName}
                onChange={(e) => setContractorName(e.target.value)}
                className="form-input h-9 text-sm w-64"
                placeholder="Contractor legal name"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                Filing Deadline
              </label>
              <div className="flex items-center gap-2 h-9">
                <span className="text-sm font-semibold" style={{ color: "var(--danger)" }}>
                  {filingDeadlineDate}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Payment lines */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Payment Lines</h2>
            <button className="btn btn-secondary btn-sm" onClick={addLine}>
              <Plus size={13} /> Add Line
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subcontractor</th>
                  <th>UTR</th>
                  <th className="text-right">Gross</th>
                  <th className="text-right">Materials</th>
                  <th className="text-right">Labour</th>
                  <th>Rate</th>
                  <th className="text-right">Deduction</th>
                  <th className="text-right">Net Payment</th>
                  <th>DRC</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, i) => {
                  const calc = computedLines[i];
                  return (
                    <tr key={line.id}>
                      <td>
                        <input
                          type="text"
                          value={line.subcontractor_name}
                          onChange={(e) => updateLine(line.id, "subcontractor_name", e.target.value)}
                          className="form-input h-7 text-sm w-44"
                          placeholder="Name"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={line.subcontractor_utr}
                          onChange={(e) => updateLine(line.id, "subcontractor_utr", e.target.value)}
                          className="form-input h-7 text-sm w-28 font-mono"
                          placeholder="UTR"
                        />
                      </td>
                      <td className="text-right">
                        <EditableAmount
                          value={line.gross_payment}
                          onChange={(v) => updateLine(line.id, "gross_payment", v)}
                        />
                      </td>
                      <td className="text-right">
                        <EditableAmount
                          value={line.materials_cost}
                          onChange={(v) => updateLine(line.id, "materials_cost", v)}
                        />
                      </td>
                      <td className="text-right tabular-nums text-sm" style={{ color: "var(--text-muted)" }}>
                        {formatCurrencyFull(calc.labour_cost)}
                      </td>
                      <td>
                        <select
                          value={line.cis_status}
                          onChange={(e) => updateLine(line.id, "cis_status", e.target.value as CISStatus)}
                          className="form-input h-7 text-xs w-28"
                        >
                          <option value="gross">Gross (0%)</option>
                          <option value="net">Net (20%)</option>
                          <option value="higher_rate">Higher (30%)</option>
                          <option value="unverified">Unverified (30%)</option>
                        </select>
                      </td>
                      <td className="text-right tabular-nums text-sm font-semibold" style={{ color: calc.deduction_amount > 0 ? "var(--warning)" : "var(--text-muted)" }}>
                        {calc.deduction_amount > 0 ? `(${formatCurrencyFull(calc.deduction_amount)})` : "—"}
                      </td>
                      <td className="text-right tabular-nums text-sm font-bold" style={{ color: "var(--success)" }}>
                        {formatCurrencyFull(calc.net_payment)}
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={line.is_drc}
                          onChange={(e) => updateLine(line.id, "is_drc", e.target.checked)}
                          className="rounded"
                          aria-label="DRC applies"
                          title="Domestic Reverse Charge applies"
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => removeLine(line.id)}
                          title="Remove line"
                        >
                          <Trash2 size={13} style={{ color: "var(--danger)" }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 3: Totals */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>Totals Summary</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[var(--bg-muted)] rounded-xl p-4 text-center">
              <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--text-muted)" }}>Total Gross Payments</p>
              <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{formatCurrencyFull(totalGross)}</p>
            </div>
            <div className="bg-[var(--bg-muted)] rounded-xl p-4 text-center">
              <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--text-muted)" }}>Total Materials</p>
              <p className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{formatCurrencyFull(totalMaterials)}</p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ background: "var(--warning-bg, #fffbeb)" }}>
              <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--text-muted)" }}>Total Deductions (to HMRC)</p>
              <p className="text-lg font-bold" style={{ color: "var(--warning)" }}>{formatCurrencyFull(totalDeductions)}</p>
            </div>
            <div className="rounded-xl p-4 text-center" style={{ background: "var(--success-bg, #f0fdf4)" }}>
              <p className="text-xs uppercase tracking-wide mb-1" style={{ color: "var(--text-muted)" }}>Net Payments to Subcontractors</p>
              <p className="text-lg font-bold" style={{ color: "var(--success)" }}>{formatCurrencyFull(totalNet)}</p>
            </div>
          </div>

          {lines.some((l) => l.is_drc) && (
            <div className="mt-4 flex items-start gap-3 p-3 rounded-xl" style={{ background: "var(--warning-bg, #fffbeb)" }}>
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" style={{ color: "var(--warning)" }} />
              <p className="text-xs" style={{ color: "var(--warning-text, #92400e)" }}>
                <strong>DRC Notice:</strong> {lines.filter((l) => l.is_drc).length} subcontractor(s) are subject to Domestic Reverse Charge.
                No VAT has been charged on their invoices. You must account for the output VAT in your VAT return under the reverse charge mechanism.
              </p>
            </div>
          )}

          {lines.some((l) => l.cis_status === "unverified") && (
            <div className="mt-4 flex items-start gap-3 p-3 rounded-xl" style={{ background: "var(--danger-bg, #fef2f2)" }}>
              <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" style={{ color: "var(--danger)" }} />
              <p className="text-xs" style={{ color: "var(--danger-text, #991b1b)" }}>
                <strong>Warning:</strong> {lines.filter((l) => l.cis_status === "unverified").length} subcontractor(s) are unverified.
                The higher rate (30%) deduction applies. Verify them via the{" "}
                <Link href="/app/cis" className="underline font-semibold">CIS Dashboard</Link> before filing.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MonthlyReturnPage() {
  return (
    <FeatureGate flag="cis_compliance">
      <Suspense fallback={<div className="page-content"><div className="skeleton h-32 rounded-xl" /></div>}>
        <MonthlyReturnContent />
      </Suspense>
    </FeatureGate>
  );
}

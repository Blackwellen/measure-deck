"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Download, Sparkles, Plus, MoreHorizontal, Upload,
  FileText, CheckCircle2, AlertTriangle, Clock, Send, Edit2,
  Building2, Calendar, DollarSign, Percent, Shield, Paperclip,
  MessageSquare, Activity, Copy, RefreshCw, ExternalLink, Trash2,
  ChevronRight, Lock, XCircle,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { cn, formatCurrencyFull, formatDate, formatDateTime } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

// ─── Types ─────────────────────────────────────────────────────────────────────

type AppStatus = "Draft" | "Submitted" | "Certified" | "Paid" | "Disputed" | "Withdrawn";

interface Application {
  id: string;
  ref: string;
  app_number: number;
  project: string;
  project_id: string;
  contractor: string;
  contract_ref: string;
  app_type: string;
  period_from: string;
  period_to: string;
  submission_date: string | null;
  gross_value: number;
  deductions: number;
  net_certified: number;
  retention_pct: number;
  retention_held: number;
  certified_amount: number | null;
  certification_date: string | null;
  payment_due_date: string | null;
  final_date_for_payment: string | null;
  payment_received_date: string | null;
  payment_received_amount: number | null;
  status: AppStatus;
  created_at: string;
}

interface LineItem {
  id: string;
  ref: string;
  description: string;
  section: string;
  booked_value: number;
  prev_cumulative: number;
  this_period: number;
  cumulative_claimed: number;
  certified_pct: number;
  certified_amount: number;
}

interface ChangeEvent {
  id: string;
  ref: string;
  description: string;
  submitted_amount: number;
  certified_amount: number;
  status: string;
}

interface RetentionRelease {
  id: string;
  date: string;
  amount: number;
  type: "Interim" | "Final";
  notes: string;
}

interface SubContractor {
  id: string;
  name: string;
  trade: string;
  order_value: number;
  this_period_claimed: number;
  certified: number;
  cis_deduction: number;
  balance: number;
}

interface Document {
  id: string;
  name: string;
  type: string;
  size: string;
  uploaded_at: string;
  uploaded_by: string;
}

interface CorrespondenceItem {
  id: string;
  date: string;
  from: string;
  to: string;
  subject: string;
  type: "Email" | "Letter" | "Notice" | "Certificate";
  status: "Sent" | "Received" | "Pending";
}

interface Dispute {
  id: string;
  raised_date: string;
  description: string;
  amount_disputed: number;
  status: "Open" | "Resolved" | "Withdrawn";
  resolution: string | null;
}

interface ActivityEntry {
  id: string;
  user: string;
  action: string;
  detail: string;
  timestamp: string;
}

// ─── Seed data ──────────────────────────────────────────────────────────────────

const SEED_APP: Application = {
  id: "app5",
  ref: "APP-005",
  app_number: 5,
  project: "The Arc Tower, Birmingham",
  project_id: "p1",
  contractor: "Meridian Build Ltd",
  contract_ref: "ARC/MC/001",
  app_type: "Interim Valuation",
  period_from: "2025-11-01",
  period_to: "2025-11-30",
  submission_date: "2025-11-30",
  gross_value: 1_245_000,
  deductions: 124_500,
  net_certified: 0,
  retention_pct: 5,
  retention_held: 62_250,
  certified_amount: null,
  certification_date: null,
  payment_due_date: "2025-12-28",
  final_date_for_payment: "2026-01-11",
  payment_received_date: null,
  payment_received_amount: null,
  status: "Submitted",
  created_at: "2025-11-28",
};

const SEED_LINE_ITEMS: LineItem[] = [
  { id: "li1", ref: "01.01", description: "Substructure – concrete raft slab", section: "Substructure", booked_value: 280_000, prev_cumulative: 280_000, this_period: 0, cumulative_claimed: 280_000, certified_pct: 100, certified_amount: 280_000 },
  { id: "li2", ref: "02.01", description: "Frame – steel erection Level 1–5", section: "Frame & Upper Floors", booked_value: 420_000, prev_cumulative: 300_000, this_period: 120_000, cumulative_claimed: 420_000, certified_pct: 90, certified_amount: 378_000 },
  { id: "li3", ref: "02.02", description: "Frame – steel erection Level 6–10", section: "Frame & Upper Floors", booked_value: 385_000, prev_cumulative: 0, this_period: 140_000, cumulative_claimed: 140_000, certified_pct: 36, certified_amount: 140_000 },
  { id: "li4", ref: "03.01", description: "Roof structure and waterproofing", section: "Roof", booked_value: 92_000, prev_cumulative: 0, this_period: 0, cumulative_claimed: 0, certified_pct: 0, certified_amount: 0 },
  { id: "li5", ref: "04.01", description: "External cladding – curtain walling", section: "Envelope", booked_value: 310_000, prev_cumulative: 45_000, this_period: 85_000, cumulative_claimed: 130_000, certified_pct: 42, certified_amount: 130_000 },
  { id: "li6", ref: "05.01", description: "M&E rough-in – electrical first fix", section: "M&E", booked_value: 145_000, prev_cumulative: 35_000, this_period: 65_000, cumulative_claimed: 100_000, certified_pct: 69, certified_amount: 100_000 },
  { id: "li7", ref: "06.01", description: "Preliminaries – site management", section: "Preliminaries", booked_value: 320_000, prev_cumulative: 155_000, this_period: 55_000, cumulative_claimed: 210_000, certified_pct: 66, certified_amount: 210_000 },
];

const SEED_CHANGES: ChangeEvent[] = [
  { id: "c1", ref: "VAR-001", description: "Additional groundworks – unforeseen rock", submitted_amount: 48_500, certified_amount: 48_500, status: "Approved" },
  { id: "c2", ref: "VAR-002", description: "Structural steel design change – Level 7 cantilever", submitted_amount: 17_200, certified_amount: 0, status: "Pending" },
  { id: "c3", ref: "DEL-001", description: "Delay event – utility diversion by statutory authority", submitted_amount: 31_000, certified_amount: 0, status: "Disputed" },
];

const SEED_RETENTION_RELEASES: RetentionRelease[] = [
  { id: "r1", date: "2025-08-28", amount: 14_400, type: "Interim", notes: "Retention release following practical completion milestone" },
  { id: "r2", date: "2026-06-30", amount: 62_250, type: "Final", notes: "Anticipated release at end of defects liability period" },
];

const SEED_SUBCONTRACTORS: SubContractor[] = [
  { id: "s1", name: "Alpha Steelwork Ltd", trade: "Structural Steel", order_value: 805_000, this_period_claimed: 140_000, certified: 140_000, cis_deduction: 28_000, balance: 385_000 },
  { id: "s2", name: "Fenwick Cladding Systems", trade: "Curtain Walling", order_value: 310_000, this_period_claimed: 85_000, certified: 85_000, cis_deduction: 17_000, balance: 195_000 },
  { id: "s3", name: "PowerTech MEP", trade: "Electrical", order_value: 145_000, this_period_claimed: 65_000, certified: 65_000, cis_deduction: 13_000, balance: 80_000 },
  { id: "s4", name: "GreenTech Concrete", trade: "Groundworks", order_value: 280_000, this_period_claimed: 0, certified: 0, cis_deduction: 0, balance: 0 },
];

const SEED_DOCUMENTS: Document[] = [
  { id: "d1", name: "APP-005 Daywork Sheets Oct-Nov.pdf", type: "Daywork Sheet", size: "2.4 MB", uploaded_at: "2025-11-29", uploaded_by: "James Wilson" },
  { id: "d2", name: "Site Instruction SI-021.pdf", type: "Site Instruction", size: "0.8 MB", uploaded_at: "2025-11-25", uploaded_by: "Sarah Chen" },
  { id: "d3", name: "Delivery Notes – Steel Level 6-10.zip", type: "Delivery Note", size: "8.1 MB", uploaded_at: "2025-11-28", uploaded_by: "James Wilson" },
  { id: "d4", name: "Progress Photos Nov 2025.zip", type: "Progress Photos", size: "45.2 MB", uploaded_at: "2025-11-30", uploaded_by: "Mike Torres" },
  { id: "d5", name: "Updated Programme Nov 2025.pdf", type: "Programme", size: "1.2 MB", uploaded_at: "2025-11-22", uploaded_by: "Sarah Chen" },
];

const SEED_CORRESPONDENCE: CorrespondenceItem[] = [
  { id: "co1", date: "2025-11-30", from: "Meridian Build Ltd", to: "Arc Tower Employer", subject: "Payment Application No. 5 – Submission", type: "Notice", status: "Sent" },
  { id: "co2", date: "2025-11-14", from: "Arc Tower Employer", to: "Meridian Build Ltd", subject: "Instruction SI-021 – Additional cladding fixings", type: "Letter", status: "Received" },
  { id: "co3", date: "2025-11-08", from: "Meridian Build Ltd", to: "Arc Tower Employer", subject: "Early Warning Notice EWN-018 – Utility diversion delay", type: "Notice", status: "Sent" },
  { id: "co4", date: "2025-10-28", from: "Arc Tower Employer", to: "Meridian Build Ltd", subject: "Payment Certificate APP-004", type: "Certificate", status: "Received" },
];

const SEED_DISPUTES: Dispute[] = [
  { id: "dis1", raised_date: "2025-11-10", description: "DEL-001: Contractor disputes certification of nil for utility delay claim. Client contends the delay was concurrent.", amount_disputed: 31_000, status: "Open", resolution: null },
];

const SEED_ACTIVITY: ActivityEntry[] = [
  { id: "a1", user: "James Wilson", action: "Application Submitted", detail: "APP-005 submitted to employer for certification", timestamp: "2025-11-30T09:14:00Z" },
  { id: "a2", user: "Sarah Chen", action: "Document Uploaded", detail: "Progress Photos Nov 2025.zip added to supporting docs", timestamp: "2025-11-30T08:55:00Z" },
  { id: "a3", user: "James Wilson", action: "Document Uploaded", detail: "Delivery Notes – Steel Level 6-10.zip added", timestamp: "2025-11-28T14:30:00Z" },
  { id: "a4", user: "Sarah Chen", action: "Line Items Updated", detail: "Frame – steel erection Level 6-10 updated to £140,000 this period", timestamp: "2025-11-27T11:20:00Z" },
  { id: "a5", user: "Mike Torres", action: "Application Created", detail: "APP-005 draft created for Nov 2025 period", timestamp: "2025-11-25T10:00:00Z" },
];

// ─── Status helpers ─────────────────────────────────────────────────────────────

const STATUS_META: Record<AppStatus, { chip: string; label: string }> = {
  Draft:     { chip: "chip-muted",    label: "Draft" },
  Submitted: { chip: "chip-info",     label: "Submitted" },
  Certified: { chip: "chip-warning",  label: "Certified" },
  Paid:      { chip: "chip-success",  label: "Paid" },
  Disputed:  { chip: "chip-danger",   label: "Disputed" },
  Withdrawn: { chip: "chip-muted",    label: "Withdrawn" },
};

function StatusChip({ status }: { status: AppStatus }) {
  const m = STATUS_META[status];
  return <span className={cn("badge", m.chip)}>{m.label}</span>;
}

// ─── Tab definitions ────────────────────────────────────────────────────────────

const TABS = [
  "Overview",
  "Schedule of Values",
  "Change Events",
  "Retention",
  "SMPE / Subcontractors",
  "Supporting Documents",
  "Correspondence",
  "Dispute Log",
  "Activity",
  "AI Narrative",
] as const;

type Tab = typeof TABS[number];

// ─── KPI Card ────────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className="kpi-card">
      <span className="kpi-label">{label}</span>
      <span className="kpi-value" style={color ? { color } : undefined}>{value}</span>
      {sub && <span className="text-xs text-[var(--text-muted)]">{sub}</span>}
    </div>
  );
}

// ─── Tab: Overview ──────────────────────────────────────────────────────────────

function OverviewTab({ app }: { app: Application }) {
  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="Applied Amount"
          value={formatCurrencyFull(app.gross_value)}
          sub="Gross cumulative"
        />
        <KpiCard
          label="Certified Amount"
          value={app.certified_amount != null ? formatCurrencyFull(app.certified_amount) : "Pending"}
          color={app.certified_amount != null ? "var(--success)" : "var(--warning)"}
          sub={app.certified_amount != null ? "Net certified" : "Awaiting certification"}
        />
        <KpiCard
          label="Payment Due"
          value={app.payment_due_date ? formatDate(app.payment_due_date) : "—"}
          sub={app.final_date_for_payment ? `Final date: ${formatDate(app.final_date_for_payment)}` : undefined}
          color="var(--info)"
        />
        <KpiCard
          label="Retention Held"
          value={formatCurrencyFull(app.retention_held)}
          sub={`${app.retention_pct}% retention rate`}
          color="var(--warning)"
        />
      </div>

      {/* Two-column detail panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application details */}
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <FileText size={15} className="text-[var(--primary)]" /> Application Details
          </h3>
          <div className="space-y-3">
            {[
              { label: "Application Ref", value: app.ref },
              { label: "Application No.", value: `#${app.app_number}` },
              { label: "Contract Reference", value: app.contract_ref },
              { label: "Application Type", value: app.app_type },
              { label: "Period From", value: formatDate(app.period_from) },
              { label: "Period To", value: formatDate(app.period_to) },
              { label: "Submission Date", value: app.submission_date ? formatDate(app.submission_date) : "Not yet submitted" },
              { label: "Contractor", value: app.contractor },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide flex-shrink-0">{label}</span>
                <span className="text-sm font-medium text-right">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Certification panel */}
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
            <CheckCircle2 size={15} className="text-[var(--success)]" /> Certification & Payment
          </h3>
          <div className="space-y-3">
            {[
              { label: "Gross Applied", value: formatCurrencyFull(app.gross_value) },
              { label: "Deductions", value: app.deductions > 0 ? `(${formatCurrencyFull(app.deductions)})` : "—" },
              { label: "Net Certified", value: app.certified_amount != null ? formatCurrencyFull(app.certified_amount) : "Pending" },
              { label: "Retention Held", value: formatCurrencyFull(app.retention_held) },
              { label: "Certification Date", value: app.certification_date ? formatDate(app.certification_date) : "—" },
              { label: "Payment Due Date", value: app.payment_due_date ? formatDate(app.payment_due_date) : "—" },
              { label: "Final Date for Payment", value: app.final_date_for_payment ? formatDate(app.final_date_for_payment) : "—" },
              { label: "Payment Received", value: app.payment_received_date ? `${formatDate(app.payment_received_date)} — ${formatCurrencyFull(app.payment_received_amount ?? 0)}` : "Not yet received" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide flex-shrink-0">{label}</span>
                <span className="text-sm font-medium text-right">{value}</span>
              </div>
            ))}
          </div>
          {app.status === "Submitted" && (
            <div className="pt-2 border-t border-[var(--border)]">
              <button className="btn btn-primary btn-sm w-full">
                <CheckCircle2 size={13} /> Record Certification
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Schedule of Values ────────────────────────────────────────────────────

function ScheduleOfValuesTab({ lines }: { lines: LineItem[] }) {
  const [sectionFilter, setSectionFilter] = useState("All");
  const sections = ["All", ...Array.from(new Set(lines.map((l) => l.section)))];
  const filtered = sectionFilter === "All" ? lines : lines.filter((l) => l.section === sectionFilter);

  const totals = {
    booked: filtered.reduce((s, l) => s + l.booked_value, 0),
    prev: filtered.reduce((s, l) => s + l.prev_cumulative, 0),
    this_period: filtered.reduce((s, l) => s + l.this_period, 0),
    cumulative: filtered.reduce((s, l) => s + l.cumulative_claimed, 0),
    certified: filtered.reduce((s, l) => s + l.certified_amount, 0),
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-[var(--text-secondary)]">Filter Section:</label>
          <select
            value={sectionFilter}
            onChange={(e) => setSectionFilter(e.target.value)}
            className="form-input h-8 text-sm w-48"
          >
            {sections.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        <button className="btn btn-primary btn-sm">
          <Plus size={13} /> Add Line Item
        </button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ref</th>
                <th>Description</th>
                <th>Section</th>
                <th className="text-right">Booked Value</th>
                <th className="text-right">Prev Cumulative</th>
                <th className="text-right">This Period</th>
                <th className="text-right">Cumulative Claimed</th>
                <th className="text-right">Cert %</th>
                <th className="text-right">Certified Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((line) => (
                <tr key={line.id}>
                  <td className="font-mono text-xs font-semibold text-[var(--primary)]">{line.ref}</td>
                  <td className="font-medium">{line.description}</td>
                  <td>
                    <span className="badge chip-muted">{line.section}</span>
                  </td>
                  <td className="text-right tabular-nums">{formatCurrencyFull(line.booked_value)}</td>
                  <td className="text-right tabular-nums text-[var(--text-muted)]">{formatCurrencyFull(line.prev_cumulative)}</td>
                  <td className="text-right tabular-nums font-semibold">{line.this_period > 0 ? formatCurrencyFull(line.this_period) : "—"}</td>
                  <td className="text-right tabular-nums">{formatCurrencyFull(line.cumulative_claimed)}</td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-[var(--bg-muted)]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(line.certified_pct, 100)}%`,
                            background: line.certified_pct >= 90 ? "var(--success)" : line.certified_pct >= 50 ? "var(--warning)" : "var(--danger)",
                          }}
                        />
                      </div>
                      <span className="text-xs font-semibold w-8 text-right">{line.certified_pct}%</span>
                    </div>
                  </td>
                  <td className="text-right tabular-nums font-semibold text-[var(--success)]">
                    {line.certified_amount > 0 ? formatCurrencyFull(line.certified_amount) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[var(--bg-subtle)]">
                <td colSpan={3} className="px-3.5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
                  Totals ({filtered.length} lines)
                </td>
                <td className="px-3.5 py-3 text-right tabular-nums font-bold">{formatCurrencyFull(totals.booked)}</td>
                <td className="px-3.5 py-3 text-right tabular-nums font-bold text-[var(--text-muted)]">{formatCurrencyFull(totals.prev)}</td>
                <td className="px-3.5 py-3 text-right tabular-nums font-bold">{formatCurrencyFull(totals.this_period)}</td>
                <td className="px-3.5 py-3 text-right tabular-nums font-bold">{formatCurrencyFull(totals.cumulative)}</td>
                <td />
                <td className="px-3.5 py-3 text-right tabular-nums font-bold text-[var(--success)]">{formatCurrencyFull(totals.certified)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Change Events ─────────────────────────────────────────────────────────

function ChangeEventsTab({ changes }: { changes: ChangeEvent[] }) {
  const chipMap: Record<string, string> = {
    Approved: "chip-success",
    Pending: "chip-warning",
    Disputed: "chip-danger",
    Rejected: "chip-danger",
  };

  const totalSubmitted = changes.reduce((s, c) => s + c.submitted_amount, 0);
  const totalCertified = changes.reduce((s, c) => s + c.certified_amount, 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Total CE Submitted" value={formatCurrencyFull(totalSubmitted)} />
        <KpiCard label="Total CE Certified" value={formatCurrencyFull(totalCertified)} color="var(--success)" />
        <KpiCard label="CE Count" value={String(changes.length)} />
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <h3 className="text-sm font-semibold">Change Events in this Application</h3>
          <Link href="/changes" className="btn btn-secondary btn-sm">
            <ExternalLink size={13} /> View All Change Events
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>CE Ref</th>
                <th>Description</th>
                <th>Status</th>
                <th className="text-right">Submitted Amount</th>
                <th className="text-right">Certified Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {changes.map((c) => (
                <tr key={c.id}>
                  <td className="font-mono text-xs font-semibold text-[var(--primary)]">{c.ref}</td>
                  <td className="font-medium">{c.description}</td>
                  <td><span className={cn("badge", chipMap[c.status] ?? "chip-muted")}>{c.status}</span></td>
                  <td className="text-right tabular-nums">{formatCurrencyFull(c.submitted_amount)}</td>
                  <td className="text-right tabular-nums font-semibold text-[var(--success)]">
                    {c.certified_amount > 0 ? formatCurrencyFull(c.certified_amount) : "—"}
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-icon btn-sm"><ChevronRight size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-[var(--bg-subtle)]">
                <td colSpan={3} className="px-3.5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase">Totals</td>
                <td className="px-3.5 py-3 text-right tabular-nums font-bold">{formatCurrencyFull(totalSubmitted)}</td>
                <td className="px-3.5 py-3 text-right tabular-nums font-bold text-[var(--success)]">{formatCurrencyFull(totalCertified)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Retention ─────────────────────────────────────────────────────────────

function RetentionTab({ app, releases }: { app: Application; releases: RetentionRelease[] }) {
  const totalReleased = releases.filter((r) => new Date(r.date) <= new Date("2026-06-10")).reduce((s, r) => s + r.amount, 0);
  const retentionBalance = app.retention_held - totalReleased;

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Retention %" value={`${app.retention_pct}%`} />
        <KpiCard label="Retention Held to Date" value={formatCurrencyFull(app.retention_held)} color="var(--warning)" />
        <KpiCard label="Retention Released" value={formatCurrencyFull(totalReleased)} color="var(--success)" />
        <KpiCard label="Retention Balance" value={formatCurrencyFull(retentionBalance)} color="var(--danger)" />
      </div>

      {/* Retention schedule details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5 space-y-4">
          <h3 className="text-sm font-semibold">Retention Schedule Details</h3>
          <div className="space-y-3">
            {[
              { label: "Retention Rate", value: `${app.retention_pct}%` },
              { label: "Contract Value", value: formatCurrencyFull(1_952_000) },
              { label: "Half Retention (Moiety)", value: formatCurrencyFull(app.retention_held / 2) },
              { label: "Defects Liability Period", value: "12 months from PC" },
              { label: "PC Date (forecast)", value: "30 Jun 2026" },
              { label: "DLP End Date", value: "30 Jun 2027" },
              { label: "Final Retention Release", value: formatDate(releases.find((r) => r.type === "Final")?.date ?? null) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">{label}</span>
                <span className="text-sm font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)]">
            <h3 className="text-sm font-semibold">Retention Release Timeline</h3>
          </div>
          <div className="p-4 space-y-3">
            {releases.map((r, i) => (
              <div key={r.id} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                    new Date(r.date) <= new Date("2026-06-10")
                      ? "bg-[var(--success)] text-white"
                      : "bg-[var(--bg-muted)] text-[var(--text-muted)]"
                  )}>
                    {i + 1}
                  </div>
                  {i < releases.length - 1 && <div className="w-px h-8 bg-[var(--border)] mt-1" />}
                </div>
                <div className="flex-1 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{r.type} Release</span>
                    <span className="text-sm font-bold text-[var(--success)]">{formatCurrencyFull(r.amount)}</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">{formatDate(r.date)} — {r.notes}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: SMPE / Subcontractors ──────────────────────────────────────────────────

function SMPETab({ subcontractors }: { subcontractors: SubContractor[] }) {
  const totalOrderValue = subcontractors.reduce((s, sc) => s + sc.order_value, 0);
  const totalThisPeriod = subcontractors.reduce((s, sc) => s + sc.this_period_claimed, 0);
  const totalCertified = subcontractors.reduce((s, sc) => s + sc.certified, 0);
  const totalCIS = subcontractors.reduce((s, sc) => s + sc.cis_deduction, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Sub Order Value" value={formatCurrencyFull(totalOrderValue)} />
        <KpiCard label="This Period Claimed" value={formatCurrencyFull(totalThisPeriod)} />
        <KpiCard label="Total Certified" value={formatCurrencyFull(totalCertified)} color="var(--success)" />
        <KpiCard label="CIS Deductions" value={formatCurrencyFull(totalCIS)} color="var(--warning)" />
      </div>

      {/* Sub payment table */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--border)]">
          <h3 className="text-sm font-semibold">Sub-Contractor Payment Schedule</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sub-Contractor</th>
                <th>Trade</th>
                <th className="text-right">Order Value</th>
                <th className="text-right">This Period Claimed</th>
                <th className="text-right">Certified</th>
                <th className="text-right">CIS Deduction</th>
                <th className="text-right">Net Payable</th>
                <th className="text-right">Balance Remaining</th>
              </tr>
            </thead>
            <tbody>
              {subcontractors.map((sc) => {
                const netPayable = sc.certified - sc.cis_deduction;
                return (
                  <tr key={sc.id}>
                    <td className="font-semibold">{sc.name}</td>
                    <td className="text-[var(--text-muted)]">{sc.trade}</td>
                    <td className="text-right tabular-nums">{formatCurrencyFull(sc.order_value)}</td>
                    <td className="text-right tabular-nums font-medium">{sc.this_period_claimed > 0 ? formatCurrencyFull(sc.this_period_claimed) : "—"}</td>
                    <td className="text-right tabular-nums font-semibold text-[var(--success)]">{sc.certified > 0 ? formatCurrencyFull(sc.certified) : "—"}</td>
                    <td className="text-right tabular-nums text-[var(--warning)]">{sc.cis_deduction > 0 ? `(${formatCurrencyFull(sc.cis_deduction)})` : "—"}</td>
                    <td className="text-right tabular-nums font-bold">{netPayable > 0 ? formatCurrencyFull(netPayable) : "—"}</td>
                    <td className="text-right tabular-nums">{formatCurrencyFull(sc.balance)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-[var(--bg-subtle)]">
                <td colSpan={2} className="px-3.5 py-3 text-xs font-semibold text-[var(--text-muted)] uppercase">Totals</td>
                <td className="px-3.5 py-3 text-right tabular-nums font-bold">{formatCurrencyFull(totalOrderValue)}</td>
                <td className="px-3.5 py-3 text-right tabular-nums font-bold">{formatCurrencyFull(totalThisPeriod)}</td>
                <td className="px-3.5 py-3 text-right tabular-nums font-bold text-[var(--success)]">{formatCurrencyFull(totalCertified)}</td>
                <td className="px-3.5 py-3 text-right tabular-nums font-bold text-[var(--warning)]">({formatCurrencyFull(totalCIS)})</td>
                <td className="px-3.5 py-3 text-right tabular-nums font-bold">{formatCurrencyFull(totalCertified - totalCIS)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* CIS deductions info */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Shield size={14} className="text-[var(--warning)]" /> CIS (Construction Industry Scheme) Deductions
        </h3>
        <p className="text-sm text-[var(--text-muted)] mb-4">
          CIS deductions are withheld from subcontractor payments and remitted to HMRC. Deduction rate: 20% (standard). All subcontractors registered under CIS with verified status.
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-[var(--bg-muted)] rounded-xl p-4 text-center">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">Gross Payments</p>
            <p className="text-lg font-bold">{formatCurrencyFull(totalCertified)}</p>
          </div>
          <div className="bg-[var(--bg-muted)] rounded-xl p-4 text-center">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">CIS Withheld</p>
            <p className="text-lg font-bold text-[var(--warning)]">{formatCurrencyFull(totalCIS)}</p>
          </div>
          <div className="bg-[var(--bg-muted)] rounded-xl p-4 text-center">
            <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">Net Payments</p>
            <p className="text-lg font-bold text-[var(--success)]">{formatCurrencyFull(totalCertified - totalCIS)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Supporting Documents ───────────────────────────────────────────────────

function SupportingDocumentsTab({ documents }: { documents: Document[] }) {
  const iconByType: Record<string, string> = {
    "Daywork Sheet": "chip-warning",
    "Site Instruction": "chip-info",
    "Delivery Note": "chip-muted",
    "Progress Photos": "chip-violet",
    "Programme": "chip-cyan",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-muted)]">{documents.length} documents attached to this application</p>
        <button className="btn btn-primary btn-sm">
          <Upload size={13} /> Upload Document
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Type</th>
                <th>Size</th>
                <th>Uploaded By</th>
                <th>Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[var(--bg-muted)] flex items-center justify-center flex-shrink-0">
                        <Paperclip size={12} className="text-[var(--text-muted)]" />
                      </div>
                      <span className="font-medium text-sm">{doc.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className={cn("badge", iconByType[doc.type] ?? "chip-muted")}>{doc.type}</span>
                  </td>
                  <td className="text-[var(--text-muted)]">{doc.size}</td>
                  <td className="text-[var(--text-muted)]">{doc.uploaded_by}</td>
                  <td className="text-[var(--text-muted)]">{formatDate(doc.uploaded_at)}</td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button className="btn btn-ghost btn-icon btn-sm" title="Preview">
                        <ExternalLink size={13} />
                      </button>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Download">
                        <Download size={13} />
                      </button>
                      <button className="btn btn-ghost btn-icon btn-sm" title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-[var(--border-strong)] rounded-2xl p-10 text-center cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--primary-light)] transition-all"
      >
        <Upload size={22} className="mx-auto text-[var(--text-muted)] mb-3" />
        <p className="text-sm font-medium text-[var(--text-secondary)]">Drop files here or click to upload</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">Supports PDF, images, ZIP. Max 100 MB per file.</p>
      </div>
    </div>
  );
}

// ─── Tab: Correspondence ────────────────────────────────────────────────────────

function CorrespondenceTab({ items }: { items: CorrespondenceItem[] }) {
  const chipMap: Record<string, string> = {
    Email: "chip-info",
    Letter: "chip-muted",
    Notice: "chip-warning",
    Certificate: "chip-success",
  };
  const statusMap: Record<string, string> = {
    Sent: "chip-primary",
    Received: "chip-success",
    Pending: "chip-warning",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-muted)]">{items.length} correspondence items</p>
        <button className="btn btn-primary btn-sm">
          <Send size={13} /> Send Notice
        </button>
      </div>

      {/* Thread view */}
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="card p-4">
            <div className="flex items-start gap-3">
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0",
                item.status === "Sent" ? "bg-[var(--primary-light)]" : "bg-[var(--bg-muted)]"
              )}>
                <MessageSquare size={15} className={item.status === "Sent" ? "text-[var(--primary)]" : "text-[var(--text-muted)]"} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-sm font-semibold">{item.subject}</span>
                  <span className={cn("badge", chipMap[item.type] ?? "chip-muted")}>{item.type}</span>
                  <span className={cn("badge", statusMap[item.status] ?? "chip-muted")}>{item.status}</span>
                </div>
                <p className="text-xs text-[var(--text-muted)]">
                  <strong>From:</strong> {item.from} &nbsp;→&nbsp; <strong>To:</strong> {item.to}
                </p>
              </div>
              <span className="text-xs text-[var(--text-muted)] flex-shrink-0">{formatDate(item.date)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Dispute Log ───────────────────────────────────────────────────────────

function DisputeLogTab({ disputes }: { disputes: Dispute[] }) {
  const statusMap: Record<string, string> = {
    Open: "chip-danger",
    Resolved: "chip-success",
    Withdrawn: "chip-muted",
  };

  if (disputes.length === 0) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-icon"><CheckCircle2 size={22} /></div>
          <h3 className="text-base font-semibold">No disputes raised</h3>
          <p className="text-sm text-[var(--text-muted)] max-w-xs">
            There are no disputes logged against this application. All items are proceeding through normal certification.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <KpiCard label="Open Disputes" value={String(disputes.filter((d) => d.status === "Open").length)} color="var(--danger)" />
        <KpiCard label="Total Disputed Amount" value={formatCurrencyFull(disputes.reduce((s, d) => s + d.amount_disputed, 0))} color="var(--warning)" />
        <KpiCard label="Resolved" value={String(disputes.filter((d) => d.status === "Resolved").length)} color="var(--success)" />
      </div>

      <div className="space-y-4">
        {disputes.map((d) => (
          <div key={d.id} className="card p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-[var(--danger)]" />
                <span className="font-semibold text-sm">Dispute raised {formatDate(d.raised_date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("badge", statusMap[d.status] ?? "chip-muted")}>{d.status}</span>
                <span className="text-sm font-bold text-[var(--danger)]">{formatCurrencyFull(d.amount_disputed)}</span>
              </div>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-3">{d.description}</p>
            {d.resolution ? (
              <div className="bg-[var(--success-bg)] border border-[var(--success)] border-opacity-20 rounded-xl p-3">
                <p className="text-xs font-semibold text-[var(--success-text)] uppercase tracking-wide mb-1">Resolution</p>
                <p className="text-sm text-[var(--success-text)]">{d.resolution}</p>
              </div>
            ) : (
              <div className="bg-[var(--danger-bg)] border border-[var(--danger)] border-opacity-20 rounded-xl p-3">
                <p className="text-xs font-semibold text-[var(--danger-text)] uppercase tracking-wide mb-1">Pending Resolution</p>
                <p className="text-sm text-[var(--danger-text)]">This dispute is currently open. Adjudication or further negotiation may be required.</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Activity ──────────────────────────────────────────────────────────────

function ActivityTab({ entries }: { entries: ActivityEntry[] }) {
  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div key={entry.id} className="card p-4 flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
            style={{ background: "var(--primary)" }}
          >
            {entry.user.split(" ").map((n) => n[0]).join("")}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold">{entry.user}</span>
              <span className="badge chip-muted">{entry.action}</span>
            </div>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">{entry.detail}</p>
          </div>
          <span className="text-xs text-[var(--text-muted)] flex-shrink-0">{formatDateTime(entry.timestamp)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Tab: AI Narrative ──────────────────────────────────────────────────────────

function AINarrativeTab({ app }: { app: Application }) {
  const [loading, setLoading] = useState(false);
  const [narrative, setNarrative] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateNarrative = () => {
    setLoading(true);
    setTimeout(() => {
      setNarrative(
        `PAYMENT CERTIFICATE NARRATIVE — ${app.ref}\n\nProject: ${app.project}\nApplication Period: ${formatDate(app.period_from)} to ${formatDate(app.period_to)}\nContractor: ${app.contractor}\n\nSUMMARY OF WORKS COMPLETED THIS PERIOD\n\nDuring the period ${formatDate(app.period_from)} to ${formatDate(app.period_to)}, the Contractor has made significant progress across multiple work sections. The principal activities undertaken include the continued erection of the structural steel frame to Levels 6–10, representing £140,000 of work this period, and the commencement of external curtain walling installation (£85,000). The mechanical and electrical first fix has advanced to 69% completion, with £65,000 of works certified.\n\nBASIS OF VALUATION\n\nThe application has been prepared on a cumulative basis in accordance with the Schedule of Values agreed at contract commencement. Preliminaries have been assessed at 66% of the contract preliminaries allowance, consistent with the programme progress. All change events included in this application (VAR-001, VAR-002, DEL-001) have been assessed against the contract mechanism and the certified sums reflect the Employer's Agent's assessment of reasonable value.\n\nCONTRACT COMPLIANCE\n\nNotice has been served in accordance with the Housing Grants, Construction and Regeneration Act 1996 (as amended). The Payment Due Date is ${formatDate(app.payment_due_date)} and the Final Date for Payment is ${formatDate(app.final_date_for_payment)}. Any Pay Less Notice must be issued no later than [FDLP minus 5 business days] to be effective. Failure to issue a valid Pay Less Notice will render the notified sum payable in full.\n\nRETENTION\n\nRetention of ${app.retention_pct}% (£${formatCurrencyFull(app.retention_held)}) has been withheld in accordance with the contract. Retention moiety shall be released upon Practical Completion, with the balance payable at the end of the Defects Liability Period.\n\n— End of AI-generated narrative draft —\n[Review and edit before issuing. This draft was generated by MeasureDeck AI.]`
      );
      setLoading(false);
    }, 1800);
  };

  const copyNarrative = () => {
    if (narrative) {
      navigator.clipboard.writeText(narrative);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--violet-bg)" }}>
            <Sparkles size={18} style={{ color: "var(--violet)" }} />
          </div>
          <div>
            <h3 className="text-sm font-semibold">AI Payment Certificate Narrative</h3>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Generate a compliant payment certificate narrative based on the application data, schedule of values, and change events. Review and edit before issuing.
            </p>
          </div>
        </div>
        {!narrative && (
          <button
            className="btn btn-primary btn-sm"
            onClick={generateNarrative}
            disabled={loading}
          >
            {loading ? (
              <><RefreshCw size={13} className="animate-spin" /> Generating…</>
            ) : (
              <><Sparkles size={13} /> Generate Narrative</>
            )}
          </button>
        )}
      </div>

      {narrative && (
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="badge chip-violet">AI Draft</span>
              <span className="text-xs text-[var(--text-muted)]">Review carefully before issuing</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="btn btn-secondary btn-sm" onClick={copyNarrative}>
                <Copy size={12} /> {copied ? "Copied!" : "Copy"}
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setNarrative(null)}>
                <RefreshCw size={12} /> Regenerate
              </button>
              <button className="btn btn-primary btn-sm">
                <Download size={12} /> Export PDF
              </button>
            </div>
          </div>
          <div className="p-5">
            <textarea
              className="form-input w-full font-mono text-xs leading-relaxed resize-none"
              rows={24}
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Loading Skeleton ───────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="kpi-card">
            <div className="skeleton h-3 w-24 rounded" />
            <div className="skeleton h-7 w-32 rounded mt-2" />
          </div>
        ))}
      </div>
      <div className="card p-5">
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-10 rounded-xl" />)}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = String(params.applicationId ?? "app5");

  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState<Application | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("applications")
          .select("*")
          .eq("id", applicationId)
          .single();
        setApp(data ?? SEED_APP);
      } catch {
        setApp(SEED_APP);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [applicationId]);

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="page-header">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="btn btn-ghost btn-icon">
              <ArrowLeft size={16} />
            </button>
            <div className="space-y-1.5">
              <div className="skeleton h-5 w-40 rounded" />
              <div className="skeleton h-3.5 w-64 rounded" />
            </div>
          </div>
        </div>
        <div className="page-content"><LoadingSkeleton /></div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="page-header">
          <button onClick={() => router.back()} className="btn btn-ghost btn-icon">
            <ArrowLeft size={16} />
          </button>
        </div>
        <div className="page-content">
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon"><FileText size={22} /></div>
              <h3 className="text-base font-semibold">Application not found</h3>
              <p className="text-sm text-[var(--text-muted)]">The application you are looking for does not exist or you do not have access.</p>
              <Link href="/applications" className="btn btn-primary btn-sm mt-2">Back to Applications</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Page header */}
      <div className="page-header">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => router.back()} className="btn btn-ghost btn-icon flex-shrink-0">
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold">{app.ref}</h1>
              <StatusChip status={app.status} />
              <span className="badge chip-muted">#{app.app_number}</span>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {app.project} &nbsp;·&nbsp; {app.contractor} &nbsp;·&nbsp; Period: {formatDate(app.period_from)} – {formatDate(app.period_to)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn btn-ghost btn-sm">
            <Sparkles size={14} /> AI Narrative
          </button>
          <button className="btn btn-secondary btn-sm">
            <Download size={14} /> Export PDF
          </button>
          {app.status === "Submitted" && (
            <button className="btn btn-primary btn-sm">
              <CheckCircle2 size={14} /> Certify Application
            </button>
          )}
          {app.status === "Certified" && (
            <button className="btn btn-primary btn-sm">
              <DollarSign size={14} /> Record Payment
            </button>
          )}
          <button className="btn btn-ghost btn-icon btn-sm">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="tab-bar mt-0">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={cn("tab-item", activeTab === t && "active")}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="page-content flex-1">
        {activeTab === "Overview"              && <OverviewTab app={app} />}
        {activeTab === "Schedule of Values"    && <ScheduleOfValuesTab lines={SEED_LINE_ITEMS} />}
        {activeTab === "Change Events"         && <ChangeEventsTab changes={SEED_CHANGES} />}
        {activeTab === "Retention"             && <RetentionTab app={app} releases={SEED_RETENTION_RELEASES} />}
        {activeTab === "SMPE / Subcontractors" && <SMPETab subcontractors={SEED_SUBCONTRACTORS} />}
        {activeTab === "Supporting Documents"  && <SupportingDocumentsTab documents={SEED_DOCUMENTS} />}
        {activeTab === "Correspondence"        && <CorrespondenceTab items={SEED_CORRESPONDENCE} />}
        {activeTab === "Dispute Log"           && <DisputeLogTab disputes={SEED_DISPUTES} />}
        {activeTab === "Activity"              && <ActivityTab entries={SEED_ACTIVITY} />}
        {activeTab === "AI Narrative"          && <AINarrativeTab app={app} />}
      </div>
    </div>
  );
}

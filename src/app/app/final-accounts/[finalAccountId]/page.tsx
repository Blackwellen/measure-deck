"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft, Pencil, Download, MoreHorizontal, CheckCircle2,
  AlertCircle, FileText, Clock, ChevronRight, Plus, Upload,
  Send, Building2, Calendar, DollarSign, TrendingUp, TrendingDown,
  Shield, Scale, Layers, Users, Link2, Eye, Trash2, RefreshCw,
  ExternalLink, Filter, X, ChevronDown, ChevronUp, Paperclip,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { cn, formatCurrency, formatCurrencyFull, formatDate, formatDateTime, formatRelative, getInitials } from "@/lib/utils";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";

// ─── Supabase ─────────────────────────────────────────────────────────────────
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Types ────────────────────────────────────────────────────────────────────
type FAStatus = "draft" | "submitted" | "in_negotiation" | "agreed" | "disputed" | "settled" | "archived";

interface FinalAccount {
  id: string;
  ref: string;
  project_id: string;
  project_name: string;
  status: FAStatus;
  contract_sum: number;
  change_events_total: number;
  provisional_sums: number;
  dayworks: number;
  fluctuations: number;
  loss_expense: number;
  contra_charges: number;
  agreed_amount: number | null;
  settled_date: string | null;
  dispute_reference: string | null;
  arbitration_commenced: boolean;
  submitted_by: string | null;
  agreed_by: string | null;
  created_at: string;
  updated_at: string;
}

interface ChangeEvent {
  id: string;
  ref: string;
  title: string;
  category: string;
  status: string;
  amount: number;
  accepted_amount: number | null;
  created_at: string;
  included: boolean;
}

interface AuditEntry {
  id: string;
  timestamp: string;
  user_name: string;
  action: string;
  field_changed?: string;
  old_value?: string;
  new_value?: string;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────
const SEED_FA: FinalAccount = {
  id: "fa-001",
  ref: "FA-2026-001",
  project_id: "proj-007",
  project_name: "Whitfield Leisure Centre Refurbishment",
  status: "in_negotiation",
  contract_sum: 2_400_000,
  change_events_total: 187_500,
  provisional_sums: 45_000,
  dayworks: 12_800,
  fluctuations: 8_200,
  loss_expense: 32_000,
  contra_charges: -22_000,
  agreed_amount: null,
  settled_date: null,
  dispute_reference: null,
  arbitration_commenced: false,
  submitted_by: "James Thornton",
  agreed_by: null,
  created_at: "2026-01-15T09:00:00Z",
  updated_at: "2026-05-22T14:30:00Z",
};

const SEED_CES: ChangeEvent[] = [
  { id: "ce-1", ref: "CE-001", title: "Additional groundworks depth", category: "Unforeseen", status: "approved", amount: 28_000, accepted_amount: 28_000, created_at: "2026-02-10T00:00:00Z", included: true },
  { id: "ce-2", ref: "CE-002", title: "Revised structural steelwork", category: "Design Change", status: "approved", amount: 54_200, accepted_amount: 54_200, created_at: "2026-02-18T00:00:00Z", included: true },
  { id: "ce-3", ref: "CE-003", title: "Client-directed scope increase (pool hall)", category: "Employer Change", status: "approved", amount: 72_300, accepted_amount: 72_300, created_at: "2026-03-05T00:00:00Z", included: true },
  { id: "ce-4", ref: "CE-004", title: "Acoustic treatment uplift", category: "Design Change", status: "approved", amount: 18_500, accepted_amount: 18_500, created_at: "2026-03-20T00:00:00Z", included: true },
  { id: "ce-5", ref: "CE-005", title: "M&E coordination delay", category: "Disruption", status: "pending", amount: 14_500, accepted_amount: null, created_at: "2026-04-12T00:00:00Z", included: false },
];

const SEED_PS_ITEMS = [
  { id: "ps-1", ref: "PS-001", description: "Specialist mechanical plant", budget: 25_000, instruction_ref: "AI-012", actual: 31_200, notes: "Overrun due to specification change" },
  { id: "ps-2", ref: "PS-002", description: "Specialist lighting installation", budget: 15_000, instruction_ref: "AI-018", actual: 13_800, notes: "" },
  { id: "ps-3", ref: "PS-003", description: "Landscape works allowance", budget: 12_000, instruction_ref: "AI-025", actual: 0, notes: "Not instructed — return to employer" },
];

const SEED_DAYWORKS = [
  { id: "dw-1", ref: "DW-001", date: "2026-03-14", description: "Emergency excavation — burst drain", labour: 2_400, plant: 1_200, materials: 380, signed: true, status: "agreed", dispute: false },
  { id: "dw-2", ref: "DW-002", date: "2026-03-28", description: "Concrete breaking — unforeseen obstacle", labour: 3_100, plant: 2_200, materials: 0, signed: true, status: "agreed", dispute: false },
  { id: "dw-3", ref: "DW-003", date: "2026-04-11", description: "Remedial drainage works", labour: 1_800, plant: 900, materials: 620, signed: false, status: "pending", dispute: true },
];

const SEED_LE_CLAIMS = [
  { id: "le-1", ref: "LE-001", head: "Prolongation", submitted: 18_000, assessed: 14_500, agreed: null, basis: "SOH 12 weeks @ £1,500/wk", status: "negotiating", legal: false },
  { id: "le-2", ref: "LE-002", head: "Disruption", submitted: 9_500, assessed: 7_200, agreed: null, basis: "Global claim — measured mile", status: "negotiating", legal: false },
  { id: "le-3", ref: "LE-003", head: "Finance charges", submitted: 4_500, assessed: 3_800, agreed: null, basis: "JCT clause 4.20", status: "pending", legal: false },
];

const SEED_CONTRA = [
  { id: "cc-1", ref: "CC-001", description: "Defective tiling — 2nd floor WCs", date: "2026-04-20", amount: 8_500, agreed: true, evidence: "DFX-14" },
  { id: "cc-2", ref: "CC-002", description: "Incomplete snagging items — pool hall", date: "2026-05-02", amount: 7_200, agreed: false, evidence: "DFX-21" },
  { id: "cc-3", ref: "CC-003", description: "Delay in handover — liquidated damages", date: "2026-05-15", amount: 6_300, agreed: false, evidence: "LD-Notice-3" },
];

const SEED_SUB_FAS = [
  { id: "sf-1", supplier: "Apex Mechanical Services", trade: "Mechanical & HVAC", subcontract_value: 385_000, final_value: 401_200, status: "agreed" },
  { id: "sf-2", supplier: "Clearline Electrical Ltd", trade: "Electrical", subcontract_value: 210_000, final_value: 218_500, status: "in_negotiation" },
  { id: "sf-3", supplier: "Summit Groundworks", trade: "Groundworks & Drainage", subcontract_value: 145_000, final_value: 158_200, status: "agreed" },
  { id: "sf-4", supplier: "Prestige Finishes Ltd", trade: "Internal Finishes", subcontract_value: 98_000, final_value: null, status: "pending" },
];

const SEED_CORRESPONDENCE = [
  { id: "co-1", type: "FA Submission", date: "2026-03-01", from: "MeasureDeck Ltd", to: "Whitfield Borough Council", summary: "Formal submission of Final Account No. FA-2026-001 in the sum of £2,663,500", viewed: true },
  { id: "co-2", type: "Counter Proposal", date: "2026-04-12", from: "Whitfield Borough Council", to: "MeasureDeck Ltd", summary: "Counter assessment at £2,531,000 — rejecting CE-005, L&E claims and daywork DW-003", viewed: true },
  { id: "co-3", type: "Response Letter", date: "2026-04-28", from: "MeasureDeck Ltd", to: "Whitfield Borough Council", summary: "Substantive response to counter assessment with supporting evidence pack", viewed: false },
];

const SEED_AUDIT: AuditEntry[] = [
  { id: "au-1", timestamp: "2026-05-22T14:30:00Z", user_name: "James Thornton", action: "Status changed", field_changed: "status", old_value: "submitted", new_value: "in_negotiation" },
  { id: "au-2", timestamp: "2026-05-15T10:10:00Z", user_name: "Sarah Malik", action: "CE-005 excluded from FA", field_changed: "ce_included", old_value: "true", new_value: "false" },
  { id: "au-3", timestamp: "2026-04-30T09:00:00Z", user_name: "James Thornton", action: "Correspondence uploaded", field_changed: "documents", old_value: "", new_value: "Response-Letter-Apr28.pdf" },
  { id: "au-4", timestamp: "2026-03-01T08:45:00Z", user_name: "James Thornton", action: "FA submitted for agreement", field_changed: "status", old_value: "draft", new_value: "submitted" },
  { id: "au-5", timestamp: "2026-01-15T09:00:00Z", user_name: "James Thornton", action: "Final Account created", field_changed: "", old_value: "", new_value: "" },
];

const SECTIONS_TABLE = [
  { ref: "1A", description: "Substructure & Foundations", original: 385_000, variations: 28_000, ps_adj: 0, final: 413_000 },
  { ref: "2A", description: "Frame & Upper Floors", original: 420_000, variations: 54_200, ps_adj: 0, final: 474_200 },
  { ref: "3A", description: "Pool Hall & Leisure Facilities", original: 680_000, variations: 72_300, ps_adj: -12_000, final: 740_300 },
  { ref: "4A", description: "Mechanical & Electrical", original: 595_000, variations: 18_500, ps_adj: 25_000, final: 638_500 },
  { ref: "5A", description: "Finishes & Fit-Out", original: 320_000, variations: 14_500, ps_adj: 0, final: 334_500 },
];

const RETENTION_DATA = {
  rate: 3,
  held_at_completion: 72_000,
  pc_date: "2026-03-15",
  release_1_amount: 36_000,
  release_1_date: "2026-03-15",
  dlp_end: "2026-09-15",
  release_2_amount: 36_000,
  release_2_date: "2026-09-15",
};

const STATUS_META: Record<FAStatus, { chip: string; label: string }> = {
  draft:          { chip: "chip-muted",    label: "Draft" },
  submitted:      { chip: "chip-info",     label: "Submitted" },
  in_negotiation: { chip: "chip-warning",  label: "In Negotiation" },
  agreed:         { chip: "chip-approved", label: "Agreed" },
  disputed:       { chip: "chip-danger",   label: "Disputed" },
  settled:        { chip: "chip-success",  label: "Settled" },
  archived:       { chip: "chip-muted",    label: "Archived" },
};

const TABS = [
  "Summary", "Contract Sum Analysis", "Compensation Events", "Provisional Sums",
  "Dayworks", "Loss & Expense", "Fluctuations", "Contra Charges",
  "Retention", "Subcontract FAs", "Correspondence", "Settlement",
  "Documents", "Audit",
] as const;
type TabId = typeof TABS[number];

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-gray-100 rounded-lg", className)} />;
}

// ─── Status Stepper ───────────────────────────────────────────────────────────
const FA_STEPS: { key: FAStatus; label: string }[] = [
  { key: "draft", label: "Draft" },
  { key: "submitted", label: "Submitted" },
  { key: "in_negotiation", label: "Negotiating" },
  { key: "agreed", label: "Agreed" },
  { key: "settled", label: "Settled" },
];

function StatusStepper({ status }: { status: FAStatus }) {
  const currentIdx = FA_STEPS.findIndex(s => s.key === status);
  return (
    <div className="flex items-center gap-0 w-full">
      {FA_STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2",
                done && "bg-[var(--primary)] border-[var(--primary)] text-white",
                active && "bg-white border-[var(--primary)] text-[var(--primary)]",
                !done && !active && "bg-white border-gray-200 text-gray-400"
              )}>
                {done ? <CheckCircle2 size={16} /> : i + 1}
              </div>
              <span className={cn(
                "text-[11px] mt-1 font-medium whitespace-nowrap",
                active ? "text-[var(--primary)]" : done ? "text-gray-600" : "text-gray-400"
              )}>{step.label}</span>
            </div>
            {i < FA_STEPS.length - 1 && (
              <div className={cn("h-0.5 flex-1 mx-1 mt-[-14px]", done ? "bg-[var(--primary)]" : "bg-gray-200")} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function FinalAccountDetailPage() {
  const router = useRouter();
  const { finalAccountId } = useParams<{ finalAccountId: string }>();
  const [fa, setFa] = useState<FinalAccount | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("Summary");
  const [ceFilter, setCeFilter] = useState<"all" | "approved" | "pending" | "excluded">("all");
  const [settlementType, setSettlementType] = useState<string>("full");
  const [fluctuationApplies, setFluctuationApplies] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data: faRow } = await supabase
          .from("final_accounts")
          .select("*, projects(name, contract_sum)")
          .eq("id", finalAccountId)
          .single();
        if (faRow) {
          setFa({
            ...faRow,
            project_name: faRow.projects?.name ?? "Unknown Project",
            contract_sum: faRow.contract_sum ?? faRow.projects?.contract_sum ?? SEED_FA.contract_sum,
          } as FinalAccount);
        } else {
          setFa(SEED_FA);
        }
      } catch {
        setFa(SEED_FA);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [finalAccountId]);

  const data = fa ?? SEED_FA;
  const faTotal = data.contract_sum + data.change_events_total + data.provisional_sums
    + data.dayworks + data.fluctuations + data.loss_expense + data.contra_charges;
  const diff = faTotal - data.contract_sum;

  // ─── KPI Strip ──────────────────────────────────────────────────────────────
  function KpiStrip() {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="kpi-card border-l-4 border-l-blue-500">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Contract Sum</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(data.contract_sum)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Original JCT value</p>
        </div>
        <div className={cn("kpi-card border-l-4", data.agreed_amount ? "border-l-green-500" : "border-l-amber-400")}>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
            {data.agreed_amount ? "Agreed Sum" : "Draft FA Total"}
          </p>
          <p className={cn("text-2xl font-bold mt-1", data.agreed_amount ? "text-green-700" : "text-amber-700")}>
            {formatCurrency(data.agreed_amount ?? faTotal)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{data.agreed_amount ? "Formally agreed" : "Subject to agreement"}</p>
        </div>
        <div className={cn("kpi-card border-l-4", diff >= 0 ? "border-l-orange-400" : "border-l-green-400")}>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">vs Contract</p>
          <p className={cn("text-2xl font-bold mt-1", diff >= 0 ? "text-orange-600" : "text-green-600")}>
            {diff >= 0 ? "+" : ""}{formatCurrency(diff)}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{diff >= 0 ? "Over contract" : "Under contract"}</p>
        </div>
        <div className="kpi-card border-l-4 border-l-purple-500">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Status</p>
          <div className="mt-2">
            <span className={STATUS_META[data.status].chip}>{STATUS_META[data.status].label}</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">Updated {formatRelative(data.updated_at)}</p>
        </div>
        <div className="kpi-card border-l-4 border-l-gray-300">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Agreed Date</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {data.settled_date ? formatDate(data.settled_date) : "Pending"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {data.agreed_by ? `Agreed by ${data.agreed_by}` : "Not yet agreed"}
          </p>
        </div>
      </div>
    );
  }

  // ─── Tab: Summary ──────────────────────────────────────────────────────────
  function TabSummary() {
    const buildupRows = [
      { label: "Contract Sum", value: data.contract_sum, positive: true },
      { label: "+ Compensation Events", value: data.change_events_total, positive: data.change_events_total >= 0 },
      { label: "+ Provisional Sums (net)", value: data.provisional_sums, positive: data.provisional_sums >= 0 },
      { label: "+ Dayworks", value: data.dayworks, positive: true },
      { label: "+ Fluctuations", value: data.fluctuations, positive: data.fluctuations >= 0 },
      { label: "+ Loss & Expense", value: data.loss_expense, positive: true },
      { label: "− Contra Charges", value: data.contra_charges, positive: false },
    ];
    const chartData = [
      { name: "Comp. Events", value: Math.abs(data.change_events_total), fill: "#3B5EE8" },
      { name: "Prov. Sums", value: Math.abs(data.provisional_sums), fill: "#8B5CF6" },
      { name: "Dayworks", value: Math.abs(data.dayworks), fill: "#F59E0B" },
      { name: "Fluctuations", value: Math.abs(data.fluctuations), fill: "#10B981" },
      { name: "L&E", value: Math.abs(data.loss_expense), fill: "#EF4444" },
      { name: "Contra", value: Math.abs(data.contra_charges), fill: "#6B7280" },
    ];
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-5 text-base">FA Status Timeline</h3>
          <StatusStepper status={data.status} />
          <div className="mt-6 space-y-3 border-t border-gray-100 pt-5">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Created</span>
              <span className="font-medium text-gray-900">{formatDate(data.created_at)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Submitted</span>
              <span className="font-medium text-gray-900">{data.submitted_by ? formatDate(data.updated_at) : "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Target Agreement</span>
              <span className="font-medium text-amber-600">31 Aug 2026</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Actual Agreement</span>
              <span className="font-medium text-gray-900">{data.agreed_amount ? formatDate(data.updated_at) : "—"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Settled Date</span>
              <span className="font-medium text-gray-900">{formatDate(data.settled_date)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Submitted By</span>
              <span className="font-medium text-gray-900">{data.submitted_by ?? "—"}</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-5 text-base">Financial Build-Up</h3>
          <div className="space-y-2">
            {buildupRows.map((row, i) => (
              <div key={i} className={cn(
                "flex justify-between items-center py-2 px-3 rounded-lg text-sm",
                i === 0 ? "bg-blue-50 font-semibold" : "hover:bg-gray-50"
              )}>
                <span className={i === 0 ? "text-blue-900" : "text-gray-600"}>{row.label}</span>
                <span className={cn("font-semibold", i === 0 ? "text-blue-900" : row.value < 0 ? "text-red-600" : "text-gray-900")}>
                  {formatCurrency(row.value)}
                </span>
              </div>
            ))}
            <div className="flex justify-between items-center py-3 px-3 rounded-lg bg-gray-900 text-white font-bold text-sm mt-2">
              <span>= FA Total</span>
              <span>{formatCurrency(faTotal)}</span>
            </div>
          </div>
          <div className="mt-5">
            <p className="text-xs text-gray-500 mb-3 font-medium">Composition of FA adjustments</p>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={chartData} layout="vertical" margin={{ left: 0 }}>
                <XAxis type="number" tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {chartData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  // ─── Tab: Contract Sum Analysis ────────────────────────────────────────────
  function TabContractSumAnalysis() {
    const totals = SECTIONS_TABLE.reduce((acc, r) => ({
      original: acc.original + r.original,
      variations: acc.variations + r.variations,
      ps_adj: acc.ps_adj + r.ps_adj,
      final: acc.final + r.final,
    }), { original: 0, variations: 0, ps_adj: 0, final: 0 });
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">Contract Sum Analysis by Section</h3>
          <button className="btn-secondary flex items-center gap-2 text-sm" onClick={() => toast.success("CSV exported")}>
            <Download size={14} /> Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Section Ref</th>
                <th>Description</th>
                <th className="text-right">Original Sum</th>
                <th className="text-right">Variations Agreed</th>
                <th className="text-right">Net PS Adjustment</th>
                <th className="text-right">Final Section Sum</th>
              </tr>
            </thead>
            <tbody>
              {SECTIONS_TABLE.map((row) => (
                <tr key={row.ref}>
                  <td className="font-mono text-sm font-medium">{row.ref}</td>
                  <td>{row.description}</td>
                  <td className="text-right">{formatCurrency(row.original)}</td>
                  <td className={cn("text-right", row.variations > 0 ? "text-orange-600" : "")}>{row.variations > 0 ? "+" : ""}{formatCurrency(row.variations)}</td>
                  <td className={cn("text-right", row.ps_adj < 0 ? "text-green-600" : row.ps_adj > 0 ? "text-orange-600" : "")}>{row.ps_adj !== 0 ? (row.ps_adj > 0 ? "+" : "") + formatCurrency(row.ps_adj) : "—"}</td>
                  <td className="text-right font-semibold">{formatCurrency(row.final)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold bg-gray-50">
                <td colSpan={2}>Totals</td>
                <td className="text-right">{formatCurrency(totals.original)}</td>
                <td className="text-right text-orange-600">+{formatCurrency(totals.variations)}</td>
                <td className="text-right text-green-600">{formatCurrency(totals.ps_adj)}</td>
                <td className="text-right">{formatCurrency(totals.final)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="mt-5">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={SECTIONS_TABLE} margin={{ left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="ref" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="original" name="Original" fill="#93C5FD" radius={[2, 2, 0, 0]} />
              <Bar dataKey="final" name="Final" fill="#3B5EE8" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // ─── Tab: Compensation Events ───────────────────────────────────────────────
  function TabCEs() {
    const filtered = SEED_CES.filter(ce => {
      if (ceFilter === "all") return true;
      if (ceFilter === "approved") return ce.status === "approved";
      if (ceFilter === "pending") return ce.status === "pending";
      if (ceFilter === "excluded") return !ce.included;
      return true;
    });
    const includedTotal = SEED_CES.filter(c => c.included).reduce((s, c) => s + (c.accepted_amount ?? c.amount), 0);
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              {(["all", "approved", "pending", "excluded"] as const).map(f => (
                <button key={f} onClick={() => setCeFilter(f)}
                  className={cn("px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition",
                    ceFilter === f ? "bg-[var(--primary)] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200")}>
                  {f}
                </button>
              ))}
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-sm">
              <span className="text-blue-600 font-medium">Running subtotal: </span>
              <span className="font-bold text-blue-900">{formatCurrency(includedTotal)}</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>CE Ref</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th className="text-right">Submitted £</th>
                  <th className="text-right">Agreed £</th>
                  <th>Status</th>
                  <th>Include</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(ce => (
                  <tr key={ce.id}>
                    <td className="font-mono text-sm font-medium text-blue-700">{ce.ref}</td>
                    <td>{ce.title}</td>
                    <td><span className="text-xs bg-gray-100 px-2 py-0.5 rounded-md">{ce.category}</span></td>
                    <td className="text-right">{formatCurrency(ce.amount)}</td>
                    <td className="text-right font-medium">{ce.accepted_amount ? formatCurrency(ce.accepted_amount) : "—"}</td>
                    <td>
                      <span className={ce.status === "approved" ? "chip-approved" : "chip-warning"}>
                        {ce.status}
                      </span>
                    </td>
                    <td>
                      <button className={cn(
                        "text-xs px-2 py-1 rounded-md border font-medium transition",
                        ce.included ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-50 border-gray-200 text-gray-500"
                      )}>
                        {ce.included ? "Included" : "Excluded"}
                      </button>
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

  // ─── Tab: Provisional Sums ──────────────────────────────────────────────────
  function TabPS() {
    const total_budget = SEED_PS_ITEMS.reduce((s, r) => s + r.budget, 0);
    const total_actual = SEED_PS_ITEMS.reduce((s, r) => s + r.actual, 0);
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Provisional Sums Schedule</h3>
          <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => toast.info("Add PS item")}>
            <Plus size={14} /> Add PS Item
          </button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>PS Ref</th>
              <th>Description</th>
              <th className="text-right">Budget £</th>
              <th>Instruction Ref</th>
              <th className="text-right">Actual Expenditure £</th>
              <th className="text-right">Adjustment</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {SEED_PS_ITEMS.map(ps => {
              const adj = ps.actual - ps.budget;
              return (
                <tr key={ps.id}>
                  <td className="font-mono text-sm">{ps.ref}</td>
                  <td>{ps.description}</td>
                  <td className="text-right">{formatCurrency(ps.budget)}</td>
                  <td className="text-sm text-gray-500">{ps.instruction_ref || "—"}</td>
                  <td className="text-right">{ps.actual > 0 ? formatCurrency(ps.actual) : "—"}</td>
                  <td className={cn("text-right font-medium", adj > 0 ? "text-red-600" : adj < 0 ? "text-green-600" : "text-gray-400")}>
                    {ps.actual > 0 ? (adj >= 0 ? "+" : "") + formatCurrency(adj) : "—"}
                  </td>
                  <td className="text-xs text-gray-500 max-w-[160px] truncate">{ps.notes || "—"}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="font-bold bg-gray-50">
              <td colSpan={2}>Totals</td>
              <td className="text-right">{formatCurrency(total_budget)}</td>
              <td />
              <td className="text-right">{formatCurrency(total_actual)}</td>
              <td className={cn("text-right", total_actual - total_budget > 0 ? "text-red-600" : "text-green-600")}>
                {(total_actual - total_budget >= 0 ? "+" : "") + formatCurrency(total_actual - total_budget)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }

  // ─── Tab: Dayworks ─────────────────────────────────────────────────────────
  function TabDayworks() {
    const grandTotal = SEED_DAYWORKS.reduce((s, r) => s + r.labour + r.plant + r.materials, 0);
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Daywork Sheets</h3>
          <button className="btn-secondary flex items-center gap-2 text-sm" onClick={() => toast.info("Upload daywork sheet")}>
            <Upload size={14} /> Upload Sheet
          </button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Sheet Ref</th>
              <th>Date</th>
              <th>Description</th>
              <th className="text-right">Labour £</th>
              <th className="text-right">Plant £</th>
              <th className="text-right">Materials £</th>
              <th className="text-right">Total £</th>
              <th>Signed</th>
              <th>Status</th>
              <th>Dispute</th>
            </tr>
          </thead>
          <tbody>
            {SEED_DAYWORKS.map(dw => {
              const total = dw.labour + dw.plant + dw.materials;
              return (
                <tr key={dw.id}>
                  <td className="font-mono text-sm">{dw.ref}</td>
                  <td className="text-sm">{formatDate(dw.date)}</td>
                  <td className="text-sm max-w-[180px] truncate">{dw.description}</td>
                  <td className="text-right">{formatCurrency(dw.labour)}</td>
                  <td className="text-right">{formatCurrency(dw.plant)}</td>
                  <td className="text-right">{formatCurrency(dw.materials)}</td>
                  <td className="text-right font-medium">{formatCurrency(total)}</td>
                  <td>{dw.signed ? <span className="chip-approved text-xs">Signed</span> : <span className="chip-muted text-xs">Unsigned</span>}</td>
                  <td><span className={dw.status === "agreed" ? "chip-approved" : "chip-warning"}>{dw.status}</span></td>
                  <td>{dw.dispute ? <span className="chip-danger text-xs">Dispute</span> : <span className="text-gray-300">—</span>}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="font-bold bg-gray-50">
              <td colSpan={6}>Grand Total</td>
              <td className="text-right">{formatCurrency(grandTotal)}</td>
              <td colSpan={3} />
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }

  // ─── Tab: Loss & Expense ───────────────────────────────────────────────────
  function TabLE() {
    const totalSubmitted = SEED_LE_CLAIMS.reduce((s, r) => s + r.submitted, 0);
    const totalAssessed = SEED_LE_CLAIMS.reduce((s, r) => s + r.assessed, 0);
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Loss &amp; Expense / Claims Schedule</h3>
          <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => toast.info("Add claim")}>
            <Plus size={14} /> Add Claim
          </button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Claim Ref</th>
              <th>Head of Claim</th>
              <th className="text-right">Submitted £</th>
              <th className="text-right">Assessed £</th>
              <th className="text-right">Agreed £</th>
              <th>Basis</th>
              <th>Status</th>
              <th>Legal</th>
            </tr>
          </thead>
          <tbody>
            {SEED_LE_CLAIMS.map(claim => (
              <tr key={claim.id}>
                <td className="font-mono text-sm">{claim.ref}</td>
                <td>{claim.head}</td>
                <td className="text-right">{formatCurrency(claim.submitted)}</td>
                <td className="text-right text-amber-600">{formatCurrency(claim.assessed)}</td>
                <td className="text-right text-green-600">{claim.agreed ? formatCurrency(claim.agreed) : "—"}</td>
                <td className="text-xs text-gray-500 max-w-[160px] truncate">{claim.basis}</td>
                <td><span className={claim.status === "agreed" ? "chip-approved" : claim.status === "negotiating" ? "chip-warning" : "chip-muted"}>{claim.status}</span></td>
                <td>
                  <button className={cn("text-xs px-2 py-1 rounded-md border", claim.legal ? "bg-red-50 border-red-200 text-red-700" : "bg-gray-50 border-gray-200 text-gray-500")}>
                    {claim.legal ? "Legal" : "None"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold bg-gray-50">
              <td colSpan={2}>Totals</td>
              <td className="text-right">{formatCurrency(totalSubmitted)}</td>
              <td className="text-right text-amber-600">{formatCurrency(totalAssessed)}</td>
              <td colSpan={4} />
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }

  // ─── Tab: Fluctuations ─────────────────────────────────────────────────────
  function TabFluctuations() {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-900">Fluctuations</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Fluctuations apply?</span>
            <button onClick={() => setFluctuationApplies(!fluctuationApplies)}
              className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                fluctuationApplies ? "bg-[var(--primary)]" : "bg-gray-200")}>
              <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform",
                fluctuationApplies ? "translate-x-6" : "translate-x-1")} />
            </button>
          </div>
        </div>
        {fluctuationApplies ? (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-medium">Base Date</label>
                <input type="date" defaultValue="2025-06-01" className="form-input mt-1 w-full" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Formula Clause</label>
                <select className="form-input mt-1 w-full">
                  <option>BCIS Formula Rules 1990</option>
                  <option>Bespoke schedule</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Total Fluctuations</label>
                <input type="text" defaultValue={formatCurrency(data.fluctuations)} className="form-input mt-1 w-full bg-gray-50" readOnly />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-700">Index Table</h4>
                <button className="btn-secondary text-xs flex items-center gap-1" onClick={() => toast.info("Upload indices")}>
                  <Upload size={12} /> Upload Indices
                </button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th className="text-right">Base Index</th>
                    <th className="text-right">Current Index</th>
                    <th className="text-right">% Change</th>
                    <th className="text-right">Adjustment £</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { period: "Jan 2026", base: 100, current: 103.2, adj: 1_420 },
                    { period: "Feb 2026", base: 100, current: 103.8, adj: 1_890 },
                    { period: "Mar 2026", base: 100, current: 104.5, adj: 2_240 },
                    { period: "Apr 2026", base: 100, current: 104.1, adj: 1_820 },
                    { period: "May 2026", base: 100, current: 103.9, adj: 830 },
                  ].map((r, i) => (
                    <tr key={i}>
                      <td>{r.period}</td>
                      <td className="text-right">{r.base.toFixed(1)}</td>
                      <td className="text-right">{r.current.toFixed(1)}</td>
                      <td className="text-right text-orange-600">+{((r.current - r.base) / r.base * 100).toFixed(1)}%</td>
                      <td className="text-right text-orange-600">+{formatCurrency(r.adj)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold bg-gray-50">
                    <td colSpan={4}>Total Fluctuations</td>
                    <td className="text-right text-orange-600">+{formatCurrency(data.fluctuations)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <Scale size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Fluctuations do not apply to this contract.</p>
            <p className="text-xs mt-1">Toggle above if this changes.</p>
          </div>
        )}
      </div>
    );
  }

  // ─── Tab: Contra Charges ───────────────────────────────────────────────────
  function TabContra() {
    const total = SEED_CONTRA.reduce((s, r) => s + r.amount, 0);
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Contra Charges</h3>
          <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => toast.info("Add contra charge")}>
            <Plus size={14} /> Add Contra Charge
          </button>
        </div>
        {total > 15_000 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-sm text-amber-800">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            Net contra charges of {formatCurrency(total)} represent {((total / faTotal) * 100).toFixed(1)}% of FA total — review before agreement.
          </div>
        )}
        <table className="data-table">
          <thead>
            <tr>
              <th>Ref</th>
              <th>Description</th>
              <th>Date</th>
              <th className="text-right">Amount £</th>
              <th>Status</th>
              <th>Evidence</th>
            </tr>
          </thead>
          <tbody>
            {SEED_CONTRA.map(cc => (
              <tr key={cc.id}>
                <td className="font-mono text-sm">{cc.ref}</td>
                <td>{cc.description}</td>
                <td className="text-sm">{formatDate(cc.date)}</td>
                <td className="text-right text-red-600 font-medium">{formatCurrency(cc.amount)}</td>
                <td><span className={cc.agreed ? "chip-approved" : "chip-warning"}>{cc.agreed ? "Agreed" : "Disputed"}</span></td>
                <td className="text-xs text-blue-600 font-mono">{cc.evidence}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="font-bold bg-gray-50">
              <td colSpan={3}>Total Contra Charges</td>
              <td className="text-right text-red-600">{formatCurrency(total)}</td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    );
  }

  // ─── Tab: Retention ────────────────────────────────────────────────────────
  function TabRetention() {
    const { rate, held_at_completion, pc_date, release_1_amount, release_1_date, dlp_end, release_2_amount, release_2_date } = RETENTION_DATA;
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-5">Retention Account</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Retention Rate</span>
              <span className="font-bold text-gray-900">{rate}%</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Retention Held at Completion</span>
              <span className="font-bold text-orange-600">{formatCurrency(held_at_completion)}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Practical Completion Date</span>
              <span className="font-medium text-gray-900">{formatDate(pc_date)}</span>
            </div>
            <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-green-700 font-medium uppercase">Release 1 — 50% at PC</p>
                  <p className="text-xs text-green-600 mt-0.5">{formatDate(release_1_date)}</p>
                </div>
                <span className="text-lg font-bold text-green-700">{formatCurrency(release_1_amount)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-600">Defects Liability Period End</span>
              <span className="font-medium text-gray-900">{formatDate(dlp_end)}</span>
            </div>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-blue-700 font-medium uppercase">Release 2 — 50% at DLP end</p>
                  <p className="text-xs text-blue-600 mt-0.5">{formatDate(release_2_date)}</p>
                </div>
                <span className="text-lg font-bold text-blue-700">{formatCurrency(release_2_amount)}</span>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 bg-gray-50 rounded-lg px-3">
              <span className="text-sm font-semibold text-gray-700">Final Retention Balance</span>
              <span className="font-bold text-gray-900">{formatCurrency(0)}</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-5">Retention Release Timeline</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={[
              { name: "PC Date\n(Mar '26)", held: held_at_completion, released: release_1_amount },
              { name: "DLP End\n(Sep '26)", held: release_2_amount, released: release_2_amount },
              { name: "Final", held: 0, released: 0 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tickFormatter={v => `£${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="held" name="Retention Held" fill="#F59E0B" radius={[2, 2, 0, 0]} />
              <Bar dataKey="released" name="Released" fill="#10B981" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  // ─── Tab: Subcontract FAs ──────────────────────────────────────────────────
  function TabSubFAs() {
    const pending = SEED_SUB_FAS.filter(s => s.status === "pending");
    const totalAllowance = SEED_SUB_FAS.reduce((s, r) => s + r.subcontract_value, 0);
    const totalFinal = SEED_SUB_FAS.filter(s => s.final_value).reduce((s, r) => s + (r.final_value ?? 0), 0);
    return (
      <div className="space-y-4">
        {pending.length > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-sm text-amber-800">
            <AlertCircle size={16} className="text-amber-600 shrink-0" />
            {pending.length} subcontract final account(s) still pending — this may delay overall FA agreement.
          </div>
        )}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">Subcontract Final Accounts</h3>
              <p className="text-xs text-gray-500 mt-0.5">Sub FA totals vs allowed values</p>
            </div>
            <div className="flex gap-3 text-sm">
              <div className="text-right">
                <p className="text-gray-500 text-xs">Total Allowance</p>
                <p className="font-bold text-gray-900">{formatCurrency(totalAllowance)}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 text-xs">Total Final</p>
                <p className="font-bold text-orange-600">{formatCurrency(totalFinal)}</p>
              </div>
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Trade</th>
                <th className="text-right">Sub Contract Value</th>
                <th className="text-right">Final Sub FA</th>
                <th className="text-right">Variance</th>
                <th>Status</th>
                <th>Documents</th>
              </tr>
            </thead>
            <tbody>
              {SEED_SUB_FAS.map(sf => {
                const variance = sf.final_value ? sf.final_value - sf.subcontract_value : null;
                return (
                  <tr key={sf.id}>
                    <td className="font-medium">{sf.supplier}</td>
                    <td className="text-sm text-gray-600">{sf.trade}</td>
                    <td className="text-right">{formatCurrency(sf.subcontract_value)}</td>
                    <td className="text-right">{sf.final_value ? formatCurrency(sf.final_value) : "—"}</td>
                    <td className={cn("text-right font-medium", variance && variance > 0 ? "text-red-600" : variance && variance < 0 ? "text-green-600" : "text-gray-400")}>
                      {variance !== null ? (variance >= 0 ? "+" : "") + formatCurrency(variance) : "—"}
                    </td>
                    <td><span className={sf.status === "agreed" ? "chip-approved" : sf.status === "in_negotiation" ? "chip-warning" : "chip-muted"}>{sf.status.replace("_", " ")}</span></td>
                    <td>
                      <button className="btn-ghost text-xs flex items-center gap-1" onClick={() => toast.info("Upload sub FA doc")}>
                        <Upload size={12} /> Upload
                      </button>
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

  // ─── Tab: Correspondence ───────────────────────────────────────────────────
  function TabCorrespondence() {
    const typeColors: Record<string, string> = {
      "FA Submission": "chip-info",
      "Counter Proposal": "chip-warning",
      "Response Letter": "chip-approved",
      "Dispute Notice": "chip-danger",
      "Agreement": "chip-success",
    };
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">FA Correspondence Timeline</h3>
          <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => toast.info("Upload correspondence")}>
            <Upload size={14} /> Upload Letter
          </button>
        </div>
        <div className="space-y-4">
          {SEED_CORRESPONDENCE.map((co, i) => (
            <div key={co.id} className={cn("p-4 border rounded-xl relative", co.viewed ? "bg-white border-gray-200" : "bg-blue-50 border-blue-200")}>
              {!co.viewed && <span className="absolute top-3 right-3 text-xs text-blue-600 font-medium">New</span>}
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">{i + 1}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={typeColors[co.type] ?? "chip-muted"}>{co.type}</span>
                    <span className="text-xs text-gray-500">{formatDate(co.date)}</span>
                  </div>
                  <p className="text-sm text-gray-800">{co.summary}</p>
                  <p className="text-xs text-gray-500 mt-1">From: <span className="font-medium">{co.from}</span> → To: <span className="font-medium">{co.to}</span></p>
                </div>
                <button className="btn-ghost text-xs flex items-center gap-1 shrink-0">
                  <Eye size={12} /> View
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Tab: Settlement ───────────────────────────────────────────────────────
  function TabSettlement() {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-6">Settlement Details</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Settlement Type</label>
              <div className="space-y-2">
                {[
                  { value: "full", label: "Full and Final Settlement" },
                  { value: "partial", label: "Partial Settlement" },
                  { value: "without_prejudice", label: "Without Prejudice Settlement" },
                  { value: "adjudication", label: "Adjudication Award" },
                  { value: "arbitration", label: "Arbitration Award" },
                ].map(opt => (
                  <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                    <input type="radio" name="settlement_type" value={opt.value}
                      checked={settlementType === opt.value}
                      onChange={() => setSettlementType(opt.value)}
                      className="w-4 h-4 accent-[var(--primary)]" />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Agreed Amount</label>
              <input type="text" placeholder={formatCurrency(faTotal)} className="form-input w-full" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Settlement Date</label>
              <input type="date" className="form-input w-full" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Settlement Terms</label>
              <textarea rows={4} placeholder="Enter settlement terms and conditions..." className="form-input w-full resize-none" />
            </div>
          </div>
          <div className="space-y-5">
            <div className="p-4 border border-gray-200 rounded-xl">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">Solicitor Details</h4>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-500">Solicitor Name</label>
                  <input type="text" placeholder="e.g. Andrew Roberts" className="form-input w-full mt-1" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Firm</label>
                  <input type="text" placeholder="e.g. Roberts & Partners LLP" className="form-input w-full mt-1" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">File Reference</label>
                  <input type="text" placeholder="e.g. RP/2026/WLC-001" className="form-input w-full mt-1" />
                </div>
              </div>
            </div>
            <div className="p-4 border border-gray-200 rounded-xl">
              <h4 className="text-sm font-semibold text-gray-700 mb-3">ADR / Arbitration Status</h4>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-[var(--primary)]" />
                  <span className="text-sm text-gray-700">ADR process commenced</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-[var(--primary)]" />
                  <span className="text-sm text-gray-700">Arbitration commenced</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-[var(--primary)]" />
                  <span className="text-sm text-gray-700">Dispute reference number</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
          <button className="btn-primary px-6" onClick={() => toast.success("Settlement details saved")}>
            Save Settlement
          </button>
        </div>
      </div>
    );
  }

  // ─── Tab: Documents ────────────────────────────────────────────────────────
  function TabDocuments() {
    const docs = [
      { id: "d1", title: "FA Submission Pack", type: "PDF", version: "v1.0", date: "2026-03-01", by: "James Thornton", size: "4.2 MB" },
      { id: "d2", title: "Supporting Calculations", type: "XLSX", version: "v2.1", date: "2026-03-01", by: "James Thornton", size: "1.1 MB" },
      { id: "d3", title: "Daywork Sheets Bundle", type: "PDF", version: "v1.0", date: "2026-03-14", by: "James Thornton", size: "2.8 MB" },
      { id: "d4", title: "Counter Assessment Response", type: "PDF", version: "v1.0", date: "2026-04-28", by: "Sarah Malik", size: "1.5 MB" },
    ];
    const typeIcon = (t: string) => t === "PDF" ? "📄" : t === "XLSX" ? "📊" : "📁";
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">Document Library</h3>
          <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => toast.info("Upload document")}>
            <Upload size={14} /> Upload Document
          </button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Version</th>
              <th>Date</th>
              <th>Uploaded By</th>
              <th>Size</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {docs.map(doc => (
              <tr key={doc.id}>
                <td className="font-medium flex items-center gap-2">
                  <span>{typeIcon(doc.type)}</span> {doc.title}
                </td>
                <td><span className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">{doc.type}</span></td>
                <td className="text-xs font-mono text-gray-500">{doc.version}</td>
                <td className="text-sm">{formatDate(doc.date)}</td>
                <td className="text-sm text-gray-600">{doc.by}</td>
                <td className="text-xs text-gray-500">{doc.size}</td>
                <td>
                  <div className="flex items-center gap-1">
                    <button className="btn-ghost text-xs p-1" onClick={() => toast.info("View document")} title="View"><Eye size={13} /></button>
                    <button className="btn-ghost text-xs p-1" onClick={() => toast.success("Downloading...")} title="Download"><Download size={13} /></button>
                    <button className="btn-ghost text-xs p-1 text-red-500 hover:bg-red-50" onClick={() => toast.error("Delete document?")} title="Delete"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // ─── Tab: Audit ────────────────────────────────────────────────────────────
  function TabAudit() {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">Audit Trail</h3>
          <button className="btn-secondary flex items-center gap-2 text-sm" onClick={() => toast.success("Audit trail exported")}>
            <Download size={14} /> Export Audit Trail
          </button>
        </div>
        <div className="space-y-0">
          {SEED_AUDIT.map((entry, i) => (
            <div key={entry.id} className="flex gap-4 relative">
              {i < SEED_AUDIT.length - 1 && (
                <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-gray-100" />
              )}
              <div className="shrink-0 w-10 h-10 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-xs font-bold z-10">
                {getInitials(entry.user_name)}
              </div>
              <div className="pb-6 flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">{entry.user_name}</p>
                  <span className="text-xs text-gray-400">{formatDateTime(entry.timestamp)}</span>
                </div>
                <p className="text-sm text-gray-600 mt-0.5">{entry.action}</p>
                {entry.field_changed && entry.old_value !== undefined && (
                  <div className="mt-1 flex items-center gap-2 text-xs">
                    <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded font-mono">{entry.old_value || "(empty)"}</span>
                    <ChevronRight size={12} className="text-gray-400" />
                    <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded font-mono">{entry.new_value || "(empty)"}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-7xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const tabContent: Record<TabId, React.ReactNode> = {
    "Summary": <TabSummary />,
    "Contract Sum Analysis": <TabContractSumAnalysis />,
    "Compensation Events": <TabCEs />,
    "Provisional Sums": <TabPS />,
    "Dayworks": <TabDayworks />,
    "Loss & Expense": <TabLE />,
    "Fluctuations": <TabFluctuations />,
    "Contra Charges": <TabContra />,
    "Retention": <TabRetention />,
    "Subcontract FAs": <TabSubFAs />,
    "Correspondence": <TabCorrespondence />,
    "Settlement": <TabSettlement />,
    "Documents": <TabDocuments />,
    "Audit": <TabAudit />,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => router.back()} className="btn-ghost p-2 mt-0.5 shrink-0">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-sm font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{data.ref}</span>
              <h1 className="text-xl font-bold text-gray-900">{data.project_name}</h1>
              <span className={STATUS_META[data.status].chip}>{STATUS_META[data.status].label}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Final Account · Created {formatDate(data.created_at)} · Last updated {formatRelative(data.updated_at)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="btn-secondary flex items-center gap-2 text-sm" onClick={() => toast.info("Edit FA")}>
            <Pencil size={14} /> Edit
          </button>
          <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => toast.success("Submitted for agreement")}>
            <Send size={14} /> Submit for Agreement
          </button>
          <button className="btn-secondary flex items-center gap-2 text-sm" onClick={() => toast.success("Exporting PDF...")}>
            <Download size={14} /> Export PDF
          </button>
          <div className="relative">
            <button className="btn-ghost p-2" onClick={() => setShowMoreMenu(!showMoreMenu)}>
              <MoreHorizontal size={18} />
            </button>
            {showMoreMenu && (
              <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-lg w-44 z-10">
                {["Duplicate FA", "Archive FA", "Delete FA"].map(action => (
                  <button key={action} className={cn(
                    "w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition",
                    action === "Delete FA" && "text-red-600"
                  )} onClick={() => { toast.info(action); setShowMoreMenu(false); }}>
                    {action}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <KpiStrip />

      {/* Tabs */}
      <div>
        <div className="border-b border-gray-200 overflow-x-auto">
          <div className="flex gap-0 min-w-max">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-3 text-sm font-medium whitespace-nowrap transition border-b-2 -mb-px",
                  activeTab === tab
                    ? "border-b-2 border-[var(--primary)] text-[var(--primary)]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6">{tabContent[activeTab]}</div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Edit2, Send, CheckCircle2, XCircle, Upload, Link2,
  Plus, Sparkles, Download, Archive, MoreHorizontal, ExternalLink,
  FileText, Image, AlertCircle, Clock, CheckSquare, MessageSquare,
  Activity, ShieldCheck, ChevronRight, Paperclip, Trash2,
  Calendar, Building2, Tag, DollarSign, Zap, RefreshCw,
  Mail, Phone, AlertTriangle, Info, Flag, Copy, Eye, Filter,
  TrendingUp, BarChart2, User, Users, ArrowRight, Circle,
  Lock, Unlock, ChevronDown, ChevronUp, Star, Hash,
} from "lucide-react";
import { cn, formatCurrency, formatCurrencyFull, formatDate, formatDateTime, getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

// ─── Types ────────────────────────────────────────────────────────────────────

type CEStatus = "draft" | "notified" | "quoted" | "submitted" | "negotiating" | "agreed" | "rejected";
type CEType   = "compensation_event" | "variation" | "VO" | "RFI" | "instruction" | "claim";
type DelayType = "excusable" | "compensable" | "concurrent" | "none";

interface ChangeEvent {
  id: string;
  ref: string;
  title: string;
  description: string;
  cause: string;
  effect: string;
  project: string;
  project_id: string;
  type: CEType;
  status: CEStatus;
  notified_date: string | null;
  submitted_date: string | null;
  agreed_date: string | null;
  contractor_submission: number;
  engineer_assessment: number | null;
  agreed_amount: number | null;
  overhead_pct: number;
  profit_pct: number;
  delay_days_claimed: number;
  delay_days_assessed: number | null;
  contract_clause: string;
  notice_ref: string | null;
  project_manager: string;
  created_at: string;
  created_by: string;
}

interface PricingLine {
  id: string;
  section: "Labour" | "Plant" | "Materials" | "Subcontract" | "Prelims" | "OH&P";
  description: string;
  qty: number;
  unit: string;
  rate: number;
  total: number;
  engineer_rate?: number;
  engineer_total?: number;
}

interface EvidenceFile {
  id: string;
  name: string;
  type: "photo" | "notice" | "programme" | "correspondence" | "drawing" | "daywork" | "other";
  size: string;
  uploaded_at: string;
  uploaded_by: string;
  ai_classification?: string;
  score_contribution: number;
}

interface ScheduleActivity {
  id: string;
  activity_ref: string;
  name: string;
  planned_start: string;
  planned_finish: string;
  actual_start: string | null;
  actual_finish: string | null;
  float_days: number;
  on_critical_path: boolean;
}

interface AppLink {
  id: string;
  app_number: number;
  period: string;
  included_amount: number;
  certified_amount: number;
  status: string;
}

interface Correspondence {
  id: string;
  type: "early_warning" | "ce_instruction" | "quotation" | "assessment" | "agreement" | "response" | "letter";
  ref: string;
  subject: string;
  from_party: string;
  to_party: string;
  date: string;
  summary: string;
  has_attachment: boolean;
}

interface LinkedTask {
  id: string;
  title: string;
  assignee: string;
  priority: "low" | "medium" | "high" | "critical";
  due_date: string;
  status: "todo" | "in_progress" | "review" | "done";
  description?: string;
}

interface AuditEntry {
  id: string;
  field: string;
  old_value: string;
  new_value: string;
  action: string;
  user: string;
  timestamp: string;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_CE: ChangeEvent = {
  id: "ce-001",
  ref: "CE-025",
  title: "Additional groundworks – unforeseen igneous rock",
  description: "During excavation for the basement raft slab, unforeseen igneous rock strata were encountered at 1.8m BGL. The ground investigation report did not anticipate these conditions at this location. Specialist breaking and removal was required beyond the contract scope.",
  cause: "Unforeseen physical conditions – igneous rock strata encountered at 1.8m BGL during basement excavation. Pre-contract ground investigation report (GIR/2024/047) did not identify rock at this horizon.",
  effect: "6-day delay to basement raft slab construction on the critical path. Additional cost for specialist plant, labour, rock disposal and revised earthwork support. Required re-sequencing of structural frame follow-on works.",
  project: "The Arc Tower, Birmingham",
  project_id: "proj-001",
  type: "compensation_event",
  status: "submitted",
  notified_date: "2025-10-15",
  submitted_date: "2025-11-14",
  agreed_date: null,
  contractor_submission: 48500,
  engineer_assessment: null,
  agreed_amount: null,
  overhead_pct: 12.5,
  profit_pct: 5.0,
  delay_days_claimed: 6,
  delay_days_assessed: null,
  contract_clause: "NEC4 Clause 60.1(12) – Physical conditions",
  notice_ref: "EWN-014",
  project_manager: "Rachel Okafor",
  created_at: "2025-11-01T08:00:00Z",
  created_by: "James Keane",
};

const SEED_PRICING: PricingLine[] = [
  { id: "p1",  section: "Labour",      description: "Rock breaking – additional operatives (2 no.)",  qty: 80,  unit: "hrs",    rate: 45,   total: 3600,  engineer_rate: 45,  engineer_total: 3600 },
  { id: "p2",  section: "Labour",      description: "Site engineer supervision – additional hours",    qty: 16,  unit: "hrs",    rate: 65,   total: 1040,  engineer_rate: 55,  engineer_total: 880  },
  { id: "p3",  section: "Plant",       description: "Hydraulic breaker 25T – operator included",      qty: 40,  unit: "hrs",    rate: 185,  total: 7400,  engineer_rate: 175, engineer_total: 7000 },
  { id: "p4",  section: "Plant",       description: "Rock removal – 20T grab lorry and driver",       qty: 125, unit: "tonnes", rate: 62,   total: 7750,  engineer_rate: 58,  engineer_total: 7250 },
  { id: "p5",  section: "Materials",   description: "Revised earthwork support – sheet piling",       qty: 18,  unit: "m²",    rate: 145,  total: 2610,  engineer_rate: 145, engineer_total: 2610 },
  { id: "p6",  section: "Materials",   description: "Concrete blinding replacement – RC30",           qty: 42,  unit: "m²",    rate: 28,   total: 1176,  engineer_rate: 28,  engineer_total: 1176 },
  { id: "p7",  section: "Subcontract", description: "Structural geotechnical survey – amended",       qty: 1,   unit: "item",  rate: 3200, total: 3200,  engineer_rate: 2800, engineer_total: 2800 },
  { id: "p8",  section: "Prelims",     description: "Site prelims uplift – supervision & welfare",    qty: 8,   unit: "days",  rate: 380,  total: 3040,  engineer_rate: 320,  engineer_total: 2560 },
  { id: "p9",  section: "OH&P",        description: "Overhead & profit @ 12.5% / 5%",                qty: 1,   unit: "item",  rate: 4428, total: 4428,  engineer_rate: 3978, engineer_total: 3978 },
];

const SEED_EVIDENCE: EvidenceFile[] = [
  { id: "ev1", name: "Rock_strata_photos_Oct14-22.zip", type: "photo", size: "18.4 MB", uploaded_at: "2025-10-15", uploaded_by: "James Keane", ai_classification: "Site photography – excavation conditions", score_contribution: 20 },
  { id: "ev2", name: "EWN-014_Early_Warning_Notice.pdf", type: "notice", size: "124 KB", uploaded_at: "2025-10-15", uploaded_by: "James Keane", ai_classification: "Contractual notice – NEC Early Warning", score_contribution: 20 },
  { id: "ev3", name: "GIR_2024_047_Amendment_Note.pdf", type: "other", size: "3.2 MB", uploaded_at: "2025-10-18", uploaded_by: "Sarah Collins", ai_classification: "Ground investigation report – amended", score_contribution: 15 },
  { id: "ev4", name: "Programme_Impact_Assessment_CE025.pdf", type: "programme", size: "560 KB", uploaded_at: "2025-11-02", uploaded_by: "James Keane", ai_classification: "Programme delay analysis – critical path", score_contribution: 15 },
  { id: "ev5", name: "Daywork_Sheets_Oct14-22_signed.pdf", type: "daywork", size: "780 KB", uploaded_at: "2025-11-10", uploaded_by: "James Keane", ai_classification: "Signed daywork records – contemporaneous", score_contribution: 12 },
];

const SEED_ACTIVITIES: ScheduleActivity[] = [
  { id: "sa1", activity_ref: "B.2.1", name: "Basement excavation – raft slab formation", planned_start: "2025-10-08", planned_finish: "2025-10-22", actual_start: "2025-10-08", actual_finish: "2025-10-29", float_days: 0, on_critical_path: true },
  { id: "sa2", activity_ref: "B.2.2", name: "Raft slab blinding and formwork", planned_start: "2025-10-23", planned_finish: "2025-10-30", actual_start: "2025-10-30", actual_finish: null, float_days: 0, on_critical_path: true },
  { id: "sa3", activity_ref: "B.2.3", name: "Ground floor structural frame – lower columns", planned_start: "2025-11-06", planned_finish: "2025-11-27", actual_start: null, actual_finish: null, float_days: 0, on_critical_path: true },
];

const SEED_APP_LINKS: AppLink[] = [
  { id: "al1", app_number: 4, period: "October 2025", included_amount: 48500, certified_amount: 0,     status: "Submitted" },
  { id: "al2", app_number: 5, period: "November 2025", included_amount: 48500, certified_amount: 38500, status: "Certified" },
];

const SEED_CORRESPONDENCE: Correspondence[] = [
  { id: "co1", type: "early_warning", ref: "EWN-014",    subject: "Early Warning – unforeseen ground conditions", from_party: "Contractor", to_party: "Project Manager", date: "2025-10-15", summary: "Notification of unforeseen igneous rock strata encountered at 1.8m BGL during basement excavation. Anticipated cost and programme impact flagged.", has_attachment: true },
  { id: "co2", type: "ce_instruction", ref: "CEI-025",    subject: "Compensation Event Instruction CE-025",        from_party: "Project Manager", to_party: "Contractor", date: "2025-10-20", summary: "PM instructs CE-025 under NEC4 Clause 60.1(12). Contractor to submit quotation within 21 days per Clause 62.", has_attachment: true },
  { id: "co3", type: "quotation",      ref: "CEQ-025",    subject: "CE-025 Quotation – Rock Breaking & Removal",   from_party: "Contractor", to_party: "Project Manager", date: "2025-11-10", summary: "Formal quotation submitted: £48,500 net + VAT. Full pricing breakdown and programme impact analysis attached.", has_attachment: true },
  { id: "co4", type: "response",       ref: "LTR-2025-089", subject: "Request for Additional Information – CE-025", from_party: "Project Manager", to_party: "Contractor", date: "2025-11-25", summary: "PM requests disposal certificates and third-party verification of rock classification before assessment.", has_attachment: false },
];

const SEED_TASKS: LinkedTask[] = [
  { id: "t1", title: "Obtain specialist geotechnical survey sign-off", assignee: "James Keane", priority: "high", due_date: "2025-11-30", status: "in_progress", description: "Chase BSP Consulting for final signed survey report confirming rock classification and bearing capacity." },
  { id: "t2", title: "Confirm disposal certificates received from haulier", assignee: "Sarah Collins", priority: "high", due_date: "2025-11-25", status: "todo", description: "Collect and file waste transfer notes for all 125 tonnes of rock removed from site." },
  { id: "t3", title: "Prepare response to PM information request", assignee: "James Keane", priority: "critical", due_date: "2025-12-02", status: "todo", description: "Draft formal response to LTR-2025-089 addressing disposal certs and rock classification queries." },
  { id: "t4", title: "Chase PM for interim assessment response", assignee: "James Keane", priority: "medium", due_date: "2025-11-22", status: "done", description: "Follow up outstanding acknowledgement of CE-025 quotation." },
  { id: "t5", title: "Update programme delay narrative", assignee: "Sarah Collins", priority: "medium", due_date: "2025-11-20", status: "done", description: "Ensure programme impact assessment reflects revised Clause 32 programme." },
];

const SEED_AUDIT: AuditEntry[] = [
  { id: "au1", field: "status",               old_value: "draft",         new_value: "submitted",      action: "Status changed",     user: "James Keane",  timestamp: "2025-11-14T09:32:00Z" },
  { id: "au2", field: "contractor_submission", old_value: "£42,000",       new_value: "£48,500",        action: "Value updated",      user: "James Keane",  timestamp: "2025-11-12T16:30:00Z" },
  { id: "au3", field: "delay_days_claimed",    old_value: "8",             new_value: "6",              action: "Delay revised",      user: "James Keane",  timestamp: "2025-11-10T10:00:00Z" },
  { id: "au4", field: "title",                 old_value: "Additional groundworks", new_value: "Additional groundworks – unforeseen igneous rock", action: "Title updated", user: "James Keane", timestamp: "2025-11-05T14:00:00Z" },
  { id: "au5", field: "notice_ref",            old_value: "",              new_value: "EWN-014",        action: "Notice linked",      user: "Sarah Collins", timestamp: "2025-10-15T12:00:00Z" },
  { id: "au6", field: "created",               old_value: "",              new_value: "CE-025",         action: "Record created",     user: "James Keane",  timestamp: "2025-11-01T08:00:00Z" },
];

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_META: Record<CEStatus, { chip: string; label: string }> = {
  draft:        { chip: "chip-muted",    label: "Draft" },
  notified:     { chip: "chip-info",     label: "Notified" },
  quoted:       { chip: "chip-cyan",     label: "Quoted" },
  submitted:    { chip: "chip-warning",  label: "Submitted" },
  negotiating:  { chip: "chip-violet",   label: "Negotiating" },
  agreed:       { chip: "chip-success",  label: "Agreed" },
  rejected:     { chip: "chip-danger",   label: "Rejected" },
};

const TYPE_META: Record<CEType, { chip: string; label: string }> = {
  compensation_event: { chip: "chip-primary", label: "Compensation Event" },
  variation:          { chip: "chip-cyan",    label: "Variation" },
  VO:                 { chip: "chip-info",    label: "VO" },
  RFI:                { chip: "chip-muted",   label: "RFI" },
  instruction:        { chip: "chip-violet",  label: "Instruction" },
  claim:              { chip: "chip-danger",  label: "Claim" },
};

const CORR_META: Record<Correspondence["type"], { chip: string; label: string }> = {
  early_warning:  { chip: "chip-warning", label: "Early Warning" },
  ce_instruction: { chip: "chip-primary", label: "CE Instruction" },
  quotation:      { chip: "chip-cyan",    label: "Quotation" },
  assessment:     { chip: "chip-violet",  label: "Assessment" },
  agreement:      { chip: "chip-success", label: "Agreement" },
  response:       { chip: "chip-info",    label: "Response" },
  letter:         { chip: "chip-muted",   label: "Letter" },
};

const TASK_PRIORITY_META: Record<LinkedTask["priority"], { chip: string; label: string }> = {
  low:      { chip: "chip-muted",    label: "Low" },
  medium:   { chip: "chip-info",     label: "Medium" },
  high:     { chip: "chip-warning",  label: "High" },
  critical: { chip: "chip-danger",   label: "Critical" },
};

type Tab = "overview" | "pricing" | "programme" | "evidence" | "applications" | "correspondence" | "tasks" | "ai" | "audit";

const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: "overview",       label: "Overview",           Icon: FileText      },
  { id: "pricing",        label: "Pricing Detail",     Icon: DollarSign    },
  { id: "programme",      label: "Programme / Delay",  Icon: Calendar      },
  { id: "evidence",       label: "Evidence",           Icon: Paperclip     },
  { id: "applications",   label: "Application Links",  Icon: Link2         },
  { id: "correspondence", label: "Correspondence",     Icon: MessageSquare },
  { id: "tasks",          label: "Tasks",              Icon: CheckSquare   },
  { id: "ai",             label: "AI Narrative",       Icon: Sparkles      },
  { id: "audit",          label: "Audit",              Icon: ShieldCheck   },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ChangeDetailPage() {
  const params  = useParams();
  const router  = useRouter();
  const changeId = params.changeId as string;

  const [ce, setCe]           = useState<ChangeEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<Tab>("overview");

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("change_events")
          .select("*")
          .eq("id", changeId)
          .single();
        setCe(data ?? SEED_CE);
      } catch {
        setCe(SEED_CE);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [changeId]);

  if (loading) return <DetailSkeleton />;
  if (!ce) return null;

  const sm = STATUS_META[ce.status];
  const tm = TYPE_META[ce.type];

  return (
    <div className="flex flex-col min-h-full">
      {/* Back nav */}
      <div className="px-6 pt-4">
        <button
          onClick={() => router.push("/changes")}
          className="btn btn-ghost btn-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <ArrowLeft size={14} /> Back to Changes
        </button>
      </div>

      {/* Hero */}
      <div className="px-6 pt-3 pb-0">
        <div className="flex items-start justify-between gap-4 flex-wrap pb-4 border-b border-[var(--border)]">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-sm font-bold text-[var(--primary)]">{ce.ref}</span>
              <span className={cn("badge", tm.chip)}>{tm.label}</span>
              <span className={cn("badge", sm.chip)}>{sm.label}</span>
            </div>
            <h1 className="text-xl font-bold text-[var(--text-primary)] leading-tight">{ce.title}</h1>
            <div className="flex items-center gap-5 text-xs text-[var(--text-muted)] flex-wrap">
              <button
                onClick={() => router.push(`/projects/${ce.project_id}`)}
                className="flex items-center gap-1 hover:text-[var(--primary)] transition-colors"
              >
                <Building2 size={12} /> {ce.project}
              </button>
              <span className="flex items-center gap-1">
                <User size={12} /> PM: {ce.project_manager}
              </span>
              {ce.notified_date && (
                <span className="flex items-center gap-1">
                  <Calendar size={12} /> Notified {formatDate(ce.notified_date)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Tag size={12} /> {ce.contract_clause}
              </span>
            </div>
          </div>

          {/* Value + actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-right">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] mb-0.5">
                Contractor Submission
              </div>
              <div className="text-2xl font-bold tabular-nums text-[var(--text-primary)]">
                {formatCurrency(ce.contractor_submission)}
              </div>
              {ce.agreed_amount !== null && (
                <div className="text-xs text-[var(--success)] font-semibold mt-0.5">
                  Agreed: {formatCurrency(ce.agreed_amount)}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button className="btn btn-secondary btn-sm">
                <Download size={13} /> Export Pack
              </button>
              <button className="btn btn-secondary btn-sm">
                <Edit2 size={13} /> Edit
              </button>
              {(ce.status === "submitted" || ce.status === "negotiating") && (
                <>
                  <button className="btn btn-sm" style={{ background: "var(--success)", color: "#fff" }}>
                    <CheckCircle2 size={13} /> Agree
                  </button>
                  <button className="btn btn-danger btn-sm">
                    <XCircle size={13} /> Reject
                  </button>
                </>
              )}
              {ce.status === "draft" && (
                <button className="btn btn-primary btn-sm">
                  <Send size={13} /> Submit
                </button>
              )}
              <button className="btn btn-sm" style={{ background: "var(--violet)", color: "#fff" }}>
                <Sparkles size={13} /> Copilot
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar px-6">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn("tab-item flex items-center gap-1.5", tab === id && "active")}
          >
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="page-content flex-1">
        {tab === "overview"       && <OverviewTab       ce={ce} />}
        {tab === "pricing"        && <PricingTab        ce={ce} lines={SEED_PRICING} />}
        {tab === "programme"      && <ProgrammeTab      ce={ce} activities={SEED_ACTIVITIES} />}
        {tab === "evidence"       && <EvidenceTab       files={SEED_EVIDENCE} />}
        {tab === "applications"   && <ApplicationLinksTab appLinks={SEED_APP_LINKS} />}
        {tab === "correspondence" && <CorrespondenceTab letters={SEED_CORRESPONDENCE} />}
        {tab === "tasks"          && <TasksTab          tasks={SEED_TASKS} />}
        {tab === "ai"             && <AINarrativeTab    ce={ce} />}
        {tab === "audit"          && <AuditTab          entries={SEED_AUDIT} />}
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

const STATUS_STEPS: { key: CEStatus; label: string }[] = [
  { key: "notified",    label: "Notified" },
  { key: "quoted",      label: "Quoted" },
  { key: "submitted",   label: "Submitted" },
  { key: "negotiating", label: "Negotiating" },
  { key: "agreed",      label: "Agreed" },
];
const STATUS_ORDER: CEStatus[] = ["draft","notified","quoted","submitted","negotiating","agreed","rejected"];

function OverviewTab({ ce }: { ce: ChangeEvent }) {
  const currentIdx = STATUS_ORDER.indexOf(ce.status);

  return (
    <div className="flex flex-col gap-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="kpi-card">
          <div className="kpi-label">Submitted Value</div>
          <div className="kpi-value text-xl">{formatCurrency(ce.contractor_submission)}</div>
          <div className="text-xs text-[var(--text-muted)]">Contractor claim</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Engineer Assessment</div>
          <div className={cn("kpi-value text-xl", ce.engineer_assessment === null && "text-[var(--text-muted)]")}>
            {ce.engineer_assessment !== null ? formatCurrency(ce.engineer_assessment) : "Pending"}
          </div>
          <div className="text-xs text-[var(--text-muted)]">PM / Engineer view</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Agreed Amount</div>
          <div className={cn("kpi-value text-xl", ce.agreed_amount !== null ? "text-[var(--success)]" : "text-[var(--text-muted)]")}>
            {ce.agreed_amount !== null ? formatCurrency(ce.agreed_amount) : "Not agreed"}
          </div>
          <div className="text-xs text-[var(--text-muted)]">Final agreed sum</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Delay Days Claimed</div>
          <div className="kpi-value text-xl text-[var(--warning)]">{ce.delay_days_claimed}d</div>
          <div className="text-xs text-[var(--text-muted)]">
            Assessed: {ce.delay_days_assessed !== null ? `${ce.delay_days_assessed}d` : "Pending"}
          </div>
        </div>
      </div>

      {/* Status stepper */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-5">CE Progress Timeline</h3>
        <div className="flex items-center gap-0 overflow-x-auto pb-1">
          {STATUS_STEPS.map((step, i) => {
            const stepIdx = STATUS_ORDER.indexOf(step.key);
            const isDone    = currentIdx > stepIdx || (ce.status === "agreed" && step.key === "agreed");
            const isActive  = STATUS_ORDER[currentIdx] === step.key;
            const isRejected = ce.status === "rejected";
            return (
              <div key={step.key} className="flex items-center gap-0 flex-1 min-w-[80px]">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                      isDone && !isRejected
                        ? "bg-[var(--success)] text-white"
                        : isActive && !isRejected
                        ? "bg-[var(--primary)] text-white shadow-[0_0_0_4px_rgba(59,94,232,0.15)]"
                        : isActive && isRejected
                        ? "bg-[var(--danger)] text-white"
                        : "bg-[var(--bg-muted)] text-[var(--text-muted)] border border-[var(--border)]"
                    )}
                  >
                    {isDone && !isRejected ? (
                      <CheckCircle2 size={14} />
                    ) : isActive && isRejected ? (
                      <XCircle size={14} />
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] font-semibold uppercase tracking-wider text-center whitespace-nowrap",
                    isActive ? "text-[var(--primary)]" : isDone ? "text-[var(--success)]" : "text-[var(--text-muted)]"
                  )}>
                    {step.label}
                  </span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div
                    className="flex-1 h-px mx-2 mt-[-16px]"
                    style={{ background: isDone ? "var(--success)" : "var(--border)" }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: details */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* CE details */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-4">Change Event Details</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 mb-4">
              {[
                { label: "CE Reference",   value: ce.ref },
                { label: "Type",           value: TYPE_META[ce.type].label },
                { label: "Contract Clause", value: ce.contract_clause },
                { label: "Notice Reference", value: ce.notice_ref ?? "—" },
                { label: "Notified Date",  value: formatDate(ce.notified_date) },
                { label: "Submitted Date", value: formatDate(ce.submitted_date) },
                { label: "Overhead %",     value: `${ce.overhead_pct}%` },
                { label: "Profit %",       value: `${ce.profit_pct}%` },
                { label: "Created By",     value: ce.created_by },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="kpi-label mb-0.5">{label}</div>
                  <div className="text-sm font-semibold text-[var(--text-primary)]">{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Cause */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-2">Cause</h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{ce.cause}</p>
          </div>

          {/* Effect */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-2">Effect</h3>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{ce.effect}</p>
          </div>
        </div>

        {/* Right: pricing summary */}
        <div className="flex flex-col gap-4">
          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-4">Pricing Summary</h3>
            <div className="flex flex-col gap-2">
              {[
                { label: "Contractor Submission", value: ce.contractor_submission, bold: false, color: "var(--text-primary)" },
                { label: "Engineer Assessment",   value: ce.engineer_assessment,   bold: false, color: "var(--warning)" },
                { label: "Agreed Amount",         value: ce.agreed_amount,         bold: true,  color: "var(--success)" },
              ].map(({ label, value, bold, color }) => (
                <div key={label} className={cn("flex justify-between items-center py-2", bold && "border-t border-[var(--border)] mt-1 pt-3")}>
                  <span className={cn("text-sm", bold ? "font-bold" : "text-[var(--text-muted)]")}>{label}</span>
                  <span className={cn("text-sm tabular-nums", bold ? "font-bold" : "font-semibold")} style={{ color: value === null ? "var(--text-muted)" : color }}>
                    {value !== null ? formatCurrency(value) : "—"}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-[var(--border)] mt-3 pt-3">
              <div className="flex justify-between text-xs text-[var(--text-muted)]">
                <span>Overhead %</span><span>{ce.overhead_pct}%</span>
              </div>
              <div className="flex justify-between text-xs text-[var(--text-muted)] mt-1">
                <span>Profit %</span><span>{ce.profit_pct}%</span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-3">Programme Impact</h3>
            <div className="flex flex-col gap-2">
              <div className="flex justify-between">
                <span className="text-xs text-[var(--text-muted)]">Days Claimed</span>
                <span className="text-sm font-bold text-[var(--warning)]">{ce.delay_days_claimed} days</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-[var(--text-muted)]">Days Assessed</span>
                <span className="text-sm font-semibold">{ce.delay_days_assessed !== null ? `${ce.delay_days_assessed} days` : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-[var(--text-muted)]">Critical Path</span>
                <span className="badge chip-danger text-[10px]">Yes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-[var(--text-muted)]">EoT Status</span>
                <span className="badge chip-warning text-[10px]">Pending</span>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <div className="kpi-label mb-1.5">Project</div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{ce.project}</span>
              <ExternalLink size={13} className="text-[var(--text-muted)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Pricing Tab ──────────────────────────────────────────────────────────────

function PricingTab({ ce, lines }: { ce: ChangeEvent; lines: PricingLine[] }) {
  const [editMode, setEditMode] = useState(false);
  const [showComparison, setShowComparison] = useState(true);

  const sections: PricingLine["section"][] = ["Labour", "Plant", "Materials", "Subcontract", "Prelims", "OH&P"];

  const sectionTotals = sections.reduce((acc, sec) => {
    const contractor = lines.filter(l => l.section === sec).reduce((s, l) => s + l.total, 0);
    const engineer   = lines.filter(l => l.section === sec).reduce((s, l) => s + (l.engineer_total ?? l.total), 0);
    acc[sec] = { contractor, engineer };
    return acc;
  }, {} as Record<string, { contractor: number; engineer: number }>);

  const grandContractor = lines.reduce((s, l) => s + l.total, 0);
  const grandEngineer   = lines.reduce((s, l) => s + (l.engineer_total ?? l.total), 0);
  const variance        = grandContractor - grandEngineer;

  return (
    <div className="flex flex-col gap-6">
      {/* Summary banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="kpi-card border-l-4 border-l-[var(--primary)]">
          <div className="kpi-label">Contractor Total</div>
          <div className="kpi-value text-xl">{formatCurrency(grandContractor)}</div>
        </div>
        <div className="kpi-card border-l-4 border-l-[var(--warning)]">
          <div className="kpi-label">Engineer Assessment</div>
          <div className="kpi-value text-xl text-[var(--warning)]">{formatCurrency(grandEngineer)}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Variance</div>
          <div className={cn("kpi-value text-xl", variance > 0 ? "text-[var(--danger)]" : "text-[var(--success)]")}>
            {variance > 0 ? `+${formatCurrency(variance)}` : formatCurrency(variance)}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">OH&P Rate</div>
          <div className="kpi-value text-xl">{ce.overhead_pct + ce.profit_pct}%</div>
          <div className="text-xs text-[var(--text-muted)]">{ce.overhead_pct}% OH + {ce.profit_pct}% P</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className={cn("btn btn-secondary btn-sm", showComparison && "bg-[var(--primary-light)] text-[var(--primary)] border-[var(--primary)]")}
          >
            <BarChart2 size={13} /> {showComparison ? "Hide" : "Show"} Comparison
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setEditMode(!editMode)}
            className={cn("btn btn-secondary btn-sm", editMode && "bg-[var(--primary-light)] text-[var(--primary)]")}
          >
            <Edit2 size={13} /> {editMode ? "Save Changes" : "Edit Mode"}
          </button>
          <button className="btn btn-secondary btn-sm"><Plus size={13} /> Add Line</button>
          <button className="btn btn-secondary btn-sm"><Upload size={13} /> Import</button>
          <button className="btn btn-secondary btn-sm"><Download size={13} /> Export</button>
        </div>
      </div>

      {/* Section tables */}
      {sections.map(sec => {
        const secLines = lines.filter(l => l.section === sec);
        if (!secLines.length) return null;
        const totals = sectionTotals[sec];
        return (
          <div key={sec} className="card overflow-hidden">
            <div className="px-4 py-2.5 bg-[var(--bg-subtle)] border-b border-[var(--border)] flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">{sec}</span>
              <div className="flex items-center gap-4">
                {showComparison && (
                  <span className="text-xs text-[var(--text-muted)]">
                    Engineer: <span className="font-semibold text-[var(--warning)]">{formatCurrency(totals.engineer)}</span>
                  </span>
                )}
                <span className="text-sm font-bold">{formatCurrency(totals.contractor)}</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th className="text-right w-16">Qty</th>
                    <th className="w-16">Unit</th>
                    <th className="text-right w-24">Rate</th>
                    <th className="text-right w-28">Total</th>
                    {showComparison && <th className="text-right w-28">Eng. Total</th>}
                    {showComparison && <th className="text-right w-24">Variance</th>}
                    {editMode && <th className="w-10"></th>}
                  </tr>
                </thead>
                <tbody>
                  {secLines.map(line => {
                    const engTotal = line.engineer_total ?? line.total;
                    const lineVar  = line.total - engTotal;
                    return (
                      <tr key={line.id}>
                        <td className="text-sm">{line.description}</td>
                        <td className="text-right tabular-nums text-sm">{line.qty}</td>
                        <td className="text-xs text-[var(--text-muted)]">{line.unit}</td>
                        <td className="text-right tabular-nums text-sm">{formatCurrency(line.rate)}</td>
                        <td className="text-right tabular-nums font-semibold">{formatCurrency(line.total)}</td>
                        {showComparison && (
                          <td className="text-right tabular-nums text-sm text-[var(--warning)]">
                            {formatCurrency(engTotal)}
                          </td>
                        )}
                        {showComparison && (
                          <td className={cn("text-right tabular-nums text-xs font-semibold", lineVar > 0 ? "text-[var(--danger)]" : lineVar < 0 ? "text-[var(--success)]" : "text-[var(--text-muted)]")}>
                            {lineVar === 0 ? "—" : (lineVar > 0 ? "+" : "") + formatCurrency(lineVar)}
                          </td>
                        )}
                        {editMode && (
                          <td>
                            <button className="btn btn-ghost btn-icon btn-sm">
                              <Trash2 size={12} />
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Grand total */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-4">Grand Total Summary</h3>
        <div className="flex flex-col gap-1.5 max-w-sm ml-auto">
          {sections.filter(sec => sectionTotals[sec]?.contractor > 0).map(sec => (
            <div key={sec} className="flex items-center justify-between text-sm">
              <span className="text-[var(--text-muted)]">{sec}</span>
              <span className="font-semibold tabular-nums">{formatCurrency(sectionTotals[sec].contractor)}</span>
            </div>
          ))}
          <div className="border-t border-[var(--border)] my-2" />
          <div className="flex items-center justify-between">
            <span className="font-bold">Contractor Total (excl. VAT)</span>
            <span className="text-lg font-bold tabular-nums text-[var(--primary)]">{formatCurrency(grandContractor)}</span>
          </div>
          {showComparison && (
            <>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-[var(--text-muted)]">Engineer Assessment</span>
                <span className="font-semibold tabular-nums text-[var(--warning)]">{formatCurrency(grandEngineer)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-muted)]">Variance</span>
                <span className={cn("font-bold tabular-nums", variance > 0 ? "text-[var(--danger)]" : "text-[var(--success)]")}>
                  {variance > 0 ? `+${formatCurrency(variance)}` : formatCurrency(variance)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Programme / Delay Tab ────────────────────────────────────────────────────

function ProgrammeTab({ ce, activities }: { ce: ChangeEvent; activities: ScheduleActivity[] }) {
  return (
    <div className="flex flex-col gap-6">
      {/* Delay summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="kpi-card border-l-4 border-l-[var(--warning)]">
          <div className="kpi-label">Days Claimed</div>
          <div className="kpi-value text-xl text-[var(--warning)]">{ce.delay_days_claimed}</div>
          <div className="text-xs text-[var(--text-muted)]">Working days</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Days Assessed</div>
          <div className="kpi-value text-xl text-[var(--text-muted)]">
            {ce.delay_days_assessed !== null ? ce.delay_days_assessed : "—"}
          </div>
        </div>
        <div className="kpi-card border-l-4 border-l-[var(--danger)]">
          <div className="kpi-label">Critical Path</div>
          <div className="kpi-value text-base text-[var(--danger)]">Yes</div>
          <div className="text-xs text-[var(--text-muted)]">On longest path</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">EoT Status</div>
          <div className="mt-1"><span className="badge chip-warning">Pending Assessment</span></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delay analysis */}
        <div className="flex flex-col gap-4">
          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-4">Delay Period</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Delay Start",    name: "delay_start",    type: "date",   value: "2025-10-14" },
                { label: "Delay End",      name: "delay_end",      type: "date",   value: "2025-10-22" },
                { label: "Calendar Days",  name: "calendar_days",  type: "number", value: "8" },
                { label: "Working Days",   name: "working_days",   type: "number", value: String(ce.delay_days_claimed) },
              ].map(f => (
                <div key={f.name}>
                  <label className="form-label">{f.label}</label>
                  <input className="form-input" type={f.type} defaultValue={f.value} readOnly={f.name === "calendar_days"} />
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-4">Delay Classification</h3>
            <div className="flex flex-col gap-3">
              {(["excusable", "compensable", "concurrent"] as DelayType[]).map(dt => (
                <label key={dt} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="delay_type"
                    defaultChecked={dt === "compensable"}
                    className="w-4 h-4 accent-[var(--primary)]"
                  />
                  <div>
                    <div className="text-sm font-medium capitalize">{dt}</div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {dt === "excusable" && "Time relief only – no money"}
                      {dt === "compensable" && "Time and money recoverable"}
                      {dt === "concurrent" && "Both parties caused delay – complex position"}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-3">Extension of Time</h3>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <div className="kpi-label mb-1">EoT Status</div>
                <span className="badge chip-warning">Pending Assessment</span>
              </div>
              <div>
                <div className="kpi-label mb-1">Days Claimed</div>
                <div className="text-sm font-bold">{ce.delay_days_claimed} days</div>
              </div>
              <div>
                <div className="kpi-label mb-1">Contractor Completion</div>
                <div className="text-sm font-semibold">14 Feb 2026</div>
              </div>
              <div>
                <div className="kpi-label mb-1">Revised Completion</div>
                <div className="text-sm font-semibold text-[var(--warning)]">22 Feb 2026</div>
              </div>
            </div>
            <div>
              <label className="form-label">Delay Narrative</label>
              <textarea
                className="form-input text-sm resize-none"
                rows={4}
                defaultValue="The unforeseen rock strata encountered at 1.8m BGL directly prevented excavation for the basement raft slab. The critical path activity B.2.1 was extended by 8 calendar days (6 working days). No concurrent contractor-caused delays were identified during this period."
              />
            </div>
          </div>
        </div>

        {/* Schedule activities + programme docs */}
        <div className="flex flex-col gap-4">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Linked Schedule Activities</h3>
              <button className="btn btn-secondary btn-sm"><Link2 size={13} /> Link Activity</button>
            </div>
            <div className="flex flex-col gap-2">
              {activities.map(act => (
                <div
                  key={act.id}
                  className={cn(
                    "p-3 rounded-[var(--radius)] border",
                    act.on_critical_path
                      ? "border-[var(--danger)] bg-[var(--danger-bg)]"
                      : "border-[var(--border)] bg-[var(--bg-subtle)]"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[var(--primary)]">{act.activity_ref}</span>
                      {act.on_critical_path && (
                        <span className="badge chip-danger text-[10px]">Critical</span>
                      )}
                      {act.float_days === 0 && !act.on_critical_path && (
                        <span className="badge chip-warning text-[10px]">Zero Float</span>
                      )}
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">Float: {act.float_days}d</span>
                  </div>
                  <div className="text-sm font-medium">{act.name}</div>
                  <div className="flex gap-4 mt-1.5 text-xs text-[var(--text-muted)]">
                    <span>Planned: {formatDate(act.planned_start)} – {formatDate(act.planned_finish)}</span>
                  </div>
                  {act.actual_start && (
                    <div className="text-xs text-[var(--warning)] mt-0.5">
                      Actual: {formatDate(act.actual_start)} – {act.actual_finish ? formatDate(act.actual_finish) : "In progress"}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-sm font-semibold mb-3">Time Risk Allowance</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="kpi-label mb-1">TRA Days</div>
                <div className="text-sm font-bold">2 days</div>
              </div>
              <div>
                <div className="kpi-label mb-1">Risk Owner</div>
                <div className="text-sm font-semibold">Employer</div>
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)]">Time risk allowance held by Employer per Accepted Programme.</p>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">Programme Documents</h3>
              <button className="btn btn-secondary btn-sm"><Upload size={13} /> Upload</button>
            </div>
            <div className="flex flex-col gap-2">
              {[
                "Baseline_Programme_P6_v3.pdf",
                "Revised_Programme_Oct2025_P6_v4.pdf",
                "CE025_Programme_Impact_Analysis.pdf",
              ].map(name => (
                <div key={name} className="flex items-center gap-2 p-2.5 rounded-[var(--radius)] bg-[var(--bg-subtle)] border border-[var(--border)]">
                  <FileText size={14} className="text-[var(--text-muted)] flex-shrink-0" />
                  <span className="text-sm flex-1 truncate">{name}</span>
                  <button className="btn btn-ghost btn-icon btn-sm"><Download size={12} /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Evidence Tab ─────────────────────────────────────────────────────────────

const FILE_TYPE_ICON: Record<EvidenceFile["type"], React.ElementType> = {
  photo:          Image,
  notice:         FileText,
  programme:      Calendar,
  correspondence: MessageSquare,
  drawing:        FileText,
  daywork:        Hash,
  other:          Paperclip,
};

const FILE_TYPE_COLOR: Record<EvidenceFile["type"], string> = {
  photo:          "var(--cyan)",
  notice:         "var(--primary)",
  programme:      "var(--warning)",
  correspondence: "var(--violet)",
  drawing:        "var(--info)",
  daywork:        "var(--success)",
  other:          "var(--text-muted)",
};

function EvidenceTab({ files }: { files: EvidenceFile[] }) {
  const totalScore = files.reduce((s, f) => s + f.score_contribution, 0);
  const coverageChecks = [
    { label: "Site photographs",       met: files.some(f => f.type === "photo") },
    { label: "Contractual notices",    met: files.some(f => f.type === "notice") },
    { label: "Programme documents",    met: files.some(f => f.type === "programme") },
    { label: "Correspondence chain",   met: files.some(f => f.type === "correspondence") },
    { label: "Daywork records",        met: files.some(f => f.type === "daywork") },
    { label: "Drawings / spec",        met: files.some(f => f.type === "drawing") },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Score + coverage */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 sm:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Evidence Strength Score</h3>
            <span className="text-xs text-[var(--text-muted)]">{files.length} files</span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-2.5 rounded-full bg-[var(--bg-muted)]">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(totalScore, 100)}%`,
                  background: totalScore >= 80 ? "var(--success)" : totalScore >= 50 ? "var(--warning)" : "var(--danger)",
                }}
              />
            </div>
            <span
              className="text-sm font-bold tabular-nums w-10"
              style={{ color: totalScore >= 80 ? "var(--success)" : totalScore >= 50 ? "var(--warning)" : "var(--danger)" }}
            >
              {totalScore}%
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2">
            {coverageChecks.map(({ label, met }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs">
                {met
                  ? <CheckCircle2 size={12} style={{ color: "var(--success)" }} className="flex-shrink-0" />
                  : <AlertCircle size={12} style={{ color: "var(--text-muted)" }} className="flex-shrink-0" />}
                <span style={{ color: met ? "var(--text-primary)" : "var(--text-muted)" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-4 flex flex-col gap-2">
          <button className="btn btn-primary btn-sm w-full justify-start"><Upload size={13} /> Upload Evidence</button>
          <button className="btn btn-secondary btn-sm w-full justify-start"><Link2 size={13} /> Link from Library</button>
          <button className="btn btn-secondary btn-sm w-full justify-start"><Download size={13} /> Evidence Pack PDF</button>
          <button className="btn btn-sm w-full justify-start" style={{ background: "var(--violet)", color: "#fff" }}>
            <Sparkles size={13} /> AI Gap Analysis
          </button>
        </div>
      </div>

      {/* File grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map(f => {
          const Icon = FILE_TYPE_ICON[f.type];
          const iconColor = FILE_TYPE_COLOR[f.type];
          return (
            <div key={f.id} className="card p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div
                  className="w-10 h-10 rounded-[var(--radius)] flex items-center justify-center flex-shrink-0"
                  style={{ background: `${iconColor}15` }}
                >
                  <Icon size={18} style={{ color: iconColor }} />
                </div>
                <button className="btn btn-ghost btn-icon btn-sm"><MoreHorizontal size={13} /></button>
              </div>
              <div>
                <div className="text-sm font-semibold truncate mb-0.5">{f.name}</div>
                <div className="text-xs text-[var(--text-muted)]">{f.size} · {formatDate(f.uploaded_at)}</div>
                <div className="text-xs text-[var(--text-muted)] mt-0.5">by {f.uploaded_by}</div>
              </div>
              {f.ai_classification && (
                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[10px] font-medium" style={{ background: "var(--violet-bg)", color: "var(--violet-text)" }}>
                  <Sparkles size={10} />
                  <span className="truncate">{f.ai_classification}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--success)] font-semibold">+{f.score_contribution} pts</span>
                <div className="flex gap-1">
                  <button className="btn btn-ghost btn-icon btn-sm"><Eye size={12} /></button>
                  <button className="btn btn-ghost btn-icon btn-sm"><Download size={12} /></button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Upload dropzone card */}
        <div className="card border-dashed border-2 p-4 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--primary-light)] transition-colors min-h-[160px]">
          <div className="w-10 h-10 rounded-[var(--radius)] bg-[var(--bg-muted)] flex items-center justify-center">
            <Upload size={18} className="text-[var(--text-muted)]" />
          </div>
          <div className="text-sm font-medium text-[var(--text-muted)]">Upload new file</div>
          <div className="text-xs text-[var(--text-muted)]">PDF, DOCX, ZIP, JPG up to 50MB</div>
        </div>
      </div>
    </div>
  );
}

// ─── Application Links Tab ────────────────────────────────────────────────────

function ApplicationLinksTab({ appLinks }: { appLinks: AppLink[] }) {
  const router = useRouter();
  const totalIncluded  = appLinks.reduce((s, a) => s + a.included_amount, 0);
  const totalCertified = appLinks.reduce((s, a) => s + a.certified_amount, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="kpi-card">
          <div className="kpi-label">Applications</div>
          <div className="kpi-value text-xl">{appLinks.length}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Total Included</div>
          <div className="kpi-value text-xl">{formatCurrency(totalIncluded)}</div>
        </div>
        <div className="kpi-card border-l-4 border-l-[var(--success)]">
          <div className="kpi-label">Total Certified</div>
          <div className="kpi-value text-xl text-[var(--success)]">{formatCurrency(totalCertified)}</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-secondary)]">Payment Applications</h3>
        <button className="btn btn-secondary btn-sm"><Link2 size={13} /> Link to Application</button>
      </div>

      {appLinks.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon"><Link2 size={20} /></div>
            <h3 className="text-base font-semibold">Not yet included</h3>
            <p className="text-sm text-[var(--text-muted)]">This CE has not been included in any payment application.</p>
            <button className="btn btn-primary btn-sm"><Link2 size={13} /> Link to Application</button>
          </div>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>App No.</th>
                <th>Period</th>
                <th className="text-right">Included Amount</th>
                <th className="text-right">Certified Amount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {appLinks.map(app => {
                const diff = app.certified_amount - app.included_amount;
                return (
                  <tr key={app.id} className="cursor-pointer" onClick={() => router.push(`/applications/${app.id}`)}>
                    <td className="font-mono text-xs font-bold text-[var(--primary)]">APP-{String(app.app_number).padStart(3, "0")}</td>
                    <td className="font-medium">{app.period}</td>
                    <td className="text-right tabular-nums">{formatCurrency(app.included_amount)}</td>
                    <td className="text-right tabular-nums font-semibold">
                      {app.certified_amount > 0 ? formatCurrency(app.certified_amount) : <span className="text-[var(--text-muted)]">—</span>}
                    </td>
                    <td>
                      <span className={cn("badge", app.status === "Certified" ? "chip-success" : app.status === "Submitted" ? "chip-warning" : "chip-muted")}>
                        {app.status}
                      </span>
                    </td>
                    <td>
                      {app.certified_amount > 0 && diff !== 0 && (
                        <span className={cn("text-xs font-semibold tabular-nums", diff < 0 ? "text-[var(--danger)]" : "text-[var(--success)]")}>
                          {diff > 0 ? "+" : ""}{formatCurrency(diff)}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background: "var(--bg-subtle)" }}>
                <td colSpan={2} className="font-bold text-sm px-4 py-3">Running Total</td>
                <td className="text-right tabular-nums font-bold px-4 py-3">{formatCurrency(totalIncluded)}</td>
                <td className="text-right tabular-nums font-bold px-4 py-3 text-[var(--success)]">{formatCurrency(totalCertified)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Correspondence Tab ───────────────────────────────────────────────────────

function CorrespondenceTab({ letters }: { letters: Correspondence[] }) {
  const [filter, setFilter] = useState<Correspondence["type"] | "all">("all");

  const filtered = filter === "all" ? letters : letters.filter(l => l.type === filter);

  return (
    <div className="flex flex-col gap-6">
      {/* Actions */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {(["all", "early_warning", "ce_instruction", "quotation", "assessment", "agreement", "response", "letter"] as const).map(t => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={cn(
                "btn btn-secondary btn-sm text-xs capitalize",
                filter === t && "bg-[var(--primary-light)] text-[var(--primary)] border-[var(--primary)]"
              )}
            >
              {t === "all" ? "All" : t.replace("_", " ")}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm"><Upload size={13} /> Upload Letter</button>
          <button className="btn btn-primary btn-sm"><Plus size={13} /> Create Notice</button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon"><MessageSquare size={20} /></div>
            <h3 className="text-base font-semibold">No correspondence</h3>
            <p className="text-sm text-[var(--text-muted)]">No letters or notices match this filter.</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-0">
          {filtered.map((letter, idx) => {
            const meta = CORR_META[letter.type];
            return (
              <div key={letter.id} className="relative flex gap-4 pb-6 last:pb-0">
                {idx < filtered.length - 1 && (
                  <div className="absolute left-5 top-10 bottom-0 w-px bg-[var(--border)]" />
                )}
                {/* Timeline dot */}
                <div className="w-10 h-10 rounded-full bg-[var(--bg-muted)] border-2 border-[var(--border)] flex items-center justify-center flex-shrink-0 z-10">
                  <MessageSquare size={14} className="text-[var(--text-muted)]" />
                </div>
                {/* Card */}
                <div className="card p-4 flex-1">
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn("badge", meta.chip)}>{meta.label}</span>
                      <span className="font-mono text-xs font-semibold text-[var(--primary)]">{letter.ref}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--text-muted)]">{formatDate(letter.date)}</span>
                      {letter.has_attachment && (
                        <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                          <Paperclip size={10} /> Attachment
                        </span>
                      )}
                    </div>
                  </div>
                  <h4 className="text-sm font-semibold mb-1">{letter.subject}</h4>
                  <div className="text-xs text-[var(--text-muted)] mb-2">
                    {letter.from_party} → {letter.to_party}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{letter.summary}</p>
                  <div className="flex gap-2 mt-3">
                    {letter.has_attachment && (
                      <button className="btn btn-ghost btn-sm text-xs"><Eye size={11} /> View</button>
                    )}
                    <button className="btn btn-ghost btn-sm text-xs"><Download size={11} /> Download</button>
                    <button className="btn btn-ghost btn-sm text-xs"><Copy size={11} /> Copy Ref</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Tasks Tab ────────────────────────────────────────────────────────────────

const TASK_COLUMNS: { id: LinkedTask["status"]; label: string }[] = [
  { id: "todo",        label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "review",      label: "Review" },
  { id: "done",        label: "Done" },
];

function TasksTab({ tasks }: { tasks: LinkedTask[] }) {
  const byStatus = TASK_COLUMNS.reduce((acc, col) => {
    acc[col.id] = tasks.filter(t => t.status === col.id);
    return acc;
  }, {} as Record<LinkedTask["status"], LinkedTask[]>);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--text-muted)]">{tasks.length} tasks linked to this CE</span>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm"><Link2 size={13} /> Link Existing Task</button>
          <button className="btn btn-primary btn-sm"><Plus size={13} /> Create Task</button>
        </div>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {TASK_COLUMNS.map(col => {
          const colTasks = byStatus[col.id];
          return (
            <div key={col.id} className="flex flex-col gap-2">
              {/* Column header */}
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                  {col.label}
                </span>
                <span className="w-5 h-5 rounded-full bg-[var(--bg-muted)] flex items-center justify-center text-[10px] font-bold text-[var(--text-muted)]">
                  {colTasks.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2 min-h-[80px]">
                {colTasks.map(task => {
                  const pm = TASK_PRIORITY_META[task.priority];
                  const isOverdue = new Date(task.due_date) < new Date() && task.status !== "done";
                  return (
                    <div key={task.id} className="card p-3 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className={cn("badge text-[10px]", pm.chip)}>{pm.label}</span>
                        <button className="btn btn-ghost btn-icon" style={{ padding: "2px" }}>
                          <MoreHorizontal size={12} />
                        </button>
                      </div>
                      <p className="text-xs font-semibold leading-snug mb-2">{task.title}</p>
                      {task.description && (
                        <p className="text-[11px] text-[var(--text-muted)] leading-snug mb-2 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-[var(--primary)] flex items-center justify-center text-white text-[9px] font-bold">
                            {getInitials(task.assignee)}
                          </div>
                          <span className="text-[10px] text-[var(--text-muted)] truncate max-w-[60px]">
                            {task.assignee.split(" ")[0]}
                          </span>
                        </div>
                        <span className={cn("text-[10px]", isOverdue ? "text-[var(--danger)] font-semibold" : "text-[var(--text-muted)]")}>
                          {formatDate(task.due_date)}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {colTasks.length === 0 && (
                  <div className="flex items-center justify-center h-20 rounded-[var(--radius)] border border-dashed border-[var(--border)]">
                    <span className="text-xs text-[var(--text-muted)]">Empty</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── AI Narrative Tab ─────────────────────────────────────────────────────────

const DEFAULT_NARRATIVE = `This compensation event arises from the encounter of unforeseen igneous rock strata during excavation of the basement raft slab on the Arc Tower, Birmingham project. The physical conditions encountered were materially different from those that could reasonably have been anticipated from the contract documents, site investigation reports (GIR/2024/047), and general background knowledge available at the time of tender.

The Contractor issued Early Warning Notice EWN-014 on 15 October 2025, within the contractually required period, notifying the Project Manager of the unforeseen conditions and the anticipated cost and programme impacts pursuant to NEC4 Clause 16.1. A Compensation Event was instructed by the Project Manager under CEI-025 on 20 October 2025.

Specialist rock-breaking plant was mobilised and the works were completed between 14 – 22 October 2025 (8 calendar days, 6 working days). All relevant daywork sheets, plant allocation records, disposal waste transfer notes and contemporaneous site photographs were maintained throughout. A specialist geotechnical survey confirmed the rock classification and bearing capacity adjustments required.

The Contractor's quotation, submitted on 14 November 2025, totals £48,500 (exclusive of VAT), representing direct additional costs for plant, labour, specialist disposal and a structural geotechnical survey, together with an uplift for site prelims and overhead and profit at the agreed contract rates of 12.5% and 5.0% respectively.

Entitlement is sought under NEC4 Clause 60.1(12) – Physical Conditions. The conditions encountered were materially different from those described in the Scope and were not reasonably foreseeable by an experienced contractor at the time of tender. A concurrent extension of time of 6 working days is also claimed under Clause 63.5, as this delay is on the accepted programme critical path.`;

function AINarrativeTab({ ce }: { ce: ChangeEvent }) {
  const [narrative, setNarrative] = useState(DEFAULT_NARRATIVE);
  const [generating, setGenerating] = useState(false);
  const [circumstances, setCircumstances] = useState("");
  const [entitlement, setEntitlement] = useState("");
  const [copied, setCopied]         = useState(false);

  const handleRegenerate = useCallback(() => {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); }, 1800);
  }, []);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(narrative);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [narrative]);

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div>
            <h3 className="text-sm font-semibold">AI-Generated CE Narrative</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">For inclusion in formal CE quotation submission</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={handleCopy} className="btn btn-secondary btn-sm">
              {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
              {copied ? "Copied!" : "Copy"}
            </button>
            <button className="btn btn-secondary btn-sm"><Download size={13} /> Export PDF</button>
            <button
              onClick={handleRegenerate}
              disabled={generating}
              className="btn btn-secondary btn-sm"
            >
              <RefreshCw size={13} className={generating ? "animate-spin" : ""} />
              {generating ? "Generating…" : "Regenerate"}
            </button>
            <button className="btn btn-sm" style={{ background: "var(--violet)", color: "#fff" }}>
              <Sparkles size={13} /> Ask Copilot
            </button>
          </div>
        </div>

        {generating ? (
          <div className="space-y-2">
            {[90, 80, 95, 70, 85].map((w, i) => (
              <div key={i} className={`skeleton h-4 rounded`} style={{ width: `${w}%` }} />
            ))}
          </div>
        ) : (
          <textarea
            className="form-input min-h-[360px] text-sm leading-relaxed resize-none"
            value={narrative}
            onChange={e => setNarrative(e.target.value)}
          />
        )}
      </div>

      {/* Sections breakdown */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-3">Narrative Sections</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Cause",                color: "var(--primary)",  filled: true  },
            { label: "Effect",               color: "var(--warning)",  filled: true  },
            { label: "Programme Impact",     color: "var(--danger)",   filled: true  },
            { label: "Valuation Commentary", color: "var(--success)",  filled: true  },
            { label: "Contractual Basis",    color: "var(--violet)",   filled: true  },
            { label: "Supporting Evidence",  color: "var(--cyan)",     filled: false },
          ].map(sec => (
            <div key={sec.label} className="flex items-center gap-2 text-xs">
              {sec.filled
                ? <CheckCircle2 size={13} style={{ color: sec.color }} className="flex-shrink-0" />
                : <AlertCircle  size={13} style={{ color: "var(--text-muted)" }} className="flex-shrink-0" />}
              <span style={{ color: sec.filled ? "var(--text-primary)" : "var(--text-muted)" }}>{sec.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Refinement */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-1">Refine with Additional Context</h3>
        <p className="text-xs text-[var(--text-muted)] mb-4">Provide context to improve narrative accuracy before regenerating.</p>
        <div className="flex flex-col gap-4">
          <div>
            <label className="form-label">Circumstances (optional)</label>
            <textarea
              className="form-input text-sm"
              rows={2}
              placeholder="Add specific site circumstances, project context or relevant background…"
              value={circumstances}
              onChange={e => setCircumstances(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Entitlement Basis (optional)</label>
            <textarea
              className="form-input text-sm"
              rows={2}
              placeholder="Specify the contractual clause, case precedent or entitlement argument…"
              value={entitlement}
              onChange={e => setEntitlement(e.target.value)}
            />
          </div>
          <button
            onClick={handleRegenerate}
            className="btn btn-primary btn-sm self-start"
          >
            <Sparkles size={13} /> Regenerate with Context
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Audit Tab ────────────────────────────────────────────────────────────────

function AuditTab({ entries }: { entries: AuditEntry[] }) {
  const [actionFilter, setActionFilter] = useState<string>("all");
  const actions = ["all", ...Array.from(new Set(entries.map(e => e.action)))];

  const filtered = actionFilter === "all" ? entries : entries.filter(e => e.action === actionFilter);

  return (
    <div className="flex flex-col gap-4 max-w-4xl">
      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={13} className="text-[var(--text-muted)]" />
        {actions.map(a => (
          <button
            key={a}
            onClick={() => setActionFilter(a)}
            className={cn(
              "btn btn-secondary btn-sm text-xs",
              actionFilter === a && "bg-[var(--primary-light)] text-[var(--primary)] border-[var(--primary)]"
            )}
          >
            {a === "all" ? "All actions" : a}
          </button>
        ))}
      </div>

      {/* Timeline */}
      <div className="flex flex-col gap-0">
        {filtered.map((entry, idx) => (
          <div key={entry.id} className="relative flex gap-4 pb-5 last:pb-0">
            {idx < filtered.length - 1 && (
              <div className="absolute left-3.5 top-8 bottom-0 w-px bg-[var(--border)]" />
            )}
            <div className="w-7 h-7 rounded-full bg-[var(--bg-muted)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 mt-0.5 z-10">
              <ShieldCheck size={12} className="text-[var(--text-muted)]" />
            </div>
            <div className="flex-1 card p-3">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div>
                  <span className="text-sm font-semibold">{entry.user}</span>
                  <span className="text-sm text-[var(--text-muted)] ml-1.5">{entry.action}</span>
                </div>
                <span className="text-xs text-[var(--text-muted)]">{formatDateTime(entry.timestamp)}</span>
              </div>
              {(entry.old_value || entry.new_value) && (
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <span className="font-mono text-[var(--text-muted)]">{entry.field}</span>
                  {entry.old_value && (
                    <>
                      <span className="px-2 py-0.5 rounded bg-[var(--danger-bg)] text-[var(--danger)] font-mono">
                        {entry.old_value}
                      </span>
                      <ArrowRight size={10} className="text-[var(--text-muted)]" />
                    </>
                  )}
                  {entry.new_value && (
                    <span className="px-2 py-0.5 rounded bg-[var(--success-bg)] text-[var(--success)] font-mono">
                      {entry.new_value}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon"><ShieldCheck size={20} /></div>
            <p className="text-sm text-[var(--text-muted)]">No audit entries match the selected filter.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="skeleton h-6 w-36 rounded" />
      <div className="skeleton h-24 w-full rounded-[var(--radius-lg)]" />
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
          <div key={i} className="skeleton h-8 w-24 rounded" />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <div key={i} className="skeleton h-28 rounded-[var(--radius-lg)]" />)}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <div key={i} className="skeleton h-48 rounded-[var(--radius-lg)]" />)}
      </div>
    </div>
  );
}

"use client";

import { AuditFeed } from "@/components/ui/audit-feed";
import { CountdownClock } from "@/components/ui/countdown-clock";
import { FeatureGate } from "@/components/ui/feature-gate";
import { NotesComposer } from "@/components/ui/notes-composer";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { Tabs } from "@/components/ui/tabs";
import { VerticalStepper } from "@/components/ui/vertical-stepper";
import { createAuditEvent } from "@/lib/audit";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/storage";
import { getWorkspaceId } from "@/lib/workspace";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  FileText,
  Loader2,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useParams } from "next/navigation";
import React from "react";
import { toast } from "sonner";

type AdjStatus =
  | "notice_issued"
  | "referral_pending"
  | "appointment_pending"
  | "response_pending"
  | "decision_pending"
  | "settled"
  | "won"
  | "lost"
  | "withdrawn";

interface AdjCase {
  id: string;
  workspace_id: string;
  case_number: string;
  project_id: string | null;
  dispute_type: string;
  dispute_description: string;
  amount_in_dispute: number;
  responding_party: string | null;
  notice_date: string | null;
  appointment_date: string | null;
  jurisdiction_notes: string | null;
  status: AdjStatus;
  decision_amount: number | null;
  settlement_amount: number | null;
  created_at: string;
  projects: { name: string } | null;
}

interface DisputeItem {
  id: string;
  description: string;
  amount: number;
}

interface CostItem {
  id: string;
  description: string;
  amount: number;
  type: "legal" | "adjudicator" | "other";
}

interface AuditEvent {
  id: string;
  actor_name: string;
  action: string;
  summary: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

interface DocEntry {
  id: string;
  label: string;
  path: string | null;
  uploaded_at: string | null;
}

const TAB_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "documents", label: "Case Documents" },
  { id: "financial", label: "Financial" },
  { id: "timeline", label: "Timeline" },
  { id: "notes", label: "Notes" },
];

const STATUS_ORDER: AdjStatus[] = [
  "notice_issued",
  "referral_pending",
  "appointment_pending",
  "response_pending",
  "decision_pending",
  "settled",
];

function addDays(dateStr: string | null, days: number): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d;
}

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtGBP(n: number | null): string {
  if (n == null) return "—";
  return `£${n.toLocaleString("en-GB", { minimumFractionDigits: 0 })}`;
}

function isOverdue(d: Date | null): boolean {
  if (!d) return false;
  return d.getTime() < Date.now();
}

function uniqueId(): string {
  return Math.random().toString(36).slice(2, 10);
}

const DOC_LABELS = [
  "Notice of Adjudication",
  "Referral Notice",
  "Response",
  "Reply to Response",
  "Adjudicator's Decision",
];

export default function AdjudicationDetailPage() {
  return (
    <FeatureGate flag="adjudication_module">
      <DetailContent />
    </FeatureGate>
  );
}

function DetailContent() {
  const params = useParams();
  const adjudicationId = params.adjudicationId as string;

  const [adjCase, setAdjCase] = React.useState<AdjCase | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState("overview");
  const [workspaceId, setWorkspaceId] = React.useState("");
  const [userId, setUserId] = React.useState("");

  const [auditEvents, setAuditEvents] = React.useState<AuditEvent[]>([]);
  const [statusSaving, setStatusSaving] = React.useState(false);

  const [disputeItems, setDisputeItems] = React.useState<DisputeItem[]>([]);
  const [costItems, setCostItems] = React.useState<CostItem[]>([]);
  const [decisionAmount, setDecisionAmount] = React.useState("");
  const [settlementAmount, setSettlementAmount] = React.useState("");

  const [docs, setDocs] = React.useState<DocEntry[]>([]);
  const [uploadingDoc, setUploadingDoc] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const supabase = createClient();
        const wsId = await getWorkspaceId(supabase);
        setWorkspaceId(wsId);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) setUserId(user.id);

        const { data: caseData } = await supabase
          .from("adjudication_cases")
          .select("*, projects(name)")
          .eq("id", adjudicationId)
          .eq("workspace_id", wsId)
          .single();

        if (caseData) {
          setAdjCase(caseData as AdjCase);
          setDecisionAmount(caseData.decision_amount != null ? String(caseData.decision_amount) : "");
          setSettlementAmount(caseData.settlement_amount != null ? String(caseData.settlement_amount) : "");

          const storedItems = localStorage.getItem(`adj-dispute-items-${adjudicationId}`);
          if (storedItems) setDisputeItems(JSON.parse(storedItems) as DisputeItem[]);

          const storedCosts = localStorage.getItem(`adj-cost-items-${adjudicationId}`);
          if (storedCosts) setCostItems(JSON.parse(storedCosts) as CostItem[]);

          const storedDocs = localStorage.getItem(`adj-docs-${adjudicationId}`);
          if (storedDocs) {
            setDocs(JSON.parse(storedDocs) as DocEntry[]);
          } else {
            const initialDocs: DocEntry[] = DOC_LABELS.map((label) => ({
              id: uniqueId(),
              label,
              path: null,
              uploaded_at: null,
            }));
            setDocs(initialDocs);
          }
        }

        const { data: events } = await supabase
          .from("audit_events")
          .select("id, actor_name, action, summary, created_at, metadata")
          .eq("resource_id", adjudicationId)
          .eq("resource_type", "adjudication_case")
          .order("created_at", { ascending: false });

        setAuditEvents((events ?? []) as AuditEvent[]);
      } catch {
        // silently ignore
      } finally {
        setLoading(false);
      }
    }
    void init();
  }, [adjudicationId]);

  async function updateStatus(newStatus: AdjStatus) {
    if (!adjCase || statusSaving) return;
    setStatusSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("adjudication_cases")
        .update({ status: newStatus })
        .eq("id", adjudicationId);
      if (error) throw error;

      await createAuditEvent(supabase, {
        workspace_id: workspaceId,
        user_id: userId,
        action: "adjudication_status_updated",
        resource_type: "adjudication_case",
        resource_id: adjudicationId,
        old_values: { status: adjCase.status },
        new_values: { status: newStatus },
      });

      setAdjCase((prev) => (prev ? { ...prev, status: newStatus } : prev));
      toast.success(`Status updated to ${newStatus.replace(/_/g, " ")}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setStatusSaving(false);
    }
  }

  async function saveFinancials() {
    try {
      const supabase = createClient();
      const updates: Record<string, number | null> = {
        decision_amount: decisionAmount ? parseFloat(decisionAmount) : null,
        settlement_amount: settlementAmount ? parseFloat(settlementAmount) : null,
      };
      const { error } = await supabase
        .from("adjudication_cases")
        .update(updates)
        .eq("id", adjudicationId);
      if (error) throw error;

      await createAuditEvent(supabase, {
        workspace_id: workspaceId,
        user_id: userId,
        action: "adjudication_financials_updated",
        resource_type: "adjudication_case",
        resource_id: adjudicationId,
        new_values: updates,
      });

      toast.success("Financial details saved");
    } catch {
      toast.error("Failed to save financials");
    }
  }

  function addDisputeItem() {
    const newItem: DisputeItem = { id: uniqueId(), description: "", amount: 0 };
    const updated = [...disputeItems, newItem];
    setDisputeItems(updated);
    localStorage.setItem(`adj-dispute-items-${adjudicationId}`, JSON.stringify(updated));
  }

  function updateDisputeItem(id: string, field: keyof DisputeItem, value: string | number) {
    const updated = disputeItems.map((i) => (i.id === id ? { ...i, [field]: value } : i));
    setDisputeItems(updated);
    localStorage.setItem(`adj-dispute-items-${adjudicationId}`, JSON.stringify(updated));
  }

  function removeDisputeItem(id: string) {
    const updated = disputeItems.filter((i) => i.id !== id);
    setDisputeItems(updated);
    localStorage.setItem(`adj-dispute-items-${adjudicationId}`, JSON.stringify(updated));
  }

  function addCostItem() {
    const newItem: CostItem = { id: uniqueId(), description: "", amount: 0, type: "legal" };
    const updated = [...costItems, newItem];
    setCostItems(updated);
    localStorage.setItem(`adj-cost-items-${adjudicationId}`, JSON.stringify(updated));
  }

  function updateCostItem(id: string, field: keyof CostItem, value: string | number) {
    const updated = costItems.map((i) => (i.id === id ? { ...i, [field]: value } : i));
    setCostItems(updated);
    localStorage.setItem(`adj-cost-items-${adjudicationId}`, JSON.stringify(updated));
  }

  function removeCostItem(id: string) {
    const updated = costItems.filter((i) => i.id !== id);
    setCostItems(updated);
    localStorage.setItem(`adj-cost-items-${adjudicationId}`, JSON.stringify(updated));
  }

  async function handleDocUpload(docId: string, file: File) {
    setUploadingDoc(docId);
    try {
      const supabase = createClient();
      const path = `adjudication/${adjudicationId}/${docId}/${file.name}`;
      await uploadFile(supabase, {
        bucket: "project-media",
        path,
        file,
      });

      await createAuditEvent(supabase, {
        workspace_id: workspaceId,
        user_id: userId,
        action: "adjudication_document_uploaded",
        resource_type: "adjudication_case",
        resource_id: adjudicationId,
        new_values: { doc_id: docId, file_name: file.name },
      });

      const updated = docs.map((d) =>
        d.id === docId ? { ...d, path, uploaded_at: new Date().toISOString() } : d
      );
      setDocs(updated);
      localStorage.setItem(`adj-docs-${adjudicationId}`, JSON.stringify(updated));
      toast.success(`${file.name} uploaded`);
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploadingDoc(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    );
  }

  if (!adjCase) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <AlertTriangle className="w-8 h-8 text-amber-500" />
        <p style={{ color: "var(--text-muted)" }}>Adjudication case not found</p>
      </div>
    );
  }

  const noticeDateObj = adjCase.notice_date ? new Date(adjCase.notice_date) : null;
  const referralDue = addDays(adjCase.notice_date, 7);
  const appointmentDateObj = adjCase.appointment_date ? new Date(adjCase.appointment_date) : null;
  const responseDue = addDays(adjCase.appointment_date, 7);
  const decisionDue = addDays(adjCase.appointment_date, 28);

  const currentStatusIdx = STATUS_ORDER.indexOf(adjCase.status);

  function stepStatus(status: AdjStatus): "complete" | "current" | "upcoming" | "overdue" {
    const idx = STATUS_ORDER.indexOf(status);
    if (idx < currentStatusIdx) return "complete";
    if (idx === currentStatusIdx) return "current";
    return "upcoming";
  }

  const STEPPER_STEPS = [
    {
      id: "notice_issued",
      label: "Notice of Adjudication Issued",
      description: noticeDateObj ? fmtDate(noticeDateObj) : "Not yet issued",
      timestamp: noticeDateObj ?? undefined,
      status: stepStatus("notice_issued"),
    },
    {
      id: "referral_pending",
      label: "Referral Submitted",
      description: referralDue
        ? `Due: ${fmtDate(referralDue)}`
        : "Date not set",
      status: stepStatus("referral_pending"),
    },
    {
      id: "appointment_pending",
      label: "Adjudicator Appointed",
      description: appointmentDateObj
        ? fmtDate(appointmentDateObj)
        : "Pending appointment",
      timestamp: appointmentDateObj ?? undefined,
      status: stepStatus("appointment_pending"),
    },
    {
      id: "response_pending",
      label: "Response Received",
      description: responseDue ? `Due: ${fmtDate(responseDue)}` : "Awaiting appointment",
      status: stepStatus("response_pending"),
    },
    {
      id: "decision_pending",
      label: "Decision Received",
      description: decisionDue ? `Due: ${fmtDate(decisionDue)}` : "Awaiting appointment",
      status: stepStatus("decision_pending"),
    },
    {
      id: "settled",
      label: "Outcome",
      description:
        adjCase.status === "won"
          ? "Won"
          : adjCase.status === "lost"
          ? "Lost"
          : adjCase.status === "settled"
          ? "Settled"
          : adjCase.status === "withdrawn"
          ? "Withdrawn"
          : "Pending",
      status: (
        adjCase.status === "won" ||
        adjCase.status === "lost" ||
        adjCase.status === "settled" ||
        adjCase.status === "withdrawn"
          ? "complete"
          : "upcoming"
      ) as "complete" | "current" | "upcoming" | "overdue",
    },
  ];

  const totalDisputeItems = disputeItems.reduce((s, i) => s + Number(i.amount), 0);
  const totalCosts = costItems.reduce((s, i) => s + Number(i.amount), 0);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={adjCase.case_number}
        subtitle={adjCase.projects?.name ?? "Adjudication Case"}
        backHref="/app/adjudication"
        breadcrumbs={[
          { label: "Adjudication Register", href: "/app/adjudication" },
          { label: adjCase.case_number },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <StatusChip status={adjCase.status} />
            <select
              className="form-input h-9 text-sm w-auto"
              value={adjCase.status}
              onChange={(e) => void updateStatus(e.target.value as AdjStatus)}
              disabled={statusSaving}
            >
              <option value="notice_issued">Notice Issued</option>
              <option value="referral_pending">Referral Pending</option>
              <option value="appointment_pending">Appointment Pending</option>
              <option value="response_pending">Response Pending</option>
              <option value="decision_pending">Decision Pending</option>
              <option value="settled">Settled</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
              <option value="withdrawn">Withdrawn</option>
            </select>
          </div>
        }
      />

      <Tabs tabs={TAB_ITEMS} active={activeTab} onChange={setActiveTab} />

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="card p-5 flex flex-col gap-4">
              <h3 className="text-[14px] font-700" style={{ color: "var(--text-primary)" }}>
                Case Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-[13px]">
                <div>
                  <p className="text-[11px] font-600 uppercase tracking-[0.05em] mb-0.5" style={{ color: "var(--text-muted)" }}>
                    Case Reference
                  </p>
                  <p className="font-600" style={{ color: "var(--text-primary)" }}>
                    {adjCase.case_number}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-600 uppercase tracking-[0.05em] mb-0.5" style={{ color: "var(--text-muted)" }}>
                    Dispute Type
                  </p>
                  <p className="font-600 capitalize" style={{ color: "var(--text-primary)" }}>
                    {adjCase.dispute_type.replace(/_/g, " ")}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-600 uppercase tracking-[0.05em] mb-0.5" style={{ color: "var(--text-muted)" }}>
                    Amount in Dispute
                  </p>
                  <p className="font-700 text-red-700 text-[16px]">
                    {fmtGBP(adjCase.amount_in_dispute)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-600 uppercase tracking-[0.05em] mb-0.5" style={{ color: "var(--text-muted)" }}>
                    Project
                  </p>
                  <p className="font-600" style={{ color: "var(--text-primary)" }}>
                    {adjCase.projects?.name ?? "—"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-600 uppercase tracking-[0.05em] mb-0.5" style={{ color: "var(--text-muted)" }}>
                  Dispute Description
                </p>
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {adjCase.dispute_description}
                </p>
              </div>
            </div>

            <div className="card p-5 flex flex-col gap-4">
              <h3 className="text-[14px] font-700" style={{ color: "var(--text-primary)" }}>
                Parties
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  className="rounded-xl p-4"
                  style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}
                >
                  <p className="text-[11px] font-600 uppercase tracking-[0.05em] mb-1" style={{ color: "var(--text-muted)" }}>
                    Referring Party
                  </p>
                  <p className="text-[13px] font-600" style={{ color: "var(--text-primary)" }}>
                    Your Organisation
                  </p>
                </div>
                <div
                  className="rounded-xl p-4"
                  style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}
                >
                  <p className="text-[11px] font-600 uppercase tracking-[0.05em] mb-1" style={{ color: "var(--text-muted)" }}>
                    Responding Party
                  </p>
                  <p className="text-[13px] font-600" style={{ color: "var(--text-primary)" }}>
                    {adjCase.responding_party ?? "—"}
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-5 flex flex-col gap-5">
              <h3 className="text-[14px] font-700" style={{ color: "var(--text-primary)" }}>
                Key Dates
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <DateCell label="Notice Issued" date={noticeDateObj} />
                <DateCell
                  label="Referral Due"
                  date={referralDue}
                  overdue={isOverdue(referralDue)}
                />
                <DateCell label="Adjudicator Appointed" date={appointmentDateObj} />
                <DateCell
                  label="Response Due"
                  date={responseDue}
                  overdue={isOverdue(responseDue)}
                />
                <div className="flex flex-col gap-1">
                  <p className="text-[11px] font-600 uppercase tracking-[0.05em]" style={{ color: "var(--text-muted)" }}>
                    Decision Due
                  </p>
                  {decisionDue && ACTIVE_STATUSES_DETAIL.includes(adjCase.status) ? (
                    <CountdownClock deadline={decisionDue} urgencyThresholdDays={7} />
                  ) : (
                    <p
                      className={cn(
                        "text-[13px] font-600",
                        isOverdue(decisionDue) ? "text-red-600" : ""
                      )}
                      style={{ color: "var(--text-primary)" }}
                    >
                      {fmtDate(decisionDue)}
                    </p>
                  )}
                </div>
              </div>

              {adjCase.jurisdiction_notes && (
                <div>
                  <p className="text-[11px] font-600 uppercase tracking-[0.05em] mb-1" style={{ color: "var(--text-muted)" }}>
                    Jurisdiction Notes
                  </p>
                  <p className="text-[13px]" style={{ color: "var(--text-secondary)" }}>
                    {adjCase.jurisdiction_notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-[14px] font-700 mb-4" style={{ color: "var(--text-primary)" }}>
              Case Progress
            </h3>
            <VerticalStepper
              steps={STEPPER_STEPS.map((s) => ({
                ...s,
                timestamp: s.timestamp instanceof Date ? s.timestamp : undefined,
              }))}
            />
          </div>
        </div>
      )}

      {activeTab === "documents" && (
        <div className="card p-5 flex flex-col gap-4">
          <h3 className="text-[14px] font-700" style={{ color: "var(--text-primary)" }}>
            Case Documents
          </h3>
          <div className="flex flex-col gap-3">
            {docs.map((doc) => (
              <DocRow
                key={doc.id}
                doc={doc}
                uploading={uploadingDoc === doc.id}
                onUpload={(file) => void handleDocUpload(doc.id, file)}
              />
            ))}
          </div>
        </div>
      )}

      {activeTab === "financial" && (
        <div className="flex flex-col gap-6">
          <div className="card p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-700" style={{ color: "var(--text-primary)" }}>
                Amount in Dispute — Breakdown
              </h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={addDisputeItem}
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            </div>
            {disputeItems.length === 0 ? (
              <p className="text-[13px] py-4 text-center" style={{ color: "var(--text-muted)" }}>
                No items added. Add itemised breakdown of dispute value.
              </p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th className="text-right">Amount (£)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {disputeItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <input
                          className="form-input h-8 text-[12px] w-full"
                          value={item.description}
                          onChange={(e) => updateDisputeItem(item.id, "description", e.target.value)}
                          placeholder="Item description…"
                        />
                      </td>
                      <td className="text-right">
                        <input
                          className="form-input h-8 text-[12px] text-right w-28 tabular-nums"
                          type="number"
                          value={item.amount}
                          onChange={(e) => updateDisputeItem(item.id, "amount", parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon btn-sm text-red-500"
                          onClick={() => removeDisputeItem(item.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="font-700 text-[13px]">Total</td>
                    <td className="text-right font-700 tabular-nums">
                      {fmtGBP(totalDisputeItems)}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          <div className="card p-5 flex flex-col gap-4">
            <h3 className="text-[14px] font-700" style={{ color: "var(--text-primary)" }}>
              Financial Outcome
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="form-label">Decision Amount (£)</label>
                <input
                  className="form-input"
                  type="number"
                  min={0}
                  value={decisionAmount}
                  onChange={(e) => setDecisionAmount(e.target.value)}
                  placeholder="Enter when decision received…"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="form-label">Settlement Amount (£)</label>
                <input
                  className="form-input"
                  type="number"
                  min={0}
                  value={settlementAmount}
                  onChange={(e) => setSettlementAmount(e.target.value)}
                  placeholder="Enter if settled before decision…"
                />
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm self-start"
              onClick={() => void saveFinancials()}
            >
              Save Financial Details
            </button>
          </div>

          <div className="card p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-700" style={{ color: "var(--text-primary)" }}>
                Costs Incurred
              </h3>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={addCostItem}
              >
                <Plus className="w-4 h-4" />
                Add Cost
              </button>
            </div>
            {costItems.length === 0 ? (
              <p className="text-[13px] py-4 text-center" style={{ color: "var(--text-muted)" }}>
                No costs recorded.
              </p>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Type</th>
                    <th className="text-right">Amount (£)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {costItems.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <input
                          className="form-input h-8 text-[12px] w-full"
                          value={item.description}
                          onChange={(e) => updateCostItem(item.id, "description", e.target.value)}
                          placeholder="Cost description…"
                        />
                      </td>
                      <td>
                        <select
                          className="form-input h-8 text-[12px]"
                          value={item.type}
                          onChange={(e) => updateCostItem(item.id, "type", e.target.value)}
                        >
                          <option value="legal">Legal Fees</option>
                          <option value="adjudicator">Adjudicator Fees</option>
                          <option value="other">Other</option>
                        </select>
                      </td>
                      <td className="text-right">
                        <input
                          className="form-input h-8 text-[12px] text-right w-28 tabular-nums"
                          type="number"
                          value={item.amount}
                          onChange={(e) => updateCostItem(item.id, "amount", parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-ghost btn-icon btn-sm text-red-500"
                          onClick={() => removeCostItem(item.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  <tr>
                    <td className="font-700 text-[13px]" colSpan={2}>
                      Total Costs
                    </td>
                    <td className="text-right font-700 tabular-nums">
                      {fmtGBP(totalCosts)}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {activeTab === "timeline" && (
        <div className="card p-5">
          <h3 className="text-[14px] font-700 mb-4" style={{ color: "var(--text-primary)" }}>
            Case Timeline
          </h3>
          <AuditFeed events={auditEvents} />
        </div>
      )}

      {activeTab === "notes" && workspaceId && (
        <div className="card p-5">
          <h3 className="text-[14px] font-700 mb-4" style={{ color: "var(--text-primary)" }}>
            Notes
          </h3>
          <NotesComposer
            entityType="adjudication_case"
            entityId={adjudicationId}
            workspaceId={workspaceId}
          />
        </div>
      )}
    </div>
  );
}

const ACTIVE_STATUSES_DETAIL: AdjStatus[] = [
  "notice_issued",
  "referral_pending",
  "appointment_pending",
  "response_pending",
  "decision_pending",
];

function DateCell({
  label,
  date,
  overdue,
}: {
  label: string;
  date: Date | null;
  overdue?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[11px] font-600 uppercase tracking-[0.05em]" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p
        className={cn("text-[13px] font-600", overdue ? "text-red-600" : "")}
        style={overdue ? undefined : { color: "var(--text-primary)" }}
      >
        {date ? date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
        {overdue && <AlertTriangle className="inline w-3.5 h-3.5 ml-1 text-red-500" />}
      </p>
    </div>
  );
}

function DocRow({
  doc,
  uploading,
  onUpload,
}: {
  doc: DocEntry;
  uploading: boolean;
  onUpload: (file: File) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div
      className="flex items-center justify-between gap-4 p-3 rounded-xl"
      style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <FileText
          className="w-5 h-5 flex-shrink-0"
          style={{ color: doc.path ? "var(--success)" : "var(--text-muted)" }}
        />
        <div className="min-w-0">
          <p className="text-[13px] font-600 truncate" style={{ color: "var(--text-primary)" }}>
            {doc.label}
          </p>
          {doc.uploaded_at && (
            <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
              Uploaded {new Date(doc.uploaded_at).toLocaleDateString("en-GB")}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {doc.path ? (
          <span className="chip chip-success text-[11px]">Uploaded</span>
        ) : (
          <span className="chip chip-default text-[11px]" style={{ color: "var(--text-muted)" }}>
            Pending
          </span>
        )}
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          {doc.path ? "Replace" : "Upload"}
        </button>
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

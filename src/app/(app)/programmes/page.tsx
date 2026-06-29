"use client";

import { CountdownClock } from "@/components/ui/countdown-clock";
import { KpiCard } from "@/components/ui/kpi-card";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { ProgrammeWizard } from "@/components/wizards/programme-wizard";
import { createAuditEvent } from "@/lib/audit";
import { getWorkspaceId } from "@/lib/workspace";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Calendar, Check, Download, Loader2, Plus, Star } from "lucide-react";
import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type PMResponse = "accepted" | "not_accepted" | "awaiting";

interface ProgrammeNotification {
  id: string;
  revision_letter: string;
  submission_date: string;
  due_date: string;
  pm_response: PMResponse;
  pm_response_date: string | null;
  rejection_reasons: string | null;
  is_ce_assessment_baseline: boolean;
  file_url: string | null;
  is_revised_baseline: boolean;
  terminal_float_days: number | null;
  total_float_days: number | null;
  created_at: string;
  workspace_id: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function addWeeks(dateStr: string, weeks: number): Date {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + weeks * 7);
  return d;
}

function pmResponseVariant(r: PMResponse): string {
  switch (r) {
    case "accepted": return "accepted";
    case "not_accepted": return "disputed";
    default: return "pending";
  }
}

// ─── PM Response Modal ────────────────────────────────────────────────────────

function PMResponseModal({
  programme,
  workspaceId,
  userId,
  onClose,
  onSaved,
}: {
  programme: ProgrammeNotification;
  workspaceId: string;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [response, setResponse] = React.useState<PMResponse>(programme.pm_response === "awaiting" ? "awaiting" : programme.pm_response);
  const [responseDate, setResponseDate] = React.useState(programme.pm_response_date ?? new Date().toISOString().split("T")[0]);
  const [rejectionReasons, setRejectionReasons] = React.useState(programme.rejection_reasons ?? "");
  const [saving, setSaving] = React.useState(false);

  async function save() {
    setSaving(true);
    try {
      const supabase = createClient();
      const updates = {
        pm_response: response,
        pm_response_date: responseDate || null,
        rejection_reasons: response === "not_accepted" ? rejectionReasons : null,
      };
      await supabase
        .from("programme_notifications")
        .update(updates)
        .eq("id", programme.id);

      await createAuditEvent(supabase, {
        workspace_id: workspaceId,
        user_id: userId,
        action: "programme_pm_response_recorded",
        resource_type: "programme_notification",
        resource_id: programme.id,
        old_values: { pm_response: programme.pm_response },
        new_values: { pm_response: response, pm_response_date: responseDate },
      });

      onSaved();
      onClose();
    } catch {
      // silently handle
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Record PM Response"
      description={`Revision ${programme.revision_letter} — Submitted ${programme.submission_date}`}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => void save()}
            disabled={saving}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save Response
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="form-label">PM Response</label>
          <select
            className="form-input"
            value={response}
            onChange={e => setResponse(e.target.value as PMResponse)}
          >
            <option value="awaiting">Awaiting</option>
            <option value="accepted">Accepted</option>
            <option value="not_accepted">Not Accepted</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="form-label">Response Date</label>
          <input
            className="form-input"
            type="date"
            value={responseDate}
            onChange={e => setResponseDate(e.target.value)}
          />
        </div>

        {response === "not_accepted" && (
          <div className="flex flex-col gap-1.5">
            <label className="form-label">Rejection Reasons</label>
            <textarea
              className="form-input min-h-[80px] resize-y"
              value={rejectionReasons}
              onChange={e => setRejectionReasons(e.target.value)}
              placeholder="Detail the PM's reasons for not accepting the programme…"
            />
          </div>
        )}
      </div>
    </Modal>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProgrammesPage() {
  const [programmes, setProgrammes] = React.useState<ProgrammeNotification[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showWizard, setShowWizard] = React.useState(false);
  const [pmModal, setPmModal] = React.useState<ProgrammeNotification | null>(null);
  const [workspaceId, setWorkspaceId] = React.useState("");
  const [userId, setUserId] = React.useState("");
  const [settingBaselineId, setSettingBaselineId] = React.useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const supabase = createClient();
      const [wsId, { data: { user } }] = await Promise.all([
        getWorkspaceId(supabase),
        supabase.auth.getUser(),
      ]);
      setWorkspaceId(wsId);
      setUserId(user?.id ?? "");

      const { data } = await supabase
        .from("programme_notifications")
        .select("*")
        .eq("workspace_id", wsId)
        .order("submission_date", { ascending: false });

      setProgrammes((data ?? []) as ProgrammeNotification[]);
    } catch {
      setProgrammes([]);
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void load();
  }, []);

  // Clause 32 cycle tracker
  const latestSubmission = programmes[0] ?? null;
  const nextDueDate = latestSubmission
    ? addWeeks(latestSubmission.submission_date, 8)
    : null;

  // KPIs
  const totalSubmissions = programmes.length;
  const acceptedBaseline = programmes.find(p => p.is_ce_assessment_baseline);
  const openFloat = programmes.find(p => p.pm_response === "accepted");

  // Set CE assessment baseline
  async function setBaseline(id: string) {
    setSettingBaselineId(id);
    try {
      const supabase = createClient();
      // Clear existing baselines in this workspace
      await supabase
        .from("programme_notifications")
        .update({ is_ce_assessment_baseline: false })
        .eq("workspace_id", workspaceId);
      // Set new baseline
      await supabase
        .from("programme_notifications")
        .update({ is_ce_assessment_baseline: true })
        .eq("id", id);

      await createAuditEvent(supabase, {
        workspace_id: workspaceId,
        user_id: userId,
        action: "programme_baseline_set",
        resource_type: "programme_notification",
        resource_id: id,
        new_values: { is_ce_assessment_baseline: true },
      });

      await load();
    } catch {
      // silently handle
    } finally {
      setSettingBaselineId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Programme Register"
        subtitle="NEC4 Clause 32 programme submission tracker"
        actions={
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setShowWizard(true)}
          >
            <Plus className="w-4 h-4" />
            Submit Programme
          </button>
        }
      />

      {/* Clause 32 Cycle Tracker */}
      {nextDueDate && (
        <div
          className="card p-5 flex flex-col sm:flex-row items-center gap-6 justify-between"
          style={{ borderColor: "var(--primary)", borderWidth: 1 }}
        >
          <div className="flex-1">
            <p className="text-[12px] font-700 uppercase tracking-[0.06em] mb-1" style={{ color: "var(--text-muted)" }}>
              Clause 32 Cycle
            </p>
            <p className="text-[14px] font-600" style={{ color: "var(--text-primary)" }}>
              Latest: Rev {latestSubmission?.revision_letter} — Submitted {latestSubmission?.submission_date}
            </p>
            <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>
              Next submission due: {nextDueDate.toLocaleDateString("en-GB")}
            </p>
          </div>
          <CountdownClock
            deadline={nextDueDate}
            label="Next Programme Due"
            urgencyThresholdDays={14}
          />
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <KpiCard
          label="Total Submissions"
          value={totalSubmissions}
          icon={Calendar}
          variant="default"
        />
        <KpiCard
          label="CE Assessment Baseline"
          value={acceptedBaseline ? `Rev ${acceptedBaseline.revision_letter}` : "Not set"}
          icon={Star}
          variant={acceptedBaseline ? "success" : "warning"}
        />
        <KpiCard
          label="Float Status"
          value={openFloat?.terminal_float_days != null ? `${openFloat.terminal_float_days}d terminal` : "N/A"}
          variant="default"
        />
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Revision</th>
                <th>Submitted</th>
                <th>Due Date</th>
                <th>PM Response</th>
                <th>Baseline</th>
                <th>Float</th>
                <th>File</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-10">
                    <span className="skeleton inline-block h-4 w-32 rounded" />
                  </td>
                </tr>
              ) : programmes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12" style={{ color: "var(--text-muted)" }}>
                    <Calendar className="w-6 h-6 mx-auto mb-2 opacity-40" />
                    <p className="text-[13px]">No programmes submitted yet</p>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm mt-3"
                      onClick={() => setShowWizard(true)}
                    >
                      <Plus className="w-4 h-4" />
                      Submit First Programme
                    </button>
                  </td>
                </tr>
              ) : (
                programmes.map(prog => (
                  <tr key={prog.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-700 text-[13px]" style={{ color: "var(--primary)" }}>
                          Rev {prog.revision_letter}
                        </span>
                        {prog.is_ce_assessment_baseline && (
                          <span title="CE Assessment Baseline">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-[12px]" style={{ color: "var(--text-secondary)" }}>
                      {prog.submission_date}
                    </td>
                    <td className="text-[12px]">
                      <DueDateCell dueDate={prog.due_date} />
                    </td>
                    <td>
                      <StatusChip status={pmResponseVariant(prog.pm_response)} size="sm" />
                      {prog.pm_response_date && (
                        <span className="text-[10px] ml-1" style={{ color: "var(--text-muted)" }}>
                          {prog.pm_response_date}
                        </span>
                      )}
                    </td>
                    <td>
                      {prog.is_ce_assessment_baseline ? (
                        <span className="chip chip-success text-[10px] flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" />CE Baseline
                        </span>
                      ) : prog.pm_response === "accepted" ? (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm text-[10px]"
                          onClick={() => void setBaseline(prog.id)}
                          disabled={settingBaselineId === prog.id}
                        >
                          {settingBaselineId === prog.id
                            ? <Loader2 className="w-3 h-3 animate-spin" />
                            : <Star className="w-3 h-3" />
                          }
                          Mark as CE Baseline
                        </button>
                      ) : (
                        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                    <td className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {prog.terminal_float_days != null
                        ? `${prog.terminal_float_days}d terminal`
                        : "—"}
                    </td>
                    <td>
                      {prog.file_url ? (
                        <a
                          href={prog.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-ghost btn-icon btn-sm"
                          title="Download file"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>—</span>
                      )}
                    </td>
                    <td>
                      {prog.pm_response === "awaiting" && (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm text-[11px]"
                          onClick={() => setPmModal(prog)}
                        >
                          Record PM Response
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Wizards / Modals */}
      {showWizard && (
        <ProgrammeWizard
          onClose={() => setShowWizard(false)}
          onCreated={() => { void load(); }}
        />
      )}

      {pmModal && (
        <PMResponseModal
          programme={pmModal}
          workspaceId={workspaceId}
          userId={userId}
          onClose={() => setPmModal(null)}
          onSaved={() => { void load(); }}
        />
      )}
    </div>
  );
}

// ─── Due Date Cell ─────────────────────────────────────────────────────────────

function DueDateCell({ dueDate }: { dueDate: string }) {
  const due = new Date(dueDate);
  const now = new Date();
  const diffDays = Math.floor((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = diffDays < 0;
  const isUrgent = diffDays >= 0 && diffDays <= 7;

  return (
    <span
      className={cn(
        "text-[12px] font-600",
        isOverdue && "text-red-600",
        isUrgent && "text-amber-600",
        !isOverdue && !isUrgent && "text-[var(--text-secondary)]"
      )}
    >
      {dueDate}
      {isOverdue && <span className="ml-1 chip chip-danger text-[10px]">OVERDUE</span>}
    </span>
  );
}

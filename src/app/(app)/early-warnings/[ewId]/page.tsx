"use client";

import { AuditFeed } from "@/components/ui/audit-feed";
import { PageHeader } from "@/components/ui/page-header";
import { StatusChip } from "@/components/ui/status-chip";
import { Tabs } from "@/components/ui/tabs";
import { createAuditEvent } from "@/lib/audit";
import { getWorkspaceId } from "@/lib/workspace";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  AlertTriangle, Calendar, Check, ExternalLink,
  Loader2, Plus, Trash2, X,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import React from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type EWStatus = "open" | "reducing" | "mitigated" | "converted_to_ce" | "closed";
type EWCategory = "cost" | "time" | "quality" | "safety" | "environmental" | "other";

interface MitigationAction {
  text: string;
  owner: string;
  due_date?: string;
  status: "open" | "complete";
}

interface EarlyWarning {
  id: string;
  ew_number: string;
  title: string;
  description: string | null;
  category: EWCategory;
  risk_owner: string | null;
  cost_impact: number | null;
  programme_impact_days: number | null;
  likelihood: number;
  impact: number;
  risk_score: number;
  status: EWStatus;
  linked_ce_id: string | null;
  mitigation_actions: MitigationAction[] | null;
  risk_reduction_meeting_date: string | null;
  risk_reduction_meeting_attendees: string | null;
  risk_reduction_meeting_notes: string | null;
  created_at: string;
  workspace_id: string;
  project_id: string | null;
  projects: { name: string } | null;
  created_by: string;
}

interface LinkedCE {
  id: string;
  ce_number: string;
  title: string;
  status: string;
  value: number | null;
}

interface AuditEvent {
  id: string;
  actor_name: string;
  action: string;
  summary: string;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function riskColourClass(score: number): string {
  if (score >= 15) return "chip-danger";
  if (score >= 10) return "chip-warning";
  if (score >= 5) return "chip-info";
  return "chip-success";
}

function riskLabel(score: number): string {
  if (score >= 15) return "Critical";
  if (score >= 10) return "High";
  if (score >= 5) return "Medium";
  return "Low";
}

const LIKELIHOOD_LABELS: Record<number, string> = {
  1: "Remote", 2: "Unlikely", 3: "Possible", 4: "Likely", 5: "Almost Certain",
};
const IMPACT_LABELS: Record<number, string> = {
  1: "Negligible", 2: "Minor", 3: "Moderate", 4: "Major", 5: "Catastrophic",
};

const TAB_ITEMS = [
  { id: "details", label: "Details" },
  { id: "mitigation", label: "Mitigation Actions" },
  { id: "rrm", label: "Risk Reduction Meetings" },
  { id: "linked-ce", label: "Linked CE" },
  { id: "audit", label: "Audit" },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function EarlyWarningDetailPage() {
  const params = useParams();
  const ewId = params.ewId as string;

  const [ew, setEw] = React.useState<EarlyWarning | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [tab, setTab] = React.useState("details");
  const [workspaceId, setWorkspaceId] = React.useState("");
  const [userId, setUserId] = React.useState("");

  async function loadEW() {
    setLoading(true);
    try {
      const supabase = createClient();
      const [{ data: ewData }, wsId, { data: { user } }] = await Promise.all([
        supabase
          .from("early_warnings")
          .select("*, projects(name)")
          .eq("id", ewId)
          .single(),
        getWorkspaceId(supabase),
        supabase.auth.getUser(),
      ]);
      if (ewData) setEw(ewData as EarlyWarning);
      setWorkspaceId(wsId);
      setUserId(user?.id ?? "");
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    void loadEW();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ewId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    );
  }

  if (!ew) {
    return (
      <div className="text-center py-20" style={{ color: "var(--text-muted)" }}>
        <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p>Early warning not found.</p>
        <Link href="/app/early-warnings" className="btn btn-primary btn-sm mt-4 inline-flex">
          Back to EWR
        </Link>
      </div>
    );
  }

  const score = ew.likelihood * ew.impact;

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <PageHeader
        title={ew.title}
        backHref="/app/early-warnings"
        breadcrumbs={[
          { label: "Early Warnings", href: "/app/early-warnings" },
          { label: ew.ew_number },
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="font-mono text-[12px] px-2 py-0.5 rounded-full font-700"
              style={{ background: "var(--bg-subtle)", color: "var(--text-muted)" }}
            >
              {ew.ew_number}
            </span>
            <span className={cn("chip font-700", riskColourClass(score))}>
              Risk: {score} — {riskLabel(score)}
            </span>
            <StatusChip status={ew.status} />
            <Link
              href={`/app/changes?ew=${ew.id}`}
              className="btn btn-secondary btn-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Convert to CE
            </Link>
          </div>
        }
      />

      {/* Tab bar */}
      <Tabs tabs={TAB_ITEMS} active={tab} onChange={setTab} />

      {/* Tab content */}
      <div>
        {tab === "details" && (
          <DetailsTab
            ew={ew}
            workspaceId={workspaceId}
            userId={userId}
            onUpdated={loadEW}
          />
        )}
        {tab === "mitigation" && (
          <MitigationTab
            ew={ew}
            workspaceId={workspaceId}
            userId={userId}
            onUpdated={loadEW}
          />
        )}
        {tab === "rrm" && (
          <RRMTab
            ew={ew}
            workspaceId={workspaceId}
            userId={userId}
            onUpdated={loadEW}
          />
        )}
        {tab === "linked-ce" && (
          <LinkedCETab ew={ew} />
        )}
        {tab === "audit" && (
          <AuditTab ewId={ewId} />
        )}
      </div>
    </div>
  );
}

// ─── Details Tab ──────────────────────────────────────────────────────────────

function DetailsTab({
  ew,
  workspaceId,
  userId,
  onUpdated,
}: {
  ew: EarlyWarning;
  workspaceId: string;
  userId: string;
  onUpdated: () => void;
}) {
  const [saving, setSaving] = React.useState(false);

  const [title, setTitle] = React.useState(ew.title);
  const [description, setDescription] = React.useState(ew.description ?? "");
  const [category, setCategory] = React.useState<EWCategory>(ew.category);
  const [riskOwner, setRiskOwner] = React.useState(ew.risk_owner ?? "");
  const [costImpact, setCostImpact] = React.useState<string>(ew.cost_impact != null ? String(ew.cost_impact) : "");
  const [programmeImpact, setProgrammeImpact] = React.useState<string>(ew.programme_impact_days != null ? String(ew.programme_impact_days) : "");
  const [likelihood, setLikelihood] = React.useState(ew.likelihood);
  const [impact, setImpact] = React.useState(ew.impact);
  const [status, setStatus] = React.useState<EWStatus>(ew.status);

  const score = likelihood * impact;

  async function save() {
    setSaving(true);
    try {
      const supabase = createClient();
      const updates = {
        title: title.trim(),
        description: description.trim() || null,
        category,
        risk_owner: riskOwner.trim() || null,
        cost_impact: costImpact ? parseFloat(costImpact) : null,
        programme_impact_days: programmeImpact ? parseInt(programmeImpact, 10) : null,
        likelihood,
        impact,
        risk_score: score,
        status,
      };
      const { error } = await supabase
        .from("early_warnings")
        .update(updates)
        .eq("id", ew.id);
      if (error) throw error;

      await createAuditEvent(supabase, {
        workspace_id: workspaceId,
        user_id: userId,
        action: "early_warning_updated",
        resource_type: "early_warning",
        resource_id: ew.id,
        old_values: {
          title: ew.title,
          status: ew.status,
          likelihood: ew.likelihood,
          impact: ew.impact,
        },
        new_values: { title: updates.title, status, likelihood, impact, risk_score: score },
      });

      onUpdated();
    } catch {
      // silently handle
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 flex flex-col gap-5">
        {/* Title */}
        <div className="card p-5 flex flex-col gap-4">
          <h3 className="text-[13px] font-700" style={{ color: "var(--text-secondary)" }}>Risk Information</h3>

          <div className="flex flex-col gap-1.5">
            <label className="form-label">Title</label>
            <input
              className="form-input"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="form-label">Description</label>
            <textarea
              className="form-input min-h-[80px] resize-y"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="form-label">Category</label>
              <select className="form-input" value={category} onChange={e => setCategory(e.target.value as EWCategory)}>
                <option value="cost">Cost</option>
                <option value="time">Time</option>
                <option value="quality">Quality</option>
                <option value="safety">Safety</option>
                <option value="environmental">Environmental</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="form-label">Status</label>
              <select className="form-input" value={status} onChange={e => setStatus(e.target.value as EWStatus)}>
                <option value="open">Open</option>
                <option value="reducing">Reducing</option>
                <option value="mitigated">Mitigated</option>
                <option value="converted_to_ce">Converted to CE</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="form-label">Risk Owner</label>
            <input
              className="form-input"
              value={riskOwner}
              onChange={e => setRiskOwner(e.target.value)}
            />
          </div>
        </div>

        {/* Impact */}
        <div className="card p-5 flex flex-col gap-4">
          <h3 className="text-[13px] font-700" style={{ color: "var(--text-secondary)" }}>Impact Assessment</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="form-label">Cost Impact (£)</label>
              <input
                className="form-input"
                type="number"
                min={0}
                value={costImpact}
                onChange={e => setCostImpact(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="form-label">Programme Impact (days)</label>
              <input
                className="form-input"
                type="number"
                min={0}
                value={programmeImpact}
                onChange={e => setProgrammeImpact(e.target.value)}
              />
            </div>
          </div>

          {/* Likelihood */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="form-label mb-0">Likelihood</label>
              <span className="text-[12px] font-600" style={{ color: "var(--text-secondary)" }}>
                {likelihood} — {LIKELIHOOD_LABELS[likelihood]}
              </span>
            </div>
            <input
              type="range" min={1} max={5} step={1} value={likelihood}
              onChange={e => setLikelihood(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Impact */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="form-label mb-0">Impact</label>
              <span className="text-[12px] font-600" style={{ color: "var(--text-secondary)" }}>
                {impact} — {IMPACT_LABELS[impact]}
              </span>
            </div>
            <input
              type="range" min={1} max={5} step={1} value={impact}
              onChange={e => setImpact(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            className="btn btn-primary btn-sm"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Right rail — risk score */}
      <div className="flex flex-col gap-4">
        <div className="card p-5 flex flex-col items-center gap-3">
          <p className="text-[11px] font-700 uppercase tracking-[0.06em]" style={{ color: "var(--text-muted)" }}>
            Current Risk Score
          </p>
          <span className={cn("text-5xl font-800 rounded-2xl px-6 py-4", riskColourClass(score))}>
            {score}
          </span>
          <p className="text-[13px] font-600" style={{ color: "var(--text-secondary)" }}>
            {riskLabel(score)}
          </p>
          <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
            {likelihood} × {impact}
          </p>
        </div>

        <div className="card p-5 flex flex-col gap-3">
          <h4 className="text-[12px] font-700" style={{ color: "var(--text-secondary)" }}>Key Details</h4>
          {[
            { label: "EW Number", value: ew.ew_number },
            { label: "Project", value: ew.projects?.name ?? "—" },
            { label: "Category", value: ew.category },
            { label: "Created", value: new Date(ew.created_at).toLocaleDateString("en-GB") },
          ].map(row => (
            <div key={row.label} className="flex justify-between text-[12px] py-1.5 border-b last:border-0" style={{ borderColor: "var(--border-subtle)" }}>
              <span style={{ color: "var(--text-muted)" }}>{row.label}</span>
              <span className="font-600 capitalize" style={{ color: "var(--text-primary)" }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Mitigation Actions Tab ───────────────────────────────────────────────────

function MitigationTab({
  ew,
  workspaceId,
  userId,
  onUpdated,
}: {
  ew: EarlyWarning;
  workspaceId: string;
  userId: string;
  onUpdated: () => void;
}) {
  const [actions, setActions] = React.useState<MitigationAction[]>(ew.mitigation_actions ?? []);
  const [saving, setSaving] = React.useState(false);
  const [showAdd, setShowAdd] = React.useState(false);
  const [newText, setNewText] = React.useState("");
  const [newOwner, setNewOwner] = React.useState("");
  const [newDue, setNewDue] = React.useState("");

  async function persistActions(updated: MitigationAction[]) {
    setSaving(true);
    try {
      const supabase = createClient();
      await supabase
        .from("early_warnings")
        .update({ mitigation_actions: updated })
        .eq("id", ew.id);

      await createAuditEvent(supabase, {
        workspace_id: workspaceId,
        user_id: userId,
        action: "early_warning_mitigation_updated",
        resource_type: "early_warning",
        resource_id: ew.id,
        new_values: { mitigation_actions_count: updated.length },
      });

      setActions(updated);
      onUpdated();
    } catch {
      // silently handle
    } finally {
      setSaving(false);
    }
  }

  function addAction() {
    if (!newText.trim()) return;
    const updated: MitigationAction[] = [
      ...actions,
      { text: newText.trim(), owner: newOwner.trim(), due_date: newDue || undefined, status: "open" },
    ];
    void persistActions(updated);
    setNewText("");
    setNewOwner("");
    setNewDue("");
    setShowAdd(false);
  }

  function toggleStatus(idx: number) {
    const updated = actions.map((a, i) =>
      i === idx ? { ...a, status: a.status === "open" ? "complete" as const : "open" as const } : a
    );
    void persistActions(updated);
  }

  function removeAction(idx: number) {
    const updated = actions.filter((_, i) => i !== idx);
    void persistActions(updated);
  }

  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[13px] font-700" style={{ color: "var(--text-primary)" }}>
          Mitigation Actions
        </h3>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setShowAdd(true)}
        >
          <Plus className="w-4 h-4" />
          Add Action
        </button>
      </div>

      {actions.length === 0 && !showAdd && (
        <p className="text-[13px] text-center py-8" style={{ color: "var(--text-muted)" }}>
          No mitigation actions yet. Add one to start tracking risk reduction.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {actions.map((action, idx) => (
          <div
            key={idx}
            className={cn(
              "flex items-start gap-3 p-3 rounded-xl border",
              action.status === "complete" && "opacity-60"
            )}
            style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}
          >
            <button
              type="button"
              onClick={() => toggleStatus(idx)}
              className={cn(
                "w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors",
                action.status === "complete"
                  ? "border-green-500 bg-green-500"
                  : "border-[var(--border)]"
              )}
            >
              {action.status === "complete" && <Check className="w-3 h-3 text-white" />}
            </button>
            <div className="flex-1 min-w-0">
              <p
                className={cn("text-[13px] font-500", action.status === "complete" && "line-through")}
                style={{ color: "var(--text-primary)" }}
              >
                {action.text}
              </p>
              <div className="flex gap-3 mt-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
                {action.owner && <span>Owner: {action.owner}</span>}
                {action.due_date && <span><Calendar className="w-3 h-3 inline mr-0.5" />{action.due_date}</span>}
                <span className={cn("chip text-[10px]", action.status === "complete" ? "chip-success" : "chip-muted")}>
                  {action.status}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeAction(idx)}
              className="btn btn-ghost btn-icon btn-sm flex-shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {showAdd && (
        <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ borderColor: "var(--border)" }}>
          <div className="flex flex-col gap-1.5">
            <label className="form-label">Action</label>
            <input
              className="form-input"
              value={newText}
              onChange={e => setNewText(e.target.value)}
              placeholder="Describe the mitigation action…"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="form-label">Owner</label>
              <input className="form-input" value={newOwner} onChange={e => setNewOwner(e.target.value)} placeholder="Name…" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="form-label">Due Date</label>
              <input className="form-input" type="date" value={newDue} onChange={e => setNewDue(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>
              <X className="w-3.5 h-3.5" />Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={addAction}
              disabled={saving || !newText.trim()}
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Risk Reduction Meeting Tab ───────────────────────────────────────────────

function RRMTab({
  ew,
  workspaceId,
  userId,
  onUpdated,
}: {
  ew: EarlyWarning;
  workspaceId: string;
  userId: string;
  onUpdated: () => void;
}) {
  const [meetingDate, setMeetingDate] = React.useState(ew.risk_reduction_meeting_date ?? "");
  const [attendees, setAttendees] = React.useState(ew.risk_reduction_meeting_attendees ?? "");
  const [notes, setNotes] = React.useState(ew.risk_reduction_meeting_notes ?? "");
  const [saving, setSaving] = React.useState(false);

  async function save() {
    setSaving(true);
    try {
      const supabase = createClient();
      await supabase
        .from("early_warnings")
        .update({
          risk_reduction_meeting_date: meetingDate || null,
          risk_reduction_meeting_attendees: attendees || null,
          risk_reduction_meeting_notes: notes || null,
        })
        .eq("id", ew.id);

      await createAuditEvent(supabase, {
        workspace_id: workspaceId,
        user_id: userId,
        action: "early_warning_rrm_updated",
        resource_type: "early_warning",
        resource_id: ew.id,
        new_values: { meeting_date: meetingDate, attendees },
      });

      onUpdated();
    } catch {
      // silently handle
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-5 flex flex-col gap-5 max-w-2xl">
      <h3 className="text-[13px] font-700" style={{ color: "var(--text-primary)" }}>
        Risk Reduction Meeting
      </h3>

      <div className="flex flex-col gap-1.5">
        <label className="form-label">Next / Last Meeting Date</label>
        <input
          className="form-input"
          type="date"
          value={meetingDate}
          onChange={e => setMeetingDate(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="form-label">Attendees</label>
        <textarea
          className="form-input min-h-[80px] resize-y"
          value={attendees}
          onChange={e => setAttendees(e.target.value)}
          placeholder="List attendees, one per line…"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="form-label">Meeting Notes</label>
        <textarea
          className="form-input min-h-[120px] resize-y"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Record discussion, decisions, and actions from the meeting…"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="btn btn-primary btn-sm"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          Save Meeting Record
        </button>
      </div>
    </div>
  );
}

// ─── Linked CE Tab ────────────────────────────────────────────────────────────

function LinkedCETab({ ew }: { ew: EarlyWarning }) {
  const [ce, setCe] = React.useState<LinkedCE | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!ew.linked_ce_id) return;
    setLoading(true);
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("change_events")
          .select("id, ce_number, title, status, value")
          .eq("id", ew.linked_ce_id!)
          .single();
        if (data) setCe(data as LinkedCE);
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [ew.linked_ce_id]);

  if (!ew.linked_ce_id) {
    return (
      <div className="card p-8 text-center flex flex-col items-center gap-3">
        <AlertTriangle className="w-8 h-8 opacity-30" style={{ color: "var(--text-muted)" }} />
        <p className="text-[14px] font-600" style={{ color: "var(--text-primary)" }}>
          Not yet converted to Compensation Event
        </p>
        <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
          When this early warning materialises, convert it to a CE to track compensation.
        </p>
        <Link
          href={`/app/changes?ew=${ew.id}`}
          className="btn btn-primary btn-sm mt-2"
        >
          <ExternalLink className="w-4 h-4" />
          Convert to CE
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    );
  }

  if (!ce) {
    return (
      <div className="card p-6 text-center" style={{ color: "var(--text-muted)" }}>
        Linked CE not found.
      </div>
    );
  }

  return (
    <div className="card p-5 flex flex-col gap-4 max-w-lg">
      <h3 className="text-[13px] font-700" style={{ color: "var(--text-primary)" }}>Linked Compensation Event</h3>
      <div className="flex flex-col gap-2">
        {[
          { label: "CE Number", value: ce.ce_number },
          { label: "Title", value: ce.title },
          { label: "Status", value: ce.status },
          { label: "Value", value: ce.value != null ? `£${ce.value.toLocaleString()}` : "TBC" },
        ].map(row => (
          <div key={row.label} className="flex justify-between py-1.5 border-b last:border-0 text-[13px]" style={{ borderColor: "var(--border-subtle)" }}>
            <span style={{ color: "var(--text-muted)" }}>{row.label}</span>
            <span className="font-600" style={{ color: "var(--text-primary)" }}>{row.value}</span>
          </div>
        ))}
      </div>
      <Link href={`/app/changes/${ce.id}`} className="btn btn-secondary btn-sm self-start">
        <ExternalLink className="w-3.5 h-3.5" />
        Open CE
      </Link>
    </div>
  );
}

// ─── Audit Tab ────────────────────────────────────────────────────────────────

function AuditTab({ ewId }: { ewId: string }) {
  const [events, setEvents] = React.useState<AuditEvent[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("audit_events")
          .select("id, action, new_values, created_at, user_id")
          .eq("resource_type", "early_warning")
          .eq("resource_id", ewId)
          .order("created_at", { ascending: false })
          .limit(50);

        const mapped: AuditEvent[] = (data ?? []).map((e: Record<string, unknown>) => ({
          id: String(e.id),
          actor_name: "Team Member",
          action: String(e.action).replace(/_/g, " "),
          summary: e.new_values ? JSON.stringify(e.new_values) : "",
          created_at: String(e.created_at),
        }));
        setEvents(mapped);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [ewId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--text-muted)" }} />
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h3 className="text-[13px] font-700 mb-4" style={{ color: "var(--text-primary)" }}>Audit History</h3>
      <AuditFeed events={events} />
    </div>
  );
}

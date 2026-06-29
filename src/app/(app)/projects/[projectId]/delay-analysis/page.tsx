"use client";

import { FeatureGate } from "@/components/ui/feature-gate";
import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase/client";
import { getWorkspaceId } from "@/lib/workspace";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CalendarDays,
  Download,
  Plus,
  Trash2,
} from "lucide-react";
import { useParams } from "next/navigation";
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

type DelayCause =
  | "employer_risk"
  | "neutral_risk"
  | "force_majeure"
  | "contractor_risk";

type DelayStatus = "claimed" | "agreed" | "disputed" | "rejected";

interface DelayEvent {
  id: string;
  event_number: string;
  date: string;
  description: string;
  cause: DelayCause;
  days_claimed: number;
  days_agreed: number | null;
  status: DelayStatus;
  linked_ce_ref: string;
}

interface ProjectInfo {
  id: string;
  name: string;
  start_date: string | null;
  completion_date: string | null;
}

const CAUSE_LABELS: Record<DelayCause, string> = {
  employer_risk: "Employer Risk",
  neutral_risk: "Neutral Risk",
  force_majeure: "Force Majeure",
  contractor_risk: "Contractor Risk",
};

const STATUS_LABELS: Record<DelayStatus, string> = {
  claimed: "Claimed",
  agreed: "Agreed",
  disputed: "Disputed",
  rejected: "Rejected",
};

function addDays(dateStr: string | null, days: number): Date | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d;
}

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function uniqueId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function newEvent(seq: number): DelayEvent {
  return {
    id: uniqueId(),
    event_number: `DE-${String(seq).padStart(3, "0")}`,
    date: new Date().toISOString().split("T")[0],
    description: "",
    cause: "employer_risk",
    days_claimed: 0,
    days_agreed: null,
    status: "claimed",
    linked_ce_ref: "",
  };
}

function exportCSV(events: DelayEvent[], projectName: string) {
  const headers = [
    "Event No.",
    "Date",
    "Description",
    "Cause",
    "Days Claimed",
    "Days Agreed",
    "Status",
    "Linked CE",
  ];
  const rows = events.map((e) => [
    e.event_number,
    e.date,
    `"${e.description.replace(/"/g, '""')}"`,
    CAUSE_LABELS[e.cause],
    e.days_claimed,
    e.days_agreed ?? "",
    STATUS_LABELS[e.status],
    e.linked_ce_ref,
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `delay-analysis-${projectName.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DelayAnalysisPage() {
  return (
    <FeatureGate flag="delay_analysis">
      <DelayAnalysisContent />
    </FeatureGate>
  );
}

function DelayAnalysisContent() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = React.useState<ProjectInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [events, setEvents] = React.useState<DelayEvent[]>([]);

  const storageKey = `delay-events-${projectId}`;

  React.useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const supabase = createClient();
        const workspaceId = await getWorkspaceId(supabase);
        const { data } = await supabase
          .from("projects")
          .select("id, name, start_date, completion_date")
          .eq("id", projectId)
          .eq("workspace_id", workspaceId)
          .single();
        if (data) setProject(data as ProjectInfo);
      } catch {
        // silently ignore
      } finally {
        setLoading(false);
      }
    }
    void init();

    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setEvents(JSON.parse(stored) as DelayEvent[]);
      } catch {
        // corrupted — ignore
      }
    }
  }, [projectId, storageKey]);

  function save(updated: DelayEvent[]) {
    setEvents(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));
  }

  function addEvent() {
    const seq = events.length + 1;
    save([...events, newEvent(seq)]);
  }

  function updateEvent(
    id: string,
    field: keyof DelayEvent,
    value: string | number | null
  ) {
    save(events.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  }

  function removeEvent(id: string) {
    save(events.filter((e) => e.id !== id));
  }

  const totalClaimed = events.reduce((s, e) => s + e.days_claimed, 0);
  const totalAgreed = events.reduce(
    (s, e) => s + (e.days_agreed ?? 0),
    0
  );
  const origCompletionDate = project?.completion_date ?? null;
  const revisedCompletionDate = addDays(origCompletionDate, totalAgreed);

  const chartData = events.map((e) => ({
    name: e.event_number,
    claimed: e.days_claimed,
    agreed: e.days_agreed ?? 0,
    description: e.description,
    cause: CAUSE_LABELS[e.cause],
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="skeleton h-6 w-24 rounded" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <AlertTriangle className="w-8 h-8 text-amber-500" />
        <p style={{ color: "var(--text-muted)" }}>Project not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Delay Analysis — ${project.name}`}
        subtitle="Extension of Time register and delay event tracker"
        backHref={`/app/projects/${projectId}`}
        breadcrumbs={[
          { label: "Projects", href: "/app/projects" },
          { label: project.name, href: `/app/projects/${projectId}` },
          { label: "Delay Analysis" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => exportCSV(events, project.name)}
              disabled={events.length === 0}
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={addEvent}
            >
              <Plus className="w-4 h-4" />
              Add Delay Event
            </button>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          label="Original Completion"
          value={
            origCompletionDate
              ? new Date(origCompletionDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—"
          }
          icon={CalendarDays}
        />
        <SummaryCard
          label="EOT Claimed (days)"
          value={totalClaimed}
          variant={totalClaimed > 0 ? "warning" : "default"}
        />
        <SummaryCard
          label="EOT Agreed (days)"
          value={totalAgreed}
          variant={totalAgreed > 0 ? "success" : "default"}
        />
        <SummaryCard
          label="Revised Completion"
          value={fmtDate(revisedCompletionDate)}
          variant={totalAgreed > 0 ? "warning" : "default"}
        />
      </div>

      {events.length > 0 && (
        <div className="card p-5">
          <h3 className="text-[14px] font-700 mb-4" style={{ color: "var(--text-primary)" }}>
            Delay Event Chart
          </h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload as (typeof chartData)[0];
                  return (
                    <div
                      className="rounded-xl px-3 py-2 text-[12px] shadow-lg"
                      style={{
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <p className="font-700 mb-1">{d.name}</p>
                      <p className="text-[11px] mb-1" style={{ color: "var(--text-muted)" }}>
                        {d.description}
                      </p>
                      <p>Cause: {d.cause}</p>
                      <p>Claimed: <strong>{d.claimed}d</strong></p>
                      <p>Agreed: <strong>{d.agreed}d</strong></p>
                    </div>
                  );
                }}
              />
              <Legend />
              <Bar dataKey="claimed" name="Days Claimed" fill="var(--warning, #f59e0b)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="agreed" name="Days Agreed" fill="var(--success, #22c55e)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
          <h3 className="text-[14px] font-700" style={{ color: "var(--text-primary)" }}>
            Delay Events Register
          </h3>
          <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>
            {events.length} event{events.length !== 1 ? "s" : ""}
          </span>
        </div>

        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <CalendarDays className="w-8 h-8 opacity-30" />
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>
              No delay events recorded
            </p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={addEvent}
            >
              <Plus className="w-4 h-4" />
              Add First Event
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Event No.</th>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Cause</th>
                  <th className="text-right">Days Claimed</th>
                  <th className="text-right">Days Agreed</th>
                  <th>Status</th>
                  <th>Linked CE</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev) => (
                  <tr key={ev.id}>
                    <td>
                      <span
                        className="font-mono text-[12px] font-600"
                        style={{ color: "var(--primary)" }}
                      >
                        {ev.event_number}
                      </span>
                    </td>
                    <td>
                      <input
                        className="form-input h-8 text-[12px] w-32"
                        type="date"
                        value={ev.date}
                        onChange={(e) => updateEvent(ev.id, "date", e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="form-input h-8 text-[12px] w-48"
                        value={ev.description}
                        onChange={(e) => updateEvent(ev.id, "description", e.target.value)}
                        placeholder="Description…"
                      />
                    </td>
                    <td>
                      <select
                        className="form-input h-8 text-[12px]"
                        value={ev.cause}
                        onChange={(e) => updateEvent(ev.id, "cause", e.target.value)}
                      >
                        {(Object.keys(CAUSE_LABELS) as DelayCause[]).map((k) => (
                          <option key={k} value={k}>
                            {CAUSE_LABELS[k]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="text-right">
                      <input
                        className="form-input h-8 text-[12px] text-right w-20 tabular-nums"
                        type="number"
                        min={0}
                        value={ev.days_claimed}
                        onChange={(e) => updateEvent(ev.id, "days_claimed", parseInt(e.target.value) || 0)}
                      />
                    </td>
                    <td className="text-right">
                      <input
                        className="form-input h-8 text-[12px] text-right w-20 tabular-nums"
                        type="number"
                        min={0}
                        value={ev.days_agreed ?? ""}
                        onChange={(e) =>
                          updateEvent(
                            ev.id,
                            "days_agreed",
                            e.target.value ? parseInt(e.target.value) : null
                          )
                        }
                        placeholder="—"
                      />
                    </td>
                    <td>
                      <select
                        className={cn(
                          "form-input h-8 text-[12px]",
                          ev.status === "agreed" && "text-green-700",
                          ev.status === "disputed" && "text-amber-700",
                          ev.status === "rejected" && "text-red-700"
                        )}
                        value={ev.status}
                        onChange={(e) => updateEvent(ev.id, "status", e.target.value)}
                      >
                        {(Object.keys(STATUS_LABELS) as DelayStatus[]).map((k) => (
                          <option key={k} value={k}>
                            {STATUS_LABELS[k]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className="form-input h-8 text-[12px] w-24"
                        value={ev.linked_ce_ref}
                        onChange={(e) => updateEvent(ev.id, "linked_ce_ref", e.target.value)}
                        placeholder="CE ref…"
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon btn-sm text-red-500"
                        onClick={() => removeEvent(ev.id)}
                        title="Remove event"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid var(--border)" }}>
                  <td colSpan={4} className="font-700 text-[13px]">
                    Totals
                  </td>
                  <td className="text-right font-700 tabular-nums text-amber-700">
                    {totalClaimed}d
                  </td>
                  <td className="text-right font-700 tabular-nums text-green-700">
                    {totalAgreed}d
                  </td>
                  <td colSpan={3}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      <div className="card p-5">
        <h3 className="text-[14px] font-700 mb-4" style={{ color: "var(--text-primary)" }}>
          EOT Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-[13px]">
          <SummaryRow
            label="Original Completion Date"
            value={
              origCompletionDate
                ? new Date(origCompletionDate).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })
                : "Not set"
            }
          />
          <SummaryRow label="Total EOT Claimed" value={`${totalClaimed} days`} />
          <SummaryRow
            label="Total EOT Agreed"
            value={`${totalAgreed} days`}
            highlight={totalAgreed > 0 ? "success" : undefined}
          />
          <SummaryRow
            label="Revised Completion Date"
            value={fmtDate(revisedCompletionDate)}
            highlight={totalAgreed > 0 ? "warning" : undefined}
          />
          <SummaryRow
            label="Net Programme Overrun"
            value={`${Math.max(0, totalClaimed - totalAgreed)} days uncertified`}
          />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  variant = "default",
}: {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: "default" | "warning" | "success" | "danger";
}) {
  const borderColor =
    variant === "warning"
      ? "border-l-amber-500"
      : variant === "success"
      ? "border-l-green-500"
      : variant === "danger"
      ? "border-l-red-500"
      : "border-l-[var(--primary)]";

  return (
    <div
      className={cn("rounded-xl border border-l-4 p-4 flex flex-col gap-2", borderColor)}
      style={{ borderColor: "var(--border)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[12px] font-500 leading-none" style={{ color: "var(--text-muted)" }}>
          {label}
        </span>
        {Icon && <Icon className="w-4 h-4" />}
      </div>
      <div className="text-xl font-700 leading-tight" style={{ color: "var(--text-primary)" }}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "success" | "warning";
}) {
  return (
    <div
      className="rounded-xl p-3"
      style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}
    >
      <p className="text-[11px] font-600 uppercase tracking-[0.05em] mb-0.5" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p
        className={cn(
          "text-[13px] font-600",
          highlight === "success" ? "text-green-700" : highlight === "warning" ? "text-amber-700" : ""
        )}
        style={highlight ? undefined : { color: "var(--text-primary)" }}
      >
        {value}
      </p>
    </div>
  );
}

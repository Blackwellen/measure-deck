"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Download, Filter, MoreHorizontal,
  CheckCircle2, ChevronRight, Image as ImageIcon, AlertCircle,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { getWorkspaceId } from "@/lib/workspace";
import { createAuditEvent } from "@/lib/audit";
import { FeatureGate } from "@/components/ui/feature-gate";
import { KpiCard } from "@/components/ui/kpi-card";
import { SnagWizard } from "@/components/wizards/snag-wizard";
import { cn, formatDate, getInitials } from "@/lib/utils";

type SnagStatus = "open" | "in_progress" | "awaiting_inspection" | "closed";
type SnagPriority = "P1-Critical" | "P2-High" | "P3-Medium" | "P4-Low";

interface SnagItem {
  id: string;
  snag_number: string;
  location: string;
  description: string;
  trade: string;
  priority: SnagPriority;
  status: SnagStatus;
  assignee?: string;
  target_date?: string;
  photo_paths?: string[];
  reported_at: string;
  resolved_at?: string;
}

const STATUS_CHIP: Record<SnagStatus, string> = {
  open: "chip-danger",
  in_progress: "chip-warning",
  awaiting_inspection: "chip-info",
  closed: "chip-success",
};

const STATUS_LABEL: Record<SnagStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  awaiting_inspection: "Awaiting Inspection",
  closed: "Closed",
};

const PRIORITY_CHIP: Record<SnagPriority, string> = {
  "P1-Critical": "chip-danger",
  "P2-High": "chip-warning",
  "P3-Medium": "chip-info",
  "P4-Low": "chip-muted",
};

function SnagMobileCard({
  snag,
  onClick,
  onClose,
}: {
  snag: SnagItem;
  onClick: () => void;
  onClose: (id: string) => void;
}) {
  return (
    <div
      className="card p-4 flex flex-col gap-2 cursor-pointer hover:shadow-[var(--shadow-md)] transition-shadow"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="font-mono text-xs font-semibold"
            style={{ color: "var(--primary)" }}
          >
            {snag.snag_number}
          </span>
          <span className={cn("badge", PRIORITY_CHIP[snag.priority])}>
            {snag.priority}
          </span>
          <span className={cn("badge", STATUS_CHIP[snag.status])}>
            {STATUS_LABEL[snag.status]}
          </span>
        </div>
        {snag.photo_paths && snag.photo_paths.length > 0 && (
          <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-muted)" }}>
            <ImageIcon size={12} />{snag.photo_paths.length}
          </span>
        )}
      </div>

      <p
        className="text-sm font-medium line-clamp-2"
        style={{ color: "var(--text-primary)" }}
      >
        {snag.description}
      </p>

      <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
        <span>{snag.location}</span>
        <span>{snag.trade}</span>
      </div>

      {snag.assignee && (
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
            style={{ background: "var(--primary)" }}
          >
            {getInitials(snag.assignee)}
          </div>
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {snag.assignee}
          </span>
          {snag.target_date && (
            <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>
              Due {formatDate(snag.target_date)}
            </span>
          )}
        </div>
      )}

      {snag.status !== "closed" && (
        <button
          className="btn btn-secondary btn-sm text-xs self-start mt-1"
          onClick={e => {
            e.stopPropagation();
            onClose(snag.id);
          }}
        >
          <CheckCircle2 size={12} />
          Mark Closed
        </button>
      )}
    </div>
  );
}

export default function SnaggingRegisterPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [snags, setSnags] = useState<SnagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [showWizard, setShowWizard] = useState(false);
  const [projectName, setProjectName] = useState<string>("");

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<SnagStatus | "">("");
  const [filterTrade, setFilterTrade] = useState<string>("");
  const [filterPriority, setFilterPriority] = useState<SnagPriority | "">("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const wid = await getWorkspaceId(supabase);
      const { data: { user } } = await supabase.auth.getUser();
      setWorkspaceId(wid);
      setUserId(user?.id ?? "");

      const { data: proj } = await supabase
        .from("projects")
        .select("name")
        .eq("id", projectId)
        .single();
      if (proj) setProjectName((proj as { name: string }).name);

      const { data } = await supabase
        .from("snagging_items")
        .select("*")
        .eq("project_id", projectId)
        .eq("workspace_id", wid)
        .order("reported_at", { ascending: false });

      setSnags((data ?? []) as SnagItem[]);
    } catch {
      setSnags([]);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    return snags.filter(s => {
      if (filterStatus && s.status !== filterStatus) return false;
      if (filterTrade && s.trade !== filterTrade) return false;
      if (filterPriority && s.priority !== filterPriority) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !s.description.toLowerCase().includes(q) &&
          !s.location.toLowerCase().includes(q) &&
          !s.snag_number.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [snags, filterStatus, filterTrade, filterPriority, searchQuery]);

  const totals = useMemo(() => {
    const total = snags.length;
    const open = snags.filter(s => s.status === "open").length;
    const inProgress = snags.filter(s => s.status === "in_progress").length;
    const closed = snags.filter(s => s.status === "closed").length;
    return { total, open, inProgress, closed };
  }, [snags]);

  const closedPct = totals.total > 0
    ? Math.round((totals.closed / totals.total) * 100)
    : 0;

  const uniqueTrades = useMemo(() => {
    return Array.from(new Set(snags.map(s => s.trade)));
  }, [snags]);

  async function closeSnag(snagId: string, note = "Marked as resolved.") {
    try {
      const supabase = createClient();
      await supabase
        .from("snagging_items")
        .update({ status: "closed", resolved_at: new Date().toISOString() })
        .eq("id", snagId);

      await createAuditEvent(supabase, {
        workspace_id: workspaceId,
        user_id: userId,
        action: "snag_closed",
        resource_type: "snagging_item",
        resource_id: snagId,
        new_values: { status: "closed", note },
      });

      setSnags(prev =>
        prev.map(s =>
          s.id === snagId
            ? { ...s, status: "closed" as SnagStatus, resolved_at: new Date().toISOString() }
            : s
        )
      );
      toast.success("Snag marked as closed.");
    } catch {
      toast.error("Failed to close snag.");
    }
  }

  async function bulkClose() {
    for (const id of selectedIds) {
      await closeSnag(id);
    }
    setSelectedIds(new Set());
    toast.success(`${selectedIds.size} snag(s) closed.`);
  }

  function exportCsv() {
    const headers = [
      "Snag No",
      "Description",
      "Location",
      "Trade",
      "Priority",
      "Status",
      "Assignee",
      "Target Date",
      "Reported",
    ];
    const rows = filtered.map(s => [
      s.snag_number,
      `"${s.description.replace(/"/g, '""')}"`,
      s.location,
      s.trade,
      s.priority,
      s.status,
      s.assignee ?? "",
      s.target_date ?? "",
      s.reported_at ? new Date(s.reported_at).toLocaleDateString("en-GB") : "",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `snag-register-${projectId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div className="skeleton h-8 w-48 rounded-[var(--radius)]" />
        <div className="skeleton h-32 rounded-[var(--radius)]" />
        <div className="skeleton h-64 rounded-[var(--radius)]" />
      </div>
    );
  }

  return (
    <FeatureGate flag="pc_snagging">
      <div className="flex flex-col min-h-full">
        <div className="page-header flex-col items-start gap-4">
          <button
            className="btn btn-ghost btn-sm text-xs"
            style={{ color: "var(--text-muted)" }}
            onClick={() => router.push(`/app/projects/${projectId}`)}
          >
            <ArrowLeft size={13} />
            Back to Project
          </button>

          <div className="flex items-start justify-between w-full gap-4 flex-wrap">
            <div>
              <h1
                className="text-xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Snagging Register
              </h1>
              {projectName && (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {projectName}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                className="btn btn-secondary btn-sm"
                onClick={exportCsv}
              >
                <Download size={14} />
                Export CSV
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowWizard(true)}
              >
                <Plus size={14} />
                Add Snag
              </button>
            </div>
          </div>
        </div>

        <div className="page-content flex-1 flex flex-col gap-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="Total Snags" value={totals.total} variant="default" />
            <KpiCard label="Open" value={totals.open} variant="danger" />
            <KpiCard label="In Progress" value={totals.inProgress} variant="warning" />
            <KpiCard label="Closed" value={totals.closed} variant="success" />
          </div>

          <div className="card p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Completion Progress
              </p>
              <p
                className="text-xs font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {closedPct}% closed
              </p>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: "var(--bg-muted)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${closedPct}%`,
                  background:
                    closedPct === 100
                      ? "var(--success)"
                      : closedPct >= 50
                      ? "var(--primary)"
                      : "var(--warning)",
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[180px]">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type="text"
                className="form-input h-8 text-sm pl-8 w-full"
                placeholder="Search snags…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="form-input h-8 text-sm w-auto"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value as SnagStatus | "")}
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="awaiting_inspection">Awaiting Inspection</option>
              <option value="closed">Closed</option>
            </select>

            <select
              className="form-input h-8 text-sm w-auto"
              value={filterTrade}
              onChange={e => setFilterTrade(e.target.value)}
            >
              <option value="">All Trades</option>
              {uniqueTrades.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <select
              className="form-input h-8 text-sm w-auto"
              value={filterPriority}
              onChange={e => setFilterPriority(e.target.value as SnagPriority | "")}
            >
              <option value="">All Priorities</option>
              <option value="P1-Critical">P1 · Critical</option>
              <option value="P2-High">P2 · High</option>
              <option value="P3-Medium">P3 · Medium</option>
              <option value="P4-Low">P4 · Low</option>
            </select>
          </div>

          {selectedIds.size > 0 && (
            <div
              className="rounded-xl p-3 flex items-center gap-3 flex-wrap"
              style={{ background: "var(--primary)18", border: "1px solid var(--primary)" }}
            >
              <span className="text-sm font-semibold" style={{ color: "var(--primary)" }}>
                {selectedIds.size} selected
              </span>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => void bulkClose()}
              >
                <CheckCircle2 size={13} />
                Mark Closed
              </button>
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => setSelectedIds(new Set())}
              >
                Clear
              </button>
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-icon">
                  <AlertCircle size={22} />
                </div>
                <h3 className="text-base font-semibold">
                  {snags.length === 0 ? "No Snags Recorded" : "No Results"}
                </h3>
                <p
                  className="text-sm max-w-xs"
                  style={{ color: "var(--text-muted)" }}
                >
                  {snags.length === 0
                    ? "Add your first snag to start tracking defects."
                    : "Try adjusting your filters."}
                </p>
                {snags.length === 0 && (
                  <button
                    className="btn btn-primary btn-sm mt-2"
                    onClick={() => setShowWizard(true)}
                  >
                    <Plus size={14} />
                    Add First Snag
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="card overflow-hidden hidden md:block">
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="w-8">
                          <input
                            type="checkbox"
                            checked={
                              selectedIds.size === filtered.length && filtered.length > 0
                            }
                            onChange={e => {
                              if (e.target.checked) {
                                setSelectedIds(new Set(filtered.map(s => s.id)));
                              } else {
                                setSelectedIds(new Set());
                              }
                            }}
                          />
                        </th>
                        <th>Snag No</th>
                        <th>Description</th>
                        <th>Location</th>
                        <th>Trade</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Target</th>
                        <th>Assigned</th>
                        <th>Photo</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(snag => (
                        <tr
                          key={snag.id}
                          className="cursor-pointer hover:bg-[var(--bg-subtle)] transition-colors"
                          onClick={() =>
                            router.push(`/app/projects/${projectId}/snagging/${snag.id}`)
                          }
                        >
                          <td
                            onClick={e => {
                              e.stopPropagation();
                              toggleSelect(snag.id);
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedIds.has(snag.id)}
                              onChange={() => toggleSelect(snag.id)}
                            />
                          </td>
                          <td>
                            <span
                              className="font-mono text-xs font-semibold"
                              style={{ color: "var(--primary)" }}
                            >
                              {snag.snag_number}
                            </span>
                          </td>
                          <td>
                            <span className="text-sm line-clamp-2 max-w-[200px] block">
                              {snag.description}
                            </span>
                          </td>
                          <td className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {snag.location}
                          </td>
                          <td>
                            <span className="badge chip-muted text-xs">{snag.trade}</span>
                          </td>
                          <td>
                            <span className={cn("badge", PRIORITY_CHIP[snag.priority])}>
                              {snag.priority}
                            </span>
                          </td>
                          <td>
                            <span className={cn("badge", STATUS_CHIP[snag.status])}>
                              {STATUS_LABEL[snag.status]}
                            </span>
                          </td>
                          <td className="text-xs" style={{ color: "var(--text-muted)" }}>
                            {snag.target_date ? formatDate(snag.target_date) : "—"}
                          </td>
                          <td className="text-xs" style={{ color: "var(--text-secondary)" }}>
                            {snag.assignee ?? "—"}
                          </td>
                          <td>
                            {snag.photo_paths && snag.photo_paths.length > 0 && (
                              <span
                                className="flex items-center gap-1 text-xs"
                                style={{ color: "var(--text-muted)" }}
                              >
                                <ImageIcon size={12} />
                                {snag.photo_paths.length}
                              </span>
                            )}
                          </td>
                          <td>
                            <button
                              className="btn btn-ghost btn-icon btn-sm"
                              onClick={e => {
                                e.stopPropagation();
                                router.push(
                                  `/app/projects/${projectId}/snagging/${snag.id}`
                                );
                              }}
                            >
                              <ChevronRight size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex flex-col gap-3 md:hidden">
                {filtered.map(snag => (
                  <SnagMobileCard
                    key={snag.id}
                    snag={snag}
                    onClick={() =>
                      router.push(`/app/projects/${projectId}/snagging/${snag.id}`)
                    }
                    onClose={id => void closeSnag(id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {showWizard && (
          <SnagWizard
            projectId={projectId}
            onClose={() => setShowWizard(false)}
            onCreated={() => void load()}
          />
        )}
      </div>
    </FeatureGate>
  );
}

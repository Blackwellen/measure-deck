"use client";

import { useState } from "react";
import {
  Download, Eye, Share2, Search, Filter,
  FileText, Calendar, Users, Clock, CheckCircle2,
  BarChart3, FileBarChart, Presentation, Zap,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { KpiCard } from "@/components/ui/kpi-card";

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportStatus = "Published" | "Draft" | "Approved";
type ScheduledFrequency = "Weekly" | "Monthly" | "On change";

interface GeneratedReport {
  id: string;
  name: string;
  type: string;
  generated: string;
  period: string;
  status: ReportStatus;
  size: string;
}

interface ScheduledReport {
  id: string;
  name: string;
  frequency: ScheduledFrequency;
  nextRun: string;
  recipients: number;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const GENERATED_REPORTS: GeneratedReport[] = [
  {
    id: "gr-001",
    name: "Monthly Commercial Report – April 2025",
    type: "Commercial",
    generated: "2025-05-01",
    period: "April 2025",
    status: "Published",
    size: "1.2 MB",
  },
  {
    id: "gr-002",
    name: "CVR Report – Q1 2025",
    type: "CVR",
    generated: "2025-04-15",
    period: "Q1 2025",
    status: "Published",
    size: "890 KB",
  },
  {
    id: "gr-003",
    name: "Application Summary #8",
    type: "Application",
    generated: "2025-04-28",
    period: "Apr 2025",
    status: "Draft",
    size: "445 KB",
  },
  {
    id: "gr-004",
    name: "Board Pack – April 2025",
    type: "Board Pack",
    generated: "2025-05-02",
    period: "April 2025",
    status: "Approved",
    size: "3.4 MB",
  },
  {
    id: "gr-005",
    name: "Change Register Export",
    type: "Change Register",
    generated: "2025-04-30",
    period: "Full",
    status: "Published",
    size: "234 KB",
  },
  {
    id: "gr-006",
    name: "Risk Register – Q1",
    type: "Risk",
    generated: "2025-04-15",
    period: "Q1 2025",
    status: "Approved",
    size: "567 KB",
  },
  {
    id: "gr-007",
    name: "Programme Baseline v3",
    type: "Schedule",
    generated: "2025-03-20",
    period: "Full",
    status: "Published",
    size: "1.8 MB",
  },
  {
    id: "gr-008",
    name: "Delay Analysis Report",
    type: "Delay",
    generated: "2025-03-05",
    period: "Feb 2025",
    status: "Published",
    size: "2.3 MB",
  },
];

const SCHEDULED_REPORTS: ScheduledReport[] = [
  {
    id: "sr-001",
    name: "Weekly Commercial",
    frequency: "Weekly",
    nextRun: "Mon 06:00",
    recipients: 3,
  },
  {
    id: "sr-002",
    name: "Monthly Board Pack",
    frequency: "Monthly",
    nextRun: "1st of month",
    recipients: 5,
  },
  {
    id: "sr-003",
    name: "Change Register",
    frequency: "On change",
    nextRun: "Immediate",
    recipients: 2,
  },
];

const STATUS_CLASS: Record<ReportStatus, string> = {
  Published: "chip-success",
  Draft: "chip-muted",
  Approved: "chip-info",
};

const FREQ_CLASS: Record<ScheduledFrequency, string> = {
  Weekly: "chip-info",
  Monthly: "chip-success",
  "On change": "chip-warning",
};

function typeIcon(type: string) {
  switch (type) {
    case "CVR":
    case "Commercial":
      return <BarChart3 size={13} />;
    case "Board Pack":
      return <Presentation size={13} />;
    case "Application":
      return <FileText size={13} />;
    case "Delay":
      return <Clock size={13} />;
    default:
      return <FileBarChart size={13} />;
  }
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProjectReportsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const types = ["All Types", ...Array.from(new Set(GENERATED_REPORTS.map((r) => r.type)))];
  const statuses = ["All Statuses", "Published", "Draft", "Approved"];

  const filtered = GENERATED_REPORTS.filter((r) => {
    const matchSearch =
      search === "" || r.name.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "All Types" || r.type === typeFilter;
    const matchStatus = statusFilter === "All Statuses" || r.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const totalReports = GENERATED_REPORTS.length;
  const thisMonth = GENERATED_REPORTS.filter((r) =>
    r.generated.startsWith("2025-05")
  ).length;
  const pendingApproval = GENERATED_REPORTS.filter((r) => r.status === "Draft").length;

  return (
    <div className="flex flex-col gap-6">
      {/* ── KPI strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          label="Total Reports"
          value={totalReports}
          change="All time"
          variant="default"
        />
        <KpiCard
          label="This Month"
          value={thisMonth}
          change="May 2025"
          trend="up"
          variant="success"
        />
        <KpiCard
          label="Pending Approval"
          value={pendingApproval}
          change={pendingApproval > 0 ? "Requires review" : "All clear"}
          variant={pendingApproval > 0 ? "warning" : "default"}
        />
      </div>

      {/* ── Generated reports ── */}
      <div className="card flex flex-col gap-0 overflow-hidden">
        {/* Card header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b flex-wrap gap-3"
          style={{ borderColor: "var(--border)" }}
        >
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Generated Reports
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                className="form-input pl-7 text-sm"
                placeholder="Search reports…"
                style={{ width: 180 }}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            {/* Type */}
            <div className="relative">
              <Filter
                size={11}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--text-muted)" }}
              />
              <select
                className="form-input pl-6 pr-7 text-sm"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                {types.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            {/* Status */}
            <select
              className="form-input text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Report Name</th>
                <th>Type</th>
                <th>Generated</th>
                <th>Period</th>
                <th>Status</th>
                <th>Size</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="text-center py-10"
                    style={{ color: "var(--text-muted)" }}
                  >
                    No reports match your filters.
                  </td>
                </tr>
              )}
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-[var(--bg-muted)] transition-colors">
                  <td>
                    <div className="flex items-center gap-2">
                      <span style={{ color: "var(--text-muted)" }}>
                        {typeIcon(r.type)}
                      </span>
                      <span
                        className="font-medium text-sm"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {r.name}
                      </span>
                    </div>
                  </td>
                  <td className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {r.type}
                  </td>
                  <td className="text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                    {formatDate(r.generated)}
                  </td>
                  <td className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {r.period}
                  </td>
                  <td>
                    <span className={cn("badge", STATUS_CLASS[r.status])}>
                      {r.status === "Approved" && (
                        <CheckCircle2 size={10} className="inline mr-0.5" />
                      )}
                      {r.status}
                    </span>
                  </td>
                  <td className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {r.size}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button className="btn btn-ghost btn-icon" title="Download">
                        <Download size={13} />
                      </button>
                      <button className="btn btn-ghost btn-icon" title="View">
                        <Eye size={13} />
                      </button>
                      <button className="btn btn-ghost btn-icon" title="Share">
                        <Share2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          className="px-5 py-2.5 border-t flex items-center justify-between"
          style={{ borderColor: "var(--border)", background: "var(--bg-muted)" }}
        >
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {filtered.length} of {GENERATED_REPORTS.length} reports
          </span>
        </div>
      </div>

      {/* ── Schedule Reports ── */}
      <div className="card flex flex-col gap-0 overflow-hidden">
        {/* Board Pack generator */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b flex-wrap gap-3"
          style={{ borderColor: "var(--border)" }}
        >
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Board Pack Generator
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Compile a board-ready commercial summary from current project data.
            </p>
          </div>
          <button className="btn btn-primary btn-sm flex items-center gap-1.5">
            <Presentation size={13} />
            Generate Board Pack
          </button>
        </div>

        {/* Section label */}
        <div
          className="px-5 py-3 border-b flex items-center gap-2"
          style={{ borderColor: "var(--border)", background: "var(--bg-muted)" }}
        >
          <Zap size={13} style={{ color: "var(--primary)" }} />
          <h4 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Auto-Report Schedule
          </h4>
        </div>

        {/* Scheduled table */}
        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Report Name</th>
                <th>Frequency</th>
                <th>Next Run</th>
                <th>Recipients</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {SCHEDULED_REPORTS.map((s) => (
                <tr key={s.id} className="hover:bg-[var(--bg-muted)] transition-colors">
                  <td>
                    <div className="flex items-center gap-2">
                      <Calendar size={13} style={{ color: "var(--text-muted)" }} />
                      <span
                        className="font-medium text-sm"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {s.name}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className={cn("badge", FREQ_CLASS[s.frequency])}>
                      {s.frequency}
                    </span>
                  </td>
                  <td className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {s.nextRun}
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <Users size={12} style={{ color: "var(--text-muted)" }} />
                      <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        {s.recipients} recipient{s.recipients !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        className="btn btn-ghost btn-sm text-xs"
                        style={{ color: "var(--primary)" }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-ghost btn-sm text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Pause
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          className="px-5 py-2.5 border-t"
          style={{ borderColor: "var(--border)", background: "var(--bg-muted)" }}
        >
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>
            {SCHEDULED_REPORTS.length} scheduled reports active
          </span>
        </div>
      </div>
    </div>
  );
}

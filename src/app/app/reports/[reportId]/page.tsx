"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Download, Share2, RefreshCw, Archive, Plus,
  X, Check, Clock, User, FileText, Database, Send,
  Settings, Trash2, Eye, ChevronDown, ChevronUp,
  Loader2, AlertCircle, BarChart2, List, BookOpen,
  RotateCcw, Copy, History,
} from "lucide-react";
import { cn, formatDate, formatDateTime, formatRelative, getInitials } from "@/lib/utils";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  SEED_REPORTS, REPORT_TYPE_COLOURS, STATUS_CHIP,
  type SeedReport,
} from "@/lib/seed/reports";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "overview" | "content" | "data-sources" | "distribution" | "versions" | "settings" | "audit";

interface Recipient {
  id: string; name: string; email: string; sent_date: string;
  opened: boolean; notes: string;
}

interface Version {
  id: string; version: string; generated_date: string;
  generated_by: string; changes: string;
}

interface AuditEntry {
  id: string; timestamp: string; user: string; action: string; detail: string;
}

// ─── Seed helpers ─────────────────────────────────────────────────────────────

const SEED_RECIPIENTS: Recipient[] = [
  { id: "rc1", name: "David Thornton",  email: "d.thornton@arcadia.co.uk",    sent_date: "2026-06-09T11:00:00Z", opened: true,  notes: "Main client contact" },
  { id: "rc2", name: "Harriet James",   email: "h.james@qsconsult.co.uk",     sent_date: "2026-06-09T11:00:00Z", opened: true,  notes: "Client QS" },
  { id: "rc3", name: "Mark O'Sullivan", email: "m.osullivan@pm-services.com",  sent_date: "2026-06-09T11:05:00Z", opened: false, notes: "Project manager — awaiting confirmation" },
];

const SEED_VERSIONS: Version[] = [
  { id: "v3", version: "v3", generated_date: "2026-06-09T10:00:00Z", generated_by: "Rachel Okafor", changes: "Updated CVR values for Period 7, corrected risk register entries" },
  { id: "v2", version: "v2", generated_date: "2026-06-02T14:30:00Z", generated_by: "Rachel Okafor", changes: "Added Programme Update section, revised executive summary" },
  { id: "v1", version: "v1", generated_date: "2026-05-28T09:15:00Z", generated_by: "James Walsh",   changes: "Initial generation" },
];

const SEED_DATA_SOURCES = [
  { label: "Project Data",        table: "projects",           records: 1,  last_sync: "2026-06-09T10:00:00Z", status: "live" as const },
  { label: "CVR Periods",         table: "cvr_periods",        records: 8,  last_sync: "2026-06-01T10:00:00Z", status: "live" as const },
  { label: "Applications",        table: "applications",       records: 14, last_sync: "2026-05-23T11:00:00Z", status: "live" as const },
  { label: "Change Events",       table: "change_events",      records: 22, last_sync: "2026-06-09T10:00:00Z", status: "live" as const },
  { label: "Risk Register",       table: "risk_register",      records: 9,  last_sync: "2026-06-05T09:00:00Z", status: "live" as const },
  { label: "Evidence Files",      table: "evidence_files",     records: 31, last_sync: "2026-06-02T14:00:00Z", status: "live" as const },
  { label: "Schedule Items",      table: "schedule_items",     records: 47, last_sync: "2026-06-09T10:00:00Z", status: "live" as const },
];

const SEED_AUDIT: AuditEntry[] = [
  { id: "au1", timestamp: "2026-06-09T10:00:00Z", user: "Rachel Okafor", action: "Report generated", detail: "Version v3 — 5 sections, 47 data records pulled" },
  { id: "au2", timestamp: "2026-06-09T10:42:00Z", user: "Rachel Okafor", action: "Exported to PDF",   detail: "Full report exported as PDF (2.4 MB)" },
  { id: "au3", timestamp: "2026-06-09T11:00:00Z", user: "Rachel Okafor", action: "Distributed",       detail: "Sent to 3 recipients" },
  { id: "au4", timestamp: "2026-06-09T14:15:00Z", user: "David Thornton", action: "Opened report",   detail: "Recipient opened secure share link" },
  { id: "au5", timestamp: "2026-06-02T14:30:00Z", user: "Rachel Okafor", action: "Report generated", detail: "Version v2 — Programme section added" },
  { id: "au6", timestamp: "2026-05-28T09:15:00Z", user: "James Walsh",   action: "Report created",   detail: "Version v1 — Initial generation" },
];

// ─── Section content map ──────────────────────────────────────────────────────

const SECTION_CONTENT: Record<string, { icon: React.ReactNode; description: string; rows?: { label: string; value: string }[] }> = {
  "Executive Summary": {
    icon: <BookOpen size={16} />,
    description: "Period 7 commercial position reflects continued overrun risk on groundworks package. Predicted final cost is £4.82M against a contract sum of £4.55M, a variance of +£270K (5.9%). Key risk items remain under negotiation.",
    rows: [
      { label: "Contract Sum",       value: "£4,550,000" },
      { label: "Predicted Final Cost", value: "£4,820,000" },
      { label: "Variance",           value: "+£270,000 (+5.9%)" },
      { label: "Applications to Date", value: "£3,218,500" },
      { label: "Certified to Date",   value: "£3,090,000" },
    ],
  },
  "KPI Grid": {
    icon: <BarChart2 size={16} />,
    description: "Commercial KPIs for the current period showing CVR movement, application status, and change event pipeline.",
    rows: [
      { label: "CVR %",            value: "92.4%" },
      { label: "Change Events Open", value: "7" },
      { label: "EoT Applied",      value: "14 days" },
      { label: "Retention Held",   value: "£45,500" },
    ],
  },
  "CVR Movement Chart": {
    icon: <BarChart2 size={16} />,
    description: "Period-by-period CVR movement showing planned vs actual cost performance over the life of the project.",
  },
  "Cost Table": {
    icon: <List size={16} />,
    description: "Detailed cost breakdown by trade package including original budget, current forecast and variance.",
    rows: [
      { label: "Groundworks",       value: "£920,000 / £1,085,000" },
      { label: "Structural Frame",  value: "£1,250,000 / £1,250,000" },
      { label: "MEP Services",      value: "£880,000 / £910,000" },
      { label: "Fit-out & Finishes", value: "£740,000 / £758,000" },
      { label: "Preliminaries",     value: "£330,000 / £330,000" },
    ],
  },
  "Risk Register": {
    icon: <AlertCircle size={16} />,
    description: "Current risk register snapshot showing 9 active risk items with probability and impact ratings.",
    rows: [
      { label: "High Risk Items",   value: "2" },
      { label: "Medium Risk Items", value: "5" },
      { label: "Low Risk Items",    value: "2" },
      { label: "Total Risk Value",  value: "£142,000" },
    ],
  },
};

const TABS: { id: Tab; label: string }[] = [
  { id: "overview",     label: "Overview" },
  { id: "content",      label: "Content" },
  { id: "data-sources", label: "Data Sources" },
  { id: "distribution", label: "Distribution" },
  { id: "versions",     label: "Versions" },
  { id: "settings",     label: "Settings" },
  { id: "audit",        label: "Audit" },
];

// ─── Tab: Overview ────────────────────────────────────────────────────────────

function OverviewTab({ report, typeMeta }: { report: SeedReport; typeMeta: { chip: string; accent: string } }) {
  const [confirming, setConfirming] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  async function handleRegenerate() {
    setConfirming(false);
    setRegenerating(true);
    await new Promise(r => setTimeout(r, 2500));
    setRegenerating(false);
    toast.success("Report regenerated successfully");
  }

  return (
    <div className="p-6 space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Report summary */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: typeMeta.accent }}>
                MD
              </div>
              <div>
                <h3 className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>{report.title}</h3>
                <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                  {report.projectName ?? "All Projects"} {report.projectRef ? `· ${report.projectRef}` : ""}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={cn("badge", typeMeta.chip)}>{report.type}</span>
                  <span className={cn("badge", STATUS_CHIP[report.status] ?? "chip-muted")}>{report.status}</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>
                Report Contents
              </p>
              <div className="flex flex-wrap gap-2">
                {report.sections.map(s => (
                  <span key={s} className="badge chip-muted text-xs">{s}</span>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-100 mt-4 pt-4 grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Generated By</p>
                <p className="font-medium mt-0.5">{report.generatedBy}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Generated</p>
                <p className="font-medium mt-0.5">{formatDate(report.generatedDate)}</p>
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>Exports / Shares</p>
                <p className="font-medium mt-0.5">{report.exportCount} exports · {report.shareCount} shares</p>
              </div>
            </div>
          </div>

          {/* Generation parameters */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-semibold text-sm mb-4">Generation Parameters</h3>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              {[
                { label: "Report Type",    value: report.type },
                { label: "Project",        value: report.projectName ?? "All Projects" },
                { label: "Sections",       value: `${report.sections.length} sections` },
                { label: "Scheduled",      value: report.isScheduled ? `Yes — ${report.scheduleFrequency}` : "No" },
                { label: "Next Run",       value: report.nextScheduledDate ? formatDate(report.nextScheduledDate) : "—" },
                { label: "Data Sources",   value: `${SEED_DATA_SOURCES.length} active sources` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</dt>
                  <dd className="font-medium mt-0.5">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Right: Actions + generation history */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-semibold text-sm mb-3">Quick Actions</h3>
            <div className="flex flex-col gap-2">
              {confirming ? (
                <div className="p-3 rounded-xl" style={{ background: "var(--warning-bg)" }}>
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--warning)" }}>Regenerate report?</p>
                  <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>This will pull fresh data and overwrite the current version.</p>
                  <div className="flex gap-2">
                    <button className="btn btn-sm btn-primary" onClick={handleRegenerate}>Confirm</button>
                    <button className="btn btn-sm btn-secondary" onClick={() => setConfirming(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <button className="btn btn-primary btn-sm w-full justify-start" onClick={() => setConfirming(true)} disabled={regenerating}>
                  {regenerating ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                  {regenerating ? "Regenerating…" : "Regenerate Report"}
                </button>
              )}
              <button className="btn btn-secondary btn-sm w-full justify-start"><Download size={13} /> Download PDF</button>
              <button className="btn btn-secondary btn-sm w-full justify-start"><Download size={13} /> Download Excel</button>
              <button className="btn btn-secondary btn-sm w-full justify-start"><Share2 size={13} /> Share Report</button>
              <button className="btn btn-secondary btn-sm w-full justify-start text-[var(--danger)]" onClick={() => toast.info("Report archived")}>
                <Archive size={13} /> Archive Report
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-semibold text-sm mb-3">Generation History</h3>
            <div className="space-y-3">
              {SEED_VERSIONS.map((v, i) => (
                <div key={v.id} className="flex items-start gap-2 text-sm">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
                    style={{ background: i === 0 ? "var(--primary)" : "var(--text-muted)" }}>
                    {v.version}
                  </div>
                  <div>
                    <p className="font-medium text-xs">{v.generated_by}</p>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{formatRelative(v.generated_date)}</p>
                  </div>
                  {i === 0 && <span className="badge chip-success text-[10px] ml-auto">Latest</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Content ─────────────────────────────────────────────────────────────

function ContentTab({ report }: { report: SeedReport }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ "Executive Summary": true });

  function toggle(section: string) {
    setExpanded(e => ({ ...e, [section]: !e[section] }));
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Report Content Preview</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {report.sections.length} sections · Live data as of {formatDate(report.generatedDate)}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-secondary btn-sm" onClick={() => setExpanded(Object.fromEntries(report.sections.map(s => [s, true])))}>
            Expand All
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setExpanded({})}>
            Collapse All
          </button>
        </div>
      </div>

      {/* Report header */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between pb-5 mb-5 border-b border-gray-100">
          <div>
            <p className="text-xs font-bold" style={{ color: "var(--primary)" }}>MeasureDeck Commercial Platform</p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Confidential — Not for distribution</p>
          </div>
          <div className="text-right">
            <p className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{report.id.toUpperCase()}</p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{formatDate(report.generatedDate)}</p>
          </div>
        </div>
        <h2 className="text-xl font-bold mb-1">{report.title}</h2>
        {report.projectName && <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{report.projectName} · {report.projectRef}</p>}
      </div>

      {/* Sections */}
      {report.sections.map((section, idx) => {
        const meta = SECTION_CONTENT[section];
        const isOpen = expanded[section] ?? false;
        return (
          <div key={section} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
              onClick={() => toggle(section)}
            >
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                  {idx + 1}
                </span>
                <span className="font-semibold text-sm">{section}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-ghost btn-sm text-xs"
                  onClick={e => { e.stopPropagation(); toast.info(`Edit ${section}`); }}
                >
                  Edit Section
                </button>
                {isOpen ? <ChevronUp size={15} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={15} style={{ color: "var(--text-muted)" }} />}
              </div>
            </button>
            {isOpen && (
              <div className="px-5 pb-5 border-t border-gray-100">
                {meta ? (
                  <div className="pt-4 space-y-3">
                    {meta.description && (
                      <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        {meta.description}
                      </p>
                    )}
                    {meta.rows && (
                      <div className="rounded-xl overflow-hidden border border-gray-100">
                        <table className="w-full text-sm">
                          <tbody>
                            {meta.rows.map(r => (
                              <tr key={r.label} className="border-b border-gray-100 last:border-0">
                                <td className="px-4 py-2.5 font-medium" style={{ color: "var(--text-muted)" }}>{r.label}</td>
                                <td className="px-4 py-2.5 text-right font-semibold">{r.value}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {!meta.rows && !meta.description && (
                      <div className="h-20 rounded-xl flex items-center justify-center" style={{ background: "var(--bg-muted)", border: "1px dashed var(--border)" }}>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{section} — chart rendered on export</p>
                      </div>
                    )}
                    {section === "CVR Movement Chart" && (
                      <div className="h-32 rounded-xl flex items-center justify-center" style={{ background: "var(--bg-muted)", border: "1px dashed var(--border)" }}>
                        <div className="text-center">
                          <BarChart2 size={24} className="mx-auto mb-1" style={{ color: "var(--text-muted)" }} />
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>CVR trend chart — rendered in PDF export</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="pt-4 h-24 rounded-xl flex items-center justify-center" style={{ background: "var(--bg-muted)", border: "1px dashed var(--border)" }}>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>{section} — live data rendered on export</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab: Data Sources ────────────────────────────────────────────────────────

function DataSourcesTab({ report }: { report: SeedReport }) {
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<string | null>(null);

  async function handleRefreshAll() {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 1500));
    setRefreshing(false);
    setLastRefresh(new Date().toISOString());
    toast.success("All data sources refreshed");
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Data Sources</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {lastRefresh ? `Last refreshed ${formatRelative(lastRefresh)}` : `Data pulled at time of generation: ${formatDate(report.generatedDate)}`}
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleRefreshAll} disabled={refreshing}>
          {refreshing ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
          {refreshing ? "Refreshing…" : "Refresh All Data"}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Data Source</th>
              <th>Table</th>
              <th className="text-right">Records</th>
              <th>Date Range</th>
              <th>Last Synced</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {SEED_DATA_SOURCES.map((s, i) => (
              <tr key={i}>
                <td className="font-medium text-sm">{s.label}</td>
                <td className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{s.table}</td>
                <td className="text-right tabular-nums text-sm">{s.records}</td>
                <td className="text-xs" style={{ color: "var(--text-muted)" }}>All time</td>
                <td className="text-xs" style={{ color: "var(--text-muted)" }}>{formatRelative(s.last_sync)}</td>
                <td><span className="badge chip-success">{s.status}</span></td>
                <td>
                  <button className="btn btn-ghost btn-icon btn-sm" title="Refresh this source">
                    <RefreshCw size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <h4 className="font-semibold text-sm mb-3">Total Record Summary</h4>
        <div className="flex items-center gap-6 text-sm">
          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Total Records Included</p>
            <p className="font-bold text-lg mt-0.5">{SEED_DATA_SOURCES.reduce((acc, s) => acc + s.records, 0).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>Active Sources</p>
            <p className="font-bold text-lg mt-0.5">{SEED_DATA_SOURCES.length}</p>
          </div>
          <div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>All Sources</p>
            <p className="font-bold text-lg mt-0.5 flex items-center gap-1" style={{ color: "var(--success)" }}>
              <Check size={16} /> Live
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Distribution ────────────────────────────────────────────────────────

function DistributionTab({ report }: { report: SeedReport }) {
  const [showSend, setShowSend] = useState(false);
  const [recipients] = useState<Recipient[]>(SEED_RECIPIENTS);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Distribution List</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {recipients.length} recipients · {recipients.filter(r => r.opened).length} opened
          </p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowSend(true)}>
          <Send size={14} /> Send to Recipients
        </button>
      </div>

      {showSend && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Send Report</h4>
            <button onClick={() => setShowSend(false)} className="btn btn-ghost btn-icon btn-sm"><X size={14} /></button>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>To</label>
            <input type="text" placeholder="Add recipients (email or name)…" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Subject</label>
            <input type="text" defaultValue={`${report.title} — ${formatDate(report.generatedDate)}`} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Message</label>
            <textarea rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
              defaultValue="Please find attached the latest commercial report for your review." />
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary btn-sm" onClick={() => { setShowSend(false); toast.success("Report sent to recipients"); }}>
              <Send size={14} /> Send Now
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowSend(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Recipient</th>
              <th>Email</th>
              <th>Sent</th>
              <th>Opened</th>
              <th>Notes</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {recipients.map(r => (
              <tr key={r.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                      style={{ background: "var(--primary)" }}>
                      {getInitials(r.name)}
                    </div>
                    <span className="font-medium text-sm">{r.name}</span>
                  </div>
                </td>
                <td className="text-sm font-mono text-xs" style={{ color: "var(--text-secondary)" }}>{r.email}</td>
                <td className="text-xs" style={{ color: "var(--text-muted)" }}>{formatRelative(r.sent_date)}</td>
                <td>
                  {r.opened ? (
                    <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--success)" }}>
                      <Check size={12} /> Yes
                    </span>
                  ) : (
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>No</span>
                  )}
                </td>
                <td className="text-xs" style={{ color: "var(--text-muted)" }}>{r.notes || "—"}</td>
                <td>
                  <button className="btn btn-ghost btn-icon btn-sm" title="Remove recipient" onClick={() => toast.info("Recipient removed")}>
                    <X size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button className="btn btn-secondary btn-sm"><Plus size={14} /> Add Recipient</button>
    </div>
  );
}

// ─── Tab: Versions ────────────────────────────────────────────────────────────

function VersionsTab({ report }: { report: SeedReport }) {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Version History</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{SEED_VERSIONS.length} versions</p>
        </div>
        <button className="btn btn-secondary btn-sm"><RotateCcw size={14} /> Compare Versions</button>
      </div>

      <div className="space-y-3">
        {SEED_VERSIONS.map((v, i) => (
          <div key={v.id} className={cn("bg-white rounded-2xl border border-gray-200 shadow-sm p-5", i === 0 && "ring-2 ring-[#3B5EE8] ring-offset-1")}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0",
                  i === 0 ? "bg-[#3B5EE8]" : "bg-gray-400")}>
                  {v.version}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">Version {v.version}</span>
                    {i === 0 && <span className="badge chip-success">Latest</span>}
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {formatDateTime(v.generated_date)} · by {v.generated_by}
                  </p>
                  <p className="text-sm mt-2" style={{ color: "var(--text-secondary)" }}>{v.changes}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button className="btn btn-secondary btn-sm"><Eye size={13} /> Preview</button>
                <button className="btn btn-secondary btn-sm"><Download size={13} /> Download</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: Settings ────────────────────────────────────────────────────────────

function SettingsTab({ report }: { report: SeedReport }) {
  const [settings, setSettings] = useState({
    title: report.title,
    confidentiality: "Confidential",
    branding: true,
    include_charts: true,
    include_appendices: false,
    custom_header: "",
    custom_footer: "MeasureDeck Commercial Platform — Confidential",
  });
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5EE8]";

  return (
    <div className="p-6 space-y-5 max-w-2xl">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
        <h3 className="font-semibold text-sm">Report Configuration</h3>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Report Title</label>
          <input type="text" className={inputCls} value={settings.title} onChange={e => setSettings(s => ({ ...s, title: e.target.value }))} />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Confidentiality Level</label>
          <select className={inputCls} value={settings.confidentiality} onChange={e => setSettings(s => ({ ...s, confidentiality: e.target.value }))}>
            <option>Public</option>
            <option>Internal Only</option>
            <option>Confidential</option>
            <option>Strictly Confidential</option>
          </select>
        </div>

        {[
          { key: "branding", label: "Include MeasureDeck Branding" },
          { key: "include_charts", label: "Include Charts & Graphs" },
          { key: "include_appendices", label: "Include Appendices" },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <label className="text-sm font-medium">{label}</label>
            <button
              className={cn("w-10 h-6 rounded-full flex items-center transition-colors", (settings as any)[key] ? "bg-[#3B5EE8] justify-end" : "bg-gray-200 justify-start")}
              onClick={() => setSettings(s => ({ ...s, [key]: !(s as any)[key] }))}
            >
              <span className="w-5 h-5 rounded-full bg-white shadow mx-0.5 block" />
            </button>
          </div>
        ))}

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Custom Header Text</label>
          <input type="text" className={inputCls} placeholder="Optional custom header…" value={settings.custom_header} onChange={e => setSettings(s => ({ ...s, custom_header: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Custom Footer Text</label>
          <input type="text" className={inputCls} value={settings.custom_footer} onChange={e => setSettings(s => ({ ...s, custom_footer: e.target.value }))} />
        </div>

        <button className="btn btn-primary btn-sm" onClick={async () => { setSaving(true); await new Promise(r => setTimeout(r, 500)); setSaving(false); toast.success("Settings saved"); }} disabled={saving}>
          <Settings size={14} /> {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6">
        <h3 className="font-semibold text-sm mb-1" style={{ color: "var(--danger)" }}>Danger Zone</h3>
        <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>Permanently delete this report and all associated versions, exports, and share links.</p>
        {showDelete ? (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-3">
            <p className="text-sm font-semibold text-red-700">Are you sure? This cannot be undone.</p>
            <div className="flex gap-2">
              <button className="btn btn-sm" style={{ background: "var(--danger)", color: "#fff" }} onClick={() => toast.error("Report deleted")}>
                <Trash2 size={13} /> Delete Permanently
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowDelete(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <button className="btn btn-sm" style={{ background: "var(--danger)", color: "#fff" }} onClick={() => setShowDelete(true)}>
            <Trash2 size={14} /> Delete Report
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Audit ───────────────────────────────────────────────────────────────

function AuditTab() {
  return (
    <div className="p-6 space-y-4">
      <h3 className="font-semibold text-sm">Audit Log</h3>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {SEED_AUDIT.map(e => (
              <tr key={e.id}>
                <td className="font-mono text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>
                  {formatDateTime(e.timestamp)}
                </td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                      style={{ background: "var(--primary)" }}>
                      {getInitials(e.user)}
                    </div>
                    <span className="text-sm">{e.user}</span>
                  </div>
                </td>
                <td className="font-medium text-sm">{e.action}</td>
                <td className="text-sm max-w-[280px]" style={{ color: "var(--text-secondary)" }}>
                  <span className="line-clamp-2">{e.detail}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.reportId as string;

  const [report, setReport] = useState<SeedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    async function load() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data } = await supabase.from("report_packs").select("*").eq("id", reportId).single();
        setReport(data ? (data as SeedReport) : SEED_REPORTS.find(r => r.id === reportId) ?? SEED_REPORTS[0]);
      } catch {
        setReport(SEED_REPORTS.find(r => r.id === reportId) ?? SEED_REPORTS[0]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [reportId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <div className="skeleton h-8 w-48 rounded-lg" />
        <div className="skeleton h-28 rounded-2xl" />
        <div className="skeleton h-12 rounded-xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  if (!report) return null;

  const typeMeta = REPORT_TYPE_COLOURS[report.type] ?? { chip: "chip-muted", accent: "#94A3B8" };
  const statusChip = STATUS_CHIP[report.status] ?? "chip-muted";

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3 min-w-0">
          <button className="btn btn-ghost btn-sm btn-icon flex-shrink-0" onClick={() => router.back()}>
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={cn("badge", typeMeta.chip)}>{report.type}</span>
              <span className={cn("badge", statusChip)}>{report.status}</span>
            </div>
            <h1 className="text-lg font-bold truncate" style={{ color: "var(--text-primary)" }}>{report.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
          <button className="btn btn-secondary btn-sm"><RefreshCw size={13} /> Regenerate</button>
          <button className="btn btn-secondary btn-sm"><Download size={13} /> Download PDF</button>
          <button className="btn btn-secondary btn-sm"><Download size={13} /> Download Excel</button>
          <button className="btn btn-primary btn-sm" onClick={() => setTab("distribution")}>
            <Share2 size={13} /> Share
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => toast.info("Archived")}>
            <Archive size={13} /> Archive
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="px-6 py-3">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Report Type",     value: report.type },
            { label: "Project",         value: report.projectName ?? "All Projects" },
            { label: "Generated",       value: formatDate(report.generatedDate) },
            { label: "Generated By",    value: report.generatedBy },
            { label: "Status",          value: report.status },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3">
              <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</p>
              <p className="font-semibold text-sm mt-0.5 truncate" style={{ color: "var(--text-primary)" }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar px-6 overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.id}
            className={cn("tab-item flex-shrink-0", tab === t.id && "active")}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="flex-1"
        >
          {tab === "overview"      && <OverviewTab report={report} typeMeta={typeMeta} />}
          {tab === "content"       && <ContentTab report={report} />}
          {tab === "data-sources"  && <DataSourcesTab report={report} />}
          {tab === "distribution"  && <DistributionTab report={report} />}
          {tab === "versions"      && <VersionsTab report={report} />}
          {tab === "settings"      && <SettingsTab report={report} />}
          {tab === "audit"         && <AuditTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useState } from "react";
import {
  Download, FileText, Presentation, ToggleLeft, ToggleRight,
  ChevronDown, Loader2, CheckSquare, Square,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getFlag } from "@/lib/feature-flags";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SectionToggle {
  key: string;
  label: string;
  enabled: boolean;
}

interface BoardPackConfig {
  periodMonth: string;
  periodYear: string;
  projectIds: string[];
  sections: SectionToggle[];
  workspaceName: string;
}

type GenerateFormat = "pdf" | "pptx";

// ─── Seed projects ────────────────────────────────────────────────────────────

const ALL_PROJECTS = [
  { id: "proj-001", name: "Eastside Residential Block A" },
  { id: "proj-002", name: "Meridian Office Park Phase 2" },
  { id: "proj-003", name: "Thornfield Commercial Hub" },
  { id: "proj-004", name: "Harlow Civic Centre Refurb" },
  { id: "proj-005", name: "Whitfield Leisure Centre" },
  { id: "proj-006", name: "Northgate Retail Park" },
];

const DEFAULT_SECTIONS: SectionToggle[] = [
  { key: "executive_summary", label: "Executive Summary", enabled: true },
  { key: "project_summaries", label: "Project Summaries", enabled: true },
  { key: "ce_register", label: "CE Register", enabled: true },
  { key: "cash_position", label: "Cash Position", enabled: true },
  { key: "risk_register", label: "Risk Register", enabled: false },
  { key: "kpi_dashboard", label: "KPI Dashboard", enabled: true },
];

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// ─── Feature gate ─────────────────────────────────────────────────────────────

function FeatureGate({ children }: { children: React.ReactNode }) {
  const enabled = getFlag("cross_project_analytics");
  if (!enabled) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "var(--bg-subtle)" }}>
          <Presentation size={24} style={{ color: "var(--text-muted)" }} />
        </div>
        <h2 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Board Pack Generator</h2>
        <p className="text-sm max-w-sm text-center" style={{ color: "var(--text-muted)" }}>
          Board Pack generation is an Enterprise feature. Upgrade your plan to generate PDF and PowerPoint board reports.
        </p>
        <button className="btn btn-primary btn-sm">Upgrade to Enterprise</button>
      </div>
    );
  }
  return <>{children}</>;
}

// ─── Cover preview ────────────────────────────────────────────────────────────

function CoverPreview({ config }: { config: BoardPackConfig }) {
  const period = `${config.periodMonth} ${config.periodYear}`;
  return (
    <div
      className="rounded-xl overflow-hidden aspect-[3/4] flex flex-col"
      style={{ background: "#0f172a", maxWidth: 280 }}
    >
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ background: "#2563eb" }}
        >
          <FileText size={22} className="text-white" />
        </div>
        <div className="text-center">
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#64748b" }}>MeasureDeck</p>
          <h2 className="text-lg font-bold mt-2 leading-snug" style={{ color: "#f8fafc" }}>Board Report</h2>
          <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>{period}</p>
        </div>
        <div className="mt-4 text-center">
          <p className="text-xs font-semibold" style={{ color: "#cbd5e1" }}>{config.workspaceName || "Your Workspace"}</p>
          <p className="text-[10px] mt-1" style={{ color: "#475569" }}>Prepared by MeasureDeck · Confidential</p>
        </div>
      </div>
      <div className="flex flex-col gap-1.5 px-6 pb-6">
        {config.sections.filter(s => s.enabled).map(s => (
          <div key={s.key} className="flex items-center gap-2">
            <div className="w-1 h-1 rounded-full" style={{ background: "#2563eb" }} />
            <span className="text-[10px]" style={{ color: "#64748b" }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Section toggle ────────────────────────────────────────────────────────────

function SectionRow({ section, onChange }: { section: SectionToggle; onChange: (key: string, val: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: "var(--border-subtle)" }}>
      <span className="text-sm" style={{ color: "var(--text-primary)" }}>{section.label}</span>
      <button
        className="flex-shrink-0"
        onClick={() => onChange(section.key, !section.enabled)}
        aria-label={section.enabled ? `Disable ${section.label}` : `Enable ${section.label}`}
      >
        {section.enabled
          ? <ToggleRight size={22} style={{ color: "var(--primary)" }} />
          : <ToggleLeft size={22} style={{ color: "var(--text-muted)" }} />
        }
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function BoardPackPage() {
  const currentDate = new Date();
  const [config, setConfig] = useState<BoardPackConfig>({
    periodMonth: MONTHS[currentDate.getMonth()],
    periodYear: String(currentDate.getFullYear()),
    projectIds: ALL_PROJECTS.map(p => p.id),
    sections: DEFAULT_SECTIONS,
    workspaceName: "MeasureDeck Demo Workspace",
  });
  const [generating, setGenerating] = useState<GenerateFormat | null>(null);

  function toggleSection(key: string, val: boolean) {
    setConfig(prev => ({
      ...prev,
      sections: prev.sections.map(s => s.key === key ? { ...s, enabled: val } : s),
    }));
  }

  function toggleProject(id: string) {
    setConfig(prev => {
      const has = prev.projectIds.includes(id);
      return {
        ...prev,
        projectIds: has ? prev.projectIds.filter(x => x !== id) : [...prev.projectIds, id],
      };
    });
  }

  async function generate(format: GenerateFormat) {
    setGenerating(format);
    try {
      const res = await fetch("/api/analytics/board-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format,
          period: `${config.periodMonth} ${config.periodYear}`,
          project_ids: config.projectIds,
          workspace_name: config.workspaceName,
          sections: config.sections.filter(s => s.enabled).map(s => s.key),
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || "Generation failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `board-pack-${config.periodMonth}-${config.periodYear}.${format === "pdf" ? "pdf" : "pptx"}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Board pack ${format.toUpperCase()} downloaded`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Generation failed";
      toast.error(msg);
    } finally {
      setGenerating(null);
    }
  }

  return (
    <FeatureGate>
      <div className="flex flex-col min-h-full">
        <div className="page-header">
          <div>
            <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Board Pack Generator</h1>
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
              Generate PDF or PowerPoint board packs for your portfolio
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="btn btn-secondary btn-sm"
              disabled={!!generating}
              onClick={() => generate("pptx")}
            >
              {generating === "pptx" ? <Loader2 size={13} className="animate-spin" /> : <Presentation size={13} />}
              Generate PowerPoint
            </button>
            <button
              className="btn btn-primary btn-sm"
              disabled={!!generating}
              onClick={() => generate("pdf")}
            >
              {generating === "pdf" ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              Generate PDF
            </button>
          </div>
        </div>

        <div className="page-content flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Config panel */}
            <div className="lg:col-span-1 flex flex-col gap-4">
              <div className="card p-5 flex flex-col gap-4">
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Period</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="form-label">Month</label>
                    <select
                      className="form-input"
                      value={config.periodMonth}
                      onChange={e => setConfig(prev => ({ ...prev, periodMonth: e.target.value }))}
                    >
                      {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Year</label>
                    <select
                      className="form-input"
                      value={config.periodYear}
                      onChange={e => setConfig(prev => ({ ...prev, periodYear: e.target.value }))}
                    >
                      {["2024", "2025", "2026", "2027"].map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="card p-5 flex flex-col gap-3">
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Projects to Include</h3>
                <button
                  className="text-xs font-medium text-left"
                  style={{ color: "var(--primary)" }}
                  onClick={() => setConfig(prev => ({
                    ...prev,
                    projectIds: prev.projectIds.length === ALL_PROJECTS.length ? [] : ALL_PROJECTS.map(p => p.id),
                  }))}
                >
                  {config.projectIds.length === ALL_PROJECTS.length ? "Deselect all" : "Select all"}
                </button>
                {ALL_PROJECTS.map(p => (
                  <label key={p.id} className="flex items-center gap-2.5 cursor-pointer">
                    <button
                      className="flex-shrink-0"
                      onClick={() => toggleProject(p.id)}
                      aria-label={config.projectIds.includes(p.id) ? `Remove ${p.name}` : `Add ${p.name}`}
                    >
                      {config.projectIds.includes(p.id)
                        ? <CheckSquare size={15} style={{ color: "var(--primary)" }} />
                        : <Square size={15} style={{ color: "var(--text-muted)" }} />
                      }
                    </button>
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{p.name}</span>
                  </label>
                ))}
              </div>

              <div className="card p-5 flex flex-col gap-1">
                <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--text-primary)" }}>Include Sections</h3>
                {config.sections.map(s => (
                  <SectionRow key={s.key} section={s} onChange={toggleSection} />
                ))}
              </div>

              <div className="card p-5 flex flex-col gap-3">
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Branding</h3>
                <div>
                  <label className="form-label">Workspace Name</label>
                  <input
                    className="form-input"
                    value={config.workspaceName}
                    onChange={e => setConfig(prev => ({ ...prev, workspaceName: e.target.value }))}
                    placeholder="Your company name"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <div className="card p-5 flex flex-col gap-4">
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Preview</h3>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Cover page · {config.sections.filter(s => s.enabled).length} sections · {config.projectIds.length} projects
                </p>
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <CoverPreview config={config} />
                  <div className="flex-1 flex flex-col gap-3">
                    <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Included Sections</p>
                    {config.sections.filter(s => s.enabled).map((s, i) => (
                      <div key={s.key} className="flex items-center gap-3 py-2 border-b last:border-0" style={{ borderColor: "var(--border-subtle)" }}>
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                          style={{ background: "var(--primary)" }}
                        >
                          {i + 1}
                        </div>
                        <span className="text-sm" style={{ color: "var(--text-primary)" }}>{s.label}</span>
                      </div>
                    ))}
                    {config.sections.filter(s => s.enabled).length === 0 && (
                      <p className="text-sm" style={{ color: "var(--text-muted)" }}>No sections selected. Enable at least one section.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="card p-5 flex flex-col gap-3">
                <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Generate Board Pack</h3>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Choose your preferred output format. Both formats include all enabled sections.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    className="flex items-center gap-3 p-4 rounded-xl border text-left transition-all hover:shadow-sm"
                    style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}
                    disabled={!!generating}
                    onClick={() => generate("pdf")}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--danger)", color: "#fff" }}>
                      {generating === "pdf" ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>PDF Report</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>A4 · Print-ready · Shareable</p>
                    </div>
                  </button>
                  <button
                    className="flex items-center gap-3 p-4 rounded-xl border text-left transition-all hover:shadow-sm"
                    style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}
                    disabled={!!generating}
                    onClick={() => generate("pptx")}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#d97706", color: "#fff" }}>
                      {generating === "pptx" ? <Loader2 size={18} className="animate-spin" /> : <Presentation size={18} />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>PowerPoint</p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>16:9 · Board-ready · Editable</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FeatureGate>
  );
}

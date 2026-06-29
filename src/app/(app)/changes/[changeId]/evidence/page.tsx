"use client";

import { useState } from "react";
import { Camera, FileText, Bell, Star, Plus, Search } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface EvidenceItem {
  id: string;
  type: "Photo" | "Site Diary" | "Notice" | "Document" | "Report";
  title: string;
  strength: number;
  date: string;
  by: string;
  notes: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const CE025_EVIDENCE: EvidenceItem[] = [
  { id: "EV-101", type: "Photo",     title: "Rock face at -3.2m depth – 14 Mar",       strength: 5, date: "2025-03-14", by: "Marcus Thompson", notes: "Shows distinct igneous rock band" },
  { id: "EV-102", type: "Photo",     title: "Rock-breaker on site – 15 Mar",            strength: 5, date: "2025-03-15", by: "Marcus Thompson", notes: "" },
  { id: "EV-103", type: "Photo",     title: "Spoil removed – dolerite samples",          strength: 4, date: "2025-03-16", by: "Marcus Thompson", notes: "Lab confirmation pending" },
  { id: "EV-104", type: "Site Diary", title: "Site Diary 14–25 Mar 2025",               strength: 5, date: "2025-03-25", by: "Marcus Thompson", notes: "Daily records of rock excavation" },
  { id: "EV-105", type: "Notice",    title: "Early Warning Notice EW-031",              strength: 5, date: "2025-03-14", by: "Sarah Chen",      notes: "Issued same day as discovery" },
  { id: "EV-106", type: "Document",  title: "Ground Investigation Report (March 2023)", strength: 4, date: "2024-08-01", by: "James Ward",      notes: "Shows no rock predicted at formation level — supports CE" },
  { id: "EV-107", type: "Document",  title: "Plant hire invoice – rock-breaker (12 days)", strength: 5, date: "2025-04-02", by: "Sarah Chen",   notes: "" },
  { id: "EV-108", type: "Document",  title: "Skip lorry manifests × 14 loads",          strength: 3, date: "2025-04-02", by: "Sarah Chen",      notes: "Missing 2 manifests — disputed item" },
  { id: "EV-109", type: "Report",    title: "Delay Analysis Report – Rock Excavation",  strength: 4, date: "2025-04-03", by: "Sarah Chen",      notes: "TIA methodology, 12 days claimed" },
  { id: "EV-110", type: "Notice",    title: "CE Notification CE-025",                   strength: 5, date: "2025-03-18", by: "Sarah Chen",      notes: "" },
  { id: "EV-111", type: "Notice",    title: "PM Instruction PMI-018",                   strength: 5, date: "2025-03-15", by: "Rachel Okafor",   notes: "PM instruction to continue and record" },
  { id: "EV-112", type: "Document",  title: "Lab report – dolerite identification",     strength: 2, date: "2025-04-10", by: "Sarah Chen",      notes: "Awaited — not yet received" },
];

function typeIcon(type: EvidenceItem["type"]) {
  if (type === "Photo") return <Camera size={20} />;
  if (type === "Notice") return <Bell size={20} />;
  return <FileText size={20} />;
}

function typeColor(type: EvidenceItem["type"]): string {
  const map: Record<EvidenceItem["type"], string> = {
    Photo: "#06B6D4",
    "Site Diary": "#10B981",
    Notice: "#F59E0B",
    Document: "#3B5EE8",
    Report: "#8B5CF6",
  };
  return map[type] ?? "#94A3B8";
}

function strengthChip(s: number): string {
  if (s >= 5) return "chip-success";
  if (s >= 4) return "chip-info";
  if (s >= 3) return "chip-warning";
  return "chip-danger";
}

function strengthLabel(s: number): string {
  if (s >= 5) return "Strong";
  if (s >= 4) return "Good";
  if (s >= 3) return "Adequate";
  return "Weak";
}

function fmtDate(s: string): string {
  return new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function EvidencePage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [strengthFilter, setStrengthFilter] = useState<string>("All");

  const types = ["All", "Photo", "Site Diary", "Notice", "Document", "Report"];
  const strengths = ["All", "Strong", "Adequate", "Weak"];

  const filtered = CE025_EVIDENCE.filter((e) => {
    const matchSearch =
      search === "" ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.by.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "All" || e.type === typeFilter;
    const matchStrength =
      strengthFilter === "All" ||
      (strengthFilter === "Strong" && e.strength >= 4) ||
      (strengthFilter === "Adequate" && e.strength === 3) ||
      (strengthFilter === "Weak" && e.strength <= 2);
    return matchSearch && matchType && matchStrength;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={16}
              fill={i < 4 ? "#F59E0B" : "none"}
              stroke="#F59E0B"
            />
          ))}
          <span className="ml-1.5 text-sm font-semibold" style={{ color: "var(--warning)" }}>
            4/5
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
          <span>
            <strong style={{ color: "var(--text-primary)" }}>{CE025_EVIDENCE.length}</strong> items
          </span>
          <span>
            <strong style={{ color: "#06B6D4" }}>3</strong> photos
          </span>
          <span>
            <strong style={{ color: "#3B5EE8" }}>5</strong> docs
          </span>
          <span>
            <strong style={{ color: "#F59E0B" }}>4</strong> notices
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            className="form-input pl-8 h-9 text-sm"
            placeholder="Search evidence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-input h-9 text-sm w-36"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          {types.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select
          className="form-input h-9 text-sm w-36"
          value={strengthFilter}
          onChange={(e) => setStrengthFilter(e.target.value)}
        >
          {strengths.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      {/* Evidence Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((ev) => {
          const color = typeColor(ev.type);
          return (
            <div
              key={ev.id}
              className="card p-4 flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: `${color}15`, color }}
                >
                  {typeIcon(ev.type)}
                </div>
                <span className="font-mono text-[10px] font-bold" style={{ color: "var(--text-muted)" }}>
                  {ev.id}
                </span>
              </div>

              {/* Title */}
              <div>
                <div
                  className="text-sm font-semibold leading-snug mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  {ev.title}
                </div>
                {ev.notes && (
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {ev.notes}
                  </div>
                )}
              </div>

              {/* Type chip + strength dots */}
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className="badge text-[10px]"
                  style={{
                    background: `${color}18`,
                    color,
                    border: `1px solid ${color}30`,
                  }}
                >
                  {ev.type}
                </span>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      className="text-xs"
                      style={{ color: i < ev.strength ? "#F59E0B" : "var(--border)" }}
                    >
                      ●
                    </span>
                  ))}
                </div>
                <span className={`badge text-[10px] ${strengthChip(ev.strength)}`}>
                  {strengthLabel(ev.strength)}
                </span>
              </div>

              {/* Meta */}
              <div className="flex items-center justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                <span>{fmtDate(ev.date)}</span>
                <span>{ev.by}</span>
              </div>

              {/* Linked chip */}
              <div>
                <span className="badge chip-muted text-[10px]">Linked to: CE-025</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Evidence Gap Analysis */}
      <div
        className="card p-5"
        style={{ borderColor: "rgba(239,68,68,0.25)", background: "rgba(239,68,68,0.02)" }}
      >
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>
          Evidence Gap Analysis
        </h3>
        <div className="flex flex-col gap-2 mb-4">
          <div
            className="flex items-start gap-2 p-3 rounded-lg"
            style={{ background: "rgba(239,68,68,0.06)" }}
          >
            <span className="text-xs font-semibold mt-0.5" style={{ color: "var(--danger)" }}>
              Missing:
            </span>
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Lab report awaited (EV-112), 2 skip lorry manifests (disputed)
            </span>
          </div>
          <div
            className="flex items-start gap-2 p-3 rounded-lg"
            style={{ background: "rgba(245,158,11,0.06)" }}
          >
            <span className="text-xs font-semibold mt-0.5" style={{ color: "var(--warning)" }}>
              Recommended:
            </span>
            <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
              Request lab confirmation from geotechnical consultant by 25 Apr 2025
            </span>
          </div>
        </div>
        <button className="btn btn-primary btn-sm">
          <Plus size={13} />
          Add Evidence
        </button>
      </div>
    </div>
  );
}

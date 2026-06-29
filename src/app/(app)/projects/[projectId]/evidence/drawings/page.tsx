"use client";

import { useState } from "react";
import {
  Upload, Search, Download, Eye, MoreHorizontal,
  Box, Layers, Filter, FileStack,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type DrawingStatus =
  | "Issued for Construction"
  | "Issued for Comment"
  | "Superseded"
  | "For Approval"
  | "Approved";

interface Drawing {
  id: string;
  drawingNo: string;
  title: string;
  rev: string;
  status: DrawingStatus;
  uploaded: string;
  type: string;
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const DRAWINGS: Drawing[] = [
  {
    id: "d-001",
    drawingNo: "A-001",
    title: "General Arrangement – Ground Floor",
    rev: "D",
    status: "Issued for Construction",
    uploaded: "2025-04-01",
    type: "Architectural",
  },
  {
    id: "d-002",
    drawingNo: "S-002",
    title: "Foundation Layout Plan",
    rev: "C",
    status: "Issued for Construction",
    uploaded: "2025-03-15",
    type: "Structural",
  },
  {
    id: "d-003",
    drawingNo: "M-003",
    title: "MEP Schematic – Level 2",
    rev: "B",
    status: "For Approval",
    uploaded: "2025-04-18",
    type: "MEP",
  },
  {
    id: "d-004",
    drawingNo: "A-004",
    title: "Roof Plan & Sections",
    rev: "A",
    status: "Issued for Comment",
    uploaded: "2025-05-02",
    type: "Architectural",
  },
  {
    id: "d-005",
    drawingNo: "S-005",
    title: "Staircore Reinforcement Detail",
    rev: "B",
    status: "Approved",
    uploaded: "2025-03-28",
    type: "Structural",
  },
  {
    id: "d-006",
    drawingNo: "E-006",
    title: "Electrical Single Line Diagram",
    rev: "A",
    status: "Issued for Comment",
    uploaded: "2025-04-22",
    type: "Electrical",
  },
];

const STATUS_CLASS: Record<DrawingStatus, string> = {
  "Issued for Construction": "chip-success",
  "Issued for Comment": "chip-warning",
  "Superseded": "chip-muted",
  "For Approval": "chip-info",
  "Approved": "chip-success",
};

const TYPE_OPTIONS = ["All Types", "Architectural", "Structural", "MEP", "Electrical"];

type ActiveTab = "drawings" | "bim";

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DrawingsPage() {
  const [tab, setTab] = useState<ActiveTab>("drawings");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All Types");
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const filtered = DRAWINGS.filter((d) => {
    const matchSearch =
      search === "" ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.drawingNo.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "All Types" || d.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            Drawings & BIM Register
          </h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
            {DRAWINGS.length} drawings · 1 BIM model
          </p>
        </div>
        <button className="btn btn-primary btn-sm flex items-center gap-1.5">
          <Upload size={13} />
          Upload Drawing
        </button>
      </div>

      {/* Internal tabs */}
      <div
        className="flex items-center gap-0 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        {(["drawings", "bim"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5",
              tab === t
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            )}
          >
            {t === "drawings" ? <FileStack size={14} /> : <Box size={14} />}
            {t === "drawings" ? "Drawing Register" : "BIM Model"}
          </button>
        ))}
      </div>

      {tab === "drawings" && (
        <>
          {/* Filter bar */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                className="form-input pl-8 text-sm"
                placeholder="Search drawings…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="relative">
              <Filter
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "var(--text-muted)" }}
              />
              <select
                className="form-input pl-7 pr-8 text-sm"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                {TYPE_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Drawings table */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th>Drawing No</th>
                    <th>Title</th>
                    <th>Rev</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Uploaded</th>
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
                        No drawings match your filters.
                      </td>
                    </tr>
                  )}
                  {filtered.map((d) => (
                    <tr key={d.id} className="hover:bg-[var(--bg-muted)] transition-colors">
                      <td>
                        <span
                          className="font-mono text-xs font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {d.drawingNo}
                        </span>
                      </td>
                      <td>
                        <span
                          className="font-medium text-sm"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {d.title}
                        </span>
                      </td>
                      <td>
                        <span
                          className="badge chip-muted font-mono text-[10px]"
                        >
                          Rev {d.rev}
                        </span>
                      </td>
                      <td className="text-xs" style={{ color: "var(--text-secondary)" }}>
                        {d.type}
                      </td>
                      <td>
                        <span className={cn("badge", STATUS_CLASS[d.status])}>
                          {d.status}
                        </span>
                      </td>
                      <td className="text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                        {formatDate(d.uploaded)}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            className="btn btn-ghost btn-icon"
                            title="View"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            className="btn btn-ghost btn-icon"
                            title="Download"
                          >
                            <Download size={13} />
                          </button>
                          <div className="relative">
                            <button
                              className="btn btn-ghost btn-icon"
                              title="More"
                              onClick={() =>
                                setOpenMenu(openMenu === d.id ? null : d.id)
                              }
                            >
                              <MoreHorizontal size={13} />
                            </button>
                            {openMenu === d.id && (
                              <div
                                className="absolute right-0 top-full mt-1 rounded-xl shadow-lg z-20 py-1 min-w-[140px]"
                                style={{
                                  background: "var(--bg-surface)",
                                  border: "1px solid var(--border)",
                                }}
                              >
                                <button
                                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--bg-muted)] transition-colors"
                                  style={{ color: "var(--text-primary)" }}
                                  onClick={() => setOpenMenu(null)}
                                >
                                  View History
                                </button>
                                <button
                                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--bg-muted)] transition-colors"
                                  style={{ color: "var(--text-primary)" }}
                                  onClick={() => setOpenMenu(null)}
                                >
                                  Upload Revision
                                </button>
                                <button
                                  className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--bg-muted)] transition-colors"
                                  style={{ color: "var(--danger)" }}
                                  onClick={() => setOpenMenu(null)}
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div
              className="px-4 py-2.5 border-t flex items-center justify-between"
              style={{ borderColor: "var(--border)", background: "var(--bg-muted)" }}
            >
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {filtered.length} drawing{filtered.length !== 1 ? "s" : ""}
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Latest revision per sheet
              </span>
            </div>
          </div>
        </>
      )}

      {tab === "bim" && <BIMPlaceholder />}
    </div>
  );
}

// ─── BIM placeholder card ─────────────────────────────────────────────────────

function BIMPlaceholder() {
  return (
    <div className="card p-8 flex flex-col items-center gap-5 text-center">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center"
        style={{ background: "var(--bg-muted)" }}
      >
        <Box size={40} style={{ color: "var(--text-muted)" }} />
      </div>

      <div>
        <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
          BIM Model Viewer
        </h3>
        <p className="text-sm mt-1.5 max-w-sm" style={{ color: "var(--text-muted)" }}>
          An Autodesk Forge-powered 3D viewer will load here. Upload an IFC or
          Revit model to enable in-browser BIM coordination.
        </p>
      </div>

      {/* Simulated viewer placeholder */}
      <div
        className="w-full rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-3"
        style={{
          background: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
          height: 300,
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <Layers size={32} style={{ color: "rgba(255,255,255,0.2)" }} />
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
          No model uploaded yet
        </p>
        <button
          className="btn btn-sm mt-2 flex items-center gap-1.5 text-xs"
          style={{
            background: "rgba(59,94,232,0.8)",
            color: "white",
            border: "1px solid rgba(59,94,232,0.6)",
          }}
        >
          <Upload size={12} />
          Upload IFC / Revit Model
        </button>
      </div>

      <div
        className="w-full rounded-xl p-4 flex items-start gap-3 text-left"
        style={{ background: "var(--bg-muted)", border: "1px solid var(--border)" }}
      >
        <Box size={16} style={{ color: "var(--primary)", flexShrink: 0, marginTop: 2 }} />
        <div>
          <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
            Autodesk Forge Viewer
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Supports IFC, RVT, NWD and 50+ file formats. Clash detection, markups,
            and model properties are available after connecting your Autodesk account
            in Integrations settings.
          </p>
        </div>
      </div>
    </div>
  );
}

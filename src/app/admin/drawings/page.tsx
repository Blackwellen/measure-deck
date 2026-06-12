"use client";

import { useState } from "react";
import { FileImage, RefreshCw, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = ["Drawing Files", "BIM Models", "Large Files", "Processing Queue", "Viewer Errors"] as const;
type Tab = typeof TABS[number];

const DRAWINGS = [
  { id: "d1", name: "Site Layout Plan Rev A.pdf", workspace: "Apex Construction Ltd", version: "Rev A", size_mb: 8.1, uploaded: "10 Jun 2026", status: "ready" },
  { id: "d2", name: "Foundation Detail Sheet 1.dwg", workspace: "Meridian Contractors", version: "v3", size_mb: 18.2, uploaded: "09 Jun 2026", status: "ready" },
  { id: "d3", name: "Elevation North Face.pdf", workspace: "BuildRight Group", version: "Rev B", size_mb: 4.5, uploaded: "07 Jun 2026", status: "ready" },
  { id: "d4", name: "Services Layout GF.dwg", workspace: "Apex Construction Ltd", version: "v1", size_mb: 22.1, uploaded: "06 Jun 2026", status: "processing" },
];

const BIM_MODELS = [
  { id: "b1", name: "Phase1-Structural.ifc", workspace: "Meridian Contractors", size_mb: 42.0, uploaded: "07 Jun 2026", status: "pending" },
  { id: "b2", name: "MEP-Services.ifc", workspace: "Meridian Contractors", size_mb: 31.5, uploaded: "05 Jun 2026", status: "ready" },
];

const LARGE_FILES = [
  { id: "l1", name: "Phase1-Structural.ifc", workspace: "Meridian Contractors", size_mb: 42.0, type: "IFC" },
  { id: "l2", name: "Services Layout GF.dwg", workspace: "Apex Construction Ltd", size_mb: 22.1, type: "DWG" },
  { id: "l3", name: "Foundation Detail Sheet 1.dwg", workspace: "Meridian Contractors", size_mb: 18.2, type: "DWG" },
];

const QUEUE = [
  { id: "q1", name: "Services Layout GF.dwg", workspace: "Apex Construction Ltd", step: "Generating thumbnail", progress: 45, status: "processing" },
  { id: "q2", name: "Phase1-Structural.ifc", workspace: "Meridian Contractors", step: "Validating IFC schema", progress: 10, status: "processing" },
  { id: "q3", name: "Roofing Plan.pdf", workspace: "BuildRight Group", step: "Queued", progress: 0, status: "queued" },
];

const VIEWER_ERRORS = [
  { id: "ve1", file: "Phase1-Structural.ifc", workspace: "Meridian Contractors", error: "IFC schema version not supported", ts: "07 Jun 2026, 14:30" },
  { id: "ve2", file: "old-drawing.dwg", workspace: "Demo Workspace", error: "DWG format R12 — unsupported", ts: "03 Jun 2026, 09:00" },
];

const STATUS_CHIP: Record<string, string> = { ready: "chip-success", processing: "chip-warning", pending: "chip-info", queued: "chip-muted", error: "chip-danger" };

export default function AdminDrawingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("Drawing Files");

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Drawings Admin</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            Manage drawing files, BIM models and processing queue
          </p>
        </div>
      </div>

      <div className="tab-bar" style={{ marginTop: 16 }}>
        {TABS.map((t) => (
          <button key={t} className={cn("tab-item", activeTab === t && "active")} onClick={() => setActiveTab(t)}>
            {t}
          </button>
        ))}
      </div>

      <div className="page-content">
        {/* DRAWING FILES */}
        {activeTab === "Drawing Files" && (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Workspace</th><th>Version</th><th>Size (MB)</th><th>Uploaded</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {DRAWINGS.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontSize: 13, fontWeight: 500 }}>{d.name}</td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{d.workspace}</td>
                    <td style={{ fontSize: 12 }}>{d.version}</td>
                    <td style={{ fontSize: 13 }}>{d.size_mb.toFixed(1)}</td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{d.uploaded}</td>
                    <td><span className={cn("badge", STATUS_CHIP[d.status] ?? "chip-muted")}>{d.status}</span></td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => alert(`Reprocessing ${d.name}`)}>
                        <RefreshCw size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* BIM MODELS */}
        {activeTab === "BIM Models" && (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Workspace</th><th>Size (MB)</th><th>Uploaded</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {BIM_MODELS.map((b) => (
                  <tr key={b.id}>
                    <td style={{ fontSize: 13, fontWeight: 500 }}>{b.name}</td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{b.workspace}</td>
                    <td style={{ fontSize: 13 }}>{b.size_mb.toFixed(1)}</td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{b.uploaded}</td>
                    <td><span className={cn("badge", STATUS_CHIP[b.status] ?? "chip-muted")}>{b.status}</span></td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => alert(`Reprocessing ${b.name}`)}>
                        <RefreshCw size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* LARGE FILES */}
        {activeTab === "Large Files" && (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Workspace</th><th>Type</th><th>Size (MB)</th></tr>
              </thead>
              <tbody>
                {LARGE_FILES.map((f) => (
                  <tr key={f.id}>
                    <td style={{ fontSize: 13, fontWeight: 500 }}>{f.name}</td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{f.workspace}</td>
                    <td><span className="badge chip-info">{f.type}</span></td>
                    <td style={{ fontSize: 13, color: f.size_mb > 30 ? "var(--danger)" : undefined }}>{f.size_mb.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PROCESSING QUEUE */}
        {activeTab === "Processing Queue" && (
          <div className="card" style={{ overflow: "hidden" }}>
            <table className="data-table">
              <thead>
                <tr><th>File</th><th>Workspace</th><th>Step</th><th>Progress</th><th>Status</th></tr>
              </thead>
              <tbody>
                {QUEUE.map((q) => (
                  <tr key={q.id}>
                    <td style={{ fontSize: 13, fontWeight: 500 }}>{q.name}</td>
                    <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{q.workspace}</td>
                    <td style={{ fontSize: 13 }}>{q.step}</td>
                    <td style={{ minWidth: 120 }}>
                      <div style={{ height: 6, background: "var(--border)", borderRadius: 999 }}>
                        <div style={{ height: "100%", width: `${q.progress}%`, background: "#3B5EE8", borderRadius: 999 }} />
                      </div>
                      <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{q.progress}%</span>
                    </td>
                    <td><span className={cn("badge", STATUS_CHIP[q.status] ?? "chip-muted")}>{q.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEWER ERRORS */}
        {activeTab === "Viewer Errors" && (
          <div className="card" style={{ overflow: "hidden" }}>
            {VIEWER_ERRORS.length === 0 ? (
              <div className="empty-state">
                <div style={{ fontSize: 14, fontWeight: 600 }}>No viewer errors</div>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>File</th><th>Workspace</th><th>Error</th><th>Timestamp</th></tr>
                </thead>
                <tbody>
                  {VIEWER_ERRORS.map((e) => (
                    <tr key={e.id}>
                      <td style={{ fontSize: 13, fontWeight: 500 }}>{e.file}</td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{e.workspace}</td>
                      <td><span className="badge chip-danger">{e.error}</span></td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{e.ts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

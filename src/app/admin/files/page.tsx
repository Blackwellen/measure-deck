"use client";

import { useState } from "react";
import { Search, Filter, RefreshCw, ShieldOff, Download } from "lucide-react";
import { cn } from "@/lib/utils";

const ALL_FILES = [
  { id: "f1", name: "site-photo-001.jpg", workspace: "Apex Construction Ltd", type: "image/jpeg", size_mb: 2.4, created: "10 Jun 2026", scan: "clean", bucket: "evidence-files" },
  { id: "f2", name: "foundation-drawing.pdf", workspace: "Apex Construction Ltd", type: "application/pdf", size_mb: 8.1, created: "09 Jun 2026", scan: "clean", bucket: "drawings" },
  { id: "f3", name: "bim-model-phase1.ifc", workspace: "Meridian Contractors", type: "application/octet-stream", size_mb: 42.0, created: "07 Jun 2026", scan: "pending", bucket: "drawings" },
  { id: "f4", name: "contract-scan.pdf", workspace: "Oldham & Partners", type: "application/pdf", size_mb: 3.8, created: "05 Jun 2026", scan: "clean", bucket: "evidence-files" },
  { id: "f5", name: "elevation.dwg", workspace: "Meridian Contractors", type: "application/acad", size_mb: 18.2, created: "04 Jun 2026", scan: "clean", bucket: "drawings" },
  { id: "f6", name: "suspicious-file.exe", workspace: "Demo Workspace", type: "application/octet-stream", size_mb: 0.5, created: "01 Jun 2026", scan: "flagged", bucket: "uploads" },
  { id: "f7", name: "monthly-report.pdf", workspace: "BuildRight Group", type: "application/pdf", size_mb: 1.2, created: "03 Jun 2026", scan: "clean", bucket: "exports" },
  { id: "f8", name: "progress-photo-day5.jpg", workspace: "Apex Construction Ltd", type: "image/jpeg", size_mb: 3.8, created: "08 Jun 2026", scan: "clean", bucket: "evidence-files" },
];

const SCAN_CHIP: Record<string, string> = { clean: "chip-success", pending: "chip-warning", flagged: "chip-danger" };

export default function AdminFilesPage() {
  const [search, setSearch] = useState("");
  const [scanFilter, setScanFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");

  const filtered = ALL_FILES.filter((f) => {
    const q = search.toLowerCase();
    const matchSearch = !q || f.name.toLowerCase().includes(q) || f.workspace.toLowerCase().includes(q);
    const matchScan = scanFilter === "All" || f.scan === scanFilter;
    const matchType = typeFilter === "All" || f.type.includes(typeFilter);
    return matchSearch && matchScan && matchType;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Files</h1>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
            {ALL_FILES.length} files across all workspaces
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => alert("Exporting…")}>
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      <div className="page-content">
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, maxWidth: 360 }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
            <input
              className="form-input"
              style={{ paddingLeft: 32 }}
              placeholder="Search files…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-input"
            style={{ width: "auto" }}
            value={scanFilter}
            onChange={(e) => setScanFilter(e.target.value)}
          >
            <option value="All">All Scan Statuses</option>
            <option value="clean">Clean</option>
            <option value="pending">Pending</option>
            <option value="flagged">Flagged</option>
          </select>
          <select
            className="form-input"
            style={{ width: "auto" }}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="jpeg">Images</option>
            <option value="pdf">PDFs</option>
            <option value="acad">DWG</option>
            <option value="octet-stream">Other</option>
          </select>
        </div>

        <div className="card" style={{ overflow: "hidden" }}>
          {filtered.length === 0 ? (
            <div className="empty-state">
              <div style={{ fontSize: 14, fontWeight: 600 }}>No files match</div>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th><th>Workspace</th><th>Type</th><th>Size (MB)</th><th>Bucket</th><th>Created</th><th>Scan</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((f) => (
                    <tr key={f.id}>
                      <td style={{ fontSize: 13, fontWeight: 500 }}>{f.name}</td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{f.workspace}</td>
                      <td style={{ fontSize: 11, fontFamily: "monospace" }}>{f.type.split("/")[1]}</td>
                      <td style={{ fontSize: 13 }}>{f.size_mb.toFixed(1)}</td>
                      <td style={{ fontSize: 11, fontFamily: "monospace", color: "var(--text-muted)" }}>{f.bucket}</td>
                      <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{f.created}</td>
                      <td><span className={cn("badge", SCAN_CHIP[f.scan] ?? "chip-muted")}>{f.scan}</span></td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button className="btn btn-ghost btn-sm" title="Reprocess" onClick={() => alert(`Reprocessing ${f.name}`)}>
                            <RefreshCw size={12} />
                          </button>
                          <button className="btn btn-ghost btn-sm" title="Revoke Access" onClick={() => confirm(`Revoke access to ${f.name}?`)}>
                            <ShieldOff size={12} style={{ color: "var(--danger)" }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

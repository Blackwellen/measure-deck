"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, FileText, Eye, Download, Upload, Archive,
  Plus, Link2, Lock, Cpu, Building2, Layers, Zap,
  GitBranch, TreePine, User, Clock, Check, X,
  MessageSquare, AlertTriangle, ChevronRight, Save,
  ExternalLink, MoreHorizontal, History, Send,
} from "lucide-react";
import { cn, formatDate, formatDateTime, formatRelative } from "@/lib/utils";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "preview" | "details" | "revisions" | "linked" | "transmittals" | "annotations" | "bim" | "audit";
type DrawingStatus = "Current" | "Superseded" | "Under Review" | "Issued for Construction" | "As-Built" | "Preliminary";
type Discipline = "Architectural" | "Structural" | "MEP" | "Civil" | "Landscape" | "Coordination";
type FileType = "PDF" | "Image" | "DWG" | "IFC" | "glTF";
type RevStatus = "Current" | "Superseded" | "Preliminary" | "For Construction" | "As-Built";
type AnnotationType = "Comment" | "RFI" | "Markup" | "Clash";
type AnnotationStatus = "Open" | "Resolved";

interface Drawing {
  id: string; drawing_number: string; title: string; discipline: Discipline;
  revision: string; drawing_date: string; status: DrawingStatus;
  file_type: FileType; project_id: string; storage_path: string;
  file_size: number; thumbnail_path: string | null;
  originator?: string; scale?: string; sheet_size?: string;
  project_number?: string; description?: string;
}

interface Revision {
  id: string; revision: string; title: string; author: string;
  revision_date: string; status: RevStatus; notes: string;
  storage_path: string;
}

interface Transmittal {
  id: string; ref: string; date_issued: string; issued_to: string;
  revision: string; copies: number;
  purpose: "For Review" | "For Construction" | "For Information" | "For Approval";
  received: boolean; notes: string;
}

interface Annotation {
  id: string; user: string; timestamp: string;
  type: AnnotationType; description: string; status: AnnotationStatus;
}

interface AuditEntry {
  id: string; user: string; action: string; detail: string; timestamp: string;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const SEED_DRAWING: Drawing = {
  id: "d1", drawing_number: "A-001", title: "Ground Floor Plan",
  discipline: "Architectural", revision: "P4", drawing_date: "2025-11-10",
  status: "Current", file_type: "PDF", project_id: "p1",
  storage_path: "projects/p1/drawings/A-001-P4.pdf",
  file_size: 4718592, thumbnail_path: null,
  originator: "WSP Group", scale: "1:100", sheet_size: "A1",
  project_number: "ARC-2025-001",
  description: "Ground floor layout showing all rooms, corridors, structural grid and fire escape routes.",
};

const SEED_REVISIONS: Revision[] = [
  { id: "r4", revision: "P4", title: "Ground Floor Plan – Rev P4", author: "James Walsh", revision_date: "2025-11-10", status: "Current", notes: "Coordination update — fire escape widened per fire engineer comments", storage_path: "projects/p1/drawings/A-001-P4.pdf" },
  { id: "r3", revision: "P3", title: "Ground Floor Plan – Rev P3", author: "James Walsh", revision_date: "2025-10-15", status: "Superseded", notes: "Structural grid amended following engineer review", storage_path: "projects/p1/drawings/A-001-P3.pdf" },
  { id: "r2", revision: "P2", title: "Ground Floor Plan – Rev P2", author: "Sarah Chen", revision_date: "2025-09-20", status: "Superseded", notes: "Initial coordination issue resolved — column C4 relocated", storage_path: "projects/p1/drawings/A-001-P2.pdf" },
  { id: "r1", revision: "P1", title: "Ground Floor Plan – Rev P1", author: "Sarah Chen", revision_date: "2025-08-30", status: "Preliminary", notes: "First issue for comment", storage_path: "projects/p1/drawings/A-001-P1.pdf" },
];

const SEED_TRANSMITTALS: Transmittal[] = [
  { id: "t1", ref: "DTX-0042", date_issued: "2025-11-11", issued_to: "Main Contractor – Galliford Try", revision: "P4", copies: 3, purpose: "For Construction", received: true, notes: "Issued alongside structural drawing S-001 C2" },
  { id: "t2", ref: "DTX-0038", date_issued: "2025-10-16", issued_to: "Client – Arcadia Developments", revision: "P3", copies: 1, purpose: "For Review", received: true, notes: "" },
  { id: "t3", ref: "DTX-0031", date_issued: "2025-09-21", issued_to: "Main Contractor – Galliford Try", revision: "P2", copies: 2, purpose: "For Information", received: false, notes: "Awaiting acknowledgement" },
];

const SEED_ANNOTATIONS: Annotation[] = [
  { id: "an1", user: "Tom Hughes", timestamp: "2025-11-12T11:15:00", type: "Comment", description: "Grid lines A–D have been updated. Please check coordination with structural.", status: "Open" },
  { id: "an2", user: "Sarah Chen", timestamp: "2025-11-10T14:30:00", type: "RFI", description: "RFI-042: Confirm position of services riser at grid B3. Clash with drainage noted.", status: "Open" },
  { id: "an3", user: "James Walsh", timestamp: "2025-10-20T09:00:00", type: "Clash", description: "MEP services clash at Level 1 soffit — resolved in P4 revision.", status: "Resolved" },
  { id: "an4", user: "Priya Patel", timestamp: "2025-09-25T16:00:00", type: "Markup", description: "Dimensions updated on east elevation per client request.", status: "Resolved" },
];

const SEED_LINKED = {
  changeEvents: [
    { id: "ce1", ref: "VAR-001", title: "Additional groundworks — unforeseen rock", status: "Under Review" },
    { id: "ce2", ref: "INS-001", title: "Instruction — omit feature wall", status: "Approved" },
  ],
  applications: [
    { id: "ap1", app_number: "App No. 11", period: "Oct 2025", status: "Certified" },
    { id: "ap2", app_number: "App No. 12", period: "Nov 2025", status: "Submitted" },
  ],
  tasks: [
    { id: "tk1", ref: "TSK-012", title: "Review structural amendments with engineer", status: "In Progress", assignee: "Tom Hughes" },
    { id: "tk2", ref: "TSK-015", title: "Issue for construction sign-off", status: "Open", assignee: "Sarah Chen" },
  ],
  evidence: [
    { id: "ev1", ref: "EV-001", title: "Site photo — ground conditions", type: "Photo", date: "2025-11-12" },
    { id: "ev2", ref: "EV-002", title: "Soil investigation report", type: "Document", date: "2025-11-08" },
  ],
};

const SEED_AUDIT: AuditEntry[] = [
  { id: "au1", user: "James Walsh", action: "Uploaded revision", detail: "Revision P4 uploaded (4.5 MB PDF)", timestamp: "2025-11-10T09:30:00" },
  { id: "au2", user: "Sarah Chen", action: "Linked to change event", detail: "Linked to VAR-001 Additional groundworks", timestamp: "2025-11-11T14:00:00" },
  { id: "au3", user: "Tom Hughes", action: "Added annotation", detail: "Comment: Grid lines A–D updated", timestamp: "2025-11-12T11:15:00" },
  { id: "au4", user: "James Walsh", action: "Created transmittal", detail: "DTX-0042 issued to Galliford Try — For Construction", timestamp: "2025-11-11T10:00:00" },
  { id: "au5", user: "Admin", action: "Status changed", detail: "Status changed from Under Review to Current", timestamp: "2025-11-10T09:35:00" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CHIP: Record<DrawingStatus | RevStatus, string> = {
  "Current": "chip-success",
  "Superseded": "chip-muted",
  "Under Review": "chip-warning",
  "Issued for Construction": "chip-info",
  "As-Built": "chip-cyan",
  "Preliminary": "chip-muted",
  "For Construction": "chip-info",
};

const DISC_COLOR: Record<Discipline, { bg: string; color: string }> = {
  Architectural: { bg: "var(--primary-light)", color: "var(--primary)" },
  Structural:    { bg: "var(--warning-bg)",    color: "var(--warning)" },
  MEP:           { bg: "var(--danger-bg)",     color: "var(--danger)" },
  Civil:         { bg: "var(--success-bg)",    color: "var(--success)" },
  Landscape:     { bg: "#DCFCE7",              color: "#16A34A" },
  Coordination:  { bg: "var(--cyan-bg)",       color: "var(--cyan)" },
};

const ANNOTATION_CHIP: Record<AnnotationType, string> = {
  Comment: "chip-muted",
  RFI:     "chip-warning",
  Markup:  "chip-info",
  Clash:   "chip-danger",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const TABS: { id: Tab; label: string; v15?: boolean }[] = [
  { id: "preview",       label: "Preview" },
  { id: "details",       label: "Details" },
  { id: "revisions",     label: "Revisions" },
  { id: "linked",        label: "Linked Records" },
  { id: "transmittals",  label: "Transmittals" },
  { id: "annotations",   label: "Annotations" },
  { id: "bim",           label: "BIM Links", v15: true },
  { id: "audit",         label: "Audit" },
];

// ─── Tab: Preview ─────────────────────────────────────────────────────────────

function PreviewTab({ drawing }: { drawing: Drawing }) {
  const router = useRouter();
  return (
    <div className="p-6 space-y-6">
      {/* Main viewer area */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden" style={{ minHeight: 560 }}>
        <div className="h-full flex flex-col items-center justify-center gap-4 py-16" style={{ background: "var(--bg-muted)" }}>
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
            <FileText size={32} />
          </div>
          <div className="text-center">
            <p className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
              {drawing.file_type === "PDF" ? "PDF Drawing" : drawing.file_type + " File"}
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              {drawing.drawing_number} Rev {drawing.revision} · {formatFileSize(drawing.file_size)}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {drawing.file_type === "PDF" ? "Signed URL required to display PDF" : "Open in viewer to inspect this file"}
            </p>
          </div>
          <button
            className="btn btn-primary mt-2"
            onClick={() => router.push(`/drawings/${drawing.id}/viewer`)}
          >
            <Eye size={15} /> Open Full Screen Viewer
          </button>
        </div>
      </div>

      {/* File info strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "File Type", value: drawing.file_type },
          { label: "File Size", value: formatFileSize(drawing.file_size) },
          { label: "Sheet Size", value: drawing.sheet_size ?? "A1" },
          { label: "Scale", value: drawing.scale ?? "1:100" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>{label}</p>
            <p className="font-semibold mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/drawings/${drawing.id}/viewer`)}>
          <Eye size={14} /> Open in Viewer
        </button>
        <button className="btn btn-secondary btn-sm"><Download size={14} /> Download</button>
        <button className="btn btn-secondary btn-sm"><Upload size={14} /> Upload Revision</button>
      </div>
    </div>
  );
}

// ─── Tab: Details ─────────────────────────────────────────────────────────────

function DetailsTab({ drawing }: { drawing: Drawing }) {
  const [form, setForm] = useState({
    drawing_number: drawing.drawing_number,
    title: drawing.title,
    discipline: drawing.discipline as string,
    drawing_date: drawing.drawing_date,
    scale: drawing.scale ?? "1:100",
    sheet_size: drawing.sheet_size ?? "A1",
    originator: drawing.originator ?? "",
    project_number: drawing.project_number ?? "",
    description: drawing.description ?? "",
  });
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 600));
    setSaving(false);
    toast.success("Drawing details saved");
  }

  const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3B5EE8] focus:border-transparent";

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Drawing details */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <h3 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Drawing Details</h3>
          {[
            { label: "Drawing Number", key: "drawing_number", type: "text" },
            { label: "Title", key: "title", type: "text" },
            { label: "Drawing Date", key: "drawing_date", type: "date" },
            { label: "Scale", key: "scale", type: "text" },
            { label: "Sheet Size", key: "sheet_size", type: "text" },
            { label: "Originator", key: "originator", type: "text" },
            { label: "Project Number", key: "project_number", type: "text" },
          ].map(({ label, key, type }) => (
            <div key={key}>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>{label}</label>
              <input
                type={type}
                className={inputCls}
                value={(form as Record<string, string>)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Discipline</label>
            <select
              className={inputCls}
              value={form.discipline}
              onChange={e => setForm(f => ({ ...f, discipline: e.target.value }))}
            >
              {["Architectural", "Structural", "MEP", "Civil", "Landscape", "Coordination"].map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Description</label>
            <textarea
              rows={3}
              className={inputCls}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            <Save size={14} /> {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>

        {/* Right: File info */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-semibold text-sm mb-4" style={{ color: "var(--text-primary)" }}>File Information</h3>
            <dl className="space-y-3">
              {[
                { label: "File Type",   value: drawing.file_type },
                { label: "File Size",   value: formatFileSize(drawing.file_size) },
                { label: "Current Rev", value: drawing.revision },
                { label: "Status",      value: <span className={cn("badge", STATUS_CHIP[drawing.status])}>{drawing.status}</span> },
                { label: "Drawing Date", value: formatDate(drawing.drawing_date) },
                { label: "Storage Path", value: <span className="font-mono text-xs truncate block max-w-[200px]">{drawing.storage_path}</span> },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between text-sm">
                  <dt style={{ color: "var(--text-muted)" }}>{label}</dt>
                  <dd className="font-medium text-right">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-semibold text-sm mb-3" style={{ color: "var(--text-primary)" }}>Thumbnail</h3>
            <div className="h-32 rounded-xl flex items-center justify-center" style={{ background: "var(--bg-muted)" }}>
              {drawing.thumbnail_path ? (
                <img src={drawing.thumbnail_path} alt="Drawing thumbnail" className="h-full object-contain rounded-xl" />
              ) : (
                <div className="text-center">
                  <FileText size={28} style={{ color: "var(--text-disabled)" }} className="mx-auto mb-1" />
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>No thumbnail</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Revisions ───────────────────────────────────────────────────────────

function RevisionsTab({ revisions }: { revisions: Revision[] }) {
  const [showUpload, setShowUpload] = useState(false);
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Revision History</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{revisions.length} revisions · Current: {revisions.find(r => r.status === "Current")?.revision}</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowUpload(true)}>
          <Upload size={14} /> Upload New Revision
        </button>
      </div>

      {showUpload && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-sm">Upload New Revision</h4>
            <button onClick={() => setShowUpload(false)} className="btn btn-ghost btn-icon btn-sm"><X size={14} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Revision</label>
              <input type="text" placeholder="P5" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Status</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
                <option>Current</option>
                <option>Preliminary</option>
                <option>For Construction</option>
                <option>As-Built</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Revision Notes</label>
            <textarea rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" placeholder="Describe what changed in this revision…" />
          </div>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
            <Upload size={20} className="mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Drag & drop file here, or click to browse</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>PDF, DWG, IFC, Image · Max 200 MB</p>
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary btn-sm" onClick={() => { setShowUpload(false); toast.success("Revision uploaded"); }}>
              <Upload size={14} /> Upload Revision
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowUpload(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Revision</th>
              <th>Title</th>
              <th>Author</th>
              <th>Date</th>
              <th>Status</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {revisions.map(r => (
              <tr key={r.id} className={r.status === "Current" ? "bg-blue-50/50" : ""}>
                <td>
                  <span className={cn("font-mono font-bold text-xs px-2 py-0.5 rounded", r.status === "Current" ? "bg-[var(--primary-light)] text-[var(--primary)]" : "bg-gray-100 text-gray-600")}>
                    {r.revision}
                  </span>
                </td>
                <td className="font-medium text-sm">{r.title}</td>
                <td className="text-sm" style={{ color: "var(--text-secondary)" }}>{r.author}</td>
                <td className="text-sm" style={{ color: "var(--text-secondary)" }}>{formatDate(r.revision_date)}</td>
                <td>
                  <span className={cn("badge", STATUS_CHIP[r.status] ?? "chip-muted")}>{r.status}</span>
                </td>
                <td className="text-xs max-w-[200px] truncate" style={{ color: "var(--text-muted)" }} title={r.notes}>
                  {r.notes || "—"}
                </td>
                <td>
                  <div className="flex gap-1">
                    <button className="btn btn-ghost btn-icon btn-sm" title="View"><Eye size={13} /></button>
                    <button className="btn btn-ghost btn-icon btn-sm" title="Download"><Download size={13} /></button>
                    {r.status !== "Current" && (
                      <button className="btn btn-ghost btn-icon btn-sm" title="Make Current" onClick={() => toast.success(`Revision ${r.revision} set as current`)}>
                        <Check size={13} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab: Linked Records ──────────────────────────────────────────────────────

function LinkedRecordsTab() {
  const { changeEvents, applications, tasks, evidence } = SEED_LINKED;
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Linked Records</h3>
        <button className="btn btn-secondary btn-sm"><Link2 size={14} /> Link to Record</button>
      </div>

      {/* Change Events */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Change Events ({changeEvents.length})</span>
          <button className="btn btn-ghost btn-sm text-xs"><Plus size={12} /> Link CE</button>
        </div>
        <table className="data-table">
          <thead><tr><th>Ref</th><th>Title</th><th>Status</th><th /></tr></thead>
          <tbody>
            {changeEvents.map(c => (
              <tr key={c.id}>
                <td><span className="font-mono text-xs font-bold" style={{ color: "var(--primary)" }}>{c.ref}</span></td>
                <td className="font-medium text-sm">{c.title}</td>
                <td><span className={cn("badge", c.status === "Approved" ? "chip-success" : "chip-warning")}>{c.status}</span></td>
                <td><button className="btn btn-ghost btn-icon btn-sm"><ChevronRight size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Applications */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Applications ({applications.length})</span>
          <button className="btn btn-ghost btn-sm text-xs"><Plus size={12} /> Link Application</button>
        </div>
        <table className="data-table">
          <thead><tr><th>Application</th><th>Period</th><th>Status</th><th /></tr></thead>
          <tbody>
            {applications.map(a => (
              <tr key={a.id}>
                <td className="font-medium text-sm">{a.app_number}</td>
                <td className="text-sm" style={{ color: "var(--text-secondary)" }}>{a.period}</td>
                <td><span className={cn("badge", a.status === "Certified" ? "chip-success" : "chip-info")}>{a.status}</span></td>
                <td><button className="btn btn-ghost btn-icon btn-sm"><ChevronRight size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tasks */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Tasks ({tasks.length})</span>
          <button className="btn btn-ghost btn-sm text-xs"><Plus size={12} /> Link Task</button>
        </div>
        <table className="data-table">
          <thead><tr><th>Ref</th><th>Title</th><th>Assignee</th><th>Status</th><th /></tr></thead>
          <tbody>
            {tasks.map(t => (
              <tr key={t.id}>
                <td><span className="font-mono text-xs font-bold" style={{ color: "var(--primary)" }}>{t.ref}</span></td>
                <td className="font-medium text-sm">{t.title}</td>
                <td className="text-sm" style={{ color: "var(--text-secondary)" }}>{t.assignee}</td>
                <td><span className={cn("badge", t.status === "In Progress" ? "chip-warning" : "chip-info")}>{t.status}</span></td>
                <td><button className="btn btn-ghost btn-icon btn-sm"><ChevronRight size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Evidence */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Evidence Files ({evidence.length})</span>
          <button className="btn btn-ghost btn-sm text-xs"><Plus size={12} /> Link Evidence</button>
        </div>
        <table className="data-table">
          <thead><tr><th>Ref</th><th>Title</th><th>Type</th><th>Date</th><th /></tr></thead>
          <tbody>
            {evidence.map(e => (
              <tr key={e.id}>
                <td><span className="font-mono text-xs font-bold" style={{ color: "var(--cyan)" }}>{e.ref}</span></td>
                <td className="font-medium text-sm">{e.title}</td>
                <td><span className="badge chip-muted">{e.type}</span></td>
                <td className="text-sm" style={{ color: "var(--text-secondary)" }}>{formatDate(e.date)}</td>
                <td><button className="btn btn-ghost btn-icon btn-sm"><Eye size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab: Transmittals ────────────────────────────────────────────────────────

const PURPOSE_CHIP: Record<Transmittal["purpose"], string> = {
  "For Review":       "chip-warning",
  "For Construction": "chip-info",
  "For Information":  "chip-muted",
  "For Approval":     "chip-violet",
};

function TransmittalsTab({ transmittals }: { transmittals: Transmittal[] }) {
  const [showCreate, setShowCreate] = useState(false);
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">Drawing Transmittal Log</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{transmittals.length} transmittals recorded</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
          <Send size={14} /> Create Transmittal
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">New Transmittal</h4>
            <button onClick={() => setShowCreate(false)} className="btn btn-ghost btn-icon btn-sm"><X size={14} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Transmittal Ref", placeholder: "DTX-0043" },
              { label: "Issued To", placeholder: "Recipient name / company" },
            ].map(f => (
              <div key={f.label}>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>{f.label}</label>
                <input type="text" placeholder={f.placeholder} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Purpose</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
                <option>For Review</option>
                <option>For Construction</option>
                <option>For Information</option>
                <option>For Approval</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Copies</label>
              <input type="number" defaultValue={1} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Notes</label>
            <textarea rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary btn-sm" onClick={() => { setShowCreate(false); toast.success("Transmittal created"); }}>
              <Send size={14} /> Create Transmittal
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Transmittal Ref</th>
              <th>Date Issued</th>
              <th>Issued To</th>
              <th>Revision</th>
              <th>Copies</th>
              <th>Purpose</th>
              <th>Received</th>
              <th>Notes</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {transmittals.map(t => (
              <tr key={t.id}>
                <td><span className="font-mono text-xs font-bold" style={{ color: "var(--primary)" }}>{t.ref}</span></td>
                <td className="text-sm" style={{ color: "var(--text-secondary)" }}>{formatDate(t.date_issued)}</td>
                <td className="font-medium text-sm">{t.issued_to}</td>
                <td><span className="badge chip-muted font-mono">{t.revision}</span></td>
                <td className="text-center text-sm">{t.copies}</td>
                <td><span className={cn("badge", PURPOSE_CHIP[t.purpose])}>{t.purpose}</span></td>
                <td>
                  {t.received ? (
                    <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--success)" }}><Check size={12} /> Yes</span>
                  ) : (
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Pending</span>
                  )}
                </td>
                <td className="text-xs max-w-[150px] truncate" style={{ color: "var(--text-muted)" }} title={t.notes}>{t.notes || "—"}</td>
                <td><button className="btn btn-ghost btn-icon btn-sm"><MoreHorizontal size={13} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab: Annotations ─────────────────────────────────────────────────────────

function AnnotationsTab({ annotations }: { annotations: Annotation[] }) {
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [showAdd, setShowAdd] = useState(false);

  const filtered = annotations.filter(a =>
    (typeFilter === "All" || a.type === typeFilter) &&
    (statusFilter === "All" || a.status === statusFilter)
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-sm">Annotations & Markups</h3>
          <span className="badge chip-muted">{filtered.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            {["All", "Comment", "RFI", "Markup", "Clash"].map(v => <option key={v}>{v}</option>)}
          </select>
          <select
            className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            {["All", "Open", "Resolved"].map(v => <option key={v}>{v}</option>)}
          </select>
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(true)}>
            <Plus size={14} /> Add Annotation
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">New Annotation</h4>
            <button onClick={() => setShowAdd(false)} className="btn btn-ghost btn-icon btn-sm"><X size={14} /></button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Type</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
                <option>Comment</option><option>RFI</option><option>Markup</option><option>Clash</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Status</label>
              <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
                <option>Open</option><option>Resolved</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>Description</label>
            <textarea rows={3} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" />
          </div>
          <div className="flex gap-2">
            <button className="btn btn-primary btn-sm" onClick={() => { setShowAdd(false); toast.success("Annotation added"); }}>
              <Plus size={14} /> Add Annotation
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
            <MessageSquare size={28} className="mx-auto mb-3" style={{ color: "var(--text-disabled)" }} />
            <p className="font-medium text-sm">No annotations match the current filter</p>
          </div>
        ) : filtered.map(a => (
          <div key={a.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
              style={{ background: "var(--primary)" }}>
              {a.user.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="font-semibold text-sm">{a.user}</span>
                <span className={cn("badge text-xs", ANNOTATION_CHIP[a.type])}>{a.type}</span>
                <span className={cn("badge text-xs", a.status === "Resolved" ? "chip-success" : "chip-warning")}>
                  {a.status}
                </span>
                <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>{formatDateTime(a.timestamp)}</span>
              </div>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{a.description}</p>
            </div>
            {a.status === "Open" && (
              <button
                className="btn btn-ghost btn-sm btn-icon flex-shrink-0"
                title="Mark resolved"
                onClick={() => toast.success("Annotation resolved")}
              >
                <Check size={13} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Tab: BIM Links ───────────────────────────────────────────────────────────

const LINKED_BIM_ELEMENTS = [
  { id: "IFC-SLB-L0", element: "Ground Floor Slab", discipline: "Structural", model: "Eastside-Block-A-Struct-C2", coordination: "Clear" },
  { id: "IFC-WALL-EXT-L0", element: "External Walls — Level 0", discipline: "Architectural", model: "Eastside-Block-A-Arch-P4", coordination: "Clear" },
  { id: "IFC-MEP-FF-L0", element: "MEP First Fix — Level 0", discipline: "MEP", model: "Eastside-Block-A-MEP-B1", coordination: "Clash" },
];

function BIMLinksTab() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">Linked BIM Model Elements</h3>
        <div className="flex items-center gap-2">
          <Link href="/app/bim/bim-001" className="btn btn-secondary btn-sm"><Cpu size={14} />Open 3D Model</Link>
          <button className="btn btn-primary btn-sm"><Link2 size={14} />Link Element</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="kpi-card"><div className="kpi-label">Linked Elements</div><div className="kpi-value">{LINKED_BIM_ELEMENTS.length}</div></div>
        <div className="kpi-card"><div className="kpi-label">Disciplines</div><div className="kpi-value">3</div></div>
        <div className="kpi-card"><div className="kpi-label">Open Clashes</div><div className="kpi-value text-[var(--danger)]">{LINKED_BIM_ELEMENTS.filter(e => e.coordination === "Clash").length}</div></div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="data-table">
          <thead>
            <tr><th>Element ID</th><th>Element</th><th>Discipline</th><th>Source Model</th><th>Coordination</th></tr>
          </thead>
          <tbody>
            {LINKED_BIM_ELEMENTS.map(e => (
              <tr key={e.id}>
                <td className="font-mono text-xs font-semibold" style={{ color: "var(--primary)" }}>{e.id}</td>
                <td className="font-medium text-sm">{e.element}</td>
                <td className="text-sm" style={{ color: "var(--text-secondary)" }}>{e.discipline}</td>
                <td className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{e.model}</td>
                <td><span className={cn("badge", e.coordination === "Clear" ? "chip-success" : "chip-danger")}>{e.coordination}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Tab: Audit ───────────────────────────────────────────────────────────────

function AuditTab({ entries }: { entries: AuditEntry[] }) {
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
            {entries.map(e => (
              <tr key={e.id}>
                <td className="font-mono text-xs tabular-nums" style={{ color: "var(--text-muted)" }}>{formatDateTime(e.timestamp)}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                      style={{ background: "var(--primary)" }}>
                      {e.user.charAt(0)}
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

export default function DrawingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const drawingId = params.drawingId as string;

  const [tab, setTab] = useState<Tab>("preview");
  const [drawing, setDrawing] = useState<Drawing>(SEED_DRAWING);
  const [revisions, setRevisions] = useState<Revision[]>(SEED_REVISIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const [drRes, rvRes] = await Promise.all([
          supabase.from("drawing_register").select("*").eq("id", drawingId).single(),
          supabase.from("drawing_revisions").select("*").eq("drawing_id", drawingId).order("created_at", { ascending: false }),
        ]);
        if (drRes.data) setDrawing(drRes.data as Drawing);
        if (rvRes.data && rvRes.data.length > 0) setRevisions(rvRes.data as Revision[]);
      } catch {
        // use seed data
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [drawingId]);

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

  const discMeta = DISC_COLOR[drawing.discipline] ?? { bg: "var(--bg-muted)", color: "var(--text-secondary)" };

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
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md"
                style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                {drawing.drawing_number}
              </span>
              <span className="badge chip-muted font-mono text-xs">Rev {drawing.revision}</span>
              <span className={cn("badge", STATUS_CHIP[drawing.status] ?? "chip-muted")}>{drawing.status}</span>
              <span className="badge text-xs flex items-center gap-1"
                style={{ background: discMeta.bg, color: discMeta.color }}>
                {drawing.discipline}
              </span>
            </div>
            <h1 className="text-lg font-bold truncate" style={{ color: "var(--text-primary)" }}>{drawing.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
          <button className="btn btn-secondary btn-sm" onClick={() => router.push(`/drawings/${drawingId}/viewer`)}>
            <Eye size={14} /> Open Viewer
          </button>
          <button className="btn btn-secondary btn-sm"><Download size={14} /> Download</button>
          <button className="btn btn-secondary btn-sm" onClick={() => setTab("revisions")}>
            <Upload size={14} /> Upload Revision
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => toast.info("Drawing archived")}>
            <Archive size={14} /> Archive
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="px-6 py-3">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "Discipline",      value: drawing.discipline },
            { label: "Current Revision", value: `Rev ${drawing.revision}` },
            { label: "Drawing Date",    value: formatDate(drawing.drawing_date) },
            { label: "Status",          value: drawing.status },
            { label: "File Size",       value: formatFileSize(drawing.file_size) },
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
            className={cn("tab-item flex-shrink-0 flex items-center gap-1.5", tab === t.id && "active")}
            onClick={() => setTab(t.id)}
          >
            {t.label}
            {t.v15 && <span className="badge chip-violet text-[10px] px-1.5 py-0">V1.5</span>}
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
          {tab === "preview"      && <PreviewTab drawing={drawing} />}
          {tab === "details"      && <DetailsTab drawing={drawing} />}
          {tab === "revisions"    && <RevisionsTab revisions={revisions} />}
          {tab === "linked"       && <LinkedRecordsTab />}
          {tab === "transmittals" && <TransmittalsTab transmittals={SEED_TRANSMITTALS} />}
          {tab === "annotations"  && <AnnotationsTab annotations={SEED_ANNOTATIONS} />}
          {tab === "bim"          && <BIMLinksTab />}
          {tab === "audit"        && <AuditTab entries={SEED_AUDIT} />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

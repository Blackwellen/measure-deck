"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Upload, Search, Download, Share2, Link2, Trash2, X,
  FileText, Image, File, AlertTriangle, BookOpen, Clipboard,
  ChevronRight, Clock, User, Tag, CheckCircle2, ZoomIn,
  Filter, ExternalLink,
} from "lucide-react";
import { cn, formatDate, getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { createAuditEvent } from "@/lib/audit";

// ─── Types ────────────────────────────────────────────────────────────────────

type EvidenceType =
  | "Photo"
  | "Notice"
  | "Site Diary"
  | "Drawing"
  | "RFI"
  | "Instruction"
  | "Document";

interface EvidenceItem {
  ref: string;
  type: EvidenceType;
  title: string;
  date: string;
  uploadedBy: string;
  linkedTo: string | null;
  size: string;
  tags: string[];
}

interface CustodyEvent {
  label: string;
  detail: string;
  date: string;
  icon: "create" | "upload" | "link";
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const EVIDENCE_ITEMS: EvidenceItem[] = [
  {
    ref: "EV-001",
    type: "Photo",
    title: "Foundation waterproofing – Day 1",
    date: "2025-03-15",
    uploadedBy: "James Ward",
    linkedTo: "CH-024-011",
    size: "4.2 MB",
    tags: ["Foundations", "Week 11"],
  },
  {
    ref: "EV-002",
    type: "Notice",
    title: "PLN – Application #7",
    date: "2025-04-02",
    uploadedBy: "Sarah Chen",
    linkedTo: "APP-007",
    size: "234 KB",
    tags: ["Legal", "Payment"],
  },
  {
    ref: "EV-003",
    type: "Site Diary",
    title: "Site Diary – 14 Mar 2025",
    date: "2025-03-14",
    uploadedBy: "Marcus Thompson",
    linkedTo: null,
    size: "1.1 MB",
    tags: ["Daily", "Week 11"],
  },
  {
    ref: "EV-004",
    type: "Drawing",
    title: "Structural Rev C – Level 3",
    date: "2025-02-28",
    uploadedBy: "James Ward",
    linkedTo: "CH-024-009",
    size: "8.7 MB",
    tags: ["Structural", "Rev C"],
  },
  {
    ref: "EV-005",
    type: "RFI",
    title: "RFI-042 – Beam connection detail",
    date: "2025-03-22",
    uploadedBy: "Sarah Chen",
    linkedTo: "CH-024-012",
    size: "512 KB",
    tags: ["RFI", "Structure"],
  },
  {
    ref: "EV-006",
    type: "Photo",
    title: "Level 4 formwork completion",
    date: "2025-04-10",
    uploadedBy: "Marcus Thompson",
    linkedTo: null,
    size: "5.1 MB",
    tags: ["Level 4", "Formwork"],
  },
  {
    ref: "EV-007",
    type: "Instruction",
    title: "PM Instruction #18 – extra drainage",
    date: "2025-03-30",
    uploadedBy: "Rachel Kim",
    linkedTo: "CH-024-014",
    size: "89 KB",
    tags: ["Drainage", "Instruction"],
  },
  {
    ref: "EV-008",
    type: "Document",
    title: "Delay Analysis – Feb 2025",
    date: "2025-03-05",
    uploadedBy: "Sarah Chen",
    linkedTo: "CH-024-011",
    size: "2.3 MB",
    tags: ["Delay", "Analysis"],
  },
];

const TYPE_OPTIONS: EvidenceType[] = [
  "Photo",
  "Notice",
  "Site Diary",
  "Drawing",
  "RFI",
  "Instruction",
  "Document",
];

const LINKED_OPTIONS = [
  "All",
  "CH-024-009",
  "CH-024-011",
  "CH-024-012",
  "CH-024-014",
  "APP-007",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function typeIcon(type: EvidenceType) {
  switch (type) {
    case "Photo":
      return <Image size={14} />;
    case "Drawing":
      return <BookOpen size={14} />;
    case "Site Diary":
      return <Clipboard size={14} />;
    case "Notice":
      return <AlertTriangle size={14} />;
    case "RFI":
      return <FileText size={14} />;
    case "Instruction":
      return <FileText size={14} />;
    case "Document":
    default:
      return <File size={14} />;
  }
}

function typeBadgeClass(type: EvidenceType): string {
  switch (type) {
    case "Photo":
      return "chip-info";
    case "Notice":
      return "chip-danger";
    case "Drawing":
      return "chip-muted";
    case "RFI":
      return "chip-warning";
    case "Instruction":
      return "chip-warning";
    case "Site Diary":
      return "chip-success";
    case "Document":
    default:
      return "chip-muted";
  }
}

function custodyEvents(item: EvidenceItem): CustodyEvent[] {
  const events: CustodyEvent[] = [
    {
      label: "Document created",
      detail: `Created by ${item.uploadedBy}`,
      date: item.date,
      icon: "create",
    },
    {
      label: "Uploaded to MeasureDeck",
      detail: `Uploaded by ${item.uploadedBy} · ${item.size}`,
      date: item.date,
      icon: "upload",
    },
  ];
  if (item.linkedTo) {
    events.push({
      label: `Linked to ${item.linkedTo}`,
      detail: `Evidence linked to change / application record`,
      date: item.date,
      icon: "link",
    });
  }
  return events;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EvidencePage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [items] = useState<EvidenceItem[]>(EVIDENCE_ITEMS);
  const [selected, setSelected] = useState<EvidenceItem>(EVIDENCE_ITEMS[0]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | EvidenceType>("all");
  const [linkedFilter, setLinkedFilter] = useState("All");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [tags, setTags] = useState<string[]>(selected.tags);

  // Sync tags when selected item changes
  const handleSelect = useCallback((item: EvidenceItem) => {
    setSelected(item);
    setTags(item.tags);
    setDeleteConfirm(false);
  }, []);

  const handleDelete = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await createAuditEvent(supabase, {
          workspace_id: projectId,
          user_id: user.id,
          action: "evidence.delete",
          resource_type: "evidence",
          resource_id: selected.ref,
          old_values: { ref: selected.ref, title: selected.title },
        });
      }
    } catch {
      // silently continue
    }
    setDeleteConfirm(false);
  }, [selected, projectId]);

  const filtered = items.filter((item) => {
    const matchSearch =
      search === "" ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.ref.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || item.type === typeFilter;
    const matchLinked =
      linkedFilter === "All" ||
      (linkedFilter === "Unlinked" ? item.linkedTo === null : item.linkedTo === linkedFilter);
    return matchSearch && matchType && matchLinked;
  });

  const custody = custodyEvents(selected);

  return (
    <div className="flex gap-5" style={{ minHeight: "600px" }}>
      {/* ── Left panel — Evidence register ── */}
      <div className="flex-1 min-w-0 flex flex-col gap-4">
        {/* Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              className="form-input pl-8 text-sm"
              placeholder="Search evidence…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Type filter */}
          <div className="relative">
            <Filter
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "var(--text-muted)" }}
            />
            <select
              className="form-input pl-7 pr-8 text-sm"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as "all" | EvidenceType)}
            >
              <option value="all">All Types</option>
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Linked To filter */}
          <select
            className="form-input text-sm"
            value={linkedFilter}
            onChange={(e) => setLinkedFilter(e.target.value)}
          >
            {LINKED_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o === "All" ? "All Linked" : o}
              </option>
            ))}
          </select>

          {/* Upload */}
          <button className="btn btn-primary btn-sm ml-auto flex items-center gap-1.5">
            <Upload size={13} />
            Upload
          </button>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th>Ref</th>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Uploaded By</th>
                  <th>Linked To</th>
                  <th>Size</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-10" style={{ color: "var(--text-muted)" }}>
                      No evidence items match your filters.
                    </td>
                  </tr>
                )}
                {filtered.map((item) => (
                  <tr
                    key={item.ref}
                    onClick={() => handleSelect(item)}
                    className={cn(
                      "cursor-pointer transition-colors",
                      selected.ref === item.ref && "bg-[var(--primary-bg,#EFF2FD)]"
                    )}
                  >
                    <td>
                      <span className="font-mono text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                        {item.ref}
                      </span>
                    </td>
                    <td>
                      <span className={cn("badge", typeBadgeClass(item.type))}>
                        <span className="flex items-center gap-1">
                          {typeIcon(item.type)}
                          {item.type}
                        </span>
                      </span>
                    </td>
                    <td>
                      <span className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>
                        {item.title}
                      </span>
                    </td>
                    <td className="text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                      {formatDate(item.date)}
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                          style={{ background: "var(--primary)" }}
                        >
                          {getInitials(item.uploadedBy)}
                        </div>
                        <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
                          {item.uploadedBy}
                        </span>
                      </div>
                    </td>
                    <td>
                      {item.linkedTo ? (
                        <span
                          className="text-xs font-medium"
                          style={{ color: "var(--primary)" }}
                        >
                          {item.linkedTo}
                        </span>
                      ) : (
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          —
                        </span>
                      )}
                    </td>
                    <td className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {item.size}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          className="btn btn-ghost btn-icon"
                          title="Download"
                          onClick={(e) => { e.stopPropagation(); }}
                        >
                          <Download size={13} />
                        </button>
                        <button
                          className="btn btn-ghost btn-icon"
                          title="Share"
                          onClick={(e) => { e.stopPropagation(); }}
                        >
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
            className="px-4 py-2.5 border-t flex items-center justify-between"
            style={{ borderColor: "var(--border)", background: "var(--bg-muted)" }}
          >
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              {filtered.length} of {items.length} items
            </span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Total:{" "}
              {items.reduce((s, i) => {
                const num = parseFloat(i.size);
                return s + num;
              }, 0).toFixed(1)}{" "}
              MB
            </span>
          </div>
        </div>
      </div>

      {/* ── Right panel — Selected item detail ── */}
      <div
        className="w-80 flex-shrink-0 flex flex-col gap-4"
        style={{ minWidth: 300, maxWidth: 340 }}
      >
        {/* Preview area */}
        <div className="card overflow-hidden">
          <div
            className="flex flex-col items-center justify-center gap-3 py-10"
            style={{ background: "#1E293B" }}
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(255,255,255,0.08)" }}
            >
              <span style={{ color: "rgba(255,255,255,0.5)", transform: "scale(2.2)" }}>
                {typeIcon(selected.type)}
              </span>
            </div>
            <p
              className="text-xs font-medium text-center px-4 leading-snug"
              style={{ color: "rgba(255,255,255,0.7)" }}
            >
              {selected.title}
            </p>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
              {selected.size}
            </p>
            <button
              className="btn btn-sm flex items-center gap-1.5 text-xs mt-1"
              style={{
                background: "rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.8)",
                borderColor: "rgba(255,255,255,0.15)",
              }}
            >
              <ZoomIn size={12} />
              Open Full Screen
            </button>
          </div>
        </div>

        {/* Metadata */}
        <div className="card p-4 flex flex-col gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Metadata
          </h3>
          <MetaRow label="Ref" value={selected.ref} mono />
          <MetaRow
            label="Type"
            value={
              <span className={cn("badge", typeBadgeClass(selected.type))}>
                {selected.type}
              </span>
            }
          />
          <MetaRow
            label="Uploaded By"
            value={
              <div className="flex items-center gap-1.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                  style={{ background: "var(--primary)" }}
                >
                  {getInitials(selected.uploadedBy)}
                </div>
                <span>{selected.uploadedBy}</span>
              </div>
            }
          />
          <MetaRow label="Upload Date" value={formatDate(selected.date)} />
          <MetaRow label="File Size" value={selected.size} />
          {selected.linkedTo && (
            <>
              <MetaRow
                label="Linked Changes"
                value={
                  selected.linkedTo.startsWith("CH") ? (
                    <span className="font-medium" style={{ color: "var(--primary)" }}>
                      {selected.linkedTo}
                    </span>
                  ) : (
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>—</span>
                  )
                }
              />
              <MetaRow
                label="Linked Applications"
                value={
                  selected.linkedTo.startsWith("APP") ? (
                    <span className="font-medium" style={{ color: "var(--primary)" }}>
                      {selected.linkedTo}
                    </span>
                  ) : (
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>—</span>
                  )
                }
              />
            </>
          )}
        </div>

        {/* Tags */}
        <div className="card p-4 flex flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <Tag size={12} style={{ color: "var(--text-muted)" }} />
            <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Tags
            </h3>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="badge chip-muted flex items-center gap-1"
              >
                {tag}
                <button
                  onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                  className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X size={9} />
                </button>
              </span>
            ))}
            {tags.length === 0 && (
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                No tags
              </span>
            )}
          </div>
        </div>

        {/* Chain of Custody */}
        <div className="card p-4 flex flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <Clock size={12} style={{ color: "var(--text-muted)" }} />
            <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
              Chain of Custody
            </h3>
          </div>
          <div className="flex flex-col gap-0">
            {custody.map((evt, idx) => (
              <div key={idx} className="flex gap-2.5">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background:
                        evt.icon === "create"
                          ? "var(--success)"
                          : evt.icon === "link"
                          ? "var(--primary)"
                          : "var(--bg-muted)",
                      border: `1.5px solid ${
                        evt.icon === "create"
                          ? "var(--success)"
                          : evt.icon === "link"
                          ? "var(--primary)"
                          : "var(--border)"
                      }`,
                    }}
                  >
                    {evt.icon === "create" && <CheckCircle2 size={11} color="white" />}
                    {evt.icon === "upload" && <Upload size={10} style={{ color: "var(--text-secondary)" }} />}
                    {evt.icon === "link" && <Link2 size={11} color="white" />}
                  </div>
                  {idx < custody.length - 1 && (
                    <div
                      className="w-px flex-1 my-0.5"
                      style={{ background: "var(--border)", minHeight: 16 }}
                    />
                  )}
                </div>
                {/* Content */}
                <div className="pb-3 flex-1 min-w-0">
                  <p className="text-xs font-medium leading-snug" style={{ color: "var(--text-primary)" }}>
                    {evt.label}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {evt.detail}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {formatDate(evt.date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <button className="btn btn-secondary btn-sm flex-1 flex items-center justify-center gap-1.5">
              <Download size={13} />
              Download
            </button>
            <button className="btn btn-secondary btn-sm flex-1 flex items-center justify-center gap-1.5">
              <Share2 size={13} />
              Share
            </button>
          </div>
          <button className="btn btn-secondary btn-sm flex items-center justify-center gap-1.5">
            <Link2 size={13} />
            Link to Change
          </button>
          {deleteConfirm ? (
            <div
              className="rounded-xl p-3 flex flex-col gap-2"
              style={{ background: "var(--danger-bg, #FEF2F2)", border: "1px solid var(--danger)" }}
            >
              <p className="text-xs font-medium" style={{ color: "var(--danger)" }}>
                Delete this evidence item? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  className="btn btn-sm flex-1"
                  style={{ background: "var(--danger)", color: "white" }}
                  onClick={handleDelete}
                >
                  Confirm Delete
                </button>
                <button
                  className="btn btn-secondary btn-sm flex-1"
                  onClick={() => setDeleteConfirm(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              className="btn btn-ghost btn-sm flex items-center justify-center gap-1.5 text-xs"
              style={{ color: "var(--danger)" }}
              onClick={() => setDeleteConfirm(true)}
            >
              <Trash2 size={13} />
              Delete Evidence
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── MetaRow ──────────────────────────────────────────────────────────────────

function MetaRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)", minWidth: 90 }}>
        {label}
      </span>
      <span
        className={cn("text-xs text-right", mono && "font-mono")}
        style={{ color: "var(--text-primary)" }}
      >
        {value}
      </span>
    </div>
  );
}

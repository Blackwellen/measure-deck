"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Download, Link2, Archive, Trash2, Eye, RefreshCw,
  FileImage, FileText, Video, File, Tag, Plus, X, ExternalLink,
  Clock, User, Shield, Upload, Star, CheckCircle2, AlertCircle,
  MoreHorizontal, Camera, MapPin, Calendar,
} from "lucide-react";
import { cn, formatDate, formatDateTime, formatRelative, getInitials } from "@/lib/utils";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";

// ─── Supabase ─────────────────────────────────────────────────────────────────
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── Types ────────────────────────────────────────────────────────────────────
interface EvidenceFile {
  id: string;
  filename: string;
  storage_path: string;
  file_type: string;
  file_size: number;
  ai_classification: string | null;
  ai_description: string | null;
  tags: string[];
  date_taken: string | null;
  thumbnail_path: string | null;
  project_id: string | null;
  project_name: string | null;
  workspace_id: string;
  uploaded_by: string;
  created_at: string;
  status: "active" | "archived";
  signed_url: string | null;
}

interface LinkedRecord {
  id: string;
  linked_type: string;
  linked_id: string;
  ref: string;
  description: string;
  linked_date: string;
}

interface AccessLogEntry {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  ip: string;
}

interface NoteEntry {
  id: string;
  author: string;
  content: string;
  created_at: string;
}

interface VersionEntry {
  id: string;
  version: number;
  upload_date: string;
  uploaded_by: string;
  file_size: number;
  notes: string;
  is_current: boolean;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────
const SEED_FILE: EvidenceFile = {
  id: "ef-001",
  filename: "site-photo-foundation-day3.jpg",
  storage_path: "workspaces/ws-001/evidence/ef-001.jpg",
  file_type: "image/jpeg",
  file_size: 2_516_582,
  ai_classification: "Site Progress Photo",
  ai_description: "Photograph shows concrete foundation pour in progress on day 3 of construction. Grid lines A through D are visible. Workers are operating a concrete pump approximately 4m from the north face. Foundation depth appears consistent at approximately 1.2m. Safety barriers and hoarding are visible in the background.",
  tags: ["foundation", "concrete", "day-3", "progress"],
  date_taken: "2026-06-08",
  thumbnail_path: null,
  project_id: "proj-001",
  project_name: "Phase 1 — Foundation Works",
  workspace_id: "ws-001",
  uploaded_by: "James Thornton",
  created_at: "2026-06-08T11:32:00Z",
  status: "active",
  signed_url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80",
};

const SEED_LINKED: LinkedRecord[] = [
  { id: "lr-1", linked_type: "Project", linked_id: "proj-001", ref: "PRJ-001", description: "Phase 1 — Foundation Works", linked_date: "2026-06-08T11:35:00Z" },
  { id: "lr-2", linked_type: "Change Event", linked_id: "ce-001", ref: "CE-001", description: "Additional Concrete Depth — grid A-D", linked_date: "2026-06-09T09:00:00Z" },
];

const SEED_AI = {
  classification: "Site Progress Photo",
  confidence: 94,
  description: "Photograph shows concrete foundation pour in progress on day 3 of construction. Grid lines A through D are visible. Workers are operating a concrete pump approximately 4m from the north face. Foundation depth appears consistent with specification.",
  entities: ["Concrete pump", "Foundation depth", "Grid reference A-D", "Workers", "Safety hoarding"],
  suggested_tags: ["foundation", "concrete", "progress", "day-3", "pour"],
  detected_date: "2026-06-08",
  detected_location: "Grid A-D, Site North face",
  analysed_at: "2026-06-08T11:40:00Z",
};

const SEED_ACCESS: AccessLogEntry[] = [
  { id: "al-1", user: "James Thornton", action: "Uploaded", timestamp: "2026-06-08T11:32:00Z", ip: "192.168.1.10" },
  { id: "al-2", user: "James Thornton", action: "Viewed", timestamp: "2026-06-08T11:35:00Z", ip: "192.168.1.10" },
  { id: "al-3", user: "Sarah Malik", action: "Downloaded", timestamp: "2026-06-09T11:25:00Z", ip: "10.0.0.5" },
  { id: "al-4", user: "David Chen", action: "Viewed", timestamp: "2026-06-10T09:05:00Z", ip: "10.0.0.8" },
  { id: "al-5", user: "Sarah Malik", action: "Linked", timestamp: "2026-06-09T09:00:00Z", ip: "10.0.0.5" },
];

const SEED_NOTES: NoteEntry[] = [
  { id: "n-1", author: "James Thornton", content: "Foundation depth confirmed at 1.2m — matches specification. Concrete pour completed without incident.", created_at: "2026-06-08T12:00:00Z" },
  { id: "n-2", author: "Sarah Malik", content: "I have linked this to CE-001 (Additional Concrete Depth) for records. Will also attach to the valuation application next week.", created_at: "2026-06-09T09:10:00Z" },
];

const SEED_VERSIONS: VersionEntry[] = [
  { id: "v-1", version: 1, upload_date: "2026-06-08T11:32:00Z", uploaded_by: "James Thornton", file_size: 2_516_582, notes: "Original upload — full resolution site photo", is_current: true },
];

const TABS = ["Preview", "Details", "Linked Records", "AI Analysis", "Versions", "Access Log", "Notes"] as const;
type TabId = typeof TABS[number];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1_073_741_824) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1_073_741_824).toFixed(2)} GB`;
}

function getFileIcon(mimeType: string, size = 20) {
  if (mimeType.startsWith("image/")) return <FileImage size={size} className="text-blue-500" />;
  if (mimeType.startsWith("video/")) return <Video size={size} className="text-purple-500" />;
  if (mimeType === "application/pdf") return <FileText size={size} className="text-red-500" />;
  return <File size={size} className="text-gray-400" />;
}

function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "Image";
  if (mimeType.startsWith("video/")) return "Video";
  if (mimeType === "application/pdf") return "PDF Document";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "Spreadsheet";
  if (mimeType.includes("word") || mimeType.includes("document")) return "Word Document";
  return "File";
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-gray-100 rounded-lg", className)} />;
}

const LINKED_TYPE_CHIPS: Record<string, string> = {
  "Project": "chip-info",
  "Change Event": "chip-warning",
  "Application": "chip-approved",
  "Task": "chip-muted",
  "Final Account": "chip-success",
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function EvidenceDetailPage() {
  const router = useRouter();
  const { evidenceId } = useParams<{ evidenceId: string }>();
  const [file, setFile] = useState<EvidenceFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("Preview");
  const [notes, setNotes] = useState<NoteEntry[]>(SEED_NOTES);
  const [newNote, setNewNote] = useState("");
  const [tags, setTags] = useState<string[]>(SEED_FILE.tags);
  const [newTag, setNewTag] = useState("");
  const [aiAnalysing, setAiAnalysing] = useState(false);
  const [aiResult, setAiResult] = useState(SEED_AI);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [editableDescription, setEditableDescription] = useState(SEED_FILE.ai_description ?? "");
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data: row } = await supabase
          .from("evidence_files")
          .select("*, projects(name)")
          .eq("id", evidenceId)
          .single();
        if (row) {
          setFile({
            ...row,
            project_name: row.projects?.name ?? null,
            tags: row.tags ?? [],
            status: "active",
            uploaded_by: "James Thornton",
            signed_url: SEED_FILE.signed_url,
          } as EvidenceFile);
        } else {
          setFile(SEED_FILE);
        }
      } catch {
        setFile(SEED_FILE);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [evidenceId]);

  const data = file ?? SEED_FILE;
  const isImage = data.file_type.startsWith("image/");
  const isVideo = data.file_type.startsWith("video/");
  const isPdf = data.file_type === "application/pdf";

  // ─── Tab: Preview ──────────────────────────────────────────────────────────
  function TabPreview() {
    return (
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {isImage && data.signed_url ? (
            <div className="bg-gray-950 flex items-center justify-center min-h-[400px] max-h-[600px] overflow-hidden">
              <img
                src={data.signed_url}
                alt={data.filename}
                className="max-w-full max-h-[600px] object-contain"
              />
            </div>
          ) : isVideo && data.signed_url ? (
            <div className="bg-black">
              <video controls className="w-full max-h-[500px]" src={data.signed_url}>
                Your browser does not support the video tag.
              </video>
            </div>
          ) : isPdf && data.signed_url ? (
            <div className="p-6 text-center">
              <iframe src={data.signed_url} className="w-full h-[600px] border-0 rounded-lg" title={data.filename} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              {getFileIcon(data.file_type, 56)}
              <p className="text-gray-500 text-sm">{data.filename}</p>
              <button className="btn-primary flex items-center gap-2" onClick={() => toast.info("Opening file...")}>
                <ExternalLink size={14} /> Open in Viewer
              </button>
            </div>
          )}
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">File Metadata</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Filename</p>
              <p className="text-sm font-medium text-gray-900 mt-1 truncate">{data.filename}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">MIME Type</p>
              <p className="text-sm font-mono text-gray-700 mt-1">{data.file_type}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">File Size</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{formatFileSize(data.file_size)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Category</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{getFileCategory(data.file_type)}</p>
            </div>
            {isImage && (
              <>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Dimensions</p>
                  <p className="text-sm text-gray-700 mt-1">4032 × 3024 px</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Colour Space</p>
                  <p className="text-sm text-gray-700 mt-1">sRGB</p>
                </div>
              </>
            )}
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Date Taken</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{formatDate(data.date_taken)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Uploaded</p>
              <p className="text-sm font-medium text-gray-900 mt-1">{formatDateTime(data.created_at)}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Tab: Details ──────────────────────────────────────────────────────────
  function TabDetails() {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-5">File Information</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 font-medium uppercase tracking-wide block mb-1">Original Filename</label>
              <p className="text-sm text-gray-900 font-medium bg-gray-50 px-3 py-2 rounded-lg">{data.filename}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium uppercase tracking-wide block mb-1">File Size</label>
              <p className="text-sm text-gray-900 font-medium bg-gray-50 px-3 py-2 rounded-lg">{formatFileSize(data.file_size)}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium uppercase tracking-wide block mb-1">Upload Date</label>
              <p className="text-sm text-gray-900 font-medium bg-gray-50 px-3 py-2 rounded-lg">{formatDateTime(data.created_at)}</p>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium uppercase tracking-wide block mb-1">Uploaded By</label>
              <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                <div className="w-6 h-6 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-[10px] font-bold">
                  {getInitials(data.uploaded_by)}
                </div>
                <span className="text-sm font-medium text-gray-900">{data.uploaded_by}</span>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium uppercase tracking-wide block mb-1">Storage Path</label>
              <p className="text-xs text-gray-500 font-mono bg-gray-50 px-3 py-2 rounded-lg break-all">{data.storage_path}</p>
            </div>
            {data.project_name && (
              <div>
                <label className="text-xs text-gray-500 font-medium uppercase tracking-wide block mb-1">Project</label>
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg">
                  <span className="text-sm font-medium text-[var(--primary)]">{data.project_name}</span>
                  <ExternalLink size={12} className="text-gray-400" />
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-5">Classification &amp; Tags</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 font-medium uppercase tracking-wide block mb-2">AI Classification</label>
              {data.ai_classification ? (
                <span className="chip-info">{data.ai_classification}</span>
              ) : (
                <span className="chip-muted">Unclassified</span>
              )}
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium uppercase tracking-wide block mb-1">AI Description (editable)</label>
              <textarea
                rows={5}
                value={editableDescription}
                onChange={e => setEditableDescription(e.target.value)}
                className="form-input w-full resize-none text-sm"
                placeholder="AI-generated description will appear here..."
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium uppercase tracking-wide block mb-2">Tags</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md font-medium">
                    <Tag size={10} /> {tag}
                    <button onClick={() => setTags(tags.filter(t => t !== tag))} className="hover:text-red-500 ml-0.5">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && newTag.trim()) {
                      setTags([...tags, newTag.trim()]);
                      setNewTag("");
                    }
                  }}
                  placeholder="Add tag and press Enter"
                  className="form-input flex-1 text-sm"
                />
                <button className="btn-secondary text-sm" onClick={() => {
                  if (newTag.trim()) { setTags([...tags, newTag.trim()]); setNewTag(""); }
                }}>Add</button>
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium uppercase tracking-wide block mb-1">Date Taken</label>
              <input type="date" defaultValue={data.date_taken ?? ""} className="form-input w-full" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium uppercase tracking-wide block mb-1">Category</label>
              <select className="form-input w-full">
                <option value="photo">Photo</option>
                <option value="document">Document</option>
                <option value="video">Video</option>
                <option value="drawing">Drawing</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end">
            <button className="btn-primary text-sm px-5" onClick={() => toast.success("Changes saved")}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Tab: Linked Records ───────────────────────────────────────────────────
  function TabLinkedRecords() {
    const byType: Record<string, LinkedRecord[]> = {};
    SEED_LINKED.forEach(r => {
      if (!byType[r.linked_type]) byType[r.linked_type] = [];
      byType[r.linked_type].push(r);
    });
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-gray-900">Linked Records</h3>
              <p className="text-xs text-gray-500 mt-0.5">{SEED_LINKED.length} record(s) linked to this file</p>
            </div>
            <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => setShowLinkModal(true)}>
              <Link2 size={14} /> Link to Record
            </button>
          </div>
          {Object.entries(byType).map(([type, records]) => (
            <div key={type} className="mb-5">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                <span className={LINKED_TYPE_CHIPS[type] ?? "chip-muted"}>{type}</span>
                <span className="text-gray-400">({records.length})</span>
              </h4>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Ref</th>
                    <th>Description</th>
                    <th>Linked Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map(r => (
                    <tr key={r.id}>
                      <td><span className={LINKED_TYPE_CHIPS[r.linked_type] ?? "chip-muted"}>{r.linked_type}</span></td>
                      <td className="font-mono text-sm font-medium text-blue-700">{r.ref}</td>
                      <td className="text-sm">{r.description}</td>
                      <td className="text-sm text-gray-500">{formatDateTime(r.linked_date)}</td>
                      <td>
                        <button className="text-xs text-red-500 hover:text-red-700 font-medium" onClick={() => toast.error("Unlink record?")}>
                          Unlink
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Link Modal */}
        {showLinkModal && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-gray-900">Link to Record</h3>
                <button onClick={() => setShowLinkModal(false)} className="btn-ghost p-1"><X size={16} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Entity Type</label>
                  <select className="form-input w-full">
                    <option>Change Event</option>
                    <option>Project</option>
                    <option>Application for Payment</option>
                    <option>Final Account</option>
                    <option>Task</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Search Record</label>
                  <input type="text" placeholder="Search by ref or name..." className="form-input w-full" />
                </div>
              </div>
              <div className="mt-5 flex justify-end gap-2">
                <button className="btn-secondary" onClick={() => setShowLinkModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={() => { toast.success("Record linked"); setShowLinkModal(false); }}>Link Record</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Tab: AI Analysis ─────────────────────────────────────────────────────
  function TabAiAnalysis() {
    function handleReanalyse() {
      setAiAnalysing(true);
      setTimeout(() => {
        setAiAnalysing(false);
        toast.success("AI analysis complete");
      }, 2500);
    }
    return (
      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-gray-900">AI Analysis</h3>
            <button
              className="btn-secondary flex items-center gap-2 text-sm"
              onClick={handleReanalyse}
              disabled={aiAnalysing}
            >
              <RefreshCw size={14} className={aiAnalysing ? "animate-spin" : ""} />
              {aiAnalysing ? "Analysing..." : "Re-analyse"}
            </button>
          </div>
          {aiAnalysing ? (
            <div className="space-y-3">
              <div className="animate-pulse bg-gray-100 rounded-lg h-6 w-1/3" />
              <div className="animate-pulse bg-gray-100 rounded-lg h-4 w-full" />
              <div className="animate-pulse bg-gray-100 rounded-lg h-4 w-5/6" />
              <div className="animate-pulse bg-gray-100 rounded-lg h-4 w-4/5" />
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Classification</p>
                  <span className="chip-info">{aiResult.classification}</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Confidence</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                      <div
                        className="bg-green-500 h-2.5 rounded-full transition-all"
                        style={{ width: `${aiResult.confidence}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-green-600">{aiResult.confidence}%</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">AI Description</p>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-xl">{aiResult.description}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Key Entities Detected</p>
                <div className="flex flex-wrap gap-1.5">
                  {aiResult.entities.map(entity => (
                    <span key={entity} className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-md font-medium">{entity}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">Suggested Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {aiResult.suggested_tags.map(t => (
                    <button key={t} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-md font-medium hover:bg-blue-100 transition flex items-center gap-1"
                      onClick={() => { if (!tags.includes(t)) { setTags([...tags, t]); toast.success(`Tag "${t}" added`); } }}>
                      <Plus size={10} /> {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Detected Date</p>
                  <p className="text-sm text-gray-900 flex items-center gap-1.5"><Calendar size={13} className="text-gray-400" /> {formatDate(aiResult.detected_date)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Detected Location</p>
                  <p className="text-sm text-gray-900 flex items-center gap-1.5"><MapPin size={13} className="text-gray-400" /> {aiResult.detected_location}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Analysed At</p>
                  <p className="text-sm text-gray-900">{formatDateTime(aiResult.analysed_at)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Tab: Versions ─────────────────────────────────────────────────────────
  function TabVersions() {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">Version History</h3>
          <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => toast.info("Upload new version")}>
            <Upload size={14} /> Upload New Version
          </button>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Version</th>
              <th>Upload Date</th>
              <th>Uploaded By</th>
              <th>File Size</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {SEED_VERSIONS.map(v => (
              <tr key={v.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">v{v.version}.0</span>
                    {v.is_current && <span className="chip-approved text-xs">Current</span>}
                  </div>
                </td>
                <td className="text-sm">{formatDateTime(v.upload_date)}</td>
                <td className="text-sm">{v.uploaded_by}</td>
                <td className="text-sm">{formatFileSize(v.file_size)}</td>
                <td className="text-sm text-gray-500 max-w-[200px] truncate">{v.notes || "—"}</td>
                <td>
                  <div className="flex items-center gap-1">
                    <button className="btn-ghost text-xs p-1" onClick={() => toast.info("View version")} title="View"><Eye size={13} /></button>
                    <button className="btn-ghost text-xs p-1" onClick={() => toast.success("Downloading...")} title="Download"><Download size={13} /></button>
                    {!v.is_current && (
                      <button className="btn-ghost text-xs px-2 py-1 text-[var(--primary)]" onClick={() => toast.success("Set as current version")}>
                        Make Current
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-400 mt-4">Older versions are retained for 12 months in line with your workspace retention policy.</p>
      </div>
    );
  }

  // ─── Tab: Access Log ───────────────────────────────────────────────────────
  function TabAccessLog() {
    const actionColors: Record<string, string> = {
      "Uploaded": "chip-info",
      "Viewed": "chip-muted",
      "Downloaded": "chip-warning",
      "Linked": "chip-approved",
      "Deleted": "chip-danger",
    };
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">Access Log</h3>
          <span className="text-xs text-gray-500">{SEED_ACCESS.length} entries</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Action</th>
              <th>Timestamp</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {SEED_ACCESS.map(entry => (
              <tr key={entry.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                      {getInitials(entry.user)}
                    </div>
                    <span className="text-sm font-medium">{entry.user}</span>
                  </div>
                </td>
                <td><span className={actionColors[entry.action] ?? "chip-muted"}>{entry.action}</span></td>
                <td className="text-sm text-gray-600">{formatDateTime(entry.timestamp)}</td>
                <td className="font-mono text-xs text-gray-500">{entry.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 flex items-start gap-2">
          <Shield size={14} className="shrink-0 mt-0.5" />
          Access logs are retained for compliance purposes. IP addresses are masked for users outside your organisation.
        </div>
      </div>
    );
  }

  // ─── Tab: Notes ────────────────────────────────────────────────────────────
  function TabNotes() {
    function addNote() {
      if (!newNote.trim()) return;
      const entry: NoteEntry = {
        id: `n-${Date.now()}`,
        author: "James Thornton",
        content: newNote.trim(),
        created_at: new Date().toISOString(),
      };
      setNotes(prev => [entry, ...prev]);
      setNewNote("");
      toast.success("Note added");
    }
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Add a Note</h3>
          <textarea
            rows={3}
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            placeholder="Write a note about this file..."
            className="form-input w-full resize-none"
          />
          <div className="mt-3 flex justify-end">
            <button className="btn-primary text-sm px-5" onClick={addNote} disabled={!newNote.trim()}>
              Add Note
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {notes.map(note => (
            <div key={note.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-[var(--primary)] text-white flex items-center justify-center text-sm font-bold shrink-0">
                    {getInitials(note.author)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">{note.author}</span>
                      <span className="text-xs text-gray-400">{formatDateTime(note.created_at)}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1 leading-relaxed">{note.content}</p>
                  </div>
                </div>
                <button
                  className="btn-ghost p-1 text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                  onClick={() => {
                    setNotes(prev => prev.filter(n => n.id !== note.id));
                    toast.success("Note deleted");
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {notes.length === 0 && (
            <div className="text-center py-10 text-gray-400 bg-white rounded-2xl border border-gray-200">
              <FileText size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No notes yet. Add the first note above.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 space-y-4 max-w-5xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)}
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  const tabContent: Record<TabId, React.ReactNode> = {
    "Preview": <TabPreview />,
    "Details": <TabDetails />,
    "Linked Records": <TabLinkedRecords />,
    "AI Analysis": <TabAiAnalysis />,
    "Versions": <TabVersions />,
    "Access Log": <TabAccessLog />,
    "Notes": <TabNotes />,
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => router.back()} className="btn-ghost p-2 mt-0.5 shrink-0">
            <ArrowLeft size={18} />
          </button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                {getFileIcon(data.file_type, 22)}
                <h1 className="text-xl font-bold text-gray-900 truncate max-w-[400px]">{data.filename}</h1>
              </div>
              <span className={data.status === "active" ? "chip-approved" : "chip-muted"}>
                {data.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {getFileCategory(data.file_type)} · {formatFileSize(data.file_size)} · Uploaded {formatDate(data.created_at)}
              {data.project_name && <> · <span className="text-[var(--primary)] font-medium">{data.project_name}</span></>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="btn-secondary flex items-center gap-2 text-sm" onClick={() => toast.info("Opening preview...")}>
            <Eye size={14} /> Preview
          </button>
          <button className="btn-secondary flex items-center gap-2 text-sm" onClick={() => toast.success("Downloading...")}>
            <Download size={14} /> Download
          </button>
          <button className="btn-primary flex items-center gap-2 text-sm" onClick={() => setShowLinkModal(true)}>
            <Link2 size={14} /> Link to Record
          </button>
          <div className="relative">
            <button className="btn-ghost p-2" onClick={() => setShowMoreMenu(!showMoreMenu)}>
              <MoreHorizontal size={18} />
            </button>
            {showMoreMenu && (
              <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-xl shadow-lg w-40 z-10">
                <button className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition flex items-center gap-2"
                  onClick={() => { toast.info("Archive file"); setShowMoreMenu(false); }}>
                  <Archive size={13} /> Archive
                </button>
                <button className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition flex items-center gap-2"
                  onClick={() => { toast.error("Delete file?"); setShowMoreMenu(false); }}>
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="kpi-card border-l-4 border-l-blue-500">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">File Type</p>
          <div className="flex items-center gap-2 mt-2">{getFileIcon(data.file_type, 20)}<span className="font-semibold text-gray-900 text-sm">{getFileCategory(data.file_type)}</span></div>
        </div>
        <div className="kpi-card border-l-4 border-l-purple-500">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">File Size</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{formatFileSize(data.file_size)}</p>
        </div>
        <div className="kpi-card border-l-4 border-l-green-500">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Linked Records</p>
          <p className="text-xl font-bold text-gray-900 mt-1">{SEED_LINKED.length}</p>
          <p className="text-xs text-gray-400 mt-0.5">records linked</p>
        </div>
        <div className="kpi-card border-l-4 border-l-amber-400">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">AI Classification</p>
          <div className="mt-2">
            {data.ai_classification
              ? <span className="chip-info text-xs">{data.ai_classification}</span>
              : <span className="chip-muted text-xs">Unclassified</span>}
          </div>
        </div>
        <div className="kpi-card border-l-4 border-l-gray-300">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Date Taken</p>
          <p className="text-sm font-bold text-gray-900 mt-1">{formatDate(data.date_taken)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Captured</p>
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="border-b border-gray-200">
          <div className="flex gap-0">
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "px-4 py-3 text-sm font-medium whitespace-nowrap transition border-b-2 -mb-px",
                  activeTab === tab
                    ? "border-[var(--primary)] text-[var(--primary)]"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-6">{tabContent[activeTab]}</div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Edit2, Archive, Mail, Phone, Building2, Activity,
  Layers, StickyNote, User, Clock, ExternalLink, Plus,
  MessageSquare, Calendar, CheckCircle, Flag, Tag,
  Link2, MapPin, Users, FileText, Download, Upload,
  MoreHorizontal, RefreshCw, AlertCircle,
} from "lucide-react";
import { cn, formatDate, formatRelative, getInitials } from "@/lib/utils";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";

/* ─────────────────────────── Types ─────────────────────────── */

interface Contact {
  id: string;
  name: string;
  role: string;
  company: string;
  supplier_id: string;
  email: string;
  phone: string;
  mobile?: string;
  department?: string;
  linkedin_url?: string;
  address?: string;
  last_contact: string;
  notes: string;
  tags?: string[];
  relationship_type?: string;
  workspace_member?: boolean;
}

interface CommunicationLog {
  id: string;
  type: "email" | "call" | "meeting" | "note";
  date: string;
  summary: string;
  outcome?: string;
  logged_by: string;
}

interface ProjectLink {
  id: string;
  project_name: string;
  role_on_project: string;
  since: string;
  status: string;
}

interface ContactTask {
  id: string;
  title: string;
  project: string;
  due_date: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "To Do" | "In Progress" | "In Review" | "Done";
  assignee: string;
}

interface ContactDocument {
  id: string;
  name: string;
  doc_type: string;
  date: string;
  direction: "Sent" | "Received";
  size: string;
}

interface ActivityItem {
  id: string;
  type: "create" | "edit" | "email" | "call" | "meeting" | "note" | "link";
  description: string;
  actor: string;
  created_at: string;
  field?: string;
  old_value?: string;
  new_value?: string;
}

/* ─────────────────────────── Seed ─────────────────────────── */

const SEED_CONTACTS: Record<string, Contact> = {
  "con-001": {
    id: "con-001", name: "Mark Hughes", role: "Director", department: "Senior Management",
    company: "Apex Groundworks Ltd", supplier_id: "sup-001",
    email: "mark.hughes@apexgw.co.uk", phone: "01234 567890", mobile: "07700 900123",
    linkedin_url: "linkedin.com/in/markhughes", address: "Unit 12, Apex House, Birmingham, B37 7YB",
    last_contact: "2026-06-05", relationship_type: "Subcontractor", workspace_member: false,
    notes: "Key decision maker. Prefers calls on Tuesday/Thursday mornings. Very responsive to email. Met at CIOB conference 2025.",
    tags: ["director", "key-contact", "groundworks"],
  },
  "con-002": {
    id: "con-002", name: "Lisa Hughes", role: "Estimator", department: "Commercial",
    company: "Apex Groundworks Ltd", supplier_id: "sup-001",
    email: "l.hughes@apexgw.co.uk", phone: "01234 567891", mobile: "07700 900124",
    last_contact: "2026-05-28", relationship_type: "Subcontractor", workspace_member: false,
    notes: "Handles all tender pricing. Will need 2 weeks notice for quotes.",
    tags: ["estimator", "commercial"],
  },
  "con-003": {
    id: "con-003", name: "Sarah Chen", role: "Account Manager", department: "Sales",
    company: "BrightBuild Materials", supplier_id: "sup-002",
    email: "s.chen@brightbuild.co.uk", phone: "0161 234 5678", mobile: "07700 900456",
    linkedin_url: "linkedin.com/in/sarahchen",
    last_contact: "2026-06-08", relationship_type: "Supplier", workspace_member: false,
    notes: "Primary account manager for all BrightBuild orders. Good at sorting delivery issues quickly.",
    tags: ["account-manager", "materials"],
  },
  "con-004": {
    id: "con-004", name: "Dave Okafor", role: "Operations Manager", department: "Operations",
    company: "CraneKing Plant Hire", supplier_id: "sup-003",
    email: "d.okafor@cranekingph.co.uk", phone: "0121 345 6789",
    last_contact: "2026-05-15", relationship_type: "Supplier", workspace_member: false,
    notes: "",
    tags: ["plant", "operations"],
  },
  "con-006": {
    id: "con-006", name: "James Whitfield", role: "Senior Consultant", department: "Structural Engineering",
    company: "Exton Consulting Engineers", supplier_id: "sup-005",
    email: "j.whitfield@extonconsult.co.uk", phone: "01865 234567", mobile: "07700 901234",
    linkedin_url: "linkedin.com/in/jwhitfield",
    last_contact: "2026-06-09", relationship_type: "Consultant", workspace_member: false,
    notes: "Lead structural engineer on Thornfield Hub and Eastside Block A. Highly experienced. Prefers detailed emails with drawings referenced.",
    tags: ["structural", "consultant", "key-contact"],
  },
};

const DEFAULT_CONTACT: Contact = {
  id: "", name: "Unknown Contact", role: "Unknown", company: "Unknown Company",
  supplier_id: "", email: "—", phone: "—", last_contact: new Date().toISOString(), notes: "",
  tags: [],
};

const COMMS_SEED: Record<string, CommunicationLog[]> = {
  "con-001": [
    { id: "cl-001", type: "call", date: "2026-06-05T10:30:00Z", summary: "Discussed VO pricing for Thornfield Phase 2B", outcome: "Mark agreed to submit revised quote by 9 Jun", logged_by: "J. Thompson" },
    { id: "cl-002", type: "email", date: "2026-05-28T09:00:00Z", summary: "Sent updated programme for groundworks package", outcome: "Awaiting acknowledgement", logged_by: "J. Thompson" },
    { id: "cl-003", type: "meeting", date: "2026-05-10T14:00:00Z", summary: "Site visit — Eastside Block A final inspection", outcome: "Snagging list agreed. Final account to follow.", logged_by: "S. Okafor" },
    { id: "cl-004", type: "call", date: "2026-04-20T11:00:00Z", summary: "Confirmed mobilisation date for Thornfield", outcome: "Start confirmed 3 May", logged_by: "J. Thompson" },
  ],
  "con-006": [
    { id: "cl-005", type: "email", date: "2026-06-09T08:30:00Z", summary: "Requested revised structural drawings for Thornfield level 3", outcome: "Drawings expected by 12 Jun", logged_by: "J. Thompson" },
    { id: "cl-006", type: "meeting", date: "2026-05-20T10:00:00Z", summary: "Design team meeting — Thornfield Hub roof structure", outcome: "Design approved subject to minor amendments", logged_by: "S. Okafor" },
  ],
};

const PROJECTS_SEED: Record<string, ProjectLink[]> = {
  "con-001": [
    { id: "p-001", project_name: "Thornfield Commercial Hub", role_on_project: "Subcontractor Director", since: "2025-03-01", status: "In Progress" },
    { id: "p-002", project_name: "Eastside Residential Block A", role_on_project: "Subcontractor Director", since: "2024-06-01", status: "Completed" },
    { id: "p-003", project_name: "Waterfront Apartments", role_on_project: "Subcontractor Director", since: "2026-01-01", status: "Tendering" },
  ],
  "con-006": [
    { id: "p-001", project_name: "Thornfield Commercial Hub", role_on_project: "Lead Structural Engineer", since: "2024-06-01", status: "In Progress" },
    { id: "p-004", project_name: "Eastside Residential Block A", role_on_project: "Structural Consultant", since: "2023-09-01", status: "Completed" },
  ],
};

const TASKS_SEED: Record<string, ContactTask[]> = {
  "con-001": [
    { id: "t-001", title: "Chase VO pricing — Thornfield Phase 2B", project: "Thornfield Commercial Hub", due_date: "2026-06-12", priority: "High", status: "To Do", assignee: "J. Thompson" },
    { id: "t-002", title: "Confirm mobilisation date Waterfront", project: "Waterfront Apartments", due_date: "2026-07-01", priority: "Medium", status: "To Do", assignee: "J. Thompson" },
  ],
  "con-006": [
    { id: "t-003", title: "Review revised structural drawings", project: "Thornfield Commercial Hub", due_date: "2026-06-15", priority: "High", status: "In Progress", assignee: "S. Okafor" },
  ],
};

const DOCUMENTS_SEED: Record<string, ContactDocument[]> = {
  "con-001": [
    { id: "d-001", name: "Subcontract Order SCO-001-2025.pdf", doc_type: "Contract", date: "2025-03-01", direction: "Sent", size: "1.2 MB" },
    { id: "d-002", name: "Application No. 5 — May 2026.pdf", doc_type: "Application", date: "2026-05-31", direction: "Received", size: "0.8 MB" },
    { id: "d-003", name: "Programme — Thornfield Groundworks.pdf", doc_type: "Programme", date: "2025-02-28", direction: "Sent", size: "2.1 MB" },
  ],
  "con-006": [
    { id: "d-004", name: "Structural Drawings Rev B — Level 1-3.pdf", doc_type: "Drawing", date: "2026-05-15", direction: "Received", size: "18.4 MB" },
    { id: "d-005", name: "Structural Specification Issue 2.pdf", doc_type: "Specification", date: "2025-11-01", direction: "Received", size: "4.2 MB" },
  ],
};

const ACTIVITY_SEED: Record<string, ActivityItem[]> = {
  "con-001": [
    { id: "a-001", type: "call", description: "Phone call logged — VO pricing discussion", actor: "J. Thompson", created_at: "2026-06-05T10:30:00Z" },
    { id: "a-002", type: "edit", description: "Mobile number updated", actor: "J. Thompson", created_at: "2026-05-20T11:00:00Z", field: "mobile", old_value: "07700 900100", new_value: "07700 900123" },
    { id: "a-003", type: "link", description: "Linked to project: Waterfront Apartments", actor: "S. Okafor", created_at: "2026-05-01T09:00:00Z" },
    { id: "a-004", type: "meeting", description: "Meeting logged — Eastside final inspection", actor: "S. Okafor", created_at: "2026-05-10T14:00:00Z" },
    { id: "a-005", type: "create", description: "Contact record created", actor: "J. Thompson", created_at: "2024-03-15T09:00:00Z" },
  ],
  "con-006": [
    { id: "a-006", type: "email", description: "Email logged — structural drawings request", actor: "J. Thompson", created_at: "2026-06-09T08:30:00Z" },
    { id: "a-007", type: "link", description: "Linked to project: Thornfield Commercial Hub", actor: "J. Thompson", created_at: "2024-06-01T09:00:00Z" },
  ],
};

/* ─────────────────────────── Helpers ─────────────────────────── */

function commsTypeIcon(type: CommunicationLog["type"]) {
  const map = {
    email: { icon: <Mail size={13} />, bg: "bg-[#DBEAFE] text-[#1D4ED8]" },
    call: { icon: <Phone size={13} />, bg: "bg-[#DCFCE7] text-[#15803D]" },
    meeting: { icon: <Calendar size={13} />, bg: "bg-[#EDE9FE] text-[#6D28D9]" },
    note: { icon: <StickyNote size={13} />, bg: "bg-gray-100 text-gray-600" },
  };
  const { icon, bg } = map[type];
  return <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", bg)}>{icon}</div>;
}

function activityIcon(type: ActivityItem["type"]) {
  const map = {
    create: { icon: <Plus size={13} />, bg: "bg-[#DCFCE7] text-[#15803D]" },
    edit: { icon: <Edit2 size={13} />, bg: "bg-[#FEF9C3] text-[#854D0E]" },
    email: { icon: <Mail size={13} />, bg: "bg-[#DBEAFE] text-[#1D4ED8]" },
    call: { icon: <Phone size={13} />, bg: "bg-[#DCFCE7] text-[#15803D]" },
    meeting: { icon: <Calendar size={13} />, bg: "bg-[#EDE9FE] text-[#6D28D9]" },
    note: { icon: <StickyNote size={13} />, bg: "bg-gray-100 text-gray-600" },
    link: { icon: <Layers size={13} />, bg: "bg-[#FEF3C7] text-[#92400E]" },
  };
  const { icon, bg } = map[type];
  return <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", bg)}>{icon}</div>;
}

function priorityBadge(p: ContactTask["priority"]) {
  const map = { Critical: "bg-[#FEE2E2] text-[#B91C1C]", High: "bg-[#FEF3C7] text-[#92400E]", Medium: "bg-[#FFF3E0] text-[#B45309]", Low: "bg-gray-100 text-gray-600" };
  return <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", map[p])}><Flag size={10} />{p}</span>;
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    "To Do": "bg-gray-100 text-gray-600", "In Progress": "bg-[#DBEAFE] text-[#1D4ED8]",
    "In Review": "bg-[#EDE9FE] text-[#6D28D9]", Done: "bg-[#DCFCE7] text-[#15803D]",
    "In Progress ": "bg-[#DBEAFE] text-[#1D4ED8]", Completed: "bg-gray-100 text-gray-500",
    Tendering: "bg-[#EDE9FE] text-[#6D28D9]",
  };
  return <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", map[status] ?? "bg-gray-100 text-gray-600")}>{status}</span>;
}

/* ─────────────────────────── Tabs ─────────────────────────── */

type TabId = "profile" | "communications" | "projects" | "tasks" | "documents" | "activity";
const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "profile", label: "Profile", icon: <User size={13} /> },
  { id: "communications", label: "Communications", icon: <MessageSquare size={13} /> },
  { id: "projects", label: "Projects", icon: <Layers size={13} /> },
  { id: "tasks", label: "Tasks", icon: <CheckCircle size={13} /> },
  { id: "documents", label: "Documents", icon: <FileText size={13} /> },
  { id: "activity", label: "Activity", icon: <Activity size={13} /> },
];

/* ─────────────────────────── Page ─────────────────────────── */

export default function ContactDetailPage() {
  const { contactId } = useParams<{ contactId: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("profile");
  const [contact, setContact] = useState<Contact>(() => SEED_CONTACTS[contactId] ?? DEFAULT_CONTACT);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState(contact.notes);
  const [editingNotes, setEditingNotes] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [logType, setLogType] = useState<"email" | "call" | "meeting" | "note">("call");
  const [logSummary, setLogSummary] = useState("");
  const [logOutcome, setLogOutcome] = useState("");
  const [savingLog, setSavingLog] = useState(false);

  const commsLog = COMMS_SEED[contactId] ?? [];
  const projectLinks = PROJECTS_SEED[contactId] ?? [];
  const tasks = TASKS_SEED[contactId] ?? [];
  const documents = DOCUMENTS_SEED[contactId] ?? [];
  const activity = ACTIVITY_SEED[contactId] ?? [];

  useEffect(() => {
    async function load() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data } = await supabase.from("contacts").select("*").eq("id", contactId).single();
        if (data) { setContact(data as Contact); setNotes((data as Contact).notes ?? ""); }
      } catch {
        // use seed
      } finally {
        setLoading(false);
      }
    }
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [contactId]);

  async function saveNotes() {
    setEditingNotes(false);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      await supabase.from("contacts").update({ notes }).eq("id", contactId);
      setContact((c) => ({ ...c, notes }));
      toast.success("Notes saved");
    } catch {
      toast.error("Failed to save notes");
    }
  }

  async function submitLog() {
    if (!logSummary.trim()) return;
    setSavingLog(true);
    await new Promise((r) => setTimeout(r, 400));
    setSavingLog(false);
    setLogSummary("");
    setLogOutcome("");
    setShowLogModal(false);
    toast.success("Interaction logged");
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="page-header"><div className="h-6 w-48 bg-gray-100 rounded animate-pulse" /></div>
        <div className="page-content flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Header ── */}
      <div className="page-header">
        <div className="flex items-center gap-3 min-w-0">
          <button className="btn btn-ghost btn-sm btn-icon flex-shrink-0" onClick={() => router.push("/app/contacts")}>
            <ArrowLeft size={16} />
          </button>
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold flex-shrink-0"
            style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
            {getInitials(contact.name)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold text-[var(--text-primary)]">{contact.name}</h1>
              {contact.relationship_type && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#EDE9FE] text-[#6D28D9]">{contact.relationship_type}</span>
              )}
            </div>
            <p className="text-sm text-[var(--text-muted)]">{contact.role}{contact.department ? ` · ${contact.department}` : ""} · {contact.company}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <a href={`mailto:${contact.email}`} className="btn btn-secondary btn-sm"><Mail size={14} />Email</a>
          <a href={`tel:${contact.phone}`} className="btn btn-secondary btn-sm"><Phone size={14} />Call</a>
          <button className="btn btn-secondary btn-sm" onClick={() => toast.info("Schedule meeting")}><Calendar size={14} />Schedule</button>
          <button className="btn btn-secondary btn-sm" onClick={() => { setTab("communications"); setShowLogModal(true); }}>
            <MessageSquare size={14} />Log Interaction
          </button>
          <Link href={`/app/contacts/${contactId}/edit`} className="btn btn-primary btn-sm"><Edit2 size={14} />Edit</Link>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="px-6 py-3 flex items-center gap-6 flex-wrap border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-2 text-sm">
          <Building2 size={13} className="text-[var(--text-muted)]" />
          <span className="text-[var(--text-muted)]">Company:</span>
          <Link href={`/app/suppliers/${contact.supplier_id}`} className="font-medium text-[var(--primary)] hover:underline">{contact.company}</Link>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <User size={13} className="text-[var(--text-muted)]" />
          <span className="text-[var(--text-muted)]">Role:</span>
          <span className="font-medium">{contact.role}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Clock size={13} className="text-[var(--text-muted)]" />
          <span className="text-[var(--text-muted)]">Last contacted:</span>
          <span className="font-medium">{formatRelative(contact.last_contact)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Layers size={13} className="text-[var(--text-muted)]" />
          <span className="text-[var(--text-muted)]">Projects:</span>
          <span className="font-medium">{projectLinks.length}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle size={13} className="text-[var(--text-muted)]" />
          <span className="text-[var(--text-muted)]">Active tasks:</span>
          <span className="font-medium">{tasks.filter(t => t.status !== "Done").length}</span>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="tab-bar overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id}
            className={cn("tab-item flex items-center gap-1.5 whitespace-nowrap", tab === t.id && "active")}
            onClick={() => setTab(t.id)}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="page-content flex-1">

        {/* ── Profile ── */}
        {tab === "profile" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-5">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-sm font-semibold mb-4">Contact Details</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {[
                    { label: "Full Name", value: contact.name },
                    { label: "Role / Title", value: contact.role },
                    { label: "Department", value: contact.department || "—" },
                    { label: "Company", value: <Link href={`/app/suppliers/${contact.supplier_id}`} className="text-[var(--primary)] hover:underline flex items-center gap-1"><Building2 size={12} />{contact.company}</Link> },
                    { label: "Email", value: <a href={`mailto:${contact.email}`} className="text-[var(--primary)] hover:underline flex items-center gap-1"><Mail size={12} />{contact.email}</a> },
                    { label: "Phone", value: <a href={`tel:${contact.phone}`} className="flex items-center gap-1 hover:text-[var(--primary)]"><Phone size={12} />{contact.phone}</a> },
                    { label: "Mobile", value: contact.mobile ? <a href={`tel:${contact.mobile}`} className="flex items-center gap-1 hover:text-[var(--primary)]"><Phone size={12} />{contact.mobile}</a> : "—" },
                    { label: "LinkedIn", value: contact.linkedin_url ? <a href={`https://${contact.linkedin_url}`} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline flex items-center gap-1"><Link2 size={12} />{contact.linkedin_url}</a> : "—" },
                    { label: "Address", value: contact.address ? <span className="flex items-start gap-1"><MapPin size={12} className="mt-0.5 flex-shrink-0" />{contact.address}</span> : "—" },
                    { label: "Last Contacted", value: <span className="flex items-center gap-1"><Clock size={12} />{formatRelative(contact.last_contact)}</span> },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <dt className="text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-widest">{label}</dt>
                      <dd className="font-medium text-[var(--text-primary)]">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Notes */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Internal Notes</h3>
                  {!editingNotes && <button className="btn btn-ghost btn-sm" onClick={() => setEditingNotes(true)}><Edit2 size={13} />Edit</button>}
                </div>
                {editingNotes ? (
                  <div className="flex flex-col gap-3">
                    <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} />
                    <div className="flex gap-2">
                      <button className="btn btn-primary btn-sm" onClick={saveNotes}>Save</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => { setEditingNotes(false); setNotes(contact.notes); }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{notes || "No notes yet."}</p>
                )}
              </div>
            </div>

            {/* Right rail */}
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Relationship</h3>
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex justify-between"><span className="text-[var(--text-muted)]">Type</span><span className="font-medium">{contact.relationship_type || "—"}</span></div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-muted)]">Company</span>
                    <Link href={`/app/suppliers/${contact.supplier_id}`} className="text-[var(--primary)] hover:underline text-sm font-medium flex items-center gap-1">{contact.company} <ExternalLink size={11} /></Link>
                  </div>
                  <div className="flex justify-between"><span className="text-[var(--text-muted)]">Projects</span><span className="font-medium">{projectLinks.length}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-muted)]">Workspace member</span><span className="font-medium">{contact.workspace_member ? "Yes" : "No"}</span></div>
                </div>
              </div>

              {(contact.tags ?? []).length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3 flex items-center gap-1"><Tag size={11} />Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {(contact.tags ?? []).map((tag) => (
                      <span key={tag} className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Quick Actions</h3>
                <div className="flex flex-col gap-2">
                  <a href={`mailto:${contact.email}`} className="btn btn-secondary btn-sm w-full justify-start"><Mail size={13} />Send Email</a>
                  <a href={`tel:${contact.phone}`} className="btn btn-secondary btn-sm w-full justify-start"><Phone size={13} />Call</a>
                  <button className="btn btn-secondary btn-sm w-full justify-start" onClick={() => toast.info("Schedule meeting")}><Calendar size={13} />Schedule Meeting</button>
                  <button className="btn btn-secondary btn-sm w-full justify-start" onClick={() => { setTab("communications"); setShowLogModal(true); }}>
                    <MessageSquare size={13} />Log Interaction
                  </button>
                  <button className="btn btn-secondary btn-sm w-full justify-start" onClick={() => toast.info("Add to project")}><Layers size={13} />Link to Project</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Communications ── */}
        {tab === "communications" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Communication Log</h2>
              <button className="btn btn-primary btn-sm" onClick={() => setShowLogModal(true)}><Plus size={14} />Log Interaction</button>
            </div>

            {/* Log interaction inline panel */}
            {showLogModal && (
              <div className="bg-white rounded-2xl border border-[var(--primary)] shadow-sm p-5">
                <h3 className="text-sm font-semibold mb-4">Log Interaction</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                  {(["call", "email", "meeting", "note"] as const).map((type) => (
                    <button key={type} onClick={() => setLogType(type)}
                      className={cn("px-3 py-2 rounded-xl text-xs font-medium border transition-colors capitalize", logType === type ? "border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]" : "border-gray-200 text-gray-600 hover:border-gray-300")}>
                      {type}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-3">
                  <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" rows={3} value={logSummary} onChange={(e) => setLogSummary(e.target.value)} placeholder="Summary of interaction…" />
                  <textarea className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" rows={2} value={logOutcome} onChange={(e) => setLogOutcome(e.target.value)} placeholder="Outcome / next action (optional)…" />
                  <div className="flex gap-2">
                    <button className="btn btn-primary btn-sm" onClick={submitLog} disabled={savingLog || !logSummary.trim()}>
                      {savingLog ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle size={13} />} Save
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => setShowLogModal(false)}>Cancel</button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              {commsLog.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare size={28} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-[var(--text-muted)]">No interactions logged yet</p>
                </div>
              ) : (
                <div className="flex flex-col gap-0">
                  {commsLog.map((log, idx) => (
                    <div key={log.id} className={cn("flex items-start gap-3 py-4", idx < commsLog.length - 1 && "border-b border-gray-50")}>
                      {commsTypeIcon(log.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-xs font-semibold capitalize px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{log.type}</span>
                          <span className="text-xs text-[var(--text-muted)]">{formatRelative(log.date)} · {log.logged_by}</span>
                        </div>
                        <p className="text-sm font-medium">{log.summary}</p>
                        {log.outcome && <p className="text-xs text-[var(--text-muted)] mt-1 flex items-start gap-1"><AlertCircle size={11} className="mt-0.5 flex-shrink-0" />{log.outcome}</p>}
                      </div>
                      <button className="btn btn-ghost btn-sm btn-icon flex-shrink-0"><MoreHorizontal size={14} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Projects ── */}
        {tab === "projects" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">{projectLinks.length} Project{projectLinks.length !== 1 ? "s" : ""}</h2>
              <button className="btn btn-primary btn-sm" onClick={() => toast.info("Link project")}><Plus size={14} />Link Project</button>
            </div>
            {projectLinks.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
                <Layers size={28} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-[var(--text-muted)]">No projects linked yet</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["Project", "Role on Project", "Since", "Status", ""].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {projectLinks.map((p) => (
                      <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium">{p.project_name}</td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{p.role_on_project}</td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(p.since)}</td>
                        <td className="px-4 py-3">{statusBadge(p.status)}</td>
                        <td className="px-4 py-3">
                          <Link href={`/app/projects/${p.id}`} className="btn btn-ghost btn-sm btn-icon"><ExternalLink size={13} /></Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Tasks ── */}
        {tab === "tasks" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">{tasks.length} Task{tasks.length !== 1 ? "s" : ""}</h2>
              <button className="btn btn-primary btn-sm" onClick={() => toast.info("Add task")}><Plus size={14} />Add Task</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(["To Do", "In Progress", "Done"] as const).map((group) => {
                const grouped = tasks.filter(t => t.status === group || (group === "Done" && t.status === "Done"));
                return (
                  <div key={group} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">{group} ({grouped.length})</h3>
                    <div className="flex flex-col gap-2">
                      {grouped.length === 0 && <p className="text-xs text-[var(--text-muted)] text-center py-4">No tasks</p>}
                      {grouped.map((t) => (
                        <div key={t.id} className="border border-gray-100 rounded-xl p-3 hover:shadow-sm transition-shadow">
                          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
                            {priorityBadge(t.priority)}
                          </div>
                          <p className="text-sm font-medium mb-1">{t.title}</p>
                          <div className="flex flex-col gap-0.5 text-xs text-[var(--text-muted)]">
                            <span className="flex items-center gap-1"><Layers size={10} />{t.project}</span>
                            <span className={cn("flex items-center gap-1", new Date(t.due_date) < new Date() && t.status !== "Done" ? "text-[#DC2626]" : "")}>
                              <Calendar size={10} />{formatDate(t.due_date)}
                            </span>
                          </div>
                          <Link href={`/app/tasks/${t.id}`} className="btn btn-ghost btn-sm w-full justify-center mt-2 text-xs"><ExternalLink size={11} />View</Link>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Documents ── */}
        {tab === "documents" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">{documents.length} Document{documents.length !== 1 ? "s" : ""}</h2>
              <button className="btn btn-primary btn-sm" onClick={() => toast.info("Upload document")}><Upload size={14} />Upload</button>
            </div>
            {documents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
                <FileText size={28} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-[var(--text-muted)]">No documents shared with this contact yet</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["Document Name", "Type", "Direction", "Date", "Size", ""].map((h) => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((d) => (
                      <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3"><div className="flex items-center gap-2"><FileText size={14} className="text-[var(--text-muted)]" /><span className="font-medium">{d.name}</span></div></td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">{d.doc_type}</span></td>
                        <td className="px-4 py-3"><span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", d.direction === "Sent" ? "bg-[#DBEAFE] text-[#1D4ED8]" : "bg-[#DCFCE7] text-[#15803D]")}>{d.direction}</span></td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(d.date)}</td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{d.size}</td>
                        <td className="px-4 py-3"><button className="btn btn-ghost btn-sm btn-icon" onClick={() => toast.info("Download " + d.name)}><Download size={13} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Activity ── */}
        {tab === "activity" && (
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-semibold">Audit Trail &amp; Activity</h2>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex flex-col gap-0">
                {activity.map((a, idx) => (
                  <div key={a.id} className={cn("flex items-start gap-3 py-4", idx < activity.length - 1 && "border-b border-gray-50")}>
                    {activityIcon(a.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{a.description}</p>
                      {a.field && (
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          {a.field}: <span className="line-through">{a.old_value}</span> → <span className="font-medium text-[var(--text-primary)]">{a.new_value}</span>
                        </p>
                      )}
                      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mt-0.5">
                        <span>{a.actor}</span>
                        <span>·</span>
                        <span>{formatRelative(a.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

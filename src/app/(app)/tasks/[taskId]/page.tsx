"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Edit2, CheckCircle2, User, Plus, ChevronDown,
  MessageSquare, Activity, Layers, CheckSquare,
  Flag, Calendar, ExternalLink, FileText,
  Paperclip, Download, Trash2, RefreshCw, Timer,
  AlertCircle, Tag, X, Check, Upload,
} from "lucide-react";
import { cn, formatDate, formatDateTime, formatRelative, getInitials } from "@/lib/utils";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";

/* ─────────────────────────── Types ─────────────────────────── */

type Priority = "Critical" | "High" | "Medium" | "Low";
type Status = "To Do" | "In Progress" | "In Review" | "Done" | "Cancelled";

interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

interface Comment {
  id: string;
  author: string;
  author_initials: string;
  text: string;
  created_at: string;
}

interface TimeEntry {
  id: string;
  date: string;
  user: string;
  hours: number;
  description: string;
}

interface LinkedRecord {
  id: string;
  type: "Change Event" | "Application" | "Project" | "Drawing" | "Evidence" | "Supplier";
  ref: string;
  title: string;
  status: string;
  link: string;
}

interface Attachment {
  id: string;
  name: string;
  type: string;
  size: string;
  uploaded_by: string;
  uploaded_at: string;
  preview?: boolean;
}

interface Subtask {
  id: string;
  title: string;
  assignee: string;
  status: Status;
  due_date: string;
  priority: Priority;
}

interface ActivityEntry {
  id: string;
  type: "create" | "status" | "assign" | "comment" | "attachment" | "field";
  description: string;
  actor: string;
  created_at: string;
  field?: string;
  old_value?: string;
  new_value?: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: Status;
  category: string;
  tags: string[];
  assignee_name: string | null;
  assignee_initials: string;
  watchers: string[];
  project: string;
  project_id: string;
  due_date: string | null;
  start_date: string | null;
  completed_at: string | null;
  estimated_hours: number;
  actual_hours: number;
  recurrence: string;
  created_at: string;
  updated_at: string;
  checklist: ChecklistItem[];
  comments: Comment[];
}

/* ─────────────────────────── Seed ─────────────────────────── */

const SEED_TASKS: Task[] = [
  {
    id: "t-001",
    title: "Submit Application No. 12 to Thornfield",
    description: "Prepare and submit the interim payment application for period 12. Ensure all supporting documentation is attached including the measured work summary, daywork schedules, and material on site values. The application must be issued by 5pm on the due date.\n\nAll supporting schedules must be formatted per the employer's requirements document. Reference: ERT-PRO-001.",
    priority: "Critical", status: "To Do", category: "Commercial",
    tags: ["application", "thornfield", "period-12"],
    assignee_name: "James Whitfield", assignee_initials: "JW",
    watchers: ["Sarah Chen", "Mark Hughes"],
    project: "Thornfield Commercial Hub", project_id: "p-001",
    due_date: "2026-06-12", start_date: "2026-06-01", completed_at: null,
    estimated_hours: 8, actual_hours: 3.5, recurrence: "Monthly",
    created_at: "2026-06-01T09:00:00Z", updated_at: "2026-06-06T14:15:00Z",
    checklist: [
      { id: "cl-1", text: "Compile measured work summary", checked: true },
      { id: "cl-2", text: "Attach daywork schedules", checked: true },
      { id: "cl-3", text: "Calculate materials on site", checked: false },
      { id: "cl-4", text: "Apply retention deduction", checked: false },
      { id: "cl-5", text: "Issue to Thornfield via portal", checked: false },
    ],
    comments: [
      { id: "cmt-1", author: "Sarah Chen", author_initials: "SC", text: "Daywork sheets for weeks 1-3 have been uploaded to evidence. Still need weeks 4-6.", created_at: "2026-06-05T09:30:00Z" },
      { id: "cmt-2", author: "James Whitfield", author_initials: "JW", text: "I'll get the MoS values from site by Thursday. Can you confirm the cut-off date for dayworks Sarah?", created_at: "2026-06-06T14:15:00Z" },
    ],
  },
  {
    id: "t-002",
    title: "Upload daywork sheets for VO-047",
    description: "Scan and upload all site-verified daywork sheets relating to variation order VO-047 (additional drainage works). Link each sheet to the relevant change record.",
    priority: "High", status: "To Do", category: "Document Management",
    tags: ["vo-047", "dayworks", "drainage"],
    assignee_name: "Sarah Chen", assignee_initials: "SC",
    watchers: ["James Whitfield"],
    project: "City Centre Retail Fit-Out", project_id: "p-002",
    due_date: "2026-06-14", start_date: "2026-06-10", completed_at: null,
    estimated_hours: 3, actual_hours: 0, recurrence: "None",
    created_at: "2026-06-03T10:00:00Z", updated_at: "2026-06-03T10:00:00Z",
    checklist: [
      { id: "cl-1", text: "Scan original daywork sheets", checked: false },
      { id: "cl-2", text: "Upload to evidence library", checked: false },
      { id: "cl-3", text: "Link to VO-047", checked: false },
    ],
    comments: [],
  },
  {
    id: "t-003",
    title: "Lock CVR Period 8 — Eastside Block A",
    description: "Finalise and lock the Cost Value Reconciliation for Period 8. Review all cost codes, confirm subcontractor accruals, and obtain sign-off from commercial director.",
    priority: "High", status: "In Progress", category: "Commercial",
    tags: ["cvr", "period-8", "eastside"],
    assignee_name: "Mark Hughes", assignee_initials: "MH",
    watchers: ["J. Thompson", "S. Okafor"],
    project: "Eastside Residential Block A", project_id: "p-003",
    due_date: "2026-06-15", start_date: "2026-06-08", completed_at: null,
    estimated_hours: 6, actual_hours: 4.5, recurrence: "Monthly",
    created_at: "2026-06-05T08:00:00Z", updated_at: "2026-06-07T11:00:00Z",
    checklist: [
      { id: "cl-1", text: "Review all labour cost codes", checked: true },
      { id: "cl-2", text: "Confirm material accruals", checked: true },
      { id: "cl-3", text: "Update subcontractor accruals", checked: false },
      { id: "cl-4", text: "Commercial director sign-off", checked: false },
    ],
    comments: [
      { id: "cmt-1", author: "Mark Hughes", author_initials: "MH", text: "Labour and materials reviewed. Subcontractor accruals need update from Tom.", created_at: "2026-06-07T11:00:00Z" },
    ],
  },
];

const TIME_LOG_SEED: Record<string, TimeEntry[]> = {
  "t-001": [
    { id: "te-001", date: "2026-06-01", user: "James Whitfield", hours: 1.5, description: "Initial review of measured work schedules" },
    { id: "te-002", date: "2026-06-03", user: "James Whitfield", hours: 2.0, description: "Compiled measured work summary sections 1-4" },
  ],
  "t-003": [
    { id: "te-003", date: "2026-06-08", user: "Mark Hughes", hours: 2.5, description: "Reviewed labour cost codes in CVR template" },
    { id: "te-004", date: "2026-06-09", user: "Mark Hughes", hours: 2.0, description: "Confirmed material accruals with procurement team" },
  ],
};

const LINKED_RECORDS_SEED: Record<string, LinkedRecord[]> = {
  "t-001": [
    { id: "lr-001", type: "Project", ref: "THF-001", title: "Thornfield Commercial Hub", status: "In Progress", link: "/app/projects/p-001" },
    { id: "lr-002", type: "Application", ref: "APP-012", title: "Application No. 12 — Jun 2026", status: "Draft", link: "/app/applications/app-012" },
    { id: "lr-003", type: "Change Event", ref: "CE-088", title: "Revised drainage specification", status: "Under Review", link: "/app/change-events/ce-088" },
  ],
  "t-002": [
    { id: "lr-004", type: "Change Event", ref: "VO-047", title: "Additional drainage works", status: "Approved", link: "/app/change-events/vo-047" },
    { id: "lr-005", type: "Project", ref: "CCR-002", title: "City Centre Retail Fit-Out", status: "Completed", link: "/app/projects/p-002" },
  ],
  "t-003": [
    { id: "lr-006", type: "Project", ref: "EBA-003", title: "Eastside Residential Block A", status: "In Progress", link: "/app/projects/p-003" },
  ],
};

const ATTACHMENTS_SEED: Record<string, Attachment[]> = {
  "t-001": [
    { id: "att-001", name: "Measured_Work_Summary_App12.xlsx", type: "xlsx", size: "1.4 MB", uploaded_by: "James Whitfield", uploaded_at: "2026-06-03T14:00:00Z" },
    { id: "att-002", name: "Daywork_Sheets_W1-W3.pdf", type: "pdf", size: "4.2 MB", uploaded_by: "Sarah Chen", uploaded_at: "2026-06-05T09:00:00Z" },
  ],
  "t-003": [
    { id: "att-003", name: "CVR_Period8_Draft.xlsx", type: "xlsx", size: "2.8 MB", uploaded_by: "Mark Hughes", uploaded_at: "2026-06-08T10:00:00Z" },
  ],
};

const SUBTASKS_SEED: Record<string, Subtask[]> = {
  "t-001": [
    { id: "st-001", title: "Compile measured work sections 5-8", assignee: "J. Thompson", status: "To Do", due_date: "2026-06-10", priority: "High" },
    { id: "st-002", title: "Gather site photos for MoS", assignee: "Site Team", status: "In Progress", due_date: "2026-06-11", priority: "Medium" },
    { id: "st-003", title: "Final QA review", assignee: "James Whitfield", status: "To Do", due_date: "2026-06-12", priority: "High" },
  ],
};

const ACTIVITY_SEED: Record<string, ActivityEntry[]> = {
  "t-001": [
    { id: "ae-001", type: "comment", description: "Comment added by James Whitfield", actor: "James Whitfield", created_at: "2026-06-06T14:15:00Z" },
    { id: "ae-002", type: "comment", description: "Comment added by Sarah Chen", actor: "Sarah Chen", created_at: "2026-06-05T09:30:00Z" },
    { id: "ae-003", type: "attachment", description: "Daywork_Sheets_W1-W3.pdf uploaded", actor: "Sarah Chen", created_at: "2026-06-05T09:00:00Z" },
    { id: "ae-004", type: "field", description: "Due date updated", actor: "J. Thompson", created_at: "2026-06-03T12:00:00Z", field: "due_date", old_value: "2026-06-14", new_value: "2026-06-12" },
    { id: "ae-005", type: "assign", description: "Assigned to James Whitfield", actor: "J. Thompson", created_at: "2026-06-01T09:00:00Z", old_value: "Unassigned", new_value: "James Whitfield" },
    { id: "ae-006", type: "create", description: "Task created", actor: "J. Thompson", created_at: "2026-06-01T09:00:00Z" },
  ],
  "t-003": [
    { id: "ae-007", type: "comment", description: "Comment added by Mark Hughes", actor: "Mark Hughes", created_at: "2026-06-07T11:00:00Z" },
    { id: "ae-008", type: "status", description: "Status changed to In Progress", actor: "Mark Hughes", created_at: "2026-06-08T08:30:00Z", old_value: "To Do", new_value: "In Progress" },
    { id: "ae-009", type: "create", description: "Task created", actor: "J. Thompson", created_at: "2026-06-05T08:00:00Z" },
  ],
};

/* ─────────────────────────── Helpers ─────────────────────────── */

function priorityChip(priority: Priority) {
  const cfg: Record<Priority, { cls: string; color: string }> = {
    Critical: { cls: "bg-[#FEE2E2] text-[#B91C1C]", color: "#B91C1C" },
    High: { cls: "bg-[#FEF3C7] text-[#92400E]", color: "#92400E" },
    Medium: { cls: "bg-[#FFF3E0] text-[#B45309]", color: "#B45309" },
    Low: { cls: "bg-gray-100 text-gray-600", color: "#6B7280" },
  };
  const { cls } = cfg[priority];
  return <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold", cls)}><Flag size={10} />{priority}</span>;
}

function statusChip(status: Status) {
  const map: Record<Status, string> = {
    "To Do": "bg-gray-100 text-gray-600",
    "In Progress": "bg-[#DBEAFE] text-[#1D4ED8]",
    "In Review": "bg-[#EDE9FE] text-[#6D28D9]",
    "Done": "bg-[#DCFCE7] text-[#15803D]",
    "Cancelled": "bg-[#FEE2E2] text-[#B91C1C]",
  };
  return <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold", map[status])}>{status}</span>;
}

function linkedTypeChip(type: LinkedRecord["type"]) {
  const map: Record<string, string> = {
    "Change Event": "bg-[#FEF9C3] text-[#854D0E]",
    "Application": "bg-[#DBEAFE] text-[#1D4ED8]",
    "Project": "bg-[#EDE9FE] text-[#6D28D9]",
    "Drawing": "bg-gray-100 text-gray-600",
    "Evidence": "bg-[#DCFCE7] text-[#15803D]",
    "Supplier": "bg-[#FEF3C7] text-[#92400E]",
  };
  return <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", map[type] ?? "bg-gray-100 text-gray-600")}>{type}</span>;
}

function activityEntryIcon(type: ActivityEntry["type"]) {
  const map = {
    create: { icon: <Plus size={12} />, bg: "bg-[#DCFCE7] text-[#15803D]" },
    status: { icon: <RefreshCw size={12} />, bg: "bg-[#DBEAFE] text-[#1D4ED8]" },
    assign: { icon: <User size={12} />, bg: "bg-[#EDE9FE] text-[#6D28D9]" },
    comment: { icon: <MessageSquare size={12} />, bg: "bg-gray-100 text-gray-600" },
    attachment: { icon: <Paperclip size={12} />, bg: "bg-[#FEF9C3] text-[#854D0E]" },
    field: { icon: <Edit2 size={12} />, bg: "bg-[#FEF3C7] text-[#92400E]" },
  };
  const { icon, bg } = map[type];
  return <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs", bg)}>{icon}</div>;
}

const STATUS_OPTIONS: Status[] = ["To Do", "In Progress", "In Review", "Done", "Cancelled"];

type TabId = "details" | "comments" | "linked-records" | "time-tracking" | "subtasks" | "attachments" | "activity";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "details", label: "Details", icon: <FileText size={13} /> },
  { id: "comments", label: "Comments", icon: <MessageSquare size={13} /> },
  { id: "linked-records", label: "Linked Records", icon: <Layers size={13} /> },
  { id: "time-tracking", label: "Time Tracking", icon: <Timer size={13} /> },
  { id: "subtasks", label: "Subtasks", icon: <CheckSquare size={13} /> },
  { id: "attachments", label: "Attachments", icon: <Paperclip size={13} /> },
  { id: "activity", label: "Activity", icon: <Activity size={13} /> },
];

/* ─────────────────────────── Page ─────────────────────────── */

export default function TaskDetailPage() {
  const { taskId } = useParams<{ taskId: string }>();
  const router = useRouter();
  const [tab, setTab] = useState<TabId>("details");
  const [task, setTask] = useState<Task>(() => SEED_TASKS.find(t => t.id === taskId) ?? SEED_TASKS[0]);
  const [loading, setLoading] = useState(true);
  const [statusOpen, setStatusOpen] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [timeHours, setTimeHours] = useState("");
  const [timeDesc, setTimeDesc] = useState("");
  const [timeDate, setTimeDate] = useState(new Date().toISOString().slice(0, 10));
  const [loggingTime, setLoggingTime] = useState(false);
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [showTimeForm, setShowTimeForm] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const timeLog = TIME_LOG_SEED[taskId] ?? [];
  const linkedRecords = LINKED_RECORDS_SEED[taskId] ?? [];
  const attachments = ATTACHMENTS_SEED[taskId] ?? [];
  const subtasks = SUBTASKS_SEED[taskId] ?? [];
  const activityLog = ACTIVITY_SEED[taskId] ?? [];

  const totalLoggedHours = timeLog.reduce((s, e) => s + e.hours, 0);
  const hoursProgress = task.estimated_hours > 0 ? Math.min((totalLoggedHours / task.estimated_hours) * 100, 100) : 0;
  const isOverdue = task.due_date && new Date(task.due_date) < new Date(new Date().toDateString()) && task.status !== "Done" && task.status !== "Cancelled";
  const checkedCount = task.checklist.filter(c => c.checked).length;

  useEffect(() => {
    async function load() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data } = await supabase.from("tasks").select("*").eq("id", taskId).single();
        if (data) setTask(data as Task);
      } catch {
        // use seed
      } finally {
        setLoading(false);
      }
    }
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [taskId]);

  async function changeStatus(status: Status) {
    setStatusOpen(false);
    const prev = task.status;
    setTask(t => ({ ...t, status }));
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      await supabase.from("tasks").update({ status }).eq("id", taskId);
      toast.success(`Status: ${status}`);
    } catch {
      setTask(t => ({ ...t, status: prev }));
      toast.error("Failed to update status");
    }
  }

  async function toggleChecklist(itemId: string) {
    const updated = task.checklist.map(c => c.id === itemId ? { ...c, checked: !c.checked } : c);
    setTask(t => ({ ...t, checklist: updated }));
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      await supabase.from("tasks").update({ checklist: updated }).eq("id", taskId);
    } catch {
      toast.error("Failed to save");
    }
  }

  async function submitComment() {
    if (!newComment.trim()) return;
    setSubmittingComment(true);
    const comment: Comment = {
      id: `cmt-${Date.now()}`,
      author: "James Whitfield",
      author_initials: "JW",
      text: newComment.trim(),
      created_at: new Date().toISOString(),
    };
    const updated = [...task.comments, comment];
    setTask(t => ({ ...t, comments: updated }));
    setNewComment("");
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      await supabase.from("tasks").update({ comments: updated }).eq("id", taskId);
      toast.success("Comment added");
    } catch {
      toast.error("Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  }

  async function logTime() {
    if (!timeHours || isNaN(Number(timeHours)) || Number(timeHours) <= 0) {
      toast.error("Enter a valid number of hours");
      return;
    }
    setLoggingTime(true);
    await new Promise(r => setTimeout(r, 400));
    setLoggingTime(false);
    setShowTimeForm(false);
    setTimeHours("");
    setTimeDesc("");
    toast.success(`${timeHours}h logged`);
  }

  async function addSubtask() {
    if (!newSubtaskTitle.trim()) return;
    setAddingSubtask(false);
    setNewSubtaskTitle("");
    toast.success("Subtask added");
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="page-header"><div className="h-6 w-64 bg-gray-100 rounded animate-pulse" /></div>
        <div className="page-content flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Header ── */}
      <div className="page-header">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button className="btn btn-ghost btn-sm btn-icon flex-shrink-0" onClick={() => router.push("/app/tasks")}>
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              {priorityChip(task.priority)}
              {statusChip(task.status)}
              {isOverdue && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-[#FEE2E2] text-[#B91C1C]">
                  <AlertCircle size={10} />Overdue
                </span>
              )}
            </div>
            <h1 className="text-lg font-semibold text-[var(--text-primary)] leading-tight truncate">{task.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
          {/* Status dropdown */}
          <div className="relative">
            <button className="btn btn-secondary btn-sm" onClick={() => setStatusOpen(o => !o)}>
              <RefreshCw size={14} />Status<ChevronDown size={12} />
            </button>
            {statusOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-gray-200 shadow-lg z-50 overflow-hidden min-w-[160px]">
                {STATUS_OPTIONS.map(s => (
                  <button key={s} onClick={() => changeStatus(s)}
                    className={cn("w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2", task.status === s && "font-semibold text-[var(--primary)]")}>
                    {task.status === s && <Check size={12} />}
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          {task.status !== "Done" && (
            <button className="btn btn-success btn-sm" onClick={() => changeStatus("Done")}>
              <CheckCircle2 size={14} />Complete
            </button>
          )}
          <Link href={`/app/tasks/${taskId}/edit`} className="btn btn-primary btn-sm"><Edit2 size={14} />Edit</Link>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="px-6 py-3 flex items-center gap-6 flex-wrap border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-2 text-sm">
          <Flag size={13} className="text-[var(--text-muted)]" />
          <span className="text-[var(--text-muted)]">Priority:</span>
          {priorityChip(task.priority)}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar size={13} className={cn(isOverdue ? "text-[#DC2626]" : "text-[var(--text-muted)]")} />
          <span className="text-[var(--text-muted)]">Due:</span>
          <span className={cn("font-medium", isOverdue ? "text-[#DC2626]" : "")}>{formatDate(task.due_date)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <User size={13} className="text-[var(--text-muted)]" />
          <span className="text-[var(--text-muted)]">Assignee:</span>
          <span className="font-medium">{task.assignee_name ?? "Unassigned"}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Timer size={13} className="text-[var(--text-muted)]" />
          <span className="text-[var(--text-muted)]">Hours:</span>
          <span className="font-medium">{totalLoggedHours}h / {task.estimated_hours}h</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Layers size={13} className="text-[var(--text-muted)]" />
          <span className="text-[var(--text-muted)]">Links:</span>
          <span className="font-medium">{linkedRecords.length}</span>
        </div>
        {task.checklist.length > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <CheckSquare size={13} className="text-[var(--text-muted)]" />
            <span className="text-[var(--text-muted)]">Progress:</span>
            <span className="font-medium">{checkedCount}/{task.checklist.length}</span>
          </div>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="tab-bar overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id}
            className={cn("tab-item flex items-center gap-1.5 whitespace-nowrap", tab === t.id && "active")}
            onClick={() => setTab(t.id)}>
            {t.icon}{t.label}
            {t.id === "comments" && task.comments.length > 0 && (
              <span className="ml-1 px-1.5 py-0 rounded-full bg-gray-100 text-gray-600 text-xs">{task.comments.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="page-content flex-1">

        {/* ── Details ── */}
        {tab === "details" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-5">
              {/* Description */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-sm font-semibold mb-3">Description</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{task.description || "No description provided."}</p>
              </div>

              {/* Checklist */}
              {task.checklist.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold">Checklist</h3>
                    <span className="text-xs text-[var(--text-muted)]">{checkedCount}/{task.checklist.length}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mb-4">
                    <div className="h-full rounded-full bg-[var(--primary)] transition-all"
                      style={{ width: `${task.checklist.length > 0 ? (checkedCount / task.checklist.length) * 100 : 0}%` }} />
                  </div>
                  <div className="flex flex-col gap-2">
                    {task.checklist.map((item) => (
                      <label key={item.id} className="flex items-center gap-3 py-1.5 cursor-pointer group">
                        <div
                          className={cn("w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0",
                            item.checked ? "bg-[var(--primary)] border-[var(--primary)]" : "border-gray-300 group-hover:border-[var(--primary)]")}
                          onClick={() => toggleChecklist(item.id)}>
                          {item.checked && <Check size={11} className="text-white" />}
                        </div>
                        <span className={cn("text-sm", item.checked && "line-through text-[var(--text-muted)]")}>{item.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              {task.tags.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5"><Tag size={14} />Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map(tag => (
                      <span key={tag} className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right rail */}
            <div className="flex flex-col gap-4">
              {/* Assignment */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Assignment</h3>
                <div className="flex flex-col gap-3 text-sm">
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1">Assignee</p>
                    {task.assignee_name ? (
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                          {task.assignee_initials}
                        </div>
                        <span className="font-medium">{task.assignee_name}</span>
                      </div>
                    ) : <span className="text-[var(--text-muted)]">Unassigned</span>}
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1">Watchers</p>
                    <div className="flex flex-wrap gap-1.5">
                      {task.watchers.map(w => (
                        <div key={w} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-xs font-medium">
                          <div className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                            style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                            {getInitials(w)}
                          </div>
                          {w}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Dates & project */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Dates &amp; Project</h3>
                <div className="flex flex-col gap-2.5 text-sm">
                  <div className="flex justify-between"><span className="text-[var(--text-muted)]">Project</span>
                    <Link href={`/app/projects/${task.project_id}`} className="font-medium text-[var(--primary)] hover:underline truncate max-w-[140px]">{task.project}</Link>
                  </div>
                  <div className="flex justify-between"><span className="text-[var(--text-muted)]">Start date</span><span className="font-medium">{formatDate(task.start_date)}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-muted)]">Due date</span><span className={cn("font-medium", isOverdue ? "text-[#DC2626]" : "")}>{formatDate(task.due_date)}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-muted)]">Completed</span><span className="font-medium">{task.completed_at ? formatDate(task.completed_at) : "—"}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-muted)]">Category</span><span className="font-medium">{task.category}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-muted)]">Recurrence</span><span className="font-medium">{task.recurrence}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-muted)]">Last updated</span><span className="text-[var(--text-muted)]">{formatRelative(task.updated_at)}</span></div>
                </div>
              </div>

              {/* Time summary */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Time Tracking</h3>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-2xl font-bold">{totalLoggedHours}h</span>
                  <span className="text-sm text-[var(--text-muted)] mb-0.5">/ {task.estimated_hours}h est.</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-3">
                  <div className={cn("h-full rounded-full transition-all", hoursProgress >= 100 ? "bg-[#DC2626]" : "bg-[var(--primary)]")}
                    style={{ width: `${hoursProgress}%` }} />
                </div>
                <button className="btn btn-secondary btn-sm w-full" onClick={() => { setTab("time-tracking"); setShowTimeForm(true); }}>
                  <Timer size={13} />Log Time
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Comments ── */}
        {tab === "comments" && (
          <div className="max-w-2xl flex flex-col gap-5">
            {task.comments.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
                <MessageSquare size={28} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-[var(--text-muted)]">No comments yet. Be the first to comment.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {task.comments.map((c) => (
                  <div key={c.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                        {c.author_initials}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold">{c.author}</p>
                          <span className="text-xs text-[var(--text-muted)]">{formatRelative(c.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap ml-11">{c.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add comment */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold mb-3">Add Comment</h3>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                  JW
                </div>
                <div className="flex-1">
                  <textarea
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment… use @ to mention someone"
                    onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submitComment(); }}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-[var(--text-muted)]">Cmd+Enter to submit</span>
                    <button className="btn btn-primary btn-sm" onClick={submitComment} disabled={submittingComment || !newComment.trim()}>
                      {submittingComment ? <RefreshCw size={13} className="animate-spin" /> : <MessageSquare size={13} />}
                      Comment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Linked Records ── */}
        {tab === "linked-records" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">{linkedRecords.length} Linked Record{linkedRecords.length !== 1 ? "s" : ""}</h2>
              <button className="btn btn-primary btn-sm" onClick={() => setShowLinkForm(s => !s)}><Plus size={14} />Add Link</button>
            </div>

            {showLinkForm && (
              <div className="bg-white rounded-2xl border border-[var(--primary)] shadow-sm p-5">
                <h3 className="text-sm font-semibold mb-3">Link Record</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                  {["Change Event", "Application", "Project", "Drawing", "Evidence", "Supplier"].map(type => (
                    <button key={type} className="px-3 py-2 rounded-xl text-xs font-medium border border-gray-200 text-gray-600 hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors">
                      {type}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" placeholder="Search by ref or title…" />
                  <button className="btn btn-ghost btn-sm" onClick={() => setShowLinkForm(false)}><X size={14} /></button>
                </div>
              </div>
            )}

            {linkedRecords.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
                <Layers size={28} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-[var(--text-muted)]">No linked records yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {(["Project", "Change Event", "Application", "Drawing", "Evidence", "Supplier"] as const).map(groupType => {
                  const group = linkedRecords.filter(r => r.type === groupType);
                  if (group.length === 0) return null;
                  return (
                    <div key={groupType} className="flex flex-col gap-2">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">{groupType}s</h3>
                      {group.map(r => (
                        <div key={r.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {linkedTypeChip(r.type)}
                              <span className="text-xs font-mono text-[var(--text-muted)]">{r.ref}</span>
                            </div>
                            <p className="text-sm font-medium truncate">{r.title}</p>
                            <p className="text-xs text-[var(--text-muted)]">{r.status}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Link href={r.link} className="btn btn-ghost btn-sm btn-icon"><ExternalLink size={13} /></Link>
                            <button className="btn btn-ghost btn-sm btn-icon text-[#DC2626]" onClick={() => toast.info("Unlinked")}><X size={13} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Time Tracking ── */}
        {tab === "time-tracking" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Time Tracking</h2>
                <p className="text-sm text-[var(--text-muted)]">{totalLoggedHours}h logged of {task.estimated_hours}h estimated</p>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-secondary btn-sm" onClick={() => toast.info("Exporting timesheet")}><Download size={14} />Export</button>
                <button className="btn btn-primary btn-sm" onClick={() => setShowTimeForm(s => !s)}><Plus size={14} />Log Time</button>
              </div>
            </div>

            {/* Hours progress */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="flex items-end gap-3 mb-2">
                <span className="text-3xl font-bold">{totalLoggedHours}h</span>
                <span className="text-sm text-[var(--text-muted)] mb-0.5">logged of {task.estimated_hours}h estimated</span>
                {hoursProgress >= 100 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#FEE2E2] text-[#B91C1C] text-xs font-semibold mb-0.5">Over budget</span>
                )}
              </div>
              <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                <div className={cn("h-full rounded-full transition-all", hoursProgress >= 100 ? "bg-[#DC2626]" : hoursProgress >= 80 ? "bg-[#D97706]" : "bg-[var(--primary)]")}
                  style={{ width: `${hoursProgress}%` }} />
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1.5">{hoursProgress.toFixed(0)}% of budget used</p>
            </div>

            {/* Log time form */}
            {showTimeForm && (
              <div className="bg-white rounded-2xl border border-[var(--primary)] shadow-sm p-5">
                <h3 className="text-sm font-semibold mb-4">Log Time</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Date</label>
                    <input type="date" value={timeDate} onChange={e => setTimeDate(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Hours</label>
                    <input type="number" min="0.25" step="0.25" value={timeHours} onChange={e => setTimeHours(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      placeholder="e.g. 2.5" />
                  </div>
                </div>
                <div className="mb-3">
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-1 block">Description</label>
                  <input value={timeDesc} onChange={e => setTimeDesc(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    placeholder="What did you work on?" />
                </div>
                <div className="flex gap-2">
                  <button className="btn btn-primary btn-sm" onClick={logTime} disabled={loggingTime}>
                    {loggingTime ? <RefreshCw size={13} className="animate-spin" /> : <Timer size={13} />} Log Time
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowTimeForm(false)}>Cancel</button>
                </div>
              </div>
            )}

            {/* Time log table */}
            {timeLog.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
                <Timer size={28} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-[var(--text-muted)]">No time logged yet</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["Date", "User", "Hours", "Description", ""].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeLog.map(e => (
                      <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(e.date)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                              style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                              {getInitials(e.user)}
                            </div>
                            {e.user}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-semibold">{e.hours}h</td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{e.description}</td>
                        <td className="px-4 py-3">
                          <button className="btn btn-ghost btn-sm btn-icon text-[#DC2626]" onClick={() => toast.info("Delete entry")}><Trash2 size={13} /></button>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 border-t border-gray-200">
                      <td colSpan={2} className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Total</td>
                      <td className="px-4 py-2 font-bold text-sm">{totalLoggedHours}h</td>
                      <td colSpan={2} />
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Subtasks ── */}
        {tab === "subtasks" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">{subtasks.length} Subtask{subtasks.length !== 1 ? "s" : ""}</h2>
                {subtasks.length > 0 && (
                  <p className="text-sm text-[var(--text-muted)]">{subtasks.filter(s => s.status === "Done").length}/{subtasks.length} completed</p>
                )}
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => setAddingSubtask(true)}><Plus size={14} />Add Subtask</button>
            </div>

            {addingSubtask && (
              <div className="bg-white rounded-2xl border border-[var(--primary)] shadow-sm p-5">
                <h3 className="text-sm font-semibold mb-3">New Subtask</h3>
                <input value={newSubtaskTitle} onChange={e => setNewSubtaskTitle(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] mb-3"
                  placeholder="Subtask title…" autoFocus />
                <div className="flex gap-2">
                  <button className="btn btn-primary btn-sm" onClick={addSubtask} disabled={!newSubtaskTitle.trim()}><Check size={13} />Add</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setAddingSubtask(false); setNewSubtaskTitle(""); }}>Cancel</button>
                </div>
              </div>
            )}

            {subtasks.length === 0 && !addingSubtask ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
                <CheckSquare size={28} className="mx-auto mb-2 text-gray-300" />
                <p className="text-sm text-[var(--text-muted)]">No subtasks yet</p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["Title", "Assignee", "Priority", "Due", "Status", ""].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {subtasks.map(s => (
                      <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium">{s.title}</td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{s.assignee}</td>
                        <td className="px-4 py-3">{priorityChip(s.priority)}</td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(s.due_date)}</td>
                        <td className="px-4 py-3">{statusChip(s.status)}</td>
                        <td className="px-4 py-3">
                          <Link href={`/app/tasks/${s.id}`} className="btn btn-ghost btn-sm btn-icon"><ExternalLink size={13} /></Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Attachments ── */}
        {tab === "attachments" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">{attachments.length} Attachment{attachments.length !== 1 ? "s" : ""}</h2>
              <div className="flex gap-2">
                {attachments.length > 0 && (
                  <button className="btn btn-secondary btn-sm" onClick={() => toast.info("Downloading all")}><Download size={14} />Download All</button>
                )}
                <button className="btn btn-primary btn-sm" onClick={() => fileInputRef.current?.click()}><Upload size={14} />Upload</button>
                <input ref={fileInputRef} type="file" multiple className="hidden" onChange={() => toast.info("File upload started")} />
              </div>
            </div>

            {/* Drag drop zone */}
            <div
              className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-[var(--primary)] hover:bg-[var(--primary-light)] transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={() => toast.info("File dropped")}>
              <Paperclip size={24} className="mx-auto mb-2 text-gray-300" />
              <p className="text-sm text-[var(--text-muted)]">Drag & drop files here, or click to upload</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">PDF, Excel, Word, Images — max 50MB per file</p>
            </div>

            {attachments.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {["Filename", "Type", "Size", "Uploaded By", "Date", ""].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {attachments.map(a => (
                      <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 flex-shrink-0">
                              <FileText size={14} className="text-gray-500" />
                            </div>
                            <span className="font-medium">{a.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium uppercase">{a.type}</span></td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{a.size}</td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{a.uploaded_by}</td>
                        <td className="px-4 py-3 text-[var(--text-muted)]">{formatDateTime(a.uploaded_at)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button className="btn btn-ghost btn-sm btn-icon" onClick={() => toast.info("Download " + a.name)}><Download size={13} /></button>
                            <button className="btn btn-ghost btn-sm btn-icon text-[#DC2626]" onClick={() => toast.info("Delete " + a.name)}><Trash2 size={13} /></button>
                          </div>
                        </td>
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
            <h2 className="text-base font-semibold">Audit Trail</h2>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              {activityLog.length === 0 ? (
                <div className="text-center py-8">
                  <Activity size={28} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-[var(--text-muted)]">No activity recorded yet</p>
                </div>
              ) : (
                <div className="flex flex-col gap-0">
                  {activityLog.map((a, idx) => (
                    <div key={a.id} className={cn("flex items-start gap-3 py-3.5", idx < activityLog.length - 1 && "border-b border-gray-50")}>
                      {activityEntryIcon(a.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{a.description}</p>
                        {a.field && (
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            {a.field}: <span className="line-through">{a.old_value}</span> → <span className="font-medium text-[var(--text-primary)]">{a.new_value}</span>
                          </p>
                        )}
                        {a.type === "status" && a.old_value && (
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            <span className="line-through">{a.old_value}</span> → <span className="font-medium text-[var(--primary)]">{a.new_value}</span>
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
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

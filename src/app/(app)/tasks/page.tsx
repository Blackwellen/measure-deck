"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Plus, Filter, Download, CheckSquare, LayoutGrid, List,
  Calendar, AlertTriangle, Layers, ChevronDown, Search,
  Clock, User, Flag, MoreHorizontal, CheckCircle2, Circle,
  AlignLeft, BookOpen,
} from "lucide-react";
import { cn, formatDate, formatRelative, getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

/* ─────────────────────────── Types ─────────────────────────── */

type Priority = "Critical" | "High" | "Medium" | "Low";
type Status = "To Do" | "In Progress" | "In Review" | "Done" | "Cancelled";

interface Task {
  id: string;
  title: string;
  priority: Priority;
  status: Status;
  assignee_name: string | null;
  project: string;
  project_id: string;
  due_date: string | null;
  created_at: string;
  description?: string;
}

/* ─────────────────────────── Seed ──────────────────────────── */

const SEED_TASKS: Task[] = [
  { id: "t-001", title: "Submit Application No. 12 to Thornfield", priority: "Critical", status: "To Do", assignee_name: "James Whitfield", project: "Thornfield Commercial Hub", project_id: "p-001", due_date: "2026-06-12", created_at: "2026-06-01" },
  { id: "t-002", title: "Upload daywork sheets for VO-047", priority: "High", status: "To Do", assignee_name: "Sarah Chen", project: "City Centre Retail Fit-Out", project_id: "p-002", due_date: "2026-06-14", created_at: "2026-06-03" },
  { id: "t-003", title: "Lock CVR Period 8 — Eastside Block A", priority: "High", status: "In Progress", assignee_name: "Mark Hughes", project: "Eastside Residential Block A", project_id: "p-003", due_date: "2026-06-15", created_at: "2026-06-05" },
  { id: "t-004", title: "Review retention deduction on Whitfield Leisure", priority: "Medium", status: "In Progress", assignee_name: "James Whitfield", project: "Whitfield Leisure Centre", project_id: "p-004", due_date: "2026-06-18", created_at: "2026-06-06" },
  { id: "t-005", title: "Prepare final account summary for Office Block Phase 2", priority: "High", status: "In Review", assignee_name: "Claire Morton", project: "Office Block Phase 2", project_id: "p-005", due_date: "2026-06-20", created_at: "2026-06-07" },
  { id: "t-006", title: "Send notice of delay for weather event", priority: "Critical", status: "To Do", assignee_name: "Dave Okafor", project: "Motorway Service Station", project_id: "p-006", due_date: "2026-06-11", created_at: "2026-06-08" },
  { id: "t-007", title: "Reconcile subcontractor payments — Apex Groundworks", priority: "Medium", status: "Done", assignee_name: "Tom Griffiths", project: "City Centre Retail Fit-Out", project_id: "p-002", due_date: "2026-06-08", created_at: "2026-05-28" },
  { id: "t-008", title: "Update programme baseline after scope change", priority: "Low", status: "Done", assignee_name: "Angela Brooks", project: "Eastside Residential Block A", project_id: "p-003", due_date: "2026-06-09", created_at: "2026-05-30" },
];

/* ─────────────────────────── Helpers ───────────────────────── */

function priorityChip(priority: Priority, sm = false) {
  const cfg: Record<Priority, { cls: string; label: string }> = {
    Critical: { cls: "chip-danger", label: "Critical" },
    High: { cls: "chip-warning", label: "High" },
    Medium: { cls: "badge", label: "Medium" },
    Low: { cls: "chip-muted", label: "Low" },
  };
  const { cls, label } = cfg[priority];
  return (
    <span
      className={cn("badge", cls, sm && "text-[10px] px-1.5")}
      style={priority === "Medium" ? { background: "#FFF3E0", color: "#B45309" } : undefined}
    >
      {label}
    </span>
  );
}

function statusChip(status: Status) {
  const cfg: Record<Status, string> = {
    "To Do": "chip-muted",
    "In Progress": "chip-info",
    "In Review": "chip-violet",
    "Done": "chip-success",
    "Cancelled": "chip-danger",
  };
  return <span className={cn("badge", cfg[status])}>{status}</span>;
}

function isOverdue(dueDate: string | null) {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date(new Date().toDateString());
}

type ViewTab = "my-tasks" | "all-tasks" | "board" | "calendar" | "overdue" | "linked-records";
const TABS: { id: ViewTab; label: string }[] = [
  { id: "my-tasks", label: "My Tasks" },
  { id: "all-tasks", label: "All Tasks" },
  { id: "board", label: "Board" },
  { id: "calendar", label: "Calendar" },
  { id: "overdue", label: "Overdue" },
  { id: "linked-records", label: "Linked Records" },
];

/* ─────────────────────────── Main Page ─────────────────────── */

export default function TasksPage() {
  const [tab, setTab] = useState<ViewTab>("my-tasks");
  const [tasks, setTasks] = useState<Task[]>(SEED_TASKS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("tasks")
          .select("*")
          .order("created_at", { ascending: false });
        if (data && data.length > 0) setTasks(data as Task[]);
      } catch {
        // fallback to seed
      } finally {
        setLoading(false);
      }
    }
    const t = setTimeout(load, 400);
    return () => clearTimeout(t);
  }, []);

  const filtered = tasks.filter((t) => {
    const q = search.toLowerCase();
    return !q || t.title.toLowerCase().includes(q) || t.project.toLowerCase().includes(q);
  });

  const overdue = filtered.filter((t) => isOverdue(t.due_date) && t.status !== "Done" && t.status !== "Cancelled");
  const myTasks = filtered.filter((t) => t.assignee_name === "James Whitfield");

  async function handleNewTask() {
    toast.info("Open new task dialog");
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-xl font-semibold">Tasks</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {tasks.length} total tasks · {overdue.length} overdue
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn btn-secondary btn-sm"><Filter size={14} />Filter</button>
          <button className="btn btn-secondary btn-sm"><BookOpen size={14} />Saved Views</button>
          <button className="btn btn-secondary btn-sm"><CheckCircle2 size={14} />Bulk Complete</button>
          <button className="btn btn-secondary btn-sm"><Download size={14} />Export</button>
          <button className="btn btn-secondary btn-sm"><User size={14} />Assign Task</button>
          <button className="btn btn-primary btn-sm" onClick={handleNewTask}><Plus size={14} />New Task</button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="tab-bar mt-4">
        {TABS.map((t) => (
          <button key={t.id} className={cn("tab-item", tab === t.id && "active")} onClick={() => setTab(t.id)}>
            {t.label}
            {t.id === "overdue" && overdue.length > 0 && (
              <span className="ml-1.5 badge chip-danger text-[10px] px-1.5">{overdue.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="px-6 py-3 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="relative max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="search"
            placeholder="Search tasks…"
            className="form-input pl-9 h-8 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="page-content flex-1">
        {loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {tab === "my-tasks" && <MyTasksView tasks={myTasks} />}
            {tab === "all-tasks" && <TableView tasks={filtered} />}
            {tab === "board" && <BoardView tasks={tasks} setTasks={setTasks} />}
            {tab === "calendar" && <CalendarView tasks={filtered} />}
            {tab === "overdue" && <OverdueView tasks={overdue} />}
            {tab === "linked-records" && <LinkedRecordsView tasks={filtered} />}
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── My Tasks (3 columns) ──────────── */

function MyTasksView({ tasks }: { tasks: Task[] }) {
  const columns: { status: Status; label: string; color: string }[] = [
    { status: "To Do", label: "To Do", color: "var(--text-muted)" },
    { status: "In Progress", label: "In Progress", color: "var(--primary)" },
    { status: "Done", label: "Done", color: "var(--success)" },
  ];

  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><CheckSquare size={22} /></div>
        <p className="font-semibold">No tasks assigned to you</p>
        <p className="text-sm text-[var(--text-muted)]">Tasks assigned to you will appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {columns.map(({ status, label, color }) => {
        const col = tasks.filter((t) => t.status === status);
        return (
          <div key={status} className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color }}>
                {label}
              </span>
              <span className="badge chip-muted text-[10px]">{col.length}</span>
            </div>
            <div className="flex flex-col gap-2 max-h-[70vh] overflow-y-auto pr-1">
              {col.length === 0 ? (
                <div className="card p-4 text-center text-sm text-[var(--text-muted)]">No tasks</div>
              ) : (
                col.map((task) => <TaskCard key={task.id} task={task} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TaskCard({ task, dragging = false }: { task: Task; dragging?: boolean }) {
  const overdue = isOverdue(task.due_date) && task.status !== "Done";
  return (
    <Link
      href={`/app/tasks/${task.id}`}
      className={cn(
        "card p-3.5 block hover:shadow-md transition-shadow",
        dragging && "opacity-80 rotate-1 shadow-lg"
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        {priorityChip(task.priority, true)}
        <button
          className="btn btn-ghost btn-icon btn-sm flex-shrink-0"
          onClick={(e) => { e.preventDefault(); }}
        >
          <MoreHorizontal size={13} />
        </button>
      </div>
      <p className="text-sm font-medium text-[var(--text-primary)] leading-tight mb-2">{task.title}</p>
      <p className="text-xs text-[var(--text-muted)] mb-2 truncate">{task.project}</p>
      <div className="flex items-center justify-between mt-1">
        <div className="flex items-center gap-1.5">
          {task.assignee_name && (
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
              style={{ background: "var(--primary-light)", color: "var(--primary)" }}
            >
              {getInitials(task.assignee_name)}
            </div>
          )}
        </div>
        {task.due_date && (
          <span
            className={cn("text-xs flex items-center gap-1", overdue ? "text-[var(--danger)] font-semibold" : "text-[var(--text-muted)]")}
          >
            <Clock size={11} />
            {formatDate(task.due_date)}
          </span>
        )}
      </div>
    </Link>
  );
}

/* ─────────────────────────── Table View ────────────────────── */

type SortKey = "title" | "priority" | "status" | "assignee_name" | "project" | "due_date" | "created_at";

function TableView({ tasks }: { tasks: Task[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function sort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  const PRIORITY_ORDER: Record<Priority, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  const sorted = [...tasks].sort((a, b) => {
    let cmp = 0;
    if (sortKey === "priority") cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    else {
      const av = (a[sortKey] ?? "") as string;
      const bv = (b[sortKey] ?? "") as string;
      cmp = av.localeCompare(bv);
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const Th = ({ k, label }: { k: SortKey; label: string }) => (
    <th className="cursor-pointer select-none" onClick={() => sort(k)}>
      <span className="flex items-center gap-1">
        {label}
        {sortKey === k && <span className="text-[10px]">{sortDir === "asc" ? "↑" : "↓"}</span>}
      </span>
    </th>
  );

  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><List size={22} /></div>
        <p className="font-semibold">No tasks found</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <Th k="title" label="Title" />
              <Th k="priority" label="Priority" />
              <Th k="status" label="Status" />
              <Th k="assignee_name" label="Assigned To" />
              <Th k="project" label="Project" />
              <Th k="due_date" label="Due Date" />
              <Th k="created_at" label="Created" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((task) => (
              <tr key={task.id}>
                <td>
                  <Link href={`/app/tasks/${task.id}`} className="font-medium hover:text-[var(--primary)] transition-colors">
                    {task.title}
                  </Link>
                </td>
                <td>{priorityChip(task.priority, true)}</td>
                <td>{statusChip(task.status)}</td>
                <td>
                  {task.assignee_name ? (
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                        style={{ background: "var(--primary-light)", color: "var(--primary)" }}
                      >
                        {getInitials(task.assignee_name)}
                      </div>
                      <span className="text-sm">{task.assignee_name}</span>
                    </div>
                  ) : (
                    <span className="text-[var(--text-muted)] text-sm">Unassigned</span>
                  )}
                </td>
                <td>
                  <Link href={`/app/projects/${task.project_id}`} className="text-sm text-[var(--primary)] hover:underline">
                    {task.project}
                  </Link>
                </td>
                <td>
                  {task.due_date && (
                    <span className={cn("text-sm", isOverdue(task.due_date) && task.status !== "Done" ? "text-[var(--danger)] font-semibold" : "text-[var(--text-secondary)]")}>
                      {formatDate(task.due_date)}
                    </span>
                  )}
                </td>
                <td className="text-sm text-[var(--text-muted)]">{formatRelative(task.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────── Board (Kanban + dnd-kit) ──────── */

const BOARD_COLUMNS: { status: Status; color: string }[] = [
  { status: "To Do", color: "var(--text-muted)" },
  { status: "In Progress", color: "var(--primary)" },
  { status: "In Review", color: "var(--violet)" },
  { status: "Done", color: "var(--success)" },
  { status: "Cancelled", color: "var(--danger)" },
];

function SortableTaskCard({ task }: { task: Task }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} />
    </div>
  );
}

function BoardView({ tasks, setTasks }: { tasks: Task[]; setTasks: (t: Task[]) => void }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  function onDragStart({ active }: DragStartEvent) {
    setActiveTask(tasks.find((t) => t.id === active.id) ?? null);
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveTask(null);
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    // Check if dropped on a column header
    const colStatus = BOARD_COLUMNS.find((c) => c.status === overId)?.status;
    if (colStatus) {
      setTasks(tasks.map((t) => t.id === activeId ? { ...t, status: colStatus } : t));
      return;
    }
    // Dropped on another card
    const overTask = tasks.find((t) => t.id === overId);
    const activeTask = tasks.find((t) => t.id === activeId);
    if (!overTask || !activeTask) return;
    const updated = tasks.map((t) => t.id === activeId ? { ...t, status: overTask.status } : t);
    const activeIdx = updated.findIndex((t) => t.id === activeId);
    const overIdx = updated.findIndex((t) => t.id === overId);
    setTasks(arrayMove(updated, activeIdx, overIdx));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[60vh]">
        {BOARD_COLUMNS.map(({ status, color }) => {
          const col = tasks.filter((t) => t.status === status);
          return (
            <div key={status} className="flex-shrink-0 w-64 flex flex-col gap-2">
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: "var(--bg-muted)" }}
                id={status}
              >
                <span className="text-xs font-bold uppercase tracking-widest flex-1" style={{ color }}>
                  {status}
                </span>
                <span className="badge chip-muted text-[10px]">{col.length}</span>
              </div>
              <SortableContext items={col.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col gap-2 min-h-[100px]">
                  {col.map((task) => <SortableTaskCard key={task.id} task={task} />)}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>
      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} dragging />}
      </DragOverlay>
    </DndContext>
  );
}

/* ─────────────────────────── Calendar View ─────────────────── */

function CalendarView({ tasks }: { tasks: Task[] }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = new Date(year, month).toLocaleString("en-GB", { month: "long", year: "numeric" });

  const tasksByDate: Record<string, Task[]> = {};
  tasks.forEach((t) => {
    if (!t.due_date) return;
    const d = t.due_date.slice(0, 10);
    if (!tasksByDate[d]) tasksByDate[d] = [];
    tasksByDate[d].push(t);
  });

  const PRIORITY_COLOR: Record<Priority, string> = {
    Critical: "var(--danger)",
    High: "var(--warning)",
    Medium: "#F59E0B",
    Low: "var(--text-muted)",
  };

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay === 0 ? 6 : firstDay - 1 }).map(() => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="card p-5">
      {/* Nav */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary btn-sm btn-icon" onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); }}>‹</button>
          <span className="font-semibold text-sm">{monthName}</span>
          <button className="btn btn-secondary btn-sm btn-icon" onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); }}>›</button>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth()); }}>Today</button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-[var(--text-muted)] py-1">{d}</div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-px bg-[var(--border)]">
        {cells.map((day, idx) => {
          const dateStr = day ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}` : "";
          const dayTasks = day ? (tasksByDate[dateStr] ?? []) : [];
          const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
          return (
            <div
              key={idx}
              className="bg-[var(--bg-surface)] min-h-[80px] p-1.5"
              style={{ background: !day ? "var(--bg-muted)" : undefined }}
            >
              {day && (
                <>
                  <div
                    className={cn(
                      "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1",
                      isToday ? "bg-[var(--primary)] text-white" : "text-[var(--text-secondary)]"
                    )}
                  >
                    {day}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {dayTasks.slice(0, 3).map((t) => (
                      <Link
                        key={t.id}
                        href={`/app/tasks/${t.id}`}
                        className="text-[10px] font-medium px-1 py-0.5 rounded truncate block text-white"
                        style={{ background: PRIORITY_COLOR[t.priority] }}
                        title={t.title}
                      >
                        {t.title}
                      </Link>
                    ))}
                    {dayTasks.length > 3 && (
                      <span className="text-[10px] text-[var(--text-muted)] px-1">+{dayTasks.length - 3} more</span>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────── Overdue View ──────────────────── */

function OverdueView({ tasks }: { tasks: Task[] }) {
  const sorted = [...tasks].sort((a, b) => {
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    return a.due_date.localeCompare(b.due_date);
  });

  if (sorted.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><CheckCircle2 size={22} /></div>
        <p className="font-semibold text-[var(--success)]">No overdue tasks</p>
        <p className="text-sm text-[var(--text-muted)]">You're all caught up!</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Task</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Project</th>
              <th>Due Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((task) => (
              <tr key={task.id}>
                <td>
                  <Link href={`/app/tasks/${task.id}`} className="font-medium hover:text-[var(--primary)] transition-colors">
                    {task.title}
                  </Link>
                </td>
                <td>{priorityChip(task.priority, true)}</td>
                <td>{statusChip(task.status)}</td>
                <td className="text-sm">{task.assignee_name ?? "—"}</td>
                <td className="text-sm text-[var(--text-muted)]">{task.project}</td>
                <td>
                  <span className="badge chip-danger text-xs flex items-center gap-1 w-fit">
                    <AlertTriangle size={10} />
                    {formatDate(task.due_date)}
                  </span>
                </td>
                <td>
                  <Link href={`/app/tasks/${task.id}`} className="btn btn-secondary btn-sm">Open</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────── Linked Records View ───────────── */

function LinkedRecordsView({ tasks }: { tasks: Task[] }) {
  const projects = Array.from(new Set(tasks.map((t) => t.project)));
  return (
    <div className="flex flex-col gap-6">
      {projects.map((project) => {
        const pts = tasks.filter((t) => t.project === project);
        return (
          <div key={project}>
            <h3 className="text-sm font-semibold mb-3 text-[var(--text-primary)]">{project}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {pts.map((task) => (
                <Link key={task.id} href={`/app/tasks/${task.id}`} className="card p-3.5 block hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-2 mb-1.5">
                    <Layers size={14} className="text-[var(--text-muted)] flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-[var(--text-primary)] leading-tight">{task.title}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {priorityChip(task.priority, true)}
                    {statusChip(task.status)}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

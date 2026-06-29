"use client";

import { useState } from "react";
import { Plus, MoreHorizontal, CheckCircle2, Play, CalendarDays } from "lucide-react";
import { CE025_TASKS, type SeedChangeTask } from "@/lib/seed/projects";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(s: string): string {
  return new Date(s).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isOverdue(dueDate: string, status: SeedChangeTask["status"]): boolean {
  if (status === "done") return false;
  return new Date(dueDate) < new Date();
}

function isUrgent(dueDate: string, status: SeedChangeTask["status"]): boolean {
  if (status === "done") return false;
  const diff = new Date(dueDate).getTime() - Date.now();
  return diff >= 0 && diff < 3 * 24 * 60 * 60 * 1000;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

const PRIORITY_CHIPS: Record<SeedChangeTask["priority"], string> = {
  low: "chip-muted",
  medium: "chip-info",
  high: "chip-warning",
  critical: "chip-danger",
};

type Column = { id: SeedChangeTask["status"]; label: string };
const COLUMNS: Column[] = [
  { id: "todo", label: "To Do" },
  { id: "in_progress", label: "In Progress" },
  { id: "done", label: "Done" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const [tasks, setTasks] = useState<SeedChangeTask[]>(CE025_TASKS);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [priority, setPriority] = useState<SeedChangeTask["priority"]>("medium");
  const [dueDate, setDueDate] = useState("");
  const [description, setDescription] = useState("");

  const counts = {
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "todo").length,
    in_progress: tasks.filter((t) => t.status === "in_progress").length,
    done: tasks.filter((t) => t.status === "done").length,
  };

  function quickAction(id: string, action: "done" | "start") {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: action === "done" ? "done" : "in_progress" }
          : t
      )
    );
  }

  function addTask() {
    if (!title.trim()) return;
    const newTask: SeedChangeTask = {
      id: `T-NEW-${Date.now()}`,
      title,
      assignee,
      priority,
      dueDate,
      status: "todo",
      description,
    };
    setTasks((prev) => [...prev, newTask]);
    setTitle("");
    setAssignee("");
    setPriority("medium");
    setDueDate("");
    setDescription("");
    setShowForm(false);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: counts.total, color: "var(--text-primary)" },
          { label: "To Do", value: counts.todo, color: "var(--warning)" },
          { label: "In Progress", value: counts.in_progress, color: "var(--primary)" },
          { label: "Done", value: counts.done, color: "var(--success)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="kpi-card">
            <div className="kpi-label">{label}</div>
            <div className="kpi-value text-2xl" style={{ color }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Add Task Button */}
      <div className="flex justify-end">
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={13} />
          Add Task
        </button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="flex flex-col gap-2">
              {/* Column header */}
              <div className="flex items-center justify-between px-1 mb-1">
                <span
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  {col.label}
                </span>
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background: "var(--bg-muted)", color: "var(--text-muted)" }}
                >
                  {colTasks.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2 min-h-[80px]">
                {colTasks.map((task) => {
                  const overdue = isOverdue(task.dueDate, task.status);
                  const urgent = isUrgent(task.dueDate, task.status);
                  return (
                    <div
                      key={task.id}
                      className="card p-3 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      {/* Priority + menu */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span
                          className={`badge text-[10px] capitalize ${PRIORITY_CHIPS[task.priority]}`}
                        >
                          {task.priority}
                        </span>
                        <button
                          className="btn btn-ghost btn-icon"
                          style={{ padding: "2px" }}
                        >
                          <MoreHorizontal size={12} />
                        </button>
                      </div>

                      {/* Title */}
                      <p
                        className="text-xs font-semibold leading-snug mb-1"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {task.title}
                      </p>

                      {/* Description */}
                      {task.description && (
                        <p
                          className="text-[11px] leading-snug mb-2 line-clamp-2"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {task.description}
                        </p>
                      )}

                      {/* Meta */}
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-1.5">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                            style={{ background: "var(--primary)" }}
                          >
                            {getInitials(task.assignee)}
                          </div>
                          <span
                            className="text-[10px] truncate max-w-[60px]"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {task.assignee.split(" ")[0]}
                          </span>
                        </div>
                        <div
                          className="flex items-center gap-1 text-[10px]"
                          style={{
                            color: overdue
                              ? "var(--danger)"
                              : urgent
                              ? "var(--warning)"
                              : "var(--text-muted)",
                            fontWeight: overdue || urgent ? 600 : undefined,
                          }}
                        >
                          <CalendarDays size={10} />
                          {fmtDate(task.dueDate)}
                        </div>
                      </div>

                      {/* Quick action */}
                      {task.status !== "done" && (
                        <div className="mt-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                          {task.status === "todo" ? (
                            <button
                              className="btn btn-ghost btn-sm text-[10px] w-full justify-center"
                              onClick={() => quickAction(task.id, "start")}
                            >
                              <Play size={10} /> Start
                            </button>
                          ) : (
                            <button
                              className="btn btn-ghost btn-sm text-[10px] w-full justify-center"
                              onClick={() => quickAction(task.id, "done")}
                              style={{ color: "var(--success)" }}
                            >
                              <CheckCircle2 size={10} /> Mark Done
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {colTasks.length === 0 && (
                  <div
                    className="flex items-center justify-center h-20 rounded-lg border-2 border-dashed"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Empty
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Task Form */}
      {showForm && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
            Add Task
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="sm:col-span-2">
              <label className="form-label">Title</label>
              <input
                className="form-input"
                placeholder="Task title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Assignee</label>
              <input
                className="form-input"
                placeholder="Name..."
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Priority</label>
              <select
                className="form-input"
                value={priority}
                onChange={(e) => setPriority(e.target.value as SeedChangeTask["priority"])}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="form-label">Due Date</label>
              <input
                className="form-input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                rows={2}
                placeholder="Optional description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-primary btn-sm" onClick={addTask}>
              Add Task
            </button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

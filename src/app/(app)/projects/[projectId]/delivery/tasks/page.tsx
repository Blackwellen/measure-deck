"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskPriority = "High" | "Medium" | "Low";
type TaskColumn   = "To Do" | "In Progress" | "Done";

interface Task {
  id:       string;
  title:    string;
  assignee: string;
  priority: TaskPriority;
  dueDate:  string;
  column:   TaskColumn;
}

// ─── Seed tasks ───────────────────────────────────────────────────────────────

const SEED_TASKS: Task[] = [
  { id: "T001", title: "Confirm drainage diversion scope with civil contractor",  assignee: "Rachel O",  priority: "High",   dueDate: "2025-06-20", column: "To Do"      },
  { id: "T002", title: "Prepare EoT notice for Section 4.1 submission",          assignee: "Daniel P",  priority: "High",   dueDate: "2025-06-16", column: "In Progress" },
  { id: "T003", title: "Review MEP rough-in programme with BuildTech MEP",       assignee: "Rachel O",  priority: "Medium", dueDate: "2025-06-28", column: "To Do"      },
  { id: "T004", title: "Reconcile Application #4 interim certificate",           assignee: "Daniel P",  priority: "High",   dueDate: "2025-06-18", column: "In Progress" },
  { id: "T005", title: "Update site photo record for L3 frame completion",       assignee: "Site Team", priority: "Low",    dueDate: "2025-06-14", column: "Done"        },
  { id: "T006", title: "Issue programme update to employer's agent",             assignee: "Rachel O",  priority: "Medium", dueDate: "2025-07-01", column: "Done"        },
];

const COLUMNS: TaskColumn[] = ["To Do", "In Progress", "Done"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function priorityChip(p: TaskPriority) {
  if (p === "High")   return "badge chip-danger";
  if (p === "Medium") return "badge chip-warning";
  return "badge chip-muted";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
}

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

function colHeaderStyle(col: TaskColumn) {
  if (col === "In Progress") return { background: "#EFF6FF", color: "#3B5EE8" };
  if (col === "Done")        return { background: "#F0FDF4", color: "#10B981" };
  return { background: "var(--bg-muted)", color: "var(--text-secondary)" };
}

// ─── Task card ────────────────────────────────────────────────────────────────

function TaskCard({ task }: { task: Task }) {
  return (
    <div className="card p-3 flex flex-col gap-2 cursor-pointer hover:shadow-md transition-shadow">
      <p className="text-[13px] font-500 leading-snug" style={{ color: "var(--text-primary)" }}>
        {task.title}
      </p>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-700 shrink-0"
            style={{ background: "var(--primary)" }}
          >
            {getInitials(task.assignee)}
          </div>
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{task.assignee}</span>
        </div>
        <span className={priorityChip(task.priority)}>{task.priority}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>Due {fmtDate(task.dueDate)}</span>
        <span className="font-mono text-[10px]" style={{ color: "var(--text-muted)" }}>{task.id}</span>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DeliveryTasksPage() {
  const [tasks] = useState<Task[]>(SEED_TASKS);

  const tasksByCol = (col: TaskColumn) => tasks.filter((t) => t.column === col);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-700" style={{ color: "var(--text-primary)" }}>Tasks</h2>
          <p className="text-[13px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            {tasks.length} tasks · {tasksByCol("In Progress").length} in progress
          </p>
        </div>
        <button className="btn btn-primary btn-sm flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Task
        </button>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = tasksByCol(col);
          const hStyle   = colHeaderStyle(col);
          return (
            <div key={col} className="flex flex-col gap-3">
              {/* Column header */}
              <div
                className="flex items-center justify-between rounded-lg px-3 py-2"
                style={{ background: hStyle.background }}
              >
                <span className="text-[13px] font-600" style={{ color: hStyle.color }}>{col}</span>
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-700"
                  style={{ background: hStyle.color, color: "#fff" }}
                >
                  {colTasks.length}
                </span>
              </div>

              {/* Task cards */}
              <div className="flex flex-col gap-2">
                {colTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {colTasks.length === 0 && (
                  <div
                    className="rounded-lg border-2 border-dashed px-4 py-6 text-center text-[12px]"
                    style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
                  >
                    No tasks here
                  </div>
                )}
              </div>

              {/* Add button per column */}
              <button
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] transition-colors hover:bg-[var(--bg-muted)] w-full text-left"
                style={{ color: "var(--text-muted)" }}
              >
                <Plus className="w-3.5 h-3.5" /> Add task
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

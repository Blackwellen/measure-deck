"use client";

import { useState } from "react";
import { Plus, Edit2, ArrowRight, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type AccessLevel = "Full Commercial" | "Full Project" | "Delivery Only" | "Documents" | "Read Only";

interface TeamMember {
  id: string;
  name: string;
  role: string;
  accessLevel: AccessLevel;
  joined: string;
}

interface WorkflowStep {
  label: string;
  who: string;
}

interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
}

interface NoticeField {
  id: string;
  label: string;
  value: string;
  unit: string;
  editable: boolean;
}

interface NumberingRule {
  id: string;
  label: string;
  prefix: string;
  preview: string;
}

// ─── Seed Data ────────────────────────────────────────────────────────────────

const INITIAL_TEAM: TeamMember[] = [
  { id: "t1", name: "Sarah Chen",      role: "QS Lead",             accessLevel: "Full Commercial", joined: "2024-08-01" },
  { id: "t2", name: "James Ward",      role: "PM",                  accessLevel: "Full Project",    joined: "2024-08-01" },
  { id: "t3", name: "Marcus Thompson", role: "Site Manager",        accessLevel: "Delivery Only",   joined: "2024-09-01" },
  { id: "t4", name: "Rachel Kim",      role: "Document Controller", accessLevel: "Documents",       joined: "2024-08-15" },
  { id: "t5", name: "Client View",     role: "Client",              accessLevel: "Read Only",       joined: "2025-01-10" },
];

const WORKFLOWS: Workflow[] = [
  {
    id: "w1",
    name: "Change Events",
    steps: [
      { label: "Raise",    who: "Any"      },
      { label: "Review",   who: "QS Lead"  },
      { label: "Submit",   who: "PM"       },
      { label: "Approved", who: "Client/PM"},
    ],
  },
  {
    id: "w2",
    name: "Payment Applications",
    steps: [
      { label: "Draft",   who: "QS"     },
      { label: "Submit",  who: "QS Lead"},
      { label: "Certify", who: "PM/CA"  },
    ],
  },
  {
    id: "w3",
    name: "Variations",
    steps: [
      { label: "Draft",   who: "QS"     },
      { label: "Pricing", who: "QS Lead"},
      { label: "Submit",  who: "PM"     },
    ],
  },
];

const INITIAL_NEC4: NoticeField[] = [
  { id: "quotation_window",  label: "Quotation Window",          value: "21", unit: "days",                editable: true  },
  { id: "acceptance_window", label: "Acceptance Window",         value: "14", unit: "days",                editable: true  },
  { id: "deemed_accepted",   label: "Deemed Accepted",           value: "+1", unit: "day",                 editable: false },
  { id: "early_warning",     label: "Early Warning",             value: "7",  unit: "days before deadline", editable: true  },
];

const INITIAL_HGCRA: NoticeField[] = [
  { id: "prescribed_period", label: "Prescribed Period (PLN)",  value: "5",  unit: "days",                editable: true  },
  { id: "pay_less_notice",   label: "Pay Less Notice",          value: "7",  unit: "days before payment date", editable: true },
];

const INITIAL_NUMBERING: NumberingRule[] = [
  { id: "nr1", label: "Change Events",  prefix: "CE-",  preview: "CE-024-001"  },
  { id: "nr2", label: "Applications",  prefix: "APP-", preview: "APP-01"      },
  { id: "nr3", label: "Evidence",      prefix: "EV-",  preview: "EV-001"      },
];

const ACCESS_LEVELS: AccessLevel[] = [
  "Full Commercial",
  "Full Project",
  "Delivery Only",
  "Documents",
  "Read Only",
];

const ACCESS_CHIP: Record<AccessLevel, string> = {
  "Full Commercial": "chip-info",
  "Full Project":    "chip-success",
  "Delivery Only":   "chip-warning",
  "Documents":       "chip-muted",
  "Read Only":       "chip-muted",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function GovernanceSettingsPage() {
  const [team, setTeam] = useState<TeamMember[]>(INITIAL_TEAM);
  const [nec4, setNec4] = useState<NoticeField[]>(INITIAL_NEC4);
  const [hgcra, setHgcra] = useState<NoticeField[]>(INITIAL_HGCRA);
  const [numbering, setNumbering] = useState<NumberingRule[]>(INITIAL_NUMBERING);
  const [saved, setSaved] = useState(false);

  const updateAccessLevel = (id: string, level: AccessLevel) => {
    setTeam((prev) => prev.map((m) => (m.id === id ? { ...m, accessLevel: level } : m)));
  };

  const updateNec4Field = (fieldId: string, value: string) => {
    setNec4((prev) => prev.map((f) => (f.id === fieldId ? { ...f, value } : f)));
  };

  const updateHgcraField = (fieldId: string, value: string) => {
    setHgcra((prev) => prev.map((f) => (f.id === fieldId ? { ...f, value } : f)));
  };

  const updatePrefix = (id: string, prefix: string) => {
    setNumbering((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              prefix,
              preview: id === "nr1"
                ? `${prefix}024-001`
                : id === "nr2"
                ? `${prefix}01`
                : `${prefix}001`,
            }
          : r
      )
    );
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="flex flex-col gap-6 max-w-4xl">

      {/* ── Roles & Team ── */}
      <div className="card p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Roles &amp; Team
          </h2>
          <button
            type="button"
            className="btn btn-primary btn-sm flex items-center gap-1.5"
          >
            <Plus size={13} />
            Add Member
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table w-full">
            <thead>
              <tr>
                <th>Team Member</th>
                <th>Role</th>
                <th>Access Level</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {team.map((member) => (
                <tr key={member.id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                        style={{ background: "var(--primary)" }}
                      >
                        {member.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                      </div>
                      <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {member.name}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                      {member.role}
                    </span>
                  </td>
                  <td>
                    <div className="relative">
                      <select
                        value={member.accessLevel}
                        onChange={(e) => updateAccessLevel(member.id, e.target.value as AccessLevel)}
                        className={cn(
                          "badge appearance-none pr-6 cursor-pointer text-[11px]",
                          ACCESS_CHIP[member.accessLevel]
                        )}
                        style={{ paddingRight: "1.5rem" }}
                        aria-label={`Access level for ${member.name}`}
                      >
                        {ACCESS_LEVELS.map((lvl) => (
                          <option key={lvl} value={lvl}>{lvl}</option>
                        ))}
                      </select>
                      <ChevronDown
                        size={10}
                        className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none"
                        style={{ color: "inherit" }}
                      />
                    </div>
                  </td>
                  <td>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {new Date(member.joined).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm flex items-center gap-1"
                      aria-label={`Edit ${member.name}`}
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Approval Workflows ── */}
      <div className="card p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Approval Workflows
        </h2>
        <div className="flex flex-col gap-4">
          {WORKFLOWS.map((wf) => (
            <div
              key={wf.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl"
              style={{ background: "var(--bg-muted)" }}
            >
              {/* Workflow name */}
              <p
                className="text-sm font-semibold w-40 flex-shrink-0"
                style={{ color: "var(--text-primary)" }}
              >
                {wf.name}
              </p>

              {/* Steps */}
              <div className="flex items-center gap-1 flex-wrap flex-1 min-w-0">
                {wf.steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <div
                      className="flex flex-col items-center px-2.5 py-1.5 rounded-lg"
                      style={{ background: "#fff", border: "1px solid var(--border)" }}
                    >
                      <span
                        className="text-[10px] font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {step.label}
                      </span>
                      <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {step.who}
                      </span>
                    </div>
                    {i < wf.steps.length - 1 && (
                      <ArrowRight size={12} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
                    )}
                  </div>
                ))}
              </div>

              {/* Edit link */}
              <button
                type="button"
                className="btn btn-ghost btn-sm flex items-center gap-1 text-xs flex-shrink-0"
                style={{ color: "var(--primary)" }}
              >
                <Edit2 size={11} /> Edit
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Notice Rules ── */}
      <div className="card p-5 flex flex-col gap-5">
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Notice Rules
        </h2>

        {/* NEC4 */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
            NEC4 Notice Settings
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nec4.map((field) => (
              <div
                key={field.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl"
                style={{ background: "var(--bg-muted)" }}
              >
                <label
                  htmlFor={`nec4-${field.id}`}
                  className="text-sm flex-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  {field.label}
                </label>
                <div className="flex items-center gap-2">
                  {field.editable ? (
                    <input
                      id={`nec4-${field.id}`}
                      type="text"
                      value={field.value}
                      onChange={(e) => updateNec4Field(field.id, e.target.value)}
                      className="form-input text-sm text-center"
                      style={{ width: 60 }}
                    />
                  ) : (
                    <span
                      className="text-sm font-semibold px-3 py-1.5 rounded-lg"
                      style={{ background: "var(--border)", color: "var(--text-muted)" }}
                    >
                      {field.value}
                    </span>
                  )}
                  <span className="text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                    {field.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* HGCRA */}
        <div className="flex flex-col gap-3">
          <p className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
            HGCRA Settings
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {hgcra.map((field) => (
              <div
                key={field.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl"
                style={{ background: "var(--bg-muted)" }}
              >
                <label
                  htmlFor={`hgcra-${field.id}`}
                  className="text-sm flex-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  {field.label}
                </label>
                <div className="flex items-center gap-2">
                  {field.editable ? (
                    <input
                      id={`hgcra-${field.id}`}
                      type="text"
                      value={field.value}
                      onChange={(e) => updateHgcraField(field.id, e.target.value)}
                      className="form-input text-sm text-center"
                      style={{ width: 60 }}
                    />
                  ) : (
                    <span
                      className="text-sm font-semibold px-3 py-1.5 rounded-lg"
                      style={{ background: "var(--border)", color: "var(--text-muted)" }}
                    >
                      {field.value}
                    </span>
                  )}
                  <span className="text-xs whitespace-nowrap" style={{ color: "var(--text-muted)" }}>
                    {field.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Reference Numbering ── */}
      <div className="card p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          Reference Numbering
        </h2>
        <div className="flex flex-col gap-3">
          {numbering.map((rule) => (
            <div
              key={rule.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl"
              style={{ background: "var(--bg-muted)" }}
            >
              <p
                className="text-sm font-medium w-36 flex-shrink-0"
                style={{ color: "var(--text-primary)" }}
              >
                {rule.label}
              </p>
              <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                <div className="flex items-center gap-1">
                  <label
                    htmlFor={`prefix-${rule.id}`}
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Prefix
                  </label>
                  <input
                    id={`prefix-${rule.id}`}
                    type="text"
                    value={rule.prefix}
                    onChange={(e) => updatePrefix(rule.id, e.target.value)}
                    className="form-input text-sm font-mono"
                    style={{ width: 80 }}
                  />
                </div>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>+</span>
                <span
                  className="text-xs px-2 py-1 rounded-lg font-mono"
                  style={{ background: "var(--border)", color: "var(--text-secondary)" }}
                >
                  {rule.id === "nr1"
                    ? "ProjectRef- + Sequential 3-digit"
                    : rule.id === "nr2"
                    ? "Sequential 2-digit"
                    : "Sequential 3-digit"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>Preview:</span>
                <span
                  className="badge chip-info font-mono text-[11px]"
                >
                  {rule.preview}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Save ── */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="btn btn-primary"
        >
          {saved ? "Saved!" : "Save Changes"}
        </button>
        {saved && (
          <span className="text-sm" style={{ color: "var(--success)" }}>
            Settings saved successfully.
          </span>
        )}
      </div>
    </div>
  );
}

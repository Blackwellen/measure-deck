"use client";

import { cn, formatCurrency, formatDate } from "@/lib/utils";
import {
  Building2,
  Calendar,
  MapPin,
  Upload,
  Plus,
  BarChart3,
  Pencil,
  MoreHorizontal,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export interface ProjectPageHeaderProps {
  project: {
    id: string;
    name: string;
    client: string;
    ref: string;
    contractValue: number;
    contractType: string;
    status: string;
    logoInitials: string;
    logoColor: string;
    startDate: string;
    endDate: string;
    address?: string;
    heroImageUrl?: string;
  };
}

const STATUS_META: Record<string, { chip: string; label: string }> = {
  active:    { chip: "chip-success", label: "Active" },
  on_hold:   { chip: "chip-warning", label: "On Hold" },
  completed: { chip: "chip-info",    label: "Completed" },
  disputed:  { chip: "chip-danger",  label: "Disputed" },
  archived:  { chip: "chip-muted",   label: "Archived" },
};

export function ProjectPageHeader({ project }: ProjectPageHeaderProps) {
  const statusMeta = STATUS_META[project.status] ?? { chip: "chip-muted", label: project.status };

  return (
    <div
      className="relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${project.logoColor}18 0%, var(--bg-surface) 60%)`,
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="px-6 pt-4 pb-0 flex flex-col gap-4">
        {/* Back link */}
        <Link
          href="/app/projects"
          className="inline-flex items-center gap-1.5 text-xs font-medium w-fit"
          style={{ color: "var(--text-muted)" }}
        >
          <ArrowLeft size={13} />
          Back to Projects
        </Link>

        {/* Hero row */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          {/* Left: avatar + info */}
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-lg font-bold flex-shrink-0 shadow-md"
              style={{ background: project.logoColor }}
            >
              {project.logoInitials}
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                  {project.name}
                </h1>
                <span
                  className="font-mono text-xs px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: "var(--bg-muted)", color: "var(--text-muted)" }}
                >
                  {project.ref}
                </span>
                <span className={cn("badge", statusMeta.chip)}>{statusMeta.label}</span>
              </div>
              <div
                className="flex items-center gap-4 flex-wrap text-sm"
                style={{ color: "var(--text-muted)" }}
              >
                <span className="flex items-center gap-1">
                  <Building2 size={13} />
                  {project.client}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar size={13} />
                  {formatDate(project.startDate)} &rarr; {formatDate(project.endDate)}
                </span>
                <span className="font-semibold text-base" style={{ color: "var(--text-primary)" }}>
                  {formatCurrency(project.contractValue)}
                </span>
                <span style={{ color: "var(--text-muted)", fontSize: 12 }}>{project.contractType}</span>
              </div>
            </div>
          </div>

          {/* Right: location card + actions */}
          <div className="flex flex-col items-end gap-3">
            {project.address && (
              <div
                className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl"
                style={{ background: "var(--bg-subtle)", color: "var(--text-muted)", border: "1px solid var(--border)" }}
              >
                <MapPin size={12} style={{ color: project.logoColor }} />
                {project.address}
              </div>
            )}
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <button className="btn btn-secondary btn-sm">
                <Upload size={13} />Upload Evidence
              </button>
              <button className="btn btn-secondary btn-sm">
                <Plus size={13} />New Change
              </button>
              <button className="btn btn-secondary btn-sm">
                <BarChart3 size={13} />Open CVR
              </button>
              <Link
                href={`/app/projects/${project.id}/edit`}
                className="btn btn-primary btn-sm"
              >
                <Pencil size={13} />Edit Project
              </Link>
              <button className="btn btn-ghost btn-icon btn-sm">
                <MoreHorizontal size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectPageHeader;

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { SEED_PROJECTS } from "@/lib/seed/projects";
import Link from "next/link";
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

// ── helpers ──────────────────────────────────────────────────────────────────

function formatCurrencyServer(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDateServer(str: string): string {
  try {
    const d = new Date(str);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return str;
  }
}

const STATUS_META: Record<string, { chip: string; label: string }> = {
  active:    { chip: "chip-success", label: "Active" },
  on_hold:   { chip: "chip-warning", label: "On Hold" },
  completed: { chip: "chip-info",    label: "Completed" },
  disputed:  { chip: "chip-danger",  label: "Disputed" },
  archived:  { chip: "chip-muted",   label: "Archived" },
};

const TABS = [
  { label: "Overview",         href: "" },
  { label: "Commercial",       href: "/commercial" },
  { label: "Evidence & Docs",  href: "/evidence" },
  { label: "Delivery",         href: "/delivery" },
  { label: "Governance",       href: "/governance" },
];

// ── layout ───────────────────────────────────────────────────────────────────

interface Props {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}

export default async function ProjectDetailLayout({ children, params }: Props) {
  const { projectId } = await params;

  // Try Supabase first
  let project: (typeof SEED_PROJECTS)[0] | null = null;
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch { /* server component */ }
          },
        },
      }
    );
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .single();
    if (data) {
      project = data as (typeof SEED_PROJECTS)[0];
    }
  } catch {
    // fallthrough to seed
  }

  if (!project) {
    project = SEED_PROJECTS.find((p) => p.id === projectId) ?? SEED_PROJECTS[0];
  }

  const statusMeta = STATUS_META[project.status] ?? { chip: "chip-muted", label: project.status };

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Hero Header ── */}
      <div
        style={{
          background: `linear-gradient(135deg, ${project.logoColor}18 0%, var(--bg-surface) 60%)`,
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="px-6 pt-4 pb-0 flex flex-col gap-4">
          {/* Back */}
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
            {/* Left */}
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
                  <span className={`badge ${statusMeta.chip}`}>{statusMeta.label}</span>
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
                    {formatDateServer(project.startDate)} &rarr; {formatDateServer(project.endDate)}
                  </span>
                  <span
                    className="font-semibold text-base"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {formatCurrencyServer(project.contractValue)}
                  </span>
                  <span style={{ fontSize: 12 }}>{project.contractType}</span>
                </div>
              </div>
            </div>

            {/* Right: location + actions */}
            <div className="flex flex-col items-end gap-3">
              {project.address && (
                <div
                  className="flex items-center gap-2 text-xs px-3 py-2 rounded-xl"
                  style={{
                    background: "var(--bg-subtle)",
                    color: "var(--text-muted)",
                    border: "1px solid var(--border)",
                  }}
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
                  <Plus size={13} />+ New Change
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

          {/* Tab navigation */}
          <div className="tab-bar mt-2 w-full overflow-x-auto">
            {TABS.map((t) => (
              <Link
                key={t.label}
                href={`/app/projects/${project.id}${t.href}`}
                className="tab-item flex-shrink-0"
              >
                {t.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Page content */}
      <div className="page-content flex-1">
        {children}
      </div>
    </div>
  );
}

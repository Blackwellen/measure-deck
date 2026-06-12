import { cn } from "@/lib/utils";

// ─── Base skeleton element ──────────────────────────────────────────────────

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

function Sk({ className, style }: SkeletonProps) {
  return <div className={cn("skeleton", className)} style={style} />;
}

// ─── SkeletonLine ───────────────────────────────────────────────────────────

export function SkeletonLine({ width = "100%", height = "14px" }: { width?: string; height?: string }) {
  return <Sk className="rounded" style={{ width, height }} />;
}

// ─── SkeletonCard ───────────────────────────────────────────────────────────

export function SkeletonCard({ height = "120px" }: { height?: string }) {
  return (
    <div className="rounded-xl border p-4 flex flex-col gap-3" style={{ borderColor: "var(--border)", height }}>
      <Sk className="rounded h-4 w-2/3" />
      <Sk className="rounded h-3 w-1/2" />
      <div className="mt-auto flex gap-2">
        <Sk className="rounded h-6 w-16" />
        <Sk className="rounded h-6 w-16" />
      </div>
    </div>
  );
}

// ─── SkeletonTable ──────────────────────────────────────────────────────────

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}>
        {Array.from({ length: cols }).map((_, i) => (
          <Sk key={i} className="rounded h-3 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 px-4 py-3.5 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Sk key={c} className="rounded h-3 flex-1" style={{ opacity: 1 - c * 0.15 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── SkeletonKpiGrid ────────────────────────────────────────────────────────

export function SkeletonKpiGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border p-4 flex flex-col gap-2" style={{ borderColor: "var(--border)" }}>
          <Sk className="rounded h-3 w-1/2" />
          <Sk className="rounded h-8 w-3/4 mt-1" />
          <Sk className="rounded h-3 w-1/3 mt-1" />
        </div>
      ))}
    </div>
  );
}

// ─── SkeletonPageHeader ─────────────────────────────────────────────────────

export function SkeletonPageHeader() {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex flex-col gap-2">
        <Sk className="rounded h-4 w-32" />
        <Sk className="rounded h-7 w-56" />
        <Sk className="rounded h-3 w-44 mt-1" />
      </div>
      <div className="flex gap-2">
        <Sk className="rounded h-9 w-24" />
        <Sk className="rounded h-9 w-32" />
      </div>
    </div>
  );
}

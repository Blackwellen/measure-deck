"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const SUB_TABS = [
  { label: "Evidence", suffix: "" },
  { label: "Drawings & BIM", suffix: "/drawings" },
  { label: "Reports", suffix: "/reports" },
] as const;

export default function EvidenceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const projectId = params.projectId as string;
  const pathname = usePathname();
  const base = `/projects/${projectId}/evidence`;

  return (
    <div className="flex flex-col gap-0">
      {/* Sub-tab navigation */}
      <div
        className="flex items-center gap-0 border-b mb-5"
        style={{ borderColor: "var(--border)" }}
        role="tablist"
      >
        {SUB_TABS.map((tab) => {
          const href = `${base}${tab.suffix}`;
          // exact match for root evidence tab, prefix match for sub-routes
          const isActive =
            tab.suffix === ""
              ? pathname === base || pathname === `${base}/`
              : pathname.startsWith(href);
          return (
            <Link
              key={tab.suffix}
              href={href}
              role="tab"
              aria-selected={isActive}
              className={cn(
                "px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap",
                isActive
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border)]"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {children}
    </div>
  );
}

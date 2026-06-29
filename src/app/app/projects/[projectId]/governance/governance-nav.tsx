"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface GovernanceNavProps {
  projectId: string;
}

export default function GovernanceNav({ projectId }: GovernanceNavProps) {
  const pathname = usePathname();

  const tabs = [
    { label: "Activity", href: `/projects/${projectId}/governance` },
    { label: "Audit Log", href: `/projects/${projectId}/governance/audit` },
    { label: "Settings", href: `/projects/${projectId}/governance/settings` },
  ];

  return (
    <div
      className="flex gap-0 border-b"
      style={{ borderColor: "var(--border)" }}
      role="tablist"
    >
      {tabs.map((tab) => {
        const isActive =
          tab.href === `/projects/${projectId}/governance`
            ? pathname === tab.href || pathname === tab.href + "/"
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            role="tab"
            aria-selected={isActive}
            className={cn(
              "px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap"
            )}
            style={{
              color: isActive ? "var(--primary)" : "var(--text-secondary)",
              borderBottom: isActive
                ? "2px solid var(--primary)"
                : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

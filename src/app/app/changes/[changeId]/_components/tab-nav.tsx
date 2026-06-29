"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface TabDef {
  readonly label: string;
  readonly href: string;
}

export function ChangeTabNav({
  tabs,
  changeId,
}: {
  tabs: readonly TabDef[];
  changeId: string;
}) {
  const pathname = usePathname();

  return (
    <div
      className="flex items-center gap-0 overflow-x-auto mt-1"
      style={{ scrollbarWidth: "none" }}
    >
      {tabs.map(({ label, href: suffix }) => {
        const fullHref = `/changes/${changeId}${suffix}`;
        // Match: overview tab = exact /changes/[id], others = starts with suffix
        const isActive =
          suffix === ""
            ? pathname === `/changes/${changeId}` || pathname === `/changes/${changeId}/`
            : pathname.startsWith(`/changes/${changeId}${suffix}`);

        return (
          <Link
            key={label}
            href={fullHref}
            className="flex-shrink-0 px-4 py-3 text-xs font-medium transition-all border-b-2 whitespace-nowrap"
            style={{
              color: isActive ? "#fff" : "#94A3B8",
              borderBottomColor: isActive ? "#fff" : "transparent",
              background: "transparent",
            }}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}

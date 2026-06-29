import { ReactNode } from "react";
import Link from "next/link";
import { headers } from "next/headers";

const COMMERCIAL_TABS = [
  { label: "Contract",       href: "contract" },
  { label: "Changes",        href: "changes" },
  { label: "Applications",   href: "applications" },
  { label: "CVR",            href: "cvr" },
  { label: "Final Accounts", href: "final-accounts" },
];

export default async function CommercialLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const headersList = await headers();
  const pathname =
    headersList.get("x-pathname") ??
    headersList.get("x-invoke-path") ??
    headersList.get("x-url") ??
    "";

  return (
    <div className="flex flex-col gap-0">
      <div
        className="flex gap-0 border-b overflow-x-auto"
        style={{ borderColor: "var(--border)" }}
      >
        {COMMERCIAL_TABS.map((tab) => {
          const href = `/app/projects/${projectId}/commercial/${tab.href}`;
          const isActive = pathname.includes(`/commercial/${tab.href}`);
          return (
            <Link
              key={tab.href}
              href={href}
              className="flex-shrink-0 px-5 py-3 text-sm font-medium transition-colors"
              style={{
                color: isActive ? "var(--primary)" : "var(--text-muted)",
                borderBottom: isActive
                  ? "2px solid var(--primary)"
                  : "2px solid transparent",
                marginBottom: "-1px",
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
      <div className="pt-4">{children}</div>
    </div>
  );
}

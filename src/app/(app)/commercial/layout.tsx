import Link from "next/link";

const TABS = [
  { label: "Overview",        href: "/app/commercial" },
  { label: "Changes",         href: "/app/commercial/changes" },
  { label: "Applications",    href: "/app/commercial/applications" },
  { label: "CVR",             href: "/app/commercial/cvr" },
  { label: "Final Accounts",  href: "/app/commercial/final-accounts" },
  { label: "Risk",            href: "/app/commercial/risk" },
  { label: "Reports",         href: "/app/commercial/reports" },
];

interface Props {
  children: React.ReactNode;
}

export default function CommercialLayout({ children }: Props) {
  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="page-header pb-0">
        <div className="flex flex-col gap-1 mb-4">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            Commercial
          </h1>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Portfolio-wide cost, value and recovery insight across all projects.
          </p>
        </div>

        {/* Tab navigation */}
        <div className="tab-bar w-full overflow-x-auto">
          {TABS.map((t) => (
            <Link key={t.href} href={t.href} className="tab-item flex-shrink-0">
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Page content */}
      <div className="page-content flex-1">
        {children}
      </div>
    </div>
  );
}

import Link from "next/link";
import { headers } from "next/headers";

interface DeliveryLayoutProps {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}

const TABS = [
  { label: "Schedule", href: "" },
  { label: "Suppliers", href: "/suppliers" },
  { label: "Tasks",    href: "/tasks" },
  { label: "Site Map", href: "/site-map" },
] as const;

export default async function DeliveryLayout({ children, params }: DeliveryLayoutProps) {
  const { projectId } = await params;
  const base = `/projects/${projectId}/delivery`;

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";

  return (
    <div className="flex flex-col gap-0">
      {/* Sub-tab navigation */}
      <div
        className="flex items-center gap-0 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        {TABS.map((tab) => {
          const href = `${base}${tab.href}`;
          // Active state: exact match for schedule (empty suffix), prefix match for others
          const isActive =
            tab.href === ""
              ? pathname === base || pathname === `${base}/`
              : pathname.startsWith(href);

          return (
            <Link
              key={tab.label}
              href={href}
              className="relative px-5 py-3 text-[13px] font-500 transition-colors"
              style={{
                color: isActive ? "var(--primary)" : "var(--text-secondary)",
                borderBottom: isActive ? "2px solid var(--primary)" : "2px solid transparent",
                marginBottom: "-1px",
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Page content */}
      <div className="flex flex-col gap-6 pt-6">
        {children}
      </div>
    </div>
  );
}

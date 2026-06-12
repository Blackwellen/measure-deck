"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  ShieldCheck,
  CreditCard,
  Package,
  Flag,
  BoxSelect,
  Sparkles,
  MessageSquare,
  Database,
  FolderOpen,
  Contact,
  FolderKanban,
  Receipt,
  CheckSquare,
  Layers,
  PieChart,
  Scale,
  ClipboardList,
  Lock,
  Plug,
  Activity,
  Rocket,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

interface AdminSidebarProps {
  collapsed: boolean;
  onCollapsedChange: (val: boolean) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Nav definitions — 25 items                                         */
/* ------------------------------------------------------------------ */

const adminNav: NavItem[] = [
  { label: "Dashboard",            href: "/admin",                icon: LayoutDashboard },
  { label: "Users",                href: "/admin/users",          icon: Users           },
  { label: "Workspaces",           href: "/admin/workspaces",     icon: Building2       },
  { label: "Roles & Permissions",  href: "/admin/roles",          icon: ShieldCheck     },
  { label: "Subscriptions",        href: "/admin/subscriptions",  icon: CreditCard      },
  { label: "Plans & Add-ons",      href: "/admin/plans",          icon: Package         },
  { label: "Feature Flags",        href: "/admin/feature-flags",  icon: Flag            },
  { label: "Module Releases",      href: "/admin/modules",        icon: BoxSelect       },
  { label: "AI Usage",             href: "/admin/ai-usage",       icon: Sparkles        },
  { label: "Inbox / Support",      href: "/admin/inbox",          icon: MessageSquare   },
  { label: "Data & Storage",       href: "/admin/storage",        icon: Database        },
  { label: "Files / Uploads",      href: "/admin/files",          icon: FolderOpen      },
  { label: "Suppliers & Contacts", href: "/admin/suppliers",      icon: Contact         },
  { label: "Projects",             href: "/admin/projects",       icon: FolderKanban    },
  { label: "Commercial Records",   href: "/admin/commercial",     icon: Receipt         },
  { label: "Tasks & Schedule",     href: "/admin/tasks",          icon: CheckSquare     },
  { label: "Drawings / BIM",       href: "/admin/drawings",       icon: Layers          },
  { label: "Reports",              href: "/admin/reports",        icon: PieChart        },
  { label: "Legal Pages",          href: "/admin/legal",          icon: Scale           },
  { label: "Audit Logs",           href: "/admin/audit",          icon: ClipboardList   },
  { label: "Security",             href: "/admin/security",       icon: Lock            },
  { label: "Integrations",         href: "/admin/integrations",   icon: Plug            },
  { label: "System Health",        href: "/admin/health",         icon: Activity        },
  { label: "Release Readiness",    href: "/admin/release",        icon: Rocket          },
  { label: "Platform Settings",    href: "/admin/settings",       icon: Settings        },
];

/* ------------------------------------------------------------------ */
/*  Tooltip                                                             */
/* ------------------------------------------------------------------ */

function NavTooltip({
  label,
  collapsed,
}: {
  label: string;
  collapsed: boolean;
}) {
  if (!collapsed) return null;
  return (
    <span
      className={cn(
        "absolute left-full ml-2 px-2 py-1 rounded-md text-xs font-medium",
        "bg-gray-900 text-white whitespace-nowrap opacity-0 pointer-events-none",
        "group-hover:opacity-100 transition-opacity duration-150 z-50"
      )}
    >
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Single nav item                                                     */
/* ------------------------------------------------------------------ */

function AdminNavItem({
  item,
  pathname,
  collapsed,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
}) {
  const isActive =
    item.href === "/admin"
      ? pathname === "/admin"
      : pathname.startsWith(item.href);

  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className={cn("nav-item group relative", isActive && "active")}
      title={collapsed ? item.label : undefined}
    >
      <Icon size={18} className="nav-icon flex-shrink-0" />
      {!collapsed && (
        <span className="truncate">{item.label}</span>
      )}
      <NavTooltip label={item.label} collapsed={collapsed} />
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Admin sidebar component                                            */
/* ------------------------------------------------------------------ */

export function AdminSidebar({
  collapsed,
  onCollapsedChange,
  mobileOpen,
  onMobileClose,
}: AdminSidebarProps) {
  const pathname = usePathname();

  /* Persist collapse state */
  useEffect(() => {
    localStorage.setItem("admin-sidebar-collapsed", String(collapsed));
    window.dispatchEvent(
      new CustomEvent("admin-sidebar-collapsed-change", { detail: { collapsed } })
    );
  }, [collapsed]);

  /* Close mobile on nav */
  useEffect(() => {
    if (mobileOpen && onMobileClose) {
      onMobileClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "sidebar-fixed flex flex-col",
          collapsed && "collapsed",
          mobileOpen && "mobile-open"
        )}
        style={{ background: "var(--sidebar-bg)" }}
        aria-label="Admin navigation"
      >
        {/* ── Logo + ADMIN badge ───────────────────────────────── */}
        <div
          className={cn(
            "flex items-center h-14 px-3 flex-shrink-0 gap-2",
            "border-b border-white/[0.07]"
          )}
        >
          <Link
            href="/admin"
            className="flex items-center gap-2 min-w-0 flex-1"
            aria-label="Admin home"
          >
            <div className="flex-shrink-0 relative w-8 h-8">
              <Image
                src="/measuredeck-logo-DB_Uf-KZ.png"
                alt="MeasureDeck"
                fill
                className="object-contain"
                priority
              />
            </div>
            {!collapsed && (
              <span className="text-white font-semibold text-[15px] tracking-tight truncate">
                MeasureDeck
              </span>
            )}
          </Link>

          {!collapsed && (
            <span
              className={cn(
                "badge flex-shrink-0 text-[10px] font-bold tracking-wider",
                "bg-red-500/20 text-red-400 border border-red-500/30"
              )}
            >
              ADMIN
            </span>
          )}
        </div>

        {/* ── Nav ──────────────────────────────────────────────── */}
        <nav
          className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5"
          aria-label="Admin navigation"
        >
          {adminNav.map((item) => (
            <AdminNavItem
              key={item.href}
              item={item}
              pathname={pathname}
              collapsed={collapsed}
            />
          ))}
        </nav>

        {/* ── Collapse toggle ───────────────────────────────────── */}
        <div
          className="px-2 pb-3 pt-2 flex-shrink-0 border-t"
          style={{ borderColor: "var(--sidebar-border)" }}
        >
          <button
            type="button"
            onClick={() => onCollapsedChange(!collapsed)}
            className={cn(
              "nav-item w-full justify-center mt-1",
              collapsed && "px-0"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight size={16} className="flex-shrink-0" />
            ) : (
              <>
                <ChevronLeft size={16} className="flex-shrink-0" />
                <span className="text-xs">Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

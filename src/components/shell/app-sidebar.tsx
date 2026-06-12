"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  House,
  FolderKanban,
  GitBranch,
  FileText,
  BarChart3,
  ClipboardList,
  Camera,
  PieChart,
  Users,
  CheckSquare,
  Calendar,
  Layers,
  HelpCircle,
  MessageSquare,
  Settings,
  User,
  CreditCard,
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

interface AppSidebarProps {
  collapsed: boolean;
  onCollapsedChange: (val: boolean) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

/* ------------------------------------------------------------------ */
/*  Nav definitions                                                     */
/* ------------------------------------------------------------------ */

const mainNav: NavItem[] = [
  { label: "Home",               href: "/app/home",           icon: House         },
  { label: "Projects",           href: "/app/projects",       icon: FolderKanban  },
  { label: "Changes",            href: "/app/changes",        icon: GitBranch     },
  { label: "Applications",       href: "/app/applications",   icon: FileText      },
  { label: "CVR",                href: "/app/cvr",            icon: BarChart3     },
  { label: "Final Accounts",     href: "/app/final-accounts", icon: ClipboardList },
  { label: "Evidence",           href: "/app/evidence",       icon: Camera        },
  { label: "Reports",            href: "/app/reports",        icon: PieChart      },
  { label: "Suppliers & Contacts", href: "/app/suppliers",    icon: Users         },
  { label: "Tasks",              href: "/app/tasks",          icon: CheckSquare   },
  { label: "Schedule",           href: "/app/schedule",       icon: Calendar      },
  { label: "Drawings / BIM",     href: "/app/drawings",       icon: Layers        },
];

const bottomNav: NavItem[] = [
  { label: "Help",                href: "/app/help",      icon: HelpCircle   },
  { label: "Inbox",               href: "/app/inbox",     icon: MessageSquare },
  { label: "Workspace Settings",  href: "/app/settings",  icon: Settings     },
  { label: "Account",             href: "/app/account",   icon: User         },
  { label: "Billing",             href: "/app/billing",   icon: CreditCard   },
];

/* ------------------------------------------------------------------ */
/*  Tooltip (shown in collapsed mode)                                  */
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
/*  Single nav item row                                                 */
/* ------------------------------------------------------------------ */

function SidebarNavItem({
  item,
  pathname,
  collapsed,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
}) {
  const isActive =
    item.href === "/app/home"
      ? pathname === item.href
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
/*  Sidebar component                                                   */
/* ------------------------------------------------------------------ */

export function AppSidebar({
  collapsed,
  onCollapsedChange,
  mobileOpen,
  onMobileClose,
}: AppSidebarProps) {
  const pathname = usePathname();
  const overlayRef = useRef<HTMLDivElement>(null);

  /* Persist collapse state */
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
    window.dispatchEvent(
      new CustomEvent("sidebar-collapsed-change", { detail: { collapsed } })
    );
  }, [collapsed]);

  /* Close mobile sidebar on navigation */
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
          ref={overlayRef}
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
        aria-label="Main navigation"
      >
        {/* ── Logo ────────────────────────────────────────────── */}
        <div
          className={cn(
            "flex items-center h-14 px-3 flex-shrink-0",
            "border-b border-white/[0.07]"
          )}
        >
          <Link
            href="/app/home"
            className="flex items-center gap-2 min-w-0"
            aria-label="MeasureDeck home"
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
              <span
                className="text-white font-semibold text-[15px] tracking-tight truncate"
              >
                MeasureDeck
              </span>
            )}
          </Link>
        </div>

        {/* ── Main nav ─────────────────────────────────────────── */}
        <nav
          className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5"
          aria-label="Primary navigation"
        >
          {mainNav.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              pathname={pathname}
              collapsed={collapsed}
            />
          ))}
        </nav>

        {/* ── Divider ──────────────────────────────────────────── */}
        <div
          className="mx-3 border-t"
          style={{ borderColor: "var(--sidebar-border)" }}
        />

        {/* ── Bottom nav ───────────────────────────────────────── */}
        <nav
          className="py-3 px-2 space-y-0.5 flex-shrink-0"
          aria-label="Secondary navigation"
        >
          {bottomNav.map((item) => (
            <SidebarNavItem
              key={item.href}
              item={item}
              pathname={pathname}
              collapsed={collapsed}
            />
          ))}
        </nav>

        {/* ── Collapse toggle ──────────────────────────────────── */}
        <div
          className="px-2 pb-3 flex-shrink-0 border-t"
          style={{ borderColor: "var(--sidebar-border)" }}
        >
          <button
            type="button"
            onClick={() => onCollapsedChange(!collapsed)}
            className={cn(
              "nav-item w-full justify-center mt-2",
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

"use client";

import { useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  House, FolderKanban, GitBranch, FileText, BarChart3,
  ClipboardList, Camera, PieChart, Users, CheckSquare,
  Calendar, Layers, HelpCircle, MessageSquare, Settings,
  User, CreditCard, ChevronLeft, ChevronRight, LogOut,
  Building2, Sparkles, Bell, AlertTriangle, Scale, Wrench,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { getFlag } from "@/lib/feature-flags";

/* ─── Types ─────────────────────────────────────────────────────────── */

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: number;
  onClick?: () => void;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

export interface AppSidebarProps {
  collapsed: boolean;
  onCollapsedChange: (val: boolean) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  user?: {
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
  } | null;
  unreadCount?: number;
  onAIOpen?: () => void;
}

/* ─── Nav groups ─────────────────────────────────────────────────────── */

const CORE_NAV_GROUPS: NavGroup[] = [
  {
    label: "Commercial",
    items: [
      { label: "Home",             href: "/app/home",           icon: House         },
      { label: "Projects",         href: "/app/projects",       icon: FolderKanban  },
      { label: "Changes",          href: "/app/changes",        icon: GitBranch     },
      { label: "Applications",     href: "/app/applications",   icon: FileText      },
      { label: "CVR",              href: "/app/cvr",            icon: BarChart3     },
      { label: "Final Accounts",   href: "/app/final-accounts", icon: ClipboardList },
    ],
  },
  {
    label: "Evidence & Risk",
    items: [
      { label: "Evidence",             href: "/app/evidence",  icon: Camera  },
      { label: "Reports",              href: "/app/reports",   icon: PieChart },
      { label: "Suppliers & Contacts", href: "/app/suppliers", icon: Users   },
    ],
  },
  {
    label: "Execution",
    items: [
      { label: "Tasks",          href: "/app/tasks",     icon: CheckSquare },
      { label: "Schedule",       href: "/app/schedule",  icon: Calendar    },
      { label: "Drawings / BIM", href: "/app/drawings",  icon: Layers      },
    ],
  },
];

function buildV2NavGroup(): NavGroup | null {
  const items: NavItem[] = [];

  if (getFlag("mobile_dayworks")) {
    items.push({ label: "Dayworks", href: "/app/dayworks", icon: Wrench });
  }

  if (getFlag("programme_notifications")) {
    items.push({ label: "Early Warnings", href: "/app/early-warnings", icon: AlertTriangle });
    items.push({ label: "Programmes",     href: "/app/programmes",     icon: Calendar     });
  }
  if (getFlag("subcontract_orders")) {
    items.push({ label: "Subcontracts", href: "/app/subcontracts", icon: FileText });
  }
  if (getFlag("cis_compliance")) {
    items.push({ label: "CIS Compliance", href: "/app/cis", icon: Building2 });
  }
  if (getFlag("cross_project_analytics")) {
    items.push({ label: "Analytics", href: "/app/analytics", icon: BarChart3 });
  }
  if (getFlag("adjudication_module")) {
    items.push({ label: "Adjudication", href: "/app/adjudication", icon: Scale });
  }

  if (items.length === 0) return null;
  return { label: "Enterprise", items };
}

/* ─── Tooltip ────────────────────────────────────────────────────────── */

function NavTooltip({ label, collapsed }: { label: string; collapsed: boolean }) {
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

/* ─── Nav item ───────────────────────────────────────────────────────── */

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
      : item.href !== "#" && pathname.startsWith(item.href);

  const Icon = item.icon;

  const inner = (
    <>
      <Icon size={18} className="nav-icon flex-shrink-0" />
      {!collapsed && <span className="truncate flex-1">{item.label}</span>}
      {(item.badge ?? 0) > 0 && (
        <span
          className={cn(
            "min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold leading-none",
            "flex items-center justify-center text-white flex-shrink-0",
            collapsed && "absolute top-0.5 right-0.5 min-w-[14px] h-[14px]"
          )}
          style={{ background: "var(--danger)" }}
        >
          {(item.badge ?? 0) > 99 ? "99+" : item.badge}
        </span>
      )}
      <NavTooltip label={item.label} collapsed={collapsed} />
    </>
  );

  if (item.onClick) {
    return (
      <button
        type="button"
        onClick={item.onClick}
        className={cn("nav-item group relative w-full", isActive && "active")}
        title={collapsed ? item.label : undefined}
      >
        {inner}
      </button>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn("nav-item group relative", isActive && "active")}
      title={collapsed ? item.label : undefined}
    >
      {inner}
    </Link>
  );
}

/* ─── Group label ────────────────────────────────────────────────────── */

function GroupLabel({ label, collapsed }: { label: string; collapsed: boolean }) {
  if (collapsed) {
    return (
      <div className="mx-2 my-2 border-t" style={{ borderColor: "var(--sidebar-border)" }} />
    );
  }
  return (
    <p
      className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase truncate"
      style={{ color: "rgba(148,163,184,0.45)", letterSpacing: "0.1em" }}
    >
      {label}
    </p>
  );
}

/* ─── Avatar ─────────────────────────────────────────────────────────── */

const AVATAR_COLOURS = ["#3B5EE8", "#8B5CF6", "#06B6D4", "#10B981", "#F59E0B"];

function avatarColour(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLOURS[Math.abs(h) % AVATAR_COLOURS.length];
}

function UserAvatar({ name, avatarUrl, size = 28 }: {
  name?: string | null;
  avatarUrl?: string | null;
  size?: number;
}) {
  const initials = getInitials(name ?? "U");
  const bg = avatarColour(name ?? "U");

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name ?? "User"}
        style={{ width: size, height: size }}
        className="rounded-full object-cover flex-shrink-0"
      />
    );
  }

  return (
    <span
      className="rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 select-none"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}

/* ─── User panel ─────────────────────────────────────────────────────── */

function UserPanel({
  user,
  collapsed,
  onSignOut,
}: {
  user: AppSidebarProps["user"];
  collapsed: boolean;
  onSignOut: () => void;
}) {
  const name = user?.name ?? "User";
  const email = user?.email ?? "";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            "w-full flex items-center gap-2.5 px-2 py-2 rounded-xl transition-colors",
            "hover:bg-white/[0.06] outline-none focus-visible:ring-1 focus-visible:ring-white/20",
            collapsed && "justify-center px-1"
          )}
          aria-label="User menu"
        >
          <UserAvatar name={name} avatarUrl={user?.avatarUrl} size={28} />
          {!collapsed && (
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[12.5px] font-semibold truncate" style={{ color: "var(--sidebar-text-active)" }}>
                {name}
              </p>
              {email && (
                <p className="text-[11px] truncate" style={{ color: "var(--sidebar-text)" }}>
                  {email}
                </p>
              )}
            </div>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="right"
          align="end"
          sideOffset={8}
          className={cn(
            "z-[60] min-w-[220px] rounded-xl p-1.5",
            "bg-white border border-[var(--border)]",
            "shadow-[0_8px_32px_rgba(0,0,0,0.16)]",
            "animate-in fade-in-0 zoom-in-95"
          )}
        >
          <div className="px-3 py-2.5 mb-1">
            <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{name}</p>
            {email && <p className="text-[12px] text-[var(--text-muted)] truncate">{email}</p>}
          </div>
          <DropdownMenu.Separator className="h-px bg-[var(--border)] mx-1 mb-1" />
          <UMItem href="/app/account"             icon={User}       label="My Account" />
          <UMItem href="/app/workspace/settings"  icon={Building2}  label="Workspace" />
          <UMItem href="/app/settings"            icon={Settings}   label="Settings" />
          <UMItem href="/app/billing"             icon={CreditCard} label="Billing" />
          <DropdownMenu.Separator className="h-px bg-[var(--border)] mx-1 my-1" />
          <DropdownMenu.Item
            onSelect={onSignOut}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium",
              "text-[var(--danger)] cursor-pointer outline-none",
              "hover:bg-[var(--danger-bg)] transition-colors"
            )}
          >
            <LogOut size={14} />
            Sign Out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function UMItem({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
}) {
  return (
    <DropdownMenu.Item asChild>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium",
          "text-[var(--text-secondary)] cursor-pointer outline-none",
          "hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)] transition-colors"
        )}
      >
        <Icon size={14} />
        {label}
      </Link>
    </DropdownMenu.Item>
  );
}

/* ─── Sidebar ────────────────────────────────────────────────────────── */

export function AppSidebar({
  collapsed,
  onCollapsedChange,
  mobileOpen,
  onMobileClose,
  user,
  unreadCount = 0,
  onAIOpen,
}: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);

  /* Keyboard: Ctrl+\ to toggle sidebar */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "\\") {
        e.preventDefault();
        onCollapsedChange(!collapsed);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [collapsed, onCollapsedChange]);

  /* Persist */
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
    window.dispatchEvent(new CustomEvent("sidebar-collapsed-change", { detail: { collapsed } }));
  }, [collapsed]);

  /* Close mobile on nav */
  useEffect(() => {
    if (mobileOpen && onMobileClose) onMobileClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const handleSignOut = useCallback(async () => {
    const { createClient: cc } = await import("@/lib/supabase/client");
    const supabase = cc();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }, [router]);

  const bottomItems: NavItem[] = [
    {
      label: "AI Copilot",
      href: "#",
      icon: Sparkles,
      onClick: onAIOpen ?? (() => window.dispatchEvent(new CustomEvent("ai-bubble-open"))),
    },
    { label: "Inbox",         href: "/app/inbox",         icon: MessageSquare, badge: unreadCount },
    { label: "Notifications", href: "/app/notifications", icon: Bell },
    { label: "Help",          href: "/app/help",          icon: HelpCircle },
  ];

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

      <aside
        className={cn(
          "sidebar-fixed flex flex-col",
          collapsed && "collapsed",
          mobileOpen && "mobile-open"
        )}
        style={{ background: "var(--sidebar-bg)" }}
        aria-label="Main navigation"
      >
        {/* Logo + workspace */}
        <div
          className="flex flex-col px-3 pt-3 pb-2 flex-shrink-0 border-b"
          style={{ borderColor: "var(--sidebar-border)" }}
        >
          <Link href="/app/home" className={cn("flex items-center min-w-0", collapsed && "justify-center")} aria-label="MeasureDeck home">
            {collapsed ? (
              <div className="relative w-8 h-8 flex-shrink-0">
                <Image src="/measuredeck favicon.png" alt="MeasureDeck" fill className="object-contain" priority />
              </div>
            ) : (
              <div className="relative h-8 w-36 flex-shrink-0">
                <Image src="/measuredeck-logo-DB_Uf-KZ.png" alt="MeasureDeck" fill className="object-contain object-left" priority />
              </div>
            )}
          </Link>

          {!collapsed && (
            <div className="flex items-center gap-1.5 mt-2 px-1">
              <Building2 size={11} style={{ color: "rgba(148,163,184,0.4)" }} />
              <span className="text-[10.5px] truncate" style={{ color: "rgba(148,163,184,0.4)" }}>
                MeasureDeck Workspace
              </span>
            </div>
          )}
        </div>

        {/* Main nav */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden py-1 px-2 space-y-0" aria-label="Primary navigation">
          {[...CORE_NAV_GROUPS, ...(buildV2NavGroup() ? [buildV2NavGroup()!] : [])].map((group, gi) => (
            <div key={gi} className="mb-0.5">
              {group.label && <GroupLabel label={group.label} collapsed={collapsed} />}
              {group.items.map((item) => (
                <SidebarNavItem key={item.href} item={item} pathname={pathname} collapsed={collapsed} />
              ))}
            </div>
          ))}
        </nav>

        {/* Divider */}
        <div className="mx-2" style={{ borderTop: "1px solid var(--sidebar-border)" }} />

        {/* Bottom quick-access nav */}
        <nav className="py-2 px-2 space-y-0.5 flex-shrink-0" aria-label="Tools">
          {bottomItems.map((item) => (
            <SidebarNavItem key={item.label} item={item} pathname={pathname} collapsed={collapsed} />
          ))}
        </nav>

        {/* User panel */}
        <div className="px-2 pb-2 pt-2 flex-shrink-0" style={{ borderTop: "1px solid var(--sidebar-border)" }}>
          <UserPanel user={user} collapsed={collapsed} onSignOut={handleSignOut} />
        </div>

        {/* Collapse toggle */}
        <div className="px-2 pb-3 flex-shrink-0" style={{ borderTop: "1px solid var(--sidebar-border)" }}>
          <button
            type="button"
            onClick={() => onCollapsedChange(!collapsed)}
            className={cn("nav-item w-full justify-center mt-2 text-[12px]", collapsed && "px-0")}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={`${collapsed ? "Expand" : "Collapse"} sidebar (Ctrl+\\)`}
          >
            {collapsed ? (
              <ChevronRight size={15} />
            ) : (
              <>
                <ChevronLeft size={15} />
                <span>Collapse</span>
                <kbd
                  className="ml-auto text-[9px] px-1 py-0.5 rounded"
                  style={{ background: "rgba(255,255,255,0.08)", color: "rgba(148,163,184,0.5)", fontFamily: "monospace" }}
                >
                  ⌘\
                </kbd>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}

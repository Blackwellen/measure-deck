"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Menu,
  Search,
  Bell,
  ChevronRight,
  User,
  Settings,
  CreditCard,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

export interface Breadcrumb {
  label: string;
  href?: string;
}

interface TopBarProps {
  title?: string;
  breadcrumbs?: Breadcrumb[];
  collapsed?: boolean;
  onMobileMenuOpen?: () => void;
  /** Optional user data; falls back to placeholder */
  user?: {
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
  } | null;
}

/* ------------------------------------------------------------------ */
/*  Avatar component                                                    */
/* ------------------------------------------------------------------ */

const AVATAR_COLOURS = [
  "#3B5EE8", "#8B5CF6", "#06B6D4", "#10B981",
  "#F59E0B", "#EF4444", "#EC4899",
];

function getAvatarColour(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLOURS[Math.abs(hash) % AVATAR_COLOURS.length];
}

function UserAvatar({
  name,
  avatarUrl,
  size = 32,
}: {
  name?: string | null;
  avatarUrl?: string | null;
  size?: number;
}) {
  const initials = getInitials(name ?? "User");
  const bg = getAvatarColour(name ?? "User");

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={name ?? "User"}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <span
      className="rounded-full flex items-center justify-center font-semibold text-white select-none"
      style={{
        width: size,
        height: size,
        background: bg,
        fontSize: size * 0.38,
      }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  TopBar component                                                    */
/* ------------------------------------------------------------------ */

export function TopBar({
  title,
  breadcrumbs,
  collapsed,
  onMobileMenuOpen,
  user,
}: TopBarProps) {
  const router = useRouter();

  const displayName = user?.name ?? "User";
  const displayEmail = user?.email ?? "";

  async function handleSignOut() {
    // Dynamic import to avoid bundling server code
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header
      className={cn("topbar-fixed flex items-center px-4 gap-3", collapsed && "collapsed")}
      style={{
        background: "var(--bg-surface)",
        borderBottom: "1px solid var(--border)",
      }}
    >
      {/* ── Left: hamburger + breadcrumbs / title ─────────────── */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Hamburger — mobile only */}
        <button
          type="button"
          onClick={onMobileMenuOpen}
          className="btn btn-ghost btn-icon md:hidden flex-shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-1 min-w-0 overflow-hidden"
          >
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <span key={idx} className="flex items-center gap-1 min-w-0">
                  {idx > 0 && (
                    <ChevronRight
                      size={13}
                      className="flex-shrink-0"
                      style={{ color: "var(--text-muted)" }}
                    />
                  )}
                  {!isLast && crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="text-sm truncate"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span
                      className={cn(
                        "text-sm font-semibold truncate",
                        isLast
                          ? "text-[var(--text-primary)]"
                          : "text-[var(--text-muted)]"
                      )}
                    >
                      {crumb.label}
                    </span>
                  )}
                </span>
              );
            })}
          </nav>
        ) : title ? (
          <h1
            className="text-[15px] font-semibold truncate"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
          </h1>
        ) : null}
      </div>

      {/* ── Right: search + bell + avatar ─────────────────────── */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Global search */}
        <button
          type="button"
          className="btn btn-ghost btn-icon"
          aria-label="Search"
        >
          <Search size={18} style={{ color: "var(--text-secondary)" }} />
        </button>

        {/* Notifications bell */}
        <NotificationBell count={0} />

        {/* User avatar dropdown */}
        <UserMenu
          displayName={displayName}
          displayEmail={displayEmail}
          avatarUrl={user?.avatarUrl}
          onSignOut={handleSignOut}
        />
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/*  Notification bell                                                   */
/* ------------------------------------------------------------------ */

function NotificationBell({ count }: { count: number }) {
  return (
    <button
      type="button"
      className="btn btn-ghost btn-icon relative"
      aria-label={
        count > 0 ? `${count} unread notifications` : "Notifications"
      }
    >
      <Bell size={18} style={{ color: "var(--text-secondary)" }} />
      {count > 0 && (
        <span
          className={cn(
            "absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1",
            "rounded-full text-[10px] font-bold leading-4 text-white text-center",
            "bg-[var(--danger)]"
          )}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  User dropdown                                                       */
/* ------------------------------------------------------------------ */

function UserMenu({
  displayName,
  displayEmail,
  avatarUrl,
  onSignOut,
}: {
  displayName: string;
  displayEmail: string;
  avatarUrl?: string | null;
  onSignOut: () => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="flex items-center gap-2 px-1.5 py-1 rounded-lg hover:bg-[var(--bg-muted)] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
          aria-label="User menu"
        >
          <UserAvatar name={displayName} avatarUrl={avatarUrl} size={30} />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className={cn(
            "z-50 min-w-[220px] rounded-xl p-1",
            "bg-white border border-[var(--border)]",
            "shadow-[0_8px_32px_rgba(0,0,0,0.12)]",
            "animate-in fade-in-0 zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2",
            "data-[side=top]:slide-in-from-bottom-2"
          )}
        >
          {/* User info header */}
          <div className="px-3 py-2.5 mb-1">
            <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">
              {displayName}
            </p>
            {displayEmail && (
              <p className="text-[12px] text-[var(--text-muted)] truncate">
                {displayEmail}
              </p>
            )}
          </div>

          <DropdownMenu.Separator className="h-px bg-[var(--border)] mx-1 mb-1" />

          <DropdownMenuLink href="/app/account" icon={User} label="Account" />
          <DropdownMenuLink href="/app/settings" icon={Settings} label="Workspace Settings" />
          <DropdownMenuLink href="/app/billing" icon={CreditCard} label="Billing" />

          <DropdownMenu.Separator className="h-px bg-[var(--border)] mx-1 my-1" />

          <DropdownMenu.Item
            onSelect={onSignOut}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium",
              "text-[var(--danger)] cursor-pointer outline-none",
              "hover:bg-[var(--danger-bg)] transition-colors"
            )}
          >
            <LogOut size={15} />
            Sign Out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/* ------------------------------------------------------------------ */
/*  Dropdown link helper                                               */
/* ------------------------------------------------------------------ */

function DropdownMenuLink({
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
        <Icon size={15} />
        {label}
      </Link>
    </DropdownMenu.Item>
  );
}

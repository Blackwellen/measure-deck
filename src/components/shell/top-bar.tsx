"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Menu, Search, Bell, ChevronRight, User, Settings,
  CreditCard, LogOut, Sparkles, Command, X,
  FolderKanban, GitBranch, FileText, BarChart3, ClipboardList,
  Camera, PieChart, Users, CheckSquare, Calendar, Layers,
  House, AlertTriangle, Info, CheckCircle2, Clock, ExternalLink,
  CheckCheck,
} from "lucide-react";
import { cn, formatRelative } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

export interface Breadcrumb {
  label: string;
  href?: string;
}

interface TopBarProps {
  title?: string;
  breadcrumbs?: Breadcrumb[];
  collapsed?: boolean;
  onMobileMenuOpen?: () => void;
  user?: {
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
  } | null;
  notificationCount?: number;
  onAIOpen?: () => void;
}

interface CommandEntry {
  label: string;
  description?: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  group: string;
  keywords?: string[];
}

const COMMAND_ENTRIES: CommandEntry[] = [
  { label: "Home",             href: "/app/home",           icon: House,         group: "Navigate" },
  { label: "Projects",         href: "/app/projects",       icon: FolderKanban,  group: "Navigate", keywords: ["project","site","contract"] },
  { label: "Changes",          href: "/app/changes",        icon: GitBranch,     group: "Navigate", keywords: ["variation","claim","ce","change event"] },
  { label: "Applications",     href: "/app/applications",   icon: FileText,      group: "Navigate", keywords: ["payment","application","valuation"] },
  { label: "CVR",              href: "/app/cvr",            icon: BarChart3,     group: "Navigate", keywords: ["cost value","cvr","reconciliation"] },
  { label: "Final Accounts",   href: "/app/final-accounts", icon: ClipboardList, group: "Navigate", keywords: ["final account","settlement"] },
  { label: "Evidence",         href: "/app/evidence",       icon: Camera,        group: "Navigate", keywords: ["evidence","photos","documents"] },
  { label: "Reports",          href: "/app/reports",        icon: PieChart,      group: "Navigate", keywords: ["report","export"] },
  { label: "Suppliers",        href: "/app/suppliers",      icon: Users,         group: "Navigate", keywords: ["supplier","contact","subcontractor"] },
  { label: "Tasks",            href: "/app/tasks",          icon: CheckSquare,   group: "Navigate", keywords: ["task","todo","action"] },
  { label: "Schedule",         href: "/app/schedule",       icon: Calendar,      group: "Navigate", keywords: ["schedule","programme","gantt","dates"] },
  { label: "Drawings / BIM",   href: "/app/drawings",       icon: Layers,        group: "Navigate", keywords: ["drawing","bim","model"] },
  { label: "Account Settings", href: "/app/account",        icon: User,          group: "Settings" },
  { label: "Workspace",        href: "/app/workspace/settings", icon: Settings,  group: "Settings" },
  { label: "Billing",          href: "/app/billing",        icon: CreditCard,    group: "Settings" },
];

function CommandPalette({ onClose, onAIOpen }: { onClose: () => void; onAIOpen?: () => void }) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = query.trim()
    ? COMMAND_ENTRIES.filter((e) => {
        const q = query.toLowerCase();
        return (
          e.label.toLowerCase().includes(q) ||
          e.description?.toLowerCase().includes(q) ||
          e.keywords?.some((k) => k.includes(q))
        );
      })
    : COMMAND_ENTRIES;

  const grouped = filtered.reduce<Record<string, CommandEntry[]>>((acc, e) => {
    if (!acc[e.group]) acc[e.group] = [];
    acc[e.group].push(e);
    return acc;
  }, {});

  const handleSelect = useCallback((href: string) => {
    router.push(href);
    onClose();
  }, [router, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[9000] flex items-start justify-center pt-[10vh]"
      aria-modal="true"
      role="dialog"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          "relative w-full max-w-[560px] mx-4 rounded-2xl overflow-hidden",
          "bg-white border border-[var(--border)] shadow-[0_24px_64px_rgba(0,0,0,0.20)]"
        )}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b" style={{ borderColor: "var(--border)" }}>
          <Search size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, records, commands…"
            className="flex-1 text-[14px] outline-none bg-transparent"
            style={{ color: "var(--text-primary)" }}
          />
          {query && (
            <button type="button" onClick={() => setQuery("")} className="btn btn-ghost btn-icon btn-sm">
              <X size={14} />
            </button>
          )}
          <kbd className="text-[11px] px-1.5 py-0.5 rounded border font-mono" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
            Esc
          </kbd>
        </div>

        <div className="max-h-[360px] overflow-y-auto p-2">
          {Object.entries(grouped).length === 0 ? (
            <div className="py-8 text-center text-[13px]" style={{ color: "var(--text-muted)" }}>
              No results for &ldquo;{query}&rdquo;
            </div>
          ) : (
            Object.entries(grouped).map(([group, entries]) => (
              <div key={group} className="mb-3">
                <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  {group}
                </p>
                {entries.map((entry) => {
                  const Icon = entry.icon;
                  return (
                    <button
                      key={entry.href}
                      type="button"
                      onClick={() => handleSelect(entry.href)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left",
                        "hover:bg-[var(--bg-muted)] transition-colors"
                      )}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}
                      >
                        <span style={{ color: "var(--text-secondary)" }} className="flex items-center"><Icon size={15} /></span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium" style={{ color: "var(--text-primary)" }}>
                          {entry.label}
                        </p>
                        {entry.description && (
                          <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                            {entry.description}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}

          {onAIOpen && (
            <div className="border-t pt-2 mt-1" style={{ borderColor: "var(--border)" }}>
              <button
                type="button"
                onClick={() => { onAIOpen(); onClose(); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left",
                  "hover:bg-[var(--violet-bg)] transition-colors"
                )}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: "var(--violet-bg)", border: "1px solid rgba(139,92,246,0.2)" }}
                >
                  <Sparkles size={15} style={{ color: "var(--violet)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium" style={{ color: "var(--violet)" }}>
                    Ask AI Copilot
                  </p>
                  <p className="text-[12px]" style={{ color: "var(--text-muted)" }}>
                    {query ? `Ask about "${query}"` : "Open MeasureDeck AI assistant"}
                  </p>
                </div>
              </button>
            </div>
          )}
        </div>

        <div
          className="flex items-center gap-4 px-4 py-2.5 border-t"
          style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}
        >
          <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
            <kbd className="px-1 py-0.5 rounded border text-[10px] font-mono" style={{ borderColor: "var(--border-strong)" }}>↑↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
            <kbd className="px-1 py-0.5 rounded border text-[10px] font-mono" style={{ borderColor: "var(--border-strong)" }}>↵</kbd>
            open
          </span>
          <span className="flex items-center gap-1 text-[11px]" style={{ color: "var(--text-muted)" }}>
            <kbd className="px-1 py-0.5 rounded border text-[10px] font-mono" style={{ borderColor: "var(--border-strong)" }}>Esc</kbd>
            close
          </span>
        </div>
      </div>
    </div>
  );
}

const AVATAR_COLOURS = ["#3B5EE8", "#8B5CF6", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#EC4899"];

function getAvatarColour(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLOURS[Math.abs(hash) % AVATAR_COLOURS.length];
}

function UserAvatar({ name, avatarUrl, size = 32 }: { name?: string | null; avatarUrl?: string | null; size?: number }) {
  const initials = getInitials(name ?? "User");
  const bg = getAvatarColour(name ?? "User");

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={avatarUrl} alt={name ?? "User"} width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />
    );
  }

  return (
    <span
      className="rounded-full flex items-center justify-center font-semibold text-white select-none"
      style={{ width: size, height: size, background: bg, fontSize: size * 0.38 }}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

interface DbNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  action_url: string | null;
  urgency: string;
  created_at: string;
}

function notifIcon(type: string): React.ReactNode {
  if (type === "deadline") return <AlertTriangle size={13} style={{ color: "#d97706" }} />;
  if (type === "payment")  return <CreditCard    size={13} style={{ color: "#16a34a" }} />;
  if (type === "alert")    return <AlertTriangle size={13} style={{ color: "#dc2626" }} />;
  if (type === "mention")  return <Users         size={13} style={{ color: "#3b82f6" }} />;
  if (type === "success")  return <CheckCircle2  size={13} style={{ color: "#16a34a" }} />;
  return <Info size={13} style={{ color: "var(--text-muted)" }} />;
}

function NotificationDropdown({
  onClose,
  onMarkAllRead,
}: {
  onClose: () => void;
  onMarkAllRead: () => void;
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from("notifications")
          .select("id, type, title, body, read, action_url, urgency, created_at")
          .eq("recipient_user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(10);

        setNotifications((data ?? []) as DbNotification[]);
      } catch {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  async function markRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    const supabase = createClient();
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  }

  async function handleMarkAll() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("recipient_user_id", user.id)
        .eq("read", false);
    }
    onMarkAllRead();
  }

  function handleItemClick(n: DbNotification) {
    void markRead(n.id);
    onClose();
    if (n.action_url) {
      router.push(n.action_url);
    }
  }

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div
      className={cn(
        "absolute right-0 top-full mt-2 w-[340px] rounded-xl overflow-hidden z-50",
        "bg-white border border-[var(--border)] shadow-[0_8px_32px_rgba(0,0,0,0.14)]"
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: "var(--border)" }}>
        <span className="text-[13px] font-semibold" style={{ color: "var(--text-primary)" }}>
          Notifications {unread > 0 && <span className="ml-1 text-[11px] font-bold px-1.5 py-0.5 rounded-full text-white" style={{ background: "var(--danger)" }}>{unread}</span>}
        </span>
        <div className="flex items-center gap-1">
          {unread > 0 && (
            <button
              type="button"
              onClick={handleMarkAll}
              className="flex items-center gap-1 text-[12px] px-2 py-1 rounded-lg hover:bg-[var(--bg-muted)] transition-colors"
              style={{ color: "var(--primary)" }}
            >
              <CheckCheck size={12} />
              Mark all read
            </button>
          )}
          <Link
            href="/app/notifications"
            onClick={onClose}
            className="text-[12px] px-2 py-1 rounded-lg hover:bg-[var(--bg-muted)] transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            View all
          </Link>
        </div>
      </div>

      <div className="max-h-[360px] overflow-y-auto">
        {loading ? (
          <div className="py-8 flex items-center justify-center">
            <Clock size={16} className="animate-spin" style={{ color: "var(--text-muted)" }} />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-10 flex flex-col items-center gap-2 text-center">
            <Bell size={24} style={{ color: "var(--text-muted)" }} className="opacity-40" />
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>You&apos;re all caught up!</p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => handleItemClick(n)}
              className={cn(
                "w-full text-left flex items-start gap-3 px-4 py-3 border-b transition-colors hover:bg-[var(--bg-subtle)]",
                !n.read && "bg-blue-50/40"
              )}
              style={{ borderColor: "var(--border)" }}
            >
              <div
                className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5"
                style={{ background: "var(--bg-subtle)" }}
              >
                {notifIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={cn("text-[12px] truncate", !n.read ? "font-semibold" : "font-medium")} style={{ color: "var(--text-primary)" }}>
                    {n.title}
                  </p>
                  <span className="text-[10.5px] flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                    {formatRelative(n.created_at)}
                  </span>
                </div>
                <p className="text-[11.5px] truncate mt-0.5" style={{ color: "var(--text-muted)" }}>{n.body}</p>
              </div>
              {!n.read && (
                <div className="flex-shrink-0 w-2 h-2 rounded-full mt-2 flex-shrink-0" style={{ background: "var(--primary)" }} />
              )}
            </button>
          ))
        )}
      </div>

      <div className="px-4 py-2.5 border-t" style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}>
        <Link
          href="/app/notifications"
          onClick={onClose}
          className="flex items-center justify-center gap-1.5 text-[12px] font-medium transition-colors"
          style={{ color: "var(--primary)" }}
        >
          <ExternalLink size={12} />
          View all notifications
        </Link>
      </div>
    </div>
  );
}

export function TopBar({
  title, breadcrumbs, collapsed, onMobileMenuOpen, user,
  notificationCount = 0, onAIOpen,
}: TopBarProps) {
  const router = useRouter();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const displayName = user?.name ?? "User";
  const displayEmail = user?.email ?? "";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    if (notifOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [notifOpen]);

  async function handleSignOut() {
    const { createClient: mkClient } = await import("@/lib/supabase/client");
    const supabase = mkClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function handleBellClick() {
    setNotifOpen((v) => !v);
  }

  function handleNotifClose() {
    setNotifOpen(false);
  }

  function handleMarkAllRead() {
    setNotifOpen(false);
  }

  return (
    <>
      <header
        className={cn("topbar-fixed flex items-center px-4 gap-3", collapsed && "collapsed")}
        style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            type="button"
            onClick={onMobileMenuOpen}
            className="btn btn-ghost btn-icon md:hidden flex-shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu size={20} />
          </button>

          {breadcrumbs && breadcrumbs.length > 0 ? (
            <nav aria-label="Breadcrumb" className="flex items-center gap-1 min-w-0 overflow-hidden">
              {breadcrumbs.map((crumb, idx) => {
                const isLast = idx === breadcrumbs.length - 1;
                return (
                  <span key={idx} className="flex items-center gap-1 min-w-0">
                    {idx > 0 && <ChevronRight size={13} className="flex-shrink-0" style={{ color: "var(--text-muted)" }} />}
                    {!isLast && crumb.href ? (
                      <Link href={crumb.href} className="text-sm truncate" style={{ color: "var(--text-muted)" }}>
                        {crumb.label}
                      </Link>
                    ) : (
                      <span className={cn("text-sm font-semibold truncate", isLast ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]")}>
                        {crumb.label}
                      </span>
                    )}
                  </span>
                );
              })}
            </nav>
          ) : title ? (
            <h1 className="text-[15px] font-semibold truncate" style={{ color: "var(--text-primary)" }}>
              {title}
            </h1>
          ) : null}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => setCmdOpen(true)}
            className={cn(
              "hidden sm:flex items-center gap-2 px-3 h-8 rounded-lg text-[12.5px] transition-colors",
              "border hover:border-[var(--primary)] hover:text-[var(--primary)]",
            )}
            style={{
              borderColor: "var(--border)",
              color: "var(--text-muted)",
              background: "var(--bg-subtle)",
            }}
            aria-label="Open command palette"
          >
            <Search size={13} />
            <span>Search…</span>
            <kbd
              className="flex items-center gap-0.5 text-[10px] px-1 py-0.5 rounded font-mono"
              style={{ background: "var(--bg-muted)", color: "var(--text-disabled)" }}
            >
              <Command size={9} />K
            </kbd>
          </button>

          <button
            type="button"
            onClick={() => setCmdOpen(true)}
            className="btn btn-ghost btn-icon sm:hidden"
            aria-label="Search"
          >
            <Search size={18} style={{ color: "var(--text-secondary)" }} />
          </button>

          {onAIOpen && (
            <button
              type="button"
              onClick={onAIOpen}
              className="btn btn-ghost btn-icon"
              aria-label="Open AI Copilot"
              title="AI Copilot"
            >
              <Sparkles size={17} style={{ color: "var(--violet)" }} />
            </button>
          )}

          <div className="relative" ref={notifRef}>
            <button
              type="button"
              className="btn btn-ghost btn-icon relative"
              aria-label={notificationCount > 0 ? `${notificationCount} unread notifications` : "Notifications"}
              onClick={handleBellClick}
            >
              <Bell size={18} style={{ color: "var(--text-secondary)" }} />
              {notificationCount > 0 && (
                <span
                  className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-bold leading-4 text-white text-center"
                  style={{ background: "var(--danger)" }}
                >
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <NotificationDropdown
                onClose={handleNotifClose}
                onMarkAllRead={handleMarkAllRead}
              />
            )}
          </div>

          <UserMenu displayName={displayName} displayEmail={displayEmail} avatarUrl={user?.avatarUrl} onSignOut={handleSignOut} />
        </div>
      </header>

      {cmdOpen && <CommandPalette onClose={() => setCmdOpen(false)} onAIOpen={onAIOpen} />}
    </>
  );
}

function UserMenu({
  displayName, displayEmail, avatarUrl, onSignOut,
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
            "animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
          )}
        >
          <div className="px-3 py-2.5 mb-1">
            <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{displayName}</p>
            {displayEmail && <p className="text-[12px] text-[var(--text-muted)] truncate">{displayEmail}</p>}
          </div>
          <DropdownMenu.Separator className="h-px bg-[var(--border)] mx-1 mb-1" />
          <DDItem href="/app/account"            icon={User}       label="Account" />
          <DDItem href="/app/workspace/settings" icon={Settings}   label="Workspace Settings" />
          <DDItem href="/app/billing"            icon={CreditCard} label="Billing" />
          <DropdownMenu.Separator className="h-px bg-[var(--border)] mx-1 my-1" />
          <DropdownMenu.Item
            onSelect={onSignOut}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium",
              "text-[var(--danger)] cursor-pointer outline-none hover:bg-[var(--danger-bg)] transition-colors"
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

function DDItem({ href, icon: Icon, label }: { href: string; icon: React.ComponentType<{ size?: number }>; label: string }) {
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

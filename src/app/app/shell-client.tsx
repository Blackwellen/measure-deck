"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { TopBar, type Breadcrumb } from "@/components/shell/top-bar";
import { AIBubbleButton } from "@/components/ai-bubble/bubble-button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

interface ShellClientProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: Breadcrumb[];
  user?: {
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
  } | null;
}

export function ShellClient({
  children,
  title,
  breadcrumbs,
  user,
}: ShellClientProps) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebar-collapsed") === "true";
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>["channel"]> | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored !== null) {
      setCollapsed(stored === "true");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const supabase = createClient();

    async function init() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser || cancelled) return;

      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_user_id", authUser.id)
        .eq("read", false);

      if (!cancelled) setUnreadCount(count ?? 0);

      channelRef.current = supabase
        .channel(`shell-notifications-${authUser.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `recipient_user_id=eq.${authUser.id}`,
          },
          (payload: { new: { urgency?: string; title?: string; message?: string; body?: string } }) => {
            const row = payload.new;
            setUnreadCount((c) => c + 1);
            if (row.urgency === "critical") {
              toast.error(row.title ?? row.body ?? "Critical notification");
            }
          }
        )
        .subscribe();
    }

    void init();

    return () => {
      cancelled = true;
      if (channelRef.current) {
        const supabase = createClient();
        void supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []);

  const handleCollapsedChange = useCallback((val: boolean) => {
    setCollapsed(val);
    localStorage.setItem("sidebar-collapsed", String(val));
  }, []);

  const handleMobileClose = useCallback(() => {
    setMobileOpen(false);
  }, []);

  return (
    <>
      <AppSidebar
        collapsed={collapsed}
        onCollapsedChange={handleCollapsedChange}
        mobileOpen={mobileOpen}
        onMobileClose={handleMobileClose}
      />

      <TopBar
        title={title}
        breadcrumbs={breadcrumbs}
        collapsed={collapsed}
        onMobileMenuOpen={() => setMobileOpen(true)}
        user={user}
        notificationCount={unreadCount}
      />

      <main
        className={cn("main-content", collapsed && "collapsed")}
        id="main-content"
      >
        {children}
      </main>

      <AIBubbleButton />
    </>
  );
}

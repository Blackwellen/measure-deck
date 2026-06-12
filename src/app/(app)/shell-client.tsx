"use client";

import { useState, useEffect, useCallback } from "react";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { TopBar, type Breadcrumb } from "@/components/shell/top-bar";
import { AIBubbleButton } from "@/components/ai-bubble/bubble-button";
import { cn } from "@/lib/utils";

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

  /* Sync with localStorage on mount (handles SSR mismatch) */
  useEffect(() => {
    const stored = localStorage.getItem("sidebar-collapsed");
    if (stored !== null) {
      setCollapsed(stored === "true");
    }
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

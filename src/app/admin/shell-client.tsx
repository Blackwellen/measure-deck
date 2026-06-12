"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminSidebar } from "@/components/shell/admin-sidebar";
import { TopBar, type Breadcrumb } from "@/components/shell/top-bar";
import { cn } from "@/lib/utils";

interface AdminShellClientProps {
  children: React.ReactNode;
  title?: string;
  breadcrumbs?: Breadcrumb[];
  user?: {
    name?: string | null;
    email?: string | null;
    avatarUrl?: string | null;
  } | null;
}

export function AdminShellClient({
  children,
  title,
  breadcrumbs,
  user,
}: AdminShellClientProps) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("admin-sidebar-collapsed") === "true";
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  /* Sync with localStorage on mount */
  useEffect(() => {
    const stored = localStorage.getItem("admin-sidebar-collapsed");
    if (stored !== null) {
      setCollapsed(stored === "true");
    }
  }, []);

  const handleCollapsedChange = useCallback((val: boolean) => {
    setCollapsed(val);
    localStorage.setItem("admin-sidebar-collapsed", String(val));
  }, []);

  const handleMobileClose = useCallback(() => {
    setMobileOpen(false);
  }, []);

  return (
    <>
      <AdminSidebar
        collapsed={collapsed}
        onCollapsedChange={handleCollapsedChange}
        mobileOpen={mobileOpen}
        onMobileClose={handleMobileClose}
      />

      <TopBar
        title={title ?? "Admin"}
        breadcrumbs={breadcrumbs}
        collapsed={collapsed}
        onMobileMenuOpen={() => setMobileOpen(true)}
        user={user}
      />

      <main
        className={cn("main-content", collapsed && "collapsed")}
        id="admin-main-content"
      >
        {children}
      </main>
    </>
  );
}

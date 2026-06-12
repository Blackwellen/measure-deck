"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import React from "react";

export interface Breadcrumb {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Breadcrumb[];
  actions?: React.ReactNode;
  backHref?: string;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  backHref,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("page-header", className)}>
      <div className="flex-1 min-w-0">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1 mb-2 flex-wrap" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && (
                  <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                )}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="text-[12px] hover:underline truncate"
                    style={{ color: "var(--text-muted)" }}
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-[12px] truncate" style={{ color: "var(--text-muted)" }}>
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Back + Title row */}
        <div className="flex items-center gap-2">
          {backHref && (
            <Link
              href={backHref}
              className="btn btn-ghost btn-icon btn-sm flex-shrink-0"
              aria-label="Go back"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
          )}
          <h1 className="page-title truncate">{title}</h1>
        </div>

        {subtitle && (
          <p className="page-subtitle mt-0.5 truncate">{subtitle}</p>
        )}
      </div>

      {/* Actions */}
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          {actions}
        </div>
      )}
    </div>
  );
}

export default PageHeader;

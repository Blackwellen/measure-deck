"use client";

import { cn } from "@/lib/utils";
import { BookOpen, ExternalLink, FileText, HelpCircle, LifeBuoy, Search } from "lucide-react";
import React, { useState } from "react";

const QUICK_LINKS = [
  {
    id: "getting-started",
    label: "Getting Started",
    description: "Set up your first project and workspace",
    icon: BookOpen,
    href: "https://docs.measuredeck.com/getting-started",
  },
  {
    id: "cvr-guide",
    label: "CVR Guide",
    description: "How to complete a Cost Value Reconciliation",
    icon: FileText,
    href: "https://docs.measuredeck.com/cvr-guide",
  },
  {
    id: "application-guide",
    label: "Application Guide",
    description: "Submitting and tracking payment applications",
    icon: FileText,
    href: "https://docs.measuredeck.com/application-guide",
  },
  {
    id: "support",
    label: "Contact Support",
    description: "Get help from our team",
    icon: LifeBuoy,
    href: "mailto:support@measuredeck.com",
  },
];

export function HelpView() {
  const [query, setQuery] = useState("");

  const filtered = QUICK_LINKS.filter(
    (l) =>
      !query ||
      l.label.toLowerCase().includes(query.toLowerCase()) ||
      l.description.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-4 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search help articles…"
            className="form-input pl-9 text-[13px]"
          />
        </div>
      </div>

      {/* Quick links */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <HelpCircle className="w-8 h-8" style={{ color: "var(--text-muted)" }} />
            <p className="text-[13px]" style={{ color: "var(--text-muted)" }}>No results for &quot;{query}&quot;</p>
          </div>
        ) : (
          filtered.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.id}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-start gap-3 rounded-xl p-3 transition-colors group",
                  "hover:bg-[var(--bg-subtle)]"
                )}
              >
                <div
                  className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: "var(--bg-subtle)" }}
                >
                  <Icon className="w-4 h-4" style={{ color: "var(--primary)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-600" style={{ color: "var(--text-primary)" }}>
                    {link.label}
                  </p>
                  <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {link.description}
                  </p>
                </div>
                <ExternalLink
                  className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "var(--text-muted)" }}
                />
              </a>
            );
          })
        )}
      </div>
    </div>
  );
}

export default HelpView;

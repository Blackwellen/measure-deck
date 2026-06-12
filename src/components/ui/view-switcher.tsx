"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export interface ViewOption {
  id: string;
  label: string;
  icon: LucideIcon;
}

export interface ViewSwitcherProps {
  views: ViewOption[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function ViewSwitcher({ views, active, onChange, className }: ViewSwitcherProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-lg p-0.5",
        className
      )}
      style={{ background: "var(--bg-subtle)", border: "1px solid var(--border)" }}
      role="group"
      aria-label="View options"
    >
      {views.map((view) => {
        const Icon = view.icon;
        const isActive = active === view.id;
        return (
          <button
            key={view.id}
            type="button"
            onClick={() => onChange(view.id)}
            aria-label={view.label}
            aria-pressed={isActive}
            title={view.label}
            className={cn(
              "flex items-center justify-center w-8 h-7 rounded-md transition-all",
              isActive
                ? "bg-white shadow-sm"
                : "hover:bg-black/5"
            )}
            style={isActive ? { color: "var(--primary)" } : { color: "var(--text-muted)" }}
          >
            <Icon className="w-4 h-4" />
          </button>
        );
      })}
    </div>
  );
}

export default ViewSwitcher;

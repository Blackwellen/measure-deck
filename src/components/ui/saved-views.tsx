"use client";

import { cn } from "@/lib/utils";
import { Bookmark, Plus, X } from "lucide-react";
import React from "react";
import type { FilterState } from "./filter-drawer";

interface SavedView {
  id: string;
  label: string;
  filters: FilterState;
}

interface SavedViewsProps {
  views: SavedView[];
  onSelect: (view: SavedView) => void;
  currentFilters: FilterState;
  onSave: (name: string, filters: FilterState) => void;
  entityType?: string;
  className?: string;
}

export function SavedViews({
  views,
  onSelect,
  currentFilters,
  onSave,
  entityType = "entity",
  className,
}: SavedViewsProps) {
  const [saving, setSaving] = React.useState(false);
  const [name, setName] = React.useState("");
  const [activeId, setActiveId] = React.useState<string | null>(null);

  function handleSave() {
    if (!name.trim()) return;
    onSave(name.trim(), currentFilters);
    setName("");
    setSaving(false);
  }

  function handleSelect(view: SavedView) {
    setActiveId(view.id);
    onSelect(view);
  }

  React.useEffect(() => {
    const storageKey = `saved-views-${entityType}`;
    const existing = localStorage.getItem(storageKey);
    if (!existing && views.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(views));
    }
  }, [entityType, views]);

  return (
    <div className={cn("flex items-center gap-2 flex-wrap", className)}>
      <Bookmark className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--text-muted)" }} />
      {views.map((view) => (
        <button
          key={view.id}
          type="button"
          onClick={() => handleSelect(view)}
          className={cn(
            "px-3 py-1 rounded-full text-[12px] font-500 border transition-colors",
            activeId === view.id
              ? "bg-[var(--primary)] text-white border-[var(--primary)]"
              : "border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--primary)]"
          )}
        >
          {view.label}
        </button>
      ))}

      {saving ? (
        <div className="flex items-center gap-1">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") setSaving(false);
            }}
            placeholder="View name..."
            className="rounded-md border px-2 py-0.5 text-[12px] w-28"
            style={{
              borderColor: "var(--border)",
              background: "var(--bg-subtle)",
              color: "var(--text-primary)",
            }}
          />
          <button
            type="button"
            onClick={handleSave}
            disabled={!name.trim()}
            className="btn btn-primary btn-xs"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setSaving(false)}
            className="btn btn-ghost btn-icon btn-xs"
            aria-label="Cancel"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setSaving(true)}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-500 border border-dashed transition-colors"
          style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
        >
          <Plus className="w-3 h-3" />
          Save view
        </button>
      )}
    </div>
  );
}

export default SavedViews;

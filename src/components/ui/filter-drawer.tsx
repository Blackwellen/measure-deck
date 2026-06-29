"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import React from "react";

export interface FilterState {
  statuses: string[];
  dateFrom?: string;
  dateTo?: string;
  valueMin?: number;
  valueMax?: number;
}

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  statusOptions?: string[];
  showDateRange?: boolean;
  showValueRange?: boolean;
}

const EMPTY: FilterState = { statuses: [] };

export function FilterDrawer({
  isOpen,
  onClose,
  onApply,
  statusOptions = [],
  showDateRange = true,
  showValueRange = false,
}: FilterDrawerProps) {
  const [filters, setFilters] = React.useState<FilterState>(EMPTY);

  function toggleStatus(s: string) {
    setFilters((prev) => ({
      ...prev,
      statuses: prev.statuses.includes(s)
        ? prev.statuses.filter((x) => x !== s)
        : [...prev.statuses, s],
    }));
  }

  function clearAll() {
    setFilters(EMPTY);
  }

  function handleApply() {
    onApply(filters);
    onClose();
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-full max-w-xs flex flex-col",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        style={{
          background: "var(--bg-surface)",
          borderLeft: "1px solid var(--border)",
          boxShadow: "var(--shadow-lg)",
        }}
        role="dialog"
        aria-label="Filters"
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: "var(--border)" }}
        >
          <h2 className="text-[15px] font-700" style={{ color: "var(--text-primary)" }}>
            Filters
          </h2>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-icon" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-6">
          {statusOptions.length > 0 && (
            <div>
              <p className="text-[11px] font-700 uppercase tracking-[0.06em] mb-2" style={{ color: "var(--text-muted)" }}>
                Status
              </p>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleStatus(s)}
                    className={cn(
                      "px-3 py-1 rounded-full text-[12px] font-500 border transition-colors",
                      filters.statuses.includes(s)
                        ? "bg-[var(--primary)] text-white border-[var(--primary)]"
                        : "border-[var(--border)] text-[var(--text-secondary)]"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showDateRange && (
            <div>
              <p className="text-[11px] font-700 uppercase tracking-[0.06em] mb-2" style={{ color: "var(--text-muted)" }}>
                Date Range
              </p>
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[12px]" style={{ color: "var(--text-secondary)" }}>From</label>
                  <input
                    type="date"
                    value={filters.dateFrom ?? ""}
                    onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value || undefined }))}
                    className="rounded-lg border px-3 py-1.5 text-[13px]"
                    style={{ borderColor: "var(--border)", background: "var(--bg-subtle)", color: "var(--text-primary)" }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[12px]" style={{ color: "var(--text-secondary)" }}>To</label>
                  <input
                    type="date"
                    value={filters.dateTo ?? ""}
                    onChange={(e) => setFilters((p) => ({ ...p, dateTo: e.target.value || undefined }))}
                    className="rounded-lg border px-3 py-1.5 text-[13px]"
                    style={{ borderColor: "var(--border)", background: "var(--bg-subtle)", color: "var(--text-primary)" }}
                  />
                </div>
              </div>
            </div>
          )}

          {showValueRange && (
            <div>
              <p className="text-[11px] font-700 uppercase tracking-[0.06em] mb-2" style={{ color: "var(--text-muted)" }}>
                Value Range (£)
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.valueMin ?? ""}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, valueMin: e.target.value ? Number(e.target.value) : undefined }))
                  }
                  className="flex-1 rounded-lg border px-3 py-1.5 text-[13px]"
                  style={{ borderColor: "var(--border)", background: "var(--bg-subtle)", color: "var(--text-primary)" }}
                />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.valueMax ?? ""}
                  onChange={(e) =>
                    setFilters((p) => ({ ...p, valueMax: e.target.value ? Number(e.target.value) : undefined }))
                  }
                  className="flex-1 rounded-lg border px-3 py-1.5 text-[13px]"
                  style={{ borderColor: "var(--border)", background: "var(--bg-subtle)", color: "var(--text-primary)" }}
                />
              </div>
            </div>
          )}
        </div>

        <div
          className="flex-shrink-0 flex gap-2 px-5 py-4 border-t"
          style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}
        >
          <button type="button" onClick={clearAll} className="btn btn-secondary btn-sm flex-1">
            Clear All
          </button>
          <button type="button" onClick={handleApply} className="btn btn-primary btn-sm flex-1">
            Apply
          </button>
        </div>
      </div>
    </>
  );
}

export default FilterDrawer;

"use client";

import { cn } from "@/lib/utils";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { Search, X } from "lucide-react";
import React, { useEffect, useState } from "react";

export interface SearchInputProps {
  placeholder?: string;
  onSearch: (value: string) => void;
  defaultValue?: string;
  className?: string;
}

export function SearchInput({
  placeholder = "Search…",
  onSearch,
  defaultValue = "",
  className,
}: SearchInputProps) {
  const [value, setValue] = useState(defaultValue);
  const debounced = useDebounce(value, 300);

  useEffect(() => {
    onSearch(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <div className={cn("relative flex items-center", className)}>
      <Search
        className="absolute left-3 w-4 h-4 pointer-events-none"
        style={{ color: "var(--text-muted)" }}
      />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="form-input pl-9 pr-8"
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue("")}
          className="absolute right-2.5 p-0.5 rounded hover:bg-black/5 transition-colors"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
        </button>
      )}
    </div>
  );
}

export default SearchInput;

"use client";

import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import React from "react";

interface AIBubbleButtonProps {
  onClick?: () => void;
  active?: boolean;
}

export function AIBubbleButton({ onClick, active = false }: AIBubbleButtonProps) {
  return (
    <button
      className={cn("ai-bubble-btn", active && "ai-bubble-btn--active")}
      aria-label={active ? "Close AI assistant" : "Open AI assistant"}
      aria-expanded={active}
      type="button"
      onClick={onClick}
      style={{ zIndex: 9999, position: "relative" }}
    >
      <Sparkles size={22} />
    </button>
  );
}

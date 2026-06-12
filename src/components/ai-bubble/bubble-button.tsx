"use client";

import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";
import React, { useState } from "react";
import { BubblePanel } from "./bubble-panel";

export function AIBubbleButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className={cn("ai-bubble-btn", open && "ai-bubble-btn--active")}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        aria-expanded={open}
        type="button"
        onClick={() => setOpen((v) => !v)}
      >
        <Sparkles size={22} />
      </button>

      {open && <BubblePanel onClose={() => setOpen(false)} />}
    </>
  );
}

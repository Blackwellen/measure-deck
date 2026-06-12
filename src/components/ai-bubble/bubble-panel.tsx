"use client";

import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, BookOpen, Bot, HelpCircle, Inbox, Sparkles, X } from "lucide-react";
import React, { useState } from "react";
import { CopilotView } from "./modes/copilot-view";
import { HelpView } from "./modes/help-view";
import { InboxView } from "./modes/inbox-view";
import { NotificationsView } from "./modes/notifications-view";

type Mode = "copilot" | "inbox" | "notifications" | "help";

interface ModeTab {
  id: Mode;
  label: string;
  icon: React.ElementType;
}

const TABS: ModeTab[] = [
  { id: "copilot", label: "Copilot", icon: Sparkles },
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "notifications", label: "Alerts", icon: Bell },
  { id: "help", label: "Help", icon: HelpCircle },
];

export interface BubblePanelProps {
  onClose: () => void;
}

export function BubblePanel({ onClose }: BubblePanelProps) {
  const [activeMode, setActiveMode] = useState<Mode>("copilot");

  return (
    <AnimatePresence>
      <motion.div
        key="bubble-panel"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className={cn(
          "fixed bottom-20 right-6 z-[9999]",
          "w-[480px] max-h-[600px]",
          "bg-white rounded-2xl shadow-xl border flex flex-col overflow-hidden"
        )}
        style={{ borderColor: "var(--border)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
          style={{ borderColor: "var(--border)" }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "var(--primary)" }}
            >
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="text-[14px] font-700" style={{ color: "var(--text-primary)" }}>
              MeasureDeck AI
            </span>
          </div>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-icon btn-sm"
            aria-label="Close AI panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode tabs */}
        <div
          className="flex items-center gap-0.5 px-3 py-1.5 border-b flex-shrink-0"
          style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}
        >
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeMode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveMode(tab.id)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-500 transition-all",
                  isActive
                    ? "bg-white shadow-sm font-600"
                    : "hover:bg-white/60"
                )}
                style={{
                  color: isActive ? "var(--primary)" : "var(--text-muted)",
                }}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Body — each mode fills the remaining height */}
        <div className="flex-1 overflow-hidden">
          {activeMode === "copilot" && <CopilotView />}
          {activeMode === "inbox" && <InboxView />}
          {activeMode === "notifications" && <NotificationsView />}
          {activeMode === "help" && <HelpView />}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default BubblePanel;

"use client";

import { cn } from "@/lib/utils";
import type { PageContext } from "@/lib/ai/context-builder";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Bot, HelpCircle, Inbox, Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import React, { useMemo, useState } from "react";
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
  { id: "copilot",       label: "Copilot",       icon: Sparkles  },
  { id: "inbox",         label: "Inbox",         icon: Inbox     },
  { id: "notifications", label: "Alerts",        icon: Bell      },
  { id: "help",          label: "Help",          icon: HelpCircle },
];

export interface BubblePanelProps {
  onClose: () => void;
}

function derivePageContext(pathname: string): Omit<PageContext, "workspace_id"> {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.includes("changes") && segments.length > 2) {
    return { route: pathname, entity_type: "change_event", entity_id: segments[segments.indexOf("changes") + 1] };
  }
  if (segments.includes("applications") && segments.length > 2) {
    return { route: pathname, entity_type: "application", entity_id: segments[segments.indexOf("applications") + 1] };
  }
  if (segments.includes("projects") && segments.length > 2) {
    return { route: pathname, entity_type: "project", entity_id: segments[segments.indexOf("projects") + 1] };
  }
  if (segments.includes("cvr")) {
    return { route: pathname, entity_type: "cvr" };
  }
  if (segments.includes("final-accounts")) {
    return { route: pathname, entity_type: "final_account" };
  }
  if (segments.includes("suppliers") && segments.length > 2) {
    return { route: pathname, entity_type: "supplier", entity_id: segments[segments.indexOf("suppliers") + 1] };
  }

  return { route: pathname, entity_type: "general" };
}

export function BubblePanel({ onClose }: BubblePanelProps) {
  const [activeMode, setActiveMode] = useState<Mode>("copilot");
  const pathname = usePathname();

  const pageContext = useMemo<PageContext>(() => ({
    ...derivePageContext(pathname ?? "/"),
    workspace_id: "",
  }), [pathname]);

  return (
    <AnimatePresence>
      <motion.div
        key="bubble-panel"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className={cn(
          "fixed bottom-20 right-6",
          "w-[480px] max-h-[600px]",
          "bg-white rounded-2xl shadow-xl border flex flex-col overflow-hidden"
        )}
        style={{ borderColor: "var(--border)", zIndex: 9999 }}
      >
        <div
          className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
          style={{ borderColor: "var(--border)" }}
        >
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

          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-icon btn-sm"
            aria-label="Close AI panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

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

        <div className="flex-1 overflow-hidden">
          {activeMode === "copilot" && <CopilotView pageContext={pageContext} />}
          {activeMode === "inbox" && <InboxView />}
          {activeMode === "notifications" && <NotificationsView />}
          {activeMode === "help" && <HelpView />}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default BubblePanel;

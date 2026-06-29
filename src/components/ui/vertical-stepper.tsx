"use client";

import { cn } from "@/lib/utils";
import { AlertTriangle, Check } from "lucide-react";

type StepStatus = "complete" | "current" | "upcoming" | "overdue";

interface VerticalStep {
  id: string;
  label: string;
  description?: string;
  timestamp?: Date;
  status: StepStatus;
}

interface VerticalStepperProps {
  steps: VerticalStep[];
  className?: string;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function StepNode({ status }: { status: StepStatus }) {
  if (status === "complete") {
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-green-500 flex-shrink-0">
        <Check className="w-4 h-4 text-white" strokeWidth={3} />
      </div>
    );
  }
  if (status === "current") {
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-blue-500 flex-shrink-0 animate-pulse">
        <div className="w-3 h-3 rounded-full bg-white" />
      </div>
    );
  }
  if (status === "overdue") {
    return (
      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-red-500 flex-shrink-0">
        <AlertTriangle className="w-4 h-4 text-white" />
      </div>
    );
  }
  return (
    <div
      className="w-8 h-8 rounded-full border-2 flex-shrink-0"
      style={{ borderColor: "var(--border)", background: "var(--bg-subtle)" }}
    />
  );
}

export function VerticalStepper({ steps, className }: VerticalStepperProps) {
  return (
    <div className={cn("flex flex-col", className)}>
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        return (
          <div key={step.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <StepNode status={step.status} />
              {!isLast && (
                <div
                  className="w-0.5 flex-1 mt-1 mb-1 min-h-[24px]"
                  style={{
                    background:
                      step.status === "complete"
                        ? "var(--success, #22c55e)"
                        : "var(--border)",
                  }}
                />
              )}
            </div>
            <div className={cn("pb-6 flex-1 min-w-0", isLast && "pb-0")}>
              <div className="flex items-start justify-between gap-2 mt-1">
                <span
                  className={cn(
                    "text-[13px] font-600 leading-snug",
                    step.status === "complete" && "text-green-700",
                    step.status === "current" && "text-blue-700",
                    step.status === "overdue" && "text-red-700",
                    step.status === "upcoming" && "opacity-60"
                  )}
                  style={
                    step.status === "upcoming"
                      ? { color: "var(--text-secondary)" }
                      : undefined
                  }
                >
                  {step.label}
                </span>
                {step.timestamp && (
                  <span className="text-[11px] shrink-0" style={{ color: "var(--text-muted)" }}>
                    {formatDate(step.timestamp)}
                  </span>
                )}
              </div>
              {step.description && (
                <p className="text-[12px] mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {step.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default VerticalStepper;

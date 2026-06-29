"use client";

import { cn } from "@/lib/utils";
import React from "react";

interface CountdownClockProps {
  deadline: Date;
  label?: string;
  urgencyThresholdDays?: number;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isPast: boolean;
}

function computeTimeLeft(deadline: Date): TimeLeft {
  const diff = deadline.getTime() - Date.now();
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isPast: true };
  }
  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds, isPast: false };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function CountdownClock({ deadline, label, urgencyThresholdDays = 3 }: CountdownClockProps) {
  const [timeLeft, setTimeLeft] = React.useState<TimeLeft>(() => computeTimeLeft(deadline));
  const [flash, setFlash] = React.useState(false);

  React.useEffect(() => {
    const id = setInterval(() => {
      const next = computeTimeLeft(deadline);
      setTimeLeft(next);
      if (next.isPast) {
        setFlash((f) => !f);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const daysRemaining = timeLeft.days;

  const colourClass = timeLeft.isPast
    ? flash
      ? "text-red-600"
      : "text-red-400"
    : daysRemaining <= 2
    ? "text-red-600"
    : daysRemaining <= urgencyThresholdDays
    ? "text-amber-500"
    : "text-green-600";

  if (timeLeft.isPast) {
    return (
      <div className="flex flex-col items-center gap-1">
        {label && (
          <span className="text-[11px] font-600 uppercase tracking-[0.06em]" style={{ color: "var(--text-muted)" }}>
            {label}
          </span>
        )}
        <span
          className={cn(
            "text-sm sm:text-base font-700 tracking-widest transition-colors duration-500",
            colourClass
          )}
        >
          OVERDUE
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      {label && (
        <span className="text-[11px] font-600 uppercase tracking-[0.06em]" style={{ color: "var(--text-muted)" }}>
          {label}
        </span>
      )}
      <div className={cn("flex items-center gap-1 sm:gap-2 font-700 tabular-nums transition-colors", colourClass)}>
        <span className="text-xl sm:text-2xl">{pad(timeLeft.days)}</span>
        <span className="text-base sm:text-lg opacity-60">d</span>
        <span className="text-xl sm:text-2xl">{pad(timeLeft.hours)}</span>
        <span className="text-base sm:text-lg opacity-60">h</span>
        <span className="text-xl sm:text-2xl">{pad(timeLeft.minutes)}</span>
        <span className="text-base sm:text-lg opacity-60">m</span>
        <span className="text-xl sm:text-2xl">{pad(timeLeft.seconds)}</span>
        <span className="text-base sm:text-lg opacity-60">s</span>
      </div>
    </div>
  );
}

export default CountdownClock;

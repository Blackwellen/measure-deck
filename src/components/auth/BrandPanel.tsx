"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "Real-time cost control",
    description: "Track budgets, CVRs, and variations as they happen — not after month-end.",
  },
  {
    title: "Subcontract management",
    description: "Manage orders, valuations, and retentions from one commercial hub.",
  },
  {
    title: "Instant reporting",
    description: "Board-ready cost reports generated in seconds, not spreadsheet hours.",
  },
  {
    title: "Built for QS teams",
    description: "Workflows designed around how commercial teams actually work on site.",
  },
];

export function BrandPanel({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "hidden lg:flex flex-col justify-between bg-[#0D1B2E] px-12 py-10 min-h-screen w-full",
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <Image
          src="/measuredeck-logo-DB_Uf-KZ.png"
          alt="MeasureDeck"
          width={180}
          height={40}
          className="object-contain"
          priority
        />
      </div>

      {/* Hero copy */}
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-4xl font-bold text-white leading-tight tracking-tight">
            Commercial control<br />for construction teams
          </h1>
          <p className="mt-4 text-[#8BA3C7] text-lg leading-relaxed">
            MeasureDeck brings your entire commercial function into one platform — from tender to final account.
          </p>
        </div>

        <ul className="flex flex-col gap-5">
          {features.map((f) => (
            <li key={f.title} className="flex items-start gap-3">
              <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#3B5EE8]/20 flex items-center justify-center">
                <svg
                  className="w-3 h-3 text-[#3B5EE8]"
                  viewBox="0 0 12 12"
                  fill="none"
                >
                  <path
                    d="M2 6l3 3 5-5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div>
                <p className="text-white font-semibold text-sm">{f.title}</p>
                <p className="text-[#8BA3C7] text-sm mt-0.5 leading-relaxed">{f.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Bottom trust bar */}
      <div className="border-t border-white/10 pt-6">
        <p className="text-[#8BA3C7] text-xs">
          Trusted by commercial teams across the UK construction industry.
        </p>
      </div>
    </div>
  );
}

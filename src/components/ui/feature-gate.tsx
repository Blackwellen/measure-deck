"use client";

import type { ReactNode } from "react";
import { getFlag, type FeatureFlag } from "@/lib/feature-flags";

interface FeatureGateProps {
  flag: FeatureFlag;
  children: ReactNode;
  fallback?: ReactNode;
}

function UpgradeBanner() {
  return (
    <div
      className="card"
      style={{
        padding: "20px 24px",
        textAlign: "center",
        border: "1px dashed var(--border)",
      }}
    >
      <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
        This feature requires an upgrade. Contact your administrator.
      </p>
    </div>
  );
}

export function FeatureGate({ flag, children, fallback }: FeatureGateProps) {
  if (getFlag(flag)) return <>{children}</>;
  return <>{fallback ?? <UpgradeBanner />}</>;
}

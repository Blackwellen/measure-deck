"use client";

import type { ReactNode } from "react";

type Plan = "essentials" | "professional" | "enterprise";

const PLAN_RANK: Record<Plan, number> = {
  essentials: 1,
  professional: 2,
  enterprise: 3,
};

interface PlanGateProps {
  requiredPlan: Plan;
  currentPlan: Plan;
  children: ReactNode;
}

function UpgradeCTA({ requiredPlan }: { requiredPlan: Plan }) {
  return (
    <div
      className="card"
      style={{
        padding: "24px",
        textAlign: "center",
        border: "1px dashed var(--border)",
      }}
    >
      <p
        style={{
          fontSize: 13,
          fontWeight: 600,
          textTransform: "capitalize",
          marginBottom: 4,
        }}
      >
        {requiredPlan} plan required
      </p>
      <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
        Upgrade your workspace plan to unlock this feature.
      </p>
      <a href="/billing" className="btn btn-primary btn-sm">
        View Plans
      </a>
    </div>
  );
}

export function PlanGate({ requiredPlan, currentPlan, children }: PlanGateProps) {
  if (PLAN_RANK[currentPlan] >= PLAN_RANK[requiredPlan]) return <>{children}</>;
  return <UpgradeCTA requiredPlan={requiredPlan} />;
}

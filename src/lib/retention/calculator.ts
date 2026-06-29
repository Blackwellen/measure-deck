export interface RetentionLedgerEntry {
  date: Date;
  type: "deduction" | "release_first_moiety" | "release_second_moiety" | "adjustment";
  amount: number;
  description: string;
  application_id?: string;
  balance_after: number;
}

export function calculateRetentionDeduction(params: {
  certified_value: number;
  retention_rate_percent: number;
  retention_limit_percent?: number;
  existing_retention_held: number;
}): number {
  const { certified_value, retention_rate_percent, retention_limit_percent, existing_retention_held } = params;

  const rawDeduction = (certified_value * retention_rate_percent) / 100;

  if (retention_limit_percent === undefined) {
    return rawDeduction;
  }

  const contractApproximate = existing_retention_held / (retention_rate_percent / 100);
  const limit = (contractApproximate * retention_limit_percent) / 100;
  const remaining = Math.max(0, limit - existing_retention_held);

  return Math.min(rawDeduction, remaining);
}

export function calculateFirstMoietyRelease(total_retention_held: number): number {
  return total_retention_held * 0.5;
}

export function calculateSecondMoietyRelease(
  total_retention_held: number,
  first_moiety_released: number
): number {
  return total_retention_held - first_moiety_released;
}

export function projectRetentionSchedule(params: {
  contract_sum: number;
  retention_rate_percent: number;
  retention_limit_percent?: number;
  projected_pc_date: Date;
  dlp_months: number;
}): {
  projected_max_retention: number;
  first_moiety_release_date: Date;
  second_moiety_release_date: Date;
  first_moiety_amount: number;
  second_moiety_amount: number;
} {
  const { contract_sum, retention_rate_percent, retention_limit_percent, projected_pc_date, dlp_months } = params;

  const rawMax = (contract_sum * retention_rate_percent) / 100;
  const projected_max_retention =
    retention_limit_percent !== undefined
      ? Math.min(rawMax, (contract_sum * retention_limit_percent) / 100)
      : rawMax;

  const first_moiety_release_date = new Date(projected_pc_date);
  const second_moiety_release_date = new Date(projected_pc_date);
  second_moiety_release_date.setMonth(second_moiety_release_date.getMonth() + dlp_months);

  const first_moiety_amount = calculateFirstMoietyRelease(projected_max_retention);
  const second_moiety_amount = calculateSecondMoietyRelease(projected_max_retention, first_moiety_amount);

  return {
    projected_max_retention,
    first_moiety_release_date,
    second_moiety_release_date,
    first_moiety_amount,
    second_moiety_amount,
  };
}

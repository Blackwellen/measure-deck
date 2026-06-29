export interface CashflowPeriod {
  month_year: string;
  planned_cumulative: number;
  actual_cumulative?: number;
  forecast_cumulative?: number;
  planned_monthly: number;
  actual_monthly?: number;
}

type CashflowProfile = "linear" | "front_loaded" | "back_loaded" | "bell_curve";

function monthsBetween(start: Date, end: Date): number {
  return (
    (end.getFullYear() - start.getFullYear()) * 12 +
    (end.getMonth() - start.getMonth()) +
    1
  );
}

function formatMonthYear(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function buildWeights(count: number, profile: CashflowProfile): number[] {
  if (count <= 0) return [];

  if (profile === "linear") {
    return Array(count).fill(1 / count) as number[];
  }

  if (profile === "front_loaded") {
    const half = Math.floor(count / 2);
    const rest = count - half;
    const weights: number[] = [];
    for (let i = 0; i < half; i++) weights.push(0.6 / half);
    for (let i = 0; i < rest; i++) weights.push(0.4 / rest);
    return weights;
  }

  if (profile === "back_loaded") {
    const half = Math.floor(count / 2);
    const rest = count - half;
    const weights: number[] = [];
    for (let i = 0; i < half; i++) weights.push(0.4 / half);
    for (let i = 0; i < rest; i++) weights.push(0.6 / rest);
    return weights;
  }

  // bell_curve: approximate normal distribution — slow start, peak at 60%, taper
  const raw: number[] = [];
  const peak = count * 0.6;
  const sigma = count * 0.25;
  for (let i = 0; i < count; i++) {
    const x = i + 0.5;
    raw.push(Math.exp(-0.5 * Math.pow((x - peak) / sigma, 2)));
  }
  const sum = raw.reduce((a, b) => a + b, 0);
  return raw.map((v) => v / sum);
}

export function generateSCurve(params: {
  contract_sum: number;
  start_date: Date;
  end_date: Date;
  profile: CashflowProfile;
}): CashflowPeriod[] {
  const { contract_sum, start_date, end_date, profile } = params;
  const count = monthsBetween(start_date, end_date);
  const weights = buildWeights(count, profile);

  const periods: CashflowPeriod[] = [];
  let cumulative = 0;

  for (let i = 0; i < count; i++) {
    const d = new Date(start_date.getFullYear(), start_date.getMonth() + i, 1);
    const monthly = contract_sum * weights[i];
    cumulative += monthly;
    periods.push({
      month_year: formatMonthYear(d),
      planned_monthly: monthly,
      planned_cumulative: cumulative,
    });
  }

  return periods;
}

export function updateActuals(
  periods: CashflowPeriod[],
  certifications: Array<{ month_year: string; certified_value: number }>
): CashflowPeriod[] {
  const certMap = new Map<string, number>();
  for (const c of certifications) {
    certMap.set(c.month_year, c.certified_value);
  }

  let cumulativeActual = 0;
  return periods.map((p) => {
    const cert = certMap.get(p.month_year);
    if (cert !== undefined) {
      cumulativeActual += cert;
      return { ...p, actual_monthly: cert, actual_cumulative: cumulativeActual };
    }
    return p;
  });
}

export function forecastToComplete(
  periods: CashflowPeriod[],
  contract_sum: number,
  profile: "linear" | "bell_curve"
): CashflowPeriod[] {
  const lastActualIndex = periods.reduce((last, p, i) => {
    return p.actual_cumulative !== undefined ? i : last;
  }, -1);

  if (lastActualIndex === -1) return periods;

  const lastActualCumulative = periods[lastActualIndex].actual_cumulative ?? 0;
  const remaining = contract_sum - lastActualCumulative;
  const futureCount = periods.length - lastActualIndex - 1;

  if (futureCount <= 0 || remaining <= 0) return periods;

  const weights = buildWeights(futureCount, profile);
  const result = periods.map((p) => ({ ...p }));

  let forecastCumulative = lastActualCumulative;
  for (let i = 0; i < futureCount; i++) {
    const idx = lastActualIndex + 1 + i;
    const monthly = remaining * weights[i];
    forecastCumulative += monthly;
    result[idx] = {
      ...result[idx],
      forecast_cumulative: forecastCumulative,
    };
  }

  return result;
}

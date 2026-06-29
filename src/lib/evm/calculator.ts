export interface EVMMetrics {
  BAC: number;
  PV: number;
  EV: number;
  AC: number;
  SV: number;
  CV: number;
  SPI: number;
  CPI: number;
  EAC: number;
  ETC: number;
  TCPI: number;
  VAC: number;
  percent_complete: number;
  status: "on_track" | "over_budget" | "behind_schedule" | "over_budget_behind_schedule" | "under_budget" | "ahead_of_schedule";
}

export function getEVMStatus(metrics: EVMMetrics): EVMMetrics["status"] {
  const overBudget = metrics.CPI < 0.95;
  const behindSchedule = metrics.SPI < 0.95;
  const underBudget = metrics.CPI > 1.05;
  const aheadOfSchedule = metrics.SPI > 1.05;

  if (overBudget && behindSchedule) return "over_budget_behind_schedule";
  if (overBudget) return "over_budget";
  if (behindSchedule) return "behind_schedule";
  if (underBudget) return "under_budget";
  if (aheadOfSchedule) return "ahead_of_schedule";
  return "on_track";
}

export function calculateEVM(params: {
  BAC: number;
  PV: number;
  EV: number;
  AC: number;
}): EVMMetrics {
  const { BAC, PV, EV, AC } = params;

  const SV = EV - PV;
  const CV = EV - AC;
  const SPI = PV > 0 ? EV / PV : 1;
  const CPI = AC > 0 ? EV / AC : 1;
  const EAC = CPI > 0 ? BAC / CPI : BAC;
  const ETC = EAC - AC;
  const TCPI = BAC - AC > 0 ? (BAC - EV) / (BAC - AC) : 0;
  const VAC = BAC - EAC;
  const percent_complete = BAC > 0 ? (EV / BAC) * 100 : 0;

  const partial: Omit<EVMMetrics, "status"> = {
    BAC,
    PV,
    EV,
    AC,
    SV,
    CV,
    SPI,
    CPI,
    EAC,
    ETC,
    TCPI,
    VAC,
    percent_complete,
  };

  const status = getEVMStatus({ ...partial, status: "on_track" });

  return { ...partial, status };
}

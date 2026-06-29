export interface DayworkLabourLine {
  operativeType: string;
  hours: number;
  day_rate: number;
  overtime_hours?: number;
  overtime_multiplier?: number;
  total: number;
}

export interface DayworkPlantLine {
  description: string;
  quantity: number;
  unit: string;
  rate: number;
  total: number;
}

export interface DayworkMaterialLine {
  description: string;
  quantity: number;
  unit: string;
  unit_rate: number;
  uplift_percent: number;
  total: number;
}

export interface DayworkSheet {
  labour_total: number;
  plant_total: number;
  material_total: number;
  subtotal: number;
  overhead_percent: number;
  overhead_amount: number;
  profit_percent: number;
  profit_amount: number;
  grand_total: number;
}

export function calculateLabourLine(
  line: Omit<DayworkLabourLine, "total">
): DayworkLabourLine {
  const multiplier = line.overtime_multiplier ?? 1.5;
  const regularTotal = line.hours * line.day_rate;
  const overtimeTotal = (line.overtime_hours ?? 0) * line.day_rate * multiplier;
  return { ...line, total: regularTotal + overtimeTotal };
}

export function calculatePlantLine(
  line: Omit<DayworkPlantLine, "total">
): DayworkPlantLine {
  return { ...line, total: line.quantity * line.rate };
}

export function calculateMaterialLine(
  line: Omit<DayworkMaterialLine, "total">
): DayworkMaterialLine {
  const total = line.quantity * line.unit_rate * (1 + line.uplift_percent / 100);
  return { ...line, total };
}

export function calculateDayworkSheet(params: {
  labour_lines: DayworkLabourLine[];
  plant_lines: DayworkPlantLine[];
  material_lines: DayworkMaterialLine[];
  overhead_percent?: number;
  profit_percent?: number;
}): DayworkSheet {
  const overhead_percent = params.overhead_percent ?? 15;
  const profit_percent = params.profit_percent ?? 10;

  const labour_total = params.labour_lines.reduce((s, l) => s + l.total, 0);
  const plant_total = params.plant_lines.reduce((s, l) => s + l.total, 0);
  const material_total = params.material_lines.reduce((s, l) => s + l.total, 0);
  const subtotal = labour_total + plant_total + material_total;
  const overhead_amount = subtotal * (overhead_percent / 100);
  const profit_amount = (subtotal + overhead_amount) * (profit_percent / 100);
  const grand_total = subtotal + overhead_amount + profit_amount;

  return {
    labour_total,
    plant_total,
    material_total,
    subtotal,
    overhead_percent,
    overhead_amount,
    profit_percent,
    profit_amount,
    grand_total,
  };
}

export interface PaymentTimeline {
  application_date: Date;
  due_date: Date;
  final_date_for_payment: Date;
  pln_cutoff: Date;
  is_pln_compliant: boolean;
  days_to_due_date: number;
  days_to_pln_cutoff: number;
  status: "on_track" | "pln_overdue" | "payment_overdue" | "suspended" | "paid";
}

function addCalendarDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function diffDays(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000);
}

export function calculatePaymentTimeline(params: {
  application_date: string | Date;
  payment_terms_days: number;
  prescribed_period_days: number;
  pln_issued_at?: string | Date | null;
  suspended_at?: string | Date | null;
  paid_at?: string | Date | null;
}): PaymentTimeline {
  const application_date =
    params.application_date instanceof Date
      ? params.application_date
      : new Date(params.application_date);

  const due_date = addCalendarDays(application_date, params.payment_terms_days);
  const final_date_for_payment = due_date;
  const pln_cutoff = addCalendarDays(
    final_date_for_payment,
    -params.prescribed_period_days
  );

  const now = new Date();
  const days_to_due_date = diffDays(now, due_date);
  const days_to_pln_cutoff = diffDays(now, pln_cutoff);

  const pln_issued_at =
    params.pln_issued_at != null
      ? params.pln_issued_at instanceof Date
        ? params.pln_issued_at
        : new Date(params.pln_issued_at)
      : null;

  const is_pln_compliant =
    pln_issued_at != null ? pln_issued_at <= pln_cutoff : true;

  let status: PaymentTimeline["status"];

  if (params.suspended_at != null) {
    status = "suspended";
  } else if (params.paid_at != null) {
    status = "paid";
  } else if (pln_issued_at != null && !is_pln_compliant) {
    status = "pln_overdue";
  } else if (now > final_date_for_payment && params.paid_at == null) {
    status = "payment_overdue";
  } else {
    status = "on_track";
  }

  return {
    application_date,
    due_date,
    final_date_for_payment,
    pln_cutoff,
    is_pln_compliant,
    days_to_due_date,
    days_to_pln_cutoff,
    status,
  };
}

export function calculateSuspensionReinstatementDate(
  suspendedAt: Date,
  daysNotice: number
): Date {
  return addCalendarDays(suspendedAt, daysNotice);
}

export function isPaymentDue(timeline: PaymentTimeline): boolean {
  return new Date() >= timeline.final_date_for_payment;
}

export function getDaysOverdue(timeline: PaymentTimeline): number {
  const now = new Date();
  if (now <= timeline.final_date_for_payment) return 0;
  return diffDays(timeline.final_date_for_payment, now);
}

// ── Verification test cases ───────────────────────────────────────────────────
// PLN cutoff formula: final_date_for_payment - prescribed_period_days
// final_date_for_payment = application_date + payment_terms_days
// Example: app_date 2024-01-01 + 30 days = 2024-01-31; pln_cutoff = 2024-01-31 - 5 = 2024-01-26
export const HGCRA_TEST_CASES = [
  {
    input: {
      application_date: '2024-01-01',
      payment_terms_days: 30,
      prescribed_period_days: 5,
    },
    expected: {
      due_date_offset_days: 30,   // +30 from application_date → 2024-01-31
      pln_cutoff_offset_days: 25, // +30 -5 from application_date → 2024-01-26
    },
  },
] as const;

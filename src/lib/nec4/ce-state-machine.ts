// All date calculations use calendar days — most practitioners use calendar days
// unless the contract specifies otherwise.

export const NEC4_CE_STATES = [
  'pm_instruction_issued',
  'ce_notified',
  'quotation_requested',
  'quotation_submitted',
  'pm_response_received',
  'accepted',
  'deemed_accepted',
  'implemented',
  'disputed',
  'withdrawn',
] as const;

export type NEC4CEState = (typeof NEC4_CE_STATES)[number];

// Standard NEC4 timeframes (calendar days)
const QUOTATION_PERIOD_DAYS = 21;
const ACCEPTANCE_PERIOD_DAYS = 14;

export function calculateQuotationDueDate(
  instructionDate: Date,
  agreedWeeks?: number
): Date {
  const days = agreedWeeks ? agreedWeeks * 7 : QUOTATION_PERIOD_DAYS;
  const result = new Date(instructionDate);
  result.setDate(result.getDate() + days);
  return result;
}

export function calculateAcceptanceDueDate(submissionDate: Date): Date {
  const result = new Date(submissionDate);
  result.setDate(result.getDate() + ACCEPTANCE_PERIOD_DAYS);
  return result;
}

export function calculateDeemedAcceptedDate(acceptanceDueDate: Date): Date {
  const result = new Date(acceptanceDueDate);
  result.setDate(result.getDate() + 1);
  return result;
}

export function isCEDeemedAccepted(workflow: {
  state: NEC4CEState;
  acceptance_due_date?: string | null;
  pm_response_at?: string | null;
}): boolean {
  if (workflow.state === 'deemed_accepted') return true;
  if (!workflow.acceptance_due_date) return false;
  if (workflow.pm_response_at) return false; // PM responded, so not deemed accepted
  return new Date() > new Date(workflow.acceptance_due_date);
}

export type UrgencyLevel =
  | 'overdue'
  | 'critical'
  | 'warning'
  | 'on_track'
  | 'no_deadline';

export function getCEUrgencyLevel(workflow: {
  state: NEC4CEState;
  quotation_due_date?: string | null;
  acceptance_due_date?: string | null;
}): UrgencyLevel {
  const now = new Date();

  // Which deadline is relevant for current state?
  let deadline: Date | null = null;
  if (
    ['ce_notified', 'quotation_requested'].includes(workflow.state) &&
    workflow.quotation_due_date
  ) {
    deadline = new Date(workflow.quotation_due_date);
  } else if (
    workflow.state === 'quotation_submitted' &&
    workflow.acceptance_due_date
  ) {
    deadline = new Date(workflow.acceptance_due_date);
  }

  if (!deadline) return 'no_deadline';

  const daysUntil =
    (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

  if (daysUntil < 0) return 'overdue';
  if (daysUntil <= 2) return 'critical';
  if (daysUntil <= 7) return 'warning';
  return 'on_track';
}

export function getNextCEAction(state: NEC4CEState): string {
  const actions: Record<NEC4CEState, string> = {
    pm_instruction_issued: 'Notify the PM of this CE under clause 61.3',
    ce_notified: 'Submit quotation within 21 days (clause 62.3)',
    quotation_requested: 'Submit quotation by the agreed date',
    quotation_submitted: 'Awaiting PM response within 14 days (clause 62.3)',
    pm_response_received: 'Review PM response and confirm acceptance',
    accepted: 'Implement the CE and record in programme',
    deemed_accepted:
      'CE is deemed accepted — notify PM and implement',
    implemented: 'CE implemented — record in final account',
    disputed: 'Refer to dispute resolution procedure',
    withdrawn: 'CE has been withdrawn — no further action',
  };
  return actions[state];
}

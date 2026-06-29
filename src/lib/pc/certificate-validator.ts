export interface PCValidation {
  can_issue: boolean;
  errors: string[];
  warnings: string[];
}

export function validatePCCertificate(params: {
  proposed_pc_date: Date;
  contract_start_date: Date;
  contract_end_date?: Date;
  existing_pc?: { pc_date: Date; certificate_number: string } | null;
}): PCValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  if (params.existing_pc) {
    errors.push(
      `Practical Completion has already been issued (Certificate ${params.existing_pc.certificate_number} on ${params.existing_pc.pc_date.toLocaleDateString("en-GB")}). Cannot issue a second certificate.`
    );
  }

  if (params.proposed_pc_date > today) {
    errors.push("Practical Completion date cannot be in the future.");
  }

  if (params.proposed_pc_date < params.contract_start_date) {
    errors.push("Practical Completion date cannot be before the contract start date.");
  }

  const thirtyDaysAgo = new Date(todayStart);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  if (params.proposed_pc_date < thirtyDaysAgo) {
    warnings.push(
      "Practical Completion date is more than 30 days in the past. Ensure this backdating is authorised and documented."
    );
  }

  return {
    can_issue: errors.length === 0,
    errors,
    warnings,
  };
}

export function calculateDLPEndDate(pc_date: Date, dlp_months: number): Date {
  const end = new Date(pc_date);
  end.setMonth(end.getMonth() + dlp_months);
  return end;
}

export function calculateMakeGoodDeadline(dlp_end_date: Date, days = 14): Date {
  const deadline = new Date(dlp_end_date);
  deadline.setDate(deadline.getDate() - days);
  return deadline;
}

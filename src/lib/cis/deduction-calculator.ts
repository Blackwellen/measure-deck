export type CISStatus = 'gross' | 'net' | 'higher_rate' | 'unverified';

export interface CISDeduction {
  gross_payment: number;
  materials_cost: number;
  labour_cost: number;
  deduction_rate: number;
  deduction_amount: number;
  net_payment: number;
  cis_status: CISStatus;
  is_vat_reverse_charge: boolean;
  vat_amount: number;
}

export function getCISDeductionRate(status: CISStatus): number {
  switch (status) {
    case 'gross':        return 0;
    case 'net':          return 0.20;
    case 'higher_rate':  return 0.30;
    case 'unverified':   return 0.30;
  }
}

export function calculateCISDeduction(params: {
  gross_payment: number;
  materials_cost: number;
  cis_status: CISStatus;
  is_vat_reverse_charge?: boolean;
  vat_rate?: number;
}): CISDeduction {
  const {
    gross_payment,
    materials_cost,
    cis_status,
    is_vat_reverse_charge = false,
    vat_rate = 0.20,
  } = params;

  const labour_cost = Math.max(0, gross_payment - materials_cost);
  const deduction_rate = getCISDeductionRate(cis_status);
  const deduction_amount = parseFloat((labour_cost * deduction_rate).toFixed(2));
  const net_payment = parseFloat((gross_payment - deduction_amount).toFixed(2));
  const vat_amount = is_vat_reverse_charge
    ? 0
    : parseFloat((gross_payment * vat_rate).toFixed(2));

  return {
    gross_payment,
    materials_cost,
    labour_cost,
    deduction_rate,
    deduction_amount,
    net_payment,
    cis_status,
    is_vat_reverse_charge,
    vat_amount,
  };
}

export function formatCIS300XML(params: {
  contractor_utr: string;
  contractor_name: string;
  tax_month: string;
  payment_lines: Array<{
    subcontractor_utr: string;
    subcontractor_name: string;
    gross_payment: number;
    materials_cost: number;
    deduction_amount: number;
    cis_status: CISStatus;
  }>;
}): string {
  const { contractor_utr, contractor_name, tax_month, payment_lines } = params;

  const [year, month] = tax_month.split('-');
  const lastDayOfMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
  const taxMonthEnd = `${year}-${month}-${String(lastDayOfMonth).padStart(2, '0')}`;

  const subcontractorLines = payment_lines.map((line) => {
    const employed = line.cis_status === 'net' || line.cis_status === 'gross' ? 'false' : 'false';
    const rateCode =
      line.cis_status === 'gross' ? 'Gross'
      : line.cis_status === 'net' ? 'Net'
      : 'Higher';

    return `  <SubcontractorReturn>
    <SubcontractorDetails>
      <UTR>${escapeXml(line.subcontractor_utr)}</UTR>
      <Name>${escapeXml(line.subcontractor_name)}</Name>
    </SubcontractorDetails>
    <GrossPayment>${line.gross_payment.toFixed(2)}</GrossPayment>
    <MaterialsCost>${line.materials_cost.toFixed(2)}</MaterialsCost>
    <TaxDeducted>${line.deduction_amount.toFixed(2)}</TaxDeducted>
    <DeductionRate>${rateCode}</DeductionRate>
    <VerifiedEmployed>${employed}</VerifiedEmployed>
  </SubcontractorReturn>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<CISMonthlyReturn xmlns="http://www.govtalk.gov.uk/taxation/CIS/2007/07">
  <TaxMonthEnd>${taxMonthEnd}</TaxMonthEnd>
  <ContractorDetails>
    <UTR>${escapeXml(contractor_utr)}</UTR>
    <Name>${escapeXml(contractor_name)}</Name>
  </ContractorDetails>
${subcontractorLines}
</CISMonthlyReturn>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

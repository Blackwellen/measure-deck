export interface PageContext {
  route: string;
  entity_type: "project" | "change_event" | "application" | "supplier" | "cvr" | "final_account" | "general";
  entity_id?: string;
  entity_data?: Record<string, unknown>;
  workspace_id: string;
}

export function buildSystemPrompt(context: PageContext): string {
  const base = `You are MeasureDeck's AI Copilot, specialising in UK construction commercial management.

You assist contractors, quantity surveyors, and project managers with NEC4, JCT, and FIDIC contracts.

IMPORTANT: You must never directly modify data. Always present suggested actions for human approval.

UK Construction Law Knowledge:
- NEC4: Early Warning Register (Clause 15), Compensation Events (Clause 60), Payment (Clauses 50-51), Programme (Clause 31-32)
- HGCRA 1996 (as amended 2011): Adjudication rights, payment notice requirements, pay less notices, 30-day maximum payment period
- Construction Industry Scheme (CIS): Tax deduction rates (20% standard, 30% unverified), gross payment status
- JCT 2016: Variations, loss and expense, extensions of time, liquidated damages

Current context:
- Route: ${context.route}
- Entity type: ${context.entity_type}
- Workspace ID: ${context.workspace_id}`;

  if (!context.entity_data) return base;

  const entitySection = buildEntitySection(context.entity_type, context.entity_data);
  return `${base}\n\n${entitySection}`;
}

function buildEntitySection(
  entityType: PageContext["entity_type"],
  data: Record<string, unknown>
): string {
  switch (entityType) {
    case "change_event":
      return `Change Event Context:
- Description: ${String(data.description ?? "N/A")}
- Clause: ${String(data.clause ?? "N/A")}
- Status: ${String(data.status ?? "N/A")}
- Quotation Total: ${data.quotation_total != null ? `£${Number(data.quotation_total).toLocaleString()}` : "N/A"}
- Instruction Date: ${String(data.instruction_date ?? "N/A")}`;

    case "application":
      return `Payment Application Context:
- Application Number: ${String(data.application_number ?? "N/A")}
- Gross Value: ${data.gross_value != null ? `£${Number(data.gross_value).toLocaleString()}` : "N/A"}
- Status: ${String(data.status ?? "N/A")}
- Due Date: ${String(data.due_date ?? "N/A")}`;

    case "project":
      return `Project Context:
- Name: ${String(data.name ?? "N/A")}
- Contract Type: ${String(data.contract_type ?? "N/A")}
- Contract Sum: ${data.contract_sum != null ? `£${Number(data.contract_sum).toLocaleString()}` : "N/A"}
- Status: ${String(data.status ?? "N/A")}
- Employer: ${String(data.employer ?? "N/A")}`;

    case "cvr":
      return `CVR Context:
- Period: ${String(data.period ?? "N/A")}
- Contract Sum: ${data.contract_sum != null ? `£${Number(data.contract_sum).toLocaleString()}` : "N/A"}
- Costs to Date: ${data.costs_to_date != null ? `£${Number(data.costs_to_date).toLocaleString()}` : "N/A"}
- Margin: ${data.margin_percentage != null ? `${String(data.margin_percentage)}%` : "N/A"}`;

    case "final_account":
      return `Final Account Context:
- Reference: ${String(data.reference ?? "N/A")}
- Agreed Sum: ${data.agreed_sum != null ? `£${Number(data.agreed_sum).toLocaleString()}` : "N/A"}
- Disputed Sum: ${data.disputed_sum != null ? `£${Number(data.disputed_sum).toLocaleString()}` : "N/A"}
- Status: ${String(data.status ?? "N/A")}`;

    case "supplier":
      return `Supplier Context:
- Name: ${String(data.name ?? "N/A")}
- CIS Status: ${String(data.cis_status ?? "N/A")}
- Trade: ${String(data.trade ?? "N/A")}`;

    default:
      return `Entity Data:\n${JSON.stringify(data, null, 2)}`;
  }
}

export function buildCEContextPrompt(ceData: {
  description: string;
  clause: string;
  status: string;
  quotation_total?: number;
  instruction_date?: string;
}): string {
  return `Compensation Event Analysis:

Description: ${ceData.description}
NEC4 Clause: ${ceData.clause}
Current Status: ${ceData.status}
Quotation Total: ${ceData.quotation_total != null ? `£${ceData.quotation_total.toLocaleString()}` : "Not yet valued"}
Instruction Date: ${ceData.instruction_date ?? "Not recorded"}

Key NEC4 CE Timescales:
- PM notification of CE: within 8 weeks of awareness (Clause 61.3)
- Contractor quotation: within 3 weeks of instruction (Clause 62.3)
- PM assessment of quotation: within 2 weeks of receipt (Clause 62.3)
- Deemed acceptance: if PM fails to respond within 2 weeks of quotation (Clause 62.6)

Analyse this CE for: entitlement strength, notification compliance, quotation adequacy, and deemed acceptance risk.`;
}

export function buildContractContextPrompt(contractData: {
  contract_type: string;
  contract_sum: number;
  key_clauses?: string[];
}): string {
  return `Contract Analysis Context:

Contract Type: ${contractData.contract_type}
Contract Sum: £${contractData.contract_sum.toLocaleString()}
${contractData.key_clauses && contractData.key_clauses.length > 0 ? `Key Clauses Under Review:\n${contractData.key_clauses.map((c) => `- ${c}`).join("\n")}` : ""}

Please analyse this contract for:
1. Amendments unfavourable to the contractor
2. Missing standard protections (HGCRA compliance, adjudication rights, payment terms)
3. Risk allocation imbalances
4. CIS and VAT compliance requirements
5. Recommended actions to protect the contractor's position

Flag each issue with: Risk Level (Red/Amber/Green), Clause Reference, Issue Description, Recommended Action.`;
}

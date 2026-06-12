# MeasureDeck — Full Implementation Plan V1 → V2
## 56-Step / 9-Level Deep Build Roadmap
**Prepared:** June 2026 | **Status:** Pre-Implementation Planning  
**Principle:** Every feature built natively, zero expensive third-party API lock-in. Paid services are opt-in add-on modules.

---

## ARCHITECTURE PRINCIPLES

Before any level begins, these constraints govern every build decision:

1. **Zero-cost API first** — HMRC APIs (CIS, MTD, Companies House) are all free Gov.uk services. Use them. Paid data providers (Creditsafe, D&B, BCIS, Constructionline) are never required — manual upload paths always exist.
2. **Feature-flag everything new** — Every level's features land behind a flag (`getFlag("nec4_engine")`, `getFlag("hgcra_suite")` etc). Flip on per workspace. Never breaks existing users.
3. **DB migrations are additive only** — `ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`. Never drop, rename, or alter existing columns.
4. **`"use client"` on all interactive components** — No RSC state or event handlers. Data fetching via React Query. Forms via react-hook-form + zod.
5. **Supabase RLS pattern** — `workspace_id IN (SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid())`. No helper functions.
6. **Notification layer** — In-app (toast + bell icon) is always free. Email via Resend (already in stack, free tier 3,000/month). SMS/WhatsApp are opt-in add-on modules using bring-your-own credentials.
7. **File imports over live APIs where feasible** — Asta Powerproject: import XER file. MS Project: import XML/MPP export. This avoids integration licensing costs and works for 90% of workflows.
8. **AI uses existing copilot infrastructure** — All AI features use the existing AI copilot API layer already in MeasureDeck. No separate OpenAI/Anthropic costs visible to the user.

---

## LEVEL 1 — FOUNDATION & SCHEMA HARDENING
**Goal:** Lock down the data model for all V2 features before any UI is built. One bad migration later is catastrophic.  
**Estimated time:** 1 week  
**Steps: 1–6**

---

### Step 1 — Migration 004: NEC4 & Contract Workflow Tables

**New tables:**
```sql
-- NEC4 CE State Machine
CREATE TABLE IF NOT EXISTS ce_workflow_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  change_event_id uuid NOT NULL REFERENCES change_events(id),
  state text NOT NULL CHECK (state IN (
    'pm_instruction_issued',
    'ce_notified',
    'quotation_instructed',
    'quotation_submitted',
    'quotation_under_assessment',
    'quotation_accepted',
    'contractors_assessment_issued',
    'implemented',
    'disputed',
    'withdrawn'
  )),
  state_entered_at timestamptz NOT NULL DEFAULT now(),
  state_entered_by uuid REFERENCES profiles(id),
  quotation_due_date timestamptz,
  acceptance_due_date timestamptz,
  deemed_accepted_at timestamptz,
  clause_reference text, -- e.g. '60.1(1)', '60.1(18)'
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Early Warning Register
CREATE TABLE IF NOT EXISTS early_warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  project_id uuid NOT NULL REFERENCES projects(id),
  ew_number text NOT NULL,
  title text NOT NULL,
  description text,
  risk_owner_id uuid REFERENCES profiles(id),
  risk_reduction_meeting_date timestamptz,
  linked_ce_id uuid REFERENCES change_events(id),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','actioned','closed','converted_to_ce')),
  impact_cost numeric(14,2),
  impact_programme_days integer,
  notified_at timestamptz NOT NULL DEFAULT now(),
  notified_by uuid REFERENCES profiles(id),
  workspace_id_rls uuid GENERATED ALWAYS AS (workspace_id) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- NEC4 Programme Notifications
CREATE TABLE IF NOT EXISTS programme_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  project_id uuid NOT NULL REFERENCES projects(id),
  revision text NOT NULL,
  submitted_at timestamptz NOT NULL,
  submitted_by uuid REFERENCES profiles(id),
  due_date timestamptz NOT NULL,
  pm_response text CHECK (pm_response IN ('accepted','not_accepted','awaiting')),
  pm_responded_at timestamptz,
  rejection_reasons text,
  is_accepted_baseline boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**Altered tables (additive only):**
```sql
-- Extend change_events with NEC4 machinery
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS nec4_clause text; -- 60.1(1) through 60.1(21)
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS notification_date timestamptz;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS pm_instruction_ref text;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS early_warning_id uuid REFERENCES early_warnings(id);
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS contractor_own_assessment boolean DEFAULT false;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS implemented_ce_amount numeric(14,2);
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS programme_impact_days integer;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS terminal_float_consumed integer;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS eot_granted_days integer;
```

**RLS policies** — mirror existing workspace_memberships pattern on all new tables.

---

### Step 2 — Migration 005: HGCRA Payment Compliance Tables

```sql
-- Pay Less Notices
CREATE TABLE IF NOT EXISTS pay_less_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  application_id uuid NOT NULL REFERENCES applications(id),
  notified_sum numeric(14,2) NOT NULL,
  withheld_amount numeric(14,2) NOT NULL,
  amount_to_pay numeric(14,2) GENERATED ALWAYS AS (notified_sum - withheld_amount) STORED,
  grounds_for_withholding text NOT NULL,
  prescribed_period_end timestamptz NOT NULL, -- must be issued before this
  issued_at timestamptz,
  issued_by uuid REFERENCES profiles(id),
  received_confirmation_at timestamptz,
  pdf_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','issued','received','overdue_to_issue','not_required')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Right to Suspend Notices (HGCRA S112)
CREATE TABLE IF NOT EXISTS suspension_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  application_id uuid NOT NULL REFERENCES applications(id),
  grounds text NOT NULL,
  notice_issued_at timestamptz NOT NULL DEFAULT now(),
  suspension_effective_at timestamptz, -- 7 days after notice
  suspension_lifted_at timestamptz,
  days_suspended integer GENERATED ALWAYS AS (
    EXTRACT(day FROM (COALESCE(suspension_lifted_at, now()) - COALESCE(suspension_effective_at, suspension_noticed_at)))::integer
  ) STORED,
  eot_entitlement_days integer,
  pdf_url text,
  status text NOT NULL DEFAULT 'notice_issued' CHECK (status IN ('notice_issued','active','lifted','withdrawn')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Payment Notice Timelines
ALTER TABLE applications ADD COLUMN IF NOT EXISTS contract_type text CHECK (contract_type IN ('JCT','NEC4','bespoke'));
ALTER TABLE applications ADD COLUMN IF NOT EXISTS payment_notice_due_date timestamptz;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS final_date_for_payment timestamptz;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS prescribed_period_days integer DEFAULT 7;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS notified_sum numeric(14,2);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS hgcra_compliant boolean DEFAULT true;
```

---

### Step 3 — Migration 006: CIS, Retention & Subcontract Tables

```sql
-- CIS Subcontractor Records
CREATE TABLE IF NOT EXISTS cis_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  supplier_id uuid NOT NULL REFERENCES suppliers(id),
  utr text, -- Unique Taxpayer Reference
  company_registration_number text,
  verification_number text,
  verification_date timestamptz,
  payment_status text NOT NULL DEFAULT 'pending_verification' 
    CHECK (payment_status IN ('gross','net','higher_rate','unmatched','pending_verification','not_registered')),
  verification_expires_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- CIS Monthly Returns
CREATE TABLE IF NOT EXISTS cis_monthly_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  tax_month text NOT NULL, -- YYYY-MM format (e.g. 2026-05)
  return_period_start date NOT NULL,
  return_period_end date NOT NULL,
  total_payments numeric(14,2) NOT NULL DEFAULT 0,
  total_deductions numeric(14,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','submitted','accepted','amended')),
  hmrc_submission_ref text,
  submitted_at timestamptz,
  submitted_by uuid REFERENCES profiles(id),
  xml_payload text, -- store the CIS300 XML
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, tax_month)
);

-- CIS Payment Lines (individual subcontractor entries per return)
CREATE TABLE IF NOT EXISTS cis_payment_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  return_id uuid NOT NULL REFERENCES cis_monthly_returns(id),
  supplier_id uuid NOT NULL REFERENCES suppliers(id),
  application_id uuid REFERENCES applications(id),
  gross_payment numeric(14,2) NOT NULL,
  materials_cost numeric(14,2) DEFAULT 0,
  labour_cost numeric(14,2) GENERATED ALWAYS AS (gross_payment - materials_cost) STORED,
  deduction_rate numeric(5,2) NOT NULL, -- 0, 20, or 30
  deduction_amount numeric(14,2) NOT NULL,
  net_payment numeric(14,2) GENERATED ALWAYS AS (gross_payment - deduction_amount) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Retention Ledger
CREATE TABLE IF NOT EXISTS retention_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  project_id uuid NOT NULL REFERENCES projects(id),
  entry_type text NOT NULL CHECK (entry_type IN ('deduction','release_first','release_final','bond_substitution')),
  counterparty_type text NOT NULL CHECK (counterparty_type IN ('client','subcontractor')),
  counterparty_id uuid, -- references suppliers(id) for subcontractors
  application_id uuid REFERENCES applications(id),
  retention_rate numeric(5,3) NOT NULL, -- e.g. 0.05 for 5%
  gross_value numeric(14,2) NOT NULL,
  retention_amount numeric(14,2) NOT NULL,
  cumulative_retention numeric(14,2),
  moiety text CHECK (moiety IN ('first','second')),
  release_trigger text CHECK (release_trigger IN ('practical_completion','defects_liability_expiry','sectional_pc','bond')),
  released_at timestamptz,
  due_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Subcontract Orders
CREATE TABLE IF NOT EXISTS subcontract_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  project_id uuid NOT NULL REFERENCES projects(id),
  supplier_id uuid NOT NULL REFERENCES suppliers(id),
  order_number text NOT NULL,
  order_title text NOT NULL,
  contract_form text NOT NULL CHECK (contract_form IN ('DOM/1','NEC4_ECC','NEC4_ECS','JCT_SBC','JCT_DB','bespoke')),
  scope_description text,
  contract_sum numeric(14,2),
  budget_package_ref text,
  retention_rate numeric(5,3) DEFAULT 0.05,
  dlp_months integer DEFAULT 12,
  payment_terms_days integer DEFAULT 30,
  issued_date date,
  start_date date,
  completion_date date,
  status text NOT NULL DEFAULT 'draft' 
    CHECK (status IN ('draft','issued','signed','active','completed','terminated')),
  total_certified numeric(14,2) DEFAULT 0,
  total_paid numeric(14,2) DEFAULT 0,
  retention_held numeric(14,2) DEFAULT 0,
  final_account_value numeric(14,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

---

### Step 4 — Migration 007: Analytics, Adjudication & Practical Completion Tables

```sql
-- Adjudication Cases
CREATE TABLE IF NOT EXISTS adjudication_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  project_id uuid NOT NULL REFERENCES projects(id),
  case_reference text NOT NULL,
  claimant text NOT NULL,
  respondent text NOT NULL,
  adjudicator_name text,
  adjudicator_nominating_body text,
  dispute_amount numeric(14,2),
  referral_date date,
  response_due_date date,
  reply_due_date date,
  decision_date date,
  outcome text CHECK (outcome IN ('awarded_in_full','awarded_partial','dismissed','settled','withdrawn')),
  award_amount numeric(14,2),
  status text NOT NULL DEFAULT 'pre_referral' 
    CHECK (status IN ('pre_referral','referred','response_stage','reply_stage','decided','settled','appealed')),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Practical Completion
CREATE TABLE IF NOT EXISTS practical_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  project_id uuid NOT NULL REFERENCES projects(id),
  section_reference text, -- null = whole works
  anticipated_pc_date date,
  actual_pc_date date,
  certificate_issued_at timestamptz,
  certificate_number text,
  dlp_end_date date,
  making_good_certificate_date date,
  outstanding_items_count integer DEFAULT 0,
  status text NOT NULL DEFAULT 'pre_pc' 
    CHECK (status IN ('pre_pc','pc_achieved','dlp_running','dlp_expired','certificate_issued')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Snagging Items
CREATE TABLE IF NOT EXISTS snagging_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  project_id uuid NOT NULL REFERENCES projects(id),
  pc_id uuid REFERENCES practical_completions(id),
  item_number text NOT NULL,
  description text NOT NULL,
  location text,
  drawing_ref text,
  responsible_party text,
  priority text DEFAULT 'medium' CHECK (priority IN ('critical','high','medium','low')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','completed','disputed','waived')),
  raised_date date NOT NULL DEFAULT CURRENT_DATE,
  due_date date,
  completed_date date,
  photo_urls text[],
  notes text,
  created_by uuid REFERENCES profiles(id),
  assigned_to uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Cashflow Forecast
CREATE TABLE IF NOT EXISTS cashflow_forecasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  project_id uuid NOT NULL REFERENCES projects(id),
  forecast_date date NOT NULL,
  month_year text NOT NULL, -- YYYY-MM
  revenue_planned numeric(14,2) DEFAULT 0,
  cost_planned numeric(14,2) DEFAULT 0,
  revenue_actual numeric(14,2),
  cost_actual numeric(14,2),
  retention_debtor numeric(14,2) DEFAULT 0,
  retention_creditor numeric(14,2) DEFAULT 0,
  net_cashflow numeric(14,2) GENERATED ALWAYS AS (
    COALESCE(revenue_planned,0) - COALESCE(cost_planned,0)
  ) STORED,
  cumulative_cashflow numeric(14,2),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, month_year)
);
```

---

### Step 5 — Feature Flag Registry Expansion

Add to `src/lib/feature-flags.ts` (or wherever flags are defined):

```typescript
// New V2 feature flags — all default false
export const V2_FLAGS = {
  nec4_ce_engine:         "nec4_ce_engine",         // Level 2: NEC4 CE Clock
  hgcra_suite:            "hgcra_suite",             // Level 3: PLN/S112
  cis_compliance:         "cis_compliance",           // Level 4: CIS HMRC
  retention_module:       "retention_module",         // Level 5: Retention ledger
  cashflow_forecasting:   "cashflow_forecasting",     // Level 5: S-curve
  evm_dashboard:          "evm_dashboard",            // Level 5: EVM
  subcontract_orders:     "subcontract_orders",       // Level 6: SC orders
  supply_chain_kyc:       "supply_chain_kyc",         // Level 6: Companies House
  pc_snagging:            "pc_snagging",              // Level 6: PC + snag
  ai_contract_analyser:   "ai_contract_analyser",     // Level 7: AI contract risk
  ai_ce_identifier:       "ai_ce_identifier",         // Level 7: AI CE finder
  ai_daywork_capture:     "ai_daywork_capture",       // Level 7: Photo-to-daywork
  client_portal:          "client_portal",            // Level 8: Client portal
  cross_project_analytics:"cross_project_analytics",  // Level 8: BI layer
  adjudication_module:    "adjudication_module",      // Level 8: Adj bundle
  asta_import:            "asta_import",              // Level 8: XER import
  programme_notifications:"programme_notifications",  // Level 9: NEC4 cl.32
  delay_analysis:         "delay_analysis",           // Level 9: EOT/delay
  fluctuations_module:    "fluctuations_module",      // Level 9: BCIS indices
  mobile_dayworks:        "mobile_dayworks",          // Level 9: Mobile app
} as const;
```

---

### Step 6 — Shared Component Library Additions

Build these reusable components before any feature-specific UI:

**`src/components/ui/countdown-clock.tsx`** — Animated countdown to a deadline. Props: `deadline: Date`, `label: string`, `urgencyThresholdDays: number`. Turns amber < threshold, red < 2 days, flashes when overdue.

**`src/components/ui/compliance-badge.tsx`** — Status badge for compliance states. Variants: `compliant`, `at_risk`, `non_compliant`, `expired`, `pending`. Used across CIS, HGCRA, supply chain.

**`src/components/ui/pdf-generator.tsx`** — Client-side PDF generation wrapper using `@react-pdf/renderer` (already add to dependencies). Renders a standard MeasureDeck branded PDF for notices, certificates, and returns.

**`src/components/ui/stepper-vertical.tsx`** — Vertical process stepper for workflow state machines (CE states, payment timelines). Shows current state, past states (with timestamps), and upcoming states.

**`src/components/ui/risk-matrix.tsx`** — 5×5 likelihood × impact risk matrix. Used in EWR and delay analysis.

**`src/components/ui/s-curve-chart.tsx`** — Recharts composite chart: planned S-curve (area), actual S-curve (line), forecast (dashed line). Reusable across cashflow and EVM.

---

## LEVEL 2 — NEC4 CE QUOTATION CLOCK & WORKFLOW ENGINE
**Goal:** The #1 commercial differentiator. Full NEC4 clause 60/61/62/63/64 workflow with automated statutory deadlines.  
**Estimated time:** 2–3 weeks  
**Feature flag:** `nec4_ce_engine`  
**Steps: 7–13**

---

### Step 7 — NEC4 CE State Machine (Backend Logic)

**File:** `src/lib/nec4/ce-state-machine.ts`

Define the full state machine for a Compensation Event under NEC4 ECC:

```
PM Instruction / CE Notification
    ↓  [Day 0: CE notified — clause 61.1/61.3]
Quotation Instructed by PM
    ↓  [Day 0: quotation instruction — clause 61.4]
Quotation Due Date [Day +21 or agreed period — clause 62.3]
    ↓  Contractor submits quotation
PM Assessment Period [Day +14 — clause 62.3]
    ↓  PM accepts OR PM does not respond
    ├─ Accepted → Implemented CE [clause 65.1]
    ├─ PM counter-proposal → Revised quotation cycle
    ├─ Contractor's assessment [PM fails to respond in time — clause 64.3]
    └─ Deemed accepted [PM fails — clause 62.6]  ← AUTO-FLAG THIS
```

**Key functions:**
- `calculateQuotationDueDate(instructionDate, agreedWeeks?)` → `Date`
- `calculateAcceptanceDueDate(submissionDate)` → `Date` (14 days after submission)
- `calculateDeemedAcceptedDate(acceptanceDueDate)` → `Date`
- `isCEDeemedAccepted(ce: CEWorkflowState)` → `boolean`
- `getCEUrgencyLevel(ce: CEWorkflowState)` → `'normal' | 'amber' | 'red' | 'overdue'`
- `getNextCEAction(state: CEState)` → `{ action: string, dueBy: Date, clause: string }`

**NEC4 clause 60.1 categories** — export as const array with code, description, and which party bears risk:
```typescript
export const NEC4_CE_CATEGORIES = [
  { code: "60.1(1)",  desc: "PM instruction changing the Works Information", risk: "Employer" },
  { code: "60.1(2)",  desc: "Employer fails to give access to Site", risk: "Employer" },
  { code: "60.1(3)",  desc: "Employer fails to provide something by the agreed date", risk: "Employer" },
  { code: "60.1(4)",  desc: "PM instruction stopping or not starting work", risk: "Employer" },
  { code: "60.1(5)",  desc: "Work by Employer/Others (clause 25.1)", risk: "Employer" },
  { code: "60.1(6)",  desc: "PM instruction for dealing with object of value/interest", risk: "Employer" },
  { code: "60.1(7)",  desc: "PM changes decision previously communicated", risk: "Employer" },
  { code: "60.1(8)",  desc: "Works Information incorrect physical conditions", risk: "Employer" },
  { code: "60.1(9)",  desc: "Physical conditions encountered — unforeseen", risk: "Employer" },
  { code: "60.1(10)", desc: "Weather measurement exceeds statistical threshold (1-in-10 year)", risk: "Employer" },
  { code: "60.1(11)", desc: "Employer event under ECC clause 80.1", risk: "Employer" },
  { code: "60.1(12)", desc: "PM instruction to accelerate", risk: "Employer" },
  { code: "60.1(13)", desc: "PM instruction changing key date/condition", risk: "Employer" },
  { code: "60.1(14)", desc: "Employer prevents test/inspection", risk: "Employer" },
  { code: "60.1(15)", desc: "PM certifies a Defect they caused", risk: "Employer" },
  { code: "60.1(16)", desc: "PM fails to reply to communication within contract period", risk: "Employer" },
  { code: "60.1(17)", desc: "PM notifies correction to Defect they accept", risk: "Employer" },
  { code: "60.1(18)", desc: "Breach of contract by Employer", risk: "Employer" },
  { code: "60.1(19)", desc: "Right to terminate under NEC conditions", risk: "Employer" },
  { code: "60.1(20)", desc: "Prevention event (force majeure)", risk: "Employer" },
  { code: "60.1(21)", desc: "Z-clause CE (contract-specific)", risk: "Project-specific" },
] as const;
```

---

### Step 8 — NEC4 CE Workflow UI — Change Event Detail Enhancement

**File:** `src/app/(app)/changes/[changeEventId]/page.tsx`

Rebuild/enhance the change event detail page to include an NEC4-specific workflow tab (gated by `nec4_ce_engine` flag). Add:

- **Workflow Status Panel** — vertical stepper showing current CE state with timestamps. Next required action highlighted with countdown clock. Clause reference displayed alongside each step.
- **Deemed Acceptance Warning** — if PM has not responded within 14 days of contractor's submission, display a prominent amber/red banner: "This CE may be deemed accepted under clause 62.6. PM response was due [date]. Contractor's assessment may now be submitted."
- **CE Programme Impact Panel** — input: delay to planned Completion (days), terminal float consumed (days), EOT granted (days). Links to programme notifications.
- **Quotation Builder** — tabbed breakdown: People (resources × rates × time), Equipment, Materials, Subcontract, Risk Allowance, Fee percentage. Calculates total quotation value.
- **Disallowed Costs Flag** — for NEC Options C/D, flag line items as defined cost or disallowed.

---

### Step 9 — Early Warning Register Module

**File:** `src/app/(app)/early-warnings/page.tsx` (new page)  
**File:** `src/app/(app)/early-warnings/[ewId]/page.tsx` (new detail page)

**List page features:**
- EWR table: EW number, title, risk owner, impact (£ and days), status, linked CE (if converted)
- KPI strip: open EWs, total cost risk exposure, EWs converted to CEs this month, overdue mitigation actions
- Filter by: status, risk owner, date range, impact threshold
- "Raise EW" button → opens EWRWizard (3 steps: Risk Details → Mitigation Plan → Notify PM)
- Risk matrix quadrant chart (likelihood × impact)

**Detail page features:**
- 5 tabs: Details, Mitigation Actions, Risk Reduction Meetings, Linked CE, Audit
- Risk reduction meeting scheduler (date + attendees + minutes upload)
- "Convert to CE" action — pre-fills CE notification with EW data, links them bidirectionally
- Print as NEC4 clause 15.1 notification (PM Early Warning)

---

### Step 10 — NEC4 CE Notifications Dashboard

**File:** `src/app/(app)/changes/nec4-dashboard/page.tsx` (new page)

The "command centre" for all NEC4 CE activity across a project:

**Three-panel layout:**
1. **Overdue Actions** (red) — CEs where the deadline has passed with no response
2. **Due This Week** (amber) — CEs where action is required within 7 days
3. **On Track** (green) — CEs progressing within prescribed periods

**KPI strip:**
- Total CEs notified
- Total CE value (accepted + pending)
- CEs at risk of deemed acceptance
- Average CE resolution time (days)
- Employer risk events vs Contractor risk events

**Activity timeline** — chronological feed of all CE events: notifications, quotations, acceptances, programme impacts.

**Export** — CEs to Excel in standard format for QS reporting.

---

### Step 11 — NEC4 CE Wizard Enhancement

**File:** `src/components/wizards/ce-wizard.tsx` (extend existing ChangeWizard)

Add NEC4-specific steps (shown only when project contract type = NEC4):

- **Step 1.5 (insert between existing steps):** NEC4 Clause Selection — dropdown of all 60.1(1)–(21) categories with descriptions. Multi-select allowed (complex CEs can span multiple clauses). Risk party auto-populated.
- **Step 2.5:** Notification Obligations — system calculates: "Under clause 61.3, you must notify this CE within 8 weeks of becoming aware. Based on the date you entered, this notification is [on time / [X] days late — entitlement may be at risk]."
- **Step 3.5 (after submission):** Auto-generate quotation due date (+21 working days default, or agreed period), acceptance due date (+14 days from quotation), and deemed acceptance date. Create calendar reminders.

---

### Step 12 — Programme Delay Notification Register

**File:** `src/app/(app)/programmes/page.tsx` (new page)

NEC4 clause 32 programme submission tracking:

- Table of programme revisions: revision letter, submitted date, PM accepted/rejected, rejection reasons, baseline status
- 8-week rolling calendar: next programme submission due date (clause 32.1 — every 8 weeks or as agreed)
- Notification dashboard: overdue submissions flagged in red
- "Submit Revised Programme" action → logs submission, starts acceptance clock (2 weeks per clause 31.3)
- PM acceptance/non-acceptance record with reasons (non-acceptance: specific objections per clause 31.3)
- Accepted baseline tracking — which revision is the current contract baseline

---

### Step 13 — NEC4 Deemed Acceptance Alert System

**File:** `src/lib/nec4/deemed-acceptance-monitor.ts` (server-side cron job or Supabase Edge Function)

Scheduled function (runs nightly via Supabase Edge Function or a cron job):

```typescript
// Find all CEs in 'quotation_submitted' state where acceptance_due_date < now()
// and no PM response recorded
// Mark as 'deemed_accepted_pending_notification'
// Create in-app notification for QS team lead
// Create email notification via Resend (free tier)
// Optionally: create audit event
```

**In-app notification panel** (`src/components/notifications/ce-deadline-alerts.tsx`):
- Bell icon badge showing count of overdue CE actions
- Dropdown with: CE reference, action required, days overdue, quick-link to CE
- Separate notification preference settings per user

---

## LEVEL 3 — HGCRA COMPLIANCE SUITE
**Goal:** Make MeasureDeck the definitive UK HGCRA S110/S111/S112 compliance tool. No competitor owns this.  
**Estimated time:** 1.5 weeks  
**Feature flag:** `hgcra_suite`  
**Steps: 14–19**

---

### Step 14 — Payment Application Timeline Engine

**File:** `src/lib/hgcra/payment-timeline.ts`

Core engine calculating statutory payment dates for each contract type:

```typescript
interface PaymentTimeline {
  applicationDate: Date;
  contractType: 'JCT' | 'NEC4' | 'bespoke';
  paymentTermsDays: number;        // e.g. 30
  prescribedPeriodDays: number;    // typically 5–7 days for PLN

  // Calculated outputs:
  paymentNoticeDueDate: Date;      // Must issue payment notice by this date
  finalDateForPayment: Date;       // The absolute payment deadline
  payLessNoticeCutoff: Date;       // Last possible date to issue PLN (= finalDateForPayment - prescribedPeriodDays)
  daysToPaymentNotice: number;     // How many days left
  daysToFinalPayment: number;
  daysToPLNCutoff: number;
  isPaymentNoticeOverdue: boolean;
  isPLNWindowClosed: boolean;
  isPaymentOverdue: boolean;
}

export function calculatePaymentTimeline(params: PaymentTimelineInput): PaymentTimeline
```

**NEC4-specific logic:** Under NEC4 Y(UK)2, the assessment date is the application date, payment certificate is issued within 7 days (clause 51.1), and the final date for payment is 14 days after the assessment date (clause 51.2). PLN must be issued before the final date for payment.

**JCT-specific logic:** Interim payment dates per contract particulars. Payment notice by employer within 5 days of due date. Final date for payment 14 days after due date. PLN by prescribed period before final date (typically 7 days).

---

### Step 15 — Pay Less Notice (PLN) Generator

**File:** `src/app/(app)/applications/[applicationId]/pay-less-notice/page.tsx`

Full PLN workflow:

- **Timeline Panel** — visual countdown bar showing: [Application] → [Payment Notice Due] → [PLN Cutoff] → [Final Payment Date]. Colour-coded by urgency.
- **PLN Form** — fields: Notified Sum (from payment notice), Withholding Amount, Grounds for Withholding (rich text), clause references (e.g. "Clause 4.12.4 — Defective work not remediated"). Multiple withholding items with individual amounts that sum to total.
- **Compliance Check** — system validates: Is the PLN being issued before the cutoff? If yes: "Compliant — within prescribed period." If no: "WARNING — PLN cutoff has passed. Issuing now may not be effective under HGCRA S111(3). Consult contract terms."
- **Generate PDF** — branded MeasureDeck PDF with all statutory required information. Uses `@react-pdf/renderer`.
- **Issue & Track** — marks PLN as issued, records timestamp (legally significant), prompts for acknowledgement tracking.
- **Withholding Register** — table of all PLNs issued on this project, amounts withheld, status.

---

### Step 16 — Right to Suspend Workflow (S112)

**File:** `src/app/(app)/applications/[applicationId]/suspension-notice/page.tsx`

When final date for payment has passed without payment or valid PLN:

- **Eligibility Check** — system confirms: "Payment of £[X] was due on [date]. No valid Pay Less Notice was issued before [PLN cutoff]. The [contractor/subcontractor] has a statutory right to suspend under HGCRA 1996 S112."
- **Suspension Notice Form** — 7-day notice period (mandatory — S112(2)). System calculates: notice date, suspension effective date (7 days later), EOT entitlement note ("suspension period extends time for completion per NEC4 clause 60.1(18) / JCT clause 2.26.6").
- **Reinstatement Trigger** — when payment is made (record payment in system), system prompts: "Issue Reinstatement Notice — suspension must be lifted promptly once payment received."
- **EOT Calculator** — number of days suspended × 1 = minimum EOT days to claim. Auto-creates draft CE notification for the suspension period.

---

### Step 17 — HGCRA Compliance Dashboard

**File:** `src/app/(app)/projects/[projectId]/hgcra-dashboard/page.tsx` (accessible from project detail)

Portfolio-level HGCRA health check:

- **Application Status Grid** — every active payment application on the project: application date, payment notice status, PLN status, payment date, traffic light (green/amber/red)
- **Outstanding Actions** — sorted by urgency: "PLN must be issued within 3 days for [Application 7]"
- **Historical Summary** — all PLNs issued, amounts withheld, grounds, dispute history
- **HGCRA Compliance Score** — percentage of applications where all statutory steps completed on time. Track over project lifecycle.

---

### Step 18 — Statutory Notice PDF Templates

**File:** `src/lib/pdf-templates/pay-less-notice.tsx`  
**File:** `src/lib/pdf-templates/suspension-notice.tsx`  
**File:** `src/lib/pdf-templates/payment-notice.tsx`  
**File:** `src/lib/pdf-templates/practical-completion-certificate.tsx`

Each template is a React-PDF component producing a legally formatted, MeasureDeck-branded document. Standard sections:

- Workspace/company letterhead (from workspace settings)
- To/From parties (linked to project/supplier/contact records)
- Contract reference, project title, project number
- Statutory basis (citing specific clause and Act)
- Amount, grounds, deadline
- Signature block with ISO timestamp
- "Generated by MeasureDeck — [timestamp] — Audit Reference: [UUID]"

The UUID-based audit reference is the key feature — every generated notice is traceable to the exact system state at generation time. This is valuable evidence in adjudication.

---

### Step 19 — Notification Engine (In-App + Email, Free Tier)

**File:** `src/lib/notifications/notification-engine.ts`

Centralised notification dispatch. Two channels only (both free):

1. **In-app notifications** — written to a `notifications` table in Supabase. Displayed in the bell icon dropdown and notification centre page. Each notification has: type, title, body, action URL, read status, urgency.

2. **Email notifications** — via Resend (already in stack). Free tier allows 3,000 emails/month. Template for each notification type: PLN deadline approaching, CE deemed acceptance risk, payment overdue, etc.

**Future add-on (NOT built now):**  
- SMS via Twilio (user brings their own Twilio credentials in Workspace Settings → Integrations → SMS)  
- WhatsApp Business API (user brings their own WhatsApp Business Account credentials)  
- These are documented in the UI as "upgrade your notification plan" but the system is built to accept them as provider plugins.

**Notification types to implement:**
```typescript
type NotificationType = 
  | 'ce_quotation_due_soon'         // 7 days before
  | 'ce_quotation_overdue'          // day of + each day after
  | 'ce_acceptance_due_soon'        // 3 days before
  | 'ce_deemed_acceptance_risk'     // acceptance period expired
  | 'pln_cutoff_approaching'        // 3 days before cutoff
  | 'pln_cutoff_passed'             // day after cutoff — urgent
  | 'payment_overdue'               // day after final date for payment
  | 'retention_release_due'         // 30 days before PC or DLP end
  | 'cis_return_due'                // 5th of each month for prior tax month
  | 'programme_submission_due'      // 7 days before 8-week deadline
  | 'subcontract_insurance_expiring' // 30 days before expiry
  | 'snagging_item_overdue'         // snag due date passed
```

---

## LEVEL 4 — CIS & HMRC TAX COMPLIANCE
**Goal:** Replace the contractor's CIS spreadsheet and reduce their accountant's manual work. Free HMRC APIs. Regulatory moat.  
**Estimated time:** 2 weeks  
**Feature flag:** `cis_compliance`  
**Steps: 20–24**

---

### Step 20 — HMRC CIS API Integration

**API:** HMRC CIS Online API — `https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/construction-industry-scheme/2.0`  
**Cost:** Free. Uses HMRC OAuth 2.0 (client credentials for automated filing, authorisation code for user-context operations).

**File:** `src/lib/hmrc/cis-client.ts`

```typescript
// HMRC CIS API client — free gov.uk service
// Endpoints used:
// POST /organisations/cis/{taxOfficeNumber}/{taxOfficeReference}/verification
//   → Verify a subcontractor's UTR, return payment status (gross/net/higher/unmatched)
// POST /organisations/cis/{taxOfficeNumber}/{taxOfficeReference}/return
//   → Submit monthly CIS300 return in HMRC XML format

interface HMRCCISConfig {
  clientId: string;      // From workspace HMRC settings
  clientSecret: string;  // From workspace HMRC settings
  taxOfficeNumber: string;
  taxOfficeReference: string;
  environment: 'sandbox' | 'production';
}

export class HMRCCISClient {
  async verifySubcontractor(utr: string, companyName: string): Promise<CISVerificationResult>
  async submitMonthlyReturn(returnData: CIS300Return): Promise<HMRCSubmissionResult>
}
```

**HMRC credential storage** — stored encrypted in `workspace_settings` JSONB column. Never transmitted in client-side code. All HMRC API calls go through a Supabase Edge Function acting as proxy.

**Sandbox testing** — HMRC provides a full sandbox environment with test UTRs. Build and test completely in sandbox before production.

---

### Step 21 — Subcontractor CIS Verification Workflow

**File:** `src/app/(app)/suppliers/[supplierId]/cis-verification/page.tsx`

On any supplier record, a "CIS Verification" tab (gated by flag):

- **Verification Form** — UTR input (validated 10-digit format), Company Name, Company Registration Number. HMRC verifies against their records.
- **Verification Result Display:**
  - **Gross** (0% deduction) — verified gross payment status, show expiry date
  - **Net** (20% deduction) — standard CIS deduction rate
  - **Higher Rate** (30% deduction) — unverified or non-compliant
  - **Unmatched** — UTR not found, cannot proceed to payment
- **Re-verification Trigger** — HMRC verification expires. System alerts when re-verification is needed (typically annually or on status change).
- **Bulk Verification** — on Suppliers list, select multiple suppliers → bulk verify all.

---

### Step 22 — CIS Deduction Calculator & Payment Application Integration

**File:** `src/lib/cis/deduction-calculator.ts`

When processing a payment application to a subcontractor:
- Look up CIS status from `cis_records` table
- Calculate: gross payment → deduct materials cost → apply deduction rate → net payment
- Show breakdown in payment application detail page
- Create CIS payment line record

**Payment Application UI Enhancement** (`src/app/(app)/applications/[applicationId]/page.tsx`):

Add "CIS Calculation" section (when application is to a supplier with CIS record):
```
Gross Payment:          £ 45,000.00
Less: Materials Cost:   £ 12,000.00
Labour Amount:          £ 33,000.00
CIS Deduction Rate:     20% (Net — Verified)
CIS Deduction:          £  6,600.00
─────────────────────────────────
Net Payment to Sub:     £ 38,400.00
CIS to HMRC:            £  6,600.00
```

**Domestic VAT Reverse Charge indicator** — if subcontractor is VAT registered and services are "specified supplies" under HMRC's CIS DRC rules, flag the payment as DRC applicable. Payment application shows "VAT: £0 (Domestic Reverse Charge applies — recipient to account for VAT)".

---

### Step 23 — Monthly CIS Return Generator

**File:** `src/app/(app)/cis/monthly-return/page.tsx` (new page)

Monthly workflow (runs each month by 19th for prior tax month):

1. **Draft Return** — auto-populated from all CIS payment lines for the tax month. Table: Subcontractor UTR | Name | Gross Payment | Materials | Deduction Rate | Deduction Amount
2. **Review & Amend** — QS/finance team reviews line by line, can amend materials split
3. **Validation** — system checks: all subcontractors verified? Any unmatched UTRs? All deduction rates current?
4. **Generate CIS300 XML** — produces HMRC-format XML ready for submission
5. **Submit to HMRC** — one-click submission via HMRC CIS API. Stores submission reference.
6. **Annual Statements** — generate subcontractor annual deduction statements (due by 19 May each year per HMRC rules). PDF sent via email to each subcontractor's contact email.

**Returns history** — table of all submitted returns: tax month, total payments, total deductions, submission date, HMRC reference, status.

---

### Step 24 — Companies House API Integration (Free)

**API:** Companies House Public Data API — `https://developer.company-information.service.gov.uk/`  
**Cost:** Free. No rate limits for normal use. API key obtained free.

**File:** `src/lib/companies-house/ch-client.ts`

```typescript
// Companies House Public Data API — completely free
// Endpoints:
// GET /company/{company_number} → company details, SIC codes, status
// GET /company/{company_number}/officers → directors list
// GET /company/{company_number}/filing-history → recent filings
// GET /company/{company_number}/insolvency → insolvency events

export class CompaniesHouseClient {
  async getCompany(companyNumber: string): Promise<CHCompany>
  async getOfficers(companyNumber: string): Promise<CHOfficer[]>
  async getFilingHistory(companyNumber: string): Promise<CHFiling[]>
  async getInsolvencyHistory(companyNumber: string): Promise<CHInsolvency | null>
  async searchByName(name: string): Promise<CHSearchResult[]>
}
```

**Integration points:**
- Supplier creation wizard: search by company name → auto-fill from Companies House
- Supplier detail: "CH Verification" chip showing: active / dissolved / in administration / struck off
- Supply chain risk: overdue accounts filing = amber risk flag. Administration/liquidation = red alert.
- New supplier onboarding: auto-verify company exists and is active before adding to system

---

## LEVEL 5 — RETENTION & FINANCIAL MANAGEMENT
**Goal:** Full retention lifecycle, cashflow S-curve, and EVM. Closes the gap vs Causeway and Candy PES.  
**Estimated time:** 2 weeks  
**Feature flags:** `retention_module`, `cashflow_forecasting`, `evm_dashboard`  
**Steps: 25–30**

---

### Step 25 — Retention Ledger & Debtors/Creditors Dashboard

**File:** `src/app/(app)/projects/[projectId]/retention/page.tsx`

Full retention management for a project:

**Two-panel layout:**

*Panel 1 — Retention Receivable (from Client):*
- Running total of retention deducted by client across all payment applications
- First moiety amount (released at PC): tracked against PC certificate
- Second moiety amount (released at DLP end): tracked against DLP expiry date
- Retention bond alternative: if bond substituted for cash retention, record bond details, expiry
- Release trigger: system prompts "Practical Completion achieved [date] — retention first moiety of £[X] is now claimable. Do you want to raise a retention release application?"
- DLUHC reform indicator: "This project may be subject to the Retention Deposit Scheme when enacted — retention is being tracked in preparation."

*Panel 2 — Retention Payable (to Subcontractors):*
- Per-subcontract retention held, by moiety
- Release schedule: which retentions are due for release and when
- Overdue releases: retentions where DLP has expired but not yet released (cash flow impact)
- Total retention creditor: balance sheet figure for monthly CVR reporting

**Retention S-curve:** Recharts chart showing retention deducted over time (applications) vs retention released over time (PC and DLP dates). Visual gap = cash held.

---

### Step 26 — Cashflow S-Curve Forecasting Module

**File:** `src/app/(app)/projects/[projectId]/cashflow/page.tsx`

Construction cashflow forecasting without needing expensive external tools:

**Inputs:**
- Revenue profile: drawn from payment applications (actuals) and programme completion dates (forecast)
- Cost profile: drawn from subcontract orders (values × payment schedules) + direct costs
- Retention profile: drawn from retention ledger (deductions and expected release dates)
- Payment timing: application → certification delay (user-configurable, default 28 days) → payment delay (per contract terms)

**Outputs:**
- Monthly cashflow table: Revenue In | Cost Out | Retention Deducted | Net Monthly | Cumulative
- S-curve chart (using shared `s-curve-chart.tsx` component): planned vs actual vs forecast
- Peak negative cashflow date and value (critical for finance team / overdraft management)
- Breakeven month
- Export to Excel/PDF for funder/board reporting

**CFO-level KPIs (top strip):**
- Total project value | Amount certified to date | Amount paid to date | Outstanding debt | Retention held | Forecast final cashflow

---

### Step 27 — Earned Value Management (EVM) Dashboard

**File:** `src/app/(app)/projects/[projectId]/evm/page.tsx`

IPA-compliant EVM for public sector and infrastructure projects:

**Calculations (per month):**
```
PV  = Planned Value       (Budgeted Cost of Work Scheduled)
EV  = Earned Value        (Budgeted Cost of Work Performed)
AC  = Actual Cost         (Actual Cost of Work Performed)
CV  = EV - AC             (Cost Variance — negative = over budget)
SV  = EV - PV             (Schedule Variance — negative = behind schedule)
CPI = EV / AC             (Cost Performance Index — <1.0 = over budget)
SPI = EV / PV             (Schedule Performance Index — <1.0 = behind schedule)
EAC = BAC / CPI           (Estimate at Completion)
VAC = BAC - EAC           (Variance at Completion)
TCPI= (BAC - EV) / (BAC - AC) (To-Complete Performance Index)
```

**Visualisations:**
- Time-phased PV/EV/AC chart (Recharts)
- CPI and SPI trend lines
- EAC vs original Budget at Completion (BAC)
- Traffic light scorecard by work package

**Data sources:**
- PV: from programme/schedule module (planned completion % per period)
- EV: from CVR (% complete applied to budget)
- AC: from cost codes / subcontract payment actuals

---

### Step 28 — Fluctuations Module (Manual Index Input)

**File:** `src/app/(app)/projects/[projectId]/fluctuations/page.tsx`

Price escalation calculations per JCT Fluctuation Options A/B/C and NEC Z-clauses:

**No expensive BCIS API needed** — BCIS indices are published monthly in free PDF format on the BCIS website. Build a manual index input table. Workspace admin inputs indices monthly. In future, if user subscribes to BCIS API, the system can consume it automatically.

**Option A (Limited Fluctuations):** Statutory taxes and levies changes only. Calculate impact of changes to CITB levy, employer's NI rates, etc.

**Option B (Full Labour & Material):** Per-contract labour categories × published index changes. Per-material type × commodity price change. Calculate recovery amount per interim application.

**Option C (Formula Method):** Baxter Formula implementation. Work Category Proportions (WCPs) × BCIS indices. Full formula calculation engine. Auto-applies to each interim application.

**Index management table:** Date | Index | BCIS Reference | Entered By | Notes. Audit trail of who entered each index.

**Fluctuation Entitlement Summary:** Running total of fluctuation entitlement. Application-by-application breakdown. Inclusion in payment application with separate line.

---

### Step 29 — NEC Options C/D Target Cost Module

**File:** `src/app/(app)/projects/[projectId]/target-cost/page.tsx`

**Feature flag:** `target_cost_module`

For NEC4 Options C (target with activity schedule) and D (target with BOQ):

- **Defined Cost Tracker** — input direct labour, direct materials, plant, subcontract, and overheads against Schedule of Cost Components (SCC). Flag potential disallowed cost items.
- **Pain/Gain Share Calculator** — clause 53: if Final Outturn Cost < Target Price → Contractor earns share of saving. If Final Outturn Cost > Target Price → Contractor bears share of overrun. Configure contractor's share percentage bands per contract particulars.
- **Defined Cost vs Target Report** — running comparison: actual defined cost to date vs target for this stage. Traffic light indicator.
- **Disallowed Cost Log** — PM/Supervisor can flag cost items as "disallowed" per NEC4 clause 11.2(25). Running total of disallowed items. Contractor can dispute.

---

### Step 30 — CVR Enhancement — WIP & Margin Reconciliation

**File:** `src/app/(app)/cvr/[cvrPeriodId]/page.tsx` (enhance existing)

Extend the existing CVR module with:

- **Work in Progress (WIP) Adjustment** — calculation: Revenue Recognised - Applications Submitted = Unbilled WIP. Or: Applications Submitted - Revenue Recognised = Overbilling. Toggle between revenue recognition bases: completion method, percentage complete, zero-profit method.
- **Margin Bridge** — waterfall chart showing how margin moved period-on-period: volume change, mix change, rate change, site efficiency, CE uplift, claims.
- **Package-Level Margin** — per subcontract package: budget vs certified vs cost = package margin. Roll up to project margin.
- **At Completion Sensitivity** — slider: "If final account settles £[X] above/below current assessment, project margin moves from [X]% to [Y]%." Helps commercial directors present scenarios to boards.

---

## LEVEL 6 — SUBCONTRACT & SUPPLY CHAIN MANAGEMENT
**Goal:** End parallel Excel subcontract trackers. Full lifecycle from order to final account.  
**Estimated time:** 2.5 weeks  
**Feature flags:** `subcontract_orders`, `supply_chain_kyc`, `pc_snagging`  
**Steps: 31–36**

---

### Step 31 — Subcontract Order Management Module

**File:** `src/app/(app)/subcontracts/page.tsx` (new list page)  
**File:** `src/app/(app)/subcontracts/[subcontractId]/page.tsx` (new detail page)  
**File:** `src/components/wizards/subcontract-wizard.tsx` (new wizard)

**List page:** Table with: Order #, Subcontractor, Trade/Package, Contract Form, Order Value, Certified to Date, Paid to Date, Retention Held, Status. KPI strip: total subcontract spend, total certified, total outstanding, total retention held, orders at risk (late or disputed).

**Subcontract Wizard (5 steps):**
1. Select Subcontractor (from suppliers) + Package Reference from budget
2. Contract Form Selection: DOM/1, NEC4 ECS, JCT SBC, bespoke. If NEC4: prompt for Options (A/B/C/D/E/F), secondary options (X, Y, Z).
3. Financial Terms: Contract sum, provisional sum allowances, retention rate, DLP length, payment terms, advance payment (if applicable)
4. Scope & Programme: Description of work, reference drawings list (from drawing register), reference specs, start/end dates
5. Review & Issue: Generate subcontract order summary. Upload signed subcontract document. Mark as "issued."

**Subcontract Detail Page (8 tabs):**
- Summary: financial position panel, status timeline, key dates
- Applications: all subcontract payment applications linked, with CIS calculation per payment
- CE Register: CEs raised by/against this subcontractor
- Retention: retention ledger for this subcontract
- Documents: signed subcontract, insurance certs, warranties, O&M manuals, H&S File
- Final Account: final account settlement tab (mini version of project-level FA)
- Contacts: subcontractor contacts with roles and communication history
- Audit: full audit trail

---

### Step 32 — Supply Chain Pre-Qualification (Companies House + Manual)

**File:** `src/app/(app)/suppliers/onboarding/page.tsx` (new flow)

Structured supplier onboarding:

**Step 1 — Company Verification (Companies House API — free):**
- Search by company name or number
- Auto-populate: registered address, SIC code, incorporation date, company status, directors
- Risk flags: overdue accounts (>9 months), recent director changes, dissolution notice

**Step 2 — CIS Verification (HMRC API — free):**
- Enter UTR → verify status → record gross/net/higher rate

**Step 3 — Insurance & Accreditation Upload (manual — no API cost):**
- Required documents checklist (configurable per workspace): Public Liability (min £X), Employer's Liability, Professional Indemnity, Product Liability, Contractors All Risk
- Accreditation documents: CHAS, Constructionline, SSIP certificate, ISO 9001, ISO 14001, ISO 45001
- Each document: upload file, enter expiry date. System auto-alerts when expiring.
- Status: Compliant ✓ / Documents Pending / Expired / Not Submitted

**Step 4 — Financial Health:**
- Credit limit (manual input, or pull from integrated Creditsafe if user subscribes as add-on)
- Payment terms agreed
- Bank details (encrypted, masked display)
- Annual turnover (manual entry from latest accounts)
- Bonding/PQQ forms uploaded

**Pre-Qualification Status Summary Card** on supplier detail:
- Overall status: Approved / Conditional / Suspended / Rejected
- Document expiry dashboard: all certs with days to expiry
- Automatic suspension when mandatory insurance expires

---

### Step 33 — CDM 2015 Compliance Tracking

**File:** `src/app/(app)/projects/[projectId]/cdm/page.tsx` (new page)

CDM 2015 project compliance dashboard:

- **F10 Notification Status:** Has the project been notified to HSE? F10 form upload, notification date, HSE reference number.
- **Duty Holder Register:** Client, Principal Designer, Principal Contractor, Designer(s), Contractor(s). Each with appointment letter upload and confirmation date.
- **Principal Designer Appointments:** Appointment document, fee agreement, design review records.
- **Construction Phase Plan:** Current CPP version, uploaded document, last review date, next review date.
- **Pre-Construction Information Pack:** Upload and version control.
- **Health & Safety File:** Ongoing document repository. Track which sections are complete. Final handover to client at PC.
- **Competence Records:** Link to supplier compliance documents (CSCS cards, SMSTS/SSSTS certificates, trade competencies).
- **CDM Compliance Score:** Percentage of required items completed.

---

### Step 34 — Practical Completion & Defects Management

**File:** `src/app/(app)/projects/[projectId]/practical-completion/page.tsx`  
**File:** `src/app/(app)/projects/[projectId]/snagging/page.tsx`

**Practical Completion workflow:**

PC Certificate journey:
1. Contractor notifies PM of anticipated PC date
2. Inspection walkthrough → snagging list created
3. Snag items resolved → outstanding items count = 0 (or contractor/employer agree to accept with schedule)
4. PC Certificate issued: certificate number, date, section (or whole works), signed parties
5. Auto-triggers: first retention moiety release notification, DLP start, final date for payment clock
6. If sectional PC: tracks each section separately (common on phased projects)

**Snagging App features:**
- Create snag: description, location, drawing reference, photo upload, responsible party, priority, due date
- Assign to subcontractor or direct team member
- Mobile-friendly card view for site use
- Status tracking: Open → In Progress → Completed → Verified
- Photo evidence at creation and completion
- Snag import from CSV (for bulk upload from existing snag lists)
- Outstanding snags counter on project dashboard

---

### Step 35 — Mobile Daywork Sheet Capture (Base Version — No AI)

**File:** `src/app/(app)/projects/[projectId]/dayworks/mobile/page.tsx`

Mobile-optimised daywork sheet creation (full AI version is Level 7, Step 40):

**Base version (no AI — works immediately):**
- Camera/file upload for photos (evidence)
- Pre-populated RICS Daywork Sheet template:
  - Date and time
  - Project, CE reference (optional)
  - People: Name | Trade | Grade | Start | Finish | Hours | Rate | Amount (rates from supplier records)
  - Plant: Item | Ref | Start | Finish | Hours | Rate | Amount
  - Materials: Description | Quantity | Unit | Rate | Amount
  - Subtotals + % additions per RICS Definition of Prime Cost of Daywork
- Client representative signature capture (touch/mouse signature pad)
- Timestamp and GPS location tag on sign-off
- Auto-creates daywork record in the daywork register
- Instant submission to CE or as standalone daywork

---

### Step 36 — Subcontract Final Account Integration

**File:** `src/app/(app)/subcontracts/[subcontractId]/final-account/page.tsx`

Mini final account module within each subcontract record:

- **Contract Sum Analysis:** Original contract sum, changes/variations, CE amounts, dayworks, provisional sums expended, fluctuations
- **Account Build-Up:** Revenue items with individual amounts summing to gross final account value
- **Retention Settlement:** Retention deducted, first moiety released, second moiety release date, balance
- **Settlement Status:** Draft → Agreed → Issued → Accepted → Signed
- **Export:** Generate subcontract final account statement as PDF
- **Link to Project Final Account:** Subcontract FA values feed into the project-level FA breakdown (subcontract costs section)

---

## LEVEL 7 — AI INTELLIGENCE LAYER
**Goal:** Build AI features that justify a premium tier and have no real competitor. Uses existing AI copilot infrastructure.  
**Estimated time:** 3 weeks  
**Feature flags:** `ai_contract_analyser`, `ai_ce_identifier`, `ai_daywork_capture`  
**Steps: 37–42**

---

### Step 37 — AI Contract Clause Risk Analyser

**File:** `src/app/(app)/projects/[projectId]/ai-contract-review/page.tsx`

Upload a contract (PDF, DOCX). AI analyses:

**What it checks:**
- Amendments from standard NEC4/JCT terms (highlights deviations in red)
- Onerous clauses: unlimited liability, no cap on LADs, back-to-back provisions more onerous than head contract
- Missing secondary options: is Y(UK)2 HGCRA compliance included? Is X7 LAD cap specified? Is X13 performance bond required?
- Unusual Z-clauses: flags and explains each Z-clause addition
- Retention rate and cap: compares to industry norm (5% to half value)
- Payment terms: compares specified payment terms to HGCRA minimums
- Dispute resolution: adjudication provisions per HGCRA, arbitration clauses, notice requirements

**Output format:**
- Risk Score: Low (0–40) / Medium (41–70) / High (71–100)
- Clause-by-clause table: Clause | Status | Risk Level | Commentary | Recommendation
- Executive summary: 5 bullet points for commercial director briefing
- Comparison column: "Standard NEC4 says X — this contract says Y"

**AI implementation:** RAG over NEC4 and JCT standard form clauses. System prompt includes full NEC4 ECC clause text and JCT SBC/Q clause text. User uploads → text extracted → clause-by-clause comparison. Uses existing copilot API endpoint.

---

### Step 38 — CE Narrative Auto-Generator

**File:** `src/components/ai/ce-narrative-generator.tsx`

Within CE detail page, "Generate Narrative" button:

**Inputs assembled automatically:**
- PM instruction text (from linked document or typed excerpt)
- NEC4 clause category selected (e.g. 60.1(1) — Works Information change)
- Programme impact (days)
- Quotation breakdown values
- Drawing revision reference (if applicable)
- Site diary entries linked to CE (if any)

**Output:**
```
COMPENSATION EVENT NOTIFICATION
Project: [Project Name]
CE Reference: [CE-047]
Clause: NEC4 ECC Clause 60.1(1) — PM Instruction changing the Works Information

1. DESCRIPTION OF THE EVENT
On [date], the Project Manager issued Instruction [Ref] requiring [description].
This constitutes a compensation event under clause 60.1(1) of the NEC4 Engineering
and Construction Contract as it changes the Works Information contained in [document].

2. ASSESSMENT BASIS
The assessment has been prepared in accordance with clause 63.1 of the NEC4 ECC,
using the Shorter Schedule of Cost Components. The effect of the compensation event
on Defined Cost is assessed as follows:
[cost breakdown from quotation builder]

3. PROGRAMME IMPACT
The event causes a delay to planned Completion of [X] days. Terminal float of [Y] days
is consumed. An extension of time of [X - Y] days to the Completion Date is therefore
assessed under clause 63.5.

4. TOTAL ASSESSMENT
Time: [X] days extension to Completion Date
Cost: £[Amount] (inclusive of fee percentage of [X]%)
```

**QS edits before submission.** AI draft reduces writing time from 45 minutes to 5 minutes.

---

### Step 39 — AI CE Entitlement Identifier from Programme

**File:** `src/app/(app)/projects/[projectId]/ai-ce-scan/page.tsx`

Upload a programme export (Asta XER, MS Project XML, or manual Gantt data):

**AI analysis:**
1. Identifies activities with negative float (critical path delays)
2. Cross-references with site diary entries and CE register dates
3. Matches delay events to NEC4 clause 60.1 categories
4. Flags: "Activity [X] shows a 23-day delay starting [date]. This coincides with PM Instruction [Ref] issued [date-2]. This may constitute a CE under clause 60.1(1). Has a CE been notified?"
5. Identifies notification lapses: "CE for [event] was not notified within 8 weeks of [event date]. Entitlement may be time-barred under clause 61.3."
6. Generates a "Missed CE" report: list of potential CE events not yet notified, with clause basis and risk assessment.

**Data required (no external API):**
- Programme data (file import — see Level 8 Asta integration)
- CE register (in MeasureDeck)
- Site diary entries (in MeasureDeck)
- PM instruction log (from documents module)

---

### Step 40 — AI Photo-to-Daywork Sheet (AI Enhancement)

**File:** Enhancement to `src/app/(app)/projects/[projectId]/dayworks/mobile/page.tsx`

When `ai_daywork_capture` flag is enabled, adds AI layer to the base mobile daywork capture (Step 35):

**Photo analysis pipeline:**
1. User photographs site: workers, plant, materials
2. Photo uploaded → AI vision analysis:
   - Count visible workers (approximate)
   - Identify visible plant (excavator, dumper, scaffolding, concrete pump)
   - Identify visible materials (bulk bags, steelwork, formwork)
3. AI pre-fills daywork form:
   - Workers section: count × suggested trade (prompt user to confirm grade)
   - Plant section: identified items (prompt user to confirm rate)
   - Materials section: visible items (prompt user to confirm quantity/rate)
4. User reviews, corrects, and confirms
5. Photos attached as evidence

**AI implementation:** Vision capability in existing copilot API. System prompt: "You are analysing a construction site photograph for a daywork sheet. Identify and count: (1) workers by apparent trade, (2) plant and equipment items, (3) materials present. Return structured JSON."

**Legal note (displayed in UI):** "AI identification is an aid to recording — the QS/foreman must review and confirm all quantities and rates. The signed daywork sheet is the contractual record."

---

### Step 41 — Subcontractor Insolvency Risk Score

**File:** `src/components/suppliers/insolvency-risk-score.tsx`

Using only free data sources — no Creditsafe/D&B subscription needed:

**Data inputs (all free):**
- Companies House filing status: overdue accounts (>9 months) = high risk flag
- Companies House insolvency events: voluntary arrangement, administration, liquidation = critical
- Companies House director changes: frequent changes in 12 months = amber flag
- HMRC CIS status: lost gross status recently = potential cash flow issue
- Payment behaviour in MeasureDeck: days to pay their own suppliers (if they use platform)
- Industry news search: company name in recent news (uses free web search API)

**Risk Score output (0–100):**
- 0–30: Low risk (green)
- 31–60: Moderate (amber) — enhanced monitoring recommended
- 61–80: High risk (red) — seek bond/parent company guarantee
- 81–100: Critical (dark red) — consider novation or alternative arrangements

**Display:** On supplier detail page, dashboard widget. On subcontract order list, inline risk badge. Weekly automated scan of all active subcontractors. Alert when score changes materially (>15 points).

---

### Step 42 — AI-Powered Payment Behaviour Prediction

**File:** `src/components/ai/payment-behaviour-predictor.tsx`

Based on historical payment application data within MeasureDeck:

**What it analyses:**
- Per-client: historical gap between application date and certification date (average and trend)
- Per-client: historical gap between certification and payment (average and trend)
- Per-client: frequency of PLNs issued (proxy for payment disputes)
- Per-client: average % of application certified vs claimed (withholding rate)
- Trend: are these metrics improving or deteriorating?

**Output:**
- "Based on 12 months of payment history, [Client Name] typically certifies [X]% of application within [Y] days."
- "Recent trend: certification delay has increased by [Z] days over last 3 applications — monitoring recommended."
- "Predicted payment date for Application 14: [Date ± 5 days]"
- "Cash flow alert: if this application follows recent trend, expected net receipt is £[X] not £[Y budgeted]."

**Portfolio view:** Commercial director dashboard showing payment behaviour scores for all active clients.

---

## LEVEL 8 — ANALYTICS, PORTALS & INTEGRATIONS
**Goal:** Enable network effect (client portal), cross-project intelligence, adjudication support, and free file-based programme integrations.  
**Estimated time:** 3 weeks  
**Feature flags:** `client_portal`, `cross_project_analytics`, `adjudication_module`, `asta_import`  
**Steps: 43–49**

---

### Step 43 — Client / Employer's Agent Portal

**File:** `src/app/(portal)/[token]/page.tsx` (new route group — external access)

Branded external portal — no login required (magic-link token), or optional login:

**Contractor-controlled sharing:** contractor generates a portal link per project, sets permissions (view-only vs action-capable), sets expiry.

**Client views (view-only tier):**
- Current payment application (amount claimed, breakdown)
- CE Register (events notified, status, values)
- Programme (latest revision accepted by PM)
- Valuation certificates issued to date
- Drawing register (latest revision of each drawing)
- Project documents (as shared by contractor)

**Client actions (action-capable tier):**
- Issue Payment Notice (with amount and date)
- Issue Pay Less Notice (via PLN workflow)
- Accept/reject CE quotation (with clause reference)
- Issue PM Instruction (generates CE notification in contractor's system)
- Certify Practical Completion (triggers PC workflow)
- Record programme acceptance/non-acceptance

**Audit trail:** every client action is logged with IP address, timestamp, and user details. This creates the contractual record of communications between parties — replacing emails.

**Branding:** Portal can show contractor's logo and colour scheme (set in workspace settings). "Powered by MeasureDeck" in small footer.

---

### Step 44 — Cross-Project Analytics Dashboard

**File:** `src/app/(app)/analytics/page.tsx` (rebuild from stub to full BI layer)

Commercial Director / CFO-level intelligence:

**Portfolio KPIs:**
- Total portfolio value (all active projects combined)
- Weighted average margin (by project value)
- Total applications outstanding vs certified vs paid
- Total retention held (receivable) and held (payable)
- Total CE pipeline value
- DSO (Days Sales Outstanding) by client

**Margin Analysis Charts:**
- Margin by project type (civils, commercial, residential, fit-out)
- Margin by client (which clients are most profitable?)
- Margin trend over time (12-month rolling)
- CE uplift contribution to margin (how much margin comes from CEs vs original contract?)

**CE Intelligence:**
- CE frequency by project type and client (which clients cause most CEs?)
- CE acceptance rate by client (which clients push back most?)
- CE value recovery rate (value notified vs value settled)
- Top 10 CE categories (which clause 60.1 events occur most frequently?)

**Cash Intelligence:**
- Portfolio cashflow: money in vs money out per month
- Overdue debtors by age: 30/60/90/120+ days
- Retention debtor aging
- Worst-paying clients (DSO trend)

**Benchmarking:** (anonymised within workspace only — no cross-client data without explicit consent)
- Your project margins vs your historical average
- Your CE resolution time vs prior projects

---

### Step 45 — Adjudication Bundle Builder

**File:** `src/app/(app)/adjudication/[caseId]/page.tsx`  
**File:** `src/app/(app)/adjudication/page.tsx` (list)

UK construction adjudication workflow — unique in the market:

**Case Setup:**
- Create adjudication case: parties, contract, dispute description, claimed amount
- Select adjudicator nominating body (RICS, CIArb, RIBA, ICE, TECSA, TeCSA, CIOB)
- Record referral date, response due date (28 days from referral), reply due date (7 days after response)

**Bundle Builder (the core feature):**
- Drag-and-drop document assembler: CE register entries → evidence library → drawings → correspondence → expert reports
- Auto-generates indexed bundle with page numbers
- Chronology builder: drag events onto a timeline, export as formatted chronology document
- Without-prejudice settlement calculation: "If the adjudicator awards [X]% of claim, net recovery after costs is [£Y]"
- Referral notice template (pre-populated from case data)
- Response notice template

**Claim Structure (for contractor claims):**
- Loss and expense claim builder (NEC4 clause 60.1 categories with supporting evidence)
- EOT claim builder (programme-based, TIA methodology summary)
- Contra-charges schedule (employer's counterclaim)

**Bundle Export:** Single PDF with cover sheet, index, paginated documents. ZIP of all source files. Word document (formatted) for solicitor editing.

**Cost tracking:** Adjudicator's fees, solicitor fees, expert fees tracked per case.

---

### Step 46 — Asta Powerproject XER File Import

**File:** `src/lib/programme/asta-xer-parser.ts`

Asta Powerproject XER format parser (file-based — no API cost):

**XER format:** Primavera P6 compatible XML/text format. Asta exports to XER for interoperability. Parse:
- Activity list with WBS codes
- Original duration, actual start, actual finish, remaining duration
- Relationships (Finish-to-Start, Start-to-Start etc.)
- Calendars (working days)
- Baseline dates
- Critical path flag

**What MeasureDeck does with imported programme:**
- Populates/updates the schedule module with activities
- Calculates critical path from relationships
- Compares imported programme to previous baseline (shows slippage)
- Links activities to CE register (user maps CE events to affected activities)
- Feeds EVM module (PV from planned progress)
- CE Entitlement AI scan uses this data (Step 39)

**Also support:** MS Project XML import (freely available .xml export from MS Project). This covers the remaining ~25% of UK contractors not using Asta.

---

### Step 47 — Sage / Xero Webhook Integration (Basic)

**File:** `src/lib/integrations/sage-webhook.ts`  
**File:** `src/lib/integrations/xero-webhook.ts`

**Xero integration (OAuth 2.0 — free for app developers):**
- Connect MeasureDeck workspace to Xero organisation (OAuth handshake in workspace settings)
- Sync: invoices issued from payment applications → create Xero invoice automatically
- Sync: payments received in Xero → update payment status in MeasureDeck application record
- CIS deductions: post to Xero as separate liability line

**Sage 50/200 (file-based first, API second):**
- Sage 50: export/import via CSV (free, no API). MeasureDeck generates Sage-compatible CSV for job costing import.
- Sage 200: REST API available. MeasureDeck posts cost transactions to Sage 200 job costing module.
- Coins OA: CSV export for job costing (most common Coins integration method for third-party tools).

**Philosophy:** Don't charge extra for these integrations. Including them in Professional tier or above is a key competitive advantage over Causeway and Benchmarq who have no integrations.

---

### Step 48 — NRM2 Bill of Quantities Import

**File:** `src/lib/boq/nrm2-parser.ts`  
**File:** `src/app/(app)/projects/[projectId]/boq/page.tsx`

**Feature flag:** `boq_module`

Import a Bill of Quantities (from Excel, CSV, or industry-standard formats):

**NRM2 data structure:** Work Sections → Sub-sections → Measured Items → Provisional Sums → Dayworks Allowance. Each item: reference, description, unit, quantity, rate, amount.

**What MeasureDeck does with BOQ:**
- Post-award progress measurement: mark % complete per BOQ item, calculates application value
- Link BOQ items to CVR cost codes (for WIP tracking)
- Provisional sum tracking: budget vs expenditure
- Variation register: link variations/CEs to specific BOQ sections affected
- Export NRM2 format BOQ for tender

**Measurement software integration:** Bluebeam Revu and CostX both export to Excel/CSV. MeasureDeck imports those exports. No API cost.

---

### Step 49 — Delay Analysis Toolkit

**File:** `src/app/(app)/projects/[projectId]/delay-analysis/page.tsx`

**Feature flag:** `delay_analysis`

Structured delay analysis for EOT claims — not forensic (that's for Deltek Acumen), but structured data organisation:

**EOT Register:**
- Per-delay event: description, start date, end date, clause basis (NEC4 60.1 / JCT Relevant Events 2.26)
- Party at risk: Employer / Contractor / Neutral / Concurrent
- Critical path impact: yes/no (user assesses based on programme)
- Days of delay claimed
- Days of EOT granted
- Concurrent delay log: periods where both Employer and Contractor delays overlap

**Time Impact Analysis (TIA) — structured data entry:**
- Impact period: select from Gantt (after Asta import)
- Windows analysis: define analysis windows (typically monthly)
- Cause of delay + party + days impact per window
- Outputs: TIA summary table, delay entitlement calculation

**Concurrency Matrix:** Visual display of all delay events on a timeline, colour-coded by party. Periods of concurrent delay highlighted. Used to identify where Contractor delay may reduce EOT entitlement.

**Export:** Formatted delay analysis report with chronology and TIA table — for use in EOT claims and adjudication bundles.

---

## LEVEL 9 — MOBILE, PROGRAMME NOTIFICATIONS & PREMIUM MODULES
**Goal:** Complete the platform with the last high-value modules. Practical features that create daily usage habits.  
**Estimated time:** 3 weeks  
**Feature flags:** `programme_notifications`, `fluctuations_module`, `mobile_dayworks`  
**Steps: 50–56**

---

### Step 50 — Progressive Web App (PWA) Configuration

**File:** `public/manifest.json`, `public/sw.js`, `next.config.ts` (add PWA plugin)

Convert MeasureDeck to a PWA — no separate mobile app build required:

- Install on iOS/Android home screen from browser ("Add to Home Screen")
- Offline capability for: viewing cached project data, creating daywork sheets (sync when online), capturing snagging photos (upload queue)
- Push notifications via Web Push API (free — no third-party service)
- Camera access for daywork photo capture and snagging
- GPS access for location tagging on snags and daywork sheets

**PWA benefits over native app:**
- Zero App Store fees (Apple 30% cut avoided)
- Instant updates (no app store review process)
- Works on all devices
- No separate React Native codebase to maintain

**Library:** `next-pwa` (open source, no cost)

---

### Step 51 — Enhanced Mobile Daywork (PWA — Full Flow)

**File:** `src/app/(app)/dayworks/mobile/page.tsx` (mobile-optimised route)

Full mobile daywork capture as a PWA screen:

**Mobile-first UI:**
- Large touch targets
- Camera integration (capture photos inline)
- GPS auto-tag on form open
- Offline form fill (saves to IndexedDB, syncs when online)
- NFC tag scan support (for plant identification via asset tags)
- Time entry via start/stop timer (foreman hits Start when workers arrive, Stop when they leave)
- Pre-populated rates from supplier/resource records
- One-tap common trade rates (labourer, scaffolder, electrician, groundworker, etc.)

**Signature capture:**
- Client rep signs on screen
- Timestamped with GPS location
- "Signed under protest" option (with reason) — important contractually
- Email PDF to client rep immediately on sign-off

**Dayworks Register:**
- Running total of daywork expenditure vs daywork allowance (provisional sum)
- Group by CE reference
- Flag unsigned daywork sheets (no contractual value without signature)

---

### Step 52 — NEC4 Programme Notification System (Clause 32 Full Implementation)

**File:** Enhancement to `src/app/(app)/programmes/page.tsx` (Step 12 base)  
**File:** `src/components/notifications/programme-alerts.tsx`

Complete implementation:

**8-Week Submission Cycle Tracker:**
- Calculate next programme due date: 8 weeks from last accepted programme (or contract start if no accepted programme)
- Rolling calendar showing: last submission date, acceptance status, next due date
- Alert 2 weeks before due date
- Alert when overdue (day after due date)

**Programme Acceptance Machine:**
- PM receives programme notification (via client portal or email)
- 2-week acceptance period per clause 31.3
- If PM does not respond: not automatically accepted (unlike CEs). Contractor should prompt PM and log the chase.
- If rejected: PM must give reasons per clause 31.3. MeasureDeck records rejection reason, prompts for revised programme.
- Accepted programme: locked as current baseline. CE assessments reference this baseline.

**Accepted Baseline Registry:**
- Table of all accepted programme revisions with dates
- "Set as CE Assessment Baseline" — marks which revision is used for current CE quotation calculations
- Programme revision history comparison (before/after acceptance)

**Float Analysis:**
- Total float remaining vs original programme
- Terminal float identification (float beyond completion date — Contractor's property under most NEC4 Z-clauses)
- Float trend: is the programme recovering or deteriorating?

---

### Step 53 — BCIS Fluctuations Index Management (Manual + API-Ready)

**File:** `src/app/(app)/workspace/bcis-indices/page.tsx` (workspace-level settings page)

Monthly index management:

**Manual input mode (default — no cost):**
- Admin inputs BCIS indices monthly (values published free as PDFs on BCIS website)
- Index table: Date | General Building Cost Index | Specialist indices (M&E, Civils, Fit-out) | Tender Price Index | Materials sub-indices (steel, timber, copper, aggregates, fuel)
- Download template to fill and upload (CSV import)
- Auto-applies to projects using Fluctuation Option B or C

**BCIS API ready (future premium add-on):**
- If workspace has BCIS API credentials (paid RICS subscription), enter API key in settings
- System polls BCIS API monthly for latest indices
- Manual input not needed
- Flag in UI: "BCIS API connected — indices updating automatically"

**Fluctuation claim reports:**
- Per-application: fluctuation entitlement calculated
- Cumulative fluctuation claim to date
- Clause certificate: formal fluctuation recovery notice for attachment to payment application
- Separate line on payment application: "Fluctuations under [Option B/C]: £[amount]"

---

### Step 54 — Loss & Expense / Direct Loss Claim Builder (JCT)

**File:** `src/app/(app)/projects/[projectId]/loss-and-expense/page.tsx`

JCT clause 2.32 structured claim builder:

**Notice regime tracker:**
- Written notice of likely loss and expense (clause 2.32.1): date submitted, relevant matter cited
- Particulars request: date PM/Architect requested further details (clause 2.32.2)
- Particulars submitted: date and content summary
- Ascertainment: Architect/QS ascertains amount — record date, amount, and basis

**L&E Categories (JCT clause 4.23 Relevant Matters):**
- Variations and provisional sum expenditure
- Late instructions from Architect
- Opening up works for inspection (where not defective)
- Discrepancies in documents
- Delay caused by nominated subcontractors/suppliers (historic — pre-SBC/Q 2011)
- Employer's failure to give access
- Antiquities (clause 3.22)
- Suspension for non-payment

**Claim Components:**
- Prolongation costs: time-related prelims × delay period
- Disruption: measured mile analysis, labour efficiency
- Acceleration: additional resources to avoid further delay
- Finance charges: interest on capital locked up
- Inflation: cost increases during extended period

**Output:** Formatted L&E claim document ready for Architect/Contract Administrator review.

---

### Step 55 — Notification Add-On Module (SMS / WhatsApp)

**File:** `src/app/(app)/workspace/settings/notifications/integrations/page.tsx`

Clearly structured as optional add-on requiring user's own API credentials:

**SMS via Twilio (bring-your-own):**
```
To enable SMS notifications:
1. Create a Twilio account at twilio.com (pricing: ~£0.05/SMS)
2. Obtain your Account SID and Auth Token
3. Purchase a UK mobile number in Twilio
4. Enter credentials below
```
- User enters: Twilio Account SID, Auth Token, From Number
- MeasureDeck stores encrypted, uses for outbound SMS only
- Notification types available via SMS: CE deadline alerts, PLN cutoff warnings, payment overdue alerts

**WhatsApp via WhatsApp Business API (bring-your-own):**
```
To enable WhatsApp notifications:
1. Apply for WhatsApp Business API access at business.whatsapp.com
2. Complete business verification (takes 2–7 days)
3. Set up a Meta Business Manager account
4. Enter your WhatsApp Business credentials below
```
- User enters: WhatsApp Business Account ID, Access Token, Phone Number ID
- Template-based messages only (WhatsApp requirement for business messaging)
- Pre-approved templates: CE deadline, payment notice, PLN alert, practical completion
- MeasureDeck does not charge extra — user pays their own WhatsApp/Twilio costs

**Email (always free via Resend):**
- No user setup required — uses MeasureDeck's Resend account on free tier
- 3,000 emails/month free. Above this: user can enter their own Resend/SendGrid API key.

---

### Step 56 — Commercial Health Score & Board Pack Generator

**File:** `src/app/(app)/projects/[projectId]/board-pack/page.tsx`  
**File:** `src/app/(app)/analytics/board-pack/page.tsx` (portfolio version)

The final feature — automated board-level reporting:

**Project Commercial Health Score (0–100):**
Calculated from:
- CVR margin vs tender margin: current deviation (±) (30 points)
- CE recovery rate: notified vs settled (20 points)
- Payment collection: DSO vs contract terms (20 points)
- Programme: % complete vs planned (15 points)
- Retention release status: overdue releases (10 points)
- HGCRA compliance: missed notices (5 points)

Displayed as: Score + Grade (A/B/C/D/F) + trend arrow + 3 key risk statements.

**Board Pack Generator:**
One-click generation of a board-ready commercial report:
- Page 1: Executive summary — project name, contract sum, current margin, health score
- Page 2: Financial position — CVR summary table, forecast outturn, variance from budget
- Page 3: CE summary — total CE pipeline, accepted, pending, disputed
- Page 4: Cash position — applications vs certified vs received, overdue debtors, retention
- Page 5: Programme — milestone status, EOT granted/claimed, critical path summary
- Page 6: Risk register — top 5 risks with mitigation status

Format: PDF (via @react-pdf/renderer) or PowerPoint (via pptxgenjs — open source, free).

**Distribution:** Email to board members list (from workspace settings). Scheduled monthly auto-generation option.

---

## IMPLEMENTATION SEQUENCE & DEPENDENCIES

```
Level 1 (Foundation)        → Must complete before ALL other levels
Level 2 (NEC4 CE Engine)    → Requires Level 1 migrations (Step 1)
Level 3 (HGCRA Suite)       → Requires Level 1 migrations (Step 2) 
Level 4 (CIS)               → Requires Level 1 migrations (Step 3), HMRC API credentials
Level 5 (Retention/Finance) → Requires Level 1 migrations (Steps 3-4)
Level 6 (Subcontracts)      → Requires Level 1 migrations (Step 3), Level 4 CIS for deductions
Level 7 (AI)                → Requires Levels 2, 6 for data to analyse
Level 8 (Analytics/Portal)  → Requires Levels 2-6 for data to display
Level 9 (Mobile/Premium)    → Requires Level 8 PWA base, Levels 3-5 for notification types
```

**Parallel work possible:**
- Level 2 + Level 3 can run in parallel (different DB tables, different feature areas)
- Level 4 + Level 5 can run in parallel
- Level 7 can start alongside Level 6 (AI features use data already in system)

---

## FREE API REFERENCE

| API | Provider | Cost | Use Case |
|-----|----------|------|----------|
| CIS Verification & Returns | HMRC Gov.uk | Free | Step 20-23 |
| Companies House Data | Companies House Gov.uk | Free | Step 24, 32 |
| HMRC Making Tax Digital VAT | HMRC Gov.uk | Free | VAT DRC calculation |
| Asta XER file import | Asta Powerproject (file export) | Free | Step 46 |
| MS Project XML import | Microsoft (file export) | Free | Step 46 |
| Xero OAuth API | Xero | Free for app developers | Step 47 |
| Resend Email | Resend (existing) | Free tier (3,000/month) | Step 19 |
| Web Push Notifications | Browser native | Free | Step 50 |
| Companies House Search | Companies House Gov.uk | Free | Step 32 |
| pptxgenjs (PowerPoint export) | Open source | Free | Step 56 |
| @react-pdf/renderer (PDF) | Open source | Free | Steps 15, 18 |
| next-pwa | Open source | Free | Step 50 |

## PAID ADD-ONS (USER BRINGS OWN CREDENTIALS — NEVER REQUIRED)

| Service | Why Optional | Where Configured |
|---------|-------------|-----------------|
| Twilio SMS | Contractor pays own SMS costs (~£0.05/SMS) | Workspace → Notifications → SMS |
| WhatsApp Business API | Requires Meta business verification | Workspace → Notifications → WhatsApp |
| BCIS Indices API | RICS subscription, indices available free as PDFs | Workspace → Settings → BCIS |
| Creditsafe/D&B | Companies House covers basic risk for free | Future enterprise add-on |
| Constructionline API | Manual document upload works equally well | Future enterprise add-on |

---

## BUILD RULES (NON-NEGOTIABLE)

1. **Each step ships independently** behind its feature flag. Broken step = flag off. No cascading failures.
2. **Seed data for every new page** — every new page must work without real data, using realistic seed fallback values. No empty state errors.
3. **TypeScript strict zero errors** — after each step completes, run `npx tsc --noEmit`. No step is "done" with TS errors.
4. **Mobile-first CSS** — all new pages are usable on a 375px-wide iPhone screen. Test before marking complete.
5. **Existing pages must not break** — run a smoke test of home, projects, CVR, and applications after each level completes.
6. **No hardcoded workspace IDs or user IDs** — all data is workspace-scoped via RLS.
7. **Every DB mutation is audited** — insert into `audit_events` for all creates/updates/deletes on critical commercial tables (CEs, applications, PLNs, subcontracts, CIS returns).
8. **Every generated document is immutable** — once a PDF is generated and issued (PLN, PC certificate, CIS return), it is stored and cannot be overwritten. Amendments create new versions.

---

*MeasureDeck V2 — Full Build Plan | June 2026 | 56 Steps | 9 Levels | £0 in required third-party API costs*

-- MeasureDeck V1 — Schema Expansion (Migration 003)
-- Adds commercial-depth columns to existing tables and new supporting tables.
-- All ALTER TABLE statements use ADD COLUMN IF NOT EXISTS for idempotency.
-- All CREATE TABLE statements use IF NOT EXISTS.
-- New tables: contract_documents, risk_register, daywork_sheets,
--             subcontract_orders, subcontract_applications

-- ─── 1. EXPAND: projects ─────────────────────────────────────────────────────
ALTER TABLE projects ADD COLUMN IF NOT EXISTS procurement_route       TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS main_contractor         TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS employer                TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS qs_lead                 UUID REFERENCES auth.users(id) ON DELETE SET NULL;
-- commercial_lead already exists as commercial_lead_id in 001; add alias column
ALTER TABLE projects ADD COLUMN IF NOT EXISTS commercial_lead         UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS programme_start         DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS programme_end           DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS sectional_completion    JSONB DEFAULT '[]';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS retention_percentage    NUMERIC(5,2) DEFAULT 5.0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS retention_release_1     NUMERIC(5,2) DEFAULT 50.0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS retention_release_2     NUMERIC(5,2) DEFAULT 50.0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS delay_damages_rate      NUMERIC(12,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS is_archived             BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS risk_status             TEXT DEFAULT 'amber';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS last_cvr_date           DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_manager         TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS site_address            JSONB DEFAULT '{}';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS region                  TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS sector                  TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_ref             TEXT;
-- contract_sum already exists in 001 (NUMERIC(15,2) DEFAULT 0) — skip
-- contract_type already exists in 001 (TEXT DEFAULT 'JCT') — skip

-- ─── 2. EXPAND: change_events ────────────────────────────────────────────────
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS delay_days                  INT DEFAULT 0;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS delay_type                  TEXT;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS programme_impact            TEXT;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS noti_ref                    TEXT;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS ce_type                     TEXT DEFAULT 'compensation_event';
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS risk_reduction_meeting      DATE;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS quotation_submitted_date    DATE;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS quotation_accepted_date     DATE;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS accepted_amount             NUMERIC(15,2);
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS ai_narrative                TEXT;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS subcontractor_impact        NUMERIC(15,2);
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS prelims_impact              NUMERIC(15,2);
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS overhead_percentage         NUMERIC(5,2) DEFAULT 12.5;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS profit_percentage           NUMERIC(5,2) DEFAULT 5.0;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS evidence_count              INT DEFAULT 0;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS linked_drawing_ids          UUID[] DEFAULT '{}';

-- ─── 3. EXPAND: applications ─────────────────────────────────────────────────
ALTER TABLE applications ADD COLUMN IF NOT EXISTS period_from              DATE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS period_to                DATE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS gross_cumulative         NUMERIC(15,2) DEFAULT 0;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS retention_held           NUMERIC(15,2) DEFAULT 0;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS net_cumulative           NUMERIC(15,2) DEFAULT 0;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS previously_certified     NUMERIC(15,2) DEFAULT 0;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS this_application         NUMERIC(15,2) DEFAULT 0;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS certified_amount         NUMERIC(15,2);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS certification_date       DATE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS payment_due_date         DATE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS final_date_for_payment   DATE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS payment_received_date    DATE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS payment_received_amount  NUMERIC(15,2);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS contra_charges           NUMERIC(15,2) DEFAULT 0;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS vat_amount               NUMERIC(15,2) DEFAULT 0;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS document_ref             TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS notes                    TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS submitted_by             UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS certified_by             UUID REFERENCES auth.users(id) ON DELETE SET NULL;
-- previously_certified / gross_value / net_certified / retention_held already exist in 001 under similar names — IF NOT EXISTS guards these

-- ─── 4. EXPAND: cvr_periods ──────────────────────────────────────────────────
ALTER TABLE cvr_periods ADD COLUMN IF NOT EXISTS forecast_final_account   NUMERIC(15,2);
-- risk_allowance already exists in 001 — IF NOT EXISTS is safe
ALTER TABLE cvr_periods ADD COLUMN IF NOT EXISTS opportunity_allowance     NUMERIC(15,2) DEFAULT 0;
ALTER TABLE cvr_periods ADD COLUMN IF NOT EXISTS approved_changes          NUMERIC(15,2) DEFAULT 0;
ALTER TABLE cvr_periods ADD COLUMN IF NOT EXISTS pending_changes           NUMERIC(15,2) DEFAULT 0;
ALTER TABLE cvr_periods ADD COLUMN IF NOT EXISTS prelims_budget            NUMERIC(15,2);
ALTER TABLE cvr_periods ADD COLUMN IF NOT EXISTS prelims_actual            NUMERIC(15,2);
ALTER TABLE cvr_periods ADD COLUMN IF NOT EXISTS prelims_forecast          NUMERIC(15,2);
-- notes already exists in 001 — IF NOT EXISTS is safe
ALTER TABLE cvr_periods ADD COLUMN IF NOT EXISTS period_month              INT;
ALTER TABLE cvr_periods ADD COLUMN IF NOT EXISTS period_year               INT;
ALTER TABLE cvr_periods ADD COLUMN IF NOT EXISTS approved_by               UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE cvr_periods ADD COLUMN IF NOT EXISTS submitted_by              UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ─── 5. EXPAND: final_accounts ───────────────────────────────────────────────
ALTER TABLE final_accounts ADD COLUMN IF NOT EXISTS contract_sum              NUMERIC(15,2);
ALTER TABLE final_accounts ADD COLUMN IF NOT EXISTS change_events_total       NUMERIC(15,2) DEFAULT 0;
ALTER TABLE final_accounts ADD COLUMN IF NOT EXISTS provisional_sums          NUMERIC(15,2) DEFAULT 0;
ALTER TABLE final_accounts ADD COLUMN IF NOT EXISTS dayworks                  NUMERIC(15,2) DEFAULT 0;
ALTER TABLE final_accounts ADD COLUMN IF NOT EXISTS fluctuations              NUMERIC(15,2) DEFAULT 0;
ALTER TABLE final_accounts ADD COLUMN IF NOT EXISTS loss_expense              NUMERIC(15,2) DEFAULT 0;
ALTER TABLE final_accounts ADD COLUMN IF NOT EXISTS contra_charges            NUMERIC(15,2) DEFAULT 0;
ALTER TABLE final_accounts ADD COLUMN IF NOT EXISTS agreed_amount             NUMERIC(15,2);
ALTER TABLE final_accounts ADD COLUMN IF NOT EXISTS settled_date              DATE;
ALTER TABLE final_accounts ADD COLUMN IF NOT EXISTS dispute_reference         TEXT;
ALTER TABLE final_accounts ADD COLUMN IF NOT EXISTS arbitration_commenced     BOOLEAN DEFAULT false;
-- notes already exists in 001 — IF NOT EXISTS is safe
ALTER TABLE final_accounts ADD COLUMN IF NOT EXISTS submitted_by              UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE final_accounts ADD COLUMN IF NOT EXISTS agreed_by                 UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ─── 6. EXPAND: suppliers ────────────────────────────────────────────────────
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS email                        TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS phone                        TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_name                 TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_email                TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_phone                TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS trade_category               TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS approved_status              TEXT DEFAULT 'pending';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS insurance_expiry             DATE;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS public_liability_amount      NUMERIC(12,2);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS employers_liability_amount   NUMERIC(12,2);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS professional_indemnity_amount NUMERIC(12,2);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS cis_registered               BOOLEAN DEFAULT false;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS cis_number                   TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS vat_registered               BOOLEAN DEFAULT false;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS vat_number                   TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS payment_terms                INT DEFAULT 30;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS bank_account_name            TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS bank_sort_code               TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS bank_account_number          TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS rating                       INT DEFAULT 0;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS tags                         TEXT[] DEFAULT '{}';

-- ─── 7. EXPAND: tasks ────────────────────────────────────────────────────────
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category          TEXT DEFAULT 'general';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS tags              TEXT[] DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS watchers          UUID[] DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS change_event_id   UUID REFERENCES change_events(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS application_id    UUID REFERENCES applications(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence        TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at      TIMESTAMPTZ;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ─── 8. EXPAND: schedule_items ───────────────────────────────────────────────
ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS wbs_code          TEXT;
ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS parent_id         UUID REFERENCES schedule_items(id) ON DELETE SET NULL;
ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS progress_percent   NUMERIC(5,2) DEFAULT 0;
ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS baseline_start     DATE;
ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS baseline_end       DATE;
ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS actual_start       DATE;
ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS actual_end         DATE;
ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS delay_event_id     UUID;
ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS colour             TEXT DEFAULT '#3B5EE8';
ALTER TABLE schedule_items ADD COLUMN IF NOT EXISTS notes              TEXT;

-- ─── 9. NEW TABLES ───────────────────────────────────────────────────────────

-- CONTRACT DOCUMENTS
CREATE TABLE IF NOT EXISTS contract_documents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL DEFAULT 'contract',
  title         TEXT NOT NULL,
  ref           TEXT,
  date_issued   DATE,
  date_executed DATE,
  version       TEXT,
  status        TEXT DEFAULT 'draft',
  storage_path  TEXT,
  file_size     BIGINT DEFAULT 0,
  notes         TEXT,
  created_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_contract_docs_project    ON contract_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_contract_docs_workspace  ON contract_documents(workspace_id);
ALTER TABLE contract_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "contract_docs_all" ON contract_documents;
CREATE POLICY "contract_docs_all" ON contract_documents FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()));
DROP TRIGGER IF EXISTS trg_contract_docs_updated_at ON contract_documents;
CREATE TRIGGER trg_contract_docs_updated_at
  BEFORE UPDATE ON contract_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RISK REGISTER
CREATE TABLE IF NOT EXISTS risk_register (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title               TEXT NOT NULL,
  description         TEXT,
  category            TEXT DEFAULT 'commercial',
  probability         INT DEFAULT 3,
  impact              INT DEFAULT 3,
  risk_score          INT GENERATED ALWAYS AS (probability * impact) STORED,
  status              TEXT DEFAULT 'open',
  owner               UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  mitigation          TEXT,
  contingency_amount  NUMERIC(12,2) DEFAULT 0,
  due_date            DATE,
  closed_date         DATE,
  created_by          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_risk_project    ON risk_register(project_id);
CREATE INDEX IF NOT EXISTS idx_risk_workspace  ON risk_register(workspace_id);
ALTER TABLE risk_register ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "risk_register_all" ON risk_register;
CREATE POLICY "risk_register_all" ON risk_register FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()));
DROP TRIGGER IF EXISTS trg_risk_updated_at ON risk_register;
CREATE TRIGGER trg_risk_updated_at
  BEFORE UPDATE ON risk_register
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- DAYWORK SHEETS
CREATE TABLE IF NOT EXISTS daywork_sheets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  change_event_id  UUID REFERENCES change_events(id) ON DELETE SET NULL,
  sheet_ref        TEXT NOT NULL,
  date_of_work     DATE NOT NULL,
  description      TEXT,
  labour_cost      NUMERIC(12,2) DEFAULT 0,
  plant_cost       NUMERIC(12,2) DEFAULT 0,
  materials_cost   NUMERIC(12,2) DEFAULT 0,
  total_cost       NUMERIC(12,2) GENERATED ALWAYS AS (labour_cost + plant_cost + materials_cost) STORED,
  status           TEXT DEFAULT 'draft',
  signed_by        TEXT,
  signed_date      DATE,
  storage_path     TEXT,
  created_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_dayworks_project    ON daywork_sheets(project_id);
CREATE INDEX IF NOT EXISTS idx_dayworks_workspace  ON daywork_sheets(workspace_id);
ALTER TABLE daywork_sheets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "daywork_sheets_all" ON daywork_sheets;
CREATE POLICY "daywork_sheets_all" ON daywork_sheets FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()));
DROP TRIGGER IF EXISTS trg_dayworks_updated_at ON daywork_sheets;
CREATE TRIGGER trg_dayworks_updated_at
  BEFORE UPDATE ON daywork_sheets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- NOTE: subcontract_orders / subcontract_applications skipped —
-- the live DB already has subcontractor_valuations + subcontractor_valuation_lines.

-- NOTE: audit_events already exists with entity_type + entity_id columns — no action needed.

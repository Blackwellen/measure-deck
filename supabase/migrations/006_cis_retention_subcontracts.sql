-- MeasureDeck V2 — CIS, Retention & Subcontracts (Migration 006)
-- Adds CIS verification, monthly returns, payment lines, retention ledger,
-- and subcontract order management tables.
-- All statements are additive-only.
-- Also wires up deferred FKs from migration 005 (applications.subcontract_order_id).

-- ─── 1. CIS RECORDS ──────────────────────────────────────────────────────────
-- Per-supplier HMRC CIS verification status.

CREATE TABLE IF NOT EXISTS cis_records (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  supplier_id           UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  utr                   TEXT NOT NULL,                    -- 10-digit Unique Tax Reference
  company_name          TEXT NOT NULL,
  verification_number   TEXT,
  verification_date     DATE,
  verification_expires_at DATE,
  status                TEXT NOT NULL DEFAULT 'unverified' CHECK (status IN (
                          'gross', 'net', 'higher_rate', 'unmatched', 'unverified', 'expired'
                        )),
  is_manual_override    BOOLEAN DEFAULT false,
  manual_override_note  TEXT,
  vat_registered        BOOLEAN DEFAULT false,
  vat_number            TEXT,
  last_verified_at      TIMESTAMPTZ,
  verified_by           UUID REFERENCES auth.users(id),
  hmrc_response         JSONB DEFAULT '{}'::jsonb,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, supplier_id)
);

ALTER TABLE cis_records ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cis_records_all" ON cis_records;
CREATE POLICY "cis_records_all" ON cis_records
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

-- ─── 2. CIS MONTHLY RETURNS ──────────────────────────────────────────────────
-- One row per tax month per workspace (19th–18th period).

CREATE TABLE IF NOT EXISTS cis_monthly_returns (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  tax_month         TEXT NOT NULL,                        -- format 'YYYY-MM' for the 19th-18th period
  tax_year          TEXT NOT NULL,                        -- format '2025-26'
  status            TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
                      'draft', 'submitted', 'accepted', 'rejected'
                    )),
  submission_date   TIMESTAMPTZ,
  hmrc_reference    TEXT,
  total_payments    NUMERIC(15,2) DEFAULT 0,
  total_deductions  NUMERIC(15,2) DEFAULT 0,
  xml_payload       TEXT,                                 -- the CIS300 XML
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, tax_month)
);

ALTER TABLE cis_monthly_returns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cis_monthly_returns_all" ON cis_monthly_returns;
CREATE POLICY "cis_monthly_returns_all" ON cis_monthly_returns
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

-- ─── 3. CIS PAYMENT LINES ────────────────────────────────────────────────────
-- One row per payment made to a CIS-registered subcontractor within a return.

CREATE TABLE IF NOT EXISTS cis_payment_lines (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id                UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  return_id                   UUID NOT NULL REFERENCES cis_monthly_returns(id) ON DELETE CASCADE,
  supplier_id                 UUID NOT NULL REFERENCES suppliers(id),
  application_id              UUID REFERENCES applications(id),
  gross_payment               NUMERIC(15,2) NOT NULL,
  materials_cost              NUMERIC(15,2) NOT NULL DEFAULT 0,
  labour_amount               NUMERIC(15,2) GENERATED ALWAYS AS (gross_payment - materials_cost) STORED,
  deduction_rate              NUMERIC(5,4) NOT NULL DEFAULT 0.20, -- 0.20=20%, 0.30=30%, 0=gross
  deduction_amount            NUMERIC(15,2) GENERATED ALWAYS AS (
                                ROUND((gross_payment - materials_cost) * deduction_rate, 2)
                              ) STORED,
  net_payment                 NUMERIC(15,2) GENERATED ALWAYS AS (
                                gross_payment - ROUND((gross_payment - materials_cost) * deduction_rate, 2)
                              ) STORED,
  is_domestic_reverse_charge  BOOLEAN DEFAULT false,
  payment_date                DATE NOT NULL,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cis_payment_lines_return   ON cis_payment_lines(return_id);
CREATE INDEX IF NOT EXISTS idx_cis_payment_lines_supplier ON cis_payment_lines(supplier_id);

ALTER TABLE cis_payment_lines ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cis_payment_lines_all" ON cis_payment_lines;
CREATE POLICY "cis_payment_lines_all" ON cis_payment_lines
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

-- ─── 4. SUBCONTRACT ORDERS ───────────────────────────────────────────────────
-- Subcontract order management — created before retention_ledger so FK can reference it.

CREATE TABLE IF NOT EXISTS subcontract_orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  supplier_id         UUID NOT NULL REFERENCES suppliers(id),
  order_number        TEXT NOT NULL,
  order_date          DATE,
  contract_form       TEXT NOT NULL CHECK (contract_form IN (
                        'NEC4_ECS', 'NEC4_PSC', 'JCT_DOM', 'JCT_SC', 'JCT_MW', 'bespoke'
                      )),
  contract_sum        NUMERIC(15,2) NOT NULL,
  retention_rate      NUMERIC(5,4) DEFAULT 0.05,          -- 5%
  defects_deduction_rate NUMERIC(5,4) DEFAULT 0,
  payment_terms_days  INTEGER DEFAULT 30,
  start_date          DATE,
  completion_date     DATE,
  scope_description   TEXT,
  cdm_role            TEXT CHECK (cdm_role IN (
                        'principal_contractor', 'principal_designer',
                        'contractor', 'designer', 'worker'
                      )),
  notice_period_days  INTEGER DEFAULT 7,
  status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
                        'draft', 'issued', 'active', 'completed', 'terminated', 'suspended'
                      )),
  issued_at           TIMESTAMPTZ,
  pdf_url             TEXT,                               -- stored in legal-notices bucket
  total_certified     NUMERIC(15,2) DEFAULT 0,
  total_paid          NUMERIC(15,2) DEFAULT 0,
  retention_held      NUMERIC(15,2) DEFAULT 0,
  created_by          UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subcontract_orders_project  ON subcontract_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_subcontract_orders_supplier ON subcontract_orders(supplier_id);

ALTER TABLE subcontract_orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subcontract_orders_all" ON subcontract_orders;
CREATE POLICY "subcontract_orders_all" ON subcontract_orders
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

-- ─── 5. RETENTION LEDGER ─────────────────────────────────────────────────────
-- Track retention deductions and moiety releases.

CREATE TABLE IF NOT EXISTS retention_ledger (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  application_id        UUID REFERENCES applications(id),
  subcontract_order_id  UUID REFERENCES subcontract_orders(id),
  entry_type            TEXT NOT NULL CHECK (entry_type IN ('deduction', 'release')),
  moiety                TEXT NOT NULL CHECK (moiety IN ('first', 'second', 'both')),
  amount                NUMERIC(15,2) NOT NULL,
  release_trigger       TEXT CHECK (release_trigger IN (
                          'pc_issued', 'dlp_end', 'agreement', 'dispute_settlement'
                        )),
  notes                 TEXT,
  entry_date            DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by            UUID REFERENCES auth.users(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_retention_ledger_project ON retention_ledger(project_id);

ALTER TABLE retention_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "retention_ledger_all" ON retention_ledger;
CREATE POLICY "retention_ledger_all" ON retention_ledger
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

-- ─── 6. DEFERRED FK WIRES ────────────────────────────────────────────────────
-- applications.subcontract_order_id deferred from migration 005 until
-- subcontract_orders existed.

ALTER TABLE applications ADD COLUMN IF NOT EXISTS subcontract_order_id UUID REFERENCES subcontract_orders(id);

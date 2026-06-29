-- MeasureDeck V2 — HGCRA Compliance (Migration 005)
-- Adds Pay Less Notice and S112 Suspension Notice tables for HGCRA 1996 compliance.
-- All statements are additive-only.
-- Depends on: applications table (created in 001 as payment_applications, aliased in 003).
-- NOTE: applications.subcontract_order_id FK deferred to migration 006 after
--       subcontract_orders is created.

-- ─── 1. PAY LESS NOTICES ─────────────────────────────────────────────────────
-- HGCRA s111 pay less notices issued against payment applications.

CREATE TABLE IF NOT EXISTS pay_less_notices (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id            UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  application_id          UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  notice_date             DATE NOT NULL,
  notified_sum            NUMERIC(15,2) NOT NULL,         -- amount from payment notice
  withheld_items          JSONB DEFAULT '[]'::jsonb,      -- [{description, amount}, ...]
  withheld_amount         NUMERIC(15,2) NOT NULL DEFAULT 0,
  amount_to_pay           NUMERIC(15,2) GENERATED ALWAYS AS (notified_sum - withheld_amount) STORED,
  grounds                 TEXT,
  prescribed_period_end   DATE,
  status                  TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
                            'draft', 'issued', 'acknowledged', 'disputed'
                          )),
  issued_at               TIMESTAMPTZ,
  pdf_url                 TEXT,                           -- stored in legal-notices bucket (immutable)
  received_confirmation_at TIMESTAMPTZ,
  issued_by               UUID REFERENCES auth.users(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pay_less_notices_application ON pay_less_notices(application_id);

ALTER TABLE pay_less_notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pay_less_notices_all" ON pay_less_notices;
CREATE POLICY "pay_less_notices_all" ON pay_less_notices
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

-- ─── 2. SUSPENSION NOTICES ───────────────────────────────────────────────────
-- S112 HGCRA 1996 right to suspend performance notices.

CREATE TABLE IF NOT EXISTS suspension_notices (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id              UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  application_id            UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  notice_date               DATE NOT NULL,
  grounds                   TEXT NOT NULL,                -- "Failed to pay £X by [date] without valid PLN"
  notice_period_days        INTEGER NOT NULL DEFAULT 7,
  suspension_effective_date DATE,                         -- notice_date + notice_period_days
  suspension_lifted_date    DATE,
  days_suspended            INTEGER GENERATED ALWAYS AS (
                              CASE
                                WHEN suspension_lifted_date IS NOT NULL
                                 AND suspension_effective_date IS NOT NULL
                                THEN (suspension_lifted_date - suspension_effective_date)
                                ELSE NULL
                              END
                            ) STORED,
  eot_entitlement_days      INTEGER,                      -- equals days_suspended
  status                    TEXT NOT NULL DEFAULT 'notice_issued' CHECK (status IN (
                              'notice_issued', 'suspended', 'lifted', 'withdrawn'
                            )),
  pdf_url                   TEXT,
  reinstatement_pdf_url     TEXT,
  issued_at                 TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_suspension_notices_application ON suspension_notices(application_id);

ALTER TABLE suspension_notices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "suspension_notices_all" ON suspension_notices;
CREATE POLICY "suspension_notices_all" ON suspension_notices
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

-- ─── 3. EXPAND: applications — HGCRA columns ─────────────────────────────────
-- final_date_for_payment already added in migration 003 — IF NOT EXISTS guards it.
-- subcontract_order_id FK added in migration 006 after subcontract_orders exists.

ALTER TABLE applications ADD COLUMN IF NOT EXISTS contract_type            TEXT DEFAULT 'JCT'
                           CHECK (contract_type IN ('JCT', 'NEC4', 'bespoke', 'other'));
ALTER TABLE applications ADD COLUMN IF NOT EXISTS payment_notice_due_date  DATE;
-- final_date_for_payment already added in 003; IF NOT EXISTS is safe
ALTER TABLE applications ADD COLUMN IF NOT EXISTS final_date_for_payment   DATE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS prescribed_period_days   INTEGER DEFAULT 7;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS notified_sum             NUMERIC(15,2);
ALTER TABLE applications ADD COLUMN IF NOT EXISTS hgcra_compliant          BOOLEAN DEFAULT true;

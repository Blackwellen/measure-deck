-- MeasureDeck V2 — Lifecycle & Analytics (Migration 007)
-- Adds adjudication cases, practical completion, snagging, cashflow forecasts,
-- and workspace feature flag overrides.
-- All statements are additive-only.
-- Depends on: subcontract_orders (006), change_events (001), applications (001/003).

-- ─── 1. ADJUDICATION CASES ───────────────────────────────────────────────────
-- HGCRA adjudication case tracking with statutory deadlines.

CREATE TABLE IF NOT EXISTS adjudication_cases (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id                UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id                  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  case_number                 TEXT NOT NULL,
  dispute_type                TEXT NOT NULL CHECK (dispute_type IN (
                                'final_certificate', 'pay_less_notice', 'compensation_event',
                                'prolongation', 'termination', 'defects', 'other'
                              )),
  responding_party            TEXT,
  dispute_value               NUMERIC(15,2),
  adjudicator_name            TEXT,
  nominating_body             TEXT CHECK (nominating_body IN (
                                'RICS', 'RIBA', 'CIArb', 'TeCSA', 'CIOB', 'other'
                              )),
  notice_of_adjudication_date DATE,
  appointment_date            DATE,
  referral_due_date           DATE GENERATED ALWAYS AS (
                                appointment_date + INTERVAL '7 days'
                              ) STORED,
  response_due_date           DATE,
  reply_due_date              DATE,
  decision_due_date           DATE GENERATED ALWAYS AS (
                                appointment_date + INTERVAL '28 days'
                              ) STORED,
  status                      TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                                'pending', 'appointed', 'referral_submitted',
                                'response_received', 'decided', 'settled', 'withdrawn'
                              )),
  decision_date               DATE,
  decision_in_favour_of       TEXT CHECK (decision_in_favour_of IN (
                                'claimant', 'respondent', 'split'
                              )),
  amount_awarded              NUMERIC(15,2),
  costs_awarded               NUMERIC(15,2),
  decision_notes              TEXT,
  pleadings                   JSONB DEFAULT '{}'::jsonb,
  costs_data                  JSONB DEFAULT '{}'::jsonb,
  linked_change_event_ids     UUID[] DEFAULT '{}'::uuid[],
  linked_application_ids      UUID[] DEFAULT '{}'::uuid[],
  created_by                  UUID REFERENCES auth.users(id),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE adjudication_cases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "adjudication_cases_all" ON adjudication_cases;
CREATE POLICY "adjudication_cases_all" ON adjudication_cases
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

-- ─── 2. PRACTICAL COMPLETIONS ────────────────────────────────────────────────
-- PC certificates — triggers DLP period and first-moiety retention release.

CREATE TABLE IF NOT EXISTS practical_completions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id            UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id              UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  section_reference       TEXT DEFAULT 'whole_works',
  pc_date                 DATE NOT NULL,
  certificate_number      TEXT NOT NULL,
  dlp_months              INTEGER NOT NULL DEFAULT 12,
  dlp_end_date            DATE,
  outstanding_items       JSONB DEFAULT '[]'::jsonb,
  certifier_name          TEXT,
  certifier_organisation  TEXT,
  status                  TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued')),
  issued_at               TIMESTAMPTZ,
  pdf_url                 TEXT,
  mgd_issued_at           TIMESTAMPTZ,
  mgd_pdf_url             TEXT,
  created_by              UUID REFERENCES auth.users(id),
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_backdate CHECK (pc_date <= CURRENT_DATE + INTERVAL '1 day')
);

ALTER TABLE practical_completions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "practical_completions_all" ON practical_completions;
CREATE POLICY "practical_completions_all" ON practical_completions
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

-- ─── 3. SNAGGING ITEMS ───────────────────────────────────────────────────────
-- Snag and defect items linked to practical completion certificates.

CREATE TABLE IF NOT EXISTS snagging_items (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id          UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  pc_id                 UUID REFERENCES practical_completions(id),
  snag_number           TEXT NOT NULL,                    -- auto-gen format SNX-001
  type                  TEXT NOT NULL DEFAULT 'snag' CHECK (type IN ('snag', 'defect')),
  location              TEXT NOT NULL,
  description           TEXT NOT NULL,
  photo_urls            TEXT[] DEFAULT '{}'::text[],
  priority              TEXT NOT NULL DEFAULT 'major' CHECK (priority IN (
                          'critical', 'major', 'minor'
                        )),
  status                TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
                          'open', 'in_progress', 'closed', 'disputed'
                        )),
  assigned_to           TEXT,
  trade                 TEXT,
  due_date              DATE,
  closed_at             TIMESTAMPTZ,
  closed_by             UUID REFERENCES auth.users(id),
  completion_photo_urls TEXT[] DEFAULT '{}'::text[],
  completion_notes      TEXT,
  raised_by             UUID REFERENCES auth.users(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_snagging_items_project ON snagging_items(project_id);

ALTER TABLE snagging_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "snagging_items_all" ON snagging_items;
CREATE POLICY "snagging_items_all" ON snagging_items
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

-- ─── 4. CASHFLOW FORECASTS ───────────────────────────────────────────────────
-- Monthly S-curve cashflow — planned vs actual vs forecast per project.

CREATE TABLE IF NOT EXISTS cashflow_forecasts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  month_year       TEXT NOT NULL,                         -- format 'YYYY-MM'
  revenue_planned  NUMERIC(15,2) DEFAULT 0,
  cost_planned     NUMERIC(15,2) DEFAULT 0,
  revenue_actual   NUMERIC(15,2) DEFAULT 0,               -- populated from certified applications
  cost_actual      NUMERIC(15,2) DEFAULT 0,               -- populated from supplier payments
  revenue_forecast NUMERIC(15,2) DEFAULT 0,
  cost_forecast    NUMERIC(15,2) DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(project_id, month_year)
);

CREATE INDEX IF NOT EXISTS idx_cashflow_forecasts_project ON cashflow_forecasts(project_id);

ALTER TABLE cashflow_forecasts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cashflow_forecasts_all" ON cashflow_forecasts;
CREATE POLICY "cashflow_forecasts_all" ON cashflow_forecasts
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

-- ─── 5. WORKSPACE FEATURE FLAGS ──────────────────────────────────────────────
-- Per-workspace feature flag overrides (supplements global feature_flag_overrides in 001).
-- NOTE: feature_flag_overrides already exists in migration 001 with a slightly different schema.
-- This table is named workspace_feature_flags to avoid conflict.

CREATE TABLE IF NOT EXISTS workspace_feature_flags (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  flag_name    TEXT NOT NULL,
  enabled      BOOLEAN NOT NULL DEFAULT false,
  set_by       UUID REFERENCES auth.users(id),
  set_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, flag_name)
);

ALTER TABLE workspace_feature_flags ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "workspace_feature_flags_all" ON workspace_feature_flags;
CREATE POLICY "workspace_feature_flags_all" ON workspace_feature_flags
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

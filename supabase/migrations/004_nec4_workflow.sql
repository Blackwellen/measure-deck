-- MeasureDeck V2 — NEC4 Workflow (Migration 004)
-- Adds NEC4 CE state machine, early warning register, and programme notifications.
-- All statements are additive-only (CREATE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS).
-- RLS uses workspace_memberships subquery pattern (consistent with migrations 002/003).

-- ─── 1. CE WORKFLOW STATES ───────────────────────────────────────────────────
-- One row per state transition on a NEC4 compensation event.

CREATE TABLE IF NOT EXISTS ce_workflow_states (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id             UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  change_event_id          UUID NOT NULL REFERENCES change_events(id) ON DELETE CASCADE,
  state                    TEXT NOT NULL CHECK (state IN (
                             'pm_instruction_issued',
                             'ce_notified',
                             'quotation_requested',
                             'quotation_submitted',
                             'pm_response_received',
                             'accepted',
                             'deemed_accepted',
                             'implemented',
                             'disputed',
                             'withdrawn'
                           )),
  state_changed_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  state_changed_by         UUID REFERENCES auth.users(id),
  clause_reference         TEXT,                          -- e.g. '60.1(1)'
  notification_date        TIMESTAMPTZ,
  instruction_date         TIMESTAMPTZ,
  pm_instruction_ref       TEXT,
  quotation_submitted_at   TIMESTAMPTZ,
  quotation_due_date       TIMESTAMPTZ,
  acceptance_due_date      TIMESTAMPTZ,
  deemed_accepted_date     TIMESTAMPTZ,
  pm_response_at           TIMESTAMPTZ,
  pm_response              TEXT CHECK (pm_response IN ('accepted', 'not_accepted', 'awaiting')),
  notes                    TEXT,
  metadata                 JSONB DEFAULT '{}'::jsonb,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ce_workflow_states_ce_id    ON ce_workflow_states(change_event_id);
CREATE INDEX IF NOT EXISTS idx_ce_workflow_states_workspace ON ce_workflow_states(workspace_id);

ALTER TABLE ce_workflow_states ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ce_workflow_states_all" ON ce_workflow_states;
CREATE POLICY "ce_workflow_states_all" ON ce_workflow_states
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

-- ─── 2. EARLY WARNINGS ───────────────────────────────────────────────────────
-- NEC4 Early Warning Register entries (clause 15).

CREATE TABLE IF NOT EXISTS early_warnings (
  id                              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id                    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id                      UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  ew_number                       TEXT NOT NULL,          -- auto-gen format EW-001
  title                           TEXT NOT NULL,
  description                     TEXT,
  category                        TEXT CHECK (category IN (
                                    'cost', 'time', 'quality', 'safety', 'environmental', 'other'
                                  )),
  risk_owner                      TEXT,
  cost_impact                     NUMERIC(15,2),
  programme_impact_days           INTEGER,
  likelihood                      INTEGER CHECK (likelihood BETWEEN 1 AND 5),
  impact                          INTEGER CHECK (impact BETWEEN 1 AND 5),
  risk_score                      INTEGER GENERATED ALWAYS AS (likelihood * impact) STORED,
  status                          TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
                                    'open', 'reducing', 'mitigated', 'converted_to_ce', 'closed'
                                  )),
  linked_ce_id                    UUID REFERENCES change_events(id),
  risk_reduction_meeting_date     TIMESTAMPTZ,
  risk_reduction_meeting_attendees JSONB DEFAULT '[]'::jsonb,
  mitigation_actions              JSONB DEFAULT '[]'::jsonb,
  created_by                      UUID REFERENCES auth.users(id),
  created_at                      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_early_warnings_project   ON early_warnings(project_id);
CREATE INDEX IF NOT EXISTS idx_early_warnings_workspace ON early_warnings(workspace_id);

ALTER TABLE early_warnings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "early_warnings_all" ON early_warnings;
CREATE POLICY "early_warnings_all" ON early_warnings
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

-- ─── 3. PROGRAMME NOTIFICATIONS ──────────────────────────────────────────────
-- NEC4 clause 32 programme submissions and PM responses.

CREATE TABLE IF NOT EXISTS programme_notifications (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id                UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id                  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  revision_letter             TEXT NOT NULL,              -- e.g. 'A', 'B', 'C'
  submission_date             DATE NOT NULL,
  due_date                    DATE,
  file_url                    TEXT,
  pm_response                 TEXT CHECK (pm_response IN ('accepted', 'not_accepted', 'awaiting'))
                                DEFAULT 'awaiting',
  pm_response_date            TIMESTAMPTZ,
  rejection_reasons           TEXT,
  is_accepted_baseline        BOOLEAN DEFAULT false,
  is_ce_assessment_baseline   BOOLEAN DEFAULT false,
  float_analysis              JSONB DEFAULT '{}'::jsonb,
  created_by                  UUID REFERENCES auth.users(id),
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_programme_notifications_project ON programme_notifications(project_id);

ALTER TABLE programme_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "programme_notifications_all" ON programme_notifications;
CREATE POLICY "programme_notifications_all" ON programme_notifications
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

-- ─── 4. EXPAND: change_events — NEC4 columns ─────────────────────────────────
-- early_warning_id FK added after early_warnings table is created above.

ALTER TABLE change_events ADD COLUMN IF NOT EXISTS nec4_clause             TEXT;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS pm_instruction_ref      TEXT;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS notification_date       DATE;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS quotation_due_date      DATE;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS acceptance_due_date     DATE;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS programme_impact_days   INTEGER DEFAULT 0;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS eot_granted_days        INTEGER DEFAULT 0;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS quotation_data          JSONB DEFAULT '{}'::jsonb;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS early_warning_id        UUID REFERENCES early_warnings(id);

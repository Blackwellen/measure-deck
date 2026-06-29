-- ============================================================
-- Migration 010: Changes & Claims extended schema
-- MeasureDeck v1.0
-- ============================================================

-- ─── ALTER: extend change_events ────────────────────────────────────────────
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS ce_number              TEXT;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS clause_reference       TEXT;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS event_date             DATE;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS notification_date      DATE;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS quotation_due_date     DATE;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS acceptance_due_date    DATE;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS days_claimed           INTEGER DEFAULT 0;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS days_agreed            INTEGER;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS contractor_assessment  NUMERIC(14,2);
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS pm_assessment          NUMERIC(14,2);
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS evidence_strength_score INTEGER
  CHECK (evidence_strength_score BETWEEN 1 AND 5);
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS ai_confidence_score    NUMERIC(4,3)
  CHECK (ai_confidence_score BETWEEN 0 AND 1);
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS priority               TEXT DEFAULT 'medium'
  CHECK (priority IN ('low','medium','high','critical'));
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS rejection_reason       TEXT;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS dispute_reason         TEXT;

-- ─── 1. change_pricing_lines ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS change_pricing_lines (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_event_id   UUID NOT NULL REFERENCES change_events(id) ON DELETE CASCADE,
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  description       TEXT NOT NULL,
  quantity          NUMERIC(10,3) DEFAULT 1,
  unit              TEXT DEFAULT 'item',
  rate              NUMERIC(14,2) NOT NULL DEFAULT 0,
  amount            NUMERIC(14,2) GENERATED ALWAYS AS (quantity * rate) STORED,
  category          TEXT CHECK (category IN ('labour','plant','materials','subcontract','prelims','risk','overhead','other')),
  is_disputed       BOOLEAN DEFAULT false,
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE change_pricing_lines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_members_all_change_pricing_lines" ON change_pricing_lines;
CREATE POLICY "workspace_members_all_change_pricing_lines"
  ON change_pricing_lines
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_change_pricing_lines_change_event_id
  ON change_pricing_lines (change_event_id);
CREATE INDEX IF NOT EXISTS idx_change_pricing_lines_workspace_id
  ON change_pricing_lines (workspace_id);

-- ─── 2. change_programme_impacts ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS change_programme_impacts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_event_id       UUID NOT NULL REFERENCES change_events(id) ON DELETE CASCADE,
  workspace_id          UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  impact_type           TEXT CHECK (impact_type IN ('delay','acceleration','disruption','prolongation','float_erosion')),
  days_claimed          INTEGER DEFAULT 0,
  days_agreed           INTEGER,
  start_date            DATE,
  end_date              DATE,
  critical_path         BOOLEAN DEFAULT false,
  narrative             TEXT,
  delay_analysis_method TEXT CHECK (delay_analysis_method IN ('tia','windows','collapsed_as_built','as_planned_vs_as_built','impacted_as_planned')),
  created_at            TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE change_programme_impacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_members_all_change_programme_impacts" ON change_programme_impacts;
CREATE POLICY "workspace_members_all_change_programme_impacts"
  ON change_programme_impacts
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_change_programme_impacts_change_event_id
  ON change_programme_impacts (change_event_id);
CREATE INDEX IF NOT EXISTS idx_change_programme_impacts_workspace_id
  ON change_programme_impacts (workspace_id);

-- ─── 3. change_evidence_items ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS change_evidence_items (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_event_id    UUID NOT NULL REFERENCES change_events(id) ON DELETE CASCADE,
  workspace_id       UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title              TEXT NOT NULL,
  evidence_type      TEXT CHECK (evidence_type IN ('photo','document','email','drawing','site_diary','rfi','instruction','report','notice','other')),
  file_path          TEXT,
  file_size_bytes    INTEGER,
  strength_score     INTEGER CHECK (strength_score BETWEEN 1 AND 5),
  linked_at          TIMESTAMPTZ DEFAULT now(),
  uploaded_by        UUID REFERENCES auth.users(id),
  notes              TEXT,
  created_at         TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE change_evidence_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_members_all_change_evidence_items" ON change_evidence_items;
CREATE POLICY "workspace_members_all_change_evidence_items"
  ON change_evidence_items
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_change_evidence_items_change_event_id
  ON change_evidence_items (change_event_id);
CREATE INDEX IF NOT EXISTS idx_change_evidence_items_workspace_id
  ON change_evidence_items (workspace_id);

-- ─── 4. change_correspondence_threads ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS change_correspondence_threads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_event_id     UUID NOT NULL REFERENCES change_events(id) ON DELETE CASCADE,
  workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  subject             TEXT NOT NULL,
  direction           TEXT NOT NULL CHECK (direction IN ('sent','received')),
  correspondent_name  TEXT,
  correspondent_email TEXT,
  channel             TEXT CHECK (channel IN ('email','letter','site_meeting','formal_notice','other')),
  sent_at             TIMESTAMPTZ NOT NULL,
  body_summary        TEXT,
  attachments_count   INTEGER DEFAULT 0,
  thread_root_id      UUID REFERENCES change_correspondence_threads(id),
  created_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE change_correspondence_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_members_all_change_correspondence_threads" ON change_correspondence_threads;
CREATE POLICY "workspace_members_all_change_correspondence_threads"
  ON change_correspondence_threads
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_change_correspondence_threads_change_event_id
  ON change_correspondence_threads (change_event_id);
CREATE INDEX IF NOT EXISTS idx_change_correspondence_threads_workspace_id
  ON change_correspondence_threads (workspace_id);

-- ─── 5. change_tasks ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS change_tasks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_event_id  UUID NOT NULL REFERENCES change_events(id) ON DELETE CASCADE,
  workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  status           TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','blocked','done')),
  priority         TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','critical')),
  assigned_to      UUID REFERENCES auth.users(id),
  assigned_name    TEXT,
  due_date         DATE,
  completed_at     TIMESTAMPTZ,
  created_by       UUID REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE change_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_members_all_change_tasks" ON change_tasks;
CREATE POLICY "workspace_members_all_change_tasks"
  ON change_tasks
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_change_tasks_change_event_id
  ON change_tasks (change_event_id);
CREATE INDEX IF NOT EXISTS idx_change_tasks_workspace_id
  ON change_tasks (workspace_id);

-- ─── 6. change_ai_narratives ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS change_ai_narratives (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_event_id  UUID NOT NULL REFERENCES change_events(id) ON DELETE CASCADE,
  workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  version          INTEGER NOT NULL DEFAULT 1,
  narrative_type   TEXT CHECK (narrative_type IN ('executive','technical','legal','response')),
  content          TEXT NOT NULL,
  confidence_score NUMERIC(4,3) CHECK (confidence_score BETWEEN 0 AND 1),
  word_count       INTEGER,
  approved_by      UUID REFERENCES auth.users(id),
  approved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE change_ai_narratives ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_members_all_change_ai_narratives" ON change_ai_narratives;
CREATE POLICY "workspace_members_all_change_ai_narratives"
  ON change_ai_narratives
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_change_ai_narratives_change_event_id
  ON change_ai_narratives (change_event_id);
CREATE INDEX IF NOT EXISTS idx_change_ai_narratives_workspace_id
  ON change_ai_narratives (workspace_id);

-- ─── 7. change_audit_events ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS change_audit_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_event_id  UUID NOT NULL REFERENCES change_events(id) ON DELETE CASCADE,
  workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  action           TEXT NOT NULL,
  actor_name       TEXT NOT NULL,
  actor_role       TEXT,
  old_value        JSONB,
  new_value        JSONB,
  notes            TEXT,
  performed_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE change_audit_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_members_all_change_audit_events" ON change_audit_events;
CREATE POLICY "workspace_members_all_change_audit_events"
  ON change_audit_events
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_change_audit_events_change_event_id
  ON change_audit_events (change_event_id);
CREATE INDEX IF NOT EXISTS idx_change_audit_events_workspace_id
  ON change_audit_events (workspace_id);
CREATE INDEX IF NOT EXISTS idx_change_audit_events_performed_at
  ON change_audit_events (performed_at DESC);

-- ─── 8. nec4_workflow_steps ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nec4_workflow_steps (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_event_id     UUID NOT NULL REFERENCES change_events(id) ON DELETE CASCADE,
  workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  step_number         INTEGER NOT NULL,
  step_name           TEXT NOT NULL,
  step_type           TEXT NOT NULL CHECK (step_type IN ('early_warning','pm_instruction','ce_notification','quotation','pm_assessment','acceptance','implementation')),
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','overdue','waived')),
  due_date            DATE,
  completed_date      DATE,
  completed_by_name   TEXT,
  clause_reference    TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE nec4_workflow_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_members_all_nec4_workflow_steps" ON nec4_workflow_steps;
CREATE POLICY "workspace_members_all_nec4_workflow_steps"
  ON nec4_workflow_steps
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_nec4_workflow_steps_change_event_id
  ON nec4_workflow_steps (change_event_id);
CREATE INDEX IF NOT EXISTS idx_nec4_workflow_steps_workspace_id
  ON nec4_workflow_steps (workspace_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_nec4_workflow_steps_event_step
  ON nec4_workflow_steps (change_event_id, step_number);

-- ─── 9. change_deadlines ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS change_deadlines (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_event_id   UUID NOT NULL REFERENCES change_events(id) ON DELETE CASCADE,
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  deadline_type     TEXT NOT NULL CHECK (deadline_type IN ('quotation_due','acceptance_due','notification_due','early_warning','pln_cutoff','dispute_window')),
  due_date          DATE NOT NULL,
  status            TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming','due_today','overdue','completed','waived')),
  reminder_sent_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE change_deadlines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_members_all_change_deadlines" ON change_deadlines;
CREATE POLICY "workspace_members_all_change_deadlines"
  ON change_deadlines
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_change_deadlines_change_event_id
  ON change_deadlines (change_event_id);
CREATE INDEX IF NOT EXISTS idx_change_deadlines_workspace_id
  ON change_deadlines (workspace_id);
CREATE INDEX IF NOT EXISTS idx_change_deadlines_due_date
  ON change_deadlines (due_date);

-- ─── 10. change_application_links ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS change_application_links (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_event_id   UUID NOT NULL REFERENCES change_events(id) ON DELETE CASCADE,
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  application_id    UUID NOT NULL REFERENCES payment_applications(id) ON DELETE CASCADE,
  amount_included   NUMERIC(14,2),
  notes             TEXT,
  linked_at         TIMESTAMPTZ DEFAULT now(),
  UNIQUE (change_event_id, application_id)
);

ALTER TABLE change_application_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_members_all_change_application_links" ON change_application_links;
CREATE POLICY "workspace_members_all_change_application_links"
  ON change_application_links
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_change_application_links_change_event_id
  ON change_application_links (change_event_id);
CREATE INDEX IF NOT EXISTS idx_change_application_links_workspace_id
  ON change_application_links (workspace_id);
CREATE INDEX IF NOT EXISTS idx_change_application_links_application_id
  ON change_application_links (application_id);

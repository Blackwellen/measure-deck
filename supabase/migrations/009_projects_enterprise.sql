-- MeasureDeck V1 — Projects Enterprise (Migration 009)
-- Adds hero images, extended project fields, contacts, milestones, suppliers,
-- schedule activities, activity feed, audit log, governance settings, roles,
-- and final account items for the 17 enterprise design screens.
-- All statements are additive-only (CREATE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS).
-- RLS uses workspace_memberships subquery pattern (consistent with migrations 002–008).

-- ─── 1. EXPAND: projects — extended fields ────────────────────────────────────
ALTER TABLE projects ADD COLUMN IF NOT EXISTS hero_image_url            TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS hero_image_path           TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS risk_level                TEXT DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high'));
ALTER TABLE projects ADD COLUMN IF NOT EXISTS margin_pct                NUMERIC(5,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS certified_pct             NUMERIC(5,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS planned_completion        DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS practical_completion      DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS defects_period_end        DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS final_account_target      DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contract_type_ext         TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS retention_pct_ext         NUMERIC(4,2) DEFAULT 3.0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS payment_terms_days        INTEGER DEFAULT 21;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS open_changes_count        INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS applications_outstanding  INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS forecast_final_account    NUMERIC(14,2);

-- ─── 2. EXPAND: project_contracts — extended fields ──────────────────────────
ALTER TABLE project_contracts ADD COLUMN IF NOT EXISTS retention_pct           NUMERIC(4,2) DEFAULT 3.0;
ALTER TABLE project_contracts ADD COLUMN IF NOT EXISTS defects_retention_pct   NUMERIC(4,2) DEFAULT 2.0;
ALTER TABLE project_contracts ADD COLUMN IF NOT EXISTS notice_period_days      INTEGER DEFAULT 7;
ALTER TABLE project_contracts ADD COLUMN IF NOT EXISTS defects_period_months   INTEGER DEFAULT 12;

-- ─── 3. EXPAND: change_events — extended fields ───────────────────────────────
-- Note: change_events is the canonical changes table (project_changes does not exist).
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS risk_level        TEXT DEFAULT 'low' CHECK (risk_level IN ('low','medium','high'));
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS assessed_value    NUMERIC(14,2);
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS decision_due_date DATE;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS package           TEXT;
ALTER TABLE change_events ADD COLUMN IF NOT EXISTS raised_by         TEXT;

-- ─── 4. EXPAND: payment_applications — extended fields ───────────────────────
ALTER TABLE payment_applications ADD COLUMN IF NOT EXISTS disputed_value     NUMERIC(14,2) DEFAULT 0;
ALTER TABLE payment_applications ADD COLUMN IF NOT EXISTS certification_pct  NUMERIC(5,2);
ALTER TABLE payment_applications ADD COLUMN IF NOT EXISTS related_notice     TEXT;
ALTER TABLE payment_applications ADD COLUMN IF NOT EXISTS evidence_count     INTEGER DEFAULT 0;

-- ─── 5. PROJECT CONTACTS ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_contacts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  role         TEXT NOT NULL,
  company      TEXT,
  email        TEXT,
  phone        TEXT,
  is_primary   BOOLEAN DEFAULT false,
  contact_type TEXT DEFAULT 'internal' CHECK (contact_type IN ('internal','client','contractor','consultant','other')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by   UUID REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS idx_project_contacts_project ON project_contacts(project_id);
ALTER TABLE project_contacts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "project_contacts_workspace" ON project_contacts;
CREATE POLICY "project_contacts_workspace" ON project_contacts
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()));

-- ─── 6. PROJECT MILESTONES ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_milestones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id    UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  baseline_date DATE,
  forecast_date DATE,
  actual_date   DATE,
  status        TEXT DEFAULT 'on_track' CHECK (status IN ('on_track','at_risk','delayed','complete')),
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_project_milestones_project ON project_milestones(project_id);
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "project_milestones_workspace" ON project_milestones;
CREATE POLICY "project_milestones_workspace" ON project_milestones
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()));

-- ─── 7. PROJECT SUPPLIERS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_suppliers (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id       UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id         UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  supplier_name      TEXT NOT NULL,
  package            TEXT,
  package_ref        TEXT,
  contact_name       TEXT,
  contact_email      TEXT,
  contact_phone      TEXT,
  contract_value     NUMERIC(14,2),
  committed_spend    NUMERIC(14,2),
  performance_score  INTEGER CHECK (performance_score BETWEEN 0 AND 100),
  insurance_expiry   DATE,
  rams_status        TEXT DEFAULT 'pending'  CHECK (rams_status    IN ('compliant','pending','outstanding','expired')),
  payment_status     TEXT DEFAULT 'current'  CHECK (payment_status IN ('paid','current','overdue','on_hold')),
  lead_time_risk     TEXT DEFAULT 'low'      CHECK (lead_time_risk  IN ('low','medium','high')),
  risk_level         TEXT DEFAULT 'low'      CHECK (risk_level      IN ('low','medium','high')),
  status             TEXT DEFAULT 'active'   CHECK (status          IN ('active','approved','suspended','complete')),
  overdue_amount     NUMERIC(14,2),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by         UUID REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS idx_project_suppliers_project ON project_suppliers(project_id);
ALTER TABLE project_suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "project_suppliers_workspace" ON project_suppliers;
CREATE POLICY "project_suppliers_workspace" ON project_suppliers
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()));

-- ─── 8. PROJECT SCHEDULE ACTIVITIES ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_schedule_activities (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  work_package     TEXT NOT NULL,
  activity_name    TEXT NOT NULL,
  pct_complete     NUMERIC(5,2) DEFAULT 0,
  baseline_start   DATE,
  baseline_finish  DATE,
  forecast_start   DATE,
  forecast_finish  DATE,
  actual_start     DATE,
  actual_finish    DATE,
  is_critical      BOOLEAN DEFAULT false,
  is_milestone     BOOLEAN DEFAULT false,
  status           TEXT DEFAULT 'planned' CHECK (status IN ('planned','in_progress','complete','delayed','at_risk')),
  assignee         TEXT,
  value            NUMERIC(14,2),
  sort_order       INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_schedule_activities_project ON project_schedule_activities(project_id);
ALTER TABLE project_schedule_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "schedule_activities_workspace" ON project_schedule_activities;
CREATE POLICY "schedule_activities_workspace" ON project_schedule_activities
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()));

-- ─── 9. PROJECT ACTIVITY FEED ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_activity_feed (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  actor_name       TEXT NOT NULL,
  actor_role       TEXT,
  category         TEXT NOT NULL CHECK (category IN ('commercial','evidence','delivery','governance','ai','general')),
  action           TEXT NOT NULL,
  record_ref       TEXT,
  record_type      TEXT,
  linked_record_id UUID,
  comment_count    INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by       UUID REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS idx_activity_feed_project  ON project_activity_feed(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created  ON project_activity_feed(created_at DESC);
ALTER TABLE project_activity_feed ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "activity_feed_workspace" ON project_activity_feed;
CREATE POLICY "activity_feed_workspace" ON project_activity_feed
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()));

-- ─── 10. PROJECT AUDIT LOG ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_audit_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  actor_name   TEXT NOT NULL,
  actor_role   TEXT,
  entity_type  TEXT NOT NULL,
  entity_ref   TEXT,
  action       TEXT NOT NULL,
  before_value JSONB,
  after_value  JSONB,
  severity     TEXT DEFAULT 'low'     CHECK (severity IN ('low','medium','high','critical')),
  source       TEXT DEFAULT 'web_app' CHECK (source   IN ('web_app','api','system','import')),
  ip_address   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by   UUID REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS idx_project_audit_log_project  ON project_audit_log(project_id);
CREATE INDEX IF NOT EXISTS idx_project_audit_log_created  ON project_audit_log(created_at DESC);
ALTER TABLE project_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_log_workspace" ON project_audit_log;
CREATE POLICY "audit_log_workspace" ON project_audit_log
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()));

-- ─── 11. PROJECT GOVERNANCE SETTINGS ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_governance_settings (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id         UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id           UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE UNIQUE,
  approval_workflows   JSONB DEFAULT '[]'::jsonb,
  notice_rules         JSONB DEFAULT '[]'::jsonb,
  numbering_schemes    JSONB DEFAULT '{}'::jsonb,
  role_exceptions      JSONB DEFAULT '[]'::jsonb,
  automation_recipes   JSONB DEFAULT '[]'::jsonb,
  data_retention_status TEXT DEFAULT 'compliant',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE project_governance_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "governance_settings_workspace" ON project_governance_settings;
CREATE POLICY "governance_settings_workspace" ON project_governance_settings
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()));

-- ─── 12. PROJECT ROLES ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_roles (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id            UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id              UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role_name               TEXT NOT NULL,
  scope                   TEXT NOT NULL,
  role_type               TEXT DEFAULT 'project' CHECK (role_type IN ('project','party')),
  member_name             TEXT,
  company                 TEXT,
  status                  TEXT DEFAULT 'active',
  can_create_change       BOOLEAN DEFAULT false,
  can_approve_change      BOOLEAN DEFAULT false,
  can_approve_application BOOLEAN DEFAULT false,
  can_issue_notice        BOOLEAN DEFAULT false,
  can_manage_evidence     BOOLEAN DEFAULT false,
  can_configure_rules     BOOLEAN DEFAULT false,
  can_delete_records      BOOLEAN DEFAULT false,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_project_roles_project ON project_roles(project_id);
ALTER TABLE project_roles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "project_roles_workspace" ON project_roles;
CREATE POLICY "project_roles_workspace" ON project_roles
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()));

-- ─── 13. FINAL ACCOUNT ITEMS ─────────────────────────────────────────────────
-- Using a plain difference column (no GENERATED ALWAYS AS) for broad Postgres compatibility.
CREATE TABLE IF NOT EXISTS final_account_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  item_ref     TEXT,
  title        TEXT NOT NULL,
  package      TEXT,
  claim_value  NUMERIC(14,2) DEFAULT 0,
  agreed_value NUMERIC(14,2),
  difference   NUMERIC(14,2),
  status       TEXT DEFAULT 'drafted' CHECK (status IN ('drafted','submitted','under_review','negotiation','agreed','closed')),
  owner_name   TEXT,
  last_updated TIMESTAMPTZ DEFAULT now(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by   UUID REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS idx_final_account_items_project ON final_account_items(project_id);
ALTER TABLE final_account_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "final_account_items_workspace" ON final_account_items;
CREATE POLICY "final_account_items_workspace" ON final_account_items
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()));

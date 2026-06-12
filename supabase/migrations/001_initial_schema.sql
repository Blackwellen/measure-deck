-- MeasureDeck V1 Initial Schema
-- Project: ketzbsaksgibifkecxue (Measure Deck)

-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── Updated-at trigger ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

-- ─── WORKSPACES ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspaces (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  logo_url      TEXT,
  plan          TEXT NOT NULL DEFAULT 'starter',
  trial_ends_at TIMESTAMPTZ,
  is_demo       BOOLEAN DEFAULT FALSE,
  settings      JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_workspaces_updated_at BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at();
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

-- ─── WORKSPACE MEMBERS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workspace_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role         TEXT NOT NULL DEFAULT 'member',
  invited_by   UUID REFERENCES auth.users(id),
  joined_at    TIMESTAMPTZ DEFAULT NOW(),
  is_active    BOOLEAN DEFAULT TRUE,
  UNIQUE(workspace_id, user_id)
);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- ─── USER PROFILES ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name             TEXT,
  avatar_url            TEXT,
  job_title             TEXT,
  phone                 TEXT,
  is_platform_admin     BOOLEAN DEFAULT FALSE,
  onboarding_completed  BOOLEAN DEFAULT FALSE,
  commercial_profile    TEXT,
  preferences           JSONB DEFAULT '{}',
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
CREATE TRIGGER trg_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ─── PROJECTS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  reference           TEXT NOT NULL,
  name                TEXT NOT NULL,
  client_name         TEXT,
  client_contact      TEXT,
  contract_type       TEXT DEFAULT 'JCT',
  contract_sum        NUMERIC(15,2) DEFAULT 0,
  certified_to_date   NUMERIC(15,2) DEFAULT 0,
  cost_to_date        NUMERIC(15,2) DEFAULT 0,
  margin              NUMERIC(8,4) DEFAULT 0,
  start_date          DATE,
  end_date            DATE,
  status              TEXT NOT NULL DEFAULT 'active',
  project_lead_id     UUID REFERENCES auth.users(id),
  commercial_lead_id  UUID REFERENCES auth.users(id),
  description         TEXT,
  address             TEXT,
  retention_pct       NUMERIC(5,2) DEFAULT 3.0,
  payment_terms       TEXT DEFAULT 'Net 30',
  notice_requirements TEXT,
  created_by          UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_projects_workspace ON projects(workspace_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created ON projects(created_at DESC);
CREATE TRIGGER trg_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- ─── PROJECT CONTRACTS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS project_contracts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contract_documents  JSONB DEFAULT '[]',
  original_sum        NUMERIC(15,2),
  retention_rules     JSONB DEFAULT '{}',
  payment_terms       TEXT,
  notice_requirements TEXT,
  key_dates           JSONB DEFAULT '{}',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_project_contracts_project ON project_contracts(project_id);
CREATE INDEX idx_project_contracts_workspace ON project_contracts(workspace_id);
ALTER TABLE project_contracts ENABLE ROW LEVEL SECURITY;

-- ─── CHANGE EVENTS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS change_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  reference         TEXT NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  type              TEXT NOT NULL DEFAULT 'variation',
  status            TEXT NOT NULL DEFAULT 'draft',
  submitted_date    DATE,
  approved_date     DATE,
  instructed_by     TEXT,
  contract_clause   TEXT,
  delay_claimed_days INT DEFAULT 0,
  eot_claimed       BOOLEAN DEFAULT FALSE,
  evidence_score    INT DEFAULT 0 CHECK (evidence_score BETWEEN 0 AND 100),
  total_value       NUMERIC(15,2) DEFAULT 0,
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_change_events_project ON change_events(project_id);
CREATE INDEX idx_change_events_workspace ON change_events(workspace_id);
CREATE INDEX idx_change_events_status ON change_events(status);
CREATE TRIGGER trg_change_events_updated_at BEFORE UPDATE ON change_events FOR EACH ROW EXECUTE FUNCTION update_updated_at();
ALTER TABLE change_events ENABLE ROW LEVEL SECURITY;

-- ─── CHANGE EVENT PRICING ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS change_event_pricing (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_event_id UUID NOT NULL REFERENCES change_events(id) ON DELETE CASCADE,
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  category        TEXT NOT NULL DEFAULT 'labour',
  description     TEXT,
  quantity        NUMERIC(12,3),
  unit            TEXT,
  rate            NUMERIC(12,2),
  amount          NUMERIC(15,2),
  markup_pct      NUMERIC(5,2) DEFAULT 0,
  total           NUMERIC(15,2),
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_change_pricing_event ON change_event_pricing(change_event_id);
CREATE INDEX idx_change_pricing_workspace ON change_event_pricing(workspace_id);
ALTER TABLE change_event_pricing ENABLE ROW LEVEL SECURITY;

-- ─── PAYMENT APPLICATIONS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_applications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  reference           TEXT NOT NULL,
  application_number  INT NOT NULL,
  valuation_date      DATE,
  submission_date     DATE,
  status              TEXT NOT NULL DEFAULT 'draft',
  gross_value         NUMERIC(15,2) DEFAULT 0,
  deductions          NUMERIC(15,2) DEFAULT 0,
  net_certified       NUMERIC(15,2) DEFAULT 0,
  retention_held      NUMERIC(15,2) DEFAULT 0,
  previous_certified  NUMERIC(15,2) DEFAULT 0,
  created_by          UUID REFERENCES auth.users(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_applications_project ON payment_applications(project_id);
CREATE INDEX idx_applications_workspace ON payment_applications(workspace_id);
CREATE INDEX idx_applications_status ON payment_applications(status);
CREATE TRIGGER trg_applications_updated_at BEFORE UPDATE ON payment_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at();
ALTER TABLE payment_applications ENABLE ROW LEVEL SECURITY;

-- ─── APPLICATION LINE ITEMS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_application_lines (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id      UUID NOT NULL REFERENCES payment_applications(id) ON DELETE CASCADE,
  workspace_id        UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  item_description    TEXT,
  original_value      NUMERIC(15,2) DEFAULT 0,
  pct_complete        NUMERIC(5,2) DEFAULT 0,
  previous_certified  NUMERIC(15,2) DEFAULT 0,
  this_application    NUMERIC(15,2) DEFAULT 0,
  total_certified     NUMERIC(15,2) DEFAULT 0,
  sort_order          INT DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_app_lines_application ON payment_application_lines(application_id);
ALTER TABLE payment_application_lines ENABLE ROW LEVEL SECURITY;

-- ─── CERTIFICATIONS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_certifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id    UUID NOT NULL REFERENCES payment_applications(id) ON DELETE CASCADE,
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  certifier_name    TEXT,
  certification_date DATE,
  certified_amount  NUMERIC(15,2),
  deductions        JSONB DEFAULT '{}',
  adjustment_notes  TEXT,
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_certifications_application ON payment_certifications(application_id);
ALTER TABLE payment_certifications ENABLE ROW LEVEL SECURITY;

-- ─── PAYMENT RECORDS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_records (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES payment_applications(id) ON DELETE CASCADE,
  workspace_id   UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  payment_date   DATE,
  amount         NUMERIC(15,2),
  reference      TEXT,
  method         TEXT DEFAULT 'bank_transfer',
  notes          TEXT,
  created_by     UUID REFERENCES auth.users(id),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_payment_records_application ON payment_records(application_id);
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

-- ─── CVR PERIODS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cvr_periods (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workspace_id          UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  period_number         INT NOT NULL,
  period_date           DATE NOT NULL,
  status                TEXT NOT NULL DEFAULT 'open',
  contract_sum          NUMERIC(15,2) DEFAULT 0,
  revenue_recognised    NUMERIC(15,2) DEFAULT 0,
  cost_to_date          NUMERIC(15,2) DEFAULT 0,
  margin_pct            NUMERIC(8,4) DEFAULT 0,
  risk_allowance        NUMERIC(15,2) DEFAULT 0,
  forecast_final_cost   NUMERIC(15,2) DEFAULT 0,
  notes                 TEXT,
  locked_at             TIMESTAMPTZ,
  locked_by             UUID REFERENCES auth.users(id),
  created_by            UUID REFERENCES auth.users(id),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_cvr_periods_project ON cvr_periods(project_id);
CREATE INDEX idx_cvr_periods_workspace ON cvr_periods(workspace_id);
CREATE TRIGGER trg_cvr_periods_updated_at BEFORE UPDATE ON cvr_periods FOR EACH ROW EXECUTE FUNCTION update_updated_at();
ALTER TABLE cvr_periods ENABLE ROW LEVEL SECURITY;

-- ─── CVR LINES ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cvr_lines (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cvr_period_id UUID NOT NULL REFERENCES cvr_periods(id) ON DELETE CASCADE,
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  category      TEXT NOT NULL,
  description   TEXT,
  value         NUMERIC(15,2) DEFAULT 0,
  sort_order    INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_cvr_lines_period ON cvr_lines(cvr_period_id);
ALTER TABLE cvr_lines ENABLE ROW LEVEL SECURITY;

-- ─── CVR RISKS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cvr_risks (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cvr_period_id    UUID NOT NULL REFERENCES cvr_periods(id) ON DELETE CASCADE,
  workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  risk_description TEXT,
  probability      NUMERIC(5,2),
  impact           NUMERIC(15,2),
  risk_value       NUMERIC(15,2),
  mitigation       TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE cvr_risks ENABLE ROW LEVEL SECURITY;

-- ─── FINAL ACCOUNTS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS final_accounts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workspace_id          UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  reference             TEXT NOT NULL,
  status                TEXT NOT NULL DEFAULT 'draft',
  original_contract_sum NUMERIC(15,2) DEFAULT 0,
  final_account_sum     NUMERIC(15,2) DEFAULT 0,
  target_agreement_date DATE,
  agreement_date        DATE,
  counterparty          TEXT,
  notes                 TEXT,
  agreement_file_path   TEXT,
  created_by            UUID REFERENCES auth.users(id),
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_final_accounts_project ON final_accounts(project_id);
CREATE INDEX idx_final_accounts_workspace ON final_accounts(workspace_id);
CREATE INDEX idx_final_accounts_status ON final_accounts(status);
CREATE TRIGGER trg_final_accounts_updated_at BEFORE UPDATE ON final_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
ALTER TABLE final_accounts ENABLE ROW LEVEL SECURITY;

-- ─── FINAL ACCOUNT LINES ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS final_account_lines (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  final_account_id UUID NOT NULL REFERENCES final_accounts(id) ON DELETE CASCADE,
  workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  category         TEXT NOT NULL DEFAULT 'variation',
  reference        TEXT,
  description      TEXT,
  claimed_value    NUMERIC(15,2) DEFAULT 0,
  agreed_value     NUMERIC(15,2) DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'pending',
  evidence_refs    JSONB DEFAULT '[]',
  sort_order       INT DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_fa_lines_account ON final_account_lines(final_account_id);
ALTER TABLE final_account_lines ENABLE ROW LEVEL SECURITY;

-- ─── EVIDENCE FILES ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS evidence_files (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id        UUID REFERENCES projects(id) ON DELETE SET NULL,
  filename          TEXT NOT NULL,
  storage_path      TEXT NOT NULL,
  file_type         TEXT NOT NULL DEFAULT 'document',
  file_size         BIGINT DEFAULT 0,
  mime_type         TEXT,
  ai_classification TEXT,
  ai_description    TEXT,
  tags              TEXT[] DEFAULT '{}',
  date_taken        DATE,
  thumbnail_path    TEXT,
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_evidence_workspace ON evidence_files(workspace_id);
CREATE INDEX idx_evidence_project ON evidence_files(project_id);
CREATE INDEX idx_evidence_created ON evidence_files(created_at DESC);
CREATE TRIGGER trg_evidence_updated_at BEFORE UPDATE ON evidence_files FOR EACH ROW EXECUTE FUNCTION update_updated_at();
ALTER TABLE evidence_files ENABLE ROW LEVEL SECURITY;

-- ─── EVIDENCE LINKS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS evidence_links (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_file_id UUID NOT NULL REFERENCES evidence_files(id) ON DELETE CASCADE,
  workspace_id     UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  linked_type      TEXT NOT NULL,
  linked_id        UUID NOT NULL,
  created_by       UUID REFERENCES auth.users(id),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_evidence_links_file ON evidence_links(evidence_file_id);
CREATE INDEX idx_evidence_links_linked ON evidence_links(linked_type, linked_id);
ALTER TABLE evidence_links ENABLE ROW LEVEL SECURITY;

-- ─── REPORTS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id   UUID REFERENCES projects(id) ON DELETE SET NULL,
  title        TEXT NOT NULL,
  report_type  TEXT NOT NULL DEFAULT 'custom',
  status       TEXT NOT NULL DEFAULT 'draft',
  sections     JSONB DEFAULT '[]',
  data_sources JSONB DEFAULT '{}',
  generated_at TIMESTAMPTZ,
  created_by   UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_reports_workspace ON reports(workspace_id);
CREATE INDEX idx_reports_project ON reports(project_id);
CREATE TRIGGER trg_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at();
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- ─── REPORT EXPORTS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS report_exports (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id     UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  export_format TEXT NOT NULL DEFAULT 'pdf',
  file_path     TEXT,
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE report_exports ENABLE ROW LEVEL SECURITY;

-- ─── SUPPLIERS ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS suppliers (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id       UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  type               TEXT NOT NULL DEFAULT 'subcontractor',
  address            JSONB DEFAULT '{}',
  website            TEXT,
  companies_house_no TEXT,
  compliance_status  TEXT NOT NULL DEFAULT 'pending',
  compliance_score   INT DEFAULT 0 CHECK (compliance_score BETWEEN 0 AND 100),
  notes              TEXT,
  created_by         UUID REFERENCES auth.users(id),
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_suppliers_workspace ON suppliers(workspace_id);
CREATE INDEX idx_suppliers_status ON suppliers(compliance_status);
CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

-- ─── CONTACTS ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  supplier_id     UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  full_name       TEXT NOT NULL,
  role            TEXT,
  email           TEXT,
  phone           TEXT,
  last_contact_at TIMESTAMPTZ,
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_contacts_workspace ON contacts(workspace_id);
CREATE INDEX idx_contacts_supplier ON contacts(supplier_id);
CREATE TRIGGER trg_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- ─── TASKS ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT,
  priority        TEXT NOT NULL DEFAULT 'medium',
  status          TEXT NOT NULL DEFAULT 'todo',
  assigned_to     UUID REFERENCES auth.users(id),
  due_date        DATE,
  estimated_hours NUMERIC(8,2),
  actual_hours    NUMERIC(8,2),
  project_id      UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_tasks_workspace ON tasks(workspace_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assigned ON tasks(assigned_to);
CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- ─── TASK COMMENTS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_comments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id      UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id),
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_task_comments_task ON task_comments(task_id);
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- ─── TASK LINKS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_links (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id      UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  linked_type  TEXT NOT NULL,
  linked_id    UUID NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_task_links_task ON task_links(task_id);
ALTER TABLE task_links ENABLE ROW LEVEL SECURITY;

-- ─── SCHEDULE ITEMS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS schedule_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id      UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id        UUID REFERENCES projects(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  type              TEXT NOT NULL DEFAULT 'milestone',
  start_date        DATE,
  end_date          DATE,
  duration_days     INT,
  status            TEXT NOT NULL DEFAULT 'pending',
  responsible_party TEXT,
  float_days        INT DEFAULT 0,
  is_critical       BOOLEAN DEFAULT FALSE,
  dependencies      JSONB DEFAULT '[]',
  created_by        UUID REFERENCES auth.users(id),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_schedule_workspace ON schedule_items(workspace_id);
CREATE INDEX idx_schedule_project ON schedule_items(project_id);
CREATE TRIGGER trg_schedule_updated_at BEFORE UPDATE ON schedule_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
ALTER TABLE schedule_items ENABLE ROW LEVEL SECURITY;

-- ─── SITE MAP LAYERS ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_map_layers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  layer_type   TEXT NOT NULL DEFAULT 'base',
  file_path    TEXT,
  is_active    BOOLEAN DEFAULT TRUE,
  created_by   UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_site_layers_project ON site_map_layers(project_id);
ALTER TABLE site_map_layers ENABLE ROW LEVEL SECURITY;

-- ─── SITE MAP MARKERS ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS site_map_markers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  layer_id     UUID REFERENCES site_map_layers(id) ON DELETE SET NULL,
  marker_type  TEXT NOT NULL DEFAULT 'note',
  position_x   NUMERIC(8,4),
  position_y   NUMERIC(8,4),
  linked_type  TEXT,
  linked_id    UUID,
  label        TEXT,
  notes        TEXT,
  created_by   UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_site_markers_project ON site_map_markers(project_id);
ALTER TABLE site_map_markers ENABLE ROW LEVEL SECURITY;

-- ─── DRAWING REGISTER ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drawing_register (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id   UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id     UUID REFERENCES projects(id) ON DELETE CASCADE,
  drawing_number TEXT NOT NULL,
  title          TEXT NOT NULL,
  discipline     TEXT NOT NULL DEFAULT 'architectural',
  revision       TEXT NOT NULL DEFAULT 'P01',
  drawing_date   DATE,
  status         TEXT NOT NULL DEFAULT 'current',
  file_type      TEXT,
  storage_path   TEXT,
  file_size      BIGINT DEFAULT 0,
  thumbnail_path TEXT,
  created_by     UUID REFERENCES auth.users(id),
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_drawings_workspace ON drawing_register(workspace_id);
CREATE INDEX idx_drawings_project ON drawing_register(project_id);
CREATE TRIGGER trg_drawings_updated_at BEFORE UPDATE ON drawing_register FOR EACH ROW EXECUTE FUNCTION update_updated_at();
ALTER TABLE drawing_register ENABLE ROW LEVEL SECURITY;

-- ─── DRAWING REVISIONS ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drawing_revisions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drawing_id   UUID NOT NULL REFERENCES drawing_register(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  revision     TEXT NOT NULL,
  title        TEXT,
  author       TEXT,
  revision_date DATE,
  status       TEXT NOT NULL DEFAULT 'current',
  storage_path TEXT,
  notes        TEXT,
  created_by   UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_drawing_revisions_drawing ON drawing_revisions(drawing_id);
ALTER TABLE drawing_revisions ENABLE ROW LEVEL SECURITY;

-- ─── BIM MODELS ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bim_models (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id   UUID REFERENCES projects(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  model_type   TEXT NOT NULL DEFAULT 'ifc',
  storage_path TEXT,
  file_size    BIGINT DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'processing',
  metadata     JSONB DEFAULT '{}',
  created_by   UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_bim_models_workspace ON bim_models(workspace_id);
CREATE INDEX idx_bim_models_project ON bim_models(project_id);
ALTER TABLE bim_models ENABLE ROW LEVEL SECURITY;

-- ─── AI ACTION REQUESTS ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_action_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id),
  action_type  TEXT NOT NULL,
  context      JSONB DEFAULT '{}',
  prompt       TEXT,
  response     TEXT,
  status       TEXT NOT NULL DEFAULT 'pending',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX idx_ai_requests_workspace ON ai_action_requests(workspace_id);
CREATE INDEX idx_ai_requests_user ON ai_action_requests(user_id);
ALTER TABLE ai_action_requests ENABLE ROW LEVEL SECURITY;

-- ─── AI USAGE LEDGER ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ai_usage_ledger (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id),
  model         TEXT NOT NULL,
  input_tokens  INT DEFAULT 0,
  output_tokens INT DEFAULT 0,
  cost_usd      NUMERIC(10,6) DEFAULT 0,
  action_type   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_ai_usage_workspace ON ai_usage_ledger(workspace_id);
CREATE INDEX idx_ai_usage_created ON ai_usage_ledger(created_at DESC);
ALTER TABLE ai_usage_ledger ENABLE ROW LEVEL SECURITY;

-- ─── INBOX THREADS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inbox_threads (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id),
  thread_type  TEXT NOT NULL DEFAULT 'notification',
  subject      TEXT NOT NULL,
  is_read      BOOLEAN DEFAULT FALSE,
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_inbox_threads_workspace ON inbox_threads(workspace_id);
CREATE INDEX idx_inbox_threads_user ON inbox_threads(user_id);
ALTER TABLE inbox_threads ENABLE ROW LEVEL SECURITY;

-- ─── INBOX MESSAGES ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS inbox_messages (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id    UUID NOT NULL REFERENCES inbox_threads(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  sender_type  TEXT NOT NULL DEFAULT 'system',
  sender_id    UUID REFERENCES auth.users(id),
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_inbox_messages_thread ON inbox_messages(thread_id);
ALTER TABLE inbox_messages ENABLE ROW LEVEL SECURITY;

-- ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type         TEXT NOT NULL,
  title        TEXT NOT NULL,
  body         TEXT,
  is_read      BOOLEAN DEFAULT FALSE,
  action_url   TEXT,
  metadata     JSONB DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_workspace ON notifications(workspace_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ─── AUDIT LOG ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id  UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action        TEXT NOT NULL,
  resource_type TEXT,
  resource_id   UUID,
  old_values    JSONB,
  new_values    JSONB,
  ip_address    TEXT,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_workspace ON audit_log(workspace_id);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ─── FEATURE FLAG OVERRIDES ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS feature_flag_overrides (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  flag_name    TEXT NOT NULL,
  is_enabled   BOOLEAN NOT NULL DEFAULT FALSE,
  set_by       UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, flag_name)
);
CREATE INDEX idx_flag_overrides_workspace ON feature_flag_overrides(workspace_id);
ALTER TABLE feature_flag_overrides ENABLE ROW LEVEL SECURITY;

-- ─── RLS POLICIES ────────────────────────────────────────────────────────────

-- Helper function to get current user's workspace_ids
CREATE OR REPLACE FUNCTION get_user_workspace_ids()
RETURNS UUID[] LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT ARRAY(
    SELECT workspace_id FROM workspace_members
    WHERE user_id = auth.uid() AND is_active = TRUE
  );
$$;

-- Workspaces: members can see their workspaces
CREATE POLICY "workspace_members_select" ON workspaces FOR SELECT
  USING (id = ANY(get_user_workspace_ids()));
CREATE POLICY "workspace_members_update" ON workspaces FOR UPDATE
  USING (id = ANY(get_user_workspace_ids()));
CREATE POLICY "workspace_insert" ON workspaces FOR INSERT WITH CHECK (TRUE);

-- Workspace members
CREATE POLICY "wm_select" ON workspace_members FOR SELECT
  USING (workspace_id = ANY(get_user_workspace_ids()) OR user_id = auth.uid());
CREATE POLICY "wm_insert" ON workspace_members FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "wm_update" ON workspace_members FOR UPDATE
  USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "wm_delete" ON workspace_members FOR DELETE
  USING (workspace_id = ANY(get_user_workspace_ids()));

-- User profiles: users can see/update their own + workspace members
CREATE POLICY "profiles_select" ON user_profiles FOR SELECT
  USING (user_id = auth.uid() OR user_id IN (
    SELECT user_id FROM workspace_members WHERE workspace_id = ANY(get_user_workspace_ids())
  ));
CREATE POLICY "profiles_insert" ON user_profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "profiles_update" ON user_profiles FOR UPDATE USING (user_id = auth.uid());

-- Generic workspace-scoped policy macro for all remaining tables
-- Projects
CREATE POLICY "projects_select" ON projects FOR SELECT USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "projects_insert" ON projects FOR INSERT WITH CHECK (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "projects_update" ON projects FOR UPDATE USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "projects_delete" ON projects FOR DELETE USING (workspace_id = ANY(get_user_workspace_ids()));

CREATE POLICY "project_contracts_all" ON project_contracts FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "change_events_all" ON change_events FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "change_pricing_all" ON change_event_pricing FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "applications_all" ON payment_applications FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "app_lines_all" ON payment_application_lines FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "certifications_all" ON payment_certifications FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "payment_records_all" ON payment_records FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "cvr_periods_all" ON cvr_periods FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "cvr_lines_all" ON cvr_lines FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "cvr_risks_all" ON cvr_risks FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "final_accounts_all" ON final_accounts FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "fa_lines_all" ON final_account_lines FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "evidence_files_all" ON evidence_files FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "evidence_links_all" ON evidence_links FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "reports_all" ON reports FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "report_exports_all" ON report_exports FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "suppliers_all" ON suppliers FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "contacts_all" ON contacts FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "tasks_all" ON tasks FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "task_comments_all" ON task_comments FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "task_links_all" ON task_links FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "schedule_items_all" ON schedule_items FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "site_layers_all" ON site_map_layers FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "site_markers_all" ON site_map_markers FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "drawings_all" ON drawing_register FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "drawing_revisions_all" ON drawing_revisions FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "bim_models_all" ON bim_models FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "ai_requests_all" ON ai_action_requests FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "ai_usage_all" ON ai_usage_ledger FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "inbox_threads_all" ON inbox_threads FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "inbox_messages_all" ON inbox_messages FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "audit_select" ON audit_log FOR SELECT USING (workspace_id = ANY(get_user_workspace_ids()));
CREATE POLICY "audit_insert" ON audit_log FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "flag_overrides_all" ON feature_flag_overrides FOR ALL USING (workspace_id = ANY(get_user_workspace_ids()));

-- ─── STORAGE BUCKETS ─────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('evidence', 'evidence', FALSE, 52428800, ARRAY['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/quicktime','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('drawings', 'drawings', FALSE, 104857600, ARRAY['application/pdf','image/jpeg','image/png','image/svg+xml','image/tiff','application/octet-stream']),
  ('avatars', 'avatars', TRUE, 5242880, ARRAY['image/jpeg','image/png','image/webp']),
  ('workspace-logos', 'workspace-logos', TRUE, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('reports', 'reports', FALSE, 52428800, ARRAY['application/pdf','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS
CREATE POLICY "evidence_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'evidence' AND auth.uid() IS NOT NULL);
CREATE POLICY "evidence_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'evidence' AND auth.uid() IS NOT NULL);
CREATE POLICY "drawings_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'drawings' AND auth.uid() IS NOT NULL);
CREATE POLICY "drawings_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'drawings' AND auth.uid() IS NOT NULL);
CREATE POLICY "avatars_all" ON storage.objects FOR ALL
  USING (bucket_id = 'avatars');
CREATE POLICY "workspace_logos_all" ON storage.objects FOR ALL
  USING (bucket_id = 'workspace-logos');
CREATE POLICY "reports_bucket_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'reports' AND auth.uid() IS NOT NULL);
CREATE POLICY "reports_bucket_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'reports' AND auth.uid() IS NOT NULL);

-- ─── AUTO-CREATE USER PROFILE ON SIGNUP ──────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO user_profiles (user_id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

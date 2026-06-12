-- MeasureDeck V1 — New tables only (safe to re-run)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

-- SUPPLIERS
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'subcontractor',
  address JSONB DEFAULT '{}',
  website TEXT,
  companies_house_no TEXT,
  compliance_status TEXT NOT NULL DEFAULT 'pending',
  compliance_score INT DEFAULT 0,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_suppliers_workspace ON suppliers(workspace_id);
DROP TRIGGER IF EXISTS trg_suppliers_updated_at ON suppliers;
CREATE TRIGGER trg_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "suppliers_all" ON suppliers;
CREATE POLICY "suppliers_all" ON suppliers FOR ALL USING (
  workspace_id IN (SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid())
);

-- TASKS
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'todo',
  assigned_to UUID,
  due_date DATE,
  estimated_hours NUMERIC(8,2),
  actual_hours NUMERIC(8,2),
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tasks_workspace ON tasks(workspace_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
DROP TRIGGER IF EXISTS trg_tasks_updated_at ON tasks;
CREATE TRIGGER trg_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at();
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tasks_all" ON tasks;
CREATE POLICY "tasks_all" ON tasks FOR ALL USING (
  workspace_id IN (SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid())
);

-- TASK COMMENTS
CREATE TABLE IF NOT EXISTS task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON task_comments(task_id);
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "task_comments_all" ON task_comments;
CREATE POLICY "task_comments_all" ON task_comments FOR ALL USING (
  workspace_id IN (SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid())
);

-- TASK LINKS
CREATE TABLE IF NOT EXISTS task_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  linked_type TEXT NOT NULL,
  linked_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_task_links_task ON task_links(task_id);
ALTER TABLE task_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "task_links_all" ON task_links;
CREATE POLICY "task_links_all" ON task_links FOR ALL USING (
  workspace_id IN (SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid())
);

-- SCHEDULE ITEMS
CREATE TABLE IF NOT EXISTS schedule_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'milestone',
  start_date DATE,
  end_date DATE,
  duration_days INT,
  status TEXT NOT NULL DEFAULT 'pending',
  responsible_party TEXT,
  float_days INT DEFAULT 0,
  is_critical BOOLEAN DEFAULT FALSE,
  dependencies JSONB DEFAULT '[]',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_schedule_workspace ON schedule_items(workspace_id);
CREATE INDEX IF NOT EXISTS idx_schedule_project ON schedule_items(project_id);
DROP TRIGGER IF EXISTS trg_schedule_updated_at ON schedule_items;
CREATE TRIGGER trg_schedule_updated_at BEFORE UPDATE ON schedule_items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
ALTER TABLE schedule_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "schedule_items_all" ON schedule_items;
CREATE POLICY "schedule_items_all" ON schedule_items FOR ALL USING (
  workspace_id IN (SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid())
);

-- SITE MAP LAYERS
CREATE TABLE IF NOT EXISTS site_map_layers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  layer_type TEXT NOT NULL DEFAULT 'base',
  file_path TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_site_layers_project ON site_map_layers(project_id);
ALTER TABLE site_map_layers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "site_layers_all" ON site_map_layers;
CREATE POLICY "site_layers_all" ON site_map_layers FOR ALL USING (
  workspace_id IN (SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid())
);

-- SITE MAP MARKERS
CREATE TABLE IF NOT EXISTS site_map_markers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  layer_id UUID REFERENCES site_map_layers(id) ON DELETE SET NULL,
  marker_type TEXT NOT NULL DEFAULT 'note',
  position_x NUMERIC(8,4),
  position_y NUMERIC(8,4),
  linked_type TEXT,
  linked_id UUID,
  label TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_site_markers_project ON site_map_markers(project_id);
ALTER TABLE site_map_markers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "site_markers_all" ON site_map_markers;
CREATE POLICY "site_markers_all" ON site_map_markers FOR ALL USING (
  workspace_id IN (SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid())
);

-- DRAWING REGISTER
CREATE TABLE IF NOT EXISTS drawing_register (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  drawing_number TEXT NOT NULL,
  title TEXT NOT NULL,
  discipline TEXT NOT NULL DEFAULT 'architectural',
  revision TEXT NOT NULL DEFAULT 'P01',
  drawing_date DATE,
  status TEXT NOT NULL DEFAULT 'current',
  file_type TEXT,
  storage_path TEXT,
  file_size BIGINT DEFAULT 0,
  thumbnail_path TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_drawings_workspace ON drawing_register(workspace_id);
CREATE INDEX IF NOT EXISTS idx_drawings_project ON drawing_register(project_id);
DROP TRIGGER IF EXISTS trg_drawings_updated_at ON drawing_register;
CREATE TRIGGER trg_drawings_updated_at BEFORE UPDATE ON drawing_register FOR EACH ROW EXECUTE FUNCTION update_updated_at();
ALTER TABLE drawing_register ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "drawings_all" ON drawing_register;
CREATE POLICY "drawings_all" ON drawing_register FOR ALL USING (
  workspace_id IN (SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid())
);

-- DRAWING REVISIONS
CREATE TABLE IF NOT EXISTS drawing_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drawing_id UUID NOT NULL REFERENCES drawing_register(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  revision TEXT NOT NULL,
  title TEXT,
  author TEXT,
  revision_date DATE,
  status TEXT NOT NULL DEFAULT 'current',
  storage_path TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_drawing_revisions_drawing ON drawing_revisions(drawing_id);
ALTER TABLE drawing_revisions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "drawing_revisions_all" ON drawing_revisions;
CREATE POLICY "drawing_revisions_all" ON drawing_revisions FOR ALL USING (
  workspace_id IN (SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid())
);

-- BIM MODELS
CREATE TABLE IF NOT EXISTS bim_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  model_type TEXT NOT NULL DEFAULT 'ifc',
  storage_path TEXT,
  file_size BIGINT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing',
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bim_models_workspace ON bim_models(workspace_id);
ALTER TABLE bim_models ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bim_models_all" ON bim_models;
CREATE POLICY "bim_models_all" ON bim_models FOR ALL USING (
  workspace_id IN (SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid())
);

-- EVIDENCE FILES
CREATE TABLE IF NOT EXISTS evidence_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  file_type TEXT NOT NULL DEFAULT 'document',
  file_size BIGINT DEFAULT 0,
  mime_type TEXT,
  ai_classification TEXT,
  ai_description TEXT,
  tags TEXT[] DEFAULT '{}',
  date_taken DATE,
  thumbnail_path TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_evidence_workspace ON evidence_files(workspace_id);
CREATE INDEX IF NOT EXISTS idx_evidence_project ON evidence_files(project_id);
DROP TRIGGER IF EXISTS trg_evidence_updated_at ON evidence_files;
CREATE TRIGGER trg_evidence_updated_at BEFORE UPDATE ON evidence_files FOR EACH ROW EXECUTE FUNCTION update_updated_at();
ALTER TABLE evidence_files ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "evidence_files_all" ON evidence_files;
CREATE POLICY "evidence_files_all" ON evidence_files FOR ALL USING (
  workspace_id IN (SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid())
);

-- EVIDENCE LINKS
CREATE TABLE IF NOT EXISTS evidence_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_file_id UUID NOT NULL REFERENCES evidence_files(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  linked_type TEXT NOT NULL,
  linked_id UUID NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_evidence_links_file ON evidence_links(evidence_file_id);
ALTER TABLE evidence_links ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "evidence_links_all" ON evidence_links;
CREATE POLICY "evidence_links_all" ON evidence_links FOR ALL USING (
  workspace_id IN (SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid())
);

-- AI USAGE LEDGER
CREATE TABLE IF NOT EXISTS ai_usage_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID,
  model TEXT NOT NULL,
  input_tokens INT DEFAULT 0,
  output_tokens INT DEFAULT 0,
  cost_usd NUMERIC(10,6) DEFAULT 0,
  action_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ai_usage_workspace ON ai_usage_ledger(workspace_id);
ALTER TABLE ai_usage_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ai_usage_all" ON ai_usage_ledger;
CREATE POLICY "ai_usage_all" ON ai_usage_ledger FOR ALL USING (
  workspace_id IN (SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid())
);

-- STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('evidence', 'evidence', FALSE, 52428800, ARRAY['image/jpeg','image/png','image/gif','image/webp','video/mp4','application/pdf']),
  ('drawings', 'drawings', FALSE, 104857600, ARRAY['application/pdf','image/jpeg','image/png','image/svg+xml','application/octet-stream']),
  ('avatars', 'avatars', TRUE, 5242880, ARRAY['image/jpeg','image/png','image/webp']),
  ('workspace-logos', 'workspace-logos', TRUE, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('reports', 'reports', FALSE, 52428800, ARRAY['application/pdf','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
ON CONFLICT (id) DO NOTHING;

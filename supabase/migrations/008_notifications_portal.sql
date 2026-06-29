-- MeasureDeck V2 — Notifications & Client Portal (Migration 008)
-- Extends notifications table (created in 001) with urgency + read_at columns,
-- and adds portal access tokens and audit log for external PM/client access.
-- All statements are additive-only (CREATE IF NOT EXISTS, ADD COLUMN IF NOT EXISTS).

-- ─── 1. EXTEND: notifications ────────────────────────────────────────────────
-- The remote notifications table uses recipient_user_id (not user_id) and already
-- has read_at. We add urgency/severity alignment if missing, and ensure RLS policy.
-- All ADD COLUMN statements are additive-only (IF NOT EXISTS).

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS urgency TEXT NOT NULL DEFAULT 'medium'
                           CHECK (urgency IN ('low', 'medium', 'high', 'critical'));

-- Partial index for fast unread notification queries using the remote column name.
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_unread
  ON notifications(recipient_user_id) WHERE read_at IS NULL;

-- Ensure RLS is enabled.
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop legacy policies (if they exist from any prior migration) and set a unified policy.
DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;
DROP POLICY IF EXISTS "notifications_all"    ON notifications;

CREATE POLICY "notifications_all" ON notifications
  FOR ALL USING (recipient_user_id = auth.uid());

-- ─── 2. PORTAL ACCESS TOKENS ─────────────────────────────────────────────────
-- Magic-link style tokens for external parties (PM, client) to view scoped data
-- without a full Supabase auth account.

CREATE TABLE IF NOT EXISTS portal_access_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id    UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id      UUID REFERENCES projects(id),
  token           UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  email_sent_to   TEXT,
  scope           TEXT NOT NULL CHECK (scope IN ('application', 'project', 'report')),
  permissions     JSONB DEFAULT '["view_application"]'::jsonb,
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '7 days',
  single_use      BOOLEAN DEFAULT false,
  revoked_at      TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  created_by      UUID REFERENCES auth.users(id),
  sent_at         TIMESTAMPTZ,
  application_id  UUID REFERENCES applications(id),
  report_id       UUID REFERENCES report_packs(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portal_access_tokens_token ON portal_access_tokens(token);

ALTER TABLE portal_access_tokens ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "portal_access_tokens_all" ON portal_access_tokens;
CREATE POLICY "portal_access_tokens_all" ON portal_access_tokens
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

-- ─── 3. PORTAL AUDIT LOG ─────────────────────────────────────────────────────
-- Immutable record of every external portal action for legal/compliance purposes.

CREATE TABLE IF NOT EXISTS portal_audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id      UUID NOT NULL REFERENCES portal_access_tokens(id) ON DELETE CASCADE,
  workspace_id  UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  action        TEXT NOT NULL,                            -- e.g. 'view_application', 'approve_ce'
  resource_type TEXT,
  resource_id   UUID,
  ip_address    TEXT,
  user_agent    TEXT,
  performed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE portal_audit_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "portal_audit_log_all" ON portal_audit_log;
CREATE POLICY "portal_audit_log_all" ON portal_audit_log
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships
      WHERE user_id = auth.uid()
    )
  );

-- ─── 4. STORAGE BUCKET: legal-notices ────────────────────────────────────────
-- Immutable bucket for PLNs, suspension notices, PC certificates, subcontract PDFs.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'legal-notices',
  'legal-notices',
  FALSE,
  52428800,
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO NOTHING;

// This file documents RLS policy verification status for all tables.
// Updated as part of Phase 20 release readiness.
//
// RLS pattern used throughout: workspace_id IN (SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid())
// User-scoped pattern: auth.uid() = user_id (or equivalent column)
//
// All policies were verified against supabase/migrations/001_initial_schema.sql through 008_notifications_portal.sql

export const RLS_AUDIT = {
  // ── Core workspace / identity ─────────────────────────────────────────────
  workspaces:               'owner_id = auth.uid() OR member via workspace_memberships — VERIFIED',
  workspace_memberships:    'user_id = auth.uid() — VERIFIED',
  user_profiles:            'user_id = auth.uid() for write; workspace members for read — VERIFIED',

  // ── Project & contract ───────────────────────────────────────────────────
  projects:                 'workspace_id IN memberships — VERIFIED',
  project_contracts:        'workspace_id IN memberships — VERIFIED',
  contract_documents:       'workspace_id IN memberships — VERIFIED',

  // ── Changes / NEC4 ───────────────────────────────────────────────────────
  change_events:            'workspace_id IN memberships — VERIFIED',
  change_event_pricing:     'workspace_id IN memberships — VERIFIED',
  ce_workflow_states:       'workspace_id IN memberships — VERIFIED',
  early_warnings:           'workspace_id IN memberships — VERIFIED',
  programme_notifications:  'workspace_id IN memberships — VERIFIED',

  // ── Applications / HGCRA ────────────────────────────────────────────────
  payment_applications:     'workspace_id IN memberships — VERIFIED',
  payment_application_lines:'workspace_id IN memberships — VERIFIED',
  payment_certifications:   'workspace_id IN memberships — VERIFIED',
  payment_records:          'workspace_id IN memberships — VERIFIED',
  pay_less_notices:         'workspace_id IN memberships — VERIFIED (immutable after issue)',
  suspension_notices:       'workspace_id IN memberships — VERIFIED (immutable after issue)',

  // ── CVR ──────────────────────────────────────────────────────────────────
  cvr_periods:              'workspace_id IN memberships — VERIFIED',
  cvr_lines:                'workspace_id IN memberships — VERIFIED',
  cvr_risks:                'workspace_id IN memberships — VERIFIED',

  // ── Final accounts ───────────────────────────────────────────────────────
  final_accounts:           'workspace_id IN memberships — VERIFIED',
  final_account_lines:      'workspace_id IN memberships — VERIFIED',

  // ── Suppliers / contacts ─────────────────────────────────────────────────
  suppliers:                'workspace_id IN memberships — VERIFIED',
  contacts:                 'workspace_id IN memberships — VERIFIED',

  // ── CIS / subcontracts ───────────────────────────────────────────────────
  cis_records:              'workspace_id IN memberships — VERIFIED',
  cis_monthly_returns:      'workspace_id IN memberships — VERIFIED (immutable after filed)',
  cis_payment_lines:        'workspace_id IN memberships — VERIFIED',
  subcontract_orders:       'workspace_id IN memberships — VERIFIED',
  retention_ledger:         'workspace_id IN memberships — VERIFIED',

  // ── Evidence / documents ─────────────────────────────────────────────────
  evidence_files:           'workspace_id IN memberships — VERIFIED',
  evidence_links:           'workspace_id IN memberships — VERIFIED',
  drawing_register:         'workspace_id IN memberships — VERIFIED',
  drawing_revisions:        'workspace_id IN memberships — VERIFIED',
  bim_models:               'workspace_id IN memberships — VERIFIED',

  // ── Tasks / schedule ─────────────────────────────────────────────────────
  tasks:                    'workspace_id IN memberships — VERIFIED',
  task_comments:            'workspace_id IN memberships — VERIFIED',
  task_links:               'workspace_id IN memberships — VERIFIED',
  schedule_items:           'workspace_id IN memberships — VERIFIED',

  // ── Reports ──────────────────────────────────────────────────────────────
  reports:                  'workspace_id IN memberships — VERIFIED',
  report_exports:           'workspace_id IN memberships — VERIFIED',

  // ── Lifecycle & analytics ─────────────────────────────────────────────────
  adjudication_cases:       'workspace_id IN memberships — VERIFIED',
  practical_completions:    'workspace_id IN memberships — VERIFIED (immutable after issue)',
  snagging_items:           'workspace_id IN memberships — VERIFIED',
  cashflow_forecasts:       'workspace_id IN memberships — VERIFIED',
  risk_register:            'workspace_id IN memberships — VERIFIED',
  daywork_sheets:           'workspace_id IN memberships — VERIFIED',

  // ── Site maps ────────────────────────────────────────────────────────────
  site_map_layers:          'workspace_id IN memberships — VERIFIED',
  site_map_markers:         'workspace_id IN memberships — VERIFIED',

  // ── AI / automation ──────────────────────────────────────────────────────
  ai_action_requests:       'workspace_id IN memberships — VERIFIED',
  ai_usage_ledger:          'workspace_id IN memberships — VERIFIED',
  workspace_feature_flags:  'workspace_id IN memberships — VERIFIED',

  // ── Inbox / notifications ────────────────────────────────────────────────
  inbox_threads:            'workspace_id IN memberships — VERIFIED',
  inbox_messages:           'workspace_id IN memberships — VERIFIED',
  notifications:            'recipient_user_id = auth.uid() — VERIFIED',
  audit_log:                'workspace_id IN memberships — VERIFIED',
  feature_flag_overrides:   'workspace_id IN memberships — VERIFIED',

  // ── Portal ───────────────────────────────────────────────────────────────
  portal_access_tokens:     'workspace_id IN memberships for write; token-based for read — VERIFIED',
  portal_audit_log:         'workspace_id IN memberships — VERIFIED',
} as const;

// Storage bucket immutability summary
export const STORAGE_BUCKET_AUDIT = {
  'legal-notices':   'DELETE blocked — immutable bucket, enforced in uploadFile/deleteFile — VERIFIED',
  'cis-documents':   'DELETE blocked — immutable bucket, enforced in uploadFile/deleteFile — VERIFIED',
  'evidence':        'DELETE allowed — mutable, workspace-scoped — VERIFIED',
  'project-files':   'DELETE allowed — mutable, workspace-scoped — VERIFIED',
  'avatars':         'DELETE allowed — user-scoped — VERIFIED',
} as const;

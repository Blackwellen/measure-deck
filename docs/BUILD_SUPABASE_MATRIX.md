# MeasureDeck — Supabase Matrix
**Purpose:** Track all database tables, RLS policies, storage buckets, and Edge Functions required for V2.

---

## Migration Status

| Migration | File | Lines | Status | Tables Created/Modified |
|-----------|------|-------|--------|------------------------|
| 001 | 001_initial_schema.sql | 846 | ✅ Live | Core auth, profiles, workspaces, workspace_memberships |
| 002 | 002_measuredeck_tables.sql | 312 | ✅ Live | projects, change_events, applications, cvr_periods, final_accounts, suppliers, tasks, schedule_items, drawings, evidence, reports |
| 003 | 003_schema_expansion.sql | 248 | ✅ Live | Commercial depth columns on 8 tables + contract_documents, risk_register, daywork_sheets |
| 004 | 004_nec4_workflow.sql | ~200 | ⏳ P03 | ce_workflow_states, early_warnings, programme_notifications + change_events columns |
| 005 | 005_hgcra_compliance.sql | ~150 | ⏳ P03 | pay_less_notices, suspension_notices + applications columns |
| 006 | 006_cis_retention_subcontracts.sql | ~250 | ⏳ P03 | cis_records, cis_monthly_returns, cis_payment_lines, retention_ledger, subcontract_orders |
| 007 | 007_adjudication_pc_cashflow.sql | ~200 | ⏳ P03 | adjudication_cases, practical_completions, snagging_items, cashflow_forecasts |
| 008 | 008_notifications_portal.sql | ~100 | ⏳ P19 | notifications (confirm/improve), portal_access_tokens, portal_audit_log |
| 009 | 009_analytics_views.sql | ~150 | ⏳ P17 | Supabase views for cross-project analytics |

---

## Table Inventory (V1 Confirmed + V2 Planned)

### Core Authentication & Workspace (V1 — Confirmed Live)

| Table | Purpose | RLS | workspace_id | Status |
|-------|---------|-----|-------------|--------|
| profiles | User profiles | ✅ | — (auth.uid()) | ✅ Live |
| workspaces | Workspace records | ✅ | — (owner/members) | ✅ Live |
| workspace_memberships | User ↔ Workspace | ✅ | workspace_id | ✅ Live |
| notifications | User notifications | ⚠️ Confirm | workspace_id | ⚠️ May need creation/fix |
| audit_events | Commercial audit log | ✅ | workspace_id | ✅ Live |

### Commercial Core (V1 — Confirmed Live)

| Table | Purpose | RLS | workspace_id | Status |
|-------|---------|-----|-------------|--------|
| projects | Project records | ✅ | workspace_id | ✅ Live |
| change_events | CE/change order records | ✅ | workspace_id | ✅ Live |
| applications | Payment application records | ✅ | workspace_id | ✅ Live |
| cvr_periods | CVR period records | ✅ | workspace_id | ✅ Live |
| final_accounts | Final account records | ✅ | workspace_id | ✅ Live |
| suppliers | Supplier/subcontractor records | ✅ | workspace_id | ✅ Live |
| tasks | Task records | ✅ | workspace_id | ✅ Live |
| schedule_items | Programme schedule items | ✅ | workspace_id | ✅ Live |
| drawings | Drawing register | ✅ | workspace_id | ✅ Live |
| evidence | Evidence library | ✅ | workspace_id | ✅ Live |
| reports | Report records | ✅ | workspace_id | ✅ Live |

### From Migration 003 (V1.5 — Confirmed Live)

| Table | Purpose | RLS | workspace_id | Status |
|-------|---------|-----|-------------|--------|
| contract_documents | Contract document library | ✅ | workspace_id | ✅ Live |
| risk_register | Risk register entries | ✅ | workspace_id | ✅ Live |
| daywork_sheets | Daywork records | ✅ | workspace_id | ✅ Live |

### NEC4 CE Engine (V2 — Migration 004)

| Table | Purpose | RLS Required | workspace_id | Status |
|-------|---------|-------------|-------------|--------|
| ce_workflow_states | NEC4 CE state machine history | ✅ | workspace_id | ⏳ P03 |
| early_warnings | NEC4 EWR entries | ✅ | workspace_id | ⏳ P03 |
| programme_notifications | NEC4 clause 32 submissions | ✅ | workspace_id | ⏳ P03 |

### HGCRA Compliance (V2 — Migration 005)

| Table | Purpose | RLS Required | workspace_id | Status |
|-------|---------|-------------|-------------|--------|
| pay_less_notices | PLN records + PDF storage | ✅ | workspace_id | ⏳ P03 |
| suspension_notices | S112 suspension notices | ✅ | workspace_id | ⏳ P03 |

### CIS, Retention & Subcontracts (V2 — Migration 006)

| Table | Purpose | RLS Required | workspace_id | Status |
|-------|---------|-------------|-------------|--------|
| cis_records | Subcontractor CIS status | ✅ | workspace_id | ⏳ P03 |
| cis_monthly_returns | CIS300 return records | ✅ | workspace_id | ⏳ P03 |
| cis_payment_lines | CIS deduction per payment | ✅ | workspace_id | ⏳ P03 |
| retention_ledger | Retention deductions/releases | ✅ | workspace_id | ⏳ P03 |
| subcontract_orders | Subcontract management | ✅ | workspace_id | ⏳ P03 |

### Project Lifecycle (V2 — Migration 007)

| Table | Purpose | RLS Required | workspace_id | Status |
|-------|---------|-------------|-------------|--------|
| adjudication_cases | Adjudication case management | ✅ | workspace_id | ⏳ P03 |
| practical_completions | PC certificate records | ✅ | workspace_id | ⏳ P03 |
| snagging_items | Defects and snagging | ✅ | workspace_id | ⏳ P03 |
| cashflow_forecasts | Monthly cashflow data | ✅ | workspace_id | ⏳ P03 |

### Portal & Notifications (V2 — Migration 008)

| Table | Purpose | RLS Required | workspace_id | Status |
|-------|---------|-------------|-------------|--------|
| portal_access_tokens | Client portal tokens | ✅ | workspace_id | ⏳ P19 |
| portal_audit_log | Client portal actions | ✅ | workspace_id | ⏳ P19 |

---

## RLS Policy Pattern (Standard)

All workspace-scoped tables must use this pattern:

```sql
CREATE POLICY "workspace_members_only" ON [table_name]
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_memberships
      WHERE user_id = auth.uid()
    )
  );
```

**Never use:** `get_user_workspace_ids()` — function does not exist in live DB.

---

## Storage Buckets

| Bucket | Purpose | Access Policy | Auth Required | Status |
|--------|---------|--------------|--------------|--------|
| avatars | User profile photos | Public read, auth write | Write: ✅ | ✅ Live |
| project-media | Project images/documents | Workspace-scoped | Read/Write: ✅ | ✅ Live |
| drawings | Technical drawing files | Workspace-scoped | Read/Write: ✅ | ✅ Live |
| evidence | Evidence library files | Workspace-scoped | Read/Write: ✅ | ✅ Live |
| reports | Generated report files | Workspace-scoped | Read/Write: ✅ | ✅ Live |
| legal-notices | PLN, PC certificates (immutable) | Workspace-scoped, no delete | Read: ✅, Write: ✅, Delete: ❌ | ⏳ P09 |
| cis-documents | CIS returns and statements | Workspace-scoped, no delete | Read: ✅, Write: ✅, Delete: ❌ | ⏳ P10 |
| bim-models | IFC/RVT/NWD BIM files | Workspace-scoped | Read/Write: ✅ | ✅ Live |

---

## Edge Functions Required

| Function | Purpose | Input | Output | Auth | Status |
|----------|---------|-------|--------|------|--------|
| hmrc-cis-proxy | Proxy HMRC CIS verification API | UTR, company name, workspace creds | CIS status | Supabase JWT | ⏳ P10 |
| hmrc-cis-submit | Submit monthly CIS300 return | Return XML, workspace creds | Submission ref | Supabase JWT | ⏳ P10 |
| companies-house-search | Companies House company search | Company name or number | Company data | Supabase JWT | ⏳ P11 |
| send-notification-email | Dispatch notification emails via Resend | To, subject, template, data | Email sent | Service role | ⏳ P19 |
| send-portal-invite | Send portal magic link | Email, token, project_id | Email sent | Service role | ⏳ P16 |
| generate-board-pack | Aggregate board pack data | project_ids, period | Board pack data | Supabase JWT | ⏳ P17 |

---

## Scheduled Jobs (Cron)

| Job | Schedule | Purpose | Edge Function | Status |
|-----|----------|---------|--------------|--------|
| ce-deadline-monitor | Nightly 02:00 UTC | Check CE deadlines, create notifications | ce-deadline-check | ⏳ P07 |
| pln-deadline-monitor | Nightly 02:00 UTC | Check PLN cutoffs, create alerts | pln-deadline-check | ⏳ P09 |
| cis-return-reminder | 1st of month 08:00 UTC | Remind workspace admin CIS return due | send-notification-email | ⏳ P10 |
| retention-release-check | Weekly Mon 08:00 UTC | Check for retention due for release | retention-check | ⏳ P12 |
| insurance-expiry-check | Weekly Mon 08:00 UTC | Check supplier insurance expiry | compliance-check | ⏳ P11 |
| companies-house-refresh | Weekly Sun 03:00 UTC | Refresh company status for active suppliers | companies-house-search | ⏳ P11 |

---

## Indexes Required (V2)

```sql
-- Performance indexes for new V2 tables
CREATE INDEX IF NOT EXISTS idx_ce_workflow_states_ce_id ON ce_workflow_states(change_event_id);
CREATE INDEX IF NOT EXISTS idx_ce_workflow_states_workspace ON ce_workflow_states(workspace_id);
CREATE INDEX IF NOT EXISTS idx_early_warnings_project ON early_warnings(project_id);
CREATE INDEX IF NOT EXISTS idx_early_warnings_workspace ON early_warnings(workspace_id);
CREATE INDEX IF NOT EXISTS idx_pay_less_notices_application ON pay_less_notices(application_id);
CREATE INDEX IF NOT EXISTS idx_suspension_notices_application ON suspension_notices(application_id);
CREATE INDEX IF NOT EXISTS idx_cis_payment_lines_return ON cis_payment_lines(return_id);
CREATE INDEX IF NOT EXISTS idx_cis_payment_lines_supplier ON cis_payment_lines(supplier_id);
CREATE INDEX IF NOT EXISTS idx_retention_ledger_project ON retention_ledger(project_id);
CREATE INDEX IF NOT EXISTS idx_subcontract_orders_project ON subcontract_orders(project_id);
CREATE INDEX IF NOT EXISTS idx_subcontract_orders_supplier ON subcontract_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_snagging_items_project ON snagging_items(project_id);
CREATE INDEX IF NOT EXISTS idx_cashflow_forecasts_project ON cashflow_forecasts(project_id);
CREATE INDEX IF NOT EXISTS idx_programme_notifications_project ON programme_notifications(project_id);
```

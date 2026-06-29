# MeasureDeck — Build Control: 20 Phases × 20 Tasks = 400 Tasks
**Version:** 1.0 | **Created:** June 2026 | **Owner:** Build Control Agent  
**Status Legend:** ⏳ Pending | 🔄 In Progress | ✅ Complete | ❌ Blocked

---

## Phase 01 — Full Codebase And Document Audit

### Goal
Establish the complete baseline understanding of V1's current state before writing a single line of V2 code. Create all build control documents. This phase is documentation and discovery only.

### Commercial Reason
You cannot safely build V2 without knowing exactly what V1 contains. Missing this step causes regressions, duplicate code, broken migrations, and wasted effort. The control documents created here are the single source of truth for all 19 subsequent phases.

### Dependencies
None — this is the foundation phase.

### Files/Areas To Inspect First
- `docs/IMPLEMENTATION_PLAN_V1-V2.md`
- `docs/COMPETITIVE_ANALYSIS_AND_ROADMAP.md`
- `src/app/` (all route groups)
- `src/components/`
- `src/lib/feature-flags.ts`
- `supabase/migrations/`
- `package.json`

### 20 Tasks

| Task ID | Task Name | Description | Files/Routes | Supabase/RLS | UI/UX | Tests | Acceptance Criteria | Status |
|---------|-----------|-------------|-------------|-------------|-------|-------|--------------------|----|
| MD-P01-T01 | Read IMPLEMENTATION_PLAN_V1-V2.md | Read full document, extract: architecture principles, 9 levels, 56 steps, all V2 feature flags, migration SQL, shared components list, free API list | docs/IMPLEMENTATION_PLAN_V1-V2.md | None | None | Doc exists and is readable | Document fully read; key facts extracted to progress log | ✅ |
| MD-P01-T02 | Read COMPETITIVE_ANALYSIS_AND_ROADMAP.md | Read full document, extract: 10 competitor analyses, 20 feature gaps, pricing tiers, top 12 roadmap features, UK contract law requirements | docs/COMPETITIVE_ANALYSIS_AND_ROADMAP.md | None | None | Doc exists and is readable | Document fully read; key commercial requirements extracted | ✅ |
| MD-P01-T03 | Audit all app routes | List every route in src/app/(app)/ with its tabs, wizard, mobile status, and completion level. Record in BUILD_UI_COMPLETION_MATRIX.md | src/app/(app)/** | None | None | None | All 50+ app routes documented with status | ✅ |
| MD-P01-T04 | Audit admin routes | List every route in src/app/admin/ with its mock vs real data status | src/app/admin/** | None | None | None | All 24 admin routes documented | ✅ |
| MD-P01-T05 | Audit all components | List every component in src/components/ with its purpose, mock vs real, and gaps | src/components/** | None | None | None | All 8 subdirectories, 25+ files documented | ✅ |
| MD-P01-T06 | Audit Supabase migrations | Read all 3 migration files, record all table names, column names, RLS policies, and indexes in BUILD_SUPABASE_MATRIX.md | supabase/migrations/*.sql | All 3 migrations | None | None | 3 migrations documented; all tables listed | ✅ |
| MD-P01-T07 | Audit feature flags | Read src/lib/feature-flags.ts and record all 20 existing flags, their default values, and which pages use them. Note: V2 flags not yet defined | src/lib/feature-flags.ts | None | None | None | 20 flags documented with defaults and usage | ✅ |
| MD-P01-T08 | Audit shell architecture | Confirm: (app) uses ShellClient with AppSidebar + TopBar; admin uses AdminShellClient. No duplicate shells on any route. Record shells in BUILD_UI_COMPLETION_MATRIX.md | src/app/(app)/layout.tsx, src/app/admin/layout.tsx, src/app/(app)/shell-client.tsx, src/components/shell/* | None | Confirm single shell per route group | Browser: load /home, /admin — confirm one sidebar each | Zero duplicate sidebars confirmed | ✅ |
| MD-P01-T09 | Audit all wizard files | List all 12 wizards, their steps, Supabase write targets, error handling status, draft save status, and mobile layout status | src/components/wizards/* | Check each wizard's supabaseClient calls | Check mobile CSS at 375px | None | All 12 wizards documented in BUILD_BUTTON_AND_ROUTE_AUDIT.md | ✅ |
| MD-P01-T10 | Audit notification infrastructure | Confirm notifications table exists. Check shell-client.tsx notification polling. Check notifications-view.tsx for mock vs real data | src/app/(app)/shell-client.tsx, src/components/ai-bubble/modes/notifications-view.tsx | Query `notifications` table | None | Test Supabase query | Notification table status confirmed; gaps recorded | ✅ |
| MD-P01-T11 | Audit auth and onboarding | Check login, signup, forgot-password, reset-password, MFA, onboarding routes. Confirm they function correctly | src/app/(auth)/** | auth.uid() flows | Auth pages render | Auth flows complete | All auth routes documented and confirmed working | ✅ |
| MD-P01-T12 | Audit storage buckets | List all 5 Supabase Storage buckets: avatars, project-media, drawings, evidence, reports. Record their RLS policies | Supabase Storage | Bucket policies | None | Upload test per bucket | All buckets documented in BUILD_SUPABASE_MATRIX.md | ✅ |
| MD-P01-T13 | Audit current RLS completeness | Check if all existing tables have RLS enabled. Check for `get_user_workspace_ids()` usage (must be 0 — that function doesn't exist). Confirm workspace_memberships subquery pattern | supabase/migrations/*.sql | All RLS policies | None | RLS policy enumeration | All existing RLS policies documented; no forbidden function calls | ✅ |
| MD-P01-T14 | Audit TypeScript baseline | Run `npx tsc --noEmit` and confirm 0 errors before any V2 changes. Record baseline in BUILD_TEST_MATRIX.md | All src/** files | None | None | `npx tsc --noEmit` = 0 errors | TypeScript: 0 errors confirmed as V1 baseline | ✅ |
| MD-P01-T15 | Audit package.json dependencies | Check all installed packages. Confirm: @supabase/ssr, react-query v5, react-hook-form, zod, recharts, framer-motion, sonner, @react-pdf/renderer (missing — note), lucide-react | package.json | None | None | None | All dependencies listed; missing packages flagged (PDF library) | ✅ |
| MD-P01-T16 | Audit existing button wiring | Check key CTA buttons across home, projects, changes, applications detail pages. Record dead/partial/wired status in BUILD_BUTTON_AND_ROUTE_AUDIT.md | src/app/(app)/home/page.tsx, projects/page.tsx, changes/[changeId]/page.tsx, applications/[applicationId]/page.tsx | None | None | Browser click test | All audited buttons documented with wiring status | ✅ |
| MD-P01-T17 | Audit mobile layouts | Open /home, /projects, /changes, /applications at 375px viewport. Record horizontal scroll issues, broken layouts, or missing mobile adaptations | src/app/(app)/home/page.tsx, projects/page.tsx | None | 375px viewport | Browser resize test | Mobile layout issues documented per page | ✅ |
| MD-P01-T18 | Audit AI copilot infrastructure | Check api/ai/chat route, AIBubbleButton, CopilotView. Confirm AI infrastructure is present and functioning. Note hooks needed for V2 AI features | src/app/api/ai/chat/route.ts, src/components/ai-bubble/** | None | AI panel renders | API test | AI copilot confirmed working; V2 hooks documented | ✅ |
| MD-P01-T19 | Audit edge functions and cron | Check if any Supabase Edge Functions exist. Check for any cron/scheduled jobs. Record in BUILD_SUPABASE_MATRIX.md | supabase/functions/ (if exists) | Edge functions | None | None | Edge function status documented (likely none in V1) | ✅ |
| MD-P01-T20 | Create all 8 BUILD control documents | Create: BUILD_TODO_20x20.md, BUILD_PROGRESS_LOG.md, BUILD_RELEASE_GATES.md, BUILD_RISK_REGISTER.md, BUILD_TEST_MATRIX.md, BUILD_SUPABASE_MATRIX.md, BUILD_UI_COMPLETION_MATRIX.md, BUILD_BUTTON_AND_ROUTE_AUDIT.md with full initial content | docs/ | None | None | All 8 files exist with content | All 8 control documents created and populated | ✅ |

### Phase Release Gate
- ✅ Both strategy documents fully read
- ✅ All 8 BUILD_ control documents created
- ✅ Route audit complete
- ✅ Component audit complete
- ✅ Migration audit complete (3 files)
- ✅ Feature flag audit complete (20 flags)
- ✅ TypeScript: 0 errors confirmed
- ✅ No duplicate shells confirmed

---

## Phase 02 — Architecture Guardrails, Feature Flags And Release Control

### Goal
Build the safety foundation: V2 feature flags, shared utility helpers (audit, activity, notifications, workspace scope), error boundaries, and the rollback procedure. Nothing in V2 can be safely built without these in place.

### Commercial Reason
Releasing broken features to existing paying customers destroys trust. Feature flags allow instant disable of any V2 feature. Shared helpers ensure audit trails are created for every commercial mutation — protecting MeasureDeck legally in any dispute. Without these, every V2 feature would need its own ad-hoc implementation of audit/activity/notifications.

### Dependencies
- Phase 01 complete
- `src/lib/feature-flags.ts` exists

### Files/Areas To Inspect First
- `src/lib/feature-flags.ts`
- `src/app/(app)/shell-client.tsx` (notification count)
- `src/components/ui/empty-state.tsx`
- `src/components/ui/loading-skeleton.tsx`

### 20 Tasks

| Task ID | Task Name | Description | Files/Routes | Supabase/RLS | UI/UX | Tests | Acceptance Criteria | Status |
|---------|-----------|-------------|-------------|-------------|-------|-------|--------------------|----|
| MD-P02-T01 | Extend V2 feature flag registry | Add all 20 V2 feature flags to src/lib/feature-flags.ts: nec4_ce_engine, hgcra_suite, cis_compliance, retention_module, cashflow_forecasting, evm_dashboard, subcontract_orders, supply_chain_kyc, pc_snagging, ai_contract_analyser, ai_ce_identifier, ai_daywork_capture, client_portal, cross_project_analytics, adjudication_module, asta_import, programme_notifications, delay_analysis, fluctuations_module, mobile_dayworks. All default to false | src/lib/feature-flags.ts | None | None | `getFlag('nec4_ce_engine')` returns false | 20 new flags added; TypeScript FeatureFlag union updated; all default false | ⏳ |
| MD-P02-T02 | Create workspace_feature_flags table design | Design SQL for workspace-level flag overrides table (to allow per-workspace flag enabling in admin). SQL to be used in Migration 004 or a separate migration | supabase/migrations/ (design only in P02, implemented in P03) | workspace_id FK, RLS required | Admin panel flag toggle will write here | None yet | SQL schema designed and documented in BUILD_SUPABASE_MATRIX.md | ⏳ |
| MD-P02-T03 | Wire admin feature-flags page to real data | /admin/feature-flags currently shows static flag list. Wire it to call getFlag() for each workspace. Add "Override for workspace" toggle that updates DB | src/app/admin/feature-flags/page.tsx | Read/write workspace_feature_flags | Toggle UI, workspace selector dropdown | Toggle fires, DB row updated | Admin can toggle flag per workspace; change persists on reload | ⏳ |
| MD-P02-T04 | Create src/lib/audit.ts helper | Create audit event helper: `createAuditEvent(supabase, { workspace_id, user_id, action, resource_type, resource_id, old_values, new_values })`. Writes to audit_events table. Used by every commercial mutation. | src/lib/audit.ts (new file) | audit_events table INSERT | None | Unit test: createAuditEvent creates row | audit_events row created with correct fields; no TS errors | ⏳ |
| MD-P02-T05 | Create src/lib/activity.ts helper | Create activity feed helper: `createActivityEntry(supabase, { workspace_id, project_id, actor_id, type, summary, entity_type, entity_id, metadata })`. Used to populate activity tabs on detail pages | src/lib/activity.ts (new file) | activity_entries table INSERT (or reuse audit_events) | None | Unit test: createActivityEntry creates row | Activity entry created; shows in activity feed | ⏳ |
| MD-P02-T06 | Create src/lib/notifications.ts helper | Create notification dispatch helper: `createNotification(supabase, { workspace_id, user_id, type, title, body, action_url, urgency })`. Writes to notifications table. Also exports `getUnreadCount()` and `markAllRead()` | src/lib/notifications.ts (new file) | notifications table CRUD | None | Unit test: notification created, count updates | Notification appears in bell icon dropdown | ⏳ |
| MD-P02-T07 | Create src/lib/workspace.ts scope helper | Create workspace scope helper: `getWorkspaceId(supabase)` — returns current user's primary workspace_id. `assertWorkspaceMember(supabase, workspace_id)` — throws if user is not a member. Used at top of every server action | src/lib/workspace.ts (new file) | workspace_memberships SELECT | None | Unit test: returns workspace_id for member | Returns correct workspace_id; throws for non-member | ⏳ |
| MD-P02-T08 | Create src/lib/permissions.ts helper | Create permission check helper: `canPerformAction(supabase, { workspace_id, action, resource })`. Maps role (admin/member/viewer) to allowed actions. Returns boolean | src/lib/permissions.ts (new file) | workspace_memberships role field | None | Unit test: admin can delete; viewer cannot | Permission check returns correct boolean per role | ⏳ |
| MD-P02-T09 | Create src/lib/storage.ts helper | Create storage helper: `uploadFile(supabase, { bucket, path, file, metadata })` with progress tracking. `getSignedUrl(supabase, { bucket, path })` for private files. `deleteFile(supabase, { bucket, path })` with immutability guard for legal-notices bucket | src/lib/storage.ts (new file) | Supabase Storage API | None | Unit test: upload, signed URL, delete | File uploads succeed; legal-notices bucket rejects delete | ⏳ |
| MD-P02-T10 | Create shared error boundary component | Create `src/components/ui/error-boundary.tsx` — React ErrorBoundary that catches render errors, shows a clean "Something went wrong" card with retry button. Used in all page layouts | src/components/ui/error-boundary.tsx (new file) | None | Error card renders; retry button works | Throw render error → error card shows | Works in browser; no crash to blank screen | ⏳ |
| MD-P02-T11 | Create feature gate component | Create `src/components/ui/feature-gate.tsx` — wraps children in a flag check: `<FeatureGate flag="nec4_ce_engine" fallback={<UpgradePrompt />}>`. Used on all V2 feature areas | src/components/ui/feature-gate.tsx (new file) | None | Upgrade prompt renders when flag off | Flag on = children render; flag off = fallback renders | FeatureGate correctly gates content per flag state | ⏳ |
| MD-P02-T12 | Create plan/subscription gate component | Create `src/components/ui/plan-gate.tsx` — wraps children in a subscription plan check. Plans: essentials/professional/enterprise. Shows upgrade CTA when plan insufficient | src/components/ui/plan-gate.tsx (new file) | workspaces.plan field | Upgrade CTA renders | Plan check returns correct result | PlanGate shows CTA for essentials users trying professional features | ⏳ |
| MD-P02-T13 | Standardise loading skeleton | Verify `src/components/ui/loading-skeleton.tsx` has variants: card, list-row, detail-page, stat-card. Used on every data-fetching page. Fix any missing variants | src/components/ui/loading-skeleton.tsx | None | All 4 variants render correctly | Visual test | 4 skeleton variants render without errors | ⏳ |
| MD-P02-T14 | Standardise empty state component | Verify `src/components/ui/empty-state.tsx` has props: title, description, actionLabel, actionFn, icon. Used on all list pages when no data. Add "Create first X" CTA wiring | src/components/ui/empty-state.tsx | None | Empty state renders with CTA | Visual test | Empty state renders; CTA fires actionFn | ⏳ |
| MD-P02-T15 | Create shared immutability guard | Create `src/lib/immutability.ts` — `assertNotImmutable(record: { is_immutable?: boolean, issued_at?: Date })` — throws if record is marked immutable. Used before any update on legal notices, CIS returns, PC certificates | src/lib/immutability.ts (new file) | None | None | Unit test: immutable record throws; mutable record passes | Guard correctly blocks updates on immutable records | ⏳ |
| MD-P02-T16 | Document release gate checklist | Create BUILD_RELEASE_GATES.md with phase-by-phase gate checklists (done in P01, verify complete here). Every phase must have TypeScript, build, browser, mobile, RLS, and regression checks | docs/BUILD_RELEASE_GATES.md | None | None | File exists with all 20 phase gates | BUILD_RELEASE_GATES.md populated with all 20 phases | ✅ |
| MD-P02-T17 | Document rollback procedure | Write rollback/flag-off procedure in BUILD_RELEASE_GATES.md: (1) Disable feature flag for affected workspace, (2) No DB rollback needed (additive-only migrations), (3) Hot-fix deployment procedure | docs/BUILD_RELEASE_GATES.md | Migration rollback plan | None | None | Rollback procedure documented clearly | ⏳ |
| MD-P02-T18 | Verify build clean after P02 changes | Run `npx tsc --noEmit` and confirm 0 errors after all P02 additions. Run `npm run build` if feasible | All new src/lib/* files | None | None | `npx tsc --noEmit` = 0 errors | TypeScript: 0 errors; build succeeds | ⏳ |
| MD-P02-T19 | V1 regression test after P02 | Load /home, /projects, /cvr, /applications in browser. Confirm no regressions from P02 lib additions | src/app/(app)/home/page.tsx + key V1 pages | None | All 4 pages render | Browser load test | All 4 V1 core pages load without errors | ⏳ |
| MD-P02-T20 | Update progress log and risk register | Update BUILD_PROGRESS_LOG.md: P02 status = IN PROGRESS. Update BUILD_RISK_REGISTER.md with R02 (migration safety) and R05 (feature flag leakage) mitigations | docs/BUILD_PROGRESS_LOG.md, docs/BUILD_RISK_REGISTER.md | None | None | None | Progress log updated; risk register mitigations documented | ⏳ |

### Phase Release Gate
- [ ] 20 V2 feature flags added, all default false
- [ ] `src/lib/audit.ts` exports `createAuditEvent()`
- [ ] `src/lib/activity.ts` exports `createActivityEntry()`
- [ ] `src/lib/notifications.ts` exports notification helpers
- [ ] `src/lib/workspace.ts` exports workspace scope helpers
- [ ] FeatureGate component blocks V2 content when flag is off
- [ ] TypeScript: 0 errors
- [ ] V1 regression: home, projects, CVR, applications all load

---

## Phase 03 — Supabase Schema Hardening And RLS Completion

### Goal
Execute all 4 V2 database migrations, add workspace_feature_flags table, verify all RLS policies, add required indexes, and confirm the notification table exists correctly. No V2 UI can be built before the data model is in place.

### Commercial Reason
Every V2 feature (NEC4 engine, HGCRA compliance, CIS, retention, subcontracts) requires new tables. An incorrect migration on a live production database with 130+ tables could corrupt commercial data. Additive-only approach and thorough RLS ensures tenant isolation — a critical requirement for enterprise SaaS.

### Dependencies
- Phase 01 complete (schema audit done)
- Phase 02 complete (audit helpers ready)
- Supabase project access confirmed (ref: ketzbsaksgibifkecxue)

### Files/Areas To Inspect First
- `supabase/migrations/003_schema_expansion.sql` (reference existing patterns)
- `docs/BUILD_SUPABASE_MATRIX.md` (migration SQL defined here)
- Existing RLS policy patterns in migration files

### 20 Tasks

| Task ID | Task Name | Description | Files/Routes | Supabase/RLS | UI/UX | Tests | Acceptance Criteria | Status |
|---------|-----------|-------------|-------------|-------------|-------|-------|--------------------|----|
| MD-P03-T01 | Write Migration 004: NEC4 workflow tables | Write SQL: CREATE TABLE IF NOT EXISTS ce_workflow_states (id, workspace_id, change_event_id, state CHECK enum, timestamps, clause_reference). CREATE early_warnings. CREATE programme_notifications. ADD COLUMN IF NOT EXISTS on change_events (nec4_clause, notification_date, pm_instruction_ref, etc.) | supabase/migrations/004_nec4_workflow.sql (new) | All tables: workspace_id FK + RLS policy using workspace_memberships subquery | None | Migration runs clean | Migration executes without SQL errors; tables exist in DB | ⏳ |
| MD-P03-T02 | Write Migration 005: HGCRA compliance tables | Write SQL: CREATE pay_less_notices (id, workspace_id, application_id FK, notified_sum, withheld_amount, amount_to_pay generated, grounds, prescribed_period_end, issued_at, status CHECK, pdf_url). CREATE suspension_notices. ALTER applications ADD COLUMN IF NOT EXISTS (contract_type, payment_notice_due_date, final_date_for_payment, prescribed_period_days, notified_sum, hgcra_compliant) | supabase/migrations/005_hgcra_compliance.sql (new) | RLS on both new tables | None | Migration runs clean | Migration executes; pay_less_notices and suspension_notices tables exist | ⏳ |
| MD-P03-T03 | Write Migration 006: CIS, retention, subcontracts | Write SQL: CREATE cis_records (supplier_id FK, utr, verification status CHECK enum, expiry). CREATE cis_monthly_returns (workspace_id, tax_month UNIQUE, status, xml_payload). CREATE cis_payment_lines (return_id FK, supplier_id FK, gross, materials, deduction_rate, deduction_amount). CREATE retention_ledger (project_id FK, entry_type, moiety, release_trigger, amounts). CREATE subcontract_orders (project_id FK, supplier_id FK, contract_form CHECK, order_number, financial fields, status CHECK) | supabase/migrations/006_cis_retention_subcontracts.sql (new) | RLS on all 5 new tables | None | Migration runs clean | All 5 tables created; unique constraint on cis_monthly_returns(workspace_id, tax_month) works | ⏳ |
| MD-P03-T04 | Write Migration 007: Adjudication, PC, snagging, cashflow | Write SQL: CREATE adjudication_cases. CREATE practical_completions (project_id FK, section_reference, pc_date, certificate_number, dlp_end_date, status CHECK). CREATE snagging_items (pc_id FK optional, project_id FK, location, photo_urls array, status CHECK, priority CHECK). CREATE cashflow_forecasts (project_id FK, month_year, revenue_planned, cost_planned, revenue_actual, cost_actual, UNIQUE per project+month). CREATE workspace_feature_flags (workspace_id FK, flag_name, enabled, set_by) | supabase/migrations/007_lifecycle_analytics.sql (new) | RLS on all new tables | None | Migration runs clean | All tables created; UNIQUE constraints work; photo_urls TEXT[] accepted | ⏳ |
| MD-P03-T05 | Write Migration 008: Notifications and portal | Write SQL: Confirm/fix notifications table schema (id, workspace_id, user_id, type, title, body, action_url, urgency, read_at, created_at). CREATE portal_access_tokens (workspace_id, project_id, token UUID unique, expires_at, permissions JSONB, revoked_at). CREATE portal_audit_log (token_id FK, action, ip_address, user_agent, performed_at) | supabase/migrations/008_notifications_portal.sql (new) | RLS on portal tables; notifications: user_id = auth.uid() | None | Migration runs clean | Notifications table confirmed/fixed; portal tables created | ⏳ |
| MD-P03-T06 | Push all migrations to Supabase | Push migrations 004–008 to live Supabase project ketzbsaksgibifkecxue using Management API or Supabase CLI. Verify each migration returns 200/success | Node.js HTTPS push script (reference prior session pattern) | All 5 migrations | None | curl/Node success response | All 5 migrations applied; STATUS 201 per migration | ⏳ |
| MD-P03-T07 | Add RLS policy: ce_workflow_states | Add: `CREATE POLICY "workspace_members_only" ON ce_workflow_states FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_memberships WHERE user_id = auth.uid()))` | supabase/migrations/004_nec4_workflow.sql | ce_workflow_states | None | RLS test: member reads → data; non-member → empty | Member sees CE workflow states; non-member sees nothing | ⏳ |
| MD-P03-T08 | Add RLS policies: all HGCRA tables | Add workspace_memberships subquery RLS to pay_less_notices and suspension_notices | supabase/migrations/005_hgcra_compliance.sql | pay_less_notices, suspension_notices | None | RLS tests for both tables | Both tables enforce workspace isolation | ⏳ |
| MD-P03-T09 | Add RLS policies: all CIS/retention/subcontract tables | Add workspace_memberships subquery RLS to: cis_records, cis_monthly_returns, cis_payment_lines, retention_ledger, subcontract_orders | supabase/migrations/006_cis_retention_subcontracts.sql | 5 new tables | None | RLS tests for all 5 | All 5 tables enforce workspace isolation | ⏳ |
| MD-P03-T10 | Add RLS policies: all lifecycle tables | Add workspace_memberships subquery RLS to: adjudication_cases, practical_completions, snagging_items, cashflow_forecasts, workspace_feature_flags, portal_access_tokens, portal_audit_log | supabase/migrations/007 & 008 | 7 new tables | None | RLS tests | All 7 tables enforce workspace isolation | ⏳ |
| MD-P03-T11 | Create all V2 performance indexes | Execute: CREATE INDEX IF NOT EXISTS for all 15 indexes listed in BUILD_SUPABASE_MATRIX.md — covering ce_workflow_states(change_event_id), early_warnings(project_id), pay_less_notices(application_id), cis_payment_lines(return_id, supplier_id), retention_ledger(project_id), subcontract_orders(project_id, supplier_id), snagging_items(project_id), cashflow_forecasts(project_id), programme_notifications(project_id) | supabase/migrations/ | Index creation | None | `EXPLAIN ANALYZE` on key queries | Indexes created; query plans use indexes | ⏳ |
| MD-P03-T12 | Audit and fix existing RLS completeness | Run SQL to list all tables without RLS enabled: `SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT IN (SELECT tablename FROM pg_policies)`. Fix any existing tables missing RLS. Confirm 0 tables unprotected | Supabase SQL editor | All public schema tables | None | RLS check query returns 0 | All tables have RLS; 0 unprotected tables in public schema | ⏳ |
| MD-P03-T13 | Confirm notifications table schema | Check if notifications table matches expected schema. If it exists with wrong schema, ALTER to add missing columns. If it doesn't exist, it was created in migration 008 | notifications table | workspace_id, user_id, type, title, body, action_url, urgency, read_at | None | SELECT from notifications | notifications table confirmed with correct schema | ⏳ |
| MD-P03-T14 | Confirm audit_events table schema | Check audit_events table has: id, workspace_id, user_id, action, resource_type, resource_id, old_values JSONB, new_values JSONB, ip_address, created_at. Add missing columns if needed | audit_events table | workspace_id, JSONB columns | None | SELECT from audit_events | audit_events confirmed with all required columns | ⏳ |
| MD-P03-T15 | Create storage bucket: legal-notices | Create Supabase Storage bucket `legal-notices` with NO DELETE policy. This bucket stores PLN PDFs, PC certificates, CIS return XMLs. Objects are immutable once created | Supabase Storage | Bucket policy: STORAGE INSERT OK, DELETE FORBIDDEN | None | Upload test; delete attempt → rejection | Bucket created; upload works; delete returns 403 | ⏳ |
| MD-P03-T16 | Create storage bucket: cis-documents | Create Supabase Storage bucket `cis-documents` for CIS monthly return XMLs and annual statements. No delete policy. Workspace-scoped read | Supabase Storage | INSERT OK, DELETE FORBIDDEN | None | Upload/download test | Bucket created; correct permissions confirmed | ⏳ |
| MD-P03-T17 | Test RLS isolation with two test workspaces | Create two test workspaces in Supabase. Insert data into Workspace A tables. Query from Workspace B user. Confirm Workspace B sees zero rows from Workspace A on all new V2 tables | Supabase test data | All new V2 table RLS policies | None | Supabase direct query | 0 rows returned when querying another workspace's data | ⏳ |
| MD-P03-T18 | Update admin audit page with real data | /admin/audit currently shows hardcoded mock data. Wire it to SELECT from audit_events with pagination. Show: timestamp, workspace, user, action, resource_type, resource_id | src/app/admin/audit/page.tsx | audit_events SELECT (admin client — bypasses RLS) | Table renders with real audit events | Load page → real data appears | Admin audit log shows real events from audit_events table | ⏳ |
| MD-P03-T19 | TypeScript check after all migrations | Run `npx tsc --noEmit` — confirm 0 errors. Ensure no new type definitions are broken by migration additions | All src/** | None | None | 0 TS errors | TypeScript: 0 errors after all schema changes | ⏳ |
| MD-P03-T20 | V1 regression test after migrations | Load /home, /projects, /cvr, /applications, /suppliers, /changes in browser. Confirm all V1 pages still function correctly after migrations | All V1 app routes | None | All pages render | Browser load test | All V1 pages load correctly; no regressions | ⏳ |

### Phase Release Gate
- [ ] Migrations 004–008 all execute cleanly (no SQL errors)
- [ ] All new tables have workspace_id and RLS
- [ ] RLS isolation test: 0 cross-workspace data leakage
- [ ] notifications table confirmed with correct schema
- [ ] audit_events table confirmed with all columns
- [ ] legal-notices and cis-documents storage buckets created
- [ ] Performance indexes created
- [ ] TypeScript: 0 errors
- [ ] V1 regression: all V1 pages work

---

## Phase 04 — Shared Enterprise Component Library

### Goal
Build the reusable premium UI components that multiple V2 features will share. Building these first prevents duplication and ensures visual consistency. Also installs @react-pdf/renderer for legal document generation.

### Commercial Reason
Components like CountdownClock, VerticalStepper, and ComplianceBadge appear on NEC4 CE pages, HGCRA pages, CIS pages, and supplier compliance pages. Building them once and reusing them across 20+ pages is 10× more efficient than building them ad-hoc per feature. The enterprise visual quality these components provide directly supports the £120–£250/user pricing tier.

### Dependencies
- Phase 02 complete (lib helpers available)
- Phase 03 complete (tables exist for notes/activity writes)
- npm install @react-pdf/renderer required

### Files/Areas To Inspect First
- `src/components/ui/` (existing components to understand patterns)
- `src/components/ui/status-chip.tsx` (extend this)
- `src/components/ui/loading-skeleton.tsx`
- `src/components/ui/empty-state.tsx`

### 20 Tasks

| Task ID | Task Name | Description | Files/Routes | Supabase/RLS | UI/UX | Tests | Acceptance Criteria | Status |
|---------|-----------|-------------|-------------|-------------|-------|-------|--------------------|----|
| MD-P04-T01 | Install @react-pdf/renderer | Add `@react-pdf/renderer` to package.json dependencies. Confirm it installs without conflicts with Next.js 16 and React 19. Create a test PDF component to verify it works | package.json | None | None | `npm install` succeeds; test PDF renders | Package installed; test PDF generates without errors | ⏳ |
| MD-P04-T02 | Install next-pwa | Add `next-pwa` to package.json. Configure in next.config.ts. Required for Phase 14 PWA. Install now so config is in place | package.json, next.config.ts | None | None | Build succeeds with next-pwa | next-pwa installed and configured; build still clean | ⏳ |
| MD-P04-T03 | Install pptxgenjs | Add `pptxgenjs` to package.json for Phase 17 PowerPoint export. Client-side only usage (no server import) | package.json | None | None | `npm install` succeeds | pptxgenjs installed; no TS conflicts | ⏳ |
| MD-P04-T04 | Create CountdownClock component | Build `src/components/ui/countdown-clock.tsx`. Props: `deadline: Date`, `label: string`, `urgencyThresholdDays?: number`. Uses `useEffect` + `setInterval(1000)`. Colour: green → amber (< threshold days) → red (< 2 days) → flashing red (overdue). Shows: DD HH MM SS. Mobile-responsive | src/components/ui/countdown-clock.tsx (new) | None | Animated clock; colour transitions | Visual test at different time states | Clock counts down correctly; colour changes at correct thresholds; stops at 00:00:00 and shows "OVERDUE" | ⏳ |
| MD-P04-T05 | Create ComplianceBadge component | Build `src/components/ui/compliance-badge.tsx`. Props: `status: 'compliant' | 'at_risk' | 'non_compliant' | 'expired' | 'pending'`, optional `label?: string`. Renders coloured pill with icon. Used across CIS, supply chain, HGCRA | src/components/ui/compliance-badge.tsx (new) | None | 5 colour variants; icon per status | Visual test all 5 variants | All 5 variants render; correct colour and icon per status | ⏳ |
| MD-P04-T06 | Create VerticalStepper component | Build `src/components/ui/vertical-stepper.tsx`. Props: `steps: { id, label, description?, timestamp?, status: 'complete' | 'current' | 'upcoming' | 'overdue' }[]`. Renders vertical line with circle nodes. Current step: pulse animation. Overdue: red. Complete: green check. Used for CE workflow, payment timeline, PC lifecycle | src/components/ui/vertical-stepper.tsx (new) | None | Vertical layout; responsive | Visual test with CE states | Steps render correctly; animations work; mobile-responsive | ⏳ |
| MD-P04-T07 | Create RiskMatrix component | Build `src/components/ui/risk-matrix.tsx`. Props: `items: { id, label, likelihood: 1-5, impact: 1-5 }[]`. Renders 5×5 grid. Cells coloured: green (low), amber (medium), red (high), dark red (critical). Items plotted as dots. Click dot → shows item label in tooltip | src/components/ui/risk-matrix.tsx (new) | None | 5×5 grid; dots plotted; tooltips | Visual test with sample EWR data | Grid renders; items plotted in correct cells; tooltips show | ⏳ |
| MD-P04-T08 | Create SCurveChart component | Build `src/components/ui/s-curve-chart.tsx` using Recharts ComposedChart. Data: `{ month: string, planned?: number, actual?: number, forecast?: number }[]`. Renders: planned as AreaChart (blue), actual as Line (green), forecast as dashed Line (amber). Legend. Responsive container. Used for cashflow and EVM | src/components/ui/s-curve-chart.tsx (new) | None | Recharts ComposedChart; legend; responsive | Render with sample data | Three line types render; legend correct; responsive at 375px | ⏳ |
| MD-P04-T09 | Create KPICard component | Build `src/components/ui/kpi-card.tsx`. Props: `label: string`, `value: string | number`, `change?: string`, `trend?: 'up' | 'down' | 'flat'`, `icon?: LucideIcon`, `variant?: 'default' | 'success' | 'warning' | 'danger'`. Trend arrow coloured by direction and context. Used in KPI strips across all feature areas | src/components/ui/kpi-card.tsx (new) | None | Card with value, label, trend arrow | Visual test all variants | All variants render; trend arrows correctly coloured | ⏳ |
| MD-P04-T10 | Create CommercialSummaryCard component | Build `src/components/ui/commercial-summary-card.tsx`. Shows: entity title, status pill, key financial figure, secondary figure, 2 quick-stat pills, action button. Used for project/subcontract/application summary cards on dashboards | src/components/ui/commercial-summary-card.tsx (new) | None | Card layout; mobile stack | Visual test | Card renders correctly at all breakpoints | ⏳ |
| MD-P04-T11 | Create AuditFeed component | Build `src/components/ui/audit-feed.tsx`. Props: `events: { id, actor_name, actor_avatar?, action, summary, created_at, metadata? }[]`. Renders timeline with avatar, action text, relative timestamp, expandable metadata. Used on all detail page Activity tabs | src/components/ui/audit-feed.tsx (new) | audit_events SELECT | Timeline layout | Render with sample events | Timeline renders; relative timestamps update; metadata expandable | ⏳ |
| MD-P04-T12 | Create NotesComposer component | Build `src/components/ui/notes-composer.tsx`. Textarea with submit button. Creates note in notes/comments table (or project-scoped table). Shows existing notes in thread below composer. Props: `entityType: string`, `entityId: string`, `workspaceId: string`. Must handle loading and error states | src/components/ui/notes-composer.tsx (new) | INSERT to notes table or audit_events | Thread layout; character count | Create note → appears in list | Notes save to DB; appear in thread without page refresh | ⏳ |
| MD-P04-T13 | Create FilterDrawer component | Build `src/components/ui/filter-drawer.tsx`. Slide-in drawer (right side) with: status multi-select, date range pickers, value range slider, owner select, project select, clear-all button, apply button. Returns filter state to parent. Used on all register/list pages | src/components/ui/filter-drawer.tsx (new) | None | Drawer opens right; stacked inputs; close on apply | Filter state changes | Drawer opens; filters apply; clear-all resets | ⏳ |
| MD-P04-T14 | Create SavedViews component | Build `src/components/ui/saved-views.tsx`. Shows chip row of named saved filter sets. Click chip → applies filters. "Save current view" button → names and saves current filters to localStorage (or DB if auth'd). Used on changes, applications, suppliers lists | src/components/ui/saved-views.tsx (new) | Optional: saved_views table | Chips row; save modal | Save → reappears on reload | Saved view persists across page reload | ⏳ |
| MD-P04-T15 | Expand StatusPill component | Extend `src/components/ui/status-chip.tsx` with all V2 status values: NEC4 CE states (pm_instruction_issued, ce_notified, quotation_submitted, deemed_accepted, implemented, disputed), HGCRA states (compliant, pln_issued, overdue, suspended), CIS states (gross, net, higher_rate, unmatched), subcontract states (draft, issued, active, completed, terminated) | src/components/ui/status-chip.tsx | None | Correct colour per status | Render all new statuses | All new status values render with correct colours | ⏳ |
| MD-P04-T16 | Create MobileCardList component | Build `src/components/ui/mobile-card-list.tsx`. Props: `items: T[]`, `renderCard: (item: T) => ReactNode`, `isLoading: boolean`, `emptyState: ReactNode`. Renders vertical stack of cards on mobile. Used as replacement for wide data tables on 375px screens. Works with any entity type | src/components/ui/mobile-card-list.tsx (new) | None | Vertical stack; full width; 375px optimised | Visual test at 375px | Card stack renders correctly at 375px | ⏳ |
| MD-P04-T17 | Create PDF template base | Create `src/lib/pdf-templates/base-template.tsx` — @react-pdf/renderer base template with: MeasureDeck branding/logo, workspace letterhead, To/From parties, date, reference number, audit UUID footer. Other templates will extend this | src/lib/pdf-templates/base-template.tsx (new) | None | PDF rendered correctly | Generate sample PDF | PDF generates with correct branding and structure | ⏳ |
| MD-P04-T18 | Extend WizardShell with draft save | Enhance `src/components/wizards/wizard-shell.tsx` to support: draft save to localStorage on every step change, resume draft on re-open, "Resume draft?" prompt on first render if draft exists, clear draft on successful completion | src/components/wizards/wizard-shell.tsx | Optional: wizard_drafts table | Draft banner shows; resume works | Open → close → reopen → resume works | Draft data persists; resume restores correct step | ⏳ |
| MD-P04-T19 | TypeScript check after all P04 components | Run `npx tsc --noEmit` — confirm 0 errors after adding all new shared components | All new src/components/ui/* files | None | None | 0 TS errors | TypeScript: 0 errors | ⏳ |
| MD-P04-T20 | V1 regression test after P04 | Load /home, /projects, /changes, /applications in browser. Confirm V1 pages unaffected by P04 component additions. Check for any CSS conflicts from new components | All V1 app routes | None | No visual regressions | Browser load test | All V1 pages look identical to pre-P04 baseline | ⏳ |

### Phase Release Gate
- [ ] @react-pdf/renderer installed and working
- [ ] next-pwa installed and configured
- [ ] CountdownClock renders and counts down correctly
- [ ] ComplianceBadge all 5 variants render
- [ ] VerticalStepper state transitions work
- [ ] RiskMatrix 5×5 grid renders with items plotted
- [ ] SCurveChart 3 line types render in Recharts
- [ ] KPICard all variants render
- [ ] AuditFeed timeline renders
- [ ] NotesComposer creates note in DB
- [ ] FilterDrawer opens, filters, closes
- [ ] StatusPill has all V2 status values
- [ ] PDF base template generates
- [ ] WizardShell draft save works
- [ ] TypeScript: 0 errors

---

## Phase 05 — Global UI, Layout, Navigation And Responsive Fixes

### Goal
Polish the entire platform shell: navigation, sidebars, breadcrumbs, spacing, colour consistency, button hierarchy, loading/error/empty states, mobile responsiveness, and accessibility. This is the pass that makes MeasureDeck feel premium before diving into V2 feature pages.

### Commercial Reason
Enterprise buyers (commercial directors, QS teams) make judgements about software quality in the first 30 seconds. Inconsistent spacing, broken mobile layouts, and unresponsive buttons kill trial conversions. This phase is the difference between "looks like a startup side project" and "this is enterprise-grade."

### Dependencies
- Phase 04 complete (shared components ready)

### Files/Areas To Inspect First
- `src/components/shell/app-sidebar.tsx`
- `src/components/shell/top-bar.tsx`
- `src/app/(app)/shell-client.tsx`
- `src/app/(app)/home/page.tsx` (reference for layout patterns)

### 20 Tasks

| Task ID | Task Name | Description | Files/Routes | Supabase/RLS | UI/UX | Tests | Acceptance Criteria | Status |
|---------|-----------|-------------|-------------|-------------|-------|-------|--------------------|----|
| MD-P05-T01 | Add V2 nav items to AppSidebar | Add navigation links for V2 sections: Early Warnings (/early-warnings), Subcontracts (/subcontracts), CIS (/cis), Analytics (/analytics), Programmes (/programmes), Adjudication (/adjudication). Group under appropriate sidebar sections. These routes will return 404 until their phases build them — wrap in FeatureGate with flag | src/components/shell/app-sidebar.tsx | None | Icons from lucide-react; correct grouping | Load app → sidebar shows new items | New nav items appear when flags enabled; correctly grouped | ⏳ |
| MD-P05-T02 | Fix sidebar mobile behaviour | On mobile (< 768px): sidebar should be hidden by default, openable via hamburger button, closeable by clicking outside or pressing Escape. Currently test and fix any issues | src/components/shell/app-sidebar.tsx, src/app/(app)/shell-client.tsx | None | Drawer on mobile; correct z-index | Mobile 375px: open/close sidebar | Sidebar opens/closes correctly on mobile | ⏳ |
| MD-P05-T03 | Fix breadcrumb consistency | Audit breadcrumbs across all detail pages. Standard format: Project Name > Section > Record Name. Add breadcrumb to any page missing it. Fix any incorrect breadcrumb hierarchies | src/components/shell/top-bar.tsx, all detail page.tsx files | None | Breadcrumbs match page hierarchy | Load 5 detail pages → check breadcrumbs | All detail pages have correct breadcrumbs | ⏳ |
| MD-P05-T04 | Fix avatar dropdown z-index | Test avatar/profile dropdown in top-right corner. On some viewports it may clip behind other content. Fix z-index layering | src/components/shell/top-bar.tsx | None | Dropdown visible above all content | Open dropdown at 768px viewport | Dropdown visible and correctly positioned | ⏳ |
| MD-P05-T05 | Standardise card border radius and shadows | Audit all card components across the app. Enforce: border-radius: var(--radius-lg), box-shadow: var(--shadow-sm). Fix any cards with different radii or no shadows. Use CSS custom properties only | All page.tsx files using cards | None | Consistent card appearance | Visual comparison across 10 pages | All cards have consistent border-radius and shadow | ⏳ |
| MD-P05-T06 | Standardise button hierarchy | Audit all buttons. Primary: filled bg with primary colour. Secondary: outlined. Ghost: no border. Danger: red. Ensure this hierarchy is consistent across all pages. Fix any non-standard buttons | All page.tsx files | None | Button hierarchy consistent | Spot-check 10 pages | Primary, secondary, ghost, danger buttons visually distinct and consistent | ⏳ |
| MD-P05-T07 | Fix tab styling consistency | Audit tab components across detail pages. All tabs should use the same `<Tabs>` component from src/components/ui/tabs.tsx. Fix any custom/inline tab implementations. Ensure active tab indicator is consistent | All detail page.tsx files | None | Consistent tab styling | Visual test across 5 detail pages | All tabs use same component; active indicator consistent | ⏳ |
| MD-P05-T08 | Fix modal/dialog positioning | Test all confirm dialogs, create modals, and edit modals. Ensure: centred on viewport, backdrop blur, correct z-index above sidebar and topbar, scrollable content if long, closeable by Escape key | All modal/dialog usage | None | Modals centred and accessible | Open modal on mobile 375px | Modals display correctly at all viewport sizes | ⏳ |
| MD-P05-T09 | Improve home dashboard activity feed | Wire home dashboard activity feed to real audit_events instead of mock data. Show: recent CEs, applications, projects with timestamps and actor names. Limit to 20 most recent | src/app/(app)/home/page.tsx | audit_events SELECT (workspace-scoped) | Feed renders real events | Load home → see real recent events | Real audit events appear in activity feed | ⏳ |
| MD-P05-T10 | Fix empty states on all list pages | Check /projects, /changes, /applications, /suppliers, /tasks list pages when workspace has no data. Each should show EmptyState component with correct icon, title, description, and "Create your first X" CTA button | All list page.tsx files | None | EmptyState renders on all list pages | Test with empty workspace | Empty state with CTA visible on all list pages | ⏳ |
| MD-P05-T11 | Fix loading states on all list pages | Check data loading behaviour on all list pages. During fetch: show LoadingSkeleton. On error: show error state with retry button. Never show blank screen. Use React Query's isLoading/isError states | All list page.tsx files | None | Skeleton → data or error | Throttle connection → skeleton visible | Loading skeleton visible during fetch; error card on failure | ⏳ |
| MD-P05-T12 | Tablet layout audit (768px) | Test all major pages at 768px viewport. Check: sidebar behaviour (collapsed vs expanded), table column visibility, wizard step layouts, card grid columns. Fix any broken tablet layouts | All page.tsx files | None | Correct layout at 768px | Resize to 768px on all major pages | No broken layouts at 768px | ⏳ |
| MD-P05-T13 | Desktop density audit (1440px) | Test all major pages at 1440px viewport. Check: no excessive white space, max-width containers correct, two-column layouts on wide screens, correct content density | All page.tsx files | None | Correct layout at 1440px | Resize to 1440px | No excessive whitespace; content fills screen appropriately | ⏳ |
| MD-P05-T14 | Accessibility: tab key navigation | Test Tab key navigation on: home, projects list, project detail, applications list. Check: all interactive elements reachable by Tab, correct focus order, no focus traps | All major pages | None | Tab order logical | Tab through all interactive elements | All buttons/links/inputs reachable by Tab; no traps | ⏳ |
| MD-P05-T15 | Accessibility: focus rings | Check all interactive elements have visible focus rings when tabbed to. CSS: `focus-visible:ring-2 focus-visible:ring-[--color-primary]`. Fix any elements with invisible focus | All pages with interactive elements | None | Focus ring visible on all elements | Tab to each element type | Focus ring visible on buttons, inputs, links, tabs | ⏳ |
| MD-P05-T16 | Fix /account page completeness | /account page has profile fields. Wire all fields to real Supabase profile data. Add: avatar upload (using storage helper), name edit, email display, password change link, MFA status | src/app/(app)/account/page.tsx | profiles UPDATE | Profile form fully functional | Edit name → save → persists on reload | All account fields save to Supabase; avatar uploads | ⏳ |
| MD-P05-T17 | Fix /settings page tabs | /settings has 3 tabs: Profile, Workspace, Notifications. Ensure all tabs have real content wired to Supabase. Add workspace branding settings (logo upload) | src/app/(app)/settings/page.tsx | workspaces UPDATE | All 3 tabs have real content | Change workspace name → save → persists | Workspace settings save correctly | ⏳ |
| MD-P05-T18 | Fix /workspace/settings page | /workspace/settings should mirror settings for workspace admin. Add: workspace slug, timezone, contract defaults (JCT/NEC4), retention rate default, CIS settings placeholder | src/app/(app)/workspace/settings/page.tsx | workspaces UPDATE | Complete settings form | Change contract default → save → persists | Workspace contract defaults save to Supabase | ⏳ |
| MD-P05-T19 | TypeScript check after P05 | Run `npx tsc --noEmit` — confirm 0 errors after all P05 changes | All modified files | None | None | 0 TS errors | TypeScript: 0 errors | ⏳ |
| MD-P05-T20 | Full V1 regression test after P05 | Load all 15 primary app routes. Check for: visual regressions, broken navigation, incorrect breadcrumbs, missing data. Document any issues found | All app routes | None | All routes render | Browser test all routes | All V1 routes render correctly; no regressions | ⏳ |

### Phase Release Gate
- [ ] V2 nav items in sidebar (behind flags)
- [ ] Sidebar opens/closes on mobile
- [ ] Breadcrumbs correct on all detail pages
- [ ] Card borders/shadows consistent
- [ ] Button hierarchy consistent
- [ ] Empty states on all list pages
- [ ] Loading skeletons on all list pages
- [ ] Tab navigation works
- [ ] TypeScript: 0 errors
- [ ] All V1 routes load correctly

---

## Phase 06 — Projects Deep Commercial Workspace

### Goal
Complete the Projects area as the primary commercial object. Projects must be the hub from which all commercial data (CEs, applications, CVR, subcontracts, retention, cashflow, snagging) flows. Every project needs deep commercial intelligence.

### Commercial Reason
Projects are MeasureDeck's #1 commercial object. A commercial director navigates to a project and immediately sees: contract sum, current margin, CE pipeline, cash position, retention exposure, and programme health. This is the "single pane of glass" view that replaces 10 separate spreadsheets and justifies the monthly subscription.

### Dependencies
- Phase 03 complete (DB tables ready)
- Phase 04 complete (shared components ready)
- Phase 05 complete (UI standards set)

### Files/Areas To Inspect First
- `src/app/(app)/projects/page.tsx`
- `src/app/(app)/projects/[projectId]/page.tsx`
- `src/components/wizards/project-wizard.tsx`

### 20 Tasks

| Task ID | Task Name | Description | Files/Routes | Supabase/RLS | UI/UX | Tests | Acceptance Criteria | Status |
|---------|-----------|-------------|-------------|-------------|-------|-------|--------------------|----|
| MD-P06-T01 | Projects list: advanced filters | Add FilterDrawer to /projects list with: status, contract type (JCT/NEC4), sector, value range, margin range, date range, project manager. Wire to Supabase query with .filter() chains | src/app/(app)/projects/page.tsx | projects SELECT with filters | FilterDrawer component | Filter → list updates | Filters correctly reduce visible projects from DB | ⏳ |
| MD-P06-T02 | Projects list: view switcher | Add ViewSwitcher: Grid (default, 3-column cards), List (compact table), Map (leaflet with project pins). Wire all 3 views to same data. Map pins show project name + value on click | src/app/(app)/projects/page.tsx | projects SELECT with lat/lng | Grid/List/Map views; view state persisted | Switch views → data shown in correct format | All 3 views render; map shows project locations | ⏳ |
| MD-P06-T03 | Projects list: KPI strip | Add KPI strip above project list: Total Portfolio Value (sum of all project contract sums), Active Projects (count), Avg Margin (weighted), Total CE Pipeline (sum of CE values in progress). Queries aggregated from Supabase | src/app/(app)/projects/page.tsx | projects + change_events aggregate SELECT | 4 KPICard components | KPIs load from DB | KPI strip shows correct aggregated values | ⏳ |
| MD-P06-T04 | Projects list: sort and export | Add sort by: value (desc), start date (asc/desc), margin (desc), name (A-Z). Add "Export to CSV" button that downloads all visible projects as CSV (client-side using native CSV generation — no library needed) | src/app/(app)/projects/page.tsx | projects SELECT with ORDER BY | Sort controls; export button | Sort → reorder; Export → CSV downloads | Sort reorders correctly; CSV has all columns | ⏳ |
| MD-P06-T05 | Project wizard: contract depth | Enhance `src/components/wizards/project-wizard.tsx` with additional commercial fields: contract type (JCT SBC / NEC4 ECC / NEC4 ECS / bespoke), NEC4 options (A/B/C/D/E/F), secondary options (X7, X13, Y(UK)2), retention rate (default 5%), payment terms (default 30 days), defects liability period (default 12 months), contract administrator name and company | src/components/wizards/project-wizard.tsx | projects INSERT/UPDATE | Multi-step; commercial fields | Complete wizard → project in DB | All commercial fields saved to projects table | ⏳ |
| MD-P06-T06 | Project detail: commercial KPI strip | Add KPI strip to project detail page header: Contract Sum, Certified to Date, Paid to Date, Current Margin %, CE Pipeline Value, Retention Held. Source from Supabase aggregation across applications + change_events | src/app/(app)/projects/[projectId]/page.tsx | projects + applications + change_events | KPI strip with 6 cards | Load project → KPIs calculated | KPIs show correct aggregated values | ⏳ |
| MD-P06-T07 | Project detail: commercial tab | Add/complete Commercials tab on project detail: Contract sum analysis table (original contract, CEs, provisional sums, fluctuations, total), current CVR summary, forecast final account, risk/contingency | src/app/(app)/projects/[projectId]/page.tsx | projects + cvr_periods + final_accounts | Financial table layout | Load tab → data from DB | Commercial tab shows contract analysis with real data | ⏳ |
| MD-P06-T08 | Project detail: inline editing | Enable inline editing on key project fields: project name, status, contract type, contract sum, start/end dates, project manager, client. Click field → edit input appears → save/cancel. Each save writes to Supabase and creates audit_event | src/app/(app)/projects/[projectId]/page.tsx | projects UPDATE + audit_events INSERT | Click-to-edit pattern | Edit field → save → persists | Fields editable inline; saves persist; audit event created | ⏳ |
| MD-P06-T09 | Project detail: team tab | Complete team tab: show current team members with roles. "Add team member" → search workspace users → add with role. Remove team member with confirm. Shows: name, role, contact, date added | src/app/(app)/projects/[projectId]/page.tsx | project_members (or workspace_memberships) | Team member cards | Add member → appears in list | Team members save to DB; remove works | ⏳ |
| MD-P06-T10 | Project detail: risk register tab | Add Risk Register tab using risk_register table (from migration 003). List of risks with: description, category, likelihood, impact, risk score (L×I), status, owner, mitigation, due date. Add Risk button → inline risk creation form | src/app/(app)/projects/[projectId]/page.tsx | risk_register SELECT/INSERT | Risk table + inline form | Add risk → appears in list | Risks save to DB; risk score calculated (L×I) | ⏳ |
| MD-P06-T11 | Project detail: notes tab | Wire notes tab to real Supabase data using NotesComposer component. Create notes table (or use audit_events with type='note'). Display notes in reverse chronological order with author avatar | src/app/(app)/projects/[projectId]/page.tsx | notes or audit_events INSERT/SELECT | NotesComposer component | Create note → appears | Notes save to DB; display in thread | ⏳ |
| MD-P06-T12 | Project detail: activity tab | Wire activity tab to real audit_events data. Filter by resource_type IN ('project', 'change_event', 'application') AND resource_id linked to this project. Use AuditFeed component | src/app/(app)/projects/[projectId]/page.tsx | audit_events SELECT | AuditFeed component | Load tab → real events | Real project activity shown in feed | ⏳ |
| MD-P06-T13 | Project detail: documents tab | Complete documents tab: upload contract documents (Supabase Storage, project-media bucket). List with: filename, type, uploaded by, date, version. Download signed URL. Delete with confirm (non-legal docs only). Tag with doc type | src/app/(app)/projects/[projectId]/page.tsx | contract_documents INSERT/SELECT, Storage | File list with upload | Upload file → appears in list | Files upload to Storage; listed correctly | ⏳ |
| MD-P06-T14 | Project detail: suppliers/subcontractors tab | Add Suppliers tab: list all suppliers linked to this project with their subcontract order status, certified value, and compliance status chip. "Link supplier" button. Click supplier → /suppliers/[id] | src/app/(app)/projects/[projectId]/page.tsx | subcontract_orders + suppliers SELECT | ComplianceBadge per supplier | Load tab → linked suppliers | Linked suppliers shown with correct status badges | ⏳ |
| MD-P06-T15 | Project search across records | Add global search within project: searches across CE title, application number, supplier name, drawing number, evidence title. Renders grouped results. Uses Supabase full-text search or ILIKE queries | src/app/(app)/projects/[projectId]/page.tsx | Multiple tables ILIKE search | Search results grouped by type | Search "CE001" → finds matching CE | Search returns results from multiple entity types | ⏳ |
| MD-P06-T16 | Add HGCRA/NEC4 quick-links | Add prominent quick-action links on project detail (gated by flags): "NEC4 CE Dashboard" → /changes/nec4-dashboard?projectId=X, "HGCRA Compliance" → /projects/[id]/hgcra-dashboard, "Retention" → /projects/[id]/retention, "Cashflow" → /projects/[id]/cashflow | src/app/(app)/projects/[projectId]/page.tsx | None (navigation only) | Quick action buttons below KPI strip | Click → navigate | Links navigate to correct routes (flag-gated) | ⏳ |
| MD-P06-T17 | Projects mobile card layout | At 375px, replace project data table with MobileCardList showing: project name, contract sum, margin %, status chip, CE count. Cards stack vertically with tap-to-expand details | src/app/(app)/projects/page.tsx | projects SELECT | MobileCardList component | 375px viewport → cards | Card list renders correctly on mobile | ⏳ |
| MD-P06-T18 | Project deep search and saved views | Add SavedViews component to project list. Pre-built saved views: "Active by Value", "Low Margin Projects", "Projects Due This Month", "NEC4 Projects". User can create custom saved views | src/app/(app)/projects/page.tsx | Optional: saved_views table | SavedViews chip row | Select saved view → filters apply | Saved views apply correct filters | ⏳ |
| MD-P06-T19 | TypeScript check after P06 | Run `npx tsc --noEmit` — confirm 0 errors after all project page enhancements | All modified project files | None | None | 0 TS errors | TypeScript: 0 errors | ⏳ |
| MD-P06-T20 | Projects regression test | Test all project-related routes: /projects, /projects/[id] (all tabs), /projects/[id]/edit. Confirm all tabs have real data, all buttons work, mobile layout correct | All /projects/* routes | None | All tabs render with data | Full browser test of projects area | All project routes function; no dead buttons; mobile correct | ⏳ |

### Phase Release Gate
- [ ] Projects list: filters, sort, export, 3 views working
- [ ] Project KPI strip shows aggregated real data
- [ ] Project inline editing saves to Supabase
- [ ] Project notes creates DB record
- [ ] Project activity shows real audit_events
- [ ] Project documents uploads to Storage
- [ ] TypeScript: 0 errors
- [ ] Mobile: project cards at 375px

---

## Phase 07 — NEC4 CE Engine And Change Events

### Goal
Build the #1 commercial moat feature: the NEC4 Compensation Event Quotation Clock and Workflow Engine. Full clause 60/61/62/63/64 state machine with automated statutory deadlines, deemed acceptance detection, and quotation builder.

### Commercial Reason
No competitor has NEC4-native CE workflow with automated clause compliance. This is the single biggest pricing lever — justifying £180+/user/month for the Enterprise tier. On a £50M NEC project, a missed CE notification can mean £500K–£2M lost entitlement. QS teams will pay premium prices for a tool that prevents this.

### Dependencies
- Phase 03 complete (ce_workflow_states table exists)
- Phase 04 complete (VerticalStepper, CountdownClock, StatusPill available)
- Phase 06 complete (projects area solid)
- Feature flag: nec4_ce_engine

### Files/Areas To Inspect First
- `src/app/(app)/changes/page.tsx`
- `src/app/(app)/changes/[changeId]/page.tsx`
- `src/components/wizards/change-wizard.tsx`
- `supabase/migrations/004_nec4_workflow.sql` (ce_workflow_states table)

### 20 Tasks

| Task ID | Task Name | Description | Files/Routes | Supabase/RLS | UI/UX | Tests | Acceptance Criteria | Status |
|---------|-----------|-------------|-------------|-------------|-------|-------|--------------------|----|
| MD-P07-T01 | Create NEC4 CE state machine lib | Create `src/lib/nec4/ce-state-machine.ts`. Export: `NEC4_CE_CATEGORIES` (all 21 clause 60.1 categories with code, desc, risk party), `calculateQuotationDueDate(instructionDate, agreedWeeks?)`, `calculateAcceptanceDueDate(submissionDate)`, `calculateDeemedAcceptedDate(acceptanceDueDate)`, `isCEDeemedAccepted(workflow)`, `getCEUrgencyLevel(workflow)`, `getNextCEAction(state)` | src/lib/nec4/ce-state-machine.ts (new) | ce_workflow_states | None | Unit test all calculations | `calculateQuotationDueDate(date)` = date + 21 working days; `isCEDeemedAccepted()` returns true when acceptance window expired | ⏳ |
| MD-P07-T02 | Create NEC4 CE clause library | Create `src/lib/nec4/ce-categories.ts`. Full typed array of all NEC4 clause 60.1(1)–(21) categories plus secondary option events (X2 law changes, etc.). Each: code, description, risk_party, common_examples, notification_obligations | src/lib/nec4/ce-categories.ts (new) | None | Dropdown of 21+ clauses | TypeScript type-checks | 21 clauses exported; TypeScript union type correct | ⏳ |
| MD-P07-T03 | Enhance ChangeWizard with NEC4 steps | Extend `src/components/wizards/change-wizard.tsx` with NEC4-gated steps (only shown when project.contract_type = 'NEC4'): Step A: NEC4 clause selector (from ce-categories.ts); Step B: Notification obligation check (was notification within 8 weeks?); Step C: Auto-set quotation due date (+21 days), acceptance due date (+14 days from submission). Save to ce_workflow_states table | src/components/wizards/change-wizard.tsx | ce_workflow_states INSERT | NEC4 steps conditionally rendered | Create NEC4 CE → workflow states created | ce_workflow_states rows created on NEC4 CE creation | ⏳ |
| MD-P07-T04 | CE detail: NEC4 workflow tab | Add NEC4 Workflow tab to /changes/[id] (gated by nec4_ce_engine flag). Shows: VerticalStepper with current CE state and timestamps. CountdownClock for next deadline. Next required action highlighted. PM/Contractor role actions available. State transition buttons: "Submit Quotation", "Record PM Response", "Mark Accepted", "Flag Deemed Accepted" | src/app/(app)/changes/[changeId]/page.tsx | ce_workflow_states SELECT/INSERT | VerticalStepper + CountdownClock | Load tab → stepper renders with current state | Tab renders; state transitions save to DB | ⏳ |
| MD-P07-T05 | CE detail: deemed acceptance detection UI | On CE detail page, when `isCEDeemedAccepted()` returns true: show prominent amber/red banner: "This CE may be deemed accepted under NEC4 clause 62.6. PM assessment period expired [X days ago]. The Contractor may now submit a CE assessment under clause 64." Include timestamp of when acceptance window closed | src/app/(app)/changes/[changeId]/page.tsx | ce_workflow_states SELECT | Warning banner component | Set acceptance window to expired → banner appears | Banner appears when deemed acceptance triggered | ⏳ |
| MD-P07-T06 | CE detail: quotation builder | Add Quotation Builder section to CE workflow tab. Tabbed line-item entry: People (resource × rate × time × amount), Equipment (item × rate × time × amount), Materials (description × qty × rate × amount), Subcontract (description × amount), Risk Allowance (description × %). Auto-totals. Fee percentage applied to total. Saves to a CE quotation table or JSONB column | src/app/(app)/changes/[changeId]/page.tsx | change_events UPDATE (quotation JSONB) | Line item table with add/remove rows | Enter line items → total calculates | Quotation saved to DB; totals correct | ⏳ |
| MD-P07-T07 | CE detail: programme impact fields | Add Programme Impact fields to CE detail (NEC4-gated): "Delay to planned Completion (days)", "Terminal float consumed (days)", "EOT granted (days)", "Impact on key dates". Save to change_events table columns added in migration 004 | src/app/(app)/changes/[changeId]/page.tsx | change_events UPDATE (new columns) | Numeric inputs; calculated EOT display | Enter delay days → EOT calculated | Programme impact fields save to DB | ⏳ |
| MD-P07-T08 | CE detail: NEC4 clause display | On CE detail header/summary, show: NEC4 clause reference chip (e.g. "60.1(1)"), risk party badge (Employer/Contractor), notification date, and whether notification was timely or late (with warning if late | src/app/(app)/changes/[changeId]/page.tsx | change_events.nec4_clause SELECT | Status chips; notification timeliness warning | Load CE with clause set → chip displays | Clause chip and risk party badge display correctly | ⏳ |
| MD-P07-T09 | CE narrative auto-generator hook | Add "Generate CE Narrative" button on CE detail (gated by ai_ce_identifier flag). Calls existing AI copilot API with CE data as context. Returns structured narrative draft with: event description, entitlement basis, programme impact, cost summary. User reviews and edits before use | src/app/(app)/changes/[changeId]/page.tsx, src/app/api/ai/chat/route.ts | change_events SELECT for context | "Generate" button → textarea with draft | Click → draft narrative appears | AI returns CE narrative draft based on CE data | ⏳ |
| MD-P07-T10 | CE list: NEC4 urgency column | Add Urgency column to /changes list page when nec4_ce_engine flag on: shows CountdownClock or "OVERDUE" badge based on getCEUrgencyLevel(). Sort by urgency. Filter: "Overdue only", "Due this week" | src/changes/page.tsx | change_events + ce_workflow_states JOIN | Urgency badge per row | Load list → urgency shown | Urgency badges correct per CE state | ⏳ |
| MD-P07-T11 | CE list: clause filter | Add NEC4 clause filter to CE list: dropdown of 21 clauses. Multi-select. Filters Supabase query by change_events.nec4_clause IN selected | src/app/(app)/changes/page.tsx | change_events.nec4_clause filter | Clause multi-select dropdown | Filter by clause → list reduces | Clause filter works | ⏳ |
| MD-P07-T12 | CE NEC4 Dashboard page | Create /changes/nec4-dashboard page (new, gated by flag). Three-panel layout: OVERDUE (red) - CEs past deadline, DUE THIS WEEK (amber) - CEs with deadline ≤ 7 days, ON TRACK (green). KPI strip: total CEs, total CE value, at-risk count, avg resolution days | src/app/(app)/changes/nec4-dashboard/page.tsx (new) | ce_workflow_states + change_events | Three-panel layout | Load page → panels populated | All three panels show correct CEs | ⏳ |
| MD-P07-T13 | NEC4 nightly deadline cron | Create Supabase Edge Function `ce-deadline-monitor`. Queries all ce_workflow_states where acceptance_due_date < now() AND state = 'quotation_submitted'. Creates notification record for workspace QS lead. Marks state as potential deemed_accepted. Schedule: nightly 02:00 UTC | supabase/functions/ce-deadline-monitor/ (new) | ce_workflow_states SELECT; notifications INSERT | None | Manual invoke test | Edge function creates notifications for overdue CEs | ⏳ |
| MD-P07-T14 | CE in-app notification on deemed acceptance | When ce-deadline-monitor flags a CE, notification appears in bell icon with type 'ce_deemed_acceptance_risk', title "CE [ref] may be deemed accepted", body "PM response was due [date]. Review immediately.", action_url pointing to CE detail | src/lib/notifications.ts, ce-deadline-monitor edge function | notifications INSERT | Bell icon badge increments | Trigger cron → notification appears | In-app notification created and visible in bell dropdown | ⏳ |
| MD-P07-T15 | CE audit trail | Every CE state transition must create an audit_events record: action='ce_state_changed', old_values={state: old_state}, new_values={state: new_state, timestamp: now}. Use createAuditEvent() helper from src/lib/audit.ts | src/app/(app)/changes/[changeId]/page.tsx | audit_events INSERT | Audit tab shows state changes | Transition state → audit event created | audit_events row created per state transition | ⏳ |
| MD-P07-T16 | CE document generation prep | Add "Generate CE Notification PDF" button (placeholder hook for P09 PDF work). Opens modal with CE data preview. For now, export CE data as formatted HTML print page. Full PDF implementation in P09 | src/app/(app)/changes/[changeId]/page.tsx | change_events SELECT | Modal with printable view | Click → modal opens with CE data | Modal shows correct CE data for notification | ⏳ |
| MD-P07-T17 | CE export to Excel | Add "Export CE Register" button on /changes page. Exports all filtered CEs as CSV with columns: reference, title, clause, status, value, quotation due, acceptance due, programme impact, notes | src/app/(app)/changes/page.tsx | change_events SELECT | Export button | Export → CSV downloads | CSV contains all columns with correct data | ⏳ |
| MD-P07-T18 | CE mobile card layout | At 375px, /changes list shows MobileCardList instead of wide table. CE card: reference, title, status chip, urgency badge, CE value, quotation due date. Tap → navigates to CE detail | src/app/(app)/changes/page.tsx | None | MobileCardList | 375px viewport → card list | Cards render correctly on mobile | ⏳ |
| MD-P07-T19 | TypeScript check after P07 | Run `npx tsc --noEmit`. Confirm 0 errors for all new NEC4 lib files and CE page enhancements | All P07 files | None | None | 0 TS errors | TypeScript: 0 errors | ⏳ |
| MD-P07-T20 | NEC4 CE regression and V1 regression | Test: create NEC4 CE via wizard → workflow states created → dashboard shows CE → nightly cron flags overdue. Also test V1 regression: /home, /projects, /applications still work | /changes/*, /changes/nec4-dashboard | None | Full flow test | Complete CE lifecycle in browser | Full NEC4 CE lifecycle works; V1 unaffected | ⏳ |

### Phase Release Gate
- [ ] ce-state-machine.ts: quotation due date = instruction + 21 working days
- [ ] ce-state-machine.ts: deemed acceptance correctly detected
- [ ] CE workflow tab renders VerticalStepper with correct state
- [ ] Deemed acceptance banner appears when acceptance window expired
- [ ] Quotation builder saves to DB
- [ ] NEC4 dashboard shows overdue/due-this-week/on-track
- [ ] ce-deadline-monitor edge function creates notifications
- [ ] TypeScript: 0 errors

---

## Phase 08 — Early Warnings And Programme Notifications

### Goal
Build the Early Warning Register (NEC4 clause 15) and Programme Notification system (NEC4 clause 32). These are the proactive risk management tools that prevent CEs occurring and manage the programme baseline used for all CE assessments.

### Commercial Reason
EWs that are properly tracked and converted to CEs often contain the most valuable entitlement. An EW that is missed or not linked to a CE means lost money. Programme management is equally critical — the accepted programme baseline determines EOT entitlement on all CEs. Competitors have partial EW modules but none have the EW→CE conversion flow or the clause 32 cycle tracker.

### Dependencies
- Phase 03 complete (early_warnings, programme_notifications tables exist)
- Phase 04 complete (RiskMatrix, VerticalStepper components ready)
- Phase 07 complete (CE infrastructure for EW→CE conversion)

### Files/Areas To Inspect First
- `supabase/migrations/004_nec4_workflow.sql` (early_warnings, programme_notifications)
- `src/app/(app)/changes/page.tsx` (reference for CE list pattern)
- `src/lib/nec4/ce-state-machine.ts` (for EW→CE conversion logic)

### 20 Tasks

| Task ID | Task Name | Description | Files/Routes | Supabase/RLS | UI/UX | Tests | Acceptance Criteria | Status |
|---------|-----------|-------------|-------------|-------------|-------|-------|--------------------|----|
| MD-P08-T01 | Create /early-warnings list page | New page at /early-warnings. Table: EW number, title, project, risk owner, cost impact, programme impact (days), status chip, linked CE (if converted). KPI strip: open EWs, total cost risk, converted to CE this month. Filter by: status, owner, project, date, impact | src/app/(app)/early-warnings/page.tsx (new) | early_warnings SELECT (workspace-scoped) | Table + KPI strip | Load page → real EWs | EWR list renders with real data from DB | ⏳ |
| MD-P08-T02 | Create EWR wizard | Create `src/components/wizards/ewr-wizard.tsx`. 3 steps: (1) Risk Details: EW number (auto-gen), title, description, project, risk category; (2) Impact Assessment: cost impact £, programme impact days, likelihood (1-5), impact (1-5), risk score calculated; (3) Notify & Assign: risk owner, mitigation actions, notify PM checkbox. Save to early_warnings | src/components/wizards/ewr-wizard.tsx (new) | early_warnings INSERT + audit_events | 3-step wizard | Complete wizard → EW in DB | EW record created in DB with all fields | ⏳ |
| MD-P08-T03 | Create /early-warnings/[id] detail page | New detail page with 5 tabs: Details (all EW fields, editable), Mitigation Actions (action table with owner/due date), Risk Reduction Meetings (schedule + minutes upload), Linked CE (show CE if converted), Audit (audit_events feed). Premium header with EW number, title, status pill, risk score | src/app/(app)/early-warnings/[ewId]/page.tsx (new) | early_warnings SELECT, meetings and actions via JSONB or linked tables | 5-tab layout | All 5 tabs render | All tabs render with data from DB | ⏳ |
| MD-P08-T04 | EWR: Risk matrix quadrant on list | Add RiskMatrix component to /early-warnings page. Plots all open EWs by likelihood × impact. Click dot → sidebar shows EW details. Helps commercial director see cluster of risks at a glance | src/app/(app)/early-warnings/page.tsx | early_warnings SELECT (likelihood, impact) | RiskMatrix component | EWs plotted on matrix | Risk matrix renders; EWs in correct cells | ⏳ |
| MD-P08-T05 | EWR: Convert EW to CE | Add "Convert to CE" action button on EW detail page. On click: opens ChangeWizard pre-filled with EW title and description. On wizard completion: CE created, early_warnings.linked_ce_id updated, early_warnings.status = 'converted_to_ce'. Bidirectional link: CE shows linked EW | src/app/(app)/early-warnings/[ewId]/page.tsx | early_warnings UPDATE (linked_ce_id, status), change_events INSERT | Button → wizard → success | Convert EW → CE created and linked | EW status = converted_to_ce; CE has early_warning_id reference | ⏳ |
| MD-P08-T06 | EWR: Risk reduction meeting scheduler | On EW detail "Meetings" tab: calendar date picker + attendees multi-select + add agenda items. Save meeting to DB (JSONB on early_warnings or linked table). After meeting: add minutes (text area) and action items | src/app/(app)/early-warnings/[ewId]/page.tsx | early_warnings.risk_reduction_meeting_date UPDATE | Meeting form | Schedule meeting → saved | Meeting date and attendees save to DB | ⏳ |
| MD-P08-T07 | EWR: Sidebar add to changes page | Add "Early Warnings" link card on /changes page (NEC4 flag gated): "X open Early Warnings — X related to active CEs". Links to /early-warnings. Shows users the EWR is related to CEs | src/app/(app)/changes/page.tsx | early_warnings count SELECT | Info card | Load changes page → EW count shown | EW count displays; link navigates | ⏳ |
| MD-P08-T08 | Create /programmes list page | New page at /programmes. Table of programme revisions: revision letter, submitted date, due date, PM acceptance status, is_accepted_baseline chip. KPI strip: current accepted baseline, next submission due, days until next due | src/app/(app)/programmes/page.tsx (new) | programme_notifications SELECT (workspace-scoped) | Table + KPI strip | Load page → revisions listed | Programme submissions listed with acceptance status | ⏳ |
| MD-P08-T09 | Create Programme submission wizard | Create `src/components/wizards/programme-wizard.tsx`. 3 steps: (1) Revision: revision letter, submission date, programme file upload; (2) Baseline: mark as revised baseline, link to accepted baseline; (3) Notify: notify PM via in-app notification. Save to programme_notifications | src/components/wizards/programme-wizard.tsx (new) | programme_notifications INSERT, Storage upload | 3-step wizard | Complete wizard → programme in DB | Programme submission record created; file uploaded | ⏳ |
| MD-P08-T10 | Programme: PM response recording | On /programmes list, for each submitted programme: "Record PM Response" button. Modal: PM response dropdown (accepted/not_accepted/awaiting), if not_accepted: rejection reasons text. Save to programme_notifications. Trigger notification to project team on acceptance | src/app/(app)/programmes/page.tsx | programme_notifications UPDATE | Modal form | Record response → updates status | PM response saves; status chip updates | ⏳ |
| MD-P08-T11 | Programme: accepted baseline registry | Filter programmes list to show only accepted baselines. Mark one as "CE Assessment Baseline" (the one used for current CE quotation calculations). Link to NEC4 CE engine so quotation builder references this baseline | src/app/(app)/programmes/page.tsx | programme_notifications.is_accepted_baseline UPDATE | Baseline badge | Mark baseline → flag set | One programme marked as CE assessment baseline | ⏳ |
| MD-P08-T12 | Programme: clause 32 cycle tracker | Calculate next programme submission due date: 8 weeks from last submitted revision (or project start if none). Display countdown: "Next programme due in X days". Alert notification when 14 days to due date. Overdue flag when past due date | src/app/(app)/programmes/page.tsx | programme_notifications SELECT latest | CountdownClock component | Countdown shows days to next due date | Countdown calculates correctly from last submission | ⏳ |
| MD-P08-T13 | Programme: float analysis | On programme detail: show float analysis for the submitted programme: total float remaining vs original baseline, terminal float (float beyond Completion date), trend: recovering or deteriorating. Simple manual input fields (not full P18 Asta integration yet — that's later) | src/app/(app)/programmes/[notificationId]/page.tsx (new) | programme_notifications JSONB | Float analysis table | Enter float values → display | Float analysis fields save to DB | ⏳ |
| MD-P08-T14 | Add EWR sidebar widget on project detail | On project detail page, add widget: "Early Warnings" — shows count of open EWs, highest risk score, "View EWR" link, "Add EW" button. This makes EWs visible from the project context | src/app/(app)/projects/[projectId]/page.tsx | early_warnings count SELECT WHERE project_id | Widget card | Load project → EW widget shows | EW count and risk score shown on project | ⏳ |
| MD-P08-T15 | EWR nightly risk monitor | Create notification trigger: if any EW has status='open' AND risk_reduction_meeting_date is overdue (past today) AND no mitigation actions completed → create in-app notification: "EW [ref] has no mitigation actions and overdue meeting" | src/lib/notifications.ts | early_warnings SELECT, notifications INSERT | None | Manual trigger test | Notification created for at-risk EWs | ⏳ |
| MD-P08-T16 | EWR mobile card layout | At 375px, /early-warnings shows MobileCardList. EW card: EW number, title, risk score badge (colour coded), status chip, cost impact, programme impact. Tap → EW detail | src/app/(app)/early-warnings/page.tsx | None | MobileCardList | 375px → card list | Cards render on mobile | ⏳ |
| MD-P08-T17 | EWR export | "Export EWR" button on /early-warnings. Downloads CSV: EW#, title, project, clause, cost risk, programme risk, status, linked CE, mitigation actions | src/app/(app)/early-warnings/page.tsx | early_warnings SELECT | Export button | Export → CSV | CSV correct | ⏳ |
| MD-P08-T18 | EWR and Programme audit trail | Every EW status change and programme submission must create audit_events record. Use createAuditEvent() helper | All EWR and programme mutations | audit_events INSERT | None | State change → audit event | Audit events created for all EWR/programme actions | ⏳ |
| MD-P08-T19 | TypeScript check after P08 | Run `npx tsc --noEmit` — confirm 0 errors | All P08 new files | None | None | 0 TS errors | TypeScript: 0 errors | ⏳ |
| MD-P08-T20 | P08 regression test | Test full EWR lifecycle: create EW → add to risk matrix → schedule meeting → convert to CE. Test programme submission → PM response → baseline marking. Test V1 regression | All /early-warnings/*, /programmes/* routes | None | Full lifecycle test | All flows complete successfully | EWR and programme workflows function end-to-end | ⏳ |

### Phase Release Gate
- [ ] /early-warnings list renders with real data
- [ ] EWR wizard creates DB record
- [ ] EW detail: all 5 tabs render
- [ ] Convert EW to CE: creates CE and bidirectional link
- [ ] /programmes list renders with acceptance status
- [ ] Programme clause 32 cycle: next due date calculated correctly
- [ ] Accepted baseline flagged correctly
- [ ] TypeScript: 0 errors

---

## Phase 09 — HGCRA Payment Compliance Suite

### Goal
Build the statutory UK payment compliance engine: Pay Less Notice workflow, Right to Suspend (S112), HGCRA compliance dashboard, and immutable legal document PDF generation. This makes MeasureDeck the definitive HGCRA compliance tool — a claim no competitor can make.

### Commercial Reason
Every UK construction contract is governed by HGCRA 1996. Missing a PLN window or failing to issue a payment notice can cost a main contractor the full notified sum — regardless of whether it's actually owed. For a contractor paying 50 subcontractors, this is a major compliance risk. MeasureDeck positioning as "HGCRA compliance engine" opens doors to risk-averse enterprise clients and legal/compliance departments.

### Dependencies
- Phase 03 complete (pay_less_notices, suspension_notices tables; legal-notices storage bucket)
- Phase 04 complete (@react-pdf/renderer installed; PDF base template)
- Phase 06 complete (applications area)
- Feature flag: hgcra_suite

### Files/Areas To Inspect First
- `src/app/(app)/applications/[applicationId]/page.tsx`
- `supabase/migrations/005_hgcra_compliance.sql`
- `src/lib/pdf-templates/base-template.tsx`

### 20 Tasks

| Task ID | Task Name | Description | Files/Routes | Supabase/RLS | UI/UX | Tests | Acceptance Criteria | Status |
|---------|-----------|-------------|-------------|-------------|-------|-------|--------------------|----|
| MD-P09-T01 | Create payment timeline engine | Create `src/lib/hgcra/payment-timeline.ts`. Export `calculatePaymentTimeline(params: { applicationDate, contractType, paymentTermsDays, prescribedPeriodDays })`. Returns: paymentNoticeDueDate, finalDateForPayment, payLessNoticeCutoff, daysToFinalPayment, daysToPLNCutoff, isPaymentNoticeOverdue, isPLNWindowClosed, isPaymentOverdue. JCT and NEC4 logic differ (Y(UK)2) | src/lib/hgcra/payment-timeline.ts (new) | None | None | Unit test: JCT 30-day terms, 7-day PLN cutoff → correct dates | calculatePaymentTimeline returns correct dates for JCT and NEC4 | ⏳ |
| MD-P09-T02 | Add HGCRA timeline to application detail | On /applications/[id], add HGCRA Timeline section (hgcra_suite flag gated). Visual VerticalStepper showing: [Application Received] → [Payment Notice Due: date] → [PLN Cutoff: date] → [Final Date for Payment: date]. Steps coloured by overdue status. Pulls from applications.payment_notice_due_date, final_date_for_payment | src/app/(app)/applications/[applicationId]/page.tsx | applications SELECT (new HGCRA columns) | VerticalStepper | Load application → timeline shows | HGCRA timeline shows with correct dates | ⏳ |
| MD-P09-T03 | Create Pay Less Notice page | New page at /applications/[applicationId]/pay-less-notice (gated by hgcra_suite). Shows: timeline panel with PLN cutoff countdown, PLN form with grounds for withholding (multiple items with individual amounts), validation (warns if PLN cutoff passed), "Generate PLN PDF" button | src/app/(app)/applications/[applicationId]/pay-less-notice/page.tsx (new) | pay_less_notices INSERT | Timeline + form layout | Fill form → save → PLN created | PLN record saved to DB; PDF generated | ⏳ |
| MD-P09-T04 | Create PLN PDF generator | Create `src/lib/pdf-templates/pay-less-notice.tsx` using @react-pdf/renderer. Template includes: workspace letterhead, To/From parties, contract reference, date, "IN ACCORDANCE WITH THE HOUSING GRANTS, CONSTRUCTION AND REGENERATION ACT 1996 AS AMENDED (Section 111)", notified sum, withheld amount (itemised), grounds for withholding, amount to be paid, MeasureDeck audit UUID footer | src/lib/pdf-templates/pay-less-notice.tsx (new) | Storage: legal-notices bucket | PDF with legal language | Generate PDF → opens/downloads | PDF generates with all required fields; audit UUID present | ⏳ |
| MD-P09-T05 | PLN: immutability on issue | When PLN is marked "issued": (1) Upload PDF to legal-notices Supabase Storage (immutable bucket), (2) Update pay_less_notices.status = 'issued', (3) Update pay_less_notices.issued_at = now(), (4) Lock form — no further edits allowed. Amendments create new PLN. Show immutability badge | src/app/(app)/applications/[applicationId]/pay-less-notice/page.tsx | pay_less_notices UPDATE (issued_at, pdf_url), Storage upload | Locked UI after issue | Issue PLN → form locked; PDF stored | PLN becomes immutable; PDF in Storage; form locked | ⏳ |
| MD-P09-T06 | PLN: compliance check warning | Before allowing PLN form submit: call `calculatePaymentTimeline()`. If `isPLNWindowClosed === true`: show red warning banner: "Warning: The PLN prescribed period has closed. Issuing a PLN now may not be legally effective under HGCRA S111(3). The Contractor may be entitled to the full notified sum. Consult your contract terms before proceeding." | src/app/(app)/applications/[applicationId]/pay-less-notice/page.tsx | applications.final_date_for_payment | Warning banner | PLN cutoff passed → banner shows | Banner appears when PLN window is closed | ⏳ |
| MD-P09-T07 | PLN: acknowledgement tracking | After PLN is issued: "Record Acknowledgement" section. When client confirms receipt: update pay_less_notices.received_confirmation_at. Show: "Issued [date] — Awaiting acknowledgement" or "Acknowledged [date]" | src/app/(app)/applications/[applicationId]/pay-less-notice/page.tsx | pay_less_notices UPDATE | Status indicator | Record ack → status updates | Acknowledgement date saved; status updated | ⏳ |
| MD-P09-T08 | Create Right to Suspend (S112) page | New page at /applications/[applicationId]/suspension-notice. Show S112 eligibility check: "Payment of £X was due on [date]. No valid PLN was issued before [cutoff date]. Statutory right to suspend exists under HGCRA 1996 S112." Suspension notice form: 7-day notice period, grounds. Generate suspension notice PDF | src/app/(app)/applications/[applicationId]/suspension-notice/page.tsx (new) | suspension_notices INSERT, applications SELECT | Eligibility check banner + form | Overdue application → eligibility shown | S112 eligibility correctly determined; notice form works | ⏳ |
| MD-P09-T09 | Create suspension notice PDF | Create `src/lib/pdf-templates/suspension-notice.tsx`. Template: parties, contract ref, application ref, ground for suspension ("You have failed to pay £X by [date] without issuing a valid Pay Less Notice"), 7-day notice period, suspension effective date, note on EOT entitlement (NEC4 60.1(18)) | src/lib/pdf-templates/suspension-notice.tsx (new) | Storage: legal-notices bucket | PDF | Generate → PDF downloads | PDF generates with correct statutory content | ⏳ |
| MD-P09-T10 | S112: suspension period tracking | After suspension notice issued: track suspension period. Input: suspension_effective_at (7 days after notice). Input: suspension_lifted_at (when payment made). Auto-calculate: days_suspended = lifted - effective. Show EOT entitlement: "This suspension entitles the Contractor to an EOT of X days" | src/app/(app)/applications/[applicationId]/suspension-notice/page.tsx | suspension_notices UPDATE | Period calculator | Record lifted date → days calculated | Days suspended calculated correctly | ⏳ |
| MD-P09-T11 | S112: reinstatement notice | When payment is recorded on the application: "Issue Reinstatement Notice" prompt. Generates reinstatement notice PDF: suspension lifted effective date, thanks for payment, resumption of works. Stores in legal-notices bucket | src/lib/pdf-templates/reinstatement-notice.tsx (new) | suspension_notices UPDATE, Storage | Reinstatement notice modal | Mark payment → prompt appears | Reinstatement notice generated and stored | ⏳ |
| MD-P09-T12 | Application detail: certify and mark paid | Wire "Certify" and "Mark Paid" buttons on application detail (currently partial). Certify: opens modal, enter certified amount, date, cert reference → updates applications table. Mark Paid: enter payment date and amount → updates applications table. Both create audit_events | src/app/(app)/applications/[applicationId]/page.tsx | applications UPDATE + audit_events INSERT | Certification modal | Certify → record updated | Certification and payment recording work and create audit events | ⏳ |
| MD-P09-T13 | HGCRA project compliance dashboard | New page /projects/[id]/hgcra-dashboard (gated). Grid of all active applications for the project: application number, application date, payment notice status, PLN status, final payment date, paid status — all with traffic lights. "HGCRA Compliance Score" KPI | src/app/(app)/projects/[projectId]/hgcra-dashboard/page.tsx (new) | applications SELECT + pay_less_notices SELECT | Grid with traffic lights | Load → all applications shown | Dashboard shows all applications with correct compliance status | ⏳ |
| MD-P09-T14 | HGCRA compliance score calculation | Calculate compliance score per project: % of applications where all HGCRA steps completed on time (payment notice issued ≤ due date, PLN issued before cutoff if applicable, payment made by final date). Display as percentage + grade (A–F) | src/app/(app)/projects/[projectId]/hgcra-dashboard/page.tsx | applications + pay_less_notices SELECT | Score gauge | Load → score displayed | Score calculates correctly from application records | ⏳ |
| MD-P09-T15 | PLN and payment deadline notifications | When calculatePaymentTimeline() shows PLN cutoff < 3 days away: createNotification() with type 'pln_cutoff_approaching', urgency 'high'. When PLN cutoff passed: createNotification() with type 'pln_cutoff_passed', urgency 'critical'. Triggered by nightly cron or on page load | src/lib/notifications.ts, nightly cron | notifications INSERT | Bell icon alert | Simulate cutoff approaching → notification | In-app notification created for upcoming PLN deadlines | ⏳ |
| MD-P09-T16 | Applications list: HGCRA status column | Add HGCRA Status column to /applications list (hgcra_suite flag gated): ComplianceBadge showing: compliant, pln_required_soon, pln_overdue, payment_overdue | src/app/(app)/applications/page.tsx | applications + pay_less_notices JOIN | ComplianceBadge per row | Load list → badges shown | HGCRA badges show correct status per application | ⏳ |
| MD-P09-T17 | Applications: Send to client portal | Add "Send to Client" button on application detail (client_portal flag gated). Creates portal_access_tokens record with application view permission. Sends email with magic link via Resend. Client can view application in portal | src/app/(app)/applications/[applicationId]/page.tsx | portal_access_tokens INSERT, Edge function: send-portal-invite | "Send to Client" button + modal | Click → email sent | Portal token created; email sent | ⏳ |
| MD-P09-T18 | Applications mobile layout | At 375px, /applications list shows MobileCardList. Application card: application number, project, amount claimed, certified amount, HGCRA status badge, payment status | src/app/(app)/applications/page.tsx | None | MobileCardList | 375px → card list | Cards render correctly on mobile | ⏳ |
| MD-P09-T19 | TypeScript check after P09 | Run `npx tsc --noEmit` — confirm 0 errors for all HGCRA files | All P09 files | None | None | 0 TS errors | TypeScript: 0 errors | ⏳ |
| MD-P09-T20 | HGCRA compliance regression test | Full HGCRA flow: submit application → HGCRA timeline appears → PLN due date approaching → notification fires → issue PLN → PLN locked (immutable) → S112 if overdue → reinstatement on payment. V1 regression | All HGCRA routes | None | Full flow test | Complete HGCRA lifecycle works end-to-end | ⏳ |

### Phase Release Gate
- [ ] calculatePaymentTimeline() returns correct dates for JCT and NEC4
- [ ] PLN form saves to DB with all fields
- [ ] PLN PDF generates with statutory language
- [ ] PLN immutable once issued (form locked; PDF in Storage)
- [ ] PLN compliance warning fires when window closed
- [ ] S112 eligibility check correct
- [ ] HGCRA dashboard shows all applications with traffic lights
- [ ] PLN cutoff notifications fire
- [ ] TypeScript: 0 errors

---

## Phase 10 — CIS, HMRC And Domestic Reverse Charge

### Goal
Build the CIS compliance workflow: HMRC CIS API integration (free gov.uk service), subcontractor verification, CIS deduction calculator on payment applications, monthly CIS300 return generator, annual deduction statements, and Domestic VAT Reverse Charge indicator.

### Commercial Reason
CIS compliance is a legal requirement for all UK construction contracts. HMRC penalises incorrect CIS returns at £100–£3,000/month. Main contractors manage 20–100 subcontractors, all requiring monthly CIS deduction recording and return filing. This feature replaces the contractor's CIS spreadsheet and accountant's manual work — easily justifiable as a £200/month add-on module.

### Dependencies
- Phase 03 complete (cis_records, cis_monthly_returns, cis_payment_lines tables exist)
- Phase 11 partially started (suppliers area referenced)
- Feature flag: cis_compliance
- Supabase Edge Function capability confirmed

### Files/Areas To Inspect First
- `src/app/(app)/suppliers/[supplierId]/page.tsx`
- `src/app/(app)/applications/[applicationId]/page.tsx`
- `supabase/migrations/006_cis_retention_subcontracts.sql`

### 20 Tasks

| Task ID | Task Name | Description | Files/Routes | Supabase/RLS | UI/UX | Tests | Acceptance Criteria | Status |
|---------|-----------|-------------|-------------|-------------|-------|-------|--------------------|----|
| MD-P10-T01 | HMRC credential settings in workspace | Add HMRC credentials section to /workspace/settings (cis_compliance flag gated): Tax Office Number, Tax Office Reference, HMRC Client ID, HMRC Client Secret, Environment selector (sandbox/production). Fields masked for display. Save encrypted to workspace_settings JSONB | src/app/(app)/workspace/settings/page.tsx | workspaces UPDATE (settings JSONB, encrypted) | Masked inputs; environment toggle | Save creds → stored encrypted | HMRC credentials saved and never returned to client in plaintext | ⏳ |
| MD-P10-T02 | Create HMRC CIS Edge Function | Create Supabase Edge Function at supabase/functions/hmrc-cis-proxy/. Two endpoints: /verify (POST: UTR + company name → returns CIS status from HMRC) and /submit-return (POST: XML payload → submits CIS300 to HMRC). Function reads HMRC credentials from workspace_settings (server-side only). Use HMRC sandbox URLs in development | supabase/functions/hmrc-cis-proxy/index.ts (new) | Service role to read workspace_settings | None | Edge function invoke test (sandbox) | Edge function returns CIS status from HMRC sandbox | ⏳ |
| MD-P10-T03 | Create HMRC CIS client lib | Create `src/lib/hmrc/cis-client.ts`. Export: `verifyCISSubcontractor(workspaceId, utr, companyName)` — calls hmrc-cis-proxy edge function, returns { status, verificationNumber, verificationDate }. `submitCISReturn(workspaceId, returnXML)` — submits CIS300. Both functions are server-side only (called from API routes or edge functions) | src/lib/hmrc/cis-client.ts (new) | Edge function via fetch | None | Mock API test | cis-client correctly calls edge function and returns parsed result | ⏳ |
| MD-P10-T04 | Supplier: CIS verification tab | Add CIS Verification tab to /suppliers/[id] (cis_compliance flag gated). Shows: current CIS status chip, UTR field, verification date, expiry warning, re-verify button. "Verify Now" button calls verifyCISSubcontractor() and saves result to cis_records table | src/app/(app)/suppliers/[supplierId]/page.tsx | cis_records INSERT/UPDATE | ComplianceBadge (gross/net/higher/unmatched) | Click verify → HMRC response → status updated | CIS status saved to cis_records; badge shows correct status | ⏳ |
| MD-P10-T05 | Supplier: bulk CIS verification | On /suppliers list: checkbox multi-select → "Verify CIS Status" bulk action. Queues all selected suppliers through verifyCISSubcontractor() sequentially (rate-limited to 1 per second). Shows progress bar. Updates all cis_records | src/app/(app)/suppliers/page.tsx | cis_records INSERT/UPDATE | Progress bar; bulk selection | Select 5 suppliers → bulk verify → all updated | All selected suppliers' CIS status updated | ⏳ |
| MD-P10-T06 | CIS: deduction calculator | Create `src/lib/cis/deduction-calculator.ts`. Export: `calculateCISDeduction({ grossPayment, materialsCost, cisStatus })` → returns { labourAmount, deductionRate, deductionAmount, netPayment, isDRC }. Deduction rates: gross=0%, net=20%, higher_rate=30%, unmatched=30%. DRC flag: if supplier is VAT registered and services are specified supplies | src/lib/cis/deduction-calculator.ts (new) | None | None | Unit test: net status, £45,000 gross, £12,000 materials → 20% × £33,000 = £6,600 deduction | Calculator returns correct values for all CIS statuses | ⏳ |
| MD-P10-T07 | Application detail: CIS section | On /applications/[id], add CIS Calculation section (cis_compliance flag gated, only shown when application.supplier has cis_records). Shows: Gross Payment, Less Materials Cost, Labour Amount, CIS Deduction Rate %, CIS Deduction Amount, Net Payment to Sub. "CIS to HMRC" amount highlighted. Materials cost editable field | src/app/(app)/applications/[applicationId]/page.tsx | cis_records SELECT, applications UPDATE | CIS breakdown table | Load application with CIS supplier → CIS section shows | CIS deduction calculated and displayed correctly | ⏳ |
| MD-P10-T08 | Application: DRC indicator | When CIS calculation identifies a VAT-registered supplier providing "specified supplies": show "VAT: £0 (Domestic Reverse Charge applies — Recipient to account for VAT under SI 2019/705). Do not pay VAT to the subcontractor." | src/app/(app)/applications/[applicationId]/page.tsx | cis_records.vat_registered SELECT | DRC info banner | VAT-registered subcontractor → DRC banner | DRC indicator appears for eligible suppliers | ⏳ |
| MD-P10-T09 | Create /cis monthly return page | New page at /cis (list of months). Click month → /cis/monthly-return/[month]. Monthly return page: auto-populated table of all payment applications to CIS subcontractors in tax month. Columns: UTR, name, gross payment, materials, labour, deduction rate, deduction amount, net payment | src/app/(app)/cis/page.tsx (new), src/app/(app)/cis/monthly-return/[month]/page.tsx (new) | cis_monthly_returns + cis_payment_lines SELECT | Month table + payment lines table | Load month → populated from payments | Return page shows all CIS payments for tax month | ⏳ |
| MD-P10-T10 | CIS: create payment lines | When an application is marked as paid AND supplier has CIS record: auto-create cis_payment_line record linking the payment to the current open tax month's return. Tax month = payment date's CIS month (19th of month to 18th following month) | src/app/(app)/applications/[applicationId]/page.tsx | cis_payment_lines INSERT, cis_monthly_returns find/create | None | Mark application paid → cis_payment_line created | CIS payment line auto-created on payment | ⏳ |
| MD-P10-T11 | CIS300 XML generator | Create `src/lib/cis/cis300-xml.ts`. Export `generateCIS300XML(return: CISMonthlyReturn, lines: CISPaymentLine[])` — produces HMRC CIS300-compatible XML. Validates: all UTRs present, deduction rates valid, total deductions sum correctly | src/lib/cis/cis300-xml.ts (new) | cis_monthly_returns + cis_payment_lines SELECT | None | Unit test: known input → correct XML structure | XML generator produces valid CIS300 structure | ⏳ |
| MD-P10-T12 | CIS: review and submit return | On /cis/monthly-return/[month]: "Review" step shows validation warnings. "Generate XML" button creates CIS300 XML and shows preview. "Submit to HMRC" button calls submitCISReturn() via edge function. On success: stores submission reference, marks return as submitted | src/app/(app)/cis/monthly-return/[month]/page.tsx | cis_monthly_returns UPDATE (status, hmrc_ref, submitted_at, xml_payload) | Submit button + validation | Submit → HMRC response → status updated | Return submitted to HMRC sandbox; reference stored | ⏳ |
| MD-P10-T13 | CIS: return history | /cis page shows history table: Tax Month, Total Payments, Total Deductions, Status (draft/submitted/accepted), Submission Date, HMRC Reference. Click month → detail page | src/app/(app)/cis/page.tsx | cis_monthly_returns SELECT | History table | Load page → history shown | Return history renders with correct data | ⏳ |
| MD-P10-T14 | CIS: annual deduction statements | Add "Generate Annual Statements" button (shows after 5 April for the completed tax year). For each subcontractor: generates PDF deduction statement showing all payments and deductions for the year. Sends PDF to subcontractor's email via Resend | src/app/(app)/cis/page.tsx, src/lib/pdf-templates/cis-deduction-statement.tsx (new) | cis_payment_lines SELECT by year, Resend email | PDF generation + email send | Generate statements → PDFs sent | PDFs generated per subcontractor; emails sent via Resend | ⏳ |
| MD-P10-T15 | CIS: monthly return reminder | Nightly cron or webhook: on 1st of each month, create in-app notification for workspace admin: "CIS Monthly Return for [month] is due by 19 [month]. You have X payments to declare." Uses createNotification() helper | src/lib/notifications.ts + cron | notifications INSERT | Bell icon | 1st of month → notification | Notification created on 1st of month | ⏳ |
| MD-P10-T16 | CIS: HMRC failure handling | When HMRC CIS API call fails (network error, HMRC outage, invalid credentials): show error state with: error message, "Retry" button, "Manual Entry" option (allows entering CIS status manually with note "Status set manually — verification pending") | src/app/(app)/suppliers/[supplierId]/page.tsx, cis-client.ts | cis_records INSERT (manual status) | Error state + manual fallback | Simulate API failure → fallback shown | Manual fallback works; status flagged as unverified | ⏳ |
| MD-P10-T17 | CIS: Companies House link on verification | When verifying CIS, also check Companies House for the same company. If company is dissolved or in administration: show warning alongside CIS status. Uses companies-house-search edge function (built in P11) | src/app/(app)/suppliers/[supplierId]/page.tsx | cis_records + CH API | Warning banner | Dissolved company → warning | CH status warning shown alongside CIS status | ⏳ |
| MD-P10-T18 | CIS: supplier CIS expiry tracking | cis_records.verification_expires_at tracking. 30 days before expiry: createNotification() with type 'cis_verification_expiring'. On expiry: ComplianceBadge changes to 'expired'. Weekly check via cron | compliance-check cron / nightly | notifications INSERT, cis_records SELECT | Expiry badge | Set verification to expire tomorrow → notification | Notification created; badge changes on expiry | ⏳ |
| MD-P10-T19 | TypeScript check after P10 | Run `npx tsc --noEmit` — confirm 0 errors for all CIS files | All P10 files | None | None | 0 TS errors | TypeScript: 0 errors | ⏳ |
| MD-P10-T20 | CIS regression and V1 regression | Test CIS lifecycle: verify subcontractor → create application → mark paid → CIS line auto-created → monthly return populated → submit to sandbox. V1 regression | All /cis/* routes, applications routes | None | Full CIS flow | CIS lifecycle works end-to-end in sandbox | ⏳ |

### Phase Release Gate
- [ ] HMRC credentials stored encrypted server-side
- [ ] Edge function proxies HMRC CIS API call
- [ ] CIS verification returns gross/net/higher/unmatched (sandbox)
- [ ] CIS deduction calculation: 20% × (gross - materials)
- [ ] Payment application shows CIS section
- [ ] DRC indicator appears for VAT-registered specified supplies
- [ ] Monthly return auto-populated from payment lines
- [ ] CIS300 XML generates valid structure
- [ ] Submit to HMRC sandbox succeeds
- [ ] TypeScript: 0 errors

---

## Phase 11 — Suppliers, Subcontracts And Supply Chain KYC

### Goal
Build the complete supply chain management layer: Companies House KYC verification (free API), subcontract order management, supplier compliance document tracking (insurance, accreditations), and the new /subcontracts register.

### Commercial Reason
Main contractors are legally responsible for their supply chain under CDM 2015, CIS regulations, and their tier 1 contract terms. Companies House API is completely free. Automating KYC replaces hours of manual checking per month.

### Dependencies
- Phase 03 complete (subcontract_orders, cis_records tables exist)
- Phase 10 complete (CIS verification infrastructure)
- Feature flag: subcontract_orders, supply_chain_kyc

### 20 Tasks

| Task ID | Task Name | Description | Files/Routes | Supabase/RLS | UI/UX | Tests | Acceptance Criteria | Status |
|---------|-----------|-------------|-------------|-------------|-------|-------|--------------------|----|
| MD-P11-T01 | Companies House Edge Function | Create supabase/functions/companies-house-search/. Two endpoints: /search (company name → list of matches) and /get (company number → full data including status, officers, registered address, SIC codes). Uses Companies House Public Data API (free) | supabase/functions/companies-house-search/index.ts (new) | Service role | None | Manual invoke → correct CH data | Edge function returns correct CH data for known companies | ⏳ |
| MD-P11-T02 | Supplier: Companies House search on create | On SupplierWizard step 1: "Search Companies House" button. Typing company name → debounced call → dropdown of matches. Select company → auto-fills: legal name, company number, registered address, company type, incorporation date | src/components/wizards/supplier-wizard.tsx | suppliers UPDATE (company_number) | CH search dropdown | Search → results appear | CH data auto-populates supplier form fields | ⏳ |
| MD-P11-T03 | Supplier: KYC status tab | On /suppliers/[id], add KYC Status tab. Shows: CH live status, directors list, filing history link, last confirmation statement date, mortgages/charges count. "Refresh from CH" button. ComplianceBadge: Active=green, In Administration=amber, Dissolved=red | src/app/(app)/suppliers/[supplierId]/page.tsx | suppliers.ch_data JSONB UPDATE | KYC tab layout | Dissolved company → red badge | KYC tab shows live CH status | ⏳ |
| MD-P11-T04 | Supplier: weekly CH refresh cron | Scheduled job companies-house-refresh. Weekly Sunday 03:00 UTC. For each supplier with company_number: re-query CH. If status changed to In Administration: createNotification() urgency=critical | supabase/functions/companies-house-refresh/ + cron | suppliers UPDATE, notifications INSERT | None | Manual invoke | Notification created on CH status change | ⏳ |
| MD-P11-T05 | Supplier: insurance document tracking | Add Insurance & Compliance tab to /suppliers/[id]. Track: Public Liability, Employers Liability (£10M minimum), Professional Indemnity, CHAS/Constructionline. For each: upload certificate (Storage), expiry date, auto-expiry warning 30 days before | src/app/(app)/suppliers/[supplierId]/page.tsx | Storage + suppliers.compliance_docs JSONB | Insurance cards with upload | Upload cert → appears with expiry | Insurance documents stored; expiry warnings fire | ⏳ |
| MD-P11-T06 | Supplier: insurance expiry cron | compliance-check scheduled job. Weekly Mon 08:00 UTC. Checks suppliers.compliance_docs for expiry dates. 30 days before: notification 'insurance_expiring'. On expiry: ComplianceBadge = 'expired' | supabase/functions/compliance-check/ + cron | suppliers UPDATE, notifications INSERT | None | Test with expiry date tomorrow | Notification fires; badge changes on expiry | ⏳ |
| MD-P11-T07 | Supplier: compliance score | Calculate ComplianceScore (0–100): CIS verified (+25), CH active (+25), insurance in date (+25), ISO/CHAS (+25). Score gauge on supplier card and detail header. Sort supplier list by compliance score | src/app/(app)/suppliers/page.tsx, [supplierId]/page.tsx | suppliers.compliance_score | Score gauge | Update CIS status → score recalculates | Score updates correctly per compliance factor | ⏳ |
| MD-P11-T08 | Create /subcontracts list page | New page at /subcontracts (subcontract_orders flag gated). Table: order number, supplier, project, contract form, contract sum, certified %, status. KPI strip: total exposure, certified to date, retention held, at-risk count | src/app/(app)/subcontracts/page.tsx (new) | subcontract_orders SELECT | Table + KPI strip | Load page → real data | Subcontracts list renders with KPI strip | ⏳ |
| MD-P11-T09 | Subcontract wizard (5-step) | Create src/components/wizards/subcontract-wizard.tsx. Steps: (1) Contract: supplier, project, contract form, order number; (2) Financial: contract sum, retention rate; (3) Programme: start, completion, notice period; (4) Scope: description, CDM role, CIS status; (5) Review & Issue. audit_event on create | src/components/wizards/subcontract-wizard.tsx (new) | subcontract_orders INSERT + audit_events | 5-step wizard | Complete → subcontract in DB | Subcontract created with all fields; audit event created | ⏳ |
| MD-P11-T10 | Subcontract detail page (6 tabs) | Create /subcontracts/[id] with 6 tabs: Details (inline edit), Applications (supplier applications under this subcontract), Payments (certified/paid/CIS deductions), Retention (held/released), Documents (subcontract PDF, variations, insurance), Activity (audit_events) | src/app/(app)/subcontracts/[subcontractId]/page.tsx (new) | subcontract_orders + related tables | 6-tab layout | All 6 tabs render | All tabs render with real data | ⏳ |
| MD-P11-T11 | Subcontract: issue PDF | "Issue Subcontract" action. Generates Order Confirmation PDF: parties, order number, contract sum, scope, start/completion date, retention terms, payment terms, NEC4/JCT reference. Stores in legal-notices bucket (immutable). Status = issued | src/lib/pdf-templates/subcontract-order.tsx (new) | subcontract_orders UPDATE + Storage | PDF modal | Issue → PDF stored; status updates | Subcontract PDF generated; stored immutably | ⏳ |
| MD-P11-T12 | Subcontract: payment application linking | On /applications list: add Subcontract column. On subcontract detail Payments tab: show all applications linked to this subcontract with HGCRA compliance status | src/app/(app)/applications/page.tsx | applications.subcontract_order_id FK | Linked column | Applications show subcontract link | Bidirectional link between applications and subcontracts | ⏳ |
| MD-P11-T13 | Subcontract: NEC4 ECS clause compliance | For subcontracts with contract_form = 'NEC4_ECS': add NEC4 Compliance tab. Shows payment dates, CE and EW obligations, programme submission requirements. Mirrors NEC4 CE engine at subcontract level | src/app/(app)/subcontracts/[subcontractId]/page.tsx | subcontract_orders.contract_form | NEC4 compliance panel | NEC4 subcontract → tab shown | NEC4 compliance tab renders for NEC4 ECS subcontracts | ⏳ |
| MD-P11-T14 | Subcontract: retention ledger link | On subcontract detail Retention tab: show retention_ledger entries. Calculate: total retention held, first moiety (on PC), second moiety (DLP end). "Release First Moiety" button. Links to /projects/[id]/retention | src/app/(app)/subcontracts/[subcontractId]/page.tsx | retention_ledger SELECT WHERE subcontract_id | Retention tab | Load tab → retention values | Retention calculations correct | ⏳ |
| MD-P11-T15 | Supplier list: KYC compliance filter | ComplianceBadge column on /suppliers list. Filter: all/compliant/at_risk/expired. Sort by compliance score. "Non-compliant suppliers" saved view | src/app/(app)/suppliers/page.tsx | suppliers.compliance_score + cis_records | ComplianceBadge per row | Filter non-compliant → list reduces | Filter works; badges correct | ⏳ |
| MD-P11-T16 | CDM compliance tracking | On project detail, add CDM tab: track duty holders (Principal Contractor, Principal Designer, Contractor), F10 notification date, HSE notification number. Compliance checklist per requirement | src/app/(app)/projects/[projectId]/page.tsx | projects.cdm_data JSONB | CDM tab | Add duty holder → saves | CDM data saves to project | ⏳ |
| MD-P11-T17 | Supplier mobile cards | At 375px, /suppliers list uses MobileCardList. Supplier card: name, compliance score badge, CIS status, insurance status | src/app/(app)/suppliers/page.tsx | None | MobileCardList | 375px → cards | Mobile card list renders | ⏳ |
| MD-P11-T18 | Subcontract export | "Export Subcontract Register" button on /subcontracts. CSV: order number, supplier, project, contract form, contract sum, certified %, status, compliance score | src/app/(app)/subcontracts/page.tsx | subcontract_orders SELECT | Export button | Export → CSV | CSV correct | ⏳ |
| MD-P11-T19 | TypeScript check after P11 | `npx tsc --noEmit` — 0 errors | All P11 files | None | None | 0 TS errors | 0 errors | ⏳ |
| MD-P11-T20 | P11 regression test | Full test: create supplier → CH auto-fills → CIS verify → create subcontract → issue PDF → link application → retention shows. V1 regression | /suppliers/*, /subcontracts/* | None | Full flow | Supply chain lifecycle end-to-end | ⏳ |

### Phase Release Gate
- [ ] Companies House edge function returns live data
- [ ] Supplier CH auto-fill works in wizard
- [ ] Insurance expiry tracking and notifications working
- [ ] Supplier compliance score calculates correctly
- [ ] /subcontracts list renders with real data
- [ ] Subcontract wizard creates DB record with all fields
- [ ] Subcontract PDF stored immutably
- [ ] TypeScript: 0 errors

---

## Phase 12 — Retention, Cashflow, EVM And CVR Enhancement

### Goal
Build the financial intelligence layer: retention ledger with automated release tracking, cashflow S-curve forecasting, Earned Value Management dashboard, enhanced CVR with margin bridge analysis, and NEC4 target cost module (Options C/D).

### Dependencies
- Phase 03 (retention_ledger, cashflow_forecasts tables)
- Phase 04 (SCurveChart, KPICard components)
- Feature flags: retention_module, cashflow_forecasting, evm_dashboard

### 20 Tasks

| Task ID | Task Name | Description | Files/Routes | Supabase/RLS | UI/UX | Tests | Acceptance Criteria | Status |
|---------|-----------|-------------|-------------|-------------|-------|-------|--------------------|----|
| MD-P12-T01 | Create /projects/[id]/retention | New retention page: Retention Summary (total withheld, first/second moiety), Retention Ledger (all deductions per application), Release Schedule (timeline), Release Actions | src/app/(app)/projects/[projectId]/retention/page.tsx (new) | retention_ledger SELECT | Summary + table + timeline | Load → retention data | Page renders with correct calculations | ⏳ |
| MD-P12-T02 | Retention: auto-deduction on certification | When application is certified: auto-create retention_ledger entry with entry_type='deduction', moiety='both', amount=(certified_amount × retention_rate) | src/app/(app)/applications/[applicationId]/page.tsx | retention_ledger INSERT | None | Certify application → retention entry | Retention deducted automatically | ⏳ |
| MD-P12-T03 | Retention: first moiety release | "Release First Moiety" button (enabled after PC date set). Creates retention_ledger entry type='release', moiety='first', amount=total×50%, release_trigger='pc_issued'. Notification to finance | src/app/(app)/projects/[projectId]/retention/page.tsx | retention_ledger INSERT + notifications | Release button | Click → entry created | First moiety release entry created | ⏳ |
| MD-P12-T04 | Retention: DLP tracker and second moiety | Track DLP end date. On DLP end: createNotification(). "Release Second Moiety" enabled after DLP end. Creates final release entry | src/app/(app)/projects/[projectId]/retention/page.tsx | retention_ledger INSERT + notifications | DLP countdown | DLP end → notification → release | Second moiety release works | ⏳ |
| MD-P12-T05 | Retention cron | Weekly retention-release-check. Queries: PC set but first moiety not released → notification; DLP end this week → notification | supabase/functions/retention-check/ + cron | retention_ledger SELECT + notifications INSERT | None | Manual invoke | Notifications for upcoming releases | ⏳ |
| MD-P12-T06 | Create /projects/[id]/cashflow | Cashflow S-curve page. Month-by-month table: Planned Revenue, Planned Cost, Actual Revenue (certified), Actual Cost. SCurveChart at top. Variance column | src/app/(app)/projects/[projectId]/cashflow/page.tsx (new) | cashflow_forecasts SELECT/INSERT | SCurveChart + data table | Load → chart and table | Cashflow page renders with chart | ⏳ |
| MD-P12-T07 | Cashflow: manual entry and actuals sync | "Add Cashflow Month" modal: month/year, planned revenue, planned cost. Actuals auto-populated from certified applications (revenue) + supplier payments (cost) for that month | src/app/(app)/projects/[projectId]/cashflow/page.tsx | cashflow_forecasts INSERT/UPDATE | Month modal | Add month → appears | Cashflow months saved; actuals from real data | ⏳ |
| MD-P12-T08 | Cashflow: export and print | "Export Cashflow" → CSV. "Print S-Curve" → @react-pdf/renderer PDF with SCurveChart as SVG | src/app/(app)/projects/[projectId]/cashflow/page.tsx | cashflow_forecasts SELECT | Export + print buttons | Export → CSV; Print → PDF | CSV and PDF generate correctly | ⏳ |
| MD-P12-T09 | Create /projects/[id]/evm | EVM page. KPIs: PV, EV, AC, SV (EV-PV), CV (EV-AC), SPI (EV/PV), CPI (EV/AC), EAC (BAC/CPI). SCurveChart showing PV/EV/AC curves | src/app/(app)/projects/[projectId]/evm/page.tsx (new) | cashflow_forecasts + applications | EVM KPI strip + SCurveChart | Load → KPIs | EVM metrics calculated correctly | ⏳ |
| MD-P12-T10 | EVM: performance trend chart | CPI and SPI trend over 6 months. Recharts LineChart. CPI > 1 = green, 0.9–1 = amber, < 0.9 = red | src/app/(app)/projects/[projectId]/evm/page.tsx | cashflow_forecasts SELECT | Recharts LineChart | Load → trend chart | Trend chart with colour zones | ⏳ |
| MD-P12-T11 | CVR: margin bridge waterfall | Waterfall chart on /cvr/[id]: Original tender margin → CE uplift → retention impact → material price variance → subcontractor variance → Current margin | src/app/(app)/cvr/[projectId]/page.tsx | cvr_periods + change_events | Recharts BarChart waterfall | Load → margin bridge | Waterfall renders with correct movements | ⏳ |
| MD-P12-T12 | CVR: WIP adjustment entry | WIP Adjustments section: line items (Description, Amount ±). Adjusts certified revenue to "true" earned value | src/app/(app)/cvr/[projectId]/page.tsx | cvr_periods.wip_adjustments JSONB | Line item table | Add WIP adj → total updates | WIP adjustments affect margin | ⏳ |
| MD-P12-T13 | CVR: cost-to-complete forecast | CTC section: remaining scope, resources CTC, subcontract CTC, risk allowance. Forecast final cost = actual + CTC. Forecast margin = final_revenue - forecast_final_cost | src/app/(app)/cvr/[projectId]/page.tsx | cvr_periods.ctc_data JSONB | CTC input table | Enter CTC → margin forecast updates | CTC saves; forecast margin correct | ⏳ |
| MD-P12-T14 | CVR: cross-project analytics link | "Portfolio CVR" button on /cvr list: aggregate CVR across all projects (total WIP, total margin, avg CPI, total CEs at risk). Links to /analytics | src/app/(app)/cvr/page.tsx | cvr_periods aggregate | Portfolio summary | Load → portfolio summary | Portfolio aggregate correct | ⏳ |
| MD-P12-T15 | NEC4 Options C/D target cost | /projects/[id]/target-cost: target price, defined cost (actual), pain/gain share calculation, share range table, employer/contractor split per NEC4 Option C | src/app/(app)/projects/[projectId]/target-cost/page.tsx (new) | projects.target_cost_data JSONB | Target cost form + share table | Enter defined cost → gain/pain calculated | Pain/gain split calculated per NEC4 Option C | ⏳ |
| MD-P12-T16 | Fluctuations module | /projects/[id]/fluctuations: input index at contract date, current index, eligible cost. Calculates fluctuation adjustment under JCT formula. BCIS indices: BYO (show manual entry with note if no BCIS key) | src/app/(app)/projects/[projectId]/fluctuations/page.tsx (new) | projects.fluctuations_data JSONB | Fluctuations form | Enter indices → adjustment | Fluctuation adjustment calculates correctly | ⏳ |
| MD-P12-T17 | Retention statement PDF | "Generate Retention Statement" PDF: project parties, all deductions, releases, current balance, DLP end date. Stores in legal-notices (no delete) | src/lib/pdf-templates/retention-statement.tsx (new) | retention_ledger SELECT + Storage | PDF button | Generate → PDF | Retention statement PDF generates | ⏳ |
| MD-P12-T18 | Retention mobile layout | At 375px: stacked stat cards for retention summary. Ledger table horizontally scrollable | src/app/(app)/projects/[projectId]/retention/page.tsx | None | Mobile layout | 375px → correct layout | Mobile layout renders | ⏳ |
| MD-P12-T19 | TypeScript check after P12 | `npx tsc --noEmit` — 0 errors | All P12 files | None | None | 0 TS errors | 0 errors | ⏳ |
| MD-P12-T20 | P12 regression test | Test: cashflow → S-curve → EVM → CVR margin bridge → retention deducted → released on PC. V1 regression | All P12 routes | None | Full flow | All financial intelligence features work | ⏳ |

### Phase Release Gate
- [ ] Retention auto-deducted on certification
- [ ] First moiety releases on PC date
- [ ] S-curve renders 3 line types
- [ ] EVM: PV, EV, AC, SPI, CPI, EAC correct
- [ ] CVR margin bridge waterfall renders
- [ ] TypeScript: 0 errors

---

## Phase 13 — Practical Completion, Snagging And Defects

### Goal
Build the end-of-project lifecycle: PC Certificate generator, Snagging Register (mobile-optimised), Defects inspection workflows, DLP tracking, and Making Good Defects certificate.

### Dependencies
- Phase 03 (practical_completions, snagging_items tables)
- Phase 04 (@react-pdf/renderer)
- Phase 12 (retention linked to PC date)
- Feature flag: pc_snagging

### 20 Tasks

| Task ID | Task Name | Description | Files/Routes | Supabase/RLS | UI/UX | Tests | Acceptance Criteria | Status |
|---------|-----------|-------------|-------------|-------------|-------|-------|--------------------|----|
| MD-P13-T01 | Create /projects/[id]/practical-completion | New PC page with 3 tabs: PC Certificate, Snagging List (pre-PC), DLP Tracker (post-PC defects). Header: contract completion date, projected PC date, outstanding snags, DLP end date | src/app/(app)/projects/[projectId]/practical-completion/page.tsx (new) | practical_completions + snagging_items | 3-tab page | Load → tabs render | Page renders with correct DLP end date | ⏳ |
| MD-P13-T02 | PC Certificate wizard (4-step) | Create src/components/wizards/pc-wizard.tsx. Steps: (1) Certificate Details: section ref, PC date, certificate number; (2) Outstanding Works; (3) Parties: certifier, employer, contractor; (4) Review & Issue. Cannot backdate PC date | src/components/wizards/pc-wizard.tsx (new) | practical_completions INSERT | 4-step wizard | Complete → PC in DB | PC record created; backdating rejected | ⏳ |
| MD-P13-T03 | PC Certificate PDF | "CERTIFICATE OF PRACTICAL COMPLETION" PDF: project name, contract ref, cert number, date issued, certifier statement, PC date, outstanding items, DLP period and end date, signature block. Store in legal-notices (immutable) | src/lib/pdf-templates/pc-certificate.tsx (new) | practical_completions + Storage | PDF | Generate → in Storage | PC certificate PDF stored immutably | ⏳ |
| MD-P13-T04 | PC: immutability after issue | Once issued: PDF in legal-notices (no delete), status = 'issued', issued_at set, form locked. Retention release first moiety triggered via notification | practical_completions + src/lib/immutability.ts | practical_completions UPDATE | Locked form | Issue PC → form locked | PC immutable; retention notification fired | ⏳ |
| MD-P13-T05 | Create /projects/[id]/snagging | Snagging register: snag ID, location, description, photo thumbnail, priority, status, assignee, due date, closed date. Filter by status/priority/location/trade. KPI strip: open, overdue, closed this week | src/app/(app)/projects/[projectId]/snagging/page.tsx (new) | snagging_items SELECT | Table + KPI strip | Load → snags listed | Snagging register renders | ⏳ |
| MD-P13-T06 | Snag wizard (mobile-optimised) | Create src/components/wizards/snag-wizard.tsx. 3 steps: (1) Location & Description: location, description, priority; (2) Photos: up to 5 photos via `<input type="file" accept="image/*" capture="environment">`, upload to Storage; (3) Assign: tradesperson, due date. Large touch targets | src/components/wizards/snag-wizard.tsx (new) | snagging_items INSERT + Storage | Mobile-first wizard | Create snag at 375px → in DB with photo | Snag created with photo via mobile camera | ⏳ |
| MD-P13-T07 | Snagging: close snag workflow | "Mark Complete" button requires: completion photo, completion note, completion date. On close: status = 'closed', closed_at, closed_by = auth.uid(). Creates audit_event | src/app/(app)/projects/[projectId]/snagging/page.tsx | snagging_items UPDATE + audit_events | Close modal | Close snag → status updates | Snag closed with photo and audit trail | ⏳ |
| MD-P13-T08 | Snagging: photo lightbox | Click thumbnail → full-screen photo lightbox. Swipe through multiple photos. Shows: location, description, raised by, raised when, closed by, closed when. Supabase Storage signed URLs | src/app/(app)/projects/[projectId]/snagging/page.tsx | Storage signed URLs | Photo lightbox | Click → full screen | Lightbox opens with correct photos | ⏳ |
| MD-P13-T09 | Snagging: export to PDF schedule | "Export Snag Schedule" PDF: each snag with ID, location, description, priority, photo thumbnail, status, due date, assignee. Professional layout for subcontractor issue | src/lib/pdf-templates/snagging-schedule.tsx (new) | snagging_items SELECT + Storage | PDF export | Export → PDF | Snagging schedule PDF generates with photos | ⏳ |
| MD-P13-T10 | Snagging: overdue notifications | Snag status = 'open' AND due_date < today: createNotification() type='snag_overdue'. Weekly digest: "X snags overdue on [project]". Critical snags: immediate notification on creation if due_date < 7 days | Nightly cron + src/lib/notifications.ts | snagging_items + notifications | None | Create overdue snag | Notifications for overdue snags | ⏳ |
| MD-P13-T11 | DLP defects tracking | Post-PC tab: DLP Defects register (type='defect'). Track: employer notification date, contractor response, resolution date. "Employer notified under clause 43" stamp | src/app/(app)/projects/[projectId]/practical-completion/page.tsx | snagging_items WHERE pc_id NOT NULL | DLP defects tab | Add defect → appears | Defects tracked separately from pre-PC snags | ⏳ |
| MD-P13-T12 | Making Good Defects certificate | When all DLP defects resolved and DLP end date reached: "Issue MGD Certificate". PDF generated. Triggers second retention moiety release notification. Stores in legal-notices (immutable) | src/lib/pdf-templates/mgd-certificate.tsx (new) | practical_completions.mgd_issued_at + Storage | MGD wizard | Issue MGD → PDF in Storage | MGD certificate generated; second moiety notification | ⏳ |
| MD-P13-T13 | PC: project status update | Issue PC → project.status = 'practical_completion'. MGD → 'defects_liability_period'. DLP end → 'completed'. Status changes reflect in project list chips | src/app/(app)/projects/[projectId]/page.tsx | projects UPDATE | Status chip | Issue PC → status changes | Project status auto-updates through PC lifecycle | ⏳ |
| MD-P13-T14 | PC: cross-links to retention and cashflow | Quick-link cards on PC detail: "Retention to release on PC: £X" → /projects/[id]/retention; "Remaining cashflow: £X" → /projects/[id]/cashflow | src/app/(app)/projects/[projectId]/practical-completion/page.tsx | retention_ledger + cashflow_forecasts | Cross-link cards | Load PC page → linked data | Cross-links show correct financial data | ⏳ |
| MD-P13-T15 | Snagging: mobile PWA support (prep) | Snag list cached via next-pwa service worker (last 24h). Queue offline snag creates (sync on reconnect). "Offline mode" banner when no network | src/app/(app)/projects/[projectId]/snagging/page.tsx | None (local cache) | Offline banner | Kill network → banner; list visible | Offline banner shows; snag list cached | ⏳ |
| MD-P13-T16 | Snagging: QR code location tagging | Generate QR code per location. QR links to /projects/[id]/snagging?location=X. Scanning auto-opens snag wizard pre-filled with location. Export QR codes as PDF sheet | src/app/(app)/projects/[projectId]/snagging/page.tsx | None | QR code display | Scan QR → wizard opens with location | QR codes generated; scan pre-fills location | ⏳ |
| MD-P13-T17 | Snagging mobile list | At 375px: priority colour-coded card borders (red=critical, amber=major, blue=minor). Swipe-right to close; swipe-left to assign. Floating "+" button for new snag | src/app/(app)/projects/[projectId]/snagging/page.tsx | None | Mobile-first cards | 375px → card list | Mobile snagging list renders correctly | ⏳ |
| MD-P13-T18 | Snagging statistics panel | Statistics: by trade (pie chart), by location (bar chart), by priority, resolution time (avg days to close). Recharts charts | src/app/(app)/projects/[projectId]/snagging/page.tsx | snagging_items aggregate | Recharts charts | Load → stats calculated | Statistics charts render with correct data | ⏳ |
| MD-P13-T19 | TypeScript check after P13 | `npx tsc --noEmit` — 0 errors | All P13 files | None | None | 0 TS errors | 0 errors | ⏳ |
| MD-P13-T20 | P13 regression and PC lifecycle test | Full test: create snags → complete → issue PC (immutable PDF) → retention notification → DLP defects → close → MGD certificate → second moiety → project status = completed. V1 regression | All PC/snagging routes | None | Full PC lifecycle | Complete end-to-end PC lifecycle works | ⏳ |

### Phase Release Gate
- [ ] PC certificate PDF generated and immutable
- [ ] PC date backdating rejected
- [ ] Snag wizard works on mobile (375px) with camera capture
- [ ] Snagging PDF export with photos
- [ ] MGD certificate triggers second moiety notification
- [ ] TypeScript: 0 errors

---

## Phase 14 — Dayworks, Mobile Capture And PWA

### Goal
Build the mobile daywork capture system and Progressive Web App capability. Site engineers capture dayworks on-site — no signal required. Records sync when back online.

### Dependencies
- Phase 04 (next-pwa installed)
- Phase 13 (mobile-first patterns established)
- Phase 07 (CE linking for daywork → CE)
- Feature flag: mobile_dayworks

### 20 Tasks

| Task ID | Task Name | Description | Files/Routes | Supabase/RLS | UI/UX | Tests | Acceptance Criteria | Status |
|---------|-----------|-------------|-------------|-------------|-------|-------|--------------------|----|
| MD-P14-T01 | Configure PWA manifest | Create public/manifest.json: name "MeasureDeck", theme_color, icons (192px, 512px), display: "standalone", start_url: "/dayworks/mobile". Configure next.config.ts with next-pwa runtimeCaching | public/manifest.json + next.config.ts | None | App installs from browser | Install PWA → app icon on home screen | PWA installs on Android and iOS | ⏳ |
| MD-P14-T02 | Offline fallback page | src/app/offline/page.tsx: "You're offline. Cached records still available." List of cached pages. No API calls | src/app/offline/page.tsx (new) | None | Offline page | Kill network → uncached page → offline page | Offline fallback renders | ⏳ |
| MD-P14-T03 | Mobile daywork list page | /dayworks/mobile (mobile_dayworks flag). Mobile card list: date, description, total value, status chip. Floating "+" button. Offline badge when disconnected | src/app/(app)/dayworks/mobile/page.tsx (new) | daywork_sheets SELECT | Mobile card list + FAB | Load on mobile → cards | List renders with offline support | ⏳ |
| MD-P14-T04 | Daywork mobile wizard (4-step) | src/components/wizards/daywork-wizard.tsx. 4 steps: (1) Header: date, project, ref, CE linkage; (2) Labour: resource, trade, hours, rate; (3) Plant: description, hours/days, rate; (4) Materials: description, qty, unit, rate, delivery note photo. Large touch targets | src/components/wizards/daywork-wizard.tsx (new) | daywork_sheets INSERT | Mobile-first wizard | Complete on 375px → in DB | Daywork wizard creates complete record on mobile | ⏳ |
| MD-P14-T05 | Daywork: photo capture and upload | Camera capture button: `<input type="file" accept="image/*" capture="environment">`. Multiple photos per step. Upload to Storage. Thumbnail preview. Foreman signature (canvas pad component) | src/components/wizards/daywork-wizard.tsx | Storage: project-media | Camera + signature pad | Capture photo → thumbnail | Photos upload; signature captured | ⏳ |
| MD-P14-T06 | Daywork: offline sync queue | When offline: save to IndexedDB/localStorage queue. "Saved offline — will sync when connected" banner. On reconnect (navigator.onLine + interval check): auto-submit queued dayworks. Show sync progress | src/lib/offline-queue.ts (new) | daywork_sheets INSERT (deferred) | Offline banner; sync progress | Kill network → create → reconnect → synced | Offline dayworks sync on reconnect | ⏳ |
| MD-P14-T07 | Daywork: foreman digital signature | HTML canvas signature pad on wizard final step. Base64 PNG saved to daywork_sheets.foreman_signature. Shown on PDF and daywork detail | src/components/wizards/daywork-wizard.tsx | daywork_sheets.foreman_signature | Canvas signature pad | Draw signature → saves | Signature captured and saved as image | ⏳ |
| MD-P14-T08 | Daywork: pricing engine | src/lib/dayworks/pricing-engine.ts. Load project's agreed daywork schedules. Auto-price: operative rate × hours = labour cost. Plant: RICS All-In Plant Rate (static JSON). Materials: net cost + 12.5% handling | src/lib/dayworks/pricing-engine.ts (new) | project daywork rates JSONB | Auto-priced totals | Add 8h at agreed rate → total correct | Pricing engine calculates correct totals | ⏳ |
| MD-P14-T09 | Daywork: approval workflow | On submit: status = 'pending_approval'. QS notification: "Daywork [ref] awaiting approval — £X." On approve: status = 'approved', approved_by, approved_at. On dispute: status = 'disputed', dispute_reason. Creates audit_event | src/app/(app)/dayworks/mobile/page.tsx | daywork_sheets UPDATE + notifications + audit_events | Approve/dispute buttons | Submit → notification → approve | Approval workflow with audit trail | ⏳ |
| MD-P14-T10 | Daywork: CE linkage | Dayworks linked to CE at creation or after. On CE detail: Dayworks tab listing linked sheets with totals. CE value auto-includes daywork total when flag enabled | src/app/(app)/changes/[changeId]/page.tsx | daywork_sheets.change_event_id FK | Dayworks tab on CE | Link daywork → on CE | Dayworks linked; totals on CE | ⏳ |
| MD-P14-T11 | Daywork PDF | Daywork sheet PDF: project header, date, ref, labour table, plant table, materials table, photos (thumbnails), totals, foreman signature block, QS approval signature block, notes | src/lib/pdf-templates/daywork-sheet.tsx (new) | daywork_sheets SELECT + Storage | PDF | Generate → PDF | PDF with all tables and photos | ⏳ |
| MD-P14-T12 | Daywork register (desktop) | On /changes: Dayworks secondary tab. Desktop register: all daywork sheets with filters (project, CE, status, date). Bulk approve. Export to CSV | src/app/(app)/changes/page.tsx | daywork_sheets SELECT | Desktop table | Filter → list reduces; bulk approve | Desktop register with bulk approve | ⏳ |
| MD-P14-T13 | PWA push notifications | Supabase Realtime subscription on notifications WHERE user_id = auth.uid(). New row → Web Push API notification to mobile. Requires VAPID keys in next.config | src/app/(app)/shell-client.tsx + service worker | notifications realtime | Push notification | Create notification → push delivered | Push notification on mobile | ⏳ |
| MD-P14-T14 | PWA install prompt | "Add to Home Screen" banner on mobile first visit. Custom install prompt via beforeinstallprompt. Dismissable. "Works offline — capture dayworks without signal" | src/components/ui/pwa-install-prompt.tsx (new) | None | Install banner | Mobile first visit → banner | Install prompt on supported browsers | ⏳ |
| MD-P14-T15 | Daywork: GPS location tagging | Request geolocation API on daywork creation. Tag with lat/lng. Display on detail: "Captured at: [coordinates]". Helps verify location in disputes | src/components/wizards/daywork-wizard.tsx | daywork_sheets.location JSONB | Location display | Create daywork → lat/lng saved | GPS coordinates captured | ⏳ |
| MD-P14-T16 | Daywork: weekly cost summary | Weekly cron (Friday 17:00): "This week's dayworks: X sheets, total £Y. [X pending approval]. [X linked to CEs]." In-app notification | cron + src/lib/notifications.ts | daywork_sheets SELECT + notifications | None | Manual trigger | Weekly notification with correct totals | ⏳ |
| MD-P14-T17 | Daywork: edit and void | Before approval: can edit rate/hours. After approval: cannot edit — must void and resubmit. "Void" creates audit log entry with reason. Voided shows strikethrough | src/app/(app)/dayworks/mobile/page.tsx | daywork_sheets UPDATE (void_reason) | Void modal | Void approved daywork → rejected; creates audit | Immutability after approval; void audit trail | ⏳ |
| MD-P14-T18 | Daywork mobile performance | Page load < 2s on 3G. Lazy load photos (IntersectionObserver), virtualise lists (windowing). Test with 500-item list | src/app/(app)/dayworks/mobile/page.tsx | None | Load time < 2s | 3G throttle + 500 items | Page loads < 2s on throttled 3G | ⏳ |
| MD-P14-T19 | TypeScript check after P14 | `npx tsc --noEmit` — 0 errors | All P14 files | None | None | 0 TS errors | 0 errors | ⏳ |
| MD-P14-T20 | P14 PWA regression test | Install as PWA. Kill network. Create daywork offline. Reconnect → syncs. Push notification arrives. V1 desktop regression | PWA + daywork flow | None | Full PWA test | Offline daywork syncs; PWA installs | ⏳ |

### Phase Release Gate
- [ ] PWA installs on Android and iOS
- [ ] Offline fallback shows when no network
- [ ] Daywork wizard works one-handed on mobile
- [ ] Camera capture works
- [ ] Offline queue syncs on reconnect
- [ ] Approval workflow with notifications
- [ ] Daywork PDF generates with photos
- [ ] TypeScript: 0 errors

---

## Phase 15 — AI Intelligence Layer

### Goal
Wire AI copilot into every major commercial feature: contract clause analyser, CE entitlement identifier, daywork narrative generator, delay analysis assistant, risk assessment helper. All AI mutations require human confirmation — AI never writes to DB directly.

### Dependencies
- Phase 07 (NEC4 CE engine), Phase 09 (HGCRA), Phase 13 (PC/snagging)
- Feature flags: ai_contract_analyser, ai_ce_identifier, ai_daywork_capture
- AI copilot API: src/app/api/ai/chat/route.ts (existing)

### 20 Tasks

| Task ID | Task Name | Description | Files/Routes | Supabase/RLS | UI/UX | Tests | Acceptance Criteria | Status |
|---------|-----------|-------------|-------------|-------------|-------|-------|--------------------|----|
| MD-P15-T01 | AI: page context injection | Enhance AIBubbleButton to inject current route context into AI requests: project name, contract type, open CEs, recent applications. Different context per route | src/components/ai-bubble/bubble-button.tsx | Read-only Supabase context | Context-aware panel | On /projects/[id] → AI knows project | AI responds with project-specific context | ⏳ |
| MD-P15-T02 | AI: contract clause analyser | "Analyse Contract" section on project detail (ai_contract_analyser gated). Upload contract PDF or paste clause text. AI extracts: payment terms, retention, CE mechanism, insurance, notice periods, termination. Returns structured JSON. User reviews and saves | src/app/(app)/projects/[projectId]/page.tsx | contract_documents Storage read | AI panel with results | Upload → AI extracts clauses | AI returns structured contract summary | ⏳ |
| MD-P15-T03 | AI: CE entitlement scanner | "Scan for Compensation Events" button (ai_ce_identifier gated). Input: meeting minutes, site instructions, correspondence. AI returns: "This instruction on [date] may be CE under clause 60.1(1) — notify within 8 weeks" | src/app/(app)/projects/[projectId]/page.tsx | change_events context | AI scan results | Paste text → CE suggestions | AI identifies CE entitlements with clause references | ⏳ |
| MD-P15-T04 | AI: CE notification draft | "Generate CE Notification Letter" on CE detail. AI uses: CE title, clause, instruction date, impact → formal notification letter following NEC4 clause 61.1 format. User edits before PDF download | src/app/(app)/changes/[changeId]/page.tsx | change_events SELECT | AI draft → editable textarea | Click → draft letter | AI returns CE notification draft with clause refs | ⏳ |
| MD-P15-T05 | AI: CE quotation narrative | "Generate Quotation Narrative" on CE quotation builder. AI uses: CE clause, line items, programme impact → executive summary + detailed basis narrative. User reviews and edits | src/app/(app)/changes/[changeId]/page.tsx | change_events + ce_workflow_states | AI narrative panel | Click → narrative generated | AI returns detailed quotation narrative | ⏳ |
| MD-P15-T06 | AI: risk register assessment | "AI Risk Review" button on project risk register. Sends open EWs + CE pipeline to AI. Returns: ranked risks with recommendations ("Convert EW-003 to CE — 8-week notification window closes in 12 days") | src/app/(app)/projects/[projectId]/page.tsx | early_warnings + change_events SELECT | AI risk panel | Click → risk report | AI returns ranked risk assessment | ⏳ |
| MD-P15-T07 | AI: HGCRA compliance advisor | "Compliance Check" on application detail. AI checks: PLN issued, within prescribed period, correctly formatted. Returns: "COMPLIANT: PLN issued 3 days before cutoff" or "RISK: PLN not issued. Cutoff in 2 days" | src/app/(app)/applications/[applicationId]/page.tsx | applications + pay_less_notices SELECT | AI compliance panel | Click → AI report | AI returns correct HGCRA compliance status | ⏳ |
| MD-P15-T08 | AI: daywork narrative generator | "Generate Description" on daywork wizard final step. AI uses project context, trade types, duration, date → professional daywork description | src/components/wizards/daywork-wizard.tsx | AI chat API | AI text generation | Click → description fills textarea | AI generates professional daywork narrative | ⏳ |
| MD-P15-T09 | AI: delay analysis assistant | "Analyse Delay" on /projects/[id]/delay-analysis. AI uses programme baseline + CE programme impacts → identifies critical path delays, attributes causes, suggests EOT entitlement | src/app/(app)/projects/[projectId]/delay-analysis/page.tsx | programme_notifications + ce_workflow_states | AI delay panel | Click → delay analysis | AI returns delay attribution | ⏳ |
| MD-P15-T10 | AI: supplier risk screening | "AI Risk Screen" on supplier detail. AI analyses: CH status, CIS status, insurance expiry, payment history → risk narrative: "Elevated payment risk — 3 of 5 applications certified 30+ days late" | src/app/(app)/suppliers/[supplierId]/page.tsx | cis_records + applications SELECT | AI risk panel | Click → risk narrative | AI returns supplier risk narrative | ⏳ |
| MD-P15-T11 | AI: mutation confirmation gate | CRITICAL: All AI suggestions writing to DB must show ConfirmDialog: "AI has suggested: [action]. This will: [DB change]. Approve or reject." AI returns suggestions only — user must click "Apply AI Suggestion" to trigger Supabase write | All AI features | None (no direct writes) | ConfirmDialog before any write | AI suggests → confirm → DB updated | 0 AI-direct DB mutations; all require explicit approval | ⏳ |
| MD-P15-T12 | AI: chat history per session | Persist AI conversation in React state within session. Maintain context when navigating between pages. Clear on explicit "New conversation" button. Never persist across sessions (no DB storage — privacy) | src/components/ai-bubble/modes/copilot-view.tsx | None (session state only) | Chat history visible | Navigate pages → history persists | Context maintained across page navigation | ⏳ |
| MD-P15-T13 | AI: copilot keyboard shortcut | Cmd/Ctrl+K or Cmd/Ctrl+Shift+A opens AI copilot panel from anywhere. Show shortcut hint in empty copilot state | src/components/ai-bubble/bubble-button.tsx | None | Keyboard listener | Press Ctrl+K → panel opens | Keyboard shortcut opens AI panel | ⏳ |
| MD-P15-T14 | AI: evidence and photo analysis | "Analyse Evidence" on /evidence/[id]. Upload photo → AI describes content and suggests category (defect, variation, progress, site condition) | src/app/(app)/evidence/[evidenceId]/page.tsx | evidence SELECT | AI analysis panel | Upload photo → AI describes | AI returns useful description and category | ⏳ |
| MD-P15-T15 | AI: final account recommendation | "AI Review" on /final-accounts/[id]. AI analyses: original contract, all CEs, retention status, outstanding items → final account summary with items flagged as potentially underclaimed or disputed | src/app/(app)/final-accounts/[finalAccountId]/page.tsx | final_accounts + change_events SELECT | AI review panel | Click → AI summary | AI returns final account review | ⏳ |
| MD-P15-T16 | AI: rate responses | Thumbs up/down per AI response. Store in localStorage (not DB). "Feedback sent" on rate | src/components/ai-bubble/modes/copilot-view.tsx | None (localStorage) | Thumbs up/down | Rate → saved | Rating saves to localStorage | ⏳ |
| MD-P15-T17 | AI: streaming responses | AI responses stream via SSE from existing API route. Text streams word-by-word to copilot panel with typing cursor | src/components/ai-bubble/modes/copilot-view.tsx, src/app/api/ai/chat/route.ts | None | Streaming text | Long response → streams | AI responses stream word-by-word | ⏳ |
| MD-P15-T18 | AI: context usage indicator | Token context bar in copilot footer: "Context: 60% used." Amber > 80%. Red > 95% with offer to summarise and continue | src/components/ai-bubble/modes/copilot-view.tsx | None | Context bar | Use AI → bar updates | Context indicator shows correct level | ⏳ |
| MD-P15-T19 | TypeScript check after P15 | `npx tsc --noEmit` — 0 errors | All P15 files | None | None | 0 TS errors | 0 errors | ⏳ |
| MD-P15-T20 | P15 AI regression test | Test all AI features. Confirm mutation gate fires for all DB changes. Confirm streaming works. Confirm AI never writes directly | All AI-enabled routes | None | Full AI test | All AI features work; mutation gate always fires | ⏳ |

### Phase Release Gate
- [ ] Context injection sends route-specific data
- [ ] Contract clause analyser returns structured output
- [ ] CE entitlement scanner identifies opportunities
- [ ] AI mutation confirmation gate: 0 direct DB writes
- [ ] Streaming responses render word-by-word
- [ ] TypeScript: 0 errors

---

## Phase 16 — Client Portal And External Collaboration

### Goal
Build the secure client-facing portal: employers/clients can view payment applications, download documents, approve CEs, and track project status without a MeasureDeck account. Magic link authentication, token-scoped access, full audit log.

### Dependencies
- Phase 03 (portal_access_tokens, portal_audit_log tables)
- Phase 09 (applications HGCRA compliance)
- Phase 13 (PC certificates)
- Feature flag: client_portal

### 20 Tasks

| Task ID | Task Name | Description | Files/Routes | Supabase/RLS | UI/UX | Tests | Acceptance Criteria | Status |
|---------|-----------|-------------|-------------|-------------|-------|-------|--------------------|----|
| MD-P16-T01 | Portal access token model | src/lib/portal.ts: token model with scope (application/project/report), permissions (view_application, view_documents, approve_ce), expires_at (7 days default), single_use option, revoke mechanism | src/lib/portal.ts (new) | portal_access_tokens SELECT | None | Token create → unique UUID | Token generation creates unique UUID | ⏳ |
| MD-P16-T02 | Portal magic link Edge Function | send-portal-invite edge function. Input: email, token, project_id, scope, sender_name. Uses Resend to send email with link to /portal/[token], expiry date, workspace branding | supabase/functions/send-portal-invite/ (new) | portal_access_tokens UPDATE (sent_at) | None | Manual invoke → email received | Portal invite email delivered via Resend | ⏳ |
| MD-P16-T03 | Portal layout | src/app/(portal)/layout.tsx. Completely separate layout: no app sidebar, no admin shell. Workspace logo + minimal top bar + logout. No navigation to main app | src/app/(portal)/layout.tsx (new) | token from URL | Portal shell | Load /portal/[token] → portal shell | Portal layout renders without app shell | ⏳ |
| MD-P16-T04 | Portal: token validation middleware | Middleware for /portal/* routes. Validates: token exists, not expired, not revoked. Invalid → /portal/invalid with clear error. Logs each access to portal_audit_log | src/middleware.ts (extend) | portal_access_tokens SELECT | Error page | Invalid token → error page | Valid token = access; invalid/expired = error | ⏳ |
| MD-P16-T05 | Portal: application view | /portal/[token]/application: payment application fields, HGCRA timeline, certified amount, amount paid. Read-only. Download PDF button. "Raise Query" button | src/app/(portal)/[token]/application/page.tsx (new) | applications SELECT (token-scoped via Edge Function) | Read-only application | Load via token → application shown | Application data shown via token | ⏳ |
| MD-P16-T06 | Portal: CE approval workflow | If token has approve_ce permission: list pending CEs on application. "Approve" / "Query" buttons. On approve: ce_workflow_states.pm_response = 'accepted' + audit_event. On query: notification to contractor | src/app/(portal)/[token]/application/page.tsx | ce_workflow_states UPDATE via Edge Function | Approve/Query buttons | Client approves CE → state updated | CE approval creates correct state transition | ⏳ |
| MD-P16-T07 | Portal: project progress view | /portal/[token]/project: project header, key dates, % complete, recent activity, KPI summary (contract sum, certified, paid, retention). No margin/cost data. "Request Document" button | src/app/(portal)/[token]/project/page.tsx (new) | projects SELECT (token-scoped) | Project summary | Load → project data | Portal shows project data without sensitive margins | ⏳ |
| MD-P16-T08 | Portal: document download centre | /portal/[token]/documents: documents contractor has shared. Download → Storage signed URL (1h expiry). Portal audit log records each download | src/app/(portal)/[token]/documents/page.tsx (new) | Storage signed URLs + portal_audit_log INSERT | Document list | Download → audit logged | Each download creates portal_audit_log entry | ⏳ |
| MD-P16-T09 | Portal: audit log for contractor | Project detail "Portal Activity" tab: all portal_audit_log entries for this project. Who accessed, when, action, IP address | src/app/(app)/projects/[projectId]/page.tsx | portal_audit_log SELECT (workspace-scoped) | Audit feed | Client views portal → appears | Portal access visible to contractor | ⏳ |
| MD-P16-T10 | Portal: token management page | "Share with Client" tab on project detail. List active tokens: email, scope, created, expires, last accessed, revoke button. "Create New Share" button | src/app/(app)/projects/[projectId]/page.tsx | portal_access_tokens SELECT/INSERT/UPDATE | Token list | Create token → in list; revoke → denied | Token management end-to-end | ⏳ |
| MD-P16-T11 | Portal: revocation | "Revoke Access" → portal_access_tokens.revoked_at = now(). Immediate effect. "Send revocation notice" option via email | src/app/(app)/projects/[projectId]/page.tsx | portal_access_tokens UPDATE (revoked_at) | Revoke button + confirm | Revoke → invalid immediately | Token revocation is immediate | ⏳ |
| MD-P16-T12 | Portal: raise query flow | Client "Raise Query" → subject, message, attach file. Creates task in main app type='client_query'. Contractor gets in-app notification | src/app/(portal)/[token]/application/page.tsx | tasks INSERT via Edge Function | Query form | Client query → task in main app | Task created; contractor notified | ⏳ |
| MD-P16-T13 | Portal: mobile responsive | All /portal/* pages fully functional on mobile 375px. Application figures readable, PDF download works, CE approval works | All /portal/* pages | None | 375px layout | Load portal on mobile | Portal fully functional on mobile | ⏳ |
| MD-P16-T14 | Portal: session timeout | Sessions expire after 2h inactivity (token-based). After timeout: "Your session has expired. Request a new link from [contractor]." Clear cached portal data | src/middleware.ts | portal_access_tokens.last_accessed_at | Session timeout page | Simulate 2h inactivity → timeout | Session expires correctly | ⏳ |
| MD-P16-T15 | Portal: workspace branding | Portal shows workspace logo (workspace.logo_url) and name. "Powered by MeasureDeck" footer. Enterprise plan: white-label option to hide branding | src/app/(portal)/layout.tsx | workspaces.logo_url SELECT | Logo + name | Portal shows workspace logo | Portal branded with contractor's logo | ⏳ |
| MD-P16-T16 | Portal: notifications for contractor | Client accesses portal → notification: "Client [email] viewed application [ref]". Client approves CE → "Client approved CE [ref] via portal". Client raises query → "Client query received: [subject]" | src/lib/notifications.ts | notifications INSERT | Bell badge | Client accesses → contractor notified | Notifications appear in contractor's app | ⏳ |
| MD-P16-T17 | Portal: security headers | /portal/* routes set: Content-Security-Policy, X-Frame-Options: DENY, X-Content-Type-Options: nosniff. No workspace data leakage between tokens. Each token isolated to its permitted scope | src/middleware.ts | None | None | Security header check | Security headers present on portal responses | ⏳ |
| MD-P16-T18 | Portal: professional email template | send-portal-invite email: workspace logo, "You have received a payment application from [company]", access link, expiry notice, MeasureDeck footer | supabase/functions/send-portal-invite/ | None | Email template | Share → email received | Portal invite email with correct professional content | ⏳ |
| MD-P16-T19 | TypeScript check after P16 | `npx tsc --noEmit` — 0 errors | All P16 files | None | None | 0 TS errors | 0 errors | ⏳ |
| MD-P16-T20 | P16 portal end-to-end test | Full flow: create token → send invite → client opens /portal/[token] → views application → downloads PDF (audit logged) → approves CE → contractor sees portal activity. V1 regression | All /portal/* + token management | None | Full portal flow | Portal flow works end-to-end | ⏳ |

### Phase Release Gate
- [ ] Token validation: expired/revoked → error page
- [ ] Portal shows application data without auth
- [ ] CE approval via portal creates state transition + audit
- [ ] Document download creates audit log entry
- [ ] Token revocation is immediate
- [ ] Security headers set
- [ ] TypeScript: 0 errors

---

## Phase 17 — Analytics, Board Packs And Reports

### Goal
Build portfolio-level analytics dashboard, AI-powered board pack generator (PDF + PowerPoint), and enhanced report builder. Executives see entire portfolio without opening each project.

### Dependencies
- Phase 06 (projects commercial depth), Phase 12 (EVM/cashflow)
- Phase 04 (pptxgenjs installed)
- Feature flag: cross_project_analytics

### 20 Tasks

| Task ID | Task Name | Description | Files/Routes | Supabase/RLS | UI/UX | Tests | Acceptance Criteria | Status |
|---------|-----------|-------------|-------------|-------------|-------|-------|--------------------|----|
| MD-P17-T01 | Create /analytics portfolio page | New page (cross_project_analytics flag). KPIs: Total Portfolio Value, Avg Margin, CE Pipeline, Retention Held. Charts: Projects by Status (donut), Value by Sector (bar). 90-day trend toggle | src/app/(app)/analytics/page.tsx (new) | projects + applications + change_events aggregate | Charts + KPI strip | Load → portfolio data | Portfolio KPIs aggregate across all projects | ⏳ |
| MD-P17-T02 | Analytics: cross-project cashflow | Cashflow tab on /analytics. Aggregate S-curve across all active projects. Stacked bar: planned vs actual cumulative. Month-by-month table: portfolio planned, actual, variance | src/app/(app)/analytics/page.tsx | cashflow_forecasts aggregate | Recharts StackedBarChart | Load tab → cashflow | Aggregate cashflow renders correctly | ⏳ |
| MD-P17-T03 | Analytics: CE pipeline by project | CE Pipeline tab. Stacked bar: each project showing CE pipeline (submitted, approved, disputed). Table: project, total CE value, approved %, at-risk count, avg resolution days | src/app/(app)/analytics/page.tsx | change_events aggregate | Recharts StackedBar | Load tab → CE data | CE pipeline aggregated correctly | ⏳ |
| MD-P17-T04 | Analytics: HGCRA compliance scorecard | HGCRA tab. Table: project, HGCRA compliance score, PLNs issued, PLNs overdue, suspensions. Traffic light column. Exportable | src/app/(app)/analytics/page.tsx | applications + pay_less_notices aggregate | Compliance score table | Load tab → compliance table | HGCRA scores shown per project | ⏳ |
| MD-P17-T05 | Analytics: supply chain risk | Supply Chain tab. Total supplier count, % CIS verified, % insurance current, % CH active, top 10 suppliers by subcontract value, suppliers with compliance flags | src/app/(app)/analytics/page.tsx | suppliers + cis_records + subcontract_orders aggregate | Supply chain dashboard | Load tab → supply chain | Supply chain analytics render | ⏳ |
| MD-P17-T06 | Analytics: date range and project filter | Global filter bar: date range, project multi-select, sector, project manager. Filters all analytics tabs simultaneously. Persisted in URL params | src/app/(app)/analytics/page.tsx | None (filter state) | Filter bar | Apply filter → all tabs update | All analytics respects filter state | ⏳ |
| MD-P17-T07 | Analytics: export data | "Export Portfolio Data" → Excel-compatible CSV with one sheet per tab (Projects, Cashflow, CEs, HGCRA, Supply Chain). All filters applied | src/app/(app)/analytics/page.tsx | All aggregate SELECTs | Export button | Export → CSV with all sheets | CSV with correct aggregated data | ⏳ |
| MD-P17-T08 | Board pack generator (4-step) | /analytics/board-pack. Step 1: Select projects. Step 2: Select sections (Financial Summary, CE Pipeline, Cashflow, Risk Register, Programme, Supply Chain). Step 3: Preview. Step 4: Generate PDF or PowerPoint | src/app/(app)/analytics/board-pack/page.tsx (new) | Multiple aggregate queries | 4-step generator | Complete flow → pack generated | Board pack generator shows preview | ⏳ |
| MD-P17-T09 | Board pack: PDF generation | Board pack PDF (@react-pdf/renderer). Cover: period, date, branding. Executive summary: KPI table. Project pages: 1 per project with CVR summary, top CEs, cashflow chart, risk highlights. Footer: confidential + page numbers | src/lib/pdf-templates/board-pack.tsx (new) | Multiple aggregate queries | PDF | Generate → downloads | Board pack PDF with correct data | ⏳ |
| MD-P17-T10 | Board pack: PowerPoint generation | Board pack .pptx (pptxgenjs). Title slide, exec summary, 2 slides per project. Charts embedded as images (html2canvas on Recharts SVGs). Downloads .pptx | src/lib/board-pack/powerpoint-generator.ts (new) | Multiple aggregate queries | PowerPoint download | Generate → downloads | .pptx opens correctly in PowerPoint | ⏳ |
| MD-P17-T11 | Board pack: scheduled delivery | "Schedule Delivery" option. Sends PDF via Resend at set cadence (weekly/monthly/quarterly). Creates Supabase cron. Workspace admin configures recipients | src/app/(app)/analytics/board-pack/page.tsx | workspace_settings JSONB | Schedule options | Schedule monthly → cron created | Scheduled delivery configured | ⏳ |
| MD-P17-T12 | Project board pack (single) | "Generate Board Pack" on /projects/[id]. Single-project 6-page PDF: Header, Commercial Summary, CE Pipeline, Cashflow S-Curve, Risk Register, Programme | src/app/(app)/projects/[projectId]/page.tsx | All project queries | Board pack button | Click → project PDF | Single project board pack generates | ⏳ |
| MD-P17-T13 | Enhanced report builder | /reports: configurable sections, conditional content (show CIS section if flag on), table of contents, executive summary AI generation (ai_contract_analyser flag) | src/app/(app)/reports/page.tsx, [reportId]/page.tsx | reports SELECT + related | Report builder UI | Build report → rendered | Report builder creates structured report | ⏳ |
| MD-P17-T14 | Reports: share via portal | "Share via Portal" on /reports/[id] (client_portal flag). Creates portal token with scope=report. Sends portal invite email | src/app/(app)/reports/[reportId]/page.tsx | portal_access_tokens INSERT | Share button | Share → email → client can view | Report sharing via portal works | ⏳ |
| MD-P17-T15 | Analytics: project health score | "Health Score" (0–100) per project: margin trend (CPI), CE pipeline risk, HGCRA compliance, programme status, supplier compliance. Colour: red <60, amber 60–79, green 80+ | src/app/(app)/projects/page.tsx | Multiple aggregate queries | Health score chip | Load projects → health scores | Health scores calculated and displayed | ⏳ |
| MD-P17-T16 | Admin audit export | Wire /admin/audit "Export" button (currently dead). Downloads CSV: timestamp, workspace, user, action, resource_type, resource_id, old_values, new_values. Date range filter | src/app/admin/audit/page.tsx | audit_events SELECT (service role) | Export button | Export → CSV | Admin audit CSV exports correctly | ⏳ |
| MD-P17-T17 | Analytics: retention portfolio | Retention tab on /analytics. Table: project, retention held (£), first moiety due, second moiety due, released to date. Aggregate total retention across portfolio | src/app/(app)/analytics/page.tsx | retention_ledger aggregate | Retention table | Load tab → retention data | Retention portfolio totals correct | ⏳ |
| MD-P17-T18 | Analytics: mobile summary | At 375px: large KPI cards stacked, charts hidden (too small), summary table. "View full analytics" links to desktop URL | src/app/(app)/analytics/page.tsx | None | Mobile layout | 375px → KPI cards | Mobile analytics renders KPI cards | ⏳ |
| MD-P17-T19 | TypeScript check after P17 | `npx tsc --noEmit` — 0 errors | All P17 files | None | None | 0 TS errors | 0 errors | ⏳ |
| MD-P17-T20 | P17 regression test | Full test: /analytics loads with aggregate data, board pack PDF, PowerPoint downloads, scheduled delivery configured. V1 regression | /analytics/*, /reports/*, board-pack | None | Full analytics flow | All analytics features work | ⏳ |

### Phase Release Gate
- [ ] /analytics KPIs aggregate correctly
- [ ] Board pack PDF generates with correct data
- [ ] Board pack PowerPoint (.pptx) opens in PowerPoint
- [ ] Scheduled board pack delivery configured
- [ ] Project health score calculated
- [ ] TypeScript: 0 errors

---

## Phase 18 — Adjudication, Delay Analysis, BOQ And Programme Imports

### Goal
Build dispute resolution tools, structured delay analysis toolkit, BOQ manager, and Asta Powerproject XER file import. Heavy-use features for complex or disputed projects.

### Dependencies
- Phase 07 (NEC4 CE engine), Phase 08 (programme notifications)
- Phase 03 (adjudication_cases table)
- Feature flags: adjudication_module, asta_import, delay_analysis

### 20 Tasks

| Task ID | Task Name | Description | Files/Routes | Supabase/RLS | UI/UX | Tests | Acceptance Criteria | Status |
|---------|-----------|-------------|-------------|-------------|-------|-------|--------------------|----|
| MD-P18-T01 | Create /adjudication list page | New page (adjudication_module gated). Table: case number, project, dispute value, respondent, adjudicator, referral due date, decision due date (28 days from appointment), status. KPI: total disputed value, avg duration, won/lost/settled | src/app/(app)/adjudication/page.tsx (new) | adjudication_cases SELECT | Table + KPI strip | Load → cases | Adjudication register renders | ⏳ |
| MD-P18-T02 | Adjudication wizard (3-step) | src/components/wizards/adjudication-wizard.tsx. Steps: (1) Case: project, dispute type, responding party, value; (2) Timeline: Notice of Adjudication date, appointment date, referral due (7 days); (3) Adjudicator: name, nominating body | src/components/wizards/adjudication-wizard.tsx (new) | adjudication_cases INSERT | 3-step wizard | Complete → case in DB | Adjudication case created | ⏳ |
| MD-P18-T03 | Adjudication detail (5 tabs) | /adjudication/[id]: (1) Case Summary + CountdownClocks for referral/decision; (2) Pleadings (Referral, Response, Reply — upload/edit); (3) Evidence Bundle (link from /evidence); (4) Timeline (key dates stepper); (5) Costs tracker | src/app/(app)/adjudication/[adjudicationId]/page.tsx (new) | adjudication_cases + evidence | 5-tab detail | All tabs render | All 5 tabs render with data | ⏳ |
| MD-P18-T04 | Adjudication: decision deadline countdown | CountdownClock for: Referral Due (7 days from appointment), Response Due, Reply Due, Decision Due (28 days). Flash red < 2 days. Overdue → notification | src/app/(app)/adjudication/[adjudicationId]/page.tsx | adjudication_cases.appointment_date | CountdownClock | Load → clocks ticking | Clocks show correct deadlines | ⏳ |
| MD-P18-T05 | Adjudication: evidence bundle PDF | Multi-select /evidence records + /contract_documents. "Generate Evidence Bundle PDF" — combines all with cover page, table of contents, page numbers, section tabs. Uses @react-pdf/renderer | src/app/(app)/adjudication/[adjudicationId]/page.tsx | evidence + contract_documents + Storage | Evidence selection | Bundle → PDF | Evidence bundle PDF generates | ⏳ |
| MD-P18-T06 | Adjudication: cost tracker | Costs tab: claimant legal costs, adjudicator fees, expert fees, own surveying costs. "Costs Award" on decision. Net financial outcome = decision value - own costs | src/app/(app)/adjudication/[adjudicationId]/page.tsx | adjudication_cases.costs_data JSONB | Costs table | Enter costs → total | Costs tracked; net outcome calculates | ⏳ |
| MD-P18-T07 | Create /projects/[id]/delay-analysis | Delay analysis toolkit (delay_analysis flag). Input grid for delay events: date, cause, duration, responsibility (employer/neutral/contractor). Auto-calculates: total delay, employer-caused, EOT entitlement, concurrent delay periods | src/app/(app)/projects/[projectId]/delay-analysis/page.tsx (new) | projects.delay_analysis JSONB | Delay event grid | Add events → totals | Delay analysis calculates correct EOT | ⏳ |
| MD-P18-T08 | Delay analysis: critical path overlay | Critical path input: planned/actual start/finish per activity. Simple Gantt bars (Recharts). Highlights delay periods. AI "Analyse Delay" hook from P15 | src/app/(app)/projects/[projectId]/delay-analysis/page.tsx | projects.delay_data JSONB | Gantt bars | Enter activities → Gantt renders | Gantt with delay periods highlighted | ⏳ |
| MD-P18-T09 | Asta XER file import | src/lib/programme/xer-parser.ts. Parses Asta Powerproject .xer XML. Extracts: activities (WBS, description, start, finish, duration, float, relationships). Imports into schedule_items. /programmes/import with file upload + preview | src/lib/programme/xer-parser.ts (new), /programmes/import/page.tsx | schedule_items INSERT (bulk) | File upload + preview | Upload .xer → activities shown | XER parser imports activities to schedule_items | ⏳ |
| MD-P18-T10 | XER import: validation and mapping | After XER parse: mapping table (match XER to existing schedule_items by description similarity). User confirms. On confirm: bulk insert/update. Import summary: X new, Y updated, Z unmatched | src/app/(app)/programmes/import/page.tsx | schedule_items INSERT/UPDATE | Mapping table | Map → import | Import creates/updates schedule items correctly | ⏳ |
| MD-P18-T11 | BOQ manager | BOQ tab on /projects/[id]: item number, description, unit, qty, rate, amount. Subtotals by section. Running total. Link BOQ items to schedule activities or CEs. Import from CSV | src/app/(app)/projects/[projectId]/page.tsx | projects.boq JSONB or boq_items table | BOQ table | Add items → total | BOQ stores items; totals correct | ⏳ |
| MD-P18-T12 | BOQ: re-measure and variance | Re-measurement column: as-built qty vs tender qty. Variance (£ and %). Section total variances. Export BOQ as CSV | src/app/(app)/projects/[projectId]/page.tsx | projects.boq JSONB | Re-measure columns | Enter as-built → variance | Re-measurement variance calculates correctly | ⏳ |
| MD-P18-T13 | Programme: link to CE | schedule_items.change_event_id FK. "Link to CE" action. On CE detail: linked schedule items with planned/actual start/finish, delay days, EOT granted | src/app/(app)/schedule/[scheduleItemId]/page.tsx | schedule_items UPDATE | Link action | Link → shown on CE | Bidirectional link: schedule items ↔ CEs | ⏳ |
| MD-P18-T14 | Gantt: enhanced chart | /schedule/gantt: baseline vs actual bars, critical path (red), CE-impacted activities (amber), float as green extension, zoom controls (week/month/quarter), print layout | src/app/(app)/schedule/gantt/page.tsx | schedule_items SELECT | Enhanced Gantt | Load → enhanced view | Baseline, actual, critical path visible | ⏳ |
| MD-P18-T15 | Adjudication: link to CEs and applications | "Linked Records" section: multi-select change_events and applications to link to adjudication case. Appear in evidence bundle and case summary | src/app/(app)/adjudication/[adjudicationId]/page.tsx | change_events + applications SELECT | Linked records | Link CE → in case | CEs and applications linked to case | ⏳ |
| MD-P18-T16 | Adjudication: decision recording | "Record Decision" modal: decision date, in favour of (claimant/respondent/split), amount awarded, costs awarded, reasoning notes. Status = 'decided'. Audit_event created. Notifications sent | src/app/(app)/adjudication/[adjudicationId]/page.tsx | adjudication_cases UPDATE + audit_events + notifications | Decision modal | Record → status updates | Decision recorded with full audit trail | ⏳ |
| MD-P18-T17 | BOQ: import from CSV | "Import BOQ" on /projects/[id] BOQ tab. Upload CSV (item_number, description, unit, quantity, rate). Preview before import. Duplicate detection by item_number | src/app/(app)/projects/[projectId]/page.tsx | boq_items INSERT | CSV import | Upload CSV → preview → import | CSV imports to BOQ correctly | ⏳ |
| MD-P18-T18 | Delay analysis: PDF report | "Generate Delay Report" PDF: delay events table, concurrent delay analysis, EOT calculation, NEC4 clause 63 or JCT 2.29 references, AI narrative (P15) | src/lib/pdf-templates/delay-report.tsx (new) | delay data + CE data | PDF button | Generate → PDF | Delay report PDF generates | ⏳ |
| MD-P18-T19 | TypeScript check after P18 | `npx tsc --noEmit` — 0 errors | All P18 files | None | None | 0 TS errors | 0 errors | ⏳ |
| MD-P18-T20 | P18 regression test | Test: adjudication case → evidence bundle → decision. Import XER → activities. Delay analysis → report. V1 regression | All P18 routes | None | Full P18 flow | All P18 features work end-to-end | ⏳ |

### Phase Release Gate
- [ ] Adjudication case with 28-day decision countdown
- [ ] Evidence bundle PDF generates
- [ ] XER parser imports Asta activities
- [ ] Delay analysis EOT calculation correct
- [ ] BOQ tab stores items with correct totals
- [ ] Decision recorded with audit trail
- [ ] TypeScript: 0 errors

---

## Phase 19 — Integrations, Notifications And Optional Add-Ons

### Goal
Wire BYO notification add-ons (WhatsApp via Twilio, Slack, Teams), Xero accounting integration, email infrastructure via Resend, admin integration health dashboard. All paid services are optional BYO-credentials only.

### Dependencies
- Phase 02 (notifications helper)
- Feature flag: none (admin-enabled per workspace)

### 20 Tasks

| Task ID | Task Name | Description | Files/Routes | Supabase/RLS | UI/UX | Tests | Acceptance Criteria | Status |
|---------|-----------|-------------|-------------|-------------|-------|-------|--------------------|----|
| MD-P19-T01 | Wire notifications bell to real data | NotificationsView (currently mock) → real notifications table. Unread count in bell badge, ordered by created_at desc, mark as read on click, "Mark all read" button | src/components/ai-bubble/modes/notifications-view.tsx | notifications SELECT/UPDATE | Real-time badge | Receive notification → badge increments | Bell shows real unread count | ⏳ |
| MD-P19-T02 | Resend email integration | Edge Function send-notification-email. Uses Resend API (workspace Resend API key from workspace_settings). Templates: pln-deadline, ce-overdue, retention-release, portal-invite, cis-return-due | supabase/functions/send-notification-email/ (new) | workspace_settings.resend_api_key | None | Manual invoke → email | Emails sent via Resend for critical notifications | ⏳ |
| MD-P19-T03 | Notification preferences page | /workspace/settings/notifications: per workspace toggle on/off each notification type. Channel preferences: in-app only / + email / + email + WhatsApp. BYO channels shown only if credentials configured | src/app/(app)/workspace/settings/page.tsx (new tab) | workspace_settings.notification_prefs JSONB | Preferences form | Toggle → save | Notification preferences save correctly | ⏳ |
| MD-P19-T04 | WhatsApp via Twilio (BYO) | /workspace/settings/notifications/integrations: Twilio Account SID, Auth Token, WhatsApp From Number. When saved: Edge Function whatsapp-notifier. On urgency=critical notifications: WhatsApp message to configured numbers | src/app/(app)/workspace/settings/page.tsx, supabase/functions/whatsapp-notifier/ | workspace_settings.twilio_creds (encrypted) | Credential fields + test | Save → "Send test" → received | WhatsApp delivered for critical notifications | ⏳ |
| MD-P19-T05 | Slack integration (BYO) | Slack Webhook URL in integration settings. On notifications type IN ('ce_deemed_acceptance_risk', 'pln_cutoff_passed', 'retention_overdue'): POST to Slack webhook with Block Kit message | src/app/(app)/workspace/settings/page.tsx, supabase/functions/slack-notifier/ | workspace_settings.slack_webhook (encrypted) | Webhook URL + test | Configure → test → Slack message | Slack message with Block Kit format delivered | ⏳ |
| MD-P19-T06 | Teams integration (BYO) | Microsoft Teams Webhook URL. Sends Adaptive Card with title, project, description, action button | workspace_settings.teams_webhook + teams-notifier edge function | workspace_settings.teams_webhook | Webhook URL + test | Configure → test → Teams message | Teams adaptive card delivered | ⏳ |
| MD-P19-T07 | Xero OAuth 2.0 integration | "Connect to Xero" → OAuth 2.0 PKCE flow. Store tokens in workspace_settings. Token refresh edge function (auto-refresh 30 min before expiry). Show connected org name + disconnect button | src/app/(app)/workspace/settings/page.tsx, supabase/functions/xero-token-refresh/ | workspace_settings.xero_tokens (encrypted) | OAuth connect flow | Connect → Xero org name shown | Xero OAuth completes; org name displayed | ⏳ |
| MD-P19-T08 | Xero: export payment applications | "Send to Xero" on /applications/[id] (when connected). Creates Xero Invoice for certified amount. Maps: project → Xero contact, certified amount → invoice line. Application → draft invoice; certification → approved invoice; payment → mark paid | src/app/(app)/applications/[applicationId]/page.tsx, supabase/functions/xero-create-invoice/ | applications SELECT | Send to Xero button | Click → Xero invoice created | Invoice appears in Xero | ⏳ |
| MD-P19-T09 | Xero: sync CIS deductions | When CIS monthly return submitted: create Xero Tax Liability entries for CIS deductions. Summary Xero bill for CIS deductions by month | supabase/functions/xero-cis-sync/ | cis_monthly_returns + Xero API | None | Submit CIS → Xero sync | CIS deductions appear in Xero | ⏳ |
| MD-P19-T10 | Sage Connect placeholder | Sage Accounting section in integration settings. Fields: Sage Client ID + Client Secret (BYO). Note: "Sage Connect sends certified amounts to Sage." If not implemented: "Coming Soon" badge | src/app/(app)/workspace/settings/page.tsx | workspace_settings.sage_creds | Coming soon placeholder | Sage section visible | Sage section shows correctly | ⏳ |
| MD-P19-T11 | Integration health admin dashboard | Wire /admin/integrations to real data: for each workspace with integrations — last successful API call, last error, token expiry, connection status. "Test Integration" button per workspace | src/app/admin/integrations/page.tsx | workspace_settings SELECT (service role) | Health table with status chips | Load admin → health data | Admin integration dashboard shows real status | ⏳ |
| MD-P19-T12 | BCIS indices placeholder (BYO) | BCIS API key section in /workspace/settings. When configured: fluctuations module (P12) pulls live indices. Without key: manual entry only with note "BCIS subscription required" | src/app/(app)/workspace/settings/page.tsx | workspace_settings.bcis_api_key | Credential field | Save key → validates | BCIS key saved; manual entry still works without | ⏳ |
| MD-P19-T13 | Creditsafe credit check (BYO) | Creditsafe API key + username in supplier KYC settings. When configured: "Run Credit Check" on supplier detail → pulls Creditsafe report. Shows: credit score, credit limit, payment behaviour | src/app/(app)/suppliers/[supplierId]/page.tsx + workspace/settings | suppliers.credit_check_data JSONB | Credit check section | Run check → data shown | Credit check data stored and shown | ⏳ |
| MD-P19-T14 | Weekly commercial digest email | Weekly cron (Monday 07:00): Resend email to workspace admin. Digest: open CEs, PLN deadlines this week, retention releases due, CIS return due, low-margin projects, overdue tasks | supabase/functions/weekly-digest/ + cron | Multiple queries + Resend | None | Manual invoke → email | Weekly digest delivered with correct data | ⏳ |
| MD-P19-T15 | Notification deduplication | Before createNotification(): check if same type + resource_id exists in last 24h → do not create duplicate. Prevents nightly cron flooding identical alerts | src/lib/notifications.ts | notifications SELECT before INSERT | None | Run cron twice → 1 notification | Deduplication prevents duplicate notifications | ⏳ |
| MD-P19-T16 | Push notification VAPID setup | Configure VAPID keys for Web Push. Register push subscription in app (permission prompt on first login). Store subscription endpoint in profiles.push_subscription JSONB. Edge function uses this for push | src/lib/push-notifications.ts (new) | profiles.push_subscription JSONB | Permission prompt | Grant permission → subscription stored | Push subscription stored in profiles | ⏳ |
| MD-P19-T17 | Admin: bulk notification tester | "Send Test Notification" on /admin workspace detail page. Select notification type → creates test notification. Useful for QA and workspace setup | src/app/admin/workspaces/[id]/page.tsx | notifications INSERT | Test button | Click → notification appears | Test notification appears in workspace | ⏳ |
| MD-P19-T18 | Integration error logging | All integration calls (Xero, Twilio, HMRC, CH) log failures to integration_errors table: workspace_id, service, error_code, error_message, created_at. Admin integration dashboard reads this table | integration_errors table + all edge functions | integration_errors INSERT | None | Fail Xero call → error logged | Integration errors logged and visible in admin | ⏳ |
| MD-P19-T19 | TypeScript check after P19 | `npx tsc --noEmit` — 0 errors | All P19 files | None | None | 0 TS errors | 0 errors | ⏳ |
| MD-P19-T20 | P19 integration regression test | Test: notifications bell, Resend email, WhatsApp (test creds), Xero create invoice, Slack notification. V1 regression | All integration touchpoints | None | Integration tests | All wired integrations work | ⏳ |

### Phase Release Gate
- [ ] Notification bell shows real unread count
- [ ] Resend email delivers for critical notifications
- [ ] Xero OAuth connects and creates invoice
- [ ] WhatsApp delivers with BYO Twilio credentials
- [ ] Admin integration dashboard shows real status
- [ ] Weekly email digest delivers correctly
- [ ] TypeScript: 0 errors

---

## Phase 20 — Final Release Readiness, Security, QA And Launch

### Goal
Final security audit, accessibility audit, performance optimisation, complete regression testing across all 400 tasks, and launch preparation. Nothing new is built — everything is hardened and verified.

### Dependencies
All 19 prior phases complete. All phase release gates passed.

### 20 Tasks

| Task ID | Task Name | Description | Files/Routes | Supabase/RLS | UI/UX | Tests | Acceptance Criteria | Status |
|---------|-----------|-------------|-------------|-------------|-------|-------|--------------------|----|
| MD-P20-T01 | Final TypeScript audit | `npx tsc --noEmit` across entire codebase. Zero errors required. Fix any errors from any phase. Record in BUILD_TEST_MATRIX.md | All src/** | None | None | 0 TS errors | TypeScript: 0 errors confirmed | ⏳ |
| MD-P20-T02 | Final Next.js build audit | `npm run build` — clean build, 0 warnings, 0 errors. Check bundle sizes. Fix any SSR/hydration issues | All pages | None | None | Clean build | npm run build: 0 errors | ⏳ |
| MD-P20-T03 | Full RLS security audit | (1) List all tables in public schema, (2) Confirm every table has RLS enabled, (3) Test cross-workspace isolation with 2 test accounts, (4) Confirm 0 uses of get_user_workspace_ids() (doesn't exist), (5) Verify portal routes cannot access workspace data without valid token | All Supabase tables | All RLS policies | None | RLS test script | 0 tables without RLS; 0 cross-workspace leaks | ⏳ |
| MD-P20-T04 | Immutability verification | Test all immutable documents: PLN PDF, PC certificate, Suspension notice, MGD certificate, CIS returns. Attempt Storage delete → confirm 403. Attempt update issued_at → confirm rejection | All immutable entities | legal-notices bucket policy | None | Immutability tests | All immutable documents reject deletion and edit | ⏳ |
| MD-P20-T05 | HGCRA calculation accuracy | 10 real-world test scenarios: PLN cutoff = final_date_for_payment - prescribed_period_days, S112 eligibility, 7-day notice period, EOT entitlement = days_suspended | src/lib/hgcra/payment-timeline.ts | None | None | 10 test scenarios | 10/10 HGCRA scenarios correct | ⏳ |
| MD-P20-T06 | NEC4 CE calculation accuracy | 5 CE lifecycle scenarios: quotation due = instruction + 21 working days, acceptance due = submission + 14 working days, deemed accepted = acceptance due + 1 day, all 21 × 60.1 clauses correct risk party | src/lib/nec4/ce-state-machine.ts | None | None | 5 CE scenarios | 5/5 NEC4 scenarios correct | ⏳ |
| MD-P20-T07 | CIS calculation accuracy | 8 scenarios: net=20%×(gross-materials), higher=30%×(gross-materials), gross=0%, unverified=30%, DRC flag on VAT-registered specified supplies | src/lib/cis/deduction-calculator.ts | None | None | 8 CIS scenarios | 8/8 CIS scenarios correct | ⏳ |
| MD-P20-T08 | Full mobile audit (375px) | Every major page at 375px. Required: no horizontal scroll, all text readable, all buttons tappable (min 44×44px), forms usable, tables scroll or use card layout | All app pages | None | 375px viewport | Each page at 375px | 0 horizontal scroll issues; all buttons tappable | ⏳ |
| MD-P20-T09 | Full tablet audit (768px) | Every major page at 768px. Sidebar behaviour, two-column layouts, table column visibility | All app pages | None | 768px viewport | Each page at 768px | All pages correct at 768px | ⏳ |
| MD-P20-T10 | Accessibility audit | axe-core on: /home, /projects, /changes, /applications, /suppliers. Fix: ARIA labels, image alt text, form labels, focus rings, colour contrast ≥ 4.5:1 | All major pages | None | axe-core + tab test | axe-core scan | 0 critical/serious axe-core violations | ⏳ |
| MD-P20-T11 | Performance audit | Lighthouse on: /home, /projects, /projects/[id], /applications. Target: Performance ≥ 85, Accessibility ≥ 90. Fix: lazy-load images (next/image), virtualise long lists, defer non-critical JS | All major pages | None | Lighthouse | Lighthouse scores | Lighthouse Performance ≥ 85 | ⏳ |
| MD-P20-T12 | Console error audit | Browser DevTools on every major page. Filter: Errors only. Expected: 0. Fix: undefined properties, 404 requests, React key warnings | All major pages | None | DevTools | Console check | 0 console errors on all tested pages | ⏳ |
| MD-P20-T13 | Dead button final verification | Audit BUILD_BUTTON_AND_ROUTE_AUDIT.md. Every button must be Wired or explicitly removed. Zero "Partial" or "Dead" buttons in Production | BUILD_BUTTON_AND_ROUTE_AUDIT.md | None | All buttons | Button test | 0 dead buttons in final build | ⏳ |
| MD-P20-T14 | V1 complete regression | Smoke test all V1 features: home, projects, changes, applications, CVR, final accounts, reports, evidence, drawings, schedule, tasks, suppliers, contacts, BIM. All must work | All V1 routes | None | Full browser test | Regression | All V1 features work correctly | ⏳ |
| MD-P20-T15 | OWASP Top 10 review | (1) No SQL injection (parameterised Supabase queries), (2) No XSS (React escapes; 0 dangerouslySetInnerHTML), (3) No IDOR (RLS enforces), (4) HMRC/Twilio credentials never in client bundle, (5) Portal tokens cryptographically random UUID | All edge functions, API routes, client components | None | None | OWASP checklist | 0 OWASP Top 10 vulnerabilities | ⏳ |
| MD-P20-T16 | Update all BUILD_ control documents | Update all 8 BUILD_ documents to final state: progress log (all 20 phases complete), test matrix (all results), risk register (all mitigated), release gates (all passed), Supabase matrix (all tables live), UI matrix (all routes ✅ Verified) | All docs/BUILD_*.md | None | None | None | All 8 documents reflect final state | ⏳ |
| MD-P20-T17 | Feature flag final review | Review all V2 feature flags. All default false for new workspaces. Existing workspaces: flags enabled per plan. Document flag → plan mapping | src/lib/feature-flags.ts | workspace_feature_flags | None | Flag audit | Feature flag → plan mapping documented | ⏳ |
| MD-P20-T18 | Environment variable audit | Audit all .env references. All required vars in .env.example. No secrets in client bundle (NEXT_PUBLIC_ vars are public). Supabase service role key only in Edge Functions | All edge functions + next.config.ts | None | None | Env var audit | 0 secrets in client bundle; all vars documented | ⏳ |
| MD-P20-T19 | Prepare launch checklist | Create docs/LAUNCH_CHECKLIST.md: Supabase (RLS, no test data, backups), Vercel (domain, env vars), DNS (custom domain), Resend (production API key, domain verified), Monitoring (alerts on), onboarding guide | docs/LAUNCH_CHECKLIST.md (new) | None | None | Checklist complete | Launch checklist document completed | ⏳ |
| MD-P20-T20 | Final sign-off — all 400 tasks reviewed | Review all 400 tasks across all 20 phases. Confirm 0 tasks ⏳ Pending (all ✅ Complete or explicitly deferred with reason). BUILD_PROGRESS_LOG.md: P20 = Complete. MeasureDeck V2 Enterprise Release = READY | All BUILD_TODO_20x20.md phases | None | None | Final review | 400/400 tasks documented | ⏳ |

### Phase Release Gate — FINAL RELEASE CRITERIA
- [ ] TypeScript: 0 errors
- [ ] npm run build: clean
- [ ] RLS: 0 tables without policy; 0 cross-workspace leaks
- [ ] All immutable documents reject deletion/edit
- [ ] HGCRA calculations: 10/10 correct
- [ ] NEC4 calculations: 5/5 correct
- [ ] CIS calculations: 8/8 correct
- [ ] Mobile: 0 horizontal scroll at 375px
- [ ] Accessibility: 0 critical axe-core violations
- [ ] Lighthouse Performance ≥ 85
- [ ] 0 console errors
- [ ] 0 dead buttons
- [ ] V1 complete regression: all features working
- [ ] 0 OWASP Top 10 violations
- [ ] 0 secrets in client bundle
- [ ] All 8 BUILD_ documents updated
- [ ] Launch checklist complete
- [ ] 400/400 tasks documented

---

## Task Count Verification

| Phase | Task Count | Status |
|-------|-----------|--------|
| P01 — Codebase Audit | 20 | ✅ Defined |
| P02 — Architecture Guardrails | 20 | ✅ Defined |
| P03 — Supabase Schema | 20 | ✅ Defined |
| P04 — Component Library | 20 | ✅ Defined |
| P05 — Global UI | 20 | ✅ Defined |
| P06 — Projects Commercial | 20 | ✅ Defined |
| P07 — NEC4 CE Engine | 20 | ✅ Defined |
| P08 — Early Warnings | 20 | ✅ Defined |
| P09 — HGCRA Compliance | 20 | ✅ Defined |
| P10 — CIS/HMRC | 20 | ✅ Defined |
| P11 — Supply Chain KYC | 20 | ✅ Defined |
| P12 — Retention/EVM | 20 | ✅ Defined |
| P13 — PC/Snagging | 20 | ✅ Defined |
| P14 — Dayworks/PWA | 20 | ✅ Defined |
| P15 — AI Intelligence | 20 | ✅ Defined |
| P16 — Client Portal | 20 | ✅ Defined |
| P17 — Analytics/Board Packs | 20 | ✅ Defined |
| P18 — Adjudication/Delay | 20 | ✅ Defined |
| P19 — Integrations | 20 | ✅ Defined |
| P20 — Release Readiness | 20 | ✅ Defined |
| **TOTAL** | **400** | **All tasks defined** |

---

## Implementation Order

**Immediate next:** Begin Phase 02 — Architecture Guardrails. Phase 01 is ✅ Complete.

**Sequence:** P01 ✅ → P02 → P03 → P04 → P05 → P06 → P07 → P08 → P09 → P10 → P11 → P12 → P13 → P14 → P15 → P16 → P17 → P18 → P19 → P20

**Rule:** Never skip ahead — each phase depends on schema, components, and infrastructure from prior phases.

# MeasureDeck In-Depth Build Audit

Date: 13 June 2026  
Product: MeasureDeck  
Company context: Blackwellen SaaS build studio  
Repo: `measure-deck-final-release-v.1.0`

## 1. Executive Summary

MeasureDeck is a broad UK construction commercial management SaaS product with a large amount of production-shaped UI already present. The app includes marketing pages, legal pages, auth flows, an authenticated product shell, admin screens, projects, change events, payment applications, CVR, evidence, drawings, BIM, final accounts, reports, suppliers, contacts, tasks, schedule, inbox, billing, AI copilot, and platform settings.

The current build is best described as a strong founder/demo build with serious launch-readiness gaps. It has enough surface area to demonstrate the intended product vision, but the implementation is not yet reliable enough for paying customer data. The main blocker is not visual scope. The main blocker is that frontend table names, migrations, RLS policies, and route wiring are inconsistent in several core areas.

Current suitability:

- Suitable for internal demo walkthroughs.
- Suitable for product direction validation.
- Suitable for founder-led sales discovery if clearly positioned as beta.
- Not suitable for production customers yet.
- Not suitable for real commercial records, payment applications, evidence archives, or tenant-sensitive data until schema, RLS, billing, storage, and audit gaps are fixed.

Top launch blockers:

1. Production build fails because BIM imports `@react-three/drei` and `@react-three/fiber`, but the installed dependency tree does not contain them.
2. Lint fails with `59 errors` and `303 warnings`.
3. The code queries tables that are not created by the migrations, including `profiles`, `applications`, `changes`, `audit_logs`, `schedule_events`, and `report_packs`.
4. The migrations are internally inconsistent: the base schema defines `workspace_members`, while later migrations and some code expect `workspace_memberships`.
5. Billing is not wired end to end. Stripe env vars and UI labels exist, but no checkout, portal, subscription sync, or webhook route was found.
6. Email is not wired end to end. Resend env vars are documented, but no transactional email routes/templates were found.
7. Export/report generation is not wired. Report tables and UI exist, but PDF/XLSX export pipelines were not found.
8. Audit logging is a table, not a complete system. Automatic audit event capture was not found.
9. AI chat streams responses, but usage metering, persistent history, tenant-aware controls, and rate limiting are not fully implemented.
10. Storage policies are too broad for a tenant-sensitive construction evidence product.

Estimated effort to launch readiness: Large, unless the launch scope is narrowed to one paid workflow.

Recommended narrow launch workflow:

Project setup -> change event -> evidence upload -> payment application -> export/shareable report.

## 2. Market And Positioning

One-sentence positioning:

MeasureDeck is a UK-contract-native commercial management platform for quantity surveyors and commercial teams who need to control change events, payment applications, CVRs, evidence, and final accounts without relying on fragmented spreadsheets.

Target customer segments:

- UK specialist subcontractors with 10-250 staff.
- SME main contractors with commercial teams managing multiple live projects.
- Quantity surveyors, senior QSs, commercial managers, commercial directors, and operations leaders.
- Contractors working under JCT, NEC3, NEC4, and related UK construction payment workflows.

Top painful problems, ranked:

1. Commercial records are split across spreadsheets, inboxes, shared drives, drawings, photos, and disconnected systems, making claims hard to prove.
2. Payment applications, notices, certifications, retention, and final account positions are error-prone and deadline-sensitive.
3. CVR and change-event reporting is slow, inconsistent, and often out of date by the time leadership sees it.

Why MeasureDeck can win:

- UK commercial workflow focus instead of generic construction project management.
- JCT/NEC terminology and workflows are visible in the product direction.
- Evidence, drawings, changes, applications, CVR, and final accounts are intended to live in one workspace.
- AI copilot can become commercially useful if grounded in live project records and constrained by legal/commercial disclaimers.
- The product can sell on speed and clarity for QS teams that do not want a heavyweight ERP implementation.

Must-have workflows that prove value in the first 10 minutes:

1. Create a project with contract metadata, retention, payment terms, and programme dates.
2. Add a change event with value, programme impact, status, and linked evidence.
3. Upload an evidence file and link it to a change/application.
4. Create a payment application from line items, variations, and retention.
5. View a dashboard showing outstanding applications, unresolved changes, margin/CVR signals, and missing evidence.
6. Export or preview a professional pack suitable for a commercial meeting.

## 3. Scope And Build Reality

### 3.1 What Exists Today

The repo contains a substantial Next.js 16 App Router application under `src/app`.

Major frontend areas present:

- Marketing home and feature pages: `src/app/page.tsx`, `src/app/(marketing)`
- Legal pages: terms, privacy, cookies, acceptable use, DPA, subprocessors, AI disclaimer, refund/cancellation policy
- Auth pages: login, signup, MFA, onboarding, forgot password, reset password
- Product shell: `src/app/app/layout.tsx`, `src/app/app/shell-client.tsx`
- Admin shell: `src/app/admin/layout.tsx`, `src/app/admin/shell-client.tsx`
- App modules: projects, changes, applications, CVR, evidence, drawings, BIM, final accounts, reports, schedule, contacts, suppliers, tasks, inbox, settings, billing, account
- Admin modules: dashboard, users, workspaces, subscriptions, security, release, storage, files, integrations, health, plans, legal, audit, reports, projects, tasks, suppliers
- Shared UI: modals, status chips, empty states, loading skeletons, tabs, page headers, search input, view switcher
- Wizards: project, change, application, evidence upload, drawing upload, BIM model, CVR period, final account, report builder, supplier, task

Backend/data layer present:

- Supabase client helpers:
  - `src/lib/supabase/client.ts`
  - `src/lib/supabase/server.ts`
  - `src/lib/supabase/admin.ts`
  - `src/lib/supabase/middleware.ts`
- Auth/session proxy:
  - `src/proxy.ts`
- Supabase migrations:
  - `supabase/migrations/001_initial_schema.sql`
  - `supabase/migrations/002_measuredeck_tables.sql`
  - `supabase/migrations/003_schema_expansion.sql`
- One API route:
  - `src/app/api/ai/chat/route.ts`

Core tables in the base migration include:

- `workspaces`
- `workspace_members`
- `user_profiles`
- `projects`
- `project_contracts`
- `change_events`
- `change_event_pricing`
- `payment_applications`
- `payment_application_lines`
- `payment_certifications`
- `payment_records`
- `cvr_periods`
- `cvr_lines`
- `cvr_risks`
- `final_accounts`
- `final_account_lines`
- `evidence_files`
- `evidence_links`
- `reports`
- `report_exports`
- `suppliers`
- `contacts`
- `tasks`
- `task_comments`
- `task_links`
- `schedule_items`
- `site_map_layers`
- `site_map_markers`
- `drawing_register`
- `drawing_revisions`
- `bim_models`
- `ai_action_requests`
- `ai_usage_ledger`
- `inbox_threads`
- `inbox_messages`
- `notifications`
- `audit_log`
- `feature_flag_overrides`

Storage buckets defined:

- `evidence`
- `drawings`
- `avatars`
- `workspace-logos`
- `reports`

### 3.2 Demo Only Or UI Without Wiring

The following areas appear demo-only, incomplete, or partially wired:

- Stripe billing screens, subscription screens, and pricing controls.
- Billing portal and payment method management.
- Stripe checkout/session creation.
- Stripe webhook handling.
- Email notifications and transactional email flows.
- Report PDF/XLSX generation.
- Real export/download actions.
- Some admin metrics and operational dashboards.
- Some release-readiness and health check screens.
- AI usage ledger and persistent AI conversation history.
- AI action execution beyond chat response.
- Inbox/notifications in places where seed/mock data or field mismatches appear.
- Real-time updates via Supabase Realtime.
- Workspace member invitations and permission lifecycle.
- Full audit trail generation.
- Backup, data export, deletion request, and retention workflows.

### 3.3 Missing But Assumed

These capabilities are expected for a launch-ready SaaS but were not found as complete implementations:

- Stripe checkout endpoint.
- Stripe billing portal endpoint.
- Stripe webhook endpoint with signature verification.
- Subscription status sync into workspace/account records.
- Trial lifecycle handling.
- Per-plan feature/usage limits enforced server-side.
- Invite emails.
- Password reset and auth emails beyond Supabase defaults/custom UI.
- Application/export emails.
- Report PDF/XLSX generation.
- File scanning or malware controls.
- Workspace-scoped storage object path policies.
- Audit triggers or central app audit writer.
- Full role-based permissions.
- Admin impersonation controls and logs.
- Customer data export.
- Account/workspace deletion workflow.
- Automated backups or restore runbook in repo docs.
- RLS test suite.
- E2E smoke tests.
- Observability/error tracking.
- Production deployment pipeline checks.

## 4. Architecture Map

### 4.1 Frontend Structure

The app uses Next.js 16.2.9 with React 19.2.4. The local `AGENTS.md` warns that this is not the familiar Next.js version and that local docs under `node_modules/next/dist/docs` must be used before code changes.

Key routes:

- `/`: marketing/product home
- `/features`: product features
- `/pricing`: pricing
- `/demo`: demo request
- `/waitlist`: waitlist
- `/security`: security marketing page
- `/contact`: contact
- `/login`, `/signup`, `/forgot-password`, `/reset-password`, `/mfa`, `/onboarding`: auth
- `/app/home`: authenticated home/dashboard
- `/app/projects`: project list
- `/app/projects/[projectId]`: project detail
- `/app/projects/[projectId]/edit`: project edit
- `/app/changes`: change events list
- `/app/changes/[changeId]`: change event detail
- `/app/applications`: payment applications list
- `/app/applications/[applicationId]`: application detail
- `/app/cvr`: CVR landing
- `/app/cvr/[projectId]`: project CVR
- `/app/evidence`: evidence library
- `/app/evidence/upload`: evidence upload
- `/app/evidence/[evidenceId]`: evidence detail
- `/app/drawings`: drawing register
- `/app/drawings/[drawingId]`: drawing detail
- `/app/drawings/[drawingId]/viewer`: drawing viewer
- `/app/bim/models`: BIM models
- `/app/bim/[modelId]`: BIM model detail
- `/app/final-accounts`: final accounts
- `/app/final-accounts/new`: new final account
- `/app/final-accounts/[finalAccountId]`: final account detail
- `/app/reports`: reports
- `/app/reports/[reportId]`: report detail
- `/app/schedule`: schedule
- `/app/schedule/gantt`: Gantt
- `/app/schedule/[scheduleItemId]`: schedule item detail
- `/app/tasks`: tasks
- `/app/tasks/[taskId]`: task detail
- `/app/suppliers`: suppliers
- `/app/suppliers/[supplierId]`: supplier detail
- `/app/contacts`: contacts
- `/app/contacts/new`: new contact
- `/app/contacts/[contactId]`: contact detail
- `/app/inbox`: inbox
- `/app/billing`: billing
- `/app/settings`: settings
- `/app/workspace/settings`: workspace settings
- `/app/account`: account

Admin routes:

- `/admin`
- `/admin/users`
- `/admin/users/[userId]`
- `/admin/workspaces`
- `/admin/workspaces/[workspaceId]`
- `/admin/subscriptions`
- `/admin/plans`
- `/admin/security`
- `/admin/storage`
- `/admin/files`
- `/admin/integrations`
- `/admin/feature-flags`
- `/admin/release`
- `/admin/health`
- `/admin/audit`
- `/admin/legal`
- `/admin/reports`
- `/admin/projects`
- `/admin/drawings`
- `/admin/suppliers`
- `/admin/tasks`
- `/admin/modules`
- `/admin/settings`
- `/admin/inbox`
- `/admin/ai-usage`
- `/admin/commercial`
- `/admin/roles`

### 4.2 Backend Structure

Only one app API route was found:

- `src/app/api/ai/chat/route.ts`

This route:

- Reads `OPENAI_API_KEY`.
- Accepts a JSON body with `messages` and optional `context`.
- Calls `https://api.openai.com/v1/chat/completions`.
- Streams the response as `text/event-stream`.
- Uses `OPENAI_MODEL` or falls back to `gpt-4o-mini`.

Not found:

- `/api/stripe/checkout`
- `/api/stripe/portal`
- `/api/stripe/webhook`
- `/api/reports/export`
- `/api/email/*`
- `/api/invites/*`
- `/api/uploads/process`
- `/api/audit/*`
- `/api/admin/*`

### 4.3 Auth And Tenancy Model

The intended model is workspace-based tenancy.

Base migration:

- Creates `workspaces`.
- Creates `workspace_members`.
- Creates `get_user_workspace_ids()`.
- Applies RLS policies using `workspace_id = ANY(get_user_workspace_ids())`.

The product shell checks the current Supabase user in `src/app/app/layout.tsx`.

The proxy in `src/proxy.ts`:

- Refreshes Supabase auth session cookies.
- Redirects unauthenticated `/app/*` users to `/login`.
- Redirects unauthenticated `/admin/*` users to `/login`.
- Checks admin access by querying `profiles`.

Problem:

- The base migration creates `user_profiles`, not `profiles`.
- Admin routes and account pages query `profiles`.
- Later code expects `workspace_memberships`, not `workspace_members`.

This means the auth and tenancy model is conceptually present, but implementation naming drift can break production access control.

### 4.4 Billing Model

Current evidence:

- Stripe dependencies and env vars are listed in `package.json`, `README.md`, and `.env.example`.
- Pricing and billing UI screens exist.
- UI copy says Stripe manages payment methods.
- Admin screens mention Stripe subscriptions and webhook readiness.

Not found:

- Checkout session creation.
- Customer portal session creation.
- Stripe webhook route.
- Webhook signature verification.
- Subscription table or canonical subscription state model in migrations.
- Plan enforcement around routes/features/limits.

Status: UI/demo only for launch purposes.

## 5. Feature Inventory

| Feature / Module | Current Status | Paths / Evidence | Key Tables | Known Issues |
|---|---|---|---|---|
| Marketing site | Mostly working static | `src/app/page.tsx`, `src/app/(marketing)` | None | Needs final offer/pricing/proof assets |
| Legal pages | Mostly working static | `terms`, `privacy`, `cookies`, `DPA`, `AUP`, `AI disclaimer` | None | Needs legal review and jurisdiction confirmation |
| Auth UI | Partially working | `src/app/(auth)` | Supabase Auth, `user_profiles` intended | Lint errors; profile table mismatch |
| Session proxy | Partially working | `src/proxy.ts` | `profiles` queried | Migration defines `user_profiles`; admin guard likely broken |
| Workspaces | Partially working | app/admin workspace pages | `workspaces`, `workspace_members` | Code/migrations also expect `workspace_memberships` |
| Projects | Partially working | `src/app/app/projects` and wizard | `projects`, `project_contracts` | Needs end-to-end smoke test and schema alignment |
| Change events | Broken/partial | `src/app/app/changes`, `change-wizard.tsx` | `change_events`, `change_event_pricing` | Some pages query `changes`, which is not in migrations |
| Payment applications | Broken/partial | `src/app/app/applications`, `application-wizard.tsx` | `payment_applications`, `payment_application_lines` | UI/wizard query `applications`; migration defines `payment_applications` |
| CVR | Partial | `src/app/app/cvr` | `cvr_periods`, `cvr_lines`, `cvr_risks` | Needs live cost/application aggregation |
| Final accounts | Partial | `src/app/app/final-accounts` | `final_accounts`, `final_account_lines` | Wizard references `final_account_line_items`, not base table `final_account_lines` |
| Evidence | Partial | `src/app/app/evidence`, upload wizard | `evidence_files`, `evidence_links`, storage `evidence` | Storage RLS too broad; needs path isolation and scanning policy |
| Drawings | Partial | `src/app/app/drawings` | `drawing_register`, `drawing_revisions`, storage `drawings` | Needs robust viewer/export/version controls |
| BIM | Build-blocking partial | `src/components/bim` | `bim_models` | Missing installed packages block production build |
| Suppliers | Partial | `src/app/app/suppliers` | `suppliers`, `contacts` | Compliance fields exist; workflows need verification |
| Contacts | Partial | `src/app/app/contacts` | `contacts` | Needs role/tenant tests |
| Tasks | Partial | `src/app/app/tasks` | `tasks`, `task_comments`, `task_links` | Detail page updates non-schema fields like checklist/comments in places |
| Schedule | Partial/broken | `src/app/app/schedule` | `schedule_items` | Some page code queries `schedule_events`, not in migrations |
| Reports | UI/demo partial | `src/app/app/reports` | `reports`, `report_exports` | Detail page queries `report_packs`; no export generation found |
| Inbox/notifications | Partial | `src/app/app/inbox`, AI bubble inbox | `notifications`, `inbox_threads`, `inbox_messages` | Field mismatch risk: code uses `read`/`archived`; schema uses `is_read`, no `archived` |
| AI copilot | Partially working | `src/app/api/ai/chat/route.ts`, `src/components/ai-bubble` | `ai_action_requests`, `ai_usage_ledger` | Chat streams, but usage ledger/history/rate limits not complete |
| Billing | UI/demo only | `src/app/app/billing`, admin subscriptions/plans | Not clearly defined | No Stripe route/webhook found |
| Admin dashboard | Partial/demo | `src/app/admin` | various | Static metrics, schema mismatches, lint errors |

## 6. Data Model Summary

The intended data model is workspace-scoped.

Core relationships:

- `workspaces` own almost all business records.
- `workspace_members` link Supabase auth users to workspaces.
- `projects` belong to workspaces.
- `project_contracts` belong to projects/workspaces.
- `change_events` belong to projects/workspaces.
- `change_event_pricing` belongs to change events/workspaces.
- `payment_applications` belong to projects/workspaces.
- `payment_application_lines` belong to payment applications/workspaces.
- `payment_certifications` and `payment_records` belong to payment applications/workspaces.
- `cvr_periods` belong to projects/workspaces.
- `cvr_lines` and `cvr_risks` belong to CVR periods/workspaces.
- `final_accounts` belong to projects/workspaces.
- `final_account_lines` belong to final accounts/workspaces.
- `evidence_files` belong to workspaces and optionally projects.
- `evidence_links` link evidence files to arbitrary records.
- `reports` and `report_exports` belong to workspaces.
- `suppliers` and `contacts` belong to workspaces.
- `tasks`, `task_comments`, and `task_links` belong to workspaces.
- `schedule_items` belong to workspaces and optionally projects.
- `drawing_register`, `drawing_revisions`, and `bim_models` belong to workspaces/projects.
- `ai_action_requests` and `ai_usage_ledger` belong to workspaces.
- `notifications` belong to users/workspaces.
- `audit_log` records actions by workspace/user/resource.

Critical schema drift:

- Code expects `profiles`; migration creates `user_profiles`.
- Code expects `applications`; migration creates `payment_applications`.
- Code expects `changes`; migration creates `change_events`.
- Code expects `audit_logs`; migration creates `audit_log`.
- Code expects `schedule_events`; migration creates `schedule_items`.
- Code expects `report_packs`; migration creates `reports`.
- Later migrations expect `workspace_memberships`; base migration creates `workspace_members`.
- Later migration `003_schema_expansion.sql` alters `applications`, but base migration creates `payment_applications`.
- Later migration adds `tasks.application_id REFERENCES applications(id)`, but base migration has no `applications` table.

## 7. Commercial And Revenue

### 7.1 Pricing Model

Suggested packaging for first paid launch:

Starter:

- Target: small specialist subcontractor.
- Price: GBP 79-129/user/month.
- Limits: 3-5 active projects, basic applications, evidence, tasks, reports.
- Trial: 14 days or founder-led pilot.

Professional:

- Target: QS teams and SME contractors.
- Price: GBP 149-249/user/month.
- Limits: more active projects, CVR, final accounts, drawings, advanced reports, AI allowances.
- Trial: founder-assisted onboarding.

Enterprise:

- Target: larger contractors, multi-workspace teams, stricter compliance.
- Price: custom, likely GBP 8k-30k+ ARR to start.
- Includes: onboarding, SSO roadmap, audit exports, custom templates, priority support, procurement/security review.

### 7.2 Expected ACV / ARPU

Initial self-serve ARPU target:

- GBP 100-200/user/month.

Assisted pilot ACV:

- GBP 3k-12k/year for small teams.
- GBP 12k-30k/year for stronger multi-project customers once billing/security/export readiness is mature.

### 7.3 Sales Motion

Recommended first motion:

- Assisted sales, not pure self-serve.
- Founder-led demos to QS/commercial managers.
- Beta onboarding with 3-5 carefully selected firms.
- Sell a narrow workflow first, not the whole platform.

Do not launch as a generic full construction ERP. Launch as:

The fastest way for UK QS teams to control change events, evidence, applications, and CVR without spreadsheet chaos.

### 7.4 Launch Offer

Day-one sellable offer:

- "MeasureDeck Commercial Control Beta"
- Includes setup for 1 workspace, up to 3 live projects, project/change/application/evidence workflow, and founder onboarding.
- Fixed beta price: GBP 500-1,500/month depending on team size and support intensity.
- Clear beta disclaimer: product is under active development and must be validated before relying on legal/commercial notices.

### 7.5 Sales Readiness Blockers

- Pricing must align to actual implemented limits.
- Demo data must be clean and realistic.
- A one-workflow demo script must be built.
- Landing page must distinguish beta from production readiness.
- Stripe checkout/portal must exist or invoices must be manual.
- Support route and SLA must be defined.
- Legal disclaimers must be reviewed.
- Security posture must be honest and documented.

## 8. Quality, Security, And Compliance

### 8.1 Required Security Standard

Minimum launch standard:

- Workspace tenant isolation proven with tests.
- Private storage for evidence, drawings, reports.
- Workspace-scoped storage object paths.
- Least-privilege service role usage.
- No service role in browser.
- Stripe webhook signature verification.
- AI endpoint authentication and rate limits.
- Audit log for key commercial actions.
- Data deletion/export process.
- Backups documented.

Future enterprise standard:

- ISO 27001-aligned controls.
- SOC 2-style control mapping.
- SSO/SAML.
- SCIM or enterprise user lifecycle controls.
- DPA and subprocessors maintained.
- Security questionnaire pack.

### 8.2 RLS / Tenant Isolation Status

Positive:

- RLS is enabled on many tables.
- A workspace membership helper exists in the base migration.
- Policies generally intend to restrict records to user workspace IDs.

Risk:

- Later migrations reference `workspace_memberships`, which does not exist in the base schema.
- App code and migrations disagree on table names.
- Storage policies are broad: authenticated users can select/upload into private buckets without obvious workspace path enforcement.
- Insert policies like `workspace_insert WITH CHECK (TRUE)` and `wm_insert WITH CHECK (TRUE)` need review before production.

Status: conceptually present but not proven safe.

### 8.3 Audit Logging Needs

Audit must cover:

- Workspace created/updated/deleted.
- User invited, role changed, removed.
- Project created/updated/archived.
- Change event created/approved/rejected/submitted.
- Application created/submitted/certified/disputed.
- Evidence uploaded/deleted/linked/unlinked.
- Drawing revision uploaded/current revision changed.
- Final account submitted/agreed/settled/disputed.
- Billing subscription created/changed/cancelled.
- AI action generated or accepted.
- Admin actions.

Current status:

- `audit_log` table exists.
- Automatic audit triggers or a central app-level audit writer were not found.

### 8.4 Backup, Export, And Deletion Policy Requirements

Needed before launch:

- Daily Supabase backup confirmation and restore test process.
- Customer-level data export process.
- Workspace deletion process with confirmation and retention period.
- Evidence/report file deletion process.
- Support process for subject access/deletion requests.
- Clear retention policy for audit logs and legal/commercial records.

### 8.5 Legal Disclaimers Required

Product-specific disclaimers:

- AI output is assistance only and not legal, financial, or professional advice.
- Contract and notice workflows must be reviewed by qualified professionals before use.
- Payment application and notice deadlines remain the customer's responsibility.
- Evidence uploads may contain personal data; customer controls lawful basis and permissions.
- MeasureDeck does not guarantee adjudication, dispute, payment, or claim outcomes.
- Stripe handles payment card details.
- Subprocessors list must stay current.

Existing legal page coverage:

- Terms.
- Privacy.
- Cookies.
- Acceptable Use.
- Data Processing Addendum.
- Subprocessors.
- AI Disclaimer.
- Refund and cancellation policy.

Needs:

- Legal review.
- Company details confirmation.
- Jurisdiction assumptions.
- Beta terms if launching before full production readiness.

## 9. Verification Results

### 9.1 Lint

Command:

```bash
npm run lint
```

Result:

- Failed.
- `59 errors`.
- `303 warnings`.

Representative issues:

- `@typescript-eslint/ban-ts-comment`: `@ts-ignore` should be `@ts-expect-error`.
- `react-hooks/purity`: impure `Math.random()` during render.
- `@typescript-eslint/no-explicit-any`: multiple admin files.
- `react-hooks/set-state-in-effect`: synchronous state updates in effects.
- `react/no-unescaped-entities`: unescaped apostrophe in billing page.
- Many unused imports/variables.
- React Compiler warnings around React Hook Form `watch()`.

### 9.2 Production Build

Command:

```bash
npm run build
```

Result:

- Failed.

Build error:

- `Module not found: Can't resolve '@react-three/drei'`
- `Module not found: Can't resolve '@react-three/fiber'`

Relevant file:

- `src/components/bim/bim-viewer.tsx`

Follow-up command:

```bash
npm ls @react-three/drei @react-three/fiber
```

Result:

- Empty dependency tree.

Interpretation:

The packages are listed in `package.json`, but they are not installed in the current local dependency tree. The build cannot pass until the dependency install/package-lock state is fixed or BIM imports are removed/feature-gated in a way that does not compile unresolved modules.

## 10. Build-Stage Plan

### Stage 1: Initial Build Completeness

Objective:

Make the app buildable, lint-clean enough for production, and capable of completing one basic authenticated workflow.

What must be true when complete:

- `npm run build` passes.
- `npm run lint` passes or has an explicitly accepted warning baseline.
- Auth login/signup/onboarding paths work.
- `/app/home` loads for authenticated users.
- Project creation works against the live schema.
- Table names are canonical and consistent.

Top tasks:

1. Fix missing installed dependencies for BIM or temporarily feature-gate BIM without unresolved imports.
2. Choose canonical table names and update code/migrations accordingly.
3. Replace `profiles` vs `user_profiles` mismatch.
4. Replace `applications` vs `payment_applications` mismatch.
5. Replace `changes` vs `change_events` mismatch.
6. Replace `workspace_memberships` vs `workspace_members` mismatch.
7. Replace `audit_logs` vs `audit_log` mismatch.
8. Replace `schedule_events` vs `schedule_items` mismatch.
9. Replace `report_packs` vs `reports` mismatch.
10. Fix lint errors that block CI.

Dependencies:

- Decide canonical schema naming before changing pages.
- Regenerate Supabase TypeScript types after schema is stable.

Done criteria:

- Fresh clone -> `npm install` -> `npm run lint` -> `npm run build` succeeds.
- Test user can sign in and create a project.
- No core route crashes on missing table names.

Evidence:

- Build log.
- Lint log.
- Screenshot or Loom of login -> app home -> create project.

### Stage 2: Upgrade Depth Build

Objective:

Complete the first commercially valuable workflow end to end.

Recommended workflow:

Project -> change event -> evidence upload -> payment application -> report/export.

What must be true when complete:

- User can create and edit a project.
- User can create a change event for that project.
- User can upload and link evidence to the change.
- User can create a payment application that includes change/variation value.
- User can view the application detail page.
- User can generate/export a basic application or evidence pack.

Top tasks:

1. Implement canonical project CRUD.
2. Implement canonical change event CRUD.
3. Implement evidence upload with workspace path isolation.
4. Implement evidence linking to change/application records.
5. Implement payment application creation from schema-aligned fields.
6. Implement application detail view from live DB.
7. Add basic PDF or HTML print/export route.
8. Add audit events for create/update/submit actions.
9. Add empty/loading/error states for each workflow step.
10. Add smoke tests for the full workflow.

Done criteria:

- A beta customer can complete the workflow without developer intervention.
- Every write creates the expected DB rows under one workspace.
- A second workspace user cannot see the data.

Evidence:

- PR.
- E2E test result.
- Demo video.
- Sample exported pack.

### Stage 3: UI Design Upgrade

Objective:

Turn the app from broad demo UI into a premium, reliable QS work surface.

What must be true when complete:

- No alert/toast-only fake actions for core workflows.
- Dense commercial tables are readable and responsive.
- Mobile/tablet fallback is acceptable for site review.
- Core flows have consistent navigation and breadcrumbs.
- Empty/error/loading states are useful.

Top tasks:

1. Audit every primary CTA and classify real vs stub.
2. Replace alert stubs with real modals/routes or hide them.
3. Polish project, change, application, CVR, evidence, and reports views.
4. Standardise status chips and terminology.
5. Make tables usable on smaller screens.
6. Ensure forms have validation and useful error messages.
7. Add consistent save/submit/cancel states.
8. Improve admin distinction from customer app.
9. Validate first 10-minute demo flow visually.
10. Remove misleading UI for unavailable features.

Done criteria:

- A user can tell which features are live.
- No primary commercial action leads to a fake alert.
- Demo workflow feels coherent and premium.

Evidence:

- Screenshot set across desktop and mobile.
- CTA audit checklist.

### Stage 4: Commercial Depth And Gap Analysis

Objective:

Make the product sellable with clear packaging, pricing, usage limits, and onboarding.

What must be true when complete:

- Pricing page reflects actual product limits.
- Stripe or manual invoicing flow is operational.
- Workspace plan/subscription state is stored.
- Trial and cancellation states are handled.
- Day-one offer is clear.

Top tasks:

1. Define Starter/Professional/Enterprise limits.
2. Add subscription model to DB.
3. Implement Stripe checkout or document manual invoice process.
4. Implement Stripe customer portal if self-serve.
5. Implement Stripe webhook signature verification.
6. Add subscription status to workspace access.
7. Add usage limits for projects/storage/AI.
8. Update pricing page to match actual limits.
9. Add beta onboarding checklist.
10. Add sales demo workspace with realistic seed data.

Done criteria:

- A customer can pay or be invoiced.
- Workspace access reflects subscription/trial status.
- Sales page, product limits, and backend enforcement match.

Evidence:

- Stripe test-mode checkout/portal screenshots.
- Webhook logs.
- Subscription state in DB.

### Stage 5: Security, Compliance, And Backend Hardening

Objective:

Make the app safe enough for real customer records.

What must be true when complete:

- Tenant isolation is tested.
- Storage isolation is enforced.
- Audit logging exists for key actions.
- Data export/deletion process exists.
- AI and admin endpoints are controlled.

Top tasks:

1. Add RLS tests for two users across two workspaces.
2. Fix broad storage object policies.
3. Enforce workspace-prefixed object paths.
4. Add audit writer and call it from core workflows.
5. Add admin audit logs.
6. Add AI endpoint auth, rate limits, and usage recording.
7. Add file type/size validation at app and storage levels.
8. Document backup and restore process.
9. Document data export and deletion process.
10. Review service-role usage.

Done criteria:

- Tenant leakage tests fail closed.
- Storage paths cannot be crossed between workspaces.
- Audit log shows meaningful events.
- Security page claims match implementation.

Evidence:

- RLS test run.
- Storage policy test.
- Audit log screenshot.
- Security checklist.

### Stage 6: Final Release Readiness

Objective:

Prepare MeasureDeck for a controlled beta or paid pilot launch.

What must be true when complete:

- Production deploy succeeds.
- Environment variables are configured.
- Smoke tests pass.
- Support and escalation process is known.
- Legal docs are reviewed.
- Launch blockers are tracked.

Top tasks:

1. Configure production Supabase project.
2. Apply migrations cleanly in order.
3. Configure production storage buckets and policies.
4. Configure Vercel env vars.
5. Configure custom domain and SSL.
6. Configure Stripe live mode or manual invoicing.
7. Configure email sender if needed.
8. Create beta workspace seed data.
9. Run full smoke test.
10. Prepare launch support docs and founder demo script.

Done criteria:

- Production app is reachable.
- First beta user can be onboarded.
- First paid workflow works end to end.
- Known limitations are documented.

Evidence:

- Live URL.
- Smoke test results.
- Beta onboarding checklist.
- Demo recording.

## 11. Notion-Ready Project And Task Backlog

### Project: Initial Build

| Task Name | Area | Priority | Complexity | Done Criteria | Evidence Link Type | Blocker? | Notes |
|---|---|---|---|---|---|---|---|
| Fix BIM dependency build failure | Frontend | Critical | S | `npm run build` resolves BIM imports or BIM is safely feature-gated | PR | Y | Missing installed `@react-three/drei` and `@react-three/fiber` |
| Canonicalise profile table naming | Supabase/RLS | Critical | M | Auth/admin/account code reads the same profile table created by migrations | PR | Y | Choose `profiles` or `user_profiles` |
| Canonicalise workspace membership naming | Supabase/RLS | Critical | M | All RLS policies and app code use one membership table | PR | Y | Choose `workspace_members` or `workspace_memberships` |
| Canonicalise payment application table naming | Backend | Critical | M | Application pages and wizard write/read the table created by migrations | PR | Y | Current mismatch blocks core workflow |
| Canonicalise change table naming | Backend | Critical | M | Change pages and wizard use `change_events` or migrated equivalent consistently | PR | Y | Current `changes` usage is not backed by schema |
| Fix lint errors blocking CI | Frontend | High | M | `npm run lint` exits 0 or agreed baseline is configured | PR | Y | 59 errors found |
| Add schema smoke script | QA | High | M | Script verifies required tables exist before release | PR | N | Prevent future drift |
| Verify auth redirect flow | Backend | High | S | Unauthenticated `/app/*` redirects to login; signed-in user reaches home | Loom | N | Proxy exists but profile query mismatch risks admin |
| Verify project creation flow | QA | Critical | M | User can create a project and see it in list/detail | Loom | Y | First core workflow |
| Remove or fix routes querying nonexistent tables | Backend | Critical | L | No route crashes from known table-name mismatches | PR | Y | Includes reports/schedule/audit |

### Project: Upgrade Depth Build

| Task Name | Area | Priority | Complexity | Done Criteria | Evidence Link Type | Blocker? | Notes |
|---|---|---|---|---|---|---|---|
| Complete project CRUD | Backend | Critical | M | Create/read/update/archive works against live DB | Loom | Y | Foundation |
| Complete change event CRUD | Backend | Critical | M | Create/read/update/status-change works for project change events | Loom | Y | Core value |
| Complete evidence upload and linking | Supabase | Critical | M | Upload file and link it to change/application under same workspace | Loom | Y | Needs storage hardening |
| Complete payment application wizard | Backend | Critical | L | User creates application with line items and retention | Loom | Y | Schema mismatch first |
| Complete application detail live data | Frontend | High | M | Detail page loads DB application and line items | Screenshot | N | Must stop relying on seed shape |
| Add first report/export flow | Backend | High | L | User can generate a printable/exportable application/evidence pack | Live URL | N | Sales-critical |
| Add audit events to core workflow | Backend | High | M | Create/update/submit events write audit rows | Screenshot | N | Compliance |
| Add core workflow E2E test | QA | High | M | Test completes project -> change -> evidence -> application | PR | N | Release confidence |
| Add realistic demo workspace seed | Sales | Medium | S | Demo data shows coherent project/commercial story | Screenshot | N | Sales asset |
| Add workflow error handling | Frontend | High | M | Failed DB/storage actions show useful messages and recovery | Screenshot | N | UX trust |

### Project: UI Design Upgrade

| Task Name | Area | Priority | Complexity | Done Criteria | Evidence Link Type | Blocker? | Notes |
|---|---|---|---|---|---|---|---|
| Audit primary CTAs | UI | High | S | Every primary button is marked live, hidden, or planned | Screenshot | N | Remove demo confusion |
| Replace alert-only actions | UI | High | M | Core pages have no fake alert-based actions | PR | N | Especially admin/billing |
| Polish project detail UX | UI | Medium | M | Tabs, metrics, forms, and linked records are coherent | Screenshot | N | Demo-critical |
| Polish change detail UX | UI | High | M | Change event tabs show live data and useful statuses | Screenshot | N | Core workflow |
| Polish application detail UX | UI | High | M | Application page clearly shows values, retention, dates, status | Screenshot | N | Core workflow |
| Polish evidence library UX | UI | Medium | M | Evidence records show preview, links, metadata, and actions | Screenshot | N | Trust |
| Improve responsive table handling | Mobile | Medium | M | Core tables do not overflow incoherently on mobile | Screenshot | N | Site users |
| Standardise status language | UI | Medium | S | Status chips use consistent wording and colours | PR | N | Professional polish |
| Add professional empty states | UI | Medium | S | Empty states guide next action without marketing filler | Screenshot | N | UX |
| Final demo path polish | Sales | High | S | 10-minute demo can run without awkward gaps | Loom | N | Launch asset |

### Project: Commercial Gap

| Task Name | Area | Priority | Complexity | Done Criteria | Evidence Link Type | Blocker? | Notes |
|---|---|---|---|---|---|---|---|
| Define launch offer | Sales | Critical | S | Day-one package, price, limits, and beta terms are documented | PR | Y | Needed before billing |
| Define plan limits | Finance | Critical | S | Starter/Pro/Enterprise limits are explicit | PR | Y | Needed before Stripe |
| Add subscription schema | Supabase | High | M | Workspace has subscription/trial status fields/tables | PR | N | Billing state |
| Implement Stripe checkout | Stripe | High | M | Test customer can start checkout for selected plan | Loom | N | If self-serve |
| Implement Stripe portal | Stripe | High | M | Customer can manage payment method/subscription | Loom | N | Billing UI currently fake |
| Implement Stripe webhook | Stripe | Critical | M | Webhook verifies signature and syncs subscription state | PR | Y | Security-critical |
| Gate app by subscription status | Backend | High | M | Expired/cancelled workspace sees correct state | Screenshot | N | Revenue control |
| Update pricing page | SEO/Sales | Medium | S | Pricing page matches real plans and limits | PR | N | Avoid mismatch |
| Add beta onboarding checklist | Sales | Medium | S | New beta user setup process is repeatable | PR | N | Founder-led sales |
| Add sales demo script | Sales | Medium | S | Demo script follows core workflow with proof points | Loom | N | Launch asset |

### Project: Security Hardening

| Task Name | Area | Priority | Complexity | Done Criteria | Evidence Link Type | Blocker? | Notes |
|---|---|---|---|---|---|---|---|
| Add RLS tenant isolation tests | RLS | Critical | L | User A cannot read/write User B workspace records | PR | Y | Mandatory |
| Harden storage policies | Supabase | Critical | M | Evidence/drawings/reports objects are workspace-isolated | PR | Y | Current broad policies risky |
| Enforce workspace object paths | Backend | Critical | M | Upload paths include workspace ID and policy checks it | PR | Y | Evidence security |
| Add audit writer | Backend | High | M | Core actions write `audit_log` rows consistently | PR | N | Compliance |
| Add admin action audit | Admin | High | M | Admin user/workspace/billing changes are auditable | Screenshot | N | Platform risk |
| Add AI rate limiting | AI | High | M | AI endpoint limits usage per user/workspace/plan | PR | N | Cost/security |
| Add AI usage persistence | AI | High | M | Token/cost/action rows are written to `ai_usage_ledger` | Screenshot | N | Billing/limits |
| Review service role usage | Security | High | S | Service-role client is server-only and documented | PR | N | Avoid accidental exposure |
| Document backup/restore | Admin | Medium | S | Backup and restore runbook exists | PR | N | Launch ops |
| Document data export/deletion | Legal | Medium | S | Customer export/deletion policy is documented | PR | N | Privacy |

### Project: Final Release

| Task Name | Area | Priority | Complexity | Done Criteria | Evidence Link Type | Blocker? | Notes |
|---|---|---|---|---|---|---|---|
| Configure production Supabase | Backend | Critical | M | Production DB, auth, storage, and env vars are configured | Screenshot | Y | Launch dependency |
| Apply migrations cleanly | Supabase | Critical | M | Fresh production DB can apply all migrations in order | Screenshot | Y | Currently questionable |
| Configure Vercel env vars | Admin | Critical | S | Required production env vars are present | Screenshot | Y | Deployment |
| Deploy production build | Admin | Critical | M | Vercel deploy succeeds from clean build | Live URL | Y | Build currently fails |
| Run production smoke test | QA | Critical | M | Auth -> project -> change -> evidence -> application works | Loom | Y | Launch gate |
| Verify Stripe live/test mode | Stripe | High | S | Billing mode is clear and tested | Screenshot | N | Depending launch offer |
| Verify legal pages | Legal | High | S | Required legal pages are published and reviewed | Live URL | N | Trust |
| Prepare support process | Admin | Medium | S | Support contact, SLA, escalation route are documented | PR | N | Beta readiness |
| Prepare beta cohort list | Sales | Medium | S | Target beta users and onboarding order are listed | PR | N | GTM |
| Final release scorecard update | QA | Medium | S | Scorecard reflects actual build truth | PR | N | Existing scorecard is too optimistic |

## 12. Launch Plan

### Target Launch Recommendation

Do not public-launch the full platform immediately.

Recommended launch:

- Controlled beta after Stage 1 and one Stage 2 workflow are complete.
- Paid pilot after RLS/storage/billing/audit minimums are complete.
- Public launch only after build/lint, schema, billing, support, and legal are stable.

### Milestone Plan

Milestone 1: Build and schema truth

- Fix build.
- Fix lint blockers.
- Canonicalise schema names.
- Verify auth and project creation.

Milestone 2: First paid workflow

- Project -> change -> evidence -> application -> export.
- Add audit events.
- Add realistic demo data.

Milestone 3: Security baseline

- RLS tests.
- Storage isolation.
- AI auth/rate/usage controls.
- Data policy docs.

Milestone 4: Commercial readiness

- Pricing and launch offer.
- Billing or manual invoice process.
- Landing page aligned to beta truth.
- Support process.

Milestone 5: Beta launch

- 3-5 beta customers.
- Founder onboarding.
- Weekly feedback.
- Fix adoption blockers.

### Beta Plan

Target beta:

- 3-5 UK QS/commercial teams.
- Ideally one specialist subcontractor, one SME main contractor, and one consultant/QS practice.

Onboarding:

- Founder-led setup call.
- Import or manually create 1-3 live/demo projects.
- Walk through first change/application workflow.
- Weekly check-ins for first month.

Beta success criteria:

- Customer creates at least one real project.
- Customer uploads real evidence or demo evidence.
- Customer creates at least one change event.
- Customer creates or previews one payment application/report.
- Customer identifies whether they would pay and what is missing.

### Support Plan

Beta SLA:

- Critical access/security issues: same business day.
- Workflow-blocking bugs: 1-2 business days.
- Feature requests: triaged weekly.
- Data correction requests: manually handled by founder/admin until tooling exists.

Escalation:

- Founder/technical owner for all beta issues.
- Maintain a decision log for scope changes.
- Maintain known limitations in customer-facing beta notes.

### Minimum Marketing Assets

Required:

- Landing page with clear beta positioning.
- 3-minute demo video.
- 10-minute founder demo script.
- Pricing/offer page or one-page PDF.
- Security overview.
- Legal pages.
- Case study template.
- Outreach message for QS/commercial managers.

## 13. Weekly Product Questions

Answer these weekly for MeasureDeck:

1. What is the next single workflow that must work end to end?
2. What is the biggest commercial gap preventing someone from paying?
3. What is the biggest security/compliance gap creating liability?
4. What is the one thing that improves demo quality the most this week?
5. What are the top three blockers stopping launch readiness?

Current answers:

1. Next workflow: project -> change event -> evidence -> payment application -> export.
2. Biggest commercial gap: no real billing/checkout/subscription enforcement or clearly scoped launch offer.
3. Biggest security gap: unproven tenant isolation due to schema/RLS drift and broad storage policies.
4. Biggest demo improvement: make one clean, live, schema-backed workflow work without stubs.
5. Top blockers: build failure, schema mismatch, RLS/storage proof.


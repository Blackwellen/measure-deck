# MeasureDeck — Build Release Gates
**Purpose:** Every phase must pass ALL gates in its section before being marked complete and before the next phase starts.

---

## Universal Gates (Every Phase)

These checks must pass at the end of EVERY phase without exception:

- [ ] `npx tsc --noEmit` — zero TypeScript errors
- [ ] `npm run build` — build completes without error
- [ ] No console errors in browser on affected routes
- [ ] No broken routes (404 on nav items)
- [ ] No duplicate shells/sidebars on any page
- [ ] No placeholder/stub buttons that do nothing
- [ ] Supabase reads succeed for workspace-scoped data
- [ ] RLS: workspace member can read their data; non-member cannot
- [ ] Mobile layout at 375px width — no horizontal scroll, no broken layout
- [ ] Tablet layout at 768px — correct breakpoints
- [ ] Desktop layout at 1440px — correct density
- [ ] All new feature flags default to `false` in production
- [ ] New DB migrations run cleanly on a fresh DB

---

## Phase-Specific Release Gates

### Phase 01 — Codebase & Document Audit
- [ ] Both strategy docs read and summarised in progress log
- [ ] All 8 BUILD_ control documents created
- [ ] Route audit table complete with 84 app routes confirmed
- [ ] Component audit table complete
- [ ] Migration audit complete (3 files, 1,406 lines)
- [ ] Feature flag audit complete (20 existing flags listed)
- [ ] Shell architecture confirmed (no duplicate shells)
- [ ] 20x20 task list created with all 400 tasks
- [ ] Risk register populated with initial risks
- [ ] Supabase matrix populated with existing tables

### Phase 02 — Architecture Guardrails & Feature Flags
- [ ] V2 feature flag registry added to `src/lib/feature-flags.ts`
- [ ] Workspace-level flag override table designed in migration
- [ ] Admin flag management page wired to real flags
- [ ] `src/lib/audit.ts` helper created and exported
- [ ] `src/lib/activity.ts` helper created and exported
- [ ] `src/lib/notifications.ts` helper created and exported
- [ ] `src/lib/workspace.ts` scope helper created and exported
- [ ] Error boundary component created
- [ ] Loading skeleton component verified working
- [ ] Empty state component verified working
- [ ] Rollback procedure documented
- [ ] All tests pass

### Phase 03 — Supabase Schema Hardening & RLS
- [ ] Migration 004 runs cleanly: NEC4 CE + EWR + programme tables
- [ ] Migration 005 runs cleanly: HGCRA tables
- [ ] Migration 006 runs cleanly: CIS + retention + subcontract tables
- [ ] Migration 007 runs cleanly: adjudication + PC + snagging + cashflow tables
- [ ] All new tables have workspace_id column
- [ ] All new tables have RLS enabled
- [ ] All RLS policies use workspace_memberships subquery pattern
- [ ] RLS test: member reads their workspace data — succeeds
- [ ] RLS test: non-member reads other workspace data — returns empty
- [ ] RLS test: unauthenticated request — rejected
- [ ] All foreign keys created
- [ ] All recommended indexes created
- [ ] All existing RLS policies audited and confirmed correct
- [ ] `notifications` table confirmed to exist
- [ ] `audit_events` table confirmed correct schema

### Phase 04 — Shared Enterprise Component Library
- [ ] `CountdownClock` component renders and updates in real-time
- [ ] `ComplianceBadge` renders all variants
- [ ] `VerticalStepper` renders workflow states correctly
- [ ] `RiskMatrix` renders 5×5 grid with colour coding
- [ ] `SCurveChart` renders with planned/actual/forecast lines
- [ ] `KPICard` renders all variants
- [ ] `CommercialSummaryCard` renders correctly
- [ ] `AuditFeed` renders timeline events
- [ ] `NotesComposer` creates notes with Supabase write
- [ ] File upload dropzone works with Supabase Storage
- [ ] `StatusPill` renders all status variants
- [ ] `FilterDrawer` opens, filters, and closes correctly
- [ ] `SavedViews` saves and loads filter states
- [ ] Multi-stage wizard shell validates and navigates correctly
- [ ] `ConfirmModal` fires correct callbacks
- [ ] `MobileCardList` renders correctly at 375px
- [ ] All components have no TypeScript errors
- [ ] @react-pdf/renderer added to package.json and working

### Phase 05 — Global UI, Layout & Navigation
- [ ] No duplicate sidebars on any route
- [ ] No duplicate top navs on any route
- [ ] Breadcrumbs correct on all detail pages
- [ ] Avatar dropdown positions correctly (no z-index clipping)
- [ ] Card shapes consistent (same border-radius, shadow level)
- [ ] Button hierarchy consistent (primary/secondary/ghost/danger)
- [ ] Tab styling consistent across all detail pages
- [ ] Mobile sidebar: opens/closes on hamburger
- [ ] Empty state: visible and helpful on all list pages
- [ ] Loading state: skeleton visible during data fetch
- [ ] Error state: error card visible on fetch failure
- [ ] Global spacing: 16px/24px/32px rhythm respected
- [ ] Accessibility: Tab key navigates all interactive elements
- [ ] Focus rings visible on all interactive elements

### Phase 06 — Projects Deep Commercial Workspace
- [ ] Projects list page: search, filter, sort, view-switcher all work
- [ ] Project creation wizard: all steps save to Supabase
- [ ] Project detail page: all tabs render with data
- [ ] Project commercials tab: financial figures display correctly
- [ ] Project inline editing: saves to Supabase with audit record
- [ ] Project notes: creates note in Supabase
- [ ] Project activity: shows real audit events
- [ ] Project documents: uploads to Supabase Storage
- [ ] Project search: returns results from Supabase
- [ ] RLS: workspace member can edit their projects; non-member cannot

### Phase 07 — NEC4 CE Engine & Change Events
- [ ] `ce-state-machine.ts` exports all calculation functions
- [ ] Quotation due date: calculated correctly (+21 working days)
- [ ] Acceptance due date: calculated correctly (+14 days)
- [ ] Deemed acceptance: flagged when acceptance period expires
- [ ] CE workflow tab: renders state stepper with correct current state
- [ ] CE quotation builder: saves quotation lines to Supabase
- [ ] CE NEC4 wizard steps: only shown when project contract_type = NEC4
- [ ] CE dashboard: renders overdue/due-this-week/on-track panels
- [ ] CE notifications: in-app alert created on deemed acceptance risk
- [ ] CE clause library: all 21 NEC4 60.1 categories selectable
- [ ] CE document generation: narrative template renders correctly
- [ ] CE list page: filter by clause, state, value, urgency
- [ ] Mobile CE list: card layout at 375px
- [ ] RLS: CE records scoped to workspace

### Phase 08 — Early Warnings & Programme Notifications
- [ ] EWR list page renders with risk matrix quadrant
- [ ] EW wizard creates EW record in Supabase
- [ ] EW detail page: all 5 tabs render with data
- [ ] Convert EW to CE: creates CE record + bidirectional link
- [ ] Programme list page: submission history renders
- [ ] Programme wizard: creates programme_notifications record
- [ ] Clause 32 cycle tracker: calculates next due date correctly
- [ ] PM response recording: saves acceptance/non-acceptance with reasons
- [ ] Baseline registry: accepted baselines locked and labelled
- [ ] Float analysis: renders on programme detail

### Phase 09 — HGCRA Payment Compliance Suite
- [ ] `calculatePaymentTimeline()` returns correct dates for JCT and NEC4
- [ ] PLN page: renders with countdown to PLN cutoff
- [ ] PLN form: saves to pay_less_notices table
- [ ] PLN PDF: generates correctly with all required fields
- [ ] PLN issued: immutable once marked issued (cannot edit)
- [ ] S112 eligibility check: correctly identifies overdue payments without PLN
- [ ] Suspension notice: saves to suspension_notices table
- [ ] HGCRA project dashboard: all applications shown with traffic lights
- [ ] Compliance score: calculated from % of on-time notices
- [ ] Notifications: PLN cutoff alert fires 3 days before

### Phase 10 — CIS, HMRC & Domestic Reverse Charge
- [ ] HMRC credential fields in workspace settings
- [ ] Credentials stored encrypted (not in plaintext)
- [ ] Supabase Edge Function proxies CIS API call
- [ ] CIS verification: returns gross/net/higher/unmatched correctly (sandbox)
- [ ] Supplier CIS tab: shows verification status and date
- [ ] Bulk verification: verifies multiple suppliers in sequence
- [ ] Payment application CIS section: deduction calculated correctly
- [ ] Materials/labour split: saved correctly
- [ ] CIS300 XML: generates valid XML structure
- [ ] Monthly return page: auto-populates from payment lines
- [ ] Return submission: sends to HMRC sandbox successfully
- [ ] DRC indicator: appears on correct payments
- [ ] Annual statements: generates PDF per subcontractor

### Phase 11 — Suppliers, Subcontracts & Supply Chain KYC
- [ ] Companies House search: returns results from API
- [ ] Companies House risk chip: shows active/dissolved/at-risk
- [ ] Supplier onboarding wizard: all 4 steps save correctly
- [ ] Supplier compliance tab: insurance expiry alerts fire
- [ ] Subcontract order wizard: all 5 steps save to subcontract_orders
- [ ] Subcontract list: shows financial summary (certified/paid/retention)
- [ ] Subcontract detail: all 8 tabs render with data
- [ ] Subcontract CE tab: linked CEs display correctly
- [ ] Subcontract retention tab: moiety release tracking works
- [ ] RLS: supplier/subcontract data scoped to workspace

### Phase 12 — Retention, Cashflow, EVM & CVR Enhancement
- [ ] Retention receivable ledger: entries from payment applications
- [ ] Retention payable ledger: entries from subcontract payments
- [ ] First moiety release: triggered on PC certificate date
- [ ] Retention dashboard: debtors and creditors charts render
- [ ] Cashflow forecast: inputs generate monthly cashflow table
- [ ] S-curve chart: planned/actual/forecast lines render correctly
- [ ] Peak negative cashflow: highlighted on chart
- [ ] EVM calculations: PV/EV/AC/CPI/SPI all calculated correctly
- [ ] CVR WIP adjustment: WIP calculation formula works
- [ ] Package-level margin: per-subcontract breakdown renders

### Phase 13 — Practical Completion, Snagging & Defects
- [ ] PC certificate: generates PDF with all required fields
- [ ] Sectional PC: tracks multiple sections independently
- [ ] DLP start/end: calculated from PC certificate date
- [ ] First retention moiety: auto-triggered on PC date
- [ ] Snagging wizard: creates snag with photo upload
- [ ] Snagging list: shows all snags with status filter
- [ ] Snag assignment: assigns to supplier/team member
- [ ] Snag completion: closes snag with evidence photo
- [ ] GPS tag: location captured on mobile
- [ ] Outstanding snag dashboard: shows count, priority breakdown

### Phase 14 — Dayworks, Mobile Capture & PWA
- [ ] PWA manifest: app installable on iOS/Android
- [ ] Service worker: caches key assets for offline use
- [ ] Mobile daywork form: camera capture works on mobile
- [ ] GPS tag: location captured automatically
- [ ] Offline queue: form saves to IndexedDB when offline
- [ ] Sync: queued forms upload when connection restored
- [ ] Signature capture: client representative signs on screen
- [ ] Daywork PDF: generates correctly with all RICS fields
- [ ] Email flow: PDF emailed to client on sign-off
- [ ] Daywork register: all dayworks listed with status

### Phase 15 — AI Intelligence Layer
- [ ] Copilot infrastructure audit: all existing hooks documented
- [ ] Page context provider: current page context passed to AI
- [ ] AI permission gate: AI features respect workspace plan
- [ ] Human approval: AI never mutates data without confirmation
- [ ] AI audit events: every AI action logged in audit_events
- [ ] Contract analyser: uploads contract, returns risk score
- [ ] Contract clause table: all flagged clauses displayed
- [ ] CE narrative: generates draft from CE data
- [ ] CE entitlement scanner: identifies missed CEs from programme data
- [ ] Supplier insolvency score: calculated from Companies House data

### Phase 16 — Client Portal & External Collaboration
- [ ] Portal route: accessible at /portal/[token] without login
- [ ] Magic link: generates time-limited access token
- [ ] Portal permission model: contractor controls what client sees
- [ ] Payment application portal view: client can see application status
- [ ] CE register portal view: notified events visible to client
- [ ] Client PLN action: client can issue PLN through portal
- [ ] Portal audit trail: every client action logged with IP + timestamp
- [ ] Portal branding: shows contractor's logo
- [ ] Portal expiry: link expires after set date
- [ ] Portal mobile: usable on phone screen

### Phase 17 — Analytics, Board Packs & Reports
- [ ] Cross-project analytics dashboard: all KPIs load from Supabase
- [ ] Portfolio margin chart: margin by project type renders
- [ ] CE recovery analytics: notified vs settled chart renders
- [ ] DSO chart: days sales outstanding by client renders
- [ ] Commercial health score: calculated from 6 components
- [ ] Board pack PDF: generates full 6-page report
- [ ] PowerPoint export: generates PPTX from board pack data
- [ ] Scheduled board pack: can be set to generate monthly
- [ ] Report permissions: only authorised roles can access
- [ ] Mobile summary: analytics summary visible at 375px

### Phase 18 — Adjudication, Delay Analysis, BOQ & Programme Imports
- [ ] Adjudication case list: all cases visible with status filter
- [ ] Bundle builder: drag-and-drop document assembly works
- [ ] Chronology builder: events added and sorted by date
- [ ] Bundle PDF: generates indexed PDF with page numbers
- [ ] Delay analysis register: delay events with party attribution
- [ ] Asta XER parser: parses XER file, imports activities
- [ ] MS Project XML parser: parses XML, imports activities
- [ ] Programme baseline comparison: imported vs baseline shown
- [ ] NRM2 BOQ import: imports CSV/Excel BOQ
- [ ] BOQ-to-CVR linkage: BOQ items linked to CVR cost codes

### Phase 19 — Integrations, Notifications & Optional Add-Ons
- [ ] Central notification engine: dispatches in-app + email
- [ ] In-app notification centre: bell icon, unread count, dismiss all
- [ ] Email notifications: Resend sends correctly
- [ ] Web Push: browser push notification sent successfully
- [ ] Xero OAuth: connects to Xero organisation
- [ ] Xero invoice sync: payment applications create Xero invoices
- [ ] Sage CSV: exports in Sage-compatible format
- [ ] Twilio BYO: workspace can enter and use own Twilio credentials
- [ ] WhatsApp BYO: workspace can enter and use own WhatsApp credentials
- [ ] BCIS manual index: admin can input monthly indices

### Phase 20 — Final Release Readiness
- [ ] All 84+ routes return 200 (no 404/500)
- [ ] All buttons and actions wired (no console.log("TODO"))
- [ ] All wizards complete their full flow
- [ ] All detail pages have all required tabs
- [ ] Full Supabase RLS matrix: all tables audited
- [ ] Full storage policy: all buckets have correct policies
- [ ] Responsive: all pages correct at 375/768/1440px
- [ ] Accessibility: keyboard navigation works throughout
- [ ] TypeScript: zero errors
- [ ] Build: clean build with no warnings
- [ ] Seed/demo data: all pages show realistic data
- [ ] Billing gate: paid features locked behind correct plan
- [ ] Changelog: release notes written
- [ ] Admin checklist: production deployment checklist complete
- [ ] Rollback plan: documented and tested

---

## Rollback Procedure

In the event of a defect reaching production, follow these steps in order:

1. **Disable the feature flag for the affected workspace.**
   Run the following SQL in the Supabase dashboard:
   ```sql
   UPDATE workspace_feature_flags
   SET enabled = false
   WHERE workspace_id = '<affected_workspace_id>'
     AND flag_key = '<flag_key>';
   ```
   This immediately gates the broken feature for that workspace without a deployment.

2. **No database rollback is needed.**
   All migrations are additive-only (no DROP TABLE, no DROP COLUMN, no renames).
   Rolling back the DB is never required — new columns default to NULL and new tables are simply unused.

3. **Hot-fix deployment (if code rollback is needed):**
   ```bash
   git revert <commit-sha>
   git push origin main
   ```
   Vercel detects the push and triggers an automatic redeploy. Production is updated within ~90 seconds.
   Verify the affected route returns 200 before closing the incident.

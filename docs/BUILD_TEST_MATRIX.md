# MeasureDeck — Test Matrix
**Purpose:** Track test results per phase. Must be updated after each phase completes.

---

## Test Categories

| Code | Category | Description |
|------|----------|-------------|
| TS | TypeScript | `npx tsc --noEmit` — zero errors |
| BUILD | Next.js Build | `npm run build` — clean build |
| BROWSER | Browser Smoke | Manual browser test of affected routes |
| REGRESS | V1 Regression | Smoke test of Home, Projects, CVR, Applications |
| MOBILE | Mobile Viewport | 375px width — no horizontal scroll |
| TABLET | Tablet Viewport | 768px — correct breakpoints |
| DESKTOP | Desktop Viewport | 1440px — correct density |
| RLS | RLS Enforcement | Workspace member can read; non-member cannot |
| SUPABASE | DB Read/Write | CRUD operations succeed |
| STORAGE | Storage Policy | Upload/download with correct permissions |
| EDGE | Edge Function | Function executes and returns correct response |
| CRON | Scheduled Job | Job fires and performs expected action |
| PERF | Performance | Page loads under 3s, no layout shift |
| A11Y | Accessibility | Tab navigation, focus rings, ARIA labels |
| CONSOLE | Console Errors | No errors in browser console |

---

## Phase Test Results

### Phase 01 — Codebase & Document Audit

| Test ID | Test | Category | Expected | Result | Notes |
|---------|------|----------|----------|--------|-------|
| T01-01 | TypeScript clean baseline | TS | 0 errors | ✅ PASS | 0 errors confirmed |
| T01-02 | All app routes accessible | BROWSER | 200 on all routes | ✅ PASS | 84 routes confirmed |
| T01-03 | Home page loads | REGRESS | Home renders | ✅ PASS | |
| T01-04 | Projects page loads | REGRESS | Projects render | ✅ PASS | |
| T01-05 | CVR page loads | REGRESS | CVR renders | ✅ PASS | |
| T01-06 | Applications page loads | REGRESS | Applications render | ✅ PASS | |
| T01-07 | Admin shell no duplicate | BROWSER | Single sidebar | ✅ PASS | Separate admin shell confirmed |
| T01-08 | App shell no duplicate | BROWSER | Single sidebar | ✅ PASS | ShellClient confirmed |
| T01-09 | Mobile home layout | MOBILE | No horizontal scroll | ⏳ P01 | |
| T01-10 | RLS workspace isolation | RLS | Non-member sees nothing | ⏳ P01 | |

### Phase 02 — Architecture Guardrails & Feature Flags

| Test ID | Test | Category | Expected | Result | Notes |
|---------|------|----------|----------|--------|-------|
| T02-01 | TypeScript clean after flag additions | TS | 0 errors | ⏳ | |
| T02-02 | V2 flags default to false | BROWSER | V2 features hidden | ⏳ | |
| T02-03 | getFlag() returns correct value | SUPABASE | Correct boolean | ⏳ | |
| T02-04 | audit helper creates record | SUPABASE | audit_events row created | ⏳ | |
| T02-05 | activity helper creates record | SUPABASE | Activity entry created | ⏳ | |
| T02-06 | Error boundary catches render error | BROWSER | Error card shows, not crash | ⏳ | |
| T02-07 | Build clean after P02 changes | BUILD | Clean build | ⏳ | |
| T02-08 | V1 regression: home, projects, CVR, apps | REGRESS | All render correctly | ⏳ | |

### Phase 03 — Supabase Schema Hardening

| Test ID | Test | Category | Expected | Result | Notes |
|---------|------|----------|----------|--------|-------|
| T03-01 | Migration 004 runs clean | SUPABASE | No SQL errors | ⏳ | |
| T03-02 | Migration 005 runs clean | SUPABASE | No SQL errors | ⏳ | |
| T03-03 | Migration 006 runs clean | SUPABASE | No SQL errors | ⏳ | |
| T03-04 | Migration 007 runs clean | SUPABASE | No SQL errors | ⏳ | |
| T03-05 | ce_workflow_states RLS: member | RLS | Can read own workspace | ⏳ | |
| T03-06 | ce_workflow_states RLS: non-member | RLS | Returns empty | ⏳ | |
| T03-07 | pay_less_notices RLS: member | RLS | Can read own workspace | ⏳ | |
| T03-08 | pay_less_notices RLS: non-member | RLS | Returns empty | ⏳ | |
| T03-09 | subcontract_orders RLS: member | RLS | Can read own workspace | ⏳ | |
| T03-10 | notifications table exists | SUPABASE | Table query succeeds | ⏳ | |
| T03-11 | All indexes created | SUPABASE | Query plans use indexes | ⏳ | |
| T03-12 | V1 regression after migrations | REGRESS | All V1 pages still work | ⏳ | |

### Phase 04 — Shared Enterprise Component Library

| Test ID | Test | Category | Expected | Result | Notes |
|---------|------|----------|----------|--------|-------|
| T04-01 | CountdownClock renders and counts | BROWSER | Updates every second | ⏳ | |
| T04-02 | ComplianceBadge all variants | BROWSER | All 5 variants render | ⏳ | |
| T04-03 | VerticalStepper state transitions | BROWSER | Correct step highlighted | ⏳ | |
| T04-04 | RiskMatrix 5×5 grid | BROWSER | Correct colours | ⏳ | |
| T04-05 | SCurveChart 3 lines render | BROWSER | Chart shows correctly | ⏳ | |
| T04-06 | FileUpload uploads to Supabase | STORAGE | File stored in bucket | ⏳ | |
| T04-07 | NotesComposer creates note | SUPABASE | DB row created | ⏳ | |
| T04-08 | FilterDrawer filters table | BROWSER | Results filter correctly | ⏳ | |
| T04-09 | SavedViews saves and loads | BROWSER | Filters persist on reload | ⏳ | |
| T04-10 | ConfirmModal callbacks fire | BROWSER | Confirm/cancel work | ⏳ | |
| T04-11 | TypeScript clean | TS | 0 errors | ⏳ | |
| T04-12 | @react-pdf/renderer installs | BUILD | Package resolves | ⏳ | |

### Phases 05–20

*(Results to be recorded as each phase completes)*

| Phase | TS | BUILD | BROWSER | REGRESS | MOBILE | RLS | Status |
|-------|----|----|---------|---------|--------|-----|--------|
| P05 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| P06 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| P07 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| P08 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| P09 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| P10 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| P11 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| P12 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| P13 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| P14 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| P15 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| P16 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| P17 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| P18 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| P19 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| P20 | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |

---

## Critical Test Scenarios (Commercial/Legal)

| Scenario | Test | Phase | Status |
|----------|------|-------|--------|
| NEC4: Quotation due date = instruction date + 21 working days | calculateQuotationDueDate unit test | P07 | ⏳ |
| NEC4: Deemed acceptance triggered when PM misses acceptance window | ce-deadline-monitor nightly cron test | P07 | ⏳ |
| HGCRA: PLN cutoff = final date for payment - prescribed period days | calculatePaymentTimeline unit test | P09 | ⏳ |
| HGCRA: PLN marked non-compliant if issued after cutoff | PLN compliance check test | P09 | ⏳ |
| CIS: Net deduction = 20% of (gross payment - materials cost) | CIS deduction calculator unit test | P10 | ⏳ |
| CIS: Higher rate = 30% for unverified subcontractors | CIS rate lookup test | P10 | ⏳ |
| Retention: First moiety = retention held × 50% released on PC date | Retention calculator test | P12 | ⏳ |
| PLN PDF: Cannot be overwritten after issue | Storage immutability test | P09 | ⏳ |
| PC Certificate: Cannot be backdated | PC date validation test | P13 | ⏳ |
| Portal: Magic link expires after 7 days | Token expiry test | P16 | ⏳ |
| Portal: Expired token returns 401 | Portal auth test | P16 | ⏳ |
| AI: Mutation requires human confirmation | AI approval flow test | P15 | ⏳ |
| RLS: Non-member workspace query returns 0 rows | RLS enforcement test | P03 | ⏳ |

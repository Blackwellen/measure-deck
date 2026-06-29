# MeasureDeck — Build Risk Register
**Updated:** June 2026 | **Owner:** Build Control Agent

---

## Risk Matrix Legend

| Likelihood | Impact | Risk Rating |
|-----------|--------|-------------|
| 1 = Unlikely | 1 = Minor | 1–4 = Low |
| 2 = Possible | 2 = Moderate | 5–9 = Medium |
| 3 = Likely | 3 = Significant | 10–16 = High |
| 4 = Almost certain | 4 = Critical | 17–25 = Critical |

---

## Active Risks

| Risk ID | Category | Description | Likelihood (1–5) | Impact (1–5) | Rating | Mitigation | Owner | Status |
|---------|----------|-------------|-----------------|--------------|--------|-----------|-------|--------|
| R01 | Technical | Next.js 16 has breaking changes from training data — APIs differ from known patterns | 3 | 4 | 12 | Read node_modules/next/dist/docs/ before writing any Next.js code. Test each pattern. | Build Agent | Active |
| R02 | Database | Supabase migration conflicts with live 130+ table schema — accidental drop or rename | 2 | 5 | 10 | Additive-only migrations. Always `CREATE TABLE IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS`. Never DROP. | Build Agent | Active |
| R03 | Security | HMRC API credentials exposed client-side via environment variable leakage | 2 | 5 | 10 | All HMRC calls proxied via Supabase Edge Function. HMRC credentials stored encrypted server-side only. | Build Agent | Active |
| R04 | RLS | New V2 tables created without RLS — workspace data leaks between tenants | 3 | 5 | 15 | Automated RLS check after every migration. RLS test script in release gate. | Build Agent | Active |
| R05 | Feature Quality | Feature flags disabled but UI elements still render — confuses users on lower plans | 2 | 3 | 6 | Flag gate at component level AND route level. Test with flag OFF before merge. | Build Agent | Active |
| R06 | Breaking V1 | V2 changes break existing V1 pages (home, projects, CVR, applications) | 3 | 4 | 12 | Regression smoke test of V1 core pages after every phase. Never modify existing component contracts. | Build Agent | Active |
| R07 | Legal/Commercial | Generated legal notices (PLN, suspension) contain incorrect statutory dates | 2 | 5 | 10 | Unit tests for all date calculations. Test with known JCT/NEC4 contract date scenarios. | Build Agent | Active |
| R08 | Performance | Cross-project analytics queries run full-table scans on 130+ table DB — too slow | 3 | 3 | 9 | Add indexes in migration. Use Supabase views for analytics aggregations. Paginate all lists. | Build Agent | Active |
| R09 | Integration | HMRC CIS sandbox differs from production — development tests don't catch production bugs | 2 | 4 | 8 | Build manual fallback for all HMRC API calls. Document production differences. Stage testing in sandbox first. | Build Agent | Active |
| R10 | PWA | PWA service worker caches stale JS — users see old version after updates | 2 | 3 | 6 | Cache-busting on service worker. `skipWaiting()` strategy. Version the cache. | Build Agent | Active |
| R11 | AI Safety | AI copilot mutates commercial data (CEs, applications) without human confirmation | 2 | 5 | 10 | AI never writes directly to DB. All AI-suggested mutations require explicit user confirmation. AI audit trail mandatory. | Build Agent | Active |
| R12 | PDF Immutability | Issued legal documents (PLN, PC certificates) overwritten or deleted after issue | 1 | 5 | 5 | Once issued, PDF stored in Supabase Storage with immutable flag. No delete/replace allowed. | Build Agent | Active |
| R13 | Companies House | Companies House API rate limits exceeded on bulk supplier verification | 2 | 2 | 4 | Rate-limit client to 10 requests/second max. Queue bulk operations. | Build Agent | Active |
| R14 | Xero Integration | Xero OAuth token expires — sync stops silently | 2 | 3 | 6 | Token refresh implemented. Alert workspace admin on refresh failure. | Build Agent | Active |
| R15 | Mobile | Camera API on iOS requires HTTPS — offline daywork capture fails in dev | 2 | 3 | 6 | Dev server must run on HTTPS for PWA testing. Use ngrok or Vercel preview for mobile testing. | Build Agent | Active |
| R16 | TypeScript | V2 features introduce implicit `any` types — TS errors break build | 3 | 3 | 9 | Run `npx tsc --noEmit` after every file change. Zero tolerance policy for TS errors. | Build Agent | Active |
| R17 | Scope Creep | Feature depth grows beyond commercial value — time wasted on low-priority features | 3 | 3 | 9 | Commercial value gate: every feature must answer "what money does this protect?" before build. | Build Agent | Active |
| R18 | Supabase RPC | Future refactor introduces `get_user_workspace_ids()` function that doesn't exist in live DB | 1 | 4 | 4 | Never use RPC helpers. Always use inline subquery pattern. Documented in architecture principles. | Build Agent | Active |
| R19 | Client Portal Security | Client portal magic-link token leaked — unauthorised access to project data | 2 | 5 | 10 | Short token expiry (7 days max). IP logging on all portal access. Token invalidation on revoke. | Build Agent | Active |
| R20 | Document Generation | @react-pdf/renderer incompatible with Next.js 16 server-side rendering | 2 | 3 | 6 | PDF generation client-side only (`"use client"`) or via Edge Function. Test before P04 build starts. | Build Agent | Active |

---

## Closed Risks

| Risk ID | Description | Resolution | Date Closed |
|---------|-------------|-----------|-------------|
| RC01 | TypeScript errors from V1 build | All 0 TS errors confirmed in V1 baseline | 2026-06-14 |
| RC02 | `payment_applications` table name conflict | Confirmed table is `applications` in live DB | 2026-06-14 |
| RC03 | `get_user_workspace_ids()` function missing | Replaced all occurrences with inline subquery | 2026-06-14 |
| RC04 | `audit_log` table doesn't exist | Confirmed table is `audit_events` | 2026-06-14 |

---

## Risk Escalation Procedure

1. Risk rating ≥ 15 (High): Pause current phase, resolve blocker before continuing
2. Risk rating 10–14 (Medium): Implement mitigation before phase release gate
3. Risk rating < 10 (Low): Track and monitor, implement mitigation if rating increases

---

## Risk Review Schedule

- After each phase: review all active risks, update ratings, close resolved risks
- Any new risk discovered during build: add immediately to register
- Critical risks (≥17): flag immediately to Jamahl Thomas

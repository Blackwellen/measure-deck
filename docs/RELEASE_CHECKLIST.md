# MeasureDeck v1.0 — Release Checklist

## Pre-Release Verification

### Code Quality
- [x] TypeScript: 0 errors (`npx tsc --noEmit`) — verified Phase 20
- [ ] Build: clean (`npm run build`) — run manually to confirm
- [ ] No console.log statements in production code
- [x] No hardcoded secrets or API keys in src/

### Security
- [x] All API routes validate authentication
- [x] All API routes validate workspace membership (assertWorkspaceMember)
- [x] HMRC credentials only in Edge Function env (supabase/functions/hmrc-cis-proxy)
- [x] Companies House key only in Edge Function env (supabase/functions/companies-house-search)
- [x] Resend key only in Edge Function env (supabase/functions/send-portal-invite)
- [x] legal-notices bucket delete is blocked (enforced via uploadFile/deleteFile in src/lib/storage.ts)
- [x] cis-documents bucket delete is blocked (enforced via uploadFile/deleteFile in src/lib/storage.ts)
- [x] No service_role key in src/ files

### Commercial Accuracy
- [x] HGCRA PLN cutoff calculation verified: `final_date_for_payment - prescribed_period_days` (src/lib/hgcra/payment-timeline.ts)
- [x] NEC4 quotation window (21 calendar days) verified (src/lib/nec4/ce-state-machine.ts)
- [x] NEC4 acceptance window (14 calendar days) verified (src/lib/nec4/ce-state-machine.ts)
- [x] NEC4 deemed accepted = acceptance_due_date + 1 day verified
- [ ] CIS deduction rates: gross=0%, net=20%, higher=30% — verify in CIS section UI
- [ ] Retention: first moiety = 50% of total held — verify in retention ledger
- [ ] PC Certificate cannot be backdated > 30 days — verify via validatePCCertificate()
- [ ] Portal magic link expires after 7 days — verify in portal_access_tokens table

### Database
- [x] All RLS policies applied (workspace_memberships pattern) — see src/lib/audit/rls-checklist.ts
- [ ] Migrations 001-008 applied to production Supabase project
- [x] Indexes created on all FK columns (verified in migrations)
- [x] No data returned from wrong workspace (workspace_id filter on all queries + RLS)

### Immutability
- [x] PLN cannot be edited after issue (`is_immutable: true`, `status: "issued"` blocks via assertNotImmutable)
- [x] Suspension notice cannot be edited after issue (`is_immutable: true`)
- [x] PC Certificate cannot be edited after issue (validatePCCertificate enforces)
- [ ] CIS300 monthly return cannot be edited after filed — verify in CIS monthly return page

### Feature Flags
- [ ] All V2 feature flags default to false in production
- [x] Feature flags table exists (workspace_feature_flags) and is queried via getFlag()

### Environment Variables
- [ ] NEXT_PUBLIC_SUPABASE_URL set in production
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY set in production
- [ ] SUPABASE_SERVICE_ROLE_KEY set (server only — src/lib/supabase/admin.ts)
- [ ] OPENAI_API_KEY set for AI chat feature
- [ ] CRON_SECRET set for cron job protection
- [ ] All Edge Function secrets configured in Supabase dashboard:
  - HMRC_CLIENT_ID, HMRC_CLIENT_SECRET
  - COMPANIES_HOUSE_API_KEY
  - RESEND_API_KEY

### Performance
- [x] images.remotePatterns configured for Supabase storage (*.supabase.co, *.supabase.in)
- [x] experimental.optimizePackageImports for lucide-react, recharts, framer-motion
- [x] PWA enabled with service worker (next-pwa configured)
- [x] Canvas package excluded from webpack client bundle

### Error Handling
- [x] ErrorBoundary wraps entire app shell (src/app/(app)/layout.tsx)
- [x] ErrorBoundary component provides retry and error details (src/components/ui/error-boundary.tsx)

## Post-Deploy Smoke Test

1. Login → /home loads with real data
2. Create project → wizard completes, DB row created
3. Create CE → NEC4 workflow shows 21-day countdown
4. Create Application → HGCRA panel shows correct PLN cutoff and final date
5. Issue PLN → document locked as immutable, PDF stored in legal-notices bucket
6. Navigate all sidebar links → no 404s
7. Notification bell → shows real data, realtime subscription active
8. AI bubble → opens, sends message, streams response
9. Portal link → validates token, shows read-only application data
10. Admin panel → /admin routes load, health check passes

## Sign-Off

- [ ] Commercial review complete (HGCRA, NEC4, CIS calculations independently verified)
- [ ] Security review complete (RLS, immutability, secret management)
- [ ] QA smoke test complete (all 10 post-deploy tests passed)
- [ ] MeasureDeck v1.0 approved for production

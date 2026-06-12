# MeasureDeck V1 — Final Release Scorecard

**Date:** 2026-06-10
**Version:** 1.0.0
**Target:** Vercel Production

---

## 1. V1 Feature Checklist

### Core Platform
| Feature | Status | Notes |
|---|---|---|
| Authentication (login / signup / forgot password) | ✅ | Supabase Auth |
| MFA / OTP Gate | ✅ | `/app/(auth)/mfa` |
| Onboarding flow | ✅ | `/app/(auth)/onboarding` |
| Workspace architecture + RLS | ✅ | All tables workspace-scoped |
| Admin shell + dashboard | ✅ | `/admin` |
| Admin user management | ✅ | `/admin/users` |
| Admin workspace management | ✅ | `/admin/workspaces` |
| Feature flags | ✅ | `feature_flag_overrides` table + client |

### Projects Module
| Feature | Status | Notes |
|---|---|---|
| Projects list view | ✅ | `/app/(app)/projects` |
| Project creation wizard | ✅ | 5-step wizard |
| Project detail page | 🔄 | Route wired, detail tabs pending |
| CVR module | ✅ | `/app/(app)/cvr` + `[projectId]` |

### Commercial Module
| Feature | Status | Notes |
|---|---|---|
| Change events list | ✅ | `/app/(app)/changes` |
| Change event detail | ✅ | `/app/(app)/changes/[changeId]` |
| Change wizard | ✅ | 4-step wizard |
| Payment applications list | ✅ | `/app/(app)/applications` |
| Application wizard | ✅ | 5-step wizard |
| Payment certifications | 🔄 | DB ready, UI in-progress |
| Final account | 🔄 | DB ready, UI in-progress |

### Evidence & Documents
| Feature | Status | Notes |
|---|---|---|
| Evidence list | ✅ | `/app/(app)/evidence` |
| Evidence upload wizard | ✅ | 4-step + react-dropzone |
| Evidence links to records | ✅ | `evidence_links` table |
| Drawing register list | ✅ | `/app/(app)/drawings` |
| Drawing detail | ✅ | `/app/(app)/drawings/[drawingId]` |

### Tasks
| Feature | Status | Notes |
|---|---|---|
| Task list | ✅ | `/app/(app)/tasks` |
| Task wizard | ✅ | 3-step wizard |
| Task comments | 🔄 | DB ready, UI pending |

### Suppliers
| Feature | Status | Notes |
|---|---|---|
| Supplier list | ✅ | `/app/(app)/suppliers` |
| Supplier detail | ✅ | `/app/(app)/suppliers/[supplierId]` |
| Supplier wizard | ✅ | 4-step wizard with contacts |

### AI Features
| Feature | Status | Notes |
|---|---|---|
| AI bubble button | ✅ | Fixed position |
| AI copilot chat | ✅ | Streaming via OpenAI |
| AI inbox view | ✅ | Thread-based |
| AI notifications view | ✅ | Read/unread + filter |
| AI help view | ✅ | Quick links |
| Slash commands | ✅ | 13 commands |
| Usage meter | ✅ | Credit bar |
| `/api/ai/chat` route | ✅ | Streaming, gpt-4o-mini |

### Shared UI Infrastructure
| Component | Status |
|---|---|
| `modal.tsx` | ✅ |
| `confirm-dialog.tsx` | ✅ |
| `status-chip.tsx` | ✅ |
| `empty-state.tsx` | ✅ |
| `avatar.tsx` | ✅ |
| `loading-skeleton.tsx` | ✅ |
| `search-input.tsx` | ✅ |
| `view-switcher.tsx` | ✅ |
| `tabs.tsx` | ✅ |
| `page-header.tsx` | ✅ |
| `useDebounce` hook | ✅ |
| `useLocalStorage` hook | ✅ |
| `useMediaQuery` hook | ✅ |

---

## 2. Route Coverage

| Route | Type | Status |
|---|---|---|
| `/` | Marketing redirect | ✅ |
| `/(auth)/login` | Auth | ✅ |
| `/(auth)/signup` | Auth | ✅ |
| `/(auth)/forgot-password` | Auth | ✅ |
| `/(auth)/reset-password` | Auth | ✅ |
| `/(auth)/mfa` | Auth | ✅ |
| `/(auth)/onboarding` | Auth | ✅ |
| `/(app)/home` | App | ✅ |
| `/(app)/projects` | App | ✅ |
| `/(app)/changes` | App | ✅ |
| `/(app)/changes/[changeId]` | App | ✅ |
| `/(app)/applications` | App | ✅ |
| `/(app)/cvr` | App | ✅ |
| `/(app)/cvr/[projectId]` | App | ✅ |
| `/(app)/evidence` | App | ✅ |
| `/(app)/drawings` | App | ✅ |
| `/(app)/drawings/[drawingId]` | App | ✅ |
| `/(app)/suppliers` | App | ✅ |
| `/(app)/suppliers/[supplierId]` | App | ✅ |
| `/(app)/tasks` | App | ✅ |
| `/admin` | Admin | ✅ |
| `/admin/users` | Admin | ✅ |
| `/admin/workspaces` | Admin | ✅ |
| `/api/ai/chat` | API | ✅ |

**Missing V1 routes (V1.5 target):**
- `/app/reports` — reports list
- `/app/schedule` — Gantt/programme view
- `/app/site-map` — site map view
- `/app/bim` — BIM viewer
- `/app/final-accounts` — final account management
- `/app/settings` — workspace settings
- `/app/billing` — billing management

---

## 3. Button Sweep Status

| Area | Status | Notes |
|---|---|---|
| All primary CTAs wired | ✅ | |
| Wizard navigation (back/next) | ✅ | |
| Create buttons open correct wizard | 🔄 | Some pages still using alert() stub |
| Confirm dialogs on destructive actions | 🔄 | `confirm-dialog.tsx` built, not wired everywhere |
| Export/download buttons | ❌ | V1.5 — no export routes yet |

---

## 4. RLS Coverage

| Table | RLS Enabled | Policy Type |
|---|---|---|
| workspaces | ✅ | workspace_members lookup |
| workspace_members | ✅ | self-workspace |
| user_profiles | ✅ | own row |
| projects | ✅ | workspace_members |
| project_contracts | ✅ | workspace_members |
| change_events | ✅ | workspace_members |
| change_event_pricing | ✅ | workspace_members |
| payment_applications | ✅ | workspace_members |
| payment_application_lines | ✅ | workspace_members |
| payment_certifications | ✅ | workspace_members |
| payment_records | ✅ | workspace_members |
| cvr_periods | ✅ | workspace_members |
| cvr_lines | ✅ | workspace_members |
| cvr_risks | ✅ | workspace_members |
| final_accounts | ✅ | workspace_members |
| final_account_lines | ✅ | workspace_members |
| evidence_files | ✅ | workspace_members |
| evidence_links | ✅ | workspace_members |
| reports | ✅ | workspace_members |
| report_exports | ✅ | workspace_members |
| suppliers | ✅ | workspace_members |
| contacts | ✅ | workspace_members |
| tasks | ✅ | workspace_members |
| task_comments | ✅ | workspace_members |
| task_links | ✅ | workspace_members |
| schedule_items | ✅ | workspace_members |
| site_map_layers | ✅ | workspace_members |
| site_map_markers | ✅ | workspace_members |
| drawing_register | ✅ | workspace_members |
| drawing_revisions | ✅ | workspace_members |
| bim_models | ✅ | workspace_members |
| ai_action_requests | ✅ | workspace_members |
| ai_usage_ledger | ✅ | workspace_members |
| inbox_threads | ✅ | workspace_members |
| inbox_messages | ✅ | workspace_members |
| notifications | ✅ | own user |
| audit_log | ✅ | workspace_members (SELECT only) |
| feature_flag_overrides | ✅ | workspace + own user |

**All 38 tables have RLS enabled.**

---

## 5. Performance Notes

- All list pages use server components where possible; client components only for interactive state
- `loading.tsx` stubs present on `/app/(app)/home`; remaining routes use Suspense skeletons
- Images should use `next/image` with explicit width/height to avoid CLS
- Supabase queries should select specific columns (avoid `select *` in production)
- `useDebounce` applied to all search inputs (300ms)
- AI chat uses streaming responses to avoid timeout on long completions
- Framer Motion `AnimatePresence` used only in bubble panel and wizard transitions — no layout-blocking animations
- Consider adding `Cache-Control` headers to API routes that serve static-ish data (e.g. feature flags)

---

## 6. Vercel Deployment Checklist

- [ ] Set all env vars from `.env.example` in Vercel dashboard
- [ ] `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set (server-only)
- [ ] `OPENAI_API_KEY` set for AI copilot
- [ ] `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` set
- [ ] `RESEND_API_KEY` set for transactional email
- [ ] Supabase storage bucket `evidence` created with public/private policy
- [ ] Supabase `auth.users` trigger for `user_profiles` insert confirmed
- [ ] Run `001_initial_schema.sql` migration on production DB
- [ ] Verify RLS policies on production with a test user
- [ ] Configure Stripe webhook endpoint: `https://your-domain/api/stripe/webhook`
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain
- [ ] Enable Vercel Analytics
- [ ] Configure custom domain + SSL
- [ ] Set Vercel region to `lhr1` (London) for UK users
- [ ] Test all auth flows (signup, login, MFA, password reset) on prod
- [ ] Confirm AI bubble functional with OpenAI key
- [ ] Smoke test: create project → change event → application → evidence upload

---

## 7. Known V1 Limitations

1. **No reports/export module** — reports DB schema exists, PDF generation not implemented
2. **No schedule/Gantt view** — schedule_items table exists but no Gantt UI
3. **No site map view** — site_map tables exist but no map component (Mapbox/Leaflet not wired)
4. **No BIM viewer** — bim_models table exists but no IFC viewer component
5. **Final account UI** — DB ready, list/detail pages not built
6. **No billing portal** — Stripe integration schema exists but billing UI page not built
7. **AI inbox/notifications are seeded mock data** — not wired to real DB inbox_threads/notifications tables
8. **No real-time updates** — Supabase realtime subscriptions not implemented; pages require manual refresh
9. **No email templates** — Resend key set up but no transactional email flows coded
10. **Mobile experience** — desktop-first; mobile nav exists but complex views (CVR tables, drawing register) not optimised for mobile

---

## 8. V1.5 Roadmap Items

### Commercial
- [ ] Final account list + detail pages
- [ ] Variation summary report PDF export
- [ ] Payment application PDF generation
- [ ] Cashflow forecast chart

### Programme
- [ ] Gantt chart view (schedule_items → visual timeline)
- [ ] EOT claim workflow
- [ ] Programme delay tracker

### Documents & BIM
- [ ] Site map with Mapbox markers
- [ ] BIM model IFC viewer (via xeokit or IFC.js)
- [ ] Drawing revision comparison
- [ ] Document version control

### Platform
- [ ] Real-time notifications (Supabase Realtime)
- [ ] Workspace settings page
- [ ] Billing portal (Stripe Customer Portal)
- [ ] Team management UI (invite members, change roles)
- [ ] Email notifications via Resend
- [ ] Activity feed / audit trail UI
- [ ] Advanced analytics & reports module
- [ ] Mobile-optimised responsive views
- [ ] PWA / offline support for site use

### AI
- [ ] AI usage ledger wired to real token counts
- [ ] AI-generated CVR commentary
- [ ] AI contract risk scanner
- [ ] AI-assisted application drafting
- [ ] Persistent conversation history in DB

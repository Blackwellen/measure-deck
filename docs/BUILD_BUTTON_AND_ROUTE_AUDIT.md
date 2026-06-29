# MeasureDeck — Button & Route Audit
**Purpose:** Ensure every button/action is wired, every route is reachable, and no dead ends exist.

---

## Wiring Status Key

| Code | Meaning |
|------|---------|
| ✅ Wired | Button fires correct action, route returns 200 |
| ⚠️ Partial | Fires action but action is incomplete/mock |
| 🔴 Dead | Button exists but does nothing (onClick stub/TODO) |
| ❌ Missing | Expected button/route does not exist |
| ⏳ Planned | In scope for a specific phase |

---

## App Sidebar Navigation Links

| Nav Item | Route | Status | Phase |
|----------|-------|--------|-------|
| Home | /home | ✅ Wired | — |
| Projects | /projects | ✅ Wired | — |
| Changes / CEs | /changes | ✅ Wired | — |
| Applications | /applications | ✅ Wired | — |
| CVR | /cvr | ✅ Wired | — |
| Final Accounts | /final-accounts | ✅ Wired | — |
| Reports | /reports | ✅ Wired | — |
| Evidence | /evidence | ✅ Wired | — |
| Drawings | /drawings | ✅ Wired | — |
| Schedule | /schedule | ✅ Wired | — |
| Tasks | /tasks | ✅ Wired | — |
| Suppliers | /suppliers | ✅ Wired | — |
| Contacts | /contacts | ✅ Wired | — |
| BIM Models | /bim/models | ✅ Wired | — |
| Settings | /settings | ✅ Wired | — |
| Account | /account | ✅ Wired | — |
| Billing | /billing | ✅ Wired | — |
| Early Warnings | /early-warnings | ❌ Missing | P08 |
| Subcontracts | /subcontracts | ❌ Missing | P11 |
| CIS Compliance | /cis | ❌ Missing | P10 |
| Analytics | /analytics | ❌ Missing | P17 |
| Adjudication | /adjudication | ❌ Missing | P18 |
| Programmes | /programmes | ❌ Missing | P08 |

---

## Page-Level Button Audit

### /home (Dashboard)

| Button/Action | Expected Behaviour | Status | Phase |
|--------------|-------------------|--------|-------|
| "New Project" quick action | Opens ProjectWizard | ✅ Wired | — |
| "New CE" quick action | Opens ChangeWizard | ✅ Wired | — |
| "New Application" quick action | Opens ApplicationWizard | ✅ Wired | — |
| Project card → click | Navigates to /projects/[id] | ✅ Wired | — |
| Activity feed item → click | Navigates to relevant record | ⚠️ Partial | P05 |
| "View all" links | Navigate to respective list | ⚠️ Partial | P05 |

### /projects

| Button/Action | Expected Behaviour | Status | Phase |
|--------------|-------------------|--------|-------|
| "New Project" | Opens ProjectWizard | ✅ Wired | — |
| Project card → click | Navigates to /projects/[id] | ✅ Wired | — |
| Search | Filters project list | ✅ Wired | — |
| Filter button | Opens filter panel | ⚠️ Partial | P06 |
| View switcher (list/card/map) | Switches view | ⚠️ Partial | P06 |
| Sort | Sorts by column | ⚠️ Partial | P06 |
| Export | Exports projects to CSV | ❌ Missing | P06 |

### /projects/[id]

| Button/Action | Expected Behaviour | Status | Phase |
|--------------|-------------------|--------|-------|
| Edit project | Opens inline edit / modal | ⚠️ Partial | P06 |
| Add team member | Adds member to project | ⚠️ Partial | P06 |
| Add CE | Opens ChangeWizard pre-linked | ✅ Wired | — |
| Add Application | Opens ApplicationWizard pre-linked | ✅ Wired | — |
| Upload document | Opens upload modal | ⚠️ Partial | P06 |
| Add note | Creates note | ⚠️ Partial | P06 |
| View on map | Opens map tab | ⚠️ Partial | P06 |
| HGCRA dashboard link | /projects/[id]/hgcra-dashboard | ❌ Missing | P09 |
| NEC4 CE dashboard link | /changes/nec4-dashboard | ❌ Missing | P07 |
| Retention dashboard link | /projects/[id]/retention | ❌ Missing | P12 |
| Cashflow link | /projects/[id]/cashflow | ❌ Missing | P12 |
| Board pack | /projects/[id]/board-pack | ❌ Missing | P17 |

### /changes / /changes/[id]

| Button/Action | Expected Behaviour | Status | Phase |
|--------------|-------------------|--------|-------|
| "New CE" | Opens ChangeWizard | ✅ Wired | — |
| NEC4 workflow tab | Shows CE state machine | ❌ Missing | P07 |
| "Generate quotation" | Opens quotation builder | ❌ Missing | P07 |
| "Mark as submitted" | Updates CE state | ❌ Missing | P07 |
| "Flag deemed accepted" | Creates alert, updates state | ❌ Missing | P07 |
| CE dashboard button | /changes/nec4-dashboard | ❌ Missing | P07 |
| Export CE register | CSV/PDF export | ❌ Missing | P07 |
| Link to Early Warning | Links EW↔CE | ❌ Missing | P08 |

### /applications / /applications/[id]

| Button/Action | Expected Behaviour | Status | Phase |
|--------------|-------------------|--------|-------|
| "New Application" | Opens ApplicationWizard | ✅ Wired | — |
| "Issue Pay Less Notice" | /applications/[id]/pay-less-notice | ❌ Missing | P09 |
| "Suspend for non-payment" | /applications/[id]/suspension-notice | ❌ Missing | P09 |
| HGCRA timeline panel | Shows statutory dates | ❌ Missing | P09 |
| CIS calculation section | Shows deduction breakdown | ❌ Missing | P10 |
| Send to client | Portal share / email | ❌ Missing | P16 |
| "Certify" button | Records certification | ⚠️ Partial | P09 |
| "Mark paid" | Records payment date | ⚠️ Partial | P09 |

### /suppliers / /suppliers/[id]

| Button/Action | Expected Behaviour | Status | Phase |
|--------------|-------------------|--------|-------|
| "New Supplier" | Opens SupplierWizard | ✅ Wired | — |
| Companies House search | Returns CH data | ❌ Missing | P11 |
| CIS verify button | Calls HMRC API | ❌ Missing | P10 |
| Upload insurance cert | Stores in Supabase Storage | ⚠️ Partial | P11 |
| View subcontracts | /subcontracts filtered by supplier | ❌ Missing | P11 |
| Create subcontract | Opens SubcontractWizard | ❌ Missing | P11 |

### Admin Buttons

| Button/Action | Expected Behaviour | Status | Phase |
|--------------|-------------------|--------|-------|
| Toggle feature flag | Updates flag in DB | ⚠️ Partial (mock) | P02 |
| Suspend workspace | Calls suspend action | ✅ Wired | — |
| Delete workspace | Calls delete with confirm | ✅ Wired | — |
| Export audit log | CSV export | ❌ Missing | P17 |
| View integration health | Shows real health data | ⚠️ Partial (mock) | P19 |

---

## Routes That Return 404 (Must Fix)

*(Filled in as routes are discovered missing during phase builds)*

| Route | Expected | Discovered | Phase Fix |
|-------|---------|-----------|---------|
| /early-warnings | EWR list | 404 | P08 |
| /subcontracts | Subcontract list | 404 | P11 |
| /cis | CIS dashboard | 404 | P10 |
| /analytics | Analytics dashboard | 404 | P17 |
| /adjudication | Adjudication list | 404 | P18 |
| /programmes | Programme register | 404 | P08 |
| /portal/* | Client portal | 404 | P16 |
| /dayworks/mobile | Mobile daywork | 404 | P14 |

---

## Dead Button Tracker

*(Track any buttons discovered to do nothing — must be zero at Phase 20)*

| Page | Button Label | Issue | Phase Fix | Status |
|------|-------------|-------|----------|--------|
| /admin/audit | "Export" | No export handler | P17 | ⏳ |
| /admin/integrations | "Configure" (various) | Opens nothing | P19 | ⏳ |

---

## Route Protection Audit

| Route | Auth Required | Role Required | Workspace Scoped | Status |
|-------|-------------|--------------|-----------------|--------|
| /home | ✅ | member+ | ✅ | ✅ |
| /projects/* | ✅ | member+ | ✅ | ✅ |
| /admin/* | ✅ | platform_admin | ✅ | ✅ |
| /portal/[token] | ❌ (magic link) | — | token-scoped | ⏳ P16 |
| /api/ai/chat | ✅ | member+ | ✅ | ✅ |
| Edge functions | ✅ (JWT) | — | workspace-scoped | ⏳ P10+ |

---

## Wizard Flow Completeness

| Wizard | Steps | Save to Supabase | Error Handling | Draft Save | Mobile Layout | Status |
|--------|-------|-----------------|--------------|-----------|--------------|--------|
| ProjectWizard | 4 | ✅ | ⚠️ Partial | ❌ | ⚠️ | 🟠 |
| ChangeWizard | 4 | ✅ | ⚠️ Partial | ❌ | ⚠️ | 🟠 |
| ApplicationWizard | 4 | ✅ | ⚠️ Partial | ❌ | ⚠️ | 🟠 |
| CVRPeriodWizard | 4 | ✅ | ⚠️ Partial | ❌ | ⚠️ | 🟠 |
| FinalAccountWizard | 5 | ✅ | ⚠️ Partial | ❌ | ⚠️ | 🟠 |
| ReportBuilderWizard | 4 | ✅ | ⚠️ Partial | ❌ | ⚠️ | 🟠 |
| DrawingUploadWizard | 4 | ✅ | ⚠️ Partial | ❌ | ⚠️ | 🟠 |
| EvidenceUploadWizard | 3 | ✅ | ⚠️ Partial | ❌ | ⚠️ | 🟠 |
| SupplierWizard | 4 | ✅ | ⚠️ Partial | ❌ | ⚠️ | 🟠 |
| TaskWizard | 3 | ✅ | ⚠️ Partial | ❌ | ⚠️ | 🟠 |
| BimModelWizard | 3 | ✅ | ⚠️ Partial | ❌ | ⚠️ | 🟠 |
| SubcontractWizard | 5 | ❌ | ❌ | ❌ | ❌ | ❌ Missing |
| EWRWizard | 3 | ❌ | ❌ | ❌ | ❌ | ❌ Missing |
| ProgrammeWizard | 3 | ❌ | ❌ | ❌ | ❌ | ❌ Missing |
| DayworkWizard | 4 | ❌ | ❌ | ❌ | ❌ | ❌ Missing |
| SnagWizard | 3 | ❌ | ❌ | ❌ | ❌ | ❌ Missing |
| AdjudicationWizard | 3 | ❌ | ❌ | ❌ | ❌ | ❌ Missing |
| PCCertificateWizard | 4 | ❌ | ❌ | ❌ | ❌ | ❌ Missing |

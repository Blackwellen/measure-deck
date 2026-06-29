# MeasureDeck — UI Completion Matrix
**Purpose:** Track the completion level of every major UI area against the enterprise standard.

---

## Completion Level Key

| Level | Description |
|-------|-------------|
| ❌ Missing | Does not exist |
| 🔴 Stub | Route exists but is mostly empty/placeholder |
| 🟡 Partial | Has some content but missing key features |
| 🟠 Basic | Core features present but lacks commercial depth |
| 🟢 Complete | Full commercial depth, responsive, wired |
| ✅ Verified | Complete + tested + release-gated |

---

## App Routes — UI Completion

### Core Commercial

| Route | Page Exists | Tabs | Wizard | Mobile | Commercial Depth | V2 Additions | Phase | Status |
|-------|------------|------|--------|--------|-----------------|-------------|-------|--------|
| /home | ✅ | — | — | ⚠️ | 🟠 Basic | Board health score P17 | P05 | 🟠 |
| /projects | ✅ | — | ✅ | ⚠️ | 🟠 Basic | Advanced filters, map view | P06 | 🟠 |
| /projects/[id] | ✅ | 16 tabs | ✅ | ⚠️ | 🟢 V1 deep | Commercial tab, risk tab | P06 | 🟡 |
| /changes | ✅ | — | ✅ | ⚠️ | 🟠 Basic | NEC4 CE dashboard | P07 | 🟠 |
| /changes/[id] | ✅ | 9 tabs | ✅ | ⚠️ | 🟠 Basic | NEC4 workflow tab, quotation builder | P07 | 🟡 |
| /applications | ✅ | — | ✅ | ⚠️ | 🟠 Basic | HGCRA timeline, PLN link | P09 | 🟠 |
| /applications/[id] | ✅ | 10 tabs | ✅ | ⚠️ | 🟢 V1 deep | CIS section, PLN tab | P09/P10 | 🟡 |
| /cvr | ✅ | — | ✅ | ⚠️ | 🟠 Basic | Cross-project analytics link | P12 | 🟠 |
| /cvr/[id] | ✅ | 12 tabs | ✅ | ⚠️ | 🟠 Basic | WIP adj, margin bridge, EVM | P12 | 🟡 |
| /final-accounts | ✅ | — | ✅ | ⚠️ | 🟠 Basic | Subcontract FAs | P11 | 🟠 |
| /final-accounts/[id] | ✅ | 14 tabs | ✅ | ⚠️ | 🟢 V1 deep | Verified, further deepening | P06 | 🟢 |
| /suppliers | ✅ | — | ✅ | ⚠️ | 🟠 Basic | Companies House KYC | P11 | 🟠 |
| /suppliers/[id] | ✅ | 11 tabs | ✅ | ⚠️ | 🟠 Basic | CIS tab, compliance documents | P11 | 🟡 |
| /contacts | ✅ | — | ✅ | ⚠️ | 🟠 Basic | — | P05 | 🟠 |
| /contacts/[id] | ✅ | 6 tabs | ✅ | ⚠️ | 🟠 Basic | — | P05 | 🟡 |
| /tasks | ✅ | — | ✅ | ⚠️ | 🟠 Basic | — | P05 | 🟠 |
| /tasks/[id] | ✅ | 7 tabs | ✅ | ⚠️ | 🟠 Basic | — | P05 | 🟡 |
| /reports | ✅ | — | ✅ | ⚠️ | 🟠 Basic | Board pack generator | P17 | 🟠 |
| /reports/[id] | ✅ | 7 tabs | ✅ | ⚠️ | 🟠 Basic | — | P05 | 🟡 |
| /evidence | ✅ | — | ✅ | ⚠️ | 🟢 V1 deep | — | P05 | 🟢 |
| /evidence/[id] | ✅ | 7 tabs | ✅ | ⚠️ | 🟢 V1 deep | — | P05 | 🟢 |
| /drawings | ✅ | — | ✅ | ⚠️ | 🟢 V1 deep | CE linkage on revision | P07 | 🟢 |
| /drawings/[id] | ✅ | 8 tabs | ✅ | ⚠️ | 🟢 V1 deep | — | P05 | 🟢 |
| /schedule | ✅ | — | — | ⚠️ | 🟠 Basic | — | P06 | 🟠 |
| /schedule/[id] | ✅ | 6 tabs | — | ⚠️ | 🟠 Basic | — | P06 | 🟡 |
| /schedule/gantt | ✅ | — | — | ⚠️ | 🟠 Basic | Asta import | P18 | 🟠 |
| /bim/models | ✅ | — | ✅ | ⚠️ | 🟠 Basic | — | P05 | 🟠 |
| /bim/[id] | ✅ | 5 tabs | ✅ | ⚠️ | 🟠 Basic | — | P05 | 🟡 |
| /settings | ✅ | 3 tabs | — | ⚠️ | 🟠 Basic | HMRC creds, BYO integrations | P19 | 🟠 |
| /account | ✅ | — | — | ⚠️ | 🟠 Basic | — | P05 | 🟠 |
| /billing | ✅ | — | — | ⚠️ | 🟠 Basic | — | P05 | 🟠 |
| /workspace/settings | ✅ | — | — | ⚠️ | 🟠 Basic | — | P05 | 🟠 |

### V2 New Routes (Not Yet Existing)

| Route | Description | Phase | Status |
|-------|-------------|-------|--------|
| /early-warnings | Early Warning Register list | P08 | ❌ |
| /early-warnings/[id] | EW detail page | P08 | ❌ |
| /programmes | Programme notification register | P08 | ❌ |
| /subcontracts | Subcontract order list | P11 | ❌ |
| /subcontracts/[id] | Subcontract detail page | P11 | ❌ |
| /projects/[id]/hgcra-dashboard | HGCRA compliance dashboard | P09 | ❌ |
| /projects/[id]/retention | Retention ledger | P12 | ❌ |
| /projects/[id]/cashflow | Cashflow S-curve | P12 | ❌ |
| /projects/[id]/evm | EVM dashboard | P12 | ❌ |
| /projects/[id]/cdm | CDM compliance | P11 | ❌ |
| /projects/[id]/practical-completion | PC workflow | P13 | ❌ |
| /projects/[id]/snagging | Snagging register | P13 | ❌ |
| /projects/[id]/ai-contract-review | AI contract analyser | P15 | ❌ |
| /projects/[id]/ai-ce-scan | AI CE entitlement scanner | P15 | ❌ |
| /projects/[id]/board-pack | Board pack generator | P17 | ❌ |
| /projects/[id]/fluctuations | Fluctuations module | P12 | ❌ |
| /projects/[id]/delay-analysis | Delay analysis toolkit | P18 | ❌ |
| /projects/[id]/target-cost | NEC Options C/D module | P12 | ❌ |
| /applications/[id]/pay-less-notice | PLN generator | P09 | ❌ |
| /applications/[id]/suspension-notice | S112 notice | P09 | ❌ |
| /cis | CIS compliance dashboard | P10 | ❌ |
| /cis/monthly-return | CIS monthly return | P10 | ❌ |
| /changes/nec4-dashboard | NEC4 CE command centre | P07 | ❌ |
| /dayworks/mobile | Mobile daywork capture | P14 | ❌ |
| /adjudication | Adjudication case list | P18 | ❌ |
| /adjudication/[id] | Adjudication case detail | P18 | ❌ |
| /analytics | Cross-project analytics | P17 | ❌ |
| /analytics/board-pack | Portfolio board pack | P17 | ❌ |
| /portal/[token] | Client portal (external) | P16 | ❌ |
| /workspace/settings/bcis-indices | BCIS index management | P12 | ❌ |
| /workspace/settings/notifications/integrations | BYO notifications | P19 | ❌ |

### Admin Routes — UI Completion

| Route | Status | V2 Additions | Phase |
|-------|--------|-------------|-------|
| /admin | 🟠 Basic | Health score | P05 |
| /admin/users | 🟢 V1 deep | — | P05 |
| /admin/users/[id] | 🟢 V1 deep (8 tabs) | — | P05 |
| /admin/workspaces | 🟢 V1 deep | — | P05 |
| /admin/workspaces/[id] | 🟢 V1 deep (10 tabs) | Integration health | P05 |
| /admin/feature-flags | 🟠 Basic | V2 flags listed | P02 |
| /admin/audit | 🔴 Mock data | Real audit_events data | P03 |
| /admin/integrations | 🟠 Basic | Xero/Sage/HMRC status | P19 |
| /admin/health | 🟠 Basic | Edge function status | P19 |
| /admin/modules | 🟠 Basic | V2 module listing | P02 |

---

## Component Completeness

| Component | File | Status | V2 Enhancement | Phase |
|-----------|------|--------|---------------|-------|
| AppSidebar | shell/app-sidebar.tsx | 🟢 | Add EWR, subcontracts, CIS nav items | P05 |
| AdminSidebar | shell/admin-sidebar.tsx | 🟢 | — | P05 |
| TopBar | shell/top-bar.tsx | 🟢 | — | P05 |
| AIBubble | ai-bubble/bubble-button.tsx | 🟢 | Page context injection | P15 |
| CopilotView | ai-bubble/modes/copilot-view.tsx | 🟢 | CE narrative, contract review | P15 |
| NotificationsView | ai-bubble/modes/notifications-view.tsx | 🔴 Mock | Wire to real notifications | P19 |
| WizardShell | wizards/wizard-shell.tsx | 🟢 | — | P04 |
| Avatar | ui/avatar.tsx | 🟢 | — | — |
| ConfirmDialog | ui/confirm-dialog.tsx | 🟢 | — | P04 |
| EmptyState | ui/empty-state.tsx | 🟢 | — | P04 |
| LoadingSkeleton | ui/loading-skeleton.tsx | 🟢 | — | P04 |
| Modal | ui/modal.tsx | 🟢 | — | — |
| PageHeader | ui/page-header.tsx | 🟢 | — | — |
| SearchInput | ui/search-input.tsx | 🟢 | — | — |
| StatusChip | ui/status-chip.tsx | 🟢 | Expand variants | P04 |
| Tabs | ui/tabs.tsx | 🟢 | — | — |
| ViewSwitcher | ui/view-switcher.tsx | 🟢 | — | — |
| CountdownClock | ui/countdown-clock.tsx | ❌ | NEW | P04 |
| ComplianceBadge | ui/compliance-badge.tsx | ❌ | NEW | P04 |
| VerticalStepper | ui/vertical-stepper.tsx | ❌ | NEW | P04 |
| RiskMatrix | ui/risk-matrix.tsx | ❌ | NEW | P04 |
| SCurveChart | ui/s-curve-chart.tsx | ❌ | NEW | P04 |
| KPICard | ui/kpi-card.tsx | ❌ | NEW | P04 |
| AuditFeed | ui/audit-feed.tsx | ❌ | NEW | P04 |
| NotesComposer | ui/notes-composer.tsx | ❌ | NEW | P04 |
| FilterDrawer | ui/filter-drawer.tsx | ❌ | NEW | P04 |
| SavedViews | ui/saved-views.tsx | ❌ | NEW | P04 |
| MobileCardList | ui/mobile-card-list.tsx | ❌ | NEW | P04 |

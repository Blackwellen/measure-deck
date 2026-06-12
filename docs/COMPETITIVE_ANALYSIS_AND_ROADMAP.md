# MeasureDeck — Competitive Analysis, Feature Gap Audit & Pricing Roadmap
### Prepared June 2026 | Confidential — Founders Only

---

## EXECUTIVE SUMMARY

MeasureDeck sits at a genuinely underserved intersection: UK-contract-native commercial management (JCT/NEC) with an integrated CVR, payment application, and final account workflow. No single competitor owns this space cleanly. Procore is the incumbent but US-first. Asite is document-heavy but commercially thin. Candy PES is estimating-first and desktop-era. Causeway is strong on CVR but has no AI story.

**The opportunity to charge £120–£350/user/month (vs current likely £40–80) is real, but requires closing approximately 12 specific gaps.**

**The single most powerful positioning statement MeasureDeck can own:**

> *"The only commercial management platform built around UK contract law — NEC4 and JCT from first CE to final account, with built-in HGCRA compliance."*

No competitor can claim this. This positioning justifies premium pricing, creates high switching costs, and targets the highest-value buyer — commercial directors and QS teams managing complex UK contracts where getting the workflow wrong costs millions.

---

## CURRENT BUILD ASSESSMENT

| Metric | Count |
|--------|-------|
| Total pages (routes) | 86 |
| Components | 33 |
| Wizards | 12 |
| TypeScript errors | 0 |
| Database tables (live) | 130+ |
| Storage buckets | 5 |

**V1 modules fully built:**
- Projects (16-tab detail)
- Change Events / Compensation Events (9-tab detail, CE register)
- Payment Applications (10-tab detail with schedule of values, retention, SMPE)
- CVR — Cost Value Reconciliation (12-tab detail)
- Final Accounts (14-tab detail — full FA lifecycle)
- Evidence Library with AI classification
- Drawing Register with full-screen viewer
- BIM V1.5 (feature-flagged: IFC/Revit/NavisWorks models)
- Suppliers & Contacts with compliance tracking
- Tasks (Kanban) + Schedule (Gantt with S-curve)
- Reports Builder (7 report types)
- AI Copilot chat bubble (streaming, 4 modes)
- Full Admin Panel (24 screens including user, workspace, billing, flags)
- Full Auth (MFA, SSO-ready, onboarding wizard)
- Marketing + 8 legal pages (GDPR, DPA, Terms, Privacy, AUP, etc.)

**UK-specific features already in V1:**
- JCT/NEC contract type support
- CIS status fields on suppliers
- VAT registration tracking
- Retention percentage configuration
- Dayworks table in final accounts
- Extension of Time fields on change events
- Pay Less Notice fields on applications

---

## A. COMPETITOR LANDSCAPE

### 1. Procore (US — dominant global incumbent)

**Target users:** Project managers, site managers, GCs, main contractors. Commercial/QS secondary — added via acquisitions.

**Key differentiating features:**
- Commitments module (subcontract management + SOV tracking)
- Change Order workflow with margin-impact tracking
- Prime Contract module (owner-facing billing)
- Budget module with integrated cost coding
- Drawing/RFI/Submittal workflows tightly linked to cost events
- Procore Analytics (BI layer with cross-project benchmarking)
- Construction Financials with ERP integrations (Sage, Oracle, SAP)
- Field productivity tools (Daily Logs, Observations, Inspections)
- Workforce management with labour hour tracking

**Pricing:** Tiered by Annual Construction Volume (ACV). A mid-tier UK contractor doing £50M/year pays ~£25,000–£60,000/year per company (not per user). Bundles unlimited users.

**Weaknesses MeasureDeck can exploit:**
- No NEC4-native CE workflow — change events are generic, not clause-specific
- No UK CIS/VAT treatment baked in
- No retention trust compliance features
- No Pay Less Notice / HGCRA S111 workflow
- CVR is basic — no WIP adjustment, no margin reconciliation at package level
- Payment Applications are generic, not NEC/JCT-templated with notified sum logic
- Expensive for SME contractors and specialist subcontractors
- Complex implementation (6–12 months typical UK deployment)
- US-centric terminology confuses UK commercial teams

---

### 2. Asite (UK — document management and procurement)

**Target users:** Developers, tier 1 contractors, asset managers. Strong in CDE and procurement.

**Key differentiating features:**
- CDE compliant with ISO 19650 workflows
- Tender management and e-procurement
- RFI and document transmittal workflows
- Supply chain management and pre-qualification
- Early Warning Register (EWR) module — but basic
- Site diary and quality inspections
- Programme linking (interfaces with Asta, P6)

**Pricing:** Enterprise, typically £80,000–£300,000+/year for tier 1 contractors. Project-based licensing.

**Weaknesses MeasureDeck can exploit:**
- No integrated CVR — cost reporting is entirely manual after export
- No payment application workflow
- NEC CE workflow exists but is not deeply automated (no quotation clock tracking)
- No AI features of substance
- UI is 2015-era — QS teams hate it
- Very expensive, minimum viable spend excludes mid-market
- No mobile-first workflows

---

### 3. Candy PES (RIB Software / Nemetschek Group)

**Target users:** Estimators, QS professionals, project commercial managers. Strong in South Africa, Middle East, and UK specialist contractors.

**Key differentiating features:**
- Highly detailed BOQ estimating engine
- Resource-level cost build-ups (labour, plant, material, sub)
- Cashflow forecasting from programme + resource loading
- Valuation and cost control modules
- Progress measurement on BOQ items
- Procurement module with package-level budget control

**Pricing:** Candy iX (cloud version) ~£150–£300/user/month for full suite.

**Weaknesses MeasureDeck can exploit:**
- Desktop-first architecture — cloud is catch-up, not native
- No CE/change event workflow to NEC/JCT standard
- No drawing viewer or BIM integration
- No collaboration features — single-user model historically
- No AI features
- Payment Applications module missing notified sum logic
- No HMRC CIS API integration
- Terrible mobile experience

---

### 4. Causeway Technologies (UK — commercial management and CVR)

**Target users:** UK main contractors, commercial directors. **Closest direct competitor.**

**Key differentiating features:**
- Commercial Manager (CVR-centric): WIP, margin forecasting, cost-to-complete
- Valuations module with application for payment workflow
- Subcontract payment processing including retention
- Procurement and package management
- Reporting suite with PowerBI integration
- Integration with Coins ERP

**Pricing:** Mid-enterprise, typically £200–£600/user/year depending on modules.

**Weaknesses MeasureDeck can exploit:**
- No NEC4-specific CE workflow — change events are generic
- No AI layer
- No drawing register or BIM features
- No ISO 19650 CDE
- Limited mobile capability
- UI is dated (acquired legacy products)
- No integrated tasks/schedule module
- Weak evidence library
- No adjudication support features
- Setup is slow and consultant-heavy (4–8 weeks)

---

### 5. Coins (Construction Industry Software — ERP)

**Target users:** Large UK main contractors and housebuilders. Full ERP.

**Pricing:** Enterprise ERP — typically £500–£2,000/user/year plus implementation £100,000–£500,000.

**Position vs MeasureDeck:** Not a direct competitor — position MeasureDeck as "the commercial front-end for Coins." Coins is the back-office; MeasureDeck is the project commercial layer. Offer Coins integration as a key selling point.

**QS teams use Coins reluctantly; they maintain parallel Excel CVRs.** MeasureDeck replaces those Excel CVRs.

---

### 6. Eque2 (UK — construction accounting and CVR)

**Target users:** SME UK contractors, house builders, civil engineers.

**Pricing:** ~£100–£300/user/month for commercial modules.

**Weaknesses:** No CE workflow, no payment application module, no drawing tools, no AI, desktop/on-premise roots, not suitable for complex NEC projects.

---

### 7. 4PS Construct (Microsoft Dynamics 365-based)

**Target users:** Mid to large UK contractors, M&E contractors.

**Pricing:** Typically £120–£250/user/month for full Dynamics 365 bundle.

**Weaknesses:** Microsoft-standard UI not construction-native, no NEC/JCT contract workflows, no CE workflow, no drawing or BIM tools, no payment application module, heavy implementation (£50,000–£200,000 consultancy), Microsoft licensing dependency.

---

### 8. Trimble (via WinQS, Viewpoint, Prolog)

**WinQS** — Strong in BOQ estimating (~£150–£400/user/month) but weak in post-award commercial management. No NEC4 CE workflow, no AI, fragmented product suite.

---

### 9. Benchmarq (UK — niche, small vendor)

**Pricing:** ~£50–£100/user/month. Essentially a digital form system. No AI, no BIM, no drawing viewer, no CVR. MeasureDeck significantly outfeatures it already at all tiers.

---

## B. TOP 20 FEATURE GAPS (Priority Scored)

Scoring: Revenue Impact (1–5) × Ease of Implementation (1=hard, 5=easy) = Priority Score

---

### GAP 1 — NEC4 Compensation Event Quotation Clock & Workflow Engine
**Priority: CRITICAL | Highest Revenue Impact of All Gaps**

Full NEC4 CE workflow with automated clause compliance:
- PM instruction → CE notification (clause 61.3)
- Quotation due date countdown (3 weeks / 2 weeks per clause 62.3)
- Quotation submission → PM assessment
- Acceptance or contractor's own assessment (clause 64)
- **Deemed-accepted flag (clause 62.6)** — if PM does not respond within 2 weeks, CE is automatically deemed accepted at quoted amount

Also required:
- Early Warning Register (EWR) linkage → CE lineage (clause 15)
- Programme notification linkage (clause 32/62.2)
- Automatic deemed-accepted flagging with email alert

**Why UK teams need it:** NEC4 is mandatory on all government contracts (HS2, Network Rail, Highways England, MOD). Failure to notify within prescribed periods loses entitlement permanently. QS teams currently track this in spreadsheets.

**Premium justification:** A £50M NEC project where one CE is missed due to notification lapse can mean £200,000–£2,000,000 lost entitlement. This is the single biggest pricing lever in the product. Sell as "NEC compliance engine."

**Implementation:** CE state machine with clause-specific timers, role separation (PM/SC/Contractor), deemed-accepted logic, notification audit trail with legal timestamps.

---

### GAP 2 — Pay Less Notice (PLN) Workflow with HGCRA S111 Compliance
**Priority: CRITICAL**

Automated Pay Less Notice generation with HGCRA 1996 (as amended 2011) compliance:
- System calculates the statutory notice window (PLN must be issued not later than the prescribed period before the final date for payment — typically 7 days)
- Tracks: notified sum, withheld amount, grounds for withholding
- Creates a compliant S111 notice PDF
- Links to the corresponding payment application
- Audit trail of issue and receipt
- Calendar integration for deadline alerts

**Why UK teams need it:** Missing the PLN window means the contractor can pursue the full notified sum through adjudication. For a main contractor paying 50 subcontractors, managing PLN windows manually is a compliance risk. Getting this wrong leads to adjudications that paying parties typically lose (if the notice is late, the defence fails regardless of merit).

**Implementation:** Payment application timeline with prescribed period calculation, PLN template generator, notice tracking with read-receipt.

---

### GAP 3 — Right to Suspend / S112 HGCRA Workflow
**Priority: HIGH**

When a paying party fails to pay by the final date for payment without issuing a valid PLN, the contractor/subcontractor has a statutory right to suspend (S112 HGCRA):
- Detect overdue payment events automatically
- Generate S112 suspension notice with correct 7-day notice period
- Track suspension periods (which extend completion dates under NEC clause 60.1(18))
- Generate reinstatement notice when payment is made

---

### GAP 4 — CIS Monthly Return Automation & HMRC API Integration
**Priority: CRITICAL | Add-On Revenue**

Full CIS (Construction Industry Scheme) workflow:
- **HMRC verification API calls** for new subcontractors (returns gross/net/unmatched status)
- Automatic deduction calculation on each payment (20% net / 30% unverified)
- Monthly **CIS300 return generation** in HMRC-accepted format
- Year-end **CIS deduction statements** for subcontractors
- Integration with payment application module — when a payment is approved, CIS deduction automatically calculated and recorded
- **Domestic VAT Reverse Charge** handling (effective March 2021)

**Why teams need it:** HMRC compliance is non-negotiable. Penalties for incorrect returns: £100–£3,000/month. Current workflow is broken: commercial system → manual CIS spreadsheet → accountant files manually.

**Revenue:** £200/month flat company-wide add-on module.

---

### GAP 5 — Subcontract Order Management
**Priority: HIGH | Enterprise Sales Blocker**

Full subcontract lifecycle:
- Create subcontract order from package budget
- Select contract form (DOM/1, NEC4 ECC, bespoke)
- Define scope by reference to drawings/specs (linked from drawing register)
- Set payment terms, retentions, defects liability period
- Generate subcontract document pack
- Track subcontract value against budget
- Link CE register to subcontract

**Why teams need it:** Main contractors manage 20–100 subcontracts per project. Without this, enterprise clients maintain parallel systems (Excel + Word documents). Procore, Causeway and Coins all have this — it's table stakes for tier 1.

---

### GAP 6 — Delay Analysis Toolkit (EOT, Concurrent Delay, Programmes)
**Priority: HIGH | High Revenue, High Complexity**

- Structured EOT claim builder linked to CE register
- NEC: delay to planned Completion (clause 63.5), terminal float (clause 63.6)
- JCT: Relevant Events log (clause 2.26), notice obligations, architect's response
- Delay analysis methods: Time Impact Analysis (TIA), Impacted As-Planned, Windows Analysis
- Concurrent delay identification and flagging

**Why teams need it:** EOT claims are the most contested area of UK construction disputes. Getting the data organised in real-time (vs reconstructing months later) is extremely valuable.

**Premium justification:** A single successful EOT claim can be worth £500,000–£5,000,000. A tool that organises the evidence is worth significant money to a QS team.

---

### GAP 7 — Adjudication Support Module
**Priority: HIGH | Unique Differentiator**

Structured claim/dispute bundle preparation:
- Chronology builder
- Document indexing linked to evidence library
- Without-prejudice payment calculation
- Referral notice template, Response notice template
- Links to CE register, payment applications, PLNs
- Exports a compliant adjudication bundle

**Why teams need it:** UK construction has the highest adjudication rate in the world (~1,700 adjudications/year per RICS surveys). The cost of assembling a claim bundle (QS consultants at £200–£400/hour) is significant.

**Revenue:** £500/adjudication or £100/month add-on. No competitor offers this.

---

### GAP 8 — Cost-Plus / Target Cost (NEC4 Options C & D)
**Priority: HIGH | Public Sector Unlock**

Support for NEC4 Options C and D (target cost):
- Defined cost tracking with disallowed cost identification
- Pain/gain share calculation
- Contractor's share mechanism (NEC Option C clause 53)
- Transparent cost reporting to client
- Schedule of Cost Components (SCC) data entry

**Why teams need it:** UK public sector and complex infrastructure projects increasingly use target cost. HS2, Crossrail model contracts are target cost. This is growing rapidly.

---

### GAP 9 — Benchmarking & Cross-Project Analytics
**Priority: HIGH | Commercial Director Level**

Cross-project analytics:
- Cost/m² by project type
- Margin trends by project type/sector/client
- CE frequency and value benchmarks
- Payment timing trends (DSO — Days Sales Outstanding)
- CVR accuracy (forecast vs outturn)
- Optional: anonymous industry benchmarking (data pooling consent)

**Why teams need it:** Commercial directors and CFOs need portfolio-level intelligence. Currently generated from exported data in PowerBI or Excel.

**Revenue:** £500/month company-wide. Justify a "Director" tier pricing.

---

### GAP 10 — Retention Management Module
**Priority: CRITICAL | £9BN Industry Problem**

Full retention lifecycle:
- Retention fund calculation on each payment application
- First moiety release on practical completion
- Second moiety release on DLP expiry
- Retention bond management (alternative to cash retention)
- Moiety release notices
- Retention debtors and creditors ledger
- **DLUHC retention reform readiness** (trust account requirements when enacted — government reform coming)

**Why teams need it:** £9 billion of retention is outstanding in UK construction at any time (per BEIS consultation data). Contractors lose millions to client insolvency trapping retention.

---

### GAP 11 — Fluctuations / Price Escalation Module
**Priority: HIGH**

- JCT fluctuation clauses (Option A limited, Option B labour/material, Option C formula)
- NEC4 Z-clause fluctuations management
- **BCIS indices integration** (Building Cost Information Service)
- Automatic fluctuation entitlement calculation on payment applications
- Material price indices (steel, copper, timber, fuel)

**Why teams need it:** Post-2021 inflation spike made fluctuation clauses critically important. Cabinet Office PPN 02/21 and 09/22 mandated price adjustment provisions on government contracts. Fluctuation calculations are complex and time-consuming.

---

### GAP 12 — Supply Chain Pre-Qualification & Compliance Automation
**Priority: HIGH**

- Integration with **Constructionline**, **CHAS**, Acclaim Accreditation, TrustMark, SSIP
- **Companies House API** — automatic financial health checks
- **Credit score integration** (Creditsafe / D&B)
- Subcontractor insolvency risk score dashboard
- Automated expiry alerts for insurance, accreditation, certificates

**Why teams need it:** UK CDM Regulations require principal contractors to verify competence of all contractors. ~5,000+ UK construction insolvencies/year — supply chain risk is existential.

---

### GAP 13 — Mobile Daywork Sheet Capture (Photo-to-Daywork)
**Priority: CRITICAL | Stickiest Feature**

- Site foreman photographs workers, plant, and materials on site
- AI extracts: worker count, grade/classification, plant type and size, material quantities
- Auto-populates RICS Definition of Prime Cost of Daywork sheet
- Time recording via GPS-verified check-in/check-out
- Digital signature capture from client's representative
- Instant daywork register entry, linked to CE

**Why teams need it:** Dayworks are notoriously disputed because records are paper-based, often unsigned, and submitted late. Mobile capture at point of occurrence is transformational.

**Why it's sticky:** Daily habit driver — used on every working day with daywork activity. One saved disputed £5,000 daywork sheet pays for the software for a year.

---

### GAP 14 — Cashflow Forecasting with S-Curve and Finance Integration
**Priority: HIGH | CFO/FD Level**

- Revenue S-curve from programme
- Cost profile from subcontract orders + resource plans
- Retention cashflow modelling
- Payment timing (application date → cert date → payment date)
- Discounting for WACC
- Export to Excel/PDF for funder reporting
- Integration with Sage/Xero for actuals vs forecast comparison
- Negative cashflow early warning

**Why teams need it:** Cashflow is existential in construction. Contractors go insolvent while profitable. Commercial directors present cashflow to boards and funders monthly. Currently built in Excel.

---

### GAP 15 — Earned Value Management (EVM) Dashboard
**Priority: HIGH | Government Contracts**

- Planned Value (PV), Earned Value (EV), Actual Cost (AC) tracking
- CPI, SPI, EAC, VAC calculations
- Required on NEC target cost contracts
- IPA (Infrastructure and Projects Authority) mandates EVM on major infrastructure projects
- Required for G7 and G14 (public sector) contracts

---

### GAP 16 — Drawing Revision → CE Link (Smart Diff)
**Priority: HIGH**

- Automatic comparison between drawing revisions — highlights what changed geometrically
- AI-assisted scope change detection
- "Drawing change detected on Drawing X Rev C — do you want to raise a CE?" prompt
- Every drawing revision is potentially a compensation event — the commercial linkage is currently entirely manual

---

### GAP 17 — NRM2 / SMM7 Bill of Quantities Integration
**Priority: MEDIUM**

- Import and work with bills of quantities measured to NRM2 (RICS New Rules of Measurement 2) or SMM7
- Link BOQ items to CVR cost codes
- Progress measurement against BOQ for interim valuations
- Integration with CostX, Bluebeam for on-screen take-off
- Opens PQS consultancy market segment (not just contractors)

---

### GAP 18 — NEC4 Programme Notification Register (Clause 32)
**Priority: HIGH**

- Revised programme submission tracking (8-week cycle per clause 32)
- Programme acceptance/non-acceptance by PM
- Programme used for assessment baseline identification
- Terminal float protection tracking
- Notification log with statutory deadlines
- Programme is the most important document in an NEC contract — drives CE assessments, EOT entitlement, and Contractor's share

---

### GAP 19 — Client / Employer's Agent Portal
**Priority: CRITICAL | Network Effects**

Branded external portal for client/employer/employer's agent access:
- Client views: payment application status, CE register, programme, valuation certificates
- Client actions: issue payment notice, certify practical completion, issue PM instructions
- Full audit trail of communications between parties
- Structured process replaces email-based payment/CE negotiations

**Revenue model:** Main contractor pays MeasureDeck; brings their client onto the platform. Client access £20/external user/month. Network effect drives viral growth.

---

### GAP 20 — Practical Completion Certificate & Defects Management
**Priority: HIGH**

- PC certificate generation (JCT clause 2.30, NEC4 completion certificate)
- Sectional completion workflow
- Snagging list management (linked to drawing register)
- Defects notification period (DNP) tracking
- Making good defects certificate
- **Retention release trigger** (links first moiety release to PC)
- Mobile snagging app (photo capture, GPS location, assignee, due date)

---

## C. UK CONSTRUCTION SPECIFIC REQUIREMENTS

### NEC4 Contract Machinery — Full Implementation Roadmap

**CE Quotation Assessment Clock (clauses 61.4 / 62.3 / 62.5)**
- 3-week quotation submission deadline (or agreed period)
- 2-week acceptance deadline
- **Deemed acceptance if PM does not respond (clause 62.6)** — major entitlement trigger, auto-flagged

**Early Warning Register (clause 15)**
- EWR with risk owner, risk description, mitigation action
- Risk reduction meeting scheduling and minutes
- EW → CE lineage (traceable linkage from early warning to compensation event)

**Defined Cost / Disallowed Cost (Options C, D, E)**
- Schedule of Cost Components (SCC) data entry
- Shorter SCC for Options A and B
- Disallowed cost categories with justification
- Contractor's share mechanism (Option C clause 53)

**Secondary Options (NEC4 X and Y Clauses)**
- X2: Changes in law (automatic CE trigger on law change)
- X6: Bonus for early completion (programme integration)
- X7: Delay damages (liquidated damages calculation and tracking)
- X13: Performance bond tracking
- **Y(UK)2: HGCRA compliance** — payment notice workflow (statutory requirement)
- Y(UK)3: Contracts (Rights of Third Parties) Act

---

### JCT Clause-Specific Workflows

**Clause 4.7 — Interim Payment: Notified Sum**
Notified sum mechanism: interim application → payment notice by due date → pay less notice by prescribed period. Automate timeline for JCT contracts.

**Clause 4.21 — VAT / Domestic Reverse Charge**
Since March 2021, construction services between VAT-registered contractors are subject to DRC. Subcontractors do not charge VAT to main contractors — but payment applications must reflect this. No competitor handles DRC correctly.

**Clause 4.23 — CIS Deductions**
JCT clause 4.23 deals with CIS deductions on payment applications. The interaction between CIS, notified sum, and retention is complex and unique to UK construction.

**Clause 2.26–2.29 — Relevant Events and Extension of Time**
Structured log with notice dates, particulars, delay analysis, architect's response.

**Clause 2.32–2.35 — Loss and Expense**
Notice, ascertainment by architect/QS, payment through interim certificates. Structured claim builder.

---

### CIS Deep Requirements

1. HMRC CIS Online API — verify subcontractor status in real-time
2. Monthly CIS300 Return — auto-generate from payment data (XML for HMRC online filing)
3. Deduction Statements — annual CIS payment and deduction statements (required by 19 May each year)
4. Domestic VAT Reverse Charge — flag DRC applicability on payment applications
5. CIS Refund Tracking — for subcontractors who have overpaid CIS

---

### CDM 2015 Compliance Links

- HSE F10 notification linked to project data
- Principal Designer appointment tracking
- Construction Phase Plan (CPP) status and upload
- Health and Safety File management (document library integration)
- Designer/Contractor competence records in supplier management

---

### Right to Payment / HGCRA Compliance Features

HGCRA 1996 (as amended LDEDC 2009) gives contractors:
- **S109:** Right to stage payments
- **S110:** Right to payment notices
- **S111:** Right to pay less notices (with prescribed period) — **PLN workflow**
- **S112:** Right to suspend for non-payment (7-day notice) — **S112 workflow**

MeasureDeck should be positioned as the definitive HGCRA compliance tool. No competitor owns this.

---

## D. AI FEATURES THAT JUSTIFY PREMIUM PRICING

### AI Feature 1 — NEC/JCT Contract Clause Risk Analyser
Upload a contract → AI scans for: unusual Z-clauses, onerous amendments to standard terms, missing secondary options, liability caps, back-to-back provisions. Outputs a "contract risk score" with clause-by-clause commentary.

**Revenue:** £200/contract analysis or £500/month unlimited. Replaces £300–£500/hr solicitor review.

**Tech stack:** RAG over NEC4 and JCT standard forms, fine-tuned on UK construction contract case law.

---

### AI Feature 2 — CE Entitlement Identifier from Programme Data
Upload a programme (Asta/P6/MS Project export). AI compares planned vs actual dates, identifies activities delayed by NEC60.1 CE events, suggests CE notifications with supporting programme evidence, identifies concurrent delay exposure.

**Revenue:** Premium tier feature. On a complex programme, could identify £100,000–£500,000 of missed entitlements.

---

### AI Feature 3 — Photo-to-Daywork Sheet Generator
Site operative photographs resources on site. Computer vision identifies: worker count and likely trade grade, plant type and size, material quantities. AI populates RICS dayworks sheet. Human reviews and confirms. Digital signature captured on mobile.

**Daily use driver.** No competitor has this.

---

### AI Feature 4 — CE Narrative Auto-Generator
Based on: PM instruction text, drawing revision details, email thread, site diary entries — AI drafts the CE narrative (entitlement basis under NEC clause 60.1(x), programme impact, resource impact). QS reviews and edits rather than writing from scratch.

**ROI:** A QS on a major project writes 50–200 CE narratives per project. At 30 minutes per narrative, this feature saves 25–100 hours/project = £1,875–£7,500 per project.

---

### AI Feature 5 — Predicted Cash Flow from Historical Application Patterns
Based on historical payment application data, AI predicts: likely certification date, likely payment amount (based on historical discounting patterns), probability of withholding, portfolio cash position forecast. Flags clients with deteriorating payment behaviour.

---

### AI Feature 6 — Subcontractor Insolvency Risk Scoring
Combines: Companies House filing data, Creditsafe/D&B score, payment behaviour in MeasureDeck, HMRC CIS status changes. Real-time insolvency risk score per supply chain member.

**Why it matters:** UK construction has ~5,000+ insolvencies/year. A main contractor with 50 subcontractors on a project has material insolvency exposure.

---

### AI Feature 7 — Delay Analysis AI (Concurrent Delay Identification)
Given programme + CE register + actual completion data, AI applies Time Impact Analysis to: identify critical path delay events, classify delays (Employer Risk / Contractor Risk / Neutral), identify concurrent delay periods, estimate EOT entitlement.

**Revenue:** Reduces reliance on external delay analysts (£200–£600/day).

---

### AI Feature 8 — BCIS / Fluctuations Index Market Intelligence
Live feed of BCIS indices (tender price index, general building cost index, specialist M&E/civils indices). AI alerts when fluctuation entitlement threshold is triggered. Portfolio-level impact assessment when indices move significantly.

---

## E. INTEGRATION ECOSYSTEM

### Priority Accounting Integrations

| System | Priority | Why |
|--------|----------|-----|
| **Sage 200** | P1 | ~40% of UK mid-market construction |
| **Coins OA** | P1 | Dominant in large UK main contractors — position MeasureDeck as "commercial front-end" |
| **Xero** | P2 | Growing in SME construction |
| **Eque2 Construct** | P2 | Mid-market UK |
| **Sage 50** | P2 | SME |
| **Oracle Fusion/JDE** | P3 | Tier 1 contractors |
| **QuickBooks** | P3 | Smaller UK market |

---

### Priority Planning / Programme Integrations

| System | Priority | Why |
|--------|----------|-----|
| **Asta Powerproject** | **P1 CRITICAL** | ~60% of UK main contractors. Table stakes for enterprise sales. |
| **Microsoft Project** | P2 | ~25% of UK contractors |
| **Primavera P6** | P2 | Major infrastructure contractors |
| **Elecosoft Powerproject BIM** | P3 | Growing 4D market |

**Asta Powerproject integration is the single most important integration for enterprise sales.** Deep bi-directional sync with CE linkage (drawing change on programme → auto-suggest CE) is a genuine moat.

---

### Drawing / Document Management Integrations

| System | Value |
|--------|-------|
| **Autodesk Construction Cloud (ACC)** | Import drawing revisions, trigger CE workflow on rev change |
| **Procore** | Two-way sync for contractors whose client uses Procore |
| **Aconex / Oracle** | Common on tier 1 projects |
| **SharePoint/Teams** | Document storage fallback for Microsoft-heavy contractors |
| **Bluebeam Revu** | Take-off markup import, QS measurement workflow |

---

### Compliance & Verification APIs

| Integration | Value |
|-------------|-------|
| **HMRC CIS Online** | Real-time subcontractor verification, monthly return filing |
| **HMRC Making Tax Digital (MTD)** | VAT return preparation, DRC calculations |
| **Companies House API** | Automatic company verification, financial health |
| **Constructionline API** | Real-time pre-qualification status |
| **CHAS API** | Health & safety accreditation status |
| **Creditsafe / D&B** | Financial health and credit scoring |
| **Achilles UVDB** | Utilities sector supply chain compliance |
| **TrustMark** | Domestic/retrofit projects |

---

## F. PRICING STRATEGY

### Market Benchmarks

| Competitor | Model | Approximate Cost |
|------------|-------|-----------------|
| Procore | ACV-based company licence | £25,000–£100,000/year per company |
| Asite | Project-based enterprise | £80,000–£300,000+/year |
| Candy PES | Per seat subscription | £150–£300/user/month |
| Causeway Commercial Manager | Per user | £200–£600/user/year |
| 4PS Construct | Per user (D365-based) | £120–£250/user/month |
| Eque2 | Per user | £100–£300/user/month |
| Benchmarq | Per user | £50–£100/user/month |

---

### Recommended MeasureDeck Pricing Architecture

**Tier 1 — Essentials** (Subcontractors, small contractors, 1–5 users)
- CVR, Payment Applications, CE Register, Evidence Library, Drawing Register (basic), Tasks
- Price: **£65/user/month**
- Rationale: Undercuts Candy PES and 4PS, massively outfeatures Benchmarq

**Tier 2 — Professional** (Mid-tier main contractors, 5–50 users)
- Everything in Essentials + Final Accounts, Full AI Copilot, Reports Builder, Suppliers/Compliance, Gantt Schedule, Client Portal
- Price: **£120/user/month**
- Rationale: Competitive with Causeway, significantly better product

**Tier 3 — Enterprise** (Tier 1 contractors, multi-project, 50+ users)
- Everything in Professional + NEC4 CE Clock Engine, PLN/HGCRA Workflow, CIS Integration, Cross-Project Analytics, EVM, BIM, Adjudication Module, Subcontract Management, Asta Powerproject Integration, SSO, dedicated CSM
- Price: **£180–£250/user/month** or project-based
- Rationale: Competes directly with Procore at lower price, with UK-native contract support Procore lacks

---

### Add-On Modules

| Module | Price |
|--------|-------|
| CIS Compliance Suite (HMRC API + monthly returns) | **£200/month flat** (company-wide) |
| Adjudication Bundle Builder | **£500/adjudication** or £100/month |
| NEC4 CE Engine (upgrade from standard CE register) | **£30/user/month** |
| AI Contract Risk Analyser | **£200/contract analysis** |
| Advanced Analytics / Cross-Project BI | **£500/month** (company-wide) |
| Client Portal (external access) | **£20/external user/month** |
| Fluctuations Module | **£20/user/month** |
| Asta Powerproject Integration | **£15/user/month** |
| CIS + VAT Compliance Pack | **£30/user/month** |

---

### Project-Based Pricing (Alternative for Tier 1)

For large contractors managing projects of £10M–£500M, per-project pricing is often more palatable to finance teams:

| Project Value | Monthly Price |
|--------------|---------------|
| Up to £5M | £500/month |
| £5M–£25M | £1,500/month |
| £25M–£100M | £3,500/month |
| £100M+ | £7,500/month (custom) |

---

### Enterprise / Framework Agreements

Target framework agreements with:
- **Tier 1 contractors** (Balfour Beatty, Mace, Laing O'Rourke, Kier, BAM, Morgan Sindall, Willmott Dixon): Company-wide licence £250,000–£750,000/year
- **QS Consultancies** (AECOM, Turner & Townsend, Gleeds, Arcadis, Faithful+Gould): Consultancy licence with client project billing, £500–£2,000/project
- **Public Sector Frameworks** (Crown Commercial Service / Procure Plus): Government-approved procurement route — requires ISO 27001, G-Cloud listing, Cyber Essentials Plus

---

## G. STRATEGIC ROADMAP — TOP 12 FEATURES TO BUILD

| Rank | Feature | Why This Priority | Timeline Estimate |
|------|---------|------------------|-------------------|
| 1 | **NEC4 CE Quotation Clock Engine** | The moat — nobody has this; biggest entitlement value | 6–8 weeks |
| 2 | **Pay Less Notice / HGCRA S111** | Statutory compliance; enterprise sales hook | 3–4 weeks |
| 3 | **Mobile Daywork Capture (with AI)** | Daily habit driver; stickiest feature | 6–8 weeks |
| 4 | **CIS Return Automation + HMRC API** | Regulatory requirement; replaces external tools | 4–6 weeks |
| 5 | **Retention Management + Reform Readiness** | £9bn industry problem; DLUHC reform coming | 3–4 weeks |
| 6 | **Subcontract Order Management** | Without it, enterprise clients maintain parallel systems | 4–6 weeks |
| 7 | **AI Contract Clause Risk Analyser** | No competitor has this; replaces £300/hr lawyers | 6–10 weeks |
| 8 | **Client/Employer's Agent Portal** | Network effect; viral growth driver | 6–8 weeks |
| 9 | **Asta Powerproject Integration** | 60% of UK main contractors use Asta; enterprise sales blocker | 6–10 weeks |
| 10 | **Cashflow S-Curve Forecasting** | CFO/FD feature; board-level visibility | 3–4 weeks |
| 11 | **Practical Completion & Snagging App** | Closes full contract lifecycle; mobile daily use | 4–6 weeks |
| 12 | **Adjudication Bundle Builder** | Unique in market; high perceived value | 4–6 weeks |

---

## H. THE 3 IMMEDIATE MOVES

**Move 1: NEC4 CE Clock Engine**
Builds directly on the existing CE register. Add clause-specific timer state machine + deemed-accepted logic + EWR linkage. This is the moat that no competitor can claim.

**Move 2: PLN / HGCRA S111 Workflow**
Builds on the existing payment applications module. Add prescribed period calculation + notice PDF generator + audit trail. Statutory — forces adoption.

**Move 3: Mobile Daywork Capture**
Daily habit driver. Photo capture + AI extraction + RICS template + digital signature. One saved disputed daywork sheet pays for months of subscription. Makes MeasureDeck indispensable on site, not just in the office.

---

## I. COMPETITIVE MOAT SUMMARY

MeasureDeck's defensible advantages once the roadmap above is executed:

1. **UK contract law native** — NEC4 clause machinery, JCT payment mechanism, HGCRA S111/S112 built into every workflow
2. **HMRC CIS compliance** — automated monthly returns, domestic VAT reverse charge
3. **Full project lifecycle** — from CE notification through final account to PC certificate and DLP expiry
4. **Evidence → CE linkage** — photo evidence linked to compensation events at time of capture
5. **AI CE narratives** — saves QS teams 25–100 hours per project
6. **Deemed-accepted intelligence** — automatically identifies where clients have lost the right to dispute a CE
7. **Network effects** — client portal brings employer/EA onto the platform; each main contractor connection brings 10–50 client users

**No competitor combines all of these.** The switching cost, once a project's full CE register, payment application history, and evidence library are in MeasureDeck, is extremely high. This creates durable retention.

---

*Document prepared June 2026. For internal use only.*
*Based on trained knowledge of UK construction software market, NEC4 and JCT contract machinery, HMRC CIS regulations, HGCRA 1996 as amended, RICS measurement standards, and competitor product knowledge.*

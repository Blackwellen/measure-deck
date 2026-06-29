// Realistic construction project seed data for MeasureDeck

export type ProjectStatus = "active" | "on_hold" | "completed" | "disputed" | "archived";

export interface SeedProject {
  id: string;
  ref: string;
  name: string;
  client: string;
  contractValue: number;
  certifiedToDate: number;
  margin: number;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  contractType: string;
  retentionPercent: number;
  paymentTerms: number;
  description: string;
  logoInitials: string;
  logoColor: string;
  address: string;
  postcode: string;
  lat: number;
  lng: number;
  projectLead: string;
  team: string[];
}

export const SEED_PROJECTS: SeedProject[] = [
  {
    id: "proj-001",
    ref: "MD-2024-001",
    name: "Eastside Residential Block A",
    client: "Redstone Developments Ltd",
    contractValue: 4_850_000,
    certifiedToDate: 3_492_000,
    margin: 16.4,
    status: "active",
    startDate: "2024-03-01",
    endDate: "2026-09-30",
    contractType: "JCT Design & Build 2016",
    retentionPercent: 3.0,
    paymentTerms: 21,
    description: "New-build residential development comprising 96 apartments across 8 storeys. Ground floor commercial units. Full M&E, structural and fit-out package.",
    logoInitials: "ER",
    logoColor: "#3B5EE8",
    address: "Eastside Quarter, Stratford, London",
    postcode: "E15 2GW",
    lat: 51.5416,
    lng: -0.0042,
    projectLead: "James Thornton",
    team: ["Sarah Mitchell", "Tom Baxter", "Rachel Okafor"],
  },
  {
    id: "proj-002",
    ref: "MD-2024-002",
    name: "Meridian Office Park Phase 2",
    client: "Meridian Properties Group",
    contractValue: 6_200_000,
    certifiedToDate: 5_456_000,
    margin: 13.8,
    status: "active",
    startDate: "2023-09-15",
    endDate: "2026-04-30",
    contractType: "NEC4 ECC Option A",
    retentionPercent: 2.5,
    paymentTerms: 28,
    description: "Category B fit-out and base-build completion for 3 commercial office buildings totalling 42,000 sqft. BREEAM Excellent target.",
    logoInitials: "MO",
    logoColor: "#10B981",
    address: "Meridian Business Park, Reading, Berkshire",
    postcode: "RG2 6UB",
    lat: 51.4309,
    lng: -0.9619,
    projectLead: "Sarah Mitchell",
    team: ["James Thornton", "Daniel Price"],
  },
  {
    id: "proj-003",
    ref: "MD-2024-003",
    name: "Thornfield Commercial Hub",
    client: "Thornfield Estates plc",
    contractValue: 3_850_000,
    certifiedToDate: 2_118_500,
    margin: 11.2,
    status: "disputed",
    startDate: "2024-01-08",
    endDate: "2026-11-30",
    contractType: "JCT SBC/Q 2016",
    retentionPercent: 5.0,
    paymentTerms: 21,
    description: "Mixed-use commercial hub development. Ongoing dispute on VO-047 (£85,000). Final account negotiations anticipated.",
    logoInitials: "TC",
    logoColor: "#EF4444",
    address: "Thornfield Way, Birmingham, West Midlands",
    postcode: "B5 4RX",
    lat: 52.4751,
    lng: -1.8936,
    projectLead: "Tom Baxter",
    team: ["Rachel Okafor", "James Thornton"],
  },
  {
    id: "proj-004",
    ref: "MD-2024-004",
    name: "Riverside Apartments",
    client: "Riverside Living Ltd",
    contractValue: 2_950_000,
    certifiedToDate: 590_000,
    margin: 15.9,
    status: "active",
    startDate: "2025-07-01",
    endDate: "2027-06-30",
    contractType: "JCT Design & Build 2016",
    retentionPercent: 3.0,
    paymentTerms: 21,
    description: "Riverside regeneration scheme. 64-unit residential development with communal amenity spaces and ground-floor retail units.",
    logoInitials: "RA",
    logoColor: "#8B5CF6",
    address: "Riverside Walk, Manchester, Greater Manchester",
    postcode: "M3 4JR",
    lat: 53.4779,
    lng: -2.2549,
    projectLead: "Rachel Okafor",
    team: ["Daniel Price", "Sarah Mitchell"],
  },
  {
    id: "proj-005",
    ref: "MD-2024-005",
    name: "Harlow Civic Centre Refurb",
    client: "Harlow District Council",
    contractValue: 3_150_000,
    certifiedToDate: 1_417_500,
    margin: 17.1,
    status: "active",
    startDate: "2024-06-03",
    endDate: "2026-12-31",
    contractType: "NEC4 ECC Option C",
    retentionPercent: 3.0,
    paymentTerms: 14,
    description: "Full refurbishment of Grade II listed civic centre including structural repairs, M&E replacement, and heritage façade restoration.",
    logoInitials: "HC",
    logoColor: "#F59E0B",
    address: "The Water Gardens, Harlow, Essex",
    postcode: "CM20 1WG",
    lat: 51.7676,
    lng: 0.0916,
    projectLead: "Daniel Price",
    team: ["Tom Baxter", "James Thornton"],
  },
  {
    id: "proj-006",
    ref: "MD-2024-006",
    name: "Kings Cross Fit-out",
    client: "Urban Space Developments",
    contractValue: 1_820_000,
    certifiedToDate: 564_200,
    margin: 9.4,
    status: "on_hold",
    startDate: "2025-02-01",
    endDate: "2026-08-31",
    contractType: "JCT Intermediate 2016",
    retentionPercent: 2.5,
    paymentTerms: 21,
    description: "Category A and B fit-out for mixed-use commercial space. Currently on hold pending planning determination for mezzanine extension.",
    logoInitials: "KX",
    logoColor: "#06B6D4",
    address: "Pancras Road, Kings Cross, London",
    postcode: "N1C 4AG",
    lat: 51.5345,
    lng: -0.1258,
    projectLead: "Sarah Mitchell",
    team: ["Rachel Okafor"],
  },
  {
    id: "proj-007",
    ref: "MD-2023-007",
    name: "Whitfield Leisure Centre",
    client: "Whitfield Borough Council",
    contractValue: 2_400_000,
    certifiedToDate: 2_352_000,
    margin: 14.7,
    status: "completed",
    startDate: "2023-01-10",
    endDate: "2025-12-31",
    contractType: "NEC4 ECC Option A",
    retentionPercent: 3.0,
    paymentTerms: 14,
    description: "New leisure centre construction including 25m pool, sports hall, gym and café. BREEAM Very Good achieved. Final account in progress.",
    logoInitials: "WL",
    logoColor: "#64748B",
    address: "Whitfield Park, Leeds, West Yorkshire",
    postcode: "LS11 5DR",
    lat: 53.7797,
    lng: -1.5492,
    projectLead: "James Thornton",
    team: ["Tom Baxter", "Daniel Price"],
  },
  {
    id: "proj-008",
    ref: "MD-2022-008",
    name: "Parklands Primary School",
    client: "Essex County Council",
    contractValue: 4_200_000,
    certifiedToDate: 4_200_000,
    margin: 13.2,
    status: "archived",
    startDate: "2022-04-01",
    endDate: "2024-08-31",
    contractType: "JCT Design & Build 2016",
    retentionPercent: 3.0,
    paymentTerms: 21,
    description: "New-build 2-form entry primary school with nursery, sports facilities and community hall. Defects Period expired. Retention released.",
    logoInitials: "PP",
    logoColor: "#94A3B8",
    address: "Parklands Avenue, Chelmsford, Essex",
    postcode: "CM2 9BU",
    lat: 51.7234,
    lng: 0.4685,
    projectLead: "Rachel Okafor",
    team: ["Sarah Mitchell"],
  },
];

// Detail-level seed for the main demo project
export const SEED_PROJECT_DETAIL = SEED_PROJECTS[0]; // Eastside Residential Block A

export const SEED_CHANGES = [
  { id: "ch-001", ref: "VO-001", title: "Additional underground drainage run", type: "variation", value: 42_500, status: "approved", raisedDate: "2024-05-12", projectId: "proj-001" },
  { id: "ch-002", ref: "VO-002", title: "Structural engineer revised pile caps", type: "variation", value: 87_000, status: "approved", raisedDate: "2024-06-01", projectId: "proj-001" },
  { id: "ch-003", ref: "VO-003", title: "Design freeze delay – architect instruction", type: "eot_claim", value: 24_000, status: "pending", raisedDate: "2024-07-14", projectId: "proj-001" },
  { id: "ch-004", ref: "VO-047", title: "Mechanical services reroute – Thornfield", type: "variation", value: 85_000, status: "disputed", raisedDate: "2025-03-22", projectId: "proj-003" },
  { id: "ch-005", ref: "VO-052", title: "Additional drainage – Thornfield instruction", type: "instruction", value: 18_000, status: "pending", raisedDate: "2026-06-10", projectId: "proj-003" },
];

export const SEED_APPLICATIONS = [
  { id: "app-001", ref: "PA-014", number: 14, value: 380_000, grossCumulative: 3_112_000, status: "outstanding", submittedDate: "2026-05-23", dueDate: "2026-06-13", projectId: "proj-001" },
  { id: "app-002", ref: "PA-013", number: 13, value: 290_000, grossCumulative: 2_732_000, status: "paid", submittedDate: "2026-04-22", dueDate: "2026-05-13", projectId: "proj-001" },
  { id: "app-003", ref: "PA-012", number: 12, value: 310_000, grossCumulative: 2_442_000, status: "certified", submittedDate: "2026-03-20", dueDate: "2026-04-10", projectId: "proj-001" },
];

export const SEED_CVR_PERIODS = [
  { id: "cvr-001", period: 8, reportDate: "2026-06-01", contractValue: 4_850_000, costToDate: 2_918_640, valueToDate: 3_492_000, margin: 16.4, status: "draft", projectId: "proj-001" },
  { id: "cvr-002", period: 7, reportDate: "2026-05-01", contractValue: 4_850_000, costToDate: 2_612_700, valueToDate: 3_112_000, margin: 15.9, status: "approved", projectId: "proj-001" },
  { id: "cvr-003", period: 6, reportDate: "2026-04-01", contractValue: 4_850_000, costToDate: 2_294_400, valueToDate: 2_732_000, margin: 15.3, status: "approved", projectId: "proj-001" },
];

export const SEED_EVIDENCE = [
  { id: "ev-001", title: "Site Photo Pack – Drainage Works", type: "photo", linkedChange: "VO-001", status: "linked", uploadedDate: "2024-05-15", projectId: "proj-001" },
  { id: "ev-002", title: "Architect's Instruction AI-0042", type: "instruction", linkedChange: "VO-002", status: "linked", uploadedDate: "2024-06-03", projectId: "proj-001" },
  { id: "ev-003", title: "Delay Programme Analysis", type: "programme", linkedChange: "VO-003", status: "linked", uploadedDate: "2024-07-20", projectId: "proj-001" },
  { id: "ev-004", title: "Daywork Sheet DW-047", type: "daywork", linkedChange: null, status: "unlinked", uploadedDate: "2026-05-28", projectId: "proj-001" },
  { id: "ev-005", title: "Photographic Record – Roof Level", type: "photo", linkedChange: null, status: "unlinked", uploadedDate: "2026-06-02", projectId: "proj-001" },
];

export const SEED_TASKS = [
  { id: "task-001", title: "Issue EoT Notice – Section 4.1", priority: "critical", dueDate: "2026-06-11", status: "open", assignee: "James Thornton", projectId: "proj-001" },
  { id: "task-002", title: "Prepare Application #15", priority: "high", dueDate: "2026-06-12", status: "in_progress", assignee: "Sarah Mitchell", projectId: "proj-001" },
  { id: "task-003", title: "Upload daywork sheets DW-048 to DW-053", priority: "high", dueDate: "2026-06-13", status: "open", assignee: "Tom Baxter", projectId: "proj-001" },
  { id: "task-004", title: "Sign off CVR Period 8", priority: "medium", dueDate: "2026-06-14", status: "open", assignee: "Rachel Okafor", projectId: "proj-001" },
];

export const SEED_AUDIT_LOG = [
  { id: "al-001", user: "James Thornton", action: "Updated contract value", detail: "Contract value adjusted to £4,850,000 following Final Scope Agreement", timestamp: "2026-06-09T14:30:00Z", projectId: "proj-001" },
  { id: "al-002", user: "Sarah Mitchell", action: "Submitted Application #14", detail: "Gross cumulative: £3,112,000. Net this period: £380,000", timestamp: "2026-05-23T10:15:00Z", projectId: "proj-001" },
  { id: "al-003", user: "Rachel Okafor", action: "Approved CVR Period 7", detail: "Margin: 15.9%. Approved by Senior QS.", timestamp: "2026-05-05T09:00:00Z", projectId: "proj-001" },
  { id: "al-004", user: "Tom Baxter", action: "Raised VO-003", detail: "Extension of Time claim. Value: £24,000. Status: Pending", timestamp: "2024-07-14T11:45:00Z", projectId: "proj-001" },
];

export const SEED_DRAWINGS = [
  { id: "dr-001", drawingNo: "SIT-001", title: "Site Layout Plan", revision: "P4", date: "2026-04-10", status: "issued", type: "Site", actions: ["view", "download"] },
  { id: "dr-002", drawingNo: "STR-042", title: "Ground Floor Structural Layout", revision: "C2", date: "2026-03-15", status: "for_construction", type: "Structural", actions: ["view", "download"] },
  { id: "dr-003", drawingNo: "MEP-018", title: "Level 3 HVAC Layout", revision: "B1", date: "2026-02-28", status: "for_comment", type: "MEP", actions: ["view", "download"] },
  { id: "dr-004", drawingNo: "ARC-105", title: "Apartment Type A – Plan & Elevation", revision: "P6", date: "2026-05-01", status: "issued", type: "Architectural", actions: ["view", "download"] },
];

// ─── Expanded project data matching design images ──────────────────────────

export interface SeedContact {
  name: string;
  role: string;
  company: string;
  email: string;
  phone: string;
  type: 'internal' | 'client' | 'contractor';
  badge?: string;
}

export interface SeedMilestone {
  name: string;
  baseline: string;
  forecast: string;
  status: 'on_track' | 'at_risk' | 'complete';
}

export interface SeedChange {
  ref: string;
  title: string;
  package: string;
  raisedBy: string;
  requestedValue: number;
  assessedValue: number;
  status: 'pending' | 'approved' | 'rejected' | 'under_review' | 'negotiation';
  risk: 'low' | 'medium' | 'high';
  evidenceCount: number;
  dateRaised: string;
  decisionDue: string;
  isOverdue?: boolean;
}

export interface SeedApplication {
  ref: string;
  period: string;
  appValue: number;
  certifiedValue: number;
  status: 'paid' | 'pending' | 'disputed';
  submittedDate: string;
  dueDate: string;
  paidDate?: string;
  noticeRef: string;
  evidenceCount: number;
  owner: string;
}

export interface SeedEvidenceItem {
  ref: string;
  title: string;
  type: string;
  linkedRecord: string;
  relatedNotice?: string;
  status: 'verified' | 'approved' | 'reviewed' | 'pending_review' | 'pending' | 'at_risk' | 'rejected';
  dateCaptured: string;
  capturedBy: string;
  reviewDue: string;
  aiSummary: string;
}

export interface SeedSupplier {
  name: string;
  package: string;
  packageRef: string;
  contactName: string;
  contractValue: number;
  committedSpend: number;
  performanceScore: number;
  insuranceExpiry: string;
  ramsStatus: 'compliant' | 'pending' | 'outstanding';
  paymentStatus: 'paid' | 'overdue' | 'current';
  leadTimeRisk: 'low' | 'medium' | 'high';
  overdueAmount?: number;
}

export interface SeedScheduleActivity {
  workPackage: string;
  name: string;
  pctComplete: number;
  baselineStart: string;
  baselineFinish: string;
  forecastStart: string;
  forecastFinish: string;
  isCritical: boolean;
  status: 'in_progress' | 'planned' | 'complete' | 'delayed';
  assignee: string;
  value: number;
}

// Riverside Apartments (proj-004) — the project shown in all detail views
export const RIVERSIDE_CONTACTS: SeedContact[] = [
  { name: 'James Walker', role: 'Commercial Manager', company: 'Thornfield Commercial Hub', email: 'j.walker@thornfield.co.uk', phone: '07815 123456', type: 'internal', badge: 'Owner' },
  { name: 'Sophie Morgan', role: 'Client Rep', company: 'Riverside Living Ltd', email: 's.morgan@riversideliving.co.uk', phone: '07788 654321', type: 'client' },
  { name: 'Michael Green', role: 'Quantity Surveyor', company: 'BuildCost Ltd', email: 'm.green@buildcost.co.uk', phone: '07970 987654', type: 'contractor' },
  { name: 'Rachel Okafor', role: 'Commercial Lead', company: 'Thornfield Commercial Hub', email: 'r.okafor@thornfield.co.uk', phone: '07820 112233', type: 'internal', badge: 'Owner' },
  { name: 'David Miller', role: 'Commercial Director', company: 'Thornfield Commercial Hub', email: 'd.miller@thornfield.co.uk', phone: '07700 998877', type: 'internal', badge: 'Approver' },
];

export const RIVERSIDE_MILESTONES: SeedMilestone[] = [
  { name: 'Practical Completion', baseline: '30 Jun 2027', forecast: '30 Jun 2027', status: 'on_track' },
  { name: 'Defects End Date', baseline: '30 Dec 2027', forecast: '30 Dec 2027', status: 'on_track' },
  { name: 'Final Account', baseline: '31 Mar 2028', forecast: '15 Apr 2028', status: 'at_risk' },
];

export const RIVERSIDE_RISK_WARNINGS = [
  { title: 'Section 4.1 EoT Notice Overdue', detail: 'Overdue by 24 days. Immediate action required.', severity: 'critical' as const },
  { title: 'Application #14 Outstanding', detail: 'Payment application is 10 days overdue.', severity: 'warning' as const },
  { title: 'Forecast Margin Below Target', detail: 'Forecast margin (15.9%) is below target (18.0%).', severity: 'warning' as const },
];

export const RIVERSIDE_DEADLINES = [
  { date: '11 Jun', label: 'Issue EoT Notice', detail: 'Section 4.1 notice deadline', urgency: 'overdue' as const },
  { date: '13 Jun', label: 'App #14 Payment Due', detail: 'Eastside Block A', urgency: 'soon' as const },
  { date: '20 Jun', label: 'Submit Monthly CVR', detail: 'May 2025', urgency: 'due' as const },
  { date: '30 Jun', label: 'Quarterly Governance Report', detail: 'Q2 2025', urgency: 'ok' as const },
];

export const RIVERSIDE_CHANGES: SeedChange[] = [
  { ref: 'CH-024-011', title: 'Balcony Glazing Upgrade', package: 'PKG-03', raisedBy: 'James Walker', requestedValue: 45000, assessedValue: 42500, status: 'pending', risk: 'high', evidenceCount: 4, dateRaised: '10 Jun 2026', decisionDue: '20 Jun 2026', isOverdue: true },
  { ref: 'CH-024-010', title: 'M&E Coordinator Redesign', package: 'PKG-04', raisedBy: 'Sophie Morgan', requestedValue: 28500, assessedValue: 24300, status: 'approved', risk: 'medium', evidenceCount: 3, dateRaised: '02 Jun 2026', decisionDue: '12 Jun 2026' },
  { ref: 'CH-024-009', title: 'Structural Beam Relocation', package: 'PKG-02', raisedBy: 'Michael Green', requestedValue: 62000, assessedValue: 59200, status: 'pending', risk: 'high', evidenceCount: 5, dateRaised: '28 May 2026', decisionDue: '10 Jun 2026', isOverdue: true },
  { ref: 'CH-024-008', title: 'Bathroom Specification Upgrade', package: 'PKG-05', raisedBy: 'Neha Sharma', requestedValue: 18750, assessedValue: 18750, status: 'approved', risk: 'low', evidenceCount: 2, dateRaised: '21 May 2026', decisionDue: '28 May 2026' },
  { ref: 'CH-024-007', title: 'Additional Fire Stopping', package: 'PKG-02', raisedBy: 'David Wilson', requestedValue: 15800, assessedValue: 13400, status: 'rejected', risk: 'medium', evidenceCount: 2, dateRaised: '15 May 2026', decisionDue: '22 May 2026' },
  { ref: 'CH-024-006', title: 'Landscaping Scope Increase', package: 'PKG-06', raisedBy: 'Tom Bennett', requestedValue: 22400, assessedValue: 19800, status: 'pending', risk: 'low', evidenceCount: 1, dateRaised: '08 May 2026', decisionDue: '18 May 2026' },
  { ref: 'CH-024-005', title: 'Lift Car Interior Upgrade', package: 'PKG-07', raisedBy: 'Rachel Okafor', requestedValue: 35000, assessedValue: 28500, status: 'pending', risk: 'medium', evidenceCount: 3, dateRaised: '01 May 2026', decisionDue: '11 May 2026' },
  { ref: 'CH-024-004', title: 'Acoustic Wall System Change', package: 'PKG-03', raisedBy: 'Emma Lewis', requestedValue: 19000, assessedValue: 17400, status: 'approved', risk: 'low', evidenceCount: 2, dateRaised: '18 Apr 2026', decisionDue: '25 Apr 2026' },
];

export const RIVERSIDE_APPLICATIONS: SeedApplication[] = [
  { ref: 'App #08', period: '01 May – 31 May 2026', appValue: 312450, certifiedValue: 312450, status: 'paid', submittedDate: '03 Jun 2026', dueDate: '13 Jun 2026', paidDate: '16 Jun 2026', noticeRef: 'NFC-2026-08', evidenceCount: 14, owner: 'James Walker' },
  { ref: 'App #07', period: '01 Apr – 30 Apr 2026', appValue: 289100, certifiedValue: 276850, status: 'paid', submittedDate: '04 May 2026', dueDate: '14 May 2026', paidDate: '19 May 2026', noticeRef: 'NFC-2026-07', evidenceCount: 12, owner: 'Rachel Okafor' },
  { ref: 'App #06', period: '01 Mar – 31 Mar 2026', appValue: 278600, certifiedValue: 250240, status: 'paid', submittedDate: '02 Apr 2026', dueDate: '12 Apr 2026', paidDate: '15 Apr 2026', noticeRef: 'NFC-2026-06', evidenceCount: 11, owner: 'David Phillips' },
  { ref: 'App #05', period: '01 Feb – 28 Feb 2026', appValue: 265500, certifiedValue: 240000, status: 'pending', submittedDate: '03 Mar 2026', dueDate: '13 Mar 2026', noticeRef: 'NFC-2026-05', evidenceCount: 10, owner: 'Sophie Morgan' },
  { ref: 'App #04', period: '01 Jan – 31 Jan 2026', appValue: 312000, certifiedValue: 286500, status: 'pending', submittedDate: '02 Feb 2026', dueDate: '12 Feb 2026', noticeRef: 'NFC-2026-04', evidenceCount: 9, owner: 'Michael Green' },
  { ref: 'App #03', period: '01 Dec – 31 Dec 2025', appValue: 298750, certifiedValue: 258400, status: 'disputed', submittedDate: '05 Jan 2026', dueDate: '15 Jan 2026', noticeRef: 'NFC-2026-03', evidenceCount: 8, owner: 'Neha Sharma' },
  { ref: 'App #02', period: '01 Nov – 30 Nov 2025', appValue: 275800, certifiedValue: 236750, status: 'disputed', submittedDate: '02 Dec 2025', dueDate: '12 Dec 2025', noticeRef: 'NFC-2026-02', evidenceCount: 7, owner: 'Tom Bennett' },
  { ref: 'App #01', period: '01 Jul – 31 Oct 2025', appValue: 616550, certifiedValue: 429460, status: 'paid', submittedDate: '05 Nov 2025', dueDate: '15 Nov 2025', paidDate: '20 Nov 2025', noticeRef: 'NFC-2026-01', evidenceCount: 6, owner: 'James Walker' },
];

export const RIVERSIDE_EVIDENCE: SeedEvidenceItem[] = [
  { ref: 'EV-2025-0712', title: 'Level 3 Brickwork Installation', type: 'Progress Photo Set', linkedRecord: 'CH-024-008', relatedNotice: 'CH-024-008', status: 'verified', dateCaptured: '12 Jun 2026', capturedBy: 'Neha Sharma', reviewDue: '26 Jun 2026', aiSummary: 'Brickwork at Level 3, C1 to C4 in line with spec...' },
  { ref: 'EV-2025-0711', title: 'EoT Notice Submission Email', type: 'Email', linkedRecord: 'N-041', relatedNotice: 'N-041', status: 'reviewed', dateCaptured: '11 Jun 2026', capturedBy: 'David Miller', reviewDue: '18 Jun 2026', aiSummary: 'EoT Notice for delay caused by late design...' },
  { ref: 'EV-2025-0710', title: 'Site Instruction – SI-023', type: 'PDF Document', linkedRecord: 'CH-024-007', relatedNotice: 'CH-024-007', status: 'approved', dateCaptured: '10 Jun 2026', capturedBy: 'James Walker', reviewDue: '', aiSummary: 'Instruction to proceed with fire stopping...' },
  { ref: 'EV-2025-0709', title: 'Labour Allocation Sheet', type: 'Spreadsheet', linkedRecord: 'APP-014', relatedNotice: 'APP-014', status: 'pending_review', dateCaptured: '09 Jun 2026', capturedBy: 'Sophie Morgan', reviewDue: '16 Jun 2026', aiSummary: 'Labour allocation for structural steel install...' },
  { ref: 'EV-2025-0708', title: 'Delivery Ticket – Steel Beams', type: 'Delivery Ticket', linkedRecord: 'CH-024-009', relatedNotice: 'CH-024-009', status: 'verified', dateCaptured: '08 Jun 2026', capturedBy: 'Michael Green', reviewDue: '22 Jun 2026', aiSummary: 'Steel beams delivered to site, THo, HEA300...' },
];

export const RIVERSIDE_SUPPLIERS: SeedSupplier[] = [
  { name: 'Citywide Facades Ltd', package: 'Facade Package', packageRef: 'PKG-07', contactName: 'Daniel Harper', contractValue: 485000, committedSpend: 272480, performanceScore: 82, insuranceExpiry: '30 Jun 2025', ramsStatus: 'compliant', paymentStatus: 'overdue', leadTimeRisk: 'medium', overdueAmount: 24350 },
  { name: 'MEP Solutions Ltd', package: 'MEP Package', packageRef: 'PKG-04', contactName: 'Priya Shah', contractValue: 612000, committedSpend: 398760, performanceScore: 90, insuranceExpiry: '14 Aug 2025', ramsStatus: 'compliant', paymentStatus: 'paid', leadTimeRisk: 'low' },
  { name: 'Groundforce Civils Ltd', package: 'Groundworks', packageRef: 'PKG-02', contactName: 'Mark Thompson', contractValue: 320000, committedSpend: 186200, performanceScore: 68, insuranceExpiry: '05 Jul 2025', ramsStatus: 'outstanding', paymentStatus: 'current', leadTimeRisk: 'high', overdueAmount: 18600 },
  { name: 'LiftTech Systems Ltd', package: 'Lift & Escalator', packageRef: 'PKG-11', contactName: 'James Lee', contractValue: 265000, committedSpend: 132500, performanceScore: 93, insuranceExpiry: '22 Sep 2025', ramsStatus: 'compliant', paymentStatus: 'paid', leadTimeRisk: 'low' },
  { name: 'JoinPro Interiors Ltd', package: 'Joinery Package', packageRef: 'PKG-13', contactName: 'Sophie Evans', contractValue: 198000, committedSpend: 304940, performanceScore: 75, insuranceExpiry: '11 Jul 2025', ramsStatus: 'outstanding', paymentStatus: 'overdue', leadTimeRisk: 'medium', overdueAmount: 12090 },
  { name: 'SafeAccess Scaffolding', package: 'Scaffolding', packageRef: 'PKG-01', contactName: 'Lee Carter', contractValue: 142000, committedSpend: 78600, performanceScore: 88, insuranceExpiry: '03 Jul 2025', ramsStatus: 'compliant', paymentStatus: 'current', leadTimeRisk: 'high', overdueAmount: 7850 },
];

export const RIVERSIDE_SCHEDULE: SeedScheduleActivity[] = [
  { workPackage: '01 Substructure', name: 'Substructure', pctComplete: 100, baselineStart: '2026-04-01', baselineFinish: '2026-06-20', forecastStart: '2026-04-01', forecastFinish: '2026-06-20', isCritical: false, status: 'complete', assignee: 'James Walker', value: 0 },
  { workPackage: '02 Superstructure', name: 'Superstructure', pctComplete: 72, baselineStart: '2026-06-21', baselineFinish: '2026-08-31', forecastStart: '2026-06-21', forecastFinish: '2026-08-31', isCritical: true, status: 'in_progress', assignee: 'Rachel Okafor', value: 0 },
  { workPackage: '03 Facade & Envelope', name: 'Facade & Envelope', pctComplete: 38, baselineStart: '2026-07-15', baselineFinish: '2026-10-15', forecastStart: '2026-07-15', forecastFinish: '2026-10-30', isCritical: true, status: 'in_progress', assignee: 'Sophie Morgan', value: 0 },
  { workPackage: '04 MEP First Fix', name: 'MEP First Fix', pctComplete: 32, baselineStart: '2026-07-01', baselineFinish: '2026-09-05', forecastStart: '2026-07-01', forecastFinish: '2026-09-15', isCritical: false, status: 'in_progress', assignee: 'Michael Green', value: 0 },
  { workPackage: '05 Apartments Second Fix', name: 'Apartments Second Fix', pctComplete: 18, baselineStart: '2026-08-10', baselineFinish: '2026-11-20', forecastStart: '2026-08-10', forecastFinish: '2026-11-20', isCritical: false, status: 'in_progress', assignee: 'David Hill', value: 0 },
];

export const RIVERSIDE_AUDIT_LOG = [
  { timestamp: '30 Jun 2025, 14:32:18', actor: 'James Walker', role: 'Project Manager', entity: 'Change', ref: 'CH-024-011', action: 'Field updated', detail: 'Decision Due', before: '20 Jun 2026', after: '30 Jun 2026', severity: 'high' as const },
  { timestamp: '30 Jun 2025, 11:08:05', actor: 'Sophie Morgan', role: 'Commercial Manager', entity: 'Change', ref: 'CH-024-011', action: 'Approval granted', detail: 'Change Approval', before: 'Pending', after: 'Approved', severity: 'medium' as const },
  { timestamp: '30 Jun 2025, 10:45:33', actor: 'Michael Green', role: 'Design Manager', entity: 'Document', ref: 'DOC-0456', action: 'Document superseded', detail: 'Revision 2 superseded', before: 'v2.0', after: 'v3.0', severity: 'low' as const },
  { timestamp: '29 Jun 2025, 16:21:47', actor: 'Neha Sharma', role: 'Compliance Lead', entity: 'Evidence', ref: 'EVD-00872', action: 'Evidence downloaded', detail: 'PDF (6.2 MB)', before: '', after: '', severity: 'low' as const },
];

export const RIVERSIDE_ACTIVITY_FEED = [
  { actor: 'Rachel Okafor', role: 'Programme Manager', category: 'evidence' as const, action: 'Uploaded 3 new evidence files', detail: 'Thermal performance calculations and U-value report.', ref: 'EV-2026-014', record: 'Balcony Glazing Upgrade', time: '10 Jun 2026, 10:42' },
  { actor: 'James Walker', role: 'Commercial Manager', category: 'commercial' as const, action: 'Approved application', detail: 'Application #08 approved for £312,450.', ref: 'App #08', record: 'Payment Application', time: '10 Jun 2026, 09:58' },
  { actor: 'Neha Sharma', role: 'Client Representative', category: 'commercial' as const, action: 'Raised a change', detail: 'Additional Fire Stopping at Level 7 corridor.', ref: 'CH-024-015', record: 'Additional Fire Stopping', time: '10 Jun 2026, 09:21' },
  { actor: 'David Phillips', role: 'Contracts Manager', category: 'governance' as const, action: 'Uploaded contract amendment', detail: 'Amendment 02 executed and uploaded.', ref: 'CA-002', record: 'Contract Amendment', time: '10 Jun 2026, 08:47' },
  { actor: 'MeasureDeck AI', role: 'Automation', category: 'ai' as const, action: 'AI note created', detail: 'Risk of delay detected in CH-024-015 – review recommended.', ref: 'SCH-024-015', record: 'Additional Fire Stopping', time: '10 Jun 2026, 07:10' },
];

export const RIVERSIDE_FINAL_ACCOUNT_ITEMS = [
  { ref: 'FA-001', title: 'Masonry Package', package: 'PKG-01', claimValue: 742500, agreedValue: 702000, status: 'under_review' as const, owner: 'Michael Green' },
  { ref: 'FA-002', title: 'Facade Works', package: 'PKG-03', claimValue: 412800, agreedValue: 382000, status: 'negotiation' as const, owner: 'Neha Sharma' },
  { ref: 'FA-003', title: 'MEP Services', package: 'PKG-04', claimValue: 828600, agreedValue: 792000, status: 'under_review' as const, owner: 'David Miller' },
  { ref: 'FA-004', title: 'External Works', package: 'PKG-06', claimValue: 285000, agreedValue: 265000, status: 'negotiation' as const, owner: 'Sophie Morgan' },
  { ref: 'FA-005', title: 'Prelims & OH&P', package: 'PRELIMS', claimValue: 155000, agreedValue: 148000, status: 'drafted' as const, owner: 'James Walker' },
  { ref: 'FA-006', title: 'Variations (Net)', package: 'VARS', claimValue: 186750, agreedValue: 142000, status: 'negotiation' as const, owner: 'Rachel Okafor' },
  { ref: 'FA-007', title: 'Contra Charges', package: 'CONTRA', claimValue: -85400, agreedValue: -85400, status: 'agreed' as const, owner: 'Tom Bennett' },
  { ref: 'FA-008', title: 'Loss & Expense', package: 'L&E', claimValue: 62000, agreedValue: 41500, status: 'under_review' as const, owner: 'Emma Lewis' },
  { ref: 'FA-009', title: 'Omissions', package: 'OMIT', claimValue: -6150, agreedValue: -5900, status: 'drafted' as const, owner: 'David Wilson' },
];

export const PORTFOLIO_COMMERCIAL_DATA = [
  { projectId: 'proj-001', name: 'Eastside Residential Block A', client: 'Redstone Developments Ltd', contractValue: 4850000, certifiedToDate: 3492000, certPct: 72.0, forecastFA: 5120000, margin: 16.4 },
  { projectId: 'proj-002', name: 'Meridian Office Park Phase 2', client: 'Meridian Properties Group', contractValue: 6200000, certifiedToDate: 5456000, certPct: 88.0, forecastFA: 6980000, margin: 13.8 },
  { projectId: 'proj-003', name: 'Thornfield Commercial Hub', client: 'Thornfield Estates plc', contractValue: 3850000, certifiedToDate: 2118500, certPct: 55.0, forecastFA: 4210000, margin: 11.2 },
  { projectId: 'proj-004', name: 'Riverside Apartments', client: 'Riverside Living Ltd', contractValue: 2950000, certifiedToDate: 590000, certPct: 20.0, forecastFA: 3420000, margin: 15.9 },
  { projectId: 'proj-005', name: 'Harlow Civic Centre Refurb', client: 'Harlow District Council', contractValue: 3150000, certifiedToDate: 1417500, certPct: 45.0, forecastFA: 3690000, margin: 17.1 },
  { projectId: 'proj-006', name: 'Kings Cross Fit-out', client: 'Urban Space Developments', contractValue: 1820000, certifiedToDate: 564200, certPct: 31.0, forecastFA: 1990000, margin: 9.4 },
  { projectId: 'proj-007', name: 'Whitfield Leisure Centre', client: 'Whitfield Borough Council', contractValue: 2400000, certifiedToDate: 2352000, certPct: 98.0, forecastFA: 2640000, margin: 14.7 },
];

// ─── CE-025 Detailed Seed Data ────────────────────────────────────────────────

export interface SeedPricingLine {
  id: string;
  description: string;
  qty: number;
  unit: string;
  rateContractor: number;
  amountContractor: number;
  ratePm: number;
  amountPm: number;
  category: 'Plant' | 'Labour' | 'Subcontract' | 'Prelims' | 'Disposal' | 'Risk' | 'OH&P';
  isDisputed: boolean;
  notes: string;
}

export interface SeedCorrespondence {
  id: string;
  date: string;
  direction: 'Sent' | 'Received';
  channel: 'Email' | 'Letter' | 'Portal' | 'Meeting';
  subject: string;
  correspondent: string;
  summary: string;
  body: string;
}

export interface SeedNEC4Step {
  id: string;
  stepNumber: number;
  name: string;
  clauseRef: string;
  status: 'completed' | 'in_progress' | 'pending' | 'overdue';
  dueDate: string | null;
  completedDate: string | null;
  notes: string;
}

export interface SeedChangeTask {
  id: string;
  title: string;
  assignee: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: string;
  status: 'todo' | 'in_progress' | 'done';
  description: string;
}

export interface SeedAuditEntry {
  id: string;
  actor: string;
  actorRole: string;
  action: 'CREATED' | 'SUBMITTED' | 'UPDATED' | 'PRICING_UPDATED' | 'EVIDENCE_LINKED' | 'APPROVED';
  timestamp: string;
  notes: string;
}

export const CE025_CHANGE = {
  ceNumber: 'CE-025',
  title: 'Additional groundworks – unforeseen igneous rock',
  description:
    'During bulk excavation works for the pile caps and ground beams at grid lines C–F / 3–7, the contractor encountered an unforeseen band of igneous rock (dolerite) at approximately -3.2m below existing ground level. The Ground Investigation Report (March 2023) did not identify rock at formation level at this location. Specialist hydraulic rock-breaking plant was mobilised and the rock was excavated and removed over a 12-day period from 14–25 March 2025. The disposal of 14 loads of dolerite required licensed waste carrier documentation.',
  projectName: 'The Arc Tower',
  client: 'Birmingham City Developments Ltd',
  pm: 'Rachel Okafor',
  qs: 'Sarah Chen',
  raisedBy: 'Marcus Thompson',
  status: 'submitted' as const,
  priority: 'high' as const,
  contractorAssessment: 48500,
  pmAssessment: 41200,
  agreedValue: null as number | null,
  daysClaimedDelay: 12,
  daysAgreedDelay: 8,
  clauseReference: '60.1(12)',
  ceType: 'Compensation Event',
  eventDate: '2025-03-14',
  notificationDate: '2025-03-18',
  quotationDueDate: '2025-04-08',
  acceptanceDueDate: '2025-04-22',
  evidenceStrengthScore: 4,
  aiConfidenceScore: 0.87,
  contractValue: 12_400_000,
  daysAged: 37,
};

export const CE025_PRICING_LINES: SeedPricingLine[] = [
  { id: 'PL-01', description: 'Hydraulic rock-breaker – 12 days @ £1,850/day', qty: 12, unit: 'days', rateContractor: 1850, amountContractor: 22200, ratePm: 1541.67, amountPm: 18500, category: 'Plant', isDisputed: false, notes: 'Market rate £1,650–£2,100/day. Claimed rate within range.' },
  { id: 'PL-02', description: 'Additional operatives – rock excavation gang (3 no.)', qty: 12, unit: 'days', rateContractor: 750, amountContractor: 9000, ratePm: 750, amountPm: 9000, category: 'Labour', isDisputed: false, notes: 'PM accepts full labour claim.' },
  { id: 'PL-03', description: 'Specialist earthworks subcontract – survey & rock classification', qty: 1, unit: 'item', rateContractor: 3800, amountContractor: 3800, ratePm: 3800, amountPm: 3800, category: 'Subcontract', isDisputed: false, notes: 'GEO-TECH Solutions Ltd. Agreed.' },
  { id: 'PL-04', description: 'Extended site prelims – welfare, supervision, temp services', qty: 12, unit: 'days', rateContractor: 380, amountContractor: 4560, ratePm: 380, amountPm: 4560, category: 'Prelims', isDisputed: false, notes: 'Accepted at contract rate.' },
  { id: 'PL-05', description: 'Dolerite disposal – licensed waste carrier (14 loads × 20t)', qty: 14, unit: 'loads', rateContractor: 420, amountContractor: 5880, ratePm: 214.29, amountPm: 3000, category: 'Disposal', isDisputed: true, notes: 'PM disputes 14 loads; accepting 7 loads at same rate = £2,940. Missing 2 skip lorry manifests.' },
  { id: 'PL-06', description: 'Risk allowance (10%)', qty: 1, unit: 'item', rateContractor: 3000, amountContractor: 3000, ratePm: 2340, amountPm: 2340, category: 'Risk', isDisputed: false, notes: 'Applied to net direct cost.' },
  { id: 'PL-07', description: 'Overhead & profit (8%)', qty: 1, unit: 'item', rateContractor: 3860, amountContractor: 3860, ratePm: 3000, amountPm: 3000, category: 'OH&P', isDisputed: false, notes: 'Contract rate applied.' },
];

export const CE025_CORRESPONDENCE: SeedCorrespondence[] = [
  {
    id: 'COR-01', date: '2025-03-14T09:15:00', direction: 'Sent', channel: 'Email',
    subject: 'Early Warning Notice EW-031 – Potential unforeseen ground conditions',
    correspondent: 'Rachel Okafor (PM)',
    summary: 'Early Warning Notice issued same day as discovery. Contractor flagged potential cost and programme impact.',
    body: 'Dear Rachel,\n\nPlease find attached Early Warning Notice EW-031 in respect of unforeseen ground conditions encountered during bulk excavation at grid lines C–F / 3–7 at approximately -3.2m BGL. We have encountered what appears to be an igneous rock band (dolerite) not identified in the Ground Investigation Report (March 2023).\n\nWe anticipate a delay to Activity A003 (Groundworks & Drainage) and additional cost for specialist plant and disposal. We will provide further details as the situation develops.\n\nYours sincerely,\nMarcus Thompson\nSite Manager',
  },
  {
    id: 'COR-02', date: '2025-03-15T14:30:00', direction: 'Received', channel: 'Email',
    subject: 'RE: EW-031 – PM Instruction to Continue and Record',
    correspondent: 'Rachel Okafor (PM)',
    summary: 'PM acknowledged Early Warning and instructed contractor to continue works and maintain contemporaneous records.',
    body: 'Dear Marcus,\n\nThank you for your Early Warning Notice EW-031. Please proceed with the rock excavation works and maintain full contemporaneous records including:\n\n1. Daily plant allocation records\n2. Site photographs\n3. Disposal manifests\n4. Site diary entries\n\nI will arrange for a site visit on 17 March 2025. Please confirm the location for inspection.\n\nRachel Okafor\nProject Manager',
  },
  {
    id: 'COR-03', date: '2025-03-18T10:00:00', direction: 'Sent', channel: 'Portal',
    subject: 'Compensation Event Notification CE-025 – Unforeseen Physical Conditions Clause 60.1(12)',
    correspondent: 'Rachel Okafor (PM)',
    summary: 'Formal CE notification submitted via portal under NEC4 Clause 60.1(12). CE-025 formally opened.',
    body: 'Dear Rachel,\n\nWe hereby notify you of a Compensation Event under NEC4 ECC Clause 60.1(12) in respect of the unforeseen igneous rock encountered during bulk excavation works.\n\nThe physical conditions encountered at -3.2m BGL constitute conditions that an experienced contractor would have judged at the Contract Date to have such a small chance of occurring that it would have been unreasonable to allow for them.\n\nReference: CE-025\nClause: 60.1(12) – Unforeseen physical conditions\nEvent Date: 14 March 2025\n\nWe will submit our quotation within 21 calendar days in accordance with Clause 62.\n\nSincerely,\nSarah Chen QS',
  },
  {
    id: 'COR-04', date: '2025-04-08T16:45:00', direction: 'Sent', channel: 'Portal',
    subject: 'CE-025 Quotation – Additional groundworks for unforeseen igneous rock',
    correspondent: 'Rachel Okafor (PM)',
    summary: 'Formal quotation submitted: £48,500 net. Full pricing breakdown and delay analysis attached.',
    body: 'Dear Rachel,\n\nPlease find attached our Quotation for CE-025 in accordance with NEC4 Clause 62.\n\nSummary:\n- Contractor Assessment: £48,500 (excl. VAT)\n- Delay claimed: 12 calendar days (Extension of Time)\n- Method: Time Impact Analysis\n\nDocumentation attached:\n1. CE-025 Pricing Schedule\n2. Delay Analysis Report\n3. Plant hire invoices\n4. Skip lorry manifests (12 of 14 received)\n\nYours sincerely,\nSarah Chen\nQuantity Surveyor',
  },
  {
    id: 'COR-05', date: '2025-04-15T11:20:00', direction: 'Received', channel: 'Email',
    subject: 'CE-025 – Request for additional information before PM assessment',
    correspondent: 'Rachel Okafor (PM)',
    summary: 'PM requested missing skip manifests and lab confirmation of rock classification before completing assessment.',
    body: 'Dear Sarah,\n\nThank you for your CE-025 Quotation received 8 April 2025.\n\nBefore completing our assessment, we require:\n\n1. The 2 missing skip lorry manifests (loads 13 and 14)\n2. Laboratory confirmation of dolerite classification from an independent geotechnical consultant\n\nPlease provide the above by 21 April 2025 to allow completion of our assessment by the deadline of 22 April 2025.\n\nRachel Okafor\nProject Manager',
  },
  {
    id: 'COR-06', date: '2025-04-18T09:00:00', direction: 'Sent', channel: 'Email',
    subject: 'RE: CE-025 – Response to information request + lab report update',
    correspondent: 'Rachel Okafor (PM)',
    summary: 'Contractor responded noting lab report is pending. Provided partial manifests and requested deadline extension.',
    body: 'Dear Rachel,\n\nThank you for your email of 15 April 2025.\n\nRegarding the missing manifests: We are chasing the haulier (Davidson Haulage Ltd) and expect to receive both outstanding manifests by 20 April 2025.\n\nRegarding the lab report: The dolerite classification report from BSP Geotechnics is expected by 25 April 2025 — slightly beyond your assessment deadline. We respectfully request a short extension to 30 April 2025 to allow this evidence to be incorporated.\n\nSarah Chen\nQuantity Surveyor',
  },
];

export const CE025_NEC4_STEPS: SeedNEC4Step[] = [
  { id: 'NEC-01', stepNumber: 1, name: 'Early Warning Issued', clauseRef: '16.1', status: 'completed', dueDate: '2025-03-14', completedDate: '2025-03-14', notes: 'EW-031 issued on same day as rock discovery. Exemplary contract administration.' },
  { id: 'NEC-02', stepNumber: 2, name: 'CE Notification', clauseRef: '61.3', status: 'completed', dueDate: '2025-03-22', completedDate: '2025-03-18', notes: 'CE-025 formally notified within 8 weeks of becoming aware. Early notification.' },
  { id: 'NEC-03', stepNumber: 3, name: 'PM Instruction to Quote', clauseRef: '62.1', status: 'completed', dueDate: '2025-03-25', completedDate: '2025-03-20', notes: 'PM issued instruction to submit quotation. 21-day window started.' },
  { id: 'NEC-04', stepNumber: 4, name: 'Quotation Submitted', clauseRef: '62.3', status: 'completed', dueDate: '2025-04-08', completedDate: '2025-04-08', notes: 'Quotation submitted on last day of 21-day window. Value: £48,500.' },
  { id: 'NEC-05', stepNumber: 5, name: 'PM Assessment / Response', clauseRef: '64.1', status: 'in_progress', dueDate: '2025-04-22', completedDate: null, notes: 'PM assessment period: 14 days from quotation receipt. PM requested additional information on 15 Apr.' },
  { id: 'NEC-06', stepNumber: 6, name: 'Deemed Accepted (if no response)', clauseRef: '62.6', status: 'pending', dueDate: '2025-04-23', completedDate: null, notes: 'If PM fails to respond by 22 Apr 2025, quotation is deemed accepted under Clause 62.6.' },
  { id: 'NEC-07', stepNumber: 7, name: 'Agreement / Revised Quotation', clauseRef: '65.1', status: 'pending', dueDate: null, completedDate: null, notes: 'Either PM accepts quotation or instructs revised quotation (Clause 62.3).' },
  { id: 'NEC-08', stepNumber: 8, name: 'Implementation', clauseRef: '65.1', status: 'pending', dueDate: '2025-05-06', completedDate: null, notes: 'Agreed CE implemented into contract prices and programme.' },
];

export const CE025_TASKS: SeedChangeTask[] = [
  { id: 'T-01', title: 'Obtain lab report – dolerite classification', assignee: 'Sarah Chen', priority: 'critical', dueDate: '2025-04-25', status: 'in_progress', description: 'Chase BSP Geotechnics for signed lab report confirming dolerite classification. Required for PM assessment.' },
  { id: 'T-02', title: 'Recover missing skip lorry manifests (loads 13 & 14)', assignee: 'Marcus Thompson', priority: 'high', dueDate: '2025-04-20', status: 'todo', description: 'Contact Davidson Haulage Ltd to obtain the 2 missing waste transfer notes for the disputed disposal loads.' },
  { id: 'T-03', title: 'Respond to PM information request (COR-05)', assignee: 'Sarah Chen', priority: 'high', dueDate: '2025-04-21', status: 'todo', description: 'Draft formal response to Rachel Okafor\'s email of 15 Apr. Confirm manifests received and lab report timeline.' },
  { id: 'T-04', title: 'Prepare CE-025 response to PM assessment', assignee: 'Sarah Chen', priority: 'medium', dueDate: '2025-04-30', status: 'todo', description: 'Once PM assessment received, prepare formal response addressing any reduction in value or delay.' },
  { id: 'T-05', title: 'File Early Warning Notice EW-031', assignee: 'Marcus Thompson', priority: 'low', dueDate: '2025-03-18', status: 'done', description: 'Save signed EW-031 to project document library and link to CE-025.' },
  { id: 'T-06', title: 'Submit CE-025 quotation via portal', assignee: 'Sarah Chen', priority: 'high', dueDate: '2025-04-08', status: 'done', description: 'Upload CE-025 quotation pack to NEC4 portal by 21-day deadline.' },
];

export const CE025_AUDIT_TRAIL: SeedAuditEntry[] = [
  { id: 'AU-01', actor: 'Sarah Chen', actorRole: 'Quantity Surveyor', action: 'CREATED', timestamp: '2025-03-18T10:05:00Z', notes: 'CE-025 record created following EW-031. Status: Draft.' },
  { id: 'AU-02', actor: 'Sarah Chen', actorRole: 'Quantity Surveyor', action: 'UPDATED', timestamp: '2025-04-02T14:30:00Z', notes: 'Pricing lines updated after receipt of plant hire invoices. Contractor assessment revised to £48,500.' },
  { id: 'AU-03', actor: 'Marcus Thompson', actorRole: 'Site Manager', action: 'EVIDENCE_LINKED', timestamp: '2025-04-03T09:15:00Z', notes: 'Delay Analysis Report (EV-109) linked to CE-025.' },
  { id: 'AU-04', actor: 'Sarah Chen', actorRole: 'Quantity Surveyor', action: 'PRICING_UPDATED', timestamp: '2025-04-05T11:45:00Z', notes: 'OH&P and risk allowance lines finalised. Total: £48,500.' },
  { id: 'AU-05', actor: 'Sarah Chen', actorRole: 'Quantity Surveyor', action: 'SUBMITTED', timestamp: '2025-04-08T16:45:00Z', notes: 'CE-025 quotation submitted via NEC4 portal. Status changed to Submitted.' },
  { id: 'AU-06', actor: 'System', actorRole: 'Automation', action: 'UPDATED', timestamp: '2025-04-22T00:00:01Z', notes: 'Acceptance deadline reached. PM has not responded. Deemed acceptance window triggered.' },
];


// ─── Changes register ───────────────────────────────────────────────────────
export type ChangeRegisterStatus =
  | "draft"
  | "notified"
  | "quotation"
  | "submitted"
  | "agreed"
  | "rejected"
  | "disputed"
  | "withdrawn";

export type ChangeRegisterPriority = "low" | "medium" | "high" | "critical";

export interface SeedChangeRegisterItem {
  id: string;
  ceNumber: string;
  projectName: string;
  projectRef: string;
  title: string;
  status: ChangeRegisterStatus;
  priority: ChangeRegisterPriority;
  contractorValue: number;
  pmValue: number | null;
  daysClaimedDelay: number;
  quotationDue: string;
  raisedDate: string;
  raisedBy: string;
  evidenceScore: number; // 1â€“5
  agingDays: number;
}

export const CHANGES_REGISTER: SeedChangeRegisterItem[] = [
  {
    id: "ce-001",
    ceNumber: "CE-021",
    projectName: "The Arc Tower",
    projectRef: "MD-2024-001",
    title: "Unforeseen ground conditions â€” additional piling required at grid lines C4â€“D6",
    status: "disputed",
    priority: "critical",
    contractorValue: 142_500,
    pmValue: 98_000,
    daysClaimedDelay: 28,
    quotationDue: "2026-05-10",
    raisedDate: "2026-04-02",
    raisedBy: "James Thornton",
    evidenceScore: 4,
    agingDays: 73,
  },
  {
    id: "ce-002",
    ceNumber: "CE-022",
    projectName: "Riverside Apartments",
    projectRef: "MD-2024-004",
    title: "Design change to structural frame â€” L4 transfer beam specification revised",
    status: "submitted",
    priority: "high",
    contractorValue: 87_300,
    pmValue: 85_000,
    daysClaimedDelay: 14,
    quotationDue: "2026-06-18",
    raisedDate: "2026-05-14",
    raisedBy: "Sarah Mitchell",
    evidenceScore: 5,
    agingDays: 31,
  },
  {
    id: "ce-003",
    ceNumber: "CE-023",
    projectName: "Kings Quarter Office",
    projectRef: "MD-2024-006",
    title: "Statutory authority delay â€” gas mains diversion by Cadent extending programme",
    status: "agreed",
    priority: "high",
    contractorValue: 54_200,
    pmValue: 54_200,
    daysClaimedDelay: 21,
    quotationDue: "2026-04-28",
    raisedDate: "2026-03-25",
    raisedBy: "Rachel Okafor",
    evidenceScore: 5,
    agingDays: 81,
  },
  {
    id: "ce-004",
    ceNumber: "CE-024",
    projectName: "St Anne's Wharf",
    projectRef: "MD-2023-007",
    title: "Scope addition â€” feature lighting installation to reception atrium",
    status: "quotation",
    priority: "medium",
    contractorValue: 31_800,
    pmValue: null,
    daysClaimedDelay: 0,
    quotationDue: "2026-06-20",
    raisedDate: "2026-05-28",
    raisedBy: "Tom Baxter",
    evidenceScore: 3,
    agingDays: 17,
  },
  {
    id: "ce-005",
    ceNumber: "CE-025",
    projectName: "Hartfield Green",
    projectRef: "MD-2024-003",
    title: "Employer's instruction â€” acoustic upgrade to party walls (flats 12â€“24)",
    status: "notified",
    priority: "medium",
    contractorValue: 28_600,
    pmValue: null,
    daysClaimedDelay: 7,
    quotationDue: "2026-06-29",
    raisedDate: "2026-06-06",
    raisedBy: "James Thornton",
    evidenceScore: 2,
    agingDays: 8,
  },
  {
    id: "ce-006",
    ceNumber: "CE-026",
    projectName: "The Arc Tower",
    projectRef: "MD-2024-001",
    title: "Late information release â€” MEP co-ordination drawings delayed 6 weeks",
    status: "disputed",
    priority: "critical",
    contractorValue: 97_400,
    pmValue: 41_000,
    daysClaimedDelay: 42,
    quotationDue: "2026-04-15",
    raisedDate: "2026-03-10",
    raisedBy: "Sarah Mitchell",
    evidenceScore: 3,
    agingDays: 96,
  },
  {
    id: "ce-007",
    ceNumber: "CE-027",
    projectName: "Riverside Apartments",
    projectRef: "MD-2024-004",
    title: "Provisional sum expenditure â€” landscaping and external works package",
    status: "agreed",
    priority: "low",
    contractorValue: 61_000,
    pmValue: 61_000,
    daysClaimedDelay: 0,
    quotationDue: "2026-05-30",
    raisedDate: "2026-05-01",
    raisedBy: "Rachel Okafor",
    evidenceScore: 5,
    agingDays: 44,
  },
  {
    id: "ce-008",
    ceNumber: "CE-028",
    projectName: "Kings Quarter Office",
    projectRef: "MD-2024-006",
    title: "Change to faÃ§ade specification â€” aluminium cladding to terracotta rain-screen",
    status: "draft",
    priority: "high",
    contractorValue: 0,
    pmValue: null,
    daysClaimedDelay: 0,
    quotationDue: "2026-07-05",
    raisedDate: "2026-06-10",
    raisedBy: "Tom Baxter",
    evidenceScore: 1,
    agingDays: 4,
  },
  {
    id: "ce-009",
    ceNumber: "CE-029",
    projectName: "St Anne's Wharf",
    projectRef: "MD-2023-007",
    title: "Force majeure delay â€” subcontractor insolvency, re-procurement required",
    status: "submitted",
    priority: "critical",
    contractorValue: 118_500,
    pmValue: null,
    daysClaimedDelay: 57,
    quotationDue: "2026-06-10",
    raisedDate: "2026-04-22",
    raisedBy: "James Thornton",
    evidenceScore: 2,
    agingDays: 53,
  },
  {
    id: "ce-010",
    ceNumber: "CE-030",
    projectName: "Hartfield Green",
    projectRef: "MD-2024-003",
    title: "Daywork â€” emergency pump-out following groundwater ingress event",
    status: "withdrawn",
    priority: "low",
    contractorValue: 8_900,
    pmValue: null,
    daysClaimedDelay: 0,
    quotationDue: "2026-05-20",
    raisedDate: "2026-05-05",
    raisedBy: "Rachel Okafor",
    evidenceScore: 1,
    agingDays: 40,
  },
];


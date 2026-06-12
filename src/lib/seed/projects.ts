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

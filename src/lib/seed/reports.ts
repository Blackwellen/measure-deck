// Realistic construction QS seed data for MeasureDeck Reports section

export type ReportType =
  | "CVR Report"
  | "Application Summary"
  | "Change Register"
  | "Final Account Summary"
  | "Evidence Pack"
  | "Project Status Report"
  | "Commercial Dashboard"
  | "Custom";

export type ReportStatus = "draft" | "generated" | "exported" | "shared" | "scheduled";

export interface SeedReport {
  id: string;
  title: string;
  type: ReportType;
  projectId: string | null;
  projectName: string | null;
  projectRef: string | null;
  generatedDate: string;
  status: ReportStatus;
  generatedBy: string;
  sections: string[];
  exportCount: number;
  shareCount: number;
  isScheduled: boolean;
  scheduleFrequency: string | null;
  nextScheduledDate: string | null;
}

export const SEED_REPORTS: SeedReport[] = [
  {
    id: "rep-001",
    title: "CVR Period 7 — Eastside Residential Block A",
    type: "CVR Report",
    projectId: "proj-001",
    projectName: "Eastside Residential Block A",
    projectRef: "MD-2024-001",
    generatedDate: "2026-06-09T10:00:00Z",
    status: "exported",
    generatedBy: "Rachel Okafor",
    sections: ["Executive Summary", "KPI Grid", "CVR Movement Chart", "Cost Table", "Risk Register"],
    exportCount: 3,
    shareCount: 1,
    isScheduled: false,
    scheduleFrequency: null,
    nextScheduledDate: null,
  },
  {
    id: "rep-002",
    title: "Application Summary #14 — Meridian Office Park Phase 2",
    type: "Application Summary",
    projectId: "proj-002",
    projectName: "Meridian Office Park Phase 2",
    projectRef: "MD-2024-002",
    generatedDate: "2026-06-07T14:30:00Z",
    status: "shared",
    generatedBy: "James Thornton",
    sections: ["Executive Summary", "Application Breakdown", "Payment Position Table", "Disputed Items"],
    exportCount: 2,
    shareCount: 3,
    isScheduled: false,
    scheduleFrequency: null,
    nextScheduledDate: null,
  },
  {
    id: "rep-003",
    title: "Change Register — Thornfield Commercial Hub",
    type: "Change Register",
    projectId: "proj-003",
    projectName: "Thornfield Commercial Hub",
    projectRef: "MD-2024-003",
    generatedDate: "2026-06-06T09:15:00Z",
    status: "generated",
    generatedBy: "Sarah Mitchell",
    sections: ["Change Register Table", "Status Summary", "Financial Impact Chart", "Disputed Changes"],
    exportCount: 1,
    shareCount: 0,
    isScheduled: true,
    scheduleFrequency: "Monthly",
    nextScheduledDate: "2026-07-06",
  },
  {
    id: "rep-004",
    title: "Monthly Commercial Dashboard — May 2026",
    type: "Commercial Dashboard",
    projectId: null,
    projectName: null,
    projectRef: null,
    generatedDate: "2026-06-01T08:00:00Z",
    status: "shared",
    generatedBy: "Rachel Okafor",
    sections: ["Portfolio KPI Strip", "CVR Margin Chart", "Payment Status Donut", "Risk Matrix", "Action Queue"],
    exportCount: 6,
    shareCount: 4,
    isScheduled: true,
    scheduleFrequency: "Monthly",
    nextScheduledDate: "2026-07-01",
  },
  {
    id: "rep-005",
    title: "Evidence Pack — VO-047 Dispute — Thornfield",
    type: "Evidence Pack",
    projectId: "proj-003",
    projectName: "Thornfield Commercial Hub",
    projectRef: "MD-2024-003",
    generatedDate: "2026-06-05T11:45:00Z",
    status: "exported",
    generatedBy: "James Thornton",
    sections: ["Dispute Summary", "Evidence Grid", "Correspondence Timeline", "Expert Notes"],
    exportCount: 4,
    shareCount: 2,
    isScheduled: false,
    scheduleFrequency: null,
    nextScheduledDate: null,
  },
  {
    id: "rep-006",
    title: "Project Status Report — Harlow Civic Centre Refurb",
    type: "Project Status Report",
    projectId: "proj-005",
    projectName: "Harlow Civic Centre Refurb",
    projectRef: "MD-2024-005",
    generatedDate: "2026-06-04T16:00:00Z",
    status: "generated",
    generatedBy: "Tom Baxter",
    sections: ["Executive Summary", "Programme Summary", "Commercial Position", "Risk & Opportunity", "Next Actions"],
    exportCount: 0,
    shareCount: 0,
    isScheduled: false,
    scheduleFrequency: null,
    nextScheduledDate: null,
  },
  {
    id: "rep-007",
    title: "Final Account Summary — Meridian Office Park Phase 2",
    type: "Final Account Summary",
    projectId: "proj-002",
    projectName: "Meridian Office Park Phase 2",
    projectRef: "MD-2024-002",
    generatedDate: "2026-06-03T10:30:00Z",
    status: "draft",
    generatedBy: "Sarah Mitchell",
    sections: ["Executive Summary", "Contract Sum Analysis", "Variation Summary", "Agreed / Unagreed Split", "Retention Position"],
    exportCount: 0,
    shareCount: 0,
    isScheduled: false,
    scheduleFrequency: null,
    nextScheduledDate: null,
  },
  {
    id: "rep-008",
    title: "CVR Period 8 — Thornfield Commercial Hub",
    type: "CVR Report",
    projectId: "proj-003",
    projectName: "Thornfield Commercial Hub",
    projectRef: "MD-2024-003",
    generatedDate: "2026-06-10T09:00:00Z",
    status: "draft",
    generatedBy: "Rachel Okafor",
    sections: ["Executive Summary", "KPI Grid", "Margin Movement", "Cost Forecast"],
    exportCount: 0,
    shareCount: 0,
    isScheduled: false,
    scheduleFrequency: null,
    nextScheduledDate: null,
  },
];

export interface SeedSecureShare {
  id: string;
  reportId: string;
  token: string;
  createdBy: string;
  createdAt: string;
  expiresAt: string;
  viewCount: number;
  isRevoked: boolean;
  sharedWith: string | null;
}

export const SEED_SECURE_SHARES: SeedSecureShare[] = [
  {
    id: "ss-001",
    reportId: "rep-002",
    token: "mdk-a1b2c3d4e5f6",
    createdBy: "James Thornton",
    createdAt: "2026-06-07T15:00:00Z",
    expiresAt: "2026-06-21T15:00:00Z",
    viewCount: 2,
    isRevoked: false,
    sharedWith: "employer@meridianoffices.co.uk",
  },
  {
    id: "ss-002",
    reportId: "rep-004",
    token: "mdk-f7g8h9i0j1k2",
    createdBy: "Rachel Okafor",
    createdAt: "2026-06-01T08:30:00Z",
    expiresAt: "2026-06-15T08:30:00Z",
    viewCount: 4,
    isRevoked: false,
    sharedWith: "directors@measuredeck.co.uk",
  },
  {
    id: "ss-003",
    reportId: "rep-005",
    token: "mdk-l3m4n5o6p7q8",
    createdBy: "James Thornton",
    createdAt: "2026-06-05T12:00:00Z",
    expiresAt: "2026-06-19T12:00:00Z",
    viewCount: 1,
    isRevoked: true,
    sharedWith: "solicitor@commerciallaw.co.uk",
  },
];

export interface SeedExportHistory {
  id: string;
  reportId: string;
  exportedAt: string;
  exportedBy: string;
  format: "PDF" | "Excel";
  fileName: string;
  fileSizeBytes: number;
}

export const SEED_EXPORT_HISTORY: SeedExportHistory[] = [
  {
    id: "ex-001",
    reportId: "rep-001",
    exportedAt: "2026-06-09T10:30:00Z",
    exportedBy: "Rachel Okafor",
    format: "PDF",
    fileName: "CVR-Period7-EastsideBlockA-20260609.pdf",
    fileSizeBytes: 1_840_000,
  },
  {
    id: "ex-002",
    reportId: "rep-001",
    exportedAt: "2026-06-09T14:00:00Z",
    exportedBy: "James Thornton",
    format: "Excel",
    fileName: "CVR-Period7-EastsideBlockA-20260609.xlsx",
    fileSizeBytes: 420_000,
  },
  {
    id: "ex-003",
    reportId: "rep-002",
    exportedAt: "2026-06-07T15:30:00Z",
    exportedBy: "James Thornton",
    format: "PDF",
    fileName: "AppSummary-App14-Meridian-20260607.pdf",
    fileSizeBytes: 980_000,
  },
  {
    id: "ex-004",
    reportId: "rep-004",
    exportedAt: "2026-06-01T08:45:00Z",
    exportedBy: "Rachel Okafor",
    format: "PDF",
    fileName: "CommercialDashboard-May2026.pdf",
    fileSizeBytes: 2_200_000,
  },
];

export const REPORT_TYPE_COLOURS: Record<ReportType, { chip: string; accent: string }> = {
  "CVR Report":            { chip: "chip-primary", accent: "#3B5EE8" },
  "Application Summary":   { chip: "chip-success", accent: "#10B981" },
  "Change Register":       { chip: "chip-warning", accent: "#F59E0B" },
  "Final Account Summary": { chip: "chip-cyan",    accent: "#06B6D4" },
  "Evidence Pack":         { chip: "chip-violet",  accent: "#8B5CF6" },
  "Project Status Report": { chip: "chip-muted",   accent: "#94A3B8" },
  "Commercial Dashboard":  { chip: "chip-info",    accent: "#3B82F6" },
  "Custom":                { chip: "chip-muted",   accent: "#94A3B8" },
};

export const STATUS_CHIP: Record<ReportStatus, string> = {
  draft:     "chip-muted",
  generated: "chip-info",
  exported:  "chip-success",
  shared:    "chip-violet",
  scheduled: "chip-warning",
};

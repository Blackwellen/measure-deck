// Realistic construction QS seed data for MeasureDeck dashboards

export const SEED_KPI = {
  totalContractValue: 24_850_000,
  certifiedToDate: 16_240_000,
  outstandingApplications: 7,
  cvrMargin: 14.2,
  previousMargin: 12.8,
  certifiedPercent: 65.3,
};

export const SEED_RISK_ALERTS = [
  {
    id: "ra-1",
    type: "overdue_notice" as const,
    severity: "danger" as const,
    title: "Overdue Section 4.1 Notice – Eastside Block A",
    description: "Extension of Time notice response 14 days overdue. Contract risk: £240,000.",
    projectRef: "MD-2024-001",
    projectName: "Eastside Residential Block A",
    dueDate: "2026-05-27",
    link: "/app/projects/proj-001/changes",
  },
  {
    id: "ra-2",
    type: "disputed_change" as const,
    severity: "danger" as const,
    title: "Disputed Variation VO-047 – Thornfield Commercial",
    description: "Client rejected VO-047 (£85,000). No agreed position. Final Account impact.",
    projectRef: "MD-2024-003",
    projectName: "Thornfield Commercial Hub",
    dueDate: "2026-06-15",
    link: "/app/projects/proj-003/changes",
  },
  {
    id: "ra-3",
    type: "evidence_gap" as const,
    severity: "warning" as const,
    title: "12 changes missing site evidence – Harlow Civic",
    description: "Evidence gap reduces adjudication strength. Upload photos/contemporary records.",
    projectRef: "MD-2024-005",
    projectName: "Harlow Civic Centre Refurb",
    dueDate: "2026-06-20",
    link: "/app/projects/proj-005/evidence",
  },
  {
    id: "ra-4",
    type: "payment_overdue" as const,
    severity: "warning" as const,
    title: "Payment Application #14 – 18 days outstanding",
    description: "Application £380,000 – no Pay Less Notice received. Consider Smash & Grab.",
    projectRef: "MD-2024-002",
    projectName: "Meridian Office Park Phase 2",
    dueDate: "2026-06-08",
    link: "/app/projects/proj-002/applications",
  },
];

export const SEED_ACTION_QUEUE = [
  {
    id: "aq-1",
    type: "notice" as const,
    title: "Issue Section 4.1 EoT Notice – Eastside Block A",
    dueDate: "2026-06-11",
    priority: "critical" as const,
    project: "Eastside Block A",
    link: "/app/projects/proj-001/changes",
  },
  {
    id: "aq-2",
    type: "application" as const,
    title: "Submit Application #15 – Meridian Office Park",
    dueDate: "2026-06-12",
    priority: "high" as const,
    project: "Meridian Office Park",
    link: "/app/projects/proj-002/applications",
  },
  {
    id: "aq-3",
    type: "evidence" as const,
    title: "Upload 6 daywork sheets – Harlow Civic",
    dueDate: "2026-06-13",
    priority: "high" as const,
    project: "Harlow Civic Centre",
    link: "/app/projects/proj-005/evidence",
  },
  {
    id: "aq-4",
    type: "cvr" as const,
    title: "Complete CVR Period 8 – Thornfield Commercial",
    dueDate: "2026-06-14",
    priority: "medium" as const,
    project: "Thornfield Commercial",
    link: "/app/projects/proj-003/cvr",
  },
  {
    id: "aq-5",
    type: "report" as const,
    title: "Issue Monthly Commercial Report – All Projects",
    dueDate: "2026-06-15",
    priority: "medium" as const,
    project: "All Projects",
    link: "/app/reports",
  },
];

export const SEED_UPCOMING_DEADLINES = [
  { id: "dl-1", title: "EoT Notice – Eastside Block A", date: "2026-06-11", type: "notice", project: "MD-2024-001", severity: "danger" as const },
  { id: "dl-2", title: "Application #15 Submission", date: "2026-06-12", type: "application", project: "MD-2024-002", severity: "warning" as const },
  { id: "dl-3", title: "Daywork Upload Deadline", date: "2026-06-13", type: "evidence", project: "MD-2024-005", severity: "warning" as const },
  { id: "dl-4", title: "CVR Period 8 Sign-off", date: "2026-06-14", type: "cvr", project: "MD-2024-003", severity: "info" as const },
  { id: "dl-5", title: "Monthly Report Issue", date: "2026-06-15", type: "report", project: "All", severity: "info" as const },
  { id: "dl-6", title: "Final Account Submission", date: "2026-06-16", type: "final_account", project: "MD-2023-008", severity: "warning" as const },
  { id: "dl-7", title: "Retention Release Application", date: "2026-06-17", type: "application", project: "MD-2022-012", severity: "info" as const },
];

export const SEED_ACTIVITY_FEED = [
  { id: "af-1", user: "James Thornton", initials: "JT", action: "submitted", subject: "Application #15 for Eastside Block A", timestamp: "2026-06-10T09:42:00Z", type: "application" },
  { id: "af-2", user: "Sarah Mitchell", initials: "SM", action: "uploaded", subject: "3 site photos to Harlow Civic evidence log", timestamp: "2026-06-10T09:15:00Z", type: "evidence" },
  { id: "af-3", user: "James Thornton", initials: "JT", action: "raised", subject: "VO-052 Instruction for Additional Drainage – Thornfield", timestamp: "2026-06-10T08:58:00Z", type: "change" },
  { id: "af-4", user: "Rachel Okafor", initials: "RO", action: "completed", subject: "CVR Period 7 for Meridian Office Park", timestamp: "2026-06-09T17:30:00Z", type: "cvr" },
  { id: "af-5", user: "Tom Baxter", initials: "TB", action: "created", subject: "Risk marker: Groundworks delay – Eastside Block A", timestamp: "2026-06-09T16:14:00Z", type: "risk" },
  { id: "af-6", user: "Sarah Mitchell", initials: "SM", action: "commented on", subject: "VO-047 dispute thread – Thornfield Commercial", timestamp: "2026-06-09T14:52:00Z", type: "comment" },
  { id: "af-7", user: "Rachel Okafor", initials: "RO", action: "exported", subject: "Monthly Commercial Report – May 2026", timestamp: "2026-06-09T12:00:00Z", type: "report" },
  { id: "af-8", user: "Tom Baxter", initials: "TB", action: "archived", subject: "Completed project: Whitfield Leisure Centre", timestamp: "2026-06-08T17:00:00Z", type: "project" },
  { id: "af-9", user: "James Thornton", initials: "JT", action: "approved", subject: "VO-049 – Fire door upstand revision – Harlow Civic", timestamp: "2026-06-08T15:30:00Z", type: "change" },
  { id: "af-10", user: "Sarah Mitchell", initials: "SM", action: "updated", subject: "Final Account summary for MD-2023-008", timestamp: "2026-06-08T11:20:00Z", type: "final_account" },
];

export const SEED_PAYMENT_STATUS = [
  { name: "Certified & Paid", value: 9_840_000, fill: "#10B981" },
  { name: "Certified Unpaid", value: 3_180_000, fill: "#3B5EE8" },
  { name: "Applied – Pending", value: 2_620_000, fill: "#F59E0B" },
  { name: "Disputed", value: 600_000, fill: "#EF4444" },
];

export const SEED_CVR_MARGIN = [
  { project: "Eastside Block A", margin: 16.4, target: 15.0 },
  { project: "Meridian Phase 2", margin: 13.8, target: 14.5 },
  { project: "Thornfield Hub", margin: 11.2, target: 13.0 },
  { project: "Harlow Civic", margin: 17.1, target: 16.0 },
  { project: "Kings Cross Fit-out", margin: 9.4, target: 12.0 },
  { project: "Riverside Apts", margin: 15.9, target: 15.0 },
];

export const SEED_FINAL_ACCOUNT = [
  { project: "Eastside Block A", percent: 72, value: 4_850_000, status: "active" },
  { project: "Meridian Phase 2", percent: 88, value: 6_200_000, status: "active" },
  { project: "Harlow Civic", percent: 45, value: 3_150_000, status: "active" },
  { project: "Whitfield Leisure", percent: 96, value: 2_400_000, status: "closing" },
  { project: "Kings Cross Fit-out", percent: 31, value: 1_820_000, status: "active" },
];

export const SEED_EVIDENCE_HEALTH = [
  { name: "Linked & Current", value: 847, fill: "#10B981" },
  { name: "Unlinked", value: 124, fill: "#F59E0B" },
  { name: "Expiring < 30 days", value: 43, fill: "#EF4444" },
];

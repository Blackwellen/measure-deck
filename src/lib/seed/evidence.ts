// Realistic construction QS seed data for MeasureDeck Evidence section

export type EvidenceType = "Photo" | "Video" | "Document" | "Drawing" | "Correspondence";
export type EvidenceStatus = "linked" | "unlinked" | "archived";

export interface SeedEvidenceItem {
  id: string;
  fileName: string;
  type: EvidenceType;
  mimeType: string;
  sizeBytes: number;
  projectId: string;
  projectName: string;
  projectRef: string;
  linkedRecordsCount: number;
  uploadDate: string;
  dateTaken: string | null;
  uploadedBy: string;
  status: EvidenceStatus;
  description: string;
  aiClassification: string | null;
  tags: string[];
  thumbnailColor: string; // placeholder colour for demo thumbnails
}

export const SEED_EVIDENCE: SeedEvidenceItem[] = [
  {
    id: "ev-001",
    fileName: "Eastside-BlockA-Groundworks-001.jpg",
    type: "Photo",
    mimeType: "image/jpeg",
    sizeBytes: 2_840_000,
    projectId: "proj-001",
    projectName: "Eastside Residential Block A",
    projectRef: "MD-2024-001",
    linkedRecordsCount: 3,
    uploadDate: "2026-06-08T09:14:00Z",
    dateTaken: "2026-06-07T07:30:00Z",
    uploadedBy: "Sarah Mitchell",
    status: "linked",
    description: "Groundworks excavation depth at Grid F-G showing over-excavation beyond agreed formation level.",
    aiClassification: "Site Condition / Variation Evidence",
    tags: ["groundworks", "variation", "VO-038"],
    thumbnailColor: "#CBD5E1",
  },
  {
    id: "ev-002",
    fileName: "VO-047-Disputed-Cladding-Drawing.pdf",
    type: "Drawing",
    mimeType: "application/pdf",
    sizeBytes: 1_240_000,
    projectId: "proj-003",
    projectName: "Thornfield Commercial Hub",
    projectRef: "MD-2024-003",
    linkedRecordsCount: 2,
    uploadDate: "2026-06-07T14:22:00Z",
    dateTaken: null,
    uploadedBy: "James Thornton",
    status: "linked",
    description: "Revised cladding specification drawing D-CL-104 Rev C supporting disputed VO-047.",
    aiClassification: "Drawing / Variation Support",
    tags: ["cladding", "VO-047", "dispute"],
    thumbnailColor: "#DDD6FE",
  },
  {
    id: "ev-003",
    fileName: "Harlow-Civic-Daywork-Sheet-DW024.pdf",
    type: "Document",
    mimeType: "application/pdf",
    sizeBytes: 180_000,
    projectId: "proj-005",
    projectName: "Harlow Civic Centre Refurb",
    projectRef: "MD-2024-005",
    linkedRecordsCount: 1,
    uploadDate: "2026-06-09T11:05:00Z",
    dateTaken: "2026-06-06T00:00:00Z",
    uploadedBy: "Tom Baxter",
    status: "linked",
    description: "Signed daywork sheet DW-024 for additional asbestos removal works, 6 June 2026.",
    aiClassification: "Daywork Record",
    tags: ["daywork", "asbestos", "additional-works"],
    thumbnailColor: "#FEF3C7",
  },
  {
    id: "ev-004",
    fileName: "Meridian-Site-Meeting-Minutes-June26.pdf",
    type: "Correspondence",
    mimeType: "application/pdf",
    sizeBytes: 520_000,
    projectId: "proj-002",
    projectName: "Meridian Office Park Phase 2",
    projectRef: "MD-2024-002",
    linkedRecordsCount: 0,
    uploadDate: "2026-06-08T16:40:00Z",
    dateTaken: "2026-06-05T00:00:00Z",
    uploadedBy: "Rachel Okafor",
    status: "unlinked",
    description: "Site meeting minutes 5 June 2026 — includes instruction for plant removal not yet raised as VO.",
    aiClassification: "Site Meeting Record",
    tags: ["minutes", "meeting", "instruction"],
    thumbnailColor: "#ECFDF5",
  },
  {
    id: "ev-005",
    fileName: "Eastside-BlockA-Steel-Erection-Timelapse.mp4",
    type: "Video",
    mimeType: "video/mp4",
    sizeBytes: 48_200_000,
    projectId: "proj-001",
    projectName: "Eastside Residential Block A",
    projectRef: "MD-2024-001",
    linkedRecordsCount: 1,
    uploadDate: "2026-06-06T10:00:00Z",
    dateTaken: "2026-06-05T00:00:00Z",
    uploadedBy: "Sarah Mitchell",
    status: "linked",
    description: "Timelapse of steel frame erection on levels 4–6, evidencing programme acceleration.",
    aiClassification: "Programme Evidence",
    tags: ["steel", "programme", "delay-recovery"],
    thumbnailColor: "#EFF6FF",
  },
  {
    id: "ev-006",
    fileName: "Thornfield-Employer-Letter-PayLessNotice.pdf",
    type: "Correspondence",
    mimeType: "application/pdf",
    sizeBytes: 95_000,
    projectId: "proj-003",
    projectName: "Thornfield Commercial Hub",
    projectRef: "MD-2024-003",
    linkedRecordsCount: 2,
    uploadDate: "2026-06-04T09:30:00Z",
    dateTaken: "2026-06-03T00:00:00Z",
    uploadedBy: "James Thornton",
    status: "linked",
    description: "Pay Less Notice received from employer against Application #12 — £142,000 deduction contested.",
    aiClassification: "Contractual Notice",
    tags: ["pay-less-notice", "application-12", "dispute"],
    thumbnailColor: "#FEF2F2",
  },
  {
    id: "ev-007",
    fileName: "Harlow-Civic-Roof-Inspection-Photos.zip",
    type: "Document",
    mimeType: "application/zip",
    sizeBytes: 18_400_000,
    projectId: "proj-005",
    projectName: "Harlow Civic Centre Refurb",
    projectRef: "MD-2024-005",
    linkedRecordsCount: 0,
    uploadDate: "2026-06-10T08:15:00Z",
    dateTaken: "2026-06-09T00:00:00Z",
    uploadedBy: "Tom Baxter",
    status: "unlinked",
    description: "Bundle of 42 roof inspection photographs from pre-works survey — not yet linked to any change.",
    aiClassification: null,
    tags: ["roof", "survey", "pre-works"],
    thumbnailColor: "#F5F3FF",
  },
  {
    id: "ev-008",
    fileName: "Kings-Cross-Fitout-Instruction-Email.pdf",
    type: "Correspondence",
    mimeType: "application/pdf",
    sizeBytes: 64_000,
    projectId: "proj-006",
    projectName: "Kings Cross Fit-out",
    projectRef: "MD-2024-006",
    linkedRecordsCount: 0,
    uploadDate: "2026-06-09T15:20:00Z",
    dateTaken: "2026-06-08T00:00:00Z",
    uploadedBy: "Rachel Okafor",
    status: "unlinked",
    description: "Email instruction from contract administrator for additional M&E first-fix works — no VO raised.",
    aiClassification: "Instruction Record",
    tags: ["instruction", "M&E", "CA"],
    thumbnailColor: "#ECFEFF",
  },
  {
    id: "ev-009",
    fileName: "Meridian-Phase2-Concrete-Pumping-002.jpg",
    type: "Photo",
    mimeType: "image/jpeg",
    sizeBytes: 3_100_000,
    projectId: "proj-002",
    projectName: "Meridian Office Park Phase 2",
    projectRef: "MD-2024-002",
    linkedRecordsCount: 2,
    uploadDate: "2026-06-05T13:45:00Z",
    dateTaken: "2026-06-05T11:00:00Z",
    uploadedBy: "Sarah Mitchell",
    status: "linked",
    description: "Concrete pump on Level 3 slab pour showing additional reinforcement density per engineer's instruction.",
    aiClassification: "Site Progress / Variation Evidence",
    tags: ["concrete", "reinforcement", "variation"],
    thumbnailColor: "#CBD5E1",
  },
  {
    id: "ev-010",
    fileName: "Eastside-BlockA-Programme-Update-P14.pdf",
    type: "Document",
    mimeType: "application/pdf",
    sizeBytes: 870_000,
    projectId: "proj-001",
    projectName: "Eastside Residential Block A",
    projectRef: "MD-2024-001",
    linkedRecordsCount: 4,
    uploadDate: "2026-06-03T09:00:00Z",
    dateTaken: null,
    uploadedBy: "James Thornton",
    status: "linked",
    description: "Programme revision P14 showing impact of groundworks delay on critical path — supports EoT claim.",
    aiClassification: "Programme Document / EoT Evidence",
    tags: ["programme", "EoT", "delay", "critical-path"],
    thumbnailColor: "#FEF3C7",
  },
  {
    id: "ev-011",
    fileName: "Riverside-Apts-Brickwork-Sample-Board.jpg",
    type: "Photo",
    mimeType: "image/jpeg",
    sizeBytes: 2_200_000,
    projectId: "proj-007",
    projectName: "Riverside Apartments",
    projectRef: "MD-2024-007",
    linkedRecordsCount: 1,
    uploadDate: "2026-06-02T14:30:00Z",
    dateTaken: "2026-06-02T11:00:00Z",
    uploadedBy: "Tom Baxter",
    status: "linked",
    description: "Approved brick sample board — client-selected Ibstock Antique Multi, agreed premium rate.",
    aiClassification: "Material Selection Record",
    tags: ["brickwork", "material", "approval"],
    thumbnailColor: "#CBD5E1",
  },
  {
    id: "ev-012",
    fileName: "Thornfield-Structural-Engineers-Report.pdf",
    type: "Document",
    mimeType: "application/pdf",
    sizeBytes: 3_650_000,
    projectId: "proj-003",
    projectName: "Thornfield Commercial Hub",
    projectRef: "MD-2024-003",
    linkedRecordsCount: 3,
    uploadDate: "2026-06-01T10:15:00Z",
    dateTaken: null,
    uploadedBy: "James Thornton",
    status: "linked",
    description: "Structural engineer's report on unforeseen substructure condition — supports VO-041 claim.",
    aiClassification: "Technical Report / Variation Evidence",
    tags: ["structural", "substructure", "VO-041"],
    thumbnailColor: "#FEF3C7",
  },
];

export interface SeedEvidenceGap {
  projectId: string;
  projectName: string;
  projectRef: string;
  totalChanges: number;
  changesWithEvidence: number;
  coveragePercent: number;
  gapSeverity: "danger" | "warning" | "success";
  unlinkedCount: number;
  aiCheckAvailable: boolean;
}

export const SEED_EVIDENCE_GAPS: SeedEvidenceGap[] = [
  {
    projectId: "proj-001",
    projectName: "Eastside Residential Block A",
    projectRef: "MD-2024-001",
    totalChanges: 28,
    changesWithEvidence: 23,
    coveragePercent: 82,
    gapSeverity: "warning",
    unlinkedCount: 5,
    aiCheckAvailable: true,
  },
  {
    projectId: "proj-002",
    projectName: "Meridian Office Park Phase 2",
    projectRef: "MD-2024-002",
    totalChanges: 19,
    changesWithEvidence: 17,
    coveragePercent: 89,
    gapSeverity: "success",
    unlinkedCount: 2,
    aiCheckAvailable: true,
  },
  {
    projectId: "proj-003",
    projectName: "Thornfield Commercial Hub",
    projectRef: "MD-2024-003",
    totalChanges: 34,
    changesWithEvidence: 22,
    coveragePercent: 65,
    gapSeverity: "danger",
    unlinkedCount: 12,
    aiCheckAvailable: true,
  },
  {
    projectId: "proj-005",
    projectName: "Harlow Civic Centre Refurb",
    projectRef: "MD-2024-005",
    totalChanges: 41,
    changesWithEvidence: 21,
    coveragePercent: 51,
    gapSeverity: "danger",
    unlinkedCount: 20,
    aiCheckAvailable: true,
  },
  {
    projectId: "proj-006",
    projectName: "Kings Cross Fit-out",
    projectRef: "MD-2024-006",
    totalChanges: 12,
    changesWithEvidence: 11,
    coveragePercent: 92,
    gapSeverity: "success",
    unlinkedCount: 1,
    aiCheckAvailable: false,
  },
  {
    projectId: "proj-007",
    projectName: "Riverside Apartments",
    projectRef: "MD-2024-007",
    totalChanges: 22,
    changesWithEvidence: 18,
    coveragePercent: 82,
    gapSeverity: "warning",
    unlinkedCount: 4,
    aiCheckAvailable: true,
  },
];

export function formatFileSize(bytes: number): string {
  if (bytes < 1_000) return `${bytes} B`;
  if (bytes < 1_000_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  if (bytes < 1_000_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${(bytes / 1_000_000_000).toFixed(2)} GB`;
}

export function getTypeIcon(type: EvidenceType): string {
  const map: Record<EvidenceType, string> = {
    Photo: "image",
    Video: "video",
    Document: "file-text",
    Drawing: "drafting-compass",
    Correspondence: "mail",
  };
  return map[type];
}

export function getTypeChipClass(type: EvidenceType): string {
  const map: Record<EvidenceType, string> = {
    Photo: "chip-primary",
    Video: "chip-violet",
    Document: "chip-muted",
    Drawing: "chip-cyan",
    Correspondence: "chip-warning",
  };
  return map[type];
}

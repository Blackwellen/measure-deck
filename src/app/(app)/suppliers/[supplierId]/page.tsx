"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Building2, Phone, Mail, MapPin, Globe, Plus, Upload,
  Edit, CheckCircle, AlertTriangle, XCircle, Clock, FileText,
  MessageSquare, Activity, Shield, MoreHorizontal, ExternalLink,
  Download, Star, Flag, CreditCard, Banknote, Users,
  Package, Receipt, StickyNote, PinIcon, Bell, ChevronRight,
  RefreshCw, Hash, Percent, Calendar, Layers, Search, X,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import {
  cn, formatDate, formatRelative, formatCurrency, getInitials,
} from "@/lib/utils";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "sonner";
import { FeatureGate } from "@/components/ui/feature-gate";
import { SubcontractWizard } from "@/components/wizards/subcontract-wizard";

/* ─────────────────────── Types ─────────────────────── */

type ComplianceStatus = "Compliant" | "Expiring Soon" | "Non-Compliant" | "Pending";
type ApprovedStatus = "Approved" | "Pending Approval" | "Suspended" | "Rejected";
type SupplierType = "Labour Subcontractor" | "Plant Hire" | "Materials Supplier" | "Specialist Subcontractor" | "Professional Services" | "Consultant";

interface Supplier {
  id: string;
  name: string;
  type: SupplierType;
  trade_category: string;
  compliance_status: ComplianceStatus;
  compliance_score: number;
  approved_status: ApprovedStatus;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  companies_house_no: string;
  notes: string;
  tags: string[];
  rating: number;
  payment_terms: string;
  cis_registered: boolean;
  cis_number: string;
  vat_registered: boolean;
  vat_number: string;
  public_liability_amount: number;
  employers_liability_amount: number;
  professional_indemnity_amount: number;
  insurance_expiry: string;
  bank_account_name: string;
  bank_sort_code: string;
  bank_account_number: string;
  created_at: string;
  updated_at: string;
  company_number?: string;
  ch_data?: CHData | null;
}

interface CHData {
  company_number: string;
  company_name: string;
  company_status: string;
  registered_office_address: string;
  date_of_creation: string | null;
  sic_codes: string[];
}

interface CHSearchResult {
  company_number: string;
  company_name: string;
  company_status: string;
  registered_office_address: string;
  date_of_creation: string | null;
  sic_codes: string[];
}

interface CHOfficer {
  name: string;
  officer_role: string;
  appointed_on: string | null;
  address: string;
}

interface InsuranceDoc {
  id: string;
  type: "public_liability" | "employers_liability" | "professional_indemnity";
  label: string;
  insurer: string;
  amount: number;
  expiry_date: string;
  file_path: string;
  file_name: string;
  uploaded_at: string;
}

interface SupplierContact {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  last_contact: string;
  primary: boolean;
}

interface ComplianceDoc {
  id: string;
  type: string;
  amount?: string;
  number?: string;
  expiry: string;
  status: ComplianceStatus;
  document: string;
  verified_date?: string;
}

interface SupplierDocument {
  id: string;
  name: string;
  doc_type: string;
  size: string;
  uploaded_at: string;
  uploaded_by: string;
  expiry?: string;
  status?: string;
}

interface ProjectLink {
  id: string;
  project_name: string;
  trade: string;
  contract_value: number;
  status: string;
  start_date: string;
  end_date: string;
}

interface SubcontractOrder {
  id: string;
  order_ref: string;
  project: string;
  order_value: number;
  certified_to_date: number;
  paid_to_date: number;
  retention: number;
  status: string;
}

interface PaymentApplication {
  id: string;
  app_number: number;
  project: string;
  period: string;
  applied: number;
  certified: number;
  paid: number;
  date: string;
  status: string;
  late: boolean;
}

interface ActivityItem {
  id: string;
  type: "email" | "call" | "task" | "document" | "application" | "payment" | "note" | "status";
  description: string;
  actor: string;
  created_at: string;
}

interface Note {
  id: string;
  text: string;
  author: string;
  created_at: string;
  pinned: boolean;
}

interface SupplierTask {
  id: string;
  title: string;
  project: string;
  due_date: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "To Do" | "In Progress" | "In Review" | "Done";
  assignee: string;
}

interface CISRecord {
  id: string;
  utr: string;
  status: string;
  last_verification_date: string;
  deduction_rate: number;
  verified_by: string;
}

/* ─────────────────────── Seed ─────────────────────── */

const SUPPLIER_SEED: Record<string, Supplier> = {
  "sup-001": {
    id: "sup-001", name: "Apex Groundworks Ltd", type: "Labour Subcontractor",
    trade_category: "Groundworks & Civil Engineering", compliance_status: "Compliant",
    compliance_score: 95, approved_status: "Approved",
    contact_name: "Mark Hughes", contact_email: "mark.hughes@apexgw.co.uk", contact_phone: "01234 567890",
    email: "enquiries@apexgw.co.uk", phone: "01234 567800", website: "www.apexgw.co.uk",
    address: "Unit 12, Apex House, Birmingham Business Park, B37 7YB",
    companies_house_no: "08452310",
    notes: "Long-standing subcontractor. Excellent on groundworks packages. Preferred supplier for civils works. Strong H&S record.",
    tags: ["groundworks", "civils", "preferred", "framework"],
    rating: 4, payment_terms: "30 days net",
    cis_registered: true, cis_number: "CIS-2024-GW-001",
    vat_registered: true, vat_number: "GB 123 456 789",
    public_liability_amount: 10000000, employers_liability_amount: 5000000, professional_indemnity_amount: 0,
    insurance_expiry: "2026-12-31",
    bank_account_name: "Apex Groundworks Ltd", bank_sort_code: "20-00-00", bank_account_number: "12345678",
    created_at: "2024-03-15T09:00:00Z", updated_at: "2026-05-20T14:22:00Z",
    company_number: "08452310",
    ch_data: {
      company_number: "08452310", company_name: "APEX GROUNDWORKS LIMITED",
      company_status: "active", registered_office_address: "Unit 12, Apex House, Birmingham Business Park, B37 7YB",
      date_of_creation: "2013-04-12", sic_codes: ["42110", "43120"],
    },
  },
  "sup-002": {
    id: "sup-002", name: "BrightBuild Materials", type: "Materials Supplier",
    trade_category: "Building Materials & Aggregates", compliance_status: "Compliant",
    compliance_score: 88, approved_status: "Approved",
    contact_name: "Sarah Chen", contact_email: "s.chen@brightbuild.co.uk", contact_phone: "0161 234 5678",
    email: "sales@brightbuild.co.uk", phone: "0161 234 5600", website: "www.brightbuild.co.uk",
    address: "45 Commerce Way, Trafford Park, Manchester, M17 1HW",
    companies_house_no: "07123456",
    notes: "Premier aggregates and materials supplier. Good pricing on block and brick. Reliable delivery.",
    tags: ["materials", "aggregates", "preferred"],
    rating: 5, payment_terms: "45 days net",
    cis_registered: false, cis_number: "",
    vat_registered: true, vat_number: "GB 987 654 321",
    public_liability_amount: 5000000, employers_liability_amount: 5000000, professional_indemnity_amount: 0,
    insurance_expiry: "2026-09-30",
    bank_account_name: "BrightBuild Materials Ltd", bank_sort_code: "30-00-00", bank_account_number: "87654321",
    created_at: "2024-01-20T10:00:00Z", updated_at: "2026-06-01T10:00:00Z",
    ch_data: null,
  },
};

const DEFAULT_SUPPLIER: Supplier = {
  id: "", name: "Unknown Supplier", type: "Professional Services",
  trade_category: "—", compliance_status: "Pending", compliance_score: 0, approved_status: "Pending Approval",
  contact_name: "—", contact_email: "—", contact_phone: "—", email: "—", phone: "—", website: "—",
  address: "—", companies_house_no: "—", notes: "", tags: [], rating: 0, payment_terms: "—",
  cis_registered: false, cis_number: "", vat_registered: false, vat_number: "",
  public_liability_amount: 0, employers_liability_amount: 0, professional_indemnity_amount: 0,
  insurance_expiry: "", bank_account_name: "—", bank_sort_code: "—", bank_account_number: "—",
  created_at: "", updated_at: "", ch_data: null,
};

const CONTACTS_SEED: Record<string, SupplierContact[]> = {
  "sup-001": [
    { id: "c-001", name: "Mark Hughes", role: "Director", email: "mark.hughes@apexgw.co.uk", phone: "01234 567890", last_contact: "2026-06-05", primary: true },
    { id: "c-002", name: "Lisa Hughes", role: "Estimator", email: "l.hughes@apexgw.co.uk", phone: "01234 567891", last_contact: "2026-05-28", primary: false },
    { id: "c-003", name: "Dan Carter", role: "Site Manager", email: "d.carter@apexgw.co.uk", phone: "07800 123456", last_contact: "2026-04-10", primary: false },
  ],
  "sup-002": [
    { id: "c-004", name: "Sarah Chen", role: "Account Manager", email: "s.chen@brightbuild.co.uk", phone: "0161 234 5678", last_contact: "2026-06-08", primary: true },
    { id: "c-005", name: "Peter Walsh", role: "Delivery Coordinator", email: "p.walsh@brightbuild.co.uk", phone: "0161 234 5679", last_contact: "2026-05-20", primary: false },
  ],
};

const COMPLIANCE_SEED: Record<string, ComplianceDoc[]> = {
  "sup-001": [
    { id: "cp-001", type: "Public Liability Insurance", amount: "£10,000,000", expiry: "2026-12-31", status: "Compliant", document: "PLI-2026.pdf" },
    { id: "cp-002", type: "Employers Liability Insurance", amount: "£5,000,000", expiry: "2026-12-31", status: "Compliant", document: "ELI-2026.pdf" },
    { id: "cp-003", type: "Professional Indemnity", amount: "N/A", expiry: "N/A", status: "Pending", document: "" },
    { id: "cp-004", type: "CIS Registration", number: "CIS-2024-GW-001", expiry: "Ongoing", status: "Compliant", document: "CIS-Cert.pdf", verified_date: "2024-03-01" },
    { id: "cp-005", type: "VAT Registration", number: "GB 123 456 789", expiry: "Ongoing", status: "Compliant", document: "VAT-Cert.pdf" },
    { id: "cp-006", type: "CHAS Accreditation", expiry: "2026-08-31", status: "Compliant", document: "CHAS-2026.pdf" },
    { id: "cp-007", type: "Constructionline Gold", expiry: "2026-09-30", status: "Compliant", document: "CL-Gold.pdf" },
    { id: "cp-008", type: "ISO 9001 Quality", expiry: "2026-06-30", status: "Expiring Soon", document: "ISO9001.pdf" },
    { id: "cp-009", type: "Health & Safety Policy", expiry: "2026-09-01", status: "Compliant", document: "HS-Policy.pdf" },
  ],
  "sup-002": [
    { id: "cp-010", type: "Public Liability Insurance", amount: "£5,000,000", expiry: "2026-09-30", status: "Compliant", document: "PLI-2026.pdf" },
    { id: "cp-011", type: "Employers Liability Insurance", amount: "£5,000,000", expiry: "2026-09-30", status: "Compliant", document: "ELI-2026.pdf" },
    { id: "cp-012", type: "VAT Registration", number: "GB 987 654 321", expiry: "Ongoing", status: "Compliant", document: "VAT-Cert.pdf" },
    { id: "cp-013", type: "CHAS Accreditation", expiry: "2026-11-30", status: "Compliant", document: "CHAS-2026.pdf" },
  ],
};

const PROJECTS_SEED: Record<string, ProjectLink[]> = {
  "sup-001": [
    { id: "p-001", project_name: "Thornfield Commercial Hub", trade: "Groundworks Package", contract_value: 320000, status: "In Progress", start_date: "2025-03-01", end_date: "2026-08-31" },
    { id: "p-002", project_name: "Eastside Residential Block A", trade: "Foundations & Drainage", contract_value: 185000, status: "Completed", start_date: "2024-06-01", end_date: "2025-02-28" },
  ],
  "sup-002": [
    { id: "p-005", project_name: "Thornfield Commercial Hub", trade: "Materials Supply", contract_value: 430000, status: "In Progress", start_date: "2025-03-01", end_date: "2026-08-31" },
  ],
};

const ORDERS_SEED: Record<string, SubcontractOrder[]> = {
  "sup-001": [
    { id: "o-001", order_ref: "SCO-001-2025", project: "Thornfield Commercial Hub", order_value: 320000, certified_to_date: 224000, paid_to_date: 201600, retention: 11200, status: "Active" },
    { id: "o-002", order_ref: "SCO-002-2024", project: "Eastside Residential Block A", order_value: 185000, certified_to_date: 185000, paid_to_date: 175750, retention: 9250, status: "Final Account" },
    { id: "o-003", order_ref: "SCO-003-2024", project: "City Centre Retail Fit-Out", order_value: 145000, certified_to_date: 145000, paid_to_date: 145000, retention: 0, status: "Closed" },
  ],
  "sup-002": [
    { id: "o-004", order_ref: "PO-001-2025", project: "Thornfield Commercial Hub", order_value: 430000, certified_to_date: 301000, paid_to_date: 270900, retention: 0, status: "Active" },
  ],
};

const APPLICATIONS_SEED: Record<string, PaymentApplication[]> = {
  "sup-001": [
    { id: "app-001", app_number: 1, project: "Thornfield", period: "Mar 2025", applied: 35000, certified: 35000, paid: 35000, date: "2025-03-31", status: "Paid", late: false },
    { id: "app-002", app_number: 2, project: "Thornfield", period: "Apr 2025", applied: 48000, certified: 45000, paid: 45000, date: "2025-04-30", status: "Paid", late: false },
    { id: "app-003", app_number: 3, project: "Thornfield", period: "May 2025", applied: 52000, certified: 50000, paid: 50000, date: "2025-05-31", status: "Paid", late: true },
    { id: "app-004", app_number: 4, project: "Thornfield", period: "Jun 2025", applied: 44000, certified: 42000, paid: 42000, date: "2025-06-30", status: "Paid", late: false },
    { id: "app-005", app_number: 5, project: "Thornfield", period: "May 2026", applied: 38000, certified: 36000, paid: 0, date: "2026-05-31", status: "Certified", late: false },
    { id: "app-006", app_number: 6, project: "Thornfield", period: "Jun 2026", applied: 41000, certified: 0, paid: 0, date: "2026-06-30", status: "Submitted", late: false },
  ],
  "sup-002": [
    { id: "app-007", app_number: 1, project: "Thornfield", period: "Mar 2025", applied: 85000, certified: 85000, paid: 85000, date: "2025-03-31", status: "Paid", late: false },
    { id: "app-008", app_number: 2, project: "Thornfield", period: "Apr 2025", applied: 110000, certified: 108000, paid: 108000, date: "2025-04-30", status: "Paid", late: false },
  ],
};

const DOCUMENTS_SEED: Record<string, SupplierDocument[]> = {
  "sup-001": [
    { id: "d-001", name: "Framework Agreement 2024", doc_type: "Contract", size: "2.4 MB", uploaded_at: "2024-03-20", uploaded_by: "J. Thompson", status: "Active" },
    { id: "d-002", name: "Public Liability Insurance Certificate", doc_type: "Insurance", size: "1.1 MB", uploaded_at: "2026-01-10", uploaded_by: "S. Okafor", expiry: "2026-12-31", status: "Valid" },
    { id: "d-003", name: "Employers Liability Insurance Certificate", doc_type: "Insurance", size: "0.9 MB", uploaded_at: "2026-01-10", uploaded_by: "S. Okafor", expiry: "2026-12-31", status: "Valid" },
    { id: "d-004", name: "CHAS Certificate 2026", doc_type: "Certificate", size: "0.6 MB", uploaded_at: "2026-02-01", uploaded_by: "J. Thompson", expiry: "2026-08-31", status: "Valid" },
    { id: "d-005", name: "H&S Induction Pack", doc_type: "Health & Safety", size: "5.1 MB", uploaded_at: "2024-03-16", uploaded_by: "J. Thompson" },
    { id: "d-006", name: "ISO 9001 Certificate", doc_type: "Certificate", size: "0.4 MB", uploaded_at: "2025-07-01", uploaded_by: "J. Thompson", expiry: "2026-06-30", status: "Expiring Soon" },
  ],
  "sup-002": [
    { id: "d-008", name: "Supply Agreement 2024-2025", doc_type: "Contract", size: "1.9 MB", uploaded_at: "2024-01-22", uploaded_by: "J. Thompson", status: "Active" },
    { id: "d-009", name: "Rate Schedule Q1 2026", doc_type: "Pricing", size: "0.5 MB", uploaded_at: "2025-12-01", uploaded_by: "S. Okafor" },
  ],
};

const ACTIVITY_SEED: Record<string, ActivityItem[]> = {
  "sup-001": [
    { id: "a-001", type: "call", description: "Phone call with Mark Hughes — discussed VO pricing for Thornfield", actor: "J. Thompson", created_at: "2026-06-05T10:30:00Z" },
    { id: "a-002", type: "application", description: "Payment application #6 received — £41,000 for Jun 2026", actor: "System", created_at: "2026-06-01T09:00:00Z" },
    { id: "a-003", type: "document", description: "ISO 9001 Certificate uploaded (expiring soon)", actor: "J. Thompson", created_at: "2026-05-28T14:00:00Z" },
    { id: "a-004", type: "payment", description: "Payment made — App #5 £36,000 — Thornfield", actor: "Accounts", created_at: "2026-05-20T11:00:00Z" },
    { id: "a-005", type: "status", description: "Supplier approved status confirmed — annual review", actor: "J. Thompson", created_at: "2026-04-01T09:00:00Z" },
  ],
  "sup-002": [
    { id: "a-009", type: "call", description: "Call with Sarah Chen — confirmed Q1 pricing", actor: "J. Thompson", created_at: "2026-06-08T14:00:00Z" },
    { id: "a-010", type: "document", description: "Rate schedule uploaded for 2026", actor: "S. Okafor", created_at: "2025-12-01T10:00:00Z" },
  ],
};

const NOTES_SEED: Record<string, Note[]> = {
  "sup-001": [
    { id: "n-001", text: "Met with Mark Hughes at site in April. Agreed on revised programme for Phase 2. Strong performance.", author: "J. Thompson", created_at: "2026-04-15T11:00:00Z", pinned: true },
    { id: "n-002", text: "Chased H&S policy renewal — due September. Mark confirmed they are in process of updating.", author: "S. Okafor", created_at: "2026-05-20T09:00:00Z", pinned: false },
  ],
  "sup-002": [
    { id: "n-004", text: "Rate card updated for Q1 2026. Sarah confirmed no price increase on aggregates for the next 6 months.", author: "J. Thompson", created_at: "2025-12-01T10:00:00Z", pinned: true },
  ],
};

const TASKS_SEED: Record<string, SupplierTask[]> = {
  "sup-001": [
    { id: "t-001", title: "Chase ISO 9001 renewal certificate", project: "Supplier Management", due_date: "2026-06-30", priority: "High", status: "To Do", assignee: "J. Thompson" },
    { id: "t-002", title: "Review retention schedule — SCO-001-2025", project: "Thornfield Commercial Hub", due_date: "2026-06-15", priority: "Medium", status: "In Progress", assignee: "S. Okafor" },
  ],
  "sup-002": [
    { id: "t-004", title: "Confirm Q3 pricing schedule", project: "Supplier Management", due_date: "2026-06-20", priority: "Low", status: "To Do", assignee: "J. Thompson" },
  ],
};

const CIS_SEED: Record<string, CISRecord[]> = {
  "sup-001": [
    { id: "cis-001", utr: "1234567890", status: "Gross", last_verification_date: "2026-05-01", deduction_rate: 0, verified_by: "J. Thompson" },
  ],
  "sup-002": [],
};

const INSURANCE_SEED: Record<string, InsuranceDoc[]> = {
  "sup-001": [
    {
      id: "ins-001", type: "public_liability", label: "Public Liability",
      insurer: "Zurich Insurance", amount: 10000000, expiry_date: "2026-12-31",
      file_path: "sup-001/pli-2026.pdf", file_name: "PLI-2026.pdf", uploaded_at: "2026-01-10",
    },
    {
      id: "ins-002", type: "employers_liability", label: "Employers Liability",
      insurer: "AXA Insurance", amount: 5000000, expiry_date: "2026-12-31",
      file_path: "sup-001/eli-2026.pdf", file_name: "ELI-2026.pdf", uploaded_at: "2026-01-10",
    },
  ],
  "sup-002": [
    {
      id: "ins-003", type: "public_liability", label: "Public Liability",
      insurer: "Hiscox", amount: 5000000, expiry_date: "2026-09-30",
      file_path: "sup-002/pli-2026.pdf", file_name: "PLI-2026.pdf", uploaded_at: "2026-01-15",
    },
    {
      id: "ins-004", type: "employers_liability", label: "Employers Liability",
      insurer: "Aviva", amount: 5000000, expiry_date: "2026-09-30",
      file_path: "sup-002/eli-2026.pdf", file_name: "ELI-2026.pdf", uploaded_at: "2026-01-15",
    },
  ],
};

const MONTHLY_SPEND = [
  { month: "Jan", spend: 36000 }, { month: "Feb", spend: 41000 }, { month: "Mar", spend: 35000 },
  { month: "Apr", spend: 48000 }, { month: "May", spend: 52000 }, { month: "Jun", spend: 44000 },
  { month: "Jul", spend: 39000 }, { month: "Aug", spend: 45000 }, { month: "Sep", spend: 51000 },
  { month: "Oct", spend: 47000 }, { month: "Nov", spend: 38000 }, { month: "Dec", spend: 42000 },
];

/* ─────────────────────── Helpers ─────────────────────── */

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function insuranceStatus(expiry_date: string): ComplianceStatus {
  const days = daysUntil(expiry_date);
  if (days < 0) return "Non-Compliant";
  if (days <= 30) return "Expiring Soon";
  return "Compliant";
}

function chStatusBadge(status: string) {
  const norm = status.toLowerCase();
  if (norm === "active") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#DCFCE7] text-[#15803D]">
      <CheckCircle size={10} /> Active
    </span>
  );
  if (norm === "dissolved") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#FEE2E2] text-[#B91C1C]">
      <XCircle size={10} /> Dissolved
    </span>
  );
  if (norm === "dormant") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[#FEF9C3] text-[#854D0E]">
      <AlertTriangle size={10} /> Dormant
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
      <Clock size={10} /> {status}
    </span>
  );
}

function complianceBadge(status: ComplianceStatus) {
  const map = {
    Compliant: { bg: "bg-[#DCFCE7]", text: "text-[#15803D]", icon: <CheckCircle size={11} /> },
    "Expiring Soon": { bg: "bg-[#FEF9C3]", text: "text-[#854D0E]", icon: <AlertTriangle size={11} /> },
    "Non-Compliant": { bg: "bg-[#FEE2E2]", text: "text-[#B91C1C]", icon: <XCircle size={11} /> },
    Pending: { bg: "bg-gray-100", text: "text-gray-600", icon: <Clock size={11} /> },
  };
  const { bg, text, icon } = map[status];
  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", bg, text)}>
      {icon} {status}
    </span>
  );
}

function approvedBadge(status: ApprovedStatus) {
  const map = {
    Approved: { bg: "bg-[#DCFCE7]", text: "text-[#15803D]" },
    "Pending Approval": { bg: "bg-[#FEF9C3]", text: "text-[#854D0E]" },
    Suspended: { bg: "bg-[#FEE2E2]", text: "text-[#B91C1C]" },
    Rejected: { bg: "bg-[#FEE2E2]", text: "text-[#B91C1C]" },
  };
  const { bg, text } = map[status];
  return <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold", bg, text)}>{status}</span>;
}

function priorityBadge(p: SupplierTask["priority"]) {
  const map = { Critical: "bg-[#FEE2E2] text-[#B91C1C]", High: "bg-[#FEF3C7] text-[#92400E]", Medium: "bg-[#FFF3E0] text-[#B45309]", Low: "bg-gray-100 text-gray-600" };
  return <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", map[p])}><Flag size={10} />{p}</span>;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Active: "bg-[#DCFCE7] text-[#15803D]", Closed: "bg-gray-100 text-gray-600",
    "Final Account": "bg-[#EDE9FE] text-[#6D28D9]", Paid: "bg-[#DCFCE7] text-[#15803D]",
    Certified: "bg-[#DBEAFE] text-[#1D4ED8]", Submitted: "bg-[#FEF9C3] text-[#854D0E]",
    "In Progress": "bg-[#DBEAFE] text-[#1D4ED8]", Completed: "bg-gray-100 text-gray-600",
    Tendering: "bg-[#EDE9FE] text-[#6D28D9]", Valid: "bg-[#DCFCE7] text-[#15803D]",
    "Expiring Soon": "bg-[#FEF9C3] text-[#854D0E]", Expired: "bg-[#FEE2E2] text-[#B91C1C]",
    issued: "bg-[#DBEAFE] text-[#1D4ED8]", draft: "bg-gray-100 text-gray-600",
    completed: "bg-gray-100 text-gray-600", terminated: "bg-[#FEE2E2] text-[#B91C1C]",
    Gross: "bg-[#DCFCE7] text-[#15803D]", Net: "bg-[#FEF9C3] text-[#854D0E]", Excluded: "bg-gray-100 text-gray-600",
  };
  return <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", map[status] ?? "bg-gray-100 text-gray-600")}>{status}</span>;
}

function ScoreRing({ score }: { score: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? "#16A34A" : score >= 60 ? "#D97706" : "#DC2626";
  return (
    <div className="relative flex items-center justify-center" style={{ width: 72, height: 72 }}>
      <svg width="72" height="72" className="-rotate-90">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#E5E7EB" strokeWidth="6" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className="absolute text-sm font-bold" style={{ color }}>{score}</span>
    </div>
  );
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={14} className={i <= value ? "fill-amber-400 text-amber-400" : "text-gray-200"} />
      ))}
    </div>
  );
}

function activityIcon(type: ActivityItem["type"]) {
  const map = {
    email: <Mail size={13} />, call: <Phone size={13} />, task: <CheckCircle size={13} />,
    document: <FileText size={13} />, application: <Receipt size={13} />, payment: <Banknote size={13} />,
    note: <StickyNote size={13} />, status: <Shield size={13} />,
  };
  const colors = {
    email: "bg-[#DBEAFE] text-[#1D4ED8]", call: "bg-[#DCFCE7] text-[#15803D]",
    task: "bg-[#EDE9FE] text-[#6D28D9]", document: "bg-gray-100 text-gray-600",
    application: "bg-[#FEF9C3] text-[#854D0E]", payment: "bg-[#DCFCE7] text-[#15803D]",
    note: "bg-gray-100 text-gray-600", status: "bg-[#FEF9C3] text-[#854D0E]",
  };
  return (
    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", colors[type])}>
      {map[type]}
    </div>
  );
}

/* ─────────────────────── KYC Tab ─────────────────────── */

function KYCTab({ supplier, supplierId }: { supplier: Supplier; supplierId: string }) {
  const [chSearch, setChSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [chResults, setChResults] = useState<CHSearchResult[]>([]);
  const [chData, setChData] = useState<CHData | null>(supplier.ch_data ?? null);
  const [officers, setOfficers] = useState<CHOfficer[]>([]);
  const [loadingOfficers, setLoadingOfficers] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const insuranceDocs = INSURANCE_SEED[supplierId] ?? [];
  const inputRef = useRef<HTMLInputElement>(null);

  const chVerified = chData !== null;

  const kycScore = (() => {
    let score = 0;
    if (chVerified && chData?.company_status === "active") score += 25;
    const insuranceCurrent = insuranceDocs.some(d => insuranceStatus(d.expiry_date) === "Compliant");
    if (insuranceCurrent) score += 25;
    if (supplier.cis_registered) score += 25;
    if (insuranceDocs.length >= 2) score += 25;
    return score;
  })();

  async function searchCH() {
    if (!chSearch.trim()) return;
    setSearching(true);
    setChResults([]);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/companies-house-search`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ action: "search", q: chSearch }),
        }
      );
      const json = (await res.json()) as { items?: CHSearchResult[] };
      setChResults(json.items ?? []);
    } catch {
      toast.error("Companies House search failed");
    } finally {
      setSearching(false);
    }
  }

  async function linkSupplier(result: CHSearchResult) {
    setChData(result);
    setChResults([]);
    setChSearch("");
    toast.success(`Linked to ${result.company_name}`);
    loadOfficers(result.company_number);
  }

  async function refreshCH() {
    if (!chData) return;
    setRefreshing(true);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/companies-house-search`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ action: "details", company_number: chData.company_number }),
        }
      );
      const json = (await res.json()) as CHData;
      setChData(json);
      toast.success("Companies House data refreshed");
    } catch {
      toast.error("Refresh failed");
    } finally {
      setRefreshing(false);
    }
  }

  async function loadOfficers(companyNumber: string) {
    setLoadingOfficers(true);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/companies-house-search`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ action: "officers", company_number: companyNumber }),
        }
      );
      const json = (await res.json()) as { officers?: CHOfficer[] };
      setOfficers(json.officers ?? []);
    } catch {
      // ignore
    } finally {
      setLoadingOfficers(false);
    }
  }

  useEffect(() => {
    if (chData?.company_number) {
      loadOfficers(chData.company_number);
    }
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "KYC Score", value: `${kycScore}/100`, color: kycScore >= 75 ? "#15803D" : kycScore >= 50 ? "#D97706" : "#DC2626" },
          { label: "CH Verified", value: chVerified ? "Yes" : "No", color: chVerified ? "#15803D" : "#DC2626" },
          { label: "CIS Registered", value: supplier.cis_registered ? "Yes" : "No", color: supplier.cis_registered ? "#15803D" : "#DC2626" },
          { label: "Insurance Docs", value: `${insuranceDocs.length} uploaded`, color: insuranceDocs.length >= 2 ? "#15803D" : "#D97706" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
            <p className="text-lg font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold">Companies House Verification</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Search and link this supplier to their CH record</p>
          </div>
          {chData && (
            <button className="btn btn-secondary btn-sm" onClick={refreshCH} disabled={refreshing}>
              {refreshing ? <RefreshCw size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              Refresh
            </button>
          )}
        </div>

        {!chData && (
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                ref={inputRef}
                type="text"
                className="form-input pl-9"
                placeholder="Search by company name or number…"
                value={chSearch}
                onChange={(e) => setChSearch(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") searchCH(); }}
              />
            </div>
            <button className="btn btn-primary btn-sm" onClick={searchCH} disabled={searching || !chSearch.trim()}>
              {searching ? <RefreshCw size={13} className="animate-spin" /> : <Search size={13} />}
              Search
            </button>
          </div>
        )}

        {chResults.length > 0 && (
          <div className="flex flex-col gap-2 mb-4">
            {chResults.map((r) => (
              <div key={r.company_number} className="p-3 rounded-xl border border-gray-200 hover:border-[var(--primary)] transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-sm">{r.company_name}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{r.company_number} · {r.registered_office_address}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {chStatusBadge(r.company_status)}
                      {r.sic_codes.length > 0 && (
                        <span className="text-xs text-[var(--text-muted)]">SIC: {r.sic_codes.slice(0, 2).join(", ")}</span>
                      )}
                    </div>
                  </div>
                  <button className="btn btn-primary btn-sm flex-shrink-0" onClick={() => linkSupplier(r)}>
                    Link to Supplier
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {chData && (
          <div className="p-4 rounded-xl border border-gray-200 bg-[var(--bg-subtle)]">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-[var(--primary)]" />
                <div>
                  <p className="font-semibold text-sm">{chData.company_name}</p>
                  <p className="text-xs text-[var(--text-muted)] font-mono">{chData.company_number}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {chStatusBadge(chData.company_status)}
                <button
                  className="btn btn-ghost btn-sm btn-icon"
                  onClick={() => { setChData(null); setOfficers([]); }}
                >
                  <X size={13} />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[var(--text-muted)]">Registered Address</span>
                <p className="font-medium mt-0.5">{chData.registered_office_address}</p>
              </div>
              {chData.date_of_creation && (
                <div>
                  <span className="text-[var(--text-muted)]">Incorporated</span>
                  <p className="font-medium mt-0.5">{formatDate(chData.date_of_creation)}</p>
                </div>
              )}
              {chData.sic_codes.length > 0 && (
                <div className="sm:col-span-2">
                  <span className="text-[var(--text-muted)]">SIC Codes</span>
                  <p className="font-medium mt-0.5">{chData.sic_codes.join(", ")}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {chData && officers.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold mb-4">Current Directors &amp; Officers</h3>
          {loadingOfficers ? (
            <div className="flex justify-center py-4"><RefreshCw size={16} className="animate-spin text-[var(--text-muted)]" /></div>
          ) : (
            <div className="flex flex-col gap-3">
              {officers.map((o, i) => (
                <div key={i} className="flex items-start justify-between p-3 rounded-xl bg-[var(--bg-subtle)]">
                  <div>
                    <p className="font-medium text-sm">{o.name}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 capitalize">{o.officer_role.replace(/-/g, " ")}</p>
                    {o.address && <p className="text-xs text-[var(--text-muted)] mt-0.5">{o.address}</p>}
                  </div>
                  {o.appointed_on && (
                    <span className="text-xs text-[var(--text-muted)] flex-shrink-0">Since {formatDate(o.appointed_on)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold">Insurance Documents</h3>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">Public Liability, Employers Liability, Professional Indemnity</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => toast.info("Upload insurance document")}>
            <Upload size={13} />Upload
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {(["public_liability", "employers_liability", "professional_indemnity"] as const).map((type) => {
            const labels = {
              public_liability: "Public Liability",
              employers_liability: "Employers Liability",
              professional_indemnity: "Professional Indemnity",
            };
            const doc = insuranceDocs.find((d) => d.type === type);
            if (!doc) {
              return (
                <div key={type} className="p-4 rounded-xl border border-dashed border-gray-300">
                  <p className="text-sm font-medium text-[var(--text-muted)] mb-1">{labels[type]}</p>
                  <p className="text-xs text-[var(--text-muted)] mb-3">Not uploaded</p>
                  <button className="btn btn-secondary btn-sm w-full" onClick={() => toast.info(`Upload ${labels[type]}`)}>
                    <Upload size={11} />Upload
                  </button>
                </div>
              );
            }
            const status = insuranceStatus(doc.expiry_date);
            const days = daysUntil(doc.expiry_date);
            return (
              <div key={type} className={cn(
                "p-4 rounded-xl border",
                status === "Non-Compliant" ? "border-[#FCA5A5] bg-[#FFF5F5]" :
                status === "Expiring Soon" ? "border-[#FDE047] bg-[#FEFCE8]" :
                "border-gray-200"
              )}>
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-semibold">{doc.label}</p>
                  {complianceBadge(status)}
                </div>
                <div className="flex flex-col gap-1.5 text-xs text-[var(--text-muted)]">
                  <div className="flex justify-between"><span>Insurer</span><span className="font-medium text-[var(--text-primary)]">{doc.insurer}</span></div>
                  <div className="flex justify-between"><span>Cover</span><span className="font-medium text-[var(--text-primary)]">{formatCurrency(doc.amount)}</span></div>
                  <div className="flex justify-between">
                    <span>Expiry</span>
                    <span className={cn("font-medium", status === "Non-Compliant" ? "text-[#DC2626]" : status === "Expiring Soon" ? "text-[#D97706]" : "text-[var(--text-primary)]")}>
                      {formatDate(doc.expiry_date)}
                    </span>
                  </div>
                  {days > 0 && days <= 30 && (
                    <p className="mt-1 text-[#D97706] font-medium">{days} days remaining</p>
                  )}
                </div>
                <div className="flex gap-1 mt-3">
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => toast.info(`Download ${doc.file_name}`)}>
                    <Download size={11} />
                  </button>
                  <button className="btn btn-ghost btn-sm btn-icon" onClick={() => toast.info(`Replace ${doc.label}`)}>
                    <Upload size={11} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-4 rounded-xl bg-[var(--bg-subtle)]">
          <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-3">KYC Score Breakdown</p>
          <div className="flex items-center gap-6">
            <ScoreRing score={kycScore} />
            <div className="flex flex-col gap-2 text-sm flex-1">
              {[
                { label: "Companies House Verified", done: chVerified && chData?.company_status === "active", pts: 25 },
                { label: "Insurance Current", done: insuranceDocs.some(d => insuranceStatus(d.expiry_date) === "Compliant"), pts: 25 },
                { label: "CIS Registered", done: supplier.cis_registered, pts: 25 },
                { label: "References Added", done: insuranceDocs.length >= 2, pts: 25 },
              ].map(({ label, done, pts }) => (
                <div key={label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {done ? <CheckCircle size={13} className="text-[#15803D]" /> : <Clock size={13} className="text-gray-400" />}
                    <span className={cn("text-xs", done ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]")}>{label}</span>
                  </div>
                  <span className={cn("text-xs font-bold", done ? "text-[#15803D]" : "text-gray-400")}>{done ? `+${pts}` : `+0/${pts}`}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── CIS Tab ─────────────────────── */

function CISTab({ supplier, supplierId }: { supplier: Supplier; supplierId: string }) {
  const cisRecords = CIS_SEED[supplierId] ?? [];
  const primary = cisRecords[0] ?? null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">CIS Status</h2>
          <p className="text-sm text-[var(--text-muted)]">Construction Industry Scheme records for this supplier</p>
        </div>
        <Link href="/app/cis" className="btn btn-secondary btn-sm"><ExternalLink size={13} />CIS Dashboard</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "CIS Registered", value: supplier.cis_registered ? "Yes" : "No", color: supplier.cis_registered ? "#15803D" : "#DC2626" },
          { label: "CIS Number", value: supplier.cis_number || "—", color: "var(--text-primary)" },
          { label: "Deduction Rate", value: primary ? `${primary.deduction_rate}%` : "N/A", color: "var(--text-primary)" },
          { label: "Last Verified", value: primary ? formatDate(primary.last_verification_date) : "Never", color: "var(--text-primary)" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
            <p className="text-base font-bold" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {primary ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold mb-4">CIS Verification Details</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {[
              { label: "UTR", value: primary.utr },
              { label: "Status", value: <StatusBadge status={primary.status} /> },
              { label: "Deduction Rate", value: `${primary.deduction_rate}%` },
              { label: "Last Verified", value: formatDate(primary.last_verification_date) },
              { label: "Verified By", value: primary.verified_by },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-widest">{label}</dt>
                <dd className="font-medium">{value}</dd>
              </div>
            ))}
          </dl>
          <button className="btn btn-primary btn-sm mt-4" onClick={() => toast.info("Verify CIS status")}>
            <RefreshCw size={13} />Verify with HMRC
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <Shield size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="font-medium text-[var(--text-primary)]">No CIS record found</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">This supplier is not CIS registered or has not been verified.</p>
          <button className="btn btn-primary btn-sm mt-4" onClick={() => toast.info("Add CIS record")}>
            <Plus size={13} />Add CIS Record
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── Subcontracts Tab ─────────────────────── */

function SubcontractsTab({ supplier, supplierId }: { supplier: Supplier; supplierId: string }) {
  const [showWizard, setShowWizard] = useState(false);
  const orders = ORDERS_SEED[supplierId] ?? [];
  const totalValue = orders.reduce((s, o) => s + o.order_value, 0);
  const activeCount = orders.filter((o) => o.status === "Active").length;

  return (
    <div className="flex flex-col gap-5">
      {showWizard && (
        <SubcontractWizard
          onClose={() => setShowWizard(false)}
          initialSupplierId={supplierId}
          initialSupplierName={supplier.name}
        />
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Subcontract Orders</h2>
          <p className="text-sm text-[var(--text-muted)]">{orders.length} orders · Total value {formatCurrency(totalValue)}</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowWizard(true)}>
          <Plus size={14} />New Subcontract
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Orders", value: String(orders.length), color: "" },
          { label: "Active", value: String(activeCount), color: "#15803D" },
          { label: "Total Value", value: formatCurrency(totalValue), color: "" },
          { label: "Retention Held", value: formatCurrency(orders.reduce((s, o) => s + o.retention, 0)), color: "#D97706" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
            <p className="text-lg font-bold" style={{ color: color || "var(--text-primary)" }}>{value}</p>
          </div>
        ))}
      </div>

      {orders.length > 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {["Order No", "Project", "Contract Sum", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-semibold">{o.order_ref}</td>
                  <td className="px-4 py-3">{o.project}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(o.order_value)}</td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3">
                    <Link href={`/app/subcontracts/${o.id}`} className="btn btn-ghost btn-sm btn-icon"><ExternalLink size={13} /></Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
          <Package size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="font-medium">No subcontract orders yet</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Create the first order for this supplier.</p>
          <button className="btn btn-primary btn-sm mt-4" onClick={() => setShowWizard(true)}>
            <Plus size={13} />New Subcontract
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────── Tab type ─────────────────────── */

type TabId = "overview" | "compliance" | "kyc" | "subcontracts" | "cis" | "financial" | "projects" | "orders" | "applications" | "documents" | "contacts" | "tasks" | "activity" | "notes";

const BASE_TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "overview",     label: "Overview",      icon: <Building2 size={13} /> },
  { id: "compliance",   label: "Compliance",    icon: <Shield size={13} /> },
  { id: "kyc",          label: "KYC",           icon: <CheckCircle size={13} /> },
  { id: "subcontracts", label: "Subcontracts",  icon: <Package size={13} /> },
  { id: "cis",          label: "CIS",           icon: <Percent size={13} /> },
  { id: "financial",    label: "Financial",     icon: <Banknote size={13} /> },
  { id: "projects",     label: "Projects",      icon: <Layers size={13} /> },
  { id: "documents",    label: "Documents",     icon: <FileText size={13} /> },
  { id: "contacts",     label: "Contacts",      icon: <Users size={13} /> },
  { id: "tasks",        label: "Tasks",         icon: <CheckCircle size={13} /> },
  { id: "activity",     label: "Activity",      icon: <Activity size={13} /> },
  { id: "notes",        label: "Notes",         icon: <StickyNote size={13} /> },
];

/* ─────────────────────── Page ─────────────────────── */

export default function SupplierDetailPage() {
  const { supplierId } = useParams<{ supplierId: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [supplier, setSupplier] = useState<Supplier>(() => SUPPLIER_SEED[supplierId] ?? DEFAULT_SUPPLIER);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const contacts = CONTACTS_SEED[supplierId] ?? [];
  const compliance = COMPLIANCE_SEED[supplierId] ?? [];
  const projects = PROJECTS_SEED[supplierId] ?? [];
  const orders = ORDERS_SEED[supplierId] ?? [];
  const applications = APPLICATIONS_SEED[supplierId] ?? [];
  const documents = DOCUMENTS_SEED[supplierId] ?? [];
  const activity = ACTIVITY_SEED[supplierId] ?? [];
  const notes = NOTES_SEED[supplierId] ?? [];
  const tasks = TASKS_SEED[supplierId] ?? [];

  useEffect(() => {
    async function load() {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const { data } = await supabase.from("suppliers").select("*").eq("id", supplierId).single();
        if (data) setSupplier(data as Supplier);
      } catch {
        // use seed
      } finally {
        setLoading(false);
      }
    }
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [supplierId]);

  async function addNote() {
    if (!newNote.trim()) return;
    setSavingNote(true);
    await new Promise((r) => setTimeout(r, 400));
    setSavingNote(false);
    setNewNote("");
    toast.success("Note added");
  }

  const totalOrderValue = orders.reduce((s, o) => s + o.order_value, 0);
  const totalPaid = orders.reduce((s, o) => s + o.paid_to_date, 0);
  const totalCertified = orders.reduce((s, o) => s + o.certified_to_date, 0);
  const totalOutstanding = totalCertified - totalPaid;
  const totalProjectValue = projects.reduce((s, p) => s + p.contract_value, 0);
  const insuranceExpirySoon = supplier.insurance_expiry && new Date(supplier.insurance_expiry) < new Date(Date.now() + 90 * 24 * 3600 * 1000);

  if (loading) {
    return (
      <div className="flex flex-col min-h-full">
        <div className="page-header"><div className="h-6 w-48 bg-gray-100 rounded animate-pulse" /></div>
        <div className="page-content flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="page-header">
        <div className="flex items-center gap-3 min-w-0">
          <button className="btn btn-ghost btn-sm btn-icon flex-shrink-0" onClick={() => router.push("/app/suppliers")}>
            <ArrowLeft size={16} />
          </button>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-base font-bold flex-shrink-0"
            style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
            {getInitials(supplier.name)}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold text-[var(--text-primary)]">{supplier.name}</h1>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#EDE9FE] text-[#6D28D9]">{supplier.type}</span>
              {approvedBadge(supplier.approved_status)}
            </div>
            <p className="text-sm text-[var(--text-muted)]">{supplier.trade_category}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn btn-secondary btn-sm" onClick={() => toast.info("Log contact")}><MessageSquare size={14} />Log Contact</button>
          <button className="btn btn-secondary btn-sm" onClick={() => toast.info("Add to project")}><Layers size={14} />Add to Project</button>
          <button className="btn btn-secondary btn-sm" onClick={() => toast.success("Supplier approved")}><CheckCircle size={14} />Approve</button>
          <Link href={`/app/suppliers/${supplierId}/edit`} className="btn btn-primary btn-sm"><Edit size={14} />Edit</Link>
        </div>
      </div>

      <div className="px-6 py-3 flex items-center gap-6 flex-wrap border-b" style={{ borderColor: "var(--border-subtle)" }}>
        <div className="flex items-center gap-2 text-sm">
          <Hash size={13} className="text-[var(--text-muted)]" />
          <span className="text-[var(--text-muted)]">Trade:</span>
          <span className="font-medium">{supplier.trade_category}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CreditCard size={13} className="text-[var(--text-muted)]" />
          <span className="text-[var(--text-muted)]">Terms:</span>
          <span className="font-medium">{supplier.payment_terms}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Percent size={13} className="text-[var(--text-muted)]" />
          <span className="text-[var(--text-muted)]">CIS:</span>
          <span className={cn("font-medium", supplier.cis_registered ? "text-[#15803D]" : "text-gray-400")}>
            {supplier.cis_registered ? "Registered" : "Not Registered"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Calendar size={13} className={cn(insuranceExpirySoon ? "text-[#DC2626]" : "text-[var(--text-muted)]")} />
          <span className="text-[var(--text-muted)]">Insurance:</span>
          <span className={cn("font-medium", insuranceExpirySoon ? "text-[#DC2626]" : "")}>
            {formatDate(supplier.insurance_expiry)}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Star size={13} className="text-amber-400" />
          <StarRating value={supplier.rating} />
        </div>
        <div className="flex items-center gap-2 text-sm ml-auto">
          {complianceBadge(supplier.compliance_status)}
        </div>
      </div>

      <div className="tab-bar overflow-x-auto">
        {BASE_TABS.map((t) => (
          <button key={t.id}
            className={cn("tab-item flex items-center gap-1.5 whitespace-nowrap", activeTab === t.id && "active")}
            onClick={() => setActiveTab(t.id)}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <div className="page-content flex-1">

        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-5">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-sm font-semibold mb-4 text-[var(--text-primary)]">Primary Contact</h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {[
                    { label: "Contact Name", value: supplier.contact_name },
                    { label: "Direct Email", value: <a href={`mailto:${supplier.contact_email}`} className="text-[var(--primary)] hover:underline flex items-center gap-1"><Mail size={12} />{supplier.contact_email}</a> },
                    { label: "Phone", value: <a href={`tel:${supplier.contact_phone}`} className="flex items-center gap-1 hover:text-[var(--primary)]"><Phone size={12} />{supplier.contact_phone}</a> },
                    { label: "Company Email", value: <a href={`mailto:${supplier.email}`} className="text-[var(--primary)] hover:underline">{supplier.email}</a> },
                    { label: "Website", value: <a href={`https://${supplier.website}`} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline flex items-center gap-1"><Globe size={12} />{supplier.website}</a> },
                    { label: "Companies House", value: supplier.companies_house_no },
                    { label: "Address", value: <span className="flex items-start gap-1"><MapPin size={12} className="mt-0.5 flex-shrink-0" />{supplier.address}</span> },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <dt className="text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-widest">{label}</dt>
                      <dd className="font-medium text-[var(--text-primary)]">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-sm font-semibold mb-3">Internal Notes</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{supplier.notes || "No notes."}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {supplier.tags.map((tag) => (
                    <span key={tag} className="px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-sm font-semibold mb-4">Compliance Summary</h3>
                <div className="flex items-center gap-4 mb-5">
                  <ScoreRing score={supplier.compliance_score} />
                  <div>
                    <p className="text-xs text-[var(--text-muted)] mb-1">Compliance Score</p>
                    {complianceBadge(supplier.compliance_status)}
                    <p className="text-xs text-[var(--text-muted)] mt-2">Approved Status</p>
                    {approvedBadge(supplier.approved_status)}
                  </div>
                </div>
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-muted)]">Insurance Expiry</span>
                    <span className={cn("font-medium", insuranceExpirySoon ? "text-[#DC2626]" : "")}>{formatDate(supplier.insurance_expiry)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-muted)]">CIS Registered</span>
                    <span className={cn("font-medium", supplier.cis_registered ? "text-[#15803D]" : "text-gray-400")}>{supplier.cis_registered ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-muted)]">VAT Registered</span>
                    <span className={cn("font-medium", supplier.vat_registered ? "text-[#15803D]" : "text-gray-400")}>{supplier.vat_registered ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[var(--text-muted)]">Rating</span>
                    <StarRating value={supplier.rating} />
                  </div>
                </div>
                <button className="btn btn-secondary btn-sm w-full mt-4" onClick={() => setActiveTab("kyc")}>
                  View KYC <ChevronRight size={13} />
                </button>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">Quick Stats</h3>
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex justify-between"><span className="text-[var(--text-muted)]">Projects</span><span className="font-semibold">{projects.length}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-muted)]">Total Order Value</span><span className="font-semibold">{formatCurrency(totalOrderValue)}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-muted)]">Total Paid</span><span className="font-semibold">{formatCurrency(totalPaid)}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-muted)]">Outstanding</span><span className={cn("font-semibold", totalOutstanding > 0 ? "text-[#DC2626]" : "")}>{formatCurrency(totalOutstanding)}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "compliance" && (
          <div className="flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Compliance Tracker</h2>
                <p className="text-sm text-[var(--text-muted)] mt-0.5">All certification and insurance documents for this supplier</p>
              </div>
              <div className="flex gap-2">
                <button className="btn btn-secondary btn-sm" onClick={() => toast.info("Set expiry reminder")}><Bell size={14} />Set Reminder</button>
                <button className="btn btn-primary btn-sm" onClick={() => toast.info("Upload document")}><Upload size={14} />Upload Document</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {compliance.map((doc) => (
                <div key={doc.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-100">
                      <Shield size={16} className="text-gray-500" />
                    </div>
                    {complianceBadge(doc.status)}
                  </div>
                  <h4 className="text-sm font-semibold mb-2">{doc.type}</h4>
                  <div className="flex flex-col gap-1.5 text-xs text-[var(--text-muted)]">
                    {doc.amount && <div className="flex justify-between"><span>Amount</span><span className="font-medium text-[var(--text-primary)]">{doc.amount}</span></div>}
                    {doc.number && <div className="flex justify-between"><span>Number</span><span className="font-medium text-[var(--text-primary)]">{doc.number}</span></div>}
                    {doc.expiry !== "Ongoing" && doc.expiry !== "N/A" && (
                      <div className="flex justify-between">
                        <span>Expiry</span>
                        <span className={cn("font-medium", doc.status === "Expiring Soon" ? "text-[#D97706]" : doc.status === "Non-Compliant" ? "text-[#DC2626]" : "text-[var(--text-primary)]")}>
                          {formatDate(doc.expiry)}
                        </span>
                      </div>
                    )}
                    {doc.expiry === "Ongoing" && <div className="flex justify-between"><span>Expiry</span><span className="font-medium text-[#15803D]">Ongoing</span></div>}
                    {doc.verified_date && <div className="flex justify-between"><span>Verified</span><span className="font-medium text-[var(--text-primary)]">{formatDate(doc.verified_date)}</span></div>}
                    {doc.document && <div className="flex justify-between items-center mt-2">
                      <span className="flex items-center gap-1"><FileText size={11} />{doc.document}</span>
                      <button className="text-[var(--primary)] hover:underline text-xs" onClick={() => toast.info("Download " + doc.document)}><Download size={11} /></button>
                    </div>}
                    {!doc.document && <button className="btn btn-secondary btn-sm w-full mt-2 text-xs" onClick={() => toast.info("Upload " + doc.type)}><Upload size={11} />Upload Document</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "kyc" && (
          <FeatureGate flag="supply_chain_kyc">
            <KYCTab supplier={supplier} supplierId={supplierId} />
          </FeatureGate>
        )}

        {activeTab === "subcontracts" && (
          <FeatureGate flag="subcontract_orders">
            <SubcontractsTab supplier={supplier} supplierId={supplierId} />
          </FeatureGate>
        )}

        {activeTab === "cis" && (
          <CISTab supplier={supplier} supplierId={supplierId} />
        )}

        {activeTab === "financial" && (
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Order Value", value: formatCurrency(totalOrderValue), color: "" },
                { label: "Certified to Date", value: formatCurrency(totalCertified), color: "" },
                { label: "Paid to Date", value: formatCurrency(totalPaid), color: "text-[#15803D]" },
                { label: "Outstanding Balance", value: formatCurrency(totalOutstanding), color: totalOutstanding > 0 ? "text-[#DC2626]" : "text-[#15803D]" },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <p className="text-xs text-[var(--text-muted)] mb-1">{label}</p>
                  <p className={cn("text-xl font-bold", color)}>{value}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-sm font-semibold mb-4">Bank Details</h3>
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex justify-between"><span className="text-[var(--text-muted)]">Account Name</span><span className="font-medium">{supplier.bank_account_name}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-muted)]">Sort Code</span><span className="font-medium font-mono">{supplier.bank_sort_code}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-muted)]">Account Number</span><span className="font-medium font-mono">****{supplier.bank_account_number.slice(-4)}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-muted)]">Payment Terms</span><span className="font-medium">{supplier.payment_terms}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-muted)]">VAT Number</span><span className="font-medium">{supplier.vat_registered ? supplier.vat_number : "Not Registered"}</span></div>
                  <div className="flex justify-between"><span className="text-[var(--text-muted)]">CIS Number</span><span className="font-medium">{supplier.cis_registered ? supplier.cis_number : "Not Registered"}</span></div>
                </div>
              </div>
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="text-sm font-semibold mb-4">Monthly Spend (12 months)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={MONTHLY_SPEND} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `£${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => [formatCurrency(v), "Spend"]} />
                    <Bar dataKey="spend" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === "projects" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">{projects.length} Project{projects.length !== 1 ? "s" : ""}</h2>
                <p className="text-sm text-[var(--text-muted)]">Total value: {formatCurrency(totalProjectValue)}</p>
              </div>
              <button className="btn btn-primary btn-sm" onClick={() => toast.info("Link project")}><Plus size={14} />Link Project</button>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Project", "Role / Trade", "Contract Value", "Status", "Start", "End", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium">{p.project_name}</td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">{p.trade}</td>
                      <td className="px-4 py-3 font-semibold">{formatCurrency(p.contract_value)}</td>
                      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(p.start_date)}</td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(p.end_date)}</td>
                      <td className="px-4 py-3">
                        <Link href={`/app/projects/${p.id}`} className="btn btn-ghost btn-sm btn-icon"><ExternalLink size={13} /></Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">{documents.length} Document{documents.length !== 1 ? "s" : ""}</h2>
              <button className="btn btn-primary btn-sm" onClick={() => toast.info("Upload document")}><Upload size={14} />Upload</button>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Document Name", "Type", "Expiry", "Uploaded By", "Date", "Status", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {documents.map((d) => (
                    <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3"><div className="flex items-center gap-2"><FileText size={14} className="text-[var(--text-muted)]" /><span className="font-medium">{d.name}</span></div></td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">{d.doc_type}</span></td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">{d.expiry ? <span className={cn(d.status === "Expiring Soon" ? "text-[#D97706] font-medium" : "")}>{formatDate(d.expiry)}</span> : "—"}</td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">{d.uploaded_by}</td>
                      <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(d.uploaded_at)}</td>
                      <td className="px-4 py-3">{d.status ? <StatusBadge status={d.status} /> : "—"}</td>
                      <td className="px-4 py-3">
                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => toast.info("Download " + d.name)}><Download size={13} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "contacts" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">{contacts.length} Contact{contacts.length !== 1 ? "s" : ""}</h2>
              <button className="btn btn-primary btn-sm" onClick={() => toast.info("Add contact")}><Plus size={14} />Add Contact</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {contacts.map((c) => (
                <div key={c.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                      {getInitials(c.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm">{c.name}</p>
                        {c.primary && <span className="px-1.5 py-0.5 rounded-full bg-[#DBEAFE] text-[#1D4ED8] text-xs font-medium">Primary</span>}
                      </div>
                      <p className="text-xs text-[var(--text-muted)]">{c.role}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 text-xs text-[var(--text-muted)]">
                    <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 hover:text-[var(--primary)]"><Mail size={12} />{c.email}</a>
                    <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 hover:text-[var(--primary)]"><Phone size={12} />{c.phone}</a>
                    <div className="flex items-center gap-1.5"><Clock size={12} />Last contact: {formatRelative(c.last_contact)}</div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <a href={`mailto:${c.email}`} className="btn btn-secondary btn-sm flex-1 text-xs justify-center"><Mail size={11} />Email</a>
                    <button className="btn btn-secondary btn-sm flex-1 text-xs justify-center" onClick={() => toast.info("Log call")}><Phone size={11} />Log Call</button>
                    <Link href={`/app/contacts/${c.id}`} className="btn btn-ghost btn-sm btn-icon"><ExternalLink size={13} /></Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "tasks" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">{tasks.length} Task{tasks.length !== 1 ? "s" : ""}</h2>
              <button className="btn btn-primary btn-sm" onClick={() => toast.info("Add task")}><Plus size={14} />Add Task</button>
            </div>
            {(["To Do", "In Progress", "Done"] as const).map((group) => {
              const grouped = tasks.filter(t => t.status === group);
              if (grouped.length === 0) return null;
              return (
                <div key={group}>
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">{group} ({grouped.length})</h3>
                  <div className="flex flex-col gap-2">
                    {grouped.map((t) => (
                      <div key={t.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {priorityBadge(t.priority)}
                            <span className="font-medium text-sm">{t.title}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                            <span className="flex items-center gap-1"><Layers size={11} />{t.project}</span>
                            <span className="flex items-center gap-1"><Users size={11} />{t.assignee}</span>
                            <span className={cn("flex items-center gap-1", new Date(t.due_date) < new Date() && t.status !== "Done" ? "text-[#DC2626]" : "")}>
                              <Calendar size={11} />{formatDate(t.due_date)}
                            </span>
                          </div>
                        </div>
                        <Link href={`/app/tasks/${t.id}`} className="btn btn-ghost btn-sm btn-icon flex-shrink-0"><ExternalLink size={13} /></Link>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "activity" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Activity Timeline</h2>
              <button className="btn btn-primary btn-sm" onClick={() => toast.info("Add manual note")}><Plus size={14} />Add Note</button>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex flex-col gap-0">
                {activity.map((a, idx) => (
                  <div key={a.id} className={cn("flex items-start gap-3 py-4", idx < activity.length - 1 && "border-b border-gray-50")}>
                    {activityIcon(a.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{a.description}</p>
                      <div className="flex items-center gap-3 text-xs text-[var(--text-muted)] mt-0.5">
                        <span>{a.actor}</span>
                        <span>·</span>
                        <span>{formatRelative(a.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "notes" && (
          <div className="max-w-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">Internal Notes</h2>
              <p className="text-xs text-[var(--text-muted)]">Visible to workspace members only</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold mb-3">Add Note</h3>
              <textarea
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
                rows={4}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add an internal note about this supplier…"
              />
              <button
                className="btn btn-primary btn-sm mt-3"
                onClick={addNote}
                disabled={savingNote || !newNote.trim()}>
                {savingNote ? <RefreshCw size={13} className="animate-spin" /> : <Plus size={13} />}
                Add Note
              </button>
            </div>
            {notes.map((n) => (
              <div key={n.id} className={cn("bg-white rounded-2xl border shadow-sm p-5", n.pinned ? "border-[var(--primary)]" : "border-gray-200")}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: "var(--primary-light)", color: "var(--primary)" }}>
                      {getInitials(n.author)}
                    </div>
                    <div>
                      <p className="text-xs font-semibold">{n.author}</p>
                      <p className="text-xs text-[var(--text-muted)]">{formatRelative(n.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {n.pinned && <span className="px-1.5 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)] text-xs font-medium flex items-center gap-1"><PinIcon size={10} />Pinned</span>}
                    <button className="btn btn-ghost btn-sm btn-icon" onClick={() => toast.info("Pin/unpin note")}><MoreHorizontal size={14} /></button>
                  </div>
                </div>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-wrap">{n.text}</p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

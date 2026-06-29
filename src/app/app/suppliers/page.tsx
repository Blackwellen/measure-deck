"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Upload,
  Download,
  Filter,
  Search,
  MoreHorizontal,
  Users,
  Building2,
  Phone,
  Mail,
  FileText,
  RefreshCw,
  Send,
  ChevronDown,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Eye,
  Edit,
  Trash2,
  LayoutGrid,
  List,
  Star,
} from "lucide-react";
import { cn, formatDate, formatRelative, getInitials } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

type SupplierType =
  | "Labour Subcontractor"
  | "Plant Hire"
  | "Materials Supplier"
  | "Specialist Subcontractor"
  | "Professional Services"
  | "Consultant";

type ComplianceStatus = "Compliant" | "Expiring Soon" | "Non-Compliant" | "Pending";

interface Supplier {
  id: string;
  company_name: string;
  type: SupplierType;
  primary_contact: string;
  primary_email: string;
  phone: string;
  compliance_status: ComplianceStatus;
  compliance_score: number;
  projects_count: number;
  added_at: string;
  location: string;
  rating: number;
}

interface Contact {
  id: string;
  name: string;
  role: string;
  company: string;
  supplier_id: string;
  email: string;
  phone: string;
  last_contact: string;
}

/* ------------------------------------------------------------------ */
/*  Seed data                                                           */
/* ------------------------------------------------------------------ */

const SEED_SUPPLIERS: Supplier[] = [
  {
    id: "sup-001",
    company_name: "Apex Groundworks Ltd",
    type: "Labour Subcontractor",
    primary_contact: "Mark Hughes",
    primary_email: "mark.hughes@apexgw.co.uk",
    phone: "01234 567890",
    compliance_status: "Compliant",
    compliance_score: 95,
    projects_count: 4,
    added_at: "2024-03-15",
    location: "Birmingham, UK",
    rating: 4,
  },
  {
    id: "sup-002",
    company_name: "BrightBuild Materials",
    type: "Materials Supplier",
    primary_contact: "Sarah Chen",
    primary_email: "s.chen@brightbuild.co.uk",
    phone: "0161 234 5678",
    compliance_status: "Compliant",
    compliance_score: 88,
    projects_count: 7,
    added_at: "2024-01-20",
    location: "Manchester, UK",
    rating: 5,
  },
  {
    id: "sup-003",
    company_name: "CraneKing Plant Hire",
    type: "Plant Hire",
    primary_contact: "Dave Okafor",
    primary_email: "d.okafor@cranekingph.co.uk",
    phone: "0121 345 6789",
    compliance_status: "Expiring Soon",
    compliance_score: 72,
    projects_count: 3,
    added_at: "2024-05-10",
    location: "Coventry, UK",
    rating: 3,
  },
  {
    id: "sup-004",
    company_name: "Delta Electrical Specialists",
    type: "Specialist Subcontractor",
    primary_contact: "Priya Patel",
    primary_email: "priya@deltaelec.co.uk",
    phone: "020 7123 4567",
    compliance_status: "Non-Compliant",
    compliance_score: 45,
    projects_count: 2,
    added_at: "2023-11-08",
    location: "London, UK",
    rating: 2,
  },
  {
    id: "sup-005",
    company_name: "Exton Consulting Engineers",
    type: "Consultant",
    primary_contact: "James Whitfield",
    primary_email: "j.whitfield@extonconsult.co.uk",
    phone: "01865 234567",
    compliance_status: "Compliant",
    compliance_score: 98,
    projects_count: 6,
    added_at: "2023-09-01",
    location: "Oxford, UK",
    rating: 5,
  },
  {
    id: "sup-006",
    company_name: "Foresight Safety Services",
    type: "Professional Services",
    primary_contact: "Claire Morton",
    primary_email: "claire@foresightsafety.co.uk",
    phone: "0113 456 7890",
    compliance_status: "Pending",
    compliance_score: 60,
    projects_count: 1,
    added_at: "2025-01-05",
    location: "Leeds, UK",
    rating: 3,
  },
  {
    id: "sup-007",
    company_name: "Grove Structural Steel",
    type: "Specialist Subcontractor",
    primary_contact: "Tom Griffiths",
    primary_email: "t.griffiths@grovestructural.co.uk",
    phone: "01223 567890",
    compliance_status: "Compliant",
    compliance_score: 91,
    projects_count: 5,
    added_at: "2024-02-14",
    location: "Cambridge, UK",
    rating: 4,
  },
  {
    id: "sup-008",
    company_name: "Henley Aggregates",
    type: "Materials Supplier",
    primary_contact: "Angela Brooks",
    primary_email: "angela@henleyagg.co.uk",
    phone: "01491 678901",
    compliance_status: "Expiring Soon",
    compliance_score: 68,
    projects_count: 8,
    added_at: "2023-07-22",
    location: "Reading, UK",
    rating: 4,
  },
];

const SEED_CONTACTS: Contact[] = [
  { id: "con-001", name: "Mark Hughes", role: "Director", company: "Apex Groundworks Ltd", supplier_id: "sup-001", email: "mark.hughes@apexgw.co.uk", phone: "01234 567890", last_contact: "2025-06-05" },
  { id: "con-002", name: "Lisa Hughes", role: "Estimator", company: "Apex Groundworks Ltd", supplier_id: "sup-001", email: "l.hughes@apexgw.co.uk", phone: "01234 567891", last_contact: "2025-05-28" },
  { id: "con-003", name: "Sarah Chen", role: "Account Manager", company: "BrightBuild Materials", supplier_id: "sup-002", email: "s.chen@brightbuild.co.uk", phone: "0161 234 5678", last_contact: "2025-06-08" },
  { id: "con-004", name: "Dave Okafor", role: "Operations Manager", company: "CraneKing Plant Hire", supplier_id: "sup-003", email: "d.okafor@cranekingph.co.uk", phone: "0121 345 6789", last_contact: "2025-05-15" },
  { id: "con-005", name: "Priya Patel", role: "Contracts Manager", company: "Delta Electrical Specialists", supplier_id: "sup-004", email: "priya@deltaelec.co.uk", phone: "020 7123 4567", last_contact: "2025-04-20" },
  { id: "con-006", name: "James Whitfield", role: "Senior Consultant", company: "Exton Consulting Engineers", supplier_id: "sup-005", email: "j.whitfield@extonconsult.co.uk", phone: "01865 234567", last_contact: "2025-06-09" },
  { id: "con-007", name: "Claire Morton", role: "Director", company: "Foresight Safety Services", supplier_id: "sup-006", email: "claire@foresightsafety.co.uk", phone: "0113 456 7890", last_contact: "2025-06-01" },
  { id: "con-008", name: "Tom Griffiths", role: "Technical Director", company: "Grove Structural Steel", supplier_id: "sup-007", email: "t.griffiths@grovestructural.co.uk", phone: "01223 567890", last_contact: "2025-05-22" },
  { id: "con-009", name: "Angela Brooks", role: "Sales Director", company: "Henley Aggregates", supplier_id: "sup-008", email: "angela@henleyagg.co.uk", phone: "01491 678901", last_contact: "2025-06-03" },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */

function complianceChip(status: ComplianceStatus) {
  const map: Record<ComplianceStatus, { cls: string; icon: React.ReactNode }> = {
    "Compliant":      { cls: "chip-success", icon: <CheckCircle size={11} /> },
    "Expiring Soon":  { cls: "chip-warning", icon: <AlertTriangle size={11} /> },
    "Non-Compliant":  { cls: "chip-danger",  icon: <XCircle size={11} /> },
    "Pending":        { cls: "chip-muted",   icon: <Clock size={11} /> },
  };
  const { cls, icon } = map[status];
  return (
    <span className={cn("badge", cls, "gap-1")}>
      {icon}
      {status}
    </span>
  );
}

function typeChip(type: SupplierType) {
  return (
    <span className="badge chip-primary text-[11px]">{type}</span>
  );
}

function StarRating({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={12}
          className={i <= value ? "fill-[var(--warning)] text-[var(--warning)]" : "text-[var(--border-strong)]"}
        />
      ))}
    </div>
  );
}

type ViewTab = "directory" | "cards" | "contacts" | "compliance" | "project-links";

/* ------------------------------------------------------------------ */
/*  Main page                                                           */
/* ------------------------------------------------------------------ */

export default function SuppliersPage() {
  const [view, setView] = useState<ViewTab>("directory");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<SupplierType | "All">("All");
  const [statusFilter, setStatusFilter] = useState<ComplianceStatus | "All">("All");

  const filtered = useMemo(() => {
    return SEED_SUPPLIERS.filter((s) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        s.company_name.toLowerCase().includes(q) ||
        s.primary_contact.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q);
      const matchType = typeFilter === "All" || s.type === typeFilter;
      const matchStatus = statusFilter === "All" || s.compliance_status === statusFilter;
      return matchSearch && matchType && matchStatus;
    });
  }, [search, typeFilter, statusFilter]);

  const filteredContacts = useMemo(() => {
    const q = search.toLowerCase();
    return SEED_CONTACTS.filter(
      (c) =>
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [search]);

  const tabs: { id: ViewTab; label: string }[] = [
    { id: "directory", label: "Supplier Directory" },
    { id: "cards", label: "Cards" },
    { id: "contacts", label: "Contacts" },
    { id: "compliance", label: "Compliance" },
    { id: "project-links", label: "Project Links" },
  ];

  const supplierTypes: SupplierType[] = [
    "Labour Subcontractor",
    "Plant Hire",
    "Materials Supplier",
    "Specialist Subcontractor",
    "Professional Services",
    "Consultant",
  ];

  const complianceStatuses: ComplianceStatus[] = ["Compliant", "Expiring Soon", "Non-Compliant", "Pending"];

  /* KPI counts */
  const totalSuppliers = SEED_SUPPLIERS.length;
  const compliantCount = SEED_SUPPLIERS.filter((s) => s.compliance_status === "Compliant").length;
  const expiringSoonCount = SEED_SUPPLIERS.filter((s) => s.compliance_status === "Expiring Soon").length;
  const nonCompliantCount = SEED_SUPPLIERS.filter((s) => s.compliance_status === "Non-Compliant").length;

  return (
    <div className="flex flex-col min-h-full">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="text-xl font-semibold text-[var(--text-primary)]">Suppliers &amp; Contacts</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Internal supplier directory, contacts, and compliance tracking
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn btn-secondary btn-sm">
            <Download size={14} />
            Export
          </button>
          <button className="btn btn-secondary btn-sm">
            <Upload size={14} />
            Import
          </button>
          <button className="btn btn-secondary btn-sm">
            <Send size={14} />
            Request Quote
          </button>
          <Link href="/app/contacts/new" className="btn btn-secondary btn-sm">
            <Plus size={14} />
            New Contact
          </Link>
          <Link href="/app/suppliers/new" className="btn btn-primary btn-sm">
            <Plus size={14} />
            New Supplier
          </Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="px-6 pt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="kpi-card">
          <div className="kpi-label">Total Suppliers</div>
          <div className="kpi-value">{totalSuppliers}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Compliant</div>
          <div className="kpi-value" style={{ color: "var(--success)" }}>{compliantCount}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Expiring Soon</div>
          <div className="kpi-value" style={{ color: "var(--warning)" }}>{expiringSoonCount}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Non-Compliant</div>
          <div className="kpi-value" style={{ color: "var(--danger)" }}>{nonCompliantCount}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar mt-4">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={cn("tab-item", view === t.id && "active")}
            onClick={() => setView(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="px-6 py-3 flex items-center gap-2 flex-wrap border-b" style={{ borderColor: "var(--border)" }}>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="search"
            placeholder={view === "contacts" ? "Search contacts…" : "Search suppliers…"}
            className="form-input pl-9 h-8 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {view !== "contacts" && (
          <>
            <select
              className="form-input h-8 text-sm w-auto pr-8"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as SupplierType | "All")}
            >
              <option value="All">All Types</option>
              {supplierTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              className="form-input h-8 text-sm w-auto pr-8"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ComplianceStatus | "All")}
            >
              <option value="All">All Statuses</option>
              {complianceStatuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </>
        )}

        <button className="btn btn-secondary btn-sm ml-auto">
          <Filter size={14} />
          Filter
        </button>

        {view === "compliance" && (
          <button className="btn btn-secondary btn-sm">
            <FileText size={14} />
            Add Compliance Doc
          </button>
        )}
      </div>

      {/* View content */}
      <div className="page-content flex-1">
        {(view === "directory" || view === "compliance") && (
          <DirectoryTable
            suppliers={filtered}
            view={view}
          />
        )}
        {view === "cards" && <CardsView suppliers={filtered} />}
        {view === "contacts" && <ContactsView contacts={filteredContacts} />}
        {view === "project-links" && <ProjectLinksView suppliers={SEED_SUPPLIERS} />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Directory Table view                                                */
/* ------------------------------------------------------------------ */

function DirectoryTable({ suppliers, view }: { suppliers: Supplier[]; view: string }) {
  if (suppliers.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><Users size={22} /></div>
        <p className="font-semibold text-[var(--text-primary)]">No suppliers found</p>
        <p className="text-sm text-[var(--text-muted)]">Try adjusting your search or filters.</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Type</th>
              <th>Primary Contact</th>
              <th>Phone</th>
              <th>Compliance Status</th>
              {view === "compliance" && <th>Score</th>}
              <th>Projects</th>
              <th>Added</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {suppliers.map((s) => (
              <tr key={s.id}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "var(--primary-light)", color: "var(--primary)" }}
                    >
                      {getInitials(s.company_name)}
                    </div>
                    <div>
                      <Link
                        href={`/app/suppliers/${s.id}`}
                        className="font-medium text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors"
                      >
                        {s.company_name}
                      </Link>
                      <div className="text-xs text-[var(--text-muted)]">{s.location}</div>
                    </div>
                  </div>
                </td>
                <td>{typeChip(s.type)}</td>
                <td>
                  <div className="text-sm font-medium">{s.primary_contact}</div>
                  <div className="text-xs text-[var(--text-muted)]">{s.primary_email}</div>
                </td>
                <td className="text-[var(--text-secondary)] text-sm">{s.phone}</td>
                <td>{complianceChip(s.compliance_status)}</td>
                {view === "compliance" && (
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 rounded-full bg-[var(--bg-muted)] overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${s.compliance_score}%`,
                            background: s.compliance_score >= 80 ? "var(--success)" : s.compliance_score >= 60 ? "var(--warning)" : "var(--danger)",
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium">{s.compliance_score}%</span>
                    </div>
                  </td>
                )}
                <td>
                  <span className="font-medium">{s.projects_count}</span>
                </td>
                <td className="text-[var(--text-muted)] text-sm">{formatDate(s.added_at)}</td>
                <td>
                  <div className="flex items-center gap-1">
                    <Link href={`/app/suppliers/${s.id}`} className="btn btn-ghost btn-sm btn-icon">
                      <Eye size={14} />
                    </Link>
                    <button className="btn btn-ghost btn-sm btn-icon">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Cards view                                                          */
/* ------------------------------------------------------------------ */

function CardsView({ suppliers }: { suppliers: Supplier[] }) {
  if (suppliers.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><Building2 size={22} /></div>
        <p className="font-semibold">No suppliers found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {suppliers.map((s) => (
        <Link key={s.id} href={`/app/suppliers/${s.id}`} className="card p-4 hover:shadow-md transition-shadow block">
          <div className="flex items-start justify-between mb-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{ background: "var(--primary-light)", color: "var(--primary)" }}
            >
              {getInitials(s.company_name)}
            </div>
            {complianceChip(s.compliance_status)}
          </div>
          <h3 className="font-semibold text-sm text-[var(--text-primary)] mb-0.5">{s.company_name}</h3>
          <p className="text-xs text-[var(--text-muted)] mb-2">{s.type}</p>
          <div className="space-y-1 text-xs text-[var(--text-secondary)]">
            <div className="flex items-center gap-1.5">
              <Users size={11} />
              {s.primary_contact}
            </div>
            <div className="flex items-center gap-1.5">
              <Phone size={11} />
              {s.phone}
            </div>
          </div>
          <div className="mt-3 pt-3 border-t flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <StarRating value={s.rating} />
            <span className="text-xs text-[var(--text-muted)]">{s.projects_count} projects</span>
          </div>
        </Link>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Contacts view                                                       */
/* ------------------------------------------------------------------ */

function ContactsView({ contacts }: { contacts: Contact[] }) {
  if (contacts.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><Users size={22} /></div>
        <p className="font-semibold">No contacts found</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Role</th>
              <th>Company</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Last Contact</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id}>
                <td>
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: "var(--primary-light)", color: "var(--primary)" }}
                    >
                      {getInitials(c.name)}
                    </div>
                    <Link
                      href={`/app/contacts/${c.id}`}
                      className="font-medium hover:text-[var(--primary)] transition-colors"
                    >
                      {c.name}
                    </Link>
                  </div>
                </td>
                <td className="text-sm text-[var(--text-secondary)]">{c.role}</td>
                <td>
                  <Link
                    href={`/app/suppliers/${c.supplier_id}`}
                    className="text-sm text-[var(--primary)] hover:underline"
                  >
                    {c.company}
                  </Link>
                </td>
                <td>
                  <a href={`mailto:${c.email}`} className="text-sm text-[var(--primary)] hover:underline flex items-center gap-1">
                    <Mail size={12} />
                    {c.email}
                  </a>
                </td>
                <td className="text-sm text-[var(--text-secondary)]">
                  <a href={`tel:${c.phone}`} className="flex items-center gap-1 hover:text-[var(--primary)]">
                    <Phone size={12} />
                    {c.phone}
                  </a>
                </td>
                <td className="text-sm text-[var(--text-muted)]">{formatRelative(c.last_contact)}</td>
                <td>
                  <div className="flex items-center gap-1">
                    <Link href={`/app/contacts/${c.id}`} className="btn btn-ghost btn-sm btn-icon">
                      <Eye size={14} />
                    </Link>
                    <button className="btn btn-ghost btn-sm btn-icon">
                      <MoreHorizontal size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Project Links view                                                  */
/* ------------------------------------------------------------------ */

const PROJECT_LINK_SEED = [
  { supplier_id: "sup-001", supplier: "Apex Groundworks Ltd", project: "City Centre Retail Fit-Out", project_id: "p-001", spend: 145000, status: "Active" },
  { supplier_id: "sup-002", supplier: "BrightBuild Materials", project: "City Centre Retail Fit-Out", project_id: "p-001", spend: 89500, status: "Active" },
  { supplier_id: "sup-002", supplier: "BrightBuild Materials", project: "Office Block Phase 2", project_id: "p-002", spend: 234000, status: "Completed" },
  { supplier_id: "sup-005", supplier: "Exton Consulting Engineers", project: "Waterfront Apartments", project_id: "p-003", spend: 52000, status: "Active" },
  { supplier_id: "sup-007", supplier: "Grove Structural Steel", project: "Office Block Phase 2", project_id: "p-002", spend: 310000, status: "Completed" },
  { supplier_id: "sup-008", supplier: "Henley Aggregates", project: "Motorway Service Station", project_id: "p-004", spend: 67800, status: "Active" },
];

function ProjectLinksView({ suppliers }: { suppliers: Supplier[] }) {
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Supplier</th>
              <th>Type</th>
              <th>Project</th>
              <th>Spend to Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {PROJECT_LINK_SEED.map((pl, i) => {
              const sup = suppliers.find((s) => s.id === pl.supplier_id);
              return (
                <tr key={i}>
                  <td>
                    <Link href={`/app/suppliers/${pl.supplier_id}`} className="font-medium hover:text-[var(--primary)] transition-colors">
                      {pl.supplier}
                    </Link>
                  </td>
                  <td>{sup && typeChip(sup.type)}</td>
                  <td>
                    <Link href={`/app/projects/${pl.project_id}`} className="text-[var(--primary)] hover:underline text-sm">
                      {pl.project}
                    </Link>
                  </td>
                  <td className="font-medium">
                    £{pl.spend.toLocaleString("en-GB")}
                  </td>
                  <td>
                    <span className={cn("badge", pl.status === "Active" ? "chip-success" : "chip-muted")}>
                      {pl.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

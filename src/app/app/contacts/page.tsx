"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Plus, Upload, Download, Search, Filter, Mail, Phone,
  User, Building2, MoreHorizontal, Eye,
} from "lucide-react";
import { cn, formatDate, formatRelative, getInitials } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

/* ─────────────────────────── Types ─────────────────────────── */

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

/* ─────────────────────────── Seed ──────────────────────────── */

const SEED_CONTACTS: Contact[] = [
  { id: "con-001", name: "Mark Hughes", role: "Director", company: "Apex Groundworks Ltd", supplier_id: "sup-001", email: "mark.hughes@apexgw.co.uk", phone: "01234 567890", last_contact: "2026-06-05" },
  { id: "con-002", name: "Lisa Hughes", role: "Estimator", company: "Apex Groundworks Ltd", supplier_id: "sup-001", email: "l.hughes@apexgw.co.uk", phone: "01234 567891", last_contact: "2026-05-28" },
  { id: "con-003", name: "Sarah Chen", role: "Account Manager", company: "BrightBuild Materials", supplier_id: "sup-002", email: "s.chen@brightbuild.co.uk", phone: "0161 234 5678", last_contact: "2026-06-08" },
  { id: "con-004", name: "Dave Okafor", role: "Operations Manager", company: "CraneKing Plant Hire", supplier_id: "sup-003", email: "d.okafor@cranekingph.co.uk", phone: "0121 345 6789", last_contact: "2026-05-15" },
  { id: "con-005", name: "Priya Patel", role: "Contracts Manager", company: "Delta Electrical Specialists", supplier_id: "sup-004", email: "priya@deltaelec.co.uk", phone: "020 7123 4567", last_contact: "2026-04-20" },
  { id: "con-006", name: "James Whitfield", role: "Senior Consultant", company: "Exton Consulting Engineers", supplier_id: "sup-005", email: "j.whitfield@extonconsult.co.uk", phone: "01865 234567", last_contact: "2026-06-09" },
  { id: "con-007", name: "Claire Morton", role: "Director", company: "Foresight Safety Services", supplier_id: "sup-006", email: "claire@foresightsafety.co.uk", phone: "0113 456 7890", last_contact: "2026-06-01" },
  { id: "con-008", name: "Tom Griffiths", role: "Technical Director", company: "Grove Structural Steel", supplier_id: "sup-007", email: "t.griffiths@grovestructural.co.uk", phone: "01223 567890", last_contact: "2026-05-22" },
  { id: "con-009", name: "Angela Brooks", role: "Sales Director", company: "Henley Aggregates", supplier_id: "sup-008", email: "angela@henleyagg.co.uk", phone: "01491 678901", last_contact: "2026-06-03" },
  { id: "con-010", name: "Nathan Price", role: "Quantity Surveyor", company: "Apex Groundworks Ltd", supplier_id: "sup-001", email: "n.price@apexgw.co.uk", phone: "01234 567892", last_contact: "2026-05-10" },
  { id: "con-011", name: "Rachel Kim", role: "Site Manager", company: "Grove Structural Steel", supplier_id: "sup-007", email: "r.kim@grovestructural.co.uk", phone: "01223 567891", last_contact: "2026-06-07" },
  { id: "con-012", name: "Oliver Swan", role: "Commercial Director", company: "BrightBuild Materials", supplier_id: "sup-002", email: "o.swan@brightbuild.co.uk", phone: "0161 234 5679", last_contact: "2026-05-19" },
];

/* ─────────────────────────── Page ──────────────────────────── */

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>(SEED_CONTACTS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [companyFilter, setCompanyFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();
        const { data } = await supabase.from("contacts").select("*").order("name");
        if (data && data.length > 0) setContacts(data as Contact[]);
      } catch {
        // use seed
      } finally {
        setLoading(false);
      }
    }
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, []);

  const companies = useMemo(() => ["All", ...Array.from(new Set(contacts.map((c) => c.company))).sort()], [contacts]);
  const roles = useMemo(() => ["All", ...Array.from(new Set(contacts.map((c) => c.role))).sort()], [contacts]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return contacts.filter((c) => {
      const matchSearch = !q || c.name.toLowerCase().includes(q) || c.company.toLowerCase().includes(q) || c.role.toLowerCase().includes(q) || c.email.toLowerCase().includes(q);
      const matchCompany = companyFilter === "All" || c.company === companyFilter;
      const matchRole = roleFilter === "All" || c.role === roleFilter;
      return matchSearch && matchCompany && matchRole;
    });
  }, [contacts, search, companyFilter, roleFilter]);

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="text-xl font-semibold">Contacts</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            {contacts.length} contacts across {new Set(contacts.map((c) => c.company)).size} companies
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="btn btn-secondary btn-sm"><Download size={14} />Export</button>
          <button className="btn btn-secondary btn-sm"><Upload size={14} />Import</button>
          <Link href="/app/contacts/new" className="btn btn-primary btn-sm"><Plus size={14} />New Contact</Link>
        </div>
      </div>

      {/* KPI strip */}
      <div className="px-6 pt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="kpi-card">
          <div className="kpi-label">Total Contacts</div>
          <div className="kpi-value">{contacts.length}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Companies</div>
          <div className="kpi-value">{new Set(contacts.map((c) => c.company)).size}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Contacted This Week</div>
          <div className="kpi-value" style={{ color: "var(--success)" }}>
            {contacts.filter((c) => {
              const d = new Date(c.last_contact);
              const now = new Date("2026-06-10");
              return (now.getTime() - d.getTime()) < 7 * 86400000;
            }).length}
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Roles</div>
          <div className="kpi-value">{new Set(contacts.map((c) => c.role)).size}</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-3 mt-4 border-b flex items-center gap-2 flex-wrap" style={{ borderColor: "var(--border)" }}>
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="search"
            placeholder="Search contacts…"
            className="form-input pl-9 h-8 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="form-input h-8 text-sm w-auto pr-8"
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
        >
          {companies.map((c) => <option key={c} value={c}>{c === "All" ? "All Companies" : c}</option>)}
        </select>
        <select
          className="form-input h-8 text-sm w-auto pr-8"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          {roles.map((r) => <option key={r} value={r}>{r === "All" ? "All Roles" : r}</option>)}
        </select>
        <button className="btn btn-secondary btn-sm ml-auto"><Filter size={14} />Filter</button>
      </div>

      <div className="page-content flex-1">
        {loading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-14 rounded-xl" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><User size={22} /></div>
            <p className="font-semibold">No contacts found</p>
            <p className="text-sm text-[var(--text-muted)]">Try adjusting your search or filters.</p>
            <Link href="/app/contacts/new" className="btn btn-primary btn-sm"><Plus size={14} />New Contact</Link>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Role</th>
                    <th>Company / Supplier</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Last Contact</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((contact) => (
                    <tr key={contact.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                            style={{ background: "var(--primary-light)", color: "var(--primary)" }}
                          >
                            {getInitials(contact.name)}
                          </div>
                          <Link
                            href={`/app/contacts/${contact.id}`}
                            className="font-medium hover:text-[var(--primary)] transition-colors"
                          >
                            {contact.name}
                          </Link>
                        </div>
                      </td>
                      <td className="text-sm text-[var(--text-secondary)]">{contact.role}</td>
                      <td>
                        <Link
                          href={`/app/suppliers/${contact.supplier_id}`}
                          className="flex items-center gap-1.5 text-sm text-[var(--primary)] hover:underline"
                        >
                          <Building2 size={12} />
                          {contact.company}
                        </Link>
                      </td>
                      <td>
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-sm text-[var(--primary)] hover:underline flex items-center gap-1.5"
                        >
                          <Mail size={12} />
                          {contact.email}
                        </a>
                      </td>
                      <td>
                        <a
                          href={`tel:${contact.phone}`}
                          className="text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] flex items-center gap-1.5"
                        >
                          <Phone size={12} />
                          {contact.phone}
                        </a>
                      </td>
                      <td className="text-sm text-[var(--text-muted)]">{formatRelative(contact.last_contact)}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Link href={`/app/contacts/${contact.id}`} className="btn btn-ghost btn-sm btn-icon">
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
            <div className="px-4 py-2.5 border-t text-xs text-[var(--text-muted)]" style={{ borderColor: "var(--border)" }}>
              Showing {filtered.length} of {contacts.length} contacts
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

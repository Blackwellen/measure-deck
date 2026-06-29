"use client";

import { useState } from "react";
import { Pencil, Plus, Upload, Download, Check, X, MoreHorizontal, CheckCircle2 } from "lucide-react";

const CONTRACT_DOCS = [
  { name: "JCT Design & Build 2016 - Executed Copy", type: "Contract", version: "v1.0", status: "Current", date: "01 Mar 2024", uploadedBy: "James Walker" },
  { name: "Amendment No. 1 - Extension of Time", type: "Amendment", version: "v1.0", status: "Current", date: "12 Sep 2025", uploadedBy: "Rachel Okafor" },
  { name: "Amendment No. 2 - Value Adjustment", type: "Amendment", version: "v1.0", status: "Current", date: "05 Feb 2026", uploadedBy: "David Miller" },
  { name: "Collateral Warranty - Riverside Living Ltd", type: "Collateral", version: "v1.0", status: "Current", date: "01 Mar 2024", uploadedBy: "Sophie Morgan" },
  { name: "Parent Company Guarantee - Thornfield Ltd", type: "Collateral", version: "v1.0", status: "Current", date: "01 Mar 2024", uploadedBy: "Michael Green" },
  { name: "Insurance Certificate - Professional Indemnity", type: "Insurance", version: "v1.0", status: "Current", date: "01 Mar 2024", uploadedBy: "Neha Sharma" },
];

type TypeChip = { cls: string; style?: React.CSSProperties };
const TYPE_CHIP: Record<string, TypeChip> = {
  Contract:   { cls: "badge chip-info" },
  Amendment:  { cls: "badge chip-warning" },
  Collateral: { cls: "badge", style: { background: "#ede9fe", color: "#8B5CF6" } },
  Insurance:  { cls: "badge chip-muted" },
};

const CONTRACT_FIELDS = [
  { label: "Contract Type",            value: "JCT Design & Build 2016" },
  { label: "Contract Value",           value: "2,950,000" },
  { label: "Retention %",              value: "3%" },
  { label: "Retention Amount",         value: "88,500" },
  { label: "Payment Terms",            value: "21 days" },
  { label: "Notice Period",            value: "7 days" },
  { label: "Defects Period",           value: "12 months" },
  { label: "Defects Retention %",      value: "2%" },
  { label: "Defects Retention Amount", value: "59,000" },
];

const KEY_DATES = [
  { label: "Contract Start",       value: "01 Jul 2025" },
  { label: "Planned Completion",   value: "30 Jun 2027" },
  { label: "Practical Completion", value: "TBC" },
  { label: "Defects Period End",   value: "TBC" },
  { label: "Final Account Target", value: "Dec 2026" },
];

const PARTIES = [
  { role: "Employer",                name: "Riverside Living Ltd",     address: "1 Riverside Way, London, SE1 2AA" },
  { role: "Contract Administrator",  name: "BuildRight Management",    address: "2 Tower Bridge Road, London, SE1 2UP" },
  { role: "Main Contractor",         name: "Thornfield Commercial Hub", address: "10 Meridian Court, Park Phase 2, Dartford, DA1 1UP" },
];

export default function ContractPage() {
  const [editingContract, setEditingContract] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Contract Details</h3>
            {editingContract ? (
              <div className="flex gap-1">
                <button className="btn btn-primary btn-sm text-xs" onClick={() => setEditingContract(false)}>
                  <Check size={12} />Save
                </button>
                <button className="btn btn-secondary btn-sm text-xs" onClick={() => setEditingContract(false)}>
                  <X size={12} />Cancel
                </button>
              </div>
            ) : (
              <button className="btn btn-secondary btn-sm text-xs" onClick={() => setEditingContract(true)}>
                <Pencil size={12} />Edit
              </button>
            )}
          </div>
          <div className="flex flex-col">
            {CONTRACT_FIELDS.map((f) => (
              <div key={f.label} className="flex justify-between items-center py-2 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{f.label}</span>
                {editingContract ? (
                  <input className="form-input h-6 text-xs px-2 w-28 text-right" defaultValue={f.value} />
                ) : (
                  <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{f.value}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5 flex flex-col gap-4">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Parties</h3>
          <div className="flex flex-col gap-4 flex-1">
            {PARTIES.map((p) => (
              <div key={p.role} className="flex flex-col gap-0.5">
                <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{p.role}</span>
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{p.name}</span>
                <span className="text-xs" style={{ color: "var(--text-secondary)" }}>{p.address}</span>
              </div>
            ))}
          </div>
          <p className="text-[11px] pt-2 border-t" style={{ color: "var(--text-muted)", borderColor: "var(--border)" }}>
            All party details are sourced from the executed contract.
          </p>
        </div>

        <div className="card p-5 flex flex-col gap-3">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Key Dates</h3>
          <div className="flex flex-col">
            {KEY_DATES.map((d) => (
              <div key={d.label} className="flex justify-between items-center py-2 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{d.label}</span>
                <span className="text-xs font-semibold" style={{ color: d.value === "TBC" ? "var(--text-muted)" : "var(--text-primary)" }}>
                  {d.value}
                </span>
              </div>
            ))}
          </div>
          <button className="btn btn-secondary btn-sm text-xs self-start mt-1">
            <Plus size={12} />Add Key Date
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Contract Documents</h3>
            <span className="badge chip-muted">6 documents</span>
          </div>
          <button className="btn btn-primary btn-sm text-xs">
            <Upload size={12} />Upload Contract
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Type</th>
                <th>Executed Copy</th>
                <th>Version</th>
                <th>Status</th>
                <th>Date Uploaded</th>
                <th>Uploaded By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {CONTRACT_DOCS.map((doc, i) => {
                const chip: TypeChip = TYPE_CHIP[doc.type] ?? { cls: "badge chip-muted" };
                return (
                  <tr key={i}>
                    <td className="font-medium text-sm" style={{ color: "var(--text-primary)" }}>{doc.name}</td>
                    <td><span className={chip.cls} style={chip.style}>{doc.type}</span></td>
                    <td>
                      <span className="flex items-center gap-1 text-xs font-medium" style={{ color: "var(--success)" }}>
                        <CheckCircle2 size={13} />Yes
                      </span>
                    </td>
                    <td className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{doc.version}</td>
                    <td><span className="badge chip-success">{doc.status}</span></td>
                    <td className="text-xs" style={{ color: "var(--text-muted)" }}>{doc.date}</td>
                    <td className="text-xs" style={{ color: "var(--text-secondary)" }}>{doc.uploadedBy}</td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn btn-ghost btn-icon btn-sm"><Download size={13} /></button>
                        <button className="btn btn-ghost btn-icon btn-sm"><MoreHorizontal size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
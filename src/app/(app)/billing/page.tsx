"use client";

import { useState } from "react";
import {
  CreditCard, FileText, BarChart2, Zap,
  Download, Check, TrendingUp, AlertTriangle,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

/* ─────────────────────────── Types ─────────────────────────── */

type TabId = "plan" | "invoices" | "payment-method" | "usage";
const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "plan", label: "Plan", icon: <Zap size={14} /> },
  { id: "invoices", label: "Invoices", icon: <FileText size={14} /> },
  { id: "payment-method", label: "Payment Method", icon: <CreditCard size={14} /> },
  { id: "usage", label: "Usage", icon: <BarChart2 size={14} /> },
];

/* ─────────────────────────── Seed ──────────────────────────── */

const SEED_INVOICES = [
  { id: "inv-001", number: "INV-2026-006", date: "2026-06-01", amount: 149, status: "Paid" },
  { id: "inv-002", number: "INV-2026-005", date: "2026-05-01", amount: 149, status: "Paid" },
  { id: "inv-003", number: "INV-2026-004", date: "2026-04-01", amount: 149, status: "Paid" },
  { id: "inv-004", number: "INV-2026-003", date: "2026-03-01", amount: 149, status: "Paid" },
  { id: "inv-005", number: "INV-2026-002", date: "2026-02-01", amount: 149, status: "Paid" },
  { id: "inv-006", number: "INV-2026-001", date: "2026-01-01", amount: 149, status: "Paid" },
];

const API_CALLS_DATA = [
  { date: "04 Jun", calls: 320 },
  { date: "05 Jun", calls: 410 },
  { date: "06 Jun", calls: 275 },
  { date: "07 Jun", calls: 590 },
  { date: "08 Jun", calls: 445 },
  { date: "09 Jun", calls: 610 },
  { date: "10 Jun", calls: 382 },
];

const TOKEN_DATA = [
  { date: "04 Jun", tokens: 12400 },
  { date: "05 Jun", tokens: 18200 },
  { date: "06 Jun", tokens: 9600 },
  { date: "07 Jun", tokens: 24100 },
  { date: "08 Jun", tokens: 16800 },
  { date: "09 Jun", tokens: 21500 },
  { date: "10 Jun", tokens: 14300 },
];

const TOOLTIP_STYLE = {
  background: "var(--bg-surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  fontSize: "12px",
  color: "var(--text-primary)",
};

/* ─────────────────────────── Page ──────────────────────────── */

export default function BillingPage() {
  const [tab, setTab] = useState<TabId>("plan");

  return (
    <div className="flex flex-col min-h-full">
      <div className="page-header">
        <div>
          <h1 className="text-xl font-semibold">Billing</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">Manage your subscription, invoices and payment details</p>
        </div>
      </div>

      <div className="tab-bar mt-4">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={cn("tab-item flex items-center gap-1.5", tab === t.id && "active")}
            onClick={() => setTab(t.id)}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <div className="page-content flex-1">
        <div className="max-w-3xl">
          {tab === "plan" && <PlanTab />}
          {tab === "invoices" && <InvoicesTab />}
          {tab === "payment-method" && <PaymentMethodTab />}
          {tab === "usage" && <UsageTab />}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Plan Tab ──────────────────────── */

function UsageMeter({ label, current, max, unit = "" }: { label: string; current: number; max: number; unit?: string }) {
  const pct = Math.min((current / max) * 100, 100);
  const isHigh = pct > 80;
  const isMedium = pct > 60;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--text-secondary)]">{label}</span>
        <span className={cn("font-medium tabular-nums", isHigh ? "text-[var(--danger)]" : isMedium ? "text-[var(--warning)]" : "text-[var(--text-primary)]")}>
          {current.toLocaleString()}{unit} / {max.toLocaleString()}{unit}
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-muted)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: isHigh ? "var(--danger)" : isMedium ? "var(--warning)" : "var(--success)",
          }}
        />
      </div>
    </div>
  );
}

function PlanTab() {
  return (
    <div className="flex flex-col gap-6">
      {/* Current plan card */}
      <div className="card p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold">Professional Plan</h3>
              <span className="badge chip-success">Active</span>
            </div>
            <p className="text-sm text-[var(--text-muted)]">Renews on 1 July 2026</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-2xl font-bold">£149</p>
            <p className="text-xs text-[var(--text-muted)]">per month</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button className="btn btn-primary btn-sm" onClick={() => toast.info("Upgrade plan")}>
            <TrendingUp size={13} />Upgrade Plan
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => toast.info("Cancel subscription")}>Cancel Subscription</button>
        </div>
      </div>

      {/* Usage meters */}
      <div className="card p-5 flex flex-col gap-5">
        <h3 className="text-sm font-semibold">Usage This Period</h3>
        <UsageMeter label="Projects" current={6} max={50} />
        <UsageMeter label="Team Members" current={4} max={10} />
        <UsageMeter label="Storage" current={2.4} max={10} unit=" GB" />
        <UsageMeter label="AI Credits" current={8200} max={10000} unit="/mo" />
      </div>

      {/* Included features */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-3">What's Included</h3>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            "50 Projects",
            "10 Team Members",
            "10 GB Storage",
            "10,000 AI Credits/mo",
            "CVR & Final Account",
            "Evidence Management",
            "Payment Applications",
            "Change Management",
            "API Access",
            "Priority Support",
          ].map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
              <Check size={13} className="text-[var(--success)] flex-shrink-0" />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ─────────────────────────── Invoices Tab ──────────────────── */

function InvoicesTab() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-muted)]">{SEED_INVOICES.length} invoices</p>
        <button className="btn btn-secondary btn-sm" onClick={() => toast.info("Export all invoices")}>
          <Download size={14} />Export All
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {SEED_INVOICES.map((inv) => (
              <tr key={inv.id}>
                <td className="font-mono text-sm">{inv.number}</td>
                <td className="text-sm">{formatDate(inv.date)}</td>
                <td className="font-medium tabular-nums">{formatCurrency(inv.amount)}</td>
                <td>
                  <span className={cn("badge", inv.status === "Paid" ? "chip-success" : inv.status === "Pending" ? "chip-warning" : "chip-danger")}>
                    {inv.status}
                  </span>
                </td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => toast.info(`Download ${inv.number}`)}>
                    <Download size={13} />Download
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────── Payment Method Tab ────────────── */

function PaymentMethodTab() {
  return (
    <div className="flex flex-col gap-4">
      <div className="card p-5 flex items-center gap-4">
        <div
          className="w-14 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--primary)", color: "#fff" }}
        >
          <CreditCard size={20} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Visa ending in 4242</p>
          <p className="text-xs text-[var(--text-muted)]">Expires 09/28</p>
        </div>
        <span className="badge chip-success">Default</span>
      </div>

      <button className="btn btn-primary btn-sm w-fit" onClick={() => toast.info("Update payment method via Stripe")}>
        <CreditCard size={13} />Update Payment Method
      </button>

      <div className="card p-4 flex items-start gap-3" style={{ background: "var(--info-bg)", borderColor: "var(--info)" }}>
        <AlertTriangle size={15} className="text-[var(--info)] flex-shrink-0 mt-0.5" />
        <p className="text-sm text-[var(--info-text)]">
          Payment method changes are processed securely via Stripe. Your card details are never stored on our servers.
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────── Usage Tab ─────────────────────── */

function UsageTab() {
  return (
    <div className="flex flex-col gap-6">
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4">API Calls (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={API_CALLS_DATA} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="calls" fill="var(--primary)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4">AI Token Usage (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={TOKEN_DATA} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "var(--text-muted)" }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: number) => [`${v.toLocaleString()} tokens`, ""]} />
              <Bar dataKey="tokens" fill="var(--violet)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Usage breakdown table */}
      <div className="card overflow-hidden">
        <div className="px-4 py-3 border-b text-sm font-semibold" style={{ borderColor: "var(--border)" }}>
          Usage Breakdown
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Feature</th>
              <th className="text-right">Used</th>
              <th className="text-right">Limit</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              { feature: "Projects", used: 6, limit: 50, unit: "" },
              { feature: "Team Members", used: 4, limit: 10, unit: "" },
              { feature: "Storage", used: 2.4, limit: 10, unit: " GB" },
              { feature: "AI Credits (this month)", used: 8200, limit: 10000, unit: "" },
              { feature: "API Calls (today)", used: 382, limit: 10000, unit: "" },
            ].map((row) => {
              const pct = (row.used / row.limit) * 100;
              const status = pct > 80 ? "chip-danger" : pct > 60 ? "chip-warning" : "chip-success";
              const statusLabel = pct > 80 ? "High" : pct > 60 ? "Moderate" : "Normal";
              return (
                <tr key={row.feature}>
                  <td className="font-medium text-sm">{row.feature}</td>
                  <td className="text-right tabular-nums text-sm">{row.used.toLocaleString()}{row.unit}</td>
                  <td className="text-right tabular-nums text-sm text-[var(--text-muted)]">{row.limit.toLocaleString()}{row.unit}</td>
                  <td><span className={cn("badge", status)}>{statusLabel}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

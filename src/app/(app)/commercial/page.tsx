"use client";

import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Download, FileText, Sparkles, TrendingUp, TrendingDown } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { KpiCard } from "@/components/ui/kpi-card";

// ─── Data ─────────────────────────────────────────────────────────────────────

const PORTFOLIO_PROJECTS = [
  { name: "Eastside Residential Block A",   client: "Redstone Developments", contract: 4_850_000, certified: 3_492_000, certPct: 72.0, forecastFA: 5_318_000, margin: 16.4 },
  { name: "Meridian Office Park Phase 2",   client: "Meridian Properties",   contract: 6_200_000, certified: 5_456_000, certPct: 88.0, forecastFA: 6_665_000, margin: 13.8 },
  { name: "Thornfield Commercial Hub",      client: "Thornfield Estates",    contract: 3_850_000, certified: 2_118_500, certPct: 55.0, forecastFA: 4_025_000, margin: 11.2 },
  { name: "Riverside Apartments",           client: "Riverside Living",      contract: 2_950_000, certified: 590_000,   certPct: 20.0, forecastFA: 3_067_250, margin: 15.9 },
  { name: "Harlow Civic Centre Refurb",     client: "Harlow District Council",contract: 3_150_000, certified: 1_417_500, certPct: 45.0, forecastFA: 3_342_000, margin: 17.1 },
  { name: "Kings Cross Fit-out",            client: "Urban Space Developments",contract:1_820_000, certified: 564_200,   certPct: 31.0, forecastFA: 1_905_000, margin: 9.4  },
  { name: "Whitfield Leisure Centre",       client: "Whitfield Borough Council",contract:2_400_000, certified: 2_352_000, certPct: 98.0, forecastFA: 2_532_000, margin: 14.7 },
];

const MARGIN_TREND = [
  { month: "Dec 24", margin: 12.3 },
  { month: "Jan 25", margin: 12.8 },
  { month: "Feb 25", margin: 13.2 },
  { month: "Mar 25", margin: 13.6 },
  { month: "Apr 25", margin: 13.9 },
  { month: "May 25", margin: 14.1 },
];

const DISPUTED_DONUT = [
  { name: "High",         value: 1_250_000, pct: 32, color: "var(--danger)"  },
  { name: "Medium",       value: 1_150_000, pct: 30, color: "var(--warning)" },
  { name: "Low",          value:   950_000, pct: 25, color: "var(--success)" },
  { name: "Under Review", value:   500_000, pct: 13, color: "#64748B"        },
];

const CHANGE_EXPOSURE = [
  { label: "Approved",  value: 1_420_000, pct: 37, chip: "chip-success" },
  { label: "Pending",   value: 1_680_000, pct: 44, chip: "chip-warning" },
  { label: "Disputed",  value:   750_000, pct: 19, chip: "chip-danger"  },
];

const APPS_DUE = [
  { project: "Eastside Residential Block A", ref: "PA-014", amount: 380_000, due: "13 Jun 2026", urgency: "overdue"  },
  { project: "Thornfield Commercial Hub",    ref: "PA-009", amount: 295_000, due: "18 Jun 2026", urgency: "warning"  },
  { project: "Harlow Civic Centre Refurb",   ref: "PA-011", amount: 412_000, due: "20 Jun 2026", urgency: "upcoming" },
  { project: "Riverside Apartments",         ref: "PA-004", amount: 129_250, due: "20 Jun 2026", urgency: "upcoming" },
  { project: "Kings Cross Fit-out",          ref: "PA-006", amount: 902_000, due: "25 Jun 2026", urgency: "upcoming" },
];

const AT_RISK = [
  { name: "Thornfield Commercial Hub",  atRisk: 2_150_000, driver: "Active dispute on VO-047 (£85k) + final account" },
  { name: "Kings Cross Fit-out",        atRisk: 1_820_000, driver: "Project on hold — scope risk if planning rejected" },
  { name: "Eastside Residential Block A", atRisk: 660_000, driver: "EoT notice overdue — entitlement at risk" },
];

const AI_RECS = [
  { title: "File EoT Notices on 3 projects", body: "Section 4.1/clause 2.26 notices are overdue on Eastside, Riverside and Harlow. Combined entitlement at risk: £168,000." },
  { title: "Expedite Thornfield VO-047 resolution", body: "£85k variation has been disputed for 87 days. Escalate to mediation to avoid SCL protocol complications." },
  { title: "Kings Cross: protect against project abandonment", body: "On-hold status for 4 months — issue formal suspension notice to protect preliminaries recovery." },
];

const TOOLTIP_STYLE = {
  background: "var(--bg-surface)",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  fontSize: 12,
  color: "var(--text-primary)",
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CommercialOverviewPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div />
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary btn-sm">
            <Download size={13} />Export Report
          </button>
          <button className="btn btn-secondary btn-sm">
            <FileText size={13} />Generate Board Pack
          </button>
          <button
            className="btn btn-sm"
            style={{ background: "var(--violet)", color: "#fff" }}
          >
            <Sparkles size={13} />Ask Copilot
          </button>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        <KpiCard
          label="Total Contract Value"
          value="£25,220,000"
          change="7 projects"
          variant="default"
        />
        <KpiCard
          label="Certified to Date"
          value="£15,990,200"
          change="63.4% of portfolio"
          variant="success"
        />
        <KpiCard
          label="Forecast Final Account"
          value="£27,640,000"
          change="9.6% above contract"
          trend="up"
          variant="success"
        />
        <KpiCard
          label="Average Margin"
          value="14.1%"
          change="↑ 1.8pp vs last period"
          trend="up"
          variant="success"
        />
        <KpiCard
          label="Open Change Exposure"
          value="£3,850,000"
          change="15.3% of contract value"
          variant="warning"
        />
        <KpiCard
          label="Retention Held"
          value="£1,262,000"
          change="7.9% of certified"
          variant="default"
        />
        <KpiCard
          label="Applications Due"
          value="£2,118,500"
          change="5 this month"
          variant="warning"
        />
        <KpiCard
          label="At-Risk Value"
          value="£4,630,000"
          change="2 projects"
          variant="danger"
        />
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* LEFT — 2/3 */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          {/* Certified vs Contract table */}
          <div className="card overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Certified vs Contract by Project
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Client</th>
                    <th className="text-right">Contract</th>
                    <th className="text-right">Certified</th>
                    <th>Cert %</th>
                    <th className="text-right">Forecast FA</th>
                    <th className="text-right">Margin</th>
                  </tr>
                </thead>
                <tbody>
                  {PORTFOLIO_PROJECTS.map((p, i) => (
                    <tr key={i}>
                      <td className="font-medium max-w-[180px]">
                        <span className="line-clamp-2 text-sm">{p.name}</span>
                      </td>
                      <td className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {p.client}
                      </td>
                      <td className="text-right tabular-nums">{formatCurrency(p.contract)}</td>
                      <td className="text-right tabular-nums">{formatCurrency(p.certified)}</td>
                      <td style={{ minWidth: 100 }}>
                        <div className="flex items-center gap-2">
                          <div
                            className="flex-1 h-1.5 rounded-full overflow-hidden"
                            style={{ background: "var(--bg-muted)", minWidth: 48 }}
                          >
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${p.certPct}%`,
                                background: p.certPct >= 80
                                  ? "var(--success)"
                                  : p.certPct >= 50
                                  ? "var(--primary)"
                                  : "var(--warning)",
                              }}
                            />
                          </div>
                          <span className="text-xs tabular-nums font-medium" style={{ color: "var(--text-muted)" }}>
                            {p.certPct}%
                          </span>
                        </div>
                      </td>
                      <td className="text-right tabular-nums">{formatCurrency(p.forecastFA)}</td>
                      <td className="text-right tabular-nums font-bold">
                        <span
                          style={{
                            color:
                              p.margin >= 15
                                ? "var(--success)"
                                : p.margin >= 12
                                ? "var(--warning)"
                                : "var(--danger)",
                          }}
                        >
                          {p.margin.toFixed(1)}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Disputed Value donut + Change Exposure */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Disputed Value donut */}
            <div className="card p-5 flex flex-col gap-4">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Disputed Value
              </h3>
              <div className="relative flex items-center justify-center" style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={DISPUTED_DONUT}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={78}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {DISPUTED_DONUT.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => [formatCurrency(v), ""]}
                      contentStyle={TOOLTIP_STYLE}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                >
                  <p className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                    £3.85M
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>Total Disputed</p>
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                {DISPUTED_DONUT.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: d.color }}
                      />
                      <span style={{ color: "var(--text-secondary)" }}>{d.name}</span>
                    </div>
                    <span className="font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                      {formatCurrency(d.value)} <span style={{ color: "var(--text-muted)" }}>({d.pct}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Change Exposure by Status */}
            <div className="card p-5 flex flex-col gap-4">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Change Exposure by Status
              </h3>
              <div className="flex flex-col gap-3">
                {CHANGE_EXPOSURE.map((c, i) => (
                  <div key={i} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className={cn("badge", c.chip)}>{c.label}</span>
                      </div>
                      <span className="font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                        {formatCurrency(c.value)}
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ background: "var(--bg-muted)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${c.pct}%`,
                          background:
                            c.label === "Approved"
                              ? "var(--success)"
                              : c.label === "Disputed"
                              ? "var(--danger)"
                              : "var(--warning)",
                        }}
                      />
                    </div>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {c.pct}% of total exposure
                    </p>
                  </div>
                ))}
              </div>
              <div
                className="mt-2 pt-3 border-t flex justify-between text-xs font-semibold"
                style={{ borderColor: "var(--border)", color: "var(--text-primary)" }}
              >
                <span>Total Exposure</span>
                <span>{formatCurrency(CHANGE_EXPOSURE.reduce((s, c) => s + c.value, 0))}</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — 1/3 */}
        <div className="flex flex-col gap-5">
          {/* Margin Trend */}
          <div className="card p-5 flex flex-col gap-3">
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Margin Trend (Portfolio %)
            </h3>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={MARGIN_TREND} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: "var(--text-muted)" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                  domain={[10, 16]}
                />
                <Tooltip
                  formatter={(v: number) => [`${v}%`, "Margin"]}
                  contentStyle={TOOLTIP_STYLE}
                />
                <Area
                  type="monotone"
                  dataKey="margin"
                  stroke="var(--primary)"
                  fill="var(--primary)"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-1 text-xs" style={{ color: "var(--success)" }}>
              <TrendingUp size={12} />
              <span>+1.8pp over 6 months</span>
            </div>
          </div>

          {/* Applications Due */}
          <div className="card p-5 flex flex-col gap-3">
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Applications Due This Month
            </h3>
            <div className="flex flex-col gap-2">
              {APPS_DUE.map((a, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-start justify-between gap-2 p-2.5 rounded-xl",
                    i < APPS_DUE.length - 1 && "border-b"
                  )}
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium line-clamp-1" style={{ color: "var(--text-primary)" }}>
                      {a.project}
                    </p>
                    <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>
                      {a.ref} · Due {a.due}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--text-primary)" }}>
                      {formatCurrency(a.amount)}
                    </span>
                    <span
                      className={cn(
                        "badge",
                        a.urgency === "overdue" ? "chip-danger" : a.urgency === "warning" ? "chip-warning" : "chip-muted"
                      )}
                    >
                      {a.urgency === "overdue" ? "Overdue" : a.urgency === "warning" ? "Due soon" : "Upcoming"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* At-Risk Projects */}
          <div className="card overflow-hidden">
            <div className="px-5 pt-5 pb-3">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                Top At-Risk Projects
              </h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Project</th>
                  <th className="text-right">At-Risk</th>
                  <th>Driver</th>
                </tr>
              </thead>
              <tbody>
                {AT_RISK.map((r, i) => (
                  <tr key={i}>
                    <td className="font-medium text-xs max-w-[100px]">
                      <span className="line-clamp-2">{r.name}</span>
                    </td>
                    <td className="text-right tabular-nums font-bold" style={{ color: "var(--danger)" }}>
                      {formatCurrency(r.atRisk)}
                    </td>
                    <td className="text-xs max-w-[120px]" style={{ color: "var(--text-muted)" }}>
                      <span className="line-clamp-2">{r.driver}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* AI Recommendations */}
          <div
            className="card p-5 flex flex-col gap-3"
            style={{ borderColor: "var(--violet)", borderWidth: 1 }}
          >
            <div className="flex items-center gap-2">
              <Sparkles size={14} style={{ color: "var(--violet)" }} />
              <h3 className="text-sm font-semibold" style={{ color: "var(--violet)" }}>
                AI Recommendations
              </h3>
              <span
                className="badge ml-auto"
                style={{ background: "var(--violet-bg, #ede9fe)", color: "var(--violet)", fontSize: 10 }}
              >
                Beta
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {AI_RECS.map((r, i) => (
                <div
                  key={i}
                  className="flex flex-col gap-1 p-3 rounded-xl"
                  style={{ background: "var(--violet-bg, #ede9fe)" }}
                >
                  <p className="text-xs font-semibold" style={{ color: "var(--violet)" }}>
                    {r.title}
                  </p>
                  <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {r.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between text-xs pb-2"
        style={{ color: "var(--text-muted)" }}
      >
        <span>Data as of 30 May 2025, 08:30</span>
        <span>All values exclude VAT</span>
      </div>
    </div>
  );
}

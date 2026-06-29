"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceArea, ResponsiveContainer } from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DelayEvent {
  ref: string;
  event: string;
  start: string;
  end: string;
  duration: string;
  impact: string;
  cause: string;
  agreed: string;
}

interface ChartActivity {
  name: string;
  baseline: number;
  delay: number;
  current: number;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const DELAY_EVENTS: DelayEvent[] = [
  {
    ref: "DE-01",
    event: "Rock discovery – face exposed",
    start: "14 Mar",
    end: "15 Mar",
    duration: "2 days",
    impact: "+2 days",
    cause: "Employer Risk",
    agreed: "Yes",
  },
  {
    ref: "DE-02",
    event: "Plant mobilisation (rock-breaker)",
    start: "15 Mar",
    end: "18 Mar",
    duration: "4 days",
    impact: "+4 days",
    cause: "Contractor Risk",
    agreed: "N/A",
  },
  {
    ref: "DE-03",
    event: "Excavation of rock band",
    start: "18 Mar",
    end: "25 Mar",
    duration: "8 days",
    impact: "+8 days",
    cause: "Employer Risk",
    agreed: "Yes",
  },
];

const CHART_DATA: ChartActivity[] = [
  { name: "A003 Groundworks", baseline: 20, delay: 12, current: 8 },
  { name: "A004 RC Frame L1", baseline: 15, delay: 12, current: 0 },
  { name: "A005 RC Frame L2", baseline: 15, delay: 12, current: 0 },
  { name: "A006 RC Frame L3", baseline: 14, delay: 12, current: 0 },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProgrammeDelayPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="kpi-card border-l-4" style={{ borderLeftColor: "var(--warning)" }}>
          <div className="kpi-label">Days Claimed</div>
          <div className="kpi-value text-2xl" style={{ color: "var(--warning)" }}>12</div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>Calendar days</div>
        </div>
        <div className="kpi-card border-l-4" style={{ borderLeftColor: "var(--success)" }}>
          <div className="kpi-label">Days Agreed (PM)</div>
          <div className="kpi-value text-2xl" style={{ color: "var(--success)" }}>8</div>
          <div className="text-xs" style={{ color: "var(--text-muted)" }}>Accepted</div>
        </div>
        <div className="kpi-card border-l-4" style={{ borderLeftColor: "var(--danger)" }}>
          <div className="kpi-label">Critical Path</div>
          <div className="kpi-value text-base mt-1">
            <span className="badge chip-danger">Yes</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Analysis Method</div>
          <div className="text-sm font-semibold mt-1" style={{ color: "var(--text-primary)" }}>
            Time Impact Analysis (TIA)
          </div>
        </div>
      </div>

      {/* Delay Analysis */}
      <div className="card p-5">
        <div className="flex items-center gap-3 mb-4">
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Delay Analysis
          </h3>
          <span className="badge chip-info">Time Impact Analysis (TIA)</span>
          <span className="badge chip-muted">Extension of Time</span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          The contractor's delay analysis using TIA methodology demonstrates that the unforeseen rock
          excavation created a 12-day delay on Activity A003 (Groundworks &amp; Drainage), which sits on
          the critical path. The PM has accepted 8 days on the basis that concurrent delays from the
          contractor's own programme (late mobilisation of rock-breaker) account for 4 days.
        </p>
      </div>

      {/* Programme Impact Chart */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          Programme Impact Chart
        </h3>
        <div className="text-xs mb-3 flex items-center gap-4 flex-wrap" style={{ color: "var(--text-muted)" }}>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded" style={{ background: "#3B5EE8" }} />
            Baseline
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded" style={{ background: "#EF4444" }} />
            Delay Extension
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded" style={{ background: "#10B981" }} />
            Agreed (PM)
          </span>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={CHART_DATA}
            layout="vertical"
            margin={{ left: 120, right: 20, top: 0, bottom: 0 }}
          >
            <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} />
            <YAxis
              type="category"
              dataKey="name"
              tick={{ fontSize: 11 }}
              width={120}
              tickLine={false}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                `${value} days`,
                name === "baseline" ? "Baseline" : name === "delay" ? "Delay" : "Agreed",
              ]}
            />
            <ReferenceArea
              x1={14}
              x2={26}
              fill="rgba(245,158,11,0.1)"
              stroke="rgba(245,158,11,0.4)"
              label={{ value: "Delay Window: 14–25 Mar", position: "insideTop", fontSize: 9 }}
            />
            <Bar dataKey="baseline" fill="#3B5EE8" stackId="a" />
            <Bar dataKey="delay" fill="#EF4444" stackId="a" />
            <Bar dataKey="current" fill="#10B981" stackId="b" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Delay Events Register */}
      <div className="card overflow-hidden">
        <div
          className="px-5 py-3 border-b"
          style={{ borderColor: "var(--border)", background: "var(--bg-muted)" }}
        >
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            Delay Events Register
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Ref</th>
                <th>Event</th>
                <th>Start</th>
                <th>End</th>
                <th>Duration</th>
                <th>Impact</th>
                <th>Cause</th>
                <th>Agreed?</th>
              </tr>
            </thead>
            <tbody>
              {DELAY_EVENTS.map((de) => (
                <tr key={de.ref}>
                  <td className="font-mono text-xs font-bold" style={{ color: "var(--primary)" }}>
                    {de.ref}
                  </td>
                  <td className="text-sm font-medium">{de.event}</td>
                  <td className="text-sm">{de.start}</td>
                  <td className="text-sm">{de.end}</td>
                  <td className="text-sm font-semibold">{de.duration}</td>
                  <td className="text-sm font-semibold" style={{ color: "var(--warning)" }}>
                    {de.impact}
                  </td>
                  <td>
                    <span
                      className={`badge text-[10px] ${
                        de.cause === "Employer Risk" ? "chip-danger" : "chip-warning"
                      }`}
                    >
                      {de.cause}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge text-[10px] ${
                        de.agreed === "Yes"
                          ? "chip-success"
                          : de.agreed === "N/A"
                          ? "chip-muted"
                          : "chip-warning"
                      }`}
                    >
                      {de.agreed}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Concurrent Delays */}
      <div
        className="card p-5"
        style={{ background: "rgba(245,158,11,0.04)", borderColor: "rgba(245,158,11,0.3)" }}
      >
        <h3 className="text-sm font-semibold mb-3" style={{ color: "var(--warning)" }}>
          ⚠ Concurrent Delay Identified
        </h3>
        <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
          4 days of the 12 days claimed are attributed to late mobilisation of the hydraulic rock-breaker,
          which is within the Contractor's risk under the contract. Net agreed delay: 8 days.
        </p>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "PM Position", value: "8 days", color: "var(--success)" },
            { label: "Contractor Position", value: "12 days", color: "var(--warning)" },
            { label: "Difference", value: "4 days", color: "var(--danger)" },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <div className="kpi-label mb-1">{label}</div>
              <div className="text-xl font-bold" style={{ color }}>
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Float Analysis */}
      <div className="card p-5">
        <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
          Float Analysis
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <div className="kpi-label">Available Float (at event date)</div>
            <div className="text-xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>
              2 days
            </div>
          </div>
          <div>
            <div className="kpi-label">Net Delay (Contractor)</div>
            <div className="text-xl font-bold mt-1" style={{ color: "var(--warning)" }}>
              10 days
            </div>
          </div>
          <div>
            <div className="kpi-label">Net Delay (PM)</div>
            <div className="text-xl font-bold mt-1" style={{ color: "var(--success)" }}>
              6 days
            </div>
          </div>
        </div>
        <div
          className="mt-4 p-3 rounded-lg text-xs"
          style={{
            background: "var(--bg-muted)",
            color: "var(--text-muted)",
            borderLeft: "3px solid var(--warning)",
          }}
        >
          Float consumed by concurrent contractor delay. Net agreed delay after float absorption: 8 days.
        </div>
      </div>
    </div>
  );
}

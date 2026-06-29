'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, ResponsiveContainer,
  ScatterChart, Scatter, CartesianGrid, TooltipProps,
} from 'recharts';
import { Plus, Download, Search, LayoutList, Columns3, LayoutGrid, Clock, BarChart2, Eye, X } from 'lucide-react';
import { CHANGES_REGISTER, type SeedChangeRegisterItem } from '@/lib/seed/projects';
import { cn } from '@/lib/utils';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TODAY = new Date('2026-06-14');

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    draft:      'chip-muted',
    notified:   'chip-info',
    quotation:  'chip-info',
    submitted:  'chip-warning',
    agreed:     'chip-success',
    rejected:   'chip-danger',
    disputed:   'chip-danger',
    withdrawn:  'chip-muted',
  };
  return map[status] ?? 'chip-muted';
}

function getPriorityColor(priority: string): string {
  const map: Record<string, string> = {
    critical: 'chip-danger',
    high:     'chip-warning',
    medium:   'chip-info',
    low:      'chip-muted',
  };
  return map[priority] ?? 'chip-muted';
}

function isOverdue(dateStr: string): boolean {
  return new Date(dateStr) < TODAY;
}

function isDueSoon(dateStr: string): boolean {
  const d = new Date(dateStr);
  const diff = (d.getTime() - TODAY.getTime()) / 86400000;
  return diff >= 0 && diff <= 7;
}

function getQuotationDueStyle(dateStr: string): string {
  if (isOverdue(dateStr)) return 'text-[var(--danger)] font-semibold';
  if (isDueSoon(dateStr)) return 'text-[var(--warning)] font-semibold';
  return 'text-[var(--text-muted)]';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function EvidenceDots({ score }: { score: number }) {
  const scoreColor = score >= 4 ? 'var(--success)' : score === 3 ? 'var(--warning)' : 'var(--danger)';
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          style={{ color: i < score ? scoreColor : 'var(--border)' }}
          className="text-sm leading-none"
        >
          ●
        </span>
      ))}
    </span>
  );
}

// ─── KPI Strip ────────────────────────────────────────────────────────────────

function KpiStrip({ items }: { items: SeedChangeRegisterItem[] }) {
  const open = items.filter((i) => !['agreed', 'rejected', 'withdrawn'].includes(i.status)).length;
  const totalExposure = items.reduce((s, i) => s + i.contractorValue, 0);
  const agreed = items
    .filter((i) => i.status === 'agreed')
    .reduce((s, i) => s + (i.pmValue ?? i.contractorValue), 0);
  const disputed = items
    .filter((i) => i.status === 'disputed')
    .reduce((s, i) => s + i.contractorValue, 0);

  const kpis = [
    { label: 'Total CEs', value: String(items.length) },
    { label: 'Open', value: String(open), color: 'var(--warning)' },
    { label: 'Total Exposure', value: formatCurrency(totalExposure) },
    { label: 'Agreed', value: formatCurrency(agreed), color: 'var(--success)' },
    { label: 'Disputed', value: formatCurrency(disputed), color: 'var(--danger)' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 px-6 pt-5">
      {kpis.map((k) => (
        <div key={k.label} className="kpi-card">
          <div className="kpi-label">{k.label}</div>
          <div className="kpi-value" style={k.color ? { color: k.color } : undefined}>
            {k.value}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── View Switcher ────────────────────────────────────────────────────────────

type ViewMode = 'table' | 'board' | 'cards' | 'aging' | 'evidence';

const VIEW_TABS: { mode: ViewMode; label: string; Icon: React.ElementType }[] = [
  { mode: 'table',    label: 'Table',             Icon: LayoutList },
  { mode: 'board',   label: 'Status Board',      Icon: Columns3 },
  { mode: 'cards',   label: 'Cards',             Icon: LayoutGrid },
  { mode: 'aging',   label: 'Aging',             Icon: Clock },
  { mode: 'evidence',label: 'Evidence Strength', Icon: BarChart2 },
];

function ViewSwitcher({ view, onSwitch }: { view: ViewMode; onSwitch: (v: ViewMode) => void }) {
  return (
    <div className="flex items-center gap-1 bg-[var(--bg-muted)] rounded-[var(--radius)] p-1">
      {VIEW_TABS.map(({ mode, label, Icon }) => (
        <button
          key={mode}
          onClick={() => onSwitch(mode)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] text-xs font-semibold transition-all',
            view === mode
              ? 'bg-white text-[var(--text-primary)] shadow-sm'
              : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
          )}
        >
          <Icon size={13} />
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── Filter Toolbar ───────────────────────────────────────────────────────────

const ALL_PROJECTS = [
  'The Arc Tower',
  'Riverside Apartments',
  'Kings Quarter Office',
  "St Anne's Wharf",
  'Hartfield Green',
];

const ALL_STATUSES = ['draft','notified','quotation','submitted','agreed','rejected','disputed','withdrawn'];
const ALL_PRIORITIES = ['low','medium','high','critical'];

interface Filters {
  search: string;
  project: string;
  status: string;
  priority: string;
}

function FilterToolbar({
  filters,
  onChange,
  onClear,
}: {
  filters: Filters;
  onChange: (f: Partial<Filters>) => void;
  onClear: () => void;
}) {
  const hasFilter = filters.search || filters.project !== 'all' || filters.status !== 'all' || filters.priority !== 'all';

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          className="form-input h-8 text-sm pl-8 w-52"
          placeholder="Search changes..."
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
        />
      </div>
      <select
        className="form-input h-8 text-sm w-44"
        value={filters.project}
        onChange={(e) => onChange({ project: e.target.value })}
      >
        <option value="all">All Projects</option>
        {ALL_PROJECTS.map((p) => <option key={p} value={p}>{p}</option>)}
      </select>
      <select
        className="form-input h-8 text-sm w-36"
        value={filters.status}
        onChange={(e) => onChange({ status: e.target.value })}
      >
        <option value="all">All Statuses</option>
        {ALL_STATUSES.map((s) => (
          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
        ))}
      </select>
      <select
        className="form-input h-8 text-sm w-32"
        value={filters.priority}
        onChange={(e) => onChange({ priority: e.target.value })}
      >
        <option value="all">All Priorities</option>
        {ALL_PRIORITIES.map((p) => (
          <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
        ))}
      </select>
      {hasFilter && (
        <button className="btn btn-ghost btn-sm gap-1" onClick={onClear}>
          <X size={12} />Clear
        </button>
      )}
      <button className="btn btn-secondary btn-sm ml-auto">
        <Download size={13} />Export
      </button>
    </div>
  );
}

// ─── View 1: Table ────────────────────────────────────────────────────────────

function TableView({ items }: { items: SeedChangeRegisterItem[] }) {
  const router = useRouter();

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>CE No</th>
              <th>Project</th>
              <th>Title</th>
              <th>Status</th>
              <th>Priority</th>
              <th className="text-right">Contractor Value</th>
              <th className="text-right">PM Value</th>
              <th className="text-right">Delay Days</th>
              <th>Quotation Due</th>
              <th>Raised</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="cursor-pointer"
                onClick={() => router.push(`/changes/${item.id}`)}
              >
                <td className="font-mono text-xs font-bold text-[var(--primary)]">
                  {item.ceNumber}
                </td>
                <td className="text-xs text-[var(--text-secondary)] whitespace-nowrap">
                  {item.projectName}
                </td>
                <td className="max-w-[260px]">
                  <span className="line-clamp-2 font-medium">{item.title}</span>
                </td>
                <td>
                  <span className={cn('badge', getStatusColor(item.status))}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </span>
                </td>
                <td>
                  <span className={cn('badge', getPriorityColor(item.priority))}>
                    {item.priority.charAt(0).toUpperCase() + item.priority.slice(1)}
                  </span>
                </td>
                <td className="text-right font-semibold tabular-nums">
                  {item.contractorValue > 0 ? formatCurrency(item.contractorValue) : '—'}
                </td>
                <td className="text-right tabular-nums text-[var(--text-secondary)]">
                  {item.pmValue !== null ? formatCurrency(item.pmValue) : (
                    <span className="text-[var(--text-muted)]">Pending</span>
                  )}
                </td>
                <td className="text-right tabular-nums">
                  {item.daysClaimedDelay > 0 ? (
                    <span className="text-[var(--warning)] font-semibold">{item.daysClaimedDelay}d</span>
                  ) : '—'}
                </td>
                <td className={cn('text-xs whitespace-nowrap', getQuotationDueStyle(item.quotationDue))}>
                  {formatDate(item.quotationDue)}
                </td>
                <td className="text-xs text-[var(--text-muted)] whitespace-nowrap">
                  {formatDate(item.raisedDate)}
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <button
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={() => router.push(`/changes/${item.id}`)}
                    aria-label="View change event"
                  >
                    <Eye size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-3 border-t border-[var(--border)] text-xs text-[var(--text-muted)]">
        Showing 1–{items.length} of {items.length}
      </div>
    </div>
  );
}

// ─── View 2: Status Board (Kanban) ────────────────────────────────────────────

const BOARD_COLUMNS: { status: SeedChangeRegisterItem['status']; label: string; accent: string }[] = [
  { status: 'draft',     label: 'Draft',     accent: '#94A3B8' },
  { status: 'notified',  label: 'Notified',  accent: 'var(--info)' },
  { status: 'quotation', label: 'Quotation', accent: 'var(--info)' },
  { status: 'submitted', label: 'Submitted', accent: 'var(--warning)' },
  { status: 'agreed',    label: 'Agreed',    accent: 'var(--success)' },
  { status: 'disputed',  label: 'Disputed',  accent: 'var(--danger)' },
];

function BoardView({ items }: { items: SeedChangeRegisterItem[] }) {
  const router = useRouter();

  return (
    <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 520 }}>
      {BOARD_COLUMNS.map(({ status, label, accent }) => {
        const colItems = items.filter((i) => i.status === status);
        const colTotal = colItems.reduce((s, i) => s + i.contractorValue, 0);

        return (
          <div key={status} className="flex-shrink-0 w-64">
            {/* Column header */}
            <div
              className="flex items-center gap-2 mb-3 px-1 pb-2 border-b-2"
              style={{ borderColor: accent }}
            >
              <span
                className="inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white"
                style={{ background: accent }}
              >
                {colItems.length}
              </span>
              <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                {label}
              </span>
              {colTotal > 0 && (
                <span className="ml-auto text-[10px] text-[var(--text-muted)] font-semibold">
                  {formatCurrency(colTotal)}
                </span>
              )}
            </div>
            {/* Cards */}
            <div className="flex flex-col gap-2">
              {colItems.map((item) => {
                const agingColor =
                  item.agingDays > 60
                    ? 'var(--danger)'
                    : item.agingDays > 30
                    ? 'var(--warning)'
                    : 'var(--text-muted)';

                return (
                  <button
                    key={item.id}
                    onClick={() => router.push(`/changes/${item.id}`)}
                    className="card p-3 text-left w-full hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="font-mono text-[10px] font-bold text-[var(--primary)]">
                        {item.ceNumber}
                      </span>
                      <span
                        className="badge chip-muted text-[9px] px-1.5 py-0 ml-auto"
                        style={{ background: '#EEF2FF', color: 'var(--primary)' }}
                      >
                        {item.projectName}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-[var(--text-primary)] line-clamp-2 mb-2 text-left">
                      {item.title}
                    </p>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold tabular-nums text-[var(--text-primary)]">
                        {item.contractorValue > 0 ? formatCurrency(item.contractorValue) : 'TBC'}
                      </span>
                      <span className={cn('badge', getPriorityColor(item.priority))}>
                        {item.priority}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold" style={{ color: agingColor }}>
                        ⏱ {item.agingDays} days
                      </span>
                      <span
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
                        style={{ background: 'var(--primary)' }}
                        title={item.raisedBy}
                      >
                        {getInitials(item.raisedBy)}
                      </span>
                    </div>
                  </button>
                );
              })}
              {colItems.length === 0 && (
                <div className="rounded-[var(--radius)] border-2 border-dashed border-[var(--border)] h-20 flex items-center justify-center text-xs text-[var(--text-muted)]">
                  No changes
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── View 3: Cards ────────────────────────────────────────────────────────────

function CardsView({ items }: { items: SeedChangeRegisterItem[] }) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => {
        const pmVariance =
          item.pmValue !== null && item.contractorValue > 0
            ? Math.abs(item.pmValue - item.contractorValue) / item.contractorValue
            : null;

        const pmValueStyle =
          pmVariance === null
            ? 'text-[var(--text-muted)]'
            : pmVariance <= 0.05
            ? 'text-[var(--success)]'
            : pmVariance > 0.15
            ? 'text-[var(--danger)]'
            : 'text-[var(--text-secondary)]';

        return (
          <div
            key={item.id}
            className="card p-4 flex flex-col gap-3 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push(`/changes/${item.id}`)}
          >
            {/* Top row */}
            <div className="flex items-start justify-between gap-2">
              <span className="font-mono text-xs font-bold text-[var(--primary)] bg-[var(--primary-light)] px-2 py-0.5 rounded">
                {item.ceNumber}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <span className={cn('badge', getStatusColor(item.status))}>
                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                </span>
                <span className={cn('badge', getPriorityColor(item.priority))}>
                  {item.priority}
                </span>
              </div>
            </div>

            {/* Project */}
            <p className="text-xs text-[var(--text-muted)] font-medium">{item.projectName}</p>

            {/* Title */}
            <h3 className="text-sm font-semibold text-[var(--text-primary)] line-clamp-2 leading-snug">
              {item.title}
            </h3>

            {/* Values */}
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xl font-bold tabular-nums text-[var(--text-primary)]">
                  {item.contractorValue > 0 ? formatCurrency(item.contractorValue) : 'TBC'}
                </p>
                <p className={cn('text-xs mt-0.5', pmValueStyle)}>
                  PM:{' '}
                  {item.pmValue !== null ? formatCurrency(item.pmValue) : 'Pending'}
                </p>
              </div>
              <EvidenceDots score={item.evidenceScore} />
            </div>

            {/* Delay bar */}
            {item.daysClaimedDelay > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--text-muted)]">⏱</span>
                <span className="text-xs text-[var(--text-secondary)]">{item.daysClaimedDelay} days claimed</span>
                <span className="badge chip-warning text-[10px] px-1.5 py-0">delay</span>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)] mt-auto">
              <span className="text-[10px] text-[var(--text-muted)]">
                {item.raisedBy} · {formatDate(item.raisedDate)}
              </span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/changes/${item.id}`);
                }}
              >
                View
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── View 4: Aging ────────────────────────────────────────────────────────────

interface AgingBarPayload {
  ceNumber: string;
  title: string;
  agingDays: number;
  fill: string;
  projectName: string;
}

function AgingView({ items }: { items: SeedChangeRegisterItem[] }) {
  const router = useRouter();
  const overdue = items.filter((i) => isOverdue(i.quotationDue) && !['agreed','withdrawn','rejected'].includes(i.status));
  const dueSoon = items.filter((i) => isDueSoon(i.quotationDue) && !['agreed','withdrawn','rejected'].includes(i.status));
  const onTrack = items.filter(
    (i) => !isOverdue(i.quotationDue) && !isDueSoon(i.quotationDue) && !['agreed','withdrawn','rejected'].includes(i.status)
  );

  const sorted = [...items].sort((a, b) => b.agingDays - a.agingDays);

  const chartData: AgingBarPayload[] = sorted.map((i) => ({
    ceNumber: i.ceNumber,
    title: i.title,
    agingDays: i.agingDays,
    projectName: i.projectName,
    fill:
      i.agingDays > 60
        ? '#EF4444'
        : i.agingDays > 21
        ? '#F59E0B'
        : '#10B981',
  }));

  function AgingTooltipContent({ active, payload }: TooltipProps<number, string>) {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload as AgingBarPayload | undefined;
    if (!d) return null;
    return (
      <div className="card p-3 text-xs shadow-md max-w-[200px]">
        <p className="font-bold text-[var(--primary)]">{d.ceNumber}</p>
        <p className="text-[var(--text-secondary)] line-clamp-2 mt-0.5">{d.title}</p>
        <p className="mt-1 font-semibold" style={{ color: d.fill }}>{d.agingDays} days aged</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-[var(--text-primary)]">Change Event Aging</h2>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          Time since notification — NEC4 21-day quotation window
        </p>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="badge chip-danger text-xs px-3 py-1">{overdue.length} changes overdue</span>
        <span className="badge chip-warning text-xs px-3 py-1">{dueSoon.length} approaching deadline</span>
        <span className="badge chip-success text-xs px-3 py-1">{onTrack.length} within window</span>
      </div>

      {/* Bar chart */}
      <div className="card p-5">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 16, right: 32, top: 8, bottom: 8 }}>
            <XAxis
              type="number"
              domain={[0, 160]}
              tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              tickFormatter={(v: number) => `${v}d`}
            />
            <YAxis
              type="category"
              dataKey="ceNumber"
              width={56}
              tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
            />
            <Tooltip content={<AgingTooltipContent />} />
            <ReferenceLine
              x={21}
              stroke="var(--primary)"
              strokeDasharray="4 3"
              label={{ value: '21d NEC4', position: 'top', fontSize: 10, fill: 'var(--primary)' }}
            />
            <Bar dataKey="agingDays" radius={[0, 3, 3, 0]}>
              {chartData.map((entry, i) => (
                <rect key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Aging breakdown table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>CE No</th>
                <th>Project</th>
                <th>Title</th>
                <th>Status</th>
                <th className="text-right">Days Aged</th>
                <th>Quotation Due</th>
                <th>Alert</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((item) => {
                const over = isOverdue(item.quotationDue) && !['agreed','withdrawn','rejected'].includes(item.status);
                const soon = !over && isDueSoon(item.quotationDue) && !['agreed','withdrawn','rejected'].includes(item.status);

                return (
                  <tr
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/changes/${item.id}`)}
                  >
                    <td className="font-mono text-xs font-bold text-[var(--primary)]">{item.ceNumber}</td>
                    <td className="text-xs text-[var(--text-secondary)]">{item.projectName}</td>
                    <td className="max-w-[220px]">
                      <span className="line-clamp-2 font-medium text-sm">{item.title}</span>
                    </td>
                    <td>
                      <span className={cn('badge', getStatusColor(item.status))}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </span>
                    </td>
                    <td className="text-right font-bold tabular-nums">
                      <span style={{
                        color: item.agingDays > 60 ? 'var(--danger)' : item.agingDays > 21 ? 'var(--warning)' : 'var(--success)'
                      }}>
                        {item.agingDays}d
                      </span>
                    </td>
                    <td className={cn('text-xs', getQuotationDueStyle(item.quotationDue))}>
                      {formatDate(item.quotationDue)}
                    </td>
                    <td>
                      {over ? (
                        <span className="badge chip-danger">OVERDUE</span>
                      ) : soon ? (
                        <span className="badge chip-warning">Due Soon</span>
                      ) : (
                        <span className="badge chip-success">On Track</span>
                      )}
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

// ─── View 5: Evidence Strength ────────────────────────────────────────────────

interface ScatterPoint {
  x: number;
  y: number;
  ceNumber: string;
  title: string;
  fill: string;
}

interface EvidenceTooltipPayload {
  payload: ScatterPoint;
}

function EvidenceView({ items }: { items: SeedChangeRegisterItem[] }) {
  const router = useRouter();

  const strong   = items.filter((i) => i.evidenceScore >= 4).length;
  const adequate = items.filter((i) => i.evidenceScore === 3).length;
  const weak     = items.filter((i) => i.evidenceScore <= 2).length;
  const notAssessed = items.filter((i) => i.evidenceScore === 0).length;

  const scatterData: ScatterPoint[] = items
    .filter((i) => i.contractorValue > 0)
    .map((i) => ({
      x: i.contractorValue,
      y: i.evidenceScore,
      ceNumber: i.ceNumber,
      title: i.title,
      fill:
        i.evidenceScore >= 4
          ? '#10B981'
          : i.evidenceScore === 3
          ? '#F59E0B'
          : '#EF4444',
    }));

  const gapAnalysis = (item: SeedChangeRegisterItem): string => {
    if (item.evidenceScore >= 5) return 'Complete';
    const missing: string[] = [];
    if (item.evidenceScore < 4) missing.push('contemporaneous records');
    if (item.evidenceScore < 3) missing.push('expert report');
    if (item.evidenceScore < 2) missing.push('programme analysis');
    return missing.length ? `Missing: ${missing.join(', ')}` : 'Minor gaps only';
  };

  const recommendedAction = (item: SeedChangeRegisterItem): { label: string; chip: string } => {
    if (item.evidenceScore >= 5) return { label: '✓ Complete', chip: 'chip-success' };
    if (item.evidenceScore === 4) return { label: 'Upload summary report', chip: 'chip-info' };
    if (item.evidenceScore === 3) return { label: 'Upload site diary', chip: 'chip-warning' };
    if (item.evidenceScore === 2) return { label: 'Obtain expert report', chip: 'chip-warning' };
    return { label: 'Review urgently', chip: 'chip-danger' };
  };

  function EvidenceTooltipContent({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: EvidenceTooltipPayload[];
  }) {
    if (!active || !payload?.length) return null;
    const d = payload[0]?.payload;
    if (!d) return null;
    return (
      <div className="card p-3 text-xs shadow-md max-w-[200px]">
        <p className="font-bold text-[var(--primary)]">{d.ceNumber}</p>
        <p className="text-[var(--text-secondary)] line-clamp-2 mt-0.5">{d.title}</p>
        <p className="mt-1 font-semibold">Score: {d.y}/5</p>
        <p className="text-[var(--text-muted)]">Value: {formatCurrency(d.x)}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-[var(--text-primary)]">Evidence Strength Assessment</h2>
      </div>

      {/* Intro card */}
      <div
        className="card p-4 text-sm text-[var(--text-secondary)]"
        style={{ borderLeft: '4px solid var(--primary)' }}
      >
        Evidence strength scores are calculated from the number and quality of linked documents,
        contemporaneous records, notices, and expert assessments.
      </div>

      {/* Strength overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Strong (4–5)', count: strong,      color: 'var(--success)', bg: 'var(--success-bg)', chip: 'chip-success' },
          { label: 'Adequate (3)', count: adequate,    color: 'var(--warning)', bg: 'var(--warning-bg)', chip: 'chip-warning' },
          { label: 'Weak (1–2)',   count: weak,        color: 'var(--danger)',  bg: 'var(--danger-bg)',  chip: 'chip-danger' },
          { label: 'Not Assessed', count: notAssessed, color: 'var(--text-muted)', bg: 'var(--bg-muted)', chip: 'chip-muted' },
        ].map(({ label, count, color, bg }) => (
          <div
            key={label}
            className="card p-4 flex flex-col gap-2"
            style={{ background: bg }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>
              {label}
            </p>
            <p className="text-2xl font-bold" style={{ color }}>
              {count}
            </p>
          </div>
        ))}
      </div>

      {/* Scatter chart */}
      <div className="card p-5">
        <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">
          Value vs Evidence Score
        </p>
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="x"
              type="number"
              name="Contractor Value"
              tickFormatter={(v: number) => `£${(v / 1000).toFixed(0)}k`}
              tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              label={{ value: 'Contractor Value (£)', position: 'insideBottom', offset: -2, fontSize: 11, fill: 'var(--text-muted)' }}
            />
            <YAxis
              dataKey="y"
              type="number"
              name="Evidence Score"
              domain={[0, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              label={{ value: 'Evidence Score', angle: -90, position: 'insideLeft', fontSize: 11, fill: 'var(--text-muted)' }}
            />
            <Tooltip content={<EvidenceTooltipContent />} />
            <Scatter
              data={scatterData}
              shape={(props: unknown) => {
                const p = props as { cx?: number; cy?: number; payload?: ScatterPoint };
                const { cx, cy } = p;
                const fill = p.payload?.fill ?? '#94A3B8';
                if (cx === undefined || cy === undefined) return <g />;
                return (
                  <circle cx={cx} cy={cy} r={7} fill={fill} fillOpacity={0.85} stroke="white" strokeWidth={1.5} />
                );
              }}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Evidence table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>CE No</th>
                <th>Project</th>
                <th>Title</th>
                <th className="text-right">Contractor Value</th>
                <th>Evidence Score</th>
                <th>Gap Analysis</th>
                <th>Recommended Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...items].sort((a, b) => a.evidenceScore - b.evidenceScore).map((item) => {
                const rec = recommendedAction(item);
                return (
                  <tr
                    key={item.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/changes/${item.id}`)}
                  >
                    <td className="font-mono text-xs font-bold text-[var(--primary)]">{item.ceNumber}</td>
                    <td className="text-xs text-[var(--text-secondary)]">{item.projectName}</td>
                    <td className="max-w-[200px]">
                      <span className="line-clamp-2 font-medium text-sm">{item.title}</span>
                    </td>
                    <td className="text-right font-semibold tabular-nums">
                      {item.contractorValue > 0 ? formatCurrency(item.contractorValue) : '—'}
                    </td>
                    <td>
                      <EvidenceDots score={item.evidenceScore} />
                    </td>
                    <td className="text-xs text-[var(--text-secondary)] max-w-[180px]">
                      {gapAnalysis(item)}
                    </td>
                    <td>
                      <span className={cn('badge', rec.chip)}>{rec.label}</span>
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

// ─── Main Component ───────────────────────────────────────────────────────────

function ChangesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const view = (searchParams.get('view') ?? 'table') as ViewMode;

  const [filters, setFilters] = useState<Filters>({
    search:   '',
    project:  'all',
    status:   'all',
    priority: 'all',
  });

  function patchFilters(patch: Partial<Filters>) {
    setFilters((prev) => ({ ...prev, ...patch }));
  }

  function clearFilters() {
    setFilters({ search: '', project: 'all', status: 'all', priority: 'all' });
  }

  function switchView(v: ViewMode) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', v);
    router.push(`?${params.toString()}`);
  }

  const filtered = CHANGES_REGISTER.filter((item) => {
    const q = filters.search.toLowerCase();
    if (q && !item.title.toLowerCase().includes(q) && !item.ceNumber.toLowerCase().includes(q)) {
      return false;
    }
    if (filters.project !== 'all' && item.projectName !== filters.project) return false;
    if (filters.status !== 'all' && item.status !== filters.status) return false;
    if (filters.priority !== 'all' && item.priority !== filters.priority) return false;
    return true;
  });

  return (
    <div className="flex flex-col min-h-full">
      {/* Page header */}
      <div className="page-header">
        <div>
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Changes &amp; Claims Register</h1>
          <p className="text-sm text-[var(--text-muted)] mt-0.5">
            Manage compensation events, variations and disputes across all projects
          </p>
        </div>
        <button className="btn btn-primary btn-sm">
          <Plus size={14} />
          New Change Event
        </button>
      </div>

      {/* KPI strip */}
      <KpiStrip items={CHANGES_REGISTER} />

      {/* View switcher + filter toolbar */}
      <div className="px-6 pt-5 flex flex-col gap-3">
        <ViewSwitcher view={view} onSwitch={switchView} />
        <FilterToolbar filters={filters} onChange={patchFilters} onClear={clearFilters} />
      </div>

      {/* Content */}
      <div className="page-content flex-1 pt-5">
        {filtered.length === 0 ? (
          <div className="card">
            <div className="empty-state">
              <div className="empty-icon">
                <Search size={22} />
              </div>
              <h3 className="text-base font-semibold">No changes found</h3>
              <p className="text-sm text-[var(--text-muted)] max-w-xs text-center">
                Try adjusting your search or filter criteria.
              </p>
              <button className="btn btn-ghost btn-sm mt-1" onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          </div>
        ) : (
          <>
            {view === 'table'    && <TableView    items={filtered} />}
            {view === 'board'    && <BoardView    items={filtered} />}
            {view === 'cards'    && <CardsView    items={filtered} />}
            {view === 'aging'    && <AgingView    items={filtered} />}
            {view === 'evidence' && <EvidenceView items={filtered} />}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Page export ──────────────────────────────────────────────────────────────

export default function ChangesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>
          Loading...
        </div>
      }
    >
      <ChangesContent />
    </Suspense>
  );
}

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  renderToBuffer,
} from "@react-pdf/renderer";
import { baseStyles } from "@/lib/pdf-templates/base-template";

Font.register({
  family: "Inter",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2",
      fontWeight: 400,
    },
    {
      src: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiA.woff2",
      fontWeight: 700,
    },
  ],
});

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProjectSummary {
  id: string;
  name: string;
  contractSum: number;
  percentComplete: number;
  marginPct: number;
  startDate: string;
  endDate: string;
  ragStatus: "R" | "A" | "G";
}

export interface PortfolioKPIs {
  contractValue: number;
  certifiedToDate: number;
  paidToDate: number;
  avgMarginPct: number;
  activeCEs: number;
  overduePayments: number;
  projectCount: number;
}

export interface CESummary {
  ceRef: string;
  projectName: string;
  description: string;
  value: number;
  status: string;
}

export interface CashPositionRow {
  period: string;
  certified: number;
  paid: number;
}

export interface RiskItem {
  id: string;
  projectName: string;
  description: string;
  likelihood: number;
  impact: number;
  score: number;
}

export interface BoardPackData {
  period: string;
  workspace_name: string;
  projects: ProjectSummary[];
  portfolio_kpis: PortfolioKPIs;
  ce_summary: CESummary[];
  cash_position: CashPositionRow[];
  risks: RiskItem[];
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const S = StyleSheet.create({
  coverPage: {
    backgroundColor: "#0f172a",
    fontFamily: "Inter",
    padding: 0,
  },
  coverContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 60,
  },
  coverBadge: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 24,
  },
  coverBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 1.5,
    fontFamily: "Inter",
  },
  coverTitle: {
    fontSize: 28,
    fontWeight: 700,
    color: "#f8fafc",
    fontFamily: "Inter",
    textAlign: "center",
    marginBottom: 8,
  },
  coverPeriod: {
    fontSize: 16,
    color: "#94a3b8",
    fontFamily: "Inter",
    textAlign: "center",
    marginBottom: 32,
  },
  coverWorkspace: {
    fontSize: 12,
    color: "#cbd5e1",
    fontFamily: "Inter",
    textAlign: "center",
    marginBottom: 4,
  },
  coverConfidential: {
    fontSize: 8,
    color: "#475569",
    fontFamily: "Inter",
    textAlign: "center",
  },
  coverFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  coverFooterText: {
    fontSize: 8,
    color: "#334155",
    fontFamily: "Inter",
  },
  bodyPage: {
    fontFamily: "Inter",
    fontSize: 10,
    color: "#1e293b",
    paddingTop: 40,
    paddingBottom: 60,
    paddingHorizontal: 40,
  },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 8,
    marginBottom: 20,
  },
  pageTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
    fontFamily: "Inter",
  },
  pageMeta: {
    fontSize: 8,
    color: "#64748b",
    fontFamily: "Inter",
    textAlign: "right",
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 6,
  },
  footerText: {
    fontSize: 7,
    color: "#94a3b8",
    fontFamily: "Inter",
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#0f172a",
    fontFamily: "Inter",
    marginBottom: 10,
  },
  kpiRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    padding: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  kpiLabel: {
    fontSize: 7,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: "Inter",
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
    fontFamily: "Inter",
  },
  narrativeBox: {
    backgroundColor: "#eff6ff",
    borderRadius: 6,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: "#2563eb",
    marginBottom: 16,
  },
  narrativeText: {
    fontSize: 10,
    color: "#1e40af",
    fontFamily: "Inter",
    lineHeight: 1.6,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableHeaderCell: {
    fontSize: 7,
    fontWeight: 700,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontFamily: "Inter",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 5,
    paddingHorizontal: 6,
  },
  tableCell: {
    fontSize: 9,
    color: "#1e293b",
    fontFamily: "Inter",
  },
  ragBadge: {
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    fontSize: 8,
    fontWeight: 700,
    fontFamily: "Inter",
    color: "#fff",
  },
  projectCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 14,
    marginBottom: 14,
  },
  projectName: {
    fontSize: 12,
    fontWeight: 700,
    color: "#0f172a",
    fontFamily: "Inter",
    marginBottom: 8,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    marginVertical: 10,
  },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCurrencyPdf(n: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function ragColor(rag: "R" | "A" | "G"): string {
  return rag === "G" ? "#16a34a" : rag === "A" ? "#d97706" : "#dc2626";
}

// ─── Page footer ──────────────────────────────────────────────────────────────

interface PageNumberRenderProps {
  pageNumber?: number;
  totalPages?: number;
}

function PdfFooter({ period }: { period: string }) {
  return (
    <View style={S.footer} fixed>
      <Text style={S.footerText}>MeasureDeck Board Pack · {period} · Confidential</Text>
      <Text
        style={S.footerText}
        render={({ pageNumber, totalPages }: PageNumberRenderProps) =>
          `Page ${pageNumber ?? 1} of ${totalPages ?? 1}`
        }
      />
    </View>
  );
}

// ─── Cover Page ───────────────────────────────────────────────────────────────

function CoverPage({ period, workspace_name }: { period: string; workspace_name: string }) {
  return (
    <Page size="A4" style={S.coverPage}>
      <View style={S.coverContent}>
        <View style={S.coverBadge}>
          <Text style={S.coverBadgeText}>MEASUREDECK</Text>
        </View>
        <Text style={S.coverTitle}>Board Report</Text>
        <Text style={S.coverPeriod}>{period}</Text>
        <Text style={S.coverWorkspace}>{workspace_name}</Text>
        <Text style={S.coverConfidential}>Prepared by MeasureDeck · Strictly Confidential</Text>
      </View>
      <View style={S.coverFooter}>
        <Text style={S.coverFooterText}>Generated {new Date().toLocaleDateString("en-GB")}</Text>
        <Text style={S.coverFooterText}>measuredeck.com</Text>
      </View>
    </Page>
  );
}

// ─── Executive Summary ────────────────────────────────────────────────────────

function ExecutiveSummaryPage({ data }: { data: BoardPackData }) {
  const kpis = data.portfolio_kpis;
  const narrative = `Portfolio value of ${formatCurrencyPdf(kpis.contractValue)} across ${kpis.projectCount} projects. Average margin of ${kpis.avgMarginPct.toFixed(1)}%. ${kpis.activeCEs} change events in progress with ${kpis.overduePayments} overdue payments requiring attention.`;

  return (
    <Page size="A4" style={S.bodyPage}>
      <View style={S.pageHeader} fixed>
        <Text style={S.pageTitle}>Executive Summary</Text>
        <Text style={S.pageMeta}>{data.period} · {data.workspace_name}</Text>
      </View>

      <View style={S.narrativeBox}>
        <Text style={S.narrativeText}>{narrative}</Text>
      </View>

      <Text style={S.sectionTitle}>Portfolio KPIs</Text>

      <View style={S.kpiRow}>
        <View style={S.kpiBox}>
          <Text style={S.kpiLabel}>Contract Value</Text>
          <Text style={S.kpiValue}>{formatCurrencyPdf(kpis.contractValue)}</Text>
        </View>
        <View style={S.kpiBox}>
          <Text style={S.kpiLabel}>Certified to Date</Text>
          <Text style={S.kpiValue}>{formatCurrencyPdf(kpis.certifiedToDate)}</Text>
        </View>
        <View style={S.kpiBox}>
          <Text style={S.kpiLabel}>Paid to Date</Text>
          <Text style={S.kpiValue}>{formatCurrencyPdf(kpis.paidToDate)}</Text>
        </View>
      </View>
      <View style={S.kpiRow}>
        <View style={S.kpiBox}>
          <Text style={S.kpiLabel}>Avg Margin %</Text>
          <Text style={S.kpiValue}>{kpis.avgMarginPct.toFixed(1)}%</Text>
        </View>
        <View style={S.kpiBox}>
          <Text style={S.kpiLabel}>Active CEs</Text>
          <Text style={S.kpiValue}>{kpis.activeCEs}</Text>
        </View>
        <View style={S.kpiBox}>
          <Text style={S.kpiLabel}>Overdue Payments</Text>
          <Text style={S.kpiValue}>{kpis.overduePayments}</Text>
        </View>
      </View>

      <PdfFooter period={data.period} />
    </Page>
  );
}

// ─── Project Summary Pages ────────────────────────────────────────────────────

function ProjectSummariesPage({ data }: { data: BoardPackData }) {
  return (
    <Page size="A4" style={S.bodyPage}>
      <View style={S.pageHeader} fixed>
        <Text style={S.pageTitle}>Project Summaries</Text>
        <Text style={S.pageMeta}>{data.period} · {data.workspace_name}</Text>
      </View>

      {data.projects.map(p => (
        <View key={p.id} style={S.projectCard} wrap={false}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <Text style={S.projectName}>{p.name}</Text>
            <View style={[S.ragBadge, { backgroundColor: ragColor(p.ragStatus) }]}>
              <Text>{p.ragStatus === "G" ? "ON TRACK" : p.ragStatus === "A" ? "AT RISK" : "CRITICAL"}</Text>
            </View>
          </View>
          <View style={S.kpiRow}>
            <View style={S.kpiBox}>
              <Text style={S.kpiLabel}>Contract Sum</Text>
              <Text style={[S.kpiValue, { fontSize: 11 }]}>{formatCurrencyPdf(p.contractSum)}</Text>
            </View>
            <View style={S.kpiBox}>
              <Text style={S.kpiLabel}>% Complete</Text>
              <Text style={[S.kpiValue, { fontSize: 11 }]}>{p.percentComplete}%</Text>
            </View>
            <View style={S.kpiBox}>
              <Text style={S.kpiLabel}>Margin %</Text>
              <Text style={[S.kpiValue, { fontSize: 11, color: p.marginPct >= 15 ? "#16a34a" : p.marginPct >= 12 ? "#d97706" : "#dc2626" }]}>
                {p.marginPct.toFixed(1)}%
              </Text>
            </View>
          </View>
          <View style={S.divider} />
          <View style={{ flexDirection: "row", gap: 20 }}>
            <Text style={{ fontSize: 8, color: "#64748b", fontFamily: "Inter" }}>Start: {p.startDate}</Text>
            <Text style={{ fontSize: 8, color: "#64748b", fontFamily: "Inter" }}>End: {p.endDate}</Text>
          </View>
        </View>
      ))}

      <PdfFooter period={data.period} />
    </Page>
  );
}

// ─── CE Register ──────────────────────────────────────────────────────────────

function CERegisterPage({ data }: { data: BoardPackData }) {
  return (
    <Page size="A4" style={S.bodyPage}>
      <View style={S.pageHeader} fixed>
        <Text style={S.pageTitle}>CE Register Summary</Text>
        <Text style={S.pageMeta}>{data.period} · {data.workspace_name}</Text>
      </View>

      <View style={baseStyles.table}>
        <View style={S.tableHeader}>
          <Text style={[S.tableHeaderCell, { flex: 0.6 }]}>CE Ref</Text>
          <Text style={[S.tableHeaderCell, { flex: 1.2 }]}>Project</Text>
          <Text style={[S.tableHeaderCell, { flex: 2 }]}>Description</Text>
          <Text style={[S.tableHeaderCell, { flex: 0.8, textAlign: "right" }]}>Value</Text>
          <Text style={[S.tableHeaderCell, { flex: 0.8 }]}>Status</Text>
        </View>
        {data.ce_summary.map((ce, i) => (
          <View key={i} style={S.tableRow}>
            <Text style={[S.tableCell, { flex: 0.6 }]}>{ce.ceRef}</Text>
            <Text style={[S.tableCell, { flex: 1.2 }]}>{ce.projectName}</Text>
            <Text style={[S.tableCell, { flex: 2 }]}>{ce.description}</Text>
            <Text style={[S.tableCell, { flex: 0.8, textAlign: "right" }]}>{formatCurrencyPdf(ce.value)}</Text>
            <Text style={[S.tableCell, { flex: 0.8 }]}>{ce.status}</Text>
          </View>
        ))}
      </View>

      <PdfFooter period={data.period} />
    </Page>
  );
}

// ─── Cash Position ────────────────────────────────────────────────────────────

function CashPositionPage({ data }: { data: BoardPackData }) {
  return (
    <Page size="A4" style={S.bodyPage}>
      <View style={S.pageHeader} fixed>
        <Text style={S.pageTitle}>Cash Position</Text>
        <Text style={S.pageMeta}>{data.period} · {data.workspace_name}</Text>
      </View>

      <View style={baseStyles.table}>
        <View style={S.tableHeader}>
          <Text style={[S.tableHeaderCell, { flex: 1 }]}>Period</Text>
          <Text style={[S.tableHeaderCell, { flex: 1, textAlign: "right" }]}>Certified</Text>
          <Text style={[S.tableHeaderCell, { flex: 1, textAlign: "right" }]}>Paid</Text>
          <Text style={[S.tableHeaderCell, { flex: 1, textAlign: "right" }]}>Outstanding</Text>
        </View>
        {data.cash_position.map((row, i) => (
          <View key={i} style={S.tableRow}>
            <Text style={[S.tableCell, { flex: 1 }]}>{row.period}</Text>
            <Text style={[S.tableCell, { flex: 1, textAlign: "right" }]}>{formatCurrencyPdf(row.certified)}</Text>
            <Text style={[S.tableCell, { flex: 1, textAlign: "right" }]}>{formatCurrencyPdf(row.paid)}</Text>
            <Text style={[S.tableCell, { flex: 1, textAlign: "right", color: row.certified - row.paid > 0 ? "#d97706" : "#16a34a" }]}>
              {formatCurrencyPdf(row.certified - row.paid)}
            </Text>
          </View>
        ))}
      </View>

      <PdfFooter period={data.period} />
    </Page>
  );
}

// ─── Risk Register ────────────────────────────────────────────────────────────

function RiskRegisterPage({ data }: { data: BoardPackData }) {
  const topRisks = [...data.risks].sort((a, b) => b.score - a.score).slice(0, 10);

  return (
    <Page size="A4" style={S.bodyPage}>
      <View style={S.pageHeader} fixed>
        <Text style={S.pageTitle}>Risk Summary — Top 10</Text>
        <Text style={S.pageMeta}>{data.period} · {data.workspace_name}</Text>
      </View>

      <View style={baseStyles.table}>
        <View style={S.tableHeader}>
          <Text style={[S.tableHeaderCell, { flex: 1.4 }]}>Project</Text>
          <Text style={[S.tableHeaderCell, { flex: 2.4 }]}>Description</Text>
          <Text style={[S.tableHeaderCell, { flex: 0.5, textAlign: "center" }]}>L</Text>
          <Text style={[S.tableHeaderCell, { flex: 0.5, textAlign: "center" }]}>I</Text>
          <Text style={[S.tableHeaderCell, { flex: 0.6, textAlign: "center" }]}>Score</Text>
        </View>
        {topRisks.map((r, i) => (
          <View key={i} style={S.tableRow}>
            <Text style={[S.tableCell, { flex: 1.4 }]}>{r.projectName}</Text>
            <Text style={[S.tableCell, { flex: 2.4 }]}>{r.description}</Text>
            <Text style={[S.tableCell, { flex: 0.5, textAlign: "center" }]}>{r.likelihood}</Text>
            <Text style={[S.tableCell, { flex: 0.5, textAlign: "center" }]}>{r.impact}</Text>
            <Text style={[S.tableCell, { flex: 0.6, textAlign: "center", fontWeight: 700, color: r.score >= 15 ? "#dc2626" : r.score >= 10 ? "#d97706" : "#16a34a" }]}>
              {r.score}
            </Text>
          </View>
        ))}
      </View>

      <PdfFooter period={data.period} />
    </Page>
  );
}

// ─── Appendix ─────────────────────────────────────────────────────────────────

function AppendixPage({ data }: { data: BoardPackData }) {
  return (
    <Page size="A4" style={S.bodyPage}>
      <View style={S.pageHeader} fixed>
        <Text style={S.pageTitle}>Appendix — Individual Project KPIs</Text>
        <Text style={S.pageMeta}>{data.period} · {data.workspace_name}</Text>
      </View>

      <View style={baseStyles.table}>
        <View style={S.tableHeader}>
          <Text style={[S.tableHeaderCell, { flex: 2 }]}>Project</Text>
          <Text style={[S.tableHeaderCell, { flex: 1, textAlign: "right" }]}>Contract Sum</Text>
          <Text style={[S.tableHeaderCell, { flex: 0.7, textAlign: "center" }]}>% Done</Text>
          <Text style={[S.tableHeaderCell, { flex: 0.7, textAlign: "center" }]}>Margin</Text>
          <Text style={[S.tableHeaderCell, { flex: 0.5, textAlign: "center" }]}>RAG</Text>
        </View>
        {data.projects.map((p, i) => (
          <View key={i} style={S.tableRow}>
            <Text style={[S.tableCell, { flex: 2 }]}>{p.name}</Text>
            <Text style={[S.tableCell, { flex: 1, textAlign: "right" }]}>{formatCurrencyPdf(p.contractSum)}</Text>
            <Text style={[S.tableCell, { flex: 0.7, textAlign: "center" }]}>{p.percentComplete}%</Text>
            <Text style={[S.tableCell, { flex: 0.7, textAlign: "center" }]}>{p.marginPct.toFixed(1)}%</Text>
            <Text style={[S.tableCell, { flex: 0.5, textAlign: "center", fontWeight: 700, color: ragColor(p.ragStatus) }]}>
              {p.ragStatus}
            </Text>
          </View>
        ))}
      </View>

      <PdfFooter period={data.period} />
    </Page>
  );
}

// ─── Root Document ────────────────────────────────────────────────────────────

function BoardPackDocument({ data }: { data: BoardPackData }) {
  return (
    <Document title={`Board Pack — ${data.period}`} author="MeasureDeck">
      <CoverPage period={data.period} workspace_name={data.workspace_name} />
      <ExecutiveSummaryPage data={data} />
      <ProjectSummariesPage data={data} />
      {data.ce_summary.length > 0 && <CERegisterPage data={data} />}
      {data.cash_position.length > 0 && <CashPositionPage data={data} />}
      {data.risks.length > 0 && <RiskRegisterPage data={data} />}
      <AppendixPage data={data} />
    </Document>
  );
}

// ─── Export function ──────────────────────────────────────────────────────────

export async function generateBoardPackPDF(data: BoardPackData): Promise<Buffer> {
  const buf = await renderToBuffer(<BoardPackDocument data={data} />);
  return Buffer.from(buf);
}

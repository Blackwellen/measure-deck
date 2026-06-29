import PptxGenJS from "pptxgenjs";
import type {
  BoardPackData,
  ProjectSummary,
  PortfolioKPIs,
  CESummary,
  CashPositionRow,
} from "./pdf-generator";

export type { BoardPackData };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtGBP(n: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function ragHex(rag: ProjectSummary["ragStatus"]): string {
  return rag === "G" ? "16A34A" : rag === "A" ? "D97706" : "DC2626";
}

// ─── Slide builders ───────────────────────────────────────────────────────────

function addCoverSlide(pptx: PptxGenJS, data: BoardPackData): void {
  const slide = pptx.addSlide();
  slide.background = { color: "0F172A" };

  slide.addText("MEASUREDECK", {
    x: 0.5,
    y: 1.2,
    w: 9,
    h: 0.3,
    fontSize: 9,
    bold: true,
    color: "2563EB",
    align: "center",
    charSpacing: 4,
  });

  slide.addText("Board Report", {
    x: 0.5,
    y: 1.7,
    w: 9,
    h: 0.8,
    fontSize: 36,
    bold: true,
    color: "F8FAFC",
    align: "center",
  });

  slide.addText(data.period, {
    x: 0.5,
    y: 2.6,
    w: 9,
    h: 0.4,
    fontSize: 18,
    color: "94A3B8",
    align: "center",
  });

  slide.addText(data.workspace_name, {
    x: 0.5,
    y: 3.4,
    w: 9,
    h: 0.3,
    fontSize: 12,
    color: "CBD5E1",
    align: "center",
  });

  slide.addText("Strictly Confidential · Prepared by MeasureDeck", {
    x: 0.5,
    y: 4.5,
    w: 9,
    h: 0.25,
    fontSize: 8,
    color: "475569",
    align: "center",
  });
}

function addKPISlide(pptx: PptxGenJS, data: BoardPackData): void {
  const slide = pptx.addSlide();
  slide.background = { color: "FFFFFF" };

  slide.addText("Portfolio KPIs", {
    x: 0.4,
    y: 0.2,
    w: 9.2,
    h: 0.45,
    fontSize: 18,
    bold: true,
    color: "0F172A",
  });

  slide.addText(data.period, {
    x: 0.4,
    y: 0.65,
    w: 9.2,
    h: 0.25,
    fontSize: 10,
    color: "64748B",
  });

  const kpis: Array<{ label: string; value: string }> = [
    { label: "Contract Value", value: fmtGBP(data.portfolio_kpis.contractValue) },
    { label: "Certified to Date", value: fmtGBP(data.portfolio_kpis.certifiedToDate) },
    { label: "Paid to Date", value: fmtGBP(data.portfolio_kpis.paidToDate) },
    { label: "Avg Margin %", value: `${data.portfolio_kpis.avgMarginPct.toFixed(1)}%` },
    { label: "Active CEs", value: String(data.portfolio_kpis.activeCEs) },
    { label: "Overdue Payments", value: String(data.portfolio_kpis.overduePayments) },
  ];

  const cols = 3;
  const cardW = 3.0;
  const cardH = 1.1;
  const gapX = 0.1;
  const gapY = 0.15;
  const startX = 0.4;
  const startY = 1.1;

  kpis.forEach((kpi, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = startX + col * (cardW + gapX);
    const y = startY + row * (cardH + gapY);

    slide.addShape(pptx.ShapeType.rect, {
      x,
      y,
      w: cardW,
      h: cardH,
      fill: { color: "F8FAFC" },
      line: { color: "E2E8F0", width: 0.75 },
    });

    slide.addText(kpi.label.toUpperCase(), {
      x: x + 0.15,
      y: y + 0.1,
      w: cardW - 0.3,
      h: 0.25,
      fontSize: 7,
      bold: true,
      color: "64748B",
      charSpacing: 0.5,
    });

    slide.addText(kpi.value, {
      x: x + 0.15,
      y: y + 0.38,
      w: cardW - 0.3,
      h: 0.5,
      fontSize: 18,
      bold: true,
      color: "0F172A",
    });
  });
}

function addProjectSlide(pptx: PptxGenJS, project: ProjectSummary, data: BoardPackData): void {
  const slide = pptx.addSlide();
  slide.background = { color: "FFFFFF" };

  slide.addText(project.name, {
    x: 0.4,
    y: 0.2,
    w: 7.8,
    h: 0.5,
    fontSize: 20,
    bold: true,
    color: "0F172A",
  });

  slide.addShape(pptx.ShapeType.rect, {
    x: 8.4,
    y: 0.25,
    w: 1.2,
    h: 0.35,
    fill: { color: ragHex(project.ragStatus) },
    line: { color: ragHex(project.ragStatus), width: 0 },
  });

  const ragLabel = project.ragStatus === "G" ? "ON TRACK" : project.ragStatus === "A" ? "AT RISK" : "CRITICAL";
  slide.addText(ragLabel, {
    x: 8.4,
    y: 0.25,
    w: 1.2,
    h: 0.35,
    fontSize: 8,
    bold: true,
    color: "FFFFFF",
    align: "center",
    valign: "middle",
  });

  slide.addText(`${data.period} · ${data.workspace_name}`, {
    x: 0.4,
    y: 0.72,
    w: 9.2,
    h: 0.25,
    fontSize: 9,
    color: "64748B",
  });

  const kpis: Array<{ label: string; value: string }> = [
    { label: "Contract Sum", value: fmtGBP(project.contractSum) },
    { label: "% Complete", value: `${project.percentComplete}%` },
    { label: "Margin %", value: `${project.marginPct.toFixed(1)}%` },
  ];

  kpis.forEach((kpi, i) => {
    const x = 0.4 + i * 3.25;
    const y = 1.1;

    slide.addShape(pptx.ShapeType.rect, {
      x,
      y,
      w: 3.0,
      h: 1.1,
      fill: { color: "F8FAFC" },
      line: { color: "E2E8F0", width: 0.75 },
    });

    slide.addText(kpi.label.toUpperCase(), {
      x: x + 0.15,
      y: y + 0.1,
      w: 2.7,
      h: 0.25,
      fontSize: 7,
      bold: true,
      color: "64748B",
      charSpacing: 0.5,
    });

    slide.addText(kpi.value, {
      x: x + 0.15,
      y: y + 0.38,
      w: 2.7,
      h: 0.5,
      fontSize: 20,
      bold: true,
      color: "0F172A",
    });
  });

  slide.addText(`Start: ${project.startDate}   |   End: ${project.endDate}`, {
    x: 0.4,
    y: 2.45,
    w: 9.2,
    h: 0.25,
    fontSize: 9,
    color: "64748B",
  });
}

function addCEPipelineSlide(pptx: PptxGenJS, data: BoardPackData): void {
  const slide = pptx.addSlide();
  slide.background = { color: "FFFFFF" };

  slide.addText("CE Pipeline", {
    x: 0.4,
    y: 0.2,
    w: 9.2,
    h: 0.45,
    fontSize: 18,
    bold: true,
    color: "0F172A",
  });

  slide.addText(data.period, {
    x: 0.4,
    y: 0.65,
    w: 9.2,
    h: 0.25,
    fontSize: 10,
    color: "64748B",
  });

  const statuses = ["Quotation Submitted", "Accepted", "Implemented"];
  const counts = statuses.map(s => data.ce_summary.filter(ce => ce.status === s).length);
  const maxCount = Math.max(...counts, 1);
  const colors = ["D97706", "16A34A", "2563EB"];

  statuses.forEach((status, i) => {
    const y = 1.2 + i * 0.9;
    const barW = (counts[i] / maxCount) * 7.0;

    slide.addShape(pptx.ShapeType.rect, {
      x: 2.0,
      y: y + 0.1,
      w: Math.max(barW, 0.1),
      h: 0.5,
      fill: { color: colors[i] },
      line: { color: colors[i], width: 0 },
    });

    slide.addText(status, {
      x: 0.4,
      y,
      w: 1.5,
      h: 0.7,
      fontSize: 9,
      color: "334155",
      valign: "middle",
    });

    slide.addText(String(counts[i]), {
      x: 2.0 + Math.max(barW, 0.1) + 0.1,
      y: y + 0.1,
      w: 0.5,
      h: 0.5,
      fontSize: 11,
      bold: true,
      color: "0F172A",
      valign: "middle",
    });
  });
}

function addCashPositionSlide(pptx: PptxGenJS, data: BoardPackData): void {
  if (data.cash_position.length === 0) return;

  const slide = pptx.addSlide();
  slide.background = { color: "FFFFFF" };

  slide.addText("Cash Position", {
    x: 0.4,
    y: 0.2,
    w: 9.2,
    h: 0.45,
    fontSize: 18,
    bold: true,
    color: "0F172A",
  });

  slide.addText(data.period, {
    x: 0.4,
    y: 0.65,
    w: 9.2,
    h: 0.25,
    fontSize: 10,
    color: "64748B",
  });

  const headers = ["Period", "Certified", "Paid", "Outstanding"];
  const colWidths = [2.0, 2.2, 2.2, 2.2];
  const startX = 0.4;
  const headerY = 1.1;

  headers.forEach((h, i) => {
    const x = startX + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
    slide.addShape(pptx.ShapeType.rect, {
      x,
      y: headerY,
      w: colWidths[i],
      h: 0.35,
      fill: { color: "F8FAFC" },
      line: { color: "E2E8F0", width: 0.75 },
    });
    slide.addText(h.toUpperCase(), {
      x: x + 0.05,
      y: headerY + 0.05,
      w: colWidths[i] - 0.1,
      h: 0.25,
      fontSize: 7,
      bold: true,
      color: "64748B",
      charSpacing: 0.5,
    });
  });

  data.cash_position.forEach((row, ri) => {
    const y = headerY + 0.35 + ri * 0.38;
    const cells = [row.period, fmtGBP(row.certified), fmtGBP(row.paid), fmtGBP(row.certified - row.paid)];
    cells.forEach((cell, ci) => {
      const x = startX + colWidths.slice(0, ci).reduce((a, b) => a + b, 0);
      slide.addShape(pptx.ShapeType.rect, {
        x,
        y,
        w: colWidths[ci],
        h: 0.35,
        fill: { color: ri % 2 === 0 ? "FFFFFF" : "F8FAFC" },
        line: { color: "F1F5F9", width: 0.5 },
      });
      slide.addText(cell, {
        x: x + 0.05,
        y: y + 0.05,
        w: colWidths[ci] - 0.1,
        h: 0.25,
        fontSize: 9,
        color: ci === 3 && row.certified - row.paid > 0 ? "D97706" : "1E293B",
        bold: ci === 3,
      });
    });
  });
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function generateBoardPackPPTX(data: BoardPackData): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = `Board Report — ${data.period}`;
  pptx.subject = "Portfolio Board Pack";
  pptx.author = "MeasureDeck";
  pptx.company = data.workspace_name;

  addCoverSlide(pptx, data);
  addKPISlide(pptx, data);
  data.projects.forEach(p => addProjectSlide(pptx, p, data));
  addCEPipelineSlide(pptx, data);
  addCashPositionSlide(pptx, data);

  const result = await pptx.write({ outputType: "nodebuffer" });
  return Buffer.from(result as ArrayBuffer);
}

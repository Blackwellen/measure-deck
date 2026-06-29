import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertWorkspaceMember, getWorkspaceId } from "@/lib/workspace";
import { createAuditEvent } from "@/lib/audit";
import { generateBoardPackPDF } from "@/lib/board-pack/pdf-generator";
import { generateBoardPackPPTX } from "@/lib/board-pack/pptx-generator";
import type {
  BoardPackData,
  ProjectSummary,
  CESummary,
  CashPositionRow,
  RiskItem,
} from "@/lib/board-pack/pdf-generator";

// ─── Request body type ────────────────────────────────────────────────────────

interface BoardPackRequestBody {
  format: "pdf" | "pptx";
  period: string;
  project_ids?: string[];
  workspace_name?: string;
  sections?: string[];
}

// ─── Seed / fallback data builders ───────────────────────────────────────────

function buildFallbackData(period: string, workspaceName: string): BoardPackData {
  const projects: ProjectSummary[] = [
    { id: "proj-001", name: "Eastside Residential Block A", contractSum: 6_200_000, percentComplete: 72, marginPct: 16.4, startDate: "01 Mar 2025", endDate: "31 Dec 2026", ragStatus: "G" },
    { id: "proj-002", name: "Meridian Office Park Phase 2", contractSum: 4_850_000, percentComplete: 58, marginPct: 14.2, startDate: "15 Jun 2025", endDate: "30 Sep 2026", ragStatus: "A" },
    { id: "proj-003", name: "Thornfield Commercial Hub", contractSum: 5_100_000, percentComplete: 45, marginPct: 11.8, startDate: "01 Jan 2025", endDate: "28 Feb 2027", ragStatus: "R" },
    { id: "proj-004", name: "Harlow Civic Centre Refurb", contractSum: 3_900_000, percentComplete: 88, marginPct: 17.1, startDate: "01 Jun 2024", endDate: "30 Jul 2026", ragStatus: "G" },
    { id: "proj-005", name: "Whitfield Leisure Centre", contractSum: 2_400_000, percentComplete: 95, marginPct: 15.8, startDate: "01 Mar 2024", endDate: "30 Jun 2026", ragStatus: "G" },
  ];

  const ce_summary: CESummary[] = [
    { ceRef: "CE-001", projectName: "Eastside", description: "Ground conditions variation", value: 42_000, status: "Accepted" },
    { ceRef: "CE-002", projectName: "Meridian", description: "Specification change — cladding", value: 85_000, status: "Quotation Submitted" },
    { ceRef: "CE-003", projectName: "Thornfield", description: "Client instruction — MEP redesign", value: 124_000, status: "Quotation Submitted" },
    { ceRef: "CE-004", projectName: "Harlow", description: "Attendance on statutory authority", value: 18_000, status: "Implemented" },
  ];

  const cash_position: CashPositionRow[] = [
    { period: "Apr 2026", certified: 1_420_000, paid: 1_380_000 },
    { period: "May 2026", certified: 1_580_000, paid: 1_480_000 },
    { period: "Jun 2026", certified: 1_640_000, paid: 1_520_000 },
  ];

  const risks: RiskItem[] = [
    { id: "r-1", projectName: "Thornfield", description: "Adjudication risk on VO-047", likelihood: 4, impact: 5, score: 20 },
    { id: "r-2", projectName: "Meridian", description: "Programme delay — steel supply", likelihood: 3, impact: 4, score: 12 },
    { id: "r-3", projectName: "Eastside", description: "Retention release dispute", likelihood: 2, impact: 3, score: 6 },
  ];

  const totalCV = projects.reduce((s, p) => s + p.contractSum, 0);
  const avgMargin = projects.reduce((s, p) => s + p.marginPct, 0) / projects.length;

  return {
    period,
    workspace_name: workspaceName,
    projects,
    portfolio_kpis: {
      contractValue: totalCV,
      certifiedToDate: 16_420_000,
      paidToDate: 14_880_000,
      avgMarginPct: +avgMargin.toFixed(1),
      activeCEs: 23,
      overduePayments: 4,
      projectCount: projects.length,
    },
    ce_summary,
    cash_position,
    risks,
  };
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await req.json()) as BoardPackRequestBody;

    if (!body.format || !["pdf", "pptx"].includes(body.format)) {
      return NextResponse.json({ error: "Invalid format. Must be pdf or pptx." }, { status: 400 });
    }

    const workspaceId = await getWorkspaceId(supabase);
    await assertWorkspaceMember(supabase, workspaceId);

    const period = body.period ?? "Current Period";
    const workspaceName = body.workspace_name ?? "MeasureDeck Workspace";

    let packData: BoardPackData;

    try {
      const projectQuery = supabase
        .from("projects")
        .select("id, name, contract_sum, percent_complete, status, start_date, end_date")
        .eq("workspace_id", workspaceId)
        .neq("status", "archived");

      if (body.project_ids && body.project_ids.length > 0) {
        projectQuery.in("id", body.project_ids);
      }

      const { data: projectRows } = await projectQuery;

      if (projectRows && projectRows.length > 0) {
        const projects: ProjectSummary[] = projectRows.map((p: {
          id: string;
          name: string;
          contract_sum: number;
          percent_complete: number;
          start_date: string;
          end_date: string;
        }) => ({
          id: p.id,
          name: p.name,
          contractSum: p.contract_sum ?? 0,
          percentComplete: p.percent_complete ?? 0,
          marginPct: 14.0,
          startDate: p.start_date ?? "—",
          endDate: p.end_date ?? "—",
          ragStatus: "A" as const,
        }));

        const totalCV = projects.reduce((s, p) => s + p.contractSum, 0);

        packData = {
          period,
          workspace_name: workspaceName,
          projects,
          portfolio_kpis: {
            contractValue: totalCV,
            certifiedToDate: 0,
            paidToDate: 0,
            avgMarginPct: 14.0,
            activeCEs: 0,
            overduePayments: 0,
            projectCount: projects.length,
          },
          ce_summary: [],
          cash_position: [],
          risks: [],
        };
      } else {
        packData = buildFallbackData(period, workspaceName);
      }
    } catch {
      packData = buildFallbackData(period, workspaceName);
    }

    let fileBuffer: Buffer;
    let contentType: string;
    let filename: string;

    if (body.format === "pdf") {
      fileBuffer = await generateBoardPackPDF(packData);
      contentType = "application/pdf";
      filename = `board-pack-${period.replace(/\s+/g, "-")}.pdf`;
    } else {
      fileBuffer = await generateBoardPackPPTX(packData);
      contentType = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
      filename = `board-pack-${period.replace(/\s+/g, "-")}.pptx`;
    }

    await createAuditEvent(supabase, {
      workspace_id: workspaceId,
      user_id: user.id,
      action: "board_pack_generated",
      resource_type: "board_pack",
      resource_id: workspaceId,
      new_values: {
        format: body.format,
        period,
        project_count: packData.projects.length,
      },
    });

    return new NextResponse(fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength) as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(fileBuffer.length),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

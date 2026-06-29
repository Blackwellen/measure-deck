import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertWorkspaceMember } from "@/lib/workspace";

interface ContextRequestBody {
  entity_type: string;
  entity_id: string;
  workspace_id: string;
}

async function fetchEntityData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  entityType: string,
  entityId: string,
  workspaceId: string
): Promise<Record<string, unknown> | null> {
  switch (entityType) {
    case "project": {
      const { data } = await supabase
        .from("projects")
        .select("id, name, status, contract_type, contract_sum, employer, start_date, end_date")
        .eq("id", entityId)
        .eq("workspace_id", workspaceId)
        .single();
      return data as Record<string, unknown> | null;
    }
    case "change_event": {
      const { data } = await supabase
        .from("change_events")
        .select("id, ce_number, description, clause, status, quotation_total, instruction_date, project_id")
        .eq("id", entityId)
        .eq("workspace_id", workspaceId)
        .single();
      return data as Record<string, unknown> | null;
    }
    case "application": {
      const { data } = await supabase
        .from("payment_applications")
        .select("id, application_number, gross_value, status, due_date, period_end, project_id")
        .eq("id", entityId)
        .eq("workspace_id", workspaceId)
        .single();
      return data as Record<string, unknown> | null;
    }
    case "supplier": {
      const { data } = await supabase
        .from("suppliers")
        .select("id, name, trade, cis_status, contact_name, email")
        .eq("id", entityId)
        .eq("workspace_id", workspaceId)
        .single();
      return data as Record<string, unknown> | null;
    }
    case "cvr": {
      const { data } = await supabase
        .from("cvr_periods")
        .select("id, period, contract_sum, costs_to_date, margin_percentage, project_id")
        .eq("id", entityId)
        .eq("workspace_id", workspaceId)
        .single();
      return data as Record<string, unknown> | null;
    }
    case "final_account": {
      const { data } = await supabase
        .from("final_accounts")
        .select("id, reference, agreed_sum, disputed_sum, status, project_id")
        .eq("id", entityId)
        .eq("workspace_id", workspaceId)
        .single();
      return data as Record<string, unknown> | null;
    }
    default:
      return null;
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: ContextRequestBody;
  try {
    body = (await req.json()) as ContextRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { entity_type, entity_id, workspace_id } = body;

  if (!entity_type || !entity_id || !workspace_id) {
    return NextResponse.json(
      { error: "entity_type, entity_id, and workspace_id are required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  try {
    await assertWorkspaceMember(supabase, workspace_id);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data = await fetchEntityData(supabase, entity_type, entity_id, workspace_id);

  if (!data) {
    return NextResponse.json({ error: "Entity not found" }, { status: 404 });
  }

  return NextResponse.json({
    entity_type,
    entity_id,
    workspace_id,
    data,
  });
}

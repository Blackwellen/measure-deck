import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertWorkspaceMember } from "@/lib/workspace";
import { createAuditEvent } from "@/lib/audit";

interface SendInviteBody {
  application_id: string;
  email: string;
  workspace_id: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SendInviteBody;
  try {
    body = (await request.json()) as SendInviteBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { application_id, email, workspace_id } = body;

  if (!application_id || !email || !workspace_id) {
    return NextResponse.json({ error: "Missing required fields: application_id, email, workspace_id" }, { status: 400 });
  }

  if (!email.includes("@")) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  try {
    await assertWorkspaceMember(supabase, workspace_id);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: appData, error: appError } = await supabase
    .from("applications")
    .select("id, workspace_id, project_id")
    .eq("id", application_id)
    .eq("workspace_id", workspace_id)
    .single();

  const application = appData as { id: string; workspace_id: string; project_id: string } | null;

  if (appError || !application) {
    return NextResponse.json({ error: "Application not found or access denied" }, { status: 404 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/send-portal-invite`;

  const edgeRes = await fetch(edgeFunctionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      email,
      project_id: application.project_id,
      application_id,
      workspace_id,
      invited_by_user_id: user.id,
    }),
  });

  if (!edgeRes.ok) {
    const errBody = (await edgeRes.json().catch(() => ({ error: "Unknown error" }))) as { error?: string };
    return NextResponse.json({ error: errBody.error ?? "Failed to send invite" }, { status: 502 });
  }

  const result = (await edgeRes.json()) as { success: boolean; token: string; expires_at: string };

  await createAuditEvent(supabase, {
    workspace_id,
    user_id: user.id,
    action: "portal_invite_sent",
    resource_type: "application",
    resource_id: application_id,
    new_values: { email, expires_at: result.expires_at },
    ip_address: request.headers.get("x-forwarded-for") ?? undefined,
  });

  return NextResponse.json({
    success: true,
    invite_sent_at: new Date().toISOString(),
  });
}

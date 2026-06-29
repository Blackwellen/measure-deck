import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

const CRON_SECRET = process.env.CRON_SECRET;
const DAYS_AHEAD = 3;

interface CEWorkflowRow {
  id: string;
  ce_number: string;
  title: string;
  workspace_id: string;
  response_required_by: string | null;
  projects: { name: string } | null;
  workspace_memberships: { user_id: string }[];
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("x-cron-secret");
  if (CRON_SECRET && authHeader !== CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const now = new Date();
  const cutoff = new Date(now.getTime() + DAYS_AHEAD * 24 * 60 * 60 * 1000);

  const { data: ceRows, error } = await supabase
    .from("ce_workflow_states")
    .select(`
      id,
      ce_number,
      title,
      workspace_id,
      response_required_by,
      projects(name),
      workspace_memberships!inner(user_id)
    `)
    .not("response_required_by", "is", null)
    .lte("response_required_by", cutoff.toISOString())
    .gte("response_required_by", now.toISOString())
    .in("status", ["submitted", "under_assessment"]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let created = 0;

  for (const ce of (ceRows ?? []) as unknown as CEWorkflowRow[]) {
    const daysLeft = Math.ceil(
      (new Date(ce.response_required_by!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    const members = ce.workspace_memberships ?? [];
    for (const member of members) {
      await createNotification(supabase, {
        workspace_id: ce.workspace_id,
        recipient_user_id: member.user_id,
        type: "deadline",
        title: `CE Deadline: ${ce.ce_number} — ${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining`,
        body: `${ce.title}${ce.projects?.name ? ` on ${ce.projects.name}` : ""} — response required by ${new Date(ce.response_required_by!).toLocaleDateString("en-GB")}.`,
        action_url: `/app/changes/${ce.id}`,
        urgency: daysLeft <= 1 ? "critical" : "high",
      });
      created++;
    }
  }

  return NextResponse.json({ success: true, notifications_created: created });
}

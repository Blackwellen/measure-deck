import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "@/lib/notifications";

const CRON_SECRET = process.env.CRON_SECRET;
const DAYS_AHEAD = 3;

interface ApplicationRow {
  id: string;
  application_number: string;
  workspace_id: string;
  pln_cutoff_date: string | null;
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

  const { data: appRows, error } = await supabase
    .from("applications")
    .select(`
      id,
      application_number,
      workspace_id,
      pln_cutoff_date,
      projects(name),
      workspace_memberships!inner(user_id)
    `)
    .not("pln_cutoff_date", "is", null)
    .lte("pln_cutoff_date", cutoff.toISOString())
    .gte("pln_cutoff_date", now.toISOString())
    .in("status", ["submitted", "certified"]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let created = 0;

  for (const app of (appRows ?? []) as unknown as ApplicationRow[]) {
    const daysLeft = Math.ceil(
      (new Date(app.pln_cutoff_date!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    const members = app.workspace_memberships ?? [];
    for (const member of members) {
      await createNotification(supabase, {
        workspace_id: app.workspace_id,
        recipient_user_id: member.user_id,
        type: "deadline",
        title: `PLN Cutoff: Application ${app.application_number} — ${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining`,
        body: `Pay Less Notice cutoff date is ${new Date(app.pln_cutoff_date!).toLocaleDateString("en-GB")}${app.projects?.name ? ` for ${app.projects.name}` : ""}. Issue PLN before this date if disputed.`,
        action_url: `/app/applications/${app.id}`,
        urgency: daysLeft <= 1 ? "critical" : "high",
      });
      created++;
    }
  }

  return NextResponse.json({ success: true, notifications_created: created });
}

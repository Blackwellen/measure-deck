import type { SupabaseClient } from "@supabase/supabase-js";

export async function createNotification(
  supabase: SupabaseClient,
  params: {
    workspace_id: string;
    recipient_user_id: string;
    type: string;
    title: string;
    body: string;
    action_url?: string;
    urgency?: "low" | "medium" | "high" | "critical";
  }
): Promise<void> {
  try {
    // Deduplicate: skip if same type + action_url exists for user in last 24h
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from("notifications")
      .select("id")
      .eq("recipient_user_id", params.recipient_user_id)
      .eq("type", params.type)
      .eq("action_url", params.action_url ?? "")
      .gte("created_at", cutoff)
      .limit(1);

    if (existing && existing.length > 0) return;

    await supabase.from("notifications").insert({
      workspace_id: params.workspace_id,
      recipient_user_id: params.recipient_user_id,
      type: params.type,
      title: params.title,
      body: params.body,
      action_url: params.action_url ?? null,
      urgency: params.urgency ?? "low",
      read: false,
    });
  } catch {
    // intentionally swallowed
  }
}

export async function getUnreadCount(
  supabase: SupabaseClient,
  recipient_user_id: string
): Promise<number> {
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_user_id", recipient_user_id)
    .eq("read", false);

  return count ?? 0;
}

export async function markAllRead(
  supabase: SupabaseClient,
  recipient_user_id: string
): Promise<void> {
  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("recipient_user_id", recipient_user_id)
    .eq("read", false);
}

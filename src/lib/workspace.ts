import type { SupabaseClient } from "@supabase/supabase-js";

export async function getWorkspaceId(supabase: SupabaseClient): Promise<string> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw new Error("Unauthenticated");

  const { data, error } = await supabase
    .from("workspace_memberships")
    .select("workspace_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (error || !data) throw new Error("No workspace found for user");

  return data.workspace_id as string;
}

export async function assertWorkspaceMember(
  supabase: SupabaseClient,
  workspace_id: string
): Promise<void> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) throw new Error("Forbidden");

  const { data } = await supabase
    .from("workspace_memberships")
    .select("workspace_id")
    .eq("user_id", user.id)
    .eq("workspace_id", workspace_id)
    .limit(1)
    .single();

  if (!data) throw new Error("Forbidden");
}

import type { SupabaseClient } from "@supabase/supabase-js";

type Action = "read" | "write" | "delete" | "admin";
type Resource =
  | "project"
  | "change_event"
  | "application"
  | "supplier"
  | "subcontract"
  | "cis_return"
  | "pc_certificate"
  | "adjudication";

// Role hierarchy: admin > member > viewer
const ROLE_PERMISSIONS: Record<string, Set<Action>> = {
  admin: new Set(["read", "write", "delete", "admin"]),
  member: new Set(["read", "write"]),
  viewer: new Set(["read"]),
};

export async function canPerformAction(
  supabase: SupabaseClient,
  params: { workspace_id: string; action: Action; resource: Resource }
): Promise<boolean> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) return false;

  const { data } = await supabase
    .from("workspace_memberships")
    .select("role")
    .eq("user_id", user.id)
    .eq("workspace_id", params.workspace_id)
    .limit(1)
    .single();

  if (!data) return false;

  const role = (data.role as string) ?? "viewer";
  const allowed = ROLE_PERMISSIONS[role] ?? ROLE_PERMISSIONS["viewer"];

  // resource param reserved for future resource-level ACL — currently role-only
  void params.resource;

  return allowed.has(params.action);
}

import { createAdminClient } from "@/lib/supabase/admin";
import { AdminUsersClient } from "./users-client";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = createAdminClient();

  const { data: users, error } = await supabase
    .from("profiles")
    .select(
      "id,full_name,email,created_at,last_sign_in_at,is_platform_admin,is_suspended,mfa_enabled,workspace_memberships(workspace_id,role,workspaces(id,name,plan))"
    )
    .order("created_at", { ascending: false })
    .limit(200);

  return <AdminUsersClient users={users ?? []} error={error?.message ?? null} />;
}

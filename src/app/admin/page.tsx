import { createAdminClient } from "@/lib/supabase/admin";
import { AdminDashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const supabase = createAdminClient();

  const [
    { count: totalUsers },
    { count: totalWorkspaces },
    { data: recentUsers },
    { data: recentWorkspaces },
    { data: recentActivity },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("workspaces").select("*", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id,full_name,email,created_at,is_platform_admin")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("workspaces")
      .select("id,name,plan,created_at,is_suspended")
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("audit_logs")
      .select("id,action,resource_type,user_id,workspace_id,created_at,profiles(full_name,email)")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  // Build signup trend last 14 days
  const now = new Date();
  const signupTrend = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (13 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const count = (recentUsers ?? []).filter(
      (u) => u.created_at?.slice(0, 10) === dateStr
    ).length;
    return { date: dateStr, users: count };
  });

  const activeWorkspaces = (recentWorkspaces ?? []).filter(
    (w) => !w.is_suspended
  ).length;

  return (
    <AdminDashboardClient
      stats={{
        totalUsers: totalUsers ?? 0,
        totalWorkspaces: totalWorkspaces ?? 0,
        activeWorkspaces,
        mrr: 0,
        storageUsedGb: 0,
      }}
      signupTrend={signupTrend}
      recentActivity={(recentActivity ?? []) as any[]}
    />
  );
}

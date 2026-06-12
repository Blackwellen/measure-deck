import { createClient } from "@/lib/supabase/server";
import { AdminShellClient } from "./shell-client";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userData = user
    ? {
        name: user.user_metadata?.full_name ?? user.email ?? null,
        email: user.email ?? null,
        avatarUrl: user.user_metadata?.avatar_url ?? null,
      }
    : null;

  return <AdminShellClient user={userData}>{children}</AdminShellClient>;
}

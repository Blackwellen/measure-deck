import { createClient } from "@/lib/supabase/server";
import { ShellClient } from "./shell-client";
import { ErrorBoundary } from "@/components/ui/error-boundary";

export default async function AppLayout({
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

  return (
    <ErrorBoundary>
      <ShellClient user={userData}>{children}</ShellClient>
    </ErrorBoundary>
  );
}

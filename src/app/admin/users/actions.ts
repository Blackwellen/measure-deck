"use server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function suspendUser(
  userId: string,
  suspend: boolean
): Promise<{ error?: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("profiles")
      .update({ is_suspended: suspend })
      .eq("id", userId);
    if (error) return { error: error.message };
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function resetUserMFA(userId: string): Promise<{ error?: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("profiles")
      .update({ mfa_enabled: false })
      .eq("id", userId);
    if (error) return { error: error.message };
    return {};
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unknown error" };
  }
}

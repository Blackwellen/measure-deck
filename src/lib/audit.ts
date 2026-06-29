import type { SupabaseClient } from "@supabase/supabase-js";

export async function createAuditEvent(
  supabase: SupabaseClient,
  params: {
    workspace_id: string;
    user_id: string;
    action: string;
    resource_type: string;
    resource_id: string;
    old_values?: Record<string, unknown>;
    new_values?: Record<string, unknown>;
    ip_address?: string;
  }
): Promise<void> {
  // Silently swallow errors — audit failures must never break the main flow
  try {
    await supabase.from("audit_events").insert({
      workspace_id: params.workspace_id,
      user_id: params.user_id,
      action: params.action,
      resource_type: params.resource_type,
      resource_id: params.resource_id,
      old_values: params.old_values ?? null,
      new_values: params.new_values ?? null,
      ip_address: params.ip_address ?? null,
    });
  } catch {
    // intentionally swallowed
  }
}

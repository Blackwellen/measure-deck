import type { SupabaseClient } from "@supabase/supabase-js";

export async function createActivityEntry(
  supabase: SupabaseClient,
  params: {
    workspace_id: string;
    project_id?: string;
    actor_id: string;
    type: string;
    summary: string;
    entity_type: string;
    entity_id: string;
    metadata?: Record<string, unknown>;
  }
): Promise<void> {
  // Silently swallow errors — activity log failures must never break the main flow
  try {
    await supabase.from("activity_log").insert({
      workspace_id: params.workspace_id,
      project_id: params.project_id ?? null,
      actor_id: params.actor_id,
      type: params.type,
      summary: params.summary,
      entity_type: params.entity_type,
      entity_id: params.entity_id,
      metadata: params.metadata ?? null,
    });
  } catch {
    // intentionally swallowed
  }
}

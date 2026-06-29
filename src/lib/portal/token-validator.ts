import { createBrowserClient } from "@supabase/ssr";

export interface PortalToken {
  token: string;
  workspace_id: string;
  project_id: string;
  application_id?: string;
  email: string;
  expires_at: Date;
  is_used: boolean;
  created_at: Date;
}

export interface TokenValidationResult {
  valid: boolean;
  error?: "expired" | "not_found" | "already_used";
  token?: PortalToken;
}

type SupabaseBrowserClient = ReturnType<typeof createBrowserClient>;

export async function validatePortalToken(
  supabase: SupabaseBrowserClient,
  token: string
): Promise<TokenValidationResult> {
  const { data, error } = await supabase
    .from("portal_access_tokens")
    .select(
      "id, token, workspace_id, project_id, application_id, email_sent_to, expires_at, revoked_at, single_use, last_accessed_at, created_at"
    )
    .eq("token", token)
    .maybeSingle();

  if (error || !data) {
    return { valid: false, error: "not_found" };
  }

  const now = new Date();
  const expiresAt = new Date(data.expires_at as string);

  if (expiresAt < now) {
    return { valid: false, error: "expired" };
  }

  if (data.revoked_at) {
    return { valid: false, error: "already_used" };
  }

  if (data.single_use && data.last_accessed_at) {
    return { valid: false, error: "already_used" };
  }

  await supabase
    .from("portal_access_tokens")
    .update({ last_accessed_at: now.toISOString() })
    .eq("id", data.id as string);

  await supabase.from("portal_audit_log").insert({
    token_id: data.id,
    workspace_id: data.workspace_id,
    action: "token_validated",
    resource_type: "portal_access_token",
    resource_id: data.id,
  });

  const portalToken: PortalToken = {
    token: data.token as string,
    workspace_id: data.workspace_id as string,
    project_id: data.project_id as string,
    application_id: (data.application_id as string | null) ?? undefined,
    email: (data.email_sent_to as string | null) ?? "",
    expires_at: expiresAt,
    is_used: !!(data.single_use && data.last_accessed_at),
    created_at: new Date(data.created_at as string),
  };

  return { valid: true, token: portalToken };
}

export async function logPortalAccess(
  supabase: SupabaseBrowserClient,
  tokenId: string,
  workspaceId: string,
  action: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from("portal_audit_log").insert({
      token_id: tokenId,
      workspace_id: workspaceId,
      action,
      resource_type: metadata?.resource_type ?? null,
      resource_id: metadata?.resource_id ?? null,
    });
  } catch {
    // intentionally swallowed
  }
}

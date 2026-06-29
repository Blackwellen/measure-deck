import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface InvitePayload {
  email: string;
  project_id: string;
  application_id?: string;
  workspace_id: string;
  invited_by_user_id: string;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const resendKey = Deno.env.get("RESEND_API_KEY") ?? "";
  const siteUrl = Deno.env.get("NEXT_PUBLIC_URL") ?? "https://app.measuredeck.com";

  const supabase = createClient(supabaseUrl, serviceKey);

  let payload: InvitePayload;
  try {
    payload = (await req.json()) as InvitePayload;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { email, project_id, application_id, workspace_id, invited_by_user_id } = payload;

  if (!email || !project_id || !workspace_id || !invited_by_user_id) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, name, address")
    .eq("id", project_id)
    .eq("workspace_id", workspace_id)
    .single();

  if (projectError || !project) {
    return new Response(JSON.stringify({ error: "Project not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: tokenRow, error: insertError } = await supabase
    .from("portal_access_tokens")
    .insert({
      workspace_id,
      project_id,
      application_id: application_id ?? null,
      token,
      email_sent_to: email,
      scope: application_id ? "application" : "project",
      expires_at: expiresAt,
      single_use: false,
      created_by: invited_by_user_id,
      sent_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (insertError || !tokenRow) {
    return new Response(JSON.stringify({ error: "Failed to create portal token" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const portalUrl = `${siteUrl}/portal/${token}`;
  const projectName = project.name as string;

  const emailHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>MeasureDeck Client Portal Invitation</title>
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#FFFFFF;border-radius:12px;border:1px solid #E2E8F0;overflow:hidden;">
          <tr>
            <td style="background:#0D1B2E;padding:24px 32px;">
              <p style="margin:0;color:#FFFFFF;font-size:20px;font-weight:700;letter-spacing:-0.3px;">MeasureDeck</p>
              <p style="margin:4px 0 0;color:#94A3B8;font-size:13px;">Client Portal</p>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 32px;">
              <h1 style="margin:0 0 16px;color:#0F172A;font-size:24px;font-weight:700;line-height:1.3;">
                You have been invited to view ${projectName} on MeasureDeck
              </h1>
              <p style="margin:0 0 24px;color:#475569;font-size:15px;line-height:1.6;">
                Your contractor has shared a secure application valuation with you through MeasureDeck. Click the button below to access your dedicated client portal and review the details.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:32px 0;">
                <tr>
                  <td style="background:#3B5EE8;border-radius:8px;">
                    <a href="${portalUrl}" style="display:inline-block;padding:14px 32px;color:#FFFFFF;font-size:15px;font-weight:600;text-decoration:none;">
                      View Application
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 8px;color:#475569;font-size:14px;line-height:1.6;">
                Or copy this link into your browser:
              </p>
              <p style="margin:0 0 32px;color:#3B5EE8;font-size:13px;word-break:break-all;">
                ${portalUrl}
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF7ED;border:1px solid #FED7AA;border-radius:8px;margin:0;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;color:#92400E;font-size:13px;line-height:1.5;">
                      <strong>Security notice:</strong> This link expires in 7 days. Do not share it with anyone else. This link provides direct access to your project information.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:20px 32px;">
              <p style="margin:0;color:#94A3B8;font-size:12px;line-height:1.5;">
                Powered by MeasureDeck | Secure Document Access<br/>
                If you did not expect this email, please ignore it. No account is required.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const emailRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "MeasureDeck <noreply@measuredeck.com>",
      to: [email],
      subject: `You have been invited to view ${projectName} on MeasureDeck`,
      html: emailHtml,
    }),
  });

  if (!emailRes.ok) {
    return new Response(JSON.stringify({ error: "Failed to send email" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  await supabase.from("portal_audit_log").insert({
    token_id: tokenRow.id,
    workspace_id,
    action: "invite_sent",
    resource_type: "application",
    resource_id: application_id ?? null,
    ip_address: req.headers.get("x-forwarded-for") ?? null,
    user_agent: req.headers.get("user-agent") ?? null,
  });

  return new Response(
    JSON.stringify({ success: true, token, expires_at: expiresAt }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
});

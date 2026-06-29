import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type TemplateType = "deadline" | "payment" | "invite" | "general";

interface EmailRequest {
  to: string;
  subject: string;
  template: TemplateType;
  data: Record<string, unknown>;
}

function deadlineTemplate(data: Record<string, unknown>): string {
  const title = String(data.title ?? "Deadline");
  const daysLeft = Number(data.days_left ?? 0);
  const actionUrl = String(data.action_url ?? "#");
  const projectName = String(data.project_name ?? "your project");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Action Required</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#3b82f6;padding:24px 32px;">
              <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">MeasureDeck</p>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Construction Finance Platform</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <table cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;width:100%;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:13px;font-weight:600;color:#991b1b;text-transform:uppercase;letter-spacing:0.5px;">Action Required</p>
                    <p style="margin:4px 0 0;font-size:24px;font-weight:700;color:#7f1d1d;">${daysLeft} day${daysLeft !== 1 ? "s" : ""} remaining</p>
                  </td>
                </tr>
              </table>
              <h2 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0f172a;">${title}</h2>
              <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
                This deadline is approaching on <strong>${projectName}</strong>. Please review and take action to avoid contractual consequences.
              </p>
              <a href="${actionUrl}" style="display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
                View in MeasureDeck →
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #e2e8f0;background:#f8fafc;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">You are receiving this because you have deadline notifications enabled in MeasureDeck.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function paymentTemplate(data: Record<string, unknown>): string {
  const projectName = String(data.project_name ?? "your project");
  const amount = String(data.amount ?? "£0");
  const daysOverdue = Number(data.days_overdue ?? 0);
  const actionUrl = String(data.action_url ?? "#");
  const hgcraRef = String(data.hgcra_ref ?? "");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Payment Overdue</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#3b82f6;padding:24px 32px;">
              <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">MeasureDeck</p>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Construction Finance Platform</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0f172a;">Payment Overdue: ${projectName}</h2>
              <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">
                A payment application for <strong>${amount}</strong> is now <strong>${daysOverdue} days overdue</strong>.
                ${hgcraRef ? `Under HGCRA ${hgcraRef}, the paying party may be liable for interest on late payment.` : "Under the Housing Grants Act, the paying party may be liable for interest on late payment."}
              </p>
              <table cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;width:100%;margin-bottom:24px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <p style="margin:0;font-size:12px;font-weight:600;color:#166534;text-transform:uppercase;letter-spacing:0.5px;">Amount Due</p>
                    <p style="margin:4px 0 0;font-size:28px;font-weight:700;color:#15803d;">${amount}</p>
                    <p style="margin:4px 0 0;font-size:12px;color:#166534;">${daysOverdue} days past final date for payment</p>
                  </td>
                </tr>
              </table>
              <a href="${actionUrl}" style="display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">
                View Application →
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #e2e8f0;background:#f8fafc;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">You are receiving this because you have payment notifications enabled in MeasureDeck.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function inviteTemplate(data: Record<string, unknown>): string {
  const workspaceName = String(data.workspace_name ?? "a workspace");
  const inviterName = String(data.inviter_name ?? "Someone");
  const actionUrl = String(data.action_url ?? "#");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Workspace Invite</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#3b82f6;padding:24px 32px;">
              <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">MeasureDeck</p>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Construction Finance Platform</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;text-align:center;">
              <div style="width:64px;height:64px;background:#eff6ff;border-radius:50%;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;">
                <span style="font-size:28px;">🏗️</span>
              </div>
              <h2 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#0f172a;">You&apos;ve been invited to ${workspaceName}</h2>
              <p style="margin:0 0 28px;font-size:14px;color:#64748b;line-height:1.6;">
                <strong>${inviterName}</strong> has invited you to join the <strong>${workspaceName}</strong> workspace on MeasureDeck — the UK&apos;s construction finance platform.
              </p>
              <a href="${actionUrl}" style="display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:14px 32px;border-radius:8px;">
                Accept Invitation →
              </a>
              <p style="margin:20px 0 0;font-size:12px;color:#94a3b8;">This invitation expires in 7 days.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #e2e8f0;background:#f8fafc;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">If you did not expect this invitation, you can safely ignore this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function generalTemplate(data: Record<string, unknown>): string {
  const title = String(data.title ?? "Notification");
  const message = String(data.message ?? "");
  const actionUrl = data.action_url ? String(data.action_url) : null;
  const actionLabel = String(data.action_label ?? "View in MeasureDeck");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:#3b82f6;padding:24px 32px;">
              <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">MeasureDeck</p>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Construction Finance Platform</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h2 style="margin:0 0 12px;font-size:18px;font-weight:700;color:#0f172a;">${title}</h2>
              <p style="margin:0 0 24px;font-size:14px;color:#64748b;line-height:1.6;">${message}</p>
              ${actionUrl ? `<a href="${actionUrl}" style="display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;">${actionLabel} →</a>` : ""}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #e2e8f0;background:#f8fafc;">
              <p style="margin:0;font-size:12px;color:#94a3b8;">You are receiving this because you have notifications enabled in MeasureDeck.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildHtml(template: TemplateType, data: Record<string, unknown>): string {
  switch (template) {
    case "deadline": return deadlineTemplate(data);
    case "payment":  return paymentTemplate(data);
    case "invite":   return inviteTemplate(data);
    default:         return generalTemplate(data);
  }
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as EmailRequest;
    const { to, subject, template, data } = body;

    if (!to || !subject || !template) {
      return new Response(JSON.stringify({ error: "Missing required fields: to, subject, template" }), {
        status: 400,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const html = buildHtml(template, data ?? {});
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "notifications@measuredeck.com";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: fromEmail, to, subject, html }),
    });

    const resBody = await res.json() as Record<string, unknown>;

    if (!res.ok) {
      return new Response(JSON.stringify({ error: "Resend API error", detail: resBody }), {
        status: res.status,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: resBody.id }), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Internal error", detail: String(err) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});

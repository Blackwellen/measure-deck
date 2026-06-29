import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      to?: string;
      apiKey?: string;
      from?: string;
    };
    const { to, apiKey, from } = body;

    if (!to || !apiKey) {
      return NextResponse.json({ error: "Missing required fields: to, apiKey" }, { status: 400 });
    }

    const fromEmail = from || "notifications@measuredeck.com";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to,
        subject: "MeasureDeck — Email Integration Test",
        html: `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;">
        <tr><td style="background:#3b82f6;padding:24px 32px;">
          <p style="margin:0;color:#fff;font-size:20px;font-weight:700;">MeasureDeck</p>
        </td></tr>
        <tr><td style="padding:32px;">
          <h2 style="margin:0 0 12px;color:#0f172a;">Email Integration Working</h2>
          <p style="margin:0;color:#64748b;line-height:1.6;">
            This is a test email from MeasureDeck confirming your Resend email integration is configured correctly.
            Notification emails will be sent from <strong>${fromEmail}</strong>.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      }),
    });

    if (!res.ok) {
      const errBody = (await res.json()) as Record<string, unknown>;
      return NextResponse.json({ error: "Resend API error", detail: errBody }, { status: res.status });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

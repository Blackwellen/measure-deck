import { NextRequest, NextResponse } from "next/server";
import { sendSlackNotification } from "@/lib/integrations/webhook-sender";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { webhookUrl?: string; channel?: string };
    const { webhookUrl, channel } = body;

    if (!webhookUrl || !webhookUrl.startsWith("https://hooks.slack.com/")) {
      return NextResponse.json({ error: "Invalid Slack webhook URL" }, { status: 400 });
    }

    const ok = await sendSlackNotification(webhookUrl, {
      event_type: "test",
      title: "MeasureDeck — Test Notification",
      message: `Integration test from MeasureDeck. ${channel ? `Channel: ${channel}.` : ""} Your Slack integration is working correctly.`,
      urgency: "info",
    });

    if (!ok) {
      return NextResponse.json({ error: "Slack webhook returned an error" }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

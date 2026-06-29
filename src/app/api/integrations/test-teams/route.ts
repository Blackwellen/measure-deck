import { NextRequest, NextResponse } from "next/server";
import { sendTeamsNotification } from "@/lib/integrations/webhook-sender";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { webhookUrl?: string };
    const { webhookUrl } = body;

    if (!webhookUrl || !webhookUrl.startsWith("https://")) {
      return NextResponse.json({ error: "Invalid Teams webhook URL" }, { status: 400 });
    }

    const ok = await sendTeamsNotification(webhookUrl, {
      event_type: "test",
      title: "MeasureDeck — Test Notification",
      message: "Integration test from MeasureDeck. Your Microsoft Teams integration is working correctly.",
      urgency: "info",
    });

    if (!ok) {
      return NextResponse.json({ error: "Teams webhook returned an error" }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

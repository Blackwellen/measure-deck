import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/lib/integrations/webhook-sender";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      accountSid?: string;
      authToken?: string;
      fromNumber?: string;
      toNumber?: string;
    };
    const { accountSid, authToken, fromNumber, toNumber } = body;

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json({ error: "Missing Twilio credentials" }, { status: 400 });
    }

    const to = toNumber ?? fromNumber;

    const ok = await sendWhatsAppMessage({
      accountSid,
      authToken,
      fromNumber,
      toNumber: to,
      message: "MeasureDeck test message: Your WhatsApp integration is working correctly.",
    });

    if (!ok) {
      return NextResponse.json({ error: "Twilio returned an error — check credentials" }, { status: 502 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

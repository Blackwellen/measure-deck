import { NextRequest, NextResponse } from "next/server";

const SYSTEM_PROMPT = `You are MeasureDeck AI, a specialist construction commercial management assistant.
You help contractors, quantity surveyors, and project managers with:
- Cost Value Reconciliation (CVR) analysis and guidance
- Payment applications, certifications, and disputes
- Change event management and variation orders
- Programme delays and extension of time claims
- Retention, final accounts, and cashflow
- Compliance, evidence management, and audit trails
- JCT, NEC3/NEC4, and FIDIC contract guidance

Be concise, professional, and construction-specific. Use UK English. Format responses clearly.
If asked about sensitive legal matters, recommend seeking specialist legal advice.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "AI service is not configured. Please set OPENAI_API_KEY." },
      { status: 503 }
    );
  }

  let body: { messages?: { role: string; content: string }[]; context?: object };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { messages = [], context } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "messages array is required" }, { status: 400 });
  }

  // Build system message with optional context
  const systemContent = context
    ? `${SYSTEM_PROMPT}\n\nCurrent context: ${JSON.stringify(context)}`
    : SYSTEM_PROMPT;

  const openaiMessages = [
    { role: "system", content: systemContent },
    ...messages.map((m) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content,
    })),
  ];

  try {
    const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: openaiMessages,
        max_tokens: 1000,
        stream: true,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenAI error:", errorData);
      return NextResponse.json(
        { error: "AI service returned an error. Please try again." },
        { status: 502 }
      );
    }

    // Stream the response directly
    return new NextResponse(response.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("AI chat error:", err);
    return NextResponse.json(
      { error: "Failed to connect to AI service." },
      { status: 500 }
    );
  }
}

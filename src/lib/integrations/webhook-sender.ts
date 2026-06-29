export interface WebhookPayload {
  event_type: string;
  title: string;
  message: string;
  url?: string;
  urgency?: "info" | "warning" | "critical";
  data?: Record<string, unknown>;
}

export async function sendSlackNotification(
  webhookUrl: string,
  payload: WebhookPayload
): Promise<boolean> {
  const colourMap: Record<string, string> = {
    info: "#3b82f6",
    warning: "#f59e0b",
    critical: "#ef4444",
  };
  const colour = colourMap[payload.urgency ?? "info"];

  const body = {
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${payload.title}*\n${payload.message}`,
        },
      },
      ...(payload.url
        ? [
            {
              type: "actions",
              elements: [
                {
                  type: "button",
                  text: { type: "plain_text", text: "View in MeasureDeck" },
                  url: payload.url,
                  style: payload.urgency === "critical" ? "danger" : "primary",
                },
              ],
            },
          ]
        : []),
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `MeasureDeck · ${new Date().toLocaleString("en-GB")}`,
          },
        ],
      },
    ],
    attachments: [
      {
        color: colour,
        fallback: `${payload.title}: ${payload.message}`,
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function sendTeamsNotification(
  webhookUrl: string,
  payload: WebhookPayload
): Promise<boolean> {
  const themeColourMap: Record<string, string> = {
    info: "0078D4",
    warning: "F59E0B",
    critical: "EF4444",
  };
  const themeColour = themeColourMap[payload.urgency ?? "info"];

  const body = {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.4",
          body: [
            {
              type: "TextBlock",
              text: payload.title,
              weight: "Bolder",
              size: "Medium",
              color:
                payload.urgency === "critical"
                  ? "Attention"
                  : payload.urgency === "warning"
                    ? "Warning"
                    : "Default",
            },
            {
              type: "TextBlock",
              text: payload.message,
              wrap: true,
              color: "Default",
            },
            {
              type: "TextBlock",
              text: `MeasureDeck · ${new Date().toLocaleString("en-GB")}`,
              size: "Small",
              color: "Light",
              isSubtle: true,
            },
          ],
          ...(payload.url
            ? {
                actions: [
                  {
                    type: "Action.OpenUrl",
                    title: "View in MeasureDeck",
                    url: payload.url,
                    style: payload.urgency === "critical" ? "destructive" : "positive",
                  },
                ],
              }
            : {}),
          msteams: { width: "Full", themeColor: themeColour },
        },
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function sendWhatsAppMessage(params: {
  accountSid: string;
  authToken: string;
  fromNumber: string;
  toNumber: string;
  message: string;
}): Promise<boolean> {
  const { accountSid, authToken, fromNumber, toNumber, message } = params;

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const formData = new URLSearchParams();
  formData.append("From", `whatsapp:${fromNumber}`);
  formData.append("To", `whatsapp:${toNumber}`);
  formData.append("Body", message);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

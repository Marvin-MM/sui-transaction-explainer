import fetch from "node-fetch"

export interface WebhookPayload {
  digest: string
  sender: string
  recipients: string[]
  status: "success" | "failed"
  gasUsed: string
  summary: string
  timestamp: number
  eventType: "new_transaction" | "object_created" | "transfer_in" | "transfer_out"
}

export async function executeWebhook(url: string, payload: WebhookPayload, integration: string): Promise<void> {
  let formattedPayload: any = payload

  if (integration === "discord") {
    formattedPayload = formatDiscordPayload(payload)
  } else if (integration === "slack") {
    formattedPayload = formatSlackPayload(payload)
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formattedPayload),
    })

    if (!response.ok) {
      throw new Error(`Webhook failed: ${response.statusText}`)
    }
  } catch (error) {
    console.error(`Webhook execution failed for ${url}:`, error)
    throw error
  }
}

function formatDiscordPayload(payload: WebhookPayload): any {
  const statusColor = payload.status === "success" ? 3066993 : 15158332
  const eventLabels: Record<string, string> = {
    new_transaction: "New Transaction",
    object_created: "Object Created",
    transfer_in: "Transfer In",
    transfer_out: "Transfer Out",
  }

  return {
    embeds: [
      {
        title: eventLabels[payload.eventType] || "Transaction Event",
        description: payload.summary,
        color: statusColor,
        fields: [
          {
            name: "Status",
            value: payload.status,
            inline: true,
          },
          {
            name: "Gas Used",
            value: payload.gasUsed,
            inline: true,
          },
          {
            name: "Sender",
            value: `\`${payload.sender}\``,
            inline: false,
          },
          {
            name: "Digest",
            value: `\`${payload.digest}\``,
            inline: false,
          },
        ],
        timestamp: new Date(payload.timestamp).toISOString(),
      },
    ],
  }
}

function formatSlackPayload(payload: WebhookPayload): any {
  const statusEmoji = payload.status === "success" ? "✅" : "❌"
  const eventLabels: Record<string, string> = {
    new_transaction: "New Transaction",
    object_created: "Object Created",
    transfer_in: "Transfer In",
    transfer_out: "Transfer Out",
  }

  return {
    text: `${statusEmoji} ${eventLabels[payload.eventType] || "Transaction Event"}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*${eventLabels[payload.eventType] || "Transaction Event"}*\n${payload.summary}`,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Status*\n${payload.status}`,
          },
          {
            type: "mrkdwn",
            text: `*Gas Used*\n${payload.gasUsed}`,
          },
          {
            type: "mrkdwn",
            text: `*Sender*\n\`${payload.sender}\``,
          },
          {
            type: "mrkdwn",
            text: `*Digest*\n\`${payload.digest}\``,
          },
        ],
      },
    ],
  }
}

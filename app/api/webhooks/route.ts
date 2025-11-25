import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { webhookSchema } from "@/lib/validation/schemas"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Use Prisma to fetch webhooks
    const webhooks = await prisma.webhook.findMany({
      where: { userId: session.user.id }
    })

    return NextResponse.json({ webhooks })
  } catch (error) {
    console.error("Get webhooks error:", error)
    return NextResponse.json({ error: "Failed to fetch webhooks" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const webhook = webhookSchema.parse(body)

    const newWebhook = await prisma.webhook.create({
      data: {
        userId: session.user.id,
        ...webhook,
      }
    })

    return NextResponse.json(newWebhook, { status: 201 })
  } catch (error) {
    console.error("Create webhook error:", error)
    return NextResponse.json({ error: "Failed to create webhook" }, { status: 500 })
  }
}

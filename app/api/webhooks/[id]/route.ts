import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const webhook = await prisma.webhook.findUnique({
      where: { id },
    })

    if (!webhook || webhook.userId !== session.user.id) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 })
    }

    await prisma.webhook.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete webhook error:", error)
    return NextResponse.json({ error: "Failed to delete webhook" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Verify ownership
    const webhook = await prisma.webhook.findUnique({
      where: { id },
    })

    if (!webhook || webhook.userId !== session.user.id) {
      return NextResponse.json({ error: "Webhook not found" }, { status: 404 })
    }

    const updatedWebhook = await prisma.webhook.update({
      where: { id },
      data: body,
    })

    return NextResponse.json(updatedWebhook)
  } catch (error) {
    console.error("Update webhook error:", error)
    return NextResponse.json({ error: "Failed to update webhook" }, { status: 500 })
  }
}

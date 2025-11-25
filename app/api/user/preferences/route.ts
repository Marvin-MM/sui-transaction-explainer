import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const preferences = await prisma.userPreferences.findUnique({
      where: {
        userId: session.user.id
      },
    })

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error("Fetch preferences error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
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
    const { emailNotifications, pushNotifications } = body

    const preferences = await prisma.userPreferences.upsert({
      where: { userId: session.user.id },
      update: {
        emailNotifications: emailNotifications ?? undefined,
        pushNotifications: pushNotifications ?? undefined,
      },
      create: {
        userId: session.user.id,
        emailNotifications: emailNotifications ?? true,
        pushNotifications: pushNotifications ?? true,
      },
    })

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error("Update preferences error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

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

    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        name: true,
        walletAddress: true,
        createdAt: true,
      },
    })

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      profile: {
        email: dbUser.email,
        displayName: dbUser.name || "",
        walletAddress: dbUser.walletAddress,
        createdAt: dbUser.createdAt,
      },
    })
  } catch (error) {
    console.error("Get profile error:", error)
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
    const { displayName } = body

    const dbUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: displayName || null,
      },
      select: {
        email: true,
        name: true,
        walletAddress: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      profile: {
        email: dbUser.email,
        displayName: dbUser.name || "",
        walletAddress: dbUser.walletAddress,
        createdAt: dbUser.createdAt,
      },
    })
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

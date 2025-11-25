import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    })

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Delete all associated data
    await prisma.transaction.deleteMany({
      where: { userId: dbUser.id },
    })

    await prisma.webhook.deleteMany({
      where: { userId: dbUser.id },
    })

    await prisma.notificationToken.deleteMany({
      where: { userId: dbUser.id },
    })

    await prisma.userPreferences.deleteMany({
      where: { userId: dbUser.id },
    })

    await prisma.wallet.deleteMany({
      where: {
        address:
          (
            await prisma.user.findUnique({
              where: { id: dbUser.id },
              select: { walletAddress: true },
            })
          )?.walletAddress || "",
      },
    })

    // Delete the user account
    await prisma.user.delete({
      where: { id: dbUser.id },
    })

    // BetterAuth handles user deletion from its own tables via cascade usually, 
    // or we might need to call auth.api.deleteUser if we want to be thorough, 
    // but Prisma delete on User should cascade to Session/Account if set up correctly.
    // The schema I added has onDelete: Cascade for Session/Account.

    return NextResponse.json({ success: true, message: "Account deleted successfully" })
  } catch (error) {
    console.error("Delete account error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

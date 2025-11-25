import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id

    await prisma.wallet.deleteMany({
      where: {
        address: {
          in: (
            await prisma.user.findUnique({
              where: { id: userId },
              select: { walletAddress: true },
            })
          )?.walletAddress
            ? [
              (
                await prisma.user.findUnique({
                  where: { id: userId },
                  select: { walletAddress: true },
                })
              )?.walletAddress as string,
            ]
            : [],
        },
      },
    })

    // Update user to remove wallet reference
    await prisma.user.update({
      where: { id: userId },
      data: {
        walletAddress: null,
        walletProvider: null,
      },
    })

    try {
      const userEmail = session.user.email

      if (userEmail) {
        await transporter.sendMail({
          from: process.env.GMAIL_EMAIL,
          to: userEmail,
          subject: "Wallet Disconnected from Sui Transaction Explainer",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1f2937;">Wallet Disconnected</h2>
              <p>Your wallet has been successfully disconnected from Sui Transaction Explainer.</p>
              <p>All associated wallet data has been removed from our platform. You can reconnect your wallet at any time.</p>
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                If you did not perform this action, please contact our support team.
              </p>
            </div>
          `,
        })
      }
    } catch (e) {
      console.error("Failed to send disconnect email:", e)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Wallet disconnect error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

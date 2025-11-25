import { type NextRequest, NextResponse } from "next/server"
import { sendOnboardingEmail } from "@/lib/email/nodemailer"
import { z } from "zod"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = z.object({ email: z.string().email() }).parse(body)

    await sendOnboardingEmail(email)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Onboarding email error:", error)
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
  }
}

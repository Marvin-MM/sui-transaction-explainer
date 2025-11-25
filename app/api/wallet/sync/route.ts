import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

import { z } from "zod"
import { sendOnboardingEmail } from "@/lib/email/nodemailer"
import prisma from "@/lib/prisma"

const syncSchema = z.object({
    address: z.string(),
    provider: z.string(),
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { address, provider } = syncSchema.parse(body)

        // Upsert wallet using Prisma
        await prisma.wallet.upsert({
            where: { address },
            update: {
                provider,
                updatedAt: new Date(),
            },
            create: {
                address,
                provider,
            },
        })

        // Check if user needs onboarding email
        const session = await auth.api.getSession({
            headers: await headers()
        })

        if (session?.user) {
            // Fetch user from Prisma
            const dbUser = await prisma.user.findUnique({
                where: { id: session.user.id },
                select: { onboardingEmailSent: true, email: true, name: true }
            })

            if (dbUser && !dbUser.onboardingEmailSent && dbUser.email) {
                try {
                    await sendOnboardingEmail(dbUser.email, dbUser.name || undefined)
                    // Update flag
                    await prisma.user.update({
                        where: { id: session.user.id },
                        data: { onboardingEmailSent: true }
                    })
                } catch (e) {
                    console.error("Failed to send onboarding email", e)
                }
            }
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Wallet sync error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

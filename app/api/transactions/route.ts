import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const transactions = await prisma.transaction.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" },
        })

        return NextResponse.json({ transactions })
    } catch (error) {
        console.error("Fetch transactions error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

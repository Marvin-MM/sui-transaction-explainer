import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { generateCSV } from "@/lib/export/csv"
import prisma from "@/lib/prisma"

export async function POST(request: NextRequest) {
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

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ error: "No transactions found" }, { status: 404 })
    }

    const csv = generateCSV(transactions.map(t => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      rawData: t.rawData as any
    })))

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv;charset=utf-8;",
        "Content-Disposition": `attachment; filename="transactions_${Date.now()}.csv"`,
      },
    })
  } catch (error) {
    console.error("CSV export error:", error)
    return NextResponse.json({ error: "Failed to export CSV" }, { status: 500 })
  }
}

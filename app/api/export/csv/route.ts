import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { generateCSV, generateEnhancedCSV } from "@/lib/export/csv"
import prisma from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse request body for options
    const body = await request.json().catch(() => ({}))
    const includeAllFields = body.includeAllFields !== false // Default to true

    const transactions = await prisma.transaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ error: "No transactions found" }, { status: 404 })
    }

    const exportData = transactions.map(t => ({
      digest: t.digest,
      sender: t.sender,
      recipients: t.recipients,
      status: t.status,
      gasUsed: t.gasUsed,
      gasBudget: t.gasBudget,
      executionStatus: t.executionStatus,
      moveCallNames: t.moveCallNames,
      objectsCreated: t.objectsCreated,
      objectsMutated: t.objectsMutated,
      objectsTransferred: t.objectsTransferred,
      objectsDeleted: t.objectsDeleted || 0,
      summary: t.summary,
      detailedSummary: t.detailedSummary,
      technicalSummary: t.technicalSummary,
      transactionType: t.transactionType,
      userFriendlyContext: t.userFriendlyContext,
      createdAt: t.createdAt.toISOString(),
    }))

    const csv = includeAllFields 
      ? generateCSV(exportData)
      : generateEnhancedCSV(exportData, false)

    const filename = includeAllFields 
      ? `transactions_complete_${Date.now()}.csv`
      : `transactions_simple_${Date.now()}.csv`

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv;charset=utf-8;",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("CSV export error:", error)
    return NextResponse.json({ error: "Failed to export CSV" }, { status: 500 })
  }
}

// GET endpoint for quick download without body
export async function GET(request: NextRequest) {
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
      take: 100, // Limit to last 100 for quick export
    })

    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ error: "No transactions found" }, { status: 404 })
    }

    const exportData = transactions.map(t => ({
      digest: t.digest,
      sender: t.sender,
      recipients: t.recipients,
      status: t.status,
      gasUsed: t.gasUsed,
      gasBudget: t.gasBudget,
      executionStatus: t.executionStatus,
      moveCallNames: t.moveCallNames,
      objectsCreated: t.objectsCreated,
      objectsMutated: t.objectsMutated,
      objectsTransferred: t.objectsTransferred,
      objectsDeleted: t.objectsDeleted || 0,
      summary: t.summary,
      detailedSummary: t.detailedSummary,
      technicalSummary: t.technicalSummary,
      transactionType: t.transactionType,
      userFriendlyContext: t.userFriendlyContext,
      createdAt: t.createdAt.toISOString(),
    }))

    // Use simple format for GET requests
    const csv = generateEnhancedCSV(exportData, false)

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
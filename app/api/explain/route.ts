import { type NextRequest, NextResponse } from "next/server"
import { fetchAndExplainTransaction } from "@/lib/sui/explainer"
import { digestSchema } from "@/lib/validation/schemas"
import { rateLimit } from "@/lib/rate-limit"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    // Get IP for rate limiting
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    // Get authenticated user
    const session = await auth.api.getSession({
      headers: await headers()
    })
    const user = session?.user

    // Determine rate limit
    const rateLimitKey = user?.id || `ip:${ip}`
    const limit = user ? 50 : 10
    const windowSeconds = 60

    const { success, remaining } = await rateLimit(rateLimitKey, limit, windowSeconds)

    if (!success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    // Parse request
    const body = await request.json()
    const digest = digestSchema.parse((body.digest ?? '').trim())
    const network = body.network as "mainnet" | "testnet" | "devnet" | "localnet" | undefined

    // Fetch and explain transaction
    const explanation = await fetchAndExplainTransaction(digest, network)

    // Save to database if user is authenticated
    if (user) {
      await prisma.transaction.create({
        data: {
          userId: user.id,
          digest: explanation.digest,
          sender: explanation.sender,
          recipients: explanation.recipients,
          status: explanation.status,
          gasUsed: explanation.gasUsed,
          gasBudget: explanation.gasBudget,
          executionStatus: explanation.executionStatus,
          moveCallNames: explanation.moveCallNames,
          objectsCreated: explanation.objectsCreated,
          objectsMutated: explanation.objectsMutated,
          objectsTransferred: explanation.objectsTransferred,
          objectsDeleted: explanation.objectsDeleted || 0,
          summary: explanation.summary,
          detailedSummary: explanation.detailedSummary,
          technicalSummary: explanation.technicalSummary,
          transactionType: explanation.transactionType,
          userFriendlyContext: explanation.userFriendlyContext,
          rawData: explanation.objects as any,
        }
      })
    }

    return NextResponse.json({ explanation, remaining }, { status: 200 })
  } catch (error) {
    console.error("Explain error:", error)

    if (error instanceof Error) {
      const msg = error.message
      if (msg.includes("Invalid digest")) {
        return NextResponse.json({ error: "Invalid transaction digest format" }, { status: 400 })
      }
      // Map transient upstream errors to retriable statuses
      if (/\b429\b/i.test(msg)) {
        return NextResponse.json({ error: "Upstream rate limit exceeded. Please retry shortly." }, { status: 429 })
      }
      if (/(503|504|timeout|ETIMEDOUT|ECONNRESET)/i.test(msg)) {
        return NextResponse.json({ error: "Upstream RPC is unavailable or timed out. Please retry." }, { status: 504 })
      }
    }

    return NextResponse.json({ error: "Failed to explain transaction" }, { status: 500 })
  }
}
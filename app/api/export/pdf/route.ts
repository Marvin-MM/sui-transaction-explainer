import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { PDFDocument, rgb } from "pdf-lib"
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

    const pdfDoc = await PDFDocument.create()
    let page = pdfDoc.addPage([612, 792])
    const { width, height } = page.getSize()

    // Title
    page.drawText("Sui Transaction Report", {
      x: 50,
      y: height - 50,
      size: 24,
    })

    page.drawText(`Generated: ${new Date().toISOString()}`, {
      x: 50,
      y: height - 80,
      size: 12,
      color: rgb(0.5, 0.5, 0.5), // 128/255
    })

    page.drawText(`Total Transactions: ${transactions.length}`, {
      x: 50,
      y: height - 110,
      size: 12,
      color: rgb(0.5, 0.5, 0.5),
    })

    let yOffset = height - 150

    for (const tx of transactions) {
      if (yOffset < 100) {
        page = pdfDoc.addPage([612, 792])
        yOffset = height - 50
      }

      page.drawText(`Digest: ${tx.digest}`, {
        x: 50,
        y: yOffset,
        size: 10,
        color: rgb(0, 0, 0.5), // 128/255
      })
      yOffset -= 20

      page.drawText(`Status: ${tx.status}`, {
        x: 50,
        y: yOffset,
        size: 10,
        color: tx.status === "success" ? rgb(0, 0.5, 0) : rgb(1, 0, 0),
      })
      yOffset -= 20

      page.drawText(`Summary: ${tx.summary}`, {
        x: 50,
        y: yOffset,
        size: 10,
      })
      yOffset -= 20

      page.drawText(`Sender: ${tx.sender}`, {
        x: 50,
        y: yOffset,
        size: 9,
        color: rgb(0.37, 0.37, 0.37), // 96/255
      })
      yOffset -= 15

      page.drawText(`Gas Used: ${tx.gasUsed} SUI`, {
        x: 50,
        y: yOffset,
        size: 9,
        color: rgb(0.37, 0.37, 0.37),
      })
      yOffset -= 25
    }

    const pdfBytes = await pdfDoc.save()

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="transactions_${Date.now()}.pdf"`,
      },
    })
  } catch (error) {
    console.error("PDF export error:", error)
    return NextResponse.json({ error: "Failed to export PDF" }, { status: 500 })
  }
}

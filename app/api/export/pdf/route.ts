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

    // Parse request body for options
    const body = await request.json().catch(() => ({}))
    const includeDetailedSummary = body.includeDetailedSummary !== false
    const includeTechnicalDetails = body.includeTechnicalDetails === true
    const includeUserContext = body.includeUserContext !== false

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
    const margin = 50
    const contentWidth = width - 2 * margin

    // Colors
    const black = rgb(0, 0, 0)
    const gray = rgb(0.4, 0.4, 0.4)
    const lightGray = rgb(0.6, 0.6, 0.6)
    const successGreen = rgb(0, 0.6, 0)
    const failureRed = rgb(0.8, 0, 0)
    const blue = rgb(0, 0.3, 0.8)

    // Title Page
    page.drawText("Sui Transaction Report", {
      x: margin,
      y: height - 50,
      size: 28,
      color: black,
    })

    page.drawText(`Generated: ${new Date().toLocaleString()}`, {
      x: margin,
      y: height - 85,
      size: 11,
      color: gray,
    })

    page.drawText(`Total Transactions: ${transactions.length}`, {
      x: margin,
      y: height - 105,
      size: 11,
      color: gray,
    })

    // Statistics
    const successCount = transactions.filter((t) => t.status === "success").length
    const totalGas = transactions.reduce((sum, t) => sum + Number(t.gasUsed), 0)
    const avgGas = totalGas / transactions.length

    page.drawText("Summary Statistics:", {
      x: margin,
      y: height - 140,
      size: 14,
      color: black,
    })

    const stats = [
      `Success Rate: ${successCount}/${transactions.length} (${((successCount / transactions.length) * 100).toFixed(1)}%)`,
      `Total Gas Used: ${(totalGas / 1e9).toFixed(6)} SUI`,
      `Average Gas: ${(avgGas / 1e9).toFixed(6)} SUI`,
    ]

    let yOffset = height - 165
    for (const stat of stats) {
      page.drawText(`• ${stat}`, {
        x: margin + 10,
        y: yOffset,
        size: 10,
        color: gray,
      })
      yOffset -= 18
    }

    // Transaction type breakdown
    const typeBreakdown = transactions.reduce((acc, t) => {
      const type = t.transactionType || "unknown"
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    yOffset -= 15
    page.drawText("Transaction Types:", {
      x: margin,
      y: yOffset,
      size: 14,
      color: black,
    })
    yOffset -= 20

    for (const [type, count] of Object.entries(typeBreakdown)) {
      page.drawText(`• ${type}: ${count}`, {
        x: margin + 10,
        y: yOffset,
        size: 10,
        color: gray,
      })
      yOffset -= 18
    }

    // Transaction details
    yOffset = height - 450
    page.drawLine({
      start: { x: margin, y: yOffset },
      end: { x: width - margin, y: yOffset },
      thickness: 1,
      color: lightGray,
    })
    yOffset -= 30

    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i]

      // Check if we need a new page
      if (yOffset < 150) {
        page = pdfDoc.addPage([612, 792])
        yOffset = height - margin
      }

      // Transaction header
      const txTitle = `Transaction ${i + 1}${tx.transactionType ? ` - ${tx.transactionType.toUpperCase()}` : ""}`
      page.drawText(txTitle, {
        x: margin,
        y: yOffset,
        size: 12,
        color: blue,
      })
      yOffset -= 20

      // Status
      const statusColor = tx.status === "success" ? successGreen : failureRed
      page.drawText(`Status: ${tx.status.toUpperCase()}`, {
        x: margin,
        y: yOffset,
        size: 10,
        color: statusColor,
      })
      yOffset -= 18

      // Digest
      page.drawText("Digest:", {
        x: margin,
        y: yOffset,
        size: 9,
        color: gray,
      })
      page.drawText(truncateMiddle(tx.digest, 60), {
        x: margin + 50,
        y: yOffset,
        size: 9,
        color: black,
      })
      yOffset -= 16

      // Date
      page.drawText("Date:", {
        x: margin,
        y: yOffset,
        size: 9,
        color: gray,
      })
      page.drawText(new Date(tx.createdAt).toLocaleString(), {
        x: margin + 50,
        y: yOffset,
        size: 9,
        color: black,
      })
      yOffset -= 20

      // User context
      if (includeUserContext && tx.userFriendlyContext) {
        const contextLines = wrapText(cleanText(tx.userFriendlyContext), contentWidth, 9)
        for (const line of contextLines) {
          if (yOffset < 100) {
            page = pdfDoc.addPage([612, 792])
            yOffset = height - margin
          }
          page.drawText(line, {
            x: margin,
            y: yOffset,
            size: 9,
            color: blue,
          })
          yOffset -= 14
        }
        yOffset -= 8
      }

      // Simple summary
      page.drawText("Summary:", {
        x: margin,
        y: yOffset,
        size: 10,
        color: gray,
      })
      yOffset -= 15

      const summaryLines = wrapText(cleanText(tx.summary), contentWidth - 10, 9)
      for (const line of summaryLines) {
        if (yOffset < 100) {
          page = pdfDoc.addPage([612, 792])
          yOffset = height - margin
        }
        page.drawText(line, {
          x: margin + 10,
          y: yOffset,
          size: 9,
          color: black,
        })
        yOffset -= 14
      }
      yOffset -= 8

      // Detailed summary
      if (includeDetailedSummary && tx.detailedSummary) {
        page.drawText("Detailed Explanation:", {
          x: margin,
          y: yOffset,
          size: 10,
          color: gray,
        })
        yOffset -= 15

        const detailedLines = wrapText(cleanText(tx.detailedSummary), contentWidth - 10, 8)
        for (const line of detailedLines.slice(0, 20)) {
          if (yOffset < 100) {
            page = pdfDoc.addPage([612, 792])
            yOffset = height - margin
          }
          page.drawText(line, {
            x: margin + 10,
            y: yOffset,
            size: 8,
            color: gray,
          })
          yOffset -= 12
        }
        yOffset -= 8
      }

      // Transaction details
      yOffset -= 5
      const details = [
        { label: "Sender", value: truncateMiddle(tx.sender, 45) },
        { label: "Recipients", value: `${tx.recipients.length}` },
        { label: "Gas Used", value: `${(Number(tx.gasUsed) / 1e9).toFixed(6)} SUI` },
        { label: "Gas Budget", value: `${(Number(tx.gasBudget) / 1e9).toFixed(6)} SUI` },
        {
          label: "Objects",
          value: `C:${tx.objectsCreated} M:${tx.objectsMutated} T:${tx.objectsTransferred} D:${tx.objectsDeleted || 0}`,
        },
      ]

      for (const detail of details) {
        if (yOffset < 100) {
          page = pdfDoc.addPage([612, 792])
          yOffset = height - margin
        }
        page.drawText(`${detail.label}:`, {
          x: margin,
          y: yOffset,
          size: 8,
          color: lightGray,
        })
        page.drawText(detail.value, {
          x: margin + 80,
          y: yOffset,
          size: 8,
          color: gray,
        })
        yOffset -= 14
      }

      // Move calls
      if (tx.moveCallNames.length > 0) {
        yOffset -= 5
        page.drawText(`Smart Contract Calls (${tx.moveCallNames.length}):`, {
          x: margin,
          y: yOffset,
          size: 9,
          color: gray,
        })
        yOffset -= 15

        for (const call of tx.moveCallNames.slice(0, 5)) {
          if (yOffset < 100) {
            page = pdfDoc.addPage([612, 792])
            yOffset = height - margin
          }
          const [, , func] = call.split("::")
          page.drawText(`• ${func || call}`, {
            x: margin + 10,
            y: yOffset,
            size: 8,
            color: black,
          })
          yOffset -= 13
        }
        if (tx.moveCallNames.length > 5) {
          page.drawText(`... and ${tx.moveCallNames.length - 5} more`, {
            x: margin + 10,
            y: yOffset,
            size: 8,
            color: lightGray,
          })
          yOffset -= 13
        }
      }

      // Technical details
      if (includeTechnicalDetails && tx.technicalSummary) {
        yOffset -= 10
        page.drawText("Technical Details:", {
          x: margin,
          y: yOffset,
          size: 9,
          color: gray,
        })
        yOffset -= 15

        const techLines = wrapText(cleanText(tx.technicalSummary), contentWidth - 10, 7)
        for (const line of techLines.slice(0, 15)) {
          if (yOffset < 100) {
            page = pdfDoc.addPage([612, 792])
            yOffset = height - margin
          }
          page.drawText(line, {
            x: margin + 10,
            y: yOffset,
            size: 7,
            color: lightGray,
          })
          yOffset -= 10
        }
      }

      // Separator
      yOffset -= 15
      if (yOffset > 100) {
        page.drawLine({
          start: { x: margin, y: yOffset },
          end: { x: width - margin, y: yOffset },
          thickness: 0.5,
          color: lightGray,
        })
        yOffset -= 25
      }
    }

    const pdfBytes = await pdfDoc.save()

    const filename = includeTechnicalDetails 
      ? `transactions_complete_${Date.now()}.pdf`
      : `transactions_${Date.now()}.pdf`

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("PDF export error:", error)
    return NextResponse.json({ error: "Failed to export PDF" }, { status: 500 })
  }
}

function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const words = text.split(" ")
  const lines: string[] = []
  let currentLine = ""
  const charsPerLine = Math.floor(maxWidth / (fontSize * 0.5))

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    if (testLine.length > charsPerLine) {
      if (currentLine) lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }

  if (currentLine) lines.push(currentLine)
  return lines
}

function truncateMiddle(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  const halfLength = Math.floor(maxLength / 2) - 2
  return `${text.slice(0, halfLength)}...${text.slice(-halfLength)}`
}

function cleanText(text: string): string {
  return text
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, "")
    .replace(/[\u2700-\u27BF]/gu, "")
    .replace(/[\u2600-\u26FF]/gu, "")
    .replace(/[\u2300-\u23FF]/gu, "")
    .replace(/[\u2200-\u22FF]/gu, "")
    .replace(/[✅❌✓✗◆●○■□▪▫]/g, "")
    .replace(/\n\n+/g, "\n")
    .trim()
}
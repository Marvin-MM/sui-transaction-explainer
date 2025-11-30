import { PDFDocument, type PDFPage, rgb, type RGB } from "pdf-lib"

export interface ExportTransaction {
  digest: string
  sender: string
  recipients: string[]
  status: string
  gasUsed: string
  gasBudget: string
  executionStatus: string | null
  moveCallNames: string[]
  objectsCreated: number
  objectsMutated: number
  objectsTransferred: number
  objectsDeleted: number
  summary: string
  detailedSummary: string | null
  technicalSummary: string | null
  transactionType: string | null
  userFriendlyContext: string | null
  createdAt: string
}

interface PDFGenerationOptions {
  includeDetailedSummary?: boolean
  includeTechnicalDetails?: boolean
  includeUserContext?: boolean
}

export async function generatePDF(
  transactions: ExportTransaction[],
  filename = "transactions.pdf",
  options: PDFGenerationOptions = {}
): Promise<void> {
  const {
    includeDetailedSummary = true,
    includeTechnicalDetails = false,
    includeUserContext = true,
  } = options

  const pdfDoc = await PDFDocument.create()
  const pages: PDFPage[] = []

  // Add title page
  let page = pdfDoc.addPage([612, 792])
  pages.push(page)

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

  // Title
  page.drawText("Sui Transaction Report", {
    x: margin,
    y: height - 50,
    size: 28,
    color: black,
  })

  // Metadata
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
  const failureCount = transactions.length - successCount
  const totalGas = transactions.reduce((sum, t) => sum + Number(t.gasUsed), 0)
  const avgGas = totalGas / transactions.length

  page.drawText("Summary Statistics:", {
    x: margin,
    y: height - 140,
    size: 14,
    color: black,
  })

  const stats = [
    `Success: ${successCount} (${((successCount / transactions.length) * 100).toFixed(1)}%)`,
    `Failed: ${failureCount}`,
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

  // Add transaction details
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
      pages.push(page)
      yOffset = height - margin
    }

    // Transaction number and type
    const txTitle = `Transaction ${i + 1}${tx.transactionType ? ` - ${tx.transactionType.toUpperCase()}` : ""}`
    page.drawText(txTitle, {
      x: margin,
      y: yOffset,
      size: 12,
      color: blue,
    })
    yOffset -= 20

    // Status indicator
    const statusColor = tx.status === "success" ? successGreen : failureRed
    const statusText = tx.status === "success" ? "SUCCESS" : "FAILED"
    page.drawText(statusText, {
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

    // User-friendly context (if included)
    if (includeUserContext && tx.userFriendlyContext) {
      const contextLines = wrapText(cleanText(tx.userFriendlyContext), contentWidth, 9)
      for (const line of contextLines) {
        if (yOffset < 100) {
          page = pdfDoc.addPage([612, 792])
          pages.push(page)
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
        pages.push(page)
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

    // Detailed summary (if included)
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
        // Limit to 20 lines
        if (yOffset < 100) {
          page = pdfDoc.addPage([612, 792])
          pages.push(page)
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

    // Transaction details grid
    yOffset -= 5
    const details = [
      { label: "Sender", value: truncateMiddle(tx.sender, 45) },
      { label: "Recipients", value: `${tx.recipients.length} address(es)` },
      { label: "Gas Used", value: `${(Number(tx.gasUsed) / 1e9).toFixed(6)} SUI` },
      { label: "Gas Budget", value: `${(Number(tx.gasBudget) / 1e9).toFixed(6)} SUI` },
      {
        label: "Objects",
        value: `Created: ${tx.objectsCreated}, Modified: ${tx.objectsMutated}, Transferred: ${tx.objectsTransferred}, Deleted: ${tx.objectsDeleted}`,
      },
    ]

    for (const detail of details) {
      if (yOffset < 100) {
        page = pdfDoc.addPage([612, 792])
        pages.push(page)
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

    // Move calls (if any)
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
        // Limit to 5 calls
        if (yOffset < 100) {
          page = pdfDoc.addPage([612, 792])
          pages.push(page)
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

    // Technical details (if included)
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
        // Limit to 15 lines
        if (yOffset < 100) {
          page = pdfDoc.addPage([612, 792])
          pages.push(page)
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
  downloadPDF(pdfBytes, filename)
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
  // Remove emojis and special characters for PDF compatibility
  // WinAnsi encoding (used by standard PDF fonts) only supports characters up to U+00FF
  return text
    .replace(/[^\u0000-\u00FF]/g, "") // Remove all non-Latin-1 characters
    .replace(/\n\n+/g, "\n")
    .trim()
}

function downloadPDF(pdfBytes: Uint8Array, filename: string): void {
  const blob = new Blob([pdfBytes], { type: "application/pdf" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

// Simplified PDF generation for quick exports
export async function generateSimplePDF(
  transactions: ExportTransaction[],
  filename = "transactions_simple.pdf"
): Promise<void> {
  return generatePDF(transactions, filename, {
    includeDetailedSummary: false,
    includeTechnicalDetails: false,
    includeUserContext: true,
  })
}

// Comprehensive PDF with all details
export async function generateCompletePDF(
  transactions: ExportTransaction[],
  filename = "transactions_complete.pdf"
): Promise<void> {
  return generatePDF(transactions, filename, {
    includeDetailedSummary: true,
    includeTechnicalDetails: true,
    includeUserContext: true,
  })
}
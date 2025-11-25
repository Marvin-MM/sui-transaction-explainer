import { PDFDocument, type PDFPage, rgb } from "pdf-lib"

export interface ExportTransaction {
  digest: string
  sender: string
  recipients: string[]
  status: string
  gasUsed: string
  gasBudget: string
  moveCallNames: string[]
  objectsCreated: number
  objectsMutated: number
  objectsTransferred: number
  summary: string
  createdAt: string
}

export async function generatePDF(transactions: ExportTransaction[], filename = "transactions.pdf"): Promise<void> {
  const pdfDoc = await PDFDocument.create()
  const pages: PDFPage[] = []

  // Add title page
  let page = pdfDoc.addPage([612, 792])
  pages.push(page)

  const { width, height } = page.getSize()
  page.drawText("Sui Transaction Report", {
    x: 50,
    y: height - 50,
    size: 24,
    color: rgb(0, 0, 0),
  })

  page.drawText(`Generated: ${new Date().toISOString()}`, {
    x: 50,
    y: height - 80,
    size: 12,
    color: rgb(0.502, 0.502, 0.502),
  })

  page.drawText(`Total Transactions: ${transactions.length}`, {
    x: 50,
    y: height - 110,
    size: 12,
    color: rgb(0.502, 0.502, 0.502),
  })

  // Add transaction details
  let yOffset = height - 150
  const margin = 50
  const contentWidth = width - 2 * margin

  for (const tx of transactions) {
    if (yOffset < 100) {
      page = pdfDoc.addPage([612, 792])
      pages.push(page)
      yOffset = height - margin
    }

    // Transaction header
    page.drawText(`Digest: ${tx.digest}`, {
      x: margin,
      y: yOffset,
      size: 10,
      color: rgb(0, 0, 0.502),
    })
    yOffset -= 18

    // Status
    const statusColor = tx.status === "success" ? rgb(0, 0.502, 0) : rgb(1, 0, 0)
    page.drawText(`Status: ${tx.status}`, {
      x: margin,
      y: yOffset,
      size: 10,
      color: statusColor,
    })
    yOffset -= 18

    // Summary (wrapped)
    const summaryLines = wrapText(tx.summary, contentWidth, 10)
    for (const line of summaryLines) {
      page.drawText(line, {
        x: margin,
        y: yOffset,
        size: 10,
        color: rgb(0.251, 0.251, 0.251),
      })
      yOffset -= 15
    }

    // Details grid
    const details = [
      [`Sender: ${tx.sender}`, `Gas Used: ${tx.gasUsed}`],
      [`Recipients: ${tx.recipients.length}`, `Gas Budget: ${tx.gasBudget}`],
      [
        `Objects - Created: ${tx.objectsCreated}, Mutated: ${tx.objectsMutated}, Transferred: ${tx.objectsTransferred}`,
        `Date: ${new Date(tx.createdAt).toLocaleDateString()}`,
      ],
    ]

    for (const [left, right] of details) {
      page.drawText(left, {
        x: margin,
        y: yOffset,
        size: 9,
        color: rgb(0.376, 0.376, 0.376),
      })
      page.drawText(right, {
        x: margin + contentWidth / 2,
        y: yOffset,
        size: 9,
        color: rgb(0.376, 0.376, 0.376),
      })
      yOffset -= 16
    }

    yOffset -= 10

    // Separator
    page.drawLine({
      start: { x: margin, y: yOffset },
      end: { x: margin + contentWidth, y: yOffset },
      thickness: 0.5,
      color: rgb(0.784, 0.784, 0.784),
    })

    yOffset -= 15
  }

  const pdfBytes = await pdfDoc.save()
  downloadPDF(pdfBytes, filename)
}

function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const words = text.split(" ")
  const lines: string[] = []
  let currentLine = ""

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    if (testLine.length > 50) {
      if (currentLine) lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }

  if (currentLine) lines.push(currentLine)
  return lines
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

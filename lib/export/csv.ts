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

export function generateCSV(transactions: ExportTransaction[]): string {
  const headers = [
    "Digest",
    "Sender",
    "Recipients",
    "Status",
    "Execution Status",
    "Transaction Type",
    "Gas Used",
    "Gas Budget",
    "Move Calls",
    "Objects Created",
    "Objects Mutated",
    "Objects Transferred",
    "Objects Deleted",
    "Simple Summary",
    "Detailed Summary",
    "Technical Summary",
    "User Context",
    "Date",
  ]

  const rows = transactions.map((tx) => [
    tx.digest,
    tx.sender,
    tx.recipients.join(";"),
    tx.status,
    tx.executionStatus || "unknown",
    tx.transactionType || "unknown",
    tx.gasUsed,
    tx.gasBudget,
    tx.moveCallNames.join(";"),
    tx.objectsCreated.toString(),
    tx.objectsMutated.toString(),
    tx.objectsTransferred.toString(),
    tx.objectsDeleted.toString(),
    escapeCsvField(tx.summary),
    escapeCsvField(tx.detailedSummary || "N/A"),
    escapeCsvField(tx.technicalSummary || "N/A"),
    escapeCsvField(tx.userFriendlyContext || "N/A"),
    new Date(tx.createdAt).toISOString(),
  ])

  const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")

  return csv
}

function escapeCsvField(field: string): string {
  // Remove emojis and special characters that might break CSV
  const cleaned = field.replace(/[\u{1F300}-\u{1F9FF}]/gu, "").trim()
  // Escape quotes and wrap in quotes
  return `"${cleaned.replace(/"/g, '""')}"`
}

export function downloadCSV(csv: string, filename = "transactions.csv"): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)

  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

export function generateEnhancedCSV(transactions: ExportTransaction[], includeAllFields = true): string {
  if (includeAllFields) {
    return generateCSV(transactions)
  }

  // Basic CSV with only essential fields
  const headers = [
    "Digest",
    "Type",
    "Status",
    "Sender",
    "Recipients",
    "Gas Used (SUI)",
    "Summary",
    "Date",
  ]

  const rows = transactions.map((tx) => [
    tx.digest,
    tx.transactionType || "unknown",
    tx.status,
    tx.sender,
    tx.recipients.length.toString(),
    (Number(tx.gasUsed) / 1e9).toFixed(6),
    escapeCsvField(tx.summary),
    new Date(tx.createdAt).toLocaleDateString(),
  ])

  return [headers, ...rows].map((row) => row.join(",")).join("\n")
}
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

export function generateCSV(transactions: ExportTransaction[]): string {
  const headers = [
    "Digest",
    "Sender",
    "Recipients",
    "Status",
    "Gas Used",
    "Gas Budget",
    "Move Calls",
    "Objects Created",
    "Objects Mutated",
    "Objects Transferred",
    "Summary",
    "Date",
  ]

  const rows = transactions.map((tx) => [
    tx.digest,
    tx.sender,
    tx.recipients.join(";"),
    tx.status,
    tx.gasUsed,
    tx.gasBudget,
    tx.moveCallNames.join(";"),
    tx.objectsCreated,
    tx.objectsMutated,
    tx.objectsTransferred,
    `"${tx.summary.replace(/"/g, '""')}"`,
    new Date(tx.createdAt).toISOString(),
  ])

  const csv = [headers, ...rows].map((row) => row.join(",")).join("\n")

  return csv
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
}

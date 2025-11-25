import { getSuiClient } from "./client"
import { parseTransaction } from "./parser"
import type { ParsedTransaction, TransactionExplanation } from "./types"
import { getCachedData, cacheData } from "@/lib/redis/client"
import { digestSchema } from "@/lib/validation/schemas"

export async function fetchAndExplainTransaction(digest: string, network?: "mainnet" | "testnet" | "devnet" | "localnet"): Promise<TransactionExplanation> {
  // Validate digest format
  digestSchema.parse(digest)

  // Check cache first
  const cacheKey = `transaction:${network || 'mainnet'}:${digest}`
  const cached = await getCachedData(cacheKey)
  if (cached) {
    return cached as TransactionExplanation
  }

  try {
    const client = getSuiClient(network)

    // Configurable attempts and timeout via env with sane defaults
    const maxAttempts = Math.max(1, Number(process.env.SUI_RPC_ATTEMPTS || 3))
    const attemptTimeoutMs = Math.max(1000, Number(process.env.SUI_RPC_TIMEOUT_MS || 10_000))

    // Simple timeout wrapper (does not cancel the underlying request)
    const withTimeout = async <T>(p: Promise<T>, ms: number): Promise<T> => {
      return await Promise.race<T>([
        p,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms)),
      ])
    }

    let lastError: unknown
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Start with a lighter call to reduce chance of 504s
        let response = await withTimeout(
          client.getTransactionBlock({
            digest,
            options: {
              showInput: true,
              showEffects: true,
            },
          }),
          attemptTimeoutMs,
        )

        // Try to parse; if fields are missing, escalate to full-detail fetch
        let parsed: ParsedTransaction
        try {
          parsed = parseTransaction(response)
        } catch {
          response = await withTimeout(
            client.getTransactionBlock({
              digest,
              options: {
                showInput: true,
                showRawInput: true,
                showEffects: true,
                showEvents: true,
                showObjectChanges: true,
                showBalanceChanges: true,
              },
            }),
            attemptTimeoutMs,
          )
          parsed = parseTransaction(response)
        }

        const explanation = generateExplanation(parsed)
        await cacheData(cacheKey, explanation, 86400)
        return explanation
      } catch (err) {
        lastError = err
        const msg = err instanceof Error ? err.message : String(err)
        const isTransient = /(429|503|504|timeout|ETIMEDOUT|ECONNRESET)/i.test(msg)
        if (!isTransient || attempt === maxAttempts) {
          break
        }
        const delayMs = 500 * Math.pow(2, attempt - 1)
        await new Promise((r) => setTimeout(r, delayMs))
      }
    }

    throw new Error(`Failed to fetch transaction: ${lastError instanceof Error ? lastError.message : "Unknown error"}`)
  } catch (error) {
    throw new Error(`Failed to fetch transaction: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

export function generateExplanation(parsed: ParsedTransaction): TransactionExplanation {
  const shortSender = truncateAddress(parsed.sender)
  const statusText = parsed.status === "success" ? "Transaction successful" : "Transaction failed"

  let summary = `${statusText}. `

  // Add sender info
  summary += `Sender: ${shortSender}. `

  // Add move calls
  if (parsed.moveCalls.length > 0) {
    summary += `Move calls: ${parsed.moveCalls.join(", ")}. `
  }

  // Add object changes
  if (parsed.objectChanges.length > 0) {
    const created = parsed.objectChanges.filter((o) => o.type === "created").length
    const mutated = parsed.objectChanges.filter((o) => o.type === "mutated").length
    const transferred = parsed.objectChanges.filter((o) => o.type === "transferred").length

    const changes = []
    if (created > 0) changes.push(`${created} created`)
    if (mutated > 0) changes.push(`${mutated} mutated`)
    if (transferred > 0) changes.push(`${transferred} transferred`)

    if (changes.length > 0) {
      summary += `Objects: ${changes.join(", ")}. `
    }
  }

  // Add recipients
  if (parsed.recipients.length > 0) {
    const recipientList = parsed.recipients.map((r) => truncateAddress(r)).join(", ")
    summary += `Recipients: ${recipientList}. `
  }

  // Add gas info
  const gasSUI = formatGasAmount(parsed.gasUsed)
  summary += `Gas used: ${gasSUI} SUI.`

  return {
    digest: parsed.digest,
    sender: parsed.sender,
    recipients: parsed.recipients,
    status: parsed.status as "success" | "failed",
    gasUsed: parsed.gasUsed,
    gasBudget: parsed.gasBudget,
    executionStatus: parsed.executionStatus,
    moveCallNames: parsed.moveCalls,
    objectsCreated: parsed.objectChanges.filter((o) => o.type === "created").length,
    objectsMutated: parsed.objectChanges.filter((o) => o.type === "mutated").length,
    objectsTransferred: parsed.objectChanges.filter((o) => o.type === "transferred").length,
    summary,
    timestamp: parsed.timestamp,
    objects: parsed.objectChanges,
  }
}

function truncateAddress(address: string): string {
  if (!address || address.length <= 8) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

function formatGasAmount(gasWei: string): string {
  const gasNum = BigInt(gasWei)
  const SUI_DECIMAL = 9
  const divisor = BigInt(10 ** SUI_DECIMAL)
  const suiAmount = Number(gasNum) / Number(divisor)
  return suiAmount.toFixed(6)
}

export async function fetchWalletTransactions(walletAddress: string, limit = 50): Promise<ParsedTransaction[]> {
  const client = getSuiClient()
  const cacheKey = `wallet:${walletAddress}:transactions`

  // Check cache first
  const cached = await getCachedData(cacheKey)
  if (cached) {
    return cached as ParsedTransaction[]
  }

  try {
    const transactions = await client.queryTransactionBlocks({
      filter: {
        FromAddress: walletAddress,
      },
      limit,
      options: {
        showInput: true,
        showEffects: true,
        showObjectChanges: true,
      },
    })

    const parsed = transactions.data.map((tx) => parseTransaction(tx))

    // Cache for 1 hour
    await cacheData(cacheKey, parsed, 3600)

    return parsed
  } catch (error) {
    throw new Error(`Failed to fetch wallet transactions: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}

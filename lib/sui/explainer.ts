import { getSuiClient } from "./client"
import { parseTransaction } from "./parser"
import type { ParsedTransaction, TransactionExplanation } from "./types"
import { getCachedData, cacheData } from "@/lib/redis/client"
import { digestSchema } from "@/lib/validation/schemas"

export async function fetchAndExplainTransaction(
  digest: string, 
  network?: "mainnet" | "testnet" | "devnet" | "localnet"
): Promise<TransactionExplanation> {
  digestSchema.parse(digest)

  const cacheKey = `transaction:${network || 'mainnet'}:${digest}`
  const cached = await getCachedData(cacheKey)
  if (cached) {
    return cached as TransactionExplanation
  }

  try {
    const client = getSuiClient(network)

    const maxAttempts = Math.max(1, Number(process.env.SUI_RPC_ATTEMPTS || 3))
    const attemptTimeoutMs = Math.max(1000, Number(process.env.SUI_RPC_TIMEOUT_MS || 10_000))

    const withTimeout = async <T>(p: Promise<T>, ms: number): Promise<T> => {
      return await Promise.race<T>([
        p,
        new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms)),
      ])
    }

    let lastError: unknown
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // Fetch with comprehensive options for detailed explanation
        const response = await withTimeout(
          client.getTransactionBlock({
            digest,
            options: {
              showInput: true,
              showRawInput: false,
              showEffects: true,
              showEvents: true,
              showObjectChanges: true,
              showBalanceChanges: true,
            },
          }),
          attemptTimeoutMs,
        )

        const parsed = parseTransaction(response)
        const explanation = generateEnhancedExplanation(parsed)
        
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

export function generateEnhancedExplanation(parsed: ParsedTransaction): TransactionExplanation {
  const gasSUI = formatGasAmount(parsed.gasUsed)
  const gasBudgetSUI = formatGasAmount(parsed.gasBudget)
  
  // Generate multi-level summaries
  const simpleSummary = generateSimpleSummary(parsed, gasSUI)
  const detailedSummary = generateDetailedSummary(parsed, gasSUI, gasBudgetSUI)
  const technicalSummary = generateTechnicalSummary(parsed)

  // Count object changes
  const objectsCreated = parsed.objectChanges.filter((o) => o.type === "created").length
  const objectsMutated = parsed.objectChanges.filter((o) => o.type === "mutated").length
  const objectsTransferred = parsed.objectChanges.filter((o) => o.type === "transferred").length
  const objectsDeleted = parsed.objectChanges.filter((o) => o.type === "deleted").length

  // Extract balance changes if available
  const balanceChanges = extractBalanceChanges(parsed.rawData)
  
  // Determine transaction type
  const transactionType = determineTransactionType(parsed)

  return {
    digest: parsed.digest,
    sender: parsed.sender,
    recipients: parsed.recipients,
    status: parsed.status as "success" | "failed",
    gasUsed: parsed.gasUsed,
    gasBudget: parsed.gasBudget,
    executionStatus: parsed.executionStatus,
    moveCallNames: parsed.moveCalls,
    objectsCreated,
    objectsMutated,
    objectsTransferred,
    objectsDeleted,
    summary: simpleSummary,
    detailedSummary,
    technicalSummary,
    timestamp: parsed.timestamp,
    objects: parsed.objectChanges,
    balanceChanges,
    transactionType,
    userFriendlyContext: generateUserFriendlyContext(parsed, transactionType),
  }
}

function generateSimpleSummary(parsed: ParsedTransaction, gasSUI: string): string {
  const shortSender = truncateAddress(parsed.sender)
  const statusEmoji = parsed.status === "success" ? "✅" : "❌"
  
  let summary = `${statusEmoji} Transaction ${parsed.status === "success" ? "completed successfully" : "failed"}. `
  
  if (parsed.recipients.length > 0) {
    if (parsed.recipients.length === 1) {
      summary += `Sent from ${shortSender} to ${truncateAddress(parsed.recipients[0])}. `
    } else {
      summary += `Sent from ${shortSender} to ${parsed.recipients.length} recipients. `
    }
  } else if (parsed.moveCalls.length > 0) {
    const firstCall = parsed.moveCalls[0].split("::").pop() || parsed.moveCalls[0]
    summary += `${shortSender} executed a smart contract function (${firstCall}). `
  } else {
    summary += `Initiated by ${shortSender}. `
  }
  
  summary += `Gas fee: ${gasSUI} SUI.`
  
  return summary
}

function generateDetailedSummary(parsed: ParsedTransaction, gasSUI: string, gasBudgetSUI: string): string {
  const shortSender = truncateAddress(parsed.sender)
  let summary = ""

  // Transaction outcome
  if (parsed.status === "success") {
    summary += "✅ This transaction was executed successfully on the Sui blockchain. "
  } else {
    summary += "❌ This transaction failed to execute. "
  }

  // What happened
  summary += "\n\n📋 What Happened:\n"
  
  if (parsed.moveCalls.length > 0) {
    summary += `The sender (${shortSender}) called ${parsed.moveCalls.length} smart contract function${parsed.moveCalls.length > 1 ? "s" : ""}:\n`
    parsed.moveCalls.forEach((call, idx) => {
      const [pkg, module, func] = call.split("::")
      summary += `  ${idx + 1}. ${func || call} ${module ? `(from ${module} module)` : ""}\n`
    })
  } else if (parsed.recipients.length > 0) {
    summary += `This was a direct transfer transaction. `
    if (parsed.recipients.length === 1) {
      summary += `Assets were sent to ${truncateAddress(parsed.recipients[0])}.\n`
    } else {
      summary += `Assets were distributed to ${parsed.recipients.length} different addresses.\n`
    }
  } else {
    summary += `The sender performed blockchain operations without transferring assets to other addresses.\n`
  }

  // Object changes
  const hasObjectChanges = parsed.objectChanges.length > 0
  if (hasObjectChanges) {
    summary += "\n🔄 Blockchain State Changes:\n"
    const created = parsed.objectChanges.filter((o) => o.type === "created").length
    const mutated = parsed.objectChanges.filter((o) => o.type === "mutated").length
    const transferred = parsed.objectChanges.filter((o) => o.type === "transferred").length
    const deleted = parsed.objectChanges.filter((o) => o.type === "deleted").length

    if (created > 0) {
      summary += `  • ${created} new object${created > 1 ? "s" : ""} created (like minting new assets)\n`
    }
    if (mutated > 0) {
      summary += `  • ${mutated} object${mutated > 1 ? "s" : ""} modified (existing data updated)\n`
    }
    if (transferred > 0) {
      summary += `  • ${transferred} object${transferred > 1 ? "s" : ""} transferred (ownership changed)\n`
    }
    if (deleted > 0) {
      summary += `  • ${deleted} object${deleted > 1 ? "s" : ""} deleted (removed from blockchain)\n`
    }
  }

  // Gas information
  summary += `\n⛽ Transaction Costs:\n`
  summary += `  • Gas used: ${gasSUI} SUI (the actual fee paid)\n`
  summary += `  • Gas budget: ${gasBudgetSUI} SUI (maximum you were willing to pay)\n`
  const gasEfficiency = (Number(parsed.gasUsed) / Number(parsed.gasBudget) * 100).toFixed(1)
  summary += `  • Efficiency: ${gasEfficiency}% of budget used\n`

  return summary
}

function generateTechnicalSummary(parsed: ParsedTransaction): string {
  let summary = "🔧 Technical Details:\n\n"
  
  summary += `Transaction Digest: ${parsed.digest}\n`
  summary += `Sender: ${parsed.sender}\n`
  summary += `Execution Status: ${parsed.executionStatus}\n`
  summary += `Timestamp: ${new Date(parsed.timestamp).toISOString()}\n\n`

  if (parsed.moveCalls.length > 0) {
    summary += "Move Calls:\n"
    parsed.moveCalls.forEach((call, idx) => {
      summary += `  ${idx + 1}. ${call}\n`
    })
    summary += "\n"
  }

  if (parsed.recipients.length > 0) {
    summary += "Recipients:\n"
    parsed.recipients.forEach((recipient, idx) => {
      summary += `  ${idx + 1}. ${recipient}\n`
    })
    summary += "\n"
  }

  summary += `Gas Used: ${parsed.gasUsed} MIST\n`
  summary += `Gas Budget: ${parsed.gasBudget} MIST\n`

  return summary
}

function generateUserFriendlyContext(parsed: ParsedTransaction, transactionType: string): string {
  const contexts: Record<string, string> = {
    transfer: "💸 This is a simple transfer transaction where digital assets move from one wallet to another, similar to sending money via a banking app.",
    
    "smart_contract": "🤖 This transaction interacted with a smart contract - a piece of code that runs automatically on the blockchain to perform specific functions like trading, staking, or managing assets.",
    
    mint: "🎨 This transaction created (minted) new digital objects on the blockchain, similar to a certificate or token being issued.",
    
    swap: "🔄 This appears to be a token swap transaction, where one type of digital asset is exchanged for another, similar to currency exchange.",
    
    stake: "🔒 This transaction involves staking, which means locking up assets to support the network and potentially earn rewards.",
    
    complex: "⚙️ This is a complex transaction involving multiple operations. It may combine several actions like transfers, smart contract interactions, and state changes."
  }

  return contexts[transactionType] || contexts.complex
}

function determineTransactionType(parsed: ParsedTransaction): string {
  // Simple transfer detection
  if (parsed.moveCalls.length === 0 && parsed.recipients.length > 0) {
    return "transfer"
  }

  // Check move call patterns
  const calls = parsed.moveCalls.join(" ").toLowerCase()
  
  if (calls.includes("swap") || calls.includes("exchange")) {
    return "swap"
  }
  
  if (calls.includes("stake") || calls.includes("delegation")) {
    return "stake"
  }
  
  if (calls.includes("mint") || calls.includes("create")) {
    return "mint"
  }

  if (parsed.moveCalls.length > 0) {
    return "smart_contract"
  }

  if (parsed.objectChanges.length > 3) {
    return "complex"
  }

  return "complex"
}

function extractBalanceChanges(rawData: any): Array<{
  address: string
  coinType: string
  amount: string
}> {
  const changes: Array<{ address: string; coinType: string; amount: string }> = []
  
  if (rawData?.balanceChanges) {
    rawData.balanceChanges.forEach((change: any) => {
      changes.push({
        address: change.owner?.AddressOwner || change.owner || "unknown",
        coinType: change.coinType || "0x2::sui::SUI",
        amount: change.amount || "0",
      })
    })
  }

  return changes
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
        showBalanceChanges: true,
      },
    })

    const parsed = transactions.data.map((tx) => parseTransaction(tx))

    await cacheData(cacheKey, parsed, 3600)

    return parsed
  } catch (error) {
    throw new Error(`Failed to fetch wallet transactions: ${error instanceof Error ? error.message : "Unknown error"}`)
  }
}
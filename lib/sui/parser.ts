import type { SuiTransactionBlockResponse, SuiObjectChange, SuiEvent } from "@mysten/sui/client"
import type { ParsedTransaction, ObjectChange, BalanceChange, TransactionEvent } from "./types"

export function parseTransaction(response: SuiTransactionBlockResponse): ParsedTransaction {
  const effects = response.effects
  const transaction = response.transaction

  if (!effects || !transaction) {
    throw new Error("Invalid transaction response")
  }

  // Extract sender
  const sender = transaction.data.sender || (transaction.data as any).gcSender || "unknown"

  // Extract gas used
  const gasUsed =
    effects.gasUsed?.computationCost && effects.gasUsed?.storageCost
      ? String(
          BigInt(effects.gasUsed.computationCost) +
          BigInt(effects.gasUsed.storageCost) -
          BigInt(effects.gasUsed.storageRebate || 0)
        )
      : "0"

  // Extract recipients and move calls
  const recipients = new Set<string>()
  const moveCalls: string[] = []

  if (transaction.data.kind === "ProgrammableTransaction") {
    const inputs = (transaction.data as any).inputs || []
    const commands = (transaction.data as any).commands || []

    commands.forEach((command: any) => {
      if (command.MoveCall) {
        const moveCall = command.MoveCall
        const packageId = moveCall.package
        const callName = `${packageId}::${moveCall.module}::${moveCall.function}`
        moveCalls.push(callName)
      }

      // Extract recipients from TransferObjects
      if (command.TransferObjects) {
        const transferCmd = command.TransferObjects
        // The address is typically in the second argument
        if (Array.isArray(transferCmd) && transferCmd.length >= 2) {
          const addressArg = transferCmd[1]
          if (addressArg && typeof addressArg === "object" && "Input" in addressArg) {
            const inputIndex = addressArg.Input
            if (typeof inputIndex === "number" && inputs[inputIndex]) {
              const input = inputs[inputIndex]
              if (input.type === "pure" && input.valueType === "address") {
                recipients.add(input.value)
              }
            }
          }
        }
      }
    })
  }

  // Parse object changes with enhanced details
  const objectChanges = response.objectChanges
    ? parseSuiObjectChanges(response.objectChanges)
    : parseObjectChanges(effects)

  // Extract recipients from transferred objects
  objectChanges.forEach((change) => {
    if (change.type === "transferred" && change.owner && change.owner !== sender) {
      recipients.add(change.owner)
    }
  })

  // Parse balance changes
  const balanceChanges = parseBalanceChanges(response.balanceChanges || [])

  // Parse events
  const events = parseEvents(response.events || [])

  return {
    digest: effects.transactionDigest,
    sender,
    recipients: Array.from(recipients),
    status: effects.status.status === "success" ? "success" : "failure",
    gasUsed,
    gasBudget: (transaction.data as any).gasData?.budget || "0",
    executionStatus: effects.status.status,
    moveCalls,
    objectChanges,
    timestamp: Number(response.timestampMs) || Date.now(),
    rawData: response,
    balanceChanges,
    events,
  }
}

function parseSuiObjectChanges(changes: SuiObjectChange[]): ObjectChange[] {
  return changes.map((change) => {
    const baseChange = {
      id: change.objectId,
      objectType: change.objectType || "unknown",
    }

    if (change.type === "created") {
      return {
        ...baseChange,
        type: "created" as const,
        version: change.version,
        digest: change.digest,
        owner: extractOwner(change.owner),
      }
    }
    if (change.type === "mutated") {
      return {
        ...baseChange,
        type: "mutated" as const,
        version: change.version,
        digest: change.digest,
        owner: extractOwner(change.owner),
        previousOwner: extractOwner((change as any).previousOwner),
      }
    }
    if (change.type === "transferred") {
      return {
        ...baseChange,
        type: "transferred" as const,
        version: change.version,
        digest: change.digest,
        owner: extractOwner(change.recipient),
        previousOwner: change.sender,
      }
    }
    if (change.type === "deleted") {
      return {
        ...baseChange,
        type: "deleted" as const,
        objectType: change.objectType || "deleted",
      }
    }
    if (change.type === "wrapped") {
      return {
        ...baseChange,
        type: "wrapped" as const,
        objectType: change.objectType || "wrapped",
      }
    }
    if (change.type === "published") {
      return {
        ...baseChange,
        type: "published" as const,
        objectType: "package",
        version: change.version,
        digest: change.digest,
      }
    }
    
    // Fallback
    return {
      ...baseChange,
      type: "mutated" as const,
    }
  })
}

function parseObjectChanges(effects: any): ObjectChange[] {
  const changes: ObjectChange[] = []

  if (effects.created) {
    effects.created.forEach((obj: any) => {
      changes.push({
        id: obj.reference.objectId,
        type: "created",
        objectType: obj.owner?.ObjectOwner || "unknown",
        version: obj.reference.version,
        digest: obj.reference.digest,
        owner: extractOwner(obj.owner),
      })
    })
  }

  if (effects.mutated) {
    effects.mutated.forEach((obj: any) => {
      changes.push({
        id: obj.reference.objectId,
        type: "mutated",
        objectType: obj.owner?.ObjectOwner || "unknown",
        version: obj.reference.version,
        digest: obj.reference.digest,
        owner: extractOwner(obj.owner),
      })
    })
  }

  if (effects.transferred) {
    effects.transferred.forEach((obj: any) => {
      changes.push({
        id: obj.reference.objectId,
        type: "transferred",
        objectType: "transferred",
        version: obj.reference.version,
        digest: obj.reference.digest,
        owner: extractOwner(obj.recipient),
      })
    })
  }

  if (effects.deleted) {
    effects.deleted.forEach((obj: any) => {
      changes.push({
        id: obj.objectId,
        type: "deleted",
        objectType: "deleted",
      })
    })
  }

  if (effects.wrapped) {
    effects.wrapped.forEach((obj: any) => {
      changes.push({
        id: obj.objectId,
        type: "wrapped",
        objectType: "wrapped",
      })
    })
  }

  return changes
}

function extractOwner(owner: any): string | undefined {
  if (!owner) return undefined
  if (typeof owner === "string") return owner
  if (owner.AddressOwner) return owner.AddressOwner
  if (owner.ObjectOwner) return owner.ObjectOwner
  if (owner.Shared) return "shared"
  if (owner.Immutable) return "immutable"
  return undefined
}

function parseBalanceChanges(balanceChanges: any[]): BalanceChange[] {
  return balanceChanges.map((change) => {
    const amount = change.amount
    const isPositive = amount.startsWith("+") || !amount.startsWith("-")
    const absoluteAmount = amount.replace(/[+-]/g, "")
    
    return {
      owner: change.owner?.AddressOwner || change.owner || "unknown",
      coinType: change.coinType || "0x2::sui::SUI",
      amount: change.amount,
      amountFormatted: formatCoinAmount(absoluteAmount, change.coinType),
      changeType: isPositive ? "receive" : "spend",
    }
  })
}

function parseEvents(events: SuiEvent[]): TransactionEvent[] {
  return events.map((event) => ({
    type: event.type,
    packageId: event.packageId,
    module: event.transactionModule,
    eventType: event.type,
    parsedJson: event.parsedJson,
    bcs: event.bcs,
  }))
}

function formatCoinAmount(amount: string, coinType: string): string {
  try {
    const amountBigInt = BigInt(amount)
    // Assuming 9 decimals for SUI, 6 for USDC, etc.
    const decimals = coinType.includes("sui::SUI") ? 9 : 6
    const divisor = BigInt(10 ** decimals)
    const formatted = Number(amountBigInt) / Number(divisor)
    
    const coinSymbol = coinType.split("::").pop() || "TOKEN"
    return `${formatted.toFixed(6)} ${coinSymbol}`
  } catch {
    return amount
  }
}
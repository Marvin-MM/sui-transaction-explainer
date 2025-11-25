import type { SuiTransactionBlockResponse, SuiObjectChange } from "@mysten/sui/client"
import type { ParsedTransaction, ObjectChange } from "./types"

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
        BigInt(effects.gasUsed.storageRebate || 0),
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
        const callName = `${moveCall.module}::${moveCall.function}`
        moveCalls.push(callName)
      }

      // Extract potential recipients from move call arguments
      if (command.TransferObjects) {
        const transferArgs = command.TransferObjects
        if (transferArgs.address && typeof transferArgs.address === "string") {
          recipients.add(transferArgs.address)
        }
      }
    })
  }

  // Parse object changes
  // Use response.objectChanges if available (it should be if showObjectChanges: true)
  const objectChanges = response.objectChanges
    ? parseSuiObjectChanges(response.objectChanges)
    : parseObjectChanges(effects)

  // Count object changes
  const objectsCreated = objectChanges.filter((obj) => obj.type === "created").length
  const objectsMutated = objectChanges.filter((obj) => obj.type === "mutated").length
  const objectsTransferred = objectChanges.filter((obj) => obj.type === "transferred").length

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
  }
}

function parseSuiObjectChanges(changes: SuiObjectChange[]): ObjectChange[] {
  return changes.map((change) => {
    if (change.type === "created") {
      return {
        id: change.objectId,
        type: "created",
        objectType: change.objectType,
        version: change.version,
        digest: change.digest,
      }
    }
    if (change.type === "mutated") {
      return {
        id: change.objectId,
        type: "mutated",
        objectType: change.objectType,
        version: change.version,
        digest: change.digest,
      }
    }
    if (change.type === "transferred") {
      return {
        id: change.objectId,
        type: "transferred",
        objectType: change.objectType,
        version: change.version,
        digest: change.digest,
      }
    }
    if (change.type === "deleted") {
      return {
        id: change.objectId,
        type: "deleted",
        objectType: "deleted",
      }
    }
    // Fallback for published/wrapped/etc
    return {
      id: (change as any).objectId || "unknown",
      type: "mutated", // Treat others as mutated for now
      objectType: (change as any).objectType || "unknown",
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

  return changes
}

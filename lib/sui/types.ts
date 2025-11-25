export interface TransactionExplanation {
  digest: string
  sender: string
  recipients: string[]
  status: "success" | "failed"
  gasUsed: string
  gasBudget: string
  executionStatus: string
  moveCallNames: string[]
  objectsCreated: number
  objectsMutated: number
  objectsTransferred: number
  summary: string
  timestamp: number
  objects: ObjectChange[]
}

export interface ObjectChange {
  id: string
  type: "created" | "mutated" | "transferred" | "deleted"
  objectType: string
  version?: string
  digest?: string
}

export interface TransactionEffect {
  status: {
    status: "success" | "failure"
    error?: string
  }
  gasUsed: {
    computationCost: string
    storageCost: string
    storageRebate: string
    nonRefundableStorageFee: string
  }
  transactionDigest: string
  created?: Array<{
    owner: {
      AddressOwner?: string
    }
    reference: {
      objectId: string
      version: string
      digest: string
    }
  }>
  mutated?: Array<{
    owner: {
      AddressOwner?: string
    }
    reference: {
      objectId: string
      version: string
      digest: string
    }
  }>
  transferred?: Array<{
    recipient: {
      AddressOwner?: string
    }
    reference: {
      objectId: string
      version: string
      digest: string
    }
  }>
}

export interface ParsedTransaction {
  digest: string
  sender: string
  recipients: string[]
  status: string
  gasUsed: string
  gasBudget: string
  executionStatus: string
  moveCalls: string[]
  objectChanges: ObjectChange[]
  timestamp: number
  rawData: any
}

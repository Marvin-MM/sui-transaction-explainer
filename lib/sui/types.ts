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
  objectsDeleted: number
  summary: string
  timestamp: number
  objects: ObjectChange[]
  
  // Enhanced fields
  detailedSummary: DetailedSummary
  balanceChanges: BalanceChange[]
  events: TransactionEvent[]
  transactionType: TransactionType
  userFriendlyExplanation: string
}

export interface DetailedSummary {
  whatHappened: string
  whoWasInvolved: string[]
  whatWasTransferred: string
  costBreakdown: CostBreakdown
  technicalDetails: string
}

export interface CostBreakdown {
  computationCost: string
  computationCostSUI: string
  storageCost: string
  storageCostSUI: string
  storageRebate: string
  storageRebateSUI: string
  totalGasUsed: string
  totalGasUsedSUI: string
  gasBudget: string
  gasBudgetSUI: string
  nonRefundableStorageFee: string
}

export interface BalanceChange {
  owner: string
  coinType: string
  amount: string
  amountFormatted: string
  changeType: "receive" | "spend"
}

export interface TransactionEvent {
  type: string
  packageId: string
  module: string
  eventType: string
  parsedJson?: any
  bcs?: string
}

export type TransactionType = 
  | "transfer"
  | "move_call"
  | "publish"
  | "upgrade"
  | "split_coin"
  | "merge_coin"
  | "complex"
  | "unknown"

export interface ObjectChange {
  id: string
  type: "created" | "mutated" | "transferred" | "deleted" | "wrapped" | "published"
  objectType: string
  version?: string
  digest?: string
  owner?: string
  previousOwner?: string
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
      ObjectOwner?: string
      Shared?: { initial_shared_version: number }
      Immutable?: boolean
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
      ObjectOwner?: string
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
  deleted?: Array<{
    objectId: string
    version: string
    digest: string
  }>
  wrapped?: Array<{
    objectId: string
    version: string
    digest: string
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
  balanceChanges: BalanceChange[]
  events: TransactionEvent[]
}
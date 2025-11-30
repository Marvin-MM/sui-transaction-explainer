"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { 
  Wallet, 
  ArrowDown, 
  ArrowRight, 
  Code2, 
  Package, 
  Users, 
  FileText,
  TrendingUp,
  RefreshCw,
  Send,
  Trash2,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface TransactionFlowProps {
  sender: string
  recipients: string[]
  moveCalls: string[]
  objectsCreated: number
  objectsMutated: number
  objectsTransferred: number
  objectsDeleted?: number
  transactionType?: string
  balanceChanges?: Array<{
    address: string
    coinType: string
    amount: string
  }>
}

export function TransactionFlow({
  sender,
  recipients,
  moveCalls,
  objectsCreated,
  objectsMutated,
  objectsTransferred,
  objectsDeleted = 0,
  transactionType = "transfer",
  balanceChanges = [],
}: TransactionFlowProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [expandedCall, setExpandedCall] = useState<number | null>(null)

  const truncateAddress = (addr: string) => {
    if (!addr || addr.length <= 12) return addr
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getTransactionTypeIcon = () => {
    switch (transactionType) {
      case "transfer":
        return <Send className="h-4 w-4" />
      case "swap":
        return <RefreshCw className="h-4 w-4" />
      case "stake":
        return <TrendingUp className="h-4 w-4" />
      case "mint":
        return <Package className="h-4 w-4" />
      case "smart_contract":
        return <Code2 className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const formatAmount = (amount: string) => {
    const num = Number(amount) / 1e9
    return num.toFixed(6)
  }

  const getCoinName = (coinType: string) => {
    const parts = coinType.split("::")
    return parts[parts.length - 1] || "SUI"
  }

  return (
    <div className="w-full space-y-6">
      {/* Transaction Type Badge */}
      <div className="flex items-center justify-center gap-2">
        <Badge variant="outline" className="capitalize flex items-center gap-2">
          {getTransactionTypeIcon()}
          {transactionType.replace("_", " ")} Transaction
        </Badge>
      </div>

      {/* Sender Section */}
      <div className="relative">
        <div className="flex items-center justify-center">
          <Card className="w-full max-w-md p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Sender
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => copyToClipboard(sender)}
                  >
                    Copy
                  </Button>
                </div>
                <p className="font-mono text-sm font-semibold break-all">
                  {showDetails ? sender : truncateAddress(sender)}
                </p>
                
                {/* Sender Balance Changes */}
                {balanceChanges.filter(bc => bc.address === sender).map((bc, idx) => {
                  const isPositive = BigInt(bc.amount) > 0
                  return (
                    <div 
                      key={idx} 
                      className={`mt-2 flex items-center justify-between text-xs p-2 rounded ${
                        isPositive 
                          ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400" 
                          : "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400"
                      }`}
                    >
                      <span className="font-medium">{getCoinName(bc.coinType)}</span>
                      <span className="font-mono font-bold">
                        {isPositive ? "+" : ""}{formatAmount(bc.amount)}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>
        </div>
        
        {/* Arrow Down */}
        <div className="flex justify-center my-4">
          <div className="p-2 bg-muted rounded-full">
            <ArrowDown className="h-5 w-5 text-muted-foreground animate-bounce" />
          </div>
        </div>
      </div>

      {/* Move Calls Section */}
      {moveCalls.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Code2 className="h-4 w-4 text-purple-600" />
            <p className="text-sm font-semibold text-muted-foreground">
              Smart Contract Interactions ({moveCalls.length})
            </p>
          </div>
          
          {moveCalls.map((call, index) => {
            const [packageId, module, func] = call.split("::")
            const isExpanded = expandedCall === index
            
            return (
              <Card 
                key={index} 
                className="p-4 cursor-pointer hover:shadow-md transition-all"
                onClick={() => setExpandedCall(isExpanded ? null : index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex items-center justify-center w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full text-purple-600 dark:text-purple-400 font-bold text-xs">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm font-semibold text-purple-600 dark:text-purple-400 truncate">
                        {func || call}
                      </p>
                      {module && (
                        <p className="text-xs text-muted-foreground truncate">
                          {module}
                        </p>
                      )}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}
                </div>
                
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Package ID:</p>
                      <p className="font-mono text-xs break-all bg-muted p-2 rounded">
                        {packageId}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(call)
                      }}
                    >
                      Copy Full Path
                    </Button>
                  </div>
                )}
              </Card>
            )
          })}
          
          {/* Arrow Down */}
          <div className="flex justify-center my-4">
            <div className="p-2 bg-muted rounded-full">
              <ArrowDown className="h-5 w-5 text-muted-foreground animate-bounce" />
            </div>
          </div>
        </div>
      )}

      {/* Object Changes Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Package className="h-4 w-4 text-indigo-600" />
          <p className="text-sm font-semibold text-muted-foreground">
            Blockchain State Changes
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {/* Created */}
          {objectsCreated > 0 && (
            <Card className="p-4 text-center border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30 hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center gap-2">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Package className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-400">
                  {objectsCreated}
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  Created
                </p>
              </div>
            </Card>
          )}

          {/* Mutated */}
          {objectsMutated > 0 && (
            <Card className="p-4 text-center border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center gap-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <RefreshCw className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                  {objectsMutated}
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  Modified
                </p>
              </div>
            </Card>
          )}

          {/* Transferred */}
          {objectsTransferred > 0 && (
            <Card className="p-4 text-center border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/30 hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center gap-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Send className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
                  {objectsTransferred}
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  Transferred
                </p>
              </div>
            </Card>
          )}

          {/* Deleted */}
          {objectsDeleted > 0 && (
            <Card className="p-4 text-center border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center gap-2">
                <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
                  <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <div className="text-2xl font-bold text-red-700 dark:text-red-400">
                  {objectsDeleted}
                </div>
                <p className="text-xs text-muted-foreground font-medium">
                  Deleted
                </p>
              </div>
            </Card>
          )}
        </div>

        {/* Explanation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {objectsCreated > 0 && (
            <div className="p-3 bg-muted rounded-lg border border-border">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-green-600 dark:text-green-400">Created:</span> New objects were minted or generated on the blockchain
              </p>
            </div>
          )}
          {objectsMutated > 0 && (
            <div className="p-3 bg-muted rounded-lg border border-border">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-blue-600 dark:text-blue-400">Modified:</span> Existing objects had their state or data updated
              </p>
            </div>
          )}
          {objectsTransferred > 0 && (
            <div className="p-3 bg-muted rounded-lg border border-border">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-purple-600 dark:text-purple-400">Transferred:</span> Object ownership was changed to different addresses
              </p>
            </div>
          )}
          {objectsDeleted > 0 && (
            <div className="p-3 bg-muted rounded-lg border border-border">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-red-600 dark:text-red-400">Deleted:</span> Objects were permanently removed from the blockchain
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recipients Section */}
      {recipients.length > 0 && (
        <>
          {/* Arrow Down */}
          <div className="flex justify-center my-4">
            <div className="p-2 bg-muted rounded-full">
              <ArrowDown className="h-5 w-5 text-muted-foreground animate-bounce" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-semibold text-muted-foreground">
                Recipients ({recipients.length})
              </p>
            </div>

            <div className={`grid gap-3 ${recipients.length > 1 ? "md:grid-cols-2" : "grid-cols-1 max-w-md mx-auto"}`}>
              {recipients.map((recipient, index) => {
                const recipientChanges = balanceChanges.filter(bc => bc.address === recipient)
                
                return (
                  <Card key={index} className="p-4 hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                        <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Recipient {recipients.length > 1 ? `#${index + 1}` : ""}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={() => copyToClipboard(recipient)}
                          >
                            Copy
                          </Button>
                        </div>
                        <p className="font-mono text-sm font-semibold break-all">
                          {showDetails ? recipient : truncateAddress(recipient)}
                        </p>
                        
                        {/* Recipient Balance Changes */}
                        {recipientChanges.map((bc, idx) => {
                          const isPositive = BigInt(bc.amount) > 0
                          return (
                            <div 
                              key={idx} 
                              className={`mt-2 flex items-center justify-between text-xs p-2 rounded ${
                                isPositive 
                                  ? "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400" 
                                  : "bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400"
                              }`}
                            >
                              <span className="font-medium">{getCoinName(bc.coinType)}</span>
                              <span className="font-mono font-bold">
                                {isPositive ? "+" : ""}{formatAmount(bc.amount)}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* Toggle Details Button */}
      <div className="flex justify-center pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="gap-2"
        >
          {showDetails ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Hide Full Addresses
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Show Full Addresses
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
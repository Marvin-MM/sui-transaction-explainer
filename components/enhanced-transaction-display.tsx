"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info, Zap, Code, TrendingUp, TrendingDown, ArrowRight } from "lucide-react"

interface EnhancedTransactionDisplayProps {
  explanation: {
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
    objectsDeleted?: number
    summary: string
    detailedSummary?: string
    technicalSummary?: string
    timestamp: number
    balanceChanges?: Array<{
      address: string
      coinType: string
      amount: string
    }>
    transactionType?: string
    userFriendlyContext?: string
  }
}

export function EnhancedTransactionDisplay({ explanation }: EnhancedTransactionDisplayProps) {
  const gasEfficiency = (Number(explanation.gasUsed) / Number(explanation.gasBudget) * 100).toFixed(1)
  
  return (
    <div className="space-y-4">
      {/* Status Banner */}
      <Alert className={explanation.status === "success" ? "border-green-500 bg-green-50 dark:bg-green-950" : "border-red-500 bg-red-50 dark:bg-red-950"}>
        <AlertDescription className="flex items-center gap-2">
          <span className="text-2xl">{explanation.status === "success" ? "✅" : "❌"}</span>
          <div>
            <p className="font-semibold">
              Transaction {explanation.status === "success" ? "Successful" : "Failed"}
            </p>
            <p className="text-sm text-muted-foreground">
              {new Date(explanation.timestamp).toLocaleString()}
            </p>
          </div>
        </AlertDescription>
      </Alert>

      {/* User-Friendly Context */}
      {explanation.userFriendlyContext && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm leading-relaxed">{explanation.userFriendlyContext}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transaction Type Badge */}
      {explanation.transactionType && (
        <div className="flex gap-2">
          <Badge variant="secondary" className="capitalize">
            {explanation.transactionType.replace("_", " ")}
          </Badge>
          <Badge variant={explanation.status === "success" ? "default" : "destructive"}>
            {explanation.status}
          </Badge>
        </div>
      )}

      {/* Tabbed Explanations */}
      <Tabs defaultValue="simple" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="simple">Simple</TabsTrigger>
          <TabsTrigger value="detailed">Detailed</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
        </TabsList>

        {/* Simple View */}
        <TabsContent value="simple" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-line">{explanation.summary}</p>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {explanation.objectsCreated}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Objects Created</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {explanation.objectsMutated}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Objects Modified</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {explanation.objectsTransferred}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Objects Transferred</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Number(explanation.gasUsed) / 1e9}
                </div>
                <p className="text-xs text-muted-foreground mt-1">SUI Fee</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Detailed View */}
        <TabsContent value="detailed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Comprehensive Explanation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans bg-muted p-4 rounded-lg">
                  {explanation.detailedSummary || explanation.summary}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Balance Changes */}
          {explanation.balanceChanges && explanation.balanceChanges.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Balance Changes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {explanation.balanceChanges.map((change, idx) => {
                    const isPositive = BigInt(change.amount) > 0
                    const amount = (Number(change.amount) / 1e9).toFixed(6)
                    const coinName = change.coinType.split("::").pop() || "SUI"
                    
                    return (
                      <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2">
                          {isPositive ? (
                            <TrendingUp className="h-4 w-4 text-green-600" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-600" />
                          )}
                          <div>
                            <p className="text-sm font-mono">
                              {change.address.slice(0, 10)}...
                            </p>
                            <p className="text-xs text-muted-foreground">{coinName}</p>
                          </div>
                        </div>
                        <div className={`text-sm font-bold ${isPositive ? "text-green-600" : "text-red-600"}`}>
                          {isPositive ? "+" : ""}{amount}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gas Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gas & Fees Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Gas Used</span>
                <span className="font-mono text-sm font-semibold">
                  {(Number(explanation.gasUsed) / 1e9).toFixed(6)} SUI
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Gas Budget</span>
                <span className="font-mono text-sm">
                  {(Number(explanation.gasBudget) / 1e9).toFixed(6)} SUI
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm text-muted-foreground">Efficiency</span>
                <span className="font-semibold text-sm">
                  {gasEfficiency}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(Number(gasEfficiency), 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Lower percentage means better efficiency - you used less gas than budgeted
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technical View */}
        <TabsContent value="technical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Code className="h-5 w-5" />
                Technical Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs font-mono bg-muted p-4 rounded-lg overflow-x-auto whitespace-pre-wrap">
                {explanation.technicalSummary || explanation.summary}
              </pre>
            </CardContent>
          </Card>

          {/* Move Calls */}
          {explanation.moveCallNames.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Smart Contract Calls</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {explanation.moveCallNames.map((call, idx) => {
                    const [packageId, module, func] = call.split("::")
                    return (
                      <div key={idx} className="p-3 bg-muted rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            Call {idx + 1}
                          </Badge>
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <p className="font-mono text-xs text-blue-600 dark:text-blue-400">
                          {func || call}
                        </p>
                        {module && (
                          <p className="font-mono text-xs text-muted-foreground mt-1">
                            Module: {module}
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Addresses */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Addresses Involved</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Sender</p>
                <p className="font-mono text-xs bg-muted p-2 rounded break-all">
                  {explanation.sender}
                </p>
              </div>
              {explanation.recipients.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Recipients ({explanation.recipients.length})
                  </p>
                  <div className="space-y-1">
                    {explanation.recipients.map((recipient, idx) => (
                      <p key={idx} className="font-mono text-xs bg-muted p-2 rounded break-all">
                        {recipient}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Transaction ID */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transaction Identifier</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-mono text-xs bg-muted p-3 rounded break-all">
                {explanation.digest}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { ArrowRight, AlertCircle, Loader2, BookOpen, Lightbulb } from "lucide-react"
import { motion } from "framer-motion"
import { useSuiClientContext } from "@mysten/dapp-kit"
import { TransactionFlow } from "@/components/transaction-flow"
import { EnhancedTransactionDisplay } from "@/components/enhanced-transaction-display"
import { useUser } from "@/hooks/use-user"

interface ExplanationResult {
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
  remaining: number
}

export default function Home() {
  const [digest, setDigest] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ExplanationResult | null>(null)
  const ctx = useSuiClientContext()
  const { user } = useUser()

  const handleExplain = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ digest, network: ctx.network }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Error: ${response.statusText}`)
      }

      const data = await response.json()
      setResult(data)
      setDigest("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to explain transaction")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-balance">
            Understand Sui Transactions
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
            Get clear, multi-level explanations of any Sui blockchain transaction - from beginner-friendly to technical details.
          </p>
        </motion.div>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="max-w-4xl mx-auto mb-8 grid md:grid-cols-2 gap-4"
        >
          <Card className="border-blue-200 dark:border-blue-900">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">New to Blockchain?</h3>
                  <p className="text-sm text-muted-foreground">
                    Start with the "Simple" tab for easy-to-understand explanations
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-purple-200 dark:border-purple-900">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <BookOpen className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Need Details?</h3>
                  <p className="text-sm text-muted-foreground">
                    Use "Detailed" for comprehensive info or "Technical" for raw data
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Input Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="max-w-2xl mx-auto mb-16"
        >
          <Card>
            <CardHeader>
              <CardTitle>Explain Transaction</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleExplain} className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Paste transaction digest (64 hex characters)"
                    value={digest}
                    onChange={(e) => setDigest(e.target.value)}
                    disabled={loading}
                    className="flex-1 py-5"
                  />
                  <Button disabled={loading || !digest.trim()} className="py-5">
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      <>
                        Explain
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto space-y-6"
          >
            {/* Enhanced Display */}
            <EnhancedTransactionDisplay explanation={result.explanation} />

            {/* Visualization */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transaction Flow Visualization</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Visual representation of how this transaction flowed through the blockchain
                </p>
              </CardHeader>
              <CardContent>
                <TransactionFlow
                  sender={result.explanation.sender}
                  recipients={result.explanation.recipients}
                  moveCalls={result.explanation.moveCallNames}
                  objectsCreated={result.explanation.objectsCreated}
                  objectsMutated={result.explanation.objectsMutated}
                  objectsTransferred={result.explanation.objectsTransferred}
                  objectsDeleted={result.explanation.objectsDeleted}
                  transactionType={result.explanation.transactionType}
                  balanceChanges={result.explanation.balanceChanges}
                />
              </CardContent>
            </Card>

            {/* Rate Limit Info */}
            <Card>
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground text-center">
                  Rate limit remaining: {result.remaining} requests
                </p>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 bg-transparent"
                onClick={() => {
                  setResult(null)
                  setDigest("")
                }}
              >
                Explain Another
              </Button>
              {user ? (
                <Link href="/dashboard" className="flex-1">
                  <Button className="w-full">View History</Button>
                </Link>
              ) : (
                <Button
                  className="flex-1"
                  onClick={() => alert("Please sign in to save and track your transactions")}
                  disabled
                >
                  Sign in to Save
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          {[
            {
              title: "Multi-Level Explanations",
              description: "Choose from simple, detailed, or technical views based on your expertise level",
            },
            {
              title: "Visual Transaction Flow",
              description: "See how assets and objects move through the blockchain with interactive diagrams",
            },
            {
              title: "Comprehensive Details",
              description: "Access gas costs, balance changes, smart contract calls, and more",
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 + i * 0.1 }}
            >
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  )
}
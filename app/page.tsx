"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { ArrowRight, AlertCircle, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { useSuiClientContext } from "@mysten/dapp-kit"
import { TransactionFlow } from "@/components/transaction-flow"
import { useUser } from "@/hooks/use-user"

interface ExplanationResult {
  explanation: {
    digest: string
    sender: string
    recipients: string[]
    status: "success" | "failed"
    gasUsed: string
    moveCallNames: string[]
    objectsCreated: number
    objectsMutated: number
    objectsTransferred: number
    summary: string
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
      {/* Header */}

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-balance">Understand Sui Transactions</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto text-balance">
            Paste a transaction digest and get a human-friendly explanation of what happened on the Sui blockchain.
          </p>
        </motion.div>

        {/* Main Input Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
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
            className="max-w-2xl mx-auto space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transaction Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm leading-relaxed">{result.explanation.summary}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-mono text-sm capitalize">{result.explanation.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gas Used</p>
                    <p className="font-mono text-sm">{Number(result.explanation.gasUsed).toFixed(6)} SUI</p>
                  </div>
                </div>

                {result.explanation.moveCallNames.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Move Calls</p>
                    <div className="space-y-1">
                      {result.explanation.moveCallNames.map((call, i) => (
                        <p key={i} className="text-xs font-mono bg-muted p-2 rounded">
                          {call}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="p-2 bg-muted rounded">
                    <p className="text-muted-foreground">Created</p>
                    <p className="font-bold">{result.explanation.objectsCreated}</p>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <p className="text-muted-foreground">Mutated</p>
                    <p className="font-bold">{result.explanation.objectsMutated}</p>
                  </div>
                  <div className="p-2 bg-muted rounded">
                    <p className="text-muted-foreground">Transferred</p>
                    <p className="font-bold">{result.explanation.objectsTransferred}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">Digest: {result.explanation.digest}</p>
                  <p className="text-xs text-muted-foreground">Rate limit remaining: {result.remaining}</p>
                </div>

                <div className="pt-4">
                  <h3 className="text-sm font-semibold mb-2">Visualization</h3>
                  <TransactionFlow
                    sender={result.explanation.sender}
                    recipients={result.explanation.recipients}
                    moveCalls={result.explanation.moveCallNames}
                    objectsCreated={result.explanation.objectsCreated}
                    objectsMutated={result.explanation.objectsMutated}
                    objectsTransferred={result.explanation.objectsTransferred}
                  />
                </div>
              </CardContent>
            </Card>

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
                  <Button className="w-full">Save & Track History</Button>
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
              title: "Instant Explanations",
              description: "Get clear, readable explanations of any Sui transaction in seconds",
            },
            {
              title: "Save History",
              description: "Sign up to save your transactions and view them anytime",
            },
            {
              title: "Real-time Monitoring",
              description: "Set up webhooks to monitor your wallet's activity",
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
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

"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Download, 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  Wallet,
  Filter,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Calendar,
  Zap,
  BarChart3,
  RefreshCw,
  Copy,
  Check
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useUser } from "@/hooks/use-user"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { generateCSV, downloadCSV, generateEnhancedCSV } from "@/lib/export/csv"
import { generatePDF, generateSimplePDF, generateCompletePDF } from "@/lib/export/pdf"
import { getSuiClient } from "@/lib/sui/client"
import { useSuiClientContext } from "@mysten/dapp-kit"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Transaction {
  id: string
  digest: string
  sender: string
  recipients: string[]
  status: string
  summary: string
  detailedSummary?: string | null
  gasUsed: string
  gasBudget: string
  transactionType?: string | null
  moveCallNames: string[]
  objectsCreated: number
  objectsMutated: number
  objectsTransferred: number
  objectsDeleted?: number
  createdAt: string
  executionStatus?: string | null
  userFriendlyContext?: string | null
  technicalSummary?: string | null
}

export default function DashboardPage() {
  const { user, loading: authLoading, walletAccount } = useUser()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterType, setFilterType] = useState<string>("all")
  const [balance, setBalance] = useState<string | null>(null)
  const [nftOnly, setNftOnly] = useState(false)
  const [minGas, setMinGas] = useState("")
  const [maxGas, setMaxGas] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [expandedTx, setExpandedTx] = useState<string | null>(null)
  const [copiedDigest, setCopiedDigest] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()
  const ctx = useSuiClientContext()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/")
      return
    }

    if (user) {
      loadTransactions(user.id)
    }
  }, [user, authLoading, router])

  useEffect(() => {
    async function fetchBalance() {
      if (walletAccount) {
        const client = getSuiClient(ctx.network as any)
        try {
          const { totalBalance } = await client.getBalance({ owner: walletAccount.address })
          setBalance((Number(totalBalance) / 1e9).toFixed(4))
        } catch (e) {
          console.error("Failed to fetch balance", e)
        }
      }
    }
    fetchBalance()
  }, [walletAccount, ctx.network])

  async function loadTransactions(userId: string) {
    try {
      const res = await fetch("/api/transactions")
      if (res.ok) {
        const data = await res.json()
        setTransactions(data.transactions || [])
      }
    } catch (e) {
      console.error("Failed to fetch transactions", e)
    }
    setLoading(false)
  }

  const handleRefresh = async () => {
    if (!user) return
    setRefreshing(true)
    await loadTransactions(user.id)
    setRefreshing(false)
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedDigest(id)
    setTimeout(() => setCopiedDigest(null), 2000)
  }

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.digest.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.sender.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = filterStatus === "all" || tx.status === filterStatus
    const matchesType = filterType === "all" || tx.transactionType === filterType

    const gasVal = Number(tx.gasUsed) / 1e9
    const matchesMinGas = minGas ? gasVal >= Number(minGas) : true
    const matchesMaxGas = maxGas ? gasVal <= Number(maxGas) : true

    const matchesNft = nftOnly 
      ? tx.summary.toLowerCase().includes("nft") || 
        tx.summary.toLowerCase().includes("mint") ||
        tx.transactionType === "mint"
      : true

    return matchesSearch && matchesStatus && matchesType && matchesMinGas && matchesMaxGas && matchesNft
  })

  // Calculate stats
  const successRate = transactions.length > 0 
    ? ((transactions.filter(t => t.status === "success").length / transactions.length) * 100).toFixed(1)
    : "0"
  
  const totalGasUsed = transactions.reduce((sum, tx) => sum + Number(tx.gasUsed), 0) / 1e9
  const avgGas = transactions.length > 0 ? (totalGasUsed / transactions.length).toFixed(6) : "0"

  const transactionTypes = transactions.reduce((acc, tx) => {
    const type = tx.transactionType || "unknown"
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.email || user.name}</p>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            {balance && (
              <Card className="px-4 py-3 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Wallet className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Balance</p>
                    <p className="text-xl font-bold text-primary">{balance} SUI</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Transactions</p>
                  <p className="text-3xl font-bold">{transactions.length}</p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Success Rate</p>
                  <p className="text-3xl font-bold text-green-600">{successRate}%</p>
                </div>
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                  <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Gas Used</p>
                  <p className="text-3xl font-bold">{totalGasUsed.toFixed(4)}</p>
                  <p className="text-xs text-muted-foreground">SUI</p>
                </div>
                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                  <Zap className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Avg Gas/Tx</p>
                  <p className="text-3xl font-bold">{avgGas}</p>
                  <p className="text-xs text-muted-foreground">SUI</p>
                </div>
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                  <BarChart3 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transaction Types Overview */}
        {Object.keys(transactionTypes).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Transaction Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(transactionTypes).map(([type, count]) => (
                    <Badge key={type} variant="secondary" className="capitalize">
                      {type}: {count}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filters & Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <CardTitle className="text-lg">Transactions</CardTitle>
                  <CardDescription>
                    {filteredTransactions.length} of {transactions.length} transactions
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="mr-2 h-4 w-4" />
                    {showFilters ? "Hide" : "Show"} Filters
                    {showFilters ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>CSV Export</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => {
                        const csv = generateEnhancedCSV(filteredTransactions as any, false)
                        downloadCSV(csv, `transactions-simple-${Date.now()}.csv`)
                      }}>
                        <FileText className="mr-2 h-4 w-4" />
                        Simple CSV
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        const csv = generateCSV(filteredTransactions as any)
                        downloadCSV(csv, `transactions-complete-${Date.now()}.csv`)
                      }}>
                        <FileText className="mr-2 h-4 w-4" />
                        Complete CSV
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuLabel>PDF Export</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => generateSimplePDF(filteredTransactions as any)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Simple PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => generatePDF(filteredTransactions as any)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Standard PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => generateCompletePDF(filteredTransactions as any)}>
                        <FileText className="mr-2 h-4 w-4" />
                        Complete PDF
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardContent className="space-y-4 border-t pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by digest, summary, or sender..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-full md:w-40">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="success">Success</SelectItem>
                          <SelectItem value="failure">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-full md:w-40">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          {Object.keys(transactionTypes).map(type => (
                            <SelectItem key={type} value={type} className="capitalize">
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 items-end">
                      <div className="flex gap-2 items-center flex-wrap">
                        <div className="grid gap-1.5">
                          <Label htmlFor="min-gas" className="text-xs">Min Gas (SUI)</Label>
                          <Input
                            id="min-gas"
                            type="number"
                            placeholder="0.0"
                            className="w-32"
                            value={minGas}
                            onChange={(e) => setMinGas(e.target.value)}
                          />
                        </div>
                        <div className="grid gap-1.5">
                          <Label htmlFor="max-gas" className="text-xs">Max Gas (SUI)</Label>
                          <Input
                            id="max-gas"
                            type="number"
                            placeholder="1.0"
                            className="w-32"
                            value={maxGas}
                            onChange={(e) => setMaxGas(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 pb-2">
                        <Checkbox
                          id="nft-only"
                          checked={nftOnly}
                          onCheckedChange={(c) => setNftOnly(!!c)}
                        />
                        <Label htmlFor="nft-only" className="text-sm">NFT/Mint Only</Label>
                      </div>
                      {(searchTerm || filterStatus !== "all" || filterType !== "all" || minGas || maxGas || nftOnly) && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSearchTerm("")
                            setFilterStatus("all")
                            setFilterType("all")
                            setMinGas("")
                            setMaxGas("")
                            setNftOnly(false)
                          }}
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Transactions List */}
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-lg font-semibold mb-2">No transactions found</p>
                  <p className="text-sm text-muted-foreground">
                    {transactions.length === 0 
                      ? "Start by explaining a transaction on the home page"
                      : "Try adjusting your filters"
                    }
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            filteredTransactions.map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="hover:shadow-lg transition-all group">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            {tx.transactionType && (
                              <Badge variant="secondary" className="capitalize">
                                {tx.transactionType}
                              </Badge>
                            )}
                            <Badge 
                              variant={tx.status === "success" ? "default" : "destructive"}
                              className={tx.status === "success" 
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" 
                                : ""
                              }
                            >
                              {tx.status}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Zap className="h-3 w-3" />
                              {(Number(tx.gasUsed) / 1e9).toFixed(6)} SUI
                            </div>
                          </div>
                          
                          <div className="flex items-start gap-2">
                            <p className="text-sm font-mono text-primary break-all flex-1">
                              {tx.digest}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => copyToClipboard(tx.digest, tx.id)}
                            >
                              {copiedDigest === tx.id ? (
                                <Check className="h-3 w-3 text-green-600" />
                              ) : (
                                <Copy className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {tx.summary}
                          </p>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedTx(expandedTx === tx.id ? null : tx.id)}
                        >
                          {expandedTx === tx.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {/* Expanded Details */}
                      <AnimatePresence>
                        {expandedTx === tx.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t pt-3 space-y-3"
                          >
                            {tx.userFriendlyContext && (
                              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                                <p className="text-sm">{tx.userFriendlyContext}</p>
                              </div>
                            )}
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div>
                                <p className="text-muted-foreground text-xs mb-1">Objects Created</p>
                                <p className="font-semibold">{tx.objectsCreated}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs mb-1">Objects Modified</p>
                                <p className="font-semibold">{tx.objectsMutated}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs mb-1">Objects Transferred</p>
                                <p className="font-semibold">{tx.objectsTransferred}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs mb-1">Objects Deleted</p>
                                <p className="font-semibold">{tx.objectsDeleted || 0}</p>
                              </div>
                            </div>

                            {tx.moveCallNames.length > 0 && (
                              <div>
                                <p className="text-xs text-muted-foreground mb-2">Smart Contract Calls</p>
                                <div className="space-y-1">
                                  {tx.moveCallNames.map((call, idx) => (
                                    <p key={idx} className="text-xs font-mono bg-muted p-2 rounded">
                                      {call.split("::").pop() || call}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="flex justify-end gap-2 pt-2">
                              <Button variant="outline" size="sm" asChild>
                                <a 
                                  href={`https://suiscan.xyz/${ctx.network}/tx/${tx.digest}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  View on Explorer
                                </a>
                              </Button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </section>
    </main>
  )
}
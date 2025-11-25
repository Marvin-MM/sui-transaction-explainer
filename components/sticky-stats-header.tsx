// components/sticky-stats-header.tsx
"use client"

import { useEffect, useState } from "react"
import { useSuiPrice } from "@/hooks/use-sui-price"
import { useSuiGasFee } from "@/hooks/use-sui-gas-fee"
import { useAppStore } from "@/lib/store/app-store"
import { useSuiClientContext } from "@mysten/dapp-kit"
import { TrendingUp, TrendingDown, Zap, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export function StickyStatsHeader() {
  const { data: priceData, isLoading: priceLoading, error: priceError } = useSuiPrice()
  const { data: gasFee, isLoading: gasLoading, error: gasError } = useSuiGasFee()
  const network = useAppStore((state) => state.network)
  const setNetwork = useAppStore((state) => state.setNetwork)
  const ctx = useSuiClientContext()
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  // Sync network with Sui client context
  useEffect(() => {
    if (ctx.network) {
      const networkMap: Record<string, "mainnet" | "testnet" | "devnet" | "localnet"> = {
        mainnet: "mainnet",
        testnet: "testnet",
        devnet: "devnet",
        localnet: "localnet",
      }
      const mappedNetwork = networkMap[ctx.network] || "mainnet"
      if (mappedNetwork !== network) {
        setNetwork(mappedNetwork)
        console.log("[StickyStatsHeader] Network synced to:", mappedNetwork)
      }
    }
  }, [ctx.network, network, setNetwork])

  // Scroll visibility handler
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setIsVisible(currentScrollY < lastScrollY || currentScrollY < 50)
      setLastScrollY(currentScrollY)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [lastScrollY])

  const getNetworkStatus = () => {
    const networkConfig = {
      mainnet: { color: "bg-green-500", label: "Mainnet" },
      testnet: { color: "bg-yellow-500", label: "Testnet" },
      devnet: { color: "bg-blue-500", label: "Devnet" },
      localnet: { color: "bg-gray-500", label: "Localnet" },
    }
    return networkConfig[network as keyof typeof networkConfig] || networkConfig.mainnet
  }

  const networkStatus = getNetworkStatus()

  const renderPrice = () => {
    if (priceLoading) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-foreground font-medium animate-pulse">Loading...</span>
        </div>
      )
    }
    if (priceError) {
      return (
        <div className="flex items-center gap-1 text-destructive">
          <AlertCircle className="h-2 w-2" />
          <span>Error</span>
        </div>
      )
    }
    if (priceData) {
      const isPositive = priceData.changePercentage24h >= 0
      const ChangeIcon = isPositive ? TrendingUp : TrendingDown
      
      return (
        <div className="flex items-center gap-2">
          <span className="text-foreground font-medium">${priceData.current.toFixed(2)}</span>
          <div className={cn(
            "flex items-center gap-1 text-xs font-medium px-1 rounded",
            isPositive ? "text-green-600" : "text-red-600"
          )}>
            <ChangeIcon className="h-3 w-3" />
            <span>{isPositive ? '+' : ''}{priceData.changePercentage24h.toFixed(2)}%</span>
          </div>
        </div>
      )
    }
    return <span className="text-destructive">—</span>
  }

  const renderGasFee = () => {
    if (gasLoading) {
      return <span className="text-foreground font-medium animate-pulse">Loading...</span>
    }
    if (gasError) {
      return (
        <span className="text-destructive flex items-center">
          <AlertCircle className="h-1 w-1" />
          Error
        </span>
      )
    }
    if (gasFee !== undefined) {
      return <span className="text-foreground font-medium">{gasFee.toFixed(9)} SUI</span>
    }
    return <span className="text-destructive">—</span>
  }

  return (
<div
  className={cn(
    "fixed top-0 left-0 right-0 z-40 bg-gradient-to-r from-background via-background to-background/80 backdrop-blur-sm border-b border-border/40",
    "transition-all duration-300 ease-out",
    isVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none",
  )}
>
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    
    <div className="flex items-center justify-between py-3 text-xs">

      {/* LEFT SIDE: SUI + GAS */}
      <div className="flex items-center gap-6">
        
        {/* SUI Price */}
        <div className="flex items-center gap-2 min-w-max">
          <TrendingUp className="h-4 w-4 text-primary" />
          <span className="text-muted-foreground">SUI:</span>
          {renderPrice()}
        </div>
        
        {/* Avg Gas */}
        <div className="flex items-center gap-2 min-w-max hidden md:flex">
          <Zap className="h-4 w-4 text-yellow-500" />
          <span className="text-muted-foreground">Gas Fee:</span>
          {renderGasFee()}
        </div>

      </div>

      {/* RIGHT SIDE: NETWORK */}
      <div className="flex items-center gap-2 min-w-max">
        <div className={cn("h-2 w-2 rounded-full animate-pulse", networkStatus.color)} />
        <span className="text-muted-foreground">Network:</span>
        <span className="text-foreground font-medium capitalize">{networkStatus.label}</span>
      </div>

    </div>

  </div>
</div>

  )
}
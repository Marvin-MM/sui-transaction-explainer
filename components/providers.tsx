"use client"

import type React from "react"

import { createNetworkConfig, SuiClientProvider, WalletProvider } from "@mysten/dapp-kit"
import { getFullnodeUrl } from "@mysten/sui/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "next-themes"
import { useState } from "react"
import { WalletSync } from "@/components/wallet-sync"
import { AuthSync } from "@/components/auth-sync"

const { networkConfig } = createNetworkConfig({
  localnet: { url: getFullnodeUrl("localnet") },
  devnet: { url: getFullnodeUrl("devnet") },
  testnet: { url: getFullnodeUrl("testnet") },
  mainnet: { url: getFullnodeUrl("mainnet") },
})

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={networkConfig} defaultNetwork="mainnet">
        <WalletProvider autoConnect={true}>
          <WalletSync />
          <AuthSync />
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            {children}
          </ThemeProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  )
}

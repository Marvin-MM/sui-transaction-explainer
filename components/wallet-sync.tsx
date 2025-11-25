"use client"

import { useCurrentAccount } from "@mysten/dapp-kit"
import { useEffect, useRef } from "react"
import { useAuthStore } from "@/lib/store/auth-store"
import { toast } from "sonner"

export function WalletSync() {
  const account = useCurrentAccount()
  const lastSyncedAddress = useRef<string | null>(null)
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    // If user is not logged in, we don't sync to DB, but we don't force disconnect either.
    // The user might just want to use the app with wallet only (if that's a feature).
    // But per requirements, we want to sync if logged in.

    if (!user) {
      // Reset synced address if user logs out
      lastSyncedAddress.current = null
      return
    }

    if (account && account.address !== lastSyncedAddress.current) {
      const syncWallet = async () => {
        try {
          await fetch("/api/wallet/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              address: account.address,
              provider: "sui",
            }),
          })
          lastSyncedAddress.current = account.address
          toast.success("Wallet connected successfully!")
        } catch (error) {
          console.error("Failed to sync wallet:", error)
          toast.error("Failed to connect wallet")
        }
      }

      syncWallet()
    }
  }, [account, user])

  return null
}

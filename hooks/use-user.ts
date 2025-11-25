"use client"

import { useCurrentAccount } from "@mysten/dapp-kit"
import { authClient } from "@/lib/auth-client"

export function useUser() {
    const { data: session, isPending } = authClient.useSession()
    const currentAccount = useCurrentAccount()

    return {
        user: session?.user || null,
        walletAccount: currentAccount,
        loading: isPending,
        isAuthenticated: !!session?.user || !!currentAccount,
    }
}

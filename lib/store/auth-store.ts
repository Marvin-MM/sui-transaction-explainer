import { create } from "zustand"
// import type { User } from "better-auth" // BetterAuth types might be tricky to import directly depending on setup, using any for now or inferring
import { authClient } from "@/lib/auth-client"

type User = typeof authClient.$Infer.Session.user

interface AuthState {
  user: User | null
  walletAddress: string | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setWalletAddress: (address: string | null) => void
  setIsLoading: (loading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  walletAddress: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setWalletAddress: (walletAddress) => set({ walletAddress }),
  setIsLoading: (isLoading) => set({ isLoading }),
  logout: () => set({ user: null, walletAddress: null }),
}))

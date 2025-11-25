import { create } from "zustand"
import { persist } from "zustand/middleware"

interface AppState {
  network: "mainnet" | "testnet" | "devnet" | "localnet"
  setNetwork: (network: "mainnet" | "testnet" | "devnet" | "localnet") => void
  theme: "light" | "dark" | "system"
  setTheme: (theme: "light" | "dark" | "system") => void
  isSettingsOpen: boolean
  setSettingsOpen: (open: boolean) => void
  gasPricePerUnit: number | null
  setGasPricePerUnit: (price: number | null) => void
  suiPrice: number | null
  setSuiPrice: (price: number | null) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      network: "mainnet",
      setNetwork: (network) => set({ network }),
      theme: "system",
      setTheme: (theme) => set({ theme }),
      isSettingsOpen: false,
      setSettingsOpen: (open) => set({ isSettingsOpen: open }),
      gasPricePerUnit: null,
      setGasPricePerUnit: (price) => set({ gasPricePerUnit: price }),
      suiPrice: null,
      setSuiPrice: (price) => set({ suiPrice: price }),
    }),
    {
      name: "app-store",
      partialize: (state) => ({
        network: state.network,
        theme: state.theme,
      }),
    },
  ),
)

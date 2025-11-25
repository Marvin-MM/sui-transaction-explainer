"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings, LogOut, ChevronDown, Menu } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { ConnectButton, useCurrentAccount, useDisconnectWallet, useSuiClientContext } from "@mysten/dapp-kit"
import { SettingsModal } from "@/components/settings-modal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useAppStore } from "@/lib/store/app-store"
import { useSuiPrice } from "@/hooks/use-sui-price"
import { TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

export function Navbar() {
  const { data: session, isPending: isLoading } = authClient.useSession()
  const user = session?.user
  const currentAccount = useCurrentAccount()
  const { mutate: disconnectWallet } = useDisconnectWallet()
  const settingsOpen = useAppStore((state) => state.isSettingsOpen)
  const setSettingsOpen = useAppStore((state) => state.setSettingsOpen)
  const setNetwork = useAppStore((state) => state.setNetwork)
  const ctx = useSuiClientContext()
  const { data: priceData } = useSuiPrice()

  const handleSignOut = async () => {
    await authClient.signOut()
    if (currentAccount) {
      disconnectWallet()
    }
  }

  const handleSignIn = async (provider: "google" | "apple") => {
    await authClient.signIn.social({
      provider,
      callbackURL: "/dashboard", // Redirect to dashboard after login
    })
  }

  const handleNetworkChange = (network: string) => {
    ctx.selectNetwork(network)
    const networkMap: Record<string, "mainnet" | "testnet" | "devnet" | "localnet"> = {
      mainnet: "mainnet",
      testnet: "testnet",
      devnet: "devnet",
      localnet: "localnet",
    }
    setNetwork(networkMap[network] || "mainnet")
    console.log("[v0] Network changed to:", network)
  }

  const networks = ["mainnet", "testnet", "devnet"]

  return (
    <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 mt-11">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
              S
            </div>
            <h1 className="text-xl font-bold hidden sm:block">Sui Explainer</h1>
          </Link>

          {/* Network Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="ml-4 capitalize bg-transparent">
                {ctx.network} <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {networks.map((net) => (
                <DropdownMenuItem key={net} onClick={() => handleNetworkChange(net)} className="capitalize">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn("h-2 w-2 rounded-full", {
                        "bg-green-500": net === "mainnet",
                        "bg-yellow-500": net === "testnet",
                        "bg-blue-500": net === "devnet",
                      })}
                    />
                    <span>{net}</span>
                    {net === "mainnet" && priceData && (
                      <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" /> ${priceData.current.toFixed(2)}
                      </span>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-3">
            <ConnectButton className="!bg-primary !text-primary-foreground !h-9 !px-4 !py-2 !text-sm !font-medium rounded-md z-40" />

            {!user && !isLoading ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    Get Started <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Sign In</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleSignIn("google")}>Continue with Google</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSignIn("apple")}>Continue with Apple</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.image || "/placeholder.svg"} alt={user.name || user.email || ""} />
                      <AvatarFallback>{user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/dashboard">Dashboard</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}

            {/* <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)}>
              <Settings className="h-5 w-5" />
            </Button> */}
          </div>

          {/* Mobile Nav */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent>
                <div className="flex flex-col gap-4 mt-4">
                  <ConnectButton />
                  {!user && !isLoading ? (
                    <>
                      <Button onClick={() => handleSignIn("google")}>Continue with Google</Button>
                      <Button onClick={() => handleSignIn("apple")}>Continue with Apple</Button>
                    </>
                  ) : user ? (
                    <>
                      <Link href="/dashboard">
                        <Button variant="ghost" className="w-full justify-start">
                          Dashboard
                        </Button>
                      </Link>
                      <Button variant="ghost" className="w-full justify-start" onClick={handleSignOut}>
                        Log out
                      </Button>
                    </>
                  ) : null}
                  <Button variant="ghost" className="w-full justify-start" onClick={() => setSettingsOpen(true)}>
                    Settings
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* Settings Modal - controlled from Zustand store */}
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />
    </header>
  )
}

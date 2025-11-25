"use client"

import { useEffect, useState } from "react"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, AlertTriangle, Copy, Check, Trash2 } from "lucide-react"
import { useCurrentAccount, useDisconnectWallet } from "@mysten/dapp-kit"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface UserProfile {
  email: string
  displayName: string
  walletAddress: string | null
  createdAt: string
}

export default function ProfilePage() {
  const { data: session, isPending: authLoading } = authClient.useSession()
  const user = session?.user
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [displayName, setDisplayName] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const currentAccount = useCurrentAccount()
  const { mutate: disconnectWallet } = useDisconnectWallet()

  useEffect(() => {
    async function loadProfile() {
      if (authLoading) return
      if (!user) {
        router.push("/")
        return
      }

      // Fetch profile data
      try {
        const res = await fetch("/api/user/profile")
        if (res.ok) {
          const data = await res.json()
          setProfile(data.profile)
          setDisplayName(data.profile?.displayName || "")
        }
      } catch (error) {
        console.error("Failed to load profile:", error)
      }

      setLoading(false)
    }

    loadProfile()
  }, [user, authLoading, router])

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName }),
      })

      if (res.ok) {
        toast.success("Profile updated successfully")
        const data = await res.json()
        setProfile(data.profile)
      } else {
        toast.error("Failed to update profile")
      }
    } catch (error) {
      toast.error("An error occurred")
    } finally {
      setSaving(false)
    }
  }

  const handleDisconnectWallet = async () => {
    try {
      const res = await fetch("/api/wallet/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      if (res.ok) {
        disconnectWallet()
        setProfile((prev) =>
          prev
            ? {
              ...prev,
              walletAddress: null,
            }
            : null,
        )
        toast.success("Wallet disconnected successfully")
      } else {
        toast.error("Failed to disconnect wallet")
      }
    } catch (error) {
      console.error("Failed to disconnect wallet:", error)
      toast.error("Failed to disconnect wallet")
    }
  }

  const handleDeleteAccount = async () => {
    setDeletingAccount(true)
    try {
      const res = await fetch("/api/user/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      if (res.ok) {
        toast.success("Account deleted successfully")
        // Sign out and redirect to home
        await authClient.signOut()
        router.push("/")
      } else {
        toast.error("Failed to delete account")
      }
    } catch (error) {
      console.error("Failed to delete account:", error)
      toast.error("Failed to delete account")
    } finally {
      setDeletingAccount(false)
    }
  }

  const copyToClipboard = async () => {
    if (profile?.walletAddress) {
      await navigator.clipboard.writeText(profile.walletAddress)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-muted">
      <header className="border-b border-border/40 bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold">My Profile</h1>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>Manage your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">Your email cannot be changed</p>
              </div>

              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your display name"
                />
                <p className="text-xs text-muted-foreground mt-1">This name will appear in your transaction records</p>
              </div>

              <div>
                <Label>Account Created</Label>
                <Input
                  type="text"
                  value={
                    profile?.createdAt
                      ? new Date(profile.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })
                      : "Loading..."
                  }
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
              </div>

              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Wallet Management */}
          <Card>
            <CardHeader>
              <CardTitle>Wallet Management</CardTitle>
              <CardDescription>Manage your connected wallet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {profile?.walletAddress ? (
                <>
                  <div>
                    <Label>Connected Wallet Address</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="text"
                        value={profile.walletAddress}
                        disabled
                        className="bg-muted cursor-not-allowed font-mono text-sm"
                      />
                      <Button variant="outline" size="icon" onClick={copyToClipboard} title="Copy wallet address">
                        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Your wallet is connected and your transactions are being tracked.
                    </p>
                  </div>

                  <Button variant="destructive" onClick={handleDisconnectWallet}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Disconnect Wallet
                  </Button>

                  <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800 dark:text-orange-200 text-sm">
                      Disconnecting your wallet will remove all associated wallet data from our platform.
                    </AlertDescription>
                  </Alert>
                </>
              ) : (
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">No wallet connected</p>
                  <p className="text-sm text-muted-foreground">
                    Use the "Connect Wallet" button in the navigation to connect your wallet and track transactions.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Security & Privacy */}
          <Card>
            <CardHeader>
              <CardTitle>Security & Privacy</CardTitle>
              <CardDescription>Manage your account security and data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-red-200 bg-red-50 dark:bg-red-950/20">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800 dark:text-red-200 text-sm">
                  Deleting your account is permanent and cannot be undone. All your data will be removed.
                </AlertDescription>
              </Alert>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Account</AlertDialogTitle>
                    <AlertDialogDescription className="space-y-2 py-2">
                      <p>This action cannot be undone. This will permanently delete your account and remove:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Your profile and account information</li>
                        <li>All saved transactions</li>
                        <li>All webhooks and preferences</li>
                        <li>Connected wallet data</li>
                      </ul>
                      <p className="font-semibold mt-4">Are you sure?</p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteAccount}
                    disabled={deletingAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deletingAccount ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete Account"
                    )}
                  </AlertDialogAction>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </div>
      </section>
    </main>
  )
}

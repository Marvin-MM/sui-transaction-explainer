// "use client"

// import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
// import { Label } from "@/components/ui/label"
// import { Switch } from "@/components/ui/switch"
// import { useTheme } from "next-themes"
// import { useState, useEffect } from "react"
// import { Button } from "@/components/ui/button"
// import { Sun, Moon, Plus, Trash2, LogOut } from "lucide-react"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { Input } from "@/components/ui/input"
// import { useAuthStore } from "@/lib/store/auth-store"
// import { Card, CardContent } from "@/components/ui/card"
// import { toast } from "sonner"
// import { useCurrentAccount, useDisconnectWallet } from "@mysten/dapp-kit"

// interface Webhook {
//   id: string
//   url: string
//   name: string
//   isActive: boolean
// }

// interface SettingsModalProps {
//   open: boolean
//   onOpenChange: (open: boolean) => void
// }

// export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
//   const { theme, setTheme } = useTheme()
//   const user = useAuthStore((state) => state.user)
//   const [webhooks, setWebhooks] = useState<Webhook[]>([])
//   const [newWebhookUrl, setNewWebhookUrl] = useState("")
//   const [newWebhookName, setNewWebhookName] = useState("")
//   const [loadingWebhooks, setLoadingWebhooks] = useState(false)
//   const [emailNotifications, setEmailNotifications] = useState(true)
//   const [pushNotifications, setPushNotifications] = useState(true)
//   const currentAccount = useCurrentAccount()
//   const { mutate: disconnectWallet } = useDisconnectWallet()

//   useEffect(() => {
//     if (user && open) {
//       fetchWebhooks()
//       fetchPreferences()
//     }
//   }, [user, open])

//   const fetchPreferences = async () => {
//     if (!user) return
//     try {
//       const res = await fetch("/api/user/preferences")
//       if (res.ok) {
//         const data = await res.json()
//         setEmailNotifications(data.preferences?.emailNotifications ?? true)
//         setPushNotifications(data.preferences?.pushNotifications ?? true)
//       }
//     } catch (e) {
//       console.error("Failed to fetch preferences:", e)
//     }
//   }

//   const updatePreferences = async () => {
//     if (!user) return
//     try {
//       const res = await fetch("/api/user/preferences", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           emailNotifications,
//           pushNotifications,
//         }),
//       })
//       if (res.ok) {
//         toast.success("Preferences updated")
//       } else {
//         toast.error("Failed to update preferences")
//       }
//     } catch (e) {
//       console.error("Error updating preferences:", e)
//       toast.error("Error updating preferences")
//     }
//   }

//   const fetchWebhooks = async () => {
//     setLoadingWebhooks(true)
//     try {
//       const res = await fetch("/api/webhooks")
//       if (res.ok) {
//         const data = await res.json()
//         setWebhooks(data.webhooks || [])
//       }
//     } catch (e) {
//       console.error(e)
//     } finally {
//       setLoadingWebhooks(false)
//     }
//   }

//   const handleAddWebhook = async () => {
//     if (!newWebhookUrl || !newWebhookName) return
//     try {
//       const res = await fetch("/api/webhooks", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           url: newWebhookUrl,
//           name: newWebhookName,
//           integration: "discord",
//           triggerNewTransaction: true,
//         }),
//       })
//       if (res.ok) {
//         setNewWebhookUrl("")
//         setNewWebhookName("")
//         fetchWebhooks()
//         toast.success("Webhook added successfully")
//       } else {
//         toast.error("Failed to add webhook")
//       }
//     } catch (e) {
//       console.error(e)
//       toast.error("An error occurred")
//     }
//   }

//   const handleDisconnectWallet = async () => {
//     try {
//       const res = await fetch("/api/wallet/disconnect", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//       })
//       if (res.ok) {
//         disconnectWallet()
//         toast.success("Wallet disconnected successfully")
//       } else {
//         toast.error("Failed to disconnect wallet")
//       }
//     } catch (e) {
//       console.error("Failed to disconnect wallet:", e)
//       toast.error("Failed to disconnect wallet")
//     }
//   }

//   return (
//     <Dialog open={open} onOpenChange={onOpenChange}>
//       <DialogContent className="sm:max-w-[500px]">
//         <DialogHeader>
//           <DialogTitle>Settings</DialogTitle>
//           <DialogDescription>Manage your preferences and integrations.</DialogDescription>
//         </DialogHeader>

//         <Tabs defaultValue="general" className="w-full">
//           <TabsList className="grid w-full grid-cols-3">
//             <TabsTrigger value="general">General</TabsTrigger>
//             <TabsTrigger value="notifications">Notifications</TabsTrigger>
//             <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
//           </TabsList>

//           <TabsContent value="general" className="space-y-4 py-4">
//             <div className="flex items-center justify-between space-x-2">
//               <Label htmlFor="theme-mode" className="flex flex-col space-y-1">
//                 <span>Appearance</span>
//                 <span className="font-normal text-xs text-muted-foreground">Switch between light and dark mode</span>
//               </Label>
//               <div className="flex items-center space-x-2">
//                 <Button
//                   variant={theme === "light" ? "default" : "outline"}
//                   size="icon"
//                   onClick={() => setTheme("light")}
//                 >
//                   <Sun className="h-4 w-4" />
//                 </Button>
//                 <Button variant={theme === "dark" ? "default" : "outline"} size="icon" onClick={() => setTheme("dark")}>
//                   <Moon className="h-4 w-4" />
//                 </Button>
//               </div>
//             </div>

//             {user && (
//               <div className="border-t pt-4">
//                 <h3 className="text-sm font-semibold mb-3">Wallet Management</h3>
//                 {currentAccount ? (
//                   <Card className="bg-muted/50">
//                     <CardContent className="pt-4">
//                       <p className="text-xs text-muted-foreground mb-2">Connected Wallet</p>
//                       <p className="text-sm font-mono truncate mb-3">{currentAccount.address}</p>
//                       <Button variant="destructive" size="sm" onClick={handleDisconnectWallet} className="w-full">
//                         <LogOut className="mr-2 h-4 w-4" />
//                         Disconnect Wallet
//                       </Button>
//                       <p className="text-xs text-muted-foreground mt-2">
//                         Disconnecting will remove all wallet data from our platform.
//                       </p>
//                     </CardContent>
//                   </Card>
//                 ) : (
//                   <p className="text-sm text-muted-foreground">
//                     No wallet connected. Use the Connect Wallet button in the navigation to connect.
//                   </p>
//                 )}
//               </div>
//             )}
//           </TabsContent>

//           <TabsContent value="notifications" className="space-y-4 py-4">
//             {!user ? (
//               <div className="text-center text-muted-foreground py-8">Please sign in to manage notifications.</div>
//             ) : (
//               <div className="space-y-4">
//                 <div className="flex items-center justify-between space-x-2">
//                   <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
//                     <span>Email Notifications</span>
//                     <span className="font-normal text-xs text-muted-foreground">
//                       Receive transaction updates via email
//                     </span>
//                   </Label>
//                   <Switch
//                     id="email-notifications"
//                     checked={emailNotifications}
//                     onCheckedChange={setEmailNotifications}
//                   />
//                 </div>

//                 <div className="flex items-center justify-between space-x-2">
//                   <Label htmlFor="push-notifications" className="flex flex-col space-y-1">
//                     <span>Push Notifications</span>
//                     <span className="font-normal text-xs text-muted-foreground">Receive real-time alerts</span>
//                   </Label>
//                   <Switch id="push-notifications" checked={pushNotifications} onCheckedChange={setPushNotifications} />
//                 </div>

//                 <Button onClick={updatePreferences} className="w-full">
//                   Save Notification Preferences
//                 </Button>
//               </div>
//             )}
//           </TabsContent>

//           <TabsContent value="webhooks" className="space-y-4 py-4">
//             {!user ? (
//               <div className="text-center text-muted-foreground py-8">Please sign in to manage webhooks.</div>
//             ) : (
//               <>
//                 <div className="space-y-4">
//                   <div className="grid gap-2">
//                     <Label>Add New Webhook</Label>
//                     <Input
//                       placeholder="Webhook Name"
//                       value={newWebhookName}
//                       onChange={(e) => setNewWebhookName(e.target.value)}
//                     />
//                     <div className="flex gap-2">
//                       <Input
//                         placeholder="https://discord.com/api/webhooks/..."
//                         value={newWebhookUrl}
//                         onChange={(e) => setNewWebhookUrl(e.target.value)}
//                       />
//                       <Button onClick={handleAddWebhook} disabled={!newWebhookUrl || !newWebhookName}>
//                         <Plus className="h-4 w-4" />
//                       </Button>
//                     </div>
//                   </div>
//                 </div>

//                 <div className="space-y-2 mt-4">
//                   <Label>Active Webhooks</Label>
//                   {loadingWebhooks ? (
//                     <div className="text-sm text-muted-foreground">Loading...</div>
//                   ) : webhooks.length === 0 ? (
//                     <div className="text-sm text-muted-foreground">No webhooks configured.</div>
//                   ) : (
//                     webhooks.map((webhook) => (
//                       <Card key={webhook.id}>
//                         <CardContent className="px-2 flex justify-between items-center">
//                           <div>
//                             <p className="font-medium text-sm">{webhook.name}</p>
//                             <p className="text-xs text-muted-foreground truncate max-w-[200px]">{webhook.url}</p>
//                           </div>
//                           <Button variant="ghost" size="sm" className="text-destructive">
//                             <Trash2 className="h-4 w-4" />
//                           </Button>
//                         </CardContent>
//                       </Card>
//                     ))
//                   )}
//                 </div>
//               </>
//             )}
//           </TabsContent>
//         </Tabs>
//       </DialogContent>
//     </Dialog>
//   )
// }

"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useTheme } from "next-themes"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Sun, Moon, Plus, Trash2, LogOut, Languages, Wallet } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuthStore } from "@/lib/store/auth-store"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { useCurrentAccount, useDisconnectWallet } from "@mysten/dapp-kit"

interface Webhook {
  id: string
  url: string
  name: string
  isActive: boolean
}

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const { theme, setTheme } = useTheme()
  const user = useAuthStore((state) => state.user)
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [newWebhookUrl, setNewWebhookUrl] = useState("")
  const [newWebhookName, setNewWebhookName] = useState("")
  const [loadingWebhooks, setLoadingWebhooks] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [language, setLanguage] = useState("en")
  const [savingLocalization, setSavingLocalization] = useState(false)
  const currentAccount = useCurrentAccount()
  const { mutate: disconnectWallet } = useDisconnectWallet()

  useEffect(() => {
    if (open) {
      // Load saved language from localStorage
      const savedLanguage = localStorage.getItem("language") || "en"
      setLanguage(savedLanguage)
      
      if (user) {
        fetchWebhooks()
        fetchPreferences()
      }
    }
  }, [user, open])

  const fetchPreferences = async () => {
    if (!user) return
    try {
      const res = await fetch("/api/user/preferences")
      if (res.ok) {
        const data = await res.json()
        setEmailNotifications(data.preferences?.emailNotifications ?? true)
        setPushNotifications(data.preferences?.pushNotifications ?? true)
      }
    } catch (e) {
      console.error("Failed to fetch preferences:", e)
    }
  }

  const updatePreferences = async () => {
    if (!user) return
    try {
      const res = await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailNotifications,
          pushNotifications,
        }),
      })
      if (res.ok) {
        toast.success("Preferences updated")
      } else {
        toast.error("Failed to update preferences")
      }
    } catch (e) {
      console.error("Error updating preferences:", e)
      toast.error("Error updating preferences")
    }
  }

  const saveLocalizationSettings = async () => {
    setSavingLocalization(true)
    try {
      // Save language to localStorage
      localStorage.setItem("language", language)
      
      // If user is logged in, you might want to save to database as well
      if (user) {
        // Optional: Save language preference to user profile in database
        // await fetch("/api/user/profile", {
        //   method: "POST",
        //   headers: { "Content-Type": "application/json" },
        //   body: JSON.stringify({ language }),
        // })
      }
      
      toast.success("Language preference saved")
      
      // Optional: Reload the page to apply language changes immediately
      // window.location.reload()
      
    } catch (error) {
      console.error("Failed to save localization settings:", error)
      toast.error("Failed to save language preference")
    } finally {
      setSavingLocalization(false)
    }
  }

  const fetchWebhooks = async () => {
    setLoadingWebhooks(true)
    try {
      const res = await fetch("/api/webhooks")
      if (res.ok) {
        const data = await res.json()
        setWebhooks(data.webhooks || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingWebhooks(false)
    }
  }

  const handleAddWebhook = async () => {
    if (!newWebhookUrl || !newWebhookName) return
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: newWebhookUrl,
          name: newWebhookName,
          integration: "discord",
          triggerNewTransaction: true,
        }),
      })
      if (res.ok) {
        setNewWebhookUrl("")
        setNewWebhookName("")
        fetchWebhooks()
        toast.success("Webhook added successfully")
      } else {
        toast.error("Failed to add webhook")
      }
    } catch (e) {
      console.error(e)
      toast.error("An error occurred")
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
        toast.success("Wallet disconnected successfully")
      } else {
        toast.error("Failed to disconnect wallet")
      }
    } catch (e) {
      console.error("Failed to disconnect wallet:", e)
      toast.error("Failed to disconnect wallet")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Manage your preferences and integrations.</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6 py-4">
            {/* Appearance Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Appearance</h3>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="theme-mode" className="flex flex-col space-y-1">
                  <span>Theme</span>
                  <span className="font-normal text-xs text-muted-foreground">Switch between light and dark mode</span>
                </Label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    size="icon"
                    onClick={() => setTheme("light")}
                  >
                    <Sun className="h-4 w-4" />
                  </Button>
                  <Button variant={theme === "dark" ? "default" : "outline"} size="icon" onClick={() => setTheme("dark")}>
                    <Moon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Localization Section */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-semibold text-foreground">Localization</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="language" className="flex flex-col space-y-1">
                    <span>Language</span>
                    <span className="font-normal text-xs text-muted-foreground">Interface language preference</span>
                  </Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger id="language" className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="zh">简体中文</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="de">Deutsch</SelectItem>
                      <SelectItem value="ja">日本語</SelectItem>
                      <SelectItem value="ko">한국어</SelectItem>
                      <SelectItem value="ru">Русский</SelectItem>
                      <SelectItem value="pt">Português</SelectItem>
                      <SelectItem value="hi">हिन्दी</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">
                    Language preference is saved to your browser's local storage.
                  </p>
                </div>

                <Button 
                  onClick={saveLocalizationSettings} 
                  disabled={savingLocalization}
                  size="sm"
                  className="w-full"
                >
                  {savingLocalization ? "Saving..." : "Save Language"}
                </Button>
              </div>
            </div>

            {/* Wallet Management Section */}
            {user && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-semibold text-foreground">Wallet Management</h3>
                {currentAccount ? (
                  <Card className="bg-muted/50">
                    <CardContent className="pt-4">
                      <p className="text-xs text-muted-foreground mb-2">Connected Wallet</p>
                      <p className="text-sm font-mono truncate mb-3">{currentAccount.address.trim().slice(0, 18) + "..." + currentAccount.address.trim().slice(-8)}</p>
                      <Button variant="destructive" size="sm" onClick={handleDisconnectWallet} className="w-full">
                        <Wallet className="mr-2 h-4 w-4" />
                        Disconnect Wallet
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Disconnecting will remove all wallet data from our platform.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No wallet connected. Use the Connect Wallet button in the navigation to connect.
                  </p>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4 py-4">
            {!user ? (
              <div className="text-center text-muted-foreground py-8">Please sign in to manage notifications.</div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="email-notifications" className="flex flex-col space-y-1">
                    <span>Email Notifications</span>
                    <span className="font-normal text-xs text-muted-foreground">
                      Receive transaction updates via email
                    </span>
                  </Label>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={setEmailNotifications}
                  />
                </div>

                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="push-notifications" className="flex flex-col space-y-1">
                    <span>Push Notifications</span>
                    <span className="font-normal text-xs text-muted-foreground">Receive real-time alerts</span>
                  </Label>
                  <Switch id="push-notifications" checked={pushNotifications} onCheckedChange={setPushNotifications} />
                </div>

                <Button onClick={updatePreferences} className="w-full">
                  Save Notification Preferences
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="webhooks" className="space-y-4 py-4">
            {!user ? (
              <div className="text-center text-muted-foreground py-8">Please sign in to manage webhooks.</div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label>Add New Webhook</Label>
                    <Input
                      placeholder="Webhook Name"
                      value={newWebhookName}
                      onChange={(e) => setNewWebhookName(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="https://discord.com/api/webhooks/..."
                        value={newWebhookUrl}
                        onChange={(e) => setNewWebhookUrl(e.target.value)}
                      />
                      <Button onClick={handleAddWebhook} disabled={!newWebhookUrl || !newWebhookName}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <Label>Active Webhooks</Label>
                  {loadingWebhooks ? (
                    <div className="text-sm text-muted-foreground">Loading...</div>
                  ) : webhooks.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No webhooks configured.</div>
                  ) : (
                    webhooks.map((webhook) => (
                      <Card key={webhook.id}>
                        <CardContent className="px-2 flex justify-between items-center">
                          <div>
                            <p className="font-medium text-sm">{webhook.name}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{webhook.url}</p>
                          </div>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
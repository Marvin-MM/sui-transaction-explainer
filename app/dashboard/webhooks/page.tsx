"use client"

import { useEffect, useState } from "react"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertCircle, Plus, Trash2, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface Webhook {
  id: string
  name: string
  description?: string
  url: string
  integration: string
  isActive: boolean
  triggerNewTransaction: boolean
  triggerObjectCreated: boolean
  triggerTransferIn: boolean
  triggerTransferOut: boolean
}

export default function WebhooksPage() {
  const { data: session, isPending: authLoading } = authClient.useSession()
  const user = session?.user
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newWebhook, setNewWebhook] = useState({
    name: "",
    url: "",
    integration: "discord",
    triggerNewTransaction: true,
    triggerObjectCreated: false,
    triggerTransferIn: false,
    triggerTransferOut: false,
  })
  const [openDialog, setOpenDialog] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function loadWebhooks() {
      if (authLoading) return
      if (!user) {
        router.push("/login")
        return
      }

      try {
        const response = await fetch("/api/webhooks")
        const data = await response.json()
        setWebhooks(data.webhooks || [])
      } catch (err) {
        setError("Failed to load webhooks")
      } finally {
        setLoading(false)
      }
    }

    loadWebhooks()
  }, [user, authLoading, router])

  const handleCreate = async () => {
    setCreating(true)
    try {
      const response = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newWebhook),
      })

      if (!response.ok) throw new Error("Failed to create webhook")

      const webhook = await response.json()
      setWebhooks([...webhooks, webhook])
      setNewWebhook({
        name: "",
        url: "",
        integration: "discord",
        triggerNewTransaction: true,
        triggerObjectCreated: false,
        triggerTransferIn: false,
        triggerTransferOut: false,
      })
      setOpenDialog(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create webhook")
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/webhooks/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete webhook")

      setWebhooks(webhooks.filter((w) => w.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete webhook")
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Webhooks</h1>
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Webhook
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Webhook</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newWebhook.name}
                    onChange={(e) =>
                      setNewWebhook((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="My Discord Webhook"
                  />
                </div>
                <div>
                  <Label htmlFor="url">Webhook URL</Label>
                  <Input
                    id="url"
                    type="url"
                    value={newWebhook.url}
                    onChange={(e) =>
                      setNewWebhook((prev) => ({
                        ...prev,
                        url: e.target.value,
                      }))
                    }
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label htmlFor="integration">Integration</Label>
                  <Select
                    value={newWebhook.integration}
                    onValueChange={(value) =>
                      setNewWebhook((prev) => ({
                        ...prev,
                        integration: value,
                      }))
                    }
                  >
                    <SelectTrigger id="integration">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discord">Discord</SelectItem>
                      <SelectItem value="slack">Slack</SelectItem>
                      <SelectItem value="zapier">Zapier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3 border-t pt-4">
                  <Label>Triggers</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">New Transaction</span>
                      <Switch
                        checked={newWebhook.triggerNewTransaction}
                        onCheckedChange={(checked) =>
                          setNewWebhook((prev) => ({
                            ...prev,
                            triggerNewTransaction: checked,
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Object Created</span>
                      <Switch
                        checked={newWebhook.triggerObjectCreated}
                        onCheckedChange={(checked) =>
                          setNewWebhook((prev) => ({
                            ...prev,
                            triggerObjectCreated: checked,
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Transfer In</span>
                      <Switch
                        checked={newWebhook.triggerTransferIn}
                        onCheckedChange={(checked) =>
                          setNewWebhook((prev) => ({
                            ...prev,
                            triggerTransferIn: checked,
                          }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Transfer Out</span>
                      <Switch
                        checked={newWebhook.triggerTransferOut}
                        onCheckedChange={(checked) =>
                          setNewWebhook((prev) => ({
                            ...prev,
                            triggerTransferOut: checked,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
                <Button onClick={handleCreate} disabled={creating} className="w-full">
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Webhook"
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {webhooks.length === 0 ? (
          <Card>
            <CardContent className="pt-12 text-center text-muted-foreground">
              No webhooks yet. Create one to start monitoring transactions.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {webhooks.map((webhook) => (
              <Card key={webhook.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{webhook.name}</h3>
                      <p className="text-sm font-mono text-muted-foreground truncate">{webhook.url}</p>
                      <div className="flex gap-2 mt-3">
                        <span className="text-xs px-2 py-1 bg-muted rounded">{webhook.integration}</span>
                        <span
                          className={`text-xs px-2 py-1 rounded ${webhook.isActive
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100"
                            }`}
                        >
                          {webhook.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(webhook.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

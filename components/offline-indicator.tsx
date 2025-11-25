"use client"

import { useEffect, useState } from "react"
import { WifiOff } from "lucide-react"

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  if (isOnline) return null

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-100 border border-yellow-400 rounded-lg p-3 flex items-center gap-2 text-yellow-800 shadow-lg">
      <WifiOff className="h-4 w-4" />
      <span className="text-sm">You are offline. Using cached data.</span>
    </div>
  )
}

"use client"

import { useEffect } from "react"
import { useAuthStore } from "@/lib/store/auth-store"
import { authClient } from "@/lib/auth-client"

export function AuthSync() {
  const setUser = useAuthStore((state) => state.setUser)
  const setIsLoading = useAuthStore((state) => state.setIsLoading)
  const { data: session, isPending } = authClient.useSession()

  useEffect(() => {
    if (isPending) return
    setUser(session?.user || null)
    setIsLoading(false)
  }, [session, isPending, setUser, setIsLoading])

  return null
}

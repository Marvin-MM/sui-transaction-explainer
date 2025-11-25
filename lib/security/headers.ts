import type { NextResponse } from "next/server"

export function addSecurityHeaders(response: NextResponse) {
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY")

  // Prevent MIME sniffing
  response.headers.set("X-Content-Type-Options", "nosniff")

  // Enable XSS protection
  response.headers.set("X-XSS-Protection", "1; mode=block")

  // Referrer policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")

  // Content Security Policy
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;",
  )

  // Permissions Policy
  response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=(), payment=()")

  return response
}

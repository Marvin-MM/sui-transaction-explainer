import { NextResponse } from "next/server"
import { addSecurityHeaders } from "@/lib/security/headers"

export async function middleware(request: Request) {
  const response = NextResponse.next()
  return addSecurityHeaders(response)
}

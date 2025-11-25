import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from "next/server"

const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales: ['en', 'zh'],

  // Used when no locale matches
  defaultLocale: 'en'
});

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const publicRoutes = ["/", "/login", "/signup", "/signup-success", "/wallet-connect", "/callback", "/api/auth"]

  // Skip middleware for public routes and assets
  if (
    publicRoutes.some((route) => pathname === route || pathname.startsWith(route)) ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return undefined
  }

  // Run intl middleware
  return intlMiddleware(request)
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}

import type React from "react"
import type { Metadata } from "next"
import { Inter, Roboto_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Providers } from "@/components/providers"
import { Navbar } from "@/components/navbar"
import { Toaster } from "@/components/ui/sonner"
import { StickyStatsHeader } from "@/components/sticky-stats-header"
import { Footer } from "@/components/footer"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono",
})

export const metadata: Metadata = {
  title: "Sui Transaction Explainer - Understand Blockchain Transactions",
  description:
    "Paste a Sui transaction digest and get a human-friendly explanation of what happened on the blockchain.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/sui-logo.svg",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/sui-logo.svg",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/sui-logo.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/sui-logo.svg",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preload" href="https://cdn.jsdelivr.net/npm/@mysten/dapp-kit@latest/dist/index.css" as="style" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mysten/dapp-kit@latest/dist/index.css" />
      </head>
      <body className={`${inter.variable} ${robotoMono.variable} font-sans antialiased flex flex-col min-h-screen`}>
        <Providers>
          <StickyStatsHeader />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster />
          <Analytics />
        </Providers>
      </body>
    </html>
  )
}

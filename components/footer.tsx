"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Github, Twitter, Mail, ExternalLink } from "lucide-react"

export function Footer() {
  const [isVisible, setIsVisible] = useState(true)

  return (
    <footer
      className={`relative border-t border-border/40 bg-gradient-to-b from-background via-background/80 to-background/50 transition-all duration-500 ease-out transform ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
      }`}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 animate-pulse" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Main footer grid */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4 py-5">
          {/* Brand section */}
          <div className="space-y-4 animate-in fade-in duration-700">
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-foreground">Sui Explainer</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Demystifying blockchain transactions on the Sui network with clear, human-friendly explanations.
              </p>
            </div>
          </div>

          {/* Product Links */}
          <div className="space-y-4 animate-in fade-in duration-700 delay-100">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Product</h4>
            <ul className="space-y-3">
              {[
                { label: "Explainer", href: "/" },
                { label: "Dashboard", href: "/dashboard" },
                { label: "History", href: "/dashboard/history" },
                { label: "Settings", href: "/dashboard/settings" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 group flex items-center gap-1"
                  >
                    {link.label}
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-4 animate-in fade-in duration-700 delay-200">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Resources</h4>
            <ul className="space-y-3">
              {[
                { label: "Sui Docs", href: "https://docs.sui.io" },
                { label: "Sui Explorer", href: "https://suiscan.xyz" },
                { label: "Pyth Network", href: "https://pyth.network" },
                { label: "GitHub", href: "https://github.com" },
              ].map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-300 group flex items-center gap-1"
                  >
                    {link.label}
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div className="space-y-4 animate-in fade-in duration-700 delay-300">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">Connect</h4>
            <div className="flex gap-3">
              {[
                {
                  icon: Twitter,
                  href: "https://twitter.com",
                  label: "Twitter",
                  color: "hover:text-blue-400",
                },
                {
                  icon: Github,
                  href: "https://github.com",
                  label: "GitHub",
                  color: "hover:text-gray-400",
                },
                {
                  icon: Mail,
                  href: "mailto:hello@suiexplainer.com",
                  label: "Email",
                  color: "hover:text-red-400",
                },
              ].map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target={social.href.startsWith("mailto") ? undefined : "_blank"}
                    rel={social.href.startsWith("mailto") ? undefined : "noopener noreferrer"}
                    aria-label={social.label}
                    className={`p-2 rounded-lg bg-muted text-muted-foreground transition-all duration-300 hover:bg-primary/20 ${social.color} group`}
                  >
                    <Icon className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
                  </a>
                )
              })}
            </div>
          </div>
        </div>

        {/* Divider with gradient */}
        <div className="my-8 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* Bottom section */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-in fade-in duration-700 delay-400">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Sui Transaction Explainer. All rights reserved.
          </p>
          <div className="flex gap-6">
            {[
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Terms of Service", href: "/terms" },
              { label: "Contact", href: "/contact" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-300"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

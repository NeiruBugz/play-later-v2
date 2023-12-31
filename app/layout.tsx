import "@/styles/globals.css"

import { Metadata } from "next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { GeistSans } from "geist/font/sans"
import NextTopLoader from "nextjs-toploader"

import { siteConfig } from "@/config/site"
import { cn } from "@/lib/utils"
import ReactQuery from "@/components/query-provider"
import { TailwindIndicator } from "@/components/tailwind-indicator"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  description: siteConfig.description,
  icons: {
    apple: "/apple-touch-icon.png",
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
  },
  themeColor: [
    { color: "white", media: "(prefers-color-scheme: light)" },
    { color: "black", media: "(prefers-color-scheme: dark)" },
  ],
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background antialiased",
          GeistSans.className
        )}
      >
        <NextTopLoader />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ReactQuery>{children}</ReactQuery>
          <TailwindIndicator />
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  )
}

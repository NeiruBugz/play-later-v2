import "@/styles/globals.css"
import { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"

import { siteConfig } from "@/config/site"
import { fontSans } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { SiteHeader } from "@/components/site-header"
import { TailwindIndicator } from "@/components/tailwind-indicator"
import { ThemeProvider } from "@/components/theme-provider"

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <>
      <ClerkProvider
        appearance={{
          elements: {
            userButtonPopoverCard:
              "bg-popover text-popover-foreground shadow-ring-2",
            userPopoverMain: "text-popover-foreground",
            userPreviewTextContainer: "text-popover-foreground",
            userPreviewSecondaryIdentifier: "text-popover-foreground",
            userButtonPopoverActionButton: "group hover:bg-muted",
            userButtonPopoverActionButtonIcon:
              "text-popover-foreground group-hover:text-muted-foreground",
            userButtonPopoverActionButtonText:
              "text-popover-foreground group-hover:text-muted-foreground",
            userButtonPopoverFooter: "text-popover-foreground hidden",
            headerTitle: "text-card-foreground",
            headerSubtitle: "text-card-foreground",
            footerActionText: "text-card-foreground",
            footerActionLink: "",
            formButtonPrimary:
              "bg-primary text-primary-foreground hover:bg-primary/90",
            socialButtonsBlockButton:
              "border border-input hover:bg-accent hover:text-accent-foreground text-primary",
            card: "bg-card",
          },
        }}
      >
        <html lang="en" suppressHydrationWarning>
          <head />
          <body
            className={cn(
              "min-h-screen bg-background font-sans antialiased",
              fontSans.variable
            )}
          >
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              <div className="relative flex min-h-screen flex-col">
                <div className="flex-1">{children}</div>
              </div>
              <TailwindIndicator />
            </ThemeProvider>
          </body>
        </html>
      </ClerkProvider>
    </>
  )
}

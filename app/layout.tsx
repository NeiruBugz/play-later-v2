import "@/styles/globals.css";

import { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Providers from "@/providers";
import NextTopLoader from "nextjs-toploader";

import { Toaster } from "@/components/ui/toaster";
import { TailwindIndicator } from "@/components/tailwind-indicator";

import { siteConfig } from "@/lib/config/site";
import type { RootLayoutProps } from "@/lib/types/layout";
import { cn } from "@/lib/utils";

export const viewport: Viewport = {
  themeColor: [
    { color: "white", media: "(prefers-color-scheme: light)" },
    { color: "black", media: "(prefers-color-scheme: dark)" },
  ],
};

export const metadata: Metadata = {
  description: siteConfig.description,
  icons: {
    apple: "/apple-touch-icon.png",
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
  },
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
};

const fontInter = Inter({ subsets: ["latin", "cyrillic"] });

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background antialiased",
          fontInter.className
        )}
      >
        <NextTopLoader />
        <Providers attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
          <TailwindIndicator />
        </Providers>
      </body>
    </html>
  );
}

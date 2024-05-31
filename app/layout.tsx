import { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import type { PropsWithChildren } from "react";

import "@/src/app/styles/globals.css";
import { siteConfig } from "@/src/shared/config/site";
import { cn } from "@/src/shared/lib/tailwind-merge";
import { TailwindIndicator } from "@/src/shared/ui/tailwind-indicator";
import { Toaster } from "@/src/shared/ui/toaster";

import Providers from "@/src/app/providers";

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

export default function RootLayout({ children }: PropsWithChildren) {
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

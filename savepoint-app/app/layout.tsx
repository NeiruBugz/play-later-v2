import { type Metadata, type Viewport } from "next";

import { LoadingScreen } from "@/shared/components/loading-screen";
import { cn } from "@/shared/lib";
import { Providers } from "@/shared/providers";

import "@/shared/globals.css";

import {
  DM_Mono as FontMono,
  Roboto as FontSans,
  Playfair_Display as FontSerif,
} from "next/font/google";
import { Suspense } from "react";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
});

const fontSerif = FontSerif({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  preload: true,
});

const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  preload: true,
  weight: ["300", "400", "500"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { color: "white", media: "(prefers-color-scheme: light)" },
    { color: "black", media: "(prefers-color-scheme: dark)" },
  ],
  colorScheme: "light dark",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://SavePoint.vercel.app"),
  title: "SavePoint - Your Personal Gaming Library & Journal",
  description:
    "Curate your gaming library and journal your experiences. For patient gamers who view games as worlds to explore, not chores to complete.",
  keywords: [
    "game backlog",
    "gaming",
    "game tracker",
    "video games",
    "game collection",
    "game management",
  ],
  authors: [{ name: "SavePoint Team" }],
  creator: "SavePoint Team",
  publisher: "SavePoint",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://SavePoint.vercel.app",
    title: "SavePoint",
    description: "SavePoint – Your ultimate game backlog companion",
    siteName: "SavePoint",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SavePoint - Game Backlog Manager",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SavePoint",
    description: "SavePoint – Your ultimate game backlog companion",
    images: ["/og-image.png"],
  },
  category: "entertainment",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background relative min-h-screen antialiased",
          "selection:bg-primary/20 selection:text-primary-foreground",
          `font-sans ${fontSans.variable} ${fontMono.variable} ${fontSerif.variable} antialiased`
        )}
      >
        <Providers
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div id="root" className="relative flex min-h-screen flex-col">
            <Suspense fallback={<LoadingScreen />}>{children}</Suspense>
          </div>
        </Providers>
      </body>
    </html>
  );
}

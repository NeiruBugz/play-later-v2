import Providers from "@/providers";
import { type Metadata, type Viewport } from "next";
import { Inter as FontSans } from "next/font/google";

import { cn } from "@/shared/lib";

import "@/shared/globals.css";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
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
  metadataBase: new URL("https://playlater.vercel.app"),
  title: {
    default: "PlayLater",
    template: "%s - PlayLater",
  },
  description:
    "PlayLater – Your ultimate game backlog companion. Track, organize, and manage your gaming library with ease.",
  keywords: [
    "game backlog",
    "gaming",
    "game tracker",
    "video games",
    "game collection",
    "game management",
  ],
  authors: [{ name: "PlayLater Team" }],
  creator: "PlayLater Team",
  publisher: "PlayLater",
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
    url: "https://playlater.vercel.app",
    title: "PlayLater",
    description: "PlayLater – Your ultimate game backlog companion",
    siteName: "PlayLater",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "PlayLater - Game Backlog Manager",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PlayLater",
    description: "PlayLater – Your ultimate game backlog companion",
    images: ["/og-image.png"],
  },
  category: "entertainment",
};

type RootLayoutProps = {
  readonly children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" suppressHydrationWarning className={fontSans.variable}>
      <body
        className={cn(
          "relative min-h-screen bg-background font-sans antialiased",
          "selection:bg-primary/20 selection:text-primary-foreground"
        )}
      >
        <Providers
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div id="root" className="relative flex min-h-screen flex-col">
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}

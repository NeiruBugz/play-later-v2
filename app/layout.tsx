import Providers from "@/providers";
import type { Metadata, Viewport } from "next";
import { Inter as FontSans } from "next/font/google";
import "@/src/shared/globals.css";
import { SendFeedbackForm } from "@/src/features/send-feedback/ui/send-feedback-form";
import { cn } from "@/src/shared/lib";

export const viewport: Viewport = {
  themeColor: [
    { color: "white", media: "(prefers-color-scheme: light)" },
    { color: "black", media: "(prefers-color-scheme: dark)" },
  ],
};

export const metadata: Metadata = {
  icons: {
    apple: "/apple-touch-icon.png",
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
  },
  title: {
    default: "PlayLater",
    template: `%s - PlayLater`,
  },
  description: "PlayLater – Your ultimate game backlog companion",
  openGraph: {
    title: "PlayLater",
    description: "PlayLater – Your ultimate game backlog companion",
    siteName: "PlayLater",
    url: "https://playlater.vercel.app",
  },
};

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout(props: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "relative min-h-screen bg-gray-900 font-sans antialiased",
          fontSans.variable
        )}
      >
        <Providers attribute="class" defaultTheme="system" enableSystem>
          {props.children}
          <SendFeedbackForm />
        </Providers>
      </body>
    </html>
  );
}

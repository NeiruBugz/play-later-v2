import Providers from "@/providers";
import "@/styles/globals.css";
import { cn } from "@/src/shared/lib";
import { Metadata, Viewport } from "next";
import { Inter as FontSans } from "next/font/google";

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
          "min-h-screen bg-background font-sans antialiased",
          fontSans.variable
        )}
      >
        <Providers>{props.children}</Providers>
      </body>
    </html>
  );
}

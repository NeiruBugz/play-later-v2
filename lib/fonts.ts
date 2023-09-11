import {
  JetBrains_Mono as FontMono,
  Inter as FontSans,
  Roboto,
} from "next/font/google"

export const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const roboto = Roboto({
  weight: "500",
  subsets: ["latin"],
  variable: "--font-roboto",
})

export const fontMono = FontMono({
  subsets: ["latin"],
  variable: "--font-mono",
})

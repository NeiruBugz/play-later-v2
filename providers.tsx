"use client"

import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SessionProvider } from "next-auth/react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { ThemeProviderProps } from "next-themes/dist/types"

export default function Providers({
  children,
  ...props
}: React.PropsWithChildren<ThemeProviderProps>) {
  const [queryClient] = React.useState(() => new QueryClient())
  return (
    <NextThemesProvider {...props}>
      <SessionProvider>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </SessionProvider>
    </NextThemesProvider>
  )
}

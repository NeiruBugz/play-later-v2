"use client"

import * as React from "react"
import { SessionProvider } from "next-auth/react"

export function Providers({ children }: React.PropsWithChildren) {
  return <SessionProvider>{children}</SessionProvider>
}

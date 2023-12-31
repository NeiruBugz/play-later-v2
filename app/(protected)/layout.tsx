import { PropsWithChildren } from "react"

import { Providers } from "@/components/providers"
import { SiteHeader } from "@/components/site-header"

export default function LibraryLayout({ children }: PropsWithChildren) {
  return (
    <Providers>
      <SiteHeader />
      <main className="bg-background px-4 md:container">
        <div className="h-full py-6">{children}</div>
      </main>
    </Providers>
  )
}

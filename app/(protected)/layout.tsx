import { PropsWithChildren } from "react"

import { Providers } from "@/components/providers"
import { SiteFooter } from "@/components/site-footer"
import { SiteHeader } from "@/components/site-header"

export default function LibraryLayout({ children }: PropsWithChildren) {
  return (
    <Providers>
      <SiteHeader />
      <main className="h-[calc(100vh-64px-32px)] overflow-auto bg-background">
        <div className="h-full py-6">{children}</div>
      </main>
      <SiteFooter />
    </Providers>
  )
}

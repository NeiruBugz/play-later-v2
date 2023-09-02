import { PropsWithChildren } from "react"

import { Providers } from "@/components/providers"

export default function LibraryLayout({ children }: PropsWithChildren) {
  return <Providers>{children}</Providers>
}

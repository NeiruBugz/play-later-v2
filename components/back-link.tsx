"use client"

import { PropsWithChildren } from "react"
import { useRouter } from "next/navigation"

function BackLink({ children }: PropsWithChildren) {
  const router = useRouter()

  const onClick = () => {
    router.back()
  }

  return <div onClick={onClick}>{children}</div>
}

export { BackLink }

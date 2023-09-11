"use client"

import { useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"

import { Button } from "@/components/ui/button"

export default function GoogleSignIn() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? "/library"
  return (
    <Button onClick={() => signIn("google", { callbackUrl, redirect: true })}>
      Sign in with Google
    </Button>
  )
}

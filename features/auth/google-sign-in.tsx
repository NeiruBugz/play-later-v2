"use client"

import { useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"

import { Button } from "@/components/ui/button"
import { Icons } from "@/components/icons"

export default function GoogleSignIn() {
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") ?? "/library"
  return (
    <Button
      className="font-roboto h-[46px] rounded-sm bg-white px-2 pr-4 text-sm text-black shadow-md transition-all hover:bg-slate-200"
      onClick={() => signIn("google", { callbackUrl, redirect: true })}
    >
      <Icons.google />
      Sign in with Google
    </Button>
  )
}

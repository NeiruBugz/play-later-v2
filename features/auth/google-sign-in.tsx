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
      className="bg-white font-roboto text-black text-sm shadow-md px-2 hover:bg-slate-200 transition-all h-[46px] pr-4 rounded-sm"
      onClick={() => signIn("google", { callbackUrl, redirect: true })}
    >
      <Icons.google />
      Sign in with Google
    </Button>
  )
}

import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  return (
    <div>
      <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
        Settings
      </h1>
      <section className="mt-4">
        <Label htmlFor="email">
          Email
          <Input id="email" defaultValue={session?.user.email ?? ""} disabled />
        </Label>
      </section>
    </div>
  )
}

import { getServerSession } from "next-auth"

import { authOptions } from "@/lib/auth"

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  console.log(session)
  return <div>Settings</div>
}

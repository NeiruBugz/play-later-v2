import { getServerSession } from "next-auth"

import { siteConfig } from "@/config/site"
import { authOptions } from "@/lib/auth"
import { MainNav } from "@/components/main-nav"
import { UserDropdown } from "@/components/user-dropdown"

export async function SiteHeader() {
  const session = await getServerSession(authOptions)
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background">
      <div className="flex h-16 items-center space-x-4 px-4 md:container sm:justify-between sm:space-x-0">
        <MainNav items={siteConfig.mainNav} />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center gap-1 space-x-1">
            <UserDropdown session={session} />
          </nav>
        </div>
      </div>
    </header>
  )
}

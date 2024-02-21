import { getUserById } from "@/features/auth/actions"
import { HeaderSearch } from "@/features/game/ui/header-search"
import AddGame from "@/features/library/ui/add-game/add-game"

import { siteConfig } from "@/config/site"
import { getServerUserId } from "@/lib/auth"
import { MainNav } from "@/components/main-nav"
import { UserDropdown } from "@/components/user-dropdown"

export async function SiteHeader() {
  const user = await getUserById(await getServerUserId())
  return (
    <header className="sticky top-0 z-40 w-full bg-background">
      <div className="flex h-16 items-center space-x-4 px-4 md:container sm:justify-between sm:space-x-0">
        <MainNav items={siteConfig.mainNav} />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center gap-2 space-x-1">
            <HeaderSearch />
            <AddGame />
            <UserDropdown username={user ?? ""} />
          </nav>
        </div>
      </div>
    </header>
  )
}

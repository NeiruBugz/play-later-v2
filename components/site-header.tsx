import { MainNav } from "@/components/main-nav";
import { UserDropdown } from "@/components/user-dropdown";

import { getServerUserId } from "@/lib/auth";
import { siteConfig } from "@/lib/config/site";

import { HeaderSearch } from "@/app/(features)/(protected)/library/components/game/ui/header-search";
import AddGame from "@/app/(features)/(protected)/library/components/library/add-game/add-game";
import { getUserById } from "@/app/(features)/login/lib/actions";

export async function SiteHeader() {
  const user = await getUserById(await getServerUserId());
  return (
    <header className="sticky top-0 z-40 w-full bg-background">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
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
  );
}

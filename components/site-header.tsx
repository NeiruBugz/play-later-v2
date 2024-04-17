import { auth } from "@/auth";

import { Logo } from "@/components/logo";
import { MainNav } from "@/components/main-nav";
import { UserDropdown } from "@/components/user-dropdown";

import { siteConfig } from "@/lib/config/site";

// import { HeaderSearch } from "@/app/(protected)/library/components/game/ui/header-search";
import AddGame from "@/app/(protected)/library/components/library/add-game/add-game";
import { SignIn } from "@/app/login/components/sign-in";

export async function SiteHeader() {
  const session = await auth();
  if (!session)
    return (
      <header className="sticky top-0 z-40 w-full bg-background">
        <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
          <Logo name={siteConfig.name} />
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center gap-2 space-x-1">
              <SignIn />
            </nav>
          </div>
        </div>
      </header>
    );
  return (
    <header className="sticky top-0 z-40 w-full bg-background">
      <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
        <MainNav items={siteConfig.mainNav} />
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center gap-2 space-x-1">
            {/* <HeaderSearch /> */}
            <AddGame />
            <UserDropdown username={session?.user?.name ?? ""} />
          </nav>
        </div>
      </div>
    </header>
  );
}

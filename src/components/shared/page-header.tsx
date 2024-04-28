import { SignIn } from "@/app/login/components/sign-in";
import { auth } from "@/auth";
import { Logo } from "@/src/components/logo";
import { MainNav } from "@/src/components/main-nav";
import { AddGame } from "@/src/components/shared/add-game/add-game";
import { UserDropdown } from "@/src/components/user-dropdown";
import { siteConfig } from "@/src/lib/config/site";

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

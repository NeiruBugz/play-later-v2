import Link from "next/link";

import { auth } from "@/auth";

import { siteConfig } from "@/src/shared/config/site";
import { Logo } from "@/src/shared/ui/logo";
import { MainNav } from "@/src/shared/ui/main-nav";

import { AddGame } from "@/src/widgets/add-game";
import { SignIn } from "@/src/widgets/sign-in";
import { UserDropdown } from "@/src/widgets/user-dropdown";

export async function SiteHeader() {
  const session = await auth();
  if (!session)
    return (
      <header className="sticky top-0 z-40 w-full bg-background">
        <div className="container flex h-16 items-center space-x-4 sm:justify-between sm:space-x-0">
          <Link href="/">
            <Logo name={siteConfig.name} />
          </Link>
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

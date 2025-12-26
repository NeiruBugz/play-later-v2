import Image from "next/image";
import Link from "next/link";

import { ThemeToggle } from "@/shared/components/theme-toggle";

export function Header({ isAuthorised }: { isAuthorised: boolean }) {
  if (isAuthorised) {
    return (
      <header className="border-border py-lg md:py-xl container mx-auto border-b">
        <div className="flex items-center justify-between">
          <h1 className="heading-md md:heading-xl font-serif">
            <Link
              href="/dashboard"
              className="gap-md md:gap-lg flex items-center"
            >
              <Image
                src="/logo.svg"
                alt="SavePoint Logo"
                width={40}
                height={40}
                className="h-8 w-8 md:h-10 md:w-10"
              />
              <span>SavePoint</span>
            </Link>
          </h1>
          <nav className="gap-lg md:gap-2xl flex items-center">
            <div className="gap-2xl hidden items-center md:flex">
              <Link
                href="/games/search"
                className="body-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                Search
              </Link>
              <Link
                href="/dashboard"
                className="body-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/library"
                className="body-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                Library
              </Link>
              <Link
                href="/journal"
                className="body-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                Journal
              </Link>
              <Link
                href="/profile"
                className="body-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
              >
                Profile
              </Link>
            </div>
            <ThemeToggle />
          </nav>
        </div>
      </header>
    );
  }
  return (
    <header className="border-border py-lg md:py-xl container mx-auto border-b">
      <div className="flex items-center justify-between">
        <h1 className="heading-md md:heading-xl font-serif">
          <Link
            href="/dashboard"
            className="gap-md md:gap-lg flex items-center"
          >
            <Image
              src="/logo.svg"
              alt="SavePoint Logo"
              width={40}
              height={40}
              className="h-8 w-8 md:h-10 md:w-10"
            />
            <span>SavePoint</span>
          </Link>
        </h1>
        <nav className="gap-lg md:gap-2xl flex items-center">
          <div className="gap-2xl hidden items-center md:flex">
            <Link
              href="/games/search"
              className="body-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              Search
            </Link>
          </div>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}

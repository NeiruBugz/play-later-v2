import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";

import { openCommandPalette } from "@/features/command-palette";
import { ThemeToggle } from "@/features/toggle-theme";
import { PRODUCT_NAME } from "@/shared/config/site";
import { LogoMark } from "@/shared/ui/logo";

export function AppMobileTopbar() {
  return (
    <header
      data-testid="app-mobile-topbar"
      aria-label="Primary mobile navigation"
      className="sticky top-0 z-40 flex min-h-14 items-center justify-between gap-2 border-b bg-background/85 px-3 pt-safe backdrop-blur-md md:hidden"
    >
      <Link
        to="/"
        className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-md"
        aria-label={PRODUCT_NAME}
      >
        <LogoMark className="size-7" />
      </Link>

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Search games"
          onClick={openCommandPalette}
          className="inline-flex h-11 w-11 items-center justify-center rounded-md hover:bg-accent"
        >
          <Search aria-hidden="true" className="h-5 w-5" />
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}

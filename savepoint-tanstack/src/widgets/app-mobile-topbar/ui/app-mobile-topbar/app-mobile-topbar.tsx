import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";

import { openCommandPalette } from "@/features/command-palette";
import { ThemeToggle } from "@/features/toggle-theme";

export function AppMobileTopbar() {
  return (
    <header
      data-testid="app-mobile-topbar"
      aria-label="Primary mobile navigation"
      className="bg-background/85 sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b px-3 backdrop-blur-md md:hidden"
    >
      <Link
        to="/"
        className="flex items-center gap-2 rounded-md px-1 py-1"
        aria-label="SavePoint"
      >
        <img
          src="/logo.svg"
          alt=""
          aria-hidden="true"
          className="h-7 w-7 shrink-0"
        />
      </Link>

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Search games"
          onClick={openCommandPalette}
          className="hover:bg-accent inline-flex h-11 w-11 items-center justify-center rounded-md"
        >
          <Search aria-hidden="true" className="h-5 w-5" />
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}

import { Link } from "@tanstack/react-router";
import { Search } from "lucide-react";

import { openCommandPalette } from "@/features/command-palette";
import { ThemeToggle } from "@/features/toggle-theme";

/**
 * Mobile top app bar — sticky brand + search trigger + theme toggle. Visible
 * only below the `md` breakpoint; the desktop sidebar covers the same surface
 * at `md+`. Search trigger is wired to the same (non-functional, Slice 17)
 * command palette stub as `AppSidebar`.
 *
 * Introduced in Phase 4 of the Slice 18A visual-parity push — see
 * `context/audits/2026-05-18/visual-parity.md` § Mobile shell.
 */
export function AppMobileTopbar() {
  return (
    <header
      data-testid="app-mobile-topbar"
      aria-label="Primary mobile navigation"
      className="bg-background sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b px-3 md:hidden"
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
          className="y2k-logo-glow jewel-logo-glow h-7 w-7 shrink-0"
        />
        <span className="text-h3 y2k-chrome-text y2k:tracking-wider jewel-display jewel:tracking-[0.14em]">
          SavePoint
        </span>
      </Link>

      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Open command palette"
          onClick={openCommandPalette}
          className="hover:bg-accent inline-flex h-9 w-9 items-center justify-center rounded-md"
        >
          <Search aria-hidden="true" className="h-4 w-4" />
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}

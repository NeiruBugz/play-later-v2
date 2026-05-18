import { Link } from "@tanstack/react-router";
import { BookOpen, Library, User } from "lucide-react";

/**
 * Mobile bottom tab nav — three primary destinations. Visible only below
 * the `md` breakpoint; desktop uses the left sidebar.
 *
 * Mirrors canonical's bottom-nav order and label set (Library / Journal /
 * Profile). The library page's FAB is offset to `bottom-20 md:bottom-6` so
 * it doesn't collide with this bar.
 *
 * Introduced in Phase 4 of the Slice 18A visual-parity push — see
 * `context/audits/2026-05-18/visual-parity.md` § Mobile shell.
 */
const NAV_ITEMS = [
  { label: "Library", to: "/library", icon: Library },
  { label: "Journal", to: "/journal", icon: BookOpen },
  { label: "Profile", to: "/profile", icon: User },
] as const;

export function AppBottomNav() {
  return (
    <nav
      data-testid="app-bottom-nav"
      aria-label="Primary mobile tab navigation"
      className="bg-background fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t md:hidden"
    >
      {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          activeProps={{
            "aria-current": "page" as const,
            className: "text-foreground",
          }}
          className="text-muted-foreground hover:text-foreground flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium"
        >
          <Icon size={20} aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

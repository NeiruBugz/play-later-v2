import { Link } from "@tanstack/react-router";
import { BookOpen, Library, User } from "lucide-react";

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

import { Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, House, Library, Plus, User } from "lucide-react";

import { openGlobalAction } from "@/shared/lib/global-action";

const DEST_ITEMS_LEFT = [
  { label: "Home", to: "/dashboard", icon: House },
  { label: "Library", to: "/library", icon: Library },
] as const;

const DEST_ITEMS_RIGHT = [
  { label: "Journal", to: "/journal", icon: BookOpen },
  { label: "Profile", to: "/profile", icon: User },
] as const;

export function AppBottomNav() {
  const navigate = useNavigate();

  const openLogSession = () => {
    openGlobalAction(navigate, "log-session");
  };

  return (
    <nav
      data-testid="app-bottom-nav"
      aria-label="Primary mobile tab navigation"
      className="fixed inset-x-0 bottom-0 z-40 flex h-(--bottom-nav-height) items-stretch overflow-visible border-t bg-card/85 pb-safe backdrop-blur-md md:hidden"
    >
      {DEST_ITEMS_LEFT.map(({ label, to, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          activeProps={{
            "aria-current": "page" as const,
            className:
              "text-foreground flex h-11 min-h-11 flex-1 flex-col items-center justify-center gap-1 text-xs font-medium",
          }}
          className="flex h-11 min-h-11 flex-1 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <Icon size={20} aria-hidden="true" />
          {label}
        </Link>
      ))}

      <button
        type="button"
        aria-label="Log"
        onClick={openLogSession}
        className="flex flex-1 flex-col items-center justify-end pb-1"
      >
        <span
          aria-hidden="true"
          className="flex aspect-square size-14 shrink-0 -translate-y-3 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
        >
          <Plus size={26} />
        </span>
        <span
          aria-hidden="true"
          className="-mt-1 text-xs font-medium text-muted-foreground"
        >
          Log
        </span>
      </button>

      {DEST_ITEMS_RIGHT.map(({ label, to, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          activeProps={{
            "aria-current": "page" as const,
            className:
              "text-foreground flex h-11 min-h-11 flex-1 flex-col items-center justify-center gap-1 text-xs font-medium",
          }}
          className="flex h-11 min-h-11 flex-1 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <Icon size={20} aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

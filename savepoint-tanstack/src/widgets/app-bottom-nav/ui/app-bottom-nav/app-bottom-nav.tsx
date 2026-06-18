import { Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, House, Library, Plus, User } from "lucide-react";

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
    void navigate({
      to: ".",
      search: (prev) => ({ ...prev, action: "log-session" as const }),
    });
  };

  return (
    <nav
      data-testid="app-bottom-nav"
      aria-label="Primary mobile tab navigation"
      className="bg-card/85 pb-safe-nav fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch overflow-visible border-t backdrop-blur-md md:hidden"
    >
      {DEST_ITEMS_LEFT.map(({ label, to, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          activeProps={{
            "aria-current": "page" as const,
            className:
              "text-foreground flex h-11 min-h-11 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium",
          }}
          className="text-muted-foreground hover:text-foreground flex h-11 min-h-11 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium"
        >
          <Icon size={20} aria-hidden="true" />
          {label}
        </Link>
      ))}

      <div className="flex flex-1 flex-col items-center justify-end pb-1">
        <button
          type="button"
          aria-label="Log a session"
          onClick={openLogSession}
          className="bg-primary text-primary-foreground flex aspect-square size-14 shrink-0 -translate-y-3 items-center justify-center rounded-full shadow-lg"
        >
          <Plus size={26} aria-hidden="true" />
        </button>
        <span className="text-muted-foreground -mt-1 text-[11px] font-medium">
          Log
        </span>
      </div>

      {DEST_ITEMS_RIGHT.map(({ label, to, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          activeProps={{
            "aria-current": "page" as const,
            className:
              "text-foreground flex h-11 min-h-11 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium",
          }}
          className="text-muted-foreground hover:text-foreground flex h-11 min-h-11 flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium"
        >
          <Icon size={20} aria-hidden="true" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

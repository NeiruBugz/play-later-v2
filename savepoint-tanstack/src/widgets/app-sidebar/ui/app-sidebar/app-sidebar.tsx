import { Link, useRouter } from "@tanstack/react-router";
import { BookOpen, Library, Settings, User } from "lucide-react";
import { useState } from "react";

import { ThemeToggle } from "@/features/toggle-theme";
import { authClient } from "@/shared/api/auth-client";

export type AppSidebarUser = {
  id: string;
  name: string | null;
  image: string | null;
};

export interface AppSidebarProps {
  user: AppSidebarUser;
}

const NAV_ITEMS = [
  { label: "Library", to: "/library", icon: Library },
  { label: "Journal", to: "/journal", icon: BookOpen },
  { label: "Profile", to: "/profile", icon: User },
  { label: "Settings", to: "/settings/profile", icon: Settings },
] as const;

export function AppSidebar({ user }: AppSidebarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = user.name ?? user.id;

  const handleSignOut = () => {
    void authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          void router.invalidate();
        },
      },
    });
    setMenuOpen(false);
  };

  return (
    <aside
      data-testid="app-sidebar"
      aria-label="Primary navigation"
      className="bg-background flex h-screen w-64 shrink-0 flex-col border-r"
    >
      {/* Top: brand + search trigger */}
      <div className="space-y-3 px-4 pt-4">
        <Link
          to="/"
          className="flex items-center gap-2 rounded-md px-1 py-1"
          aria-label="SavePoint"
        >
          <img src="/logo.svg" alt="" aria-hidden="true" className="h-7 w-7" />
          <span className="text-lg font-bold tracking-tight">SavePoint</span>
        </Link>

        <button
          type="button"
          aria-label="Open command palette"
          className="border-border text-muted-foreground flex w-full items-center justify-between rounded-md border bg-transparent px-3 py-2 text-sm"
        >
          <span>Search</span>
          <kbd className="text-muted-foreground rounded border px-1.5 py-0.5 text-xs font-semibold">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Middle: primary nav — flex-1 pushes bottom cluster down */}
      <nav className="mt-4 flex-1 overflow-y-auto px-2">
        {NAV_ITEMS.map(({ label, to, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeProps={{
              "aria-current": "page" as const,
              className: "bg-muted text-foreground",
            }}
            className="hover:bg-accent flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium"
          >
            <Icon size={16} aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>

      {/* Bottom: theme toggle + user identity */}
      <div className="mt-2 space-y-2 border-t px-3 pt-3 pb-4">
        <ThemeToggle />

        <div className="relative">
          <button
            type="button"
            className="hover:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <img
              src={user.image ?? "/default-avatar.png"}
              alt={displayName}
              className="h-7 w-7 rounded-full object-cover"
            />
            <span className="truncate">{displayName}</span>
          </button>

          {menuOpen && (
            <ul
              role="menu"
              className="bg-popover border-border absolute bottom-full left-0 mb-1 min-w-[10rem] rounded-md border p-1 shadow-md"
            >
              <li>
                <button
                  role="menuitem"
                  type="button"
                  className="hover:bg-accent text-destructive w-full rounded px-3 py-1.5 text-left text-sm"
                  onClick={handleSignOut}
                >
                  Sign out
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}

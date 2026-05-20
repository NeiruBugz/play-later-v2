import { Link, useRouter } from "@tanstack/react-router";
import {
  BookOpen,
  Library,
  LogOut,
  Settings,
  User,
  UserCog,
} from "lucide-react";

import { openCommandPalette } from "@/features/command-palette";
import { ThemeToggle } from "@/features/toggle-theme";
import { authClient } from "@/shared/api/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

export type AppSidebarUser = {
  id: string;
  name: string | null;
  username: string | null;
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

  // Never display the email. Legacy accounts seed `name=email`, so we filter
  // any `@`-shaped name and prefer the user-chosen username. Final fallback
  // is the generic "Account" label — the raw user id is never user-visible.
  const safeName = user.name && !user.name.includes("@") ? user.name : null;
  const displayName = safeName ?? user.username ?? "Account";
  // Initial-avatar fallback. Canonical renders the first character of the
  // display name, not the stock cartoon image — see audit
  // `context/audits/2026-05-18/visual-parity.md` § Library global chrome.
  const firstChar = (displayName.trim().charAt(0) || "?").toUpperCase();

  const handleSignOut = () => {
    void authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          void router.invalidate();
        },
      },
    });
  };

  return (
    <aside
      data-testid="app-sidebar"
      aria-label="Primary navigation"
      className="bg-background sticky top-0 hidden h-screen w-64 shrink-0 flex-col self-start border-r md:flex"
    >
      {/* Top: brand + search trigger */}
      <div className="space-y-3 px-4 pt-4">
        <Link
          to="/dashboard"
          className="flex items-center gap-2 rounded-md px-1 py-1"
          aria-label="SavePoint"
        >
          <img
            src="/logo.svg"
            alt=""
            aria-hidden="true"
            className="y2k-logo-glow jewel-logo-glow h-8 w-8 shrink-0"
          />
          <span className="text-h3 y2k-chrome-text y2k:tracking-wider jewel-display jewel:tracking-[0.14em]">
            SavePoint
          </span>
        </Link>

        <button
          type="button"
          aria-label="Open command palette"
          onClick={openCommandPalette}
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

        <DropdownMenu>
          <DropdownMenuTrigger
            type="button"
            aria-label="Open user menu"
            className="hover:bg-accent data-[state=open]:bg-accent flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm"
          >
            <Avatar className="h-7 w-7">
              {user.image ? (
                <AvatarImage src={user.image} alt={displayName} />
              ) : null}
              <AvatarFallback
                aria-label={displayName}
                className="text-xs font-medium"
              >
                {firstChar}
              </AvatarFallback>
            </Avatar>
            <span className="truncate">{displayName}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuItem asChild>
              <Link to="/settings/profile">
                <Settings className="mr-2 h-4 w-4" aria-hidden="true" />
                Profile settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings/account">
                <UserCog className="mr-2 h-4 w-4" aria-hidden="true" />
                Account
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={handleSignOut}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}

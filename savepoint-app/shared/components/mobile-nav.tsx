"use client";

import { BookMarked, LayoutGrid, Search, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/shared/lib/ui/utils";

interface NavItem {
  href: string;
  label: string;
  icon: typeof Search;
  matchPaths?: string[];
}

const navItems: NavItem[] = [
  {
    href: "/games/search",
    label: "Search",
    icon: Search,
    matchPaths: ["/games"],
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutGrid,
  },
  {
    href: "/library",
    label: "Library",
    icon: BookMarked,
  },
  {
    href: "/profile",
    label: "Profile",
    icon: User,
  },
];

function isActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.href) return true;
  if (item.matchPaths?.some((path) => pathname.startsWith(path))) return true;
  return false;
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 md:hidden",
        "bg-background/95 backdrop-blur-md",
        "border-t border-border",
        "pb-[env(safe-area-inset-bottom)]"
      )}
    >
      <div className="flex items-center justify-around px-md py-sm">
        {navItems.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex flex-col items-center gap-xs px-lg py-sm",
                "rounded-lg transition-all duration-fast",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "relative flex h-8 w-8 items-center justify-center rounded-full",
                  "transition-all duration-fast",
                  active && "bg-primary/10"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 transition-transform duration-fast",
                    active && "scale-110"
                  )}
                  strokeWidth={active ? 2.5 : 2}
                />
                {active && (
                  <span className="absolute -bottom-1 h-1 w-1 rounded-full bg-primary" />
                )}
              </div>
              <span
                className={cn(
                  "caption transition-colors duration-fast",
                  active ? "font-semibold" : "font-medium"
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

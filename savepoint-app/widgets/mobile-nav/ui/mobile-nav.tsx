"use client";

import { BookMarked, BookOpen, Clock, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/shared/lib/ui/utils";

interface NavItem {
  href: string;
  label: string;
  icon: typeof BookMarked;
  matchPaths?: string[];
}

const navItems: NavItem[] = [
  {
    href: "/library",
    label: "Library",
    icon: BookMarked,
  },
  {
    href: "/journal",
    label: "Journal",
    icon: BookOpen,
    matchPaths: ["/journal"],
  },
  {
    href: "/timeline",
    label: "Timeline",
    icon: Clock,
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
        "border-border border-t",
        "y2k:bg-background/60 y2k:border-t-0 y2k:shadow-[0_-1px_0_oklch(0.72_0.22_145/0.2),0_-4px_20px_oklch(0.72_0.22_145/0.05)] y2k:backdrop-blur-2xl",
        "pb-[env(safe-area-inset-bottom)]"
      )}
    >
      <div className="px-md py-sm flex items-center justify-around">
        {navItems.map((item) => {
          const active = isActive(pathname, item);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group gap-xs px-lg py-sm flex min-h-[44px] min-w-[44px] flex-col items-center justify-center",
                "duration-fast rounded-lg transition-all",
                "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "relative flex h-8 w-8 items-center justify-center rounded-full",
                  "duration-fast transition-all",
                  active && "bg-primary/10"
                )}
              >
                <Icon
                  className={cn(
                    "duration-fast h-5 w-5 transition-transform",
                    active && "scale-110"
                  )}
                  strokeWidth={active ? 2.5 : 2}
                />
                {active && (
                  <span className="bg-primary absolute -bottom-1 h-1 w-1 rounded-full" />
                )}
              </div>
              <span
                className={cn(
                  "text-caption duration-fast transition-colors",
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

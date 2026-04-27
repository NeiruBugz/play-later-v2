"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/shared/lib/ui/utils";

type SettingsSection = {
  href: string;
  label: string;
  sublabel?: string;
};

const SECTIONS: SettingsSection[] = [
  { href: "/settings/profile", label: "Profile", sublabel: "Avatar, username" },
  { href: "/settings/connections", label: "Connected systems" },
  { href: "/settings/account", label: "Account" },
  // Future: danger-zone items (delete account, etc.) go here in a separate group
];

export function SettingsRail() {
  const pathname = usePathname();

  return (
    <nav aria-label="Settings sections">
      <ul className="flex flex-col gap-1">
        {SECTIONS.map(({ href, label, sublabel }) => {
          const isActive = pathname === href;

          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "text-body flex w-full flex-col rounded-md px-3 py-2 transition-colors",
                  "md:rounded-none md:rounded-r-md md:border-l-2",
                  isActive
                    ? "bg-accent text-accent-foreground md:border-primary"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground md:border-transparent",
                  "items-start md:items-start"
                )}
              >
                <span>{label}</span>
                {sublabel && (
                  <span className="text-caption text-muted-foreground md:hidden">
                    {sublabel}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

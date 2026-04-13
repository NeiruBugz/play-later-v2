"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface ProfileTabNavProps {
  username: string;
}

export function ProfileTabNav({ username }: ProfileTabNavProps) {
  const pathname = usePathname();

  const tabs = [
    { label: "Overview", href: `/u/${username}` },
    { label: "Library", href: `/u/${username}/library` },
    { label: "Activity", href: `/u/${username}/activity` },
  ] as const;

  return (
    <nav
      aria-label="Profile sections"
      className="border-border gap-2xl flex items-center border-b"
    >
      {tabs.map(({ label, href }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`body-sm -mb-px border-b-2 px-1 py-3 font-medium transition-colors ${
              active
                ? "border-foreground text-foreground"
                : "text-muted-foreground hover:text-foreground border-transparent"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

"use client";

import { usePathname, useRouter } from "next/navigation";

import {
  SegmentedControl,
  SegmentedControlItem,
} from "@/shared/components/ui/segmented-control";

export interface ProfileTabNavProps {
  username: string;
}

export function ProfileTabNav({ username }: ProfileTabNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const tabs = [
    { label: "Overview", href: `/u/${username}` },
    { label: "Library", href: `/u/${username}/library` },
    { label: "Activity", href: `/u/${username}/activity` },
  ] as const;

  const activeTab =
    tabs.find((tab) => tab.href === pathname)?.href ?? tabs[0].href;

  return (
    <nav aria-label="Profile sections">
      <SegmentedControl
        value={activeTab}
        onValueChange={(value) => router.push(value)}
      >
        {tabs.map(({ label, href }) => (
          <SegmentedControlItem
            key={href}
            value={href}
            aria-current={pathname === href ? "page" : undefined}
          >
            {label}
          </SegmentedControlItem>
        ))}
      </SegmentedControl>
    </nav>
  );
}

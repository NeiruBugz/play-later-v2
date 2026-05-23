import { Link } from "@tanstack/react-router";
import {
  BookMarked,
  BookOpen,
  LayoutGrid,
  Settings,
  User,
  type LucideIcon,
} from "lucide-react";

import { CommandGroup, CommandItem } from "@/shared/ui/command";

import type { PaletteNavigationGroupProps } from "./palette-navigation-group.type";

type NavigationItem = {
  label: string;
  to: "/library" | "/journal" | "/profile" | "/settings/profile" | "/dashboard";
  icon: LucideIcon;
};

/**
 * Five jump targets — matches the canonical
 * `savepoint-app/features/command-palette/ui/palette-navigation-group.tsx`.
 *
 * Divergence: `Settings` points at `/settings/profile` because tanstack
 * doesn't have a registered `/settings` index route (the only registered
 * settings page is the profile one). When the settings shell lands, swap
 * this entry to `/settings`.
 */
const NAVIGATION_ITEMS: ReadonlyArray<NavigationItem> = [
  { label: "Library", to: "/library", icon: BookMarked },
  { label: "Journal", to: "/journal", icon: BookOpen },
  { label: "Profile", to: "/profile", icon: User },
  { label: "Settings", to: "/settings/profile", icon: Settings },
  { label: "Dashboard", to: "/dashboard", icon: LayoutGrid },
];

export function PaletteNavigationGroup({
  query,
  onAfterSelect,
}: PaletteNavigationGroupProps) {
  const normalized = query.trim().toLowerCase();
  const items = normalized
    ? NAVIGATION_ITEMS.filter((item) =>
        item.label.toLowerCase().includes(normalized)
      )
    : NAVIGATION_ITEMS;

  if (items.length === 0) return null;

  return (
    <CommandGroup heading="Navigation">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <CommandItem
            key={item.to}
            value={`nav-${item.label}`}
            className="p-0"
          >
            <Link
              to={item.to}
              onClick={onAfterSelect}
              className="gap-md py-sm px-md flex w-full items-center"
            >
              <Icon className="text-muted-foreground" aria-hidden />
              <span className="text-sm">{item.label}</span>
            </Link>
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
}

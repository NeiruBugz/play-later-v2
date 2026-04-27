"use client";

import {
  BookMarked,
  BookOpen,
  Clock,
  LayoutGrid,
  Settings,
  User,
  type LucideIcon,
} from "lucide-react";

import { CommandGroup, CommandItem } from "@/shared/components/ui/command";

interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const NAVIGATION_ITEMS: NavigationItem[] = [
  { label: "Library", href: "/library", icon: BookMarked },
  { label: "Journal", href: "/journal", icon: BookOpen },
  { label: "Timeline", href: "/timeline", icon: Clock },
  { label: "Profile", href: "/profile", icon: User },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Dashboard", href: "/dashboard", icon: LayoutGrid },
];

interface PaletteNavigationGroupProps {
  query: string;
  onNavigate: (href: string) => void;
}

export function PaletteNavigationGroup({
  query,
  onNavigate,
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
            key={item.href}
            value={`nav-${item.label}`}
            onSelect={() => onNavigate(item.href)}
          >
            <Icon className="text-muted-foreground" aria-hidden />
            <span className="text-body">{item.label}</span>
          </CommandItem>
        );
      })}
    </CommandGroup>
  );
}

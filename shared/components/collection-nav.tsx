"use client";

import { Download, Heart, Library, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/shared/components/button";
import { cn } from "@/shared/lib";

const collectionNavItems = [
  {
    href: "/collection",
    label: "My Games",
    icon: Library,
    description: "Your game collection",
  },
  {
    href: "/collection/imported",
    label: "Imported",
    icon: Download,
    description: "Games from connected services",
  },
  {
    href: "/wishlist",
    label: "Wishlist",
    icon: Heart,
    description: "Games you want to play",
  },
] as const;

interface CollectionNavProps {
  showAddButton?: boolean;
}

export function CollectionNav({ showAddButton = true }: CollectionNavProps) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <nav className="flex gap-1 rounded-lg bg-muted p-1">
        {collectionNavItems.map((item) => {
          const IconComponent = item.icon;
          const isActive =
            item.href === "/collection"
              ? pathname === "/collection"
              : pathname.startsWith(item.href);

          return (
            <Button
              key={item.href}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              asChild
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "hover:bg-background/60"
              )}
            >
              <Link href={item.href} title={item.description}>
                <IconComponent className="h-4 w-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            </Button>
          );
        })}
      </nav>

      {showAddButton && (
        <Button asChild className="flex items-center gap-2">
          <Link href="/collection/add-game">
            <Plus className="h-4 w-4" />
            Add Game
          </Link>
        </Button>
      )}
    </div>
  );
}

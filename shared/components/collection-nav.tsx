"use client";

import { Download, Heart, Library, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ShareWishlist } from "@/features/share-wishlist";
import { Button } from "@/shared/components/ui/button";
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
    href: "/collection/wishlist",
    label: "Wishlist",
    icon: Heart,
    description: "Games you want to play",
  },
] as const;

type CollectionNavProps = {
  showAddButton?: boolean;
  showShareWishlist?: boolean;
  userName?: string | null;
};

export function CollectionNav({
  showAddButton = true,
  showShareWishlist = false,
  userName,
}: CollectionNavProps) {
  const pathname = usePathname();

  const isWishlist = pathname.startsWith("/collection/wishlist");

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <nav className="flex w-fit gap-1 rounded-lg bg-muted p-1">
        {collectionNavItems.map((item) => {
          const IconComponent = item.icon;
          const isActive =
            item.href === "/collection"
              ? pathname === "/collection"
              : pathname.startsWith(item.href);

          return (
            <Link key={item.href} href={item.href} title={item.description}>
              <Button
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "hover:bg-background/60"
                )}
              >
                <IconComponent className="size-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </nav>

      {showAddButton && (
        <Link href="/collection/add-game">
          <Button className="flex items-center gap-2">
            <Plus className="size-4" />
            Add Game
          </Button>
        </Link>
      )}
      {(showShareWishlist || isWishlist) && (
        <ShareWishlist userName={userName} />
      )}
    </div>
  );
}

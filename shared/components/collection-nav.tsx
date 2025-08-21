"use client";

import { Download, Heart, Library, Plus } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { memo } from "react";

import { ShareWishlist } from "@/features/share-wishlist";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib";

const collectionNavItems = [
  {
    href: "/collection",
    label: "My Games",
    icon: Library,
  },
  {
    href: "/collection/imported",
    label: "Imported",
    icon: Download,
  },
  {
    href: "/collection/wishlist",
    label: "Wishlist",
    icon: Heart,
  },
] as const;

export type CollectionNavProps = {
  showAddButton?: boolean;
  userName?: string | null;
  className?: string;
};

const CollectionNav = memo(
  ({ showAddButton = true, userName, className }: CollectionNavProps) => {
    const pathname = usePathname() ?? "";
    const isWishlist = pathname.startsWith("/collection/wishlist");

    const getActiveItem = (href: string) => {
      if (!pathname) return false;
      if (href === "/collection") {
        return (
          pathname === "/collection" ||
          (pathname.startsWith("/collection") &&
            !pathname.startsWith("/collection/imported") &&
            !pathname.startsWith("/collection/wishlist") &&
            !pathname.startsWith("/collection/add-game"))
        );
      }
      return pathname.startsWith(href);
    };

    return (
      <div
        className={cn(
          "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
          className
        )}
      >
        <nav className="flex items-center gap-2 rounded-md bg-muted p-1">
          {collectionNavItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = getActiveItem(item.href);

            return (
              <Link key={item.href} href={item.href} title={item.label}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <IconComponent className="size-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Button>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {showAddButton && (
            <Link href="/collection/add-game">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="size-4" />
                <span className="hidden sm:inline">Add Game</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </Link>
          )}
          {isWishlist && <ShareWishlist userName={userName} />}
        </div>
      </div>
    );
  }
);

CollectionNav.displayName = "CollectionNav";

// We now only export one clean component.
export { CollectionNav as EditorialCollectionNav };

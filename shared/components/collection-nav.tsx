"use client";

import { cva, type VariantProps } from "class-variance-authority";
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
    description: "Your game collection",
    shortLabel: "Games",
  },
  {
    href: "/collection/imported",
    label: "Imported",
    icon: Download,
    description: "Games from connected services",
    shortLabel: "Imported",
  },
  {
    href: "/collection/wishlist",
    label: "Wishlist",
    icon: Heart,
    description: "Games you want to play",
    shortLabel: "Wishlist",
  },
] as const;

const collectionNavVariants = cva(
  "flex w-fit gap-1 rounded-lg p-1 transition-all duration-200 ease-out",
  {
    variants: {
      variant: {
        default: "bg-muted",
        gaming:
          "bg-gaming-primary/10 backdrop-blur-sm border border-gaming-primary/20 shadow-gaming",
        neon: "bg-gaming-primary/5 backdrop-blur-md border border-gaming-primary/30 shadow-neon",
        glass: "bg-background/80 backdrop-blur-lg border border-white/10",
        minimal: "bg-gaming-primary/3 border border-gaming-primary/8",
        clean: "bg-background border border-gaming-primary/6 shadow-sm",
        editorial: "bg-slate-400/30 border border-border/30",
      },
      size: {
        sm: "text-xs",
        default: "text-sm",
        lg: "text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const collectionNavItemVariants = cva(
  "flex items-center gap-2 px-3 py-2 font-medium transition-all duration-200 ease-out relative group",
  {
    variants: {
      variant: {
        default: "hover:bg-background/60",
        gaming:
          "hover:bg-gaming-primary/20 hover:text-gaming-primary hover:shadow-gaming",
        neon: "hover:bg-gaming-primary/30 hover:text-gaming-primary hover:shadow-neon",
        minimal: "hover:bg-gaming-primary/8 hover:text-gaming-primary/90",
        clean: "hover:bg-gaming-primary/5 hover:text-gaming-primary/80",
        editorial: "hover:bg-slate-400/60 hover:text-slate-900",
      },
      active: {
        true: "",
        false: "",
      },
      size: {
        sm: "text-xs px-2 py-1.5",
        default: "text-sm px-3 py-2",
        lg: "text-base px-4 py-3",
      },
    },
    compoundVariants: [
      {
        variant: "default",
        active: true,
        class: "bg-background text-foreground shadow-sm",
      },
      {
        variant: "gaming",
        active: true,
        class: "bg-gaming-primary/30 text-gaming-primary shadow-gaming",
      },
      {
        variant: "neon",
        active: true,
        class: "bg-gaming-primary/40 text-gaming-primary shadow-neon-strong",
      },
      {
        variant: "minimal",
        active: true,
        class:
          "bg-gaming-primary/12 text-gaming-primary border border-gaming-primary/20",
      },
      {
        variant: "clean",
        active: true,
        class:
          "bg-gaming-primary/8 text-gaming-primary border border-gaming-primary/15",
      },
      {
        variant: "editorial",
        active: true,
        class: "bg-foreground text-background font-medium",
      },
    ],
    defaultVariants: {
      variant: "default",
      active: false,
      size: "default",
    },
  }
);

export type CollectionNavProps = {
  showAddButton?: boolean;
  showShareWishlist?: boolean;
  userName?: string | null;
  variant?: VariantProps<typeof collectionNavVariants>["variant"];
  size?: VariantProps<typeof collectionNavVariants>["size"];
  className?: string;
};

const CollectionNav = memo(
  ({
    showAddButton = true,
    showShareWishlist = false,
    userName,
    variant = "default",
    size = "default",
    className,
  }: CollectionNavProps) => {
    const pathname = usePathname();

    const isWishlist = pathname.startsWith("/collection/wishlist");

    // Determine active navigation item
    const getActiveItem = (href: string) => {
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
        <nav className={cn(collectionNavVariants({ variant, size }))}>
          {collectionNavItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = getActiveItem(item.href);

            return (
              <Link key={item.href} href={item.href} title={item.description}>
                {variant === "editorial" ? (
                  <div
                    className={cn(
                      collectionNavItemVariants({
                        variant,
                        active: isActive,
                        size,
                      }),
                      "relative overflow-hidden rounded-md transition-all duration-200"
                    )}
                  >
                    <IconComponent className="size-4" />
                    <span className="hidden sm:inline">
                      {size === "sm" ? item.shortLabel : item.label}
                    </span>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size={size === "lg" ? "default" : "sm"}
                    className={cn(
                      collectionNavItemVariants({
                        variant: variant === "glass" ? "default" : variant,
                        active: isActive,
                        size,
                      }),
                      "relative overflow-hidden"
                    )}
                  >
                    <IconComponent className="size-4" />
                    <span className="hidden sm:inline">
                      {size === "sm" ? item.shortLabel : item.label}
                    </span>
                    {/* Active indicator */}
                    {isActive && variant !== "default" && (
                      <div className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-gaming-primary" />
                    )}
                    {/* Gaming accent overlay */}
                    {(variant === "gaming" || variant === "neon") && (
                      <div className="absolute inset-0 bg-gaming-primary/0 transition-all duration-200 group-hover:bg-gaming-primary/5" />
                    )}
                  </Button>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {showAddButton && (
            <Link href="/collection/add-game">
              <Button
                variant={
                  variant === "gaming"
                    ? "gaming"
                    : variant === "neon"
                      ? "gaming"
                      : "default"
                }
                size={size === "lg" ? "default" : "sm"}
                className={cn(
                  "flex items-center gap-2 transition-all duration-200",
                  variant === "editorial"
                    ? "hover:opacity-90"
                    : "hover:scale-105",
                  (variant === "gaming" || variant === "neon") &&
                    "hover:shadow-gaming-hover"
                )}
              >
                <Plus className="size-4" />
                <span className="hidden sm:inline">Add Game</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </Link>
          )}
          {(showShareWishlist || isWishlist) && (
            <ShareWishlist userName={userName} />
          )}
        </div>
      </div>
    );
  }
);

CollectionNav.displayName = "CollectionNav";

// Gaming Collection Nav Presets
export const GamingCollectionNav = memo(
  (props: Omit<CollectionNavProps, "variant">) => (
    <CollectionNav {...props} variant="gaming" />
  )
);
GamingCollectionNav.displayName = "GamingCollectionNav";

export const NeonCollectionNav = memo(
  (props: Omit<CollectionNavProps, "variant">) => (
    <CollectionNav {...props} variant="neon" />
  )
);
NeonCollectionNav.displayName = "NeonCollectionNav";

export const GlassCollectionNav = memo(
  (props: Omit<CollectionNavProps, "variant">) => (
    <CollectionNav {...props} variant="glass" />
  )
);
GlassCollectionNav.displayName = "GlassCollectionNav";

export const MinimalCollectionNav = memo(
  (props: Omit<CollectionNavProps, "variant">) => (
    <CollectionNav {...props} variant="minimal" />
  )
);
MinimalCollectionNav.displayName = "MinimalCollectionNav";

export const CleanCollectionNav = memo(
  (props: Omit<CollectionNavProps, "variant">) => (
    <CollectionNav {...props} variant="clean" />
  )
);
CleanCollectionNav.displayName = "CleanCollectionNav";

export const EditorialCollectionNav = memo(
  (props: Omit<CollectionNavProps, "variant">) => (
    <CollectionNav {...props} variant="editorial" />
  )
);
EditorialCollectionNav.displayName = "EditorialCollectionNav";

export { CollectionNav, collectionNavVariants, collectionNavItemVariants };

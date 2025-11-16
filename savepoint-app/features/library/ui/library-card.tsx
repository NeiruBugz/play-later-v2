"use client";

import type { LibraryItemStatus } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

import type { LibraryItemWithGameAndCount } from "@/features/library/hooks/use-library-data";
import { Badge } from "@/shared/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { IMAGE_API, IMAGE_SIZES } from "@/shared/config/image.config";
import { LibraryStatusMapper } from "@/shared/lib/ui/enum-mappers";

import { useQuickActionsVariant } from "../hooks/use-quick-actions-variant";
import { LibraryCardActionBar } from "./library-card-action-bar";
import { LibraryCardInteractiveBadge } from "./library-card-interactive-badge";

/**
 * Map library item status to badge variant for visual differentiation
 */
const statusVariantMap: Record<
  LibraryItemStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  CURIOUS_ABOUT: "outline",
  CURRENTLY_EXPLORING: "default",
  TOOK_A_BREAK: "secondary",
  EXPERIENCED: "secondary",
  WISHLIST: "outline",
  REVISITING: "default",
};

/**
 * Blur placeholder for better perceived performance while images load
 */
const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjY0IiBoZWlnaHQ9IjM1MiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjY0IiBoZWlnaHQ9IjM1MiIgZmlsbD0iI2U1ZTdlYiIvPjwvc3ZnPg==";

type LibraryCardProps = {
  item: LibraryItemWithGameAndCount;
};

/**
 * Library card component displaying a game cover with status and metadata
 *
 * Displays:
 * - Game cover image with hover effects
 * - Status badge (colored based on status)
 * - Library item count badge (only when multiple entries exist)
 * - Quick actions placeholder for future functionality
 * - Game title on hover via tooltip
 *
 * @param item - Library item with associated game details and count
 *
 * @example
 * ```tsx
 * <LibraryCard item={libraryItem} />
 * ```
 */
export function LibraryCard({ item }: LibraryCardProps) {
  const { game, status } = item;
  const hasMultipleEntries = game._count.libraryItems > 1;
  const variant = useQuickActionsVariant(item.id);

  // Extract cover image ID from the stored URL or use null
  const coverImageId =
    game.coverImage?.split("/").pop()?.replace(".jpg", "") ?? null;

  const handleLinkInteraction = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // If default was already prevented, don't do anything
    if (e.defaultPrevented) {
      return;
    }

    const target = e.target as HTMLElement;

    // Check if click originated from an interactive element
    // Check the target itself first
    if (
      target.tagName === "BUTTON" ||
      target.getAttribute("role") === "toolbar" ||
      target.hasAttribute("data-library-interactive") ||
      target.closest("button") !== null ||
      target.closest('[role="toolbar"]') !== null ||
      target.closest("[data-library-interactive]") !== null
    ) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <TooltipProvider>
      <Link
        href={`/games/${game.slug}`}
        className="group relative block [&>[data-library-interactive]]:pointer-events-auto"
        onClick={handleLinkInteraction}
        onMouseDown={handleLinkInteraction}
        aria-label={`${game.title} - ${LibraryStatusMapper[status as LibraryItemStatus]}${hasMultipleEntries ? ` - ${game._count.libraryItems} entries` : ""}`}
      >
        {/* Cover Image */}
        <div className="bg-muted relative aspect-[3/4] w-full overflow-hidden rounded-md">
          {coverImageId ? (
            <Image
              src={`${IMAGE_API}/${IMAGE_SIZES.hd}/${coverImageId}.jpg`}
              alt={game.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16vw"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
            />
          ) : (
            <div className="bg-muted text-muted-foreground flex h-full w-full items-center justify-center">
              <div className="text-center text-xs">No Cover</div>
            </div>
          )}

          {/* Overlay on hover to show title */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute inset-0 bg-black/60 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <div className="flex h-full items-end p-3">
                  <p className="line-clamp-3 text-sm font-semibold text-white">
                    {game.title}
                  </p>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{game.title}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Status Badge - Variant A: Interactive Badge */}
        {variant === "badge" && (
          <div
            data-library-interactive
            className="absolute top-2 left-2"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <LibraryCardInteractiveBadge
              libraryItemId={item.id}
              currentStatus={status as LibraryItemStatus}
              statusVariant={statusVariantMap[status as LibraryItemStatus]}
            />
          </div>
        )}

        {/* Status Badge - Variant B: Static Badge (Action Bar at bottom) */}
        {variant === "actionBar" && (
          <div className="absolute top-2 left-2">
            <Badge
              variant={statusVariantMap[status as LibraryItemStatus]}
              role="status"
              aria-label={`Status: ${LibraryStatusMapper[status as LibraryItemStatus]}`}
            >
              {LibraryStatusMapper[status as LibraryItemStatus]}
            </Badge>
          </div>
        )}

        {/* Library Item Count Badge (conditional) */}
        {hasMultipleEntries && (
          <div className="absolute top-2 right-2">
            <Badge
              variant="secondary"
              role="status"
              aria-label={`${game._count.libraryItems} library entries for this game`}
            >
              {game._count.libraryItems} entries
            </Badge>
          </div>
        )}

        {/* Variant B: Bottom Action Bar */}
        {variant === "actionBar" && (
          <LibraryCardActionBar
            libraryItemId={item.id}
            currentStatus={status as LibraryItemStatus}
          />
        )}
      </Link>
    </TooltipProvider>
  );
}

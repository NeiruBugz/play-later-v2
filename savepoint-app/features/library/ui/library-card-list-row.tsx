"use client";

import Link from "next/link";
import { memo } from "react";

import { GameCoverImage } from "@/shared/components/game-cover-image";
import { shouldShowBadge } from "@/shared/lib/library-status";
import { cn } from "@/shared/lib/ui/utils";
import { LibraryItemStatus } from "@/shared/types";

import { LibraryCardCta } from "./library-card-cta";
import { LibraryCardMenu } from "./library-card-menu";
import { LibraryCardMetadata } from "./library-card-metadata";
import { LibraryCardRating } from "./library-card-rating";
import type { LibraryCardProps } from "./library-card.types";
import { LibraryStatusBadge } from "./library-status-badge";

export const LibraryCardListRow = memo(function LibraryCardListRow({
  item,
  activeStatusFilter,
}: LibraryCardProps) {
  const { game, status } = item;
  const coverImageId =
    game.coverImage?.split("/").pop()?.replace(".jpg", "") ?? null;

  const handleLinkInteraction = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented) {
      return;
    }
    const target = e.target as HTMLElement;
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

  const badgeRedundant = activeStatusFilter === status;
  const showBadge = shouldShowBadge(status) && !badgeRedundant;

  return (
    <Link
      href={`/games/${game.slug}`}
      role="listitem"
      aria-label={game.title}
      onClick={handleLinkInteraction}
      onMouseDown={handleLinkInteraction}
      className={cn(
        "group bg-card border-border/40 relative flex w-full flex-row items-start gap-3 rounded-lg border p-3",
        "[&>[data-library-interactive]]:pointer-events-auto"
      )}
    >
      <div className="relative shrink-0 overflow-hidden rounded-md">
        <GameCoverImage
          imageId={coverImageId}
          gameTitle={game.title}
          size="cover_small"
          className="h-20 w-[60px]"
          sizes="60px"
        />
        <LibraryStatusBadge
          status={status}
          hasBeenPlayed={item.hasBeenPlayed}
          hidden={!showBadge}
          className="absolute top-1 left-1 z-10 origin-top-left scale-90"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-foreground truncate pr-11 text-[15px] leading-snug font-medium">
          {game.title}
        </p>

        <LibraryCardMetadata
          status={status as LibraryItemStatus}
          startedAt={item.startedAt}
          createdAt={item.createdAt}
          updatedAt={item.updatedAt}
          platform={item.platform}
        />

        <div
          className="h-4"
          data-testid="library-card-rating"
          data-library-interactive
        >
          <LibraryCardRating
            libraryItemId={item.id}
            initialRating={item.rating}
            size="sm"
          />
        </div>

        <div data-library-interactive className="mt-1">
          <LibraryCardCta libraryItem={item} />
        </div>
      </div>

      <div className="absolute top-2 right-2">
        <LibraryCardMenu libraryItem={item} variant="row" />
      </div>
    </Link>
  );
});

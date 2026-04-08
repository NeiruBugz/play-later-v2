"use client";

import Link from "next/link";
import { memo } from "react";

import { GameCoverImage } from "@/shared/components/game-cover-image";
import { Badge } from "@/shared/components/ui/badge";
import { useMediaQuery } from "@/shared/hooks/use-media-query";
import {
  getStatusConfig,
  getUpNextLabel,
  shouldShowBadge,
} from "@/shared/lib/library-status";
import { cn } from "@/shared/lib/ui/utils";
import { LibraryItemStatus } from "@/shared/types";

import { LibraryCardActionBar } from "./library-card-action-bar";
import { LibraryCardMobileActions } from "./library-card-mobile-actions";
import { LibraryCardSwipe } from "./library-card-swipe";
import type { LibraryCardProps } from "./library-card.types";

export const LibraryCard = memo(function LibraryCard({
  item,
  index = 0,
}: LibraryCardProps & { index?: number }) {
  const { game, status } = item;
  const coverImageId =
    game.coverImage?.split("/").pop()?.replace(".jpg", "") ?? null;
  const isMobile = useMediaQuery("(max-width: 767px)");

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

  const staggerIndex = Math.min(index + 1, 12);

  const statusConfig = getStatusConfig(status);
  const showBadge = shouldShowBadge(status);
  const badgeLabel =
    status === LibraryItemStatus.UP_NEXT
      ? getUpNextLabel(item.hasBeenPlayed)
      : statusConfig.label;

  const cardContent = (
    <>
      <div className="y2k:ring-primary/25 y2k:group-hover:ring-primary/60 y2k:ring-1 y2k:transition-all y2k:duration-300 y2k:group-hover:shadow-[0_0_20px_oklch(0.78_0.18_195/0.35),0_0_40px_oklch(0.78_0.18_195/0.1)] y2k:group-hover:scale-[1.02] relative overflow-hidden rounded-lg">
        <GameCoverImage
          imageId={coverImageId}
          gameTitle={game.title}
          size="cover_big_2x"
          className="aspect-[3/4] w-full"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, (max-width: 1280px) 14vw, 12vw"
          priority={index < 6}
          fetchPriority={index < 6 ? "high" : "low"}
        />

        {showBadge && (
          <div className="absolute top-3 left-3 z-10">
            <Badge
              variant={statusConfig.badgeVariant}
              role="status"
              aria-label={`Status: ${badgeLabel}`}
              className="shadow-paper-sm backdrop-blur-sm"
            >
              {badgeLabel}
            </Badge>
          </div>
        )}
      </div>

      <p className="body-sm mt-sm text-foreground line-clamp-2 font-medium">
        {game.title}
      </p>

      {!isMobile && (
        <LibraryCardActionBar
          libraryItemId={item.id}
          currentStatus={status as LibraryItemStatus}
          hasBeenPlayed={item.hasBeenPlayed}
        />
      )}
    </>
  );

  return (
    <Link
      href={`/games/${game.slug}`}
      role="listitem"
      className={cn(
        "group relative block [&>[data-library-interactive]]:pointer-events-auto",
        "animate-stagger-in",
        `stagger-${staggerIndex}`,
        "duration-normal ease-out-expo rounded-lg transition-all",
        !isMobile && "hover:brightness-110"
      )}
      onClick={handleLinkInteraction}
      onMouseDown={handleLinkInteraction}
      aria-label={game.title}
      style={{ animationDelay: `${staggerIndex * 50}ms` }}
    >
      {isMobile ? (
        <LibraryCardSwipe
          actionBar={
            <LibraryCardMobileActions
              libraryItemId={item.id}
              currentStatus={status as LibraryItemStatus}
              hasBeenPlayed={item.hasBeenPlayed}
            />
          }
        >
          {cardContent}
        </LibraryCardSwipe>
      ) : (
        cardContent
      )}
    </Link>
  );
});

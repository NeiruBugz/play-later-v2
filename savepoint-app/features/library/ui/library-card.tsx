"use client";

import Link from "next/link";
import { memo } from "react";

import { GameCoverImage } from "@/shared/components/game-cover-image";
import { useMediaQuery } from "@/shared/hooks/use-media-query";
import { shouldShowBadge } from "@/shared/lib/library-status";
import { cn } from "@/shared/lib/ui/utils";
import { LibraryItemStatus } from "@/shared/types";

import { LibraryCardCta } from "./library-card-cta";
import { LibraryCardMenu } from "./library-card-menu";
import { LibraryCardMetadata } from "./library-card-metadata";
import { LibraryCardRating } from "./library-card-rating";
import type { LibraryCardProps } from "./library-card.types";
import { LibraryStatusBadge } from "./library-status-badge";

export const LibraryCard = memo(function LibraryCard({
  item,
  index = 0,
  activeStatusFilter,
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

  const badgeRedundant = activeStatusFilter === status;
  const showBadge = shouldShowBadge(status) && !badgeRedundant;

  const cardContent = (
    <>
      <div
        className={cn(
          "relative overflow-hidden rounded-lg",
          // Y2K legacy treatment
          "y2k:ring-primary/25 y2k:group-hover:ring-primary/60 y2k:ring-1 y2k:transition-all y2k:duration-300 y2k:group-hover:shadow-[0_0_20px_oklch(0.72_0.22_145/0.35),0_0_40px_oklch(0.72_0.22_145/0.1)] y2k:group-hover:scale-[1.02]",
          // Jewel: chrome edge + glass inner tint + neon bloom from top-left + ceremonial hover
          // (Custom classes self-scope via `.jewel .jewel-*` CSS rules — no variant prefix needed)
          "jewel-chrome-thin jewel-glass jewel-neon-bloom jewel-hover-rise jewel-corners",
          // Staggered ambient breathing — slow, per-card offset
          !isMobile && "jewel-breathe-slow"
        )}
        style={
          !isMobile
            ? ({
                // Stagger breathe start so the grid doesn't pulse in unison
                animationDelay: `${(staggerIndex * 220) % 2000}ms`,
              } as React.CSSProperties)
            : undefined
        }
      >
        <GameCoverImage
          imageId={coverImageId}
          gameTitle={game.title}
          size="cover_big_2x"
          className="aspect-[3/4] w-full"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, (max-width: 1280px) 14vw, 12vw"
          priority={index < 6}
          fetchPriority={index < 6 ? "high" : "low"}
          style={{ viewTransitionName: `game-cover-${game.igdbId}` }}
        />

        <LibraryStatusBadge
          status={status}
          hasBeenPlayed={item.hasBeenPlayed}
          hidden={!showBadge}
          className="absolute top-2 left-2 z-10"
        />

        <LibraryCardMenu libraryItem={item} />
      </div>

      {/* Jewel: tactical meta strip — lives BELOW the cover, not inside it,
          so it doesn't collide with the hover action bar */}
      <div
        aria-hidden
        className="jewel:flex mt-1.5 hidden items-center justify-between gap-2"
      >
        <span className="jewel-meta truncate text-[0.58rem] tracking-[0.14em] opacity-60">
          {`// ${game.slug.slice(0, 14)}`}
        </span>
        <span className="jewel-meta-tilt text-[0.58rem] opacity-50">
          {String(index + 1).padStart(3, "0")}
        </span>
      </div>

      <p className="body-sm mt-sm text-foreground jewel-display jewel:mt-1 jewel:text-[0.75rem] jewel:font-normal jewel:leading-[1.25] jewel:tracking-[0.04em] line-clamp-2 font-medium">
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
        className="mt-0.5 h-4"
        data-testid="library-card-rating"
        data-library-interactive
      >
        <LibraryCardRating
          libraryItemId={item.id}
          initialRating={item.rating}
          size="sm"
        />
      </div>

      <div data-library-interactive>
        <LibraryCardCta libraryItem={item} />
      </div>
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
      {cardContent}
    </Link>
  );
});

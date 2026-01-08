"use client";

import Link from "next/link";
import { memo } from "react";

import { GameCoverImage } from "@/shared/components/game-cover-image";
import { Badge } from "@/shared/components/ui/badge";
import { getStatusConfig } from "@/shared/lib/library-status";
import { cn } from "@/shared/lib/ui";
import type { LibraryItemStatus } from "@/shared/types";

import { LibraryCardActionBar } from "./library-card-action-bar";
import type { LibraryCardProps } from "./library-card.types";

export const LibraryCard = memo(function LibraryCard({
  item,
  index = 0,
}: LibraryCardProps & { index?: number }) {
  const { game, status } = item;
  const hasMultipleEntries = game.entryCount > 1;
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

  const staggerIndex = Math.min(index + 1, 12);

  const statusConfig = getStatusConfig(status);

  return (
    <Link
      href={`/games/${game.slug}`}
      className={cn(
        "group relative block [&>[data-library-interactive]]:pointer-events-auto",
        "animate-stagger-in",
        `stagger-${staggerIndex}`,
        "duration-normal ease-out-expo rounded-lg transition-all",
        "hover:shadow-paper-md hover:scale-[1.02]"
      )}
      onClick={handleLinkInteraction}
      onMouseDown={handleLinkInteraction}
      aria-label={`${game.title} - ${statusConfig.label}${hasMultipleEntries ? ` - ${game.entryCount} entries` : ""}`}
      style={{ animationDelay: `${staggerIndex * 50}ms` }}
    >
      <div className="relative overflow-hidden rounded-lg">
        <GameCoverImage
          imageId={coverImageId}
          gameTitle={game.title}
          size="hd"
          className="aspect-[3/4] w-full"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16vw"
          priority={index < 6}
          fetchPriority={index < 6 ? "high" : "low"}
        />

        <div className="duration-normal pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100">
          <div className="p-lg flex h-full items-end">
            <p className="body-sm line-clamp-3 font-semibold text-white drop-shadow-md">
              {game.title}
            </p>
          </div>
        </div>

        <div className="absolute top-3 left-3 z-10">
          <Badge
            variant={statusConfig.badgeVariant}
            role="status"
            aria-label={`Status: ${statusConfig.label}`}
            className="shadow-paper-sm backdrop-blur-sm"
          >
            {statusConfig.label}
          </Badge>
        </div>
      </div>

      <LibraryCardActionBar
        libraryItemId={item.id}
        currentStatus={status as LibraryItemStatus}
      />
    </Link>
  );
});

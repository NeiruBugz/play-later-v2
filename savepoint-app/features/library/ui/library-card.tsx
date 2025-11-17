"use client";

import type { LibraryItemStatus } from "@prisma/client";
import Link from "next/link";

import { GameCoverImage } from "@/shared/components/game-cover-image";
import { Badge } from "@/shared/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import {
  LIBRARY_STATUS_LABELS,
  LIBRARY_STATUS_VARIANTS,
} from "@/shared/lib/library-status";

import { LibraryCardActionBar } from "./library-card-action-bar";
import type { LibraryCardProps } from "./library-card.types";

export function LibraryCard({ item }: LibraryCardProps) {
  const { game, status } = item;
  const hasMultipleEntries = game._count.libraryItems > 1;
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
  return (
    <TooltipProvider>
      <Link
        href={`/games/${game.slug}`}
        className="group relative block [&>[data-library-interactive]]:pointer-events-auto"
        onClick={handleLinkInteraction}
        onMouseDown={handleLinkInteraction}
        aria-label={`${game.title} - ${LIBRARY_STATUS_LABELS[status as LibraryItemStatus]}${hasMultipleEntries ? ` - ${game._count.libraryItems} entries` : ""}`}
      >
        <GameCoverImage
          imageId={coverImageId}
          gameTitle={game.title}
          size="hd"
          className="aspect-[3/4] w-full rounded-md"
          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16vw"
        />
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
        <div className="absolute top-2 left-2">
          <Badge
            variant={LIBRARY_STATUS_VARIANTS[status as LibraryItemStatus]}
            role="status"
            aria-label={`Status: ${LIBRARY_STATUS_LABELS[status as LibraryItemStatus]}`}
          >
            {LIBRARY_STATUS_LABELS[status as LibraryItemStatus]}
          </Badge>
        </div>
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
        <LibraryCardActionBar
          libraryItemId={item.id}
          currentStatus={status as LibraryItemStatus}
        />
      </Link>
    </TooltipProvider>
  );
}

import { LibraryStatusBadge } from "@/entities/library-item";
import { Badge } from "@/shared/ui/badge";
import { RatingInput } from "@/shared/ui/rating-input";
import { GameCard } from "@/widgets/game-card";

import { LibraryItemCardCta } from "./library-item-card-cta";
import type { LibraryItemCardProps } from "./library-item-card.type";
import { getContextualDate } from "./library-item-card.utility";

export function LibraryItemCard({ item, menu }: LibraryItemCardProps) {
  const contextualDate = getContextualDate({
    status: item.status,
    startedAt: item.startedAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  });
  const hasPlatform =
    typeof item.platform === "string" && item.platform.trim().length > 0;

  return (
    <div
      className="relative flex flex-row gap-3 md:flex-col md:gap-0"
      data-testid="library-item-card-root"
    >
      <div className="relative w-20 shrink-0 md:w-auto">
        <GameCard
          game={{
            slug: item.game.slug,
            title: item.game.title,
            coverImageId: item.game.coverImage,
          }}
          asLink
          density="standard"
          badges={
            <div className="absolute top-2 left-2">
              <LibraryStatusBadge
                status={item.status}
                hasBeenPlayed={item.hasBeenPlayed}
              />
            </div>
          }
        />
        {menu ? (
          <div className="absolute top-2 right-2 z-10">{menu}</div>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col md:contents">
        <div
          className="text-muted-foreground mt-0 flex h-4 items-center truncate text-[11px] leading-none md:mt-1"
          data-testid="library-item-card-metadata"
        >
          {hasPlatform ? (
            <Badge
              variant="secondary"
              className="h-4 px-1.5 py-0 text-[10px] leading-none font-medium"
            >
              {item.platform}
            </Badge>
          ) : null}
          {hasPlatform && contextualDate ? (
            <span aria-hidden className="mx-1.5">
              •
            </span>
          ) : null}
          {contextualDate ? (
            <span className="truncate">{contextualDate}</span>
          ) : null}
        </div>

        <div
          className="mt-0.5 h-4"
          data-testid="library-item-card-rating"
          onClickCapture={(event) => {
            event.stopPropagation();
          }}
        >
          <RatingInput
            value={item.rating}
            size="sm"
            readOnly
            aria-label={
              item.rating === null
                ? `No rating for ${item.game.title}`
                : `Rating: ${item.rating / 2} out of 5 stars`
            }
          />
        </div>

        <LibraryItemCardCta item={item} />
      </div>
    </div>
  );
}

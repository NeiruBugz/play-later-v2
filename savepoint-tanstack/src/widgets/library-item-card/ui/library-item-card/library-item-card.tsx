import { LibraryStatusBadge } from "@/entities/library-item";
import { Badge } from "@/shared/ui/badge";
import { RatingInput } from "@/shared/ui/rating-input";
import { GameCard } from "@/widgets/game-card";

import { LibraryItemCardCta } from "./library-item-card-cta";
import type { LibraryItemCardProps } from "./library-item-card.type";
import { getContextualDate } from "./library-item-card.utility";

/**
 * Library list card. Composes `GameCard` (cover + clamped title) with:
 *  - status pill overlaid top-left of the cover
 *  - optional action-menu slot top-right
 *  - meta footer below the cover: platform badge, contextual date,
 *    read-only 5-star rating, status-driven primary CTA
 *
 * Meta-footer was restored in Phase 3 of the Slice 18A visual-parity push
 * — see `context/audits/2026-05-18/visual-parity.md` § Library.
 *
 * Click semantics:
 * - GameCard body is a TanStack `<Link>` to `/games/$slug`.
 * - Action-menu + CTA + rating are rendered as **siblings** of the link,
 *   not descendants. Clicks on these surfaces physically cannot bubble
 *   through the link, regardless of Radix event composition / asChild
 *   Slot patterns / nested-interactive ambiguities.
 */
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
    <div className="relative flex flex-col">
      <div className="relative">
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

      {/* Meta-footer: platform + date + rating + CTA. Lives OUTSIDE the
          GameCard link wrapper (GameCard renders its own internal anchor)
          so the interactive controls don't trigger navigation. */}
      <div
        className="text-muted-foreground mt-1 flex h-4 items-center truncate text-[11px] leading-none"
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
          // Defensive: rating widget here is display-only, but the wrapper
          // sits next to the cover Link — stop any stray click before it
          // can navigate.
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
  );
}

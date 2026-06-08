import { PlatformBadgeItem } from "@/entities/game/ui/platform-badges";
import {
  isTouched,
  LibraryLifecycleStrip,
  LibraryStatusBadge,
  resolveAcquisitionEmphasis,
  resolveAcquisitionLabel,
  shouldShowAcquisitionChip,
} from "@/entities/library-item";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { RatingInput } from "@/shared/ui/rating-input";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { GameCard } from "@/widgets/game-card";

import { LibraryItemCardCta } from "./library-item-card-cta";
import type { LibraryItemCardProps } from "./library-item-card.type";
import { getStatusCoverAccent } from "./library-item-card.utility";

export function LibraryItemCard({ item, menu }: LibraryItemCardProps) {
  const hasPlatform =
    typeof item.platform === "string" && item.platform.trim().length > 0;
  // F04: a started-then-shelved game reads differently from one never touched.
  // "Touched" is derived from real play signals (startedAt / completedAt /
  // status) — see isTouched — not the dead `hasBeenPlayed` flag.
  const touched = isTouched(item);
  const isTried =
    touched && (item.status === "SHELF" || item.status === "WISHLIST");
  // F03: the chip flags non-default acquisition (subscription / physical);
  // the DIGITAL default stays implicit to keep the row clean.
  const showAcquisitionChip = shouldShowAcquisitionChip(item.acquisitionType);
  const acquisitionLabel = resolveAcquisitionLabel(
    item.acquisitionType,
    item.platform
  );
  const acquisitionEmphasis = resolveAcquisitionEmphasis(item.acquisitionType);

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
          density="minimal"
          coverAccentClassName={getStatusCoverAccent(item.status)}
          badges={
            <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
              <LibraryStatusBadge
                status={item.status}
                hasBeenPlayed={touched}
                className="uppercase"
              />
              {isTried ? (
                <span className="bg-foreground text-background rounded-full px-2 py-0.5 text-[10px] leading-none font-semibold tracking-wide uppercase">
                  Tried
                </span>
              ) : null}
            </div>
          }
        />
        {menu ? (
          <div className="absolute top-2 right-2 z-10">{menu}</div>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-1 flex-col md:contents">
        <h3 className="mt-0.5 line-clamp-2 text-sm leading-tight font-semibold md:mt-2 md:min-h-[2lh]">
          {item.game.title}
        </h3>

        <LibraryLifecycleStrip
          status={item.status}
          createdAt={item.createdAt}
          startedAt={item.startedAt}
          completedAt={item.completedAt}
          className="mt-0.5 mb-1 md:mt-2"
        />

        <div
          className="text-muted-foreground mt-0 flex h-4 items-center gap-1.5 truncate text-[11px] leading-none md:mt-1"
          data-testid="library-item-card-metadata"
        >
          {hasPlatform ? (
            <TooltipProvider>
              <PlatformBadgeItem name={item.platform!} />
            </TooltipProvider>
          ) : null}
          {showAcquisitionChip ? (
            <Badge
              variant={
                acquisitionEmphasis === "subscription" ? "default" : "outline"
              }
              className={cn(
                "h-4 px-1.5 py-0 text-[10px] leading-none font-medium uppercase",
                acquisitionEmphasis === "subscription" &&
                  "bg-primary/10 text-primary border-transparent"
              )}
            >
              {acquisitionLabel}
            </Badge>
          ) : null}
        </div>

        <div
          className="mt-0.5 flex h-4 items-center"
          data-testid="library-item-card-rating"
          onClickCapture={(event) => {
            event.stopPropagation();
          }}
        >
          {item.rating === null ? (
            <span className="text-muted-foreground text-xs italic">
              unrated
            </span>
          ) : (
            <RatingInput
              value={item.rating}
              size="sm"
              readOnly
              aria-label={`Rating: ${item.rating / 2} out of 5 stars`}
            />
          )}
        </div>

        <LibraryItemCardCta item={item} />
      </div>
    </div>
  );
}

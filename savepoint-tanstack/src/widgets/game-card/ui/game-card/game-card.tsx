import { Link } from "@tanstack/react-router";

import { PlatformBadges } from "@/entities/game";
import { buildCoverImageUrl } from "@/shared/lib/igdb-image";
import { cn } from "@/shared/lib/utils";

import {
  gameCardCoverVariants,
  gameCardTitleVariants,
  gameCardVariants,
} from "../../lib/game-card.variants";
import type { GameCardProps } from "./game-card.type";

export function GameCard({
  game,
  layout = "vertical",
  density = "standard",
  size = "md",
  asLink = true,
  onClick,
  children,
  badges,
  overlay,
  coverAccentClassName,
  titleClassName,
  className,
  ...props
}: GameCardProps) {
  const { slug, title, coverImageId, releaseYear, platforms = [] } = game;
  const coverUrl = buildCoverImageUrl(coverImageId);
  const showMeta =
    density === "detailed" &&
    ((releaseYear ?? null) !== null || platforms.length > 0);

  const card = (
    <div
      className={cn(
        gameCardVariants({
          layout,
          density,
          size,
          interactive: asLink || Boolean(onClick),
        }),
        className
      )}
      onClick={!asLink ? onClick : undefined}
      {...props}
    >
      <div className={cn(gameCardCoverVariants(), "w-full")}>
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={`Cover for ${title}`}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            role="img"
            aria-label={`Cover for ${title}`}
            className={cn(
              "flex h-full w-full items-center justify-center p-4",
              coverAccentClassName ?? "bg-muted"
            )}
          >
            {coverAccentClassName ? (
              <span className="line-clamp-3 text-center text-lg font-bold tracking-wide text-white uppercase">
                {title}
              </span>
            ) : null}
          </div>
        )}
        {badges ? (
          <div className="pointer-events-none absolute inset-0">{badges}</div>
        ) : null}
        {overlay ? <div className="absolute inset-0">{overlay}</div> : null}
      </div>

      {density !== "minimal" ? (
        <div className="p-md gap-md flex w-full flex-col">
          <h3
            className={cn(
              gameCardTitleVariants({ clamp: true }),
              "min-w-0 flex-1",
              titleClassName
            )}
          >
            {title}
          </h3>

          {showMeta ? (
            <div className="gap-sm flex flex-col">
              {(releaseYear ?? null) !== null ? (
                <span className="body-sm text-muted-foreground">
                  {releaseYear}
                </span>
              ) : null}
              {platforms.length > 0 ? (
                <PlatformBadges platforms={platforms} />
              ) : null}
            </div>
          ) : null}

          {children ? (
            <div className="gap-md mt-auto flex flex-col">{children}</div>
          ) : null}
        </div>
      ) : null}
    </div>
  );

  if (asLink) {
    return (
      <Link
        to="/games/$slug"
        params={{ slug }}
        className="focus-visible:ring-primary block rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        aria-label={`View ${title}`}
      >
        {card}
      </Link>
    );
  }

  return card;
}

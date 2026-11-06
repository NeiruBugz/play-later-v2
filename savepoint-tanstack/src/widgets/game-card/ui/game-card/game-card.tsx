import { Link } from "@tanstack/react-router";

import { PlatformBadges } from "@/entities/game";
import { buildCoverImageProps } from "@/shared/lib/igdb-image";
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
  const cover = buildCoverImageProps(coverImageId);
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
        {cover ? (
          <img
            src={cover.src}
            srcSet={cover.srcSet}
            alt={`Cover for ${title}`}
            loading="lazy"
            decoding="async"
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
              <span className="line-clamp-3 text-center text-lg font-bold tracking-wide text-scrim-foreground uppercase">
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
        <div className="flex w-full flex-col gap-2 p-2">
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
            <div className="flex flex-col gap-1.5">
              {(releaseYear ?? null) !== null ? (
                <span className="text-sm text-muted-foreground">
                  {releaseYear}
                </span>
              ) : null}
              {platforms.length > 0 ? (
                <PlatformBadges platforms={platforms} />
              ) : null}
            </div>
          ) : null}

          {children ? (
            <div className="mt-auto flex flex-col gap-2">{children}</div>
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
        className="block rounded-lg focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
        aria-label={`View ${title}`}
      >
        {card}
      </Link>
    );
  }

  return card;
}

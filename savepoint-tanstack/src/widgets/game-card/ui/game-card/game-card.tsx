import { Link } from "@tanstack/react-router";

import { PlatformBadges } from "@/entities/game";
import { cn } from "@/shared/lib/utils";
import { GameCover } from "@/shared/ui/game-cover";

import {
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
  lengthLabel,
  titleClassName,
  className,
  ...props
}: GameCardProps) {
  const { slug, title, coverImageId, releaseYear, platforms = [] } = game;
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
      <GameCover src={coverImageId} name={title}>
        {badges ? (
          <div className="pointer-events-none absolute inset-0">{badges}</div>
        ) : null}
        {overlay ? <div className="absolute inset-0">{overlay}</div> : null}
      </GameCover>

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

          <p
            data-testid="game-card-length"
            className="h-6 text-base leading-6 text-muted-foreground md:h-4 md:text-xs md:leading-4"
          >
            {lengthLabel}
          </p>

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
        className="block rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        aria-label={`View ${title}`}
      >
        {card}
      </Link>
    );
  }

  return card;
}

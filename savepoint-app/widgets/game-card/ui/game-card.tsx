import Link from "next/link";

import { Card } from "@/shared/components/ui/card";
import { cn } from "@/shared/lib/ui/utils";

import { gameCardVariants } from "../lib/game-card.variants";
import { GameCardContent } from "./game-card-content";
import { GameCardCover } from "./game-card-cover";
import { GameCardFooter } from "./game-card-footer";
import { GameCardHeader } from "./game-card-header";
import { GameCardMeta } from "./game-card-meta";
import type { GameCardProps, GameData } from "./game-card.types";

function isSearchGame(game: GameData): game is {
  id: number | string;
  name: string;
  slug: string;
  coverImageId?: string | null;
  releaseYear?: number | null;
  releaseDate?: number | null;
  platforms?: string[] | Array<{ name: string }>;
  gameType?: number;
} {
  return "releaseYear" in game || "releaseDate" in game || "gameType" in game;
}

function normalizePlatforms(
  platforms?: string[] | Array<{ name: string }>
): string[] {
  if (!platforms) return [];
  if (typeof platforms[0] === "string") return platforms as string[];
  return (platforms as Array<{ name: string }>).map((p) => p.name);
}

export function GameCard({
  game,
  layout = "vertical",
  density = "standard",
  size = "md",
  asLink = true,
  onClick,
  children,
  enableHoverEffects = true,
  priority = false,
  sizes,
  badges,
  overlay,
  className,
  ...props
}: GameCardProps) {
  const isSearch = isSearchGame(game);

  const coverImageId = game.coverImageId;
  const gameName = game.name;
  const gameSlug = game.slug;

  const releaseYear = isSearch
    ? (game.releaseYear ??
      (game.releaseDate
        ? new Date(game.releaseDate * 1000).getFullYear()
        : null))
    : null;

  const platforms = isSearch ? normalizePlatforms(game.platforms) : [];

  const cardContent = (
    <Card
      variant={enableHoverEffects ? "interactive" : "default"}
      className={cn(
        gameCardVariants({
          layout,
          density,
          size,
          interactive: asLink || !!onClick,
        }),
        className
      )}
      onClick={!asLink ? onClick : undefined}
      {...props}
    >
      <GameCardCover
        imageId={coverImageId}
        gameTitle={gameName}
        size={layout === "horizontal" ? "cover_big" : "hd"}
        aspectRatio={layout === "horizontal" ? "portrait" : "portrait"}
        priority={priority}
        sizes={
          sizes ||
          (layout === "horizontal"
            ? "96px"
            : "(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 16vw")
        }
        enableHoverEffect={enableHoverEffects}
        badges={badges}
        overlay={overlay}
        className={
          layout === "horizontal"
            ? "h-32 w-24 flex-shrink-0"
            : "aspect-[3/4] w-full"
        }
      />

      {density !== "minimal" && (
        <GameCardContent
          className={cn(
            layout === "horizontal" ? "py-xs min-w-0 flex-1" : "p-md w-full"
          )}
        >
          <GameCardHeader
            title={gameName}
            showClamp={layout === "vertical" || density === "standard"}
          />

          {density === "detailed" && (
            <GameCardMeta
              releaseYear={releaseYear}
              platforms={platforms}
              showPlatforms={platforms.length > 0}
            />
          )}

          {children && <GameCardFooter>{children}</GameCardFooter>}
        </GameCardContent>
      )}
    </Card>
  );

  if (asLink) {
    return (
      <Link
        href={`/games/${gameSlug}`}
        className="focus-visible:ring-primary block rounded-lg focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        aria-label={`View ${gameName}`}
      >
        {cardContent}
      </Link>
    );
  }

  return cardContent;
}

GameCard.displayName = "GameCard";

export {
  GameCardContent,
  GameCardCover,
  GameCardFooter,
  GameCardHeader,
  GameCardMeta,
};

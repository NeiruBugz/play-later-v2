import { GameCoverImage } from "@/shared/components/game-cover-image";
import { cn } from "@/shared/lib/ui/utils";

import { gameCardCoverVariants } from "../lib/game-card.variants";
import type { GameCardCoverProps } from "./game-card.types";

export function GameCardCover({
  imageId,
  gameTitle,
  size = "cover_big",
  aspectRatio = "portrait",
  priority = false,
  sizes,
  enableHoverEffect = true,
  overlay,
  badges,
  className,
  ...props
}: GameCardCoverProps) {
  return (
    <div
      className={cn(gameCardCoverVariants({ aspectRatio }), className)}
      {...props}
    >
      <GameCoverImage
        imageId={imageId}
        gameTitle={gameTitle}
        size={size}
        priority={priority}
        sizes={sizes}
        enableHoverEffect={enableHoverEffect}
        className="h-full w-full"
      />

      {badges && (
        <div className="pointer-events-none absolute inset-0">{badges}</div>
      )}

      {overlay && <div className="absolute inset-0">{overlay}</div>}
    </div>
  );
}

GameCardCover.displayName = "GameCardCover";

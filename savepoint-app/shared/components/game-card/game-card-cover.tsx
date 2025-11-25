import { GameCoverImage } from "@/shared/components/game-cover-image";
import { cn } from "@/shared/lib/ui/utils";

import { gameCardCoverVariants } from "./game-card.variants";
import type { GameCardCoverProps } from "./game-card.types";

/**
 * GameCardCover - Handles game cover image display with overlays and badges
 */
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

      {/* Badges positioned on top of cover */}
      {badges && (
        <div className="absolute inset-0 pointer-events-none">{badges}</div>
      )}

      {/* Overlay (e.g., hover effects with title) */}
      {overlay && <div className="absolute inset-0">{overlay}</div>}
    </div>
  );
}

GameCardCover.displayName = "GameCardCover";

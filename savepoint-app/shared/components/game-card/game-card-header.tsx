import { cn } from "@/shared/lib/ui/utils";

import type { GameCardHeaderProps } from "./game-card.types";
import {
  gameCardHeaderVariants,
  gameCardTitleVariants,
} from "./game-card.variants";

/**
 * GameCardHeader - Displays game title and optional badge
 */
export function GameCardHeader({
  title,
  badge,
  showClamp = true,
  className,
  ...props
}: GameCardHeaderProps) {
  return (
    <div className={cn(gameCardHeaderVariants(), className)} {...props}>
      <h3
        className={cn(
          gameCardTitleVariants({ clamp: showClamp }),
          "min-w-0 flex-1"
        )}
      >
        {title}
      </h3>
      {badge && <div className="flex-shrink-0">{badge}</div>}
    </div>
  );
}

GameCardHeader.displayName = "GameCardHeader";

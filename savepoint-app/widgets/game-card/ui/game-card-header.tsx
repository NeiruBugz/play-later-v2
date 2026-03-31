import { cn } from "@/shared/lib/ui/utils";

import {
  gameCardHeaderVariants,
  gameCardTitleVariants,
} from "../lib/game-card.variants";
import type { GameCardHeaderProps } from "./game-card.types";

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

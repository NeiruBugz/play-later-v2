import { cn } from "@/shared/lib/ui/utils";

import type { GameCardContentProps } from "./game-card.types";
import { gameCardContentVariants } from "./game-card.variants";

/**
 * GameCardContent - Container for card text content
 */
export function GameCardContent({
  children,
  className,
  ...props
}: GameCardContentProps) {
  return (
    <div className={cn(gameCardContentVariants(), className)} {...props}>
      {children}
    </div>
  );
}

GameCardContent.displayName = "GameCardContent";

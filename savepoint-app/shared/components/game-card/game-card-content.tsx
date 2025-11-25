import { cn } from "@/shared/lib/ui/utils";

import { gameCardContentVariants } from "./game-card.variants";
import type { GameCardContentProps } from "./game-card.types";

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

import { cn } from "@/shared/lib/ui/utils";

import type { GameCardFooterProps } from "./game-card.types";

/**
 * GameCardFooter - Container for badges, metadata, and actions
 */
export function GameCardFooter({
  children,
  className,
  ...props
}: GameCardFooterProps) {
  return (
    <div className={cn("flex flex-col gap-md mt-auto", className)} {...props}>
      {children}
    </div>
  );
}

GameCardFooter.displayName = "GameCardFooter";

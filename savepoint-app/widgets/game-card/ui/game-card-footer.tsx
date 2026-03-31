import { cn } from "@/shared/lib/ui/utils";

import type { GameCardFooterProps } from "./game-card.types";

export function GameCardFooter({
  children,
  className,
  ...props
}: GameCardFooterProps) {
  return (
    <div className={cn("gap-md mt-auto flex flex-col", className)} {...props}>
      {children}
    </div>
  );
}

GameCardFooter.displayName = "GameCardFooter";

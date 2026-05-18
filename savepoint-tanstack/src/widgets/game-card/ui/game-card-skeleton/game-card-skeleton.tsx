import { cn } from "@/shared/lib/utils";

import { gameCardVariants } from "../../lib/game-card.variants";
import type { GameCardSkeletonProps } from "./game-card-skeleton.type";

export function GameCardSkeleton({
  layout = "vertical",
  density = "standard",
  size = "md",
  className,
}: GameCardSkeletonProps) {
  return (
    <div
      aria-hidden="true"
      data-testid="game-card-skeleton"
      className={cn(
        gameCardVariants({ layout, density, size, interactive: false }),
        className
      )}
    >
      <div className="bg-muted aspect-[3/4] w-full animate-pulse rounded-md" />
      {density !== "minimal" ? (
        <div className="p-md gap-sm flex w-full flex-col">
          <div className="bg-muted h-4 w-3/4 animate-pulse rounded" />
          {density === "detailed" ? (
            <>
              <div className="bg-muted h-3 w-1/4 animate-pulse rounded" />
              <div className="gap-xs flex">
                <div className="bg-muted h-5 w-12 animate-pulse rounded" />
                <div className="bg-muted h-5 w-12 animate-pulse rounded" />
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

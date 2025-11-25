import { Card } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/ui/utils";

import { gameCardVariants } from "./game-card.variants";
import type { GameCardProps } from "./game-card.types";

/**
 * GameCardSkeleton - Loading state for GameCard
 *
 * Matches the layout and density of the actual GameCard component
 */
export function GameCardSkeleton({
  layout = "vertical",
  density = "standard",
  size = "md",
  className,
}: Pick<GameCardProps, "layout" | "density" | "size" | "className">) {
  return (
    <Card
      className={cn(
        gameCardVariants({ layout, density, size, interactive: false }),
        className
      )}
    >
      {/* Cover skeleton */}
      <Skeleton
        variant="image"
        animation="shimmer"
        className={
          layout === "horizontal"
            ? "h-32 w-24 flex-shrink-0 rounded-md"
            : "aspect-[3/4] w-full rounded-md"
        }
      />

      {/* Content skeleton */}
      {density !== "minimal" && (
        <div
          className={cn(
            "flex flex-col gap-md",
            layout === "horizontal" ? "flex-1 min-w-0 py-xs" : "w-full p-md"
          )}
        >
          {/* Title skeleton */}
          <Skeleton variant="title" className="w-3/4" />

          {/* Metadata skeleton for detailed density */}
          {density === "detailed" && (
            <>
              <Skeleton variant="text" className="w-1/4" />
              <div className="flex gap-sm mt-xs">
                <Skeleton className="h-6 w-16 rounded-sm" />
                <Skeleton className="h-6 w-16 rounded-sm" />
                <Skeleton className="h-6 w-16 rounded-sm" />
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

GameCardSkeleton.displayName = "GameCardSkeleton";

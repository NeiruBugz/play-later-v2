import { Card } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/ui/utils";

import { gameCardVariants } from "../lib/game-card.variants";
import type { GameCardProps } from "./game-card.types";

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
      <Skeleton
        variant="image"
        animation="shimmer"
        className={
          layout === "horizontal"
            ? "h-32 w-24 flex-shrink-0 rounded-md"
            : "aspect-[3/4] w-full rounded-md"
        }
      />

      {density !== "minimal" && (
        <div
          className={cn(
            "gap-md flex flex-col",
            layout === "horizontal" ? "py-xs min-w-0 flex-1" : "p-md w-full"
          )}
        >
          <Skeleton variant="title" className="w-3/4" />

          {density === "detailed" && (
            <>
              <Skeleton variant="text" className="w-1/4" />
              <div className="gap-sm mt-xs flex">
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

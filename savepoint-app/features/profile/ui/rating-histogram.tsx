"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/ui/utils";

export interface RatingHistogramBin {
  rating: number;
  count: number;
}

export interface RatingHistogramProps {
  ratingHistogram: RatingHistogramBin[];
  ratedCount: number;
  className?: string;
}

const MIN_RATED_COUNT_TO_DISPLAY = 5;
const MIN_BAR_HEIGHT_PERCENT = 4;

function formatStarLabel(rating: number): string {
  const stars = rating / 2;
  return Number.isInteger(stars) ? stars.toFixed(0) : stars.toFixed(1);
}

export function RatingHistogram({
  ratingHistogram,
  ratedCount,
  className,
}: RatingHistogramProps) {
  if (ratedCount < MIN_RATED_COUNT_TO_DISPLAY) {
    return null;
  }

  const maxCount = ratingHistogram.reduce(
    (max, bin) => (bin.count > max ? bin.count : max),
    0
  );

  return (
    <TooltipProvider delayDuration={100}>
      <section
        className={cn("w-full", className)}
        data-testid="rating-histogram"
        aria-label="Rating distribution"
      >
        <div className="mb-sm flex items-baseline justify-between">
          <h3 className="text-sm font-semibold tracking-tight">
            Rating Distribution
          </h3>
          <span className="text-muted-foreground text-xs tabular-nums">
            {ratedCount} rated
          </span>
        </div>
        <div
          className="flex h-24 items-end gap-1"
          role="img"
          aria-label={`Histogram of ${ratedCount} rated games across 10 rating bins`}
        >
          {ratingHistogram.map(({ rating, count }) => {
            const heightPercent =
              maxCount === 0
                ? 0
                : count === 0
                  ? 0
                  : Math.max(
                      MIN_BAR_HEIGHT_PERCENT,
                      Math.round((count / maxCount) * 100)
                    );
            const starLabel = formatStarLabel(rating);
            const label = `${count} ${count === 1 ? "game" : "games"} rated ${starLabel}★`;

            return (
              <Tooltip key={rating}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="group flex h-full flex-1 flex-col items-stretch justify-end focus-visible:outline-none"
                    aria-label={label}
                    data-testid={`rating-histogram-bar-${rating}`}
                    data-rating={rating}
                    data-count={count}
                  >
                    <span
                      className={cn(
                        "w-full rounded-sm transition-colors",
                        count === 0
                          ? "bg-muted/40 group-hover:bg-muted/60 group-focus-visible:bg-muted/60"
                          : "bg-amber-400/70 group-hover:bg-amber-400 group-focus-visible:bg-amber-400"
                      )}
                      style={{ height: `${heightPercent}%` }}
                      data-testid={`rating-histogram-bar-fill-${rating}`}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">{label}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        <div className="mt-xs flex justify-between" aria-hidden="true">
          <span className="text-muted-foreground text-[10px]">0.5★</span>
          <span className="text-muted-foreground text-[10px]">5★</span>
        </div>
      </section>
    </TooltipProvider>
  );
}

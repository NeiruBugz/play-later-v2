"use client";

import { Star } from "lucide-react";

import { cn } from "@/shared/lib/ui/utils";

export type RatingInputSize = "sm" | "md" | "lg";

export interface RatingInputProps {
  value: number | null;
  size?: RatingInputSize;
  readOnly?: boolean;
  className?: string;
  "aria-label"?: string;
}

const STAR_COUNT = 5;

const sizeClasses: Record<RatingInputSize, string> = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

const gapClasses: Record<RatingInputSize, string> = {
  sm: "gap-0.5",
  md: "gap-1",
  lg: "gap-1",
};

type StarFill = "full" | "half" | "empty";

function getStarFill(starIndex: number, value: number | null): StarFill {
  if (value === null) return "empty";
  const threshold = starIndex * 2;
  if (value >= threshold) return "full";
  if (value === threshold - 1) return "half";
  return "empty";
}

function RatingStar({
  fill,
  sizeClass,
}: {
  fill: StarFill;
  sizeClass: string;
}) {
  return (
    <span className={cn("relative inline-block", sizeClass)} aria-hidden="true">
      <Star
        className={cn("text-muted-foreground/40 absolute inset-0", sizeClass)}
        strokeWidth={1.5}
      />
      {fill !== "empty" && (
        <span
          className={cn(
            "absolute inset-0 overflow-hidden",
            fill === "half" ? "w-1/2" : "w-full"
          )}
        >
          <Star
            className={cn("fill-amber-400 text-amber-400", sizeClass)}
            strokeWidth={1.5}
          />
        </span>
      )}
    </span>
  );
}

export function RatingInput({
  value,
  size = "md",
  readOnly: _readOnly = true,
  className,
  "aria-label": ariaLabel,
}: RatingInputProps) {
  const sizeClass = sizeClasses[size];

  const computedLabel =
    ariaLabel ?? (value === null ? "No rating" : `${value / 2} out of 5 stars`);

  return (
    <span
      role="img"
      aria-label={computedLabel}
      className={cn("inline-flex items-center", gapClasses[size], className)}
    >
      {Array.from({ length: STAR_COUNT }, (_, i) => i + 1).map((starIndex) => (
        <RatingStar
          key={starIndex}
          fill={getStarFill(starIndex, value)}
          sizeClass={sizeClass}
        />
      ))}
    </span>
  );
}

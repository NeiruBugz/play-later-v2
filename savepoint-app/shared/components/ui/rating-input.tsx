"use client";

import { Star } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/shared/lib/ui/utils";

export type RatingInputSize = "sm" | "md" | "lg";

export interface RatingInputProps {
  value: number | null;
  size?: RatingInputSize;
  readOnly?: boolean;
  onChange?: (value: number | null) => void;
  className?: string;
  "aria-label"?: string;
}

const STAR_COUNT = 5;
const MIN_VALUE = 1;
const MAX_VALUE = 10;
const CLICK_DEBOUNCE_MS = 150;

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

function clampRating(value: number): number {
  if (value < MIN_VALUE) return MIN_VALUE;
  if (value > MAX_VALUE) return MAX_VALUE;
  return value;
}

export function RatingInput({
  value,
  size = "md",
  readOnly = true,
  onChange,
  className,
  "aria-label": ariaLabel,
}: RatingInputProps) {
  const sizeClass = sizeClasses[size];
  const interactive = !readOnly;

  const [preview, setPreview] = useState<number | null>(value);
  const lastCommitRef = useRef<number>(0);

  useEffect(() => {
    setPreview(value);
  }, [value]);

  const displayValue = interactive ? preview : value;

  const computedLabel =
    ariaLabel ??
    (interactive
      ? "Rating"
      : value === null
        ? "No rating"
        : `${value / 2} out of 5 stars`);

  const commit = useCallback(
    (next: number | null) => {
      if (!interactive || !onChange) return;
      const now = Date.now();
      if (now - lastCommitRef.current < CLICK_DEBOUNCE_MS) return;
      lastCommitRef.current = now;
      onChange(next);
    },
    [interactive, onChange]
  );

  const handleStarMouseMove = (
    starIndex: number,
    event: React.MouseEvent<HTMLSpanElement>
  ) => {
    if (!interactive) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const isLeft = event.clientX - rect.left < rect.width / 2;
    const next = isLeft ? starIndex * 2 - 1 : starIndex * 2;
    setPreview(next);
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    setPreview(value);
  };

  const handleStarClick = (
    starIndex: number,
    event: React.MouseEvent<HTMLSpanElement>
  ) => {
    if (!interactive) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const isLeft = event.clientX - rect.left < rect.width / 2;
    const next = isLeft ? starIndex * 2 - 1 : starIndex * 2;
    if (next === value) {
      commit(null);
    } else {
      commit(next);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLSpanElement>) => {
    if (!interactive) return;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      setPreview((prev) => clampRating((prev ?? 0) + 1));
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      setPreview((prev) => clampRating((prev ?? MIN_VALUE + 1) - 1));
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (preview !== null) commit(preview);
    } else if (event.key === "Escape") {
      event.preventDefault();
      commit(null);
    }
  };

  const interactiveProps: React.HTMLAttributes<HTMLSpanElement> = interactive
    ? {
        role: "slider",
        tabIndex: 0,
        "aria-valuemin": MIN_VALUE,
        "aria-valuemax": MAX_VALUE,
        "aria-valuenow": displayValue ?? 0,
        "aria-label": computedLabel,
        onMouseLeave: handleMouseLeave,
        onKeyDown: handleKeyDown,
      }
    : { role: "img", "aria-label": computedLabel };

  return (
    <span
      {...interactiveProps}
      className={cn(
        "inline-flex items-center",
        gapClasses[size],
        interactive &&
          "focus:ring-ring cursor-pointer rounded-sm focus:ring-2 focus:outline-none",
        className
      )}
    >
      {Array.from({ length: STAR_COUNT }, (_, i) => i + 1).map((starIndex) => {
        const starProps: React.HTMLAttributes<HTMLSpanElement> &
          Record<string, unknown> = interactive
          ? {
              onMouseMove: (e: React.MouseEvent<HTMLSpanElement>) =>
                handleStarMouseMove(starIndex, e),
              onClick: (e: React.MouseEvent<HTMLSpanElement>) =>
                handleStarClick(starIndex, e),
              "data-testid": `rating-star-${starIndex}`,
            }
          : {};
        return (
          <span key={starIndex} {...starProps} className="inline-block">
            <RatingStar
              fill={getStarFill(starIndex, displayValue)}
              sizeClass={sizeClass}
            />
          </span>
        );
      })}
    </span>
  );
}

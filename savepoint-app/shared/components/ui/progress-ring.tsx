"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { Pause, RotateCcw } from "lucide-react";
import { useEffect, useId, useState } from "react";

import { cn } from "@/shared/lib/ui";

const progressRingVariants = cva(
  "relative inline-flex items-center justify-center",
  {
    variants: {
      size: {
        sm: "h-12 w-12",
        md: "h-16 w-16",
        lg: "h-24 w-24",
        xl: "h-32 w-32",
        cover: "h-full w-full",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

const strokeWidths = {
  sm: 3,
  md: 4,
  lg: 5,
  xl: 6,
  cover: 4,
};

const iconSizes = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  cover: 16,
};

export type GameStatus =
  | "CURIOUS"
  | "PLAYING"
  | "BREAK"
  | "EXPERIENCED"
  | "WISHLIST"
  | "REVISITING";

export type LibraryItemStatusType =
  | "WISHLIST"
  | "CURIOUS_ABOUT"
  | "CURRENTLY_EXPLORING"
  | "TOOK_A_BREAK"
  | "EXPERIENCED"
  | "REVISITING";

const statusColors: Record<GameStatus, string> = {
  CURIOUS: "var(--status-curious)",
  PLAYING: "var(--status-playing)",
  BREAK: "var(--status-break)",
  EXPERIENCED: "var(--status-experienced)",
  WISHLIST: "var(--status-wishlist)",
  REVISITING: "var(--status-revisiting)",
};

const statusDefaults: Record<GameStatus, number> = {
  CURIOUS: 10,
  PLAYING: 50,
  BREAK: 50,
  EXPERIENCED: 100,
  WISHLIST: 0,
  REVISITING: 100,
};

export function mapLibraryStatusToGameStatus(
  libraryStatus: LibraryItemStatusType | string
): GameStatus {
  switch (libraryStatus) {
    case "WISHLIST":
      return "WISHLIST";
    case "CURIOUS_ABOUT":
      return "CURIOUS";
    case "CURRENTLY_EXPLORING":
      return "PLAYING";
    case "TOOK_A_BREAK":
      return "BREAK";
    case "EXPERIENCED":
      return "EXPERIENCED";
    case "REVISITING":
      return "REVISITING";
    default:
      return "CURIOUS";
  }
}

export interface ProgressRingProps
  extends VariantProps<typeof progressRingVariants> {
  progress?: number;
  status?: GameStatus;
  animated?: boolean;
  showPercentage?: boolean;
  showIcon?: boolean;
  glowOnHover?: boolean;
  className?: string;
  trackClassName?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  status = "CURIOUS",
  size = "md",
  animated = true,
  showPercentage = false,
  showIcon = false,
  glowOnHover = false,
  className,
  trackClassName,
  children,
}: ProgressRingProps) {
  const id = useId();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const actualProgress = progress ?? statusDefaults[status];
  const clampedProgress = Math.max(0, Math.min(100, actualProgress));

  const sizeKey = size ?? "md";
  const strokeWidth = strokeWidths[sizeKey];
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedProgress / 100) * circumference;
  const color = statusColors[status];

  const shouldAnimate = animated && mounted;

  const renderStatusIcon = () => {
    if (!showIcon) return null;

    const iconSize = iconSizes[sizeKey];

    if (status === "BREAK") {
      return (
        <Pause
          size={iconSize}
          className="text-muted-foreground absolute"
          aria-hidden="true"
        />
      );
    }

    if (status === "REVISITING") {
      return (
        <RotateCcw
          size={iconSize}
          className="text-muted-foreground absolute"
          aria-hidden="true"
        />
      );
    }

    return null;
  };

  return (
    <div
      className={cn(
        progressRingVariants({ size }),
        glowOnHover &&
          "duration-normal transition-all hover:drop-shadow-[0_0_8px_var(--status-playing)]",
        className
      )}
      role="progressbar"
      aria-valuenow={clampedProgress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${status.toLowerCase()} progress: ${clampedProgress}%`}
    >
      <svg
        className="absolute inset-0 -rotate-90"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter
            id={`glow-${id}`}
            x="-50%"
            y="-50%"
            width="200%"
            height="200%"
          >
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={cn("text-muted/30", trackClassName)}
          fill="none"
        />

        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          filter={glowOnHover ? `url(#glow-${id})` : undefined}
          style={
            {
              strokeDasharray: circumference,
              strokeDashoffset: shouldAnimate ? circumference : offset,
              "--circumference": circumference,
              "--target-offset": offset,
              transition: shouldAnimate ? "none" : undefined,
            } as React.CSSProperties
          }
          className={cn(
            shouldAnimate && "animate-progress-ring",
            "origin-center"
          )}
        />
      </svg>

      {showPercentage && !showIcon && !children && (
        <span
          className="body-xs text-muted-foreground font-medium"
          aria-hidden="true"
        >
          {clampedProgress}%
        </span>
      )}

      {renderStatusIcon()}

      {children && (
        <div className="relative z-10 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

export interface ProgressRingOverlayProps extends ProgressRingProps {
  aspectRatio?: "3/4" | "16/9" | "1/1";
}

export function ProgressRingOverlay({
  aspectRatio = "3/4",
  className,
  children,
  ...props
}: ProgressRingOverlayProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg",
        aspectRatio === "3/4" && "aspect-[3/4]",
        aspectRatio === "16/9" && "aspect-video",
        aspectRatio === "1/1" && "aspect-square",
        className
      )}
    >
      {children}

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-2">
        <ProgressRing {...props} size="cover" />
      </div>
    </div>
  );
}

export function ProgressRingSpinner({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeKey = size ?? "md";
  const strokeWidth = strokeWidths[sizeKey];
  const radius = 45;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      className={cn(
        progressRingVariants({ size }),
        "animate-spin-slow",
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <svg
        className="absolute inset-0"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
          fill="none"
        />

        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="var(--status-playing)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference * 0.25} ${circumference * 0.75}`}
        />
      </svg>
    </div>
  );
}

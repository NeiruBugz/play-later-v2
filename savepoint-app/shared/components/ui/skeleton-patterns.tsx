import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { Card, CardContent, CardHeader } from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/ui/utils";

/**
 * Text skeleton with realistic line widths for multi-line text
 */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-md", className)}>
      {Array.from({ length: lines }).map((_, i) => {
        // Vary line widths for realism - last line shorter
        const width =
          i === lines - 1 ? "w-3/4" : i % 2 === 0 ? "w-full" : "w-11/12";
        return <Skeleton key={i} variant="text" className={width} />;
      })}
    </div>
  );
}

SkeletonText.displayName = "SkeletonText";

/**
 * Avatar skeleton in various sizes
 */
export function SkeletonAvatar({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "size-8",
    md: "size-10",
    lg: "size-12",
  };

  return (
    <Skeleton
      variant="avatar"
      className={cn(sizeClasses[size], className)}
    />
  );
}

SkeletonAvatar.displayName = "SkeletonAvatar";

/**
 * Card skeleton matching Card component variants
 */
export function SkeletonCard({
  spacing = "spacious",
  variant = "default",
  className,
}: {
  spacing?: "compact" | "comfortable" | "spacious";
  variant?: "default" | "elevated" | "interactive";
  className?: string;
}) {
  return (
    <Card variant={variant} className={className}>
      <CardHeader spacing={spacing}>
        <Skeleton variant="title" />
        <Skeleton variant="text" className="w-1/2" />
      </CardHeader>
      <CardContent spacing={spacing}>
        <SkeletonText lines={3} />
      </CardContent>
    </Card>
  );
}

SkeletonCard.displayName = "SkeletonCard";

/**
 * Game card skeleton for game cover + title pattern
 */
export function SkeletonGameCard({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-lg", className)}>
      <Skeleton variant="image" animation="shimmer" />
      <div className="space-y-md">
        <Skeleton variant="title" />
        <Skeleton variant="text" className="w-5/6" />
        <Skeleton variant="text" className="w-4/6" />
      </div>
    </div>
  );
}

SkeletonGameCard.displayName = "SkeletonGameCard";

/**
 * List skeleton with avatar + text pattern
 */
export function SkeletonList({
  count = 3,
  className,
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("space-y-xl", className)}
      role="status"
      aria-live="polite"
      aria-label="Loading content"
    >
      <span className="sr-only">Loading...</span>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-xl">
          <SkeletonAvatar />
          <div className="flex-1 space-y-md">
            <Skeleton variant="title" />
            <Skeleton variant="text" />
          </div>
        </div>
      ))}
    </div>
  );
}

SkeletonList.displayName = "SkeletonList";

/**
 * Grid skeleton with customizable columns and content
 */
export function SkeletonGrid({
  count = 6,
  columns = 3,
  children = <SkeletonGameCard />,
  className,
}: {
  count?: number;
  columns?: 2 | 3 | 4;
  children?: ReactNode;
  className?: string;
}) {
  const gridClasses = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-xl", gridClasses[columns], className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>{children}</div>
      ))}
    </div>
  );
}

SkeletonGrid.displayName = "SkeletonGrid";

/**
 * Loading state with customizable skeleton variant
 */
export interface LoadingStateProps extends ComponentPropsWithoutRef<"div"> {
  variant?: "text" | "title" | "avatar" | "button" | "card" | "image";
  count?: number;
  loadingText?: string;
}

export function LoadingState({
  variant = "text",
  count = 3,
  loadingText = "Loading content",
  className,
  ...props
}: LoadingStateProps) {
  return (
    <div
      className={cn("space-y-xl", className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
      {...props}
    >
      <span className="sr-only">{loadingText}</span>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant={variant} />
      ))}
    </div>
  );
}

LoadingState.displayName = "LoadingState";

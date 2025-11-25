import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/shared/lib/ui/utils";

const skeletonVariants = cva("rounded-md relative overflow-hidden", {
  variants: {
    animation: {
      shimmer: [
        "bg-muted/50",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:bg-gradient-to-r before:from-transparent before:via-primary/5 before:to-transparent",
        "before:animate-[shimmer_2s_linear_infinite]",
      ].join(" "),
      pulse: "animate-pulse bg-primary/10",
      none: "bg-muted/30",
    },
    variant: {
      default: "",
      muted: "bg-muted/40",
      card: "bg-card border border-border/20",
      text: "h-4 w-full",
      title: "h-6 w-3/4",
      avatar: "h-12 w-12 rounded-full",
      button: "h-10 w-24",
      image: "aspect-video w-full",
      gameCard: "aspect-[3/4] w-full rounded-lg",
      progressRing: "aspect-square rounded-full",
    },
  },
  defaultVariants: {
    animation: "shimmer",
    variant: "default",
  },
});

export interface SkeletonProps
  extends ComponentPropsWithoutRef<"div">,
    VariantProps<typeof skeletonVariants> {}

export function Skeleton({
  className,
  animation,
  variant,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(skeletonVariants({ animation, variant }), className)}
      role="status"
      aria-label="Loading..."
      aria-hidden="true"
      {...props}
    />
  );
}

Skeleton.displayName = "Skeleton";

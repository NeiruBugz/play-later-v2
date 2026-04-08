import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/shared/lib/ui/utils";

const cardVariants = cva(
  "rounded-lg border transition-all duration-normal y2k-border-glow y2k:bg-card/70 y2k:backdrop-blur-md",
  {
    variants: {
      variant: {
        default:
          "bg-card border-border/10 hover:border-border/25 hover:bg-muted/10 y2k:hover:border-primary/20 y2k-glow-hover",
        interactive:
          "bg-card border-border/10 hover:border-border/25 hover:brightness-110 cursor-pointer y2k:hover:border-primary/30 y2k-glow-hover",
        elevated:
          "bg-card border-border/10 shadow-paper hover:shadow-paper-md y2k-glow",
        flat: "bg-card border-border/10",
        outlined:
          "bg-card border-border/20 hover:border-primary/40 y2k:border-primary/15",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const cardHeaderVariants = cva("flex flex-col", {
  variants: {
    spacing: {
      compact: "gap-xs p-lg",
      comfortable: "gap-sm p-xl",
      spacious: "gap-md p-2xl",
    },
  },
  defaultVariants: {
    spacing: "spacious",
  },
});

const cardContentVariants = cva("", {
  variants: {
    spacing: {
      compact: "p-lg pt-0",
      comfortable: "p-xl pt-0",
      spacious: "p-2xl pt-0",
    },
  },
  defaultVariants: {
    spacing: "spacious",
  },
});

const cardFooterVariants = cva("flex items-center", {
  variants: {
    spacing: {
      compact: "p-lg pt-0",
      comfortable: "p-xl pt-0",
      spacious: "p-2xl pt-0",
    },
  },
  defaultVariants: {
    spacing: "spacious",
  },
});

export interface CardProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant }), className)}
      {...props}
    />
  )
);
Card.displayName = "Card";

export interface CardHeaderProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardHeaderVariants> {}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, spacing, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardHeaderVariants({ spacing }), className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("heading-sm", className)} {...props} />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("body-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

export interface CardContentProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardContentVariants> {}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, spacing, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardContentVariants({ spacing }), className)}
      {...props}
    />
  )
);
CardContent.displayName = "CardContent";

export interface CardFooterProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardFooterVariants> {}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, spacing, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardFooterVariants({ spacing }), className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
};

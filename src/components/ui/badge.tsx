import { cn } from "@/src/packages/utils";
import { type VariantProps, cva } from "class-variance-authority";
import * as React from "react";

const colorVariants = {
  default: "border-transparent bg-primary text-primary-foreground shadow",
  destructive:
    "border-transparent bg-destructive text-destructive-foreground shadow",
  nintendo: "bg-nintendo border-transparent",
  outline: "text-foreground",
  pc: "bg-pc border-transparent",
  playstation: "bg-playstation border-transparent",
  secondary: "border-transparent bg-secondary text-secondary-foreground",
  xbox: "bg-xbox border-transparent",
};

export type ColorVariant = keyof typeof colorVariants;

const badgeVariants = cva(
  "inline-flex items-center rounded-sm text-white border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: colorVariants,
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

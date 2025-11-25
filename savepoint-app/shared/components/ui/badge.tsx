import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/shared/lib/ui/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-sm border px-lg py-xs text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 w-fit",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground border-border",
        playstation:
          "border-transparent bg-[#0070d1]/10 text-[#0070d1] hover:bg-[#0070d1]/20 dark:bg-[#0070d1]/20 dark:text-[#5ca7e8]",
        xbox: "border-transparent bg-[#107c10]/10 text-[#107c10] hover:bg-[#107c10]/20 dark:bg-[#107c10]/20 dark:text-[#6ebd6a]",
        nintendo:
          "border-transparent bg-[#e60012]/10 text-[#e60012] hover:bg-[#e60012]/20 dark:bg-[#e60012]/20 dark:text-[#f66]",
        pc: "border-transparent bg-[#1b2838]/10 text-[#1b2838] hover:bg-[#1b2838]/20 dark:bg-[#66c0f4]/20 dark:text-[#66c0f4]",
        curious:
          "border-transparent bg-[var(--status-curious)] text-[var(--status-curious-foreground)]",
        playing:
          "border-transparent bg-[var(--status-playing)] text-[var(--status-playing-foreground)]",
        break:
          "border-transparent bg-[var(--status-break)] text-[var(--status-break-foreground)]",
        experienced:
          "border-transparent bg-[var(--status-experienced)] text-[var(--status-experienced-foreground)]",
        wishlist:
          "border-transparent bg-[var(--status-wishlist)] text-[var(--status-wishlist-foreground)]",
        revisiting:
          "border-transparent bg-[var(--status-revisiting)] text-[var(--status-revisiting-foreground)]",
      },
    },
    defaultVariants: {
      variant: "default",
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

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-sm text-white border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    defaultVariants: {
      variant: "default",
    },
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground shadow",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow",
        nintendo: "bg-nintendo border-transparent",
        outline: "text-foreground",
        pc: "bg-pc border-transparent",
        playstation: "bg-playstation border-transparent",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        xbox: "bg-xbox border-transparent",
      },
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";

import { cn } from "@/shared/lib/ui/utils";

const buttonVariants = cva(
  "cursor-pointer inline-flex items-center justify-center gap-md whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-slow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-paper-sm hover:bg-primary/90 hover:shadow-paper active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-paper-sm hover:bg-destructive/90 hover:shadow-paper active:scale-[0.98]",
        outline:
          "border-b-2 border-border/30 bg-transparent hover:border-primary/40 rounded-none pb-xs active:scale-[0.98]",
        secondary:
          "bg-secondary text-secondary-foreground shadow-paper-sm hover:bg-secondary/80 hover:shadow-paper active:scale-[0.98]",
        ghost:
          "text-muted-foreground hover:bg-muted/20 hover:text-foreground active:scale-[0.98]",
        "ghost-hover":
          "text-transparent hover:text-muted-foreground hover:bg-muted/20 active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/70",
      },
      size: {
        default: "h-10 px-xl py-md",
        sm: "h-9 rounded-lg px-lg text-xs",
        lg: "h-11 rounded-lg px-2xl text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading, children, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    if (asChild && loading) {
      console.warn(
        "Button: 'loading' prop is not supported when 'asChild' is true"
      );
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && !asChild ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

import { Button as BaseButton } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import * as React from "react";

import { cn } from "@/shared/lib/utils";

const buttonVariants = cva(
  "cursor-pointer inline-flex items-center justify-center gap-md whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-slow focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-paper-sm hover:bg-primary-hover hover:shadow-paper active:bg-primary-active active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-paper-sm hover:bg-destructive/90 hover:shadow-paper active:scale-[0.98]",
        outline:
          "border border-border bg-card text-foreground hover:bg-surface-hover active:bg-surface-active",
        secondary:
          "bg-secondary text-secondary-foreground shadow-paper-sm hover:bg-surface-hover hover:shadow-paper active:bg-surface-active active:scale-[0.98]",
        ghost:
          "text-muted-foreground hover:bg-accent hover:text-accent-foreground active:scale-[0.98]",
        "ghost-hover":
          "text-transparent hover:text-muted-foreground hover:bg-accent active:scale-[0.98]",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary-hover",
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
  loading?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}

function Button({
  className,
  variant,
  size,
  loading,
  children,
  ref,
  ...props
}: ButtonProps) {
  const classes = cn(buttonVariants({ variant, size, className }));
  const disabled = loading || props.disabled;

  return (
    <BaseButton className={classes} ref={ref} {...props} disabled={disabled}>
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {children}
        </>
      ) : (
        children
      )}
    </BaseButton>
  );
}
Button.displayName = "Button";

export { Button, buttonVariants };

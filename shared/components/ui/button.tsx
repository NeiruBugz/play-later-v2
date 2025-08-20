import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { platformToGradientBadge } from "@/shared/lib/platform-to-color";
import { cn } from "@/shared/lib/tailwind-merge";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90 active:scale-95",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 active:scale-95",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-accent-foreground/20 active:scale-95",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 active:scale-95",
        ghost: "hover:bg-accent hover:text-accent-foreground active:scale-95",
        link: "text-primary underline-offset-4 hover:underline active:scale-95",
        // Gaming-themed variants
        gaming:
          "bg-gaming-gradient text-white shadow-gaming font-semibold hover:shadow-gaming-hover hover:scale-105 active:scale-95 transition-all duration-200",
        "gaming-outline":
          "border-2 border-gaming-primary bg-transparent text-gaming-primary font-semibold hover:bg-gaming-primary hover:text-white hover:shadow-gaming active:scale-95 transition-all duration-200",
        neon: "bg-gaming-primary/20 text-gaming-primary border border-gaming-primary/50 font-semibold shadow-neon hover:bg-gaming-primary hover:text-white hover:shadow-neon-strong active:scale-95 transition-all duration-200",
        "neon-pulse":
          "bg-gaming-primary/20 text-gaming-primary border border-gaming-primary/50 font-semibold animate-gaming-pulse hover:bg-gaming-primary hover:text-white hover:animate-none active:scale-95 transition-all duration-200",
        platform:
          "text-white font-semibold shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200",
        success:
          "bg-gaming-neon-green/20 text-gaming-neon-green border border-gaming-neon-green/50 font-semibold hover:bg-gaming-neon-green hover:text-black active:scale-95 transition-all duration-200",
        warning:
          "bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 font-semibold hover:bg-yellow-500 hover:text-black active:scale-95 transition-all duration-200",
        floating:
          "bg-gaming-primary text-white shadow-gaming-hover animate-float hover:shadow-neon-strong hover:animate-none active:scale-95 transition-all duration-200",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        xl: "h-12 rounded-lg px-10 text-base font-semibold",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type ButtonProps = {
  asChild?: boolean;
  platform?: string; // For platform-specific styling
  loading?: boolean; // Loading state
  leftIcon?: React.ReactNode; // Icon on the left
  rightIcon?: React.ReactNode; // Icon on the right
} & React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      platform,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    // Apply platform-specific styling for platform variant
    const platformClassName =
      variant === "platform" && platform
        ? platformToGradientBadge(platform)
        : "";

    // Loading spinner component
    const LoadingSpinner = () => (
      <svg
        className="-ml-1 mr-2 size-4 animate-spin text-current"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size }),
          platformClassName,
          loading && "pointer-events-none",
          className
        )}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading && <LoadingSpinner />}
        {!loading && leftIcon && leftIcon}
        {children}
        {!loading && rightIcon && rightIcon}
      </Comp>
    );
  }
);
Button.displayName = "Button";

// Platform-specific button creator
export const createPlatformButton = (platform: string) => {
  const PlatformButton = React.forwardRef<
    HTMLButtonElement,
    Omit<ButtonProps, "platform" | "variant">
  >((props, ref) => (
    <Button {...props} variant="platform" platform={platform} ref={ref} />
  ));
  PlatformButton.displayName = `PlatformButton(${platform})`;
  return PlatformButton;
};

// Gaming-themed button presets
export const GamingButton = React.forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, "variant">
>((props, ref) => <Button {...props} variant="gaming" ref={ref} />);
GamingButton.displayName = "GamingButton";

export const NeonButton = React.forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, "variant">
>((props, ref) => <Button {...props} variant="neon" ref={ref} />);
NeonButton.displayName = "NeonButton";

export const FloatingButton = React.forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, "variant">
>((props, ref) => <Button {...props} variant="floating" ref={ref} />);
FloatingButton.displayName = "FloatingButton";

// Utility function to get button variant based on context
export function getContextualButtonVariant(
  context: "primary" | "secondary" | "danger" | "success" | "gaming"
): ButtonProps["variant"] {
  switch (context) {
    case "primary":
      return "default";
    case "secondary":
      return "secondary";
    case "danger":
      return "destructive";
    case "success":
      return "success";
    case "gaming":
      return "gaming";
    default:
      return "default";
  }
}

export { Button, buttonVariants };

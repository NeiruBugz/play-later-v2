import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import {
  platformToColorBadge,
  platformToDisplayName,
  platformToGradientBadge,
} from "@/shared/lib/platform-to-color";
import { cn } from "@/shared/lib/tailwind-merge";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground border-border",
        // Gaming-themed variants
        gaming:
          "border-transparent bg-gaming-primary text-white shadow-gaming font-bold hover:bg-gaming-primary/80 hover:shadow-gaming-hover",
        "gaming-outline":
          "border-gaming-primary bg-transparent text-gaming-primary font-bold hover:bg-gaming-primary hover:text-white",
        neon: "border-gaming-primary/50 bg-gaming-primary/20 text-gaming-primary font-bold shadow-neon hover:bg-gaming-primary hover:text-white hover:shadow-neon-strong",
        success:
          "border-transparent bg-gaming-neon-green text-black font-bold shadow-sm hover:bg-gaming-neon-green/80",
        warning:
          "border-transparent bg-yellow-500 text-black font-bold shadow-sm hover:bg-yellow-500/80",
        // Status variants
        completed:
          "border-transparent bg-green-500 text-white font-bold shadow-sm hover:bg-green-500/80",
        playing:
          "border-transparent bg-blue-500 text-white font-bold shadow-sm hover:bg-blue-500/80",
        backlog:
          "border-transparent bg-gray-500 text-white font-bold shadow-sm hover:bg-gray-500/80",
        wishlist:
          "border-transparent bg-purple-500 text-white font-bold shadow-sm hover:bg-purple-500/80",
        // Special variants
        platform:
          "border-transparent text-white font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200",
        "platform-outline":
          "bg-transparent font-bold hover:scale-105 transition-all duration-200",
        animated:
          "border-transparent bg-gaming-primary text-white font-bold animate-gaming-pulse shadow-gaming",
        floating:
          "border-transparent bg-gaming-primary text-white font-bold animate-float shadow-neon-strong",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        default: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
        xl: "px-4 py-1.5 text-sm font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type BadgeProps = {
  platform?: string; // For platform-specific styling
  showPlatformName?: boolean; // Whether to show platform display name
} & React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof badgeVariants>;

function Badge({
  className,
  variant,
  size,
  platform,
  showPlatformName = false,
  children,
  ...props
}: BadgeProps) {
  // Apply platform-specific styling for platform variants
  const platformClassName = React.useMemo(() => {
    if (!platform) return "";

    if (variant === "platform") {
      return platformToGradientBadge(platform);
    } else if (variant === "platform-outline") {
      return platformToColorBadge(platform);
    }
    return "";
  }, [platform, variant]);

  // Determine badge content
  const badgeContent = React.useMemo(() => {
    if (showPlatformName && platform) {
      return children || platformToDisplayName(platform);
    }
    return children;
  }, [showPlatformName, platform, children]);

  return (
    <div
      className={cn(
        badgeVariants({ variant, size }),
        platformClassName,
        className
      )}
      {...props}
    >
      {badgeContent}
    </div>
  );
}

// Platform-specific badge creator
export const createPlatformBadge = (platform: string) => {
  const PlatformBadgeComponent = React.forwardRef<
    HTMLDivElement,
    Omit<BadgeProps, "platform" | "variant">
  >((props, ref) => (
    <div ref={ref}>
      <Badge {...props} variant="platform" platform={platform} />
    </div>
  ));
  PlatformBadgeComponent.displayName = `PlatformBadge(${platform})`;
  return PlatformBadgeComponent;
};

// Gaming-themed badge presets
export const GamingBadge = React.forwardRef<
  HTMLDivElement,
  Omit<BadgeProps, "variant">
>((props, ref) => (
  <div ref={ref}>
    <Badge {...props} variant="gaming" />
  </div>
));
GamingBadge.displayName = "GamingBadge";

export const NeonBadge = React.forwardRef<
  HTMLDivElement,
  Omit<BadgeProps, "variant">
>((props, ref) => (
  <div ref={ref}>
    <Badge {...props} variant="neon" />
  </div>
));
NeonBadge.displayName = "NeonBadge";

export const StatusBadge = React.forwardRef<
  HTMLDivElement,
  Omit<BadgeProps, "variant"> & {
    status: "completed" | "playing" | "backlog" | "wishlist";
  }
>(({ status, ...props }, ref) => (
  <div ref={ref}>
    <Badge {...props} variant={status} />
  </div>
));
StatusBadge.displayName = "StatusBadge";

// Platform badge with automatic name display
export const PlatformBadge = React.forwardRef<
  HTMLDivElement,
  Omit<BadgeProps, "variant" | "showPlatformName"> & {
    platform: string;
    style?: "gradient" | "outline";
  }
>(({ platform, style = "gradient", ...props }, ref) => (
  <div ref={ref}>
    <Badge
      {...props}
      variant={style === "gradient" ? "platform" : "platform-outline"}
      platform={platform}
      showPlatformName
    />
  </div>
));
PlatformBadge.displayName = "PlatformBadge";

// Utility function to get badge variant based on context
export function getContextualBadgeVariant(
  context:
    | "success"
    | "warning"
    | "error"
    | "info"
    | "gaming"
    | "status"
    | "platform"
): BadgeProps["variant"] {
  switch (context) {
    case "success":
      return "success";
    case "warning":
      return "warning";
    case "error":
      return "destructive";
    case "info":
      return "secondary";
    case "gaming":
      return "gaming";
    case "status":
      return "completed";
    case "platform":
      return "platform";
    default:
      return "default";
  }
}

export { Badge, badgeVariants };

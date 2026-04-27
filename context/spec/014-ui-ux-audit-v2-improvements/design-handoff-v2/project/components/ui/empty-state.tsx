import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { Button, type ButtonProps } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/ui/utils";

const emptyStateVariants = cva(
  "flex flex-col items-center justify-center text-center",
  {
    variants: {
      spacing: {
        compact: "gap-lg px-lg py-3xl",
        comfortable: "gap-xl px-lg py-4xl",
        spacious: "gap-2xl px-lg py-5xl",
      },
    },
    defaultVariants: {
      spacing: "spacious",
    },
  }
);

const iconVariants = cva("shrink-0", {
  variants: {
    size: {
      sm: "size-12",
      md: "size-16",
      lg: "size-20",
    },
    variant: {
      default: "text-muted-foreground",
      primary: "text-primary",
      muted: "text-muted-foreground/80",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "default",
  },
});

export interface EmptyStateProps
  extends
    Omit<ComponentPropsWithoutRef<"div">, "title">,
    VariantProps<typeof emptyStateVariants> {
  icon?: LucideIcon | ReactNode;
  iconProps?: VariantProps<typeof iconVariants>;
  title: string;
  description?: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
    variant?: ButtonProps["variant"];
    disabled?: boolean;
  };
  maxWidth?: "sm" | "md" | "lg" | "xl";
  role?: "status" | "alert";
  ariaLive?: "polite" | "assertive" | "off";
}

export function EmptyState({
  className,
  spacing,
  icon: IconOrNode,
  iconProps,
  title,
  description,
  action,
  maxWidth = "md",
  role = "status",
  ariaLive = "polite",
  ...props
}: EmptyStateProps) {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  // Check if icon is a Lucide component or raw ReactNode
  const isLucideIcon =
    IconOrNode &&
    typeof IconOrNode === "function" &&
    "displayName" in IconOrNode;
  const Icon = isLucideIcon ? (IconOrNode as LucideIcon) : null;

  return (
    <div
      className={cn(emptyStateVariants({ spacing }), className)}
      role={role}
      aria-live={ariaLive}
      {...props}
    >
      {IconOrNode && (
        <div
          className={cn(
            iconVariants({
              size: iconProps?.size,
              variant: iconProps?.variant,
            })
          )}
          aria-hidden="true"
        >
          {Icon ? <Icon className="h-full w-full" /> : null}
        </div>
      )}

      <div className={cn("gap-md flex flex-col", maxWidthClasses[maxWidth])}>
        <h2 className="heading-lg" id="empty-state-title">
          {title}
        </h2>
        {description && (
          <p
            className="body-md text-muted-foreground"
            id="empty-state-description"
          >
            {description}
          </p>
        )}
      </div>

      {action && (
        <div className="mt-md" role="group" aria-labelledby="empty-state-title">
          {action.href && !action.disabled ? (
            <Button asChild variant={action.variant}>
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ) : (
            <Button
              onClick={action.disabled ? undefined : action.onClick}
              variant={action.variant}
              disabled={action.disabled}
            >
              {action.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

EmptyState.displayName = "EmptyState";

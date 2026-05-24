import { Link } from "@tanstack/react-router";
import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";

import { Button, type ButtonProps } from "./button";

/**
 * Ported from `savepoint-app/shared/components/ui/empty-state.tsx`.
 *
 * Shape mirrors canonical (icon + title + description + optional action). The
 * only divergence is the `Link` import: canonical uses `next/link`; this
 * port uses `@tanstack/react-router`'s `Link`. `to` is the canonical `href`.
 */
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

export type EmptyStateAction = {
  label: string;
  /**
   * TanStack Router `to` path. When provided (and not disabled), the action
   * renders as a `<Link>`-backed button. Mirrors canonical's `href`.
   */
  to?: string;
  /** TanStack Router `search` params, forwarded to the `<Link>` when `to` is set. */
  search?: Record<string, unknown>;
  onClick?: () => void;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  disabled?: boolean;
};

export interface EmptyStateProps
  extends
    Omit<ComponentPropsWithoutRef<"div">, "title">,
    VariantProps<typeof emptyStateVariants> {
  icon?: LucideIcon | ReactNode;
  iconProps?: VariantProps<typeof iconVariants>;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  /**
   * Optional second CTA rendered next to `action`. Powers the "first-run"
   * template's dual call-to-action (e.g. "Add a game" + "Import Steam") while
   * keeping a single empty-state voice across the app.
   */
  secondaryAction?: EmptyStateAction;
  maxWidth?: "sm" | "md" | "lg" | "xl";
  role?: "status" | "alert";
  ariaLive?: "polite" | "assertive" | "off";
}

function ActionButton({ action }: { action: EmptyStateAction }) {
  if (action.to && !action.disabled) {
    return (
      <Button asChild variant={action.variant} size={action.size}>
        <Link to={action.to} search={action.search as never}>
          {action.label}
        </Link>
      </Button>
    );
  }
  return (
    <Button
      onClick={action.disabled ? undefined : action.onClick}
      variant={action.variant}
      size={action.size}
      disabled={action.disabled}
    >
      {action.label}
    </Button>
  );
}

export function EmptyState({
  className,
  spacing,
  icon: IconOrNode,
  iconProps,
  title,
  description,
  action,
  secondaryAction,
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
        <div
          className="gap-sm mt-md flex flex-wrap items-center justify-center"
          role="group"
          aria-labelledby="empty-state-title"
        >
          <ActionButton action={action} />
          {secondaryAction && <ActionButton action={secondaryAction} />}
        </div>
      )}
    </div>
  );
}

EmptyState.displayName = "EmptyState";

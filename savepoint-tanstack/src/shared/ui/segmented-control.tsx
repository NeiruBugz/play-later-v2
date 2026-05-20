/**
 * SegmentedControl — pill-row primitive for mutually-exclusive choices.
 *
 * Built on `@radix-ui/react-tabs` so we get arrow-key navigation, focus
 * management, and active-state semantics for free. Exposes a flat
 * `<SegmentedControl value onValueChange options={[...]} />` surface so
 * call sites don't have to wire children manually.
 *
 * Ported from `savepoint-app/shared/components/ui/segmented-control.tsx`
 * for spec 021 Slice 22. Two-tone active palette (bg-background on a
 * bg-muted track) matches canonical; do not switch to the over-saturated
 * primary-on-primary variant.
 */
import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as React from "react";

import { cn } from "@/shared/lib/utils";

export type SegmentedControlSize = "sm" | "md";

export interface SegmentedControlOption<TValue extends string = string> {
  value: TValue;
  label: React.ReactNode;
  icon?: React.ReactNode;
  ariaLabel?: string;
  disabled?: boolean;
}

export interface SegmentedControlProps<
  TValue extends string = string,
> extends Omit<
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>,
  "value" | "defaultValue" | "onValueChange" | "children"
> {
  value: TValue | "";
  onValueChange: (value: TValue) => void;
  options: ReadonlyArray<SegmentedControlOption<TValue>>;
  size?: SegmentedControlSize;
  scrollable?: boolean;
  /** Forwarded to the underlying Radix `<TabsList>` for screen readers. */
  ariaLabel?: string;
}

const sizeStyles: Record<
  SegmentedControlSize,
  { list: string; trigger: string }
> = {
  sm: {
    list: "h-8 gap-0.5 p-0.5",
    trigger: "px-2.5 py-0.5 text-xs",
  },
  md: {
    list: "h-9 gap-1 p-1",
    trigger: "px-3 py-1 text-sm",
  },
};

function SegmentedControlImpl<TValue extends string = string>(
  {
    className,
    value,
    onValueChange,
    options,
    size = "md",
    scrollable = false,
    ariaLabel,
    ...rootProps
  }: SegmentedControlProps<TValue>,
  ref: React.ForwardedRef<React.ElementRef<typeof TabsPrimitive.Root>>
) {
  const sizing = sizeStyles[size];

  return (
    <TabsPrimitive.Root
      ref={ref}
      // Radix requires a string value; empty string means "no active tab",
      // which lets us model the "not yet in library" state.
      value={value}
      onValueChange={(next) => onValueChange(next as TValue)}
      className={cn("w-full", className)}
      {...rootProps}
    >
      <div
        className={cn(
          "relative",
          scrollable && [
            "overflow-x-auto",
            "[scroll-snap-type:x_mandatory]",
            "[scrollbar-width:none]",
            "[&::-webkit-scrollbar]:hidden",
            "before:pointer-events-none before:absolute before:top-0 before:bottom-0 before:left-0 before:z-10 before:w-6",
            "before:from-background before:bg-gradient-to-r before:to-transparent",
            "after:pointer-events-none after:absolute after:top-0 after:right-0 after:bottom-0 after:z-10 after:w-6",
            "after:from-background after:bg-gradient-to-l after:to-transparent",
          ]
        )}
      >
        <TabsPrimitive.List
          aria-label={ariaLabel}
          className={cn(
            "bg-muted text-muted-foreground inline-flex items-center justify-start rounded-lg",
            sizing.list,
            scrollable && "flex-nowrap"
          )}
        >
          {options.map((option) => (
            <TabsPrimitive.Trigger
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              aria-label={option.ariaLabel}
              className={cn(
                "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-all",
                "[scroll-snap-align:start]",
                "text-muted-foreground",
                "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
                "hover:text-foreground/80",
                "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                "disabled:pointer-events-none disabled:opacity-50",
                sizing.trigger
              )}
            >
              {option.icon ? (
                <span aria-hidden="true" className="inline-flex shrink-0">
                  {option.icon}
                </span>
              ) : null}
              {option.label}
            </TabsPrimitive.Trigger>
          ))}
        </TabsPrimitive.List>
      </div>
    </TabsPrimitive.Root>
  );
}

// `forwardRef` erases the generic; cast back so callers retain inference.
const SegmentedControl = React.forwardRef(SegmentedControlImpl) as <
  TValue extends string = string,
>(
  props: SegmentedControlProps<TValue> & {
    ref?: React.ForwardedRef<React.ElementRef<typeof TabsPrimitive.Root>>;
  }
) => ReturnType<typeof SegmentedControlImpl>;

(SegmentedControl as { displayName?: string }).displayName = "SegmentedControl";

export { SegmentedControl };

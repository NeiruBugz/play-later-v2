/**
 * SegmentedControl — pill-row primitive for mutually-exclusive choices.
 *
 * Built on Base UI `Tabs` so we get arrow-key navigation, focus
 * management, and active-state semantics for free. Exposes a flat
 * `<SegmentedControl value onValueChange options={[...]} />` surface so
 * call sites don't have to wire children manually.
 *
 * Ported from `savepoint-app/shared/components/ui/segmented-control.tsx`
 * for spec 021 Slice 22. Two-tone active palette (bg-background on a
 * bg-muted track) matches canonical; do not switch to the over-saturated
 * primary-on-primary variant.
 */
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
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
  React.ComponentProps<typeof TabsPrimitive.Root>,
  "value" | "defaultValue" | "onValueChange" | "children"
> {
  value: TValue | "";
  onValueChange: (value: TValue) => void;
  options: ReadonlyArray<SegmentedControlOption<TValue>>;
  size?: SegmentedControlSize;
  scrollable?: boolean;
  /** Forwarded to the underlying `<Tabs.List>` for screen readers. */
  ariaLabel?: string;
}

const sizeStyles: Record<
  SegmentedControlSize,
  { list: string; trigger: string }
> = {
  sm: {
    list: "h-11 gap-0.5 p-0.5 md:h-8",
    trigger: "h-full px-3 text-xs md:px-2.5",
  },
  md: {
    list: "h-11 gap-1 p-1 md:h-9",
    trigger: "h-full px-3 text-sm",
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
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const sizing = sizeStyles[size];

  return (
    <TabsPrimitive.Root
      ref={ref}
      // Empty string means "no active tab",
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
            "before:bg-gradient-to-r before:from-background before:to-transparent",
            "after:pointer-events-none after:absolute after:top-0 after:right-0 after:bottom-0 after:z-10 after:w-6",
            "after:bg-gradient-to-l after:from-background after:to-transparent",
          ]
        )}
      >
        <TabsPrimitive.List
          activateOnFocus
          aria-label={ariaLabel}
          className={cn(
            "inline-flex items-center justify-start rounded-lg bg-muted text-muted-foreground",
            sizing.list,
            scrollable && "flex-nowrap"
          )}
        >
          {options.map((option) => (
            <TabsPrimitive.Tab
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              aria-label={option.ariaLabel}
              className={cn(
                "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md font-medium whitespace-nowrap transition-colors",
                "[scroll-snap-align:start]",
                "text-muted-foreground",
                "data-[active]:bg-background data-[active]:text-foreground data-[active]:shadow-sm",
                "hover:text-foreground/80",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
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
            </TabsPrimitive.Tab>
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
    ref?: React.ForwardedRef<HTMLDivElement>;
  }
) => ReturnType<typeof SegmentedControlImpl>;

(SegmentedControl as { displayName?: string }).displayName = "SegmentedControl";

export { SegmentedControl };

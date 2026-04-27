"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as React from "react";

import { cn } from "@/shared/lib/ui/utils";

export interface SegmentedControlProps extends React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Root
> {
  ariaLabel?: string;
  scrollable?: boolean;
}

const SegmentedControl = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  SegmentedControlProps
>(({ className, ariaLabel, scrollable = false, children, ...props }, ref) => (
  <TabsPrimitive.Root ref={ref} className={cn("w-full", className)} {...props}>
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
          "bg-muted text-muted-foreground inline-flex h-9 items-center justify-start gap-1 rounded-lg p-1",
          scrollable && "flex-nowrap"
        )}
      >
        {children}
      </TabsPrimitive.List>
    </div>
  </TabsPrimitive.Root>
));
SegmentedControl.displayName = "SegmentedControl";

export interface SegmentedControlItemProps extends React.ComponentPropsWithoutRef<
  typeof TabsPrimitive.Trigger
> {
  icon?: React.ReactNode;
}

const SegmentedControlItem = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  SegmentedControlItemProps
>(({ className, children, icon, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap transition-all",
      "[scroll-snap-align:start]",
      "text-muted-foreground",
      "data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm",
      "hover:text-foreground/80",
      "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
      "disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  >
    {icon && <span aria-hidden="true">{icon}</span>}
    {children}
  </TabsPrimitive.Trigger>
));
SegmentedControlItem.displayName = "SegmentedControlItem";

export { SegmentedControl, SegmentedControlItem };

"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as React from "react";

import { cn } from "@/shared/lib/ui/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "text-muted-foreground relative inline-flex items-center gap-xl",
      "before:absolute before:bottom-0 before:left-0 before:right-0 before:h-px before:bg-border",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "group relative cursor-pointer pb-lg text-sm font-normal whitespace-nowrap transition-colors",
      "text-muted-foreground hover:text-foreground/80",
      "data-[state=active]:font-medium data-[state=active]:text-foreground",
      "after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px]",
      "after:origin-left after:scale-x-0 after:bg-primary after:transition-transform after:duration-200 after:ease-out",
      "hover:after:scale-x-100 hover:after:bg-border",
      "data-[state=active]:after:scale-x-100 data-[state=active]:after:bg-primary",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:rounded-sm",
      "disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "ring-offset-background focus-visible:ring-ring mt-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };

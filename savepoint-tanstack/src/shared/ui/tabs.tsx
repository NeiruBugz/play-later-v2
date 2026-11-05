import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import * as React from "react";

import { cn } from "@/shared/lib/utils";

const Tabs = TabsPrimitive.Root;

function TabsList({
  className,
  activateOnFocus = true,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      activateOnFocus={activateOnFocus}
      className={cn(
        "text-muted-foreground gap-xl relative inline-flex items-center",
        "before:bg-border before:absolute before:right-0 before:bottom-0 before:left-0 before:h-px",
        className
      )}
      {...props}
    />
  );
}
TabsList.displayName = "TabsList";

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Tab>) {
  return (
    <TabsPrimitive.Tab
      className={cn(
        "group pb-lg relative cursor-pointer text-sm font-normal whitespace-nowrap transition-colors",
        "text-muted-foreground hover:text-foreground/80",
        "data-[active]:text-foreground data-[active]:font-medium",
        "after:absolute after:right-0 after:bottom-0 after:left-0 after:h-[2px]",
        "after:bg-primary after:origin-left after:scale-x-0 after:transition-transform after:duration-200 after:ease-out",
        "hover:after:bg-border hover:after:scale-x-100",
        "data-[active]:after:bg-primary data-[active]:after:scale-x-100",
        "focus-visible:ring-ring focus-visible:rounded-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}
TabsTrigger.displayName = "TabsTrigger";

function TabsContent({
  className,
  forceMount,
  keepMounted,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Panel> & {
  forceMount?: boolean;
}) {
  return (
    <TabsPrimitive.Panel
      keepMounted={keepMounted ?? forceMount}
      className={cn(
        "ring-offset-background focus-visible:ring-ring mt-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
        className
      )}
      {...props}
    />
  );
}
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };

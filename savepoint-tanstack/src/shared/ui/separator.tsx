import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import * as React from "react";

import { cn } from "@/shared/lib/utils";

type SeparatorProps = React.ComponentProps<typeof SeparatorPrimitive> & {
  decorative?: boolean;
};

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: SeparatorProps) {
  return (
    <SeparatorPrimitive
      orientation={orientation}
      className={cn(
        "bg-border shrink-0",
        orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
        className
      )}
      {...(decorative ? { role: "none" } : { "aria-orientation": orientation })}
      {...props}
    />
  );
}
Separator.displayName = "Separator";

export { Separator };

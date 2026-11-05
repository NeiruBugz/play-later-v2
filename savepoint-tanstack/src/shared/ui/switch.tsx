import { Switch as SwitchPrimitives } from "@base-ui/react/switch";
import * as React from "react";

import { cn } from "@/shared/lib/utils";

function Switch({
  className,
  onCheckedChange,
  ...props
}: Omit<
  React.ComponentProps<typeof SwitchPrimitives.Root>,
  "onCheckedChange"
> & {
  onCheckedChange?: (checked: boolean) => void;
}) {
  return (
    <SwitchPrimitives.Root
      onCheckedChange={
        onCheckedChange && ((checked) => onCheckedChange(checked))
      }
      className={cn(
        "peer focus-visible:ring-ring focus-visible:ring-offset-background data-[checked]:bg-primary data-[unchecked]:bg-input inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "bg-background pointer-events-none block h-4 w-4 rounded-full shadow-lg ring-0 transition-transform data-[checked]:translate-x-4 data-[unchecked]:translate-x-0"
        )}
      />
    </SwitchPrimitives.Root>
  );
}
Switch.displayName = "Switch";

export { Switch };

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { Check } from "lucide-react";
import * as React from "react";

import { cn } from "@/shared/lib/utils";

function Checkbox({
  className,
  onCheckedChange,
  ...props
}: Omit<
  React.ComponentProps<typeof CheckboxPrimitive.Root>,
  "onCheckedChange"
> & {
  onCheckedChange?: (checked: boolean) => void;
}) {
  return (
    <CheckboxPrimitive.Root
      onCheckedChange={
        onCheckedChange && ((checked) => onCheckedChange(checked))
      }
      className={cn(
        "border-primary ring-offset-background focus-visible:ring-ring data-[checked]:bg-primary data-[checked]:text-primary-foreground peer h-4 w-4 shrink-0 rounded-sm border focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn("flex items-center justify-center text-current")}
      >
        <Check className="h-4 w-4" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
Checkbox.displayName = "Checkbox";

export { Checkbox };

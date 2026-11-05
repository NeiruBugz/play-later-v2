import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";

import { cn } from "@/shared/lib/utils";

function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: SeparatorPrimitive.Props & { decorative?: boolean }) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "bg-border shrink-0 data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
        className
      )}
      {...(decorative ? { role: "none" } : { "aria-orientation": orientation })}
      {...props}
    />
  );
}

export { Separator };

import { Radio as RadioPrimitive } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";

import { cn } from "@/shared/lib/utils";

function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props) {
  return (
    <RadioGroupPrimitive
      data-slot="radio-group"
      className={cn("grid w-full grid-cols-3 gap-2", className)}
      {...props}
    />
  );
}

function RadioGroupItem({ className, ...props }: RadioPrimitive.Root.Props) {
  return (
    <RadioPrimitive.Root
      data-slot="radio-group-item"
      className={cn(
        "flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-input px-4 text-sm font-medium transition-shadow outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-[3px] aria-invalid:ring-destructive/20 data-checked:border-foreground data-checked:bg-foreground data-checked:text-background data-disabled:cursor-not-allowed data-disabled:opacity-50 dark:bg-input/30 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  );
}

export { RadioGroup, RadioGroupItem };

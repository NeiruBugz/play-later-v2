import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { CheckIcon, MinusIcon } from "@radix-ui/react-icons";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/shared/lib/tailwind-merge";

const checkboxVariants = cva(
  "peer shrink-0 rounded-sm border shadow transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground focus-visible:ring-ring",
        gaming:
          "border-gaming-primary data-[state=checked]:bg-gaming-primary data-[state=checked]:text-white data-[state=indeterminate]:bg-gaming-primary data-[state=indeterminate]:text-white focus-visible:ring-gaming-primary/50 shadow-gaming",
        neon: "border-gaming-primary/50 data-[state=checked]:bg-gaming-primary data-[state=checked]:text-white data-[state=checked]:shadow-neon data-[state=indeterminate]:bg-gaming-primary data-[state=indeterminate]:text-white data-[state=indeterminate]:shadow-neon focus-visible:ring-gaming-primary/50 focus-visible:shadow-neon",
        minimal:
          "border-muted-foreground/30 data-[state=checked]:bg-foreground data-[state=checked]:text-background data-[state=indeterminate]:bg-foreground data-[state=indeterminate]:text-background focus-visible:ring-muted-foreground/50",
        success:
          "border-gaming-neon-green data-[state=checked]:bg-gaming-neon-green data-[state=checked]:text-white data-[state=indeterminate]:bg-gaming-neon-green data-[state=indeterminate]:text-white focus-visible:ring-gaming-neon-green/50",
        error:
          "border-destructive data-[state=checked]:bg-destructive data-[state=checked]:text-destructive-foreground data-[state=indeterminate]:bg-destructive data-[state=indeterminate]:text-destructive-foreground focus-visible:ring-destructive/50",
      },
      size: {
        sm: "h-3 w-3",
        default: "h-4 w-4",
        lg: "h-5 w-5",
        xl: "h-6 w-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type CheckboxProps = {
  variant?: VariantProps<typeof checkboxVariants>["variant"];
  size?: VariantProps<typeof checkboxVariants>["size"];
  indeterminate?: boolean;
  error?: boolean;
  success?: boolean;
} & React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>;

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxProps
>(
  (
    { className, variant, size, indeterminate, error, success, ...props },
    ref
  ) => {
    // Determine final variant based on state props
    const finalVariant = React.useMemo(() => {
      if (error) return "error";
      if (success) return "success";
      return variant;
    }, [variant, error, success]);

    return (
      <CheckboxPrimitive.Root
        ref={ref}
        className={cn(
          checkboxVariants({ variant: finalVariant, size }),
          className
        )}
        {...props}
        checked={indeterminate ? "indeterminate" : props.checked}
      >
        <CheckboxPrimitive.Indicator
          className={cn("flex items-center justify-center text-current")}
        >
          {indeterminate ? (
            <MinusIcon
              className={cn(
                "size-full",
                size === "sm" && "size-2",
                size === "lg" && "size-4",
                size === "xl" && "size-5"
              )}
            />
          ) : (
            <CheckIcon
              className={cn(
                "size-full",
                size === "sm" && "size-2",
                size === "lg" && "size-4",
                size === "xl" && "size-5"
              )}
            />
          )}
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
    );
  }
);
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

// Gaming Checkbox Presets
export const GamingCheckbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  Omit<CheckboxProps, "variant">
>((props, ref) => <Checkbox {...props} variant="gaming" ref={ref} />);
GamingCheckbox.displayName = "GamingCheckbox";

export const NeonCheckbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  Omit<CheckboxProps, "variant">
>((props, ref) => <Checkbox {...props} variant="neon" ref={ref} />);
NeonCheckbox.displayName = "NeonCheckbox";

// Checkbox with Label Component
export type CheckboxWithLabelProps = {
  label: string;
  description?: string;
  error?: string;
} & CheckboxProps;

export const CheckboxWithLabel = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  CheckboxWithLabelProps
>(({ label, description, error, className, ...props }, ref) => {
  const id = React.useId();
  return (
    <div className="space-y-2">
      <div className="flex items-start space-x-2">
        <Checkbox
          {...props}
          id={id}
          error={!!error}
          className={className}
          ref={ref}
        />
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor={id}
            className={cn(
              "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              error && "text-destructive"
            )}
          >
            {label}
          </label>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {error && <p className="pl-6 text-sm text-destructive">{error}</p>}
    </div>
  );
});
CheckboxWithLabel.displayName = "CheckboxWithLabel";

// Checkbox Group Component
export type CheckboxGroupProps = {
  items: Array<{
    id: string;
    label: string;
    description?: string;
    checked?: boolean;
    disabled?: boolean;
  }>;
  onValueChange?: (values: string[]) => void;
  error?: string;
  variant?: CheckboxProps["variant"];
  size?: CheckboxProps["size"];
} & Omit<React.HTMLAttributes<HTMLDivElement>, "onValueChange">;

export const CheckboxGroup = React.forwardRef<
  HTMLDivElement,
  CheckboxGroupProps
>(
  (
    { items, onValueChange, error, variant, size, className, ...props },
    ref
  ) => {
    const [selectedValues, setSelectedValues] = React.useState<string[]>(
      items.filter((item) => item.checked).map((item) => item.id)
    );

    const handleCheckboxChange = React.useCallback(
      (itemId: string, checked: boolean) => {
        const newValues = checked
          ? [...selectedValues, itemId]
          : selectedValues.filter((id) => id !== itemId);

        setSelectedValues(newValues);
        onValueChange?.(newValues);
      },
      [selectedValues, onValueChange]
    );

    return (
      <div ref={ref} className={cn("space-y-3", className)} {...props}>
        {items.map((item) => (
          <CheckboxWithLabel
            key={item.id}
            label={item.label}
            description={item.description}
            checked={selectedValues.includes(item.id)}
            disabled={item.disabled}
            variant={variant}
            size={size}
            onCheckedChange={(checked) =>
              handleCheckboxChange(item.id, checked === true)
            }
          />
        ))}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }
);
CheckboxGroup.displayName = "CheckboxGroup";

export { Checkbox, checkboxVariants };

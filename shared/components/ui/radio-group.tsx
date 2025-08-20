import { DotFilledIcon } from "@radix-ui/react-icons";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/shared/lib/tailwind-merge";

const radioGroupVariants = cva("grid", {
  variants: {
    orientation: {
      vertical: "gap-2",
      horizontal: "grid-flow-col gap-4",
    },
    size: {
      sm: "gap-1.5",
      default: "gap-2",
      lg: "gap-3",
    },
  },
  defaultVariants: {
    orientation: "vertical",
    size: "default",
  },
});

export type RadioGroupProps = {
  orientation?: VariantProps<typeof radioGroupVariants>["orientation"];
  size?: VariantProps<typeof radioGroupVariants>["size"];
} & React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>;

const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupProps
>(({ className, orientation, size, ...props }, ref) => {
  return (
    <RadioGroupPrimitive.Root
      className={cn(radioGroupVariants({ orientation, size }), className)}
      {...props}
      ref={ref}
    />
  );
});
RadioGroup.displayName = RadioGroupPrimitive.Root.displayName;

const radioGroupItemVariants = cva(
  "aspect-square rounded-full border text-primary shadow transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-primary data-[state=checked]:border-primary focus-visible:ring-ring",
        gaming:
          "border-gaming-primary data-[state=checked]:border-gaming-primary data-[state=checked]:shadow-gaming focus-visible:ring-gaming-primary/50",
        neon: "border-gaming-primary/50 data-[state=checked]:border-gaming-primary data-[state=checked]:shadow-neon focus-visible:ring-gaming-primary/50 focus-visible:shadow-neon",
        minimal:
          "border-muted-foreground/30 data-[state=checked]:border-foreground focus-visible:ring-muted-foreground/50",
        success:
          "border-gaming-neon-green data-[state=checked]:border-gaming-neon-green focus-visible:ring-gaming-neon-green/50",
        error:
          "border-destructive data-[state=checked]:border-destructive focus-visible:ring-destructive/50",
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

export type RadioGroupItemProps = {
  variant?: VariantProps<typeof radioGroupItemVariants>["variant"];
  size?: VariantProps<typeof radioGroupItemVariants>["size"];
  error?: boolean;
  success?: boolean;
} & React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item>;

const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  RadioGroupItemProps
>(({ className, variant, size, error, success, ...props }, ref) => {
  // Determine final variant based on state props
  const finalVariant = React.useMemo(() => {
    if (error) return "error";
    if (success) return "success";
    return variant;
  }, [variant, error, success]);

  return (
    <RadioGroupPrimitive.Item
      ref={ref}
      className={cn(
        radioGroupItemVariants({ variant: finalVariant, size }),
        className
      )}
      {...props}
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <DotFilledIcon
          className={cn(
            "fill-current",
            size === "sm" && "size-2",
            size === "default" && "size-3.5",
            size === "lg" && "size-4",
            size === "xl" && "size-5",
            finalVariant === "gaming" && "fill-gaming-primary",
            finalVariant === "neon" && "fill-gaming-primary",
            finalVariant === "success" && "fill-gaming-neon-green",
            finalVariant === "error" && "fill-destructive"
          )}
        />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
  );
});
RadioGroupItem.displayName = RadioGroupPrimitive.Item.displayName;

// Gaming Radio Group Presets
export const GamingRadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  Omit<RadioGroupProps, "variant">
>((props, ref) => <RadioGroup {...props} ref={ref} />);
GamingRadioGroup.displayName = "GamingRadioGroup";

export const GamingRadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  Omit<RadioGroupItemProps, "variant">
>((props, ref) => <RadioGroupItem {...props} variant="gaming" ref={ref} />);
GamingRadioGroupItem.displayName = "GamingRadioGroupItem";

export const NeonRadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  Omit<RadioGroupProps, "variant">
>((props, ref) => <RadioGroup {...props} ref={ref} />);
NeonRadioGroup.displayName = "NeonRadioGroup";

export const NeonRadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  Omit<RadioGroupItemProps, "variant">
>((props, ref) => <RadioGroupItem {...props} variant="neon" ref={ref} />);
NeonRadioGroupItem.displayName = "NeonRadioGroupItem";

// Radio Group with Label Component
export type RadioGroupWithLabelProps = {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  items: Array<{
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
  }>;
  variant?: RadioGroupItemProps["variant"];
  size?: RadioGroupItemProps["size"];
  orientation?: RadioGroupProps["orientation"];
} & Omit<RadioGroupProps, "children">;

export const RadioGroupWithLabel = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  RadioGroupWithLabelProps
>(
  (
    {
      label,
      description,
      error,
      required,
      items,
      variant,
      size: itemSize,
      orientation,
      className,
      ...props
    },
    ref
  ) => {
    const id = React.useId();
    return (
      <div className="space-y-3">
        <div className="space-y-1">
          <label
            className={cn(
              "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
              error && "text-destructive"
            )}
          >
            {label}
            {required && <span className="ml-1 text-destructive">*</span>}
          </label>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <RadioGroup
          {...props}
          orientation={orientation}
          className={className}
          ref={ref}
        >
          {items.map((item) => (
            <div key={item.value} className="flex items-start space-x-2">
              <RadioGroupItem
                value={item.value}
                disabled={item.disabled}
                variant={variant}
                size={itemSize}
                error={!!error}
                id={`${id}-${item.value}`}
              />
              <div className="grid gap-1.5 leading-none">
                <label
                  htmlFor={`${id}-${item.value}`}
                  className={cn(
                    "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
                    error && "text-destructive"
                  )}
                >
                  {item.label}
                </label>
                {item.description && (
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </RadioGroup>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }
);
RadioGroupWithLabel.displayName = "RadioGroupWithLabel";

export {
  RadioGroup,
  RadioGroupItem,
  radioGroupVariants,
  radioGroupItemVariants,
};

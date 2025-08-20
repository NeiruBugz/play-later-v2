import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/shared/lib/tailwind-merge";

const labelVariants = cva(
  "leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 transition-colors duration-200",
  {
    variants: {
      variant: {
        default: "text-sm font-medium text-foreground",
        gaming: "text-sm font-semibold text-gaming-primary",
        neon: "text-sm font-bold text-gaming-primary neon-text",
        gradient:
          "text-sm font-bold bg-gaming-gradient bg-clip-text text-transparent",
        muted: "text-sm font-medium text-muted-foreground",
        error: "text-sm font-medium text-destructive",
        success: "text-sm font-medium text-gaming-neon-green",
        subtle:
          "text-xs font-medium text-muted-foreground uppercase tracking-wide",
      },
      size: {
        xs: "text-xs",
        sm: "text-sm",
        default: "text-sm",
        lg: "text-base",
        xl: "text-lg",
      },
      weight: {
        normal: "font-normal",
        medium: "font-medium",
        semibold: "font-semibold",
        bold: "font-bold",
      },
      required: {
        true: "",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      weight: "medium",
      required: false,
    },
  }
);

export type LabelProps = {
  required?: boolean;
  requiredIndicator?: React.ReactNode;
  description?: string;
  error?: string;
} & React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
  VariantProps<typeof labelVariants>;

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps
>(
  (
    {
      className,
      variant,
      size,
      weight,
      required,
      requiredIndicator,
      description,
      error,
      children,
      ...props
    },
    ref
  ) => {
    // Determine final variant based on error state
    const finalVariant = React.useMemo(() => {
      if (error) return "error";
      return variant;
    }, [variant, error]);

    return (
      <div className="space-y-1">
        <LabelPrimitive.Root
          ref={ref}
          className={cn(
            labelVariants({
              variant: finalVariant,
              size,
              weight,
              required,
            }),
            className
          )}
          {...props}
        >
          {children}
          {required && (
            <span className="ml-1 text-destructive">
              {requiredIndicator || "*"}
            </span>
          )}
        </LabelPrimitive.Root>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }
);
Label.displayName = LabelPrimitive.Root.displayName;

// Gaming Label Presets
export const GamingLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  Omit<LabelProps, "variant">
>((props, ref) => <Label {...props} variant="gaming" ref={ref} />);
GamingLabel.displayName = "GamingLabel";

export const NeonLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  Omit<LabelProps, "variant">
>((props, ref) => <Label {...props} variant="neon" ref={ref} />);
NeonLabel.displayName = "NeonLabel";

export const GradientLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  Omit<LabelProps, "variant">
>((props, ref) => <Label {...props} variant="gradient" ref={ref} />);
GradientLabel.displayName = "GradientLabel";

// Form Label Component with full integration
export type FormLabelProps = {
  label: string;
  htmlFor: string;
  required?: boolean;
  description?: string;
  error?: string;
  hint?: string;
} & Omit<LabelProps, "children">;

export const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  FormLabelProps
>(
  (
    { label, htmlFor, required, description, error, hint, className, ...props },
    ref
  ) => {
    return (
      <div className="space-y-1">
        <Label
          ref={ref}
          htmlFor={htmlFor}
          required={required}
          error={error}
          className={className}
          {...props}
        >
          {label}
        </Label>
        {description && !error && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {hint && !error && !description && (
          <p className="text-xs italic text-muted-foreground/80">{hint}</p>
        )}
        {error && (
          <p className="text-xs font-medium text-destructive">{error}</p>
        )}
      </div>
    );
  }
);
FormLabel.displayName = "FormLabel";

export { Label, labelVariants };

"use client";

import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from "@radix-ui/react-icons";
import * as SelectPrimitive from "@radix-ui/react-select";
import { cva, type VariantProps } from "class-variance-authority";
import { LoaderIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/shared/lib/tailwind-merge";

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const selectTriggerVariants = cva(
  "flex w-full items-center justify-between whitespace-nowrap rounded-md border text-sm transition-all duration-200 ease-out ring-offset-background placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
  {
    variants: {
      variant: {
        default:
          "border-input bg-background shadow-sm focus:ring-1 focus:ring-ring",
        gaming:
          "border-gaming-primary/30 bg-gaming-primary/5 shadow-gaming hover:border-gaming-primary/50 focus:ring-2 focus:ring-gaming-primary/50 focus:border-gaming-primary",
        neon: "border-gaming-primary/50 bg-transparent shadow-neon hover:shadow-neon-strong focus:ring-2 focus:ring-gaming-primary focus:shadow-neon-strong",
        ghost:
          "border-transparent bg-transparent hover:bg-accent/50 focus:bg-accent/50 focus:ring-1 focus:ring-ring",
        minimal: "border-none bg-transparent shadow-none focus:ring-0",
        error:
          "border-destructive/50 bg-destructive/5 text-destructive focus:ring-2 focus:ring-destructive/50",
        success:
          "border-gaming-neon-green/50 bg-gaming-neon-green/5 focus:ring-2 focus:ring-gaming-neon-green/50",
      },
      size: {
        sm: "h-8 px-2 py-1 text-xs",
        default: "h-9 px-3 py-2",
        lg: "h-11 px-4 py-3 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export type SelectTriggerProps = {
  variant?: VariantProps<typeof selectTriggerVariants>["variant"];
  size?: VariantProps<typeof selectTriggerVariants>["size"];
  loading?: boolean;
  error?: boolean;
  success?: boolean;
} & React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectTriggerProps
>(
  (
    { className, children, variant, size, loading, error, success, ...props },
    ref
  ) => {
    // Determine final variant based on state props
    const finalVariant = React.useMemo(() => {
      if (error) return "error";
      if (success) return "success";
      return variant;
    }, [variant, error, success]);

    return (
      <SelectPrimitive.Trigger
        ref={ref}
        className={cn(
          selectTriggerVariants({ variant: finalVariant, size }),
          loading && "pr-8",
          className
        )}
        disabled={loading || props.disabled}
        {...props}
      >
        {children}
        <SelectPrimitive.Icon asChild>
          {loading ? (
            <LoaderIcon className="size-4 animate-spin opacity-50" />
          ) : (
            <ChevronDownIcon className="size-4 opacity-50" />
          )}
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
    );
  }
);
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUpIcon className="size-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDownIcon className="size-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName;

const selectContentVariants = cva(
  "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
  {
    variants: {
      variant: {
        default: "bg-popover text-popover-foreground border-border",
        gaming:
          "bg-gaming-primary/10 backdrop-blur-sm text-foreground border-gaming-primary/30 shadow-gaming",
        neon: "bg-background/95 backdrop-blur-md text-foreground border-gaming-primary/50 shadow-neon",
        glass:
          "bg-background/80 backdrop-blur-lg text-foreground border-white/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type SelectContentProps = {
  variant?: VariantProps<typeof selectContentVariants>["variant"];
} & React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  SelectContentProps
>(({ className, children, position = "popper", variant, ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        selectContentVariants({ variant }),
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const selectItemVariants = cva(
  "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none transition-colors duration-150 data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
  {
    variants: {
      variant: {
        default: "focus:bg-accent focus:text-accent-foreground",
        gaming:
          "focus:bg-gaming-primary/20 focus:text-gaming-primary hover:bg-gaming-primary/10",
        neon: "focus:bg-gaming-primary/30 focus:text-gaming-primary focus:shadow-gaming hover:bg-gaming-primary/10",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type SelectItemProps = {
  variant?: VariantProps<typeof selectItemVariants>["variant"];
} & React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  SelectItemProps
>(({ className, children, variant, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(selectItemVariants({ variant }), className)}
    {...props}
  >
    <span className="absolute right-2 flex size-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <CheckIcon className="size-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

// Gaming Select Presets
export const GamingSelect = ({
  children,
  ...props
}: React.ComponentProps<typeof Select>) => (
  <Select {...props}>{children}</Select>
);

export type GamingSelectTriggerProps = Omit<SelectTriggerProps, "variant">;
export const GamingSelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  GamingSelectTriggerProps
>((props, ref) => <SelectTrigger {...props} variant="gaming" ref={ref} />);
GamingSelectTrigger.displayName = "GamingSelectTrigger";

export type GamingSelectContentProps = Omit<SelectContentProps, "variant">;
export const GamingSelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  GamingSelectContentProps
>((props, ref) => <SelectContent {...props} variant="gaming" ref={ref} />);
GamingSelectContent.displayName = "GamingSelectContent";

export type GamingSelectItemProps = Omit<SelectItemProps, "variant">;
export const GamingSelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  GamingSelectItemProps
>((props, ref) => <SelectItem {...props} variant="gaming" ref={ref} />);
GamingSelectItem.displayName = "GamingSelectItem";

// Neon Select Presets
export const NeonSelect = ({
  children,
  ...props
}: React.ComponentProps<typeof Select>) => (
  <Select {...props}>{children}</Select>
);

export type NeonSelectTriggerProps = Omit<SelectTriggerProps, "variant">;
export const NeonSelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  NeonSelectTriggerProps
>((props, ref) => <SelectTrigger {...props} variant="neon" ref={ref} />);
NeonSelectTrigger.displayName = "NeonSelectTrigger";

export type NeonSelectContentProps = Omit<SelectContentProps, "variant">;
export const NeonSelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  NeonSelectContentProps
>((props, ref) => <SelectContent {...props} variant="neon" ref={ref} />);
NeonSelectContent.displayName = "NeonSelectContent";

export type NeonSelectItemProps = Omit<SelectItemProps, "variant">;
export const NeonSelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  NeonSelectItemProps
>((props, ref) => <SelectItem {...props} variant="neon" ref={ref} />);
NeonSelectItem.displayName = "NeonSelectItem";

// Select with Label Component
export type SelectWithLabelProps = {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  triggerProps?: SelectTriggerProps;
  contentProps?: SelectContentProps;
  children: React.ReactNode;
} & React.ComponentProps<typeof Select>;

export const SelectWithLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectWithLabelProps
>(
  (
    {
      label,
      description,
      error,
      required,
      triggerProps,
      contentProps,
      children,
      ...props
    },
    ref
  ) => {
    const id = React.useId();
    return (
      <div className="space-y-2">
        <label
          htmlFor={id}
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
        <Select {...props}>
          <SelectTrigger {...triggerProps} id={id} error={!!error} ref={ref}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent {...contentProps}>{children}</SelectContent>
        </Select>
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    );
  }
);
SelectWithLabel.displayName = "SelectWithLabel";

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
  selectTriggerVariants,
  selectContentVariants,
  selectItemVariants,
};

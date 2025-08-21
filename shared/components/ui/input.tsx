import { cva, type VariantProps } from "class-variance-authority";
import { EyeIcon, EyeOffIcon, LoaderIcon, SearchIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/shared/lib/tailwind-merge";

const inputVariants = cva(
  "flex w-full rounded-md border bg-background text-sm transition-all duration-200 ease-out file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border-input shadow-sm focus-visible:ring-1 focus-visible:ring-ring",
        gaming:
          "border-gaming-primary/30 bg-gaming-primary/5 shadow-gaming hover:border-gaming-primary/50 focus-visible:ring-2 focus-visible:ring-gaming-primary/50 focus-visible:border-gaming-primary",
        neon: "border-gaming-primary/50 bg-transparent shadow-neon hover:shadow-neon-strong focus-visible:ring-2 focus-visible:ring-gaming-primary focus-visible:shadow-neon-strong",
        ghost:
          "border-transparent bg-transparent hover:bg-accent/50 focus-visible:bg-accent/50 focus-visible:ring-1 focus-visible:ring-ring",
        minimal: "border-none bg-transparent shadow-none focus-visible:ring-0",
        search:
          "border-input bg-muted/30 pl-10 shadow-sm hover:bg-muted/50 focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-ring",
        error:
          "border-destructive/50 bg-destructive/5 text-destructive placeholder:text-destructive/70 focus-visible:ring-2 focus-visible:ring-destructive/50",
        success:
          "border-gaming-neon-green/50 bg-gaming-neon-green/5 focus-visible:ring-2 focus-visible:ring-gaming-neon-green/50",
      },
      size: {
        sm: "h-8 px-2 py-1 text-xs",
        default: "h-9 px-3 py-2",
        lg: "h-11 px-4 py-3 text-base",
        xl: "h-14 px-6 py-4 text-lg",
      },
      state: {
        default: "",
        loading: "pr-10",
        error: "",
        success: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      state: "default",
    },
  }
);

export type InputProps = {
  variant?: VariantProps<typeof inputVariants>["variant"];
  size?: VariantProps<typeof inputVariants>["size"];
  state?: VariantProps<typeof inputVariants>["state"];
  loading?: boolean;
  error?: boolean;
  success?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
  enableSearch?: boolean;
} & Omit<React.ComponentProps<"input">, "size">;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      variant,
      size,
      state,
      type,
      loading,
      error,
      success,
      leftIcon,
      rightIcon,
      showPasswordToggle,
      enableSearch,
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const [inputType, setInputType] = React.useState(type);

    // Determine final variant based on state props
    const finalVariant = React.useMemo(() => {
      if (error) return "error";
      if (success) return "success";
      if (enableSearch) return "search";
      return variant;
    }, [variant, error, success, enableSearch]);

    // Determine final state based on props
    const finalState = React.useMemo(() => {
      if (loading) return "loading";
      if (error) return "error";
      if (success) return "success";
      return state;
    }, [state, loading, error, success]);

    // Handle password toggle
    React.useEffect(() => {
      if (showPasswordToggle && type === "password") {
        setInputType(showPassword ? "text" : "password");
      }
    }, [showPassword, showPasswordToggle, type]);

    const isPasswordField = showPasswordToggle && type === "password";
    const hasLeftIcon = leftIcon || enableSearch;
    const hasRightIcon = rightIcon || loading || isPasswordField;

    return (
      <div className="relative">
        {/* Left Icon */}
        {hasLeftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {enableSearch ? (
              <SearchIcon className="size-4" />
            ) : (
              leftIcon && (
                <span className="flex size-4 items-center justify-center">
                  {leftIcon}
                </span>
              )
            )}
          </div>
        )}

        <input
          type={inputType}
          className={cn(
            inputVariants({
              variant: finalVariant,
              size,
              state: finalState,
            }),
            {
              "pl-10": hasLeftIcon,
              "pr-10": hasRightIcon,
            },
            className
          )}
          ref={ref}
          disabled={disabled || loading}
          {...props}
        />

        {/* Right Icon/Actions */}
        {hasRightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {loading ? (
              <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
            ) : isPasswordField ? (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-foreground transition-colors hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOffIcon className="size-4" />
                ) : (
                  <EyeIcon className="size-4" />
                )}
              </button>
            ) : (
              rightIcon && (
                <span className="flex size-4 items-center justify-center text-muted-foreground">
                  {rightIcon}
                </span>
              )
            )}
          </div>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

// Gaming Input Presets
export const GamingInput = React.forwardRef<
  HTMLInputElement,
  Omit<InputProps, "variant">
>((props, ref) => <Input {...props} variant="gaming" ref={ref} />);
GamingInput.displayName = "GamingInput";

export const NeonInput = React.forwardRef<
  HTMLInputElement,
  Omit<InputProps, "variant">
>((props, ref) => <Input {...props} variant="neon" ref={ref} />);
NeonInput.displayName = "NeonInput";

export const SearchInput = React.forwardRef<
  HTMLInputElement,
  Omit<InputProps, "enableSearch">
>((props, ref) => <Input {...props} enableSearch ref={ref} />);
SearchInput.displayName = "SearchInput";

// Input with Label Component
export type InputWithLabelProps = {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
} & InputProps;

export const InputWithLabel = React.forwardRef<
  HTMLInputElement,
  InputWithLabelProps
>(({ label, description, error, required, className, ...props }, ref) => {
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
      <Input
        {...props}
        id={id}
        error={!!error}
        className={className}
        ref={ref}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
});
InputWithLabel.displayName = "InputWithLabel";

export { Input, inputVariants };

import { cva, type VariantProps } from "class-variance-authority";
import { LoaderIcon } from "lucide-react";
import * as React from "react";

import { cn } from "@/shared/lib/tailwind-merge";

const textareaVariants = cva(
  "flex w-full rounded-md border bg-background text-sm transition-all duration-200 ease-out placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 resize-vertical",
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
        error:
          "border-destructive/50 bg-destructive/5 text-destructive placeholder:text-destructive/70 focus-visible:ring-2 focus-visible:ring-destructive/50",
        success:
          "border-gaming-neon-green/50 bg-gaming-neon-green/5 focus-visible:ring-2 focus-visible:ring-gaming-neon-green/50",
      },
      size: {
        sm: "min-h-[60px] px-2 py-1.5 text-xs",
        default: "min-h-[80px] px-3 py-2",
        lg: "min-h-[120px] px-4 py-3 text-base",
        xl: "min-h-[160px] px-6 py-4 text-lg",
      },
      resize: {
        none: "resize-none",
        vertical: "resize-vertical",
        horizontal: "resize-horizontal",
        both: "resize",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      resize: "vertical",
    },
  }
);

export type TextareaProps = {
  variant?: VariantProps<typeof textareaVariants>["variant"];
  size?: VariantProps<typeof textareaVariants>["size"];
  resize?: VariantProps<typeof textareaVariants>["resize"];
  loading?: boolean;
  error?: boolean;
  success?: boolean;
  maxLength?: number;
  showCharacterCount?: boolean;
  autoGrow?: boolean;
} & React.ComponentProps<"textarea">;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      variant,
      size,
      resize,
      loading,
      error,
      success,
      maxLength,
      showCharacterCount,
      autoGrow,
      value,
      onChange,
      disabled,
      ...props
    },
    ref
  ) => {
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);
    const [characterCount, setCharacterCount] = React.useState(0);

    // Combine refs
    React.useImperativeHandle(ref, () => textareaRef.current!);

    // Determine final variant based on state props
    const finalVariant = React.useMemo(() => {
      if (error) return "error";
      if (success) return "success";
      return variant;
    }, [variant, error, success]);

    // Auto-grow functionality
    const adjustHeight = React.useCallback(() => {
      const textarea = textareaRef.current;
      if (textarea && autoGrow) {
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    }, [autoGrow]);

    // Handle input change
    const handleChange = React.useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;

        // Enforce maxLength if provided
        if (maxLength && newValue.length > maxLength) {
          return;
        }

        setCharacterCount(newValue.length);
        adjustHeight();

        if (onChange) {
          onChange(e);
        }
      },
      [onChange, maxLength, adjustHeight]
    );

    // Initialize character count and auto-grow on mount/value change
    React.useEffect(() => {
      const currentValue = value?.toString() || "";
      setCharacterCount(currentValue.length);
      adjustHeight();
    }, [value, adjustHeight]);

    const showCount = showCharacterCount || maxLength;
    const isNearLimit = maxLength && characterCount > maxLength * 0.8;
    const isAtLimit = maxLength && characterCount >= maxLength;

    return (
      <div className="relative">
        <textarea
          className={cn(
            textareaVariants({
              variant: finalVariant,
              size,
              resize: autoGrow ? "none" : resize,
            }),
            loading && "pr-10",
            className
          )}
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          maxLength={maxLength}
          disabled={disabled || loading}
          {...props}
        />

        {/* Loading Spinner */}
        {loading && (
          <div className="absolute right-3 top-3">
            <LoaderIcon className="size-4 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Character Count */}
        {showCount && (
          <div
            className={cn(
              "mt-1 text-right text-xs",
              isAtLimit
                ? "text-destructive"
                : isNearLimit
                  ? "text-yellow-600"
                  : "text-muted-foreground"
            )}
          >
            {maxLength ? `${characterCount}/${maxLength}` : characterCount}
          </div>
        )}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

// Gaming Textarea Presets
export const GamingTextarea = React.forwardRef<
  HTMLTextAreaElement,
  Omit<TextareaProps, "variant">
>((props, ref) => <Textarea {...props} variant="gaming" ref={ref} />);
GamingTextarea.displayName = "GamingTextarea";

export const NeonTextarea = React.forwardRef<
  HTMLTextAreaElement,
  Omit<TextareaProps, "variant">
>((props, ref) => <Textarea {...props} variant="neon" ref={ref} />);
NeonTextarea.displayName = "NeonTextarea";

export const AutoGrowTextarea = React.forwardRef<
  HTMLTextAreaElement,
  Omit<TextareaProps, "autoGrow">
>((props, ref) => <Textarea {...props} autoGrow ref={ref} />);
AutoGrowTextarea.displayName = "AutoGrowTextarea";

// Textarea with Label Component
export type TextareaWithLabelProps = {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
} & TextareaProps;

export const TextareaWithLabel = React.forwardRef<
  HTMLTextAreaElement,
  TextareaWithLabelProps
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
      <Textarea
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
TextareaWithLabel.displayName = "TextareaWithLabel";

export { Textarea, textareaVariants };

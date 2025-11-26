import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import * as React from "react";

import { cn } from "@/shared/lib/ui/utils";

const alertVariants = cva(
  "relative w-full rounded-lg border px-xl py-lg text-sm transition-all duration-normal",
  {
    variants: {
      variant: {
        default: "bg-card border-border text-foreground",
        destructive:
          "bg-destructive/10 border-destructive/30 text-destructive [&>svg]:text-destructive",
        success:
          "bg-success/10 border-success/30 text-success [&>svg]:text-success",
        warning:
          "bg-warning/10 border-warning/30 text-warning [&>svg]:text-warning",
        info: "bg-info/10 border-info/30 text-info [&>svg]:text-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  dismissible?: boolean;
  onDismiss?: () => void;
}

const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  (
    { className, variant, dismissible = false, onDismiss, children, ...props },
    ref
  ) => {
    const [isDismissed, setIsDismissed] = React.useState(false);

    const handleDismiss = () => {
      setIsDismissed(true);
      onDismiss?.();
    };

    if (isDismissed) {
      return null;
    }

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        <div className="gap-lg flex items-start">
          {children}
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="ml-auto shrink-0 opacity-70 transition-opacity hover:opacity-100"
              aria-label="Dismiss alert"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }
);
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-xs leading-none font-medium tracking-tight", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertDescription, AlertTitle };

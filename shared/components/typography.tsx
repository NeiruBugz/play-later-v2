import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/shared/lib/tailwind-merge";

// --- HEADING --- //
const headingVariants = cva("font-bold tracking-tight text-foreground", {
  variants: {
    size: {
      "4xl": "text-4xl lg:text-5xl",
      "3xl": "text-3xl lg:text-4xl",
      "2xl": "text-2xl lg:text-3xl",
      xl: "text-xl lg:text-2xl",
      lg: "text-lg lg:text-xl",
      md: "text-base lg:text-lg",
    },
  },
  defaultVariants: {
    size: "2xl",
  },
});

export type HeadingProps = {
  asChild?: boolean;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
} & React.HTMLAttributes<HTMLHeadingElement> &
  VariantProps<typeof headingVariants>;

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, size, level = 1, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : (`h${level}` as React.ElementType);
    return (
      <Comp
        className={cn(headingVariants({ size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Heading.displayName = "Heading";

// --- BODY --- //
const bodyVariants = cva("text-base", {
  variants: {
    variant: {
      default: "text-foreground",
      muted: "text-muted-foreground",
    },
    size: {
      lg: "text-lg",
      md: "text-base",
      sm: "text-sm",
      xs: "text-xs",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

export type BodyProps = {
  asChild?: boolean;
} & React.HTMLAttributes<HTMLParagraphElement> &
  VariantProps<typeof bodyVariants>;

const Body = React.forwardRef<HTMLParagraphElement, BodyProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "p";
    return (
      <Comp
        className={cn(bodyVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Body.displayName = "Body";

// --- CAPTION --- //
const captionVariants = cva("text-muted-foreground", {
  variants: {
    size: {
      md: "text-sm",
      sm: "text-xs",
      xs: "text-[11px]",
    },
  },
  defaultVariants: {
    size: "sm",
  },
});

export type CaptionProps = {
  asChild?: boolean;
} & React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof captionVariants>;

const Caption = React.forwardRef<HTMLSpanElement, CaptionProps>(
  ({ className, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "span";
    return (
      <Comp
        className={cn(captionVariants({ size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Caption.displayName = "Caption";

export { Heading, Body, Caption };

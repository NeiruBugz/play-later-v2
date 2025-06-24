import { cn } from "@/shared/lib/tailwind-merge";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

// Display Text Variants (for hero sections)
const displayVariants = cva("font-display text-foreground", {
  variants: {
    size: {
      "2xl": "text-display-2xl",
      xl: "text-display-xl",
      lg: "text-display-lg",
    },
  },
  defaultVariants: {
    size: "xl",
  },
});

export interface DisplayProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof displayVariants> {
  asChild?: boolean;
}

const Display = React.forwardRef<HTMLHeadingElement, DisplayProps>(
  ({ className, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "h1";
    return (
      <Comp
        className={cn(displayVariants({ size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Display.displayName = "Display";

// Heading Variants
const headingVariants = cva("font-heading text-foreground", {
  variants: {
    size: {
      xl: "text-heading-xl",
      lg: "text-heading-lg",
      md: "text-heading-md",
      sm: "text-heading-sm",
      xs: "text-heading-xs",
    },
    level: {
      1: "",
      2: "",
      3: "",
      4: "",
      5: "",
      6: "",
    },
  },
  defaultVariants: {
    size: "lg",
    level: 1,
  },
});

export interface HeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof headingVariants> {
  asChild?: boolean;
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, size, level = 1, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : (`h${level}` as any);
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

// Subheading Variants
const subheadingVariants = cva("font-subheading text-muted-foreground", {
  variants: {
    size: {
      xl: "text-heading-xl",
      lg: "text-heading-lg",
      md: "text-heading-md",
      sm: "text-heading-sm",
      xs: "text-heading-xs",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export interface SubheadingProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof subheadingVariants> {
  asChild?: boolean;
}

const Subheading = React.forwardRef<HTMLParagraphElement, SubheadingProps>(
  ({ className, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "p";
    return (
      <Comp
        className={cn(subheadingVariants({ size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Subheading.displayName = "Subheading";

// Body Text Variants
const bodyVariants = cva("font-body text-foreground", {
  variants: {
    size: {
      lg: "text-body-lg",
      md: "text-body-md",
      sm: "text-body-sm",
      xs: "text-body-xs",
    },
    variant: {
      default: "text-foreground",
      muted: "text-muted-foreground",
      accent: "text-accent-foreground",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "default",
  },
});

export interface BodyProps
  extends React.HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof bodyVariants> {
  asChild?: boolean;
}

const Body = React.forwardRef<HTMLParagraphElement, BodyProps>(
  ({ className, size, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "p";
    return (
      <Comp
        className={cn(bodyVariants({ size, variant, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Body.displayName = "Body";

// Caption Variants
const captionVariants = cva("font-caption", {
  variants: {
    variant: {
      default: "text-caption text-muted-foreground",
      overline: "text-overline text-muted-foreground uppercase",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export interface CaptionProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof captionVariants> {
  asChild?: boolean;
}

const Caption = React.forwardRef<HTMLSpanElement, CaptionProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "span";
    return (
      <Comp
        className={cn(captionVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Caption.displayName = "Caption";

// Responsive Heading Component (automatically adjusts size based on screen)
const responsiveHeadingVariants = cva("font-heading text-foreground", {
  variants: {
    level: {
      1: "text-heading-lg md:text-heading-xl",
      2: "text-heading-md md:text-heading-lg",
      3: "text-heading-sm md:text-heading-md",
      4: "text-heading-xs md:text-heading-sm",
      5: "text-body-lg md:text-heading-xs",
      6: "text-body-md md:text-body-lg font-subheading",
    },
  },
  defaultVariants: {
    level: 1,
  },
});

export interface ResponsiveHeadingProps
  extends React.HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof responsiveHeadingVariants> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  asChild?: boolean;
}

const ResponsiveHeading = React.forwardRef<
  HTMLHeadingElement,
  ResponsiveHeadingProps
>(({ className, level = 1, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : (`h${level}` as any);
  return (
    <Comp
      className={cn(responsiveHeadingVariants({ level, className }))}
      ref={ref}
      {...props}
    />
  );
});
ResponsiveHeading.displayName = "ResponsiveHeading";

export {
  Display,
  Heading,
  Subheading,
  Body,
  Caption,
  ResponsiveHeading,
  displayVariants,
  headingVariants,
  subheadingVariants,
  bodyVariants,
  captionVariants,
  responsiveHeadingVariants,
};

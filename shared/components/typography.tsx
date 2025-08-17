import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/shared/lib/tailwind-merge";

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

export type DisplayProps = {
  asChild?: boolean;
} & React.HTMLAttributes<HTMLHeadingElement> &
  VariantProps<typeof displayVariants>;

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

export type HeadingProps = {
  asChild?: boolean;
} & React.HTMLAttributes<HTMLHeadingElement> &
  VariantProps<typeof headingVariants>;

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

export type SubheadingProps = {
  asChild?: boolean;
} & React.HTMLAttributes<HTMLParagraphElement> &
  VariantProps<typeof subheadingVariants>;

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

export type BodyProps = {
  asChild?: boolean;
} & React.HTMLAttributes<HTMLParagraphElement> &
  VariantProps<typeof bodyVariants>;

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
      overline: "text-overline uppercase text-muted-foreground",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export type CaptionProps = {
  asChild?: boolean;
} & React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof captionVariants>;

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
      1: "lg:text-display-sm text-heading-md sm:text-heading-lg md:text-heading-xl",
      2: "text-heading-sm sm:text-heading-md md:text-heading-lg lg:text-heading-xl",
      3: "text-heading-xs sm:text-heading-sm md:text-heading-md lg:text-heading-lg",
      4: "text-body-lg sm:text-heading-xs md:text-heading-sm lg:text-heading-md",
      5: "text-body-md sm:text-body-lg md:text-heading-xs lg:text-heading-sm",
      6: "text-body-sm font-subheading sm:text-body-md md:text-body-lg lg:text-heading-xs",
    },
  },
  defaultVariants: {
    level: 1,
  },
});

export type ResponsiveHeadingProps = {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  asChild?: boolean;
} & React.HTMLAttributes<HTMLHeadingElement> &
  VariantProps<typeof responsiveHeadingVariants>;

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

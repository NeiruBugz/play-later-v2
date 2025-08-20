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
    const Comp = asChild ? Slot : (`h${level}` as string);
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

// Gaming Typography Variants
const gamingHeadingVariants = cva("font-heading text-foreground", {
  variants: {
    size: {
      xl: "text-heading-xl",
      lg: "text-heading-lg",
      md: "text-heading-md",
      sm: "text-heading-sm",
      xs: "text-heading-xs",
    },
    variant: {
      default: "text-foreground",
      neon: "neon-text text-gaming-primary",
      gradient: "bg-gaming-gradient bg-clip-text text-transparent",
      glitch: "text-gaming-accent animate-neon-flicker",
    },
    weight: {
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
      extrabold: "font-extrabold",
    },
  },
  defaultVariants: {
    size: "lg",
    variant: "default",
    weight: "semibold",
  },
});

export type GamingHeadingProps = {
  asChild?: boolean;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
} & React.HTMLAttributes<HTMLHeadingElement> &
  VariantProps<typeof gamingHeadingVariants>;

const GamingHeading = React.forwardRef<HTMLHeadingElement, GamingHeadingProps>(
  (
    { className, size, variant, weight, level = 1, asChild = false, ...props },
    ref
  ) => {
    const Comp = asChild ? Slot : (`h${level}` as string);
    return (
      <Comp
        className={cn(
          gamingHeadingVariants({ size, variant, weight, className })
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
GamingHeading.displayName = "GamingHeading";

// Gaming Body Text Variants
const gamingBodyVariants = cva("font-body", {
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
      accent: "text-gaming-accent",
      success: "text-gaming-neon-green",
      warning: "text-yellow-500",
      error: "text-destructive",
    },
    emphasis: {
      none: "",
      subtle: "font-medium",
      strong: "font-semibold text-gaming-primary",
      neon: "font-bold text-gaming-primary animate-gaming-pulse",
    },
  },
  defaultVariants: {
    size: "md",
    variant: "default",
    emphasis: "none",
  },
});

export type GamingBodyProps = {
  asChild?: boolean;
} & React.HTMLAttributes<HTMLParagraphElement> &
  VariantProps<typeof gamingBodyVariants>;

const GamingBody = React.forwardRef<HTMLParagraphElement, GamingBodyProps>(
  ({ className, size, variant, emphasis, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "p";
    return (
      <Comp
        className={cn(
          gamingBodyVariants({ size, variant, emphasis, className })
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
GamingBody.displayName = "GamingBody";

// Gaming Badge Text
const gamingBadgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/10 text-primary",
        secondary: "bg-secondary text-secondary-foreground",
        accent:
          "bg-gaming-primary/20 text-gaming-primary border border-gaming-primary/30",
        neon: "bg-gaming-primary/10 text-gaming-primary border border-gaming-primary/50 shadow-gaming-hover animate-gaming-pulse",
        platform: "bg-gradient-to-r text-white font-semibold shadow-sm",
        status: "font-medium",
      },
      size: {
        sm: "px-2 py-1 text-xs",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export type GamingBadgeProps = {
  asChild?: boolean;
} & React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof gamingBadgeVariants>;

const GamingBadge = React.forwardRef<HTMLSpanElement, GamingBadgeProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "span";
    return (
      <Comp
        className={cn(gamingBadgeVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
GamingBadge.displayName = "GamingBadge";

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
  const Comp = asChild ? Slot : (`h${level}` as string);
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
  GamingHeading,
  GamingBody,
  GamingBadge,
  displayVariants,
  headingVariants,
  subheadingVariants,
  bodyVariants,
  captionVariants,
  responsiveHeadingVariants,
  gamingHeadingVariants,
  gamingBodyVariants,
  gamingBadgeVariants,
};

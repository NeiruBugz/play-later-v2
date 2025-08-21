import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/shared/lib/tailwind-merge";

const cardVariants = cva(
  "rounded-xl border bg-card text-card-foreground transition-all duration-200 ease-out",
  {
    variants: {
      variant: {
        default: "shadow",
        elevated: "shadow-lg hover:shadow-xl",
        gaming:
          "bg-gaming-gradient border-gaming-primary/20 shadow-gaming text-white hover:shadow-gaming-hover hover:scale-[1.02]",
        "gaming-outline":
          "border-gaming-primary/50 bg-transparent backdrop-blur-sm hover:bg-gaming-primary/10 hover:border-gaming-primary",
        neon: "border-gaming-primary/50 shadow-neon hover:shadow-neon-strong hover:border-gaming-primary",
        glass: "backdrop-blur-md bg-background/70 border-white/10 shadow-lg",
        floating:
          "shadow-gaming-hover animate-float hover:animate-none hover:shadow-neon-strong",
        interactive:
          "cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
        featured:
          "border-gaming-primary shadow-gaming bg-gaming-gradient text-white",
        minimal: "border-none shadow-none",
      },
      size: {
        sm: "p-3",
        default: "",
        lg: "p-8",
        xl: "p-10",
      },
      spacing: {
        compact: "[&>*]:space-y-2",
        default: "",
        relaxed: "[&>*]:space-y-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      spacing: "default",
    },
  }
);

export type CardProps = {
  asChild?: boolean;
} & React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof cardVariants>;

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, spacing, asChild = false, ...props }, ref) => {
    const Comp = asChild ? "div" : "div"; // Could use Slot here if needed
    return (
      <Comp
        ref={ref}
        className={cn(cardVariants({ variant, size, spacing }), className)}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

const cardHeaderVariants = cva("flex flex-col space-y-1.5 p-6", {
  variants: {
    variant: {
      default: "",
      centered: "text-center items-center",
      gaming: "bg-gaming-primary/10 border-b border-gaming-primary/20",
      minimal: "p-4 space-y-1",
      compact: "p-3 space-y-1",
    },
    spacing: {
      none: "p-0 space-y-0",
      sm: "p-3 space-y-1",
      default: "p-6 space-y-1.5",
      lg: "p-8 space-y-2",
    },
  },
  defaultVariants: {
    variant: "default",
    spacing: "default",
  },
});

export type CardHeaderProps = {} & React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof cardHeaderVariants>;

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, variant, spacing, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardHeaderVariants({ variant, spacing }), className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

const cardTitleVariants = cva("font-semibold leading-none tracking-tight", {
  variants: {
    variant: {
      default: "",
      gaming: "text-gaming-primary font-bold",
      neon: "text-gaming-primary neon-text",
      gradient: "bg-gaming-gradient bg-clip-text text-transparent font-bold",
      muted: "text-muted-foreground",
      featured: "text-xl font-bold",
    },
    size: {
      sm: "text-sm",
      default: "text-base",
      lg: "text-lg",
      xl: "text-xl font-bold",
      "2xl": "text-2xl font-bold",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export type CardTitleProps = {} & React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof cardTitleVariants>;

const CardTitle = React.forwardRef<HTMLDivElement, CardTitleProps>(
  ({ className, variant, size, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardTitleVariants({ variant, size }), className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

const cardDescriptionVariants = cva("text-sm text-muted-foreground", {
  variants: {
    variant: {
      default: "",
      gaming: "text-gaming-secondary",
      muted: "text-muted-foreground/70",
      prominent: "text-foreground font-medium",
    },
    size: {
      xs: "text-xs",
      sm: "text-sm",
      default: "text-sm",
      md: "text-base",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export type CardDescriptionProps = {} & React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof cardDescriptionVariants>;

const CardDescription = React.forwardRef<HTMLDivElement, CardDescriptionProps>(
  ({ className, variant, size, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardDescriptionVariants({ variant, size }), className)}
      {...props}
    />
  )
);
CardDescription.displayName = "CardDescription";

const cardContentVariants = cva("p-6 pt-0", {
  variants: {
    spacing: {
      none: "p-0",
      sm: "p-3 pt-0",
      default: "p-6 pt-0",
      lg: "p-8 pt-0",
      xl: "p-10 pt-0",
    },
  },
  defaultVariants: {
    spacing: "default",
  },
});

export type CardContentProps = {} & React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof cardContentVariants>;

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, spacing, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardContentVariants({ spacing }), className)}
      {...props}
    />
  )
);
CardContent.displayName = "CardContent";

const cardFooterVariants = cva("flex items-center p-6 pt-0", {
  variants: {
    variant: {
      default: "",
      centered: "justify-center",
      between: "justify-between",
      end: "justify-end",
      gaming: "bg-gaming-primary/5 border-t border-gaming-primary/10 mt-2",
    },
    spacing: {
      none: "p-0",
      sm: "p-3 pt-0",
      default: "p-6 pt-0",
      lg: "p-8 pt-0",
    },
  },
  defaultVariants: {
    variant: "default",
    spacing: "default",
  },
});

export type CardFooterProps = {} & React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof cardFooterVariants>;

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, variant, spacing, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardFooterVariants({ variant, spacing }), className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

// Gaming-themed card presets
export const GamingCard = React.forwardRef<
  HTMLDivElement,
  Omit<CardProps, "variant">
>((props, ref) => <Card {...props} variant="gaming" ref={ref} />);
GamingCard.displayName = "GamingCard";

export const NeonCard = React.forwardRef<
  HTMLDivElement,
  Omit<CardProps, "variant">
>((props, ref) => <Card {...props} variant="neon" ref={ref} />);
NeonCard.displayName = "NeonCard";

export const InteractiveCard = React.forwardRef<
  HTMLDivElement,
  Omit<CardProps, "variant">
>((props, ref) => <Card {...props} variant="interactive" ref={ref} />);
InteractiveCard.displayName = "InteractiveCard";

export const FeaturedCard = React.forwardRef<
  HTMLDivElement,
  Omit<CardProps, "variant">
>((props, ref) => <Card {...props} variant="featured" ref={ref} />);
FeaturedCard.displayName = "FeaturedCard";

export const GlassCard = React.forwardRef<
  HTMLDivElement,
  Omit<CardProps, "variant">
>((props, ref) => <Card {...props} variant="glass" ref={ref} />);
GlassCard.displayName = "GlassCard";

// Gaming card with all gaming-themed subcomponents
export const FullGamingCard = React.forwardRef<
  HTMLDivElement,
  {
    title?: React.ReactNode;
    description?: React.ReactNode;
    footer?: React.ReactNode;
    children?: React.ReactNode;
  } & Omit<CardProps, "children">
>(({ title, description, footer, children, ...props }, ref) => (
  <Card {...props} variant="gaming" ref={ref}>
    {(title || description) && (
      <CardHeader variant="gaming">
        {title && <CardTitle variant="gaming">{title}</CardTitle>}
        {description && (
          <CardDescription variant="gaming">{description}</CardDescription>
        )}
      </CardHeader>
    )}
    {children && <CardContent>{children}</CardContent>}
    {footer && <CardFooter variant="gaming">{footer}</CardFooter>}
  </Card>
));
FullGamingCard.displayName = "FullGamingCard";

// Utility function to get card variant based on context
export function getContextualCardVariant(
  context:
    | "default"
    | "gaming"
    | "featured"
    | "interactive"
    | "minimal"
    | "glass"
): CardProps["variant"] {
  switch (context) {
    case "gaming":
      return "gaming";
    case "featured":
      return "featured";
    case "interactive":
      return "interactive";
    case "minimal":
      return "minimal";
    case "glass":
      return "glass";
    default:
      return "default";
  }
}

// Card composition helpers
export const CardWithActions = React.forwardRef<
  HTMLDivElement,
  {
    title: React.ReactNode;
    description?: React.ReactNode;
    actions: React.ReactNode;
    children?: React.ReactNode;
  } & CardProps
>(({ title, description, actions, children, ...props }, ref) => (
  <Card {...props} ref={ref}>
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      {description && <CardDescription>{description}</CardDescription>}
    </CardHeader>
    {children && <CardContent>{children}</CardContent>}
    <CardFooter variant="between">{actions}</CardFooter>
  </Card>
));
CardWithActions.displayName = "CardWithActions";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  cardVariants,
  cardHeaderVariants,
  cardTitleVariants,
  cardDescriptionVariants,
  cardContentVariants,
  cardFooterVariants,
};

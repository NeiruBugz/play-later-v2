import { cva } from "class-variance-authority";

/**
 * Main GameCard variants using CVA
 */
export const gameCardVariants = cva(
  "group relative transition-all duration-normal",
  {
    variants: {
      /**
       * Layout orientation
       */
      layout: {
        horizontal: "flex gap-xl",
        vertical: "flex flex-col",
        "vertical-compact": "flex flex-col",
      },

      /**
       * Information density
       */
      density: {
        minimal: "",
        standard: "",
        detailed: "",
      },

      /**
       * Size variants
       */
      size: {
        sm: "",
        md: "",
        lg: "",
      },

      /**
       * Interactive states
       */
      interactive: {
        true: "cursor-pointer",
        false: "",
      },
    },
    compoundVariants: [
      // Horizontal layout sizes
      {
        layout: "horizontal",
        size: "sm",
        className: "p-md",
      },
      {
        layout: "horizontal",
        size: "md",
        className: "p-lg",
      },
      {
        layout: "horizontal",
        size: "lg",
        className: "p-xl",
      },
      // Vertical layout spacing
      {
        layout: ["vertical", "vertical-compact"],
        density: "minimal",
        className: "gap-md",
      },
      {
        layout: ["vertical", "vertical-compact"],
        density: ["standard", "detailed"],
        className: "gap-lg",
      },
    ],
    defaultVariants: {
      layout: "vertical",
      density: "standard",
      size: "md",
      interactive: true,
    },
  }
);

/**
 * GameCardCover variants
 */
export const gameCardCoverVariants = cva(
  "relative overflow-hidden bg-muted rounded-md",
  {
    variants: {
      aspectRatio: {
        square: "aspect-square",
        portrait: "aspect-[3/4]",
        landscape: "aspect-video",
      },
      size: {
        sm: "",
        md: "",
        lg: "",
      },
    },
    compoundVariants: [
      // Horizontal layout cover sizes
      {
        aspectRatio: "portrait",
        size: "sm",
        className: "h-24 w-18 flex-shrink-0",
      },
      {
        aspectRatio: "portrait",
        size: "md",
        className: "h-32 w-24 flex-shrink-0",
      },
      {
        aspectRatio: "portrait",
        size: "lg",
        className: "h-40 w-30 flex-shrink-0",
      },
    ],
    defaultVariants: {
      aspectRatio: "portrait",
      size: "md",
    },
  }
);

/**
 * GameCardContent variants
 */
export const gameCardContentVariants = cva("flex flex-col", {
  variants: {
    layout: {
      horizontal: "flex-1 min-w-0 py-xs",
      vertical: "w-full",
      "vertical-compact": "w-full",
    },
    density: {
      minimal: "gap-xs",
      standard: "gap-md",
      detailed: "gap-lg",
    },
  },
  defaultVariants: {
    layout: "vertical",
    density: "standard",
  },
});

/**
 * GameCardHeader variants
 */
export const gameCardHeaderVariants = cva("flex items-start gap-md", {
  variants: {
    layout: {
      horizontal: "justify-between",
      vertical: "",
      "vertical-compact": "",
    },
  },
  defaultVariants: {
    layout: "vertical",
  },
});

/**
 * GameCardTitle variants
 */
export const gameCardTitleVariants = cva("font-semibold leading-tight", {
  variants: {
    size: {
      sm: "body-sm",
      md: "body-md",
      lg: "heading-sm",
    },
    clamp: {
      true: "line-clamp-2",
      false: "",
    },
  },
  defaultVariants: {
    size: "md",
    clamp: true,
  },
});

/**
 * GameCardOverlay variants for hover effects
 */
export const gameCardOverlayVariants = cva(
  "absolute inset-0 transition-opacity duration-normal",
  {
    variants: {
      variant: {
        dark: "bg-black/60 opacity-0 group-hover:opacity-100",
        gradient:
          "bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100",
        none: "opacity-0",
      },
    },
    defaultVariants: {
      variant: "dark",
    },
  }
);

import { cva } from "class-variance-authority";

export const gameCardVariants = cva(
  "group relative transition-all duration-normal",
  {
    variants: {
      layout: {
        horizontal: "flex gap-xl",
        vertical: "flex flex-col",
        "vertical-compact": "flex flex-col",
      },
      density: {
        minimal: "",
        standard: "",
        detailed: "",
      },
      size: {
        sm: "",
        md: "",
        lg: "",
      },
      interactive: {
        true: "cursor-pointer",
        false: "",
      },
    },
    compoundVariants: [
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

export const gameCardCoverVariants = cva(
  "relative overflow-hidden bg-muted rounded-md",
  {
    variants: {
      aspectRatio: {
        square: "aspect-square",
        portrait: "aspect-[3/4]",
        landscape: "aspect-video",
      },
    },
    defaultVariants: {
      aspectRatio: "portrait",
    },
  }
);

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

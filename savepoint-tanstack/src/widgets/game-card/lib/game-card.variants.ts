import { cva } from "class-variance-authority";

export const gameCardVariants = cva(
  "group relative transition-all duration-200",
  {
    variants: {
      layout: {
        horizontal: "flex gap-4",
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
        className: "gap-2",
      },
      {
        layout: ["vertical", "vertical-compact"],
        density: ["standard", "detailed"],
        className: "gap-3",
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

export const gameCardTitleVariants = cva("font-semibold leading-tight", {
  variants: {
    size: {
      sm: "text-sm",
      md: "text-base",
      lg: "text-xl font-semibold tracking-tight",
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

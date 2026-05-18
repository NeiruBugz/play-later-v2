import type { VariantProps } from "class-variance-authority";

import type { gameCardVariants } from "../../lib/game-card.variants";

export type GameCardSkeletonProps = Pick<
  VariantProps<typeof gameCardVariants>,
  "layout" | "density" | "size"
> & {
  className?: string;
};

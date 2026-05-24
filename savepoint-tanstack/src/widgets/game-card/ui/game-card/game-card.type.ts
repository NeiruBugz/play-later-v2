import type { VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import type { gameCardVariants } from "../../lib/game-card.variants";

export interface GameCardData {
  slug: string;
  title: string;
  coverImageId?: string | null;
  releaseYear?: number | null;
  platforms?: string[];
}

export interface GameCardProps
  extends
    Omit<ComponentPropsWithoutRef<"div">, "children" | "onClick">,
    VariantProps<typeof gameCardVariants> {
  game: GameCardData;
  asLink?: boolean;
  onClick?: () => void;
  children?: ReactNode;
  badges?: ReactNode;
  overlay?: ReactNode;
  coverAccentClassName?: string;
  titleClassName?: string;
}

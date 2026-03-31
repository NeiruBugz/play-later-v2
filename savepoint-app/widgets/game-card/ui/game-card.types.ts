import type { VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import type { gameCardVariants } from "../lib/game-card.variants";

export interface BaseGameData {
  id: number | string;
  name: string;
  slug: string;
  coverImageId?: string | null;
}

export interface SearchGameData extends BaseGameData {
  releaseYear?: number | null;
  releaseDate?: number | null;
  platforms?: string[] | Array<{ name: string }>;
  gameType?: number;
}

export interface LibraryGameData extends BaseGameData {
  status?: string;
  platform?: string | null;
  entryCount?: number;
  libraryItemId?: number;
  hasMultipleEntries?: boolean;
}

export type GameData = BaseGameData | SearchGameData | LibraryGameData;

export interface GameCardProps
  extends
    Omit<ComponentPropsWithoutRef<"div">, "children">,
    VariantProps<typeof gameCardVariants> {
  game: GameData;
  asLink?: boolean;
  onClick?: () => void;
  children?: ReactNode;
  enableHoverEffects?: boolean;
  priority?: boolean;
  sizes?: string;
  badges?: ReactNode;
  overlay?: ReactNode;
}

export interface GameCardCoverProps extends ComponentPropsWithoutRef<"div"> {
  imageId?: string | null;
  gameTitle: string;
  size?: "thumbnail" | "cover_small" | "cover_big" | "hd";
  aspectRatio?: "square" | "portrait" | "landscape";
  priority?: boolean;
  sizes?: string;
  enableHoverEffect?: boolean;
  overlay?: ReactNode;
  badges?: ReactNode;
}

export interface GameCardContentProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
}

export interface GameCardHeaderProps extends ComponentPropsWithoutRef<"div"> {
  title: string;
  badge?: ReactNode;
  showClamp?: boolean;
}

export interface GameCardFooterProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
}

export interface GameCardMetaProps extends ComponentPropsWithoutRef<"div"> {
  releaseYear?: number | null;
  platforms?: string[];
  status?: string;
  showPlatforms?: boolean;
  maxVisiblePlatforms?: number;
}

import type { VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef, ReactNode } from "react";

import type { gameCardVariants } from "./game-card.variants";

/**
 * Base game data - minimal required fields
 */
export interface BaseGameData {
  id: number | string;
  name: string;
  slug: string;
  coverImageId?: string | null;
}

/**
 * Extended game data for search results
 */
export interface SearchGameData extends BaseGameData {
  releaseYear?: number | null;
  releaseDate?: number | null;
  platforms?: string[] | Array<{ name: string }>;
  gameType?: number;
}

/**
 * Extended game data for library items
 */
export interface LibraryGameData extends BaseGameData {
  status?: string;
  platform?: string | null;
  entryCount?: number;
  libraryItemId?: number;
  hasMultipleEntries?: boolean;
}

/**
 * Union type for all game data shapes
 */
export type GameData = BaseGameData | SearchGameData | LibraryGameData;

/**
 * Props for GameCard component
 */
export interface GameCardProps
  extends
    Omit<ComponentPropsWithoutRef<"div">, "children">,
    VariantProps<typeof gameCardVariants> {
  /**
   * Game data in any supported format
   */
  game: GameData;

  /**
   * Whether to show as a clickable link
   * @default true
   */
  asLink?: boolean;

  /**
   * Optional click handler (only used when asLink is false)
   */
  onClick?: () => void;

  /**
   * Additional content to render in the card
   */
  children?: ReactNode;

  /**
   * Whether to enable hover effects
   * @default true
   */
  enableHoverEffects?: boolean;

  /**
   * Priority loading for cover image
   * @default false
   */
  priority?: boolean;

  /**
   * Responsive sizes for Next.js Image
   */
  sizes?: string;

  /**
   * Optional badges to display on the cover image
   */
  badges?: ReactNode;

  /**
   * Optional overlay content (e.g., hover effects, interactive elements)
   */
  overlay?: ReactNode;
}

/**
 * Props for GameCardCover sub-component
 */
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

/**
 * Props for GameCardContent sub-component
 */
export interface GameCardContentProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
}

/**
 * Props for GameCardHeader sub-component
 */
export interface GameCardHeaderProps extends ComponentPropsWithoutRef<"div"> {
  title: string;
  badge?: ReactNode;
  showClamp?: boolean;
}

/**
 * Props for GameCardFooter sub-component
 */
export interface GameCardFooterProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
}

/**
 * Props for GameCardMeta sub-component
 */
export interface GameCardMetaProps extends ComponentPropsWithoutRef<"div"> {
  releaseYear?: number | null;
  platforms?: string[];
  status?: string;
  showPlatforms?: boolean;
  maxVisiblePlatforms?: number;
}

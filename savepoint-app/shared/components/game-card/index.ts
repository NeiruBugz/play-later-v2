/**
 * GameCard - Unified card component for displaying games
 *
 * A composable, flexible card component that supports multiple layouts,
 * densities, and data formats. Built with CVA variants and follows the
 * design system patterns.
 *
 * @module shared/components/game-card
 */

export { GameCard } from "./game-card";
export {
  GameCardContent,
  GameCardCover,
  GameCardFooter,
  GameCardHeader,
  GameCardMeta,
} from "./game-card";
export { GameCardSkeleton } from "./game-card-skeleton";

export type {
  BaseGameData,
  GameCardContentProps,
  GameCardCoverProps,
  GameCardFooterProps,
  GameCardHeaderProps,
  GameCardMetaProps,
  GameCardProps,
  GameData,
  LibraryGameData,
  SearchGameData,
} from "./game-card.types";

export {
  gameCardContentVariants,
  gameCardCoverVariants,
  gameCardHeaderVariants,
  gameCardOverlayVariants,
  gameCardTitleVariants,
  gameCardVariants,
} from "./game-card.variants";

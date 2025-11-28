// UI components for browse-related-games feature

export { RelatedGamesClient } from "./related-games-client";
export { RelatedGamesServer } from "./related-games-server";
export { RelatedGamesSkeleton } from "./related-games-skeleton";

export type {
  FranchiseWithGames,
  GameCardProps,
  GameGridProps,
  RelatedGame,
  RelatedGamesClientProps,
} from "./related-games-client.types";
export type { RelatedGamesServerProps } from "./related-games-server.types";

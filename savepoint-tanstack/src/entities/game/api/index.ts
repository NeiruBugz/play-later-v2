export { upsertGameFromIgdb } from "./upsert-game.server";
export { searchGamesFn, SEARCH_GAMES_INPUT } from "./search-games";
export { getGameDetails } from "./get-game-details.server";
export type { GameDetails } from "./get-game-details.server";
export { getGameCollectionsByIgdbId } from "./get-game-collections.server";
export type { GameCollectionRef } from "./get-game-collections.server";
export { getTimesToBeat } from "./get-times-to-beat.server";
export type { TimesToBeat } from "./get-times-to-beat.server";
export { getRelatedGames } from "./get-related-games.server";
export type {
  GetRelatedGamesParams,
  GetRelatedGamesResult,
  RelatedGame,
} from "./get-related-games.server";

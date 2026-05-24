export { searchGames } from "./search";
export type { SearchGamesParams, SearchGamesResult } from "./search";
export { searchIgdbPlatforms } from "./search-platforms";
export { matchSteamGameByAppId } from "./match-steam-game";
export { getGameByIgdbId } from "./get-game-by-id";
export { getGameBySlug } from "./get-game-by-slug";
export {
  getGameDetailsFromIgdb,
  GameDetailsResponseItemSchema,
} from "./get-game-details-by-slug";
export type { GameDetailsResponseItem } from "./get-game-details-by-slug";
export type { SearchResponseItem } from "./schemas";

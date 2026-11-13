export { searchGames } from "./search";
export type { SearchGamesParams, SearchGamesResult } from "./search";
export { searchIgdbPlatforms } from "./search-platforms";
export { matchSteamGameByAppId } from "./match-steam-game";
export { getGameByIgdbId } from "./get-game-by-id";
export { getGamesReleaseInfoByIgdbIds } from "./get-games-release-info";
export type { GameReleaseInfo } from "./get-games-release-info";
export {
  getGameDetailsFromIgdb,
  GameDetailsResponseItemSchema,
} from "./get-game-details-by-slug";
export type { GameDetailsResponseItem } from "./get-game-details-by-slug";
export type { SearchResponseItem } from "./schemas";
export { DATE_FORMAT_PRECISION, mapIgdbReleaseDate } from "./release-date";
export type { IgdbReleasePrecision } from "./release-date";

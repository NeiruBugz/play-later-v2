/**
 * Public surface for the Steam shared API client.
 *
 * Consumers (Phase B+ features) import from `@/shared/api/steam`, never
 * from the individual files.
 */
export {
  fetchOwnedGames,
  fetchPlayerSummary,
  OwnedGameSchema,
  PlayerSummarySchemaPublic,
  type OwnedGame,
  type PlayerSummary,
} from "./steam-fetch";
export { verifyOpenIdResponse } from "./openid";
export {
  SteamApiUnavailableError,
  SteamProfileNotFoundError,
  SteamProfilePrivateError,
  SteamRateLimitError,
} from "./errors";

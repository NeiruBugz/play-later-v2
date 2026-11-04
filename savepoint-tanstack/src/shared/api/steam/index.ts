/**
 * Public surface for the Steam shared API client.
 *
 * Consumers (Phase B+ features) import from `@/shared/api/steam`, never
 * from the individual files.
 */
export {
  fetchOwnedGames,
  OwnedGameSchema,
  type OwnedGame,
} from "./steam-fetch";
export { verifyOpenIdResponse } from "./openid";
export {
  SteamApiUnavailableError,
  SteamProfilePrivateError,
  SteamRateLimitError,
} from "./errors";

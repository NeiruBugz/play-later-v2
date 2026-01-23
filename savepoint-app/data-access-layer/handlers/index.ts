export type { HandlerResult, RequestContext, Handler } from "./types";

export { gameSearchHandler } from "./game-search/game-search-handler";
export type {
  GameSearchHandlerInput,
  GameSearchHandlerOutput,
} from "./game-search/types";

export { getLibraryHandler } from "./library/get-library-handler";
export type {
  GetLibraryHandlerInput,
  GetLibraryHandlerOutput,
  LibraryItemWithGameDomain,
} from "./library/types";

export { getPlatformsHandler } from "./platform/get-platforms-handler";
export { getUniquePlatformsHandler } from "./platform/get-unique-platforms";
export type {
  GetPlatformsHandlerInput,
  GetPlatformsHandlerOutput,
} from "./platform/types";

export { connectSteamHandler } from "./steam-import/steam-connect.handler";
export { fetchSteamGamesHandler } from "./steam-import/fetch-steam-games.handler";
export { importedGamesHandler } from "./steam-import/imported-games.handler";
export type {
  ConnectSteamHandlerInput,
  ConnectSteamHandlerOutput,
  FetchSteamGamesHandlerInput,
  FetchSteamGamesHandlerOutput,
  ImportedGamesHandlerInput,
  ImportedGamesHandlerOutput,
} from "./steam-import/types";

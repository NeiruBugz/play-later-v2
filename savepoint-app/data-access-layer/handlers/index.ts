export type { HandlerResult, RequestContext, Handler } from "./types";
export { mapErrorToHandlerResult } from "./map-error";

export { getLibraryHandler } from "./library/get-library-handler";
export { getStatusCountsHandler } from "./library/get-status-counts-handler";
export type {
  GetLibraryHandlerInput,
  GetLibraryHandlerOutput,
  GetStatusCountsHandlerInput,
  GetStatusCountsHandlerOutput,
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

export { activityFeedHandler } from "./social/activity-feed-handler";
export type {
  ActivityFeedHandlerInput,
  ActivityFeedHandlerOutput,
} from "./social/types";

export { igdbSearchHandler } from "./igdb/igdb-handler";
export type {
  IgdbSearchHandlerInput,
  IgdbSearchHandlerOutput,
} from "./igdb/types";

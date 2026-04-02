export type { HandlerResult, RequestContext, Handler } from "./types";

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

export { activityFeedHandler } from "./social/activity-feed-handler";
export type {
  ActivityFeedHandlerInput,
  ActivityFeedHandlerOutput,
} from "./social/types";

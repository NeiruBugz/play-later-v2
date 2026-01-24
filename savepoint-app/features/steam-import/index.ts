// UI Components
export {
  ImportedGameCard,
  ImportedGamesContainer,
  ImportedGamesList,
  ImportGameModal,
  IgdbManualSearch,
  SteamConnectCard,
  SteamApiUnavailableError,
  SteamPrivacyError,
  SteamProfileNotFoundError,
  SteamRateLimitError,
  showSyncStartedToast,
  showSyncCompletedToast,
  showSyncFailedToast,
  showSyncAlreadyInProgressToast,
  showImportStatusToast,
} from "./ui";
export type { FilterValues, SortBy } from "./ui";

// Hooks
export {
  useSteamConnection,
  useFetchSteamGames,
  useImportedGames,
  useDismissGame,
  useImportGame,
} from "./hooks";
export type { UseSteamConnectionReturn } from "./hooks";

// Server Actions
export { disconnectSteam } from "./server-actions";

// Config
export { steamImportConfig } from "./config";
export type { SteamImportConfig } from "./config";

// Utilities
export { calculateSmartStatus } from "./lib/utils";
export {
  formatPlaytime,
  formatLastPlayed,
  getSteamIconUrl,
} from "./lib/formatters";

// Types
export type {
  SteamProfile,
  SteamOwnedGame,
  SteamImportResult,
  SteamConnectionStatus,
  PlaytimeStatus,
  PlaytimeRange,
  PlatformFilter,
  LastPlayedFilter,
  SortOption,
  ImportedGamesQueryOptions,
  LibraryStatus,
  UseImportedGamesOptions,
  PaginationInfo,
  ImportedGamesResponse,
} from "./types";

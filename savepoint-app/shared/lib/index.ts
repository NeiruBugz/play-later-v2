export {
  prisma,
  createLogger,
  logger,
  type Logger,
  sessionErrorHandler,
  verifyPassword,
  hashPassword,
} from "./app";

export { LOGGER_CONTEXT, type LoggerContextKey } from "./app/logger-context";

export {
  isNextAuthRedirect,
  isAuthenticationError,
} from "./auth/handle-next-auth-error";

export { formatRelativeDate, formatAbsoluteDate } from "./date";

export { getGameUrl, isExternalGameId } from "./game";

export {
  platformMapper,
  platformToBackgroundColor,
  platformToColorBadge,
  playingOnPlatforms,
  getUniquePlatforms,
} from "./platform";

export {
  STEAM_IMAGE_TYPES,
  getSteamAppIdFromUrl,
  getSteamGameImageUrl,
  buildSteamImageUrl,
  buildSteamStoreImageUrl,
} from "./steam";

export {
  convertReleaseDateToIsoStringDate,
  convertUnixToHumanReadable,
  isoToReadable,
  getTimeStamp,
  LibraryStatusMapper,
  AcquisitionStatusMapper,
  capitalizeString,
  normalizeGameTitle,
  normalizeString,
  updateListParams,
  parseListParams,
  type ListParams,
  cn,
} from "./ui";

export { createServerAction, type ActionResult } from "./server-action";

export {
  LIBRARY_STATUS_CONFIG,
  LIBRARY_STATUS_LABELS,
  LIBRARY_STATUS_VARIANTS,
  getStatusLabel,
  getStatusVariant,
  type StatusBadgeVariant,
  type StatusConfig,
} from "./library-status";

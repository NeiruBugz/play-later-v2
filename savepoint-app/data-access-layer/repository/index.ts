export {
  type RepositoryResult,
  type RepositorySuccess,
  type RepositoryFailure,
  type RepositoryError,
  RepositoryErrorCode,
  repositorySuccess,
  repositoryError,
  isRepositorySuccess,
  isRepositoryError,
} from "./types";
export {
  createLibraryItem,
  deleteLibraryItem,
  findLibraryItemById,
  updateLibraryItem,
  getLibraryItemsForUserByIgdbId,
  getManyLibraryItems,
  getLibraryCount,
  getPlatformBreakdown,
  getAcquisitionTypeBreakdown,
  getRecentlyCompletedLibraryItems,
  getUniquePlatforms,
  getOtherUsersLibraries,
  getOtherUsersLibrariesPaginated,
  getLibraryByUsername,
  getWishlistedItemsByUsername,
  findWishlistItemsForUser,
  findUpcomingWishlistItems,
  findCurrentlyPlayingGames,
  buildCollectionFilter,
  getLibraryStatsByUserId,
  findMostRecentLibraryItemByGameId,
  findAllLibraryItemsByGameId,
  findLibraryItemsWithFilters,
} from "./library/library-repository";
export {
  getUserBySteamId,
  getUserByUsername,
  updateUserSteamData,
  getUserSteamData,
  getUserInfo,
  updateUserData,
  getUserSteamId,
  disconnectSteam,
  findUserById,
  findUserByNormalizedUsername,
  updateUserProfile,
  findUserByEmail,
  createUserWithCredentials,
} from "./user/user-repository";
export {
  upsertGenre,
  upsertGenres,
  findGenreByIgdbId,
} from "./genre/genre-repository";
export {
  upsertPlatform,
  upsertPlatforms,
  findPlatformByIgdbId,
  findPlatformsForGame,
} from "./platform/platform-repository";
export {
  createGameWithRelations,
  findGameBySlug,
  findGameByIgdbId,
  gameExistsByIgdbId,
} from "./game/game-repository";
export {
  findJournalEntriesByGameId,
  countJournalEntriesByGameId,
} from "./journal/journal-repository";

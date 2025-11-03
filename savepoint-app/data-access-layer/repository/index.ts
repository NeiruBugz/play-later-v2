// Repository types
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

// Library repository
export {
  createLibraryItem,
  deleteLibraryItem,
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
} from "./library/library-repository";

// User repository
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

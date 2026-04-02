export {
  type ServiceResult,
  ServiceErrorCode,
  type PaginatedResult,
  type CursorPaginatedResult,
  type PaginationInput,
  type BaseServiceInput,
  serviceSuccess,
  serviceError,
  handleServiceError,
  isSuccessResult,
  isErrorResult,
  type ExtractServiceData,
} from "./types";
export {
  type GameSearchParams,
  type GameSearchResult,
  type GameDetailsParams,
  type GameDetailsResult,
  type PlatformsResult,
  type IgdbService as IgdbServiceInterface,
} from "./igdb/types";
export { IgdbService } from "./igdb/igdb-service";
export {
  type SignUpInput,
  type AuthUserData,
  type SignUpResult,
} from "./auth/types";
export { AuthService } from "./auth/auth-service";
export {
  type GetProfileInput,
  type GetProfileResult,
  type GetProfileWithStatsInput,
  type GetProfileWithStatsResult,
  type UpdateProfileInput,
  type UpdateProfileResult,
  type CheckUsernameAvailabilityInput,
  type CheckUsernameAvailabilityResult,
  type CompleteSetupInput,
  type CompleteSetupResult,
  type UpdateAvatarUrlInput,
  type UpdateAvatarUrlResult,
  type CheckSetupStatusInput,
  type CheckSetupStatusResult,
  type Profile,
  type ProfileWithStats,
  type PublicProfile,
  type GetPublicProfileResult,
  type LibraryStats,
  type RecentGame,
} from "./profile/types";
export { ProfileService } from "./profile/profile-service";
export {
  LibraryService,
  type GetLibraryItemsResult,
} from "./library/library-service";
export {
  GetLibraryItemsBaseSchema,
  GetLibraryItemsServiceSchema,
  DeleteLibraryItemSchema,
  LibrarySortBySchema,
  LibrarySortOrderSchema,
} from "./library/schemas";
export {
  type FindJournalEntriesResult,
  type JournalService as IJournalService,
} from "./journal/types";
export { JournalService } from "./journal/journal-service";
export {
  GameDetailService,
  getGameById,
  getGameByIgdbId,
  getGamesByIds,
} from "./game-detail/game-detail-service";
export {
  OnboardingService,
  type OnboardingStep,
  type OnboardingProgress,
} from "./onboarding";
export {
  SteamService,
  SteamOpenIdService,
  type SteamProfile,
  type ResolveVanityUrlInput,
  type GetPlayerSummaryInput,
  type ValidateSteamIdInput,
} from "./steam";
export {
  ImportedGameService,
  type FindImportedGamesByUserIdInput,
  type FindImportedGamesByUserIdResult,
  type FindImportedGameByIdInput,
  type UpdateImportedGameStatusInput,
} from "./imported-game";
export { SocialService } from "./social/social-service";
export { ActivityFeedService } from "./activity-feed/activity-feed-service";
export {
  type GetFeedForUserResult,
  type GetPopularFeedResult,
} from "./activity-feed/types";
export {
  type FollowCounts,
  type FollowUserResult,
  type UnfollowUserResult,
  type IsFollowingResult,
  type GetFollowCountsResult,
  type GetFollowersResult,
  type GetFollowingResult,
} from "./social/types";

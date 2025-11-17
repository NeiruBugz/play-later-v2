export {
  type ServiceResult,
  ServiceErrorCode,
  type PaginatedResult,
  type CursorPaginatedResult,
  type PaginationInput,
  type BaseServiceInput,
  BaseService,
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
  type TopRatedGamesResult,
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
  type LibraryStats,
  type RecentGame,
} from "./profile/types";
export { ProfileService } from "./profile/profile-service";
export { LibraryService } from "./library/library-service";
export {
  type FindJournalEntriesResult,
  type JournalService as IJournalService,
} from "./journal/types";
export { JournalService } from "./journal/journal-service";

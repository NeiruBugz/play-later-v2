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
  type ServiceResponse,
  type ServiceError,
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
  type CollectionParams,
  type CollectionItem,
  type CollectionResult,
  type CollectionService as CollectionServiceInterface,
  type GameWithLibraryItems,
} from "./collection/types";

export { CollectionService } from "./collection/collection-service";

export {
  type GetLibraryItemsInput,
  type CreateLibraryItemInput,
  type UpdateLibraryItemInput,
  type DeleteLibraryItemInput,
  type GetLibraryCountInput,
  type GetLibraryItemsResult,
  type CreateLibraryItemResult,
  type UpdateLibraryItemResult,
  type DeleteLibraryItemResult,
  type LibraryItemWithGame,
} from "./library/types";

export { LibraryService } from "./library/library-service";

export {
  type GameSearchInput,
  type CreateGameFromIgdbInput,
  type CreateGameInput,
  type UpdateGameInput,
  type GetGameInput,
  type SearchGamesResult,
  type CreateGameResult,
  type UpdateGameResult,
  type GetGameResult,
  type GetGameDetailsResult,
  type IgdbSearchResult,
  type IgdbGameDetails,
  type GameWithLibraryItems as GameWithLibraryItemsType,
} from "./game/types";

export { GameService } from "./game/game-service";

export {
  type GetReviewsInput,
  type CreateReviewInput,
  type UpdateReviewInput,
  type DeleteReviewInput,
  type GetAggregatedRatingInput,
  type ReviewData,
  type GetReviewsResult,
  type CreateReviewResult,
  type UpdateReviewResult,
  type DeleteReviewResult,
  type GetAggregatedRatingResult,
} from "./review/types";

export { ReviewService } from "./review/review-service";

export {
  type GetUserInput,
  type UpdateUserInput,
  type GetSteamIntegrationInput,
  type DisconnectSteamInput,
  type UserData,
  type SteamIntegrationData,
  type GetUserResult,
  type UpdateUserResult,
  type GetSteamIntegrationResult,
  type DisconnectSteamResult,
} from "./user/types";

export { UserService } from "./user/user-service";

export {
  type GetJournalEntriesInput,
  type CreateJournalEntryInput,
  type UpdateJournalEntryInput,
  type DeleteJournalEntryInput,
  type GetJournalStatsInput,
  type JournalEntryData,
  type JournalStatsData,
  type GetJournalEntriesResult,
  type CreateJournalEntryResult,
  type UpdateJournalEntryResult,
  type DeleteJournalEntryResult,
  type GetJournalStatsResult,
} from "./journal/types";

export { JournalService } from "./journal/journal-service";

export {
  type SignUpInput,
  type SignInInput,
  type AuthUserData,
  type SignUpResult,
  type SignInResult,
} from "./auth/types";

export { AuthService } from "./auth/auth-service";

export {
  type GetProfileInput,
  type GetProfileResult,
  type GetProfileWithStatsInput,
  type GetProfileWithStatsResult,
  type Profile,
  type ProfileWithStats,
  type LibraryStats,
  type RecentGame,
} from "./profile/types";

export { ProfileService } from "./profile/profile-service";

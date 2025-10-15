// Service layer exports

// ============================================================================
// Core Service Types (New - Zod-first validation strategy)
// ============================================================================

export {
  // Primary types
  type ServiceResult,
  ServiceErrorCode,
  type PaginatedResult,
  type CursorPaginatedResult,
  type PaginationInput,
  type BaseServiceInput,
  // Base class
  BaseService,
  // Type guards and helpers
  isSuccessResult,
  isErrorResult,
  type ExtractServiceData,
  // Legacy types (deprecated)
  type ServiceResponse,
  type ServiceError,
} from "./types";

// ============================================================================
// IGDB Service (Game Search & Metadata)
// ============================================================================

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

// ============================================================================
// Collection Service (User Game Collection)
// ============================================================================

export {
  type CollectionParams,
  type CollectionItem,
  type CollectionResult,
  type CollectionService as CollectionServiceInterface,
  type GameWithLibraryItems,
} from "./collection/types";

export { CollectionService } from "./collection/collection-service";

// ============================================================================
// Library Service (User Library Item Management)
// ============================================================================

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

// ============================================================================
// Game Service (Game Management & IGDB Integration)
// ============================================================================

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

// ============================================================================
// Review Service (Review Management)
// ============================================================================

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

// ============================================================================
// User Service (User Management)
// ============================================================================

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

// ============================================================================
// Journal Service (Journal Entry Management)
// ============================================================================

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

// ============================================================================
// Auth Service (Authentication)
// ============================================================================

export {
  type SignUpInput,
  type SignInInput,
  type AuthUserData,
  type SignUpResult,
  type SignInResult,
} from "./auth/types";

export { AuthService } from "./auth/auth-service";

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
  type GameSearchService as GameSearchServiceInterface,
  type IgdbService as IgdbServiceInterface,
} from "./igdb/types";

export { IgdbService } from "./igdb/igdb-service";
export { GameSearchService } from "./igdb/game-search-service";

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

// Service layer exports

export { type ServiceResponse, type ServiceError, BaseService } from "./types";

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

export {
  type CollectionParams,
  type CollectionItem,
  type CollectionResult,
  type CollectionService as CollectionServiceInterface,
  type GameWithLibraryItems,
} from "./collection/types";

export { CollectionService } from "./collection/collection-service";

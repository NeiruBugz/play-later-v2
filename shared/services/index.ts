// Service layer exports

export { type ServiceResponse, type ServiceError, BaseService } from "./types";

export {
  type GameSearchParams,
  type GameSearchResult,
  type IIgdbService,
} from "./igdb/types";

export { IgdbService } from "./igdb/igdb-service";
export { GameSearchService } from "./igdb/game-search-service";

export {
  type CollectionParams,
  type CollectionItem,
  type CollectionResult,
  type ICollectionService,
  type GameWithBacklogItems,
} from "./collection/types";

export { CollectionService } from "./collection/collection-service";

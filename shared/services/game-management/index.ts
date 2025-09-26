// Game Management Service Exports

// Service class for business logic and orchestration
export { GameManagementService } from "./game-management-service";

// Server actions for direct usage (backward compatibility)
export { addGameToCollection } from "./actions/add-to-collection";
export { removeGameFromCollection } from "./actions/remove-from-collection";

// Types
export type {
  AddToCollectionParams,
  RemoveFromCollectionParams,
  GameManagementResult,
  GameManagementService as GameManagementServiceInterface,
} from "./types";

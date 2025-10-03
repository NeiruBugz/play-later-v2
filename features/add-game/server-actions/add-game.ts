import "server-only";

import { addGameToCollection } from "@/shared/services/game-management";

/**
 * Re-export the shared service for backward compatibility.
 * This maintains the existing API for the add-game feature while
 * using the centralized business logic from shared services.
 */
export const saveGameAndAddToLibrary = addGameToCollection;

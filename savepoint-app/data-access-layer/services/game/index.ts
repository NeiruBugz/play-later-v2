/**
 * Game Service Layer Exports
 *
 * This module exports the game service and all related types for use
 * throughout the application.
 *
 * @module shared/services/game
 */

export { GameService } from "./game-service";
export type {
  CreateGameFromIgdbInput,
  CreateGameInput,
  CreateGameResult,
  GameSearchInput,
  GameWithLibraryItems,
  GetGameDetailsResult,
  GetGameInput,
  GetGameResult,
  IgdbGameDetails,
  IgdbSearchResult,
  SearchGamesResult,
  UpdateGameInput,
  UpdateGameResult,
} from "./types";

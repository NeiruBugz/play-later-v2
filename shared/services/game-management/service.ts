import "server-only";

import { BaseService, type ServiceResponse } from "../types";
import { addGameToCollection } from "./actions/add-to-collection";
import { removeGameFromCollection } from "./actions/remove-from-collection";
import type {
  AddToCollectionParams,
  GameManagementResult,
  GameManagementService as GameManagementServiceInterface,
  RemoveFromCollectionParams,
} from "./types";

export class GameManagementService
  extends BaseService
  implements GameManagementServiceInterface
{
  async addGameToCollection(
    params: AddToCollectionParams
  ): Promise<ServiceResponse<GameManagementResult>> {
    try {
      await this.getCurrentUserId(); // Throws if not authenticated

      // Business logic validation and orchestration
      const result = await addGameToCollection({
        game: params.game,
        backlogItem: params.backlogItem,
      });

      if (!result.data) {
        return this.createErrorResponse({
          message: "Failed to add game to collection",
          code: "ADD_GAME_FAILED",
        });
      }

      // Transform repository response to service response format
      const gameManagementResult: GameManagementResult = {
        id: result.data.id,
        title: result.data.title,
        igdbId: result.data.igdbId,
        coverUrl: result.data.coverImage || undefined,
      };

      return this.createSuccessResponse(gameManagementResult);
    } catch (error) {
      const serviceError = this.handleError(error);
      return this.createErrorResponse({
        message: "Failed to add game to collection",
        code: "ADD_GAME_FAILED",
        cause: serviceError.message,
      });
    }
  }

  async removeGameFromCollection(
    params: RemoveFromCollectionParams
  ): Promise<ServiceResponse<void>> {
    try {
      await this.getCurrentUserId(); // Throws if not authenticated

      // Business logic validation and orchestration
      const result = await removeGameFromCollection({
        backlogItemId: params.backlogItemId,
      });

      if (!result.data?.success) {
        return this.createErrorResponse({
          message: "Failed to remove game from collection",
          code: "REMOVE_GAME_FAILED",
        });
      }

      return this.createSuccessResponse(undefined);
    } catch (error) {
      const serviceError = this.handleError(error);
      return this.createErrorResponse({
        message: "Failed to remove game from collection",
        code: "REMOVE_GAME_FAILED",
        cause: serviceError.message,
      });
    }
  }
}

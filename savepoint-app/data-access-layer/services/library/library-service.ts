import "server-only";

import {
  createLibraryItem,
  deleteLibraryItem,
  findAllLibraryItemsByGameId,
  findGameByIgdbId,
  findLibraryItemById,
  findLibraryItemsWithFilters,
  findMostRecentLibraryItemByGameId,
  updateLibraryItem,
} from "@/data-access-layer/repository";
import {
  LibraryItemMapper,
  type LibraryItemWithGameDomain,
} from "@/data-access-layer/domain/library";
import { AcquisitionType, LibraryItemStatus } from "@prisma/client";
import { z } from "zod";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

import { BaseService, type ServiceResult } from "../types";

const GetLibraryItemsSchema = z.object({
  userId: z.string().cuid(),
  status: z.nativeEnum(LibraryItemStatus).optional(),
  platform: z.string().optional(),
  search: z.string().optional(),
  sortBy: z
    .enum(["createdAt", "releaseDate", "startedAt", "completedAt"])
    .optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  distinctByGame: z.boolean().optional(),
});
const DeleteLibraryItemSchema = z.object({
  libraryItemId: z.number().int().positive(),
  userId: z.string().cuid(),
});

type SortField = "createdAt" | "releaseDate" | "startedAt" | "completedAt";
type GetLibraryItemsParams = {
  userId: string;
  status?: LibraryItemStatus;
  platform?: string;
  search?: string;
  sortBy?: SortField;
  sortOrder?: "asc" | "desc";
  distinctByGame?: boolean;
};
export class LibraryService extends BaseService {
  private logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "LibraryService" });
  async findGameByIgdbId(igdbId: number) {
    try {
      this.logger.info({ igdbId }, "Finding game by IGDB ID");
      const result = await findGameByIgdbId(igdbId);
      if (!result.ok) {
        this.logger.error(
          { error: result.error, igdbId },
          "Failed to find game"
        );
        return this.error("Failed to find game");
      }
      return this.success(result.data);
    } catch (error) {
      this.logger.error(
        { error, igdbId },
        "Unexpected error in findGameByIgdbId"
      );
      return this.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    }
  }
  async findMostRecentLibraryItemByGameId(params: {
    userId: string;
    gameId: string;
  }) {
    try {
      this.logger.info(params, "Finding most recent library item");
      const result = await findMostRecentLibraryItemByGameId(params);
      if (!result.ok) {
        this.logger.error(
          { error: result.error, ...params },
          "Failed to find library item"
        );
        return this.error("Failed to find library item");
      }
      return this.success(result.data);
    } catch (error) {
      this.logger.error(
        { error, ...params },
        "Unexpected error in findMostRecentLibraryItemByGameId"
      );
      return this.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    }
  }
  private validateStatusTransition(
    currentStatus: LibraryItemStatus,
    newStatus: LibraryItemStatus
  ): { valid: boolean; error?: string } {
    if (
      newStatus === LibraryItemStatus.WISHLIST &&
      currentStatus !== LibraryItemStatus.WISHLIST
    ) {
      return {
        valid: false,
        error:
          "Cannot move a game back to Wishlist. Create a new library item instead.",
      };
    }
    return { valid: true };
  }
  async updateLibraryItem(params: {
    userId: string;
    libraryItem: {
      id: number;
      status: LibraryItemStatus;
      startedAt?: Date;
      completedAt?: Date;
    };
  }) {
    try {
      this.logger.info(params, "Updating library item");
      const currentItemResult = await findLibraryItemById({
        libraryItemId: params.libraryItem.id,
        userId: params.userId,
      });
      if (!currentItemResult.ok) {
        this.logger.error(
          { error: currentItemResult.error, ...params },
          "Failed to fetch library item for update"
        );
        return this.error("Library item not found");
      }
      const currentStatus = currentItemResult.data.status;
      const newStatus = params.libraryItem.status;
      if (newStatus !== currentStatus) {
        const transitionValidation = this.validateStatusTransition(
          currentStatus,
          newStatus
        );
        if (!transitionValidation.valid) {
          this.logger.warn(
            {
              libraryItemId: params.libraryItem.id,
              currentStatus,
              requestedStatus: newStatus,
            },
            "Invalid status transition attempted"
          );
          return this.error(
            transitionValidation.error ?? "Invalid status transition"
          );
        }
      }
      const result = await updateLibraryItem(params);
      if (!result.ok) {
        this.logger.error(
          { error: result.error, ...params },
          "Failed to update library item"
        );
        return this.error("Failed to update library item");
      }
      this.logger.info(
        {
          libraryItemId: params.libraryItem.id,
          oldStatus: currentStatus,
          newStatus,
        },
        "Library item updated successfully"
      );
      return this.success(result.data);
    } catch (error) {
      this.logger.error(
        { error, ...params },
        "Unexpected error in updateLibraryItem"
      );
      return this.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    }
  }
  async findAllLibraryItemsByGameId(params: {
    userId: string;
    gameId: string;
  }) {
    try {
      this.logger.info(params, "Finding all library items for game");
      const result = await findAllLibraryItemsByGameId(params);
      if (!result.ok) {
        this.logger.error(
          { error: result.error, ...params },
          "Failed to find library items"
        );
        return this.error("Failed to find library items");
      }
      return this.success(result.data);
    } catch (error) {
      this.logger.error(
        { error, ...params },
        "Unexpected error in findAllLibraryItemsByGameId"
      );
      return this.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    }
  }
  async getLibraryItems(
    params: GetLibraryItemsParams
  ): Promise<
    | { success: true; data: LibraryItemWithGameDomain[] }
    | { success: false; error: string }
  > {
    try {
      this.logger.info({ userId: params.userId }, "Fetching library items");
      const validation = GetLibraryItemsSchema.safeParse(params);
      if (!validation.success) {
        this.logger.warn(
          { errors: validation.error.errors },
          "Invalid input parameters"
        );
        return this.error(
          validation.error.errors[0]?.message ?? "Invalid input parameters"
        );
      }
      const result = await findLibraryItemsWithFilters(validation.data);
      if (!result.ok) {
        this.logger.error(
          { error: result.error, userId: params.userId },
          "Failed to fetch library items"
        );
        return this.error("Failed to fetch library items");
      }

      const domainItems = LibraryItemMapper.toWithGameDomainList(result.data);

      this.logger.info(
        { count: domainItems.length, userId: params.userId },
        "Library items fetched successfully"
      );
      return this.success(domainItems);
    } catch (error) {
      this.logger.error(
        { error, ...params },
        "Unexpected error in getLibraryItems"
      );
      return this.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    }
  }
  async deleteLibraryItem(params: {
    libraryItemId: number;
    userId: string;
  }): Promise<ServiceResult<void>> {
    try {
      this.logger.info(
        { libraryItemId: params.libraryItemId, userId: params.userId },
        "Attempting to delete library item"
      );
      const validation = DeleteLibraryItemSchema.safeParse(params);
      if (!validation.success) {
        this.logger.warn(
          { errors: validation.error.errors },
          "Invalid input parameters"
        );
        return this.error(
          validation.error.errors[0]?.message ?? "Invalid input parameters"
        );
      }
      const deleteResult = await deleteLibraryItem({
        libraryItemId: params.libraryItemId,
        userId: params.userId,
      });
      if (!deleteResult.ok) {
        if (deleteResult.error.code === "NOT_FOUND") {
          this.logger.warn(
            { libraryItemId: params.libraryItemId, userId: params.userId },
            "Library item not found or unauthorized delete attempt"
          );
          return this.error(
            "Library item not found or you do not have permission to delete it"
          );
        }
        this.logger.error(
          { error: deleteResult.error },
          "Failed to delete library item"
        );
        return this.error("Failed to delete library item");
      }
      this.logger.info(
        { libraryItemId: params.libraryItemId },
        "Library item deleted successfully"
      );
      return this.success(undefined);
    } catch (error) {
      this.logger.error(
        { error, ...params },
        "Unexpected error in deleteLibraryItem"
      );
      return this.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    }
  }
  async createLibraryItem(params: {
    userId: string;
    gameId: string;
    libraryItem: {
      status: LibraryItemStatus;
      acquisitionType: AcquisitionType;
      platform?: string;
      startedAt?: Date;
      completedAt?: Date;
    };
  }) {
    try {
      this.logger.info(
        {
          userId: params.userId,
          gameId: params.gameId,
          status: params.libraryItem.status,
        },
        "Creating library item"
      );
      const result = await createLibraryItem(params);
      if (!result.ok) {
        if (result.error.code === "DUPLICATE") {
          this.logger.warn(
            { userId: params.userId, gameId: params.gameId },
            "Duplicate library item attempted"
          );
          return this.error("Game already in library");
        }
        this.logger.error(
          { error: result.error, ...params },
          "Failed to create library item"
        );
        return this.error("Failed to create library item");
      }
      this.logger.info(
        { libraryItemId: result.data.id, userId: params.userId },
        "Library item created successfully"
      );
      return this.success(result.data);
    } catch (error) {
      this.logger.error(
        { error, ...params },
        "Unexpected error in createLibraryItem"
      );
      return this.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    }
  }
}

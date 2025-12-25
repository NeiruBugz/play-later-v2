import "server-only";

import {
  AcquisitionType,
  LibraryItemMapper,
  LibraryItemStatus,
  mapAcquisitionTypeToPrisma,
  mapLibraryItemStatusToPrisma,
  type LibraryItemDomain,
  type LibraryItemWithGameDomain,
} from "@/data-access-layer/domain/library";
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
import { z } from "zod";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

import { BaseService, type ServiceResult } from "../types";

const GetLibraryItemsSchema = z.object({
  userId: z.string().cuid(),
  status: z.enum(LibraryItemStatus).optional(),
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
  }): Promise<ServiceResult<LibraryItemDomain | null>> {
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
      const domainItem = result.data
        ? LibraryItemMapper.toDomain(result.data)
        : null;
      return this.success(domainItem);
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _currentStatus: LibraryItemStatus,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _newStatus: LibraryItemStatus
  ): { valid: boolean } {
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
      const currentDomainItem = LibraryItemMapper.toDomain(
        currentItemResult.data
      );
      const currentStatus = currentDomainItem.status;
      const newStatus = params.libraryItem.status;
      if (newStatus !== currentStatus) {
        this.validateStatusTransition(currentStatus, newStatus);
      }
      const result = await updateLibraryItem({
        userId: params.userId,
        libraryItem: {
          id: params.libraryItem.id,
          status: mapLibraryItemStatusToPrisma(params.libraryItem.status),
          startedAt: params.libraryItem.startedAt,
          completedAt: params.libraryItem.completedAt,
        },
      });
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
      return this.success(LibraryItemMapper.toDomain(result.data));
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
  }): Promise<ServiceResult<LibraryItemDomain[]>> {
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
      const domainItems = result.data.map((item) =>
        LibraryItemMapper.toDomain(item)
      );
      return this.success(domainItems);
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
          { errors: validation.error.issues },
          "Invalid input parameters"
        );
        return this.error(
          validation.error.issues[0]?.message ?? "Invalid input parameters"
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
          { errors: validation.error.issues },
          "Invalid input parameters"
        );
        return this.error(
          validation.error.issues[0]?.message ?? "Invalid input parameters"
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
      const result = await createLibraryItem({
        userId: params.userId,
        gameId: params.gameId,
        libraryItem: {
          status: mapLibraryItemStatusToPrisma(params.libraryItem.status),
          acquisitionType: mapAcquisitionTypeToPrisma(
            params.libraryItem.acquisitionType
          ),
          platform: params.libraryItem.platform,
          startedAt: params.libraryItem.startedAt,
          completedAt: params.libraryItem.completedAt,
        },
      });
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
      return this.success(LibraryItemMapper.toDomain(result.data));
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

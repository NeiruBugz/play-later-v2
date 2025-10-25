import "server-only";

import {
  addGameToUserLibrary,
  createLibraryItem as createLibraryItemRepo,
  deleteLibraryItem as deleteLibraryItemRepo,
  getLibraryCount,
  getManyLibraryItems,
  updateLibraryItem as updateLibraryItemRepo,
} from "@/data-access-layer/repository/library/library-repository";
import { AcquisitionType, LibraryItemStatus } from "@prisma/client";

import { createLogger } from "@/shared/lib";

import { BaseService, ServiceErrorCode } from "../types";
import type {
  AddGameToLibraryInput,
  AddGameToLibraryResult,
  CreateLibraryItemInput,
  CreateLibraryItemResult,
  DeleteLibraryItemInput,
  DeleteLibraryItemResult,
  GetLibraryCountInput,
  GetLibraryItemsInput,
  GetLibraryItemsResult,
  UpdateLibraryItemInput,
  UpdateLibraryItemResult,
} from "./types";

export class LibraryService extends BaseService {
  private logger = createLogger({ service: "LibraryService" });

  async getLibraryItems(
    input: GetLibraryItemsInput
  ): Promise<GetLibraryItemsResult> {
    try {
      const items = await getManyLibraryItems({
        userId: input.userId,
        gameId: input.gameId,
      });

      let filteredItems = items;

      if (input.status) {
        filteredItems = filteredItems.filter(
          (item) => item.status === input.status
        );
      }

      if (input.platform) {
        filteredItems = filteredItems.filter(
          (item) => item.platform === input.platform
        );
      }

      return this.success({
        items: filteredItems,
        total: filteredItems.length,
      });
    } catch (error) {
      return this.handleError(error, "Failed to fetch library items");
    }
  }

  async addGameToLibrary(
    input: AddGameToLibraryInput
  ): Promise<AddGameToLibraryResult> {
    try {
      this.logger.info(
        {
          userId: input.userId,
          igdbId: input.igdbId,
          platform: input.platform,
        },
        "Adding game to library"
      );

      const game = await addGameToUserLibrary({
        userId: input.userId,
        igdbId: input.igdbId,
        libraryItem: {
          status: input.status,
          platform: input.platform,
          acquisitionType: input.acquisitionType ?? AcquisitionType.DIGITAL,
        },
      });

      this.logger.info(
        { userId: input.userId, gameId: game.id, igdbId: input.igdbId },
        "Game added to library successfully"
      );

      return this.success({ game });
    } catch (error) {
      this.logger.error(
        { error, userId: input.userId, igdbId: input.igdbId },
        "Failed to add game to library"
      );
      return this.handleError(error, "Failed to add game to library");
    }
  }

  async createLibraryItem(
    input: CreateLibraryItemInput
  ): Promise<CreateLibraryItemResult> {
    try {
      const status = input.status ?? LibraryItemStatus.CURIOUS_ABOUT;

      const libraryItemData = {
        status,
        acquisitionType: input.acquisitionType ?? AcquisitionType.DIGITAL,
        platform: input.platform,
        startedAt: input.startedAt,
        completedAt: input.completedAt,
      };

      const item = await createLibraryItemRepo({
        userId: input.userId,
        gameId: input.gameId,
        libraryItem: libraryItemData,
      });

      return this.success({ item });
    } catch (error) {
      return this.handleError(error, "Failed to create library item");
    }
  }

  async updateLibraryItem(
    input: UpdateLibraryItemInput
  ): Promise<UpdateLibraryItemResult> {
    try {
      const libraryItemData = {
        id: input.id,
        status: input.status,
        platform: input.platform,
        startedAt: input.startedAt,
        completedAt: input.completedAt,
      };

      const item = await updateLibraryItemRepo({
        userId: input.userId,
        libraryItem: libraryItemData,
      });

      return this.success({ item });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Library item not found"
      ) {
        return this.error(
          "Library item not found or you do not have permission to update it",
          ServiceErrorCode.NOT_FOUND
        );
      }

      return this.handleError(error, "Failed to update library item");
    }
  }

  async deleteLibraryItem(
    input: DeleteLibraryItemInput
  ): Promise<DeleteLibraryItemResult> {
    try {
      await deleteLibraryItemRepo({
        libraryItemId: input.libraryItemId,
        userId: input.userId,
      });

      return this.success({
        message: "Library item deleted successfully",
      });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "Library item not found"
      ) {
        return this.error(
          "Library item not found or you do not have permission to delete it",
          ServiceErrorCode.NOT_FOUND
        );
      }

      return this.handleError(error, "Failed to delete library item");
    }
  }

  async getLibraryItemCount(input: GetLibraryCountInput): Promise<number> {
    try {
      const gteClause = input.createdAfter
        ? { createdAt: { gte: input.createdAfter } }
        : undefined;

      return await getLibraryCount({
        userId: input.userId,
        status: input.status,
        gteClause,
      });
    } catch (error) {
      this.logger.error(
        { error, userId: input.userId, status: input.status },
        "Failed to get library item count"
      );
      return 0;
    }
  }

  async getPlatformBreakdown(userId: string) {
    try {
      const { getPlatformBreakdown } = await import(
        "@/data-access-layer/repository/library/library-repository"
      );
      const result = await getPlatformBreakdown({ userId });
      return this.success(result ?? []);
    } catch (error) {
      return this.handleError(error, "Failed to get platform breakdown");
    }
  }

  async getAcquisitionTypeBreakdown(userId: string) {
    try {
      const { getAcquisitionTypeBreakdown } = await import(
        "@/data-access-layer/repository/library/library-repository"
      );
      const result = await getAcquisitionTypeBreakdown({ userId });
      return this.success(result ?? []);
    } catch (error) {
      return this.handleError(
        error,
        "Failed to get acquisition type breakdown"
      );
    }
  }

  async getRecentlyCompleted(userId: string) {
    try {
      const { getRecentlyCompletedLibraryItems } = await import(
        "@/data-access-layer/repository/library/library-repository"
      );
      const result = await getRecentlyCompletedLibraryItems({ userId });
      return this.success(result ?? []);
    } catch (error) {
      return this.handleError(error, "Failed to get recent completions");
    }
  }
}

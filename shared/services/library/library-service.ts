/**
 * LibraryService - Business logic layer for library item operations
 *
 * This service handles all business logic for user library management.
 * Input validation is handled at the server action layer via Zod.
 * This service focuses on:
 * - Business rule enforcement (e.g., default status values)
 * - Data transformation
 * - Repository orchestration
 * - Error handling
 *
 * @module shared/services/library/library-service
 */

import "server-only";

import { AcquisitionType, LibraryItemStatus } from "@prisma/client";

import {
  createLibraryItem as createLibraryItemRepo,
  deleteLibraryItem as deleteLibraryItemRepo,
  getLibraryCount,
  getManyLibraryItems,
  updateLibraryItem as updateLibraryItemRepo,
} from "@/shared/lib/repository/library/library-repository";

import { BaseService, ServiceErrorCode } from "../types";
import type {
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

/**
 * LibraryService class
 *
 * Provides business logic operations for managing user library items.
 * All methods return ServiceResult discriminated unions for type-safe error handling.
 *
 * @example
 * ```typescript
 * const service = new LibraryService();
 *
 * // Create with default status
 * const result = await service.createLibraryItem({
 *   userId: "user-123",
 *   gameId: "game-456"
 * });
 *
 * if (result.success) {
 *   console.log(result.data.item); // TypeScript knows item exists
 * } else {
 *   console.error(result.error); // TypeScript knows error exists
 * }
 * ```
 */
export class LibraryService extends BaseService {
  /**
   * Get library items for a specific game.
   *
   * Returns all library items for a user's specific game, with optional filtering
   * by status and platform. This is useful for checking if a user already has
   * a game in their library (potentially on multiple platforms).
   *
   * @param input - Filter parameters (userId and gameId required)
   * @returns ServiceResult with items array and total count
   *
   * @example
   * ```typescript
   * // Get all library items for a specific game
   * const result = await service.getLibraryItems({
   *   userId: "user-123",
   *   gameId: "game-456"
   * });
   *
   * // Get items for game filtered by status
   * const result = await service.getLibraryItems({
   *   userId: "user-123",
   *   gameId: "game-456",
   *   status: LibraryItemStatus.CURRENTLY_EXPLORING
   * });
   *
   * // Get items for game on specific platform
   * const result = await service.getLibraryItems({
   *   userId: "user-123",
   *   gameId: "game-456",
   *   platform: "PlayStation 5"
   * });
   * ```
   */
  async getLibraryItems(
    input: GetLibraryItemsInput
  ): Promise<GetLibraryItemsResult> {
    try {
      // Fetch items from repository (gameId required by repository)
      const items = await getManyLibraryItems({
        userId: input.userId,
        gameId: input.gameId,
      });

      // Apply optional filters
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

  /**
   * Create a new library item.
   *
   * Business rules:
   * - Status defaults to CURIOUS_ABOUT if not provided
   * - AcquisitionType defaults to DIGITAL if not provided (handled by Prisma)
   *
   * @param input - Creation parameters
   * @returns ServiceResult with the created item
   *
   * @example
   * ```typescript
   * // Create with default status (CURIOUS_ABOUT)
   * const result = await service.createLibraryItem({
   *   userId: "user-123",
   *   gameId: "game-456"
   * });
   *
   * // Create with specific status and platform
   * const result = await service.createLibraryItem({
   *   userId: "user-123",
   *   gameId: "game-456",
   *   status: LibraryItemStatus.CURRENTLY_EXPLORING,
   *   platform: "PlayStation 5",
   *   startedAt: new Date()
   * });
   * ```
   */
  async createLibraryItem(
    input: CreateLibraryItemInput
  ): Promise<CreateLibraryItemResult> {
    try {
      // Apply business rule: default status to CURIOUS_ABOUT
      const status = input.status ?? LibraryItemStatus.CURIOUS_ABOUT;

      // Build repository input
      const libraryItemData = {
        status,
        acquisitionType: input.acquisitionType ?? AcquisitionType.DIGITAL,
        platform: input.platform,
        startedAt: input.startedAt,
        completedAt: input.completedAt,
      };

      // Create via repository
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

  /**
   * Update an existing library item.
   *
   * Business rules:
   * - Only the item owner (userId) can update
   * - Repository validates ownership before updating
   * - Status is required (retrieve current status if not provided)
   *
   * @param input - Update parameters
   * @returns ServiceResult with the updated item
   *
   * @example
   * ```typescript
   * // Update status
   * const result = await service.updateLibraryItem({
   *   userId: "user-123",
   *   id: 789,
   *   status: LibraryItemStatus.EXPERIENCED,
   *   completedAt: new Date()
   * });
   *
   * // Update platform
   * const result = await service.updateLibraryItem({
   *   userId: "user-123",
   *   id: 789,
   *   status: LibraryItemStatus.CURIOUS_ABOUT, // Status must be provided
   *   platform: "PC"
   * });
   * ```
   */
  async updateLibraryItem(
    input: UpdateLibraryItemInput
  ): Promise<UpdateLibraryItemResult> {
    try {
      // Build update data (status required by type system)
      const libraryItemData = {
        id: input.id,
        status: input.status,
        platform: input.platform,
        startedAt: input.startedAt,
        completedAt: input.completedAt,
      };

      // Update via repository (repository validates ownership)
      const item = await updateLibraryItemRepo({
        userId: input.userId,
        libraryItem: libraryItemData,
      });

      return this.success({ item });
    } catch (error) {
      // Check if error is ownership/not found error
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

  /**
   * Delete a library item.
   *
   * Business rules:
   * - Only the item owner (userId) can delete
   * - Repository validates ownership before deleting
   *
   * @param input - Delete parameters
   * @returns ServiceResult with success message
   *
   * @example
   * ```typescript
   * const result = await service.deleteLibraryItem({
   *   userId: "user-123",
   *   libraryItemId: 789
   * });
   *
   * if (result.success) {
   *   console.log(result.data.message); // "Library item deleted successfully"
   * }
   * ```
   */
  async deleteLibraryItem(
    input: DeleteLibraryItemInput
  ): Promise<DeleteLibraryItemResult> {
    try {
      // Delete via repository (repository validates ownership)
      await deleteLibraryItemRepo({
        libraryItemId: input.libraryItemId,
        userId: input.userId,
      });

      return this.success({
        message: "Library item deleted successfully",
      });
    } catch (error) {
      // Check if error is ownership/not found error
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

  /**
   * Get count of library items with optional filters.
   *
   * Used for dashboard statistics and analytics.
   *
   * @param input - Filter parameters
   * @returns Promise with count number (no ServiceResult wrapper for simplicity)
   *
   * @example
   * ```typescript
   * // Get total count
   * const count = await service.getLibraryItemCount({ userId: "user-123" });
   *
   * // Get count by status
   * const count = await service.getLibraryItemCount({
   *   userId: "user-123",
   *   status: LibraryItemStatus.EXPERIENCED
   * });
   *
   * // Get count of items created after date
   * const count = await service.getLibraryItemCount({
   *   userId: "user-123",
   *   createdAfter: new Date("2024-01-01")
   * });
   * ```
   */
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
      // For count operations, return 0 on error (fail gracefully)
      console.error("Failed to get library item count:", error);
      return 0;
    }
  }
}

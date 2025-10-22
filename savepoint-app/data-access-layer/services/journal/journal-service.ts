/**
 * JournalService - Business logic layer for journal entry operations
 *
 * This service handles all business logic for journal entry management.
 * Input validation is handled at the server action layer via Zod.
 * This service focuses on:
 * - Business rule enforcement (e.g., ownership validation, visibility)
 * - Data transformation
 * - Repository orchestration
 * - Error handling
 *
 * @module shared/services/journal/journal-service
 */

import "server-only";

import {
  createJournalEntry as createJournalEntryRepo,
  deleteJournalEntry as deleteJournalEntryRepo,
  getJournalEntriesByGame,
  getJournalEntriesForUser,
  updateJournalEntry as updateJournalEntryRepo,
} from "@/data-access-layer/repository/journal/journal-repository";
import type { JournalMood } from "@prisma/client";

import { createLogger } from "@/shared/lib";

import { BaseService, ServiceErrorCode } from "../types";
import type {
  CreateJournalEntryInput,
  CreateJournalEntryResult,
  DeleteJournalEntryInput,
  DeleteJournalEntryResult,
  GetJournalEntriesInput,
  GetJournalEntriesResult,
  GetJournalStatsInput,
  GetJournalStatsResult,
  UpdateJournalEntryInput,
  UpdateJournalEntryResult,
} from "./types";

/**
 * JournalService class
 *
 * Provides business logic operations for managing journal entries.
 * All methods return ServiceResult discriminated unions for type-safe error handling.
 *
 * @example
 * ```typescript
 * const service = new JournalService();
 *
 * // Create a journal entry
 * const result = await service.createJournalEntry({
 *   userId: "user-123",
 *   gameId: "game-456",
 *   content: "Had a great session today!",
 *   mood: "EXCITED",
 *   playSession: 120
 * });
 *
 * if (result.success) {
 *   console.log(result.data.entry); // TypeScript knows entry exists
 * } else {
 *   console.error(result.error); // TypeScript knows error exists
 * }
 * ```
 */
export class JournalService extends BaseService {
  private logger = createLogger({ service: "JournalService" });
  /**
   * Get journal entries with optional filtering.
   *
   * Fetches journal entries for a user, optionally filtered by game,
   * library item, visibility, and with pagination support.
   *
   * @param input - Filter parameters
   * @returns ServiceResult with entries array and total count
   *
   * @example
   * ```typescript
   * // Get all entries for a user
   * const result = await service.getJournalEntries({
   *   userId: "user-123"
   * });
   *
   * // Get entries for a specific game
   * const result = await service.getJournalEntries({
   *   userId: "user-123",
   *   gameId: "game-456"
   * });
   *
   * // Get entries with pagination
   * const result = await service.getJournalEntries({
   *   userId: "user-123",
   *   limit: 10,
   *   offset: 0
   * });
   *
   * if (result.success) {
   *   console.log(result.data.entries);
   *   console.log(result.data.total);
   * }
   * ```
   */
  async getJournalEntries(
    input: GetJournalEntriesInput
  ): Promise<GetJournalEntriesResult> {
    try {
      let entries;

      // If gameId is provided, fetch by game
      if (input.gameId) {
        entries = await getJournalEntriesByGame(input.gameId, {
          userId: input.userId,
          visibility: input.visibility,
        });
      } else {
        // Otherwise, fetch by user
        entries = await getJournalEntriesForUser(input.userId, {
          limit: input.limit,
          offset: input.offset,
        });
      }

      // Apply additional filters if needed
      let filteredEntries = entries;

      if (input.libraryItemId !== undefined) {
        filteredEntries = filteredEntries.filter(
          (entry) => entry.libraryItemId === input.libraryItemId
        );
      }

      return this.success({
        entries: filteredEntries,
        total: filteredEntries.length,
      });
    } catch (error) {
      return this.handleError(error, "Failed to fetch journal entries");
    }
  }

  /**
   * Create a new journal entry.
   *
   * Business rules:
   * - Content is required (validated by Zod at action layer)
   * - Visibility defaults to PRIVATE if not provided
   * - Title, mood, and playSession are optional
   * - publishedAt is set automatically if visibility is PUBLIC
   *
   * @param input - Creation parameters
   * @returns ServiceResult with the created entry
   *
   * @example
   * ```typescript
   * // Create entry with minimal fields
   * const result = await service.createJournalEntry({
   *   userId: "user-123",
   *   gameId: "game-456",
   *   content: "Just started playing this game!"
   * });
   *
   * // Create entry with all fields
   * const result = await service.createJournalEntry({
   *   userId: "user-123",
   *   gameId: "game-456",
   *   libraryItemId: 789,
   *   title: "First Session",
   *   content: "Amazing graphics and gameplay!",
   *   mood: "EXCITED",
   *   playSession: 120,
   *   visibility: "PUBLIC"
   * });
   *
   * if (result.success) {
   *   console.log(result.data.entry);
   * }
   * ```
   */
  async createJournalEntry(
    input: CreateJournalEntryInput
  ): Promise<CreateJournalEntryResult> {
    try {
      const entry = await createJournalEntryRepo({
        userId: input.userId,
        gameId: input.gameId,
        libraryItemId: input.libraryItemId,
        title: input.title,
        content: input.content,
        mood: input.mood,
        playSession: input.playSession,
        visibility: input.visibility,
      });

      return this.success({
        entry,
        message: "Journal entry created successfully",
      });
    } catch (error) {
      return this.handleError(error, "Failed to create journal entry");
    }
  }

  /**
   * Update an existing journal entry.
   *
   * Business rules:
   * - Only the entry owner (userId) can update
   * - Repository validates ownership before updating
   * - At least one field should be provided for update
   * - publishedAt is set when making entry public for first time
   *
   * @param input - Update parameters
   * @returns ServiceResult with the updated entry
   *
   * @example
   * ```typescript
   * // Update content
   * const result = await service.updateJournalEntry({
   *   userId: "user-123",
   *   id: "entry-789",
   *   content: "Updated my thoughts after playing more"
   * });
   *
   * // Update mood and visibility
   * const result = await service.updateJournalEntry({
   *   userId: "user-123",
   *   id: "entry-789",
   *   mood: "FRUSTRATED",
   *   visibility: "PRIVATE"
   * });
   *
   * if (result.success) {
   *   console.log(result.data.entry);
   * }
   * ```
   */
  async updateJournalEntry(
    input: UpdateJournalEntryInput
  ): Promise<UpdateJournalEntryResult> {
    try {
      const entry = await updateJournalEntryRepo({
        id: input.id,
        userId: input.userId,
        title: input.title,
        content: input.content,
        mood: input.mood,
        playSession: input.playSession,
        visibility: input.visibility,
      });

      return this.success({
        entry,
        message: "Journal entry updated successfully",
      });
    } catch (error) {
      // Check for ownership/not found error
      if (
        error instanceof Error &&
        (error.message === "Journal entry not found" ||
          error.message === "Unauthorized to modify this journal entry")
      ) {
        return this.error(
          "Journal entry not found or you do not have permission to update it",
          ServiceErrorCode.UNAUTHORIZED
        );
      }

      return this.handleError(error, "Failed to update journal entry");
    }
  }

  /**
   * Delete a journal entry.
   *
   * Business rules:
   * - Only the entry owner (userId) can delete
   * - Repository validates ownership before deleting
   *
   * @param input - Delete parameters
   * @returns ServiceResult with success message
   *
   * @example
   * ```typescript
   * const result = await service.deleteJournalEntry({
   *   id: "entry-789",
   *   userId: "user-123"
   * });
   *
   * if (result.success) {
   *   console.log(result.data.message);
   * }
   * ```
   */
  async deleteJournalEntry(
    input: DeleteJournalEntryInput
  ): Promise<DeleteJournalEntryResult> {
    try {
      await deleteJournalEntryRepo(input.id, input.userId);

      return this.success({
        message: "Journal entry deleted successfully",
      });
    } catch (error) {
      // Check for ownership/not found error
      if (
        error instanceof Error &&
        (error.message === "Journal entry not found" ||
          error.message === "Unauthorized to delete this journal entry")
      ) {
        return this.error(
          "Journal entry not found or you do not have permission to delete it",
          ServiceErrorCode.UNAUTHORIZED
        );
      }

      return this.handleError(error, "Failed to delete journal entry");
    }
  }

  /**
   * Get journal statistics for a user.
   *
   * Calculates various statistics including:
   * - Total number of entries
   * - Total play time (sum of all playSession values)
   * - Mood distribution (count of each mood)
   * - Recent entries count (entries from last 30 days)
   *
   * @param input - User ID
   * @returns ServiceResult with statistics
   *
   * @example
   * ```typescript
   * const result = await service.getJournalStats({
   *   userId: "user-123"
   * });
   *
   * if (result.success) {
   *   console.log("Total entries:", result.data.stats.totalEntries);
   *   console.log("Total play time:", result.data.stats.totalPlayTime);
   *   console.log("Mood distribution:", result.data.stats.moodDistribution);
   *   console.log("Recent entries:", result.data.stats.recentEntries);
   * }
   * ```
   */
  async getJournalStats(
    input: GetJournalStatsInput
  ): Promise<GetJournalStatsResult> {
    try {
      const entries = await getJournalEntriesForUser(input.userId);

      // Calculate total play time
      const totalPlayTime = entries.reduce(
        (sum, entry) => sum + (entry.playSession ?? 0),
        0
      );

      // Calculate mood distribution
      const moodCounts: Record<string, number> = {};
      entries.forEach((entry) => {
        if (entry.mood) {
          moodCounts[entry.mood] = (moodCounts[entry.mood] ?? 0) + 1;
        }
      });

      const moodDistribution = Object.entries(moodCounts).map(
        ([mood, count]) => ({
          mood: mood as JournalMood,
          count,
        })
      );

      // Calculate recent entries (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const recentEntries = entries.filter(
        (entry) => entry.createdAt >= thirtyDaysAgo
      ).length;

      return this.success({
        stats: {
          totalEntries: entries.length,
          totalPlayTime,
          moodDistribution,
          recentEntries,
        },
      });
    } catch (error) {
      return this.handleError(error, "Failed to get journal statistics");
    }
  }
}

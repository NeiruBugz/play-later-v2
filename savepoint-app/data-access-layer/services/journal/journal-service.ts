import "server-only";

import {
  createJournalEntry as createJournalEntryRepo,
  deleteJournalEntry as deleteJournalEntryRepo,
  getJournalEntriesByGame,
  getJournalEntriesForUser,
  updateJournalEntry as updateJournalEntryRepo,
} from "@/data-access-layer/repository/journal/journal-repository";
import type { JournalMood } from "@prisma/client";

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

export class JournalService extends BaseService {
  async getJournalEntries(
    input: GetJournalEntriesInput
  ): Promise<GetJournalEntriesResult> {
    try {
      let entries;

      if (input.gameId) {
        entries = await getJournalEntriesByGame(input.gameId, {
          userId: input.userId,
          visibility: input.visibility,
        });
      } else {
        entries = await getJournalEntriesForUser(input.userId, {
          limit: input.limit,
          offset: input.offset,
        });
      }

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

  async deleteJournalEntry(
    input: DeleteJournalEntryInput
  ): Promise<DeleteJournalEntryResult> {
    try {
      await deleteJournalEntryRepo(input.id, input.userId);

      return this.success({
        message: "Journal entry deleted successfully",
      });
    } catch (error) {
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

  async getJournalStats(
    input: GetJournalStatsInput
  ): Promise<GetJournalStatsResult> {
    try {
      const entries = await getJournalEntriesForUser(input.userId);

      const totalPlayTime = entries.reduce(
        (sum, entry) => sum + (entry.playSession ?? 0),
        0
      );

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

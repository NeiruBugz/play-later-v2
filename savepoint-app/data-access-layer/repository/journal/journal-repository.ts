import "server-only";

import {
  repositoryError,
  RepositoryErrorCode,
  repositorySuccess,
  type RepositoryResult,
} from "@/data-access-layer/repository/types";
import type { JournalEntry } from "@prisma/client";

import { prisma } from "@/shared/lib";

/**
 * Find journal entries for a specific game by game ID
 * Returns entries in reverse chronological order (newest first)
 *
 * @param params - Object containing gameId, userId, and optional limit
 * @param params.gameId - The database ID of the game
 * @param params.userId - The user ID to filter entries
 * @param params.limit - Maximum number of entries to return (default: 3)
 * @returns Repository result containing array of journal entries
 */
export async function findJournalEntriesByGameId(params: {
  gameId: string;
  userId: string;
  limit?: number;
}): Promise<RepositoryResult<JournalEntry[]>> {
  try {
    const { gameId, userId, limit = 3 } = params;

    const entries = await prisma.journalEntry.findMany({
      where: {
        gameId,
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return repositorySuccess(entries);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to find journal entries: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Count total journal entries for a specific game
 *
 * @param params - Object containing gameId and userId
 * @param params.gameId - The database ID of the game
 * @param params.userId - The user ID to filter entries
 * @returns Repository result containing the count of journal entries
 */
export async function countJournalEntriesByGameId(params: {
  gameId: string;
  userId: string;
}): Promise<RepositoryResult<number>> {
  try {
    const count = await prisma.journalEntry.count({
      where: {
        gameId: params.gameId,
        userId: params.userId,
      },
    });

    return repositorySuccess(count);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to count journal entries: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

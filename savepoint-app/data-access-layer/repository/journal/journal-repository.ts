import "server-only";

import {
  repositoryError,
  RepositoryErrorCode,
  repositorySuccess,
  type RepositoryResult,
} from "@/data-access-layer/repository/types";
import type { JournalEntry } from "@prisma/client";

import { prisma } from "@/shared/lib/app/db";

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

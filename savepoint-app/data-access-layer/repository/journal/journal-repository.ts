import "server-only";

import {
  repositoryError,
  RepositoryErrorCode,
  repositorySuccess,
  type RepositoryResult,
} from "@/data-access-layer/repository/types";
import type { JournalEntry, JournalMood } from "@prisma/client";

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

export async function countJournalEntriesByUserId(
  userId: string
): Promise<RepositoryResult<number>> {
  try {
    const count = await prisma.journalEntry.count({
      where: { userId },
    });
    return repositorySuccess(count);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to count journal entries: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function createJournalEntry(params: {
  userId: string;
  gameId: string;
  title: string;
  content: string;
  mood?: JournalMood;
  playSession?: number;
  libraryItemId?: number;
}): Promise<RepositoryResult<JournalEntry>> {
  try {
    const created = await prisma.journalEntry.create({
      data: {
        userId: params.userId,
        gameId: params.gameId,
        title: params.title,
        content: params.content,
        mood: params.mood ?? null,
        playSession: params.playSession ?? null,
        libraryItemId: params.libraryItemId ?? null,
      },
    });
    return repositorySuccess(created);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to create journal entry: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function findJournalEntryById(params: {
  entryId: string;
  userId: string;
}): Promise<RepositoryResult<JournalEntry>> {
  try {
    const entry = await prisma.journalEntry.findFirst({
      where: {
        id: params.entryId,
        userId: params.userId,
      },
    });

    if (!entry) {
      return repositoryError(
        RepositoryErrorCode.NOT_FOUND,
        "Journal entry not found"
      );
    }

    return repositorySuccess(entry);
  } catch (error) {
    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to find journal entry: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function findJournalEntriesByUserId(params: {
  userId: string;
  limit: number;
  cursor?: string;
}): Promise<RepositoryResult<JournalEntry[]>> {
  try {
    const { userId, limit, cursor } = params;

    if (limit <= 0) {
      return repositorySuccess([]);
    }

    if (cursor) {
      const cursorEntry = await prisma.journalEntry.findUnique({
        where: { id: cursor },
        select: { updatedAt: true },
      });

      if (!cursorEntry) {
        return repositoryError(
          RepositoryErrorCode.NOT_FOUND,
          "Cursor entry not found"
        );
      }

      const entries = await prisma.journalEntry.findMany({
        where: {
          userId,
          updatedAt: { lt: cursorEntry.updatedAt },
        },
        orderBy: { updatedAt: "desc" },
        take: limit,
      });

      return repositorySuccess(entries);
    }

    const entries = await prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
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

export async function updateJournalEntry(params: {
  entryId: string;
  userId: string;
  updates: {
    title?: string;
    content?: string;
    mood?: JournalMood | null;
    playSession?: number | null;
    libraryItemId?: number | null;
  };
}): Promise<RepositoryResult<JournalEntry>> {
  try {
    const { entryId, userId, updates } = params;

    const updateData: Record<string, unknown> = {};

    if (updates.title !== undefined) {
      updateData.title = updates.title;
    }
    if (updates.content !== undefined) {
      updateData.content = updates.content;
    }
    if (updates.mood !== undefined) {
      updateData.mood = updates.mood;
    }
    if (updates.playSession !== undefined) {
      updateData.playSession = updates.playSession;
    }
    if (updates.libraryItemId !== undefined) {
      if (updates.libraryItemId === null) {
        updateData.libraryItem = { disconnect: true };
      } else {
        updateData.libraryItem = { connect: { id: updates.libraryItemId } };
      }
    }

    const entry = await prisma.journalEntry.update({
      where: {
        id: entryId,
        userId,
      },
      data: updateData,
    });

    return repositorySuccess(entry);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2025") {
        return repositoryError(
          RepositoryErrorCode.NOT_FOUND,
          "Journal entry not found"
        );
      }
    }

    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to update journal entry: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function deleteJournalEntry(params: {
  entryId: string;
  userId: string;
}): Promise<RepositoryResult<void>> {
  try {
    await prisma.journalEntry.delete({
      where: {
        id: params.entryId,
        userId: params.userId,
      },
    });

    return repositorySuccess(undefined);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      if (error.code === "P2025") {
        return repositoryError(
          RepositoryErrorCode.NOT_FOUND,
          "Journal entry not found"
        );
      }
    }

    return repositoryError(
      RepositoryErrorCode.DATABASE_ERROR,
      `Failed to delete journal entry: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

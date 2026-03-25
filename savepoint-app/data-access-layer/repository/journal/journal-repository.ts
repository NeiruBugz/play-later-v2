import "server-only";

import type { JournalEntry, JournalMood } from "@prisma/client";

import { prisma } from "@/shared/lib/app/db";

import { NotFoundError } from "../errors";

export async function findJournalEntriesByGameId(params: {
  gameId: string;
  userId: string;
  limit?: number;
}): Promise<JournalEntry[]> {
  const { gameId, userId, limit = 3 } = params;
  return prisma.journalEntry.findMany({
    where: { gameId, userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function countJournalEntriesByGameId(params: {
  gameId: string;
  userId: string;
}): Promise<number> {
  return prisma.journalEntry.count({
    where: { gameId: params.gameId, userId: params.userId },
  });
}

export async function countJournalEntriesByUserId(
  userId: string
): Promise<number> {
  return prisma.journalEntry.count({ where: { userId } });
}

export async function createJournalEntry(params: {
  userId: string;
  gameId: string;
  title?: string;
  content: string;
  mood?: JournalMood;
  playSession?: number;
  libraryItemId?: number;
}): Promise<JournalEntry> {
  return prisma.journalEntry.create({
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
}

export async function findJournalEntryById(params: {
  entryId: string;
  userId: string;
}): Promise<JournalEntry> {
  const entry = await prisma.journalEntry.findFirst({
    where: { id: params.entryId, userId: params.userId },
  });
  if (!entry) {
    throw new NotFoundError("Journal entry not found");
  }
  return entry;
}

export async function findJournalEntriesByUserId(params: {
  userId: string;
  limit: number;
  cursor?: string;
}): Promise<JournalEntry[]> {
  const { userId, limit, cursor } = params;

  if (limit <= 0) return [];

  if (cursor) {
    const cursorEntry = await prisma.journalEntry.findUnique({
      where: { id: cursor },
      select: { updatedAt: true },
    });
    if (!cursorEntry) {
      throw new NotFoundError("Cursor entry not found");
    }
    return prisma.journalEntry.findMany({
      where: { userId, updatedAt: { lt: cursorEntry.updatedAt } },
      orderBy: { updatedAt: "desc" },
      take: limit,
    });
  }

  return prisma.journalEntry.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
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
}): Promise<JournalEntry> {
  const { entryId, userId, updates } = params;

  const updateData: Record<string, unknown> = {};

  if (updates.title !== undefined) updateData.title = updates.title;
  if (updates.content !== undefined) updateData.content = updates.content;
  if (updates.mood !== undefined) updateData.mood = updates.mood;
  if (updates.playSession !== undefined)
    updateData.playSession = updates.playSession;
  if (updates.libraryItemId !== undefined) {
    if (updates.libraryItemId === null) {
      updateData.libraryItem = { disconnect: true };
    } else {
      updateData.libraryItem = { connect: { id: updates.libraryItemId } };
    }
  }

  try {
    return await prisma.journalEntry.update({
      where: { id: entryId, userId },
      data: updateData,
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      throw new NotFoundError("Journal entry not found");
    }
    throw error;
  }
}

export async function deleteJournalEntry(params: {
  entryId: string;
  userId: string;
}): Promise<void> {
  try {
    await prisma.journalEntry.delete({
      where: { id: params.entryId, userId: params.userId },
    });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2025"
    ) {
      throw new NotFoundError("Journal entry not found");
    }
    throw error;
  }
}

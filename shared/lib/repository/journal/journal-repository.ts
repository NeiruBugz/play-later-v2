import "server-only";

import type { JournalVisibility } from "@prisma/client";

import { prisma } from "@/shared/lib/db";

import type {
  CreateJournalEntryInput,
  JournalEntryWithRelations,
  UpdateJournalEntryInput,
} from "./types";

const journalEntryInclude = {
  game: true,
  libraryItem: true,
  user: true,
} as const;

export async function createJournalEntry(
  input: CreateJournalEntryInput
): Promise<JournalEntryWithRelations> {
  const visibility = input.visibility ?? "PRIVATE";
  const isPublic = visibility === "PUBLIC";

  return prisma.journalEntry.create({
    data: {
      userId: input.userId,
      gameId: input.gameId,
      libraryItemId: input.libraryItemId,
      title: input.title,
      content: input.content,
      mood: input.mood,
      playSession: input.playSession,
      visibility,
      isPublic,
      publishedAt: isPublic ? new Date() : null,
    },
    include: journalEntryInclude,
  });
}

export async function getJournalEntriesForUser(
  userId: string,
  options?: { limit?: number; offset?: number }
): Promise<JournalEntryWithRelations[]> {
  return prisma.journalEntry.findMany({
    where: {
      userId,
    },
    include: journalEntryInclude,
    orderBy: {
      createdAt: "desc",
    },
    take: options?.limit,
    skip: options?.offset,
  });
}

export async function getJournalEntriesByGame(
  gameId: string,
  options?: { userId?: string; visibility?: JournalVisibility }
): Promise<JournalEntryWithRelations[]> {
  return prisma.journalEntry.findMany({
    where: {
      gameId,
      ...(options?.userId && { userId: options.userId }),
      ...(options?.visibility && { visibility: options.visibility }),
    },
    include: journalEntryInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getJournalEntryById(
  id: string,
  userId?: string
): Promise<JournalEntryWithRelations | null> {
  const entry = await prisma.journalEntry.findUnique({
    where: { id },
    include: journalEntryInclude,
  });

  if (!entry) {
    return null;
  }

  // If userId is provided, verify ownership or public visibility
  if (userId !== undefined) {
    const isOwner = entry.userId === userId;
    const isPublic = entry.visibility === "PUBLIC";

    if (!isOwner && !isPublic) {
      return null;
    }
  }

  return entry;
}

export async function updateJournalEntry(
  input: UpdateJournalEntryInput
): Promise<JournalEntryWithRelations> {
  // First verify the entry exists and belongs to the user
  const existingEntry = await prisma.journalEntry.findUnique({
    where: {
      id: input.id,
    },
  });

  if (!existingEntry) {
    throw new Error("Journal entry not found");
  }

  if (existingEntry.userId !== input.userId) {
    throw new Error("Unauthorized to modify this journal entry");
  }

  // Prepare update data
  const updateData: {
    title?: string;
    content?: string;
    mood?: typeof input.mood;
    playSession?: number;
    visibility?: typeof input.visibility;
    isPublic?: boolean;
    publishedAt?: Date | null;
  } = {};

  if (input.title !== undefined) updateData.title = input.title;
  if (input.content !== undefined) updateData.content = input.content;
  if (input.mood !== undefined) updateData.mood = input.mood;
  if (input.playSession !== undefined)
    updateData.playSession = input.playSession;

  // Handle visibility change
  if (input.visibility !== undefined) {
    updateData.visibility = input.visibility;
    updateData.isPublic = input.visibility === "PUBLIC";
    // Set publishedAt when making public for the first time
    if (input.visibility === "PUBLIC" && !existingEntry.publishedAt) {
      updateData.publishedAt = new Date();
    }
    // Clear publishedAt when making private
    if (input.visibility === "PRIVATE") {
      updateData.publishedAt = null;
    }
  }

  return prisma.journalEntry.update({
    where: {
      id: input.id,
    },
    data: updateData,
    include: journalEntryInclude,
  });
}

export async function deleteJournalEntry(
  id: string,
  userId: string
): Promise<JournalEntryWithRelations> {
  // First verify the entry exists and belongs to the user
  const existingEntry = await prisma.journalEntry.findUnique({
    where: {
      id,
    },
  });

  if (!existingEntry) {
    throw new Error("Journal entry not found");
  }

  if (existingEntry.userId !== userId) {
    throw new Error("Unauthorized to delete this journal entry");
  }

  return prisma.journalEntry.delete({
    where: {
      id,
    },
    include: journalEntryInclude,
  });
}

export async function makeJournalEntryPublic(
  id: string,
  userId: string
): Promise<JournalEntryWithRelations> {
  // First verify the entry exists and belongs to the user
  const existingEntry = await prisma.journalEntry.findUnique({
    where: {
      id,
    },
  });

  if (!existingEntry) {
    throw new Error("Journal entry not found");
  }

  if (existingEntry.userId !== userId) {
    throw new Error("Unauthorized to modify this journal entry");
  }

  return prisma.journalEntry.update({
    where: {
      id,
    },
    data: {
      visibility: "PUBLIC",
      isPublic: true,
      publishedAt: existingEntry.publishedAt ?? new Date(),
    },
    include: journalEntryInclude,
  });
}

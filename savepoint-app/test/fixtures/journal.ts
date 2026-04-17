import {
  JournalEntryKind,
  JournalVisibility,
  type JournalEntry,
} from "@prisma/client";

export function createJournalEntryFixture(
  overrides?: Partial<JournalEntry>
): JournalEntry {
  return {
    id: "entry-1",
    userId: "user-1",
    gameId: "game-1",
    libraryItemId: null,
    kind: JournalEntryKind.REFLECTION,
    title: "Test Entry",
    content: "This is a test journal entry content.\nWith multiple lines.",
    playedMinutes: null,
    tags: [],
    mood: null,
    playSession: null,
    visibility: JournalVisibility.PRIVATE,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    publishedAt: null,
    ...overrides,
  };
}

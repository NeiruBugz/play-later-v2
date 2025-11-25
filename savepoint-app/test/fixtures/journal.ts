import {
  JournalVisibility,
  type JournalEntryDomain,
} from "@/data-access-layer/domain/journal";

export function createJournalEntryFixture(
  overrides?: Partial<JournalEntryDomain>
): JournalEntryDomain {
  return {
    id: "entry-1",
    userId: "user-1",
    gameId: "game-1",
    libraryItemId: null,
    title: "Test Entry",
    content: "This is a test journal entry content.\nWith multiple lines.",
    mood: null,
    playSession: null,
    visibility: JournalVisibility.PRIVATE,
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
    publishedAt: null,
    ...overrides,
  };
}

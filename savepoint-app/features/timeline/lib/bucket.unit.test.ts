import {
  JournalEntryKind,
  JournalVisibility,
  type JournalEntry,
} from "@prisma/client";

import { bucketEntriesByWeek, formatPlaytime, getWeekKey } from "./bucket";

function makeEntry(overrides: Partial<JournalEntry> = {}): JournalEntry {
  return {
    id: `entry-${Math.random().toString(36).slice(2)}`,
    userId: "user-1",
    gameId: "game-1",
    libraryItemId: null,
    kind: JournalEntryKind.QUICK,
    title: null,
    content: "",
    playedMinutes: null,
    tags: [],
    mood: null,
    playSession: null,
    visibility: JournalVisibility.PRIVATE,
    createdAt: new Date("2026-04-15T12:00:00Z"),
    updatedAt: new Date("2026-04-15T12:00:00Z"),
    publishedAt: null,
    ...overrides,
  };
}

describe("getWeekKey", () => {
  it("returns ISO week format YYYY-Www", () => {
    // 2026-04-15 is a Wednesday; ISO week 16
    expect(getWeekKey(new Date("2026-04-15T12:00:00Z"))).toBe("2026-W16");
  });

  it("groups a Monday and the following Sunday into the same ISO week", () => {
    const monday = new Date("2026-04-13T09:00:00Z");
    const sunday = new Date("2026-04-19T23:00:00Z");
    expect(getWeekKey(monday)).toBe(getWeekKey(sunday));
  });
});

describe("formatPlaytime", () => {
  it("renders minutes only when under an hour", () => {
    expect(formatPlaytime(0)).toBe("");
    expect(formatPlaytime(30)).toBe("30m");
  });

  it("renders whole hours when minutes divide evenly", () => {
    expect(formatPlaytime(60)).toBe("1h");
    expect(formatPlaytime(180)).toBe("3h");
  });

  it("renders hours and minutes when there is a remainder", () => {
    expect(formatPlaytime(95)).toBe("1h 35m");
  });
});

describe("bucketEntriesByWeek", () => {
  it("returns an empty array when there are no entries", () => {
    expect(bucketEntriesByWeek([])).toEqual([]);
  });

  it("compresses two QUICK entries for the same game in one week into a group", () => {
    const entries = [
      makeEntry({
        id: "a",
        kind: JournalEntryKind.QUICK,
        gameId: "game-1",
        playedMinutes: 30,
        createdAt: new Date("2026-04-13T10:00:00Z"),
      }),
      makeEntry({
        id: "b",
        kind: JournalEntryKind.QUICK,
        gameId: "game-1",
        playedMinutes: 45,
        createdAt: new Date("2026-04-15T20:00:00Z"),
      }),
    ];

    const weeks = bucketEntriesByWeek(entries);
    expect(weeks).toHaveLength(1);
    expect(weeks[0]!.items).toHaveLength(1);

    const item = weeks[0]!.items[0]!;
    expect(item.kind).toBe("quick-group");
    if (item.kind === "quick-group") {
      expect(item.entries).toHaveLength(2);
      expect(item.totalMinutes).toBe(75);
    }
  });

  it("keeps a singleton QUICK entry as a single item", () => {
    const entries = [
      makeEntry({
        id: "a",
        kind: JournalEntryKind.QUICK,
        gameId: "game-1",
        playedMinutes: 30,
        createdAt: new Date("2026-04-13T10:00:00Z"),
      }),
    ];

    const weeks = bucketEntriesByWeek(entries);
    expect(weeks).toHaveLength(1);
    expect(weeks[0]!.items[0]!.kind).toBe("single");
  });

  it("always renders REFLECTION entries as single items even when another QUICK entry shares the week", () => {
    const entries = [
      makeEntry({
        id: "reflection",
        kind: JournalEntryKind.REFLECTION,
        gameId: "game-1",
        content: "A long-form reflection.",
        createdAt: new Date("2026-04-13T10:00:00Z"),
      }),
      makeEntry({
        id: "quick-a",
        kind: JournalEntryKind.QUICK,
        gameId: "game-1",
        playedMinutes: 30,
        createdAt: new Date("2026-04-14T10:00:00Z"),
      }),
      makeEntry({
        id: "quick-b",
        kind: JournalEntryKind.QUICK,
        gameId: "game-1",
        playedMinutes: 45,
        createdAt: new Date("2026-04-15T10:00:00Z"),
      }),
    ];

    const weeks = bucketEntriesByWeek(entries);
    expect(weeks).toHaveLength(1);

    const items = weeks[0]!.items;
    const reflection = items.find(
      (i) => i.kind === "single" && i.entry.id === "reflection"
    );
    const group = items.find((i) => i.kind === "quick-group");

    expect(reflection).toBeDefined();
    expect(group).toBeDefined();
    if (group && group.kind === "quick-group") {
      expect(group.totalMinutes).toBe(75);
    }
  });

  it("groups entries into separate weeks when they span a week boundary", () => {
    const entries = [
      makeEntry({
        id: "old",
        kind: JournalEntryKind.QUICK,
        gameId: "game-1",
        playedMinutes: 30,
        createdAt: new Date("2026-04-06T10:00:00Z"),
      }),
      makeEntry({
        id: "new-a",
        kind: JournalEntryKind.QUICK,
        gameId: "game-1",
        playedMinutes: 30,
        createdAt: new Date("2026-04-13T10:00:00Z"),
      }),
      makeEntry({
        id: "new-b",
        kind: JournalEntryKind.QUICK,
        gameId: "game-1",
        playedMinutes: 30,
        createdAt: new Date("2026-04-14T10:00:00Z"),
      }),
    ];

    const weeks = bucketEntriesByWeek(entries);
    expect(weeks).toHaveLength(2);
  });
});

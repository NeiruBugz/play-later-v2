/**
 * Integration tests for updateJournalEntry (spec 026 slice 7): edits text and
 * time with the "content or time" rule, never moves createdAt.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getJournalTimeline } from "@/entities/journal-entry/api/get-journal.server";
import { updateJournalEntry } from "@/entities/journal-entry/api/update-journal-entry.server";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/shared/lib/errors";

import { createGame, createNote, createUser } from "../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("update-journal-entry");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await db.prisma.journalEntry.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
});

describe("given an existing note with a game", () => {
  it("then editing text and time updates both and keeps createdAt", async () => {
    const user = await createUser(db.prisma);
    const game = await createGame(db.prisma);
    const createdAt = new Date("2024-03-01T10:00:00.000Z");
    const note = await createNote(db.prisma, {
      userId: user.id,
      gameId: game.id,
      content: "old",
      playedMinutes: 30,
      createdAt,
    });

    const result = await updateJournalEntry(user.id, note.id, {
      content: "  new text ",
      playedMinutes: 90,
    });

    expect(result.content).toBe("new text");
    expect(result.playedMinutes).toBe(90);
    expect(result.createdAt).toEqual(createdAt);
    expect(result.updatedAt.getTime()).toBeGreaterThan(createdAt.getTime());
    expect(result.game?.id).toBe(game.id);
    expect(result).not.toHaveProperty("kind");
  });

  it("then an edited old note keeps its place in the timeline", async () => {
    const user = await createUser(db.prisma);
    const game = await createGame(db.prisma);
    const old = await createNote(db.prisma, {
      userId: user.id,
      gameId: game.id,
      createdAt: new Date("2024-01-01T10:00:00.000Z"),
    });
    const newer = await createNote(db.prisma, {
      userId: user.id,
      gameId: game.id,
      createdAt: new Date("2024-02-01T10:00:00.000Z"),
    });

    await updateJournalEntry(user.id, old.id, { content: "edited later" });

    const timeline = await getJournalTimeline(user.id);
    expect(timeline.map((e) => e.id)).toEqual([newer.id, old.id]);
  });

  it("then time can be cleared when text remains", async () => {
    const user = await createUser(db.prisma);
    const game = await createGame(db.prisma);
    const note = await createNote(db.prisma, {
      userId: user.id,
      gameId: game.id,
      content: "text",
      playedMinutes: 30,
    });

    const result = await updateJournalEntry(user.id, note.id, {
      playedMinutes: null,
    });

    expect(result.playedMinutes).toBeNull();
    expect(result.content).toBe("text");
  });

  it("then clearing the text of a time-only note is fine, clearing both is not", async () => {
    const user = await createUser(db.prisma);
    const game = await createGame(db.prisma);
    const note = await createNote(db.prisma, {
      userId: user.id,
      gameId: game.id,
      content: "",
      playedMinutes: 30,
    });

    await expect(
      updateJournalEntry(user.id, note.id, { playedMinutes: null })
    ).rejects.toBeInstanceOf(ValidationError);
    expect(
      (
        await db.prisma.journalEntry.findUniqueOrThrow({
          where: { id: note.id },
        })
      ).playedMinutes
    ).toBe(30);
  });

  it("then emptying the text of a text-only note is rejected", async () => {
    const user = await createUser(db.prisma);
    const note = await createNote(db.prisma, {
      userId: user.id,
      content: "only text",
    });

    await expect(
      updateJournalEntry(user.id, note.id, { content: "  " })
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("given a note without a game", () => {
  it("then adding time fails with TIME_NEEDS_GAME but text edits work", async () => {
    const user = await createUser(db.prisma);
    const note = await createNote(db.prisma, { userId: user.id, content: "x" });

    await expect(
      updateJournalEntry(user.id, note.id, { playedMinutes: 30 })
    ).rejects.toMatchObject({ context: { code: "TIME_NEEDS_GAME" } });

    const result = await updateJournalEntry(user.id, note.id, {
      content: "y",
    });
    expect(result.content).toBe("y");
  });
});

describe("given ownership", () => {
  it("then a missing note is NotFound and someone else's is Unauthorized", async () => {
    const owner = await createUser(db.prisma);
    const other = await createUser(db.prisma);
    const note = await createNote(db.prisma, { userId: owner.id });

    await expect(
      updateJournalEntry(owner.id, "missing", { content: "x" })
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(
      updateJournalEntry(other.id, note.id, { content: "x" })
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});

/**
 * Integration tests for the Log form's server half (spec 026 slice 7):
 * createJournalEntry rules and logTimeWorker's { noteId, offerMarkPlaying }.
 *
 * Imports the WORKER directly (FOOT-GUNS #8).
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createJournalEntry } from "@/entities/journal-entry/api/create-journal-entry.server";
import { logTimeWorker } from "@/features/compose-journal-entry/api/log-time-fn.worker";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/shared/lib/errors";

import {
  createGame,
  createLibraryItem,
  createPlay,
  createUser,
} from "../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("log-time");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await db.prisma.journalEntry.deleteMany();
  await db.prisma.playthrough.deleteMany();
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
});

describe("given a user logging time", () => {
  describe("when the game is a WANT game with no run and only minutes are given", () => {
    it("then the note saves, the game stays WANT and Mark as Playing is offered", async () => {
      const user = await createUser(db.prisma);
      const game = await createGame(db.prisma);
      const item = await createLibraryItem(db.prisma, {
        userId: user.id,
        gameId: game.id,
        status: "WANT",
      });

      const result = await logTimeWorker(user.id, {
        gameId: game.id,
        playedMinutes: 90,
      });

      const note = await db.prisma.journalEntry.findUniqueOrThrow({
        where: { id: result.noteId },
      });
      expect(note).toMatchObject({
        gameId: game.id,
        playedMinutes: 90,
        content: "",
        playthroughId: null,
      });
      expect(result.offerMarkPlaying).toBe(true);
      const after = await db.prisma.libraryItem.findUniqueOrThrow({
        where: { id: item.id },
      });
      expect(after.status).toBe("WANT");
      expect(await db.prisma.playthrough.count()).toBe(0);
    });
  });

  describe("when the game is PLAYING with an open play", () => {
    it("then the open play's playtime is incremented and no offer is made", async () => {
      const user = await createUser(db.prisma);
      const game = await createGame(db.prisma);
      const item = await createLibraryItem(db.prisma, {
        userId: user.id,
        gameId: game.id,
        status: "PLAYING",
        withOpenPlay: false,
      });
      const play = await createPlay(db.prisma, {
        libraryItemId: item.id,
        playtimeMinutes: 60,
      });

      const result = await logTimeWorker(user.id, {
        gameId: game.id,
        playedMinutes: 45,
      });

      const after = await db.prisma.playthrough.findUniqueOrThrow({
        where: { id: play.id },
      });
      expect(after.playtimeMinutes).toBe(105);
      const note = await db.prisma.journalEntry.findUniqueOrThrow({
        where: { id: result.noteId },
      });
      expect(note.playthroughId).toBe(play.id);
      expect(result.offerMarkPlaying).toBe(false);
    });
  });

  describe("when the note is text only on a WANT game", () => {
    it("then it saves and no offer is made", async () => {
      const user = await createUser(db.prisma);
      const game = await createGame(db.prisma);
      await createLibraryItem(db.prisma, { userId: user.id, gameId: game.id });

      const result = await logTimeWorker(user.id, {
        gameId: game.id,
        content: "  Looks great  ",
      });

      const note = await db.prisma.journalEntry.findUniqueOrThrow({
        where: { id: result.noteId },
      });
      expect(note.content).toBe("Looks great");
      expect(note.playedMinutes).toBeNull();
      expect(result.offerMarkPlaying).toBe(false);
    });
  });

  describe("when a text-only note has no game", () => {
    it("then it saves as a note without a game", async () => {
      const user = await createUser(db.prisma);

      const result = await logTimeWorker(user.id, {
        content: "Random thought",
      });

      const note = await db.prisma.journalEntry.findUniqueOrThrow({
        where: { id: result.noteId },
      });
      expect(note.gameId).toBeNull();
      expect(result.offerMarkPlaying).toBe(false);
    });
  });

  describe("when minutes are given without a game", () => {
    it("then it fails with TIME_NEEDS_GAME and saves nothing", async () => {
      const user = await createUser(db.prisma);

      const attempt = logTimeWorker(user.id, {
        content: "Some text",
        playedMinutes: 30,
      });

      await expect(attempt).rejects.toBeInstanceOf(ValidationError);
      await expect(attempt).rejects.toMatchObject({
        context: { code: "TIME_NEEDS_GAME" },
      });
      expect(await db.prisma.journalEntry.count()).toBe(0);
    });
  });

  describe("when the game is not in the user's library", () => {
    it("then it fails with NotFound, even for a text-only note", async () => {
      const user = await createUser(db.prisma);
      const game = await createGame(db.prisma);

      await expect(
        logTimeWorker(user.id, { gameId: game.id, playedMinutes: 30 })
      ).rejects.toBeInstanceOf(NotFoundError);
      await expect(
        logTimeWorker(user.id, { gameId: game.id, content: "hi" })
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("then another user's library item does not count", async () => {
      const user = await createUser(db.prisma);
      const other = await createUser(db.prisma);
      const game = await createGame(db.prisma);
      await createLibraryItem(db.prisma, { userId: other.id, gameId: game.id });

      await expect(
        logTimeWorker(user.id, { gameId: game.id, playedMinutes: 30 })
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("when there is neither text nor time", () => {
    it("then it fails validation", async () => {
      const user = await createUser(db.prisma);

      await expect(
        createJournalEntry(user.id, { content: "   " })
      ).rejects.toBeInstanceOf(ValidationError);
      await expect(logTimeWorker(user.id, {})).rejects.toBeInstanceOf(
        ValidationError
      );
    });
  });

  describe("when there is no session", () => {
    it("then it throws UnauthorizedError", async () => {
      await expect(
        logTimeWorker(undefined, { content: "x" })
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });

  describe("when a prompt is passed", () => {
    it("then it is stored and no kind, title or mood is written", async () => {
      const user = await createUser(db.prisma);
      const entry = await createJournalEntry(user.id, {
        content: "Because it is short",
        prompt: "WHY",
      });

      expect(entry.prompt).toBe("WHY");
      expect(entry).not.toHaveProperty("kind");
      expect(entry).not.toHaveProperty("title");
      expect(entry).not.toHaveProperty("mood");
      const row = await db.prisma.journalEntry.findUniqueOrThrow({
        where: { id: entry.id },
      });
      expect(row.title).toBeNull();
      expect(row.mood).toBeNull();
    });
  });
});

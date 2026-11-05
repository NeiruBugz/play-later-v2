import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  buildLibraryItem,
  buildLibraryItemWithGame,
  createGame,
  createLibraryItem,
  createNote,
  createPlay,
  createUser,
} from "../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("factories");
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

describe("given the db factories", () => {
  describe("when creating a library item with defaults", () => {
    it("then it is an owned WANT item with no plays", async () => {
      const user = await createUser(db.prisma);
      const game = await createGame(db.prisma);

      const item = await createLibraryItem(db.prisma, {
        userId: user.id,
        gameId: game.id,
      });

      expect(item.status).toBe("WANT");
      expect(item.isOwned).toBe(true);
      expect(item.upNextPosition).toBeNull();
      expect(item.doneOutcome).toBeNull();
      expect(await db.prisma.playthrough.count()).toBe(0);
    });
  });

  describe("when creating a PLAYING library item", () => {
    it("then it has exactly one open play", async () => {
      const user = await createUser(db.prisma);
      const game = await createGame(db.prisma);

      const item = await createLibraryItem(db.prisma, {
        userId: user.id,
        gameId: game.id,
        status: "PLAYING",
      });

      const plays = await db.prisma.playthrough.findMany({
        where: { libraryItemId: item.id },
      });
      expect(plays).toHaveLength(1);
      expect(plays[0]?.finishedAt).toBeNull();
    });

    it("then withOpenPlay false creates no play", async () => {
      const user = await createUser(db.prisma);
      const game = await createGame(db.prisma);

      const item = await createLibraryItem(db.prisma, {
        userId: user.id,
        gameId: game.id,
        status: "PLAYING",
        withOpenPlay: false,
      });

      expect(
        await db.prisma.playthrough.count({
          where: { libraryItemId: item.id },
        })
      ).toBe(0);
    });
  });

  describe("when creating a DONE item with an up-next slot and outcome", () => {
    it("then those fields are stored", async () => {
      const user = await createUser(db.prisma);
      const game = await createGame(db.prisma);

      const item = await createLibraryItem(db.prisma, {
        userId: user.id,
        gameId: game.id,
        status: "DONE",
        doneOutcome: "LET_GO",
        upNextPosition: 1,
      });

      expect(item.doneOutcome).toBe("LET_GO");
      expect(item.upNextPosition).toBe(1);
    });
  });

  describe("when creating plays for one library item", () => {
    it("then an ended play is finished and ordinals increase", async () => {
      const user = await createUser(db.prisma);
      const game = await createGame(db.prisma);
      const item = await createLibraryItem(db.prisma, {
        userId: user.id,
        gameId: game.id,
      });

      const ended = await createPlay(db.prisma, {
        libraryItemId: item.id,
        finishedAt: new Date("2025-02-01T00:00:00.000Z"),
        playtimeMinutes: 90,
      });
      const open = await createPlay(db.prisma, { libraryItemId: item.id });

      expect(ended.status).toBe("FINISHED");
      expect(ended.playtimeMinutes).toBe(90);
      expect(open.finishedAt).toBeNull();
      expect([ended.ordinal, open.ordinal]).toEqual([1, 2]);
    });
  });

  describe("when creating a note", () => {
    it("then it stores content, minutes, prompt, play link and createdAt", async () => {
      const user = await createUser(db.prisma);
      const game = await createGame(db.prisma);
      const item = await createLibraryItem(db.prisma, {
        userId: user.id,
        gameId: game.id,
        status: "PLAYING",
      });
      const play = await db.prisma.playthrough.findFirstOrThrow({
        where: { libraryItemId: item.id },
      });
      const createdAt = new Date("2025-03-01T00:00:00.000Z");

      const note = await createNote(db.prisma, {
        userId: user.id,
        gameId: game.id,
        playthroughId: play.id,
        content: "Great boss fight",
        playedMinutes: 45,
        prompt: "WHY",
        createdAt,
      });

      expect(note).toMatchObject({
        content: "Great boss fight",
        playedMinutes: 45,
        prompt: "WHY",
        playthroughId: play.id,
        createdAt,
      });
    });
  });
});

describe("given the plain builders", () => {
  describe("when building a library item with a game", () => {
    it("then overrides apply and the game id links the item", () => {
      const built = buildLibraryItemWithGame(
        { status: "PLAYING" },
        { title: "Hades" }
      );

      expect(built.status).toBe("PLAYING");
      expect(built.game.title).toBe("Hades");
      expect(built.gameId).toBe(built.game.id);
      expect(buildLibraryItem().id).not.toBe(buildLibraryItem().id);
    });
  });
});

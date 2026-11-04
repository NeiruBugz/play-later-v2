import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { setLibraryItemStatus } from "@/entities/library-item/api/set-library-item-status.server";
import { NotFoundError } from "@/shared/lib/errors";

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
  db = await setupIsolatedDatabase("set-library-item-status");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await db.prisma.playthrough.deleteMany();
  await db.prisma.journalEntry.deleteMany();
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
});

async function seedItem(
  userId: string,
  overrides: {
    status?: "WANT" | "PLAYING" | "DONE";
    upNextPosition?: number | null;
  } = {}
) {
  const game = await createGame(db.prisma);
  return createLibraryItem(db.prisma, {
    userId,
    gameId: game.id,
    withOpenPlay: false,
    ...overrides,
  });
}

const playsOf = (libraryItemId: number) =>
  db.prisma.playthrough.findMany({
    where: { libraryItemId },
    orderBy: { ordinal: "asc" },
  });

describe("setLibraryItemStatus", () => {
  describe("given a queued WANT game moved to PLAYING", () => {
    it("opens exactly one play, leaves the queue and compacts the positions above it", async () => {
      const user = await createUser(db.prisma);
      const first = await seedItem(user.id, { upNextPosition: 1 });
      const second = await seedItem(user.id, { upNextPosition: 2 });
      const third = await seedItem(user.id, { upNextPosition: 3 });
      const fourth = await seedItem(user.id, { upNextPosition: 4 });

      const { item, undo } = await setLibraryItemStatus(
        user.id,
        second.id,
        "PLAYING"
      );

      expect(item.status).toBe("PLAYING");
      expect(item.upNextPosition).toBeNull();
      expect(item.statusChangedAt).toBeInstanceOf(Date);

      const plays = await playsOf(second.id);
      expect(plays).toHaveLength(1);
      expect(plays[0]?.finishedAt).toBeNull();
      expect(plays[0]?.ordinal).toBe(1);
      expect(undo.createdPlayId).toBe(plays[0]?.id);

      const positions = await db.prisma.libraryItem.findMany({
        where: { userId: user.id, upNextPosition: { not: null } },
        orderBy: { upNextPosition: "asc" },
        select: { id: true, upNextPosition: true },
      });
      expect(positions).toEqual([
        { id: first.id, upNextPosition: 1 },
        { id: third.id, upNextPosition: 2 },
        { id: fourth.id, upNextPosition: 3 },
      ]);
    });
  });

  describe("given a PLAYING game moved to DONE", () => {
    it("closes the open play and reports it in the undo payload", async () => {
      const user = await createUser(db.prisma);
      const item = await seedItem(user.id, { status: "PLAYING" });
      const open = await createPlay(db.prisma, { libraryItemId: item.id });

      const result = await setLibraryItemStatus(user.id, item.id, "DONE");

      expect(result.item.status).toBe("DONE");
      const plays = await playsOf(item.id);
      expect(plays).toHaveLength(1);
      expect(plays[0]?.finishedAt).toBeInstanceOf(Date);
      expect(result.undo.closedPlayId).toBe(open.id);
      expect(result.undo.createdPlayId).toBeNull();
    });
  });

  describe("given a DONE game with one ended play moved back to PLAYING", () => {
    it("opens a new play so history is one ended and one open", async () => {
      const user = await createUser(db.prisma);
      const item = await seedItem(user.id, { status: "DONE" });
      await createPlay(db.prisma, {
        libraryItemId: item.id,
        finishedAt: new Date("2025-02-01T00:00:00.000Z"),
      });
      await setLibraryItemStatus(user.id, item.id, "PLAYING");
      await setLibraryItemStatus(user.id, item.id, "DONE");
      await setLibraryItemStatus(user.id, item.id, "PLAYING");

      const plays = await playsOf(item.id);
      expect(plays.map((p) => p.ordinal)).toEqual([1, 2, 3]);
      expect(plays.filter((p) => p.finishedAt !== null)).toHaveLength(2);
      expect(plays.filter((p) => p.finishedAt === null)).toHaveLength(1);
    });
  });

  describe("given the same status as the current one", () => {
    it("is a no-op that writes nothing", async () => {
      const user = await createUser(db.prisma);
      const item = await seedItem(user.id, { status: "PLAYING" });
      await createPlay(db.prisma, { libraryItemId: item.id });

      const result = await setLibraryItemStatus(user.id, item.id, "PLAYING");

      expect(result.undo.createdPlayId).toBeNull();
      expect(result.undo.closedPlayId).toBeNull();
      expect(result.item.statusChangedAt).toBeNull();
      expect(await playsOf(item.id)).toHaveLength(1);
    });
  });

  describe("given an item owned by someone else", () => {
    it("throws NotFoundError and changes nothing", async () => {
      const owner = await createUser(db.prisma);
      const stranger = await createUser(db.prisma);
      const item = await seedItem(owner.id);

      await expect(
        setLibraryItemStatus(stranger.id, item.id, "PLAYING")
      ).rejects.toBeInstanceOf(NotFoundError);

      const after = await db.prisma.libraryItem.findUniqueOrThrow({
        where: { id: item.id },
      });
      expect(after.status).toBe("WANT");
      expect(await playsOf(item.id)).toHaveLength(0);
    });
  });

  describe("undo payload", () => {
    it("snapshots the previous status, queue position, statusChangedAt and doneOutcome", async () => {
      const user = await createUser(db.prisma);
      const changedAt = new Date("2025-03-01T00:00:00.000Z");
      const game = await createGame(db.prisma);
      const item = await createLibraryItem(db.prisma, {
        userId: user.id,
        gameId: game.id,
        status: "WANT",
        upNextPosition: 2,
        statusChangedAt: changedAt,
        doneOutcome: "LET_GO",
      });

      const { undo } = await setLibraryItemStatus(user.id, item.id, "PLAYING");

      expect(undo.snapshot).toEqual({
        status: "WANT",
        upNextPosition: 2,
        statusChangedAt: changedAt,
        doneOutcome: "LET_GO",
      });
      expect(undo.closedPlayId).toBeNull();
      expect(undo.createdPlayId).not.toBeNull();
    });
  });
});

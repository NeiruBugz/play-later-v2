import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { restoreLibraryItem } from "@/entities/library-item/api/restore-library-item.server";
import { setLibraryItemStatus } from "@/entities/library-item/api/set-library-item-status.server";
import { undoStatusWorker } from "@/features/manage-library-entry/api/undo-status-fn.worker";
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
  db = await setupIsolatedDatabase("restore-library-item");
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

const EARLIER = new Date("2025-03-01T00:00:00.000Z");

async function seedItem(
  userId: string,
  overrides: {
    status?: "WANT" | "PLAYING" | "DONE";
    upNextPosition?: number | null;
    statusChangedAt?: Date | null;
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

const queueOf = async (userId: string) =>
  (
    await db.prisma.libraryItem.findMany({
      where: { userId, upNextPosition: { not: null } },
      orderBy: { upNextPosition: "asc" },
      select: { id: true, upNextPosition: true },
    })
  ).map((row) => [row.id, row.upNextPosition]);

describe("restoreLibraryItem", () => {
  describe("given a queued WANT game that was started and then undone", () => {
    it("returns to WANT, deletes the created play and takes its old queue place back", async () => {
      const user = await createUser(db.prisma);
      const first = await seedItem(user.id, { upNextPosition: 1 });
      const second = await seedItem(user.id, {
        upNextPosition: 2,
        statusChangedAt: EARLIER,
      });
      const third = await seedItem(user.id, { upNextPosition: 3 });

      const { undo } = await setLibraryItemStatus(
        user.id,
        second.id,
        "PLAYING"
      );
      const { item, queueRestored } = await restoreLibraryItem(
        user.id,
        second.id,
        undo
      );

      expect(item.status).toBe("WANT");
      expect(item.upNextPosition).toBe(2);
      expect(item.statusChangedAt).toEqual(EARLIER);
      expect(queueRestored).toBe(true);
      expect(await playsOf(second.id)).toHaveLength(0);
      expect(await queueOf(user.id)).toEqual([
        [first.id, 1],
        [second.id, 2],
        [third.id, 3],
      ]);
    });
  });

  describe("given a PLAYING game that was marked DONE and then undone", () => {
    it("returns to PLAYING with the closed play reopened as the only open play", async () => {
      const user = await createUser(db.prisma);
      const item = await seedItem(user.id, {
        status: "PLAYING",
        statusChangedAt: EARLIER,
      });
      const open = await createPlay(db.prisma, { libraryItemId: item.id });

      const { undo } = await setLibraryItemStatus(user.id, item.id, "DONE");
      const restored = await restoreLibraryItem(user.id, item.id, undo);

      expect(restored.item.status).toBe("PLAYING");
      expect(restored.item.statusChangedAt).toEqual(EARLIER);
      const plays = await playsOf(item.id);
      expect(plays).toHaveLength(1);
      expect(plays[0]?.id).toBe(open.id);
      expect(plays[0]?.finishedAt).toBeNull();
    });
  });

  describe("given a DONE game that was replayed and then undone", () => {
    it("returns to DONE and leaves no new play behind", async () => {
      const user = await createUser(db.prisma);
      const item = await seedItem(user.id, {
        status: "DONE",
        statusChangedAt: EARLIER,
      });
      await createPlay(db.prisma, {
        libraryItemId: item.id,
        finishedAt: new Date("2025-02-01T00:00:00.000Z"),
      });

      const { undo } = await setLibraryItemStatus(user.id, item.id, "PLAYING");
      const restored = await restoreLibraryItem(user.id, item.id, undo);

      expect(restored.item.status).toBe("DONE");
      expect(restored.item.statusChangedAt).toEqual(EARLIER);
      const plays = await playsOf(item.id);
      expect(plays).toHaveLength(1);
      expect(plays[0]?.finishedAt).not.toBeNull();
    });
  });

  describe("given the old queue place was taken and the queue is now full", () => {
    it("restores the status, leaves the game outside the queue and reports queueRestored=false", async () => {
      const user = await createUser(db.prisma);
      const started = await seedItem(user.id, { upNextPosition: 1 });
      for (const position of [2, 3, 4, 5]) {
        await seedItem(user.id, { upNextPosition: position });
      }
      const { undo } = await setLibraryItemStatus(
        user.id,
        started.id,
        "PLAYING"
      );
      await seedItem(user.id, { upNextPosition: 5 });

      const { item, queueRestored } = await restoreLibraryItem(
        user.id,
        started.id,
        undo
      );

      expect(item.status).toBe("WANT");
      expect(item.upNextPosition).toBeNull();
      expect(queueRestored).toBe(false);
      expect(await queueOf(user.id)).toHaveLength(5);
      expect(await playsOf(started.id)).toHaveLength(0);
    });
  });

  describe("given the queue has room when the undo arrives", () => {
    it("re-inserts at the old position and shifts later games down", async () => {
      const user = await createUser(db.prisma);
      const first = await seedItem(user.id, { upNextPosition: 1 });
      const second = await seedItem(user.id, { upNextPosition: 2 });
      const third = await seedItem(user.id, { upNextPosition: 3 });
      const { undo } = await setLibraryItemStatus(user.id, first.id, "PLAYING");
      const fresh = await seedItem(user.id, { upNextPosition: 3 });

      const { item, queueRestored } = await restoreLibraryItem(
        user.id,
        first.id,
        undo
      );

      expect(queueRestored).toBe(true);
      expect(item.upNextPosition).toBe(1);
      expect(await queueOf(user.id)).toEqual([
        [first.id, 1],
        [second.id, 2],
        [third.id, 3],
        [fresh.id, 4],
      ]);
    });
  });

  describe("given a game owned by another user", () => {
    it("throws NotFoundError and changes nothing", async () => {
      const owner = await createUser(db.prisma);
      const stranger = await createUser(db.prisma);
      const item = await seedItem(owner.id);
      const { undo } = await setLibraryItemStatus(owner.id, item.id, "PLAYING");

      await expect(
        restoreLibraryItem(stranger.id, item.id, undo)
      ).rejects.toBeInstanceOf(NotFoundError);

      const after = await db.prisma.libraryItem.findUniqueOrThrow({
        where: { id: item.id },
      });
      expect(after.status).toBe("PLAYING");
      expect(await playsOf(item.id)).toHaveLength(1);
    });
  });

  describe("given a tampered undo payload", () => {
    it("rejects a play id that belongs to another game and keeps that play", async () => {
      const user = await createUser(db.prisma);
      const item = await seedItem(user.id);
      const other = await seedItem(user.id, { status: "PLAYING" });
      const foreignPlay = await createPlay(db.prisma, {
        libraryItemId: other.id,
      });
      const { undo } = await setLibraryItemStatus(user.id, item.id, "PLAYING");

      await expect(
        restoreLibraryItem(user.id, item.id, {
          ...undo,
          createdPlayId: foreignPlay.id,
        })
      ).rejects.toBeInstanceOf(ValidationError);

      expect(await playsOf(other.id)).toHaveLength(1);
      expect(await playsOf(item.id)).toHaveLength(1);
    });

    it("clamps an out-of-range queue position into 1..5", async () => {
      const user = await createUser(db.prisma);
      for (const position of [1, 2, 3, 4]) {
        await seedItem(user.id, { upNextPosition: position });
      }
      const item = await seedItem(user.id);
      const { undo } = await setLibraryItemStatus(user.id, item.id, "PLAYING");

      const { item: restored, queueRestored } = await restoreLibraryItem(
        user.id,
        item.id,
        { ...undo, snapshot: { ...undo.snapshot, upNextPosition: 9 } }
      );

      expect(queueRestored).toBe(true);
      expect(restored.upNextPosition).toBe(5);
    });

    it("rejects an unknown status", async () => {
      const user = await createUser(db.prisma);
      const item = await seedItem(user.id);
      const { undo } = await setLibraryItemStatus(user.id, item.id, "PLAYING");

      await expect(
        restoreLibraryItem(user.id, item.id, {
          ...undo,
          snapshot: { ...undo.snapshot, status: "ARCHIVED" as "WANT" },
        })
      ).rejects.toBeInstanceOf(ValidationError);
    });
  });
});

describe("undoStatusWorker", () => {
  it("throws UnauthorizedError without a user id", async () => {
    await expect(
      undoStatusWorker(undefined, { id: 1, undo: {} })
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("returns the restored status, queue place and queueRestored flag", async () => {
    const user = await createUser(db.prisma);
    const item = await seedItem(user.id, { upNextPosition: 1 });
    const { undo } = await setLibraryItemStatus(user.id, item.id, "PLAYING");

    const result = await undoStatusWorker(user.id, { id: item.id, undo });

    expect(result).toEqual({
      status: "WANT",
      upNextPosition: 1,
      queueRestored: true,
    });
  });

  it("accepts an undo payload whose date arrived as an ISO string", async () => {
    const user = await createUser(db.prisma);
    const item = await seedItem(user.id, { statusChangedAt: EARLIER });
    const { undo } = await setLibraryItemStatus(user.id, item.id, "PLAYING");
    const overTheWire = JSON.parse(JSON.stringify(undo));

    await undoStatusWorker(user.id, { id: item.id, undo: overTheWire });

    const after = await db.prisma.libraryItem.findUniqueOrThrow({
      where: { id: item.id },
    });
    expect(after.statusChangedAt).toEqual(EARLIER);
  });
});

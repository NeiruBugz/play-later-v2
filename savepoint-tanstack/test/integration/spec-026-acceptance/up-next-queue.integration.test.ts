/**
 * @spec: 026-mindful-core-simplification
 * @regression
 *
 * Journey 2 - the Up Next queue across slices: fill, refuse the 6th, reorder,
 * start #1, Want <-> Done keeps the place, and undo after the place was taken.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { setOwnership } from "@/entities/library-item/api/set-ownership.server";
import { setRating } from "@/entities/library-item/api/set-rating.server";
import { getDashboardPageDataWorker } from "@/features/dashboard/api/get-dashboard-page-data.worker";
import { setStatusWorker } from "@/features/manage-library-entry/api/set-status-fn.worker";
import { undoStatusWorker } from "@/features/manage-library-entry/api/undo-status-fn.worker";
import { addToUpNextWorker } from "@/features/up-next/api/add-to-up-next-fn.worker";
import { moveInUpNextWorker } from "@/features/up-next/api/move-in-up-next-fn.worker";
import { removeFromUpNextWorker } from "@/features/up-next/api/remove-from-up-next-fn.worker";
import { ConflictError } from "@/shared/lib/errors";
import { getUserFacingErrorMessage } from "@/shared/lib/user-facing-error";

import {
  createGame,
  createLibraryItem,
  createUser,
} from "../../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../../setup/isolated-db.ts";
import { wipeAllTables } from "./support.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("spec-026-up-next-journey");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await wipeAllTables(db);
});

async function seedWant(userId: string, title: string) {
  const game = await createGame(db.prisma, { title });
  return createLibraryItem(db.prisma, {
    userId,
    gameId: game.id,
    status: "WANT",
  });
}

async function seedFullQueue() {
  const user = await createUser(db.prisma);
  const items = [];
  for (const title of ["A", "B", "C", "D", "E"]) {
    const item = await seedWant(user.id, title);
    await addToUpNextWorker(user.id, { id: item.id });
    items.push(item);
  }
  return { user, items };
}

async function queueAsShown(userId: string) {
  const rows = await db.prisma.libraryItem.findMany({
    where: { userId, upNextPosition: { not: null } },
    orderBy: { upNextPosition: "asc" },
    include: { game: { select: { title: true } } },
  });
  return rows.map((row) => `${row.upNextPosition}:${row.game.title}`);
}

describe("given a full queue of 5 (AC 2.4)", () => {
  it("refuses a 6th game with the Up Next holds 5 copy and leaves the queue untouched", async () => {
    const { user } = await seedFullQueue();
    const sixth = await seedWant(user.id, "F");

    const failure = await addToUpNextWorker(user.id, { id: sixth.id }).catch(
      (error: unknown) => error
    );

    // 2.4: "the game is not added and the user sees: 'Up Next holds 5 games. Remove one to add this.'"
    expect(failure).toBeInstanceOf(ConflictError);
    expect(getUserFacingErrorMessage(failure)).toBe(
      "Up Next holds 5 games. Remove one to add this."
    );
    expect(await queueAsShown(user.id)).toEqual([
      "1:A",
      "2:B",
      "3:C",
      "4:D",
      "5:E",
    ]);
  });

  it("numbers 1..5 in chosen order and keeps a reorder after reload", async () => {
    const { user, items } = await seedFullQueue();

    // 2.4: "Move up" swaps with its neighbour
    await moveInUpNextWorker(user.id, { id: items[2]!.id, direction: "up" });
    // 2.4: "Move down" swaps with its neighbour
    await moveInUpNextWorker(user.id, { id: items[0]!.id, direction: "down" });

    expect(await queueAsShown(user.id)).toEqual([
      "1:C",
      "2:A",
      "3:B",
      "4:D",
      "5:E",
    ]);
  });

  it("keeps the order when rating or ownership changes, and Home shows the whole queue", async () => {
    const { user, items } = await seedFullQueue();

    await setRating(user.id, items[1]!.id, 8);
    await setOwnership(user.id, items[1]!.id, false);

    // 2.4: editing another detail never reorders
    expect(await queueAsShown(user.id)).toEqual([
      "1:A",
      "2:B",
      "3:C",
      "4:D",
      "5:E",
    ]);
    // 2.4: Home shows the whole queue in queue order
    const home = await getDashboardPageDataWorker(user.id);
    expect(home.upNextQueue.map((item) => item.game.title)).toEqual([
      "A",
      "B",
      "C",
      "D",
      "E",
    ]);
    expect(home.upNextTotal).toBe(5);
  });

  it("removing from Up Next keeps the status and moves the games below up one place", async () => {
    const { user, items } = await seedFullQueue();

    await removeFromUpNextWorker(user.id, { id: items[1]!.id });

    // 2.4: "leaves the queue with its status unchanged, and the games below each move up one place"
    expect(await queueAsShown(user.id)).toEqual(["1:A", "2:C", "3:D", "4:E"]);
    const removed = await db.prisma.libraryItem.findUniqueOrThrow({
      where: { id: items[1]!.id },
    });
    expect(removed).toMatchObject({ status: "WANT", upNextPosition: null });
  });
});

describe("given the game at #1 is started (AC 2.4)", () => {
  it("shows Playing, leaves the queue and renumbers the rest from 1", async () => {
    const { user, items } = await seedFullQueue();

    const started = await setStatusWorker(user.id, {
      id: items[0]!.id,
      to: "PLAYING",
    });

    expect(started).toMatchObject({ status: "PLAYING", upNextPosition: null });
    expect(await queueAsShown(user.id)).toEqual(["1:B", "2:C", "3:D", "4:E"]);
  });
});

describe("given a queued game changes between Want and Done (AC 2.4)", () => {
  it("keeps its place both ways (Replay label is Done + queued)", async () => {
    const { user, items } = await seedFullQueue();

    const toDone = await setStatusWorker(user.id, {
      id: items[2]!.id,
      to: "DONE",
    });
    expect(toDone).toMatchObject({ status: "DONE", upNextPosition: 3 });

    const backToWant = await setStatusWorker(user.id, {
      id: items[2]!.id,
      to: "WANT",
    });
    expect(backToWant).toMatchObject({ status: "WANT", upNextPosition: 3 });
    expect(await queueAsShown(user.id)).toHaveLength(5);
  });
});

describe("given undo of Start playing (AC 2.3)", () => {
  it("puts the game back at its previous place when the queue has room", async () => {
    const { user, items } = await seedFullQueue();
    const started = await setStatusWorker(user.id, {
      id: items[1]!.id,
      to: "PLAYING",
    });

    const restored = await undoStatusWorker(user.id, {
      id: items[1]!.id,
      undo: started.undo,
    });

    expect(restored).toEqual({
      status: "WANT",
      upNextPosition: 2,
      queueRestored: true,
    });
    expect(await queueAsShown(user.id)).toEqual([
      "1:A",
      "2:B",
      "3:C",
      "4:D",
      "5:E",
    ]);
  });

  it("returns outside the queue with queueRestored false when its place was taken and the queue is full", async () => {
    const { user, items } = await seedFullQueue();
    const started = await setStatusWorker(user.id, {
      id: items[1]!.id,
      to: "PLAYING",
    });
    const newcomer = await seedWant(user.id, "F");
    await addToUpNextWorker(user.id, { id: newcomer.id });

    const restored = await undoStatusWorker(user.id, {
      id: items[1]!.id,
      undo: started.undo,
    });

    // 2.3: "returns to its previous status outside the queue" (UI shows the 'Up Next is full' copy)
    expect(restored).toEqual({
      status: "WANT",
      upNextPosition: null,
      queueRestored: false,
    });
    expect(await queueAsShown(user.id)).toHaveLength(5);
  });
});

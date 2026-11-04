import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { addGameToLibrary } from "@/entities/library-item/api/add-game-to-library.server";
import { addToUpNext } from "@/entities/library-item/api/add-to-up-next.server";
import { setLibraryItemStatus } from "@/entities/library-item/api/set-library-item-status.server";
import { undoAddGame } from "@/entities/library-item/api/undo-add-game.server";
import { addGameWorker } from "@/features/add-game/api/add-game.worker";
import { undoAddGameWorker } from "@/features/add-game/api/undo-add-game.worker";
import { ConflictError, NotFoundError } from "@/shared/lib/errors";

import {
  createGame,
  createLibraryItem,
  createNote,
  createUser,
} from "../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("add-game");
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

async function expectUndoUnavailable(userId: string, libraryItemId: number) {
  const error = await undoAddGame(userId, libraryItemId).then(
    () => null,
    (caught: unknown) => caught
  );
  expect(error).toBeInstanceOf(ConflictError);
  expect((error as ConflictError).context?.code).toBe("UNDO_ADD_UNAVAILABLE");
}

async function itemExists(id: number) {
  return (await db.prisma.libraryItem.count({ where: { id } })) === 1;
}

describe(addGameWorker, () => {
  it("adds a game as Want, then reports created false on the second add", async () => {
    const user = await createUser(db.prisma);
    const game = await createGame(db.prisma);

    const first = await addGameWorker(user.id, { igdbId: game.igdbId });
    const second = await addGameWorker(user.id, { igdbId: game.igdbId });

    expect(first).toMatchObject({
      created: true,
      status: "WANT",
      upNextPosition: null,
    });
    expect(second).toEqual({ ...first, created: false });
  });

  it("returns the existing status and queue position for an already-queued game", async () => {
    const user = await createUser(db.prisma);
    const game = await createGame(db.prisma);
    const queued = await createLibraryItem(db.prisma, {
      userId: user.id,
      gameId: game.id,
      status: "WANT",
      withOpenPlay: false,
    });
    await addToUpNext(user.id, queued.id);

    const result = await addGameWorker(user.id, { igdbId: game.igdbId });

    expect(result).toEqual({
      libraryItemId: queued.id,
      created: false,
      status: "WANT",
      upNextPosition: 1,
    });
  });

  it("rejects an invalid igdbId before touching the database", async () => {
    const user = await createUser(db.prisma);

    await expect(addGameWorker(user.id, { igdbId: -1 })).rejects.toThrow();
    expect(await db.prisma.libraryItem.count()).toBe(0);
  });
});

describe(undoAddGame, () => {
  it("deletes an item added moments ago", async () => {
    const user = await createUser(db.prisma);
    const game = await createGame(db.prisma);
    const { item } = await addGameToLibrary(user.id, game.id);

    await undoAddGame(user.id, item.id);

    expect(await itemExists(item.id)).toBe(false);
  });

  it("deletes the WHY note together with the item", async () => {
    const user = await createUser(db.prisma);
    const game = await createGame(db.prisma);
    const { item } = await addGameToLibrary(user.id, game.id);
    await createNote(db.prisma, {
      userId: user.id,
      gameId: game.id,
      libraryItemId: item.id,
      prompt: "WHY",
    });

    await undoAddGame(user.id, item.id);

    expect(await itemExists(item.id)).toBe(false);
    expect(await db.prisma.journalEntry.count()).toBe(0);
  });

  it("frees the queue place and closes the gap behind it", async () => {
    const user = await createUser(db.prisma);
    const [gameA, gameB] = [
      await createGame(db.prisma),
      await createGame(db.prisma),
    ];
    const { item: a } = await addGameToLibrary(user.id, gameA.id);
    const { item: b } = await addGameToLibrary(user.id, gameB.id);
    await addToUpNext(user.id, a.id);
    await addToUpNext(user.id, b.id);

    await undoAddGame(user.id, a.id);

    const remaining = await db.prisma.libraryItem.findUniqueOrThrow({
      where: { id: b.id },
    });
    expect(remaining.upNextPosition).toBe(1);
  });

  it("refuses a pre-existing item and leaves it in the library", async () => {
    const user = await createUser(db.prisma);
    const game = await createGame(db.prisma);
    const preExisting = await createLibraryItem(db.prisma, {
      userId: user.id,
      gameId: game.id,
      status: "WANT",
      withOpenPlay: false,
      createdAt: new Date("2025-01-01T00:00:00.000Z"),
    });

    await expectUndoUnavailable(user.id, preExisting.id);

    expect(await itemExists(preExisting.id)).toBe(true);
  });

  it("refuses once the 60 second window has passed", async () => {
    const user = await createUser(db.prisma);
    const game = await createGame(db.prisma);
    const { item } = await addGameToLibrary(user.id, game.id);
    await db.prisma.libraryItem.update({
      where: { id: item.id },
      data: { createdAt: new Date(Date.now() - 61_000) },
    });

    await expectUndoUnavailable(user.id, item.id);

    expect(await itemExists(item.id)).toBe(true);
  });

  it("refuses after the game gained a play", async () => {
    const user = await createUser(db.prisma);
    const game = await createGame(db.prisma);
    const { item } = await addGameToLibrary(user.id, game.id);
    await setLibraryItemStatus(user.id, item.id, "PLAYING");

    await expectUndoUnavailable(user.id, item.id);

    expect(await itemExists(item.id)).toBe(true);
  });

  it("refuses when a note other than WHY exists and keeps the WHY note", async () => {
    const user = await createUser(db.prisma);
    const game = await createGame(db.prisma);
    const { item } = await addGameToLibrary(user.id, game.id);
    await createNote(db.prisma, {
      userId: user.id,
      gameId: game.id,
      libraryItemId: item.id,
      prompt: "WHY",
    });
    await createNote(db.prisma, {
      userId: user.id,
      gameId: game.id,
      libraryItemId: item.id,
      prompt: null,
    });

    await expectUndoUnavailable(user.id, item.id);

    expect(await itemExists(item.id)).toBe(true);
    expect(await db.prisma.journalEntry.count()).toBe(2);
  });

  it("reports not found for a missing item and for another user's item", async () => {
    const owner = await createUser(db.prisma);
    const stranger = await createUser(db.prisma);
    const game = await createGame(db.prisma);
    const { item } = await addGameToLibrary(owner.id, game.id);

    await expect(undoAddGame(stranger.id, item.id)).rejects.toBeInstanceOf(
      NotFoundError
    );
    await expect(undoAddGame(owner.id, item.id + 999)).rejects.toBeInstanceOf(
      NotFoundError
    );
    expect(await itemExists(item.id)).toBe(true);
  });
});

describe(undoAddGameWorker, () => {
  it("undoes a fresh add and returns an empty object", async () => {
    const user = await createUser(db.prisma);
    const game = await createGame(db.prisma);
    const { libraryItemId } = await addGameWorker(user.id, {
      igdbId: game.igdbId,
    });

    const result = await undoAddGameWorker(user.id, { libraryItemId });

    expect(result).toEqual({});
    expect(await itemExists(libraryItemId)).toBe(false);
  });
});

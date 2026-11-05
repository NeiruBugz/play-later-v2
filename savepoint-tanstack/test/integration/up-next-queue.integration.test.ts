import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { setLibraryItemStatus } from "@/entities/library-item/api/set-library-item-status.server";
import { addToUpNextWorker } from "@/features/up-next/api/add-to-up-next-fn.worker";
import { moveInUpNextWorker } from "@/features/up-next/api/move-in-up-next-fn.worker";
import { removeFromUpNextWorker } from "@/features/up-next/api/remove-from-up-next-fn.worker";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/shared/lib/errors";

import {
  createGame,
  createLibraryItem,
  createUser,
} from "../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("up-next-queue");
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
    status: "WANT",
    ...overrides,
  });
}

async function seedQueue(userId: string, size: number) {
  const items = [];
  for (let position = 1; position <= size; position++) {
    items.push(await seedItem(userId, { upNextPosition: position }));
  }
  return items;
}

async function readQueueIds(userId: string): Promise<number[]> {
  const rows = await db.prisma.libraryItem.findMany({
    where: { userId, upNextPosition: { not: null } },
    orderBy: { upNextPosition: "asc" },
    select: { id: true },
  });
  return rows.map((row) => row.id);
}

describe("given no userId", () => {
  it("every worker throws UnauthorizedError", async () => {
    await expect(
      addToUpNextWorker(undefined, { id: 1 })
    ).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(
      removeFromUpNextWorker(undefined, { id: 1 })
    ).rejects.toBeInstanceOf(UnauthorizedError);
    await expect(
      moveInUpNextWorker(undefined, { id: 1, direction: "up" })
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});

describe(addToUpNextWorker, () => {
  it("appends each game at the bottom of the queue", async () => {
    const user = await createUser(db.prisma);
    const first = await seedItem(user.id);
    const second = await seedItem(user.id, { status: "DONE" });

    await expect(addToUpNextWorker(user.id, { id: first.id })).resolves.toEqual(
      {
        position: 1,
      }
    );
    await expect(
      addToUpNextWorker(user.id, { id: second.id })
    ).resolves.toEqual({ position: 2 });
  });

  it("throws ConflictError carrying UP_NEXT_FULL when 5 are queued", async () => {
    const user = await createUser(db.prisma);
    await seedQueue(user.id, 5);
    const extra = await seedItem(user.id);

    const failure = await addToUpNextWorker(user.id, { id: extra.id }).catch(
      (error: unknown) => error
    );

    expect(failure).toBeInstanceOf(ConflictError);
    expect((failure as ConflictError).context?.code).toBe("UP_NEXT_FULL");
    expect(await readQueueIds(user.id)).toHaveLength(5);
  });

  it("throws ValidationError for a Playing game", async () => {
    const user = await createUser(db.prisma);
    const playing = await seedItem(user.id, { status: "PLAYING" });

    await expect(
      addToUpNextWorker(user.id, { id: playing.id })
    ).rejects.toBeInstanceOf(ValidationError);
  });

  it("returns the current position when already queued", async () => {
    const user = await createUser(db.prisma);
    const [, second] = await seedQueue(user.id, 2);

    await expect(
      addToUpNextWorker(user.id, { id: second.id })
    ).resolves.toEqual({ position: 2 });
    expect(await readQueueIds(user.id)).toHaveLength(2);
  });

  it("throws NotFoundError for another user's game", async () => {
    const owner = await createUser(db.prisma);
    const stranger = await createUser(db.prisma);
    const item = await seedItem(owner.id);

    await expect(
      addToUpNextWorker(stranger.id, { id: item.id })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("lets exactly one of two concurrent adds take the last slot", async () => {
    const user = await createUser(db.prisma);
    await seedQueue(user.id, 4);
    const a = await seedItem(user.id);
    const b = await seedItem(user.id);

    const results = await Promise.allSettled([
      addToUpNextWorker(user.id, { id: a.id }),
      addToUpNextWorker(user.id, { id: b.id }),
    ]);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter(
      (r): r is PromiseRejectedResult => r.status === "rejected"
    );
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toBeInstanceOf(ConflictError);
    expect(rejected[0].reason.context?.code).toBe("UP_NEXT_FULL");
    expect(await readQueueIds(user.id)).toHaveLength(5);
  });
});

describe(removeFromUpNextWorker, () => {
  it("clears the position and moves later games up one", async () => {
    const user = await createUser(db.prisma);
    const [one, two, three, four] = await seedQueue(user.id, 4);

    await expect(
      removeFromUpNextWorker(user.id, { id: two.id })
    ).resolves.toEqual({ position: null });

    expect(await readQueueIds(user.id)).toEqual([one.id, three.id, four.id]);
    const positions = await db.prisma.libraryItem.findMany({
      where: { userId: user.id, upNextPosition: { not: null } },
      orderBy: { upNextPosition: "asc" },
      select: { upNextPosition: true },
    });
    expect(positions.map((row) => row.upNextPosition)).toEqual([1, 2, 3]);
  });

  it("is a no-op for a game that is not queued", async () => {
    const user = await createUser(db.prisma);
    const [one] = await seedQueue(user.id, 1);
    const loose = await seedItem(user.id);

    await expect(
      removeFromUpNextWorker(user.id, { id: loose.id })
    ).resolves.toEqual({ position: null });
    expect(await readQueueIds(user.id)).toEqual([one.id]);
  });

  it("throws NotFoundError for another user's game", async () => {
    const owner = await createUser(db.prisma);
    const stranger = await createUser(db.prisma);
    const [item] = await seedQueue(owner.id, 1);

    await expect(
      removeFromUpNextWorker(stranger.id, { id: item.id })
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe(moveInUpNextWorker, () => {
  it("swaps with the neighbour on move up and move down", async () => {
    const user = await createUser(db.prisma);
    const [one, two, three] = await seedQueue(user.id, 3);

    const afterUp = await moveInUpNextWorker(user.id, {
      id: two.id,
      direction: "up",
    });
    expect(afterUp).toEqual([
      { id: two.id, position: 1 },
      { id: one.id, position: 2 },
      { id: three.id, position: 3 },
    ]);

    const afterDown = await moveInUpNextWorker(user.id, {
      id: two.id,
      direction: "down",
    });
    expect(afterDown.map((entry) => entry.id)).toEqual([
      one.id,
      two.id,
      three.id,
    ]);
  });

  it("is a no-op moving the first up and the last down", async () => {
    const user = await createUser(db.prisma);
    const [one, two, three] = await seedQueue(user.id, 3);
    const ids = [one.id, two.id, three.id];

    const up = await moveInUpNextWorker(user.id, {
      id: one.id,
      direction: "up",
    });
    const down = await moveInUpNextWorker(user.id, {
      id: three.id,
      direction: "down",
    });

    expect(up.map((entry) => entry.id)).toEqual(ids);
    expect(down.map((entry) => entry.id)).toEqual(ids);
  });

  it("inserts at toPosition shifting the games in between", async () => {
    const user = await createUser(db.prisma);
    const [one, two, three, four, five] = await seedQueue(user.id, 5);

    const toTop = await moveInUpNextWorker(user.id, {
      id: four.id,
      toPosition: 1,
    });
    expect(toTop.map((entry) => entry.id)).toEqual([
      four.id,
      one.id,
      two.id,
      three.id,
      five.id,
    ]);

    const toBottom = await moveInUpNextWorker(user.id, {
      id: four.id,
      toPosition: 5,
    });
    expect(toBottom).toEqual([
      { id: one.id, position: 1 },
      { id: two.id, position: 2 },
      { id: three.id, position: 3 },
      { id: five.id, position: 4 },
      { id: four.id, position: 5 },
    ]);
  });

  it("throws NotFoundError for another user's game", async () => {
    const owner = await createUser(db.prisma);
    const stranger = await createUser(db.prisma);
    const [item] = await seedQueue(owner.id, 2);

    await expect(
      moveInUpNextWorker(stranger.id, { id: item.id, direction: "down" })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws ValidationError when the game is not queued", async () => {
    const user = await createUser(db.prisma);
    const loose = await seedItem(user.id);

    await expect(
      moveInUpNextWorker(user.id, { id: loose.id, direction: "up" })
    ).rejects.toBeInstanceOf(ValidationError);
  });
});

describe("interplay with the status core", () => {
  it("leaves the queue when a queued game becomes Playing and renumbers the rest", async () => {
    const user = await createUser(db.prisma);
    const [one, two, three] = await seedQueue(user.id, 3);

    await setLibraryItemStatus(user.id, one.id, "PLAYING");

    expect(await readQueueIds(user.id)).toEqual([two.id, three.id]);
    const moved = await db.prisma.libraryItem.findUniqueOrThrow({
      where: { id: two.id },
    });
    expect(moved.upNextPosition).toBe(1);
  });

  it("keeps the place when a queued game flips between Want and Done", async () => {
    const user = await createUser(db.prisma);
    const [, two] = await seedQueue(user.id, 3);

    await setLibraryItemStatus(user.id, two.id, "DONE");
    const done = await db.prisma.libraryItem.findUniqueOrThrow({
      where: { id: two.id },
    });
    expect(done).toMatchObject({ status: "DONE", upNextPosition: 2 });

    await setLibraryItemStatus(user.id, two.id, "WANT");
    const want = await db.prisma.libraryItem.findUniqueOrThrow({
      where: { id: two.id },
    });
    expect(want).toMatchObject({ status: "WANT", upNextPosition: 2 });
  });
});

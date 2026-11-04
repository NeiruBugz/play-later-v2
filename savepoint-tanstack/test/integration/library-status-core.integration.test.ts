import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getLibraryItemsByIgdbIds } from "@/entities/library-item/api/get-library-items-by-igdb-ids.server";
import { getLibraryStats } from "@/entities/library-item/api/get-library-stats.server";
import { getLibraryStatusCounts } from "@/entities/library-item/api/get-library-status-counts.server";
import { getLibrary } from "@/entities/library-item/api/get-library.server";
import { createPlaythrough } from "@/entities/playthrough/api/create-playthrough.server";
import { deletePlaythrough } from "@/entities/playthrough/api/delete-playthrough.server";
import { updatePlaythrough } from "@/entities/playthrough/api/update-playthrough.server";

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
  db = await setupIsolatedDatabase("library-status-core");
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
  status: "WANT" | "PLAYING" | "DONE",
  extra: { upNextPosition?: number } = {}
) {
  const game = await createGame(db.prisma);
  const item = await createLibraryItem(db.prisma, {
    userId,
    gameId: game.id,
    status,
    ...extra,
  });
  return { item, game };
}

describe("a status only changes when the user changes it", () => {
  it("keeps the item status when a run is created, updated and deleted", async () => {
    const user = await createUser(db.prisma);
    const { item } = await seedItem(user.id, "WANT");
    const statusOf = async () =>
      (
        await db.prisma.libraryItem.findUniqueOrThrow({
          where: { id: item.id },
        })
      ).status;

    const run = await createPlaythrough(user.id, {
      libraryItemId: item.id,
      status: "FINISHED",
      finishedAt: new Date("2025-02-01T00:00:00.000Z"),
    });
    expect(await statusOf()).toBe("WANT");

    await updatePlaythrough(user.id, { id: run.id, status: "ABANDONED" });
    expect(await statusOf()).toBe("WANT");

    await deletePlaythrough(user.id, run.id);
    expect(await statusOf()).toBe("WANT");
  });
});

describe("library reads on the three statuses", () => {
  it("getLibrary filters by status", async () => {
    const user = await createUser(db.prisma);
    await seedItem(user.id, "WANT");
    await seedItem(user.id, "PLAYING");
    await seedItem(user.id, "DONE");
    await seedItem(user.id, "DONE");

    const done = await getLibrary(user.id, { status: "DONE" });
    expect(done.total).toBe(2);
    expect(done.items.every((i) => i.status === "DONE")).toBe(true);

    const all = await getLibrary(user.id, {});
    expect(all.total).toBe(4);
  });

  it("getLibraryStatusCounts returns WANT, PLAYING and DONE with zeros", async () => {
    const user = await createUser(db.prisma);
    await seedItem(user.id, "WANT");
    await seedItem(user.id, "WANT");
    await seedItem(user.id, "PLAYING");

    expect(await getLibraryStatusCounts(user.id)).toEqual({
      WANT: 2,
      PLAYING: 1,
      DONE: 0,
    });
  });

  it("getLibraryStats returns want, playing and done counts", async () => {
    const user = await createUser(db.prisma);
    await seedItem(user.id, "WANT");
    await seedItem(user.id, "PLAYING");
    await seedItem(user.id, "DONE");
    await seedItem(user.id, "DONE");

    const stats = await getLibraryStats(user.id);
    expect(stats).toMatchObject({ want: 1, playing: 1, done: 2 });
    expect(stats.recentGames).toHaveLength(1);
    expect(stats).not.toHaveProperty("completedCount");
  });

  it("getLibraryItemsByIgdbIds returns status and upNextPosition", async () => {
    const user = await createUser(db.prisma);
    const { game } = await seedItem(user.id, "WANT", { upNextPosition: 3 });

    const result = await getLibraryItemsByIgdbIds(user.id, [game.igdbId]);

    expect(result.get(game.igdbId)).toEqual({
      status: "WANT",
      upNextPosition: 3,
      rating: null,
    });
  });
});

describe("a play row never changes status by itself", () => {
  it("leaves a PLAYING item PLAYING when its play row is edited", async () => {
    const user = await createUser(db.prisma);
    const { item } = await seedItem(user.id, "PLAYING");
    const play = await db.prisma.playthrough.findFirstOrThrow({
      where: { libraryItemId: item.id },
    });
    await updatePlaythrough(user.id, {
      id: play.id,
      finishedAt: new Date("2025-02-01T00:00:00.000Z"),
    });
    const after = await db.prisma.libraryItem.findUniqueOrThrow({
      where: { id: item.id },
    });
    expect(after.status).toBe("PLAYING");
  });
});

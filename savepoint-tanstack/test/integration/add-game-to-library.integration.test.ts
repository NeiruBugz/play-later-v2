/**
 * Integration tests for addGameToLibrary (real Prisma, isolated DB).
 *
 * Contract: creates a WANT, owned item and returns `{ item, created }`. A
 * second add for the same (userId, gameId) returns the existing item with
 * `created: false`; the unique constraint is the only duplicate guard, so a
 * concurrent double add still yields one row.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { addGameToLibrary } from "@/entities/library-item/api/add-game-to-library.server";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

// ---------------------------------------------------------------------------
// Isolated DB
// ---------------------------------------------------------------------------

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("add-game-to-library");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const IGDB_ID_EXISTING = 76340;

function makeUser(suffix: string) {
  return {
    id: `atl-user-${suffix}`,
    email: `atl-${suffix}@example.com`,
    name: `ATL User ${suffix}`,
    emailVerified: true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeGame(igdbId: number, suffix: string) {
  return {
    id: `atl-game-${suffix}`,
    igdbId,
    title: `ATL Game ${suffix}`,
    slug: `atl-game-${suffix}`,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("addGameToLibrary", () => {
  let seededGame: { id: string };

  beforeEach(async () => {
    await db.prisma.user.create({ data: makeUser("alice") });
    await db.prisma.user.create({ data: makeUser("bob") });
    seededGame = await db.prisma.game.create({
      data: makeGame(IGDB_ID_EXISTING, "existing"),
    });
  });

  it("creates an owned WANT item for the caller and reports created", async () => {
    const { item, created } = await addGameToLibrary(
      "atl-user-alice",
      seededGame.id
    );

    expect(created).toBe(true);
    expect(item).toMatchObject({
      userId: "atl-user-alice",
      gameId: seededGame.id,
      status: "WANT",
      isOwned: true,
      platform: null,
      acquisitionType: "DIGITAL",
    });
  });

  it("stores the platform when one is given", async () => {
    const { item } = await addGameToLibrary("atl-user-alice", seededGame.id, {
      platform: "PC",
    });

    expect(item.platform).toBe("PC");
  });

  it("returns the same item with created false on a second add", async () => {
    const first = await addGameToLibrary("atl-user-alice", seededGame.id);
    const second = await addGameToLibrary("atl-user-alice", seededGame.id);

    expect(first.created).toBe(true);
    expect(second.created).toBe(false);
    expect(second.item.id).toBe(first.item.id);
  });

  it("returns the existing item untouched, keeping its status", async () => {
    const first = await addGameToLibrary("atl-user-alice", seededGame.id);
    await db.prisma.libraryItem.update({
      where: { id: first.item.id },
      data: { status: "DONE" },
    });

    const second = await addGameToLibrary("atl-user-alice", seededGame.id);

    expect(second.created).toBe(false);
    expect(second.item.status).toBe("DONE");
  });

  it("creates one row when the same add runs concurrently", async () => {
    const results = await Promise.all([
      addGameToLibrary("atl-user-alice", seededGame.id),
      addGameToLibrary("atl-user-alice", seededGame.id),
      addGameToLibrary("atl-user-alice", seededGame.id),
    ]);

    expect(results.filter((result) => result.created)).toHaveLength(1);
    expect(new Set(results.map((result) => result.item.id)).size).toBe(1);
    expect(
      await db.prisma.libraryItem.count({ where: { userId: "atl-user-alice" } })
    ).toBe(1);
  });

  it("gives each user their own item for the same game", async () => {
    const alice = await addGameToLibrary("atl-user-alice", seededGame.id);
    const bob = await addGameToLibrary("atl-user-bob", seededGame.id);

    expect(alice.created).toBe(true);
    expect(bob.created).toBe(true);
    expect(alice.item.id).not.toBe(bob.item.id);
  });
});

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

// This import will fail until the GREEN task creates the file.
// That is the canonical RED state for this TDD slice.
import { getLibrary } from "@/entities/library-item/api/get-library.server";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-library");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  // Clean in reverse-FK order to avoid constraint violations.
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
});

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

let _gameCounter = 10_100;
let _itemCounter = 2_001;

function makeUser(suffix: string) {
  return {
    id: `lib-user-${suffix}`,
    email: `lib-${suffix}@example.com`,
    name: `Library User ${suffix}`,
    emailVerified: true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeGame(
  suffix: string,
  overrides: {
    title?: string;
    releaseDate?: Date | null;
  } = {}
) {
  return {
    id: `lib-game-${suffix}`,
    igdbId: _gameCounter++,
    title: overrides.title ?? `Library Game ${suffix}`,
    slug: `library-game-${suffix}`,
    releaseDate: overrides.releaseDate ?? null,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

type Status = "WISHLIST" | "SHELF" | "UP_NEXT" | "PLAYING" | "PLAYED";

type Acquisition = "DIGITAL" | "SUBSCRIPTION" | "PHYSICAL";

function makeLibraryItem(
  userId: string,
  gameId: string,
  overrides: {
    status?: Status;
    platform?: string;
    rating?: number | null;
    acquisitionType?: Acquisition;
    hasBeenPlayed?: boolean;
    startedAt?: Date | null;
    completedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
  } = {}
) {
  return {
    id: _itemCounter++,
    userId,
    gameId,
    status: overrides.status ?? ("SHELF" as Status),
    acquisitionType: overrides.acquisitionType ?? ("DIGITAL" as const),
    hasBeenPlayed: overrides.hasBeenPlayed ?? false,
    startedAt: overrides.startedAt ?? null,
    completedAt: overrides.completedAt ?? null,
    platform: overrides.platform ?? null,
    rating: overrides.rating ?? null,
    createdAt: overrides.createdAt ?? new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: overrides.updatedAt ?? new Date("2024-01-01T00:00:00.000Z"),
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("getLibrary", () => {
  // -------------------------------------------------------------------------
  // No-filter baseline
  // -------------------------------------------------------------------------

  describe("given a user has no library items", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("empty") });
    });

    it("returns an empty list", async () => {
      const result = await getLibrary("lib-user-empty", {});

      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe("given a user has library items", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("all") });
      await Promise.all([
        db.prisma.game.create({
          data: makeGame("a1", { title: "Alpha Game" }),
        }),
        db.prisma.game.create({ data: makeGame("a2", { title: "Beta Game" }) }),
        db.prisma.game.create({
          data: makeGame("a3", { title: "Gamma Game" }),
        }),
      ]);
      await db.prisma.libraryItem.createMany({
        data: [
          makeLibraryItem("lib-user-all", "lib-game-a1", {
            status: "PLAYING",
            platform: "PC",
          }),
          makeLibraryItem("lib-user-all", "lib-game-a2", {
            status: "PLAYED",
            platform: "PlayStation 5",
          }),
          makeLibraryItem("lib-user-all", "lib-game-a3", {
            status: "WISHLIST",
          }),
        ],
      });
    });

    it("returns all items when no filter is supplied", async () => {
      const result = await getLibrary("lib-user-all", {});

      expect(result.total).toBe(3);
      expect(result.items).toHaveLength(3);
      expect(result.items.every((item) => item.userId === "lib-user-all")).toBe(
        true
      );
    });
  });

  // -------------------------------------------------------------------------
  // Status filter — each value individually
  // -------------------------------------------------------------------------

  describe("status filter", () => {
    const statuses: Status[] = [
      "WISHLIST",
      "SHELF",
      "UP_NEXT",
      "PLAYING",
      "PLAYED",
    ];

    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("status") });
      // One game and one library item per status.
      for (const [i, status] of statuses.entries()) {
        const gameSuffix = `s${i}`;
        await db.prisma.game.create({
          data: makeGame(gameSuffix, { title: `Status Game ${status}` }),
        });
        await db.prisma.libraryItem.create({
          data: makeLibraryItem("lib-user-status", `lib-game-${gameSuffix}`, {
            status,
          }),
        });
      }
    });

    for (const status of statuses) {
      it(`returns only ${status} items when status filter is "${status}"`, async () => {
        const result = await getLibrary("lib-user-status", { status });

        expect(result.items.length).toBeGreaterThan(0);
        expect(result.items.every((item) => item.status === status)).toBe(true);
        expect(result.total).toBe(result.items.length);
      });
    }

    it("returns all items when no status filter is applied", async () => {
      const result = await getLibrary("lib-user-status", {});

      expect(result.total).toBe(statuses.length);
    });
  });

  // -------------------------------------------------------------------------
  // Platform filter
  // -------------------------------------------------------------------------

  describe("platform filter", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("platform") });
      await Promise.all([
        db.prisma.game.create({ data: makeGame("p1", { title: "PC Game A" }) }),
        db.prisma.game.create({ data: makeGame("p2", { title: "PC Game B" }) }),
        db.prisma.game.create({
          data: makeGame("p3", { title: "PS5 Game A" }),
        }),
        db.prisma.game.create({
          data: makeGame("p4", { title: "No Platform Game" }),
        }),
      ]);
      await db.prisma.libraryItem.createMany({
        data: [
          makeLibraryItem("lib-user-platform", "lib-game-p1", {
            platform: "PC",
          }),
          makeLibraryItem("lib-user-platform", "lib-game-p2", {
            platform: "PC",
          }),
          makeLibraryItem("lib-user-platform", "lib-game-p3", {
            platform: "PlayStation 5",
          }),
          makeLibraryItem("lib-user-platform", "lib-game-p4"),
        ],
      });
    });

    it("returns only items matching the specified platform", async () => {
      const result = await getLibrary("lib-user-platform", {
        platform: "PC",
      });

      expect(result.items).toHaveLength(2);
      expect(result.items.every((item) => item.platform === "PC")).toBe(true);
    });

    it("returns only PS5 items when platform is PlayStation 5", async () => {
      const result = await getLibrary("lib-user-platform", {
        platform: "PlayStation 5",
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.platform).toBe("PlayStation 5");
    });

    it("returns all items when no platform filter is applied", async () => {
      const result = await getLibrary("lib-user-platform", {});

      expect(result.total).toBe(4);
    });
  });

  // -------------------------------------------------------------------------
  // Rating filter (minimum rating)
  // -------------------------------------------------------------------------

  describe("rating filter", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("rating") });
      await Promise.all([
        db.prisma.game.create({
          data: makeGame("r1", { title: "Rating 9 Game" }),
        }),
        db.prisma.game.create({
          data: makeGame("r2", { title: "Rating 7 Game" }),
        }),
        db.prisma.game.create({
          data: makeGame("r3", { title: "Rating 4 Game" }),
        }),
        db.prisma.game.create({
          data: makeGame("r4", { title: "Unrated Game" }),
        }),
      ]);
      await db.prisma.libraryItem.createMany({
        data: [
          makeLibraryItem("lib-user-rating", "lib-game-r1", { rating: 9 }),
          makeLibraryItem("lib-user-rating", "lib-game-r2", { rating: 7 }),
          makeLibraryItem("lib-user-rating", "lib-game-r3", { rating: 4 }),
          makeLibraryItem("lib-user-rating", "lib-game-r4"),
        ],
      });
    });

    it("returns only items with rating >= minRating", async () => {
      const result = await getLibrary("lib-user-rating", { minRating: 7 });

      expect(result.items).toHaveLength(2);
      expect(result.items.every((item) => (item.rating ?? 0) >= 7)).toBe(true);
    });

    it("returns all rated and unrated items when no rating filter is applied", async () => {
      const result = await getLibrary("lib-user-rating", {});

      expect(result.total).toBe(4);
    });

    it("returns an empty list when minRating exceeds all ratings", async () => {
      const result = await getLibrary("lib-user-rating", { minRating: 10 });

      // Only items with rating exactly 10 should appear; none exist here.
      expect(result.items.every((item) => (item.rating ?? 0) >= 10)).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Acquisition filter (F03)
  // -------------------------------------------------------------------------

  describe("acquisition filter", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("acq") });
      await Promise.all([
        db.prisma.game.create({ data: makeGame("acq1", { title: "Owned A" }) }),
        db.prisma.game.create({ data: makeGame("acq2", { title: "Owned B" }) }),
        db.prisma.game.create({ data: makeGame("acq3", { title: "Sub A" }) }),
        db.prisma.game.create({
          data: makeGame("acq4", { title: "Physical A" }),
        }),
      ]);
      await db.prisma.libraryItem.createMany({
        data: [
          makeLibraryItem("lib-user-acq", "lib-game-acq1", {
            acquisitionType: "DIGITAL",
          }),
          makeLibraryItem("lib-user-acq", "lib-game-acq2", {
            acquisitionType: "DIGITAL",
          }),
          makeLibraryItem("lib-user-acq", "lib-game-acq3", {
            acquisitionType: "SUBSCRIPTION",
          }),
          makeLibraryItem("lib-user-acq", "lib-game-acq4", {
            acquisitionType: "PHYSICAL",
          }),
        ],
      });
    });

    it("returns only SUBSCRIPTION items when acquisition is SUBSCRIPTION", async () => {
      const result = await getLibrary("lib-user-acq", {
        acquisition: "SUBSCRIPTION",
      });

      expect(result.items).toHaveLength(1);
      expect(
        result.items.every((item) => item.acquisitionType === "SUBSCRIPTION")
      ).toBe(true);
    });

    it("returns only DIGITAL items when acquisition is DIGITAL", async () => {
      const result = await getLibrary("lib-user-acq", {
        acquisition: "DIGITAL",
      });

      expect(result.items).toHaveLength(2);
      expect(
        result.items.every((item) => item.acquisitionType === "DIGITAL")
      ).toBe(true);
    });

    it("returns every source when no acquisition filter is applied", async () => {
      const result = await getLibrary("lib-user-acq", {});

      expect(result.total).toBe(4);
    });
  });

  // -------------------------------------------------------------------------
  // Started-only filter (F04 — derived "touched": status / startedAt / completedAt)
  // -------------------------------------------------------------------------

  describe("started-only filter (derived touched)", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("started") });
      await Promise.all([
        db.prisma.game.create({
          data: makeGame("st1", { title: "Tried Shelf" }),
        }),
        db.prisma.game.create({
          data: makeGame("st2", { title: "Playing" }),
        }),
        db.prisma.game.create({
          data: makeGame("st3", { title: "Untouched Shelf" }),
        }),
        db.prisma.game.create({
          data: makeGame("st4", { title: "Finished Shelf" }),
        }),
      ]);
      await db.prisma.libraryItem.createMany({
        data: [
          // Shelved but started → touched via startedAt.
          makeLibraryItem("lib-user-started", "lib-game-st1", {
            status: "SHELF",
            startedAt: new Date("2024-02-01T00:00:00.000Z"),
          }),
          // Currently playing, no dates → touched via status.
          makeLibraryItem("lib-user-started", "lib-game-st2", {
            status: "PLAYING",
          }),
          // Shelved, never touched → excluded.
          makeLibraryItem("lib-user-started", "lib-game-st3", {
            status: "SHELF",
          }),
          // Shelved but completed → touched via completedAt.
          makeLibraryItem("lib-user-started", "lib-game-st4", {
            status: "SHELF",
            completedAt: new Date("2024-03-01T00:00:00.000Z"),
          }),
        ],
      });
    });

    it("returns only touched games (status PLAYING/PLAYED, startedAt, or completedAt)", async () => {
      const result = await getLibrary("lib-user-started", {
        startedOnly: true,
      });

      expect(result.items).toHaveLength(3);
      expect(
        result.items.every(
          (item) =>
            item.status === "PLAYING" ||
            item.status === "PLAYED" ||
            item.startedAt !== null ||
            item.completedAt !== null
        )
      ).toBe(true);
    });

    it("excludes the untouched shelf item", async () => {
      const result = await getLibrary("lib-user-started", {
        startedOnly: true,
      });

      expect(
        result.items.some((item) => item.game.title === "Untouched Shelf")
      ).toBe(false);
    });

    it("returns every item when startedOnly is not set", async () => {
      const result = await getLibrary("lib-user-started", {});

      expect(result.total).toBe(4);
    });
  });

  // -------------------------------------------------------------------------
  // Title sort (asc / desc)
  // -------------------------------------------------------------------------

  describe("title sort", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("titlesort") });
      await Promise.all([
        db.prisma.game.create({
          data: makeGame("t1", { title: "Zelda" }),
        }),
        db.prisma.game.create({
          data: makeGame("t2", { title: "Metroid" }),
        }),
        db.prisma.game.create({
          data: makeGame("t3", { title: "Castlevania" }),
        }),
      ]);
      await db.prisma.libraryItem.createMany({
        data: [
          makeLibraryItem("lib-user-titlesort", "lib-game-t1"),
          makeLibraryItem("lib-user-titlesort", "lib-game-t2"),
          makeLibraryItem("lib-user-titlesort", "lib-game-t3"),
        ],
      });
    });

    it("returns items sorted by game title ascending", async () => {
      const result = await getLibrary("lib-user-titlesort", {
        sortBy: "title",
        sortOrder: "asc",
      });

      expect(result.items).toHaveLength(3);
      expect(result.items[0]?.game.title).toBe("Castlevania");
      expect(result.items[1]?.game.title).toBe("Metroid");
      expect(result.items[2]?.game.title).toBe("Zelda");
    });

    it("returns items sorted by game title descending", async () => {
      const result = await getLibrary("lib-user-titlesort", {
        sortBy: "title",
        sortOrder: "desc",
      });

      expect(result.items).toHaveLength(3);
      expect(result.items[0]?.game.title).toBe("Zelda");
      expect(result.items[1]?.game.title).toBe("Metroid");
      expect(result.items[2]?.game.title).toBe("Castlevania");
    });
  });

  // -------------------------------------------------------------------------
  // Sort by recently added (createdAt desc — default when no sortBy given)
  // -------------------------------------------------------------------------

  describe("sort by recently added (createdAt)", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("createdsort") });
      await Promise.all([
        db.prisma.game.create({ data: makeGame("c1", { title: "Oldest" }) }),
        db.prisma.game.create({ data: makeGame("c2", { title: "Middle" }) }),
        db.prisma.game.create({ data: makeGame("c3", { title: "Newest" }) }),
      ]);
      await db.prisma.libraryItem.createMany({
        data: [
          makeLibraryItem("lib-user-createdsort", "lib-game-c1", {
            createdAt: new Date("2024-01-01"),
            updatedAt: new Date("2024-01-01"),
          }),
          makeLibraryItem("lib-user-createdsort", "lib-game-c2", {
            createdAt: new Date("2024-03-01"),
            updatedAt: new Date("2024-03-01"),
          }),
          makeLibraryItem("lib-user-createdsort", "lib-game-c3", {
            createdAt: new Date("2024-06-01"),
            updatedAt: new Date("2024-06-01"),
          }),
        ],
      });
    });

    it("returns items newest-first when sortBy is createdAt desc", async () => {
      const result = await getLibrary("lib-user-createdsort", {
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      expect(result.items).toHaveLength(3);
      expect(result.items[0]?.game.title).toBe("Newest");
      expect(result.items[2]?.game.title).toBe("Oldest");
    });

    it("returns items oldest-first when sortBy is createdAt asc", async () => {
      const result = await getLibrary("lib-user-createdsort", {
        sortBy: "createdAt",
        sortOrder: "asc",
      });

      expect(result.items).toHaveLength(3);
      expect(result.items[0]?.game.title).toBe("Oldest");
      expect(result.items[2]?.game.title).toBe("Newest");
    });
  });

  // -------------------------------------------------------------------------
  // Combined filter + sort
  // -------------------------------------------------------------------------

  describe("combined filter and sort", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("combo") });
      await Promise.all([
        db.prisma.game.create({ data: makeGame("combo1", { title: "Zelda" }) }),
        db.prisma.game.create({
          data: makeGame("combo2", { title: "Metroid" }),
        }),
        db.prisma.game.create({
          data: makeGame("combo3", { title: "Castlevania" }),
        }),
        db.prisma.game.create({
          data: makeGame("combo4", { title: "Bloodborne" }),
        }),
      ]);
      await db.prisma.libraryItem.createMany({
        data: [
          // PLAYING on PC
          makeLibraryItem("lib-user-combo", "lib-game-combo1", {
            status: "PLAYING",
            platform: "PC",
          }),
          makeLibraryItem("lib-user-combo", "lib-game-combo2", {
            status: "PLAYING",
            platform: "PC",
          }),
          // PLAYING on PS5
          makeLibraryItem("lib-user-combo", "lib-game-combo3", {
            status: "PLAYING",
            platform: "PlayStation 5",
          }),
          // PLAYED on PC (different status — should be excluded by status filter)
          makeLibraryItem("lib-user-combo", "lib-game-combo4", {
            status: "PLAYED",
            platform: "PC",
          }),
        ],
      });
    });

    it("filters by status and platform and sorts by title asc", async () => {
      const result = await getLibrary("lib-user-combo", {
        status: "PLAYING",
        platform: "PC",
        sortBy: "title",
        sortOrder: "asc",
      });

      expect(result.items).toHaveLength(2);
      expect(result.items[0]?.game.title).toBe("Metroid");
      expect(result.items[1]?.game.title).toBe("Zelda");
      expect(result.items.every((item) => item.status === "PLAYING")).toBe(
        true
      );
      expect(result.items.every((item) => item.platform === "PC")).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Ownership isolation — other users' items must never leak
  // -------------------------------------------------------------------------

  describe("ownership isolation", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("owner1") });
      await db.prisma.user.create({ data: makeUser("owner2") });
      await Promise.all([
        db.prisma.game.create({
          data: makeGame("own1", { title: "Owner 1 Game" }),
        }),
        db.prisma.game.create({
          data: makeGame("own2", { title: "Owner 2 Game" }),
        }),
      ]);
      await db.prisma.libraryItem.createMany({
        data: [
          makeLibraryItem("lib-user-owner1", "lib-game-own1", {
            status: "PLAYING",
          }),
          makeLibraryItem("lib-user-owner2", "lib-game-own2", {
            status: "PLAYING",
          }),
        ],
      });
    });

    it("returns only the requesting user's items", async () => {
      const result1 = await getLibrary("lib-user-owner1", {});
      const result2 = await getLibrary("lib-user-owner2", {});

      expect(result1.total).toBe(1);
      expect(result1.items[0]?.userId).toBe("lib-user-owner1");
      expect(result1.items[0]?.game.title).toBe("Owner 1 Game");

      expect(result2.total).toBe(1);
      expect(result2.items[0]?.userId).toBe("lib-user-owner2");
      expect(result2.items[0]?.game.title).toBe("Owner 2 Game");
    });

    it("returns empty for a user with no items even when others have items", async () => {
      await db.prisma.user.create({ data: makeUser("owner3") });

      const result = await getLibrary("lib-user-owner3", {});

      expect(result.total).toBe(0);
      expect(result.items).toHaveLength(0);
    });
  });
});

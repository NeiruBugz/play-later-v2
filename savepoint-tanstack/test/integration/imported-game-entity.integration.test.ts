/**
 * RED integration tests for entities/imported-game/api/* (Slice 21 Phase C).
 *
 * Functions under test (locked signatures):
 *
 *   findImportedGamesForUser(userId, opts?): Promise<ImportedGame[]>
 *     - Returns rows owned by `userId` that have not been soft-deleted.
 *     - Excludes `igdbMatchStatus: IGNORED` by default; pass
 *       `{ includeIgnored: true }` to include them.
 *
 *   dismissImportedGame(userId, importedGameId): Promise<void>
 *     - Sets `igdbMatchStatus` to `IGNORED` on the row.
 *     - Two-step ownership check: findUnique then compare userId.
 *     - Cross-user dismissal throws NotFoundError (privacy invariant).
 *     - Missing id throws NotFoundError.
 *     - Idempotent: re-dismissing a dismissed row is a no-op.
 *
 *   updateImportedGameStatus(userId, importedGameId, status): Promise<ImportedGame>
 *     - Updates `igdbMatchStatus` to the given status.
 *     - Same ownership / not-found semantics as dismissImportedGame.
 *
 *   upsertImportedGamesBatch(userId, games): Promise<{ created: number; updated: number }>
 *     - Upserts a batch of Steam-shaped payloads inside a single transaction.
 *     - Matches existing rows by `(userId, storefront=STEAM, storefrontGameId)`.
 *     - Creates new rows with `igdbMatchStatus: PENDING`.
 *
 * Dismissal mechanism: confirmed in `prisma/schema.prisma` — `ImportedGame`
 * has no `dismissed` boolean. The canonical convention (verified in
 * `savepoint-app/data-access-layer/services/imported-game/...`) is
 * `igdbMatchStatus: IGNORED`. We follow the schema, not the spec-wording
 * approximation. See DIVERGENCES.md.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

// RED imports — modules do not exist until the GREEN step.
import { dismissImportedGame } from "@/entities/imported-game/api/dismiss-imported-game.server";
import { findImportedGamesForUser } from "@/entities/imported-game/api/find-imported-games-for-user.server";
import { updateImportedGameStatus } from "@/entities/imported-game/api/update-imported-game-status.server";
import { upsertImportedGamesBatch } from "@/entities/imported-game/api/upsert-imported-games-batch.server";
import { NotFoundError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

// ---------------------------------------------------------------------------
// Isolated DB
// ---------------------------------------------------------------------------

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("imported-game-entity");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ALICE_ID = "ige-alice";
const BOB_ID = "ige-bob";

beforeEach(async () => {
  await db.prisma.importedGame.deleteMany();
  await db.prisma.user.deleteMany();

  await db.prisma.user.createMany({
    data: [
      {
        id: ALICE_ID,
        email: "ige-alice@example.com",
        name: "Alice",
        emailVerified: true,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        id: BOB_ID,
        email: "ige-bob@example.com",
        name: "Bob",
        emailVerified: true,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
    ],
  });
});

async function createRow(input: {
  userId: string;
  storefrontGameId: string;
  name?: string;
  igdbMatchStatus?: "PENDING" | "MATCHED" | "UNMATCHED" | "IGNORED";
}): Promise<string> {
  const row = await db.prisma.importedGame.create({
    data: {
      userId: input.userId,
      name: input.name ?? `Game ${input.storefrontGameId}`,
      storefront: "STEAM",
      storefrontGameId: input.storefrontGameId,
      igdbMatchStatus: input.igdbMatchStatus ?? "PENDING",
    },
  });
  return row.id;
}

// ---------------------------------------------------------------------------
// findImportedGamesForUser
// ---------------------------------------------------------------------------

describe("findImportedGamesForUser", () => {
  describe("given Alice owns 2 games and Bob owns 1", () => {
    beforeEach(async () => {
      await createRow({ userId: ALICE_ID, storefrontGameId: "1" });
      await createRow({ userId: ALICE_ID, storefrontGameId: "2" });
      await createRow({ userId: BOB_ID, storefrontGameId: "3" });
    });

    it("returns only Alice's rows for Alice", async () => {
      const { games: rows } = await findImportedGamesForUser(ALICE_ID);
      expect(rows).toHaveLength(2);
      expect(rows.every((r) => r.userId === ALICE_ID)).toBe(true);
    });

    it("returns only Bob's row for Bob", async () => {
      const { games: rows } = await findImportedGamesForUser(BOB_ID);
      expect(rows).toHaveLength(1);
      expect(rows[0]?.userId).toBe(BOB_ID);
    });

    it("returns an empty array for a user with no rows", async () => {
      const { games: rows } = await findImportedGamesForUser("nobody");
      expect(rows).toEqual([]);
    });
  });

  describe("given Alice has 1 PENDING + 1 IGNORED row", () => {
    beforeEach(async () => {
      await createRow({
        userId: ALICE_ID,
        storefrontGameId: "1",
        igdbMatchStatus: "PENDING",
      });
      await createRow({
        userId: ALICE_ID,
        storefrontGameId: "2",
        igdbMatchStatus: "IGNORED",
      });
    });

    it("excludes IGNORED rows by default", async () => {
      const { games: rows } = await findImportedGamesForUser(ALICE_ID);
      expect(rows).toHaveLength(1);
      expect(rows[0]?.igdbMatchStatus).toBe("PENDING");
    });

    it("includes IGNORED rows when includeIgnored: true", async () => {
      const { games: rows } = await findImportedGamesForUser(ALICE_ID, {
        includeIgnored: true,
      });
      expect(rows).toHaveLength(2);
    });
  });

  // -------------------------------------------------------------------------
  // Phase D follow-up: filter / sort / search support
  // -------------------------------------------------------------------------

  describe("given Alice has games with varied playtime / platforms / dates", () => {
    beforeEach(async () => {
      const now = new Date();
      const dayMs = 24 * 60 * 60 * 1000;
      // never-played, all platforms zero
      await db.prisma.importedGame.create({
        data: {
          userId: ALICE_ID,
          name: "Alpha Untouched",
          storefront: "STEAM",
          storefrontGameId: "10",
          playtime: 0,
          playtimeWindows: 0,
          playtimeMac: 0,
          playtimeLinux: 0,
          lastPlayedAt: null,
          igdbMatchStatus: "PENDING",
        },
      });
      // 30 min on windows, played recently
      await db.prisma.importedGame.create({
        data: {
          userId: ALICE_ID,
          name: "Beta Quick",
          storefront: "STEAM",
          storefrontGameId: "11",
          playtime: 30,
          playtimeWindows: 30,
          playtimeMac: 0,
          playtimeLinux: 0,
          lastPlayedAt: new Date(now.getTime() - 5 * dayMs),
          igdbMatchStatus: "PENDING",
        },
      });
      // 5h on mac, played 200 days ago
      await db.prisma.importedGame.create({
        data: {
          userId: ALICE_ID,
          name: "Gamma Casual",
          storefront: "STEAM",
          storefrontGameId: "12",
          playtime: 300,
          playtimeWindows: 0,
          playtimeMac: 300,
          playtimeLinux: 0,
          lastPlayedAt: new Date(now.getTime() - 200 * dayMs),
          igdbMatchStatus: "PENDING",
        },
      });
      // 100h on linux, played 2 years ago
      await db.prisma.importedGame.create({
        data: {
          userId: ALICE_ID,
          name: "Delta Marathon",
          storefront: "STEAM",
          storefrontGameId: "13",
          playtime: 6000,
          playtimeWindows: 0,
          playtimeMac: 0,
          playtimeLinux: 6000,
          lastPlayedAt: new Date(now.getTime() - 730 * dayMs),
          igdbMatchStatus: "PENDING",
        },
      });
    });

    it("search filters by case-insensitive name substring", async () => {
      const { games: rows } = await findImportedGamesForUser(ALICE_ID, {
        search: "marathon",
      });
      expect(rows.map((r) => r.name)).toEqual(["Delta Marathon"]);
    });

    it("playtimeStatus=never_played returns only zero-playtime rows", async () => {
      const { games: rows } = await findImportedGamesForUser(ALICE_ID, {
        playtimeStatus: "never_played",
      });
      expect(rows.map((r) => r.name)).toEqual(["Alpha Untouched"]);
    });

    it("playtimeStatus=played excludes zero-playtime rows", async () => {
      const { games: rows } = await findImportedGamesForUser(ALICE_ID, {
        playtimeStatus: "played",
      });
      expect(rows).toHaveLength(3);
      expect(rows.every((r) => (r.playtime ?? 0) > 0)).toBe(true);
    });

    it("playtimeRange=over_50h returns only the 100h row", async () => {
      const { games: rows } = await findImportedGamesForUser(ALICE_ID, {
        playtimeRange: "over_50h",
      });
      expect(rows.map((r) => r.name)).toEqual(["Delta Marathon"]);
    });

    it("platform=mac returns only the mac-played row", async () => {
      const { games: rows } = await findImportedGamesForUser(ALICE_ID, {
        platform: "mac",
      });
      expect(rows.map((r) => r.name)).toEqual(["Gamma Casual"]);
    });

    it("lastPlayed=30_days returns only the recently-played row", async () => {
      const { games: rows } = await findImportedGamesForUser(ALICE_ID, {
        lastPlayed: "30_days",
      });
      expect(rows.map((r) => r.name)).toEqual(["Beta Quick"]);
    });

    it("lastPlayed=never returns only the never-played row", async () => {
      const { games: rows } = await findImportedGamesForUser(ALICE_ID, {
        lastPlayed: "never",
      });
      expect(rows.map((r) => r.name)).toEqual(["Alpha Untouched"]);
    });

    it("sortBy=name_asc orders by name ascending", async () => {
      const { games: rows } = await findImportedGamesForUser(ALICE_ID, {
        sortBy: "name_asc",
      });
      expect(rows.map((r) => r.name)).toEqual([
        "Alpha Untouched",
        "Beta Quick",
        "Delta Marathon",
        "Gamma Casual",
      ]);
    });

    it("sortBy=playtime_desc orders highest playtime first", async () => {
      const { games: rows } = await findImportedGamesForUser(ALICE_ID, {
        sortBy: "playtime_desc",
      });
      expect(rows.map((r) => r.name)).toEqual([
        "Delta Marathon",
        "Gamma Casual",
        "Beta Quick",
        "Alpha Untouched",
      ]);
    });
  });

  describe("given Alice has 1 PENDING + 1 MATCHED row", () => {
    beforeEach(async () => {
      await createRow({
        userId: ALICE_ID,
        storefrontGameId: "1",
        igdbMatchStatus: "PENDING",
      });
      await createRow({
        userId: ALICE_ID,
        storefrontGameId: "2",
        igdbMatchStatus: "MATCHED",
      });
    });

    it("excludes MATCHED rows by default (they live on the library page)", async () => {
      const { games: rows } = await findImportedGamesForUser(ALICE_ID);
      expect(rows).toHaveLength(1);
      expect(rows[0]?.igdbMatchStatus).toBe("PENDING");
    });

    it("includes MATCHED rows when includeMatched: true", async () => {
      const { games: rows } = await findImportedGamesForUser(ALICE_ID, {
        includeMatched: true,
      });
      expect(rows).toHaveLength(2);
    });
  });

  describe("given Alice has 30 PENDING rows (pagination)", () => {
    beforeEach(async () => {
      for (let i = 0; i < 30; i++) {
        await createRow({
          userId: ALICE_ID,
          storefrontGameId: `p-${i.toString().padStart(2, "0")}`,
          name: `PendingGame${i.toString().padStart(2, "0")}`,
          igdbMatchStatus: "PENDING",
        });
      }
    });

    it("returns page 1 with the default limit of 25", async () => {
      const result = await findImportedGamesForUser(ALICE_ID);
      expect(result.games).toHaveLength(25);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(25);
      expect(result.total).toBe(30);
      expect(result.totalPages).toBe(2);
    });

    it("returns the remainder on page 2", async () => {
      const result = await findImportedGamesForUser(ALICE_ID, { page: 2 });
      expect(result.games).toHaveLength(5);
      expect(result.page).toBe(2);
    });

    it("respects a custom page size", async () => {
      const result = await findImportedGamesForUser(ALICE_ID, {
        page: 1,
        limit: 10,
      });
      expect(result.games).toHaveLength(10);
      expect(result.totalPages).toBe(3);
    });
  });
});

// ---------------------------------------------------------------------------
// dismissImportedGame
// ---------------------------------------------------------------------------

describe("dismissImportedGame", () => {
  describe("happy path", () => {
    let rowId: string;
    beforeEach(async () => {
      rowId = await createRow({ userId: ALICE_ID, storefrontGameId: "1" });
    });

    it("sets igdbMatchStatus to IGNORED on Alice's row when Alice dismisses", async () => {
      await dismissImportedGame(ALICE_ID, rowId);
      const row = await db.prisma.importedGame.findUnique({
        where: { id: rowId },
      });
      expect(row?.igdbMatchStatus).toBe("IGNORED");
    });

    it("is idempotent — second dismissal is a no-op", async () => {
      await dismissImportedGame(ALICE_ID, rowId);
      await dismissImportedGame(ALICE_ID, rowId);
      const row = await db.prisma.importedGame.findUnique({
        where: { id: rowId },
      });
      expect(row?.igdbMatchStatus).toBe("IGNORED");
    });
  });

  describe("cross-user ownership", () => {
    let aliceRowId: string;
    beforeEach(async () => {
      aliceRowId = await createRow({
        userId: ALICE_ID,
        storefrontGameId: "1",
      });
    });

    it("throws NotFoundError when Bob tries to dismiss Alice's row", async () => {
      await expect(dismissImportedGame(BOB_ID, aliceRowId)).rejects.toThrow(
        NotFoundError
      );
    });

    it("leaves Alice's row untouched when Bob fails to dismiss", async () => {
      await expect(dismissImportedGame(BOB_ID, aliceRowId)).rejects.toThrow(
        NotFoundError
      );
      const row = await db.prisma.importedGame.findUnique({
        where: { id: aliceRowId },
      });
      expect(row?.igdbMatchStatus).toBe("PENDING");
    });
  });

  describe("missing row", () => {
    it("throws NotFoundError when the importedGameId does not exist", async () => {
      await expect(dismissImportedGame(ALICE_ID, "no-such-id")).rejects.toThrow(
        NotFoundError
      );
    });
  });
});

// ---------------------------------------------------------------------------
// updateImportedGameStatus
// ---------------------------------------------------------------------------

describe("updateImportedGameStatus", () => {
  describe("happy path", () => {
    let rowId: string;
    beforeEach(async () => {
      rowId = await createRow({ userId: ALICE_ID, storefrontGameId: "1" });
    });

    it("transitions PENDING → MATCHED", async () => {
      const updated = await updateImportedGameStatus(
        ALICE_ID,
        rowId,
        "MATCHED"
      );
      expect(updated.igdbMatchStatus).toBe("MATCHED");
    });

    it("transitions to UNMATCHED", async () => {
      const updated = await updateImportedGameStatus(
        ALICE_ID,
        rowId,
        "UNMATCHED"
      );
      expect(updated.igdbMatchStatus).toBe("UNMATCHED");
    });
  });

  describe("cross-user ownership", () => {
    let aliceRowId: string;
    beforeEach(async () => {
      aliceRowId = await createRow({
        userId: ALICE_ID,
        storefrontGameId: "1",
      });
    });

    it("throws NotFoundError when Bob targets Alice's row", async () => {
      await expect(
        updateImportedGameStatus(BOB_ID, aliceRowId, "MATCHED")
      ).rejects.toThrow(NotFoundError);
    });

    it("throws NotFoundError when the id does not exist", async () => {
      await expect(
        updateImportedGameStatus(ALICE_ID, "no-such-id", "MATCHED")
      ).rejects.toThrow(NotFoundError);
    });
  });
});

// ---------------------------------------------------------------------------
// upsertImportedGamesBatch
// ---------------------------------------------------------------------------

describe("upsertImportedGamesBatch", () => {
  const STEAM_PAYLOAD = [
    {
      storefrontGameId: "730",
      name: "Counter-Strike 2",
      playtime: 1200,
      playtimeWindows: 1200,
      playtimeMac: 0,
      playtimeLinux: 0,
      lastPlayedAt: new Date("2024-06-01T00:00:00.000Z"),
      imgIconUrl: "abc",
      imgLogoUrl: "def",
    },
    {
      storefrontGameId: "440",
      name: "Team Fortress 2",
      playtime: 0,
      playtimeWindows: 0,
      playtimeMac: 0,
      playtimeLinux: 0,
      lastPlayedAt: null,
      imgIconUrl: null,
      imgLogoUrl: null,
    },
  ];

  describe("first run — all creates", () => {
    it("creates one row per payload entry with PENDING status", async () => {
      const result = await upsertImportedGamesBatch(ALICE_ID, STEAM_PAYLOAD);
      expect(result).toEqual({ created: 2, updated: 0 });
      const rows = await db.prisma.importedGame.findMany({
        where: { userId: ALICE_ID },
      });
      expect(rows).toHaveLength(2);
      expect(rows.every((r) => r.igdbMatchStatus === "PENDING")).toBe(true);
    });
  });

  describe("second run — all updates", () => {
    beforeEach(async () => {
      await upsertImportedGamesBatch(ALICE_ID, STEAM_PAYLOAD);
    });

    it("updates existing rows in place without inserting duplicates", async () => {
      const newPayload = [
        { ...STEAM_PAYLOAD[0], playtime: 9999 },
        STEAM_PAYLOAD[1],
      ];
      const result = await upsertImportedGamesBatch(ALICE_ID, newPayload);
      expect(result).toEqual({ created: 0, updated: 2 });
      const rows = await db.prisma.importedGame.findMany({
        where: { userId: ALICE_ID },
      });
      expect(rows).toHaveLength(2);
      const cs2 = rows.find((r) => r.storefrontGameId === "730");
      expect(cs2?.playtime).toBe(9999);
    });
  });

  describe("mixed run — partial create + partial update", () => {
    beforeEach(async () => {
      await upsertImportedGamesBatch(ALICE_ID, STEAM_PAYLOAD);
    });

    it("reports counts split between create and update", async () => {
      const mixed = [
        STEAM_PAYLOAD[0],
        {
          storefrontGameId: "570",
          name: "Dota 2",
          playtime: 100,
          playtimeWindows: 100,
          playtimeMac: 0,
          playtimeLinux: 0,
          lastPlayedAt: null,
          imgIconUrl: null,
          imgLogoUrl: null,
        },
      ];
      const result = await upsertImportedGamesBatch(ALICE_ID, mixed);
      expect(result).toEqual({ created: 1, updated: 1 });
    });
  });

  describe("isolation", () => {
    it("does not touch Bob's rows when upserting for Alice", async () => {
      await createRow({ userId: BOB_ID, storefrontGameId: "730" });
      await upsertImportedGamesBatch(ALICE_ID, STEAM_PAYLOAD);
      const bobRows = await db.prisma.importedGame.findMany({
        where: { userId: BOB_ID },
      });
      expect(bobRows).toHaveLength(1);
    });
  });

  describe("empty payload", () => {
    it("is a no-op with counts both zero", async () => {
      const result = await upsertImportedGamesBatch(ALICE_ID, []);
      expect(result).toEqual({ created: 0, updated: 0 });
    });
  });
});

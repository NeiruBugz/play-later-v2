/**
 * Integration tests for fetchSteamGamesWorker and dismissImportedGameWorker.
 *
 * fetchSteamGamesWorker:
 *   - Throws UnauthorizedError when userId is undefined
 *   - Returns paginated imported games for an authenticated user
 *   - Empty result when user has no imported games
 *
 * dismissImportedGameWorker:
 *   - Throws UnauthorizedError when userId is undefined
 *   - Sets igdbMatchStatus to IGNORED on valid input
 *   - Throws NotFoundError when importedGameId does not belong to the user
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { dismissImportedGameWorker } from "@/features/steam-import/api/dismiss-imported-game.worker";
import { fetchSteamGamesWorker } from "@/features/steam-import/api/fetch-steam-games.worker";
import { UnauthorizedError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("fetch-dismiss-steam-workers");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

const ALICE_ID = "fsgw-alice";
const BOB_ID = "fsgw-bob";

beforeEach(async () => {
  await db.prisma.importedGame.deleteMany();
  await db.prisma.user.deleteMany();

  await db.prisma.user.createMany({
    data: [
      {
        id: ALICE_ID,
        email: "fsgw-alice@example.com",
        name: "Alice",
        emailVerified: true,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        id: BOB_ID,
        email: "fsgw-bob@example.com",
        name: "Bob",
        emailVerified: true,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
    ],
  });
});

function makeImportedGame(userId: string, storefrontGameId: string) {
  return {
    userId,
    storefront: "STEAM" as const,
    storefrontGameId,
    name: `Game ${storefrontGameId}`,
    playtime: 120,
    igdbMatchStatus: "PENDING" as const,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

// ---------------------------------------------------------------------------
// fetchSteamGamesWorker
// ---------------------------------------------------------------------------

describe("fetchSteamGamesWorker", () => {
  describe("auth gate", () => {
    it("throws UnauthorizedError when userId is undefined", async () => {
      await expect(fetchSteamGamesWorker(undefined)).rejects.toThrow(
        UnauthorizedError
      );
    });
  });

  describe("given alice has no imported games", () => {
    it("returns an empty games array", async () => {
      const result = await fetchSteamGamesWorker(ALICE_ID);

      expect(result.games).toHaveLength(0);
    });
  });

  describe("given alice has imported games", () => {
    beforeEach(async () => {
      await db.prisma.importedGame.createMany({
        data: [
          makeImportedGame(ALICE_ID, "steam-1001"),
          makeImportedGame(ALICE_ID, "steam-1002"),
        ],
      });
    });

    it("returns alice's imported games", async () => {
      const result = await fetchSteamGamesWorker(ALICE_ID);

      expect(result.games.length).toBeGreaterThanOrEqual(2);
    });

    it("does not return bob's games in alice's result", async () => {
      await db.prisma.importedGame.create({
        data: makeImportedGame(BOB_ID, "steam-2001"),
      });

      const result = await fetchSteamGamesWorker(ALICE_ID);

      const userIds = result.games.map((g) => g.userId);
      expect(userIds.every((id) => id === ALICE_ID)).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// dismissImportedGameWorker
// ---------------------------------------------------------------------------

describe("dismissImportedGameWorker", () => {
  describe("auth gate", () => {
    it("throws UnauthorizedError when userId is undefined", async () => {
      await expect(
        dismissImportedGameWorker(undefined, { importedGameId: "any-id" })
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe("given alice has an imported game", () => {
    let gameId: string;

    beforeEach(async () => {
      const game = await db.prisma.importedGame.create({
        data: makeImportedGame(ALICE_ID, "steam-3001"),
      });
      gameId = game.id;
    });

    it("dismisses the imported game (sets igdbMatchStatus to IGNORED)", async () => {
      await dismissImportedGameWorker(ALICE_ID, { importedGameId: gameId });

      const updated = await db.prisma.importedGame.findUnique({
        where: { id: gameId },
        select: { igdbMatchStatus: true },
      });
      expect(updated?.igdbMatchStatus).toBe("IGNORED");
    });

    it("returns void on success", async () => {
      const result = await dismissImportedGameWorker(ALICE_ID, {
        importedGameId: gameId,
      });

      expect(result).toBeUndefined();
    });
  });

  describe("given bob tries to dismiss alice's imported game", () => {
    let aliceGameId: string;

    beforeEach(async () => {
      const game = await db.prisma.importedGame.create({
        data: makeImportedGame(ALICE_ID, "steam-4001"),
      });
      aliceGameId = game.id;
    });

    it("throws NotFoundError (privacy invariant: cross-user dismiss denied)", async () => {
      const { NotFoundError } = await import("@/shared/lib/errors");
      await expect(
        dismissImportedGameWorker(BOB_ID, { importedGameId: aliceGameId })
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});

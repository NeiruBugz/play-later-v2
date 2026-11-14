/**
 * RED integration test for spec 030 Slice 2, acceptance "pressing + on a found
 * game skips 'Select correct game'".
 *
 * CONTRACT
 *   features/steam-import/api/import-game-to-library.worker.ts
 *   importGameToLibraryWorker(userId, { importedGameId, status }) for a row that
 *   already has `gameId` (found by the background sync) and no `manualIgdbId`:
 *     - adds THAT catalogue game to the library with the chosen status
 *     - never throws NeedsManualMatchError and never re-matches the Steam app
 *       through IGDB's `external_games.url` lookup
 *   A row without `gameId` keeps today's behaviour.
 */
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { importGameToLibraryWorker } from "@/features/steam-import/api/import-game-to-library.worker";
import { igdbFetch } from "@/shared/api/igdb/fetch";

import { createGame, createUser } from "../../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../../setup/isolated-db.ts";

vi.mock("@/shared/api/igdb/fetch", () => ({ igdbFetch: vi.fn() }));

const igdbFetchMock = vi.mocked(igdbFetch);

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("storefront-sync-import-found-game");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

describe(importGameToLibraryWorker, () => {
  describe("given an imported game the sync already matched to a catalogue game", () => {
    let userId: string;
    let gameId: string;
    let result: Awaited<ReturnType<typeof importGameToLibraryWorker>>;

    beforeEach(async () => {
      igdbFetchMock.mockReset();
      igdbFetchMock.mockResolvedValue([]);
      await db.prisma.libraryItem.deleteMany();
      await db.prisma.importedGame.deleteMany();
      await db.prisma.game.deleteMany();
      await db.prisma.user.deleteMany();
      userId = (await createUser(db.prisma)).id;
      gameId = (await createGame(db.prisma, { title: "Half-Life 2" })).id;
      const imported = await db.prisma.importedGame.create({
        data: {
          userId,
          storefront: "STEAM",
          storefrontGameId: "220",
          name: "Half-Life 2",
          gameId,
          lookedUpAt: new Date("2025-01-01T00:00:00.000Z"),
        },
      });
      result = await importGameToLibraryWorker(userId, {
        importedGameId: imported.id,
        status: "WANT",
      });
    });

    it("adds the matched game to the library without asking for a manual match", async () => {
      expect(result.gameId).toBe(gameId);
      expect(
        await db.prisma.libraryItem.count({ where: { userId, gameId } })
      ).toBe(1);
    });

    it("does not re-match the Steam app through IGDB", () => {
      const queries = igdbFetchMock.mock.calls.map((call) => String(call[1]));

      expect(queries.some((q) => q.includes("external_games.url"))).toBe(false);
    });
  });
});

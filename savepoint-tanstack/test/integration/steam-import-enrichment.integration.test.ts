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

import { createGame, createUser } from "../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

vi.mock("@/shared/api/igdb/fetch", () => ({ igdbFetch: vi.fn() }));

const igdbFetchMock = vi.mocked(igdbFetch);

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("steam-import-enrichment");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  igdbFetchMock.mockReset();
  igdbFetchMock.mockResolvedValue([]);
  await db.prisma.playthrough.deleteMany();
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.importedGame.deleteMany();
  await db.prisma.user.deleteMany();
});

async function importMatchedGame() {
  const user = await createUser(db.prisma);
  const game = await createGame(db.prisma);
  const imported = await db.prisma.importedGame.create({
    data: {
      userId: user.id,
      name: game.title,
      storefront: "STEAM",
      storefrontGameId: "400",
      igdbMatchStatus: "PENDING",
    },
  });
  const run = () =>
    importGameToLibraryWorker(user.id, {
      importedGameId: imported.id,
      status: "WANT",
      manualIgdbId: game.igdbId,
    });
  return { game, run };
}

describe("importGameToLibraryWorker enrichment", () => {
  describe("given IGDB has times for the imported game", () => {
    it("stores the times on the game while importing it", async () => {
      const { game, run } = await importMatchedGame();
      igdbFetchMock.mockResolvedValue([
        { id: 1, game_id: game.igdbId, hastily: 36_000, completely: 90_000 },
      ]);

      await run();

      expect(
        await db.prisma.game.findUniqueOrThrow({ where: { id: game.id } })
      ).toMatchObject({
        timeToCreditsSeconds: 36_000,
        timeToCompleteSeconds: 90_000,
      });
    });
  });

  describe("given IGDB fails while enriching", () => {
    it("still imports the game into the library", async () => {
      const { game, run } = await importMatchedGame();
      igdbFetchMock.mockRejectedValue(new Error("IGDB 500"));

      const result = await run();

      expect(result.gameId).toBe(game.id);
      expect(
        await db.prisma.libraryItem.count({ where: { gameId: game.id } })
      ).toBe(1);
      expect(
        (await db.prisma.game.findUniqueOrThrow({ where: { id: game.id } }))
          .timesToBeatFetchedAt
      ).toBeNull();
    });
  });
});

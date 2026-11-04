import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { searchLibraryAwareGamesWorker } from "@/entities/library-item/api/search-library-aware-games.worker";

import {
  createGame,
  createLibraryItem,
  createUser,
} from "../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

const searchGames = vi.fn();
vi.mock("@/shared/api/igdb", () => ({
  searchGames: (...args: unknown[]) => searchGames(...args),
}));

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("search-library-aware-games");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
  searchGames.mockReset();
});

const igdbGame = (id: number, name: string) => ({
  id,
  name,
  slug: name.toLowerCase(),
  cover: null,
  first_release_date: null,
  platforms: [],
});

describe("searchLibraryAwareGamesWorker", () => {
  describe("given a viewer with a queued DONE game and an unqueued WANT game", () => {
    it("forwards status and upNextPosition for each owned result and null for the rest", async () => {
      const user = await createUser(db.prisma);
      const queued = await createGame(db.prisma);
      const unqueued = await createGame(db.prisma);
      await createLibraryItem(db.prisma, {
        userId: user.id,
        gameId: queued.id,
        status: "DONE",
        upNextPosition: 2,
      });
      await createLibraryItem(db.prisma, {
        userId: user.id,
        gameId: unqueued.id,
        status: "WANT",
      });
      searchGames.mockResolvedValue({
        games: [
          igdbGame(queued.igdbId, "Queued"),
          igdbGame(unqueued.igdbId, "Unqueued"),
          igdbGame(999_999, "Stranger"),
        ],
        count: 3,
      });

      const result = await searchLibraryAwareGamesWorker(user.id, {
        name: "q",
      });

      expect(
        result.games.map((g) => [
          g.name,
          g.library && {
            status: g.library.status,
            upNextPosition: g.library.upNextPosition,
          },
        ])
      ).toEqual([
        ["Queued", { status: "DONE", upNextPosition: 2 }],
        ["Unqueued", { status: "WANT", upNextPosition: null }],
        ["Stranger", null],
      ]);
      expect(result.ownedCount).toBe(2);
    });
  });
});

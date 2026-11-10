import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { getRelatedCollectionsForGame } from "@/entities/game/api/get-related-collections-for-game.server";
import { __resetTokenCacheForTests } from "@/shared/api/igdb/token";
import { UpstreamError, ValidationError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-related-collections-for-game");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

const CURRENT_GAME_ID = 500;

type IgdbGame = {
  id: number;
  name: string;
  slug: string;
  cover?: { image_id: string };
  game_type?: number;
  first_release_date?: number;
};

function makeGame(id: number, overrides: Partial<IgdbGame> = {}): IgdbGame {
  return {
    id,
    name: `Game ${id}`,
    slug: `game-${id}`,
    cover: { image_id: `cover_${id}` },
    game_type: 0,
    first_release_date: id * 1000,
    ...overrides,
  };
}

function makeResponse(
  collections: Array<{ id: number; name: string; games?: IgdbGame[] }>
) {
  return [{ id: CURRENT_GAME_ID, collections }];
}

const FAKE_TOKEN_RESPONSE = {
  access_token: "tok",
  expires_in: 3600,
  token_type: "bearer",
};

function makeFetchMock({
  igdbBody,
  igdbOk = true,
  igdbStatus = 200,
}: {
  igdbBody: unknown;
  igdbOk?: boolean;
  igdbStatus?: number;
}) {
  return vi.fn().mockImplementation((url: string) => {
    if (url.includes("id.twitch.tv")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => FAKE_TOKEN_RESPONSE,
      } as Response);
    }
    if (url.includes("api.igdb.com")) {
      return Promise.resolve({
        ok: igdbOk,
        status: igdbStatus,
        statusText: igdbOk ? "OK" : "Internal Server Error",
        json: async () => igdbBody,
      } as Response);
    }
    return Promise.reject(new Error(`Unexpected fetch URL in test: ${url}`));
  });
}

function igdbCalls(fetchMock: ReturnType<typeof makeFetchMock>) {
  return fetchMock.mock.calls.filter(([url]) =>
    String(url).includes("api.igdb.com")
  );
}

function stubIgdb(igdbBody: unknown) {
  const fetchMock = makeFetchMock({ igdbBody });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

beforeEach(() => {
  __resetTokenCacheForTests();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("getRelatedCollectionsForGame", () => {
  describe("given a game in two collections", () => {
    let fetchMock: ReturnType<typeof makeFetchMock>;

    beforeEach(() => {
      fetchMock = stubIgdb(
        makeResponse([
          {
            id: 1,
            name: "Series A",
            games: [makeGame(11), makeGame(12), makeGame(CURRENT_GAME_ID)],
          },
          { id: 2, name: "Series B", games: [makeGame(21)] },
        ])
      );
    });

    it("answers with a single IGDB call regardless of the collection count", async () => {
      await getRelatedCollectionsForGame({ igdbId: CURRENT_GAME_ID });

      expect(igdbCalls(fetchMock)).toHaveLength(1);
      expect(String(igdbCalls(fetchMock)[0]![0])).toContain("/games");
    });

    it("asks IGDB for the collections' games in the same request", async () => {
      await getRelatedCollectionsForGame({ igdbId: CURRENT_GAME_ID });

      const body = String(igdbCalls(fetchMock)[0]![1].body);
      expect(body).toContain("collections.games.slug");
      expect(body).toContain("collections.games.first_release_date");
      expect(body).toContain(`id = ${CURRENT_GAME_ID}`);
    });

    it("returns one entry per collection with id, name and the mapped games", async () => {
      const collections = await getRelatedCollectionsForGame({
        igdbId: CURRENT_GAME_ID,
      });

      expect(
        collections.map((c) => [c.collectionId, c.collectionName])
      ).toEqual([
        [1, "Series A"],
        [2, "Series B"],
      ]);
      expect(collections[1]!.games).toEqual([
        {
          igdbId: 21,
          slug: "game-21",
          title: "Game 21",
          coverImageId: "cover_21",
        },
      ]);
    });

    it("leaves the current game out of every collection", async () => {
      const collections = await getRelatedCollectionsForGame({
        igdbId: CURRENT_GAME_ID,
      });

      expect(collections[0]!.games.map((g) => g.igdbId)).toEqual([11, 12]);
    });

    it("does not write to the Game table", async () => {
      await getRelatedCollectionsForGame({ igdbId: CURRENT_GAME_ID });

      expect(await db.prisma.game.count()).toBe(0);
    });
  });

  describe("given games delivered out of release order", () => {
    beforeEach(() => {
      stubIgdb(
        makeResponse([
          {
            id: 1,
            name: "Series A",
            games: [
              makeGame(13, { first_release_date: 300 }),
              makeGame(14, { first_release_date: undefined }),
              makeGame(11, { first_release_date: 100 }),
              makeGame(12, { first_release_date: 200 }),
            ],
          },
        ])
      );
    });

    it("orders by first release date ascending with undated games last", async () => {
      const [collection] = await getRelatedCollectionsForGame({
        igdbId: CURRENT_GAME_ID,
      });

      expect(collection!.games.map((g) => g.igdbId)).toEqual([11, 12, 13, 14]);
    });
  });

  describe("given games of disallowed or missing types", () => {
    beforeEach(() => {
      stubIgdb(
        makeResponse([
          {
            id: 1,
            name: "Series A",
            games: [
              makeGame(11, { game_type: 0 }),
              makeGame(12, { game_type: 3 }),
              makeGame(13, { game_type: 5 }),
              makeGame(14, { game_type: undefined }),
              makeGame(15, { game_type: 1 }),
            ],
          },
        ])
      );
    });

    it("keeps allowed types and untyped games, drops bundles and episodes", async () => {
      const [collection] = await getRelatedCollectionsForGame({
        igdbId: CURRENT_GAME_ID,
      });

      expect(collection!.games.map((g) => g.igdbId)).toEqual([11, 14, 15]);
    });
  });

  describe("given a game without a cover", () => {
    beforeEach(() => {
      stubIgdb(
        makeResponse([
          {
            id: 1,
            name: "Series A",
            games: [makeGame(11, { cover: undefined })],
          },
        ])
      );
    });

    it("maps the cover to null", async () => {
      const [collection] = await getRelatedCollectionsForGame({
        igdbId: CURRENT_GAME_ID,
      });

      expect(collection!.games[0]!.coverImageId).toBeNull();
    });
  });

  describe("given a collection whose only game is the current game", () => {
    beforeEach(() => {
      stubIgdb(
        makeResponse([
          {
            id: 1,
            name: "Solo",
            games: [makeGame(CURRENT_GAME_ID)],
          },
          { id: 2, name: "Series B", games: [makeGame(21)] },
        ])
      );
    });

    it("omits the collection so no empty tab is offered", async () => {
      const collections = await getRelatedCollectionsForGame({
        igdbId: CURRENT_GAME_ID,
      });

      expect(collections.map((c) => c.collectionId)).toEqual([2]);
    });
  });

  describe("given a game with no collections", () => {
    it("returns an empty list when IGDB omits the collections field", async () => {
      stubIgdb([{ id: CURRENT_GAME_ID }]);

      expect(
        await getRelatedCollectionsForGame({ igdbId: CURRENT_GAME_ID })
      ).toEqual([]);
    });

    it("returns an empty list when IGDB does not know the game", async () => {
      stubIgdb([]);

      expect(
        await getRelatedCollectionsForGame({ igdbId: CURRENT_GAME_ID })
      ).toEqual([]);
    });
  });

  describe("given IGDB fails", () => {
    it("throws UpstreamError on a non-2xx response", async () => {
      vi.stubGlobal(
        "fetch",
        makeFetchMock({
          igdbBody: { error: "boom" },
          igdbOk: false,
          igdbStatus: 500,
        })
      );

      await expect(
        getRelatedCollectionsForGame({ igdbId: CURRENT_GAME_ID })
      ).rejects.toThrow(UpstreamError);
    });

    it("throws UpstreamError when the response shape is malformed", async () => {
      stubIgdb([{ id: "not-a-number" }]);

      await expect(
        getRelatedCollectionsForGame({ igdbId: CURRENT_GAME_ID })
      ).rejects.toThrow(UpstreamError);
    });
  });

  describe("given an invalid igdbId", () => {
    it.each([0, -1, 1.5])("throws ValidationError for %s", async (igdbId) => {
      await expect(getRelatedCollectionsForGame({ igdbId })).rejects.toThrow(
        ValidationError
      );
    });
  });
});

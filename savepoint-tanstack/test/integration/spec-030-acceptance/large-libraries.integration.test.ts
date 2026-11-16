/**
 * @spec: 030-background-storefront-import
 * @regression
 *
 * Big Steam libraries go through the whole pipeline (functional spec 2.1.4,
 * 2.2.3). Steam and IGDB are stubbed, so the wall-clock budget of 2.2.3 cannot
 * be measured here; the test pins what bounds it: one IGDB request per 200
 * games, and a finished job. The 5-minute figure itself needs a real
 * environment (Lambda + IGDB pacing) and is checked by hand.
 */
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

import { findImportedGamesForUser } from "@/entities/imported-game/api/find-imported-games-for-user.server";
import { getSteamSyncStatusWorker } from "@/features/storefront-sync/api/get-sync-status.worker";
import { drainInlineSyncQueue } from "@/features/storefront-sync/api/inline-queue";
import { startSteamSyncWorker } from "@/features/storefront-sync/api/start-sync.worker";
import { igdbFetch } from "@/shared/api/igdb/fetch";

import {
  createGame,
  createLibraryItem,
  createUser,
} from "../../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../../setup/isolated-db.ts";
import {
  externalGamesResponder,
  makeOwnedGames,
  STEAM_ID_64,
  stubSteam,
} from "../storefront-sync/stubs.ts";
import { igdbGame, LONG_AGO, wipeSyncTables } from "./support.ts";

vi.hoisted(() => {
  process.env.STOREFRONT_SYNC_QUEUE = "inline";
});

vi.mock("@/shared/api/igdb/fetch", () => ({ igdbFetch: vi.fn() }));

const igdbFetchMock = vi.mocked(igdbFetch);

const GAMES_PER_IGDB_REQUEST = 200;
const LARGE_TEST_TIMEOUT_MS = 120_000;

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("spec-030-large-libraries");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

let aliceId: string;

const elements = {
  syncStatus: () => getSteamSyncStatusWorker(aliceId),
  importedGameCount: () =>
    db.prisma.importedGame.count({ where: { userId: aliceId } }),
  removedGameCount: () =>
    db.prisma.importedGame.count({
      where: { userId: aliceId, igdbMatchStatus: "IGNORED" },
    }),
  gamesOnImportPage: async () =>
    (await findImportedGamesForUser(aliceId, { limit: 1 })).total,
  gamesInLibrary: () =>
    db.prisma.importedGame.count({
      where: {
        userId: aliceId,
        igdbMatchStatus: { not: "IGNORED" },
        game: { libraryItems: { some: { userId: aliceId } } },
      },
    }),
};

const actions = {
  sync: async () => {
    const { jobId } = await startSteamSyncWorker(aliceId, {
      addAllToLibrary: false,
    });
    await drainInlineSyncQueue();
    return jobId;
  },
};

beforeEach(async () => {
  igdbFetchMock.mockReset();
  igdbFetchMock.mockImplementation(externalGamesResponder({}));
  await wipeSyncTables(db);
  aliceId = (await createUser(db.prisma, { steamId64: STEAM_ID_64 })).id;
});

afterEach(async () => {
  await drainInlineSyncQueue();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("@spec: 030-background-storefront-import @regression a Steam library of 5,000 games (2.1.4)", () => {
  describe("given 5,000 owned games, 50 the person removed, 50 already in their library and 3,000 the catalogue knows", () => {
    const OWNED = 5000;
    const FIRST_APP_ID = 100_000;
    const REMOVED = 50;
    const IN_LIBRARY = 50;
    const CATALOGUE_KNOWN = 3000;
    const IN_LIBRARY_FIRST_APP_ID = FIRST_APP_ID + REMOVED;

    beforeEach(async () => {
      const owned = makeOwnedGames(OWNED, FIRST_APP_ID);
      for (let index = 0; index < REMOVED; index++) {
        await db.prisma.importedGame.create({
          data: {
            userId: aliceId,
            storefront: "STEAM",
            storefrontGameId: String(FIRST_APP_ID + index),
            name: `Removed ${index}`,
            igdbMatchStatus: "IGNORED",
            createdAt: LONG_AGO,
          },
        });
      }
      for (let index = 0; index < IN_LIBRARY; index++) {
        const appId = IN_LIBRARY_FIRST_APP_ID + index;
        const game = await createGame(db.prisma, { steamAppId: appId });
        await createLibraryItem(db.prisma, {
          userId: aliceId,
          gameId: game.id,
          status: "DONE",
        });
        await db.prisma.importedGame.create({
          data: {
            userId: aliceId,
            storefront: "STEAM",
            storefrontGameId: String(appId),
            name: `In library ${index}`,
            gameId: game.id,
            lookedUpAt: LONG_AGO,
            createdAt: LONG_AGO,
          },
        });
      }
      igdbFetchMock.mockImplementation(
        externalGamesResponder(
          Object.fromEntries(
            owned
              .slice(
                REMOVED + IN_LIBRARY,
                REMOVED + IN_LIBRARY + CATALOGUE_KNOWN
              )
              .map((game) => [game.appid, igdbGame(game.appid, game.name)])
          )
        )
      );
      stubSteam(owned);
      await actions.sync();
    }, LARGE_TEST_TIMEOUT_MS);

    it("finishes the sync", async () => {
      expect(await elements.syncStatus()).toMatchObject({ status: "FINISHED" });
    });

    it(
      "leaves every one of the 5,000 games on the import page, removed, or in the library",
      async () => {
        expect(await elements.importedGameCount()).toBe(OWNED);
        expect(
          (await elements.gamesOnImportPage()) +
            (await elements.removedGameCount()) +
            (await elements.gamesInLibrary())
        ).toBe(OWNED);
      },
      LARGE_TEST_TIMEOUT_MS
    );

    it("looks up the games in requests of at most 200", () => {
      const requests = igdbFetchMock.mock.calls.length;
      const lookedUpRemotely = OWNED - REMOVED - IN_LIBRARY;

      expect(requests).toBe(
        Math.ceil(lookedUpRemotely / GAMES_PER_IGDB_REQUEST)
      );
    });

    it("counts each game to look up once, and every one of them as looked up", async () => {
      expect(await elements.syncStatus()).toMatchObject({
        totalToLookUp: OWNED - REMOVED - IN_LIBRARY,
        lookedUp: OWNED - REMOVED - IN_LIBRARY,
      });
    });
  });
});

describe("@spec: 030-background-storefront-import @regression a first sync of 1,000 new games, nobody else syncing (2.2.3)", () => {
  describe("given 1,000 owned games SavePoint has never seen", () => {
    beforeEach(async () => {
      stubSteam(makeOwnedGames(1000, 200_000));
      await actions.sync();
    }, LARGE_TEST_TIMEOUT_MS);

    it("ends with 'Steam sync finished', every game looked up", async () => {
      expect(await elements.syncStatus()).toMatchObject({
        status: "FINISHED",
        newGames: 1000,
        totalToLookUp: 1000,
        lookedUp: 1000,
      });
    });

    it("needs only five IGDB requests, one per 200 games", () => {
      expect(igdbFetchMock.mock.calls).toHaveLength(5);
    });
  });
});

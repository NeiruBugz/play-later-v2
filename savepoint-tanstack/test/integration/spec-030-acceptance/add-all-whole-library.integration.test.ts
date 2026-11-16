/**
 * @spec: 030-background-storefront-import
 * @regression
 *
 * "Also add all games to my library" judged from what the person ends up
 * seeing: the library, and the import page the added games leave (functional
 * spec 2.4.1 - 2.4.3). Steam and IGDB are stubbed; everything else is real.
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
  STEAM_ID_64,
  stubSteam,
} from "../storefront-sync/stubs.ts";
import { igdbGame, steamGame, wipeSyncTables } from "./support.ts";

vi.hoisted(() => {
  process.env.STOREFRONT_SYNC_QUEUE = "inline";
});

vi.mock("@/shared/api/igdb/fetch", () => ({ igdbFetch: vi.fn() }));

const igdbFetchMock = vi.mocked(igdbFetch);

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("spec-030-add-all");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

let aliceId: string;

const UNPLACEABLE_APP_ID = 90;

const elements = {
  libraryStatusOfSteamApp: async (appId: number) => {
    const row = await db.prisma.importedGame.findFirstOrThrow({
      where: { userId: aliceId, storefrontGameId: String(appId) },
    });
    if (!row.gameId) return null;
    const item = await db.prisma.libraryItem.findUnique({
      where: { userId_gameId: { userId: aliceId, gameId: row.gameId } },
    });
    return item?.status ?? null;
  },
  importPageNames: async () =>
    (await findImportedGamesForUser(aliceId, { limit: 100 })).games
      .map((game) => game.name)
      .sort(),
  library: () =>
    db.prisma.libraryItem.findMany({
      where: { userId: aliceId },
      orderBy: { id: "asc" },
      select: { id: true, gameId: true, status: true },
    }),
  syncStatus: () => getSteamSyncStatusWorker(aliceId),
};

const actions = {
  sync: async (addAllToLibrary: boolean) => {
    await startSteamSyncWorker(aliceId, { addAllToLibrary });
    await drainInlineSyncQueue();
  },
  /** Five games played in the last week, one never played, one the catalogue lacks. */
  seedRecentlyPlayedLibrary: () => {
    const played = [1, 2, 3, 4, 5].map((daysAgo) => ({
      appid: 70 + daysAgo,
      name: `Played ${daysAgo} days ago`,
      daysAgo,
    }));
    igdbFetchMock.mockImplementation(
      externalGamesResponder({
        ...Object.fromEntries(
          played.map((game) => [
            game.appid,
            igdbGame(9000 + game.appid, game.name),
          ])
        ),
        [UNPLACEABLE_APP_ID]: null,
      })
    );
    stubSteam([
      ...played.map((game) =>
        steamGame(game.appid, game.name, {
          playtime: 300,
          lastPlayedDaysAgo: game.daysAgo,
        })
      ),
      steamGame(UNPLACEABLE_APP_ID, "No Catalogue Entry", {
        playtime: 300,
        lastPlayedDaysAgo: 1,
      }),
    ]);
    return played;
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

describe("@spec: 030-background-storefront-import @regression a sync with 'Also add all games to my library' ticked (2.4.1, 2.4.2)", () => {
  describe("given five games played this week, and one game the catalogue cannot place", () => {
    beforeEach(async () => {
      actions.seedRecentlyPlayedLibrary();
      await actions.sync(true);
    });

    it.each([1, 2, 3, 4, 5])(
      "puts the game played %i days ago in the library as Playing, with no cap of three",
      async (daysAgo) => {
        expect(await elements.libraryStatusOfSteamApp(70 + daysAgo)).toBe(
          "PLAYING"
        );
      }
    );

    it("ends with five games Playing, more than the three-in-progress nudge allows manually", async () => {
      expect(
        (await elements.library()).filter((item) => item.status === "PLAYING")
      ).toHaveLength(5);
    });

    it("takes the added games off the import page, leaving only the game that needs a match", async () => {
      expect(await elements.importPageNames()).toEqual(["No Catalogue Entry"]);
    });

    it("does not put the game that needs a match in the library", async () => {
      expect(await elements.library()).toHaveLength(5);
    });

    it("tells the person five games were added and one needs a match", async () => {
      expect(await elements.syncStatus()).toMatchObject({
        status: "FINISHED",
        addAllToLibrary: true,
        addedToLibrary: 5,
        needsMatch: 1,
      });
    });
  });

  describe.each([
    { daysAgo: 6, status: "PLAYING" },
    { daysAgo: 8, status: "WANT" },
  ])(
    "given a game last played $daysAgo days before the sync",
    ({ daysAgo, status }) => {
      const APP_ID = 80;

      beforeEach(async () => {
        igdbFetchMock.mockImplementation(
          externalGamesResponder({ [APP_ID]: igdbGame(9080, "Edge Of Week") })
        );
        stubSteam([
          steamGame(APP_ID, "Edge Of Week", {
            playtime: 120,
            lastPlayedDaysAgo: daysAgo,
          }),
        ]);
        await actions.sync(true);
      });

      it(`adds it as ${status}`, async () => {
        expect(await elements.libraryStatusOfSteamApp(APP_ID)).toBe(status);
      });
    }
  );
});

describe("@spec: 030-background-storefront-import @regression a sync with the box left unticked (2.4.3)", () => {
  describe("given a library with games the person tracks and found games waiting on the import page", () => {
    let libraryBefore: Awaited<ReturnType<typeof elements.library>>;

    beforeEach(async () => {
      for (const status of ["WANT", "PLAYING", "DONE"] as const) {
        const game = await createGame(db.prisma);
        await createLibraryItem(db.prisma, {
          userId: aliceId,
          gameId: game.id,
          status,
        });
      }
      libraryBefore = await elements.library();
      actions.seedRecentlyPlayedLibrary();
      await actions.sync(false);
    });

    it("leaves the library with exactly the same games and statuses", async () => {
      expect(await elements.library()).toEqual(libraryBefore);
    });

    it("lists every owned game on the import page instead", async () => {
      expect(await elements.importPageNames()).toHaveLength(6);
    });

    it("counts nothing as added", async () => {
      expect(await elements.syncStatus()).toMatchObject({
        status: "FINISHED",
        addAllToLibrary: false,
        addedToLibrary: 0,
      });
    });
  });
});

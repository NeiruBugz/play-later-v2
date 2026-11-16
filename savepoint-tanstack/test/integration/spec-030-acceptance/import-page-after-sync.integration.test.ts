/**
 * @spec: 030-background-storefront-import
 * @regression
 *
 * What the person sees on the import page while a Steam sync runs and after it
 * ends (functional-spec 2.2.1, 2.2.2, 2.3.1, 2.3.3). The whole pipeline runs
 * for real (start -> gather -> enrich through the inline queue, real
 * PostgreSQL); only Steam (HTTP edge) and IGDB (`igdbFetch`) are stubbed, so no
 * test touches the network.
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
import { importGameToLibraryWorker } from "@/features/steam-import/api/import-game-to-library.worker";
import { runEnrichMessage } from "@/features/storefront-sync/api/enrich.worker";
import { getSteamSyncStatusWorker } from "@/features/storefront-sync/api/get-sync-status.worker";
import {
  drainInlineSyncQueue,
  inlineSyncQueue,
} from "@/features/storefront-sync/api/inline-queue";
import { startSteamSyncWorker } from "@/features/storefront-sync/api/start-sync.worker";
import {
  enrichMessageSchema,
  type EnrichMessage,
} from "@/features/storefront-sync/model/messages";
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
  type IgdbCatalogueGame,
} from "../storefront-sync/stubs.ts";
import { igdbGame, LONG_AGO, steamGame, wipeSyncTables } from "./support.ts";

vi.hoisted(() => {
  process.env.STOREFRONT_SYNC_QUEUE = "inline";
});

vi.mock("@/shared/api/igdb/fetch", () => ({ igdbFetch: vi.fn() }));

const igdbFetchMock = vi.mocked(igdbFetch);

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("spec-030-import-page");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

let aliceId: string;

const elements = {
  importPage: (options: { includeIgnored?: boolean; search?: string } = {}) =>
    findImportedGamesForUser(aliceId, { limit: 100, ...options }),
  importPageNames: async (options: { includeIgnored?: boolean } = {}) =>
    (await elements.importPage(options)).games.map((game) => game.name).sort(),
  importedGame: (storefrontGameId: number) =>
    db.prisma.importedGame.findFirstOrThrow({
      where: {
        userId: aliceId,
        storefront: "STEAM",
        storefrontGameId: String(storefrontGameId),
      },
    }),
  syncStatus: () => getSteamSyncStatusWorker(aliceId),
  libraryItemsOf: (gameId: string) =>
    db.prisma.libraryItem.count({ where: { userId: aliceId, gameId } }),
  appIdsInChunk: async (message: EnrichMessage) =>
    (
      await db.prisma.importedGame.findMany({
        where: { id: { in: message.importedGameIds } },
        select: { storefrontGameId: true },
      })
    )
      .map((row) => Number(row.storefrontGameId))
      .sort((a, b) => a - b),
};

const actions = {
  sync: async () => {
    const { jobId } = await startSteamSyncWorker(aliceId, {
      addAllToLibrary: false,
    });
    await drainInlineSyncQueue();
    return jobId;
  },
  /** Gather runs; the enrich chunks wait for the test to deliver them one by one. */
  startAndHoldEnrichMessages: async () => {
    const held: EnrichMessage[] = [];
    const deliverNow = inlineSyncQueue.send.bind(inlineSyncQueue);
    const spy = vi
      .spyOn(inlineSyncQueue, "send")
      .mockImplementation(async (queue, body) => {
        if (queue === "enrich") {
          held.push(enrichMessageSchema.parse(body));
          return;
        }
        await deliverNow(queue, body);
      });
    const { jobId } = await startSteamSyncWorker(aliceId, {
      addAllToLibrary: false,
    });
    return {
      jobId,
      held,
      stopHolding: () => spy.mockRestore(),
      gatherDone: async () => {
        await drainInlineSyncQueue();
        held.sort((a, b) => a.chunkIndex - b.chunkIndex);
      },
    };
  },
  deliver: (message: EnrichMessage, receiveCount = 1) =>
    runEnrichMessage({ message, receiveCount }),
  seedOnListGame: (
    storefrontGameId: number,
    overrides: Record<string, unknown> = {}
  ) =>
    db.prisma.importedGame.create({
      data: {
        userId: aliceId,
        storefront: "STEAM",
        storefrontGameId: String(storefrontGameId),
        name: `Earlier name ${storefrontGameId}`,
        createdAt: LONG_AGO,
        ...overrides,
      },
    }),
  knowCatalogue: (catalogue: Record<string, IgdbCatalogueGame | null>) =>
    igdbFetchMock.mockImplementation(externalGamesResponder(catalogue)),
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

describe("@spec: 030-background-storefront-import @regression the import page after a sync (2.3.1)", () => {
  describe("given an earlier sync, a removed game, an owned-library game and a game Steam no longer lists", () => {
    const REFRESHED = 11;
    const REMOVED = 12;
    const IN_LIBRARY = 13;
    const NO_LONGER_ON_STEAM = 14;
    const BOUGHT_SINCE = 15;
    let libraryItemsBefore: number;

    beforeEach(async () => {
      await actions.seedOnListGame(REFRESHED, { playtime: 10 });
      await actions.seedOnListGame(REMOVED, {
        igdbMatchStatus: "IGNORED",
        playtime: 5,
      });
      await actions.seedOnListGame(NO_LONGER_ON_STEAM);
      const owned = await createGame(db.prisma, {
        title: "Already Mine",
        steamAppId: IN_LIBRARY,
      });
      await createLibraryItem(db.prisma, {
        userId: aliceId,
        gameId: owned.id,
        status: "DONE",
      });
      await actions.seedOnListGame(IN_LIBRARY, {
        gameId: owned.id,
        lookedUpAt: LONG_AGO,
      });
      libraryItemsBefore = await db.prisma.libraryItem.count();

      stubSteam([
        steamGame(REFRESHED, "Renamed On Steam", {
          playtime: 500,
          lastPlayedDaysAgo: 1,
        }),
        steamGame(REMOVED, "Removed But Still Owned", { playtime: 60 }),
        steamGame(IN_LIBRARY, "Already Mine"),
        steamGame(BOUGHT_SINCE, "Bought Since Last Sync"),
      ]);
      await actions.sync();
    });

    it("lists the game bought since the last sync", async () => {
      expect(await elements.importPageNames()).toContain(
        "Bought Since Last Sync"
      );
    });

    it("refreshes the Steam name, time played and last-played date of a game already on the list", async () => {
      const row = await elements.importedGame(REFRESHED);

      expect(row).toMatchObject({ name: "Renamed On Steam", playtime: 500 });
      expect(row.lastPlayedAt).not.toBeNull();
    });

    it("keeps a game that Steam no longer lists on the list", async () => {
      expect(await elements.importPageNames()).toContain(
        `Earlier name ${NO_LONGER_ON_STEAM}`
      );
    });

    it("does not bring a game already in the library back", async () => {
      expect(await elements.importPageNames()).not.toContain("Already Mine");
    });

    it("leaves the library as it was", async () => {
      expect(await db.prisma.libraryItem.count()).toBe(libraryItemsBefore);
    });

    it("hides the removed game from the list", async () => {
      expect(await elements.importPageNames()).not.toContain(
        "Removed But Still Owned"
      );
    });

    it("lists the removed game only when removed games are shown, still removed", async () => {
      const names = await elements.importPageNames({ includeIgnored: true });

      expect(names.some((name) => name.startsWith("Removed But"))).toBe(true);
      expect((await elements.importedGame(REMOVED)).igdbMatchStatus).toBe(
        "IGNORED"
      );
    });
  });
});

describe("@spec: 030-background-storefront-import @regression games imported before the feature (2.2.2)", () => {
  describe("given rows imported long ago that were never looked up, the catalogue knowing two of the three", () => {
    const STILL_OWNED_AND_KNOWN = 21;
    const STILL_OWNED_UNKNOWN = 22;
    const NO_LONGER_OWNED_BUT_KNOWN = 23;
    const NEWLY_BOUGHT = 24;

    beforeEach(async () => {
      for (const appId of [
        STILL_OWNED_AND_KNOWN,
        STILL_OWNED_UNKNOWN,
        NO_LONGER_OWNED_BUT_KNOWN,
      ]) {
        await actions.seedOnListGame(appId, { igdbMatchStatus: "PENDING" });
      }
      actions.knowCatalogue({
        [STILL_OWNED_AND_KNOWN]: igdbGame(8021, "Known Legacy"),
        [STILL_OWNED_UNKNOWN]: null,
        [NO_LONGER_OWNED_BUT_KNOWN]: igdbGame(8023, "Known Legacy Delisted"),
        [NEWLY_BOUGHT]: igdbGame(8024, "Newly Bought"),
      });
      stubSteam([
        steamGame(STILL_OWNED_AND_KNOWN, "Known Legacy"),
        steamGame(STILL_OWNED_UNKNOWN, "Unknown Legacy"),
        steamGame(NEWLY_BOUGHT, "Newly Bought"),
      ]);
      await actions.sync();
    });

    it("shows a legacy game the catalogue knows as found", async () => {
      expect(await elements.importedGame(STILL_OWNED_AND_KNOWN)).toMatchObject({
        gameId: expect.any(String),
        lookedUpAt: expect.any(Date),
      });
    });

    it("shows a legacy game the catalogue lacks as needing a match", async () => {
      expect(await elements.importedGame(STILL_OWNED_UNKNOWN)).toMatchObject({
        gameId: null,
        lookedUpAt: expect.any(Date),
      });
    });

    it("also looks up a legacy game that has since left the Steam library", async () => {
      expect(
        await elements.importedGame(NO_LONGER_OWNED_BUT_KNOWN)
      ).toMatchObject({
        gameId: expect.any(String),
        lookedUpAt: expect.any(Date),
      });
    });

    it("counts the legacy needs-a-match game in the finished sync's summary", async () => {
      expect((await elements.syncStatus())?.needsMatch).toBe(1);
    });
  });
});

describe("@spec: 030-background-storefront-import @regression the import page while the sync is still looking games up (2.2.1, 2.2.2)", () => {
  describe("given 250 owned games that IGDB places when their Steam app id is even, in two chunks", () => {
    let held: EnrichMessage[];
    let jobId: string;
    let chunkOneAppIds: number[];

    beforeEach(async () => {
      const owned = Array.from({ length: 250 }, (_unused, index) =>
        steamGame(3000 + index, `Owned ${3000 + index}`)
      );
      actions.knowCatalogue(
        Object.fromEntries(
          owned
            .filter((game) => game.appid % 2 === 0)
            .map((game) => [
              game.appid,
              igdbGame(game.appid + 100_000, `Catalogue ${game.appid}`),
            ])
        )
      );
      stubSteam(owned);
      const run = await actions.startAndHoldEnrichMessages();
      jobId = run.jobId;
      await run.gatherDone();
      held = run.held;
      chunkOneAppIds = await elements.appIdsInChunk(held[0] as EnrichMessage);
    });

    it("lists every game straight after Steam's list has arrived, none yet looked up", async () => {
      const rows = await db.prisma.importedGame.findMany({
        where: { userId: aliceId },
      });

      expect(rows).toHaveLength(250);
      expect(rows.every((row) => row.lookedUpAt === null)).toBe(true);
    });

    describe("when only the first chunk has been looked up and the person reloads the page", () => {
      beforeEach(async () => {
        await actions.deliver(held[0] as EnrichMessage);
      });

      it("shows a looked-up game as found, with its catalogue title", async () => {
        const evenAppId = chunkOneAppIds.find((id) => id % 2 === 0) as number;

        const { games } = await elements.importPage({
          search: `Owned ${evenAppId}`,
        });

        expect(games[0]?.game?.title).toBe(`Catalogue ${evenAppId}`);
      });

      it("shows a looked-up game the catalogue lacks as needing a match", async () => {
        const oddAppId = chunkOneAppIds.find((id) => id % 2 === 1) as number;

        const { games } = await elements.importPage({
          search: `Owned ${oddAppId}`,
        });

        expect(games[0]).toMatchObject({
          game: null,
          lookedUpAt: expect.any(Date),
        });
      });

      it("shows a game from the chunk still waiting with its Steam name and no label", async () => {
        const waitingAppId = (
          await elements.appIdsInChunk(held[1] as EnrichMessage)
        )[0] as number;

        const { games } = await elements.importPage({
          search: `Owned ${waitingAppId}`,
        });

        expect(games[0]).toMatchObject({ game: null, lookedUpAt: null });
      });
    });

    describe("when the person adds a found game from the page before the sync ends", () => {
      let addedGameId: string;
      let addedGameSteamName: string;

      beforeEach(async () => {
        await actions.deliver(held[0] as EnrichMessage);
        const evenAppId = chunkOneAppIds.find((id) => id % 2 === 0) as number;
        const row = await elements.importedGame(evenAppId);
        addedGameId = row.gameId as string;
        addedGameSteamName = row.name;
        await importGameToLibraryWorker(aliceId, {
          importedGameId: row.id,
          status: "WANT",
        });
        await actions.deliver(held[1] as EnrichMessage);
      });

      it("finishes the sync", async () => {
        expect(await elements.syncStatus()).toMatchObject({
          jobId,
          status: "FINISHED",
        });
      });

      it("keeps the game in the library exactly once", async () => {
        expect(await elements.libraryItemsOf(addedGameId)).toBe(1);
      });

      it("does not bring the game back onto the import page", async () => {
        const { games } = await elements.importPage({
          search: addedGameSteamName,
        });

        expect(games).toEqual([]);
      });
    });
  });

  describe("given 450 owned games unknown to the catalogue, in three chunks, and Steam slow to answer", () => {
    it("reports first that the Steam library is being fetched, then a lookup count that grows to the total", async () => {
      const steam = stubSteam(
        Array.from({ length: 450 }, (_unused, index) =>
          steamGame(5000 + index, `Owned ${5000 + index}`)
        ),
        { hold: true }
      );
      const run = await actions.startAndHoldEnrichMessages();
      await vi.waitFor(async () =>
        expect((await elements.syncStatus())?.status).toBe("GATHERING")
      );
      const whileFetching = await elements.syncStatus();

      steam.release();
      await run.gatherDone();
      const afterGather = await elements.syncStatus();
      const lookedUpAfterEachChunk: number[] = [];
      for (const message of run.held) {
        await actions.deliver(message);
        lookedUpAfterEachChunk.push(
          (await elements.syncStatus())?.lookedUp as number
        );
      }
      const finished = await elements.syncStatus();

      expect(whileFetching).toMatchObject({
        status: "GATHERING",
        totalToLookUp: 0,
      });
      expect(afterGather).toMatchObject({
        status: "LOOKING_UP",
        totalToLookUp: 450,
        lookedUp: 0,
      });
      expect(lookedUpAfterEachChunk).toEqual([200, 400, 450]);
      expect(finished).toMatchObject({
        status: "FINISHED",
        totalToLookUp: 450,
        lookedUp: 450,
      });
    });
  });
});

describe("@spec: 030-background-storefront-import @regression a game that needed a match because the catalogue was unavailable (2.3.3)", () => {
  describe("given IGDB was down for every delivery attempt of the first sync", () => {
    const APP_ID = 31;

    beforeEach(async () => {
      stubSteam([steamGame(APP_ID, "Catalogue Shy")]);
      igdbFetchMock.mockRejectedValue(new Error("IGDB unavailable"));
      const run = await actions.startAndHoldEnrichMessages();
      await run.gatherDone();
      for (const message of run.held) {
        await actions.deliver(message, 3);
      }
      run.stopHolding();
    });

    it("shows the game as needing a match once the first sync ends", async () => {
      expect(await elements.importedGame(APP_ID)).toMatchObject({
        gameId: null,
        lookedUpAt: expect.any(Date),
      });
      expect((await elements.syncStatus())?.status).toBe("FINISHED");
    });

    describe("when the person syncs again with IGDB available", () => {
      beforeEach(async () => {
        igdbFetchMock.mockReset();
        actions.knowCatalogue({ [APP_ID]: igdbGame(8031, "Catalogue Shy") });
        stubSteam([steamGame(APP_ID, "Catalogue Shy")]);
        await actions.sync();
      });

      it("shows the game as found", async () => {
        expect(await elements.importedGame(APP_ID)).toMatchObject({
          gameId: expect.any(String),
          lookedUpAt: expect.any(Date),
        });
      });

      it("no longer counts it as needing a match", async () => {
        expect((await elements.syncStatus())?.needsMatch).toBe(0);
      });
    });
  });
});

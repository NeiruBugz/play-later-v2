/**
 * RED integration tests for spec 030 Slice 3: "Also add all games to my
 * library" puts every found game into the library.
 *
 * CONTRACT (implementers build against exactly this; paths are under src/)
 *
 *   features/storefront-sync/api/start-sync.worker.ts
 *     startSteamSyncWorker(userId, { addAllToLibrary: true }) stores
 *     ImportJob.addAllToLibrary = true (already built in Slice 1).
 *
 *   entities/imported-game/lib/calculate-smart-status.ts
 *     calculateSmartStatus({ playtime?, lastPlayedAt }) -> LibraryItemStatus,
 *     moved from features/steam-import/lib/ (see its unit test).
 *
 *   features/storefront-sync/api/gather.worker.ts  (add-all ON)
 *     - findLookupCandidates(..., { includeResolved: true }): rows the catalogue
 *       already knows (gameId set) that are live, not IGNORED, not MATCHED and
 *       not in the library are chunked too, in id order, <= 200 per chunk
 *     - chunk.lookupCount = rows IN THAT CHUNK that still need a lookup
 *       (gameId IS NULL); it is NOT importedGameIds.length any more
 *     - the plan keeps Slice 2's progress counting: totalToLookUp = candidates
 *       (every row in the chunks), lookedUp = rows resolved locally by this
 *       gather. A locally resolved row must not be counted twice.
 *     - add-all OFF is unchanged: only rows needing a lookup are chunked
 *
 *   features/storefront-sync/api/enrich.worker.ts  runEnrichMessage (add-all ON)
 *     After the lookup, for each row of the chunk that is live, not IGNORED, has
 *     a gameId (found) and no LibraryItem for (userId, gameId):
 *       ONE short transaction using only `tx`:
 *         skip if a LibraryItem for (userId, gameId) exists (a Done game stays
 *         Done, untouched) -> createWantLibraryItem
 *         -> setLibraryItemStatusInTx(..., "PLAYING") ONLY when
 *            calculateSmartStatus({ playtime, lastPlayedAt }) says PLAYING
 *            (last played within 7 days of NOW; opens a Playthrough with
 *            finishedAt null), otherwise the item stays WANT with no play
 *         -> ImportedGame.igdbMatchStatus = "MATCHED"
 *     - rows are processed in id order (the order gather chunked them)
 *     - a unique violation on (userId, gameId) (P2002: another writer won the
 *       race between the existence check and the insert) counts as SKIPPED: it
 *       does not fail the delivery, does not stop the rest of the chunk, and
 *       leaves the racer's item untouched
 *     - any other failure (e.g. DB) FAILS the delivery (throws) so the queue
 *       retries it; games already added by earlier per-game transactions STAY
 *       in the library
 *     - IGNORED rows and needs-a-match rows (IGDB cannot place them) are never added
 *     - recordChunkDone(..., { lookupCount, added }) where added = rows of the
 *       chunk that are MATCHED once the chunk has been processed, NOT "rows added
 *       by this delivery". That keeps ImportJob.addedToLibrary right after a crash
 *       and rerun, and a duplicate delivery adds nothing twice
 *     - add-all OFF: nothing is added, addedToLibrary stays 0
 *
 * HOW "crash and rerun" IS EXERCISED (real code, real DB, no spying on the
 * implementation): the first delivery of a three-game chunk fails because a
 * Postgres trigger rejects the LibraryItem INSERT for the game of the LAST row
 * (rows are processed in id order, so the first two commit first). The trigger
 * is then dropped and the SAME message is delivered again with receiveCount 2.
 *
 * HOW the P2002 race IS EXERCISED (deterministic): a second connection opens a
 * transaction that INSERTs a Done LibraryItem for one game of the chunk and
 * holds it uncommitted. The enrich worker's existence check cannot see it, so
 * its INSERT blocks on the unique index (observed through pg_stat_activity).
 * Committing the racer then makes that INSERT fail with P2002.
 *
 * Steam is stubbed at the HTTP edge, IGDB at `src/shared/api/igdb/fetch.ts`
 * (see ./stubs.ts). Enrich messages are intercepted by spying on the inline
 * queue's `send` when a test needs to deliver them by hand.
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
  requestedSteamAppIds,
  STEAM_ID_64,
  steamLastPlayedDaysAgo,
  stubSteam,
  type IgdbCatalogueGame,
  type RawSteamGame,
} from "./stubs.ts";

vi.hoisted(() => {
  process.env.STOREFRONT_SYNC_QUEUE = "inline";
});

vi.mock("@/shared/api/igdb/fetch", () => ({ igdbFetch: vi.fn() }));

const igdbFetchMock = vi.mocked(igdbFetch);

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("storefront-sync-add-all");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

const FAIL_LIBRARY_INSERT_TRIGGER = "fail_library_insert_for_one_game";

const igdbGame = (id: number, name: string): IgdbCatalogueGame => ({
  id,
  name,
  slug: name.toLowerCase().replaceAll(" ", "-"),
  game_type: 0,
});

const steamGame = (
  appid: number,
  name: string,
  lastPlayedDaysAgo?: number
): RawSteamGame => ({
  appid,
  name,
  playtime_forever: lastPlayedDaysAgo === undefined ? 0 : 300,
  ...(lastPlayedDaysAgo === undefined
    ? {}
    : { rtime_last_played: steamLastPlayedDaysAgo(lastPlayedDaysAgo) }),
});

const STEAM_APP = {
  playedThisWeek: 101,
  setAsideMonthAgo: 102,
  neverPlayed: 103,
  alreadyInCatalogueAndPlayedYesterday: 104,
  igdbCannotPlace: 105,
  removedByUser: 106,
  alreadyInLibraryAsDone: 107,
} as const;

let aliceId: string;

const elements = {
  findImportedGame: (storefrontGameId: string | number) =>
    db.prisma.importedGame.findFirstOrThrow({
      where: {
        userId: aliceId,
        storefront: "STEAM",
        storefrontGameId: String(storefrontGameId),
      },
    }),
  findImportJob: (jobId: string) =>
    db.prisma.importJob.findUniqueOrThrow({ where: { id: jobId } }),
  libraryItemForSteamApp: async (appId: string | number) => {
    const row = await elements.findImportedGame(appId);
    if (!row.gameId) return null;
    return db.prisma.libraryItem.findUnique({
      where: { userId_gameId: { userId: aliceId, gameId: row.gameId } },
    });
  },
  playsOf: (libraryItemId: number) =>
    db.prisma.playthrough.findMany({ where: { libraryItemId } }),
  libraryItemCount: () =>
    db.prisma.libraryItem.count({ where: { userId: aliceId } }),
  syncStatus: () => getSteamSyncStatusWorker(aliceId),
  igdbRequestedIds: (callIndex: number) =>
    requestedSteamAppIds(String(igdbFetchMock.mock.calls[callIndex]?.[1])),
};

const actions = {
  sync: async (addAllToLibrary: boolean) => {
    const { jobId } = await startSteamSyncWorker(aliceId, { addAllToLibrary });
    await drainInlineSyncQueue();
    return jobId;
  },
  /** Runs gather but keeps the enrich messages for the test to deliver by hand. */
  syncHoldingEnrichMessages: async (addAllToLibrary: boolean) => {
    const held: EnrichMessage[] = [];
    const deliverNow = inlineSyncQueue.send.bind(inlineSyncQueue);
    vi.spyOn(inlineSyncQueue, "send").mockImplementation(
      async (queue, body) => {
        if (queue === "enrich") {
          held.push(enrichMessageSchema.parse(body));
          return;
        }
        await deliverNow(queue, body);
      }
    );
    const { jobId } = await startSteamSyncWorker(aliceId, { addAllToLibrary });
    await drainInlineSyncQueue();
    held.sort((a, b) => a.chunkIndex - b.chunkIndex);
    expect(
      held,
      "gather must send the games to be added as one enrich chunk"
    ).toHaveLength(1);
    return { jobId, held };
  },
  /** A catalogue game the sync can resolve locally by its Steam app id. */
  createCatalogueGame: (steamAppId: number, igdbId: number) =>
    createGame(db.prisma, {
      igdbId,
      title: `Catalogue ${steamAppId}`,
      slug: `catalogue-${steamAppId}`,
      steamAppId,
    }),
  /**
   * The owned library the main scenarios sync: found by IGDB, found in the
   * catalogue, unplaceable, removed by the user and already in the library.
   */
  seedMixedOwnedLibrary: async () => {
    await actions.createCatalogueGame(
      STEAM_APP.alreadyInCatalogueAndPlayedYesterday,
      7104
    );
    const removedGame = await actions.createCatalogueGame(
      STEAM_APP.removedByUser,
      7106
    );
    const doneGame = await actions.createCatalogueGame(
      STEAM_APP.alreadyInLibraryAsDone,
      7107
    );
    await createLibraryItem(db.prisma, {
      userId: aliceId,
      gameId: doneGame.id,
      status: "DONE",
    });
    await db.prisma.importedGame.create({
      data: {
        userId: aliceId,
        storefront: "STEAM",
        storefrontGameId: String(STEAM_APP.alreadyInLibraryAsDone),
        name: "Finished Long Ago",
        gameId: doneGame.id,
        lookedUpAt: new Date("2024-01-01T00:00:00.000Z"),
      },
    });
    await db.prisma.importedGame.create({
      data: {
        userId: aliceId,
        storefront: "STEAM",
        storefrontGameId: String(STEAM_APP.removedByUser),
        name: "Removed by the user",
        igdbMatchStatus: "IGNORED",
        gameId: removedGame.id,
        lookedUpAt: new Date("2024-01-01T00:00:00.000Z"),
      },
    });
    igdbFetchMock.mockImplementation(
      externalGamesResponder({
        [STEAM_APP.playedThisWeek]: igdbGame(7101, "Played This Week"),
        [STEAM_APP.setAsideMonthAgo]: igdbGame(7102, "Set Aside"),
        [STEAM_APP.neverPlayed]: igdbGame(7103, "Never Played"),
        [STEAM_APP.igdbCannotPlace]: null,
        [STEAM_APP.removedByUser]: igdbGame(7106, "Removed By The User"),
      })
    );
    stubSteam([
      steamGame(STEAM_APP.playedThisWeek, "Played This Week", 2),
      steamGame(STEAM_APP.setAsideMonthAgo, "Set Aside", 30),
      steamGame(STEAM_APP.neverPlayed, "Never Played"),
      steamGame(
        STEAM_APP.alreadyInCatalogueAndPlayedYesterday,
        "Catalogue Game",
        1
      ),
      steamGame(STEAM_APP.igdbCannotPlace, "Unplaceable", 3),
      steamGame(STEAM_APP.removedByUser, "Removed By The User", 1),
      steamGame(STEAM_APP.alreadyInLibraryAsDone, "Finished Long Ago", 1),
    ]);
  },
  /** Catalogue-known games the sync resolves locally, so no IGDB is involved. */
  seedCatalogueKnownOwnedGames: async (appIds: number[]) => {
    const games = [];
    for (const [index, appId] of appIds.entries()) {
      games.push(await actions.createCatalogueGame(appId, 7200 + index));
    }
    stubSteam(appIds.map((appId) => steamGame(appId, `Owned ${appId}`, 1)));
    return games;
  },
  failLibraryInsertFor: async (gameId: string) => {
    await db.prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION ${FAIL_LIBRARY_INSERT_TRIGGER}() RETURNS trigger AS $$
      BEGIN
        IF NEW."gameId" = '${gameId}' THEN
          RAISE EXCEPTION 'simulated crash while adding the game';
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);
    await db.prisma.$executeRawUnsafe(`
      CREATE TRIGGER ${FAIL_LIBRARY_INSERT_TRIGGER}
      BEFORE INSERT ON "LibraryItem"
      FOR EACH ROW EXECUTE FUNCTION ${FAIL_LIBRARY_INSERT_TRIGGER}()
    `);
  },
  stopFailingLibraryInserts: () =>
    db.prisma.$executeRawUnsafe(
      `DROP TRIGGER IF EXISTS ${FAIL_LIBRARY_INSERT_TRIGGER} ON "LibraryItem"`
    ),
  /**
   * Delivers `message` while another connection holds an uncommitted Done
   * LibraryItem for `racedGameId`; commits that racer once the enrich worker is
   * blocked on it (or has finished without ever touching it).
   */
  deliverWhileAnotherWriterAddsTheGame: async (
    message: EnrichMessage,
    racedGameId: string
  ) => {
    let markInserted: () => void = () => {};
    let commitRacer: () => void = () => {};
    const racerInserted = new Promise<void>((resolve) => {
      markInserted = resolve;
    });
    const racerMayCommit = new Promise<void>((resolve) => {
      commitRacer = resolve;
    });
    const racerCommitted = db.prisma.$transaction(
      async (tx) => {
        await tx.libraryItem.create({
          data: {
            userId: aliceId,
            gameId: racedGameId,
            status: "DONE",
            isOwned: true,
          },
        });
        markInserted();
        await racerMayCommit;
      },
      { timeout: 30_000 }
    );
    await racerInserted;

    let deliverySettled = false;
    const delivery = runEnrichMessage({ message, receiveCount: 1 });
    delivery.then(
      () => {
        deliverySettled = true;
      },
      () => {
        deliverySettled = true;
      }
    );

    const deadline = Date.now() + 5000;
    while (!deliverySettled && Date.now() < deadline) {
      const [{ waiting }] = await db.prisma.$queryRaw<{ waiting: number }[]>`
        SELECT count(*)::int AS waiting FROM pg_stat_activity
        WHERE datname = current_database() AND wait_event_type = 'Lock'
      `;
      if (waiting > 0) break;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    commitRacer();
    await racerCommitted;
    await delivery;
  },
};

beforeEach(async () => {
  igdbFetchMock.mockReset();
  igdbFetchMock.mockImplementation(externalGamesResponder({}));
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.importJob.deleteMany();
  await db.prisma.importedGame.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
  aliceId = (await createUser(db.prisma, { steamId64: STEAM_ID_64 })).id;
});

afterEach(async () => {
  await drainInlineSyncQueue();
  await actions.stopFailingLibraryInserts();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("add-all: a sync with the box ticked", () => {
  describe("given a mixed owned library", () => {
    let jobId: string;

    beforeEach(async () => {
      await actions.seedMixedOwnedLibrary();
      jobId = await actions.sync(true);
    });

    it("remembers on the job that the user asked to add everything", async () => {
      expect((await elements.findImportJob(jobId)).addAllToLibrary).toBe(true);
    });

    it.each([
      ["found by IGDB and played 2 days ago", STEAM_APP.playedThisWeek],
      [
        "already in the catalogue and played yesterday",
        STEAM_APP.alreadyInCatalogueAndPlayedYesterday,
      ],
    ])(
      "adds a game %s as PLAYING with a play in progress",
      async (_label, appId) => {
        const item = await elements.libraryItemForSteamApp(appId);

        expect(item?.status).toBe("PLAYING");
        expect(
          (await elements.playsOf(item?.id ?? -1)).map((play) => [
            play.status,
            play.finishedAt,
          ])
        ).toEqual([["PLAYING", null]]);
      }
    );

    it.each([
      ["last played 30 days ago", STEAM_APP.setAsideMonthAgo],
      ["never played", STEAM_APP.neverPlayed],
    ])("adds a game %s as WANT with no play", async (_label, appId) => {
      const item = await elements.libraryItemForSteamApp(appId);

      expect(item?.status).toBe("WANT");
      expect(await elements.playsOf(item?.id ?? -1)).toEqual([]);
    });

    it("takes the added games off the list of games that need work", async () => {
      const statuses = await Promise.all(
        [
          STEAM_APP.playedThisWeek,
          STEAM_APP.setAsideMonthAgo,
          STEAM_APP.neverPlayed,
          STEAM_APP.alreadyInCatalogueAndPlayedYesterday,
        ].map(
          async (appId) =>
            (await elements.findImportedGame(appId)).igdbMatchStatus
        )
      );

      expect(statuses).toEqual(["MATCHED", "MATCHED", "MATCHED", "MATCHED"]);
    });

    it("leaves a game that is already in the library as it was", async () => {
      const item = await elements.libraryItemForSteamApp(
        STEAM_APP.alreadyInLibraryAsDone
      );

      expect(item?.status).toBe("DONE");
      expect(await elements.playsOf(item?.id ?? -1)).toEqual([]);
    });

    it("does not add a game the user removed, even though IGDB knows it", async () => {
      const removed = await elements.findImportedGame(STEAM_APP.removedByUser);

      expect(removed.igdbMatchStatus).toBe("IGNORED");
      expect(
        await elements.libraryItemForSteamApp(STEAM_APP.removedByUser)
      ).toBe(null);
    });

    it("does not add a game IGDB cannot place, and keeps it as needing a match", async () => {
      const unplaced = await elements.findImportedGame(
        STEAM_APP.igdbCannotPlace
      );

      expect(unplaced).toMatchObject({
        gameId: null,
        igdbMatchStatus: "PENDING",
      });
      expect(unplaced.lookedUpAt).not.toBeNull();
    });

    it("adds nothing beyond the four found games", async () => {
      expect(await elements.libraryItemCount()).toBe(1 + 4);
    });

    it("counts the four added games on the job and finishes it", async () => {
      expect(await elements.syncStatus()).toMatchObject({
        jobId,
        status: "FINISHED",
        addedToLibrary: 4,
      });
    });
  });

  describe("given a mixed owned library, when the sync is gathered", () => {
    let jobId: string;
    let held: EnrichMessage[];

    beforeEach(async () => {
      await actions.seedMixedOwnedLibrary();
      ({ jobId, held } = await actions.syncHoldingEnrichMessages(true));
    });

    it("sends every game still to be added in one chunk, the catalogue-known one included", async () => {
      const expectedIds = (
        await Promise.all(
          [
            STEAM_APP.playedThisWeek,
            STEAM_APP.setAsideMonthAgo,
            STEAM_APP.neverPlayed,
            STEAM_APP.alreadyInCatalogueAndPlayedYesterday,
            STEAM_APP.igdbCannotPlace,
          ].map(async (appId) => (await elements.findImportedGame(appId)).id)
        )
      ).sort();

      expect(held).toHaveLength(1);
      expect([...(held[0]?.importedGameIds ?? [])].sort()).toEqual(expectedIds);
    });

    it("asks the chunk to look up only the games the catalogue does not know", () => {
      expect(held[0]).toMatchObject({
        v: 1,
        jobId,
        chunkIndex: 0,
        lookupCount: 4,
      });
    });

    it("counts each game once in the progress: the catalogue-known one as already looked up", async () => {
      expect(await elements.syncStatus()).toMatchObject({
        jobId,
        status: "LOOKING_UP",
        totalToLookUp: 5,
        lookedUp: 1,
        addedToLibrary: 0,
      });
    });

    it("has not asked IGDB or added anything yet", async () => {
      expect(igdbFetchMock).not.toHaveBeenCalled();
      expect(await elements.libraryItemCount()).toBe(1);
    });

    describe("when the chunk is delivered", () => {
      beforeEach(async () => {
        await runEnrichMessage({ message: held[0]!, receiveCount: 1 });
      });

      it("asks IGDB only about the games the catalogue did not know", () => {
        expect(elements.igdbRequestedIds(0).sort()).toEqual(
          [
            STEAM_APP.playedThisWeek,
            STEAM_APP.setAsideMonthAgo,
            STEAM_APP.neverPlayed,
            STEAM_APP.igdbCannotPlace,
          ]
            .map(String)
            .sort()
        );
      });

      it("finishes the job with all five games looked up and four added", async () => {
        expect(await elements.syncStatus()).toMatchObject({
          status: "FINISHED",
          totalToLookUp: 5,
          lookedUp: 5,
          addedToLibrary: 4,
        });
      });
    });
  });

  describe("given a chunk is delivered twice", () => {
    let jobId: string;
    let held: EnrichMessage[];

    beforeEach(async () => {
      await actions.seedCatalogueKnownOwnedGames([301, 302]);
      ({ jobId, held } = await actions.syncHoldingEnrichMessages(true));
      await runEnrichMessage({ message: held[0]!, receiveCount: 1 });
      await runEnrichMessage({ message: held[0]!, receiveCount: 2 });
    });

    it("adds each game once and counts it once", async () => {
      expect(await elements.libraryItemCount()).toBe(2);
      expect(await elements.syncStatus()).toMatchObject({
        jobId,
        status: "FINISHED",
        addedToLibrary: 2,
      });
    });
  });

  describe("given another writer adds a game to the library while the chunk is being added", () => {
    let racedGameId: string;
    let otherGameId: string;
    let jobId: string;
    let held: EnrichMessage[];

    beforeEach(async () => {
      const games = await actions.seedCatalogueKnownOwnedGames([201, 202]);
      ({ jobId, held } = await actions.syncHoldingEnrichMessages(true));
      racedGameId = games[0]!.id;
      otherGameId = games[1]!.id;
      await actions.deliverWhileAnotherWriterAddsTheGame(held[0]!, racedGameId);
    });

    it("does not fail the delivery and leaves the other writer's item untouched", async () => {
      const raced = await db.prisma.libraryItem.findUniqueOrThrow({
        where: { userId_gameId: { userId: aliceId, gameId: racedGameId } },
      });

      expect(raced.status).toBe("DONE");
      expect(await elements.playsOf(raced.id)).toEqual([]);
    });

    it("still adds the other game in the chunk", async () => {
      const other = await db.prisma.libraryItem.findUnique({
        where: { userId_gameId: { userId: aliceId, gameId: otherGameId } },
      });

      expect(other?.status).toBe("PLAYING");
    });

    it("counts only the game this sync added, and finishes the job", async () => {
      expect(await elements.syncStatus()).toMatchObject({
        jobId,
        status: "FINISHED",
        addedToLibrary: 1,
      });
    });
  });

  describe("given a game was added to the library after the sync was gathered", () => {
    let jobId: string;
    let held: EnrichMessage[];
    let addedElsewhereGameId: string;

    beforeEach(async () => {
      const games = await actions.seedCatalogueKnownOwnedGames([211, 212]);
      ({ jobId, held } = await actions.syncHoldingEnrichMessages(true));
      addedElsewhereGameId = games[0]!.id;
      await createLibraryItem(db.prisma, {
        userId: aliceId,
        gameId: addedElsewhereGameId,
        status: "DONE",
      });
      await runEnrichMessage({ message: held[0]!, receiveCount: 1 });
    });

    it("keeps that item as it is and adds only the other game", async () => {
      const kept = await db.prisma.libraryItem.findUniqueOrThrow({
        where: {
          userId_gameId: { userId: aliceId, gameId: addedElsewhereGameId },
        },
      });

      expect(kept.status).toBe("DONE");
      expect(await elements.libraryItemCount()).toBe(2);
      expect(await elements.syncStatus()).toMatchObject({
        jobId,
        status: "FINISHED",
        addedToLibrary: 1,
      });
    });
  });

  describe("given adding the last game of a chunk fails", () => {
    let jobId: string;
    let held: EnrichMessage[];
    let failingGameId: string;
    let firstDelivery: Promise<void>;

    beforeEach(async () => {
      await actions.seedCatalogueKnownOwnedGames([301, 302, 303]);
      ({ jobId, held } = await actions.syncHoldingEnrichMessages(true));
      const rowsInChunkOrder = await db.prisma.importedGame.findMany({
        where: { id: { in: held[0]!.importedGameIds } },
        orderBy: { id: "asc" },
      });
      failingGameId = rowsInChunkOrder.at(-1)!.gameId!;
      await actions.failLibraryInsertFor(failingGameId);
      firstDelivery = runEnrichMessage({ message: held[0]!, receiveCount: 1 });
    });

    it("fails the delivery so the queue retries it", async () => {
      await expect(firstDelivery).rejects.toThrow();
    });

    it("keeps the games added before the failure in the library", async () => {
      await firstDelivery.catch(() => undefined);

      const inLibrary = await db.prisma.libraryItem.findMany({
        where: { userId: aliceId },
      });
      expect(inLibrary).toHaveLength(2);
      expect(inLibrary.map((item) => item.gameId)).not.toContain(failingGameId);
    });

    it("has not recorded the chunk, so the job is still running with nothing counted", async () => {
      await firstDelivery.catch(() => undefined);

      expect(await elements.syncStatus()).toMatchObject({
        jobId,
        status: "LOOKING_UP",
        addedToLibrary: 0,
      });
    });

    describe("when the same message is delivered again and now succeeds", () => {
      beforeEach(async () => {
        await firstDelivery.catch(() => undefined);
        await actions.stopFailingLibraryInserts();
        await runEnrichMessage({ message: held[0]!, receiveCount: 2 });
      });

      it("has all three games in the library", async () => {
        expect(await elements.libraryItemCount()).toBe(3);
      });

      it("counts all three as added, including the two added by the first delivery", async () => {
        expect(await elements.syncStatus()).toMatchObject({
          jobId,
          status: "FINISHED",
          addedToLibrary: 3,
        });
      });
    });
  });
});

describe("add-all: a sync with the box unticked", () => {
  describe("given a mixed owned library", () => {
    let jobId: string;

    beforeEach(async () => {
      await actions.seedMixedOwnedLibrary();
      jobId = await actions.sync(false);
    });

    it("adds nothing to the library", async () => {
      expect(await elements.libraryItemCount()).toBe(1);
    });

    it("still looks the found games up, leaving them on the import page", async () => {
      const row = await elements.findImportedGame(STEAM_APP.playedThisWeek);

      expect(row.gameId).not.toBeNull();
      expect(row.igdbMatchStatus).toBe("PENDING");
    });

    it("finishes the job with nothing counted as added", async () => {
      expect(await elements.syncStatus()).toMatchObject({
        jobId,
        status: "FINISHED",
        addedToLibrary: 0,
      });
      expect((await elements.findImportJob(jobId)).addAllToLibrary).toBe(false);
    });
  });
});

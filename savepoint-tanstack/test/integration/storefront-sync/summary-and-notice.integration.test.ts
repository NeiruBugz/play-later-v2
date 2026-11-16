/**
 * RED integration tests for spec 030 Slice 4: a finished sync carries an honest
 * summary, and its "sync finished" notice can be marked seen.
 *
 * CONTRACT (implementers build against exactly this; paths are under src/)
 *
 *   Summary counts on ImportJob (tech 2.6), read through getSteamSyncStatusWorker
 *     refreshedGames  computed at GATHER, before any add-all addition: rows that
 *                     existed before the job (createdAt < job.createdAt), are not
 *                     IGNORED, not MATCHED, and whose gameId is not in the user's
 *                     library. These are exactly the games the import page showed
 *                     before the sync. Written by recordGatherPlan (gather.worker
 *                     currently passes 0).
 *     newGames        computed when the job FINISHES: rows with
 *                     createdAt >= job.createdAt that have NO LibraryItem for
 *                     their gameId created before the job. A game that add-all put
 *                     into the library DURING the sync is still new (its item was
 *                     created after the job), a game the user already had is not.
 *     needsMatch      computed when the job FINISHES: live (deletedAt null),
 *                     not-IGNORED rows of the job's user + storefront with
 *                     lookedUpAt set and gameId null.
 *     addedToLibrary  accumulated per chunk by recordChunkDone (Slice 3).
 *     The counts are written on EVERY path to FINISHED: the last enrich chunk
 *     (finalizeImportJobIfComplete) AND a gather with zero chunks
 *     (recordGatherPlan finishes the job at once). Every UPDATE keeps setting
 *     "updatedAt" = now().
 *
 *   features/storefront-sync/api/mark-notice-seen.worker.ts
 *     markSyncNoticeSeenWorker(userId: string | undefined, data: { jobId: string }): Promise<void>
 *       - userId undefined -> UnauthorizedError
 *       - sets noticeSeenAt = now() on that job AND on every OLDER (createdAt <)
 *         FINISHED or FAILED job of the same user + storefront whose noticeSeenAt
 *         is still null; newer jobs, other users' jobs and other storefronts'
 *         jobs are left alone; an already-seen job keeps its original timestamp
 *       - the job is not the caller's, or does not exist -> NotFoundError, and
 *         nothing is written
 *       - resolves with no value
 *   features/storefront-sync/api/mark-sync-notice-seen.ts (createServerFn, no
 *     .server suffix) exports markSyncNoticeSeenFn({ data: { jobId } }) -> void
 *     and delegates to the worker with requireUserId().
 *
 *   Entity queries (entities/import-job/api/, *.server.ts, throw AppError):
 *     markSyncNoticeSeen backs the worker; the summary SQL lives in
 *     finalizeImportJobIfComplete and recordGatherPlan.
 *
 * Steam is stubbed at the HTTP edge, IGDB at `src/shared/api/igdb/fetch.ts`
 * (see ./stubs.ts).
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

import { getSteamSyncStatusWorker } from "@/features/storefront-sync/api/get-sync-status.worker";
import { drainInlineSyncQueue } from "@/features/storefront-sync/api/inline-queue";
import { markSyncNoticeSeenWorker } from "@/features/storefront-sync/api/mark-notice-seen.worker";
import { startSteamSyncWorker } from "@/features/storefront-sync/api/start-sync.worker";
import { igdbFetch } from "@/shared/api/igdb/fetch";
import { NotFoundError, UnauthorizedError } from "@/shared/lib/errors";

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
  type RawSteamGame,
} from "./stubs.ts";

vi.hoisted(() => {
  process.env.STOREFRONT_SYNC_QUEUE = "inline";
});

vi.mock("@/shared/api/igdb/fetch", () => ({ igdbFetch: vi.fn() }));

const igdbFetchMock = vi.mocked(igdbFetch);

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("storefront-sync-summary-and-notice");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

const LONG_AGO = new Date("2024-01-01T00:00:00.000Z");
const MINUTE_MS = 60 * 1000;

const igdbGame = (id: number, name: string): IgdbCatalogueGame => ({
  id,
  name,
  slug: name.toLowerCase().replaceAll(" ", "-"),
  game_type: 0,
});

const steamGame = (appid: number, name: string): RawSteamGame => ({
  appid,
  name,
  playtime_forever: 0,
});

const STEAM_APP = {
  alreadyOnTheList: 101,
  previouslyUnmatched: 102,
  removedByUser: 103,
  inLibraryBeforeTheSync: 104,
  foundByIgdb: 201,
  knownToTheCatalogue: 202,
  igdbCannotPlace: 203,
  alreadyInLibraryByHand: 204,
} as const;

let aliceId: string;
let bobId: string;

const elements = {
  syncStatus: () => getSteamSyncStatusWorker(aliceId),
  findJob: (jobId: string) =>
    db.prisma.importJob.findUniqueOrThrow({ where: { id: jobId } }),
  noticeSeenAt: async (jobId: string) =>
    (await elements.findJob(jobId)).noticeSeenAt,
};

const actions = {
  sync: async (addAllToLibrary: boolean) => {
    const { jobId } = await startSteamSyncWorker(aliceId, { addAllToLibrary });
    await drainInlineSyncQueue();
    return jobId;
  },
  createCatalogueGame: (steamAppId: number, igdbId: number) =>
    createGame(db.prisma, {
      igdbId,
      title: `Catalogue ${steamAppId}`,
      slug: `catalogue-${steamAppId}`,
      steamAppId,
    }),
  /** A row the user already has on the import page from an earlier sync. */
  seedImportedGame: (
    storefrontGameId: number,
    overrides: Record<string, unknown> = {}
  ) =>
    db.prisma.importedGame.create({
      data: {
        userId: aliceId,
        storefront: "STEAM",
        storefrontGameId: String(storefrontGameId),
        name: `Seeded ${storefrontGameId}`,
        createdAt: LONG_AGO,
        lookedUpAt: LONG_AGO,
        ...overrides,
      },
    }),
  /**
   * The library as an earlier sync and the user left it:
   *   101 on the import page, found earlier
   *   102 on the import page, needs a match (IGDB still cannot place it)
   *   103 removed by the user (a found game, but IGNORED)
   *   104 already in the library (Done)
   * and the Steam account owns all of them plus four new games:
   *   201 IGDB finds it, 202 the catalogue already knows it, 203 IGDB cannot
   *   place it, 204 is new to the import page but the user already added the
   *   game to the library by hand.
   */
  seedSecondSyncOfAnExistingLibrary: async () => {
    const onTheList = await actions.createCatalogueGame(
      STEAM_APP.alreadyOnTheList,
      7101
    );
    const removed = await actions.createCatalogueGame(
      STEAM_APP.removedByUser,
      7103
    );
    const inLibraryBefore = await actions.createCatalogueGame(
      STEAM_APP.inLibraryBeforeTheSync,
      7104
    );
    const addedByHand = await actions.createCatalogueGame(
      STEAM_APP.alreadyInLibraryByHand,
      7204
    );
    await actions.createCatalogueGame(STEAM_APP.knownToTheCatalogue, 7202);
    await createLibraryItem(db.prisma, {
      userId: aliceId,
      gameId: inLibraryBefore.id,
      status: "DONE",
    });
    await createLibraryItem(db.prisma, {
      userId: aliceId,
      gameId: addedByHand.id,
      status: "WANT",
    });
    await actions.seedImportedGame(STEAM_APP.alreadyOnTheList, {
      gameId: onTheList.id,
    });
    await actions.seedImportedGame(STEAM_APP.previouslyUnmatched, {
      gameId: null,
    });
    await actions.seedImportedGame(STEAM_APP.removedByUser, {
      gameId: null,
      igdbMatchStatus: "IGNORED",
    });
    await actions.seedImportedGame(STEAM_APP.inLibraryBeforeTheSync, {
      gameId: inLibraryBefore.id,
    });
    void removed;
    igdbFetchMock.mockImplementation(
      externalGamesResponder({
        [STEAM_APP.previouslyUnmatched]: null,
        [STEAM_APP.foundByIgdb]: igdbGame(7201, "Found By Igdb"),
        [STEAM_APP.igdbCannotPlace]: null,
      })
    );
    stubSteam([
      steamGame(STEAM_APP.alreadyOnTheList, "Already On The List"),
      steamGame(STEAM_APP.previouslyUnmatched, "Previously Unmatched"),
      steamGame(STEAM_APP.removedByUser, "Removed By The User"),
      steamGame(STEAM_APP.inLibraryBeforeTheSync, "In Library Before"),
      steamGame(STEAM_APP.foundByIgdb, "Found By Igdb"),
      steamGame(STEAM_APP.knownToTheCatalogue, "Known To The Catalogue"),
      steamGame(STEAM_APP.igdbCannotPlace, "Igdb Cannot Place"),
      steamGame(STEAM_APP.alreadyInLibraryByHand, "Added By Hand"),
    ]);
  },
  seedJob: (
    userId: string,
    {
      status,
      minutesAgo,
      noticeSeenAt = null,
      storefront = "STEAM",
    }: {
      status: "FINISHED" | "FAILED";
      minutesAgo: number;
      noticeSeenAt?: Date | null;
      storefront?: "STEAM" | "XBOX";
    }
  ) => {
    const createdAt = new Date(Date.now() - minutesAgo * MINUTE_MS);
    return db.prisma.importJob.create({
      data: {
        userId,
        storefront,
        status,
        storefrontAccountId: STEAM_ID_64,
        createdAt,
        finishedAt: createdAt,
        noticeSeenAt,
      },
    });
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
  bobId = (await createUser(db.prisma)).id;
});

afterEach(async () => {
  await drainInlineSyncQueue();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("a finished sync's summary", () => {
  describe("given a second sync of an existing library, add-all off", () => {
    let jobId: string;

    beforeEach(async () => {
      await actions.seedSecondSyncOfAnExistingLibrary();
      jobId = await actions.sync(false);
    });

    it("finishes the job with its notice still unseen", async () => {
      expect(await elements.syncStatus()).toMatchObject({
        jobId,
        status: "FINISHED",
        noticeSeen: false,
      });
    });

    it("counts as new only the games that were neither on the list nor in the library before", async () => {
      expect((await elements.syncStatus())?.newGames).toBe(3);
    });

    it("counts as already on the list only the games the import page showed before the sync", async () => {
      expect((await elements.syncStatus())?.refreshedGames).toBe(2);
    });

    it("counts as needing a match every live, not-removed game IGDB could not place", async () => {
      expect((await elements.syncStatus())?.needsMatch).toBe(2);
    });

    it("counts nothing as added to the library", async () => {
      expect((await elements.syncStatus())?.addedToLibrary).toBe(0);
    });
  });

  describe("given a second sync of an existing library, add-all on", () => {
    beforeEach(async () => {
      await actions.seedSecondSyncOfAnExistingLibrary();
      await actions.sync(true);
    });

    it("still counts the games it added as new, and the ones on the list before as already on the list", async () => {
      expect(await elements.syncStatus()).toMatchObject({
        status: "FINISHED",
        newGames: 3,
        refreshedGames: 2,
      });
    });

    it("counts the three found games it added and the two that need a match", async () => {
      expect(await elements.syncStatus()).toMatchObject({
        addedToLibrary: 3,
        needsMatch: 2,
      });
    });
  });

  describe("given every owned game is already known to the catalogue, so the sync has nothing to look up", () => {
    beforeEach(async () => {
      const onTheList = await actions.createCatalogueGame(
        STEAM_APP.alreadyOnTheList,
        7101
      );
      const inLibraryBefore = await actions.createCatalogueGame(
        STEAM_APP.inLibraryBeforeTheSync,
        7104
      );
      await actions.createCatalogueGame(STEAM_APP.knownToTheCatalogue, 7202);
      await createLibraryItem(db.prisma, {
        userId: aliceId,
        gameId: inLibraryBefore.id,
        status: "DONE",
      });
      await actions.seedImportedGame(STEAM_APP.alreadyOnTheList, {
        gameId: onTheList.id,
      });
      stubSteam([
        steamGame(STEAM_APP.alreadyOnTheList, "Already On The List"),
        steamGame(STEAM_APP.inLibraryBeforeTheSync, "In Library Before"),
        steamGame(STEAM_APP.knownToTheCatalogue, "Known To The Catalogue"),
      ]);
      await actions.sync(false);
    });

    it("finishes without asking IGDB anything", async () => {
      expect(await elements.syncStatus()).toMatchObject({
        status: "FINISHED",
        lookedUp: 2,
        totalToLookUp: 2,
      });
      expect(igdbFetchMock).not.toHaveBeenCalled();
    });

    it("still reports what was new, what was already on the list and what needs a match", async () => {
      expect(await elements.syncStatus()).toMatchObject({
        newGames: 1,
        refreshedGames: 1,
        needsMatch: 0,
        addedToLibrary: 0,
      });
    });
  });

  describe("given the same Steam library is synced twice", () => {
    beforeEach(async () => {
      await actions.createCatalogueGame(STEAM_APP.knownToTheCatalogue, 7202);
      igdbFetchMock.mockImplementation(
        externalGamesResponder({
          [STEAM_APP.foundByIgdb]: igdbGame(7201, "Found By Igdb"),
          [STEAM_APP.igdbCannotPlace]: null,
        })
      );
      stubSteam([
        steamGame(STEAM_APP.foundByIgdb, "Found By Igdb"),
        steamGame(STEAM_APP.knownToTheCatalogue, "Known To The Catalogue"),
        steamGame(STEAM_APP.igdbCannotPlace, "Igdb Cannot Place"),
      ]);
      await actions.sync(false);
    });

    it("reports all three games as new by the first sync", async () => {
      expect(await elements.syncStatus()).toMatchObject({
        newGames: 3,
        refreshedGames: 0,
        needsMatch: 1,
      });
    });

    it("reports none as new by the second, which refreshed all three", async () => {
      await actions.sync(false);

      expect(await elements.syncStatus()).toMatchObject({
        status: "FINISHED",
        newGames: 0,
        refreshedGames: 3,
        needsMatch: 1,
      });
    });
  });
});

describe("markSyncNoticeSeenWorker", () => {
  describe("given three finished or failed jobs whose notices nobody has seen", () => {
    let oldestJobId: string;
    let middleJobId: string;
    let newestJobId: string;

    beforeEach(async () => {
      oldestJobId = (
        await actions.seedJob(aliceId, { status: "FINISHED", minutesAgo: 180 })
      ).id;
      middleJobId = (
        await actions.seedJob(aliceId, { status: "FAILED", minutesAgo: 120 })
      ).id;
      newestJobId = (
        await actions.seedJob(aliceId, { status: "FINISHED", minutesAgo: 60 })
      ).id;
    });

    describe("when the newest job's notice is marked seen", () => {
      beforeEach(async () => {
        await markSyncNoticeSeenWorker(aliceId, { jobId: newestJobId });
      });

      it("marks the job seen, as the status the app polls reports", async () => {
        expect(await elements.syncStatus()).toMatchObject({
          jobId: newestJobId,
          noticeSeen: true,
        });
      });

      it("marks every older unseen job seen too, so nothing stale shows up on the next visit", async () => {
        expect(await elements.noticeSeenAt(oldestJobId)).not.toBeNull();
        expect(await elements.noticeSeenAt(middleJobId)).not.toBeNull();
      });
    });

    describe("when the middle job's notice is marked seen", () => {
      beforeEach(async () => {
        await markSyncNoticeSeenWorker(aliceId, { jobId: middleJobId });
      });

      it("marks it and the older job seen", async () => {
        expect(await elements.noticeSeenAt(middleJobId)).not.toBeNull();
        expect(await elements.noticeSeenAt(oldestJobId)).not.toBeNull();
      });

      it("leaves the newer job's notice unseen", async () => {
        expect(await elements.noticeSeenAt(newestJobId)).toBeNull();
      });
    });

    describe("when the job is marked seen", () => {
      it("resolves with no value", async () => {
        await expect(
          markSyncNoticeSeenWorker(aliceId, { jobId: newestJobId })
        ).resolves.toBeUndefined();
      });
    });
  });

  describe("given an older job that was already seen", () => {
    const SEEN_EARLIER = new Date("2025-06-01T12:00:00.000Z");
    let seenJobId: string;

    beforeEach(async () => {
      seenJobId = (
        await actions.seedJob(aliceId, {
          status: "FINISHED",
          minutesAgo: 180,
          noticeSeenAt: SEEN_EARLIER,
        })
      ).id;
      const newestJobId = (
        await actions.seedJob(aliceId, { status: "FINISHED", minutesAgo: 60 })
      ).id;
      await markSyncNoticeSeenWorker(aliceId, { jobId: newestJobId });
    });

    it("keeps the moment it was first seen", async () => {
      expect(await elements.noticeSeenAt(seenJobId)).toEqual(SEEN_EARLIER);
    });
  });

  describe("given jobs that belong to someone else or to another storefront", () => {
    let aliceJobId: string;
    let bobOlderJobId: string;
    let aliceXboxJobId: string;

    beforeEach(async () => {
      bobOlderJobId = (
        await actions.seedJob(bobId, { status: "FINISHED", minutesAgo: 240 })
      ).id;
      aliceXboxJobId = (
        await actions.seedJob(aliceId, {
          status: "FINISHED",
          minutesAgo: 200,
          storefront: "XBOX",
        })
      ).id;
      aliceJobId = (
        await actions.seedJob(aliceId, { status: "FINISHED", minutesAgo: 60 })
      ).id;
      await markSyncNoticeSeenWorker(aliceId, { jobId: aliceJobId });
    });

    it("marks only the caller's job seen", async () => {
      expect(await elements.noticeSeenAt(aliceJobId)).not.toBeNull();
    });

    it("leaves another user's older job unseen", async () => {
      expect(await elements.noticeSeenAt(bobOlderJobId)).toBeNull();
    });

    it("leaves the same user's older job for another storefront unseen", async () => {
      expect(await elements.noticeSeenAt(aliceXboxJobId)).toBeNull();
    });
  });

  describe("given a job that is another user's", () => {
    let bobJobId: string;
    let bobOlderJobId: string;

    beforeEach(async () => {
      bobOlderJobId = (
        await actions.seedJob(bobId, { status: "FINISHED", minutesAgo: 120 })
      ).id;
      bobJobId = (
        await actions.seedJob(bobId, { status: "FINISHED", minutesAgo: 60 })
      ).id;
    });

    it("throws NotFound instead of revealing that the job exists", async () => {
      await expect(
        markSyncNoticeSeenWorker(aliceId, { jobId: bobJobId })
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("marks nothing seen", async () => {
      await markSyncNoticeSeenWorker(aliceId, { jobId: bobJobId }).catch(
        () => undefined
      );

      expect(await elements.noticeSeenAt(bobJobId)).toBeNull();
      expect(await elements.noticeSeenAt(bobOlderJobId)).toBeNull();
    });
  });

  describe("given a job id that does not exist", () => {
    it("throws NotFound", async () => {
      await expect(
        markSyncNoticeSeenWorker(aliceId, { jobId: "no-such-job" })
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("given nobody is signed in", () => {
    it("throws Unauthorized", async () => {
      await expect(
        markSyncNoticeSeenWorker(undefined, { jobId: "any-job" })
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });
});

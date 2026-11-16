/**
 * RED integration tests for spec 030 Slice 5: failures are explained, stuck
 * syncs recover, and a disconnect mid-sync does not break the sync.
 *
 * CONTRACT (implementers build against exactly this; paths are under src/)
 *
 *   Failure codes on ImportJob.failureCode (functional 2.6, tech 2.3 / 2.6)
 *     The gather worker maps what Steam did to a code and fails the job through
 *     failImportJob: status FAILED, failureCode set, finishedAt set. Nothing is
 *     upserted, so the user's ImportedGame rows (the import page) stay exactly
 *     as they were. Sync can be started again straight away.
 *       - Steam returns no games, whichever way it says so
 *           { game_count: 0, games: [] }, { response: {} } (the private shape),
 *           { game_count: N > 0 } without a `games` array   -> PROFILE_PRIVATE
 *       - SteamApiUnavailableError (HTTP 5xx, or no response at all)
 *                                                            -> STEAM_UNAVAILABLE
 *       - SteamRateLimitError (HTTP 429)                     -> RATE_LIMITED
 *     getSteamSyncStatusWorker exposes the code as `failureCode`.
 *
 *   features/storefront-sync/api/start-sync.worker.ts
 *     startSteamSyncWorker: when the queue `send` of the gather message throws,
 *     the freshly created job becomes FAILED(START_FAILED) with finishedAt set
 *     and the worker throws UpstreamError. The user can start again afterwards.
 *
 *   Stale expiry (functional 2.6.4, tech 2.6)
 *     entities/import-job/api/expire-stale-import-job.server.ts
 *       expireStaleImportJob(userId, storefront)
 *       An ACTIVE job (QUEUED | GATHERING | LOOKING_UP) whose "updatedAt" is
 *       older than 30 minutes (DB clock) becomes FAILED(STALLED) with
 *       finishedAt set. A younger one, a terminal one, and other users' or
 *       storefronts' jobs are left alone. (Entity-level cases:
 *       test/integration/import-job/expire-stale-import-job.integration.test.ts)
 *     It runs lazily, with no sweeper:
 *       - getLatestImportJob(userId, storefront) expires first, then reads
 *         (so getSteamSyncStatusWorker reports FAILED/STALLED);
 *       - createImportJob(userId, input) expires first, then inserts (so
 *         startSteamSyncWorker starts a new job instead of answering
 *         alreadyRunning for a stuck one).
 *
 *   Disconnect mid-sync (functional 2.6.5)
 *     The job snapshots storefrontAccountId at start. Gather fetches Steam with
 *     that snapshot, never with the user's current steamId64, so clearing
 *     user.steamId64 while the sync runs still ends FINISHED, with the games
 *     upserted and "Also add all games" still applied.
 *
 * Steam is stubbed at the HTTP edge, IGDB at `src/shared/api/igdb/fetch.ts`
 * (see ./stubs.ts). A queue send failure is simulated by spying on the inline
 * queue's `send`.
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
import {
  drainInlineSyncQueue,
  inlineSyncQueue,
} from "@/features/storefront-sync/api/inline-queue";
import { startSteamSyncWorker } from "@/features/storefront-sync/api/start-sync.worker";
import { igdbFetch } from "@/shared/api/igdb/fetch";
import { UpstreamError } from "@/shared/lib/errors";

import { createUser } from "../../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../../setup/isolated-db.ts";
import {
  externalGamesResponder,
  STEAM_ID_64,
  stubSteam,
  stubSteamBody,
  stubSteamHttpStatus,
  stubSteamNetworkFailure,
  THREE_GAMES,
} from "./stubs.ts";

vi.hoisted(() => {
  process.env.STOREFRONT_SYNC_QUEUE = "inline";
});

vi.mock("@/shared/api/igdb/fetch", () => ({ igdbFetch: vi.fn() }));

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("storefront-sync-failures");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

const STALE_MINUTES = 31;
const FRESH_MINUTES = 29;

let aliceId: string;

const elements = {
  findImportJob: (jobId: string) =>
    db.prisma.importJob.findUniqueOrThrow({ where: { id: jobId } }),
  countImportJobs: () =>
    db.prisma.importJob.count({ where: { userId: aliceId } }),
  findImportedGames: () =>
    db.prisma.importedGame.findMany({
      where: { userId: aliceId },
      orderBy: { storefrontGameId: "asc" },
    }),
  libraryItemCount: () =>
    db.prisma.libraryItem.count({ where: { userId: aliceId } }),
  syncStatus: () => getSteamSyncStatusWorker(aliceId),
};

const actions = {
  sync: async (addAllToLibrary = false) => {
    const { jobId } = await startSteamSyncWorker(aliceId, { addAllToLibrary });
    await drainInlineSyncQueue();
    return jobId;
  },
  /** The import page's rows from an earlier sync. */
  seedImportedGames: async () => {
    for (const appId of [11, 12]) {
      await db.prisma.importedGame.create({
        data: {
          userId: aliceId,
          storefront: "STEAM",
          storefrontGameId: String(appId),
          name: `Earlier game ${appId}`,
          playtime: appId,
        },
      });
    }
  },
  /** A job of Alice's that has shown no change for `minutes` minutes. */
  seedActiveJob: async (
    minutes: number,
    status: "QUEUED" | "GATHERING" | "LOOKING_UP" = "GATHERING"
  ) => {
    const job = await db.prisma.importJob.create({
      data: {
        userId: aliceId,
        storefront: "STEAM",
        storefrontAccountId: STEAM_ID_64,
        status,
      },
    });
    await db.prisma.$executeRaw`
      UPDATE "ImportJob"
      SET "createdAt" = now() - make_interval(mins => ${minutes + 1}),
          "updatedAt" = now() - make_interval(mins => ${minutes})
      WHERE "id" = ${job.id}
    `;
    return job.id;
  },
  disconnectSteam: () =>
    db.prisma.user.update({
      where: { id: aliceId },
      data: { steamId64: null },
    }),
};

beforeEach(async () => {
  vi.mocked(igdbFetch).mockReset();
  vi.mocked(igdbFetch).mockImplementation(externalGamesResponder({}));
  await db.prisma.importJob.deleteMany();
  await db.prisma.importedGame.deleteMany();
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.user.deleteMany();
  aliceId = (await createUser(db.prisma, { steamId64: STEAM_ID_64 })).id;
});

afterEach(async () => {
  await drainInlineSyncQueue();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("a sync that Steam cannot serve", () => {
  const steamAnswers = [
    {
      answer: "no games at all",
      stub: () => stubSteam([]),
      failureCode: "PROFILE_PRIVATE",
    },
    {
      answer: "the private-profile shape without a games count",
      stub: () => stubSteamBody({ response: {} }),
      failureCode: "PROFILE_PRIVATE",
    },
    {
      answer: "a games count but no games list",
      stub: () => stubSteamBody({ response: { game_count: 42 } }),
      failureCode: "PROFILE_PRIVATE",
    },
    {
      answer: "HTTP 503",
      stub: () => stubSteamHttpStatus(503),
      failureCode: "STEAM_UNAVAILABLE",
    },
    {
      answer: "HTTP 500",
      stub: () => stubSteamHttpStatus(500),
      failureCode: "STEAM_UNAVAILABLE",
    },
    {
      answer: "no response at all",
      stub: () => stubSteamNetworkFailure(),
      failureCode: "STEAM_UNAVAILABLE",
    },
    {
      answer: "HTTP 429",
      stub: () => stubSteamHttpStatus(429),
      failureCode: "RATE_LIMITED",
    },
  ] as const;

  describe.each(steamAnswers)(
    "given Steam answers with $answer",
    ({ stub, failureCode }) => {
      let jobId: string;
      let importPageBefore: Awaited<
        ReturnType<typeof elements.findImportedGames>
      >;

      beforeEach(async () => {
        await actions.seedImportedGames();
        importPageBefore = await elements.findImportedGames();
        stub();
        jobId = await actions.sync();
      });

      it(`fails the job with ${failureCode} and a finish time`, async () => {
        const job = await elements.findImportJob(jobId);

        expect(job.status).toBe("FAILED");
        expect(job.failureCode).toBe(failureCode);
        expect(job.finishedAt).not.toBeNull();
      });

      it("reports the failure code in the sync status", async () => {
        expect(await elements.syncStatus()).toMatchObject({
          jobId,
          status: "FAILED",
          failureCode,
        });
      });

      it("leaves the import page's games unchanged", async () => {
        expect(await elements.findImportedGames()).toEqual(importPageBefore);
      });

      it("lets the user start a new sync", async () => {
        stubSteam(THREE_GAMES);

        const next = await startSteamSyncWorker(aliceId, {
          addAllToLibrary: false,
        });

        expect(next.alreadyRunning).toBe(false);
        expect(next.jobId).not.toBe(jobId);
      });
    }
  );
});

describe("a sync whose start cannot be queued", () => {
  describe("given the queue refuses the gather message", () => {
    let startError: unknown;

    beforeEach(async () => {
      stubSteam(THREE_GAMES);
      vi.spyOn(inlineSyncQueue, "send").mockRejectedValue(
        new Error("queue unavailable")
      );
      startError = await startSteamSyncWorker(aliceId, {
        addAllToLibrary: false,
      }).then(
        () => null,
        (error: unknown) => error
      );
    });

    it("throws an UpstreamError", () => {
      expect(startError).toBeInstanceOf(UpstreamError);
    });

    it("fails the job with START_FAILED and a finish time", async () => {
      const job = await db.prisma.importJob.findFirstOrThrow({
        where: { userId: aliceId },
      });

      expect(job.status).toBe("FAILED");
      expect(job.failureCode).toBe("START_FAILED");
      expect(job.finishedAt).not.toBeNull();
    });

    it("lets the user start a new sync once the queue is back", async () => {
      vi.restoreAllMocks();

      const next = await startSteamSyncWorker(aliceId, {
        addAllToLibrary: false,
      });

      expect(next.alreadyRunning).toBe(false);
      expect(await elements.countImportJobs()).toBe(2);
    });
  });
});

describe("a sync that has shown no change for 30 minutes", () => {
  describe(`given a gathering job idle for ${STALE_MINUTES} minutes`, () => {
    let stuckJobId: string;

    beforeEach(async () => {
      stuckJobId = await actions.seedActiveJob(STALE_MINUTES);
    });

    describe("when the user reads the sync status", () => {
      it("reports it as failed because it stopped unexpectedly", async () => {
        expect(await elements.syncStatus()).toMatchObject({
          jobId: stuckJobId,
          status: "FAILED",
          failureCode: "STALLED",
        });
      });

      it("gives the job a finish time", async () => {
        await elements.syncStatus();

        expect(
          (await elements.findImportJob(stuckJobId)).finishedAt
        ).not.toBeNull();
      });
    });

    describe("when the user starts a new sync", () => {
      let next: Awaited<ReturnType<typeof startSteamSyncWorker>>;

      beforeEach(async () => {
        stubSteam(THREE_GAMES);
        next = await startSteamSyncWorker(aliceId, { addAllToLibrary: false });
        await drainInlineSyncQueue();
      });

      it("starts a new job instead of reporting the stuck one as running", () => {
        expect(next.alreadyRunning).toBe(false);
        expect(next.jobId).not.toBe(stuckJobId);
      });

      it("fails the stuck job as STALLED", async () => {
        const stuck = await elements.findImportJob(stuckJobId);

        expect(stuck.status).toBe("FAILED");
        expect(stuck.failureCode).toBe("STALLED");
      });

      it("finishes the new sync", async () => {
        expect((await elements.findImportJob(next.jobId)).status).toBe(
          "FINISHED"
        );
      });
    });
  });

  describe.each(["QUEUED", "LOOKING_UP"] as const)(
    "given a %s job idle for 31 minutes",
    (status) => {
      it("reports it as failed because it stopped unexpectedly", async () => {
        const stuckJobId = await actions.seedActiveJob(STALE_MINUTES, status);

        expect(await elements.syncStatus()).toMatchObject({
          jobId: stuckJobId,
          status: "FAILED",
          failureCode: "STALLED",
        });
      });
    }
  );

  describe(`given a gathering job idle for only ${FRESH_MINUTES} minutes`, () => {
    let runningJobId: string;

    beforeEach(async () => {
      runningJobId = await actions.seedActiveJob(FRESH_MINUTES);
    });

    it("still reports it as running", async () => {
      expect(await elements.syncStatus()).toMatchObject({
        jobId: runningJobId,
        status: "GATHERING",
        failureCode: null,
      });
    });

    it("answers a new start with the running sync", async () => {
      const next = await startSteamSyncWorker(aliceId, {
        addAllToLibrary: false,
      });

      expect(next).toMatchObject({ jobId: runningJobId, alreadyRunning: true });
    });
  });
});

describe("a Steam disconnect while a sync is running", () => {
  describe("given a sync that is waiting on Steam and the user then disconnects Steam", () => {
    let steam: ReturnType<typeof stubSteam>;
    let jobId: string;

    beforeEach(async () => {
      igdbFetchFindsCounterStrike();
      steam = stubSteam(THREE_GAMES, { hold: true });
      ({ jobId } = await startSteamSyncWorker(aliceId, {
        addAllToLibrary: true,
      }));
      await actions.disconnectSteam();
      steam.release();
      await drainInlineSyncQueue();
    });

    it("still finishes the sync", async () => {
      const job = await elements.findImportJob(jobId);

      expect(job.status).toBe("FINISHED");
      expect(job.failureCode).toBeNull();
    });

    it("fetched the library of the account the sync started with", () => {
      expect(String(steam.fetchMock.mock.calls[0]?.[0])).toContain(
        `steamid=${STEAM_ID_64}`
      );
    });

    it("lists the games on the import page", async () => {
      const games = await elements.findImportedGames();

      expect(games.map((game) => game.name)).toEqual([
        "Team Fortress 2",
        "Dota 2",
        "Counter-Strike 2",
      ]);
    });

    it("still adds the found games to the library", async () => {
      expect(await elements.libraryItemCount()).toBe(1);
    });
  });
});

function igdbFetchFindsCounterStrike() {
  vi.mocked(igdbFetch).mockImplementation(
    externalGamesResponder({
      "730": {
        id: 1,
        name: "Counter-Strike 2",
        slug: "counter-strike-2",
        game_type: 0,
      },
    })
  );
}

/**
 * RED integration tests for spec 030 Slice 1: start a background Steam sync,
 * run gather through the inline queue, read the status back.
 *
 * CONTRACT (implementers build against exactly this; paths are under src/)
 *
 *   features/storefront-sync/api/start-sync.worker.ts
 *     startSteamSyncWorker(
 *       userId: string | undefined,
 *       input: { addAllToLibrary: boolean }
 *     ): Promise<{ jobId: string; status: ImportJobStatus; alreadyRunning: boolean }>
 *     - undefined userId        -> UnauthorizedError
 *     - user without steamId64  -> ValidationError, no ImportJob row written
 *     - creates a QUEUED ImportJob (storefront STEAM, storefrontAccountId = steamId64
 *       snapshot) and sends { v: 1, jobId } to the gather queue
 *     - an active job (QUEUED | GATHERING | LOOKING_UP) exists -> returns that job
 *       with alreadyRunning: true and creates nothing
 *
 *   features/storefront-sync/api/gather.worker.ts
 *     runGatherMessage(args: { message: GatherMessage; receiveCount: number }): Promise<void>
 *     - claims the job; QUEUED/GATHERING -> GATHERING, any other state -> drop (no Steam call, no writes)
 *     - fetches the owned games with the job's snapshotted steamId64, upserts ImportedGame
 *       rows via upsertImportedGamesBatch(userId, games, "STEAM")
 *     - Slice 1: no lookup yet, so it finalizes the job FINISHED (finishedAt set)
 *
 *   features/storefront-sync/api/get-sync-status.worker.ts
 *     getSteamSyncStatusWorker(userId: string | undefined): Promise<SteamSyncStatus | null>
 *     - undefined userId -> UnauthorizedError; no job for (user, STEAM) -> null
 *     - SteamSyncStatus (features/storefront-sync/model/types.ts) = {
 *         jobId, status, totalToLookUp, lookedUp, newGames, refreshedGames,
 *         addedToLibrary, needsMatch, addAllToLibrary, failureCode, finishedAt, noticeSeen }
 *
 *   features/storefront-sync/model/messages.ts
 *     gatherMessageSchema  { v: 1, jobId }
 *     enrichMessageSchema  { v: 1, jobId, chunkIndex, importedGameIds (<= 200), lookupCount }
 *     type GatherMessage = z.infer<typeof gatherMessageSchema>
 *
 *   features/storefront-sync/api/inline-queue.ts
 *     drainInlineSyncQueue(): Promise<void>
 *     - resolves once every message sent through the inline queue (including messages
 *       sent while handling other messages) has been processed
 *   The workers obtain the queue through getSyncQueue() (features/storefront-sync/api/get-sync-queue.ts),
 *   which returns the inline implementation when STOREFRONT_SYNC_QUEUE=inline (set below).
 *
 *   Prisma: model ImportJob + enums ImportJobStatus / ImportFailureCode per tech spec 2.2.
 *
 * Steam is stubbed at the HTTP edge (`fetch` -> GetOwnedGames), the same way
 * import-steam-library.integration.test.ts does it.
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

import { runGatherMessage } from "@/features/storefront-sync/api/gather.worker";
import { getSteamSyncStatusWorker } from "@/features/storefront-sync/api/get-sync-status.worker";
import { drainInlineSyncQueue } from "@/features/storefront-sync/api/inline-queue";
import { startSteamSyncWorker } from "@/features/storefront-sync/api/start-sync.worker";
import { UnauthorizedError, ValidationError } from "@/shared/lib/errors";

import { createUser } from "../../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../../setup/isolated-db.ts";

vi.hoisted(() => {
  process.env.STOREFRONT_SYNC_QUEUE = "inline";
});

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("storefront-sync-start-gather");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

const STEAM_ID_64 = "76561198012345678";

interface RawSteamGame {
  appid: number;
  name: string;
  playtime_forever: number;
  playtime_windows_forever?: number;
  playtime_mac_forever?: number;
  playtime_linux_forever?: number;
  rtime_last_played?: number;
}

const THREE_GAMES: RawSteamGame[] = [
  { appid: 730, name: "Counter-Strike 2", playtime_forever: 1200 },
  { appid: 440, name: "Team Fortress 2", playtime_forever: 0 },
  { appid: 570, name: "Dota 2", playtime_forever: 600 },
];

/**
 * Stubs Steam GetOwnedGames. With `hold`, the response waits for `release()`,
 * which keeps the job active (GATHERING) so "second start" is deterministic.
 */
function stubSteam(games: RawSteamGame[], options: { hold?: boolean } = {}) {
  let release: () => void = () => {};
  const gate = options.hold
    ? new Promise<void>((resolve) => {
        release = resolve;
      })
    : Promise.resolve();
  const fetchMock = vi.fn(async (url: string) => {
    if (!url.includes("GetOwnedGames")) {
      throw new Error(`Unexpected Steam endpoint: ${url}`);
    }
    await gate;
    return new Response(
      JSON.stringify({ response: { game_count: games.length, games } }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  });
  vi.stubGlobal("fetch", fetchMock);
  return { release, fetchMock };
}

const elements = {
  countImportJobs: (userId: string) =>
    db.prisma.importJob.count({ where: { userId } }),
  findImportJob: (jobId: string) =>
    db.prisma.importJob.findUniqueOrThrow({ where: { id: jobId } }),
  findImportedGames: (userId: string) =>
    db.prisma.importedGame.findMany({
      where: { userId },
      orderBy: { storefrontGameId: "asc" },
    }),
};

let aliceId: string;

beforeEach(async () => {
  await db.prisma.importJob.deleteMany();
  await db.prisma.importedGame.deleteMany();
  await db.prisma.user.deleteMany();
  const alice = await createUser(db.prisma, { steamId64: STEAM_ID_64 });
  aliceId = alice.id;
});

afterEach(async () => {
  await drainInlineSyncQueue();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("startSteamSyncWorker", () => {
  describe("given no signed-in user", () => {
    it("throws UnauthorizedError", async () => {
      await expect(
        startSteamSyncWorker(undefined, { addAllToLibrary: false })
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe("given a user who has not connected Steam", () => {
    let bobId: string;
    let startAttempt: Promise<unknown>;

    beforeEach(async () => {
      const bob = await createUser(db.prisma, { steamId64: null });
      bobId = bob.id;
      stubSteam(THREE_GAMES);
      startAttempt = startSteamSyncWorker(bobId, { addAllToLibrary: false });
    });

    it("rejects with a ValidationError", async () => {
      await expect(startAttempt).rejects.toThrow(ValidationError);
    });

    it("creates no sync job", async () => {
      await startAttempt.catch(() => undefined);

      expect(await elements.countImportJobs(bobId)).toBe(0);
    });
  });

  describe("given a connected user whose Steam response is still pending", () => {
    let steam: ReturnType<typeof stubSteam>;
    let started: Awaited<ReturnType<typeof startSteamSyncWorker>>;

    beforeEach(async () => {
      steam = stubSteam(THREE_GAMES, { hold: true });
      started = await startSteamSyncWorker(aliceId, { addAllToLibrary: true });
    });

    afterEach(() => {
      steam.release();
    });

    it("returns a QUEUED job that is not already running", () => {
      expect(started).toEqual({
        jobId: expect.any(String),
        status: "QUEUED",
        alreadyRunning: false,
      });
    });

    it("stores the job for the user's Steam storefront with the chosen options and account snapshot", async () => {
      const job = await elements.findImportJob(started.jobId);

      expect(job).toMatchObject({
        userId: aliceId,
        storefront: "STEAM",
        addAllToLibrary: true,
        storefrontAccountId: STEAM_ID_64,
      });
    });

    describe("when the user starts a second sync", () => {
      let second: Awaited<ReturnType<typeof startSteamSyncWorker>>;

      beforeEach(async () => {
        second = await startSteamSyncWorker(aliceId, {
          addAllToLibrary: false,
        });
      });

      it("returns the same job flagged alreadyRunning", () => {
        expect(second.jobId).toBe(started.jobId);
        expect(second.alreadyRunning).toBe(true);
      });

      it("does not create another job", async () => {
        expect(await elements.countImportJobs(aliceId)).toBe(1);
      });
    });
  });
});

describe("gather through the inline queue", () => {
  describe("given Steam returns three games and the sync is started and drained", () => {
    let jobId: string;

    beforeEach(async () => {
      stubSteam(THREE_GAMES);
      ({ jobId } = await startSteamSyncWorker(aliceId, {
        addAllToLibrary: false,
      }));
      await drainInlineSyncQueue();
    });

    it("imports every owned game as a Steam imported game", async () => {
      const games = await elements.findImportedGames(aliceId);

      expect(
        games.map((g) => [g.storefront, g.storefrontGameId, g.name])
      ).toEqual([
        ["STEAM", "440", "Team Fortress 2"],
        ["STEAM", "570", "Dota 2"],
        ["STEAM", "730", "Counter-Strike 2"],
      ]);
    });

    it("finishes the job", async () => {
      const job = await elements.findImportJob(jobId);

      expect(job.status).toBe("FINISHED");
      expect(job.finishedAt).not.toBeNull();
    });

    it("lets the user start a new sync afterwards", async () => {
      const next = await startSteamSyncWorker(aliceId, {
        addAllToLibrary: false,
      });

      expect(next.alreadyRunning).toBe(false);
      expect(next.jobId).not.toBe(jobId);
    });

    describe("when gather is redelivered for the finished job", () => {
      let steamAfterFinish: ReturnType<typeof stubSteam>;

      beforeEach(async () => {
        steamAfterFinish = stubSteam([
          ...THREE_GAMES,
          { appid: 620, name: "Portal 2", playtime_forever: 30 },
        ]);
        await runGatherMessage({ message: { v: 1, jobId }, receiveCount: 2 });
      });

      it("drops the message without contacting Steam", () => {
        expect(steamAfterFinish.fetchMock).not.toHaveBeenCalled();
      });

      it("leaves the imported games and the finished job untouched", async () => {
        const games = await elements.findImportedGames(aliceId);
        const job = await elements.findImportJob(jobId);

        expect(games).toHaveLength(3);
        expect(job.status).toBe("FINISHED");
      });
    });
  });
});

describe("getSteamSyncStatusWorker", () => {
  describe("given no signed-in user", () => {
    it("throws UnauthorizedError", async () => {
      await expect(getSteamSyncStatusWorker(undefined)).rejects.toThrow(
        UnauthorizedError
      );
    });
  });

  describe("given the user has never synced", () => {
    it("returns null", async () => {
      expect(await getSteamSyncStatusWorker(aliceId)).toBeNull();
    });
  });

  describe("given an older finished job and a newer failed job", () => {
    let newerJobId: string;

    beforeEach(async () => {
      await db.prisma.importJob.create({
        data: {
          userId: aliceId,
          storefront: "STEAM",
          storefrontAccountId: STEAM_ID_64,
          status: "FINISHED",
          finishedAt: new Date("2025-01-01T10:05:00.000Z"),
          createdAt: new Date("2025-01-01T10:00:00.000Z"),
        },
      });
      const newer = await db.prisma.importJob.create({
        data: {
          userId: aliceId,
          storefront: "STEAM",
          storefrontAccountId: STEAM_ID_64,
          status: "FAILED",
          failureCode: "PROFILE_PRIVATE",
          addAllToLibrary: true,
          finishedAt: new Date("2025-01-02T10:05:00.000Z"),
          createdAt: new Date("2025-01-02T10:00:00.000Z"),
        },
      });
      newerJobId = newer.id;
    });

    it("returns the latest job's status", async () => {
      expect(await getSteamSyncStatusWorker(aliceId)).toMatchObject({
        jobId: newerJobId,
        status: "FAILED",
        failureCode: "PROFILE_PRIVATE",
        addAllToLibrary: true,
        noticeSeen: false,
      });
    });

    it("does not show the job to another user", async () => {
      const bob = await createUser(db.prisma, { steamId64: null });

      expect(await getSteamSyncStatusWorker(bob.id)).toBeNull();
    });
  });
});

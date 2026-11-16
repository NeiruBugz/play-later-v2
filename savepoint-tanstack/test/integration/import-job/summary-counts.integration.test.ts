import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { claimGather } from "@/entities/import-job/api/claim-gather.server";
import { createImportJob } from "@/entities/import-job/api/create-import-job.server";
import { finalizeImportJobIfComplete } from "@/entities/import-job/api/finalize-import-job-if-complete.server";
import { recordChunkDone } from "@/entities/import-job/api/record-chunk-done.server";
import { recordGatherPlan } from "@/entities/import-job/api/record-gather-plan.server";

import {
  createGame,
  createLibraryItem,
  createUser,
} from "../../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("import-job-summary-counts");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

const LONG_AGO = new Date("2024-01-01T00:00:00.000Z");
const JOB_STARTED_AT = new Date("2025-06-01T12:00:00.000Z");
const BEFORE_THE_JOB = new Date("2025-06-01T11:00:00.000Z");
const AFTER_THE_JOB_STARTED = new Date("2025-06-01T12:05:00.000Z");

let userId: string;
let otherUserId: string;
let nextStorefrontGameId = 1;

const elements = {
  readJob: (jobId: string) =>
    db.prisma.importJob.findUniqueOrThrow({ where: { id: jobId } }),
  gatheringJobStartedAt: async (startedAt: Date) => {
    const job = await createImportJob(userId, {
      storefront: "STEAM",
      addAllToLibrary: false,
      storefrontAccountId: "76561198012345678",
    });
    await db.prisma.importJob.update({
      where: { id: job!.id },
      data: { createdAt: startedAt },
    });
    await claimGather(job!.id);
    return job!.id;
  },
  lookingUpJob: async (totalChunks: number) => {
    const jobId = await elements.gatheringJobStartedAt(JOB_STARTED_AT);
    await recordGatherPlan(jobId, {
      totalToLookUp: totalChunks * 10,
      lookedUp: 0,
      refreshedGames: 0,
      totalChunks,
    });
    return jobId;
  },
};

const actions = {
  seedImportedGame: (
    overrides: Record<string, unknown> & { createdAt: Date }
  ) =>
    db.prisma.importedGame.create({
      data: {
        userId,
        storefront: "STEAM",
        storefrontGameId: String(nextStorefrontGameId++),
        name: "Seeded game",
        ...overrides,
      },
    }),
  seedLibraryItemCreatedAt: async (gameId: string, createdAt: Date) => {
    const item = await createLibraryItem(db.prisma, {
      userId,
      gameId,
      status: "WANT",
    });
    await db.prisma.libraryItem.update({
      where: { id: item.id },
      data: { createdAt },
    });
  },
  finishWithOneChunk: async (jobId: string) => {
    await recordChunkDone(jobId, 0, { lookupCount: 10, added: 0 });
    return finalizeImportJobIfComplete(jobId);
  },
};

beforeEach(async () => {
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.importJob.deleteMany();
  await db.prisma.importedGame.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
  userId = (await createUser(db.prisma)).id;
  otherUserId = (await createUser(db.prisma)).id;
});

describe("finalizeImportJobIfComplete summary counts", () => {
  describe("given rows created before the job and rows created after it started", () => {
    let jobId: string;

    beforeEach(async () => {
      jobId = await elements.lookingUpJob(1);
      const knownBefore = await createGame(db.prisma, {});
      const knownDuring = await createGame(db.prisma, {});
      const addedByHandBefore = await createGame(db.prisma, {});
      await actions.seedImportedGame({
        createdAt: LONG_AGO,
        gameId: knownBefore.id,
      });
      await actions.seedImportedGame({
        createdAt: AFTER_THE_JOB_STARTED,
        gameId: knownDuring.id,
        lookedUpAt: AFTER_THE_JOB_STARTED,
      });
      await actions.seedImportedGame({
        createdAt: AFTER_THE_JOB_STARTED,
        gameId: addedByHandBefore.id,
      });
      await actions.seedImportedGame({
        createdAt: AFTER_THE_JOB_STARTED,
        gameId: null,
      });
      await actions.seedLibraryItemCreatedAt(
        addedByHandBefore.id,
        BEFORE_THE_JOB
      );
      await actions.seedLibraryItemCreatedAt(
        knownDuring.id,
        AFTER_THE_JOB_STARTED
      );
    });

    it("counts as new the rows created from the job on, unless the game was in the library before the job", async () => {
      await actions.finishWithOneChunk(jobId);

      expect((await elements.readJob(jobId)).newGames).toBe(2);
    });

    it("returns the finished job carrying the same count", async () => {
      const finished = await actions.finishWithOneChunk(jobId);

      expect(finished).toMatchObject({ status: "FINISHED", newGames: 2 });
    });
  });

  describe("given deleted, other-storefront and other-user rows created after the job started", () => {
    let jobId: string;

    beforeEach(async () => {
      jobId = await elements.lookingUpJob(1);
      await actions.seedImportedGame({
        createdAt: AFTER_THE_JOB_STARTED,
        deletedAt: AFTER_THE_JOB_STARTED,
      });
      await actions.seedImportedGame({
        createdAt: AFTER_THE_JOB_STARTED,
        storefront: "XBOX",
      });
      await db.prisma.importedGame.create({
        data: {
          userId: otherUserId,
          storefront: "STEAM",
          storefrontGameId: "9001",
          name: "Someone else's",
          createdAt: AFTER_THE_JOB_STARTED,
        },
      });
    });

    it("counts none of them", async () => {
      await actions.finishWithOneChunk(jobId);

      expect(await elements.readJob(jobId)).toMatchObject({
        newGames: 0,
        needsMatch: 0,
      });
    });
  });

  describe("given rows that were looked up and rows that were not", () => {
    let jobId: string;

    beforeEach(async () => {
      jobId = await elements.lookingUpJob(1);
      const found = await createGame(db.prisma, {});
      await actions.seedImportedGame({
        createdAt: LONG_AGO,
        gameId: found.id,
        lookedUpAt: LONG_AGO,
      });
      await actions.seedImportedGame({
        createdAt: LONG_AGO,
        gameId: null,
        lookedUpAt: LONG_AGO,
      });
      await actions.seedImportedGame({
        createdAt: AFTER_THE_JOB_STARTED,
        gameId: null,
        lookedUpAt: AFTER_THE_JOB_STARTED,
        igdbMatchStatus: "UNMATCHED",
      });
      await actions.seedImportedGame({
        createdAt: LONG_AGO,
        gameId: null,
        lookedUpAt: LONG_AGO,
        igdbMatchStatus: "IGNORED",
      });
      await actions.seedImportedGame({
        createdAt: LONG_AGO,
        gameId: null,
        lookedUpAt: LONG_AGO,
        deletedAt: LONG_AGO,
      });
      await actions.seedImportedGame({ createdAt: LONG_AGO, gameId: null });
    });

    it("counts as needing a match only the live, not-removed rows looked up without a game", async () => {
      await actions.finishWithOneChunk(jobId);

      expect((await elements.readJob(jobId)).needsMatch).toBe(2);
    });
  });

  describe("given a finished job", () => {
    it("keeps the counts it finished with when finalize is called again", async () => {
      const jobId = await elements.lookingUpJob(1);
      await actions.seedImportedGame({
        createdAt: AFTER_THE_JOB_STARTED,
        gameId: null,
      });
      await actions.finishWithOneChunk(jobId);
      await actions.seedImportedGame({
        createdAt: AFTER_THE_JOB_STARTED,
        gameId: null,
      });

      await finalizeImportJobIfComplete(jobId);

      expect((await elements.readJob(jobId)).newGames).toBe(1);
    });
  });
});

describe("recordGatherPlan summary counts", () => {
  describe("given a gather with no chunks", () => {
    let jobId: string;

    beforeEach(async () => {
      jobId = await elements.gatheringJobStartedAt(JOB_STARTED_AT);
      const knownBefore = await createGame(db.prisma, {});
      await actions.seedImportedGame({
        createdAt: LONG_AGO,
        gameId: knownBefore.id,
      });
      await actions.seedImportedGame({
        createdAt: AFTER_THE_JOB_STARTED,
        gameId: null,
        lookedUpAt: AFTER_THE_JOB_STARTED,
      });
      await actions.seedImportedGame({
        createdAt: AFTER_THE_JOB_STARTED,
        gameId: null,
      });
      await recordGatherPlan(jobId, {
        totalToLookUp: 0,
        lookedUp: 0,
        refreshedGames: 1,
        totalChunks: 0,
      });
    });

    it("finishes the job with the new and needs-a-match counts", async () => {
      expect(await elements.readJob(jobId)).toMatchObject({
        status: "FINISHED",
        newGames: 2,
        needsMatch: 1,
        refreshedGames: 1,
      });
    });
  });

  describe("given a gather with chunks to look up", () => {
    it("leaves the new and needs-a-match counts for the end of the job", async () => {
      const jobId = await elements.gatheringJobStartedAt(JOB_STARTED_AT);
      await actions.seedImportedGame({
        createdAt: AFTER_THE_JOB_STARTED,
        gameId: null,
        lookedUpAt: AFTER_THE_JOB_STARTED,
      });

      await recordGatherPlan(jobId, {
        totalToLookUp: 10,
        lookedUp: 0,
        refreshedGames: 0,
        totalChunks: 1,
      });

      expect(await elements.readJob(jobId)).toMatchObject({
        status: "LOOKING_UP",
        newGames: 0,
        needsMatch: 0,
      });
    });
  });
});

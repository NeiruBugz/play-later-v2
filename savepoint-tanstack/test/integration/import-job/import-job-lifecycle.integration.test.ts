import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { claimGather } from "@/entities/import-job/api/claim-gather.server";
import { createImportJob } from "@/entities/import-job/api/create-import-job.server";
import { failImportJob } from "@/entities/import-job/api/fail-import-job.server";
import { finalizeImportJobIfComplete } from "@/entities/import-job/api/finalize-import-job-if-complete.server";
import { recordGatherPlan } from "@/entities/import-job/api/record-gather-plan.server";

import { createUser } from "../../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("import-job-lifecycle");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

const LONG_AGO = new Date("2024-01-01T00:00:00.000Z");

let userId: string;

beforeEach(async () => {
  await db.prisma.importJob.deleteMany();
  await db.prisma.user.deleteMany();
  userId = (await createUser(db.prisma)).id;
});

const elements = {
  queuedJob: async () => {
    const job = await createImportJob(userId, {
      storefront: "STEAM",
      addAllToLibrary: false,
      storefrontAccountId: "76561198012345678",
    });
    return job!.id;
  },
  gatheringJob: async () => {
    const jobId = await elements.queuedJob();
    await claimGather(jobId);
    return jobId;
  },
  lookingUpJob: async (totalChunks: number) => {
    const jobId = await elements.gatheringJob();
    await recordGatherPlan(jobId, {
      totalToLookUp: totalChunks * 10,
      lookedUp: 0,
      refreshedGames: 0,
      totalChunks,
    });
    return jobId;
  },
  ageHeartbeat: (jobId: string) =>
    db.prisma
      .$executeRaw`UPDATE "ImportJob" SET "updatedAt" = ${LONG_AGO} WHERE "id" = ${jobId}`,
  markChunksDone: (jobId: string, chunkIndexes: number[]) =>
    db.prisma.importJob.update({
      where: { id: jobId },
      data: { doneChunkIndexes: chunkIndexes },
    }),
  readJob: (jobId: string) =>
    db.prisma.importJob.findUniqueOrThrow({ where: { id: jobId } }),
};

describe("claimGather", () => {
  describe("given a QUEUED job", () => {
    it("moves it to GATHERING and returns it", async () => {
      const jobId = await elements.queuedJob();

      const claimed = await claimGather(jobId);

      expect(claimed).toMatchObject({ id: jobId, status: "GATHERING" });
      expect((await elements.readJob(jobId)).status).toBe("GATHERING");
    });

    it("bumps the heartbeat", async () => {
      const jobId = await elements.queuedJob();
      await elements.ageHeartbeat(jobId);

      await claimGather(jobId);

      expect(
        (await elements.readJob(jobId)).updatedAt.getTime()
      ).toBeGreaterThan(LONG_AGO.getTime());
    });
  });

  describe("given a GATHERING job (redelivery)", () => {
    it("claims it again", async () => {
      const jobId = await elements.gatheringJob();

      expect(await claimGather(jobId)).toMatchObject({ status: "GATHERING" });
    });
  });

  describe.each(["LOOKING_UP", "FINISHED", "FAILED"] as const)(
    "given a %s job",
    (status) => {
      it("returns null and changes nothing", async () => {
        const jobId = await elements.queuedJob();
        await db.prisma.importJob.update({
          where: { id: jobId },
          data: {
            status,
            finishedAt:
              status === "FINISHED" || status === "FAILED" ? new Date() : null,
          },
        });
        await elements.ageHeartbeat(jobId);

        expect(await claimGather(jobId)).toBeNull();

        const after = await elements.readJob(jobId);
        expect(after.status).toBe(status);
        expect(after.updatedAt.getTime()).toBe(LONG_AGO.getTime());
      });
    }
  );

  describe("given an unknown job id", () => {
    it("returns null", async () => {
      expect(await claimGather("missing-job")).toBeNull();
    });
  });
});

describe("recordGatherPlan", () => {
  describe("given a GATHERING job and a plan with chunks", () => {
    it("stores the plan and moves the job to LOOKING_UP in one step", async () => {
      const jobId = await elements.gatheringJob();

      const planned = await recordGatherPlan(jobId, {
        totalToLookUp: 450,
        lookedUp: 30,
        refreshedGames: 12,
        totalChunks: 3,
      });

      expect(planned).toMatchObject({
        id: jobId,
        status: "LOOKING_UP",
        totalToLookUp: 450,
        lookedUp: 30,
        refreshedGames: 12,
        totalChunks: 3,
        finishedAt: null,
      });
    });

    it("bumps the heartbeat", async () => {
      const jobId = await elements.gatheringJob();
      await elements.ageHeartbeat(jobId);

      await recordGatherPlan(jobId, {
        totalToLookUp: 10,
        lookedUp: 0,
        refreshedGames: 0,
        totalChunks: 1,
      });

      expect(
        (await elements.readJob(jobId)).updatedAt.getTime()
      ).toBeGreaterThan(LONG_AGO.getTime());
    });
  });

  describe("given a plan with no chunks", () => {
    it("finishes the job in the same step", async () => {
      const jobId = await elements.gatheringJob();

      const planned = await recordGatherPlan(jobId, {
        totalToLookUp: 0,
        lookedUp: 0,
        refreshedGames: 5,
        totalChunks: 0,
      });

      expect(planned).toMatchObject({
        status: "FINISHED",
        refreshedGames: 5,
        finishedAt: expect.any(Date),
      });
    });
  });

  describe("given a job that is not GATHERING", () => {
    it.each(["queued", "looking-up"] as const)(
      "ignores a plan for a %s job",
      async (state) => {
        const jobId =
          state === "queued"
            ? await elements.queuedJob()
            : await elements.lookingUpJob(1);

        const planned = await recordGatherPlan(jobId, {
          totalToLookUp: 99,
          lookedUp: 0,
          refreshedGames: 0,
          totalChunks: 1,
        });

        expect(planned).toBeNull();
        expect((await elements.readJob(jobId)).totalToLookUp).not.toBe(99);
      }
    );
  });
});

describe("failImportJob", () => {
  describe.each(["QUEUED", "GATHERING", "LOOKING_UP"] as const)(
    "given a %s job",
    (status) => {
      it("marks it FAILED with the code and a finish time", async () => {
        const jobId = await elements.queuedJob();
        await db.prisma.importJob.update({
          where: { id: jobId },
          data: { status },
        });

        const failed = await failImportJob(jobId, "PROFILE_PRIVATE");

        expect(failed).toMatchObject({
          id: jobId,
          status: "FAILED",
          failureCode: "PROFILE_PRIVATE",
          finishedAt: expect.any(Date),
        });
      });
    }
  );

  describe("given a terminal job", () => {
    it("leaves a FINISHED job untouched and returns null", async () => {
      const jobId = await elements.gatheringJob();
      await recordGatherPlan(jobId, {
        totalToLookUp: 0,
        lookedUp: 0,
        refreshedGames: 0,
        totalChunks: 0,
      });

      expect(await failImportJob(jobId, "UNKNOWN")).toBeNull();

      const after = await elements.readJob(jobId);
      expect(after.status).toBe("FINISHED");
      expect(after.failureCode).toBeNull();
    });

    it("keeps the first failure code when failed twice", async () => {
      const jobId = await elements.gatheringJob();
      await failImportJob(jobId, "RATE_LIMITED");

      expect(await failImportJob(jobId, "UNKNOWN")).toBeNull();

      expect((await elements.readJob(jobId)).failureCode).toBe("RATE_LIMITED");
    });
  });

  it("bumps the heartbeat", async () => {
    const jobId = await elements.gatheringJob();
    await elements.ageHeartbeat(jobId);

    await failImportJob(jobId, "STEAM_UNAVAILABLE");

    expect((await elements.readJob(jobId)).updatedAt.getTime()).toBeGreaterThan(
      LONG_AGO.getTime()
    );
  });
});

describe("finalizeImportJobIfComplete", () => {
  describe("given every chunk is done", () => {
    it("finishes the job and sets finishedAt", async () => {
      const jobId = await elements.lookingUpJob(2);
      await elements.markChunksDone(jobId, [1, 0]);

      const finished = await finalizeImportJobIfComplete(jobId);

      expect(finished).toMatchObject({
        id: jobId,
        status: "FINISHED",
        finishedAt: expect.any(Date),
      });
    });
  });

  describe("given a GATHERING job with no chunks to look up", () => {
    it("finishes it immediately", async () => {
      const jobId = await elements.gatheringJob();

      const finished = await finalizeImportJobIfComplete(jobId);

      expect(finished?.status).toBe("FINISHED");
    });
  });

  describe("given a QUEUED job", () => {
    it("does not finish it", async () => {
      const jobId = await elements.queuedJob();

      expect(await finalizeImportJobIfComplete(jobId)).toBeNull();
      expect((await elements.readJob(jobId)).status).toBe("QUEUED");
    });
  });

  describe("given chunks still outstanding", () => {
    it("returns null and leaves the job LOOKING_UP", async () => {
      const jobId = await elements.lookingUpJob(3);
      await elements.markChunksDone(jobId, [0, 2]);

      expect(await finalizeImportJobIfComplete(jobId)).toBeNull();
      expect((await elements.readJob(jobId)).status).toBe("LOOKING_UP");
    });
  });

  describe("given an already finished job", () => {
    it("is a no-op that keeps the original finish time", async () => {
      const jobId = await elements.lookingUpJob(1);
      await elements.markChunksDone(jobId, [0]);
      const first = await finalizeImportJobIfComplete(jobId);

      const second = await finalizeImportJobIfComplete(jobId);

      expect(second).toBeNull();
      expect((await elements.readJob(jobId)).finishedAt).toEqual(
        first!.finishedAt
      );
    });
  });

  describe("given a FAILED job", () => {
    it("stays FAILED", async () => {
      const jobId = await elements.gatheringJob();
      await failImportJob(jobId, "UNKNOWN");

      expect(await finalizeImportJobIfComplete(jobId)).toBeNull();
      expect((await elements.readJob(jobId)).status).toBe("FAILED");
    });
  });
});

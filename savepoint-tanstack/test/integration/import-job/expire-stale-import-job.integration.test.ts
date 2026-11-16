/**
 * RED integration tests for spec 030 Slice 5: stuck syncs expire lazily.
 *
 * CONTRACT (paths are under src/)
 *
 *   entities/import-job/api/expire-stale-import-job.server.ts
 *     expireStaleImportJob(userId: string, storefront: Storefront): Promise<void>-like
 *     (the return value is not pinned)
 *     - an ACTIVE job (QUEUED | GATHERING | LOOKING_UP) of that user + storefront
 *       whose "updatedAt" is older than 30 minutes by the DATABASE clock becomes
 *       status FAILED, failureCode STALLED, finishedAt set
 *     - a younger active job, a terminal (FINISHED | FAILED) job, another
 *       user's job and another storefront's job are left untouched
 *
 *   entities/import-job/api/get-latest-import-job.server.ts
 *     getLatestImportJob expires first, then reads: it returns the stuck job as
 *     FAILED/STALLED.
 *
 *   entities/import-job/api/create-import-job.server.ts
 *     createImportJob expires first, then inserts: a user whose only active job
 *     is stuck gets a new QUEUED job (not `null`); a user whose active job is
 *     only 29 minutes old still gets `null`.
 *
 * Staleness is produced by rewriting "updatedAt" in SQL (`now() - interval`),
 * so no fake timers are involved.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createImportJob } from "@/entities/import-job/api/create-import-job.server";
import { expireStaleImportJob } from "@/entities/import-job/api/expire-stale-import-job.server";
import { getLatestImportJob } from "@/entities/import-job/api/get-latest-import-job.server";

import { createUser } from "../../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("import-job-expire-stale");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

const STEAM_ID_64 = "76561198012345678";
const STALE_MINUTES = 31;
const FRESH_MINUTES = 29;

type JobStatus = "QUEUED" | "GATHERING" | "LOOKING_UP" | "FINISHED" | "FAILED";

let userId: string;
let otherUserId: string;

const elements = {
  readJob: (jobId: string) =>
    db.prisma.importJob.findUniqueOrThrow({ where: { id: jobId } }),
};

const actions = {
  seedJob: async (options: {
    idleMinutes: number;
    status?: JobStatus;
    forUserId?: string;
    storefront?: "STEAM" | "XBOX";
  }) => {
    const {
      idleMinutes,
      status = "GATHERING",
      forUserId = userId,
      storefront = "STEAM",
    } = options;
    const job = await db.prisma.importJob.create({
      data: {
        userId: forUserId,
        storefront,
        storefrontAccountId: STEAM_ID_64,
        status,
        ...(status === "FINISHED" || status === "FAILED"
          ? { finishedAt: new Date("2024-01-01T00:00:00.000Z") }
          : {}),
      },
    });
    await db.prisma.$executeRaw`
      UPDATE "ImportJob"
      SET "updatedAt" = now() - make_interval(mins => ${idleMinutes})
      WHERE "id" = ${job.id}
    `;
    return job.id;
  },
  createJob: () =>
    createImportJob(userId, {
      storefront: "STEAM",
      addAllToLibrary: false,
      storefrontAccountId: STEAM_ID_64,
    }),
};

beforeEach(async () => {
  await db.prisma.importJob.deleteMany();
  await db.prisma.user.deleteMany();
  userId = (await createUser(db.prisma)).id;
  otherUserId = (await createUser(db.prisma)).id;
});

describe("expireStaleImportJob", () => {
  describe.each(["QUEUED", "GATHERING", "LOOKING_UP"] as const)(
    "given a %s job idle for 31 minutes",
    (status) => {
      let jobId: string;

      beforeEach(async () => {
        jobId = await actions.seedJob({ idleMinutes: STALE_MINUTES, status });
        await expireStaleImportJob(userId, "STEAM");
      });

      it("fails it as STALLED", async () => {
        const job = await elements.readJob(jobId);

        expect(job.status).toBe("FAILED");
        expect(job.failureCode).toBe("STALLED");
      });

      it("gives it a finish time", async () => {
        expect((await elements.readJob(jobId)).finishedAt).not.toBeNull();
      });
    }
  );

  describe("given a job idle for 29 minutes", () => {
    it("leaves it running", async () => {
      const jobId = await actions.seedJob({ idleMinutes: FRESH_MINUTES });

      await expireStaleImportJob(userId, "STEAM");

      expect(await elements.readJob(jobId)).toMatchObject({
        status: "GATHERING",
        failureCode: null,
        finishedAt: null,
      });
    });
  });

  describe.each(["FINISHED", "FAILED"] as const)(
    "given a %s job idle for 31 minutes",
    (status) => {
      it("leaves it as it was", async () => {
        const jobId = await actions.seedJob({
          idleMinutes: STALE_MINUTES,
          status,
        });
        const before = await elements.readJob(jobId);

        await expireStaleImportJob(userId, "STEAM");

        expect(await elements.readJob(jobId)).toEqual(before);
      });
    }
  );

  describe("given stuck jobs of another user and of another storefront", () => {
    it("leaves them untouched", async () => {
      const otherUsers = await actions.seedJob({
        idleMinutes: STALE_MINUTES,
        forUserId: otherUserId,
      });
      const otherStorefront = await actions.seedJob({
        idleMinutes: STALE_MINUTES,
        storefront: "XBOX",
      });

      await expireStaleImportJob(userId, "STEAM");

      expect((await elements.readJob(otherUsers)).status).toBe("GATHERING");
      expect((await elements.readJob(otherStorefront)).status).toBe(
        "GATHERING"
      );
    });
  });
});

describe("getLatestImportJob", () => {
  describe("given the latest job has been idle for 31 minutes", () => {
    it("returns it as failed with STALLED", async () => {
      const jobId = await actions.seedJob({ idleMinutes: STALE_MINUTES });

      expect(await getLatestImportJob(userId, "STEAM")).toMatchObject({
        id: jobId,
        status: "FAILED",
        failureCode: "STALLED",
      });
    });
  });

  describe("given the latest job has been idle for 29 minutes", () => {
    it("returns it still running", async () => {
      const jobId = await actions.seedJob({ idleMinutes: FRESH_MINUTES });

      expect(await getLatestImportJob(userId, "STEAM")).toMatchObject({
        id: jobId,
        status: "GATHERING",
      });
    });
  });
});

describe("createImportJob", () => {
  describe("given the user's only active job has been idle for 31 minutes", () => {
    let stuckJobId: string;
    let created: Awaited<ReturnType<typeof actions.createJob>>;

    beforeEach(async () => {
      stuckJobId = await actions.seedJob({ idleMinutes: STALE_MINUTES });
      created = await actions.createJob();
    });

    it("creates a new queued job", () => {
      expect(created).toMatchObject({ status: "QUEUED" });
      expect(created?.id).not.toBe(stuckJobId);
    });

    it("fails the stuck job as STALLED", async () => {
      expect(await elements.readJob(stuckJobId)).toMatchObject({
        status: "FAILED",
        failureCode: "STALLED",
      });
    });
  });

  describe("given the user's active job has been idle for 29 minutes", () => {
    it("creates nothing", async () => {
      const runningJobId = await actions.seedJob({
        idleMinutes: FRESH_MINUTES,
      });

      expect(await actions.createJob()).toBeNull();
      expect((await elements.readJob(runningJobId)).status).toBe("GATHERING");
    });
  });
});

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { claimGather } from "@/entities/import-job/api/claim-gather.server";
import { createImportJob } from "@/entities/import-job/api/create-import-job.server";
import { recordChunkDone } from "@/entities/import-job/api/record-chunk-done.server";
import { recordGatherPlan } from "@/entities/import-job/api/record-gather-plan.server";

import { createUser } from "../../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("record-chunk-done");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

const LONG_AGO = new Date("2024-01-01T00:00:00.000Z");

let userId: string;

const elements = {
  lookingUpJob: async (totalChunks: number) => {
    const job = await createImportJob(userId, {
      storefront: "STEAM",
      addAllToLibrary: false,
      storefrontAccountId: "76561198012345678",
    });
    await claimGather(job!.id);
    await recordGatherPlan(job!.id, {
      totalToLookUp: totalChunks * 10,
      lookedUp: 5,
      refreshedGames: 0,
      totalChunks,
    });
    return job!.id;
  },
  readJob: (jobId: string) =>
    db.prisma.importJob.findUniqueOrThrow({ where: { id: jobId } }),
};

beforeEach(async () => {
  await db.prisma.importJob.deleteMany();
  await db.prisma.user.deleteMany();
  userId = (await createUser(db.prisma)).id;
});

describe("recordChunkDone", () => {
  describe("given a LOOKING_UP job and a chunk not yet recorded", () => {
    it("marks the chunk, adds the counters and reports progress", async () => {
      const jobId = await elements.lookingUpJob(3);

      const result = await recordChunkDone(jobId, 1, {
        lookupCount: 10,
        added: 4,
      });

      expect(result).toEqual({ applied: true, done: 1, total: 3 });
      expect(await elements.readJob(jobId)).toMatchObject({
        doneChunkIndexes: [1],
        lookedUp: 15,
        addedToLibrary: 4,
      });
    });

    it("bumps the heartbeat", async () => {
      const jobId = await elements.lookingUpJob(2);
      await db.prisma
        .$executeRaw`UPDATE "ImportJob" SET "updatedAt" = ${LONG_AGO} WHERE "id" = ${jobId}`;

      await recordChunkDone(jobId, 0, { lookupCount: 10, added: 0 });

      expect(
        (await elements.readJob(jobId)).updatedAt.getTime()
      ).toBeGreaterThan(LONG_AGO.getTime());
    });
  });

  describe("given the same chunk delivered twice", () => {
    it("counts it once", async () => {
      const jobId = await elements.lookingUpJob(2);
      await recordChunkDone(jobId, 0, { lookupCount: 10, added: 2 });

      const second = await recordChunkDone(jobId, 0, {
        lookupCount: 10,
        added: 2,
      });

      expect(second).toEqual({ applied: false, done: 1, total: 2 });
      expect(await elements.readJob(jobId)).toMatchObject({
        doneChunkIndexes: [0],
        lookedUp: 15,
        addedToLibrary: 2,
      });
    });
  });

  describe("given the same chunk delivered concurrently", () => {
    it("applies exactly one of the deliveries", async () => {
      const jobId = await elements.lookingUpJob(2);

      const results = await Promise.all(
        [1, 2, 3, 4].map(() =>
          recordChunkDone(jobId, 0, { lookupCount: 10, added: 1 })
        )
      );

      expect(results.filter((r) => r.applied)).toHaveLength(1);
      expect((await elements.readJob(jobId)).lookedUp).toBe(15);
    });
  });

  describe.each(["GATHERING", "FINISHED", "FAILED"] as const)(
    "given a %s job",
    (status) => {
      it("changes nothing and reports not applied", async () => {
        const jobId = await elements.lookingUpJob(2);
        await db.prisma.importJob.update({
          where: { id: jobId },
          data: {
            status,
            finishedAt: status === "GATHERING" ? null : new Date(),
          },
        });

        const result = await recordChunkDone(jobId, 0, {
          lookupCount: 10,
          added: 1,
        });

        expect(result.applied).toBe(false);
        expect(await elements.readJob(jobId)).toMatchObject({
          doneChunkIndexes: [],
          lookedUp: 5,
          addedToLibrary: 0,
        });
      });
    }
  );

  describe("given an unknown job id", () => {
    it("reports not applied with no progress", async () => {
      expect(
        await recordChunkDone("missing-job", 0, { lookupCount: 1, added: 0 })
      ).toEqual({ applied: false, done: 0, total: 0 });
    });
  });
});

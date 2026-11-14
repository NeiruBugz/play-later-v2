import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createImportJob } from "@/entities/import-job/api/create-import-job.server";
import { getActiveImportJob } from "@/entities/import-job/api/get-active-import-job.server";
import { getLatestImportJob } from "@/entities/import-job/api/get-latest-import-job.server";

import { createUser } from "../../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("import-job-create-read");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

const STEAM_ID_64 = "76561198012345678";

let userId: string;
let otherUserId: string;

beforeEach(async () => {
  await db.prisma.importJob.deleteMany();
  await db.prisma.user.deleteMany();
  userId = (await createUser(db.prisma)).id;
  otherUserId = (await createUser(db.prisma)).id;
});

const elements = {
  startSteamJob: (forUserId = userId, addAllToLibrary = false) =>
    createImportJob(forUserId, {
      storefront: "STEAM",
      addAllToLibrary,
      storefrontAccountId: STEAM_ID_64,
    }),
  markFinished: (jobId: string) =>
    db.prisma.importJob.update({
      where: { id: jobId },
      data: { status: "FINISHED", finishedAt: new Date() },
    }),
};

describe("createImportJob", () => {
  describe("given no active job", () => {
    it("creates a QUEUED job carrying the account snapshot and the add-all choice", async () => {
      const job = await elements.startSteamJob(userId, true);

      expect(job).toMatchObject({
        userId,
        storefront: "STEAM",
        status: "QUEUED",
        addAllToLibrary: true,
        storefrontAccountId: STEAM_ID_64,
        totalToLookUp: 0,
        lookedUp: 0,
        totalChunks: 0,
        doneChunkIndexes: [],
        finishedAt: null,
        failureCode: null,
      });
      expect(job?.id).toEqual(expect.any(String));
      expect(job?.createdAt).toBeInstanceOf(Date);
    });
  });

  describe("given an active job for the same user and storefront", () => {
    it.each(["QUEUED", "GATHERING", "LOOKING_UP"] as const)(
      "returns null without creating a second job while %s",
      async (activeStatus) => {
        const first = await elements.startSteamJob();
        await db.prisma.importJob.update({
          where: { id: first!.id },
          data: { status: activeStatus },
        });

        const second = await elements.startSteamJob();

        expect(second).toBeNull();
        expect(await db.prisma.importJob.count({ where: { userId } })).toBe(1);
      }
    );
  });

  describe("given the earlier job is terminal", () => {
    it("creates a new job", async () => {
      const first = await elements.startSteamJob();
      await elements.markFinished(first!.id);

      const second = await elements.startSteamJob();

      expect(second?.id).not.toBe(first!.id);
      expect(second?.status).toBe("QUEUED");
    });
  });

  describe("given another user has an active job", () => {
    it("creates this user's job independently", async () => {
      await elements.startSteamJob(otherUserId);

      const job = await elements.startSteamJob(userId);

      expect(job).not.toBeNull();
    });
  });

  describe("given two concurrent starts", () => {
    it("creates exactly one job and returns null for the loser", async () => {
      const results = await Promise.all([
        elements.startSteamJob(),
        elements.startSteamJob(),
      ]);

      expect(results.filter((job) => job !== null)).toHaveLength(1);
      expect(await db.prisma.importJob.count({ where: { userId } })).toBe(1);
    });
  });
});

describe("getActiveImportJob", () => {
  describe("given a QUEUED job", () => {
    it("returns it", async () => {
      const job = await elements.startSteamJob();

      const active = await getActiveImportJob(userId, "STEAM");

      expect(active?.id).toBe(job!.id);
    });
  });

  describe("given only a terminal job", () => {
    it("returns null", async () => {
      const job = await elements.startSteamJob();
      await elements.markFinished(job!.id);

      expect(await getActiveImportJob(userId, "STEAM")).toBeNull();
    });
  });

  describe("given an active job for another storefront", () => {
    it("returns null", async () => {
      await elements.startSteamJob();

      expect(await getActiveImportJob(userId, "XBOX")).toBeNull();
    });
  });
});

describe("getLatestImportJob", () => {
  describe("given no jobs", () => {
    it("returns null", async () => {
      expect(await getLatestImportJob(userId, "STEAM")).toBeNull();
    });
  });

  describe("given an older finished job and a newer active one", () => {
    it("returns the newest by creation time", async () => {
      const older = await elements.startSteamJob();
      await db.prisma.importJob.update({
        where: { id: older!.id },
        data: {
          status: "FINISHED",
          finishedAt: new Date(),
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
        },
      });
      const newer = await elements.startSteamJob();

      const latest = await getLatestImportJob(userId, "STEAM");

      expect(latest?.id).toBe(newer!.id);
    });
  });

  describe("given another user's job", () => {
    it("does not return it", async () => {
      await elements.startSteamJob(otherUserId);

      expect(await getLatestImportJob(userId, "STEAM")).toBeNull();
    });
  });
});

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { markSyncNoticeSeen } from "@/entities/import-job/api/mark-sync-notice-seen.server";
import { NotFoundError } from "@/shared/lib/errors";

import { createUser } from "../../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("mark-sync-notice-seen");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

const MINUTE_MS = 60 * 1000;
const SEEN_EARLIER = new Date("2025-06-01T12:00:00.000Z");

let aliceId: string;
let bobId: string;

const elements = {
  noticeSeenAt: async (jobId: string) =>
    (
      await db.prisma.importJob.findUniqueOrThrow({
        where: { id: jobId },
      })
    ).noticeSeenAt,
};

const actions = {
  seedJob: async (
    userId: string,
    {
      status,
      minutesAgo,
      noticeSeenAt = null,
      storefront = "STEAM",
    }: {
      status: "FINISHED" | "FAILED" | "LOOKING_UP";
      minutesAgo: number;
      noticeSeenAt?: Date | null;
      storefront?: "STEAM" | "XBOX";
    }
  ) => {
    const createdAt = new Date(Date.now() - minutesAgo * MINUTE_MS);
    const finished = status === "FINISHED" || status === "FAILED";
    return (
      await db.prisma.importJob.create({
        data: {
          userId,
          storefront,
          status,
          storefrontAccountId: "76561198012345678",
          createdAt,
          finishedAt: finished ? createdAt : null,
          noticeSeenAt,
        },
      })
    ).id;
  },
};

beforeEach(async () => {
  await db.prisma.importJob.deleteMany();
  await db.prisma.user.deleteMany();
  aliceId = (await createUser(db.prisma)).id;
  bobId = (await createUser(db.prisma)).id;
});

describe("markSyncNoticeSeen", () => {
  describe("given three unseen finished or failed jobs", () => {
    let oldestId: string;
    let middleId: string;
    let newestId: string;

    beforeEach(async () => {
      oldestId = await actions.seedJob(aliceId, {
        status: "FINISHED",
        minutesAgo: 180,
      });
      middleId = await actions.seedJob(aliceId, {
        status: "FAILED",
        minutesAgo: 120,
      });
      newestId = await actions.seedJob(aliceId, {
        status: "FINISHED",
        minutesAgo: 60,
      });
    });

    it("marks the newest and every older job seen", async () => {
      await markSyncNoticeSeen(aliceId, newestId);

      expect(await elements.noticeSeenAt(newestId)).not.toBeNull();
      expect(await elements.noticeSeenAt(middleId)).not.toBeNull();
      expect(await elements.noticeSeenAt(oldestId)).not.toBeNull();
    });

    it("leaves a newer job unseen when an older one is marked", async () => {
      await markSyncNoticeSeen(aliceId, middleId);

      expect(await elements.noticeSeenAt(middleId)).not.toBeNull();
      expect(await elements.noticeSeenAt(oldestId)).not.toBeNull();
      expect(await elements.noticeSeenAt(newestId)).toBeNull();
    });

    it("resolves with no value", async () => {
      await expect(
        markSyncNoticeSeen(aliceId, newestId)
      ).resolves.toBeUndefined();
    });
  });

  describe("given an older job that was already seen", () => {
    it("keeps the moment it was first seen", async () => {
      const seenId = await actions.seedJob(aliceId, {
        status: "FINISHED",
        minutesAgo: 180,
        noticeSeenAt: SEEN_EARLIER,
      });
      const newestId = await actions.seedJob(aliceId, {
        status: "FINISHED",
        minutesAgo: 60,
      });

      await markSyncNoticeSeen(aliceId, newestId);

      expect(await elements.noticeSeenAt(seenId)).toEqual(SEEN_EARLIER);
    });
  });

  describe("given the marked job was already seen", () => {
    it("keeps its original timestamp and does not throw", async () => {
      const seenId = await actions.seedJob(aliceId, {
        status: "FINISHED",
        minutesAgo: 60,
        noticeSeenAt: SEEN_EARLIER,
      });

      await markSyncNoticeSeen(aliceId, seenId);

      expect(await elements.noticeSeenAt(seenId)).toEqual(SEEN_EARLIER);
    });
  });

  describe("given an older job that is still running", () => {
    it("does not mark the running job seen", async () => {
      const runningId = await actions.seedJob(aliceId, {
        status: "LOOKING_UP",
        minutesAgo: 180,
      });
      const newestId = await actions.seedJob(aliceId, {
        status: "FINISHED",
        minutesAgo: 60,
      });

      await markSyncNoticeSeen(aliceId, newestId);

      expect(await elements.noticeSeenAt(runningId)).toBeNull();
    });
  });

  describe("given jobs of another user or another storefront", () => {
    it("marks only the caller's job for that storefront", async () => {
      const bobOlderId = await actions.seedJob(bobId, {
        status: "FINISHED",
        minutesAgo: 240,
      });
      const aliceXboxId = await actions.seedJob(aliceId, {
        status: "FINISHED",
        minutesAgo: 200,
        storefront: "XBOX",
      });
      const aliceJobId = await actions.seedJob(aliceId, {
        status: "FINISHED",
        minutesAgo: 60,
      });

      await markSyncNoticeSeen(aliceId, aliceJobId);

      expect(await elements.noticeSeenAt(aliceJobId)).not.toBeNull();
      expect(await elements.noticeSeenAt(bobOlderId)).toBeNull();
      expect(await elements.noticeSeenAt(aliceXboxId)).toBeNull();
    });
  });

  describe("given a job that is another user's", () => {
    let bobJobId: string;
    let bobOlderJobId: string;

    beforeEach(async () => {
      bobOlderJobId = await actions.seedJob(bobId, {
        status: "FINISHED",
        minutesAgo: 120,
      });
      bobJobId = await actions.seedJob(bobId, {
        status: "FINISHED",
        minutesAgo: 60,
      });
    });

    it("throws NotFound", async () => {
      await expect(
        markSyncNoticeSeen(aliceId, bobJobId)
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("writes nothing", async () => {
      await markSyncNoticeSeen(aliceId, bobJobId).catch(() => undefined);

      expect(await elements.noticeSeenAt(bobJobId)).toBeNull();
      expect(await elements.noticeSeenAt(bobOlderJobId)).toBeNull();
    });
  });

  describe("given a job id that does not exist", () => {
    it("throws NotFound", async () => {
      await expect(
        markSyncNoticeSeen(aliceId, "no-such-job")
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});

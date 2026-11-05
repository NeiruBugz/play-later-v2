import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getPublicProfilePageDataWorker } from "@/features/profile-overview/api/get-public-profile-page-data.worker";
import { NotFoundError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("public-profile-page-data");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

function makeUser(suffix: string, opts: { isPublicProfile?: boolean } = {}) {
  return {
    id: `ppd-user-${suffix}`,
    email: `ppd-${suffix}@example.com`,
    name: `PPD User ${suffix}`,
    username: `ppd-${suffix}`,
    usernameNormalized: `ppd-${suffix}`,
    emailVerified: true,
    isPublicProfile: opts.isPublicProfile ?? true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

beforeEach(async () => {
  await db.prisma.follow.deleteMany();
  await db.prisma.user.deleteMany();
  await db.prisma.user.create({ data: makeUser("owner") });
  await db.prisma.user.create({ data: makeUser("other") });
  await db.prisma.user.create({
    data: makeUser("hidden", { isPublicProfile: false }),
  });
});

describe("getPublicProfilePageDataWorker", () => {
  describe("given an anonymous viewer", () => {
    it("returns viewerId null and no activity", async () => {
      const result = await getPublicProfilePageDataWorker(undefined, {
        username: "ppd-owner",
      });

      expect(result.viewerId).toBeNull();
      expect(result.activity).toBeNull();
      expect(result.isFollowing).toBeNull();
    });
  });

  describe("given the owner views their own profile", () => {
    it("returns the viewer id and the follow-graph feed", async () => {
      const result = await getPublicProfilePageDataWorker("ppd-user-owner", {
        username: "ppd-owner",
      });

      expect(result.viewerId).toBe("ppd-user-owner");
      expect(result.activity).toMatchObject({ items: [] });
    });
  });

  describe("given a signed-in viewer on someone else's profile", () => {
    it("returns the per-user activity stream and the follow flag", async () => {
      await db.prisma.follow.create({
        data: { followerId: "ppd-user-other", followingId: "ppd-user-owner" },
      });

      const result = await getPublicProfilePageDataWorker("ppd-user-other", {
        username: "ppd-owner",
      });

      expect(result.viewerId).toBe("ppd-user-other");
      expect(result.activity).toMatchObject({ items: [] });
      expect(result.isFollowing).toBe(true);
      expect(result.followerCount).toBe(1);
    });
  });

  describe("given a private profile and a non-owner viewer", () => {
    it("throws NotFoundError before reading anything else", async () => {
      await expect(
        getPublicProfilePageDataWorker("ppd-user-other", {
          username: "ppd-hidden",
        })
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});

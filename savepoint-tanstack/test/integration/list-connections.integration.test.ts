import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { listConnectionsWorker } from "@/features/social-discovery/api/list-connections.worker";
import { NotFoundError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("list-connections");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

function makeUser(suffix: string, opts: { isPublicProfile?: boolean } = {}) {
  return {
    id: `lc-user-${suffix}`,
    email: `lc-${suffix}@example.com`,
    name: `LC User ${suffix}`,
    username: `lc-${suffix}`,
    usernameNormalized: `lc-${suffix}`,
    emailVerified: true,
    isPublicProfile: opts.isPublicProfile ?? true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

beforeEach(async () => {
  await db.prisma.follow.deleteMany();
  await db.prisma.user.deleteMany();

  await db.prisma.user.create({ data: makeUser("bob") });
  await db.prisma.user.create({ data: makeUser("alice") });
  await db.prisma.user.create({ data: makeUser("carol") });
  await db.prisma.user.create({
    data: makeUser("private-dan", { isPublicProfile: false }),
  });

  // alice + carol + private-dan follow bob; bob follows alice.
  await db.prisma.follow.createMany({
    data: [
      { followerId: "lc-user-alice", followingId: "lc-user-bob" },
      { followerId: "lc-user-carol", followingId: "lc-user-bob" },
      { followerId: "lc-user-private-dan", followingId: "lc-user-bob" },
      { followerId: "lc-user-bob", followingId: "lc-user-alice" },
    ],
  });
});

describe("listConnectionsWorker", () => {
  describe("given kind = followers", () => {
    it("returns the profile and its public followers in one call", async () => {
      const result = await listConnectionsWorker(undefined, {
        username: "lc-bob",
        kind: "followers",
      });

      expect(result.profile.id).toBe("lc-user-bob");
      expect(result.entries.map((e) => e.id).sort()).toEqual([
        "lc-user-alice",
        "lc-user-carol",
      ]);
      expect(result.total).toBe(2);
    });
  });

  describe("given kind = following", () => {
    it("returns the profile and the public accounts it follows", async () => {
      const result = await listConnectionsWorker(undefined, {
        username: "lc-bob",
        kind: "following",
      });

      expect(result.profile.id).toBe("lc-user-bob");
      expect(result.entries.map((e) => e.id)).toEqual(["lc-user-alice"]);
      expect(result.total).toBe(1);
    });
  });

  describe("given the username does not exist", () => {
    it("throws NotFoundError", async () => {
      await expect(
        listConnectionsWorker(undefined, {
          username: "ghost",
          kind: "followers",
        })
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("given a private profile", () => {
    it("throws NotFoundError for an anonymous viewer", async () => {
      await expect(
        listConnectionsWorker(undefined, {
          username: "lc-private-dan",
          kind: "followers",
        })
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("throws NotFoundError for another signed-in viewer", async () => {
      await expect(
        listConnectionsWorker("lc-user-alice", {
          username: "lc-private-dan",
          kind: "following",
        })
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("resolves for the owner", async () => {
      const result = await listConnectionsWorker("lc-user-private-dan", {
        username: "lc-private-dan",
        kind: "following",
      });

      expect(result.profile.id).toBe("lc-user-private-dan");
    });
  });
});

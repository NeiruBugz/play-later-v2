import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  getProfileById,
  getProfileByUsername,
} from "@/entities/profile/api/get-profile.server";
import { NotFoundError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-profile");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await db.prisma.user.deleteMany();
});

describe("profile entity reads", () => {
  describe("given a user exists with a known id", () => {
    const userId = "slice3-test-user-id-001";

    beforeEach(async () => {
      await db.prisma.user.create({
        data: {
          id: userId,
          email: "slice3-by-id@example.com",
          name: "Slice Three User",
          emailVerified: true,
          username: "slice3-by-id-user",
          usernameNormalized: "slice3-by-id-user",
          image: null,
          isPublicProfile: false,
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
      });
    });

    it("getProfileById returns the user record", async () => {
      const profile = await getProfileById(userId);

      expect(profile.id).toBe(userId);
      expect(profile.name).toBe("Slice Three User");
      expect(profile.username).toBe("slice3-by-id-user");
      expect(profile.image).toBeNull();
      expect(profile.isPublicProfile).toBe(false);
    });
  });

  describe("given no user exists with the given id", () => {
    it("getProfileById throws NotFoundError", async () => {
      await expect(getProfileById("missing-user-id")).rejects.toBeInstanceOf(
        NotFoundError
      );
    });
  });

  describe("given a user exists with a known username", () => {
    const username = "slice3-test-user";

    beforeEach(async () => {
      await db.prisma.user.create({
        data: {
          id: "slice3-test-user-id-002",
          email: "slice3-by-username@example.com",
          name: "Slice Three Username User",
          emailVerified: true,
          username: username,
          usernameNormalized: username,
          image: null,
          isPublicProfile: true,
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
      });
    });

    it("getProfileByUsername returns the user record", async () => {
      const profile = await getProfileByUsername(username);

      expect(profile.id).toBe("slice3-test-user-id-002");
      expect(profile.name).toBe("Slice Three Username User");
      expect(profile.username).toBe(username);
      expect(profile.image).toBeNull();
      expect(profile.isPublicProfile).toBe(true);
    });
  });

  describe("given no user exists with the given username", () => {
    it("getProfileByUsername throws NotFoundError", async () => {
      await expect(
        getProfileByUsername("nonexistent-username")
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});

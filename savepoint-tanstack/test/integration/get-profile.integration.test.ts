import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getProfileById } from "@/entities/profile/api/get-profile.server";
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
});

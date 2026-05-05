import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { updateProfile } from "@/entities/profile/api/update-profile.server";
import { ConflictError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("update-profile-concurrent");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await db.prisma.user.deleteMany();
});

describe("updateProfile concurrent uniqueness", () => {
  describe("given two users update to the same username at once", () => {
    const userAId = "concurrent-user-a";
    const userBId = "concurrent-user-b";
    const targetUsername = "shared-target-username";

    beforeEach(async () => {
      await db.prisma.user.createMany({
        data: [
          {
            id: userAId,
            email: "concurrent-a@example.com",
            name: "Concurrent A",
            emailVerified: true,
            username: "original-a",
            usernameNormalized: "original-a",
            image: null,
            isPublicProfile: false,
            createdAt: new Date("2024-01-01T00:00:00.000Z"),
            updatedAt: new Date("2024-01-01T00:00:00.000Z"),
          },
          {
            id: userBId,
            email: "concurrent-b@example.com",
            name: "Concurrent B",
            emailVerified: true,
            username: "original-b",
            usernameNormalized: "original-b",
            image: null,
            isPublicProfile: false,
            createdAt: new Date("2024-01-01T00:00:00.000Z"),
            updatedAt: new Date("2024-01-01T00:00:00.000Z"),
          },
        ],
      });
    });

    it("resolves exactly one update; the other rejects with ConflictError", async () => {
      const results = await Promise.allSettled([
        updateProfile(userAId, { username: targetUsername }),
        updateProfile(userBId, { username: targetUsername }),
      ]);

      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const rejected = results.filter((r) => r.status === "rejected");

      expect(fulfilled).toHaveLength(1);
      expect(rejected).toHaveLength(1);

      const rejection = rejected[0] as PromiseRejectedResult;
      expect(rejection.reason).toBeInstanceOf(ConflictError);
    });
  });
});

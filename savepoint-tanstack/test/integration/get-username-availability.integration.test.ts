/**
 * Integration tests for getUsernameAvailability (UX-hint query).
 *
 * Covers:
 *   - Returns true when no user holds the normalized username
 *   - Returns false when another user holds the same username (normalized)
 *   - Normalization: uppercase input matches lowercase stored username
 *   - Trimming: input with surrounding whitespace matches stored username
 *   - excludeUserId branch: returns true when the only holder is the excluded user
 *   - excludeUserId branch: returns false when a different user holds it
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getUsernameAvailability } from "@/entities/profile/api/get-username-availability.server";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-username-availability");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await db.prisma.user.deleteMany();
});

function makeUser(suffix: string, username: string) {
  return {
    id: `gua-user-${suffix}`,
    email: `gua-${suffix}@example.com`,
    name: `GUA User ${suffix}`,
    username,
    usernameNormalized: username.toLowerCase().trim(),
    emailVerified: true,
    isPublicProfile: true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

describe("getUsernameAvailability", () => {
  describe("given no user holds the queried username", () => {
    it("returns true (username is available)", async () => {
      const available = await getUsernameAvailability("newuser");

      expect(available).toBe(true);
    });
  });

  describe("given another user holds the same normalized username", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("existing", "takenuser") });
    });

    it("returns false (username is taken)", async () => {
      const available = await getUsernameAvailability("takenuser");

      expect(available).toBe(false);
    });
  });

  describe("normalization — uppercase input matches lowercase stored value", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("lower", "lowercase") });
    });

    it("returns false when queried with uppercase variant", async () => {
      const available = await getUsernameAvailability("LOWERCASE");

      expect(available).toBe(false);
    });
  });

  describe("normalization — trimming whitespace in input", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("trim", "trimmed") });
    });

    it("returns false when queried with surrounding spaces", async () => {
      const available = await getUsernameAvailability("  trimmed  ");

      expect(available).toBe(false);
    });
  });

  describe("excludeUserId branch", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("owner", "ownedname") });
    });

    it("returns true when the only holder is the excluded user (self-check)", async () => {
      const available = await getUsernameAvailability(
        "ownedname",
        "gua-user-owner"
      );

      expect(available).toBe(true);
    });

    it("returns false when a different user holds the username even with excludeUserId", async () => {
      await db.prisma.user.create({ data: makeUser("other", "sharedname") });
      await db.prisma.user.create({
        data: makeUser("excluded-user", "someotherusername"),
      });

      const available = await getUsernameAvailability(
        "sharedname",
        "gua-user-excluded-user"
      );

      expect(available).toBe(false);
    });
  });
});

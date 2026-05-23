import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getProfileSetupStatus } from "@/entities/profile/api/get-profile-setup-status.server";
import { NotFoundError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-profile-setup-status");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await db.prisma.user.deleteMany();
});

describe("profile setup-status read", () => {
  describe("given a freshly-created user with no username", () => {
    const userId = "setup-status-no-username-001";

    beforeEach(async () => {
      await db.prisma.user.create({
        data: {
          id: userId,
          email: "setup-no-username@example.com",
          name: "Ada Lovelace",
          emailVerified: true,
          username: null,
          usernameNormalized: null,
          image: null,
          isPublicProfile: false,
          // createdAt defaults to now() — within the new-user threshold.
        },
      });
    });

    it("reports needsSetup true", async () => {
      const status = await getProfileSetupStatus(userId);

      expect(status.needsSetup).toBe(true);
    });

    it("derives the suggested username by slugifying the display name", async () => {
      const status = await getProfileSetupStatus(userId);

      expect(status.suggestedUsername).toBe("adalovelace");
    });
  });

  describe("given a long-standing user who has completed setup", () => {
    const userId = "setup-status-completed-001";

    beforeEach(async () => {
      await db.prisma.user.create({
        data: {
          id: userId,
          email: "setup-completed@example.com",
          name: "Grace Hopper",
          emailVerified: true,
          username: "grace",
          usernameNormalized: "grace",
          image: null,
          isPublicProfile: true,
          profileSetupCompletedAt: new Date("2024-01-01T00:00:00.000Z"),
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
      });
    });

    it("reports needsSetup false", async () => {
      const status = await getProfileSetupStatus(userId);

      expect(status.needsSetup).toBe(false);
    });

    it("does not suggest a username", async () => {
      const status = await getProfileSetupStatus(userId);

      expect(status.suggestedUsername).toBeUndefined();
    });
  });

  describe("given an established user with a username but no completion timestamp", () => {
    const userId = "setup-status-established-001";

    beforeEach(async () => {
      await db.prisma.user.create({
        data: {
          id: userId,
          email: "setup-established@example.com",
          name: "Alan Turing",
          emailVerified: true,
          username: "turing",
          usernameNormalized: "turing",
          image: null,
          isPublicProfile: false,
          profileSetupCompletedAt: null,
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
      });
    });

    it("reports needsSetup false once the user is past the new-user window", async () => {
      const status = await getProfileSetupStatus(userId);

      expect(status.needsSetup).toBe(false);
    });
  });

  describe("given no user exists with the given id", () => {
    it("throws NotFoundError", async () => {
      await expect(
        getProfileSetupStatus("missing-user-id")
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });
});

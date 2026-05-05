import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getPublicProfile } from "@/entities/profile/api/get-public-profile.server";
import { NotFoundError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-public-profile");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await db.prisma.user.deleteMany();
});

describe("getPublicProfile (privacy invariant)", () => {
  describe("given a user exists with isPublicProfile=true", () => {
    const username = "public-user";

    beforeEach(async () => {
      await db.prisma.user.create({
        data: {
          id: "public-user-id-001",
          email: "public-user@example.com",
          name: "Public User",
          emailVerified: true,
          username,
          usernameNormalized: username,
          image: null,
          isPublicProfile: true,
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
      });
    });

    it("returns the profile", async () => {
      const profile = await getPublicProfile(username);

      expect(profile.username).toBe(username);
      expect(profile.isPublicProfile).toBe(true);
    });
  });

  describe("given a user exists with isPublicProfile=false", () => {
    const username = "private-user";

    beforeEach(async () => {
      await db.prisma.user.create({
        data: {
          id: "private-user-id-001",
          email: "private-user@example.com",
          name: "Private User",
          emailVerified: true,
          username,
          usernameNormalized: username,
          image: null,
          isPublicProfile: false,
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
      });
    });

    it("throws NotFoundError (callers cannot distinguish from missing)", async () => {
      await expect(getPublicProfile(username)).rejects.toBeInstanceOf(
        NotFoundError
      );
    });
  });

  describe("given no user exists with the given username", () => {
    it("throws NotFoundError", async () => {
      await expect(getPublicProfile("does-not-exist")).rejects.toBeInstanceOf(
        NotFoundError
      );
    });
  });
});

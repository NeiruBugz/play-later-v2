import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { updateProfileWorker } from "@/features/edit-profile/api/update-profile.worker";
import { ConflictError, UnauthorizedError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

// Integration tests call the worker directly with an explicit userId, rather
// than going through `updateProfileFn` (which requires the TanStack Start
// server runtime under @tanstack/react-start@>=1.168). See
// savepoint-tanstack/CLAUDE.md foot-gun #8.

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("update-profile");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await db.prisma.user.deleteMany();
});

describe("updateProfileWorker", () => {
  describe("given an authenticated user with a valid update payload", () => {
    const userId = "update-profile-user-001";

    beforeEach(async () => {
      await db.prisma.user.create({
        data: {
          id: userId,
          email: "update-profile-happy@example.com",
          name: "Original Name",
          emailVerified: true,
          username: "originaluser",
          usernameNormalized: "originaluser",
          image: null,
          isPublicProfile: false,
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
      });

      await updateProfileWorker(userId, {
        username: "newuser",
        isPublicProfile: true,
      });
    });

    it("persists the new fields on the user record", async () => {
      const updated = await db.prisma.user.findUnique({
        where: { id: userId },
      });

      expect(updated?.username).toBe("newuser");
      expect(updated?.isPublicProfile).toBe(true);
    });
  });

  describe("given an authenticated user submitting invalid input", () => {
    const userId = "update-profile-user-002";

    beforeEach(async () => {
      await db.prisma.user.create({
        data: {
          id: userId,
          email: "update-profile-invalid@example.com",
          name: "Validation Test User",
          emailVerified: true,
          username: "validationuser",
          usernameNormalized: "validationuser",
          image: null,
          isPublicProfile: false,
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
      });
    });

    it("rejects with ZodError when username is too short", async () => {
      await expect(
        updateProfileWorker(userId, { username: "ab" })
      ).rejects.toBeInstanceOf(ZodError);
    });

    it("rejects with ZodError when username is empty", async () => {
      await expect(
        updateProfileWorker(userId, { username: "" })
      ).rejects.toBeInstanceOf(ZodError);
    });
  });

  describe("given a username that another user already has", () => {
    const userAId = "update-profile-user-003";
    const userBId = "update-profile-user-004";

    beforeEach(async () => {
      await db.prisma.user.createMany({
        data: [
          {
            id: userAId,
            email: "update-profile-user-a@example.com",
            name: "User A",
            emailVerified: true,
            username: "useraname",
            usernameNormalized: "useraname",
            image: null,
            isPublicProfile: false,
            createdAt: new Date("2024-01-01T00:00:00.000Z"),
            updatedAt: new Date("2024-01-01T00:00:00.000Z"),
          },
          {
            id: userBId,
            email: "update-profile-user-b@example.com",
            name: "User B",
            emailVerified: true,
            username: "userbname",
            usernameNormalized: "userbname",
            image: null,
            isPublicProfile: false,
            createdAt: new Date("2024-01-01T00:00:00.000Z"),
            updatedAt: new Date("2024-01-01T00:00:00.000Z"),
          },
        ],
      });
    });

    it("rejects with ConflictError", async () => {
      await expect(
        updateProfileWorker(userAId, { username: "userbname" })
      ).rejects.toBeInstanceOf(ConflictError);
    });
  });

  describe("given an unauthenticated request", () => {
    it("rejects with UnauthorizedError", async () => {
      await expect(
        updateProfileWorker(undefined, { username: "anyusername" })
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });

  describe("given a non-existent userId (P2025 path)", () => {
    it("rejects with NotFoundError when the user does not exist", async () => {
      const { NotFoundError } = await import("@/shared/lib/errors");
      await expect(
        updateProfileWorker("nonexistent-user-id-xyz", { name: "Ghost" })
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("given an authenticated user updating only the name field", () => {
    const userId = "update-profile-name-only-001";

    beforeEach(async () => {
      await db.prisma.user.create({
        data: {
          id: userId,
          email: "name-only-update@example.com",
          name: "Old Name",
          emailVerified: true,
          username: "nameonly001",
          usernameNormalized: "nameonly001",
          image: null,
          isPublicProfile: false,
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
      });
    });

    it("updates only the name field without touching username", async () => {
      await updateProfileWorker(userId, { name: "New Name" });
      const updated = await db.prisma.user.findUnique({
        where: { id: userId },
      });
      expect(updated?.name).toBe("New Name");
      expect(updated?.username).toBe("nameonly001");
    });
  });

  describe("given an authenticated user updating only the image field", () => {
    const userId = "update-profile-image-only-001";

    beforeEach(async () => {
      await db.prisma.user.create({
        data: {
          id: userId,
          email: "image-only-update@example.com",
          name: "Image User",
          emailVerified: true,
          username: "imgonly001",
          usernameNormalized: "imgonly001",
          image: null,
          isPublicProfile: false,
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
      });
    });

    it("sets the image url on the user record", async () => {
      const imageUrl = "https://example.com/avatar.jpg";
      await updateProfileWorker(userId, { image: imageUrl });
      const updated = await db.prisma.user.findUnique({
        where: { id: userId },
      });
      expect(updated?.image).toBe(imageUrl);
    });
  });
});
